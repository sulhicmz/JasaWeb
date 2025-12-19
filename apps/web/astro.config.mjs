import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  image: {
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
            // Date/time utilities
            if (
              id.includes('luxon') ||
              id.includes('date-fns') ||
              id.includes('dayjs')
            ) {
              return 'vendor-date';
            }
            // Authentication and security
            if (
              id.includes('passport') ||
              id.includes('jsonwebtoken') ||
              id.includes('bcrypt')
            ) {
              return 'vendor-auth';
            }
            // Database and ORM
            if (
              id.includes('prisma') ||
              id.includes('pg') ||
              id.includes('mongodb')
            ) {
              return 'vendor-db';
            }
            // NestJS framework
            if (id.includes('@nestjs')) {
              return 'vendor-nestjs';
            }
            // Other heavy utilities
            if (id.includes('lodash') || id.includes('underscore')) {
              return 'vendor-utils';
            }
            // Email services
            if (id.includes('nodemailer') || id.includes('@sendgrid')) {
              return 'vendor-email';
            }
            // Validation libraries
            if (
              id.includes('joi') ||
              id.includes('zod') ||
              id.includes('class-validator')
            ) {
              return 'vendor-validation';
            }
            // Other third-party dependencies (smaller chunk)
            if (id.includes('node_modules')) {
              return 'vendor-misc';
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
