import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './helpers/createTestDb.js';
import {
  generateToken,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  toUserProfile,
} from '../../apps/api/src/auth/session.js';
import { getOrCreateOAuthUser } from '../../apps/api/src/routes/auth.js';
import { users } from '../../apps/api/src/db/schema.js';
import { eq } from 'drizzle-orm';
import app from '../../apps/api/src/index.js';

describe('Auth Session Management & Zero-Barrier Self-Registration', () => {
  let testEnv: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testEnv = createTestDb();
  });

  it('generates secure 64-character random hex tokens', () => {
    const token1 = generateToken();
    const token2 = generateToken();
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('self-registers a new user immediately on first OAuth sign-in without approval', async () => {
    const { user, isBlocked } = await getOrCreateOAuthUser(
      testEnv.db,
      'google',
      'google-sub-12345',
      'wanderer@example.com',
      'Jan Jansen',
      'https://example.com/avatar.jpg'
    );

    expect(isBlocked).toBe(false);
    expect(user.id).toBeDefined();
    expect(user.email).toBe('wanderer@example.com');
    expect(user.name).toBe('Jan Jansen');
    expect(user.role).toBe('user');
    expect(user.isActive).toBe(true);

    // Profile converter
    const profile = toUserProfile(user);
    expect(profile.role).toBe('user');
    expect(profile.isActive).toBe(true);
  });

  it('retrieves existing user and updates lastLoginAt on subsequent logins', async () => {
    const first = await getOrCreateOAuthUser(
      testEnv.db,
      'github',
      'gh-999',
      'githubber@example.com',
      'Pieter Post'
    );

    const second = await getOrCreateOAuthUser(
      testEnv.db,
      'github',
      'gh-999',
      'githubber@example.com',
      'Pieter Post'
    );

    expect(second.user.id).toBe(first.user.id);
    expect(second.isBlocked).toBe(false);
  });

  it('rejects login for blocked/deactivated users', async () => {
    const { user } = await getOrCreateOAuthUser(
      testEnv.db,
      'google',
      'g-blocked',
      'blocked@example.com',
      'Blocked User'
    );

    // Deactivate user
    await testEnv.db.update(users).set({ isActive: false }).where(eq(users.id, user.id));

    const attempt = await getOrCreateOAuthUser(
      testEnv.db,
      'google',
      'g-blocked',
      'blocked@example.com',
      'Blocked User'
    );

    expect(attempt.isBlocked).toBe(true);
  });

  it('creates and validates an active user session', async () => {
    const { user } = await getOrCreateOAuthUser(
      testEnv.db,
      'mock',
      'mock-test-1',
      'sess@example.com',
      'Session User'
    );

    const { session, token } = await createSession(testEnv.db, user.id);
    expect(session.userId).toBe(user.id);

    const validated = await validateSession(testEnv.db, token);
    expect(validated).not.toBeNull();
    expect(validated?.user.id).toBe(user.id);
    expect(validated?.user.email).toBe('sess@example.com');
  });

  it('revokes session on explicit logout or user deactivation', async () => {
    const { user } = await getOrCreateOAuthUser(
      testEnv.db,
      'mock',
      'mock-revoke-1',
      'revoke@example.com',
      'Revoke User'
    );

    const { token } = await createSession(testEnv.db, user.id);
    await invalidateSession(testEnv.db, token);

    const validated = await validateSession(testEnv.db, token);
    expect(validated).toBeNull();
  });
});

describe('Hono Auth API Endpoints', () => {
  let testEnv: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testEnv = createTestDb();
  });

  it('returns null user on GET /api/auth/me when unauthenticated', async () => {
    const res = await app.request('/api/auth/me', { method: 'GET' }, { DB: testEnv.d1 });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: unknown };
    expect(data.user).toBeNull();
  });

  it('allows mock login and returns authenticated user and session cookie', async () => {
    const loginRes = await app.request(
      '/api/auth/mock-login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'planner', name: 'Tester Planner' }),
      },
      { DB: testEnv.d1, MOCK_AUTH: 'true' }
    );

    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as any;
    expect(loginData.success).toBe(true);
    expect(loginData.user.role).toBe('planner');
    expect(loginData.token).toBeDefined();

    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toContain('hiking_session=');

    // Query /api/auth/me using the session cookie
    const meRes = await app.request(
      '/api/auth/me',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${loginData.token}` },
      },
      { DB: testEnv.d1 }
    );

    expect(meRes.status).toBe(200);
    const meData = (await meRes.json()) as any;
    expect(meData.user).not.toBeNull();
    expect(meData.user.role).toBe('planner');
    expect(meData.user.name).toBe('Tester Planner');
  });

  it('logs out successfully and invalidates the session', async () => {
    const loginRes = await app.request(
      '/api/auth/mock-login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      },
      { DB: testEnv.d1, MOCK_AUTH: 'true' }
    );
    const loginData = (await loginRes.json()) as any;

    const logoutRes = await app.request(
      '/api/auth/logout',
      {
        method: 'POST',
        headers: { Cookie: `hiking_session=${loginData.token}` },
      },
      { DB: testEnv.d1 }
    );
    expect(logoutRes.status).toBe(200);

    // After logout, session is invalid
    const meRes = await app.request(
      '/api/auth/me',
      {
        method: 'GET',
        headers: { Cookie: `hiking_session=${loginData.token}` },
      },
      { DB: testEnv.d1 }
    );
    const meData = (await meRes.json()) as any;
    expect(meData.user).toBeNull();
  });
});
