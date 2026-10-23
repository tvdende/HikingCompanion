import type { Page } from '@playwright/test';
import { test, expect, openPlanner, activate, drawRoute } from './fixtures';
import { expectDialogFits, expectPlannerLayout, expectUsable } from './layout';

const libraryCard = (page: Page) => page.locator('#route-library-modal .library-modal-card');

async function openLibrary(page: Page, isTouch: boolean, trigger = '#btn-open-route-library-sidebar') {
  await activate(page.locator(trigger), isTouch);
  const card = libraryCard(page);
  await expect(card.locator('#saved-routes-table')).toBeVisible();
  return card;
}

test.describe('Planner save and route library', () => {
  test('saves a drawn route with all dialog fields', async ({ page, isTouch, api }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);
    await activate(page.locator('#btn-save-route'), isTouch);

    const dialog = page.locator('#save-route-modal .modal-content');
    const fields = ['#input-route-title', '#save-route-status', '#save-route-price', '#save-route-location', '#save-route-description'];
    await expectDialogFits(dialog, [...fields, '#btn-cancel-save-route', '#btn-confirm-save-route'].map((id) => dialog.locator(id)), isTouch);
    await expectPlannerLayout(page, isTouch);

    await dialog.locator('#input-route-title').fill('Utrechtse Heuvelrug');
    await dialog.locator('#save-route-status').selectOption('definitive');
    await dialog.locator('#save-route-price').fill('4.50');
    await dialog.locator('#save-route-location').fill('Amerongen');
    await dialog.locator('#save-route-description').fill('Rondje over de stuwwal.');
    await activate(dialog.locator('#btn-confirm-save-route'), isTouch);

    await expect(page.locator('#save-route-modal')).toHaveCount(0);
    await expect(page.locator('#route-title')).toHaveText('Utrechtse Heuvelrug');
    await expect(page.locator('#active-route-status-badge')).toBeVisible();
    expect([...api.routes.values()].some((route) => route.title === 'Utrechtse Heuvelrug')).toBe(true);
  });

  test('searches, filters, loads and exports routes from the library', async ({ page, isTouch, category }) => {
    await openPlanner(page);
    const card = await openLibrary(page, isTouch);
    await expectDialogFits(card, [card.locator('#library-search-input'), card.locator('#tab-filter-all')], isTouch);
    await expectPlannerLayout(page, isTouch);

    if (category === 'mobile' || category === 'tablet') {
      // The wide table scrolls inside its own container; the page itself never scrolls sideways.
      const container = card.locator('.library-table-container');
      const scroll = await container.evaluate((el) => ({ overflow: getComputedStyle(el).overflowX, scrollable: el.scrollWidth > el.clientWidth }));
      if (scroll.scrollable) expect(scroll.overflow).toMatch(/auto|scroll/);
    }

    const rows = card.locator('#saved-routes-list tr');
    await expect(rows).toHaveCount(2);
    await card.locator('#library-search-input').fill('Pieter');
    await expect(rows).toHaveCount(1);
    await card.locator('#library-search-input').fill('');

    for (const [tab, count] of [['#tab-filter-draft', 1], ['#tab-filter-definitive', 1], ['#tab-filter-all', 2]] as const) {
      await expectUsable(card.locator(tab), isTouch);
      await activate(card.locator(tab), isTouch);
      await expect(rows).toHaveCount(count);
    }

    const exportButton = card.locator('#btn-export-route-route-final-pieterpad');
    await expectUsable(exportButton, isTouch);
    const download = page.waitForEvent('download');
    await activate(exportButton, isTouch);
    expect((await download).suggestedFilename()).toMatch(/\.gpx$/);

    const load = card.locator('#btn-load-route-route-final-pieterpad');
    await expectUsable(load, isTouch);
    await activate(load, isTouch);
    await expect(page.locator('#route-library-modal')).toHaveCount(0);
    await expect(page.locator('#route-title')).toHaveText('Pieterpad Etappe 1');
    await expectPlannerLayout(page, isTouch);
  });

  test('edits metadata and deletes a route from the library', async ({ page, isTouch }) => {
    await openPlanner(page);
    const card = await openLibrary(page, isTouch);

    await activate(card.locator('#btn-edit-metadata-route-draft-veluwe'), isTouch);
    const metadata = page.locator('#route-metadata-modal .modal-content');
    const fields = ['#metadata-title-input', '#metadata-status-select', '#metadata-price-input', '#metadata-location-input', '#metadata-description-textarea', '#btn-save-metadata'];
    await expectDialogFits(metadata, fields.map((id) => metadata.locator(id)), isTouch);
    await expectPlannerLayout(page, isTouch);
    await metadata.locator('#metadata-location-input').fill('Apeldoorn');
    await activate(metadata.locator('#btn-save-metadata'), isTouch);
    await expect(page.locator('#route-metadata-modal')).toHaveCount(0);

    const remove = card.locator('#btn-delete-route-route-draft-veluwe');
    await expectUsable(remove, isTouch);
    await activate(remove, isTouch);
    const confirmation = page.getByRole('alertdialog');
    const confirm = confirmation.getByRole('button', { name: 'Verwijderen' });
    await expectDialogFits(confirmation, [confirm], isTouch);
    await expectPlannerLayout(page, isTouch);
    await activate(confirm, isTouch);
    await expect(card.locator('#saved-routes-list tr')).toHaveCount(1);
  });

  test('opens metadata from the toolbar for the active route', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);
    await activate(page.locator('#btn-edit-metadata-toolbar'), isTouch);
    const metadata = page.locator('#route-metadata-modal .modal-content');
    await expectDialogFits(metadata, [metadata.locator('#metadata-status-select'), metadata.locator('#btn-save-metadata')], isTouch);
  });
});
