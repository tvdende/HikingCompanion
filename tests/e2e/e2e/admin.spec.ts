import { test, expect } from '@playwright/test';

test.describe('Admin User Management Flow', () => {
  const adminUser = {
    id: 'admin-id-1',
    email: 'admin@hikingcompanion.nl',
    name: 'Super Admin',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  let mockUsersList = [
    {
      id: 'admin-id-1',
      email: 'admin@hikingcompanion.nl',
      name: 'Super Admin',
      role: 'admin',
      isActive: true,
      oauthProviders: ['microsoft'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: 'user-id-2',
      email: 'wandelmaat@example.com',
      name: 'Wandel Maat',
      role: 'user',
      isActive: true,
      oauthProviders: ['google'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ json: { user: adminUser } });
    });

    await page.route('/api/admin/users*', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      if (search) {
        const filtered = mockUsersList.filter(
          (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
        await route.fulfill({ json: { users: filtered } });
      } else {
        await route.fulfill({ json: { users: mockUsersList } });
      }
    });

    await page.route('/api/admin/users/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        const userId = route.request().url().split('/').pop();
        mockUsersList = mockUsersList.map((u) =>
          u.id === userId ? { ...u, ...body } : u
        );
        const updated = mockUsersList.find((u) => u.id === userId);
        await route.fulfill({ json: { user: updated } });
      } else if (route.request().method() === 'DELETE') {
        const userId = route.request().url().split('/').pop();
        mockUsersList = mockUsersList.filter((u) => u.id !== userId);
        await route.fulfill({ json: { success: true } });
      }
    });
  });

  test('displays Gebruikersbeheer action in profile menu for admins only', async ({ page }) => {
    await page.goto('/');

    const trigger = page.locator('#user-profile-trigger');
    await expect(trigger).toBeVisible();
    // Compact screens (< 768px) show the role badge in the profile menu instead of the trigger.
    const isCompact = (page.viewportSize()?.width ?? 1280) < 768;
    if (!isCompact) await expect(trigger.locator('.role-tag.admin')).toBeVisible();

    await trigger.click();
    if (isCompact) await expect(page.locator('#user-profile-dropdown .role-tag.admin')).toBeVisible();

    const adminBtn = page.locator('#btn-header-admin-panel');
    await expect(adminBtn).toBeVisible();
    await expect(adminBtn).toContainText('Gebruikersbeheer');
  });

  test('opens admin management modal and displays registered users list', async ({ page }) => {
    await page.goto('/');

    await page.locator('#user-profile-trigger').click();
    await page.locator('#btn-header-admin-panel').click();

    const adminModal = page.locator('#admin-users-modal');
    await expect(adminModal).toBeVisible();

    // Verify user table rows
    const table = page.locator('#admin-users-table');
    await expect(table).toBeVisible();
    await expect(table.locator('text=Super Admin')).toBeVisible();
    await expect(table.locator('text=Wandel Maat')).toBeVisible();

    // Close modal
    await page.locator('#btn-close-admin-modal').click();
    await expect(adminModal).not.toBeVisible();
  });

  test('allows changing user role and toggling account status', async ({ page }) => {
    await page.goto('/');

    await page.locator('#user-profile-trigger').click();
    await page.locator('#btn-header-admin-panel').click();

    // Change role of Wandel Maat to planner
    const roleSelect = page.locator('#role-select-user-id-2');
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption('planner');
    await expect(roleSelect).toHaveValue('planner');

    // Toggle active status
    const statusBtn = page.locator('#status-btn-user-id-2');
    await expect(statusBtn).toContainText('Actief');
    await statusBtn.click();
    await expect(statusBtn).toContainText('Geblokkeerd');
  });
});
