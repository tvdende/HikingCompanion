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
- **Offline Navigation Guarantee**: Allows navigation to run entirely client-side without internet connectivity once route and map tiles are cached in IndexedDB / Cache Storage.

## Capabilities

### New Capabilities
- `live-navigation`: Real-time GPS location and compass tracking, trail progress and elevation metrics, off-course deviation alerts, Screen Wake Lock, and a glove-friendly Companion Focus View designed for outdoor hiking conditions.

### Modified Capabilities
- `map-viewer`: Enhances map viewer with live position marker, heading cone, and trail progress highlight.

## Impact

- **Affected Code**:
  - `packages/core`: Add navigation math (nearest segment projection, cross-track distance, ETA calculation).
  - `apps/web`: Add `NavigationManager.ts`, `CompanionFocusView.tsx`, off-trail warning modals, and Screen Wake Lock integration.
- **Hardware/Browser APIs**: W3C Geolocation API, Screen Wake Lock API, Device Orientation API, Vibration API.
- **Battery Optimization**: Configurable GPS polling frequency and dark AMOLED-optimized styling to conserve battery during long treks.
