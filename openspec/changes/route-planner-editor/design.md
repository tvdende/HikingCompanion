## Context

See `proposal.md` for motivation and `specs/route-planner/spec.md` for functional requirements. The current web client parses static GPX files and renders polylines in MapLibre GL JS, but has no state machine or interaction handlers for creating or editing routes. The backend currently only manages authentication in Cloudflare D1 without a database table for saved routes.

## Goals / Non-Goals

**Goals:**
- Implement an interactive route editor on top of MapLibre GL with draggable waypoints, click-to-draw, segment insertion handles, delete, undo/redo, and route reversal.
- Deploy a Cloudflare Worker proxy (`POST /api/routing/route`) for foot/hiking routing using OpenStreetMap/OSRM foot profile, with a straight-line fallback.
- Provide a UI toggle between "Snap to wandelpaden" and "Rechte lijn" (vogelvlucht).
- Define a `routes` table in Cloudflare D1 using Drizzle ORM and generate migrations.
- Create `/api/routes` REST CRUD endpoints to save, list, load, and delete user routes.
- Provide a route management library dialog and a save route dialog in the Planner UI.

**Non-Goals:**
- Surface breakdown (analyzing OSM surface/tracktype tags) — deferred to a subsequent change.
- Multi-day stage splitting & knooppunten network graph — deferred to a subsequent change.
- Offline routing calculation (offline usage falls back to straight line drawing).

## Decisions

### Decision 1: Waypoint & Segment Data Model
In `packages/core/src/types/route-planner.ts`:
```ts
export interface RouteWaypoint {
  id: string;
  lat: number;
  lng: number;
  elevation?: number;
  routingMode: 'snap' | 'direct';
}

export interface RouteEditorState {
  waypoints: RouteWaypoint[];
  activeRoutingMode: 'snap' | 'direct';
  isEditing: boolean;
  canUndo: boolean;
  canRedo: boolean;
}
```
*Rationale*: Separating discrete user waypoints from the interpolated trail coordinates allows editing individual points without corrupting the track. Storing segments between waypoints allows localized recalculation (moving waypoint $k$ only re-routes segments $k-1 \to k$ and $k \to k+1$ rather than re-computing the entire trail).

### Decision 2: Cloudflare Worker Routing Proxy
In `apps/api/src/routes/routing.ts`:
- Route: `POST /api/routing/route`
- Query OSRM Foot API (`https://routing.openstreetmap.de/routed-foot/route/v1/driving/...`) or BRouter web instance with `coordinates: [lng, lat][]`.
- Response: Decoded coordinates `[lng, lat][]`, distance in meters, and duration.
- Fallback: If external routing fails or times out (5s), generate direct geodesic straight-line coordinates and return `{ coordinates, isFallback: true }`.
- *Rationale*: Avoids CORS issues in the browser, hides external endpoints, and enables centralized error handling and future caching in Cloudflare.

### Decision 3: MapLibre GL Waypoint & Interaction Layer
In `apps/web/src/components/MapCanvas.tsx`:
- Render draggable HTML `Marker` instances for waypoints:
  - Green pin for Start (index 0)
  - Red pin for Finish (last index)
  - Blue numbered circles for intermediate waypoints
- On drag: Show instant visual feedback; on `dragend`, trigger segment recalculation.
- On segment hover: Display an intermediate split handle ("+") that creates a new waypoint at that coordinate when clicked.
- On waypoint click: Display a popover with options ("Verwijder punt", "Wissel routering").

### Decision 4: Undo / Redo History Stack
- Keep an immutable array of waypoint states: `history: RouteWaypoint[][]` and pointer `historyIndex: number`.
- Adding, moving, deleting, or reversing waypoints pushes a new state to the stack (capped at 50 entries).
- "Undo" decrements the pointer; "Redo" increments the pointer.

### Decision 5: Cloudflare D1 Database Schema
In `apps/api/src/db/schema.ts`:
```ts
export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  totalDistanceKm: real('total_distance_km').notNull(),
  coordinatesJson: text('coordinates_json').notNull(),
  waypointsJson: text('waypoints_json'),
  stagesJson: text('stages_json'),
  elevationMetricsJson: text('elevation_metrics_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
```
- Authenticated endpoints in `apps/api/src/routes/routes.ts`:
  - `GET /api/routes`: List user's routes (`id`, `title`, `totalDistanceKm`, `updatedAt`)
  - `POST /api/routes`: Save active route with title
  - `GET /api/routes/:id`: Retrieve full route payload
  - `PUT /api/routes/:id`: Update existing route
  - `DELETE /api/routes/:id`: Remove route

## Risks / Trade-offs

- **[Risk] External routing service latency or downtime**
  → *Mitigation*: Automatic failover to direct straight-line geometry with a friendly notification in the UI.
- **[Risk] Waypoint drag event performance**
  → *Mitigation*: Recalculation is debounced and performed exclusively on `dragend`, preventing request spam during active dragging.
- **[Risk] Large coordinate payloads in D1 database**
  → *Mitigation*: Routes under 100km have ~1,000 to 5,000 points (~100KB JSON), well within Cloudflare D1 SQLite row size limits.
