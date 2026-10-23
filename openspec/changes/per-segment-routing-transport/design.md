## Context

See [proposal.md](proposal.md) for motivation and confirmed scope. This design is necessary because the change crosses shared editing state, API persistence, map rendering, and surface analysis.

Observed implementation:

- `RouteWaypoint.routingMode` already describes the incoming edge: `createWaypointPairs` reads the destination waypoint's mode. `RouteSegment` contains endpoint IDs and resolved geometry but no transport type.
- Transport currently lives on `RouteStageDefinition` and `HikeStage`. `MapCanvas` draws one feature per stage and puts transport icons at stage boundaries.
- `App.tsx` saves waypoints and stage coordinates, but `handleLoadSavedRoute` reconstructs editable waypoints with `extractWaypointsPerStage` instead of restoring saved waypoint identities and exact per-connection boundaries. Merely adding a transport field will not fix persistence.
- History snapshots contain waypoints and stage definitions. Reversal currently reverses the waypoint array, which is insufficient for incoming-edge metadata.
- Client/server surface selection currently filters whole stages by `transportType`. A mixed stage would incorrectly include transit geometry unless all entry points change together.
- The existing surface spec already requires walking-only coverage and automatic save analysis. This change refines those requirements for mixed stages; it does not remove unavailable-provider behavior or promise a new analysis provider.
- The working tree already contains unrelated GPX-order work and documentation edits. Preserve that work; only planning artifacts are changed in this workflow.

## Goals / Non-Goals

**Goals:**

- Use one authoritative definition of incoming-edge settings and effective transport throughout the editor, persistence, metrics, and surface analysis.
- Reuse existing interpolation, differential routing, cache, stage defaults, localization, and feedback mechanisms.
- Preserve exact unaffected geometry, including imported geometry, across the first edit after loading.
- Keep the data-format extension additive and the interaction discoverable on desktop and mobile.

**Non-Goals:**

- Do not create a second routing system or a separate stage for every transfer.
- Do not retrofit new segment metadata into historical routes on deployment.
- Do not change GPX interchange semantics or claim straight-line distances represent actual bus/train itineraries.

## Decisions

### 1. Edit the incoming connection from its destination waypoint

Extend the existing waypoint popup in editing mode with a section identifying "point N to point N+1". Offer five choices: trail-following walking, straight walking, ferry, train, and bus. The first point of a stage has no incoming connection control. Selecting a choice changes exactly one edge; opening/cancelling never edits geometry. Use a native keyboard-operable control and localized labels, and keep actions large enough for touch.

This reuses the existing marker popup interaction and avoids ambiguous map-line clicks that already select stages or insert points. It also avoids a new drawing-mode control, explicitly excluded by the user.

### 2. Keep incoming-edge settings on waypoints and resolved geometry on segments

Add optional incoming-edge `transportType` to `RouteWaypoint`, using the existing shared `TransportType`. An explicit connection choice writes both `routingMode` and `transportType` on the destination waypoint. Resolve effective transport as explicit waypoint override, otherwise stage default, otherwise `foot`. The first point's incoming fields are not an edge.

Extend `RouteSegment` with resolved transport classification, and add optional `segments` to `HikeStage` for exact persisted per-stage geometry and connection boundaries. Keep top-level saved waypoints as the authoritative editable identities/settings; stage segments are the validated materialized geometry. Generate both from the same editor state. A shared normalization/resolution helper supplies effective settings for all consumers, not parallel client/server rules.

Explicit ferry/train/bus selections always write `direct`; explicit walking selections write `snap` or `direct`. Do not retroactively straighten legacy transit stages: their stored geometry and inherited transport behavior remain unchanged until a connection is explicitly edited.

Alternative: a separate edge-settings map would avoid shifting incoming-edge fields during reversal, but duplicates the existing routing-mode convention and requires more extensive history/persistence changes. Storing classification only on transient calculated segments would lose settings when geometry is recalculated.

### 3. Extend the existing save contract without a schema migration

Persist optional stage `segments` in existing `stagesJson` and incoming transport overrides in `waypointsJson`. Wire POST, PUT, and detail responses consistently. Existing list summaries need no new payload field unless their displayed distance breakdown requires it.

For the extended format, validate enums, finite coordinates/distances, endpoint existence, pair adjacency, stage ownership, and consistency between waypoint settings, segment settings, and stage geometry before writing. Partial metadata or mismatched endpoints must return descriptive HTTP 400 errors, not downgrade to legacy mode. Metadata-only updates must preserve the extended representation. Keep existing authentication/ownership enforcement.

On load, restore saved waypoints and stage segments, seed committed segments/cache, and initialize history before enabling editing. This avoids routing calls on open and protects unchanged paths on the first mutation. For a legacy route, extract editable waypoints plus the exact geometry slices between them; do not replace imported slices with newly routed paths. Assign valid stage identities during normalization.

Alternative: persisting only transport overrides is smaller but cannot restore boundaries reliably because the current loader resamples the line. A new D1 table/column adds migration complexity without a benefit for this bounded extension.

### 4. Preserve edge meaning through every affected edit

Apply changes through existing waypoint/stage history snapshots. Include transport in pair resolution. Mode or endpoint changes invalidate geometry only for affected edges; ferry-to-train updates classification without a walking routing call. Geometric cache entries remain keyed by coordinates and routing mode, not vehicle type; classification must be resolved from current settings on every hit.

- Move: retain both adjacent edge choices and recalculate only affected geometry.
- Insert: inherit the split connection's settings for both replacement edges. Preserve available walking polyline slices when possible; direct/transit edges use existing interpolation.
- Reverse: reverse geometry and transfer incoming settings to the new destination of the same physical edge, rather than reversing waypoints alone.
- Delete: remove both incident overrides; initialize the new bridge with `snap` and no explicit transport override, so the containing stage default applies. Do not extend an old ferry designation across a different pair of endpoints.
- Split/merge/reorder stages: preserve surviving edge overrides and segment slices, including shared stage boundaries. Never reinterpret adjacency across stage boundaries as an editable within-stage connection.
- Async work: retain existing cancellation and stale-result protection so a late snap response cannot overwrite an explicit direct/transit selection.

The deletion policy is a documented conservative assumption: a new physical connection does not inherit an obsolete local transfer designation.

### 5. Render and summarize individual connections

Emit map line features per resolved connection where segment data exists, retaining stage ID, palette, active opacity, and stroke emphasis. Use existing whole-stage rendering only for normalized legacy geometry. Transit uses dashed lines plus a midpoint transport badge and localized text/accessible naming; straight walking remains a walking feature. Do not replace stage boundary markers. Remove obsolete badges when routes or settings change.

Update stage/route distance summaries through shared effective-classification logic. Sum walking and transit before rounding, use exact segment distances, and mark direct transit values as estimates. Keep stage total distance and existing elevation behavior; this change does not redefine elevation statistics.

### 6. Analyze disconnected walking portions, never a flattened mixed stage

Build shared walking-geometry selection from effective connections, returning separate contiguous portions and stage identities. Use it for client manual analysis, routing metadata, backend surface requests, and the save pipeline. Never flatten walking A-B and C-D into a line that invents B-C across a ferry.

Invalidate analysis using included walking geometry and walking/transit classification, not just aggregate stage coordinates. Foot-to-ferry with identical coordinates invalidates; ferry-to-train with unchanged walking portions does not. Drop transit surface messages from immediate breakdowns. Keep unclassified direct walking as unknown. Transit-only routes make no external analysis request and retain no stale walking breakdown.

The current API surface input accepts walking stages; adapt it additively to carry separate walking portions with their original stage IDs, preserving existing legacy stage inputs. Validate the extended input instead of silently accepting malformed segment data.

### 7. Localization and documentation ship with implementation

Reuse `stages.transportFoot`, `stages.transportBus`, `stages.transportTrain`, and `stages.transportFerry` and existing routing labels where applicable. Add connection labels, estimate help, and accessibility text in both NL and EN with identical keys. Audit every touched UI component for hardcoded user-facing copy.

Update the stage/transit guide with the incoming-connection workflow, defaults/overrides, deletion behavior, estimates, save compatibility, and GPX limitations. Update the technical overview's data model and relevant localization guidance only where affected. Do not document planned functionality as already available during this proposal-only turn.

## Risks / Trade-offs

- [Geometry and settings can diverge] -> Validate the extended save representation and build both from one normalized editor state; test exact coordinates, not merely matching distance totals.
- [Resampled legacy waypoints can destroy imported paths] -> Retain extracted segment slices and seed committed geometry before the first edit.
- [A ferry becomes walking after reverse or split] -> Test incoming-edge reassignment and all boundary transformations with unique transport choices on adjacent edges.
- [Surface requests accidentally bridge a transit gap] -> Assert separate provider input portions and exact walking-only totals in client/API tests.
- [Old clients can discard new fields on a full route rewrite] -> Deploy API validation/support before the new client; supported clients must preserve metadata. Older pre-feature clients cannot guarantee per-connection editing and are outside that guarantee.
- [More map features and badges] -> Reuse sources/layers and clean up markers; test repeated load/edit transitions and small crossings without changing global map interactions.
- [Another active GPX change touches the same files] -> Integrate existing edits without reverting them and run combined import/load regression tests during apply.

## Migration Plan

1. Add optional domain fields, normalization/validation, and unit coverage; no bulk database rewrite.
2. Ship API persistence and surface-selection compatibility before or together with the web client.
3. Ship restoration, connection editing, map/metric changes, NL/EN copy, and documentation.
4. Validate a newly saved mixed route and a legacy imported multi-stage route against the same deployment.
5. Roll back the UI if needed without deleting stored metadata. An older UI may display aggregate geometry but must not be used to rewrite extended routes if metadata preservation cannot be guaranteed.
