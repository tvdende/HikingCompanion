import { test, expect } from '@playwright/test';

test.describe('Map Viewer & Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: 'test-hiker',
            name: 'Map Hiker',
            email: 'hiker@test.com',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    });
    await page.goto('/');
  });

  test('initializes and displays the map container', async ({ page }) => {
    const mapContainer = page.locator('#map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('displays the user geolocation trigger button', async ({ page }) => {
    const locateBtn = page.locator('#btn-locate-user');
    await expect(locateBtn).toBeVisible();
    await expect(locateBtn).toBeEnabled();
  });
});
