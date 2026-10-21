## 1. Core Domain Types & GPX Stitching

- [x] 1.1 Extend domain types in `packages/core/src/types` with `RouteStatus` (`'draft' | 'definitive'`), route metadata fields (`description`, `location`, `priceEur`), and export them via `packages/core/src/index.ts`.
- [x] 1.2 Implement `stitchGpxRoutes` in `packages/core/src/gpx/stitcher.ts` supporting sequential track concatenation, stage sequencing, geodesic gap bridging, and metric reconciliation, verified with unit tests in `tests/unit/gpx-stitching.test.ts`.

## 2. Database Schema & Backend REST API

- [x] 2.1 Extend D1 `routes` table in `apps/api/src/db/schema.ts` with `status`, `description`, `location`, and `priceEur` columns, and generate migration files via Drizzle Kit.
- [x] 2.2 Enhance `/api/routes` REST endpoints in `apps/api/src/routes/routes.ts` to support status filtering (`?status=draft|definitive`), search query filtering, and partial metadata updates (`PUT /api/routes/:id`), verified with unit tests in `tests/unit/routes-api.test.ts`.

## 3. Frontend Multi-GPX Upload & Route Management Dashboard

- [x] 3.1 Update file input and drag-and-drop handlers in `apps/web/src/App.tsx` to support uploading and stitching multiple GPX files simultaneously and appending additional files to the active route.
- [x] 3.2 Create `RouteMetadataModal.tsx` in `apps/web/src/components` providing a form for editing route title, lifecycle status (`concept` vs `definitief`), location, marketplace price in EUR, and description.
- [x] 3.3 Upgrade `RouteLibraryModal.tsx` in `apps/web/src/components` into a Route Management Dashboard featuring filter tabs ("Alle Routes", "Concepten", "Definitief"), search input, status and price badges, and metadata edit actions.

## 4. Verification & Testing

- [x] 4.1 Run unit tests (`npm run test:unit`) to confirm all GPX stitching, database schema, and route CRUD API tests pass.
- [x] 4.2 Verify monorepo build succeeds without TypeScript or bundling errors using `npm run build`.
- [x] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/route-library.spec.ts` validating multi-GPX stitching, status filtering, metadata editing (concept/definitief, price, location), and verify using `npm run test:e2e`.
