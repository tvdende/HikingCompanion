# Capability: Weather Forecasting & Trail Safety Alerts

## Purpose

Provide accurate, altitude-adjusted hourly and multi-day weather forecasts along hiking routes, highlighting severe mountain weather risks (thunderstorms, gale winds, hypothermia temperatures) and providing offline forecast persistence.

## Requirements

### Requirement: Altitude-Adjusted Route Weather Checkpoints
The backend API SHALL expose `POST /api/weather/route`:
- Accepts route coordinates and elevation profiles
- Automatically selects key route checkpoints:
  - Trailhead (Start)
  - Summit / highest elevation point along the route
  - Finish / endpoint
  - Optional stage transition checkpoints
- Queries Open-Meteo with exact latitude, longitude, and altitude parameters
- Returns hourly forecasts (next 48 hours) and daily forecasts (next 7 days) for each checkpoint

#### Scenario: Hiking up a 2500m mountain peak
- GIVEN a route starting at 800m elevation and peaking at 2500m summit
- WHEN the client requests route weather
- THEN the API returns separate forecasts for the 800m valley and the 2500m summit
- AND reflects the temperature decrease at high altitude

### Requirement: Weather Metrics & WMO Code Interpretation
The system SHALL interpret WMO weather classification codes into standardized icons, labels, and risk levels:
- Metrics: temperature (°C), apparent temperature / windchill (°C), precipitation probability (%), precipitation volume (mm), wind speed (km/h or Bft), wind gusts (km/h)
- Risk flags:
  - `thunderstorm`: WMO codes 95, 96, 99
  - `heavy_rain`: precipitation > 10 mm/h or code 65, 82
  - `gale_wind`: wind gusts > 65 km/h
  - `snow_ice`: codes 71, 73, 75, 85, 86

#### Scenario: Detecting impending afternoon thunderstorm
- GIVEN a weather forecast with WMO code 95 (Thunderstorm with hail) at 15:00
- WHEN the route weather is processed
- THEN the system flags a severe weather risk badge for that hour
- AND marks the summit checkpoint as high risk

### Requirement: D1 & Local Storage Forecast Caching
The system SHALL cache weather forecast data:
- D1 SQLite caches forecast payloads for 1 hour to prevent redundant external queries
- The PWA stores retrieved route weather in IndexedDB so hikers can review the latest forecast even after losing cellular connectivity

#### Scenario: Offline weather inspection
- GIVEN a forecast loaded before starting the hike
- WHEN mobile data disconnects in a deep valley
- THEN the PWA displays the cached forecast with a timestamp badge indicating when it was last updated

### Requirement: Weather UI Widgets & Modal
The frontend UI SHALL:
- Display a quick weather pill on route cards and active route header (e.g. `☀️ 18°C · 0 mm`)
- Provide a `WeatherForecastModal.tsx` showing hourly timeline graphs and 7-day outlook
- Highlight severe weather warnings with orange/red alert banners
