## Why

Hikers embarking on multi-day wilderness treks, national park traversals, or weekend camping adventures frequently carry a physical printed guidebook as a reliable, battery-free reference. High-quality hiking publications (such as the curated Sallandse Heuvelrug adventure guide) provide not merely a line on a map, but a comprehensive, well-structured travel guide: logistical facts, day-by-day stage descriptions, navigation advice, attached gear packing lists, curated campsite/resupply locations with website links, trail recipes, historical nature notes, mindfulness trail prompts, and emergency rescue checklists. Planners must have all fields available when creating or editing a route to produce a complete, publication-ready guide, and users must be able to view and print/export a PDF guide directly from the app.

## What Changes

- **Route Metadata & Guide Fields Expansion**: Expand route editing in `packages/core` and D1 database to capture all guidebook content blocks:
  - `startPoint`: Trailhead / start railway station or parking
  - `endPoint`: Finish point / railway station
  - `durationDays`: Total days (e.g., 2)
  - `durationNights`: Total nights (e.g., 1)
  - `recommendedPeriod`: General season (e.g., "April tot oktober")
  - `bestPeriod`: Peak season highlights (e.g., "Half augustus tot half september bloeit de heide")
  - `logisticsNote`: Public transport / train station connections and parking information
  - `navigationTips`: Advice for GPS devices, phone battery care, offline maps
  - `outdoorlicious`: Meal strategy and camping recipes (e.g. trail porridge, one-pot pasta)
  - `natureAndHistory`: Environmental, geological, wildlife, and cultural background
  - `mindfulPrompts`: "Vertragen" mindfulness exercises and scenic pause spots
  - `emergencyInfo`: Emergency phone numbers and 112 distress call reporting checklist
  - `packingListId`: Reference to attached packing list
- **Comprehensive Route Guide Modal**: Add an expanded guide editor modal in `apps/web` allowing creators to fill in and preview all guidebook sections.
- **Printable Guide View (`@media print`)**: Build `PrintableRouteGuide.tsx` with print-optimized pagination, high-contrast typography, styled table of contents, route map snapshot, elevation profile, surface breakdown chart, POI tables with direct website URLs, and attached packing list.
- **Export Action**: Add "Print / Exporteer PDF Gids" action in route header and details drawer.

## Capabilities

### New Capabilities
- `printable-route-guide`: Generates a complete, multi-page printable hiking guidebook (and PDF export) featuring route maps, day stages, elevation profiles, surface breakdown, attached packing lists, POIs with website links, trail recipes, nature notes, and emergency protocols, backed by expanded route metadata editor fields.

### Modified Capabilities
- `route-library`: Extends route schema with guidebook fields and PDF export trigger.

## Impact

- **Affected Code**: `packages/core/src/types/index.ts`, `apps/api/src/db/schema.ts`, `apps/web/src/components/PrintableRouteGuide.tsx`, `apps/web/src/components/RouteMetadataModal.tsx`.
- **Styling**: Print stylesheets (`@page`, `break-inside: avoid`, page headers/footers).
