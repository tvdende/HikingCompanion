## 1. Domain Types, Importers & Database Schema

- [ ] 1.1 Define `PackingCategory`, `PackingItem`, and `PackingList` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Implement weight calculation utilities (`calculatePackingWeights`) in `packages/core/src/packing/weights.ts` with unit tests.
- [ ] 1.3 Implement LighterPack and Packstack CSV/JSON parsers and unit conversion utilities in `packages/core/src/packing/importers.ts` with unit tests.
- [ ] 1.4 Add `packing_lists` and `packing_list_items` tables and `routes.packing_list_id` column to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.

## 2. API Backend & Route Association

- [ ] 2.1 Implement `GET /api/packing-lists` and `POST /api/packing-lists` in `apps/api/src/routes/packing.ts`.
- [ ] 2.2 Implement `GET /api/packing-lists/:id`, `PUT /api/packing-lists/:id`, `DELETE /api/packing-lists/:id`, and `POST /api/packing-lists/:id/duplicate`.
- [ ] 2.3 Implement `PATCH /api/packing-lists/:id/items/:itemId/pack` for instant multi-day checkoff state persistence.
- [ ] 2.4 Implement `POST /api/packing-lists/import` accepting LighterPack and Packstack data and returning structured packing lists.
- [ ] 2.5 Update `/api/routes` endpoints to support persisting and returning the linked `packingListId`.

## 3. Web UI, Inpakmodus & External Importers

- [ ] 3.1 Create `PackingListModal.tsx` in `apps/web/src/components` with categorized item list, weight tally cards, and edit form.
- [ ] 3.2 Create `PackingChecklistModal.tsx` ("Inpakmodus") providing tap-to-pack checkboxes, progress bar ("21/30 ingepakt"), filter tabs ("Nog inpakken", "Alles"), and multi-day state resumption.
- [ ] 3.3 Create `ImportPackingModal.tsx` allowing hikers to paste or upload LighterPack and Packstack exports directly to a route.
- [ ] 3.4 Add "Inpakmodus starten" and "Paklijst beheren" buttons to the active route card in `App.tsx` and `RouteLibraryModal.tsx`.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying weight tallies, LighterPack/Packstack parsing, CRUD endpoints, and route linking.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/packing-lists.spec.ts` testing LighterPack CSV import, route attachment, and Inpakmodus checkoff persistence.
