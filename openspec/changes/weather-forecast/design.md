# Design: Weather Forecasting & Trail Safety Alerts

## Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                               apps/web                                  |
|  - WeatherBadge.tsx (Current weather pill on active route)              |
|  - WeatherForecastModal.tsx (Hourly slider, 7-day outlook, rain graph)  |
|  - Offline cache in IndexedDB via localforage / Cache API               |
+------------------------------------+------------------------------------+
                                     |
                          POST /api/weather/route
                                     v
+-------------------------------------------------------------------------+
|                               apps/api                                  |
|  - Extract checkpoints: Start, Summit, End, Stages                      |
|  - D1 Cache (`weather_cache`, 1 hour TTL)                               |
|  - Open-Meteo API Client (hourly/daily models with elevation param)     |
+------------------------------------+------------------------------------+
                                     |
                          HTTPS External Query
                                     v
+-------------------------------------------------------------------------+
|                   https://api.open-meteo.com/v1/forecast                |
+-------------------------------------------------------------------------+
```

## Domain Types (`packages/core`)

```typescript
export interface WeatherCheckpoint {
  label: string; // 'Start', 'Summit', 'Finish', 'Stage 2'
  coordinates: [number, number]; // [lon, lat]
  elevationMeters: number;
  current: WeatherPointMetrics;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
}

export interface WeatherPointMetrics {
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmH: number;
  windGustsKmH: number;
  weatherCode: number;
  weatherDescription: string;
  isHazardous: boolean;
}
```

## D1 Cache Schema (`apps/api/src/db/schema.ts`)

```typescript
export const weatherCache = sqliteTable('weather_cache', {
  id: text('id').primaryKey(), // hash(lon_lat_elevation_rounded)
  coordinates: text('coordinates').notNull(),
  elevationMeters: integer('elevation_meters').notNull(),
  payloadJson: text('payload_json').notNull(),
  fetchedAt: text('fetched_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});
```
