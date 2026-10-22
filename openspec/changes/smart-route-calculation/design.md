## Context

See [proposal.md](file:///c:/src/TE/HikingCompanion/openspec/changes/smart-route-calculation/proposal.md) for background and motivation.

Currently, `updateRoute()` in `apps/web/src/App.tsx` sequentially iterates through all waypoint pairs:
```typescript
for (let i = 0; i < waypoints.length - 1; i++) {
  // await fetch('/api/routing/route') sequentially
}
```
This causes an $O(N)$ network latency cascade on every single edit, even when only one waypoint was appended or moved.

## Goals / Non-Goals

**Goals:**
- **Zero Redundant Routing**: Retain existing segment geometry and metrics when adjacent waypoint coordinates and routing mode remain unchanged.
- **Sub-Millisecond Cache Hits**: Resolve previously computed segments (e.g. after undo/redo, reversible segments) instantly from an in-memory client segment cache.
- **Concurrent Network Execution**: Run any required routing fetches in parallel using `Promise.all` instead of sequential `for ... await`.
- **60fps Waypoint Dragging**: Provide immediate rubber-band straight-line visual feedback during interactive waypoint dragging, postponing trail-snapped calculation to `onDragEnd`.
- **Race Condition Prevention**: Abort in-flight calculations via `AbortController` whenever new waypoint edits occur.

**Non-Goals:**
- Modifying the `/api/routing/route` endpoint interface or database schemas.
- Bundling entire routes into a single multi-waypoint BRouter call (which breaks individual segment tracking, per-segment mode selection, and intermediate waypoint split handles).
- Full offline routing engine inside the browser.

## Decisions

### 1. Differential Segment Matching Strategy
- **Approach**:
  Before making any network calls in `updateRoute()`, the client compares the target list of segments $S_i = (W_i, W_{i+1})$ against the currently loaded `segments`:
  1. **Direct State Reuse**: If an existing segment in `segments` already has matching `fromWaypointId`, `toWaypointId`, coordinates (within $10^{-6}$ degrees), and `routingMode`, it is reused immediately.
  2. **Cache Lookup**: If not in current state, check the global in-memory `segmentCache`. If hit, reuse the coordinates and distance.
  3. **Concurrent Batch Fetch**: Any remaining uncalculated segments are fetched in parallel with `Promise.all`.
- **Alternatives Considered**:
  - *Full recalculation with debouncing*: Still produces multi-second delays on long routes.
  - *Diffing at the waypoint level*: Tracking indices can become fragile when inserting/reordering waypoints. Diffing by endpoint coordinates and waypoint IDs is deterministic and resilient.

### 2. Segment Cache Design
- **Key Format**:
  `${from.lng.toFixed(6)},${from.lat.toFixed(6)}_${to.lng.toFixed(6)},${to.lat.toFixed(6)}_${mode}`
- **Storage**:
  An in-memory `Map<string, { coordinates: Coordinate[]; distanceMeters: number }>` capped at 1000 entries (LRU eviction).
- **Bidirectional Hiking Lookup**:
  Foot trails are bidirectional. When querying A $\to$ B in 'snap' mode, if B $\to$ A is cached, its coordinates can simply be reversed (`reversedCoords = [...cached.coordinates].reverse()`), doubling the cache hit rate on route reversals or loop closures.

### 3. Dragging Experience (Rubber-banding)
- **UX Flow**:
  1. `onDragStart`: Mark `draggedWaypointId` in map state.
  2. `onDrag`: Update a lightweight GeoJSON source on MapLibre rendering straight dashed lines to neighboring waypoints. No routing calls are fired.
  3. `onDragEnd`: Commit the final coordinate to the waypoint array, triggering the differential update for only the 1 or 2 affected segments.

### 4. AbortController Lifecycle
- Maintain an active `AbortController` in a React `useRef`.
- At the start of `updateRoute()`, call `activeController.abort()` to cancel pending fetch requests.
- Pass `signal` to `fetch('/api/routing/route', { signal })`. Catch `AbortError` gracefully without clearing existing route state.

## Risks / Trade-offs

- **[Coordinate Jitter]** Floating point noise between drag events could cause cache misses.  
  *Mitigation*: Normalize coordinates with `Number(coord.toFixed(6))` (~11 cm precision) across all core functions and cache keys.
- **[Stale State on Abort]** Aborting an in-flight request might leave segments out of sync with waypoints.  
  *Mitigation*: Do not update `segments` state until the active calculation for the current waypoint generation completes cleanly.
