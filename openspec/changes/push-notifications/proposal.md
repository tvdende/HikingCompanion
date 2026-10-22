## Why

Hikers on the trail need timely alerts regarding critical safety conditions—such as severe weather changes (thunderstorms, gale warnings), off-route deviation alerts while hiking, and community updates when someone comments on or updates a saved route. Native push notifications on mobile devices ensure hikers receive these alerts even when their phone screen is turned off or the PWA is running in the background. In accordance with Section 3.6 of the product vision, this uses the 100% free **W3C Web Push API & VAPID (RFC 8292)** without paid third-party intermediaries.

## What Changes

- **Web Push Subscription Management**: Add backend endpoints in `apps/api`:
  - `GET /api/notifications/vapid-key`: delivers the public VAPID key to the client.
  - `POST /api/notifications/subscribe`: registers or updates a user's browser push subscription (endpoint, p256dh, auth keys) in D1.
  - `DELETE /api/notifications/subscribe`: unregisters an active subscription.
- **VAPID Payload Signing & Dispatch Engine**: Implement a Web Push cryptographic signing service in Cloudflare Workers using standard Web Crypto (`ECDSA P-256` and `AES-GCM-128`) to dispatch encrypted notification payloads directly to browser push gateways (Apple APNs, Google FCM, Mozilla autopush).
- **Automated Daily Morning Briefing (Cloudflare Worker Cron Trigger)**: Implement a scheduled cron trigger (Section 4.7) that runs every morning (default 07:00 AM, user-configurable):
  - Automatically identifies active multi-day treks and planned stages for today
  - Synthesizes stage distance, surface breakdown (e.g. 80% unpaved, 20% paved), and Open-Meteo weather forecasts
  - Dispatches a personalized morning push notification: *"Goedemorgen! Vandaag etappe 3 (18,4 km). ⛅ 19°C, droog. Tik om je route te openen."*
  - Tapping the notification opens the PWA directly on today's stage in Companion Mode with an interactive Morning Briefing Card.
- **Database Schema**: Add `push_subscriptions`, `user_notifications`, and `active_treks` tables in D1 SQLite to track registered devices, scheduled trips, and in-app notification history.
- **Service Worker Push & Action Handlers**: Extend the PWA Service Worker (`sw.js`) to handle `push` events, display system notifications with custom hiking action buttons ("Bekijk Waarschuwing", "Open Route", "Bekijk Ochtendbriefing"), and navigate to the relevant route on `notificationclick`.
- **Frontend Notification Center & Permission Banner**: Add a notification permission toggle in app settings, an opt-in banner, and an in-app notification bell drawer.

## Capabilities

### New Capabilities
- `push-notifications`: Enables browser web push notifications using the W3C Web Push & VAPID standard, supporting push subscription management, Cloudflare Worker Cron-triggered daily morning briefings, trail safety alerts, and Service Worker notification actions.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `packages/core`: Add notification payload types, subscription models, and notification categories (`safety`, `weather`, `route_update`).
  - `apps/api`: Implement VAPID signing service using Web Crypto API and push subscription endpoints.
  - `apps/web`: Service worker push event handler, `NotificationBell.tsx`, and permission toggle in settings.
- **External Dependencies**: Web Push endpoints provided by browser vendors; no external paid SaaS required.
- **Security**: Private VAPID key stored securely as a Cloudflare Worker secret.
