import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './helpers/createTestDb.js';
import { getOrCreateOAuthUser } from '../../apps/api/src/routes/auth.js';
import { createSession } from '../../apps/api/src/auth/session.js';
import app from '../../apps/api/src/index.js';

describe('Admin User Management API Endpoints', () => {
  let testEnv: ReturnType<typeof createTestDb>;
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    testEnv = createTestDb();

    // Create an admin user
    const adminResult = await getOrCreateOAuthUser(
      testEnv.db,
      'mock',
      'mock-admin-1',
      'admin@hikingcompanion.nl',
      'Super Admin',
      null,
      'admin'
    );
    adminId = adminResult.user.id;
    const adminSess = await createSession(testEnv.db, adminId);
    adminToken = adminSess.token;

    // Create a regular user
    const userResult = await getOrCreateOAuthUser(
      testEnv.db,
      'mock',
      'mock-user-1',
      'wandelgek@hikingcompanion.nl',
      'Wandel Gek',
      null,
      'user'
    );
    userId = userResult.user.id;
    const userSess = await createSession(testEnv.db, userId);
    userToken = userSess.token;
  });

  it('rejects unauthenticated requests to /api/admin/users with 401', async () => {
    const res = await app.request('/api/admin/users', { method: 'GET' }, { DB: testEnv.d1 });
    expect(res.status).toBe(401);
  });

  it('rejects regular users from accessing /api/admin/users with 403', async () => {
    const res = await app.request(
      '/api/admin/users',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error).toContain('Admin access required');
  });

  it('allows administrators to list and search all users', async () => {
    const res = await app.request(
      '/api/admin/users',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${adminToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.users).toHaveLength(2);

    // Search by name
    const searchRes = await app.request(
      '/api/admin/users?search=Wandel',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${adminToken}` },
      },
      { DB: testEnv.d1 }
    );
    expect(searchRes.status).toBe(200);
    const searchBody = (await searchRes.json()) as any;
    expect(searchBody.users).toHaveLength(1);
    expect(searchBody.users[0].name).toBe('Wandel Gek');
  });

  it('allows administrator to update user role to planner', async () => {
    const patchRes = await app.request(
      `/api/admin/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${adminToken}`,
        },
        body: JSON.stringify({ role: 'planner' }),
      },
      { DB: testEnv.d1 }
    );

    expect(patchRes.status).toBe(200);
    const body = (await patchRes.json()) as any;
    expect(body.user.role).toBe('planner');
  });

  it('allows administrator to deactivate user, invalidating their active sessions', async () => {
    const patchRes = await app.request(
      `/api/admin/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${adminToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      },
      { DB: testEnv.d1 }
    );

    expect(patchRes.status).toBe(200);
    const body = (await patchRes.json()) as any;
    expect(body.user.isActive).toBe(false);

    // Verify deactivated user's session no longer works
    const meRes = await app.request(
      '/api/auth/me',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${userToken}` },
      },
      { DB: testEnv.d1 }
    );
    const meBody = (await meRes.json()) as any;
    expect(meBody.user).toBeNull();
  });

  it('prevents administrator from demoting or deactivating their own account', async () => {
    // Attempt self-demotion
    const demoteRes = await app.request(
      `/api/admin/users/${adminId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${adminToken}`,
        },
        body: JSON.stringify({ role: 'user' }),
      },
      { DB: testEnv.d1 }
    );
    expect(demoteRes.status).toBe(400);

    // Attempt self-deactivation
    const deactRes = await app.request(
      `/api/admin/users/${adminId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `hiking_session=${adminToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      },
      { DB: testEnv.d1 }
    );
    expect(deactRes.status).toBe(400);
  });

  it('allows administrator to delete a user', async () => {
    const deleteRes = await app.request(
      `/api/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: { Cookie: `hiking_session=${adminToken}` },
      },
      { DB: testEnv.d1 }
    );

    expect(deleteRes.status).toBe(200);

    // Verify user count is now 1
    const listRes = await app.request(
      '/api/admin/users',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${adminToken}` },
      },
      { DB: testEnv.d1 }
    );
    const listBody = (await listRes.json()) as any;
    expect(listBody.users).toHaveLength(1);
    expect(listBody.users[0].id).toBe(adminId);
  });
});
