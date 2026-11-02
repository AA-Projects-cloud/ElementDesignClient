import React from 'react';

/** The business logo, shown in high resolution so it stays sharp on every screen. */
export const BrandLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <img
    src="/brand/logo-hd.png"
    alt="Element Design"
    width={size}
    height={size}
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 4,
      display: 'block',
      objectFit: 'cover',
    }}
  />
);
