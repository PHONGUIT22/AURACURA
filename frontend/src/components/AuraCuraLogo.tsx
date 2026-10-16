'use client';

import React from 'react';

interface AuraCuraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const AuraCuraLogo: React.FC<AuraCuraLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-[8.5px]' },
    md: { icon: 38, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 50, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dark Luxury Bio-Harmonic Crest SVG */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="auraObsidianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#161820" />
            <stop offset="100%" stopColor="#070709" />
          </linearGradient>
          <linearGradient id="auraEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <linearGradient id="auraGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#997A15" />
          </linearGradient>
          <filter id="auraGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Shield Hexagon */}
        <polygon
          points="24,3 43,14 43,34 24,45 5,34 5,14"
          fill="url(#auraObsidianGrad)"
          stroke="url(#auraGoldGrad)"
          strokeWidth="1.5"
          filter="url(#auraGlow)"
        />

        {/* Bio-Harmonic Stratum Corneum Shield Arch */}
        <path
          d="M 14,20 C 14,14 34,14 34,20 C 34,28 24,36 24,38 C 24,36 14,28 14,20 Z"
          stroke="url(#auraEmeraldGrad)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />

        {/* Optical Wavelength Harmony Waves (Bio-Cancellation Vectors) */}
        <path
          d="M 12,24 Q 18,18 24,24 T 36,24"
          stroke="url(#auraGoldGrad)"
          strokeWidth="1.2"
          strokeOpacity="0.8"
          fill="none"
        />
        <path
          d="M 14,28 Q 20,33 24,28 T 34,28"
          stroke="url(#auraEmeraldGrad)"
          strokeWidth="1.2"
          strokeOpacity="0.75"
          fill="none"
        />

        {/* Central Core Diagnostic Node */}
        <circle cx="24" cy="24" r="3.2" fill="url(#auraEmeraldGrad)" />
        <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />

        {/* Couture Accent Prisms */}
        <circle cx="24" cy="8" r="1.8" fill="url(#auraGoldGrad)" />
        <circle cx="10" cy="16" r="1.5" fill="url(#auraGoldGrad)" />
        <circle cx="38" cy="16" r="1.5" fill="url(#auraGoldGrad)" />
        <circle cx="24" cy="40" r="1.8" fill="url(#auraGoldGrad)" />
      </svg>

      {/* Typography Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`font-serif font-bold tracking-[0.22em] text-[#F3F4F6] ${currentSize.text} leading-none`}>
              AURA<span className="text-[#D4AF37] font-semibold">CURA</span>
            </span>
          </div>
          <span className={`tracking-[0.24em] uppercase font-semibold text-[#10B981] ${currentSize.sub} mt-1 flex items-center gap-1`}>
            <span>Bio-Harmonic VTO</span>
            <span className="text-[#D4AF37]/80">·</span>
            <span className="text-[#9CA3AF]">Skin-Safe</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AuraCuraLogo;
