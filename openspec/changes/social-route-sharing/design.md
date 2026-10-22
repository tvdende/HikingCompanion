# Design: Social Route Sharing & Recipient Limits

## Architecture

```
Owner (Browser)              Cloudflare Worker (Hono API)               Friend (Browser)
      |                                    |                                    |
      |-- POST /api/routes/:id/share ----->|                                    |
      |<-- Returns shareToken & URL -------|                                    |
      |                                    |                                    |
      | (Owner copies URL to friend)       |                                    |
      |                                    |                                    |
      |                                    |<-- GET /api/share/:token ----------|
      |                                    |    [Check token validity]          |
      |                                    |    [Check recipient count <= 3     |
      |                                    |     unless owner is Premium]       |
      |                                    |    [Record recipient in D1]        |
      |                                    |-- Returns Route Payload ---------->|
      |                                    |   (Stages, Campings, PackingList)  |
```

## Database Schema (`apps/api/src/db/schema.ts`)

```typescript
export const routeShares = sqliteTable('route_shares', {
  id: text('id').primaryKey(),
  routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  maxRecipients: integer('max_recipients').default(3).notNull(), // null or 0 for unlimited
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull(),
  revokedAt: text('revoked_at'),
});

export const routeShareRecipients = sqliteTable('route_share_recipients', {
  id: text('id').primaryKey(),
  shareId: text('share_id').notNull().references(() => routeShares.id, { onDelete: 'cascade' }),
  recipientIdentifier: text('recipient_identifier').notNull(), // userId or hashed IP/fingerprint
  accessedAt: text('accessed_at').notNull(),
});
```

## Share Quota Logic
- When a free user creates a share link, `maxRecipients` is set to 3.
- When a Premium user or user who purchased the route shares, `maxRecipients` is set to `null` (unlimited).
- Recipient tracking uses `userId` if the friend is logged in, or a secure hash of client IP and User-Agent if anonymous.
