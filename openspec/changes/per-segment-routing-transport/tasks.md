## 1. Shared Connection Contract

- [ ] 1.1 Confirm implementation is on a dedicated `feat/*` branch and preserve existing GPX-order work; verify the starting worktree and branch before editing application code.
- [ ] 1.2 Extend `RouteWaypoint`, `RouteSegment`, and `HikeStage` with the additive incoming-transport and persisted-segment contract from the design; add shared effective-transport resolution with explicit override > stage default > walking precedence. Verify type compilation and unit cases for walking, all transit types, missing fields, and default changes.
- [ ] 1.3 Extend waypoint-pair resolution and segment diff/cache consumption so transport updates apply to retained geometry while only mode/endpoint changes require geometry resolution. Verify in `tests/unit/route-editing.test.ts` that ferry-to-train and cache hits cannot retain stale classification and unrelated segments remain byte-for-byte unchanged.

## 2. Editor Transformations and Metrics

- [ ] 2.1 Add a pure operation to change one existing within-stage incoming connection, rejecting missing or cross-stage pairs, with transit choices setting direct mode. Verify unit tests for all five choices and unchanged global drawing mode, stage count, neighboring settings, and coordinates.
- [ ] 2.2 Preserve incoming settings through move, insertion, and reversal; make a newly bridged connection after deletion use snap routing and the stage default without obsolete overrides. Verify mixed-type edge fixtures, reversed endpoint ownership, both inherited split edges, and deletion/undo restoration in route-editing tests.
- [ ] 2.3 Update split/merge/reorder stage transformations and legacy extraction in `packages/core/src/route-editing/stages.ts` to preserve surviving overrides, stage boundaries, and exact segment slices. Verify existing stage/import regression tests plus mixed-stage boundary cases.
- [ ] 2.4 Compute stage/route walking and transit totals from effective connections, keeping legacy stage fallback. Verify the exact 2000m trail + 500m straight walking + 1000m ferry fixture yields 2.5km walking, 1km transit, and 3.5km total, and classification-only edits preserve the total.

## 3. Durable Save and Load

- [ ] 3.1 Extend create/update/detail handling in `apps/api/src/routes/routes.ts` to persist stage segments and waypoint overrides in existing JSON columns, preserving them on metadata-only updates. Verify POST -> GET -> PUT -> GET round trips retain endpoint IDs, every transport type, routing modes, exact geometry, and existing ownership restrictions in `tests/unit/routes-api.test.ts`.
- [ ] 3.2 Validate extended connection data atomically before persistence, including supported values, finite coordinates/distances, endpoint references, adjacency, stage ownership, and settings/geometry consistency. Verify descriptive 400 responses and unchanged stored data for invalid POST/PUT payloads, while legacy payloads remain accepted.
- [ ] 3.3 Wire `App.tsx` save/load to restore saved waypoints and segment geometry, initialize committed segments/cache/history, and use legacy extraction only when extended data is absent. Verify reload makes zero routing requests and the first local edit leaves all unrelated imported or saved segment coordinates unchanged.

## 4. Consistent Walking Surface Analysis

- [ ] 4.1 Add shared extraction of separate walking portions from effective connection classifications, retaining stage IDs and unknown direct-walking geometry. Verify walking A-B / ferry B-C / walking C-D never creates an analysis edge B-C and transit-only routes produce no walking portions.
- [ ] 4.2 Use the shared extraction for client manual analysis, immediate BRouter metadata breakdowns, server surface requests, and automatic save analysis; extend the surface input contract additively for disconnected portions. Verify provider inputs, walking-only totals, 100-percent normalization, malformed-input errors, and no external requests for transit-only routes in focused surface tests.
- [ ] 4.3 Invalidate persisted analysis when included walking geometry or walking/transit membership changes, including classification-only changes with identical coordinates. Verify foot-to-ferry and ferry-to-foot invalidate, ferry-to-train and metadata-only updates retain valid analysis, and stale results are never saved or redisplayed.

## 5. Planner Interaction and Map

- [ ] 5.1 Add the incoming-connection selector to the existing waypoint popup with endpoint numbers and current choice, hidden for first points and unavailable cross-stage pairs. Wire updates through history and existing cancellation/feedback handling. Verify keyboard/touch use, no accidental map point creation, all five choices, and that a late snap response cannot overwrite a transit selection.
- [ ] 5.2 Render connection-level map features and midpoint ferry/train/bus identifiers while retaining stage palettes, active/inactive emphasis, existing boundary markers, and legacy stage rendering. Verify small crossings, stage/surface modes, view/edit modes, repeated loads, and removal of obsolete badges.
- [ ] 5.3 Wire connection-aware stage/route summaries and straight-transit estimate wording. Reuse existing NL/EN transport/routing labels and add matching localized connection, estimate, and accessibility keys; verify displayed totals, translation-key parity, and no hardcoded user-facing copy in touched components.
- [ ] 5.4 Extend Playwright planner/library coverage with mocked routing and save/detail APIs: change only B-C, save, reload, reopen, inspect exact restored settings/geometry, edit a neighbor, undo/redo, reverse, and switch map modes. Verify ferry, train, and bus identifiers and zero routing requests on reload or direct/transit edits on desktop and mobile; also verify return-to-snap fallback warnings.

## 6. Documentation and Integration Verification

- [ ] 6.1 Update `docs/route-stages-and-transit.md` with the existing-connection workflow, precedence, deletion behavior, map identifiers, estimated distances, persistence compatibility, and GPX limitations; update affected data-model sections of `docs/product-vision-and-techstack.md` and relevant localization guidance in `docs/i18n-localization.md`. Verify these documents describe the implemented UI and payload shape rather than planned or unsupported OV routing.
- [ ] 6.2 Run the narrowest combined unit selectors for route editing, stages, routes API, and surface analysis, plus focused planner/library Playwright selectors. Verify legacy transit-stage behavior, GPX geometry preservation, and current GPX-order behavior alongside the new mixed-connection cases.
- [ ] 6.3 Before a pull request, run `npm run test:unit` and `npm run build`; run `npm run test:e2e` locally. Verify passing results and inspect the final diff to ensure only intended feature/integration changes were added and pre-existing work was preserved.
