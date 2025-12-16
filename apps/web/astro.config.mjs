import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    // Optimize image processing
    domains: ['localhost', 'jasaweb.id'],
    format: ['webp', 'avif', 'jpeg'],
    quality: 80,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.astro'],
    },
    // Optimize build performance
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@jasaweb/ui'],
            charts: ['chart.js', 'react-chartjs-2'],
          },
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  integrations: [react()],
  // Performance optimizations
  compressHTML: true,
  // Security headers
  security: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
