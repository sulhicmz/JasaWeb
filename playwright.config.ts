
import { defineConfig, devices } from '@playwright/test';

// Configuration from environment variables with defaults
const config = {
    testDir: process.env.PLAYWRIGHT_TEST_DIR || './tests/e2e',
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321',
    port: parseInt(process.env.PLAYWRIGHT_PORT || '4321'),
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '120000'), // 2 minutes
    retries: process.env.CI ? parseInt(process.env.PLAYWRIGHT_RETRIES || '2') : 0,
    workers: process.env.CI ? 1 : undefined,
};

export default defineConfig({
    testDir: config.testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: config.retries,
    workers: config.workers,
    reporter: 'html',
    use: {
        baseURL: config.baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // We can add firefox/webkit later if needed
    ],
    webServer: {
        command: 'pnpm preview', // Run the production build locally
        url: `http://localhost:${config.port}`,
        reuseExistingServer: !process.env.CI,
        timeout: config.timeout,
    },
});
