import { create } from 'zustand';
import { authService, AuthUser } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { queryClient } from '../services/queryClient';
import { useUiStore } from './useUiStore';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

// Point the UI at the right workspace for the signed-in role.
const applyRole = (user: AuthUser | null) => {
  if (!user) return;
  if (user.role === 'client' && user.clientId) {
    useUiStore.setState({
      activeWorkspace: 'client',
      selectedClientId: user.clientId,
      isImpersonating: false,
    });
  } else {
    useUiStore.setState({ activeWorkspace: 'admin', isImpersonating: false, currentView: 'overview' });
  }
};

const initialUser = isSupabaseConfigured ? null : authService.getSession();
applyRole(initialUser);

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  loading: isSupabaseConfigured,
  setUser: (user) => {
    // Never show one person's cached data to the next person who signs in.
    queryClient.clear();
    applyRole(user);
    set({ user, loading: false });
  },
  logout: () => {
    void authService.logout();
    queryClient.clear();
    set({ user: null });
  },
}));

if (isSupabaseConfigured) {
  authService
    .restoreSession()
    .then((user) => {
      applyRole(user);
      useAuthStore.setState({ user, loading: false });
    })
    .catch(() => useAuthStore.setState({ user: null, loading: false }));

  // Signed out elsewhere (another tab, expired session): return to the login screen.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      queryClient.clear();
      useAuthStore.setState({ user: null, loading: false });
    }
  });
}
