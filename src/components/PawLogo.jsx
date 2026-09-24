import React from 'react';

export default function PawLogo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {/* pads */}
      <ellipse cx="20" cy="22" rx="7" ry="8" fill="#FF6B6B" />
      <ellipse cx="44" cy="22" rx="7" ry="8" fill="#FF9F45" />
      <ellipse cx="11" cy="35" rx="6.5" ry="7.5" fill="#4FC3E8" />
      <ellipse cx="53" cy="35" rx="6.5" ry="7.5" fill="#6DD49E" />
      {/* main paw + pulse */}
      <path d="M32 30c-8 0-15 5-15 12 0 5 4 8 8 8 3 0 5-1.5 7-1.5s4 1.5 7 1.5c4 0 8-3 8-8 0-7-7-12-15-12z" fill="#FF6B6B" />
      <path d="M22 44l5-6 5 4 5-7 5 5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}