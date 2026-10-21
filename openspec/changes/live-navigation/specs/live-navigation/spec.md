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

### Requirement: Companion Focus View & Screen Wake Lock
The frontend SHALL provide a dedicated "Companion Focus View":
- Oversized touch targets (minimum 48x48px, optimized for gloves and wet screens)
- High-contrast outdoor display mode (AMOLED pitch black or high-contrast daylight)
- Acquire a `WakeLock` via `navigator.wakeLock.request('screen')` while navigation is active to prevent the phone display from dimming or locking
- Quick-access emergency button showing current GPS coordinates in decimal and UTM/MGRS format for mountain rescue

#### Scenario: Screen stays awake during active navigation
- GIVEN a hiker starts navigation mode
- WHEN the screen would normally lock after 30 seconds of inactivity
- THEN the Screen Wake Lock prevents display sleep as long as navigation remains active
