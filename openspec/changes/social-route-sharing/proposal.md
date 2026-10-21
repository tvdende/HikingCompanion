## Why

Hiking is fundamentally a social adventure. Friends, hiking clubs, and trekking buddies want to share trails, plan stages together, and inspect overnight campsites before departing. As defined in Sections 4.1 & 4.6 of the product vision, the platform needs a social sharing mechanism via secure unique share links (`/share/:token`). To safeguard platform resources and incentivize Premium upgrades, free/standard accounts are subject to a configurable share limit (maximum 3 people per route), while Premium subscribers and route purchasers enjoy unlimited sharing.

## What Changes

- **Unique Share Token & Route Sharing API**: Add endpoints in `apps/api`:
  - `POST /api/routes/:id/share`: Generates or retrieves an active share token for a route.
  - `GET /api/share/:token`: Resolves a shared route by token, tracks recipient count, and enforces recipient limits.
  - `DELETE /api/routes/:id/share`: Revokes the active share link.
  - `GET /api/routes/:id/shares`: Lists active share recipients and remaining share quota.
- **Free vs. Premium Share Limits Enforcement**:
  - Standard/Free users: Capped at maximum 3 unique recipients/shares per route. If a 4th person attempts to access the route via the share link, an informative upgrade notice is displayed.
  - Premium subscribers & Route purchasers: Unlimited sharing with zero recipient restrictions.
- **Database Schema**: Add `route_shares` and `route_share_recipients` tables in D1 SQLite to track tokens, recipient IP/user IDs, and expiration.
- **Shared Trek Collaboration View**: When friends open a shared link:
  - Full read access to the route track, elevation profile, and surface breakdown.
  - Access to planned day stages and designated overnight spots (campings/huts).
  - Ability to view the attached gear packing list and clone it to their own profile.
- **Share Modal UI**: Add `ShareRouteModal.tsx` in `apps/web` with a 1-click "Kopieer deellink" button, QR code display, share quota badge ("2 van 3 vrienden uitgenodigd"), and revoke action.

## Capabilities

### New Capabilities
- `social-route-sharing`: Generates secure unique share links for hiking routes, enforces a 3-person share limit for free-tier users while granting unlimited sharing to Premium members, and provides a collaborative shared route viewer with day stages and accommodation details.

### Modified Capabilities
- `route-library`: Extends route card actions with a "Deel Route" trigger and share badge.

## Impact

- **Affected Code**: `packages/core/src/types/`, `apps/api/src/db/schema.ts`, `apps/api/src/routes/sharing.ts`, `apps/web/src/components/ShareRouteModal.tsx`.
- **Database**: Adds `route_shares` and `route_share_recipients` tables in D1.
