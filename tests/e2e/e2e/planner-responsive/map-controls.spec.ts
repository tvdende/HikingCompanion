import { test, expect, openPlanner, activate, drawRoute } from './fixtures';
import { expectNoOverlap, expectPlannerLayout, expectUsable } from './layout';

test.describe('Planner map controls', () => {
  test('zoom, compass, locate and center-on-route are reachable, uncovered and usable', async ({ page, context, isTouch }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 52.09, longitude: 5.12 });
    await openPlanner(page);

    const zoomIn = page.locator('.maplibregl-ctrl-zoom-in');
    const zoomOut = page.locator('.maplibregl-ctrl-zoom-out');
    const compass = page.locator('.maplibregl-ctrl-compass');
    const locate = page.locator('#btn-locate-user');
    for (const control of [zoomIn, zoomOut, compass, locate]) await expectUsable(control, isTouch);
    await expectNoOverlap(page.locator('.maplibregl-ctrl-top-right'), page.locator('#route-editor-toolbar'));
    await expectNoOverlap(locate, page.locator('#planner-panel'));

    await activate(zoomIn, isTouch);
    await activate(zoomOut, isTouch);
    await activate(compass, isTouch);
    await activate(locate, isTouch);
    await expect(page.getByRole('alert')).toHaveCount(0);

    await drawRoute(page, isTouch);
    const center = page.locator('#btn-center-route');
    await expectUsable(center, isTouch);
    await activate(zoomIn, isTouch);
    await activate(center, isTouch);
    await expect(page.locator('#waypoint-marker-0')).toBeInViewport();
    await expectPlannerLayout(page, isTouch);
  });
});
