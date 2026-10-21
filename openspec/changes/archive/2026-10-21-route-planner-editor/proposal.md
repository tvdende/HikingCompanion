## Why

Currently, the Hiking Companion PWA only supports importing existing GPX files and visualizing static tracks on the map. Users cannot interactively plan new hiking routes, click on the map to place waypoints, snap routes to real hiking paths, adjust waypoints, or persist custom routes to their account. Providing an interactive route editor with snap-to-trail capability and cloud synchronization fulfills Section 4.3 ("Route Planning & Kaartbewerking") of the product vision, transforming the application from a passive GPX viewer into an active route planning suite.

## What Changes

- **Interactive Route Editor Toolbar & Mode**: Introduce an interactive editing mode in the Planner UI allowing users to click on the map to add waypoints, drag waypoints to reshape the route, insert intermediate waypoints along segments, delete waypoints, undo/redo edits, and reverse route direction.
- **Snap-to-Trail Routing & Straight-Line Toggle**: Integrate a foot-routing engine (BRouter / OSM Foot profile) proxied through Cloudflare Workers (`/api/routing/route`), with a user toggle between "Snap to wandelpaden" (automatic routing along official trails and paths) and "Rechte lijn" (vogelvlucht for unmapped terrain).
- **Live Route Metrics**: Dynamically compute and display total distance in kilometers, elevation gain/loss, and waypoint counts as the user draws or modifies routes.
- **Route Persistence in Cloudflare D1**: Add a `routes` table in D1 with foreign key to `users.id`, and implement REST API endpoints (`GET /api/routes`, `POST /api/routes`, `GET /api/routes/:id`, `PUT /api/routes/:id`, `DELETE /api/routes/:id`) allowing authenticated users to save, rename, list, and reload routes.
- **Route Save & Export Dialog**: Provide a modal or panel action to save routes to the user's library and download routes as standard GPX 1.1 files.

## Capabilities

### New Capabilities
- `route-planner`: Provides interactive point-by-point route editing, waypoint manipulation (drag, insert, delete, undo/redo, reverse), snap-to-trail routing with straight-line fallback, live metric calculations, and route library management.

### Modified Capabilities
- `database-storage`: Extend relational schema definitions and migrations to include the `routes` table linked to `users`.

## Impact

- **Affected Code**:
  - `packages/core`: Add routing interfaces and geometry utilities for waypoint and segment manipulation.
  - `apps/api`: Add `routes` table in Drizzle schema and migrations; create `/api/routing/route` proxy endpoint and `/api/routes` CRUD routes.
  - `apps/web`: Create `RouteEditorToolbar.tsx`, `SaveRouteModal.tsx`, and `RoutesListModal.tsx`; update `MapCanvas.tsx` to handle waypoint interaction (markers, click-to-draw, drag events, line hover) and `App.tsx` / `PlannerPanel`.
- **Dependencies**: No external paid libraries needed; uses MapLibre GL event handlers and public OSM/BRouter routing APIs.
- **Security & Multi-Tenancy**: Routes stored in D1 are scoped to the authenticated `userId`, ensuring users only access and modify their own routes.
