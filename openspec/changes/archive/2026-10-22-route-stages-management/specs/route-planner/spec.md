## ADDED Requirements

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
