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
    // Optimize images for better performance
    domains: ['localhost', 'jasaweb.com'],
    format: ['webp', 'avif', 'jpg'],
    quality: 80,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.astro'],
    },
    esbuild: {
      loader: 'tsx',
      include: /\.tsx?$/,
      exclude: /node_modules/,
    },
    // Performance optimizations
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['chart.js', 'react-chartjs-2'],
            utils: ['socket.io-client'],
          },
        },
      },
    },
    // Enable code splitting and tree shaking
    optimizeDeps: {
      include: ['react', 'react-dom', 'chart.js'],
    },
  },
  integrations: [react()],
  // Performance settings
  compressHTML: true,
  // Enable prefetch for better perceived performance
  prefetch: true,
});
