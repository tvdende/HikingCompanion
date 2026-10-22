import { test, expect } from '@playwright/test';

test.describe('i18n Multi-Language Localization Flow', () => {
  test('strictly defaults to Dutch on first visit and reflects in HTML lang and UI strings', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });

    await page.goto('/');

    // 1. Check documentElement lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('nl');

    // 2. Check Dutch language button is active
    const nlBtn = page.locator('#lang-btn-nl');
    await expect(nlBtn).toBeVisible();
    await expect(nlBtn).toHaveAttribute('aria-pressed', 'true');

    // 3. Check Dutch texts on Header and Landing Page
    await expect(page.locator('#btn-open-login')).toContainText('Inloggen');
    await expect(page.locator('.landing-hero-title')).toContainText('Plan, Analyseer & Navigeer Jouw Trails');
    await expect(page.locator('#btn-hero-login')).toContainText('Inloggen / Account Openen');
    await expect(page.locator('#btn-hero-explore')).toContainText('Bekijk Functionaliteiten');
  });

  test('switches language to English and persists in localStorage and document title', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });

    await page.goto('/');

    // Click English switch
    await page.locator('#lang-btn-en').click();

    // 1. Verify HTML lang updated to en
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // 2. Verify English button is now active
    await expect(page.locator('#lang-btn-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lang-btn-nl')).toHaveAttribute('aria-pressed', 'false');

    // 3. Verify UI strings translated to English
    await expect(page.locator('#btn-open-login')).toContainText('Log in');
    await expect(page.locator('.landing-hero-title')).toContainText('Plan, Analyze & Navigate Your Trails');
    await expect(page.locator('#btn-hero-login')).toContainText('Log in / Create Account');
    await expect(page.locator('#btn-hero-explore')).toContainText('Explore Features');

    // 4. Verify localStorage persistence
    const storedLocale = await page.evaluate(() => localStorage.getItem('hiking_companion_locale'));
    expect(storedLocale).toBe('en');

    // 5. Reload page and assert English remains active
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#btn-open-login')).toContainText('Log in');
    await expect(page.locator('.landing-hero-title')).toContainText('Plan, Analyze & Navigate Your Trails');
  });

  test('switches between NL and EN in authenticated planner workspace', async ({ page }) => {
    const mockUser = {
      id: 'hiker-42',
      email: 'alex@trails.org',
      name: 'Alex Trails',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      oauthProviders: ['google'],
    };

    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: mockUser } });
    });

    // Start with Dutch
    await page.goto('/');

    // In Dutch:
    await expect(page.locator('#planner-panel h2')).toContainText('Route Planner');
    await expect(page.locator('#btn-new-route')).toContainText('Nieuwe Route Tekenen');
    await expect(page.locator('#btn-import-gpx')).toContainText('GPX Route(s) Importeren');
    await expect(page.locator('#btn-open-route-library-sidebar')).toContainText('Mijn Opgeslagen Routes');

    // Switch to English
    await page.locator('#lang-btn-en').click();

    // In English:
    await expect(page.locator('#planner-panel h2')).toContainText('Route Planner');
    await expect(page.locator('#btn-new-route')).toContainText('Draw New Route');
    await expect(page.locator('#btn-import-gpx')).toContainText('Import GPX Route(s)');
    await expect(page.locator('#btn-open-route-library-sidebar')).toContainText('My Saved Routes');
  });
});
