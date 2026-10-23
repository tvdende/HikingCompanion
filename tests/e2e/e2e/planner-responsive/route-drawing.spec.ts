import type { Page } from '@playwright/test';
import { test, expect, openPlanner, activate, drawRoute, tapAt, mapPoint, openMapPopup } from './fixtures';
import { expectMapArea, expectNoOverlap, expectPlannerLayout, expectUsable } from './layout';

const TOOLBAR_ACTIONS = [
  '#btn-toggle-edit-mode',
  '#btn-mode-snap',
  '#btn-mode-direct',
  '#btn-undo',
  '#btn-redo',
  '#btn-center-route',
  '#btn-reverse-route',
  '#btn-clear-editor',
  '#btn-save-route',
  '#btn-open-route-library',
  '#btn-edit-metadata-toolbar',
];

async function pointCount(page: Page) {
  return parseInt(await page.locator('#stat-point-count').innerText(), 10);
}

async function markerCenter(page: Page, index: number) {
  const box = (await page.locator(`#waypoint-marker-${index}`).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe('Planner route drawing', () => {
  test('every toolbar action is reachable and the map keeps enough room', async ({ page, isTouch }) => {
    await openPlanner(page);
    await activate(page.locator('#btn-new-route'), isTouch);
    await expect(page.locator('#btn-toggle-edit-mode')).toHaveAttribute('aria-pressed', 'true');
    await drawRoute(page, isTouch);

    for (const id of TOOLBAR_ACTIONS) {
      const action = page.locator(id);
      await expectUsable(action, isTouch);
      await expect(action).toHaveAccessibleName(/\S/);
    }
    await expectNoOverlap(page.locator('#route-editor-toolbar'), page.locator('#planner-panel'));
    await expectNoOverlap(page.locator('#route-editor-toolbar'), page.locator('.maplibregl-ctrl-top-right'));
    await expectMapArea(page);
    await expectPlannerLayout(page, isTouch);
  });

  test('adds, inserts, drags and deletes waypoints with undo and redo', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);
    expect(await pointCount(page)).toBe(3);

    const handle = page.locator('.route-split-handle').first();
    await expect(handle).toBeVisible();
    await activate(handle, isTouch);
    await expect.poll(() => pointCount(page)).toBe(4);

    // Playwright has no touch-drag API; MapLibre markers accept mouse drags on every device.
    // Drag up and to the right, away from the next waypoint, so the markers never stack on small maps.
    const before = await markerCenter(page, 1);
    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    await page.mouse.move(before.x + 30, before.y - 25, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => (await markerCenter(page, 1)).x).toBeGreaterThan(before.x + 15);
    expect(await pointCount(page)).toBe(4);

    const deletePoint = await openMapPopup(page, page.locator('#waypoint-marker-2'), isTouch, '.waypoint-popup-delete-btn');
    const popup = page.locator('.maplibregl-popup');
    await expectUsable(popup.locator('.waypoint-popup-split-btn'), isTouch);
    await expectUsable(deletePoint, isTouch);
    await expectPlannerLayout(page, isTouch);
    await activate(deletePoint, isTouch);
    await expect.poll(() => pointCount(page)).toBe(3);

    await activate(page.locator('#btn-undo'), isTouch);
    await expect.poll(() => pointCount(page)).toBe(4);
    await activate(page.locator('#btn-redo'), isTouch);
    await expect.poll(() => pointCount(page)).toBe(3);
  });

  test('splits a stage from the waypoint popup', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);

    const split = await openMapPopup(page, page.locator('#waypoint-marker-1'), isTouch, '.waypoint-popup-split-btn');
    await expectUsable(split, isTouch);
    await activate(split, isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });

  test('switches routing mode, reverses, toggles editing and clears the route', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);

    await activate(page.locator('#btn-mode-direct'), isTouch);
    await expect(page.locator('#btn-mode-direct')).toHaveAttribute('aria-checked', 'true');
    await tapAt(page, isTouch, await mapPoint(page, 0.7, 0.85));
    await expect.poll(() => pointCount(page)).toBe(4);
    await activate(page.locator('#btn-mode-snap'), isTouch);
    await expect(page.locator('#btn-mode-snap')).toHaveAttribute('aria-checked', 'true');

    const first = await markerCenter(page, 0);
    const last = await markerCenter(page, 3);
    await activate(page.locator('#btn-reverse-route'), isTouch);
    await expect.poll(async () => Math.round((await markerCenter(page, 0)).x)).toBe(Math.round(last.x));
    expect(Math.round((await markerCenter(page, 3)).x)).toBe(Math.round(first.x));

    await activate(page.locator('#btn-toggle-edit-mode'), isTouch);
    await expect(page.locator('#btn-toggle-edit-mode')).toHaveAttribute('aria-pressed', 'false');
    await tapAt(page, isTouch, await mapPoint(page, 0.3, 0.8));
    expect(await pointCount(page)).toBe(4);
    await activate(page.locator('#btn-toggle-edit-mode'), isTouch);
    await expect(page.locator('#btn-toggle-edit-mode')).toHaveAttribute('aria-pressed', 'true');

    await activate(page.locator('#btn-clear-editor'), isTouch);
    await expect(page.locator('#waypoint-marker-0')).toHaveCount(0);
    await expectPlannerLayout(page, isTouch);
  });
});
