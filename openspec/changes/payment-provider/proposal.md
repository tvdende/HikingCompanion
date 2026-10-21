## Why

Trail planners create curated, high-value routes and multi-day treks that include campings, water sources, and local hiking notes. To incentivize high-quality routes and fund platform operations, creators should be able to sell verified routes to hikers, and users should be able to subscribe to a Premium tier (removing distance and share limits). Currently, routes have a `priceEur` field in the database, but there is no payment gateway integration. Fulfilling Section 3.5 & 4.6 of the product vision, this change integrates **Mollie** (supporting iDEAL, Bancontact, credit card, and Apple Pay) to process one-time route purchases and manage recurring subscriptions.

## What Changes

- **Mollie Edge Client & Checkout Service**: Implement a Cloudflare Workers integration in `apps/api` using Mollie REST API to create payment sessions (`POST /api/payments/checkout`) for route purchases and subscription orders.
- **Webhook Processing**: Add `POST /api/webhooks/mollie` to securely verify payment transitions (`paid`, `canceled`, `expired`), unlock purchased routes for the buyer, and record financial transactions in D1.
- **Purchases & Subscriptions Database Schema**: Create tables in D1 SQLite:
  - `orders`: tracks order ID, user ID, item type (`route` or `subscription`), amount in cents, currency, and payment status.
  - `user_entitlements`: records routes owned by each user and active subscription statuses (`premium` expiry dates).
- **Entitlement Checks & Limit Bypass**: When a user purchases a route or holds an active Premium subscription, the API automatically lifts route length limits and sharing restrictions for that user/route.
- **Frontend Checkout & Marketplace UI**: Add a purchase button to route cards in `apps/web`, handle redirect to Mollie Hosted Checkout, process return/confirmation callbacks, and display user ownership badges.

## Capabilities

### New Capabilities
- `payment-provider`: Processes one-time route purchases and recurring subscriptions via Mollie (iDEAL, credit card, Bancontact, Apple Pay), verifies webhook events, records transactions in D1, and grants user entitlements that remove route and sharing restrictions.

### Modified Capabilities
- `route-library`: Extends route management to show purchase state, bought routes collection, and payment badges.

## Impact

- **Affected Code**:
  - `packages/core`: Define order, payment status, and entitlement domain types.
  - `apps/api`: Add Mollie API client, checkout routes, webhook handler, and entitlement middleware.
  - `apps/web`: Add checkout modal, payment redirect handling, and order confirmation toast/dialog.
- **External Dependencies**: Mollie Payments REST API.
- **Security & Compliance**: Secure webhook signature validation, idempotency checks on webhook events, and no sensitive credit card data stored locally.
