import { test, expect, type Page } from '@playwright/test';

type GpxFixture = { name: string; trackName: string; points: Array<[number, number]> };

const buildGpx = (trackName: string, points: Array<[number, number]>) => `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HikingCompanion">
  <trk><name>${trackName}</name><trkseg>
${points.map(([lat, lon]) => `    <trkpt lat="${lat}" lon="${lon}"><ele>10</ele></trkpt>`).join('\n')}
  </trkseg></trk>
</gpx>`;

const toFile = (fixture: GpxFixture) => ({
  name: fixture.name,
  mimeType: 'application/gpx+xml',
  buffer: Buffer.from(buildGpx(fixture.trackName, fixture.points)),
});

// Endpoints connect as Bravo → Alpha → Charlie, while the natural filename order is alpha, bravo, charlie.
const ALPHA: GpxFixture = { name: 'alpha.gpx', trackName: 'Alpha', points: [[52.1, 5.1], [52.2, 5.2]] };
const BRAVO: GpxFixture = { name: 'bravo.gpx', trackName: 'Bravo', points: [[52.0, 5.0], [52.1, 5.1]] };
const CHARLIE: GpxFixture = { name: 'charlie.gpx', trackName: 'Charlie', points: [[52.2, 5.2], [52.3, 5.3]] };
const BASE: GpxFixture = { name: 'basis.gpx', trackName: 'Basis', points: [[51.9, 4.9], [51.95, 4.95]] };

const dialog = (page: Page) => page.locator('#gpx-import-modal-overlay [role="dialog"]');
const fileItems = (page: Page) => page.locator('#gpx-file-order-list > li');
const fileItem = (page: Page, name: string) => fileItems(page).filter({ hasText: name });
const control = (page: Page, name: string, which: 'up' | 'down' | 'remove') =>
  fileItem(page, name).locator(`[data-control="${which}"]`);

const expectListOrder = async (page: Page, names: string[]) => {
  await expect(fileItems(page).locator('.gpx-file-name')).toHaveText(names);
  await expect(fileItems(page).locator('.gpx-file-position')).toHaveText(names.map((_, i) => String(i + 1)));
};

const expectStageTitles = async (page: Page, titles: string[]) => {
  await expect(page.locator('#stat-stage-count')).toHaveText(String(titles.length), { timeout: 10000 });
  for (const [idx, title] of titles.entries()) {
    await expect(page.locator(`#stage-card-${idx + 1} .stage-title-input`)).toHaveValue(title);
  }
};

const uploadFiles = (page: Page, fixtures: GpxFixture[]) =>
  page.locator('#gpx-file-input').setInputFiles(fixtures.map(toFile));

const loadBaseRoute = async (page: Page) => {
  await uploadFiles(page, [BASE]);
  await expect(page.locator('#loaded-route-card')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#stat-stage-count')).toHaveText('1');
};

test.describe('GPX multi-file upload ordering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: 'order-planner',
            name: 'Order Planner',
            email: 'order@hiking.nl',
            role: 'planner',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    });
    await page.route('**/api/routing/route', async (route) => {
      await route.fulfill({
        json: { coordinates: [[5.0, 52.0], [5.1, 52.1]], distanceMeters: 1000 },
      });
    });
    await page.goto('/');
    await expect(page.locator('#btn-import-gpx')).toBeVisible();
  });

  test('lists files in natural order with details and bounded move controls', async ({ page }) => {
    await page.locator('#gpx-file-input').setInputFiles([
      { name: 'etappe-10.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(buildGpx('Tien', ALPHA.points)) },
      { name: 'etappe-2.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(buildGpx('Twee', BRAVO.points)) },
      { name: 'etappe-1.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(buildGpx('Een', CHARLIE.points)) },
    ]);

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#gpx-modal-title')).toHaveText('Meerdere GPX-bestanden gedetecteerd');
    await expect(page.locator('#gpx-order-hint')).toBeVisible();
    await expectListOrder(page, ['etappe-1.gpx', 'etappe-2.gpx', 'etappe-10.gpx']);

    for (const item of await fileItems(page).all()) {
      await expect(item.locator('.gpx-file-details')).toHaveText(/\d+[,.]\d+ km · tracks: 1/);
    }

    await expect(control(page, 'etappe-1.gpx', 'up')).toBeDisabled();
    await expect(control(page, 'etappe-1.gpx', 'down')).toBeEnabled();
    await expect(control(page, 'etappe-10.gpx', 'down')).toBeDisabled();
    await expect(control(page, 'etappe-10.gpx', 'up')).toBeEnabled();
  });

  test('reorders with move buttons, keeps keyboard focus on the moved file and imports in that order', async ({ page }) => {
    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();
    await expectListOrder(page, ['alpha.gpx', 'bravo.gpx', 'charlie.gpx']);

    await control(page, 'charlie.gpx', 'up').focus();
    await page.keyboard.press('Enter');
    await expectListOrder(page, ['alpha.gpx', 'charlie.gpx', 'bravo.gpx']);
    await expect(control(page, 'charlie.gpx', 'up')).toBeFocused();
    await expect(page.locator('#gpx-order-announcer')).toHaveText('charlie.gpx staat nu op positie 2 van 3.');

    await page.keyboard.press('Enter');
    await expectListOrder(page, ['charlie.gpx', 'alpha.gpx', 'bravo.gpx']);
    // Moved to the top: the disabled move-up control hands focus to move-down of the same file.
    await expect(control(page, 'charlie.gpx', 'up')).toBeDisabled();
    await expect(control(page, 'charlie.gpx', 'down')).toBeFocused();

    await page.locator('#btn-choice-separate-stages').click();
    await expect(dialog(page)).toBeHidden();
    await expectStageTitles(page, ['Charlie', 'Alpha', 'Bravo']);
  });

  test('removes a file from the list and excludes it from the import', async ({ page }) => {
    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();

    await control(page, 'bravo.gpx', 'remove').click();
    await expectListOrder(page, ['alpha.gpx', 'charlie.gpx']);
    await expect(page.locator('#gpx-modal-subtitle')).toContainText('2');

    await control(page, 'alpha.gpx', 'remove').click();
    await expectListOrder(page, ['charlie.gpx']);
    await expect(control(page, 'charlie.gpx', 'remove')).toBeDisabled();

    await page.locator('#btn-choice-separate-stages').click();
    await expectStageTitles(page, ['Charlie']);
  });

  test('blocks import while an unreadable file is listed', async ({ page }) => {
    await page.locator('#gpx-file-input').setInputFiles([
      toFile(ALPHA),
      { name: 'kapot.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from('<broken-xml>no tracks</broken-xml>') },
    ]);
    await expect(dialog(page)).toBeVisible();

    await expect(fileItem(page, 'kapot.gpx')).toHaveClass(/has-error/);
    await expect(fileItem(page, 'kapot.gpx').locator('.gpx-file-error')).toHaveText(
      'Dit bestand kan niet als GPX worden gelezen.'
    );
    await expect(page.locator('#gpx-import-blocked')).toBeVisible();
    await expect(page.locator('#btn-choice-separate-stages')).toBeDisabled();
    await expect(page.locator('#btn-choice-merged-single')).toBeDisabled();

    await control(page, 'kapot.gpx', 'remove').click();
    await expect(page.locator('#gpx-import-blocked')).toHaveCount(0);
    await expect(page.locator('#btn-choice-separate-stages')).toBeEnabled();
    await page.locator('#btn-choice-separate-stages').click();
    await expectStageTitles(page, ['Alpha']);
  });

  test('suggests an order based on connecting endpoints without importing', async ({ page }) => {
    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();

    await page.locator('#btn-suggest-gpx-order').click();
    await expectListOrder(page, ['bravo.gpx', 'alpha.gpx', 'charlie.gpx']);
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#loaded-route-card')).toHaveCount(0);

    await page.locator('#btn-choice-separate-stages').click();
    await expectStageTitles(page, ['Bravo', 'Alpha', 'Charlie']);
  });

  test('merges reordered files into exactly one stage', async ({ page }) => {
    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();
    await page.locator('#btn-suggest-gpx-order').click();

    await page.locator('#btn-choice-merged-single').click();
    await expectStageTitles(page, ['Bravo & Alpha & Charlie']);
  });

  test('adds ordered files after the stages of an active route', async ({ page }) => {
    await loadBaseRoute(page);

    await uploadFiles(page, [ALPHA, BRAVO]);
    await expect(dialog(page)).toBeVisible();
    await control(page, 'bravo.gpx', 'up').click();
    await expectListOrder(page, ['bravo.gpx', 'alpha.gpx']);

    await page.locator('#btn-choice-separate-stages').click();
    await expectStageTitles(page, ['Basis', 'Bravo', 'Alpha']);
  });

  test('appends a merged import to an active route instead of replacing it', async ({ page }) => {
    await loadBaseRoute(page);

    await uploadFiles(page, [ALPHA, BRAVO]);
    await expect(dialog(page)).toBeVisible();
    await page.locator('#btn-choice-merged-single').click();

    await expect(page.locator('#stat-stage-count')).toHaveText('2', { timeout: 10000 });
    await expect(page.locator('#stage-card-1 .stage-title-input')).toHaveValue('Basis');
    await expect(page.locator('#stage-card-2 .stage-title-input')).toHaveValue('Alpha & Bravo');
  });

  test('orders multiple files appended to the active stage', async ({ page }) => {
    await loadBaseRoute(page);
    const pointsBefore = Number((await page.locator('#stat-point-count').innerText()).match(/\d+/)?.[0]);

    const chooserPromise = page.waitForEvent('filechooser');
    await page.locator('#btn-append-gpx').click();
    const chooser = await chooserPromise;
    await chooser.setFiles([toFile(ALPHA), toFile(BRAVO)]);

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#gpx-modal-title')).toHaveText('Bestanden toevoegen aan de route');
    await expect(page.locator('#btn-choice-separate-stages')).toHaveCount(0);
    await control(page, 'bravo.gpx', 'up').click();
    await expectListOrder(page, ['bravo.gpx', 'alpha.gpx']);

    await page.locator('#btn-choice-append-in-order').click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#stat-stage-count')).toHaveText('1');
    await expect(page.locator('#stat-point-count')).not.toHaveText(new RegExp(`^${pointsBefore}\\b`));
  });

  test('cancelling after reordering leaves the route unchanged', async ({ page }) => {
    await loadBaseRoute(page);

    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();
    await control(page, 'charlie.gpx', 'up').click();
    await control(page, 'alpha.gpx', 'remove').click();

    await page.locator('#btn-gpx-import-cancel').click();
    await expect(dialog(page)).toBeHidden();
    await expectStageTitles(page, ['Basis']);
  });

  test('closes on Escape and returns focus to the upload button', async ({ page }) => {
    const chooserPromise = page.waitForEvent('filechooser');
    await page.locator('#btn-import-gpx').click();
    const chooser = await chooserPromise;
    await chooser.setFiles([toFile(ALPHA), toFile(BRAVO)]);

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#btn-choice-separate-stages')).toBeFocused();

    // Tab focus stays inside the dialog.
    await page.locator('#btn-gpx-import-cancel').focus();
    await page.keyboard.press('Tab');
    await expect(dialog(page).locator(':focus')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#btn-import-gpx')).toBeFocused();
    await expect(page.locator('#loaded-route-card')).toHaveCount(0);
  });

  test('shows the ordering dialog in English', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('hiking_companion_locale', 'en'));
    await page.reload();
    await expect(page.locator('#btn-import-gpx')).toBeVisible();

    await uploadFiles(page, [ALPHA, BRAVO]);
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#gpx-modal-title')).toHaveText('Multiple GPX files detected');
    await expect(page.locator('#gpx-order-hint')).toHaveText(
      'Set the order of the stages: drag a file or use the arrow buttons.'
    );
    await expect(page.locator('#btn-suggest-gpx-order')).toHaveText('Suggest order');
    await expect(control(page, 'alpha.gpx', 'down')).toHaveAttribute('aria-label', 'Move down');
    await expect(control(page, 'alpha.gpx', 'remove')).toHaveAttribute('aria-label', 'Remove alpha.gpx from the list');
    await expect(page.locator('#gpx-file-order-list')).toHaveAttribute('aria-label', /.+/);

    await control(page, 'bravo.gpx', 'up').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#gpx-order-announcer')).toHaveText('bravo.gpx is now at position 1 of 2.');
  });

  test('reorders files by dragging on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'HTML5 drag-and-drop is a desktop pointer interaction');

    await uploadFiles(page, [ALPHA, BRAVO, CHARLIE]);
    await expect(dialog(page)).toBeVisible();

    await fileItem(page, 'charlie.gpx')
      .locator('.gpx-file-drag-handle')
      .dragTo(fileItem(page, 'alpha.gpx'));
    await expectListOrder(page, ['charlie.gpx', 'alpha.gpx', 'bravo.gpx']);

    await page.locator('#btn-choice-separate-stages').click();
    await expectStageTitles(page, ['Charlie', 'Alpha', 'Bravo']);
  });
});
