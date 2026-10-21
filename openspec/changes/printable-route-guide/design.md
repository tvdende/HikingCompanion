# Design: Printable Route Guide & Extended Guidebook Fields

## Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                               apps/web                                  |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  | RouteGuideEditorModal.tsx | ----> |   PrintableRouteGuide.tsx     |  |
|  | - Tabbed guide fields     |       | - A4 print pagination         |  |
|  | - Markdown editor inputs  |       | - MapLibre static snapshot    |  |
|  | - Packing list selector   |       | - Elevation & surface charts  |  |
|  +---------------------------+       | - Categorized packing table   |  |
|                |                     | - POIs with active URLs       |  |
|                v                     +-------------------------------+  |
|       PUT /api/routes/:id                           |                   |
|                |                                    v                   |
|                |                             window.print()             |
|                v                             PDF Download               |
|  +---------------------------+                                          |
|  |  Cloudflare D1: routes    |                                          |
|  |  (guide_json / columns)   |                                          |
|  +---------------------------+                                          |
+-------------------------------------------------------------------------+
```

## Database Schema Extension (`apps/api/src/db/schema.ts`)

```typescript
// Add guidebook metadata columns or structured guideJson column to routes
export const routes = sqliteTable('routes', {
  // ... existing columns
  startPoint: text('start_point'),
  endPoint: text('end_point'),
  durationDays: integer('duration_days'),
  durationNights: integer('duration_nights'),
  recommendedPeriod: text('recommended_period'),
  bestPeriod: text('best_period'),
  logisticsNote: text('logistics_note'),
  navigationTips: text('navigation_tips'),
  outdoorlicious: text('outdoorlicious'),
  natureAndHistory: text('nature_and_history'),
  mindfulPrompts: text('mindful_prompts'),
  emergencyInfo: text('emergency_info'),
  packingListId: text('packing_list_id').references(() => packingLists.id),
});
```

## Print CSS Styling Strategy
- Dedicated CSS module `PrintableRouteGuide.css` using standard `@page { size: A4 portrait; margin: 15mm; }`
- Responsive cover page with full-bleed header typography
- `break-inside: avoid` for cards, POI rows, recipe boxes, and packing list tables
- Embedded SVG icons for categories (Uitrusting, Slapen, Koken, etc.) matching the design aesthetic of the Sallandse Heuvelrug sample guide.
