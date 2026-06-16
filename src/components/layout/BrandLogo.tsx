import React from 'react';
import { cn } from "@/lib/utils";

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden flex items-center justify-center", className)}>
      <img 
        src="https://i.ibb.co/d4jx3NkL/Logo-mau-tim-CV-Nguyen-H-ng-Th-i.png" 
        alt="Power Service Logo"
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          target.src = "/input_file_0.png";
          target.onerror = () => {
            // Last resort: SVG representation matching the uploaded design
            target.parentElement!.innerHTML = `
              <div class="w-full h-full bg-[#eb7a2e] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 100 100" class="w-[70%] h-[70%] text-white" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round">
                  <path d="M 50 25 L 50 50 M 50 25 A 25 25 0 1 0 75 50 C 75 40 85 45 85 60 C 85 75 75 70 75 80" />
                </svg>
              </div>
            `;
          };
        }}
      />
    </div>
  );
}

