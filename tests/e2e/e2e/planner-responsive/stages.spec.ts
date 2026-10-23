import type { Page } from '@playwright/test';
import { test, expect, openPlanner, activate, drawRoute, tapAt, mapPoint, openMapPopup } from './fixtures';
import { expectPlannerLayout, expectUsable, expectDialogFits } from './layout';

/** Draws stage 1 and adds stage 2 and 3, each with their own waypoints. */
async function drawThreeStages(page: Page, isTouch: boolean) {
  await drawRoute(page, isTouch, [
    [0.1, 0.2],
    [0.3, 0.35],
  ]);
  const extraPoints: [number, number][][] = [
    [[0.5, 0.5]],
    [[0.75, 0.6]],
  ];
  let placed = 2;
  for (const [stageIndex, points] of extraPoints.entries()) {
    await activate(page.locator('#btn-add-new-stage'), isTouch);
    await expect(page.locator(`#stage-card-${stageIndex + 2}`)).toBeVisible();
    for (const [fx, fy] of points) {
      const point = await mapPoint(page, fx, fy);
      const expected = ++placed;
      // Retry a tap swallowed under load; wait for the count first so a waypoint is never added twice.
      await expect(async () => {
        if ((await statPoints(page)) < expected) await tapAt(page, isTouch, point);
        await expect.poll(() => statPoints(page), { timeout: 2000 }).toBe(expected);
      }).toPass({ timeout: 10_000 });
    }
  }
  await expect(page.locator('#stat-stage-count')).toHaveText('3');
  await expect(page.locator('#stat-point-count')).toContainText('4');
}

const titles = (page: Page) => page.locator('.stage-card .stage-title-input').evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
const statPoints = async (page: Page) => parseInt(await page.locator('#stat-point-count').innerText(), 10);

test.describe('Planner stages', () => {
  test('adds, selects, renames, annotates and changes transport of stages', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawThreeStages(page, isTouch);

    const card1 = page.locator('#stage-card-1');
    await activate(card1.locator('.stage-badge-tag'), isTouch);
    await expect(card1).toHaveClass(/is-active/);

    const title = card1.locator('.stage-title-input');
    await expectUsable(title, isTouch);
    await title.fill('Etappe Noord');
    await expect(title).toHaveValue('Etappe Noord');

    const notesToggle = card1.locator('.stage-notes-toggle-btn');
    await expectUsable(notesToggle, isTouch);
    await activate(notesToggle, isTouch);
    const notes = card1.locator('.stage-notes-input');
    await expectUsable(notes, isTouch);
    await notes.fill('Water bijvullen in Ede');
    await expect(notes).toHaveValue('Water bijvullen in Ede');

    const transport = page.locator('#stage-card-2 .transport-select');
    await expectUsable(transport, isTouch);
    await transport.selectOption('train');
    await expect(transport).toHaveValue('train');

    await expectUsable(page.locator('#btn-view-full-route'), isTouch);
    await activate(page.locator('#btn-view-full-route'), isTouch);
    await expectPlannerLayout(page, isTouch);
  });

  test('reorders stages with the step buttons, and by dragging on pointer devices', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawThreeStages(page, isTouch);
    await page.locator('#stage-card-1 .stage-title-input').fill('A');
    await page.locator('#stage-card-2 .stage-title-input').fill('B');
    await page.locator('#stage-card-3 .stage-title-input').fill('C');

    const down = page.locator('.stage-card').nth(0).locator('.stage-step-btn').nth(1);
    await expectUsable(down, isTouch);
    await activate(down, isTouch);
    await expect.poll(() => titles(page)).toEqual(['B', 'A', 'C']);

    const up = page.locator('.stage-card').nth(2).locator('.stage-step-btn').nth(0);
    await expectUsable(up, isTouch);
    await activate(up, isTouch);
    await expect.poll(() => titles(page)).toEqual(['B', 'C', 'A']);

    // HTML5 drag-and-drop is a pointer interaction; touch devices reorder with the step buttons.
    if (!isTouch) {
      await page.locator('.stage-card').nth(2).locator('.stage-drag-handle').dragTo(page.locator('.stage-card').nth(0));
      await expect.poll(() => titles(page)).toEqual(['A', 'B', 'C']);
    }
  });

  test('merges stages from the panel and from the map transition popup', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawThreeStages(page, isTouch);

    const merge = page.locator('#stage-card-3 .stage-action-btn.merge');
    await expectUsable(merge, isTouch);
    await activate(merge, isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('2');

    await activate(page.locator('#btn-view-full-route'), isTouch);
    const badges = page.locator('.stage-transition-badge.transition-badge');
    await expect(badges).toHaveCount(1);
    const badge = badges.filter({ hasText: 'F1' });
    await expect(badge).toBeInViewport();
    const popupMerge = await openMapPopup(page, badge, isTouch, '.stage-popup-merge-btn');
    await expectUsable(popupMerge, isTouch);
    await expectPlannerLayout(page, isTouch);
    await activate(popupMerge, isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('1');
  });

  test('deletes a stage after confirmation', async ({ page, isTouch }) => {
    await openPlanner(page);
    await drawThreeStages(page, isTouch);

    const remove = page.locator('#stage-card-2 .stage-action-btn.delete');
    await expectUsable(remove, isTouch);
    await activate(remove, isTouch);
    const dialog = page.getByRole('alertdialog');
    const confirm = dialog.getByRole('button', { name: 'Verwijderen' });
    await expectDialogFits(dialog, [confirm], isTouch);
    await expectPlannerLayout(page, isTouch);
    await activate(confirm, isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });
});
