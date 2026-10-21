## 1. Domain Types & Database Schema

- [ ] 1.1 Define `RouteShare`, `ShareQuota`, and `SharedRoutePayload` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Add `route_shares` and `route_share_recipients` tables to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.

## 2. API Backend & Share Limits

- [ ] 2.1 Implement `POST /api/routes/:id/share` and `DELETE /api/routes/:id/share` in `apps/api/src/routes/sharing.ts` generating unique tokens.
- [ ] 2.2 Implement `GET /api/share/:token` enforcing the 3-recipient limit for free users and granting unlimited access for Premium/purchased routes.
- [ ] 2.3 Implement `GET /api/routes/:id/shares` returning share count and recipient quota, verified with unit tests.

## 3. Web UI & Shared Trek Collaboration

- [ ] 3.1 Create `ShareRouteModal.tsx` in `apps/web/src/components` with copy link button, QR code display, share quota badge (e.g. "1/3 gedeeld"), and revoke action.
- [ ] 3.2 Add "Deel route" button to active route bar and library cards in `App.tsx` and `RouteLibraryModal.tsx`.
- [ ] 3.3 Add shared route landing view handling `/share/:token` URL, displaying stage breakdowns, overnight campsites, and attached packing list with a "Kopieer naar mijn routes" action.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying token generation, 3-recipient boundary condition, and Premium bypass.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/social-sharing.spec.ts` testing share link creation, recipient tracking, and limit enforcement.
