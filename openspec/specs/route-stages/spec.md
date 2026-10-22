# route-stages Specification

## Purpose

Allows hikers to organize long-distance trails into sequential daily stages (etappes), inspect per-stage distance and elevation statistics, designate public transit connections (bus/train/ferry), focus the map view on individual stages, reorder stages, and edit specific stages while keeping the overall route visible.

## Requirements

### Requirement: Multi-Stage Creation and Boundary Definition
The system SHALL allow users to define multiple sequential stages (`HikeStage`) within a route:
- Users can create additional stages by splitting a route at any selected waypoint or clicking "+ Nieuwe etappe" in the planner menu.
- When creating a new stage via "+ Nieuwe etappe", the new stage SHALL default its starting position to the finish coordinate of the preceding stage. If the preceding stage has no coordinates, the new stage waits for user map clicks.
- Each stage SHALL maintain an ordered index (`stageNumber`), a customizable title (`title`), an optional notes field (`notes`), an optional transport type (`transportType`: `'foot' | 'bus' | 'train' | 'ferry'`), distance in kilometers (`distanceKm`), and its sequence of coordinates/waypoints.
- Splitting a stage at waypoint `N` SHALL assign all waypoints up to `N` to the preceding stage and all waypoints from `N` onwards to the newly created stage.

#### Scenario: User splits route into two stages at a chosen waypoint
- **WHEN** user selects a waypoint in the planner editor or clicks its marker on the map and clicks "✂️ Splits in nieuwe etappe"
- **THEN** the route updates to contain two stages: Stage 1 ending at the selected waypoint, and Stage 2 beginning at that waypoint
- **AND** the total distance, elevation, and waypoints are partitioned accordingly between both stages

#### Scenario: User adds a new stage via planner menu
- **WHEN** user clicks "+ Nieuwe etappe" in the planner sidebar
- **THEN** a new stage is appended to the stage list with stageNumber incremented
- **AND** the new stage becomes the active editing stage, ready to receive points starting from the finish of the prior stage

### Requirement: Stage Merging and Deletion
The system SHALL support merging and deleting stages:
- Users can merge adjacent stages into a single combined stage from the transition point marker (`F1 / S2`) on the map or from the stage card in the sidebar.
- Deleting a stage SHALL remove all of that stage's route points and waypoints from the map canvas.
- After deletion, all remaining stages SHALL be automatically renumbered sequentially (1, 2, 3...) without gaps.
- A confirmation prompt SHALL be displayed before permanently deleting a stage to prevent accidental loss of route geometry.

#### Scenario: Merging two adjacent stages
- **GIVEN** a route with Stage 1 and Stage 2
- **WHEN** user clicks the transition badge `F1 / S2` on the map and clicks "Etappes samenvoegen" (Merge stages)
- **THEN** Stage 2's waypoints and geometry are appended to Stage 1
- **AND** Stage 2 is removed, resulting in a single continuous Stage 1

#### Scenario: Deleting a stage removes its points and renumbers remaining stages
- **GIVEN** a route with Stage 1, Stage 2, and Stage 3
- **WHEN** user deletes Stage 2 and confirms the prompt
- **THEN** all waypoints and segments belonging to Stage 2 are removed from the map
- **AND** former Stage 3 is renumbered to Stage 2, preserving sequential ordering

### Requirement: Public Transit Segments (OV: Bus, Trein, Veerpont)
The system SHALL allow users to designate specific stages as public transit connections:
- Each stage can be configured with a transport type: `foot` (default), `bus`, `train`, or `ferry`.
- On the map canvas, transit stages SHALL be rendered with a dashed/dotted polyline style and display the corresponding transit icon badge (🚌, 🚆, ⛴️).
- In summary metrics, distance SHALL be broken down between hiking distance (on foot) and transit distance (public transport) so hikers know the exact walking mileage.

#### Scenario: User designates Stage 2 as a bus transfer
- **GIVEN** a 3-stage hike where Stage 2 is a bus ride between two trailheads
- **WHEN** user selects "Bus" as the transport type for Stage 2
- **THEN** Stage 2 is rendered on the map as a dashed polyline with a bus icon badge
- **AND** the route summary reports walking distance separate from the bus transit distance

### Requirement: GPX Import Multi-Stage & Append Handling
The system SHALL provide interactive choices when importing GPX data:
- When a GPX file is imported while an active route already exists, the system SHALL prompt the user to choose:
  1. "Toevoegen aan huidige etappe" (Append points to active stage)
  2. "Als nieuwe etappe toevoegen" (Create a new sequential stage for this GPX)
- When an imported GPX contains multiple `<trk>` or `<trkseg>` elements, the system SHALL prompt the user:
  1. "Als losse etappes importeren" (Import each track segment as an individual stage)
  2. "Als één samengevoegde etappe importeren" (Merge all tracks into a single stage)

#### Scenario: User uploads GPX while working on an existing route
- **GIVEN** an active route open in the planner
- **WHEN** user uploads a GPX file
- **THEN** a modal dialog asks whether to append to the active stage or create a new stage
- **AND** selecting "Als nieuwe etappe toevoegen" creates a new stage preserving existing stages intact

#### Scenario: User imports multi-track GPX trail (e.g. Pieterpad)
- **WHEN** user uploads a GPX file containing multiple `<trkseg>` elements
- **THEN** a modal prompts the user whether to import as separate stages or a single stage
- **AND** choosing separate stages generates an ordered list of stages corresponding to each segment

### Requirement: Stage List, Metadata, and Reordering
The route planner sidebar SHALL display an interactive list of all stages:
- Each stage card SHALL display: stage number badge, title, distance in km, elevation gain (+m), waypoint count, and transport type.
- Stage title and optional notes field (e.g. overnight stay, transit station) SHALL be inline-editable.
- Users SHALL be able to reorder stages using both drag-and-drop handles and step buttons (▲ / ▼).
- Changing stage order SHALL re-index stage numbers sequentially.

#### Scenario: User reorders stages using drag-and-drop or step buttons
- **GIVEN** a route with Stage 1, Stage 2, and Stage 3
- **WHEN** user moves Stage 3 above Stage 2 (via drag handle or ▲ button)
- **THEN** the former Stage 3 becomes Stage 2 and the former Stage 2 becomes Stage 3
- **AND** stage numbers and ordering update immediately across the UI and map

### Requirement: Visual Stage Distinction on Map Canvas
The map canvas SHALL clearly distinguish each stage along the route polyline:
- Each stage SHALL be rendered with a distinct outdoor color palette (Forest Green, Ochre, Slate Blue, Purple Sage, Dark Pine).
- The currently selected stage SHALL be rendered with full opacity (`1.0`) and thicker stroke (`6px`), with active waypoint handles.
- Inactive stages SHALL remain visible with subdued opacity (`0.55`, `4px`) to preserve complete route context.
- Stage boundary badges SHALL be displayed on the map: `S1` (Start), `F1 / S2` (Transition), and `F_last` (Finish).

#### Scenario: Viewing a multi-stage route on the map canvas
- **GIVEN** a route with two stages
- **WHEN** the map renders the route
- **THEN** Stage 1 and Stage 2 are rendered in distinct contrasting colors
- **AND** boundary pins indicate `S1` (start), `F1 / S2` (transition), and `F2` (finish)

### Requirement: Stage Selection, Camera Focus, and Full Route Reset
Selecting a stage SHALL focus the camera, with a one-click button to reset to the whole route:
- Clicking a stage in the sidebar list or clicking its polyline on the map SHALL set it as active and smoothly fit the map bounds (`fitBounds`) to that stage's coordinates with padding.
- A button `🔍 Toon hele route` (View full route) at the top of the stage list SHALL instantly fit the map camera to the bounding box of the entire multi-day trail.

#### Scenario: User toggles between stage focus and full route
- **WHEN** user clicks Stage 2 in the stage list
- **THEN** the map smoothly animates its camera to frame Stage 2
- **WHEN** user clicks "🔍 Toon hele route"
- **THEN** the camera animates back out to frame all stages simultaneously
