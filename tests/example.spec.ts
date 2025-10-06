import { test, expect } from './setup';

test.describe('JasaWeb Public Site', () => {
  test('should have a homepage with expected content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JasaWeb|Website/);
    
    // Expect to see elements that should be on the homepage
    await expect(page.locator('text=Website Sekolah')).toBeVisible();
    await expect(page.locator('text=Portal Berita')).toBeVisible();
    await expect(page.locator('text=Company Profile')).toBeVisible();
  });

  test('should navigate to services page', async ({ page }) => {
    await page.goto('/');
    
    // Click on one of the service links
    await page.locator('text=Website Sekolah').click();
    await expect(page).toHaveURL(/.*sekolah/);
  });

  test('should handle login redirection', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/dashboard');
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);
  });
});