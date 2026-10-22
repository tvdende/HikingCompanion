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
