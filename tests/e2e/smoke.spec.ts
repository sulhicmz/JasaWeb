
import { test, expect } from '@playwright/test';

// Daftar halaman publik yang wajib bisa dibuka (Status 200 OK)
const publicPages = [
    '/',
    '/about',
    '/services',
    '/projects',
    '/blog',
    '/contact',
    '/login',
    '/register',
];

test.describe('Smoke Test - Public Pages', () => {
    for (const pageUrl of publicPages) {
        test(`should load ${pageUrl} without errors`, async ({ page }) => {
            // 1. Visit URL
            const response = await page.goto(pageUrl);

            // 2. Check HTTP Status
            // 500 = Server Error, 404 = Not Found -> FAIL
            expect(response?.status(), `Page ${pageUrl} returned status code ${response?.status()}`).toBe(200);

            // 3. Check for Visual "Error" Text
            // Kadang framework error tidak melempar 500, tapi merender teks error di layar
            const pageText = await page.textContent('body');
            expect(pageText).not.toContain('Internal Server Error');
            expect(pageText).not.toContain('Something went wrong');
        });
    }
});

// Test Khusus Login & Redirect ke Dashboard
test.describe('Auth Flow', () => {
    test('should login as admin and see dashboard', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', 'admin-e2e@jasaweb.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Harusnya redirect ke dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // Pastikan tidak ada error 500 di dashboard
        const dashboardTitle = page.getByText('Dashboard Overview'); // Sesuaikan dengan teks nyata di dashboard
        await expect(dashboardTitle).toBeVisible();
    });
});
