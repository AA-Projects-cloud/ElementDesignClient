import React, { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { SecretInput } from '../components/SecretInput';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { queryClient } from '../services/queryClient';

/** Shown after someone opens the "reset your password" link from their email. */
export const ResetPasswordView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = () => {
    queryClient.clear();
    window.history.replaceState(null, '', window.location.pathname); // remove the link's code from the address
    useAuthStore.setState({ recovery: false, user: null, loading: false });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await authService.updatePassword(password);
      try {
        sessionStorage.setItem('ed_password_reset_ok', '1');
      } catch {
        /* optional */
      }
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    await authService.logout();
    finish();
  };

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
          <BrandLogo size={56} />
          <span className="brand-title" style={{ color: 'var(--ink-primary)' }}>ELEMENT DESIGN</span>
        </div>

        <span className="label-xs">CHOOSE A NEW PASSWORD</span>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <SecretInput value={password} onChange={setPassword} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <SecretInput value={confirm} onChange={setConfirm} />
          </div>

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
            {busy ? 'SAVING...' : 'SAVE NEW PASSWORD'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12 }}>
          <button type="button" className="btn btn-tertiary" style={{ fontSize: 12, padding: 0 }} onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
