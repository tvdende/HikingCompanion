## 1. Domain Types & Database Schema

- [ ] 1.1 Define `Order`, `PaymentStatus`, `UserEntitlement`, and `CheckoutRequest` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Add `orders` and `user_entitlements` tables to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.

## 2. Mollie Client & API Endpoints

- [ ] 2.1 Implement `MollieClient` service in `apps/api/src/services/mollie.ts` for payment creation and verification.
- [ ] 2.2 Implement `POST /api/payments/checkout` in `apps/api/src/routes/payments.ts` validating prices and returning checkout URLs.
- [ ] 2.3 Implement `POST /api/webhooks/mollie` with idempotency, verifying payment status and granting user entitlements in D1.
- [ ] 2.4 Implement `GET /api/user/purchases` to list unlocked routes for the authenticated user, verified with unit tests.

## 3. Web UI & Checkout Flow

- [ ] 3.1 Add "Koop Route" button and purchase status badge to route cards in `apps/web/src/components/RouteLibraryModal.tsx`.
- [ ] 3.2 Add checkout confirmation redirect handler and purchase success toast in `apps/web/src/App.tsx`.
- [ ] 3.3 Add "Mijn Aankopen" filter tab in `RouteLibraryModal.tsx` showing only purchased routes.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) covering checkout validation and webhook idempotency.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/payment-checkout.spec.ts` mocking the checkout and entitlement unlocking flow.
