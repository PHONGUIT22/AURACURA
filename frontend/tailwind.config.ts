import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/screens/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
      },
      fontFamily: {
        sans: ["'Google Sans'", "'Google Sans Text'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'Menlo', 'monospace'],
      },
      colors: {
        canvas: '#070709', // Dark Luxury Obsidian Base
        obsidian: {
          950: '#070709', // Primary Obsidian ground
          900: '#0D0E12', // Surface card base
          850: '#111319', // Elevated surface
          800: '#161820', // Border & secondary surface
          700: '#222530', // Divider & interactive surface
          600: '#2D313F', // Hover border
          500: '#3D4255',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Clinical Safety Primary Accent
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        champagne: {
          300: '#FEF3C7',
          400: '#FDE68A',
          500: '#D4AF37', // Bio-Harmonic Champagne Gold
          600: '#B38F46',
          700: '#997A15',
          800: '#78350F',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#FDE68A',
          dark: '#B38F46',
        },
        crimson: {
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      boxShadow: {
        'luxury-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'emerald-glow': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer-gold': 'shimmerGold 2.5s linear infinite',
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        shimmerGold: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;