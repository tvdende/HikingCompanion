import { test, expect } from '@playwright/test';

test.describe('Authentication & User Session Flow', () => {
  test('renders guest view with Inloggen button', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });

    await page.goto('/');

    const loginBtn = page.locator('#btn-open-login');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toContainText('Inloggen');
    await expect(page.locator('#user-profile-trigger')).not.toBeVisible();
  });

  test('opens and closes OAuth login modal with provider choices', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: null } });
    });

    await page.goto('/');

    await page.locator('#btn-open-login').click();

    const modal = page.locator('#login-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#oauth-btn-google')).toBeVisible();
    await expect(page.locator('#oauth-btn-microsoft')).toBeVisible();
    await expect(page.locator('#oauth-btn-github')).toBeVisible();
    await expect(page.locator('#btn-mock-user')).toBeVisible();

    // Close modal
    await page.locator('#btn-close-login-modal').click();
    await expect(modal).not.toBeVisible();
  });

  test('completes self-registration and switches to authenticated user profile', async ({ page }) => {
    let currentUser: any = null;

    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: currentUser } });
    });

    await page.route('/api/auth/mock-login', async (route) => {
      currentUser = {
        id: 'user-123',
        email: 'jan@wandelaar.nl',
        name: 'Jan Wandelaar',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await route.fulfill({
        json: { success: true, user: currentUser },
      });
    });

    await page.goto('/');

    await page.locator('#btn-open-login').click();
    await page.locator('#btn-mock-user').click();

    // Modal should close and header displays user profile
    await expect(page.locator('#login-modal')).not.toBeVisible();
    const profileTrigger = page.locator('#user-profile-trigger');
    await expect(profileTrigger).toBeVisible();
    await expect(page.locator('#header-user-name')).toHaveText('Jan Wandelaar');
    await expect(profileTrigger.locator('.role-tag.user')).toBeVisible();
    await expect(page.locator('#btn-open-login')).not.toBeVisible();
  });

  test('opens profile dropdown and executes logout', async ({ page }) => {
    let currentUser: any = {
      id: 'user-planner-456',
      email: 'planner@hikingcompanion.nl',
      name: 'Piet Planner',
      role: 'planner',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: currentUser } });
    });

    await page.route('/api/auth/logout', async (route) => {
      currentUser = null;
      await route.fulfill({ json: { success: true } });
    });

    await page.goto('/');

    const profileTrigger = page.locator('#user-profile-trigger');
    await expect(profileTrigger).toBeVisible();
    await expect(page.locator('#header-user-name')).toHaveText('Piet Planner');

    // Click trigger to open dropdown menu
    await profileTrigger.click();
    const dropdown = page.locator('#user-profile-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('.dropdown-user-email')).toHaveText('planner@hikingcompanion.nl');

    // Non-admin should not see admin panel trigger
    await expect(page.locator('#btn-header-admin-panel')).not.toBeVisible();

    // Click logout
    await page.locator('#btn-header-logout').click();

    // Header resets to unauthenticated guest view
    await expect(page.locator('#btn-open-login')).toBeVisible();
    await expect(page.locator('#user-profile-trigger')).not.toBeVisible();
  });
});
