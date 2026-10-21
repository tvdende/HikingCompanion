# Design: Live Navigation & Companion Focus Mode

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                              apps/web                                   |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  |   NavigationManager.ts    | <---> |   CompanionFocusView.tsx      |  |
|  | - watchPosition()         |       | - Large glove-friendly UI     |  |
|  | - DeviceOrientation       |       | - Screen Wake Lock API        |  |
|  | - Vibration API           |       | - Elevation & progress stats  |  |
|  | - Off-trail calculation   |       | - Emergency SOS coordinates   |  |
|  +---------------------------+       +-------------------------------+  |
|                |                                    |                   |
|                v                                    v                   |
|  +---------------------------+       +-------------------------------+  |
|  |    MapLibre Canvas        |       |    packages/core              |  |
|  | - User location pulse     |       | - crossTrackDistance()        |  |
|  | - Heading direction cone  |       | - toblerHikingTime()          |  |
|  | - Follow-me camera lock   |       | - snapToPolyline()            |  |
|  +---------------------------+       +-------------------------------+  |
+-------------------------------------------------------------------------+
```

## Domain Types (`packages/core`)

```typescript
export interface NavigationState {
  isActive: boolean;
  userCoordinates?: [number, number]; // [lon, lat]
  headingDegrees?: number;
  accuracyMeters?: number;
  snappedPoint?: [number, number];
  distanceCoveredMeters: number;
  distanceRemainingMeters: number;
  elevationRemainingMeters: number;
  crossTrackDistanceMeters: number;
  isOffTrail: boolean;
  estimatedTimeRemainingSeconds: number;
}
```

## Wake Lock & Battery Strategy
- Request `WakeLockSentinel` via `navigator.wakeLock.request('screen')` on navigation mount; automatically re-acquire upon document visibility change.
- Release lock immediately when navigation stops or modal closes.
- Throttle GPS processing to 1 Hz to prevent battery drain on multi-hour excursions.
