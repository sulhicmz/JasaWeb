/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
