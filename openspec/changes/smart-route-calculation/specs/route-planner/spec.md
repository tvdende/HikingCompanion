## ADDED Requirements

### Requirement: Differential Route Calculation and Segment Invalidation
The system SHALL only recompute route segments whose adjacent waypoints or routing mode have changed, and SHALL preserve unchanged segments directly from the existing state without issuing redundant network requests.

#### Scenario: Appending a waypoint preserves prior segments
- **WHEN** the user adds a new waypoint to the end of a route that already contains one or more calculated segments
- **THEN** the system calculates only the new connecting segment between the previous endpoint and the new waypoint
- **AND** all preexisting segments retain their existing coordinates and distances without network calls

#### Scenario: Inserting an intermediate waypoint only calculates adjacent segments
- **WHEN** the user inserts a waypoint between two existing waypoints
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

### Requirement: Client-Side Routing Cache and Concurrent Execution
The system SHALL maintain a client-side in-memory segment cache keyed by segment coordinates and routing mode, SHALL execute concurrent requests when multiple segments require resolution, and SHALL cancel obsolete in-flight calculations when newer edits occur.

#### Scenario: Cache hit on undo or redo
- **WHEN** the user performs an Undo or Redo operation that restores a previously calculated waypoint pair
- **THEN** the system resolves the segment immediately from the in-memory cache with zero network requests

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
