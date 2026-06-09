import React from 'react';

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="36" fill="#eb7a2e" />
      <path d="M 50 54 L 50 28 L 68 28 C 76 28 80 34 82 40 L 87 54 C 88.5 56 88.5 57 85 57 L 75 57 C 73 57 72 60 72 63 L 72 73 C 72 78 68 82 63 82 L 37 82 C 32 82 28 78 28 73 L 28 37 C 28 32 32 28 37 28 L 42 28" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 38 43 A 12 12 0 1 0 62 43" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
