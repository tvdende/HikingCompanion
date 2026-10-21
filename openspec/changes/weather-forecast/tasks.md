## 1. Domain Types & Weather Code Interpretation

- [ ] 1.1 Define `WeatherPointMetrics`, `WeatherCheckpoint`, `HourlyForecastItem`, and `WeatherAlert` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Implement WMO weather code mapping and hazardous weather risk classification in `packages/core/src/weather/wmo.ts` with unit tests.

## 2. API Backend & Open-Meteo Integration

- [ ] 2.1 Add `weather_cache` table to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.
- [ ] 2.2 Implement Open-Meteo client service in `apps/api/src/services/weather.ts` fetching hourly and daily forecasts with elevation parameters.
- [ ] 2.3 Implement `POST /api/weather/route` in `apps/api/src/routes/weather.ts` checkpointing Start, Summit, and Finish, verified with unit tests.

## 3. Web UI & Forecast Visualizer

- [ ] 3.1 Create `WeatherBadge.tsx` in `apps/web/src/components` displaying current temperature and weather icon on the active route.
- [ ] 3.2 Create `WeatherForecastModal.tsx` in `apps/web/src/components` with hourly temperature/precipitation graphs and 7-day outlook.
- [ ] 3.3 Implement client-side forecast caching in IndexedDB for offline trail access.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying weather code mapping and checkpoint extraction.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/weather-forecast.spec.ts` mocking weather responses and validating the forecast modal.
