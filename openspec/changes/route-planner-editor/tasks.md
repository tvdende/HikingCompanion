## 1. Domain Types & Core Utilities

- [x] 1.1 Define `RouteWaypoint`, `RouteSegment`, and `RouteEditorState` types in `packages/core/src/types` and export them via `packages/core/src/index.ts`.
- [x] 1.2 Implement route editing utilities (insert waypoint, delete waypoint, reverse route, geodesic straight-line interpolation) in `packages/core` and verify with unit tests in `tests/unit/route-editing.test.ts`.

## 2. Backend Routing Proxy & D1 Route Storage

- [x] 2.1 Add `routes` table to `apps/api/src/db/schema.ts` with foreign key cascade to `users.id`, export types, and generate D1 migration files via Drizzle Kit.
- [x] 2.2 Implement `POST /api/routing/route` endpoint in `apps/api/src/routes/routing.ts` with OSRM foot routing query, timeout handling, and straight-line fallback, verified via unit tests in `tests/unit/routing.test.ts`.
- [x] 2.3 Implement `/api/routes` REST CRUD endpoints (`GET /api/routes`, `POST /api/routes`, `GET /api/routes/:id`, `PUT /api/routes/:id`, `DELETE /api/routes/:id`) in `apps/api/src/routes/routes.ts` protected by session authentication, verified via unit tests in `tests/unit/routes-api.test.ts`.

## 3. Frontend Interactive Route Editor & Map Integration

- [x] 3.1 Create `RouteEditorToolbar.tsx` in `apps/web/src/components` providing controls for Edit mode toggle, Snap-to-trail toggle, Undo, Redo, Reverse direction, Save route, and Clear route.
- [x] 3.2 Update `MapCanvas.tsx` to support interactive waypoint placing on map click, draggable waypoint markers (start, end, intermediate), line segment split handles, and real-time polyline updates.
- [x] 3.3 Create `SaveRouteModal.tsx` and `RouteLibraryModal.tsx` in `apps/web/src/components` allowing authenticated users to name and save routes to D1 and load or delete existing saved routes.
- [x] 3.4 Integrate the editor toolbar, undo/redo state management, and route library into `App.tsx` and the Planner sidebar.

## 4. Verification & Testing

- [x] 4.1 Run unit tests (`npm run test:unit`) to confirm all core math, routing proxy, and database CRUD tests pass.
- [x] 4.2 Verify monorepo build succeeds without TypeScript or bundling errors using `npm run build`.
- [x] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/route-planner.spec.ts` covering placing waypoints on the map, undo/redo, reversing, and route saving, and verify using `npm run test:e2e`.
