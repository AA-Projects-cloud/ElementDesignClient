import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A password-style input with an eye button that shows / hides what was typed
export const SecretInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{ width: '100%', paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide' : 'Show'}
        title={visible ? 'Hide' : 'Show'}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          display: 'flex',
          color: 'var(--ink-secondary)',
        }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
