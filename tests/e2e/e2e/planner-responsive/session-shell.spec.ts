import { test, expect, openPlanner, activate, drawRoute } from './fixtures';
import { expectMapArea, expectNoOverlap, expectPlannerLayout, expectUsable } from './layout';

test.describe('Planner shell and session', () => {
  test('opens the planner with header, map, panel and primary actions usable', async ({ page, isTouch }) => {
    await openPlanner(page);

    await expect(page.locator('#app-header')).toBeVisible();
    await expect(page.locator('#header-brand')).toHaveCount(1);
    for (const id of ['#btn-new-route', '#btn-import-gpx', '#btn-open-route-library-sidebar', '#route-editor-toolbar']) {
      await expectUsable(page.locator(id), isTouch);
    }
    await expectNoOverlap(page.locator('#route-editor-toolbar'), page.locator('#planner-panel'));
    await expectNoOverlap(page.locator('#route-editor-toolbar'), page.locator('.maplibregl-ctrl-top-right'));
    await expectMapArea(page);
    await expectPlannerLayout(page, isTouch);
  });

  test('opens the profile menu, logs out and logs in again as planner', async ({ page, isTouch }) => {
    await openPlanner(page);

    const trigger = page.locator('#user-profile-trigger');
    await expectUsable(trigger, isTouch);
    await activate(trigger, isTouch);
    const menu = page.locator('#user-profile-dropdown');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('planner@hiking.test');
    await expectPlannerLayout(page, isTouch);
    await expectUsable(page.locator('#btn-header-logout'), isTouch);
    await activate(page.locator('#btn-header-logout'), isTouch);

    await expect(page.locator('#planner-panel')).toHaveCount(0);
    const login = page.locator('#btn-open-login');
    await expectUsable(login, isTouch);
    await activate(login, isTouch);
    const mockPlanner = page.locator('#btn-mock-planner');
    await expectUsable(mockPlanner, isTouch);
    await activate(mockPlanner, isTouch);

    await expect(page.locator('#planner-panel')).toBeVisible();
    await expect(page.locator('#header-user-name')).toHaveText('Robin Planner');
  });

  test('switches between Planner and Companion mode', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);

    await activate(page.locator('#mode-switch-companion'), isTouch);
    await expect(page.locator('#companion-hud')).toBeVisible();
    await expect(page.locator('#planner-panel')).toHaveCount(0);
    await expect(page.locator('#route-editor-toolbar')).toHaveCount(0);
    await expectPlannerLayout(page, isTouch);

    await activate(page.locator('#mode-switch-planner'), isTouch);
    await expect(page.locator('#planner-panel')).toBeVisible();
    await expect(page.locator('#stat-point-count')).toContainText('3');
  });

  test('switches the planner language between Dutch and English', async ({ page, isTouch }) => {
    await openPlanner(page);
    await expect(page.locator('#btn-new-route')).toContainText('Nieuwe Route Tekenen');

    await expectUsable(page.locator('#lang-btn-en'), isTouch);
    await activate(page.locator('#lang-btn-en'), isTouch);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#btn-new-route')).toContainText('Draw New Route');
    await expectPlannerLayout(page, isTouch);

    await drawRoute(page, isTouch);
    await expectPlannerLayout(page, isTouch);

    await activate(page.locator('#lang-btn-nl'), isTouch);
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
  });

  test('expands and collapses the planner bottom sheet on mobile', async ({ page, isTouch, category }) => {
    test.skip(category !== 'mobile', 'The bottom sheet only exists in the compact layout tier');
    await openPlanner(page);

    const toggle = page.locator('#planner-sheet-toggle');
    await expectUsable(toggle, isTouch);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Paneel vergroten');
    const collapsed = (await page.locator('#planner-panel').boundingBox())!.height;

    await activate(toggle, isTouch);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Paneel verkleinen');
    await expect.poll(async () => (await page.locator('#planner-panel').boundingBox())!.height).toBeGreaterThan(collapsed * 1.5);
    await expectPlannerLayout(page, isTouch);

    await activate(toggle, isTouch);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expectMapArea(page);
    await expectPlannerLayout(page, isTouch);
  });
});
