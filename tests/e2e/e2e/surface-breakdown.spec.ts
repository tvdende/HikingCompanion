import { expect, test } from '@playwright/test';

test('shows the available surface layer and toggles the map layer', async ({ page }) => {
  await page.route('/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: { user: { id: 'surface-user', name: 'Surface User', email: 'surface@test.nl', role: 'user', isActive: true } },
  }));
  await page.route('/api/routing/route', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: { coordinates: [[5.1214, 52.0907], [5.13, 52.095]], distanceMeters: 1000, durationSeconds: 700, isFallback: false },
  }));
  await page.goto('/');
  await page.locator('#btn-new-route').click();
  const map = page.locator('#maplibre-canvas');
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
  await map.click({ position: isMobile ? { x: 160, y: 150 } : { x: 550, y: 250 } });
  await map.click({ position: isMobile ? { x: 220, y: 180 } : { x: 650, y: 320 } });
  await expect(page.getByText(/Ondergrondverdeling|Surface Breakdown/)).toBeVisible();
  const toggle = page.getByRole('button', { name: /Toon ondergrond op kaart|Show surface on map/ });
  await toggle.click();
  await expect(page.getByRole('button', { name: /Toon etappes|Show stages/ })).toBeVisible();
});