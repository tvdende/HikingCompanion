## 1. Domain Types & Database Schema

- [ ] 1.1 Extend `HikeRoute` domain type in `packages/core/src/types/index.ts` with all guidebook fields (`startPoint`, `endPoint`, `durationDays`, `durationNights`, `recommendedPeriod`, `bestPeriod`, `logisticsNote`, `navigationTips`, `outdoorlicious`, `natureAndHistory`, `mindfulPrompts`, `emergencyInfo`, `packingListId`).
- [ ] 1.2 Extend D1 `routes` schema in `apps/api/src/db/schema.ts` with guidebook columns and generate Drizzle migration.
- [ ] 1.3 Update `apps/api/src/routes/routes.ts` endpoints to accept, persist, and return all guidebook fields.

## 2. Guidebook Editor UI

- [ ] 2.1 Upgrade `RouteMetadataModal.tsx` into a comprehensive tabbed Route Guide Editor providing inputs for all guidebook sections.
- [ ] 2.2 Add packing list picker dropdown to link an existing packing list to the route.

## 3. Printable Guide Component & PDF Layout

- [ ] 3.1 Create `PrintableRouteGuide.tsx` in `apps/web/src/components` with cover page, table of contents, route stats, elevation profile, surface breakdown chart, and stage summaries.
- [ ] 3.2 Add attached packing list table rendering categorized gear (Uitrusting, Slapen, Koken, etc.) with checkmarks.
- [ ] 3.3 Add POI locations section displaying campings, supermarkets, and sights with opening hours and clickable website links.
- [ ] 3.4 Add Outdoorlicious recipes, nature/landscape notes, mindfulness prompts, and emergency rescue protocol card.
- [ ] 3.5 Create print stylesheet `PrintableRouteGuide.css` with `@page` A4 styling, page break rules, and print trigger button (`window.print()`).

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying serialization and persistence of all extended route guidebook fields.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/printable-guide.spec.ts` filling in guidebook fields and opening the printable view.
