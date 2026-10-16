'use client';

import React from 'react';

export type GlowState = 'idle' | 'listening' | 'reasoning' | 'complete' | 'error';

interface AmbientGlowProps {
  state?: GlowState;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({ state = 'idle' }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[2px] pointer-events-none z-40 overflow-hidden">
      <div
        className={`w-full h-full transition-colors duration-300 ${
          state === 'error'
            ? 'bg-[#C53030]'
            : state === 'complete'
            ? 'bg-[#10B981]'
            : state === 'reasoning'
            ? 'bg-[#183D33] animate-pulse'
            : state === 'listening'
            ? 'bg-[#1D5A4A]'
            : 'bg-[#E5E0D6]'
        }`}
      />
    </div>
  );
};
