import React from 'react';

/** The business logo mark, shown in the same box the "E" used to occupy. */
export const BrandLogo: React.FC = () => (
  <div className="brand-symbol" style={{ backgroundColor: 'var(--ink-primary)', padding: 2, flexShrink: 0, boxSizing: 'border-box' }}>
    <img
      src="/brand/logo-mark.png"
      alt="Element Design"
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    />
  </div>
);
