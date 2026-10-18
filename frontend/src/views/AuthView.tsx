import React, { useState } from 'react';
import { authService, AuthRole } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { LegalModal, LegalDoc } from '../components/LegalModal';

export const AuthView: React.FC = () => {
  const setUser = useAuthStore((s) => s.setUser);

  const [role, setRole] = useState<AuthRole>('client');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';
  const isAdmin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const user = isSignup
        ? await authService.signUp({ role, name, email: identifier, phone, password, securityKey })
        : await authService.login({ role, identifier, password, securityKey });
      if (user) {
        setUser(user);
      } else {
        setNotice('Account created. Check your email and confirm your address, then sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    fontFamily: 'var(--font-display)',
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    border: '1px solid var(--ink-primary)',
    background: active ? 'var(--ink-primary)' : 'var(--bg-primary)',
    color: active ? 'var(--ink-inverted)' : 'var(--ink-primary)',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface-1)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-primary)',
          border: '1px solid var(--ink-primary)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-modal)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div className="brand-symbol">E</div>
          <span className="brand-title" style={{ color: 'var(--ink-primary)' }}>ELEMENT DESIGN</span>
        </div>

        <span className="label-xs">{isSignup ? 'CREATE YOUR ACCOUNT' : 'SIGN IN TO CONTINUE'}</span>

        <div style={{ display: 'flex', margin: '12px 0 16px' }}>
          <button type="button" style={tabStyle(!isAdmin)} onClick={() => { setRole('client'); setError(''); }}>
            CUSTOMER
          </button>
          <button type="button" style={tabStyle(isAdmin)} onClick={() => { setRole('admin'); setError(''); }}>
            ADMIN
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {!isSignup && !isAdmin && !isSupabaseConfigured ? 'Email or Portal ID' : 'Email'}
            </label>
            <input
              className="form-input"
              type={!isSignup && !isAdmin && !isSupabaseConfigured ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          {isSignup && !isAdmin && (
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{!isSignup && !isAdmin && !isSupabaseConfigured ? 'Password or PIN' : 'Password'}</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Admin Security Key</label>
              <input
                className="form-input"
                type="password"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                required
              />
            </div>
          )}

          {notice && (
            <div
              style={{
                fontSize: 12,
                padding: '8px 10px',
                color: 'var(--ink-primary)',
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 12,
                padding: '8px 10px',
                color: 'var(--status-alert-ink)',
                background: 'var(--status-alert-bg)',
                border: '1px solid var(--status-alert-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
            {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--ink-secondary)' }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="btn btn-tertiary"
            style={{ fontSize: 12, padding: 0 }}
            onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 10.5, color: 'var(--ink-tertiary)' }}>
          <button
            type="button"
            className="btn btn-tertiary"
            style={{ fontSize: 10.5, padding: 0 }}
            onClick={() => setLegalDoc('terms')}
          >
            Terms &amp; Conditions
          </button>
          {' · '}
          <button
            type="button"
            className="btn btn-tertiary"
            style={{ fontSize: 10.5, padding: 0 }}
            onClick={() => setLegalDoc('privacy')}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
};
