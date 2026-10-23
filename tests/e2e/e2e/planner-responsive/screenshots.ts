import type { Page, TestInfo } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCREENSHOT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../screenshots/planner');

/**
 * Stores a documentation screenshot at screenshots/planner/<category>/<step>.png.
 * Screenshots are never compared with a baseline and never fail the test.
 */
export async function captureStep(page: Page, testInfo: TestInfo, step: string) {
  const category = String(testInfo.project.metadata?.category ?? testInfo.project.name);
  const file = resolve(SCREENSHOT_ROOT, category, `${step}.png`);
  try {
    mkdirSync(dirname(file), { recursive: true });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);
    // Gives MapLibre one more frame to paint tiles and route layers.
    await page.waitForTimeout(400);
    await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  } catch (error) {
    testInfo.annotations.push({ type: 'screenshot-failed', description: `${step}: ${String(error)}` });
  }
}
