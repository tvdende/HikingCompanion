## Purpose

Parses GPX XML trail files into structured route domain objects, calculates total distance and elevation gain/loss, and serializes routes back to valid GPX XML.

## ADDED Requirements

### Requirement: GPX XML Parsing
The system SHALL parse valid GPX 1.0 and 1.1 XML strings, extracting track names, track segments, track points with latitude, longitude, elevation, and timestamp.

#### Scenario: Valid GPX file parsed
- **WHEN** a valid GPX document is provided to the parser
- **THEN** the system returns a structured `HikeRoute` object containing all track coordinates and elevation data

#### Scenario: Malformed XML input
- **WHEN** malformed or non-XML data is provided to the parser
- **THEN** the parser rejects the input with a descriptive error without crashing

### Requirement: Route Metrics Calculation
The system SHALL calculate the cumulative distance in kilometers, total elevation gain in meters, and total elevation loss in meters across all track points.

#### Scenario: Metrics computation
- **WHEN** a sequence of track points with elevation values is parsed
- **THEN** the computed total distance equals the sum of consecutive geodesic distances, and total elevation gain equals the sum of all positive elevation deltas

### Requirement: GPX XML Serialization
The system SHALL serialize a `HikeRoute` domain object into a compliant GPX 1.1 XML string ready for file export and download.

#### Scenario: Route exported to GPX
- **WHEN** a `HikeRoute` is serialized to GPX
- **THEN** the generated XML contains `<gpx>`, `<trk>`, `<trkseg>`, and `<trkpt>` elements containing accurate coordinates and elevations
