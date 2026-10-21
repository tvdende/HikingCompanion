# Capability: Printable Route Guide & Extended Guidebook Fields

## Purpose

Empower route creators to build complete, publication-grade hiking guidebooks—matching the structure of the Sallandse Heuvelrug adventure guide—and allow users to render, preview, and print/export a beautifully formatted multi-page PDF document.

## Requirements

### Requirement: Extended Route Guide Fields & Schema
The system SHALL support the following fields on route records in `packages/core` and D1 database:
- `startPoint`: string trailhead / transit stop
- `endPoint`: string destination / transit stop
- `durationDays`: integer number of days
- `durationNights`: integer number of nights
- `recommendedPeriod`: string general season range
- `bestPeriod`: string peak season recommendation
- `logisticsNote`: markdown/text describing public transport and parking
- `navigationTips`: markdown/text covering offline maps, apps, and battery tips
- `outdoorlicious`: markdown/text with meal planning and camping recipes
- `natureAndHistory`: markdown/text detailing landscape history, geology, flora, fauna, and landmarks
- `mindfulPrompts`: markdown/text describing "Vertragen" mindfulness exercises and scenic stops
- `emergencyInfo`: markdown/text listing emergency contacts and 112 reporting guidelines
- `packingListId`: foreign key reference to an attached packing list

### Requirement: Guide Editor in Route Management
The frontend route editor SHALL provide input controls for all guidebook fields:
- Organized into structured tabs/accordions:
  - Basis & Kernfeiten (Start/Eind, dagen, nachten, seizoenen)
  - Logistiek & Navigatie (OV, parkeren, batterij/app tips)
  - Paklijst (Selecteer gekoppelde paklijst)
  - Eten & Recepten (Outdoorlicious kooktips)
  - Omgeving & Vertragen (Natuur, geschiedenis, mindfulness)
  - Veiligheid & Noodnummers (112, lokale nummers)

#### Scenario: Creator adds guidebook data to a trek
- GIVEN a route creator editing "Sallandse Heuvelrug Avontuur"
- WHEN the creator fills in start/eindpunt, recipes, and links a packing list
- THEN the data is persisted via `PUT /api/routes/:id`
- AND immediately reflected in the printable guide preview

### Requirement: Multi-Page Printable Layout (`@media print`)
The system SHALL render a dedicated `PrintableRouteGuide.tsx` component formatted for A4 printing and PDF export:
- Cover page with title, subtitle, route overview statistics, and intro
- Table of Contents
- Route overview map snapshot, stage breakdown, and elevation profile
- Surface breakdown chart (unpaved, gravel, paved percentages)
- Navigation and battery instructions
- Full attached packing list categorized into Uitrusting, Slapen, Koken, Kleding, etc.
- Curated POI locations (Campings, Supermarkten, Bezienswaardigheden) with opening hours and active website links
- Outdoorlicious recipe section
- Nature, landscape, and wildlife overview
- Vertragen mindfulness prompts
- Emergency numbers and protocol card
- Clean page breaks (`page-break-after: always`, `break-inside: avoid`) to prevent awkward splits

#### Scenario: User clicks "Print Gids"
- GIVEN a route with completed guidebook metadata
- WHEN the user clicks "Print / PDF Gids"
- THEN a printable preview opens with pagination and print layout
- AND browser print dialog triggers with clean A4 margins
