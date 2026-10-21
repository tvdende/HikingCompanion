## Context

See `proposal.md` for motivation and `specs/route-library/spec.md`, `specs/gpx-engine/spec.md`, and `specs/database-storage/spec.md` for behavior requirements. 

Currently, the planner application only processes a single GPX file at a time, overwriting the canvas upon each upload. The D1 `routes` table only stores basic geometric columns (`title`, `total_distance_km`, `coordinates_json`, `waypoints_json`, `stages_json`, `elevation_metrics_json`), lacking domain fields for lifecycle state (`draft` vs `definitive`), description, geographic location/region, and pricing.

## Goals / Non-Goals

**Goals:**
- Enable seamless multi-GPX file upload and sequential track stitching in `@hiking-companion/core` and the web UI.
- Extend Cloudflare D1 `routes` schema with `status`, `description`, `location`, and `price_eur` columns via Drizzle ORM.
- Provide filtered and searchable REST endpoints for managing routes (`GET /api/routes?status=...&search=...`, `PUT /api/routes/:id`).
- Implement an upgraded Route Management Dashboard in the frontend with status tabs (Alle, Concepten, Definitief), search, and a metadata editing modal (`RouteMetadataModal.tsx`).

**Non-Goals:**
- Mollie payment checkout integration (scoped to marketplace phase in section 4.6).
- Public unauthenticated marketplace storefront (this change focuses on planner route authoring and management).
- Advanced topological network graph snapping between disparate GPX tracks (tracks are joined sequentially in file order with straight-line bridges).

## Decisions

### Decision 1: Core Track Stitching Engine
In `packages/core/src/gpx/stitcher.ts`:
- Define `stitchGpxRoutes(routes: HikeRoute[], defaultTitle?: string): HikeRoute`:
  - Iterates through the provided parsed routes in order.
  - Sequentially combines their `HikeStage` arrays, re-numbering stages `1..N`.
  - Joins the last coordinate of stage $k$ to the first coordinate of stage $k+1$ (using geodesic straight-line interpolation if endpoints are not identical).
  - Re-calculates cumulative distance and combines elevation gain/loss.
  - Combines waypoints into a unified sequence.
- *Alternatives considered*: Discarding intermediate stages and flattening into one single stage. *Rationale*: Retaining stage boundaries preserves the multi-day hike structure intended by hikers.

### Decision 2: Multi-File Web Input
In `apps/web/src/App.tsx`:
- Enable `multiple` on `<input id="gpx-file-input" type="file" multiple accept=".gpx,application/gpx+xml,text/xml" />`.
- Update drop handler `handleDrop` to process `Array.from(e.dataTransfer.files)`.
- If 1 file: parse normally. If $>1$ files: parse all and call `stitchGpxRoutes`.
- Add an "Extra GPX toevoegen" button in the planner sidebar to append files to the current active route.

### Decision 3: Cloudflare D1 Schema Extension
In `apps/api/src/db/schema.ts`:
```ts
export const routeStatusEnum = ['draft', 'definitive'] as const;
export type RouteStatus = (typeof routeStatusEnum)[number];

export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  status: text('status', { enum: routeStatusEnum }).notNull().default('draft'),
  priceEur: real('price_eur').notNull().default(0.0),
  totalDistanceKm: real('total_distance_km').notNull(),
  coordinatesJson: text('coordinates_json').notNull(),
  waypointsJson: text('waypoints_json'),
  stagesJson: text('stages_json'),
  elevationMetricsJson: text('elevation_metrics_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
```
- Generate Drizzle migration (`drizzle-kit generate`).

### Decision 4: Route Management Dashboard & Metadata Modal
- Transform `RouteLibraryModal.tsx` into a Route Management Dashboard:
  - Header with title, stats, and "Nieuwe Route" action.
  - Filter pill tabs: "Alle Routes", "Concepten" (amber badge), "Definitief" (emerald badge).
  - Search input filtering on `title` and `location`.
  - Route Card components with metadata chips: distance, elevation, location, price (`Gratis` or `€X.XX`), and status badge.
  - Quick action buttons: "Openen" (load to map), "Bewerken" (open metadata editor), "Verwijderen".
- Create `RouteMetadataModal.tsx`:
  - Form fields for `title`, `status` (Concept / Definitief), `location`, `priceEur`, and `description`.
  - Submits partial update `PUT /api/routes/:id`.

## Risks / Trade-offs

- **[Risk] Large coordinate payloads during metadata-only updates**
  → *Mitigation*: Support partial updates in `PUT /api/routes/:id` so editing description, status, or price does not require re-sending or re-serializing the entire coordinate array.
- **[Risk] Gap between non-contiguous GPX files**
  → *Mitigation*: Automatically insert a geodesic straight-line connector between disparate tracks, and inform the user of the stitched stages in the sidebar.
