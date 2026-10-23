## ADDED Requirements

### Requirement: Editing an Existing Connection
The system SHALL allow a user in route-editing mode to change a single existing connection between consecutive waypoints within one stage. The choices SHALL be trail-following walking, straight-line walking, ferry, train, and bus. Ferry, train, and bus SHALL use a straight connection without requesting walking or public-transport routing. The editor SHALL identify both endpoint numbers and the current choice, support keyboard and touch interaction, and use the selected Dutch or English language.

#### Scenario: Replace a walking detour with a ferry crossing
- **GIVEN** a stage containing walking connections A-B, B-C, and C-D
- **WHEN** the user opens the connection controls for B-C and selects ferry
- **THEN** only B-C becomes a straight ferry connection without a routing request
- **AND** the stage count, waypoint positions, A-B, and C-D remain unchanged

#### Scenario: Switch between straight walking and transit
- **WHEN** the user selects straight-line walking, bus, or train for an existing connection
- **THEN** the connection is straight and has the selected walking or transport classification
- **AND** the global mode used for newly drawn connections remains unchanged

#### Scenario: Restore trail following
- **GIVEN** a connection previously designated as straight or transit
- **WHEN** the user selects trail-following walking
- **THEN** only that connection returns to walking trail routing, using cached geometry when available
- **AND** a routing failure uses the existing visible fallback warning without assigning a transit type

#### Scenario: Boundary and first-point controls
- **WHEN** the user opens the first waypoint of a stage or a waypoint without an existing incoming connection in that stage
- **THEN** no editable incoming connection is offered
- **AND** opening connection controls or cancelling them does not add, move, delete, or split route points

### Requirement: Connection Persistence and Exact Restoration
The system SHALL preserve explicit connection routing and transport choices, their endpoint identities, and their calculated geometry when a route is created, updated, and reopened. Opening a saved route with connection data SHALL restore the same editable boundaries and map representation without network routing. Routes without connection data SHALL continue to load using their stored stage geometry and existing stage transport defaults.

#### Scenario: Save and reopen a mixed route
- **GIVEN** a route with trail-following walking, straight walking, ferry, bus, and train connections
- **WHEN** the user saves it, reloads the application, and opens it from the library
- **THEN** every connection retains its choice, endpoint identities, and stored coordinates
- **AND** the first edit to one connection leaves every unrelated stored polyline unchanged
- **AND** opening the route issues no routing requests

#### Scenario: Update preserves connection metadata
- **GIVEN** a saved route with a ferry connection
- **WHEN** the user updates its title or replaces another connection and saves again
- **THEN** the ferry connection remains a ferry with the same endpoint identities and geometry

#### Scenario: Load a legacy route
- **WHEN** a route without connection metadata is opened
- **THEN** its stored stage geometry and stage transport behavior are retained
- **AND** editing one newly exposed connection does not recalculate unrelated imported geometry

#### Scenario: Reject invalid connection data
- **WHEN** a create or update request contains an unsupported routing or transport value, missing endpoint references, a cross-stage connection, or inconsistent connection geometry
- **THEN** the API rejects the payload with a descriptive client error
- **AND** it does not partially persist or silently discard the invalid connection data

### Requirement: Connection Identity Through Editor Transformations
The system SHALL keep connection settings attached to their physical connection during undo, redo, waypoint movement, reversal, insertion, and stage transformations. Deleting an intermediate waypoint SHALL remove both incident connection overrides and create a new bridge using trail-following routing and the containing stage's default transport classification; settings on surviving connections SHALL remain unchanged.

#### Scenario: Undo and redo a transport change
- **WHEN** the user changes a walking connection to ferry, then performs undo and redo
- **THEN** routing choice, transport classification, geometry, map styling, and distance breakdown return to the corresponding states

#### Scenario: Move or split a ferry connection
- **GIVEN** a ferry connection between B and C
- **WHEN** the user moves either endpoint or inserts a waypoint on that connection
- **THEN** the moved connection or both replacement connections retain the ferry classification and straight routing
- **AND** no walking routing request is made for those connections

#### Scenario: Reverse or reorganize stages
- **WHEN** the user reverses a route or splits, merges, or reorders its stages
- **THEN** surviving connections retain their routing and transport choices with the appropriate endpoint order and stage ownership
- **AND** no connection metadata is transferred to an unrelated neighboring connection

#### Scenario: Delete a waypoint next to a transit override
- **GIVEN** B-C is a ferry override in a walking stage
- **WHEN** the user deletes C and creates the new B-D bridge
- **THEN** B-D uses trail-following walking rather than inheriting the removed ferry override
- **AND** undo restores the original connections and their choices
