import { test, expect } from '@playwright/test';

test.describe('Map Viewer & Controls', () => {
  test.beforeEach(async ({ page }) => {
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
