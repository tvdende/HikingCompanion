## MODIFIED Requirements

### Requirement: Automatic Surface Analysis on Route Save
When a user saves or updates a route (`POST /api/routes` or `PUT /api/routes/:id`), saving SHALL NOT depend on, or wait for, an external surface analysis:
- If the request includes a `surfaceBreakdown`, the backend SHALL persist it in the D1 database alongside the route coordinates.
- If the request has no `surfaceBreakdown`, the backend SHALL save the route immediately without requesting an external surface analysis, and store no surface breakdown for it.
- The surface breakdown is calculated on request ("Analyseer ondergrond") or comes from routing metadata, and is persisted with the next save that includes it.

#### Scenario: Saving a newly planned route without prior manual surface analysis
- **GIVEN** a newly drawn or uploaded GPX route where the user has not clicked "Analyseer ondergrond"
- **WHEN** the user saves the route to the database
- **THEN** the route is saved without waiting for an external surface analysis
- **AND** the route record in D1 is stored without a `surfaceBreakdown`

#### Scenario: Saving a route with an analyzed surface
- **GIVEN** a route whose surface breakdown has been calculated in the planner
- **WHEN** the user saves the route
- **THEN** the route record in D1 is stored with that `surfaceBreakdown`

#### Scenario: Saving a route with a stage without geometry
- **WHEN** the user saves a route that contains a stage without coordinates
- **THEN** the route is saved successfully
