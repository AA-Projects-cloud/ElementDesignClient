import React from 'react';
import { useUiStore } from '../store/useUiStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} color="#B8E0C5" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={16} color="#E8BDB4" />
          ) : (
            <Info size={16} color="#E8DED0" />
          )}

          <span style={{ flex: 1 }}>{toast.message}</span>

          {toast.undoAction && (
            <button
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: 'transparent',
                borderColor: '#FFF',
                color: '#FFF',
                padding: '2px 8px',
                fontSize: 10,
              }}
              onClick={() => {
                toast.undoAction!();
                removeToast(toast.id);
              }}
            >
              UNDO
            </button>
          )}

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
