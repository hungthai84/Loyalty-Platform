import React from 'react';

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="skewX(-15) translate(10, 0)">
        <rect 
          x="15" 
          y="30" 
          width="45" 
          height="18" 
          rx="9" 
          fill="#fbbf24" 
        />
        <rect 
          x="32" 
          y="52" 
          width="48" 
          height="18" 
          rx="9" 
          fill="#fa1b6c" 
        />
      </g>
    </svg>
  );
}
