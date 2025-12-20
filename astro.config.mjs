import { defineConfig } from 'astro/config';
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
    vite: {
        resolve: {
            alias: {
                '@': '/src',
            },
        },
        ssr: {
            external: ['@prisma/adapter-pg', 'pg'],
        },
    },
});
