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
        },
    },
});
