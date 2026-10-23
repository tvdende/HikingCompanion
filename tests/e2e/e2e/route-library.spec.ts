import { test, expect } from '@playwright/test';

test.describe('Route Management Library & Multi-GPX Stitching Suite', () => {
  const mockRoutes = [
    {
      id: 'route-concept-1',
      title: 'Veluwezoom Verkenning',
      description: 'Conceptverkenning over onverharde heidepaden',
      location: 'Gelderland, Veluwe',
      status: 'draft',
      priceEur: 0,
      totalDistanceKm: 12.4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'route-def-1',
      title: 'Pieterpad Etappe 1',
      description: 'Officieel gemarkeerd en geverifieerd Pieterpad segment',
      location: 'Groningen',
      status: 'definitive',
      priceEur: 2.99,
      totalDistanceKm: 21.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock user authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          user: {
            id: 'planner-pro',
            name: 'Planner Pro',
            email: 'planner@hiking.nl',
            role: 'planner',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    });

    // Mock routing API proxy
    await page.route('**/api/routing/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          coordinates: [
            [5.8, 52.0],
            [5.85, 52.05],
            [5.9, 52.1],
          ],
          distanceMeters: 21000,
        },
      });
    });

    // Mock GET /api/routes list
    await page.route('**/api/routes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { routes: mockRoutes },
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET and PUT /api/routes/:id
    await page.route('**/api/routes/*', async (route) => {
      const url = new URL(route.request().url());
      const routeId = url.pathname.split('/').pop();
      const found = mockRoutes.find((r) => r.id === routeId) || mockRoutes[0];

      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            route: {
              ...found,
              coordinates: [
                { lat: 52.0, lng: 5.8 },
                { lat: 52.1, lng: 5.9 },
              ],
              stages: [
                {
                  id: 'stage-1',
                  stageNumber: 1,
                  title: found.title,
                  distanceKm: found.totalDistanceKm,
                  coordinates: [
                    { lat: 52.0, lng: 5.8 },
                    { lat: 52.1, lng: 5.9 },
                  ],
                },
              ],
              waypoints: [
                { id: 'wp-1', coordinate: { lat: 52.0, lng: 5.8 }, routingMode: 'snap' },
                { id: 'wp-2', coordinate: { lat: 52.1, lng: 5.9 }, routingMode: 'snap' },
              ],
            },
          },
        });
      } else if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            success: true,
            route: {
              ...found,
              ...body,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await expect(page.locator('#app-root')).toBeVisible();
  });

  test('opens route library, filters by status tabs and search query', async ({ page }) => {
    // Open route library modal from sidebar
    const openLibraryBtn = page.locator('#btn-open-route-library-sidebar');
    await expect(openLibraryBtn).toBeVisible();
    await openLibraryBtn.click();

    const libraryModal = page.locator('#route-library-modal');
    await expect(libraryModal).toBeVisible();

    // Verify all routes listed initially
    const routeItems = page.locator('.saved-route-item');
    await expect(routeItems).toHaveCount(2);

    // Filter by "🟡 Concepten" tab
    const tabDraft = page.locator('#tab-filter-draft');
    await tabDraft.click();
    await expect(page.locator('.saved-route-item')).toHaveCount(1);
    await expect(page.locator('.saved-route-item')).toContainText('Veluwezoom Verkenning');

    // Filter by "🟢 Definitief" tab
    const tabDefinitive = page.locator('#tab-filter-definitive');
    await tabDefinitive.click();
    await expect(page.locator('.saved-route-item')).toHaveCount(1);
    await expect(page.locator('.saved-route-item')).toContainText('Pieterpad Etappe 1');

    // Switch back to "Alle Routes"
    await page.locator('#tab-filter-all').click();
    await expect(page.locator('.saved-route-item')).toHaveCount(2);

    // Search input
    const searchInput = page.locator('#library-search-input');
    await searchInput.fill('Groningen');
    await expect(page.locator('.saved-route-item')).toHaveCount(1);
    await expect(page.locator('.saved-route-item')).toContainText('Pieterpad Etappe 1');

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('.saved-route-item')).toHaveCount(2);
  });

  test('edits route metadata in modal: promotes draft to definitive with marketplace price', async ({
    page,
  }) => {
    // Open library
    await page.locator('#btn-open-route-library-sidebar').click();
    await expect(page.locator('#route-library-modal')).toBeVisible();

    // Click "Beheren" on first route (Veluwezoom Verkenning)
    const editBtn = page.locator('#btn-edit-metadata-route-concept-1');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // RouteMetadataModal should open
    const metadataModal = page.locator('#route-metadata-modal');
    await expect(metadataModal).toBeVisible();

    // Update status to definitive and set price to 3.50
    const statusSelect = page.locator('#metadata-status-select');
    await statusSelect.selectOption('definitive');

    const priceInput = page.locator('#metadata-price-input');
    await priceInput.fill('3.50');

    const locationInput = page.locator('#metadata-location-input');
    await locationInput.fill('Gelderland, Veluwezoom Nationaal Park');

    // Submit
    const saveBtn = page.locator('#btn-save-metadata');
    await saveBtn.click();

    // Metadata modal should close and library item should reflect updated values
    await expect(metadataModal).not.toBeVisible();
    const updatedCard = page.locator('.saved-route-item').first();
    await expect(updatedCard).toContainText('Definitief');
    await expect(updatedCard).toContainText(/€3[.,]50/);
  });

  test('loads route from library onto canvas and reflects metadata on active route card', async ({
    page,
  }) => {
    // Open library and load Pieterpad
    await page.locator('#btn-open-route-library-sidebar').click();
    const loadBtn = page.locator('#btn-load-route-route-def-1');
    await expect(loadBtn).toBeVisible();
    await loadBtn.click();

    // Library modal closes
    await expect(page.locator('#route-library-modal')).not.toBeVisible();

    // Active route card should now be displayed in sidebar with metadata
    const activeCard = page.locator('#loaded-route-card');
    await expect(activeCard).toBeVisible();
    await expect(page.locator('#route-title')).toHaveText('Pieterpad Etappe 1');
    await expect(page.locator('#active-route-status-badge')).toContainText('Definitief');
    await expect(activeCard).toContainText('Groningen');
    await expect(activeCard).toContainText(/€2[.,]99/);
  });

  test('uploads and stitches multiple GPX files together, updating stage count and distance', async ({
    page,
  }) => {
    const gpx1 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HikingCompanion">
  <trk><name>Etappe Noord</name><trkseg>
    <trkpt lat="52.00" lon="5.00"><ele>10</ele></trkpt>
    <trkpt lat="52.05" lon="5.05"><ele>25</ele></trkpt>
  </trkseg></trk>
</gpx>`;

    const gpx2 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HikingCompanion">
  <trk><name>Etappe Zuid</name><trkseg>
    <trkpt lat="52.05" lon="5.05"><ele>25</ele></trkpt>
    <trkpt lat="52.10" lon="5.10"><ele>40</ele></trkpt>
  </trkseg></trk>
</gpx>`;

    const fileInput = page.locator('#gpx-file-input');
    await fileInput.setInputFiles([
      { name: 'etappe-noord.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(gpx1) },
      { name: 'etappe-zuid.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(gpx2) },
    ]);

    // Choose to import each file as a separate stage in multi-file modal
    const separateBtn = page.locator('#btn-choice-separate-stages');
    await expect(separateBtn).toBeVisible({ timeout: 10000 });
    await separateBtn.click();

    // Active route card should appear with stitched title and 2 stages
    const activeCard = page.locator('#loaded-route-card');
    await expect(activeCard).toBeVisible({ timeout: 10000 });

    const titleEl = page.locator('#route-title');
    await expect(titleEl).toContainText('Etappe Noord & Etappe Zuid');

    const stageStat = page.locator('#stat-stage-count');
    await expect(stageStat).toHaveText('2');

    const distStat = page.locator('#stat-total-distance');
    await expect(distStat).toBeVisible();
  });

  test('displays spacious routes table and exports route directly as GPX file', async ({
    page,
  }) => {
    // Open library
    await page.locator('#btn-open-route-library-sidebar').click();
    const libraryModal = page.locator('#route-library-modal');
    await expect(libraryModal).toBeVisible();

    // Verify spacious table structure and header columns
    const table = page.locator('#saved-routes-table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead th')).toHaveCount(7);

    // Verify export button exists and triggers GPX file download
    const exportBtn = page.locator('#btn-export-route-route-concept-1');
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Veluwezoom Verkenning.gpx');
  });

  test('confirms route deletion and announces the deleted route', async ({ page }) => {
    await page.route('**/api/routes/route-concept-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
        return;
      }
      await route.continue();
    });

    await page.locator('#btn-open-route-library-sidebar').click();
    const deleteButton = page.locator('#btn-delete-route-route-concept-1');
    await deleteButton.click();

    const confirmation = page.getByRole('alertdialog');
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('Veluwezoom Verkenning');
    await confirmation.getByRole('button', { name: 'Verwijderen' }).click();

    await expect(page.locator('#saved-routes-list')).not.toContainText('Veluwezoom Verkenning');
    await expect(page.getByRole('status')).toContainText('Route "Veluwezoom Verkenning" is verwijderd.');
  });

  test('keeps a failed deletion dialog open with an inline request error', async ({ page }) => {
    await page.route('**/api/routes/route-concept-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Verwijderen mislukt.' }),
        });
        return;
      }
      await route.continue();
    });

    await page.locator('#btn-open-route-library-sidebar').click();
    await page.locator('#btn-delete-route-route-concept-1').click();
    const confirmation = page.getByRole('alertdialog');
    await confirmation.getByRole('button', { name: 'Verwijderen' }).click();

    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('Fout bij verwijderen van route.');
  });

  test('shows a persistent error toast when route export fails', async ({ page }) => {
    await page.route('**/api/routes/route-def-1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 500 });
        return;
      }
      await route.continue();
    });

    await page.locator('#btn-open-route-library-sidebar').click();
    await page.locator('#btn-export-route-route-def-1').click();

    const errorToast = page.getByRole('alert');
    await expect(errorToast).toContainText('Kon route niet exporteren als GPX.');
    await page.waitForTimeout(4500);
    await expect(errorToast).toBeVisible();
    await errorToast.getByRole('button', { name: 'Melding sluiten' }).click();
    await expect(errorToast).not.toBeVisible();
  });
});
