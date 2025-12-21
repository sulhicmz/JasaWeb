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
                '@prisma/client',
                'pg',
                'crypto',
                'bcryptjs',
                'querystring',
                'https'
            ],
        },
        // Enhanced dependency optimization for better tree-shaking
        optimizeDeps: {
            exclude: [
                '@prisma/client',
                '@prisma/adapter-pg',
                'pg',
                'bcryptjs',
                'midtrans-client',
                'jose'
            ],
            include: [
                'react',
                'react-dom',
                'react/jsx-runtime'
            ],
        },
        // Advanced performance optimization configuration
        build: {
            minify: 'terser',
            terserOptions: {
                compress: {
                    // Maximum optimization for production
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                    dead_code: true,
                    unused: true,
                    passes: 2, // Optimal for performance vs build time
                    conditionals: true,
                    evaluate: true,
                    booleans: true,
                    loops: true,
                    if_return: true,
                    join_vars: true,
                    reduce_vars: true,
                    sequences: true,
                    switches: true
                },
                mangle: {
                    toplevel: true,
                    properties: {
                        regex: /^_/
                    },
                    reserved: []
                },
                format: {
                    comments: false
                }
            },
            target: 'es2022',
            cssCodeSplit: true,
            rollupOptions: {
                output: {
                    // Let Vite handle automatic chunking for optimal bundling
                    chunkFileNames: 'chunks/[name]-[hash].js',
                    assetFileNames: (assetInfo) => {
                        const extType = assetInfo.names?.[0]?.split('.').pop() || '';
                        if (['css', 'scss', 'sass'].includes(extType)) {
                            return `css/[name]-[hash].${extType}`;
                        }
                        return `assets/[name]-[hash].${extType}`;
                    }
                }
            }
        }
    },
});