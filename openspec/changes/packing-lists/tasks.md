## 1. Domain Types & Database Schema

- [ ] 1.1 Define `PackingCategory`, `PackingItem`, and `PackingList` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Implement weight calculation utilities (`calculatePackingWeights`) in `packages/core/src/packing/weights.ts` with unit tests.
- [ ] 1.3 Add `packing_lists` and `packing_list_items` tables and `routes.packing_list_id` column to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.

## 2. API Backend & Route Association

- [ ] 2.1 Implement `GET /api/packing-lists` and `POST /api/packing-lists` in `apps/api/src/routes/packing.ts`.
- [ ] 2.2 Implement `GET /api/packing-lists/:id`, `PUT /api/packing-lists/:id`, `DELETE /api/packing-lists/:id`, and `POST /api/packing-lists/:id/duplicate`.
- [ ] 2.3 Update `/api/routes` endpoints to support persisting and returning the linked `packingListId`.

## 3. Web UI & Gear Management

- [ ] 3.1 Create `PackingListModal.tsx` in `apps/web/src/components` with categorized item list, weight tally cards, and checkoff mode.
- [ ] 3.2 Add packing list selector dropdown in `RouteMetadataModal.tsx` to associate a gear list with an active route.
- [ ] 3.3 Add "Paklijst beheren" button and badge to route details in `App.tsx` and `RouteLibraryModal.tsx`.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying weight tallies, CRUD endpoints, and route linking.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/packing-lists.spec.ts` creating a packing list, adding gear, and linking to a route.
