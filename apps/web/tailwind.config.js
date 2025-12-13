/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
        },
      },
      animation: {
        'pulse-glow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'text-glow': 'text-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'text-glow': {
          '0%': { textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '100%': { textShadow: '0 0 30px rgba(99, 102, 241, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
