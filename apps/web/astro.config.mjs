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
          manualChunks: (id) => {
            // Core React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // UI components library
            if (id.includes('@jasaweb/ui')) {
              return 'vendor-ui';
            }
            // Chart libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            // API client and related utilities
            if (id.includes('apiClient') || id.includes('apiConfig')) {
              return 'vendor-api';
            }
            // Node.js polyfills and utilities
            if (
              id.includes('node_modules') &&
              (id.includes('stream') ||
                id.includes('util') ||
                id.includes('buffer'))
            ) {
              return 'vendor-polyfills';
            }
            // Other third-party dependencies
            if (id.includes('node_modules')) {
              return 'vendor-other';
            }
          },
        },
      },
      // Increase chunk size warning limit for development
      chunkSizeWarningLimit: 1000,
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies for server builds
    ssr: {
      external: ['stream', 'util', 'buffer'],
    },
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
