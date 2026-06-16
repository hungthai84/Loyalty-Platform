import React from 'react';
import { cn } from "@/lib/utils";

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-white flex items-center justify-center border border-border", className)}>
      <img 
        src="https://i.ibb.co/d4jx3NkL/Logo-mau-tim-CV-Nguyen-H-ng-Th-i.png" 
        alt="Power Service Logo"
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

