## Why

Mountain and trail weather can change rapidly, presenting life-threatening risks such as hypothermia, flash floods, or lightning strikes on exposed ridges. Hikers need hyper-localized, altitude-adjusted weather forecasts for their route—specifically knowing the conditions not just at the trailhead, but at high mountain passes, summits, and overnight shelters along the path. By integrating the open-source **Open-Meteo API** (free, no API key required, high-resolution global weather models), Hiking Companion can provide altitude-adjusted hourly forecasts, severe weather warnings, and offline weather caching for safe trek planning.

## What Changes

- **Route Weather Forecasting Service**: Add `POST /api/weather/route` to `apps/api` accepting route coordinates and extracting key elevation checkpoints (trailhead, summit/highest point, finish, and intermediate day-stage points).
- **Open-Meteo Integration**: Query Open-Meteo API with elevation adjustment for:
  - Hourly & daily temperature, apparent temperature (windchill)
  - Precipitation probability and precipitation volume (mm)
  - Wind speed, wind gusts, and wind direction
  - Weather code (WMO classification: clear, cloudy, rain, thunderstorm, snow)
  - UV index and sunrise/sunset times
- **Altitude-Adjusted Lapse Rate**: Apply standard barometric lapse rate corrections when high-altitude points differ significantly from weather grid base elevations.
- **Severe Weather Alert Badges**: Flag hazardous conditions (winds > 60 km/h, thunderstorm risk > 40%, freezing temperatures with rain) with prominent warnings.
- **Offline Weather Caching**: Cache weather forecasts in D1 and the client browser (IndexedDB) for offline consultation during multi-day excursions.
- **Frontend Weather Widgets**: Add `WeatherForecastModal.tsx` and a weather summary strip in the route preview and Companion Focus View.

## Capabilities

### New Capabilities
- `weather-forecast`: Retrieves and visualizes altitude-adjusted hourly and daily weather forecasts, severe weather safety alerts, and precipitation timelines along hiking routes using the Open-Meteo API, with offline caching support.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `packages/core`: Add weather domain types, WMO weather code mappings, and elevation lapse rate utilities.
  - `apps/api`: Add `POST /api/weather/route` and `GET /api/weather/point` endpoints with D1 forecast caching.
  - `apps/web`: Add `WeatherForecastModal.tsx`, `WeatherBadge.tsx`, and integrate weather info into route cards and live navigation.
- **External Dependencies**: Open-Meteo API (free, open-access, no API keys or commercial paywalls).
- **Performance**: Checkpoint sampling (max 5 points per route) to bundle requests and avoid superfluous network payload.
