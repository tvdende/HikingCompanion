# Capability: Web Push Notifications & Trail Alerts

## Purpose

Deliver real-time, free browser push notifications to hikers and planners using the W3C Web Push & VAPID standard for weather warnings, off-route alerts, and route updates.

## Requirements

### Requirement: VAPID Key Distribution & Subscription Registration
The backend API SHALL expose:
- `GET /api/notifications/vapid-key`: returns the application server public key (uncompressed P-256 point in base64url format)
- `POST /api/notifications/subscribe`: accepts `endpoint`, `keys.p256dh`, and `keys.auth`, linking the device subscription to the authenticated user ID in D1

#### Scenario: Registering a browser push subscription
- GIVEN an authenticated user granting notification permissions in the browser
- WHEN the client posts its `PushSubscription` JSON to `POST /api/notifications/subscribe`
- THEN a record is inserted or updated in `push_subscriptions` in D1
- AND the server responds with HTTP 201 Created

### Requirement: Web Push Encrypted Payload Delivery
The backend service SHALL construct and dispatch Web Push messages conforming to RFC 8291 (Message Encryption for Web Push) and RFC 8292 (VAPID):
- Sign authorization headers with VAPID JWT using the private key via Web Crypto API
- Encrypt message payload (`title`, `body`, `icon`, `url`, `tag`, `actions`) with AES-GCM
- POST directly to the user's browser push endpoint (Google FCM, Apple APNs, or Mozilla autopush)
- Automatically purge expired or invalid subscriptions (HTTP 404 / 410 Gone from push endpoint) from D1

#### Scenario: Sending an emergency thunderstorm alert
- GIVEN an active hiker with a registered push subscription on route `route-alps-trek`
- WHEN a severe weather warning is triggered for that route corridor
- THEN the system dispatches an encrypted Web Push message with title "Weerwaarschuwing: Onweer op komst"
- AND the browser displays the notification even if the PWA is closed

### Requirement: Service Worker Push & Click Handling
The PWA Service Worker SHALL:
- Listen for the `push` event and display a notification with app icon and badge
- Handle `notificationclick` events:
  - If an existing app window is open, focus it and navigate to the target route/alert URL
  - If no window is open, launch a new window pointing to the target URL

#### Scenario: User clicks a push notification
- GIVEN a received push notification pointing to `/routes/route-123`
- WHEN the user taps the notification on their mobile screen
- THEN the service worker opens the app directly at `/routes/route-123`

### Requirement: In-App Notification Center & Contextual Permission Flow
The frontend UI SHALL:
- Request push notification permission contextually (e.g. when the user starts live navigation or inspects weather warnings), rather than bombarding users on initial page load.
- Dispatch notifications specifically for:
  - Daily morning briefings for active multi-day treks
  - Severe weather alerts along active or saved routes (thunderstorms, heavy wind/rain)
  - Route modifications and comments by trail creators
- Show an in-app notification center bell in the navigation bar displaying recent notifications with read/unread status and direct links to the relevant route or alert.

### Requirement: Automated Daily Morning Briefing (Cloudflare Worker Cron Trigger)
The system SHALL support automated daily morning briefings (Section 4.7):
- A Cloudflare Worker Cron Trigger (`scheduled` event) SHALL execute daily (default 07:00 AM, user-configurable in settings between 05:00 and 09:00 AM)
- For every user currently on an active scheduled multi-day trek:
  - Identify today's planned stage number, distance, and elevation profile
  - Query the stage surface breakdown and Open-Meteo weather forecast for that day
  - Compose and dispatch a personalized Web Push notification:
    `"Goedemorgen! Vandaag etappe {stageNumber} ({distanceKm} km). {weatherEmoji} {temp}°C, {weatherDesc}. Tik om je route te openen."`
- Tapping the notification SHALL open the PWA directly on today's stage in Companion Mode with an interactive `MorningBriefingCard` presenting:
  - Daily distance & estimated hiking duration
  - Terrain/surface breakdown for that specific stage (e.g. 75% unpaved, 25% paved)
  - Time-block weather forecasts (morning, afternoon, evening) with precipitation probability and wind speed

#### Scenario: Hiker receives morning briefing on trail
- GIVEN a hiker on Day 3 of the GR20 with a scheduled morning notification at 07:00
- WHEN the Cloudflare Worker cron fires at 07:00 AM
- THEN the hiker receives a push notification summarizing today's 16.5 km mountain stage and sunny weather
- AND tapping the notification launches Companion mode directly on Stage 3 with the full briefing
