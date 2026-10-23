import { test, expect, openPlanner, activate, drawRoute } from './fixtures';
import { expectPlannerLayout, expectUsable } from './layout';

test.describe('Planner route summary and surface', () => {
  test('shows statistics and status, analyzes the surface and toggles the map layer', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);

    const card = page.locator('#loaded-route-card');
    await expect(card).toBeVisible();
    for (const id of ['#stat-total-distance', '#stat-elevation-gain', '#stat-elevation-loss', '#stat-stage-count', '#stat-point-count']) {
      await expect(page.locator(id)).toBeVisible();
    }
    expect(parseFloat(await page.locator('#stat-total-distance').innerText())).toBeGreaterThan(0);
    await expect(page.locator('#active-route-status-badge')).toBeVisible();
    await expectPlannerLayout(page, isTouch);

    // A drawn route may already include a breakdown; otherwise it is requested on demand.
    const analyze = card.getByRole('button', { name: 'Analyseer ondergrond' });
    if (await analyze.isVisible()) {
      await expectUsable(analyze, isTouch);
      await activate(analyze, isTouch);
    }
    const surface = card.getByRole('region', { name: 'Ondergrondverdeling' });
    await expect(surface).toBeVisible();

    const showOnMap = surface.getByRole('button', { name: 'Toon ondergrond op kaart' });
    await expectUsable(showOnMap, isTouch);
    await activate(showOnMap, isTouch);
    const showStages = surface.getByRole('button', { name: 'Toon etappes' });
    await expectUsable(showStages, isTouch);
    await activate(showStages, isTouch);
    await expect(surface.getByRole('button', { name: 'Toon ondergrond op kaart' })).toBeVisible();
    await expectPlannerLayout(page, isTouch);
  });

  test('closes the active route from the summary card', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);

    const close = page.locator('#btn-clear-route');
    await expectUsable(close, isTouch);
    await activate(close, isTouch);
    await expect(page.locator('#loaded-route-card')).toHaveCount(0);
    await expect(page.locator('#btn-new-route')).toBeVisible();
  });
});
