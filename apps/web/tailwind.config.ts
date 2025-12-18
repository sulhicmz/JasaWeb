import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Service color classes
    'service-blue',
    'service-green',
    'service-purple',
    'service-icon-blue',
    'service-icon-green',
    'service-icon-purple',

    // Team color classes
    'team-blue',
    'team-green',
    'team-purple',
    'team-red',
    'team-yellow',
    'team-pink',
    'team-indigo',
    'team-gray',

    // Glass panel variants
    'glass-panel',
    'glass-header',

    // Animation classes
    'animate-float',
    'animate-pulse-glow',

    // Text utilities
    'text-glow',
    'bg-glow',
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced color palette for dark theme
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateZ(0)' },
          '50%': { transform: 'translateY(-10px) translateZ(0)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '0.5',
            transform: 'scale(1) translateZ(0)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05) translateZ(0)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
