# Design: Web Push Notifications & Trail Alerts

## Architecture Overview

```
Frontend (PWA)               Cloudflare Worker (Hono)          Browser Push Service (FCM/APNs)
     |                                   |                                     |
     |-- 1. GET /api/notifications/vapid |                                     |
     |<-- Public VAPID Key --------------|                                     |
     |                                                                         |
     |-- 2. registration.pushManager.subscribe(publicKey) -------------------->|
     |<-- PushSubscription (endpoint, p256dh, auth) ---------------------------|
     |                                   |                                     |
     |-- 3. POST /api/notifications/sub -|                                     |
     |      (Save to D1)                 |                                     |
     |                                   |                                     |
     |                            [Trigger Event:                              |
     |                             Severe Weather / Route Alert]               |
     |                                   |                                     |
     |                                   |-- 4. Sign VAPID JWT (Web Crypto)    |
     |                                   |-- 5. Encrypt Payload (AES-128-GCM)  |
     |                                   |-- 6. POST encrypted payload ------->|
     |                                   |                                     |
     |<-- 7. Service Worker 'push' event --------------------------------------|
     |    (Show native notification)                                           |
```

## Database Schema (`apps/api/src/db/schema.ts`)

```typescript
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userNotifications = sqliteTable('user_notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull(), // 'weather' | 'safety' | 'route' | 'general'
  url: text('url'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
});
```

## Edge VAPID Engine
- Employs Web Crypto API (`crypto.subtle`) available natively in Cloudflare Workers (no heavy Node crypto dependencies).
- Generates standard RFC 8292 JWTs using ECDSA P-256 (`ES256`).
- Encrypts notification JSON payloads using HKDF and AES-128-GCM as per RFC 8291.
