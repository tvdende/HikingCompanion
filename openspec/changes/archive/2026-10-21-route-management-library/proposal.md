## Why

Planners and hikers frequently combine multiple GPX day stages or trail segments into a single cohesive hike, but currently the planner only permits uploading a single file that overwrites the active track. Furthermore, route planners need a structured way to manage, curate, and prepare their created routes for personal use or future marketplace distribution: saving routes as drafts (`concept`) while actively refining them, marking them as finalized (`definitief`), and enriching them with rich descriptions, geographic regions/locations, and pricing.

Adding multi-GPX stitching and comprehensive route lifecycle/metadata management empowers planners to build production-grade routes and bridges the gap toward marketplace publication.

## What Changes

- **Multi-GPX Import & Track Stitching**:
  - Support multi-file selection and drag-and-drop for multiple `.gpx` files simultaneously.
  - Parse multiple GPX files in sequence and stitch their stages and coordinates together into a single continuous trail.
  - Automatic geodesic gap-bridging between consecutive GPX tracks to ensure continuous geometry.
  - Recalculate combined trail distance, cumulative elevation gain/loss, and stage breakdowns.

- **Route Database Schema Extensions**:
  - Extend Cloudflare D1 `routes` schema with `status` (`'draft' | 'definitive'`), `description` (text/markdown), `location` (text region/province), and `price_eur` (decimal currency value, defaulting to 0.00).
  - Generate and verify Drizzle Kit migration.

- **Enhanced Route Management REST API**:
  - Support status filtering (`GET /api/routes?status=draft|definitive`), location filtering, and search query parameters.
  - Support updating metadata (`title`, `description`, `location`, `status`, `priceEur`) independently of geometric points or simultaneously via `PUT /api/routes/:id`.

- **Planner Route Management & Library UI**:
  - Rich Route Library dashboard with tabs for "Alle Routes", "Concepten" (Drafts), and "Definitief" (Published/Finalized).
  - Route detail & metadata editor dialog enabling planners to configure title, region/location, rich description, status toggle (Concept vs Definitief), and price in EUR.
  - Status badges, price display, search input, and one-click loading into the map editor.

## Capabilities

### New Capabilities
- `route-library`: Comprehensive route lifecycle management and library UI allowing planners to curate, search, filter, edit metadata (description, location, status, price), and manage their routes.

### Modified Capabilities
- `gpx-engine`: Add capability to parse multiple GPX files and stitch separate tracks into a unified, continuous route with reconciled metrics.
- `database-storage`: Extend `routes` table with lifecycle status (`draft` vs `definitive`), description, geographic location, and marketplace price.

## Impact

- **Core Package (`@hiking-companion/core`)**: New stitching utility `stitchGpxRoutes(routes: HikeRoute[]): HikeRoute` and extended `RouteMetadata` types.
- **Backend API (`apps/api`)**: D1 schema additions in `schema.ts`, new migration file, updated validation in `POST /api/routes` and `PUT /api/routes/:id`.
- **Frontend Web App (`apps/web`)**: Multi-file drop & file picker in `App.tsx`, expanded `RouteLibraryModal.tsx` into a full management dashboard, and new `RouteMetadataModal.tsx`.
