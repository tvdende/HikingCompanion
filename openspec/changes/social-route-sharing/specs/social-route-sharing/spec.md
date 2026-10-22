# Capability: Social Route Sharing & Recipient Limits

## Purpose

Allow route creators and hikers to share their routes, stages, and campsite plans with friends via unique share links, while enforcing free-tier recipient limits (max 3 people) and providing unlimited sharing for Premium users.

## Requirements

### Requirement: Unique Share Link Generation & Revocation
The API SHALL expose:
- `POST /api/routes/:id/share`: Generates a high-entropy, URL-safe share token (e.g. 128-bit hex/base64url) linked to the route
- `DELETE /api/routes/:id/share`: Immediately invalidates the active share link, preventing any further access via previous URLs

#### Scenario: Creator generates a share link
- GIVEN an authenticated user viewing their route "Veluwe Zwerftocht"
- WHEN the user clicks "Deel Route" and confirms
- THEN the system returns a unique share URL `https://hiking-companion.pages.dev/share/{token}`
- AND the link can be copied to the clipboard

### Requirement: Free vs. Premium Share Limits Enforcement
The system SHALL track unique recipients accessing a shared route:
- For Free/Standard accounts:
  - The route creator is permitted a maximum of 3 unique recipient accesses per route
  - When a recipient opens the share link, their access is recorded in `route_share_recipients`
  - When the 4th unique recipient attempts to access the route, the system SHALL deny access and display:
    `"Deze route heeft het maximale aantal van 3 gratis shares bereikt. Vraag de maker om te upgraden naar Premium voor onbeperkt delen."`
- For Premium subscribers and purchased routes:
  - Recipient limits MUST NOT be enforced (unlimited sharing allowed)

#### Scenario: 4th person opens a free-tier shared route
- GIVEN a route shared by a free-tier user with 3 recipients already registered
- WHEN a 4th unique user opens the share link
- THEN access is blocked with an informative limit notification
- AND the route owner sees that their 3/3 share quota is full

### Requirement: Shared Route View & Collaboration
Recipients opening a valid share link SHALL be able to:
- View the complete route line, distance, elevation profile, and surface breakdown
- View daily stages and designated overnight spots (campings/bivouac zones)
- View the attached packing list and duplicate it to their own profile
- Export or download the GPX file for field use

#### Scenario: Friend views shared multi-day trek
- GIVEN a friend opening a valid share link
- WHEN the page loads
- THEN the app renders the route in read-only shared mode
- AND highlights the planned overnight campsites and stage splits

### Requirement: Share Modal UI & Quota Indicator
The frontend UI SHALL:
- Provide a `ShareRouteModal.tsx` accessible from the active route header and library cards
- Display the shareable URL with a 1-click "Kopieer link" button and QR code
- Display a progress indicator of used shares (e.g., `"1 van 3 vrienden uitgenodigd"` for free users, or `"Onbeperkt delen actief"` with a gold Premium badge)
- Provide a "Link intrekken" button to invalidate previous shares
