
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined, // GitHub Actions usually 1 worker for stability
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4321', // Local preview URL
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
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes to build & start
    },
});
