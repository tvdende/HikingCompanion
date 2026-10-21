import { test, expect, Page } from '@playwright/test';

function getMapClickCoordinates(page: Page) {
  const viewport = page.viewportSize();
  const isMobile = (viewport?.width ?? 1280) < 768;
  return {
    point1: isMobile ? { x: 180, y: 200 } : { x: 550, y: 250 },
    point2: isMobile ? { x: 230, y: 250 } : { x: 650, y: 320 },
  };
}

test.describe('Interactive Route Planner & Editor Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user session
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          user: {
            id: 'trail-blazer',
            name: 'Trail Blazer',
            email: 'trail@test.nl',
            role: 'user',
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
          distanceMeters: 1450,
          durationSeconds: 1080,
          isFallback: false,
        },
      });
    });

    await page.goto('/');
    await expect(page.locator('#app-root')).toBeVisible();
  });

  test('enables edit mode, places waypoints on map canvas, and updates route metrics', async ({
    page,
  }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    // Start route editing via sidebar button
    const newRouteBtn = page.locator('#btn-new-route');
    await expect(newRouteBtn).toBeVisible();
    await newRouteBtn.click();

    // Toolbar should be visible with active edit mode
    const toolbar = page.locator('#route-editor-toolbar');
    await expect(toolbar).toBeVisible();

    const toggleEditBtn = page.locator('#btn-toggle-edit-mode');
    await expect(toggleEditBtn).toHaveAttribute('aria-pressed', 'true');

    // Click on the map container to place first waypoint (Start)
    const mapCanvas = page.locator('#maplibre-canvas');
    await expect(mapCanvas).toBeVisible();

    await mapCanvas.click({ position: point1 });
    await expect(page.locator('#waypoint-marker-0')).toBeVisible({ timeout: 5000 });

    // Click on the map container to place second waypoint (Finish)
    await mapCanvas.click({ position: point2 });
    await expect(page.locator('#waypoint-marker-1')).toBeVisible({ timeout: 5000 });

    // Active route card should now appear in sidebar with metrics
    const routeCard = page.locator('#loaded-route-card');
    await expect(routeCard).toBeVisible({ timeout: 8000 });

    const pointStat = page.locator('#stat-point-count');
    await expect(pointStat).toContainText('2 wps');

    const distanceStat = page.locator('#stat-total-distance');
    await expect(distanceStat).toBeVisible();
  });

  test('toggles routing mode between Snap to wandelpaden and Rechte lijn', async ({ page }) => {
    // Start editing
    await page.locator('#btn-new-route').click();

    const snapModeBtn = page.locator('#btn-mode-snap');
    const directModeBtn = page.locator('#btn-mode-direct');

    await expect(snapModeBtn).toHaveClass(/selected/);
    await expect(directModeBtn).not.toHaveClass(/selected/);

    // Switch to direct straight line
    await directModeBtn.click();
    await expect(directModeBtn).toHaveClass(/selected/);
    await expect(snapModeBtn).not.toHaveClass(/selected/);

    // Switch back to snap mode
    await snapModeBtn.click();
    await expect(snapModeBtn).toHaveClass(/selected/);
  });

  test('navigates history stack with undo and redo', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    // Start editing
    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');

    const undoBtn = page.locator('#btn-undo');
    const redoBtn = page.locator('#btn-redo');

    // Initially undo and redo should be disabled
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    // Place point 1
    await mapCanvas.click({ position: point1 });
    await expect(page.locator('#waypoint-marker-0')).toBeVisible();
    await expect(undoBtn).toBeEnabled();

    // Place point 2
    await mapCanvas.click({ position: point2 });
    await expect(page.locator('#waypoint-marker-1')).toBeVisible();

    // Undo point 2
    await undoBtn.click();
    await expect(page.locator('#waypoint-marker-1')).not.toBeVisible();
    await expect(redoBtn).toBeEnabled();

    // Redo point 2
    await redoBtn.click();
    await expect(page.locator('#waypoint-marker-1')).toBeVisible();
  });

  test('reverses route direction and start/finish markers', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    // Start editing and place 2 waypoints
    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');

    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });
    await expect(page.locator('#waypoint-marker-1')).toBeVisible();

    const reverseBtn = page.locator('#btn-reverse-route');
    await expect(reverseBtn).toBeEnabled();
    await reverseBtn.click();

    // Markers should still exist with reversed order
    await expect(page.locator('#waypoint-marker-0')).toBeVisible();
    await expect(page.locator('#waypoint-marker-1')).toBeVisible();
  });

  test('saves active route to D1 and opens saved routes library', async ({ page }) => {
    const { point1, point2 } = getMapClickCoordinates(page);

    // Mock save endpoint
    await page.route('/api/routes', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: {
            route: {
              id: 'saved-veluwe-1',
              userId: 'trail-blazer',
              title: body.title || 'Veluwezoom Rondje',
              totalDistanceKm: body.totalDistanceKm || 2.5,
              coordinatesJson: JSON.stringify(body.coordinates),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            routes: [
              {
                id: 'saved-veluwe-1',
                title: 'Veluwezoom Rondje',
                totalDistanceKm: 2.5,
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        });
      }
    });

    // Start editing and place 2 points
    await page.locator('#btn-new-route').click();
    const mapCanvas = page.locator('#maplibre-canvas');
    await mapCanvas.click({ position: point1 });
    await mapCanvas.click({ position: point2 });
    await expect(page.locator('#waypoint-marker-1')).toBeVisible();

    // Click Save button on toolbar
    const saveBtn = page.locator('#btn-save-route');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Save modal opens
    const saveModal = page.locator('#save-route-modal');
    await expect(saveModal).toBeVisible();

    const titleInput = page.locator('#input-route-title');
    await titleInput.fill('Veluwezoom Rondje');

    const confirmSaveBtn = page.locator('#btn-confirm-save-route');
    await confirmSaveBtn.click();

    // Modal closes
    await expect(saveModal).not.toBeVisible();

    // Open Route Library
    const libraryBtn = page.locator('#btn-open-route-library');
    await libraryBtn.click();

    const libraryModal = page.locator('#route-library-modal');
    await expect(libraryModal).toBeVisible();

    // Verify saved route appears in list
    const savedItem = page.locator('#saved-routes-list');
    await expect(savedItem).toContainText('Veluwezoom Rondje');
    await expect(page.locator('#btn-load-route-saved-veluwe-1')).toBeVisible();
  });
});
