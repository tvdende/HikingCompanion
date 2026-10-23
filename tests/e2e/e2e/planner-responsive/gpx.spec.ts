import type { Page } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPlanner, activate } from './fixtures';
import { expectDialogFits, expectPlannerLayout, expectUsable } from './layout';

const SAMPLE_GPX = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/sample-trail.gpx');

function gpxFile(name: string, tracks: [number, number][][]) {
  const trk = tracks
    .map(
      (points, i) =>
        `<trk><name>Track ${i + 1}</name><trkseg>${points
          .map(([lat, lon], j) => `<trkpt lat="${lat}" lon="${lon}"><ele>${20 + j}</ele></trkpt>`)
          .join('')}</trkseg></trk>`,
    )
    .join('');
  return {
    name,
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(`<?xml version="1.0"?><gpx version="1.1" creator="e2e"><metadata><name>${name}</name></metadata>${trk}</gpx>`),
  };
}

const TRACK_A: [number, number][] = [[52.1, 5.1], [52.11, 5.12], [52.12, 5.14]];
const TRACK_B: [number, number][] = [[52.12, 5.14], [52.13, 5.16], [52.14, 5.18]];

async function chooseFiles(page: Page, trigger: string, isTouch: boolean, files: string | ReturnType<typeof gpxFile>[]) {
  const chooser = page.waitForEvent('filechooser');
  await activate(page.locator(trigger), isTouch);
  await (await chooser).setFiles(files);
}

async function expectImportDialog(page: Page, isTouch: boolean, choices: string[]) {
  const dialog = page.locator('#gpx-import-modal-overlay [role="dialog"]');
  await expectDialogFits(dialog, choices.map((id) => dialog.locator(id)), isTouch);
  await expectPlannerLayout(page, isTouch);
  return dialog;
}

test.describe('Planner GPX import and export', () => {
  test('imports via the button, appends to the active route and exports', async ({ page, isTouch }) => {
    await openPlanner(page);
    await expectUsable(page.locator('#btn-import-gpx'), isTouch);
    await chooseFiles(page, '#btn-import-gpx', isTouch, SAMPLE_GPX);
    await expect(page.locator('#route-title')).toContainText('Veluwe Heuvelrug Trail');
    const before = parseInt(await page.locator('#stat-point-count').innerText(), 10);

    await expectUsable(page.locator('#btn-append-gpx'), isTouch);
    await chooseFiles(page, '#btn-append-gpx', isTouch, [gpxFile('extra.gpx', [TRACK_B])]);
    await expect.poll(async () => parseInt(await page.locator('#stat-point-count').innerText(), 10)).toBeGreaterThan(before);

    await expectUsable(page.locator('#btn-export-gpx'), isTouch);
    const download = page.waitForEvent('download');
    await activate(page.locator('#btn-export-gpx'), isTouch);
    expect((await download).suggestedFilename()).toMatch(/\.gpx$/);
    await expectPlannerLayout(page, isTouch);
  });

  test('shows the multi-file dialog and imports files as stages', async ({ page, isTouch }) => {
    await openPlanner(page);
    await page.locator('#gpx-file-input').setInputFiles([gpxFile('a.gpx', [TRACK_A]), gpxFile('b.gpx', [TRACK_B])]);
    const dialog = await expectImportDialog(page, isTouch, ['#btn-choice-separate-stages', '#btn-choice-merged-single']);
    await activate(dialog.locator('#btn-choice-separate-stages'), isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });

  test('shows the multi-track dialog and imports one merged route', async ({ page, isTouch }) => {
    await openPlanner(page);
    await page.locator('#gpx-file-input').setInputFiles([gpxFile('tracks.gpx', [TRACK_A, TRACK_B])]);
    const dialog = await expectImportDialog(page, isTouch, ['#btn-choice-separate-stages', '#btn-choice-merged-single']);
    await activate(dialog.locator('#btn-choice-merged-single'), isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('1');
  });

  test('shows the append-choice dialog for an import on top of an active route', async ({ page, isTouch }) => {
    await openPlanner(page);
    await page.locator('#gpx-file-input').setInputFiles(SAMPLE_GPX);
    await expect(page.locator('#loaded-route-card')).toBeVisible();
    await page.locator('#gpx-file-input').setInputFiles([gpxFile('next.gpx', [TRACK_B])]);
    const dialog = await expectImportDialog(page, isTouch, ['#btn-choice-new-stage', '#btn-choice-append-active']);
    await activate(dialog.locator('#btn-choice-new-stage'), isTouch);
    await expect(page.locator('#stat-stage-count')).toHaveText('2');
  });

  test('shows the error banner for an invalid file', async ({ page, isTouch }) => {
    await openPlanner(page);
    await page.locator('#gpx-file-input').setInputFiles({
      name: 'corrupt.gpx',
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from('<broken-xml>no tracks</broken-xml>'),
    });
    const banner = page.locator('#gpx-error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toBeInViewport({ ratio: 1 });
    await expectPlannerLayout(page, isTouch);
  });
});
