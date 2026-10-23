import { test, expect, openPlanner, activate, drawRoute } from './fixtures';
import { expectDialogFits, expectNoOverlap, expectPlannerLayout, expectUsable } from './layout';

test.describe('Planner feedback', () => {
  test('success toast stays clear of the toolbar and map controls', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);
    await activate(page.locator('#btn-save-route'), isTouch);
    await page.locator('#input-route-title').fill('Toast route');
    await activate(page.locator('#btn-confirm-save-route'), isTouch);

    const toast = page.locator('.toast-viewport [role="status"]').filter({ hasText: 'Toast route' });
    await expect(toast).toBeVisible();
    // Status toasts auto-dismiss after 4 seconds; focusing the toast pauses that timer.
    await toast.locator('.toast-dismiss').focus();
    await expectUsable(toast.locator('.toast-dismiss'), isTouch);
    await expect(toast).toBeInViewport({ ratio: 1 });
    await expectNoOverlap(toast, page.locator('#route-editor-toolbar'));
    await expectNoOverlap(toast, page.locator('.maplibregl-ctrl-top-right'));
    await expectNoOverlap(toast, page.locator('#app-header'));
    await expectPlannerLayout(page, isTouch);
  });

  test('error toast is readable and dismissible', async ({ page, isTouch }) => {
    await openPlanner(page);
    await page.route('**/api/routes', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, json: { error: 'Opslaan mislukt' } })
        : route.fallback(),
    );
    await drawRoute(page, isTouch);
    await activate(page.locator('#btn-save-route'), isTouch);
    await page.locator('#input-route-title').fill('Kapotte route');
    await activate(page.locator('#btn-confirm-save-route'), isTouch);

    const alert = page.locator('#save-route-error, .toast-viewport [role="alert"]').first();
    await expect(alert).toBeVisible();
    await expect(alert).toBeInViewport({ ratio: 1 });
    const toastAlert = page.locator('.toast-viewport [role="alert"]');
    if (await toastAlert.count()) {
      await expectNoOverlap(toastAlert.first(), page.locator('#route-editor-toolbar'));
      const dismiss = toastAlert.first().locator('.toast-dismiss');
      await expectUsable(dismiss, isTouch);
      await activate(dismiss, isTouch);
      await expect(toastAlert).toHaveCount(0);
    }
    await expectPlannerLayout(page, isTouch);
  });

  test('confirmation dialog fits and restores focus when cancelled', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawRoute(page, isTouch);
    await activate(page.locator('#btn-add-new-stage'), isTouch);
    await expect(page.locator('#stage-card-2')).toBeVisible();

    const remove = page.locator('#stage-card-2 .stage-action-btn.delete');
    await remove.focus();
    await activate(remove, isTouch);
    const dialog = page.getByRole('alertdialog');
    await expectDialogFits(dialog, [dialog.getByRole('button', { name: 'Verwijderen' })], isTouch);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(remove).toBeFocused();
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });
});
