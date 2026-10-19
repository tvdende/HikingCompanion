import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { users, oauthAccounts, type User } from '../db/schema.js';
import {
  setSessionCookie,
  clearSessionCookie,
  createSession,
  invalidateSession,
  toUserProfile,
  SESSION_COOKIE_NAME,
} from '../auth/session.js';
import { getCookie } from 'hono/cookie';
import type { UserRole } from '@hiking-companion/core';

export const authRoutes = new Hono<{
  Bindings: {
    DB?: D1Database;
    MOCK_AUTH?: string;
    ENVIRONMENT?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
  };
  Variables: {
    user?: import('@hiking-companion/core').UserProfile;
    session?: import('../db/schema.js').Session;
  };
}>();

// Helper: provision or retrieve user during OAuth / mock authentication (Zero-Barrier Self-Registration)
export async function getOrCreateOAuthUser(
  db: import('../db/index.js').AppDatabase,
  provider: string,
  providerAccountId: string,
  email: string,
  name: string,
  avatarUrl?: string | null,
  initialRole: UserRole = 'user'
): Promise<{ user: User; isBlocked: boolean }> {
  // 1. Check if OAuth account exists
  const existingOAuth = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId)
      )
    )
    .limit(1);

  if (existingOAuth.length > 0) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, existingOAuth[0].userId))
      .limit(1);

    if (existingUser.length > 0) {
      if (!existingUser[0].isActive) {
        return { user: existingUser[0], isBlocked: true };
      }
      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, existingUser[0].id));
      return { user: { ...existingUser[0], lastLoginAt: new Date() }, isBlocked: false };
    }
  }

  // 2. Check if user with email already exists
  const existingUserByEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;
  let userRecord: User;

  if (existingUserByEmail.length > 0) {
    userId = existingUserByEmail[0].id;
    userRecord = existingUserByEmail[0];

    if (!userRecord.isActive) {
      return { user: userRecord, isBlocked: true };
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  } else {
    // 3. Zero-Barrier Self-Registration: Provision new user
    userId = crypto.randomUUID();
    const now = new Date();
    userRecord = {
      id: userId,
      email,
      name,
      avatarUrl: avatarUrl || null,
      role: initialRole,
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
    };

    await db.insert(users).values(userRecord);
  }

  // Link OAuth account if not linked yet
  if (existingOAuth.length === 0) {
    await db.insert(oauthAccounts).values({
      id: crypto.randomUUID(),
      userId,
      provider,
      providerAccountId,
      createdAt: new Date(),
    });
  }

  return { user: userRecord, isBlocked: false };
}

// GET /api/auth/me
authRoutes.get('/me', (c) => {
  const user = c.get('user');
  return c.json({ user: user ?? null });
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const token =
    getCookie(c, SESSION_COOKIE_NAME) ||
    c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (token && c.env?.DB) {
    const db = getDb(c.env.DB);
    await invalidateSession(db, token);
  }

  clearSessionCookie(c);
  return c.json({ success: true });
});

// GET /api/auth/login/:provider
authRoutes.get('/login/:provider', (c) => {
  const provider = c.req.param('provider');
  const validProviders = ['google', 'microsoft', 'github'];

  if (!validProviders.includes(provider)) {
    return c.json({ error: `Unsupported provider: ${provider}` }, 400);
  }

  // Redirect to provider OAuth or mock in local development
  const url = new URL(c.req.url);
  const redirectUri = `${url.origin}/api/auth/callback/${provider}`;

  if (provider === 'google' && c.env?.GOOGLE_CLIENT_ID) {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${c.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20profile%20email`;
    return c.redirect(authUrl);
  }

  if (provider === 'github' && c.env?.GITHUB_CLIENT_ID) {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=user:email`;
    return c.redirect(authUrl);
  }

  if (provider === 'microsoft' && c.env?.MICROSOFT_CLIENT_ID) {
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${c.env.MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20profile%20email`;
    return c.redirect(authUrl);
  }

  // Fallback if provider secrets are not configured in local environment
  return c.json({
    message: `OAuth client secrets for ${provider} are not configured. Use /api/auth/mock-login for local testing.`,
    provider,
    redirectUri,
  }, 200);
});

// GET /api/auth/callback/:provider
authRoutes.get('/callback/:provider', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');

  if (!code) {
    return c.redirect('/?auth_error=missing_code');
  }

  // In production, exchange code with OAuth provider token endpoint.
  // For now return friendly message or redirect.
  return c.redirect(`/?auth_status=completed&provider=${provider}`);
});

// POST /api/auth/mock-login (Development & Testing)
authRoutes.post('/mock-login', async (c) => {
  const isMockAllowed =
    c.env?.MOCK_AUTH === 'true' ||
    c.env?.ENVIRONMENT !== 'production' ||
    !c.env?.ENVIRONMENT;

  if (!isMockAllowed) {
    return c.json({ error: 'Mock login is disabled in production' }, 403);
  }

  if (!c.env?.DB) {
    return c.json({ error: 'Database binding unavailable' }, 500);
  }

  const db = getDb(c.env.DB);
  let body: { role?: UserRole; email?: string; name?: string } = {};

  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const role: UserRole = body.role || 'user';
  const email = body.email || `user-${role}@example.com`;
  const name = body.name || (role === 'admin' ? 'Admin Beheerder' : role === 'planner' ? 'Route Planner' : 'Wandelaar');
  const providerAccountId = `mock-${role}-${email}`;

  const { user, isBlocked } = await getOrCreateOAuthUser(
    db,
    'mock',
    providerAccountId,
    email,
    name,
    null,
    role
  );

  if (isBlocked) {
    return c.json({ error: 'Account is deactivated' }, 403);
  }

  // Ensure role matches requested role in mock mode for rapid role switching in tests
  if (user.role !== role) {
    await db.update(users).set({ role }).where(eq(users.id, user.id));
    user.role = role;
  }

  const { token } = await createSession(db, user.id);
  setSessionCookie(c, token);

  return c.json({
    success: true,
    user: toUserProfile(user),
    token,
  });
});
