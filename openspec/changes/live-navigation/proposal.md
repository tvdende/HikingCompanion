## Why

When hikers are out in remote terrain, adverse weather, or unfamiliar mountain trails, having clear, hands-free real-time guidance is critical for safety. Hikers need to see their exact GPS position, heading orientation, progress along the trail (distance remaining, elevation gained/remaining), and receive immediate warnings when straying off the trail. Furthermore, normal web UIs are difficult to operate while wearing gloves or in bright sunlight. Fulfilling Section 4.5 ("Live Navigatie & Veldgebruik") of the product vision, this change introduces live GPS navigation with an off-trail detector and a dedicated glove-friendly "Companion Focus View" with Screen Wake Lock.

## What Changes

- **Geolocation & Orientation Tracker**: Implement a high-accuracy GPS tracking manager in `packages/core` using the browser Geolocation API (`watchPosition`) and DeviceOrientation API (compass heading) with smoothing algorithms.
- **Route Snapping & Progress Engine**: Real-time matching of hiker coordinates against the active route polyline:
  - Calculates distance completed vs. remaining
  - Calculates current elevation and remaining ascent/descent
  - Calculates estimated time of arrival (ETA) based on average walking pace (e.g. Tobler's hiking function)
- **Off-Trail Deviation Detector**: Automatically triggers visual and haptic/audio alerts if the hiker strays beyond a threshold distance (e.g. 50 meters) from the planned track.
- **Companion Focus View UI**: Fullscreen high-contrast outdoor interface featuring:
  - Large, glove-friendly buttons
  - Screen Wake Lock API integration (keeps screen on during active hiking)
  - Dark mode / high-visibility contrast mode
  - Simplified compass and turn indicator
- **Offline Map Tile Downloader & Regional Cache**: Add a dedicated offline region manager allowing hikers to download all map tiles along the route corridor before departing:
  - Automatically calculates bounding box with configurable buffer (e.g. 2 km) across zoom levels 10-15
  - Displays tile count and estimated storage footprint (MB) prior to downloading
  - Live download progress bar ("340 / 520 tegels gedownload · 65%") with pause/resume support
  - Service Worker intercepts map tile requests (`/tiles/*` or vector tile endpoints) to serve cached tiles offline with zero latency
  - Storage management drawer allowing hikers to inspect and delete saved offline regions
- **Offline Navigation Guarantee**: Allows navigation to run entirely client-side without internet connectivity once route, POIs, and map tiles are cached in Cache Storage / IndexedDB.

## Capabilities

### New Capabilities
- `live-navigation`: Real-time GPS location and compass tracking, trail progress and elevation metrics, off-course deviation alerts, offline map tile corridor downloader, and a glove-friendly Companion Focus View designed for outdoor hiking conditions.

### Modified Capabilities
- `map-viewer`: Enhances map viewer with live position marker, heading cone, and trail progress highlight.

## Impact

- **Affected Code**:
  - `packages/core`: Add navigation math (nearest segment projection, cross-track distance, ETA calculation).
  - `apps/web`: Add `NavigationManager.ts`, `CompanionFocusView.tsx`, off-trail warning modals, and Screen Wake Lock integration.
- **Hardware/Browser APIs**: W3C Geolocation API, Screen Wake Lock API, Device Orientation API, Vibration API.
- **Battery Optimization**: Configurable GPS polling frequency and dark AMOLED-optimized styling to conserve battery during long treks.
