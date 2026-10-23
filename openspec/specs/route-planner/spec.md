# route-planner Specification

## Purpose

Provides an interactive route planning and editing suite on the map canvas, supporting point-by-point waypoint creation, trail-snapped foot routing, straight-line fallback, edit history (undo/redo, reversal), and cloud route library persistence.

## Requirements

### Requirement: Interactive Route Drawing and Editing
The system SHALL provide an interactive route editor allowing users to place waypoints on the map canvas, drag existing waypoints to new geographic positions, insert intermediate waypoints along existing path segments, and delete individual waypoints.

#### Scenario: User adds waypoints on map click
- **WHEN** the user enables route editing mode and clicks on the map canvas
- **THEN** the system places a waypoint marker at the clicked location and draws the calculated route segment connecting it to the previous waypoint

#### Scenario: User drags an existing waypoint
- **WHEN** the user drags a waypoint marker to a new position on the map
- **THEN** the system recalculates the incoming and outgoing route segments and updates the polyline in real time upon release

#### Scenario: User inserts waypoint on trail segment
- **WHEN** the user clicks or drags an intermediate handle on an existing trail segment
- **THEN** the system splits the segment, inserts a new editable waypoint, and recalculates the adjoining segments

#### Scenario: User deletes a waypoint
- **WHEN** the user triggers delete on an existing waypoint
- **THEN** the system removes the waypoint, bridges the adjoining segments if remaining waypoints exist, and updates route metrics

### Requirement: Snap-to-Trail Routing and Straight-Line Fallback
The system SHALL support foot routing between consecutive waypoints that snaps to official walking trails and paths using an OpenStreetMap routing engine, and SHALL provide a toggle allowing the user to route via straight line (vogelvlucht) for unmapped or open terrain.

#### Scenario: Snap-to-trail path calculation
- **WHEN** two or more waypoints are placed while "Snap to wandelpaden" mode is active
- **THEN** the system queries the routing service and renders the polyline following walkable trails between the waypoints

#### Scenario: Straight-line mode toggle
- **WHEN** the user toggles routing mode to "Rechte lijn"
- **THEN** subsequently placed or edited segments connect directly between waypoints as geodesic straight lines without trail snapping

#### Scenario: Routing service failure fallback
- **WHEN** the external routing service fails or returns an error for a segment
- **THEN** the system falls back to a straight line for that segment and notifies the user with a non-blocking warning

### Requirement: History Navigation and Route Reversal
The system SHALL maintain an undo/redo history stack for all waypoint additions, removals, and position changes during an editing session, and SHALL allow reversing the route direction.

#### Scenario: Undo and redo waypoint modification
- **WHEN** the user triggers the "Undo" action after adding or moving a waypoint
- **THEN** the route reverts to its previous waypoint configuration and metrics update accordingly

#### Scenario: Reverse route direction
- **WHEN** the user clicks "Keer richting om" (reverse route)
- **THEN** the system reverses the order of all waypoints and segments, updating the start and destination markers

### Requirement: Route Cloud Persistence and Library Management
The system SHALL provide REST API endpoints allowing authenticated users to save their active routes, retrieve their saved route collection, load a saved route onto the planner canvas, and delete saved routes.

#### Scenario: Authenticated user saves active route
- **WHEN** an authenticated user submits a route with a title to `POST /api/routes`
- **THEN** the API stores the route record in Cloudflare D1 associated with the user's ID and returns the saved route object

#### Scenario: User lists and loads saved routes
- **WHEN** an authenticated user opens their route library
- **THEN** the client fetches `GET /api/routes`, displays the user's saved routes with titles and distances, and loads the selected route onto the map when clicked

#### Scenario: User deletes a saved route
- **WHEN** an authenticated user sends `DELETE /api/routes/:id` for their route
- **THEN** the API removes the route from the database and the client updates the library list

#### Scenario: Unauthorized route access rejection
- **WHEN** an unauthenticated visitor or a user attempting to access another user's route requests route modification endpoints
- **THEN** the API rejects the request with HTTP 401 Unauthorized or 403 Forbidden

### Requirement: Stage-Aware Route Editor & Viewport Synchronization
The route planner SHALL integrate stage management into the editing workflow:
- The route planner toolbar and sidebar SHALL display the active stage indicator and allow switching the active editing stage directly.
- The editor history stack (undo/redo) SHALL track changes across all stages, including waypoint edits, stage splitting, merging, deletion, reordering, and metadata changes.
- When reversing a multi-stage route, the sequence of stages and the internal coordinates of each stage SHALL be inverted coherently.
- While editing an active stage, non-active stages SHALL remain visible on the map canvas as context.

#### Scenario: Undo stage split or deletion operation
- **GIVEN** a route with Stage 1 and Stage 2
- **WHEN** user deletes Stage 2 and then clicks Undo
- **THEN** Stage 2 and all its waypoints/geometry are restored to their previous state
- **AND** stage numbering and map layers update accordingly

#### Scenario: Reversing a multi-stage route
- **GIVEN** a route with Stage 1 (Amsterdam to Haarlem) and Stage 2 (Haarlem to Zandvoort)
- **WHEN** user clicks "Omdraaien" (Reverse Route)
- **THEN** Stage 1 becomes Zandvoort to Haarlem and Stage 2 becomes Haarlem to Amsterdam
- **AND** overall route continuity is preserved

### Requirement: Differential Route Calculation and Segment Invalidation
The system SHALL only recompute route segments whose adjacent waypoints or routing mode have changed, and SHALL preserve unchanged segments directly from the existing state without issuing redundant network requests.

#### Scenario: Appending a waypoint preserves prior segments
- **WHEN** the user adds a new waypoint to the end of a route that already contains one or more calculated segments
- **THEN** the system calculates only the new connecting segment between the previous endpoint and the new waypoint
- **AND** all preexisting segments retain their existing coordinates and distances without network calls

#### Scenario: Inserting an intermediate waypoint only calculates adjacent segments
- **WHEN** the user inserts a waypoint between two existing waypoints via a split handle
- **THEN** the system replaces the single split segment with two new segments connecting to the inserted waypoint
- **AND** all other segments before and after the split remain unchanged without recalculation

#### Scenario: Moving or dragging a waypoint recalculates only adjacent segments
- **WHEN** the user moves an existing intermediate waypoint to a new location
- **THEN** the system only recalculates the incoming segment from the previous waypoint and the outgoing segment to the next waypoint
- **AND** all non-adjacent segments in the route remain unchanged

#### Scenario: Deleting a waypoint bridges with a single segment calculation
- **WHEN** the user deletes an intermediate waypoint from a route with at least three waypoints
- **THEN** the system calculates only the single bridging segment between the preceding and succeeding waypoints
- **AND** all other segments remain untouched

### Requirement: Optimistic UI Preview and Segment-Level Graceful Fallback
The system SHALL provide immediate visual feedback upon waypoint creation and isolate network or routing failures to individual affected segments.

#### Scenario: Instant optimistic connector line on waypoint placement
- **WHEN** the user places a new waypoint on the map canvas
- **THEN** the system immediately draws a transient straight or dotted connector line to the preceding waypoint (0ms latency)
- **AND** replaces the transient line with the snapped trail polyline once routing calculation resolves

#### Scenario: Single segment failure falls back to straight line gracefully
- **WHEN** the external routing service fails, times out, or cannot find a walkable path for a specific segment
- **THEN** only that specific segment falls back to a geodesic straight line with a non-blocking indicator
- **AND** all other intact segments retain their trail-snapped paths and accurate distances

### Requirement: Client-Side Routing Cache and Concurrent Execution
The system SHALL maintain a client-side in-memory segment cache keyed by segment coordinates and routing mode, SHALL execute concurrent requests when multiple segments require resolution, and SHALL cancel obsolete in-flight calculations when newer edits occur.

#### Scenario: Cache hit on undo or redo
- **WHEN** the user performs an Undo or Redo operation that restores a previously calculated waypoint pair
- **THEN** the system resolves the segment immediately from the in-memory cache with zero network requests

#### Scenario: Bidirectional segment cache lookup
- **WHEN** a segment from coordinate A to coordinate B is requested and its reverse B to A was previously cached in foot mode
- **THEN** the system inverts the cached polyline and resolves the segment with zero network requests

#### Scenario: Concurrent execution for multiple dirty segments
- **WHEN** multiple segments require recalculation simultaneously (such as route initialization, multi-segment mode toggle, or bulk import)
- **THEN** the system dispatches routing requests concurrently rather than sequentially

#### Scenario: In-flight request cancellation on rapid mutation
- **WHEN** a user rapidly adds or modifies waypoints while a previous routing request is still in progress
- **THEN** the system cancels the in-flight requests using an AbortController and immediately initiates calculation for the latest state

### Requirement: Smooth Waypoint Drag-Preview
The system SHALL provide smooth visual feedback at 60fps during waypoint dragging by rendering transient straight-line previews, postponing trail-snapped network routing until the drag operation completes.

#### Scenario: Visual feedback during waypoint dragging
- **WHEN** the user drags a waypoint marker across the map canvas
- **THEN** the system dynamically draws transient preview lines connecting the dragging marker to its neighboring waypoints without firing network routing requests

#### Scenario: Commit trail calculation upon drag release
- **WHEN** the user releases the dragged waypoint marker (onDragEnd)
- **THEN** the system commits the final coordinate and initiates trail-snapped calculation for the affected incoming and outgoing segments
