import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['admin', 'planner', 'user'] }).notNull().default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google' | 'microsoft' | 'github'
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const routeStatusEnum = ['draft', 'definitive'] as const;
export type RouteStatus = (typeof routeStatusEnum)[number];

export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  status: text('status', { enum: routeStatusEnum }).notNull().default('draft'),
  priceEur: real('price_eur').notNull().default(0.0),
  totalDistanceKm: real('total_distance_km').notNull(),
  coordinatesJson: text('coordinates_json').notNull(),
  waypointsJson: text('waypoints_json'),
  stagesJson: text('stages_json'),
  elevationMetricsJson: text('elevation_metrics_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;
export type RouteRecord = typeof routes.$inferSelect;
export type NewRouteRecord = typeof routes.$inferInsert;
