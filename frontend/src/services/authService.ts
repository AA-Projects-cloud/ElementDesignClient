import { localDb } from './mockDb';
import { clientsService } from './clientsService';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export type AuthRole = 'admin' | 'client';

export interface AuthUser {
  id: string;
  role: AuthRole;
  name: string;
  email: string;
  clientId?: string; // set for client users: the only customer record they may view
}

// Admin sign-up and admin sign-in need a security code. The real code is checked ONLY by the
// database (Supabase), so it never appears in this website's code. Here we just make sure
// something was typed; without Supabase (local demo mode) any non-empty code is accepted.
const hasKey = (key?: string) => Boolean(key && key.trim());

// ===========================================================================
// Supabase mode (real accounts)
// ===========================================================================
const loadSupabaseUser = async (): Promise<AuthUser | null> => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, name, email')
    .eq('id', session.user.id)
    .maybeSingle();
  if (!profile) return null;

  if (profile.role === 'client') {
    const { data: client } = await supabase
      .from('clients')
      .select('id, status')
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (!client || client.status === 'suspended') return null;
    return { id: profile.id, role: 'client', name: profile.name, email: profile.email || '', clientId: client.id };
  }

  return { id: profile.id, role: 'admin', name: profile.name, email: profile.email || '' };
};

const friendlyAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Incorrect email or password.';
  if (m.includes('already registered')) return 'An account with this email already exists. Please sign in.';
  if (m.includes('database error saving new user')) return 'Could not create the account. Check the details and the security key.';
  if (m.includes('email not confirmed')) return 'Please confirm your email address first (check your inbox), then sign in.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a few minutes and try again.';
  return message;
};

// ===========================================================================
// Local mode (no Supabase configured) — accounts stored in this browser only
// ===========================================================================
interface StoredUser extends AuthUser {
  passwordHash: string;
  salt: string;
}

const USERS_KEY = 'element_design_auth_users_v1';
const SESSION_KEY = 'element_design_auth_session_v1';

const readUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const input = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `fb-${h >>> 0}`;
};

const toPublic = (u: StoredUser): AuthUser => ({
  id: u.id,
  role: u.role,
  name: u.name,
  email: u.email,
  clientId: u.clientId,
});

const persistSession = (user: AuthUser) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

// ===========================================================================
// Login attempt limit: 5 wrong tries, then the account is blocked for 1 hour.
// With Supabase the counter lives in the database (login_attempts table); without it,
// in this browser. If the database function is not installed yet, login still works.
// ===========================================================================
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_SECONDS = 60 * 60;

interface LimitStatus {
  locked: boolean;
  attemptsLeft: number;
  retryAfterSeconds: number;
}

/** A wrong password / wrong security key (counts towards the limit). */
class CredentialError extends Error {}

/** Thrown to the sign-in screen with the attempt information for the pop-up. */
export class LoginError extends Error {
  attemptsLeft?: number;
  locked: boolean;
  retryAfterSeconds?: number;
  constructor(message: string, status?: LimitStatus | null) {
    super(message);
    this.attemptsLeft = status?.attemptsLeft;
    this.locked = Boolean(status?.locked);
    this.retryAfterSeconds = status?.retryAfterSeconds;
  }
}

const ATTEMPTS_KEY = 'element_design_login_attempts_v1';

interface LocalAttempt {
  count: number;
  lockedUntil?: number;
  lastFailedAt?: number;
}

const readAttempts = (): Record<string, LocalAttempt> => {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
  } catch {
    return {};
  }
};

const toStatus = (a?: LocalAttempt): LimitStatus => {
  const now = Date.now();
  if (a?.lockedUntil && a.lockedUntil > now) {
    return { locked: true, attemptsLeft: 0, retryAfterSeconds: Math.ceil((a.lockedUntil - now) / 1000) };
  }
  return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - (a?.count ?? 0), retryAfterSeconds: 0 };
};

const fromRpc = (d: any): LimitStatus | null =>
  d && typeof d === 'object'
    ? {
        locked: Boolean(d.locked),
        attemptsLeft: Number(d.attempts_left ?? 0),
        retryAfterSeconds: Number(d.retry_after_seconds ?? 0),
      }
    : null;

const limiter = {
  async status(email: string): Promise<LimitStatus | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('login_status', { p_email: email });
        return error ? null : fromRpc(data);
      } catch {
        return null;
      }
    }
    const all = readAttempts();
    const a = all[email];
    if (a?.lockedUntil && a.lockedUntil <= Date.now()) {
      delete all[email];
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
      return toStatus();
    }
    return toStatus(a);
  },

  async failed(email: string): Promise<LimitStatus | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('login_failed', { p_email: email });
        return error ? null : fromRpc(data);
      } catch {
        return null;
      }
    }
    const all = readAttempts();
    const now = Date.now();
    let a = all[email] || { count: 0 };
    if (a.lockedUntil && a.lockedUntil > now) return toStatus(a);
    if (a.lastFailedAt && now - a.lastFailedAt > LOGIN_LOCK_SECONDS * 1000) a = { count: 0 };
    a.count += 1;
    a.lastFailedAt = now;
    if (a.count >= MAX_LOGIN_ATTEMPTS) a.lockedUntil = now + LOGIN_LOCK_SECONDS * 1000;
    all[email] = a;
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
    return toStatus(a);
  },

  async succeeded(email: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('login_succeeded');
      } catch {
        /* never block a successful login */
      }
      return;
    }
    const all = readAttempts();
    delete all[email];
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
  },
};

// ===========================================================================
export const authService = {
  /** Local mode only: synchronous restore. */
  getSession(): AuthUser | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as AuthUser;
      if (user.role === 'client') {
        const client = localDb.get().clients.find((c) => c.id === user.clientId);
        if (!client || client.status === 'suspended') return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  /** Supabase mode: restore the signed-in user (if any). */
  restoreSession(): Promise<AuthUser | null> {
    return loadSupabaseUser();
  },

  async logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      return;
    }
    localStorage.removeItem(SESSION_KEY);
  },

  /** Returns the new user, or null when the email still has to be confirmed. */
  async signUp(data: {
    role: AuthRole;
    name: string;
    email: string;
    phone?: string;
    password: string;
    securityKey?: string;
  }): Promise<AuthUser | null> {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (!name || !email || !data.password) throw new Error('Please fill in all required fields.');
    if (data.password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (data.role === 'client' && (data.phone || '').replace(/\D/g, '').length < 10) {
      throw new Error('Please enter a valid mobile number (at least 10 digits).');
    }
    if (data.role === 'admin' && !hasKey(data.securityKey)) {
      throw new Error('Invalid security key. Admin accounts require a valid security code.');
    }

    if (isSupabaseConfigured) {
      const { data: res, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            name,
            phone: data.phone?.trim() || '',
            security_key: data.role === 'admin' ? (data.securityKey || '').trim() : undefined,
          },
        },
      });
      if (error) {
        if (data.role === 'admin' && /database error/i.test(error.message)) {
          throw new Error('Invalid security key. Admin accounts require a valid security code.');
        }
        throw new Error(friendlyAuthError(error.message));
      }
      // Supabase hides duplicate emails: an empty identities list means the address is taken.
      if (res.user && res.user.identities && res.user.identities.length === 0) {
        throw new Error('An account with this email already exists. Please sign in.');
      }
      if (!res.session) return null; // email confirmation required
      const user = await loadSupabaseUser();
      if (!user) throw new Error('Account created, but the profile could not be loaded. Please sign in.');
      return user;
    }

    const users = readUsers();
    const seeded = localDb.get().clients.some((c) => c.email.toLowerCase() === email);
    if (users.some((u) => u.email === email) || seeded) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const salt = Math.random().toString(36).slice(2);
    const user: StoredUser = {
      id: `u-${Date.now()}`,
      role: data.role,
      name,
      email,
      passwordHash: await hashPassword(data.password, salt),
      salt,
    };

    if (data.role === 'client') {
      const { client } = await clientsService.createClient({
        name,
        phone: data.phone?.trim() || '',
        email,
        projectTitle: `${name} Project`,
        typology: 'To be assigned',
        areaSqFt: 0,
        leadArchitect: 'To be assigned',
      });
      user.clientId = client.id;
    }

    users.push(user);
    writeUsers(users);
    const session = toPublic(user);
    persistSession(session);
    return session;
  },

  /** Sign in with the 5-attempt / 1-hour lock-out. */
  async login(data: {
    role: AuthRole;
    identifier: string;
    password: string;
    securityKey?: string;
  }): Promise<AuthUser> {
    const id = data.identifier.trim().toLowerCase();

    const before = await limiter.status(id);
    if (before?.locked) {
      const mins = Math.max(1, Math.ceil(before.retryAfterSeconds / 60));
      throw new LoginError(
        `Too many failed attempts. For your safety, sign-in is blocked. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`,
        before
      );
    }

    try {
      const user = await this.attemptLogin(data);
      await limiter.succeeded(id);
      return user;
    } catch (err) {
      if (err instanceof CredentialError) {
        const after = await limiter.failed(id);
        throw new LoginError(err.message, after);
      }
      throw err;
    }
  },

  async attemptLogin(data: {
    role: AuthRole;
    identifier: string;
    password: string;
    securityKey?: string;
  }): Promise<AuthUser> {
    const id = data.identifier.trim().toLowerCase();

    if (data.role === 'admin' && !hasKey(data.securityKey)) {
      throw new Error('Invalid security key. Admin access requires a valid security code.');
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email: id, password: data.password });
      if (error) {
        if (/invalid login/i.test(error.message)) throw new CredentialError('Incorrect email or password.');
        throw new Error(friendlyAuthError(error.message));
      }

      const user = await loadSupabaseUser();
      if (!user || user.role !== data.role) {
        await supabase.auth.signOut();
        throw new Error(
          data.role === 'admin'
            ? 'This account is not an admin account.'
            : 'This account is not a customer account. Use the Admin tab.'
        );
      }
      if (data.role === 'admin') {
        const { data: ok, error: keyError } = await supabase.rpc('check_admin_key', {
          p_key: (data.securityKey || '').trim(),
        });
        if (keyError) {
          await supabase.auth.signOut();
          throw new Error(`Could not verify the security key (${keyError.message}). Please try again.`);
        }
        if (!ok) {
          await supabase.auth.signOut();
          throw new CredentialError('Invalid security key. Admin access requires a valid security code.');
        }
      }
      return user;
    }

    const user = readUsers().find((u) => u.role === data.role && u.email === id);
    if (user) {
      const hash = await hashPassword(data.password, user.salt);
      if (hash !== user.passwordHash) throw new CredentialError('Incorrect email or password.');
      const session = toPublic(user);
      persistSession(session);
      return session;
    }

    if (data.role === 'client') {
      const client = localDb
        .get()
        .clients.find((c) => c.portalId.toLowerCase() === id || c.email.toLowerCase() === id);
      if (client && client.security.pin === data.password) {
        if (client.status === 'suspended') throw new Error('This account has been suspended.');
        const session: AuthUser = {
          id: `client-${client.id}`,
          role: 'client',
          name: client.name,
          email: client.email,
          clientId: client.id,
        };
        persistSession(session);
        return session;
      }
    }

    throw new CredentialError('Incorrect email or password.');
  },
};
