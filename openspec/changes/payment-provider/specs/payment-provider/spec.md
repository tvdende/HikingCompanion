# Capability: Payment Provider & Marketplace Checkout

## Purpose

Provide a secure payment processing pipeline via Mollie (iDEAL, Bancontact, credit card, Apple Pay) for purchasing curated hike routes and unlocking Premium subscriptions, updating user entitlements and bypassing free-tier restrictions.

## Requirements

### Requirement: Checkout Session Creation
The API SHALL provide `POST /api/payments/checkout`:
- Accepts `itemId` (route ID or subscription plan ID), `itemType` (`'route'` | `'subscription'`), and an optional `redirectUrl`
- Authenticates the purchasing user
- Validates that the route is published as `'definitive'` and has a valid `priceEur` (> 0)
- Communicates with Mollie Payments API to create a payment session
- Returns the Mollie `checkoutUrl` for user redirect

#### Scenario: Hiker initiates purchase of a 15-euro trail
- GIVEN an authenticated user and a route priced at € 15.00
- WHEN the user clicks "Buy Route" and `POST /api/payments/checkout` is called
- THEN an order record with status `'pending'` is created in D1
- AND a Mollie checkout URL is returned to redirect the user

### Requirement: Secure Webhook Processing & Entitlement Granting
The API SHALL expose `POST /api/webhooks/mollie`:
- Receives the payment `id` posted by Mollie
- Verifies payment status directly against Mollie's API (`GET /v2/payments/:id`)
- Updates the order record in D1 with the verified status (`paid`, `canceled`, `expired`, `failed`)
- Upon receiving status `'paid'`:
  - Inserts a record into `user_entitlements` granting permanent ownership of the route to the buyer
  - If the item is a subscription, updates the user's `isPremium` flag and expiration timestamp
- Webhook execution MUST be idempotent (processing the same webhook multiple times produces identical state without duplicate order/entitlement entries)

#### Scenario: Processing successful payment webhook
- GIVEN a pending order for route `route-mountain-trek`
- WHEN Mollie sends a webhook notification indicating the payment is `paid`
- THEN the order status updates to `paid`
- AND the user receives an entitlement unlocking full access to `route-mountain-trek`

### Requirement: Free-Tier Limits Bypass
The system SHALL evaluate route limits based on user entitlements:
- Standard users: max 50 km per route, max 3 shares per route
- Entitlement override: If a user has purchased a route or holds an active Premium subscription, route length limits and sharing limits MUST NOT be enforced for that route/user

#### Scenario: User opens a 90km purchased route
- GIVEN a user with an active entitlement for a 90km route
- WHEN the user opens and navigates the route
- THEN the system allows full route interaction without displaying free-tier restriction banners

### Requirement: User Orders & Purchases Query
The API SHALL provide `GET /api/user/purchases`:
- Returns all routes purchased by the authenticated user
- Returns active subscription details if applicable

#### Scenario: Querying my purchased routes
- GIVEN an authenticated user who has bought 2 routes
- WHEN the client requests `GET /api/user/purchases`
- THEN the response contains the 2 route IDs with purchase timestamps and order references
