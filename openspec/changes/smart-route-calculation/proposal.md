## Why

Currently, whenever any waypoint is added, edited, or moved in the route planner, the client recalculates all route segments sequentially via `for (let i = 0; ...) await fetch('/api/routing/route')`. For a route with 10 waypoints, this triggers 9 consecutive round-trips to the routing engine (BRouter), causing multi-second freezes (3–7 seconds) and redundant network load. Furthermore, moving or appending a single waypoint needlessly re-queries segments that have not changed, and undoing/redoing re-queries segments that were already computed moments earlier.

Optimizing this calculation with differential recomputation, parallel fetching, client-side segment caching, and smooth drag-previews will deliver an instant, lag-free editing experience and reduce API traffic by over 80%.

## What Changes

- **Differential Segment Recomputation**: When waypoints change (appended, inserted, moved, deleted), only the invalidated ("dirty") segments are recomputed. All unchanged segments retain their previously resolved polylines and distances without network calls.
- **Concurrent Segment Resolution**: When multiple segments need recomputation simultaneously (e.g. during bulk insertion or initial load), requests are executed concurrently via `Promise.all` rather than sequentially.
- **Client-Side Segment Cache**: Introduce an in-memory segment cache keyed by `fromCoordinate_toCoordinate_mode` to instantly resolve previously computed segments (0ms latency during undo, redo, or path reversals).
- **Responsive Waypoint Dragging**: During interactive waypoint dragging on the map canvas, provide real-time straight-line rubber-banding preview at 60fps, committing the actual trail-snapped calculation only upon drop (`onDragEnd`).
- **Request Cancellation**: Utilize `AbortController` to cancel in-flight routing calculations when newer edits occur, preventing race conditions and stale state overwrites.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `route-planner`: Add requirements for differential recomputation of modified route segments, client-side segment caching, concurrent routing requests, and responsive drag-preview behavior.

## Impact

- **Frontend (`apps/web`)**:
  - `apps/web/src/App.tsx`: Refactor `updateRoute` to compute diffs against existing segments, consult the segment cache, and fetch missing segments in parallel.
  - `apps/web/src/components/MapViewer.tsx`: Update waypoint drag handlers to render transient preview lines during drag, committing to state on drag end.
  - New cache utility `apps/web/src/utils/segmentCache.ts` or helper within packages/core.
- **API (`apps/api`)**:
  - Existing `/api/routing/route` endpoint remains fully backward compatible.
- **Core (`packages/core`)**:
  - Route editing utility functions in `packages/core/src/route-editing` extended with diff detection and segment key generation.
