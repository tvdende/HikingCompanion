## Why

Long-distance trails (like Pieterpad, GR routes, or West Highland Way) are inherently multi-day hikes composed of multiple stages (etappes). Currently, Hiking Companion only displays an aggregate stage count (`Etappes: 1`) and collapses all waypoints into a single hardcoded stage. Users cannot define where a stage begins or ends, view individual stage metrics, or edit a specific stage while keeping the overall route visible in context.

Introducing multi-stage route management allows hikers to plan realistic multi-day itineraries, split routes into distinct day stages, inspect per-stage metrics (distance, ascent, descent), and navigate/edit individual stages on the map with contextual visibility of the entire trail.

## What Changes

- **Multi-Stage Definition & Splitting**: Users can split an active route into multiple sequential stages (etappes) at any waypoint or add new stages directly from the planner.
- **Visual Stage Distinction on Map**: Each stage is rendered with distinct color-coding or visual styling. The currently active/selected stage is highlighted prominently, while non-active stages remain visible with slightly subdued contrast.
- **Stage List & Per-Stage Metrics**: A dedicated stage management panel in the planner sidebar displays an ordered list of all stages with individual distances (km), elevation gain/loss (m), and waypoints count.
- **Stage Selection & Focused Camera Zoom**: Clicking a stage in the list selects it, smoothly pans/fits the map camera to the bounds of that specific stage, and opens its details.
- **Scoped Stage Editing**: When editing a stage, waypoints and drag handles for that stage are active for manipulation, while the remaining stages stay visible on the map canvas to maintain global route context.
- **GPX Multi-Track Parity**: Multi-stage routes preserve their stage boundaries when exporting to standard GPX (`<trk>` / `<trkseg>` elements) and when importing multi-stage GPX files.

## Capabilities

### New Capabilities
- `route-stages`: Multi-stage route creation, stage boundary definition and splitting, per-stage metrics computation, stage-focused map camera navigation, and visual stage differentiation.

### Modified Capabilities
- `route-planner`: Update route planner editor to support stage selection, stage-aware waypoint manipulation, and passing multi-stage polylines to the map viewer.

## Impact

- **Frontend**:
  - `apps/web/src/App.tsx`: Route state management with active stage selection, multi-stage recalculation, and stage CRUD actions.
  - `apps/web/src/components/MapCanvas.tsx`: MapLibre layers for multi-stage polylines with per-stage color palettes, active stage highlight, and stage boundary markers.
  - `apps/web/src/components/StageManagerPanel.tsx`: New component in the planner sidebar displaying the stage list, stage metrics, reordering/splitting actions, and stage editing controls.
  - `apps/web/src/i18n/`: Dutch and English translation strings for all stage management terms.
- **Core Library**:
  - `packages/core/src/route-editing/`: Multi-stage waypoint splitting, stage distance calculation, and stage extraction utilities.
- **APIs & Database**:
  - Saved route JSON schema already supports `stages: HikeStage[]`; ensure database queries and serialization preserve multi-stage array structure.
