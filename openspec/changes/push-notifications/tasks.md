## 1. Domain Types & Database Schema

- [ ] 1.1 Define `PushSubscriptionRecord`, `NotificationPayload`, and `NotificationCategory` types in `packages/core/src/types` and export via `packages/core/src/index.ts`.
- [ ] 1.2 Add `push_subscriptions` and `user_notifications` tables to D1 schema in `apps/api/src/db/schema.ts` and generate Drizzle migration.

## 2. API Backend & Web Push Dispatcher

- [ ] 2.1 Implement Web Crypto VAPID signing and AES-GCM encryption service in `apps/api/src/services/web-push.ts`.
- [ ] 2.2 Implement `GET /api/notifications/vapid-key` and `POST /api/notifications/subscribe` in `apps/api/src/routes/notifications.ts`.
- [ ] 2.3 Implement notification dispatch helper that auto-cleans invalid/unregistered endpoints on 404/410 responses.
- [ ] 2.4 Implement Cloudflare Worker `scheduled` cron trigger handler in `apps/api/src/cron/morning-briefing.ts` synthesizing stage distance, surface breakdown, and weather for active treks.

## 3. PWA Service Worker & Web UI

- [ ] 3.1 Update Service Worker in `apps/web` to handle `push` and `notificationclick` events with navigation actions.
- [ ] 3.2 Add push notification permission prompt and settings toggle in `apps/web/src/components/SettingsModal.tsx`.
- [ ] 3.3 Create `NotificationBell.tsx` in `apps/web/src/components` with notification list drawer and mark-as-read interaction.
- [ ] 3.4 Create `MorningBriefingCard.tsx` in `apps/web/src/components` displaying daily stage summary, terrain breakdown, and morning/afternoon weather forecast blocks.

## 4. Verification

- [ ] 4.1 Run unit tests (`npm run test:unit`) verifying VAPID header generation, cron morning briefing synthesizer, and subscription endpoints.
- [ ] 4.2 Verify monorepo build succeeds with `npm run build`.
- [ ] 4.3 Add a Playwright E2E test in `tests/e2e/e2e/push-notifications.spec.ts` mocking service worker push registration and morning briefing dialog.
