import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPlanner, activate, drawRoute, openMapPopup } from './fixtures';
import { expectPlannerLayout } from './layout';
import { captureStep } from './screenshots';

const SAMPLE_GPX = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/sample-trail.gpx');

test('planner journey with documentation screenshots', async ({ page, isTouch }, testInfo) => {
  test.setTimeout(120_000);
  await openPlanner(page);
  await expectPlannerLayout(page, isTouch);
  await captureStep(page, testInfo, '01-planner-empty');

  await activate(page.locator('#btn-new-route'), isTouch);
  await expect(page.locator('#btn-toggle-edit-mode')).toHaveAttribute('aria-pressed', 'true');
  await captureStep(page, testInfo, '02-editing-toolbar');

  await drawRoute(page, isTouch);
  await expectPlannerLayout(page, isTouch);
  await captureStep(page, testInfo, '03-route-drawn');

  const split = await openMapPopup(page, page.locator('#waypoint-marker-1'), isTouch, '.waypoint-popup-split-btn');
  await captureStep(page, testInfo, '04-waypoint-popup');
  await activate(split, isTouch);
  await expect(page.locator('#stat-stage-count')).toHaveText('2');
  await page.locator('#stage-card-2').scrollIntoViewIfNeeded();
  await captureStep(page, testInfo, '05-multi-stage-panel');

  const analyze = page.locator('#loaded-route-card').getByRole('button', { name: 'Analyseer ondergrond' });
  if (await analyze.isVisible()) await activate(analyze, isTouch);
  const surface = page.getByRole('region', { name: 'Ondergrondverdeling' });
  await expect(surface).toBeVisible();
  await activate(surface.getByRole('button', { name: 'Toon ondergrond op kaart' }), isTouch);
  await surface.scrollIntoViewIfNeeded();
  await captureStep(page, testInfo, '06-route-summary-surface');
  await activate(surface.getByRole('button', { name: 'Toon etappes' }), isTouch);

  await page.locator('#gpx-file-input').setInputFiles(SAMPLE_GPX);
  const gpxDialog = page.locator('#gpx-import-modal-overlay [role="dialog"]');
  await expect(gpxDialog).toBeVisible();
  await captureStep(page, testInfo, '07-gpx-import-dialog');
  await activate(gpxDialog.getByRole('button', { name: /annuleren/i }).last(), isTouch);
  await expect(gpxDialog).toHaveCount(0);

  await activate(page.locator('#btn-save-route'), isTouch);
  await page.locator('#input-route-title').fill('Rondje Veluwezoom');
  await captureStep(page, testInfo, '08-save-route-dialog');
  await activate(page.locator('#btn-confirm-save-route'), isTouch);
  await expect(page.locator('.toast-viewport [role="status"]').first()).toBeVisible();
  await captureStep(page, testInfo, '09-success-toast');

  await activate(page.locator('#btn-open-route-library'), isTouch);
  await expect(page.locator('#saved-routes-table')).toBeVisible();
  await captureStep(page, testInfo, '10-route-library');

  await activate(page.locator('#btn-edit-metadata-route-draft-veluwe'), isTouch);
  await expect(page.locator('#route-metadata-modal')).toBeVisible();
  await captureStep(page, testInfo, '11-metadata-dialog');
  await page.keyboard.press('Escape');
  if (await page.locator('#route-metadata-modal').count()) {
    await activate(page.locator('#route-metadata-modal .modal-close-btn'), isTouch);
  }
  await expect(page.locator('#route-metadata-modal')).toHaveCount(0);

  await activate(page.locator('#btn-delete-route-route-draft-veluwe'), isTouch);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await captureStep(page, testInfo, '12-delete-confirmation');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await activate(page.locator('#route-library-modal .modal-close-btn'), isTouch);
  await expect(page.locator('#route-library-modal')).toHaveCount(0);

  await activate(page.locator('#mode-switch-companion'), isTouch);
  await expect(page.locator('#companion-hud')).toBeVisible();
  await captureStep(page, testInfo, '13-companion-mode');

  await activate(page.locator('#mode-switch-planner'), isTouch);
  await activate(page.locator('#lang-btn-en'), isTouch);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectPlannerLayout(page, isTouch);
  await captureStep(page, testInfo, '14-planner-english');
});
