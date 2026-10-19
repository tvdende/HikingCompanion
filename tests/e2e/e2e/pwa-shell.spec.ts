import { test, expect } from '@playwright/test';

test.describe('PWA Application Shell & Mode Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the application shell with header and brand', async ({ page }) => {
    const brand = page.locator('#header-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText('Hiking Companion');
  });

  test('starts in Planner Mode by default', async ({ page }) => {
    const plannerBtn = page.locator('#mode-switch-planner');
    const plannerPanel = page.locator('#planner-panel');
    const companionHud = page.locator('#companion-hud');

    await expect(plannerBtn).toHaveClass(/active/);
    await expect(plannerPanel).toBeVisible();
    await expect(companionHud).not.toBeVisible();
  });

  test('toggles cleanly between Planner Mode and Companion Mode', async ({ page }) => {
    const plannerBtn = page.locator('#mode-switch-planner');
    const companionBtn = page.locator('#mode-switch-companion');
    const plannerPanel = page.locator('#planner-panel');
    const companionHud = page.locator('#companion-hud');

    // Switch to Companion Mode
    await companionBtn.click();
    await expect(companionBtn).toHaveClass(/active/);
    await expect(plannerBtn).not.toHaveClass(/active/);
    await expect(companionHud).toBeVisible();
    await expect(plannerPanel).not.toBeVisible();

    // Switch back to Planner Mode
    await plannerBtn.click();
    await expect(plannerBtn).toHaveClass(/active/);
    await expect(plannerPanel).toBeVisible();
    await expect(companionHud).not.toBeVisible();
  });
});
