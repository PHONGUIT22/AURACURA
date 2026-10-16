import React from 'react';

interface CuraVIPLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const CuraVIPLogo: React.FC<CuraVIPLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Luxury Geometric Crest SVG */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E4D40" />
            <stop offset="100%" stopColor="#0F2822" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6CA85" />
            <stop offset="100%" stopColor="#B38F46" />
          </linearGradient>
          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F2822" floodOpacity="0.15" />
          </filter>
        </defs>
        {/* Outer Shield Hexagon */}
        <polygon
          points="24,3 43,14 43,34 24,45 5,34 5,14"
          fill="url(#emeraldGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
          filter="url(#subtleGlow)"
        />
        {/* Inner Constellation Geometry (Representing Qloo Taste Graph) */}
        <line x1="24" y1="12" x2="14" y2="28" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
        <line x1="24" y1="12" x2="34" y2="28" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
        <line x1="14" y1="28" x2="34" y2="28" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />
        <line x1="24" y1="12" x2="24" y2="36" stroke="url(#goldGrad)" strokeWidth="1.2" strokeOpacity="0.8" />
        {/* Monogram 'C' and 'V' Interlocking Arch */}
        <path
          d="M 18,20 Q 24,15 30,20 Q 24,34 24,36"
          stroke="#FAF8F5"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Cultural Vector Node Anchors */}
        <circle cx="24" cy="12" r="2.5" fill="url(#goldGrad)" />
        <circle cx="14" cy="28" r="2" fill="url(#goldGrad)" />
        <circle cx="34" cy="28" r="2" fill="url(#goldGrad)" />
        <circle cx="24" cy="36" r="2.5" fill="#FAF8F5" />
      </svg>
      {/* Typography Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`font-serif font-bold tracking-[0.2em] text-[#161A18] ${currentSize.text} leading-none`}>
              CURA<span className="text-[#967432]">VIP</span>
            </span>
          </div>
          <span className={`tracking-[0.25em] uppercase font-semibold text-[#6B736D] ${currentSize.sub} mt-1`}>
            Cultural Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
