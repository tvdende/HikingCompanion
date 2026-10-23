import { test, expect } from '@playwright/test';

test.describe('PWA Application Shell & Mode Switcher', () => {
  const mockUser = {
    id: 'user-123',
    email: 'hiker@example.com',
    name: 'Test Hiker',
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  test('renders the application shell with header and brand', async ({ page }) => {
    await page.goto('/');
    const brand = page.locator('#header-brand');
    await expect(brand).toHaveText('Hiking Companion');
    // Compact screens (< 768px) show only the brand icon; the title is hidden to save space.
    if ((page.viewportSize()?.width ?? 1280) >= 768) {
      await expect(brand).toBeVisible();
    } else {
      await expect(page.locator('#app-header .brand-icon')).toBeVisible();
    }
  });

  test('renders guest product showcase when unauthenticated', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });
    await page.goto('/');

    const landingPage = page.locator('#landing-page');
    await expect(landingPage).toBeVisible();
    await expect(page.locator('#feature-card-gpx-engine')).toBeVisible();
    await expect(page.locator('#demo-showcase')).toBeVisible();
    await expect(page.locator('#planner-panel')).not.toBeVisible();
    await expect(page.locator('#mode-switch-planner')).not.toBeVisible();
  });

  test('switches interactive demo tabs on landing page', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });
    await page.goto('/');

    const tabModes = page.locator('#tab-btn-modes-demo');
    await tabModes.click();
    await expect(tabModes).toHaveClass(/active/);
    await expect(page.locator('.simulation-modes')).toBeVisible();

    const tabOffline = page.locator('#tab-btn-offline-demo');
    await tabOffline.click();
    await expect(tabOffline).toHaveClass(/active/);
    await expect(page.locator('.simulation-offline')).toBeVisible();
  });

  test('starts in Planner Mode by default when authenticated', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: mockUser } });
    });
    await page.goto('/');

    const plannerBtn = page.locator('#mode-switch-planner');
    const plannerPanel = page.locator('#planner-panel');
    const companionHud = page.locator('#companion-hud');

    await expect(plannerBtn).toBeVisible();
    await expect(plannerBtn).toHaveClass(/active/);
    await expect(plannerPanel).toBeVisible();
    await expect(companionHud).not.toBeVisible();
  });

  test('toggles cleanly between Planner Mode and Companion Mode when authenticated', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: mockUser } });
    });
    await page.goto('/');

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
