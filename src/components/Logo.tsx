import React from 'react';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Hexagon approximation with SVGs or CSS */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-brand-orange">
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
        </svg>
        <span className="relative font-bold text-white text-lg tracking-tighter">IN</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-lg text-brand-black">In Marketing</span>
        <span className="font-bold text-lg text-brand-black">We Trust</span>
      </div>
    </div>
  );
}
