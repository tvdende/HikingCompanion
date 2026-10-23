## ADDED Requirements

### Requirement: Connection-Aware Walking Geometry Selection
The system SHALL include only effective walking connections in surface analysis and terrain distance totals for mixed stages, including straight walking geometry as unknown when it cannot be classified. Manual analysis, routing-metadata analysis, automatic save analysis, and cached results SHALL use the same walking inclusion rules. Separated walking portions SHALL NOT be joined across an excluded transit connection.

#### Scenario: Analyze a mixed walking and ferry stage
- **GIVEN** walking connections A-B and C-D separated by a ferry connection B-C in one stage
- **WHEN** the user requests analysis or saves the route without a valid analysis
- **THEN** only A-B and C-D are included as separate walking portions
- **AND** no synthetic B-C walking edge is sent to a surface provider or added to surface totals
- **AND** surface percentages total 100 percent of included walking distance, not walking plus ferry distance

#### Scenario: No walking connections remain
- **WHEN** every connection is classified as ferry, bus, or train
- **THEN** the route has no walking surface result or nonzero walking surface totals
- **AND** no external surface-analysis request is issued for transit-only geometry

#### Scenario: Unknown straight walking
- **WHEN** a straight walking connection has no classifiable surface data
- **THEN** its distance remains in the walking total and is represented as unknown surface
- **AND** it is not excluded merely because it uses straight routing

### Requirement: Connection Classification Analysis Invalidation
The system SHALL invalidate persisted surface analysis when a connection changes its included walking geometry or changes between walking and transit, even if the aggregate stage coordinates remain identical. A transit-to-transit type change or unrelated route metadata update SHALL retain valid walking analysis.

#### Scenario: Straight walking becomes ferry
- **GIVEN** a saved route with valid walking analysis
- **WHEN** an unchanged straight walking connection is reclassified as ferry and the route is saved
- **THEN** the old analysis is not retained as valid
- **AND** any replacement analysis covers the remaining walking geometry only

#### Scenario: Ferry becomes train
- **GIVEN** a saved mixed route with valid walking analysis
- **WHEN** its ferry connection becomes train without changing included walking geometry
- **THEN** the walking analysis remains valid and no additional surface request is required

#### Scenario: Transit becomes walking
- **WHEN** a transit connection becomes walking
- **THEN** any existing analysis is invalidated before persistence
- **AND** the newly included walking connection participates in the replacement analysis
