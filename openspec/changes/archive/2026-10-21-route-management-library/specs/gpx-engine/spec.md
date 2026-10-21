## ADDED Requirements

### Requirement: Multi-GPX Upload and Track Stitching
The system SHALL support uploading multiple GPX files simultaneously or sequentially, parsing each track into structured stages, and stitching the tracks together into a single continuous `HikeRoute` with combined distance, stage boundaries, and unified elevation metrics.

#### Scenario: User uploads multiple GPX files at once
- **WHEN** the user selects or drops multiple `.gpx` files onto the planner interface
- **THEN** the system parses all files, concatenates their track points in order, joins the endpoints with geodesic straight-line segments, and recalculates the total trail metrics

#### Scenario: User appends GPX file to existing active route
- **WHEN** the user selects an additional GPX file to append to an active route
- **THEN** the system adds the new track points as a new stage continuing from the last point of the existing route
