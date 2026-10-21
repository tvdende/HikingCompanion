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

### Requirement: In-App Notification Center
The frontend UI SHALL:
- Provide an opt-in toggle in user settings to enable or disable push notifications
- Show an in-app notification center bell displaying recent notifications and read/unread status
