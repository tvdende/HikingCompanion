import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('GPX Import, Elevation Stats & Export Flow', () => {
  const sampleGpxPath = path.resolve(__dirname, '../fixtures/sample-trail.gpx');

  test.beforeEach(async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: 'gpx-hiker',
            name: 'GPX Tester',
            email: 'gpx@test.nl',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    });
    await page.goto('/');
    await expect(page.locator('#btn-import-gpx')).toBeVisible();
  });

  test('imports a valid GPX trail, renders route metrics and map layers', async ({ page }) => {
    // Check initial state
    const importBtn = page.locator('#btn-import-gpx');
    await expect(importBtn).toBeVisible();

    // Upload GPX file
    const fileInput = page.locator('#gpx-file-input');
    await fileInput.setInputFiles(sampleGpxPath);

    // Verify route card appears with title
    const routeCard = page.locator('#loaded-route-card');
    await expect(routeCard).toBeVisible({ timeout: 10000 });

    const routeTitle = page.locator('#route-title');
    await expect(routeTitle).toContainText('Veluwe Heuvelrug Trail');

    // Verify calculated metrics
    const distanceStat = page.locator('#stat-total-distance');
    await expect(distanceStat).toBeVisible();
    const distanceText = await distanceStat.innerText();
    expect(parseFloat(distanceText)).toBeGreaterThan(0);

    const gainStat = page.locator('#stat-elevation-gain');
    await expect(gainStat).toContainText('+85 m');

    const lossStat = page.locator('#stat-elevation-loss');
    await expect(lossStat).toContainText('-50 m');

    const pointStat = page.locator('#stat-point-count');
    await expect(pointStat).toContainText(/6 (pts|wps)/);
  });

  test('exports the active route as a GPX file download', async ({ page }) => {
    // Upload GPX file first
    const fileInput = page.locator('#gpx-file-input');
    await fileInput.setInputFiles(sampleGpxPath);
    await expect(page.locator('#loaded-route-card')).toBeVisible({ timeout: 10000 });

    // Setup download listener and click export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export-gpx').click();
    const download = await downloadPromise;

    // WebKit/Safari replaces spaces in download suggested filenames with underscores
    expect(download.suggestedFilename()).toMatch(/^Veluwe[ _]Heuvelrug[ _]Trail\.gpx$/);
  });

  test('displays route metrics in Companion HUD and clears route cleanly', async ({ page }) => {
    // Load route
    await page.locator('#gpx-file-input').setInputFiles(sampleGpxPath);
    await expect(page.locator('#loaded-route-card')).toBeVisible({ timeout: 10000 });

    // Switch to Companion mode
    await page.locator('#mode-switch-companion').click();
    const hud = page.locator('#companion-hud');
    await expect(hud).toBeVisible();
    await expect(hud).toContainText('Veluwe Heuvelrug Trail');
    await expect(page.locator('#hud-stat-elevation')).toContainText('+85m');

    // Switch back to Planner mode
    await page.locator('#mode-switch-planner').click();
    await expect(page.locator('#loaded-route-card')).toBeVisible();

    // Clear route
    await page.locator('#btn-clear-route').click();
    await expect(page.locator('#loaded-route-card')).not.toBeVisible();
    await expect(page.locator('#btn-import-gpx')).toBeVisible();
  });

  test('displays error message when an invalid GPX file is loaded', async ({ page }) => {
    // Provide a broken text file
    await page.locator('#gpx-file-input').setInputFiles({
      name: 'corrupt.gpx',
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from('<broken-xml>no tracks</broken-xml>'),
    });

    const errorBanner = page.locator('#gpx-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Ongeldig GPX bestand');
  });
});
