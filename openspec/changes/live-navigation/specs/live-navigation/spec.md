# Capability: Live Navigation & Companion Focus Mode

## Purpose

Provide real-time GPS tracking, trail progress calculations, off-course deviation warnings, and an accessible outdoor Companion Focus View to guide hikers safely along their routes.

## Requirements

### Requirement: Real-time GPS Location & Compass Orientation
The system SHALL continuously track user position using `navigator.geolocation.watchPosition`:
- Render user location marker on the MapLibre map with an accuracy radius circle
- Display a directional cone indicating compass heading using `deviceorientationabsolute` or `deviceorientation`
- Re-center and rotate the map following the user's heading when "Follow Mode" is enabled

#### Scenario: User walks along the trail
- GIVEN active navigation is turned on
- WHEN the browser emits GPS location updates
- THEN the map updates the position marker smoothly
- AND computes the user's distance along the route

### Requirement: Trail Progress & Elevation Metrics
The system SHALL compute live hiking metrics relative to the active route:
- `distanceCoveredMeters`: trail distance from start to current snapped location
- `distanceRemainingMeters`: remaining trail distance to finish
- `elevationRemainingMeters`: remaining vertical ascent to finish
- `estimatedTimeRemainingSeconds`: calculated using Tobler's hiking function factoring in slope/grade

#### Scenario: Mid-hike metrics calculation
- GIVEN a 15 km hike with 800m ascent
- WHEN the user has completed 5 km with 300m ascent
- THEN distance remaining MUST equal 10 km
- AND ascent remaining MUST equal 500m

### Requirement: Off-Trail Deviation Detector
The system SHALL continuously calculate the cross-track error (perpendicular distance between user GPS and nearest route segment):
- When cross-track error exceeds `deviationThresholdMeters` (default 50m, configurable 25m - 200m):
  - Trigger visual off-trail warning badge
  - Vibrate device (via `navigator.vibrate([200, 100, 200])`) if supported
  - Play an optional audio alert tone

#### Scenario: Hiker takes a wrong turn
- GIVEN an active route and deviation threshold of 50m
- WHEN the hiker wanders 65 meters away from the planned track
- THEN the system triggers the off-trail warning with visual and haptic alerts

### Requirement: Companion Focus View & Battery-Saving Screen Management
The frontend SHALL provide a dedicated "Companion Focus View":
- Oversized touch targets (minimum 48x48px, optimized for gloves and outdoor use)
- High-contrast outdoor display mode (AMOLED pitch black or high-contrast daylight)
- Battery optimization: By default, the app SHALL allow the device display to time out and sleep normally to conserve battery during long hikes.
- The UI SHALL provide an optional "Scherm altijd aan" (Keep screen on) toggle in the navigation header that requests a `WakeLock` via `navigator.wakeLock.request('screen')` only when explicitly enabled by the user.
- Quick-access emergency button showing current GPS coordinates in decimal and UTM/MGRS format for mountain rescue

#### Scenario: Screen times out by default to save battery
- GIVEN a hiker starts navigation mode with default settings
- WHEN the phone reaches its normal screen timeout
- THEN the screen turns off to conserve battery while background audio/haptic alerts remain active

### Requirement: Offline Map Tile Region Downloader & Storage Management
The system SHALL provide an offline map region download mechanism:
- Compute tile (X, Y, Z) coordinates across zoom levels 10 to 15 covering the bounding box of the route plus a 2 km buffer
- Display an estimate of the total number of tiles and download size in MB before initiating
- Download tiles into Cache API / IndexedDB storage with progress updates (downloaded count and percentage)
- Allow cancelling or pausing the download
- The Service Worker SHALL intercept tile requests and return cached tiles when offline, ensuring MapLibre renders the vector map without network connectivity
- The UI SHALL provide an "Offline kaarten beheren" drawer in settings/route details showing saved regions with size and a delete button to free space

#### Scenario: Downloading an offline map region before a trek
- GIVEN an active route in a mountainous area without cell coverage
- WHEN the user clicks "Download kaart voor offline"
- THEN the system calculates ~450 tiles (estimated 15 MB)
- AND downloads and stores the tiles in Cache Storage with a visual progress bar
- AND subsequently renders the map seamlessly when the device goes offline
