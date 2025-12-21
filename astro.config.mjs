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
        // Bundle analysis for performance monitoring
        build: {
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log']
                }
            },
            rollupOptions: {
                output: {
                    manualChunks: {
                        'admin': [
                            './src/services/admin/users.ts',
                            './src/services/admin/projects.ts',
                            './src/services/admin/cms.ts',
                            './src/services/admin/crud.ts',
                            './src/services/admin/blog.ts'
                        ],
                        'billing': [
                            './src/services/client/billing-client.ts',
                            './src/services/client/BillingService.ts'
                        ],
                        'payment': [
                            './src/lib/midtrans-client.ts',
                            './src/lib/midtrans.ts'
                        ]
                    },
                    chunkFileNames: (chunkInfo) => {
                        const facadeModuleId = chunkInfo.facadeModuleId;
                        if (facadeModuleId?.includes('/admin/')) {
                            return 'chunks/admin/[name]-[hash].js';
                        }
                        if (facadeModuleId?.includes('/dashboard/')) {
                            return 'chunks/dashboard/[name]-[hash].js';
                        }
                        return 'chunks/[name]-[hash].js';
                    }
                },
                plugins: process.env.ANALYZE ? [
                    // Bundle visualizer will be added dynamically
                ] : [],
            },
        },
    },
});
