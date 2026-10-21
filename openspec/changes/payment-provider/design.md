# Design: Payment Provider & Marketplace Checkout

## System Architecture

```
User (Browser)               Cloudflare Worker (Hono)              Mollie API
     |                                   |                               |
     |-- 1. POST /api/payments/checkout >|                               |
     |                                   |-- 2. Create Payment --------->|
     |                                   |<-- 3. Return checkoutUrl -----|
     |<- 4. Redirect to checkoutUrl -----|                               |
     |                                                                   |
     |-- 5. User pays on Mollie hosted page (iDEAL/Apple Pay/Card) ----->|
     |                                                                   |
     |                                   |<-- 6. POST /webhooks/mollie --|
     |                                   |-- 7. GET /v2/payments/:id --->|
     |                                   |<-- 8. Status: 'paid' ---------|
     |                                   |                               |
     |                                   | [Update D1: orders]           |
     |                                   | [Insert D1: entitlements]     |
     |                                   |                               |
     |-- 9. Return to /checkout/success -|                               |
     |<-- 10. Route unlocked in UI ------|                               |
```

## Database Schema (`apps/api/src/db/schema.ts`)

```typescript
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  molliePaymentId: text('mollie_payment_id'),
  itemType: text('item_type').notNull(), // 'route' | 'subscription'
  itemId: text('item_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('EUR').notNull(),
  status: text('status').notNull(), // 'pending' | 'paid' | 'canceled' | 'expired' | 'failed'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userEntitlements = sqliteTable('user_entitlements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  entitlementType: text('entitlement_type').notNull(), // 'route_purchase' | 'premium_subscription'
  routeId: text('route_id').references(() => routes.id),
  orderId: text('order_id').references(() => orders.id),
  grantedAt: text('granted_at').notNull(),
  expiresAt: text('expires_at'), // null for lifetime route purchases
});
```

## Mollie Integration Client
- Utilize fetch-based REST client in Cloudflare Workers using `MOLLIE_API_KEY` stored in Worker environment secrets.
- Webhook signature or verification step checks payment state directly against `https://api.mollie.com/v2/payments/{id}` with Bearer authentication.
