import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { eq, and, gt } from 'drizzle-orm';
import type { AppDatabase } from '../db/index.js';
import { sessions, users, type User, type Session } from '../db/schema.js';
import type { UserProfile } from '@hiking-companion/core';

export const SESSION_COOKIE_NAME = 'hiking_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function setSessionCookie(c: Context, token: string) {
  const isProd = c.env?.ENVIRONMENT === 'production' || c.env?.ENVIRONMENT === 'test';
  setCookie(c, SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: '/',
  });
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString(),
    lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : new Date(user.lastLoginAt).toISOString(),
  };
}

export async function createSession(
  db: AppDatabase,
  userId: string
): Promise<{ session: Session; token: string }> {
  const token = generateToken();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const createdAt = new Date();

  await db.insert(sessions).values({
    id,
    userId,
    token,
    expiresAt,
    createdAt,
  });

  const session: Session = {
    id,
    userId,
    token,
    expiresAt,
    createdAt,
  };

  return { session, token };
}

export async function validateSession(
  db: AppDatabase,
  token: string
): Promise<{ user: UserProfile; session: Session } | null> {
  const now = new Date();

  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { session, user } = result[0];

  // If user was deactivated or blocked, revoke session immediately
  if (!user.isActive) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  return {
    user: toUserProfile(user),
    session,
  };
}

export async function invalidateSession(db: AppDatabase, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function invalidateAllUserSessions(db: AppDatabase, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token =
    getCookie(c, SESSION_COOKIE_NAME) ||
    c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');

  if (token && c.env?.DB) {
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const sessionData = await validateSession(db, token);
    if (sessionData) {
      c.set('user', sessionData.user);
      c.set('session', sessionData.session);
    }
  }

  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }
  await next();
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get('user') as UserProfile | undefined;
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};
