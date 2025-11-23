import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://jasaweb-dhd.pages.dev/',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        channel: 'chrome',
      },
    },
  ],
  testDir: './tests/e2e',
  outputDir: './test-results',
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
});