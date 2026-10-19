import { Hono } from 'hono';
import { eq, like, or } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { users, oauthAccounts } from '../db/schema.js';
import { requireAdmin, invalidateAllUserSessions, toUserProfile } from '../auth/session.js';
import type { AdminUserListItem, UserRole, UserProfile } from '@hiking-companion/core';

export const adminRoutes = new Hono<{
  Bindings: {
    DB?: D1Database;
  };
  Variables: {
    user: UserProfile;
    session: import('../db/schema.js').Session;
  };
}>();

// Protect all /api/admin/* endpoints with requireAdmin
adminRoutes.use('*', requireAdmin);

// GET /api/admin/users
adminRoutes.get('/users', async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const db = getDb(c.env.DB);
  const search = c.req.query('search')?.trim().toLowerCase();

  let query = db.select().from(users);

  let userRecords;
  if (search) {
    userRecords = await query.where(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  } else {
    userRecords = await query;
  }

  // Fetch all OAuth accounts to attach providers to user list
  const allOAuth = await db.select().from(oauthAccounts);
  const oauthMap = new Map<string, string[]>();
  for (const account of allOAuth) {
    const list = oauthMap.get(account.userId) || [];
    list.push(account.provider);
    oauthMap.set(account.userId, list);
  }

  const userList: AdminUserListItem[] = userRecords.map((u) => ({
    ...toUserProfile(u),
    oauthProviders: oauthMap.get(u.id) || [],
  }));

  return c.json({ users: userList });
});

// PATCH /api/admin/users/:id
adminRoutes.patch('/users/:id', async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const currentAdmin = c.get('user');
  const targetUserId = c.req.param('id');
  const db = getDb(c.env.DB);

  let body: { role?: UserRole; isActive?: boolean } = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  // Self-lockout prevention
  if (currentAdmin.id === targetUserId) {
    if (body.role && body.role !== 'admin') {
      return c.json({ error: 'Administrators cannot demote their own account' }, 400);
    }
    if (body.isActive === false) {
      return c.json({ error: 'Administrators cannot deactivate their own account' }, 400);
    }
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }

  const updateData: Partial<typeof users.$inferInsert> = {};
  if (body.role) {
    updateData.role = body.role;
  }
  if (typeof body.isActive === 'boolean') {
    updateData.isActive = body.isActive;
    // Invalidate sessions immediately if user is deactivated
    if (body.isActive === false) {
      await invalidateAllUserSessions(db, targetUserId);
    }
  }

  await db.update(users).set(updateData).where(eq(users.id, targetUserId));

  const updatedUser = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  return c.json({ user: toUserProfile(updatedUser[0]) });
});

// DELETE /api/admin/users/:id
adminRoutes.delete('/users/:id', async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const currentAdmin = c.get('user');
  const targetUserId = c.req.param('id');

  // Prevent self-deletion
  if (currentAdmin.id === targetUserId) {
    return c.json({ error: 'Administrators cannot delete their own account' }, 400);
  }

  const db = getDb(c.env.DB);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }

  await invalidateAllUserSessions(db, targetUserId);
  await db.delete(users).where(eq(users.id, targetUserId));

  return c.json({ success: true });
});
