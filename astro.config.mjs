import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    adapter: cloudflare({
        platformProxy: {
            enabled: true,
        },
    }),
    integrations: [react()],

    // Environment Variable Schema (Security Layer)
    // Prevents secrets from being bundled into client JavaScript
    env: {
        schema: {
            // Server-only secrets - NEVER exposed to client
            JWT_SECRET: envField.string({
                context: 'server',
                access: 'secret',
            }),
            MIDTRANS_SERVER_KEY: envField.string({
                context: 'server',
                access: 'secret',
            }),
            DATABASE_URL: envField.string({
                context: 'server',
                access: 'secret',
                optional: true, // Uses Hyperdrive binding instead
            }),

            // Public variables - Safe to expose to client
            MIDTRANS_CLIENT_KEY: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
            }),
        },
    },

    vite: {
        resolve: {
            alias: {
                '@': '/src',
            },
        },
        ssr: {
            external: [
                '@prisma/adapter-pg', 
                'pg',
                'crypto',
                'bcryptjs',
                'querystring',
                'https'
            ],
        },
        optimizeDeps: {
            exclude: ['@prisma/client'],
            include: ['react', 'react-dom'],
        },
        // Bundle analysis for performance monitoring
        build: {
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info', 'console.debug'],
                    dead_code: true,
                    unused: true,
                    passes: 2
                },
                mangle: {
                    toplevel: true,
                    properties: {
                        regex: /^_/
                    }
                },
                format: {
                    comments: false
                }
            },
            target: 'es2022',
            cssCodeSplit: true,
            rollupOptions: {
output: {
                    // Let Vite handle chunking automatically
                    chunkFileNames: (chunkInfo) => {
                        const name = chunkInfo.name;
                        return `chunks/[name]-[hash].js`;
                    }
                },
                plugins: process.env.ANALYZE ? [
                    // Bundle visualizer will be added dynamically
                ] : [],
            },
        },
    },
});
