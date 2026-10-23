import { test, expect, Page } from '@playwright/test';

function getMapClickCoordinates(page: Page) {
  const viewport = page.viewportSize();
  const isMobile = (viewport?.width ?? 1280) < 768;
  return {
    point1: isMobile ? { x: 180, y: 200 } : { x: 550, y: 250 },
    point2: isMobile ? { x: 230, y: 250 } : { x: 650, y: 320 },
    point3: isMobile ? { x: 280, y: 300 } : { x: 750, y: 380 },
  };
}

test.describe('Multi-Stage & Public Transit Management Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user session
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          user: {
            id: 'stage-hiker-1',
            name: 'Stage Hiker',
            email: 'hiker@test.nl',
            role: 'planner',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    });

    // Mock routing API proxy
    await page.route('/api/routing/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          coordinates: [
            [5.1214, 52.0907],
            [5.125, 52.092],
            [5.13, 52.095],
          ],
          distanceMeters: 2500,
          durationSeconds: 1800,
          isFallback: false,
        },
      });
    });

    await page.goto('/');
    await expect(page.locator('#app-root')).toBeVisible();
  });

  test('allows creating multiple stages, renaming, changing transport type, and deleting', async ({
    page,
  }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    // Click "Nieuwe Route Tekenen"
    const newRouteBtn = page.locator('#btn-new-route');
    await newRouteBtn.click();

    // Place two waypoints
    const mapCanvas = page.locator('#maplibre-canvas');
    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });

    // Verify stage panel is visible
    const stagesPanel = page.locator('#stages-manager-panel');
    await expect(stagesPanel).toBeVisible();

    // Verify initial stage card (E1)
    const stageCard1 = page.locator('#stage-card-1');
    await expect(stageCard1).toBeVisible();
    await expect(stageCard1.locator('.stage-badge-tag')).toHaveText('E1');

    // Add a new stage via "+ Nieuwe etappe"
    const addStageBtn = page.locator('#btn-add-new-stage');
    await addStageBtn.click();

    // Verify Stage 2 card (E2) appears
    const stageCard2 = page.locator('#stage-card-2');
    await expect(stageCard2).toBeVisible();
    await expect(stageCard2.locator('.stage-badge-tag')).toHaveText('E2');
    await expect(page.locator('#stat-stage-count')).toHaveText('2');

    // Rename Stage 1
    const titleInput1 = stageCard1.locator('.stage-title-input');
    await titleInput1.fill('Etappe 1: Pieterburen – Winsum');
    await expect(titleInput1).toHaveValue('Etappe 1: Pieterburen – Winsum');

    // Change transport type of Stage 2 to Bus
    const transportSelect2 = stageCard2.locator('.transport-select');
    await transportSelect2.selectOption('bus');
    await expect(transportSelect2).toHaveValue('bus');

    // Click "Toon hele route" button
    const viewFullRouteBtn = page.locator('#btn-view-full-route');
    await expect(viewFullRouteBtn).toBeVisible();
    await viewFullRouteBtn.click();

    // Delete Stage 2 with the in-app confirmation dialog
    const deleteStage2Btn = stageCard2.locator('.stage-action-btn.delete');
    await deleteStage2Btn.click();
    const confirmation = page.getByRole('alertdialog');
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Verwijderen' }).click();

    // Verify only 1 stage remains
    await expect(page.locator('#stat-stage-count')).toHaveText('1');
    await expect(stageCard2).not.toBeVisible();
    await expect(page.getByRole('status')).toContainText('Etappe "Etappe 2" is verwijderd.');
  });

  test('cancels stage deletion with Escape and restores focus', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);
    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');
    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });
    await page.locator('#btn-add-new-stage').click();

    const deleteButton = page.locator('#stage-card-2 .stage-action-btn.delete');
    await deleteButton.focus();
    await deleteButton.click();
    const confirmation = page.getByRole('alertdialog');
    await expect(confirmation).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirmation).not.toBeVisible();
    await expect(deleteButton).toBeFocused();
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });

  test('uses the selected language in the confirmation dialog', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);
    await page.locator('#lang-btn-en').click();
    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');
    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });
    await page.locator('#btn-add-new-stage').click();

    await page.locator('#stage-card-2 .stage-action-btn.delete').click();
    const confirmation = page.getByRole('alertdialog');
    await expect(confirmation).toContainText('Are you sure you want to delete "Stage 2"?');
    await expect(confirmation.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('reorders stages using step buttons (▲ / ▼)', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');
    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });

    // Add Stage 2 and Stage 3
    await page.locator('#btn-add-new-stage').click();
    await page.locator('#btn-add-new-stage').click();

    await expect(page.locator('#stat-stage-count')).toHaveText('3');

    // Set distinctive titles
    const cards = page.locator('.stage-card');
    await cards.nth(0).locator('.stage-title-input').fill('Eerste Etappe');
    await cards.nth(1).locator('.stage-title-input').fill('Tweede Etappe');
    await cards.nth(2).locator('.stage-title-input').fill('Derde Etappe');

    // Move Stage 2 down below Stage 3
    const moveDownBtn = cards.nth(1).locator('.stage-step-btn[aria-label="Verplaats omlaag"], .stage-step-btn[title="Verplaats omlaag"]');
    await moveDownBtn.click();

    // Verify new order: 2nd card is now 'Derde Etappe', 3rd card is 'Tweede Etappe'
    await expect(cards.nth(1).locator('.stage-title-input')).toHaveValue('Derde Etappe');
    await expect(cards.nth(2).locator('.stage-title-input')).toHaveValue('Tweede Etappe');
  });
});
