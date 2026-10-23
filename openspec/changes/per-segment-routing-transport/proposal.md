## Why

A short ferry crossing or transit transfer should not require splitting a hiking day into separate stages or routing a long walking detour. Users need to change one existing connection between consecutive route points, recognize its meaning on the map, and retain that exact choice after saving and reopening.

## What Changes

- Add a connection editor for an existing pair of consecutive waypoints within the same stage, offering trail-following walking, straight-line walking, ferry, train, and bus.
- Keep ferry, train, and bus connections straight, explicitly typed, and visually recognizable with dashed lines and transport icons; leave surrounding walking connections unchanged.
- Persist connection settings, stable waypoint identities, and calculated segment geometry through route creation, updates, and reloads. Existing routes without segment metadata retain their current behavior.
- Preserve connection settings during undo/redo, reversal, waypoint edits, and stage operations.
- Calculate walking/transit distances and surface analysis from individual connections in mixed stages rather than assigning the entire stage to one transport mode.
- Reuse Dutch/English transport labels and document the new workflow and compatibility rules.

## Capabilities

### New Capabilities

None. This extends the existing planner, stages, and surface-analysis capabilities.

### Modified Capabilities

- `route-planner`: Edit and persist routing/transport choices for individual existing connections, including editor-history and geometry-preservation behavior.
- `route-stages`: Support mixed walking/transit connections within one stage, with connection-level map styling and accurate distance breakdowns while retaining stage-level transport defaults.
- `surface-analysis`: Exclude transit connections inside mixed stages, preserve walking boundaries, and invalidate analysis when walking inclusion changes.

## Impact

- Shared domain types and route-editing helpers in `packages/core`, including waypoint-pair resolution, cache/diff handling, stage transformations, and metrics.
- Planner state, save/load flow, waypoint popups, map features, stage summaries, and NL/EN localization in `apps/web`.
- Route create/update/detail payloads and JSON persistence in `apps/api`, plus client/server surface-analysis inputs and invalidation.
- Existing route-editing, stage, route-API, surface-analysis, and Playwright planner/library tests.
- Related documentation in `docs/route-stages-and-transit.md`, `docs/product-vision-and-techstack.md`, and `docs/i18n-localization.md`.
- No new routing provider or runtime dependency is expected. Segment metadata can use the existing stage JSON storage without a new D1 column.

## Non-goals

- No new next-connection drawing controls; the existing global drawing-mode toggle remains unchanged.
- No automatic public-transport itinerary, railway/road routing, timetable, ticket, or fare integration.
- No selection spanning non-consecutive waypoints or different stages.
- No new GPX extension or guarantee of per-connection transport metadata round-tripping through GPX; existing GPX geometry and stage-type behavior remain supported.
- No application-code implementation during this proposal workflow.
