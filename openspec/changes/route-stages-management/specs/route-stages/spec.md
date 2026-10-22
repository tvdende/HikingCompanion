## Purpose

Allows hikers to organize long-distance trails into sequential daily stages (etappes), inspect per-stage distance and elevation statistics, focus the map view on individual stages, and edit specific stages while keeping the overall route visible.

## ADDED Requirements

### Requirement: Multi-Stage Creation and Boundary Definition
The system SHALL allow users to define multiple sequential stages (`HikeStage`) within a route:
- Users can create additional stages by splitting a route at any selected waypoint or adding a new empty stage to an itinerary.
- Each stage SHALL maintain an ordered index (`stageNumber`), a customizable title (`title`), distance in kilometers (`distanceKm`), and its sequence of coordinates/waypoints.
- Splitting a stage at waypoint `N` SHALL assign all waypoints up to `N` to the preceding stage and all waypoints from `N` onwards to the newly created stage.
- Deleting or merging a stage SHALL re-index remaining stages sequentially without creating gaps or deleting the trail coordinates unless explicitly confirmed.

#### Scenario: User splits route into two stages at a chosen waypoint
- **WHEN** user selects a waypoint in the planner editor and clicks "Splits in nieuwe etappe" (Split into new stage)
- **THEN** the route updates to contain two stages: Stage 1 ending at the selected waypoint, and Stage 2 beginning at that waypoint
- **AND** the total distance and waypoints are partitioned accordingly between both stages

#### Scenario: Deleting a stage merges or cleans up waypoints
- **WHEN** user deletes an intermediate stage from a multi-stage route
- **THEN** user is asked whether to merge its waypoints into the adjacent stage or remove its waypoints
- **AND** remaining stages are renumbered sequentially (1, 2, 3...)

### Requirement: Stage List and Per-Stage Metrics Overview
The route planner sidebar SHALL display an interactive list of all stages defined in the active route:
- The list item for each stage SHALL show its stage number, title, total distance in km (using the active locale metric format), elevation gain/loss, and waypoint count.
- The stage list SHALL provide actions to rename the stage, reorder stages, or delete/merge the stage.
- An aggregate header SHALL display the total number of stages and overall route distance.

#### Scenario: User inspects stage list in the planner sidebar
- **GIVEN** an active route with three stages
- **WHEN** user views the planner sidebar panel
- **THEN** all three stages are listed in sequential order
- **AND** each card shows title, distance in km, elevation gain (+m), and waypoint count
- **AND** the active stage is visibly highlighted in the list

### Requirement: Visual Stage Distinction on Map Canvas
The map canvas SHALL clearly distinguish each stage along the route polyline:
- Each stage SHALL be rendered with a distinct, harmonious outdoor color palette (e.g. Forest Green, Slate Blue, Ochre Amber, Terracotta, Teal).
- The currently selected stage SHALL be rendered with increased polyline thickness, full opacity, and active waypoint handles.
- Non-selected stages of the same route SHALL remain clearly visible on the map canvas with slight transparency (or subdued line weight) so the user maintains complete global route context.
- Stage transition boundary markers (start/finish points of each stage) SHALL be displayed on the map with stage number badges.

#### Scenario: Viewing a multi-stage route on the map canvas
- **GIVEN** a route with two stages (Stage 1 and Stage 2)
- **WHEN** the map renders the route
- **THEN** Stage 1 and Stage 2 are rendered in distinct contrasting colors
- **AND** boundary pins indicate the start of Stage 1, transition point, and finish of Stage 2

### Requirement: Stage Selection and Camera Focus
Selecting a stage in the sidebar list or clicking its polyline on the map canvas SHALL:
- Set that stage as the active editing target.
- Smoothly animate (flyTo/fitBounds) the map camera to frame the geographical bounding box of that stage with comfortable padding.
- Highlight the stage card in the sidebar and make its waypoints editable on the map.

#### Scenario: User clicks on Stage 2 in the stage list
- **WHEN** user clicks Stage 2 in the planner sidebar list
- **THEN** Stage 2 becomes the active selected stage
- **AND** the map smoothly animates its camera viewport to fit the bounds of Stage 2
- **AND** interactive drag handles appear on Stage 2's waypoints, while Stage 1 remains visible in the background

### Requirement: Scoped Stage Editing with Full Route Context
When in editing mode with a stage selected:
- Users can add, drag, insert, or remove waypoints specifically within the active stage.
- Waypoint additions at the tail of the active stage extend that stage without affecting subsequent stages.
- The rest of the route (preceding and succeeding stages) SHALL remain visible on the map at all times so the user understands the trail in its full geographic context.

#### Scenario: Adding points to active stage while viewing full route
- **GIVEN** Stage 1 is selected for editing in a 3-stage route
- **WHEN** user clicks on the map to add a new waypoint
- **THEN** the waypoint is appended to Stage 1's geometry and Stage 1's distance updates
- **AND** Stage 2 and Stage 3 remain visibly rendered on the map canvas
