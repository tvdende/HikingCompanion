## ADDED Requirements

### Requirement: Stage-Aware Route Editor & Viewport Synchronization
The route planner SHALL integrate stage management into the editing workflow:
- The route planner toolbar and sidebar SHALL display the active stage indicator and allow switching the active editing stage directly.
- The editor history stack (undo/redo) SHALL track changes across all stages, preserving stage boundaries during undo and redo operations.
- When reversing a multi-stage route, the sequence of stages and the internal coordinates of each stage SHALL be inverted coherently.

#### Scenario: Undo waypoint edit within a multi-stage route
- **GIVEN** a route with Stage 1 and Stage 2
- **WHEN** user adds a waypoint to Stage 2 and then clicks Undo
- **THEN** only the newly added waypoint in Stage 2 is removed
- **AND** Stage 1 remains unaffected and intact

#### Scenario: Reversing a multi-stage route
- **GIVEN** a route with Stage 1 (Amsterdam to Haarlem) and Stage 2 (Haarlem to Zandvoort)
- **WHEN** user clicks "Omdraaien" (Reverse Route)
- **THEN** Stage 1 becomes Zandvoort to Haarlem and Stage 2 becomes Haarlem to Amsterdam
- **AND** overall route continuity is preserved
