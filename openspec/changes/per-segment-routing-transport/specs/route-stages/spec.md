## ADDED Requirements

### Requirement: Mixed Transport Connections Within a Stage
The system SHALL support walking and transit connections within the same stage without requiring stage splits. An explicit connection choice SHALL take precedence over the stage's transport default; connections without an explicit transport choice SHALL use the stage's existing transport default, or walking when none exists. Changing a stage default SHALL NOT overwrite explicit connection choices.

#### Scenario: Ferry inside a walking day
- **GIVEN** one walking stage with three consecutive connections
- **WHEN** the middle connection is explicitly set to ferry
- **THEN** the stage remains a single stage with the same title, notes, ordering, and boundary markers
- **AND** the other connections remain walking connections

#### Scenario: Stage-level transport compatibility
- **GIVEN** a legacy stage designated as bus and without explicit connection transport choices
- **WHEN** the route is opened
- **THEN** its existing geometry, bus styling, and transit-distance classification remain unchanged

#### Scenario: Stage default does not erase a local override
- **GIVEN** a stage with one explicit ferry connection and other connections inheriting the stage default
- **WHEN** the user changes the stage default
- **THEN** only the inherited classifications change
- **AND** the explicit ferry connection remains a ferry

### Requirement: Connection-Level Transport Map Representation
The system SHALL render explicitly designated transit connections as dashed or dotted lines with a corresponding ferry, train, or bus icon on the connection itself, without relying on a stage-boundary badge. The transport type SHALL be available as localized text, not only as color or an icon. Straight walking connections SHALL remain classified and identified as walking. Transit lines and transport identifiers SHALL remain visible in stage and surface map modes, in editing and viewing modes, and after reload.

#### Scenario: View a short ferry crossing
- **WHEN** a user designates an existing short connection as ferry
- **THEN** that connection is visibly straight and dashed with a ferry icon and accessible localized transport description
- **AND** adjacent walking lines, stage colors, selection emphasis, waypoints, and boundary markers remain present

#### Scenario: View bus and train connections in surface mode
- **GIVEN** bus and train overrides within a walking stage
- **WHEN** the user enables surface coloring or views the saved route without editing
- **THEN** the bus and train lines and their transport identifiers remain recognizable
- **AND** those connections do not receive walking terrain colors

### Requirement: Connection-Aware Distance Breakdown
The system SHALL compute stage and route walking/transit distances from each connection's effective transport classification when connection data exists, falling back to stage classification for legacy data. Stage and route total distance SHALL include both walking and transit. A straight walking connection SHALL count as walking; ferry, bus, and train distances SHALL count as transit. Straight transit distances SHALL be presented as estimates, not timetable or actual vehicle-route distances.

#### Scenario: Mixed-stage distance accounting
- **GIVEN** a stage with 2000 meters of trail walking, 500 meters of straight walking, and a 1000-meter ferry connection
- **WHEN** distance summaries are calculated
- **THEN** walking distance is 2.5 km, transit distance is 1 km, and total distance is 3.5 km
- **AND** the ferry distance is identified as a straight-line estimate

#### Scenario: Classification changes without geometry changes
- **GIVEN** a 1000-meter straight walking connection
- **WHEN** its classification changes to bus without moving its endpoints
- **THEN** walking distance decreases by 1 km and transit distance increases by 1 km
- **AND** total distance remains unchanged
