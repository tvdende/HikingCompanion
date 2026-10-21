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

### Requirement: Multi-Page Printable Layout & Structure (`@media print`)
The system SHALL render a dedicated `PrintableRouteGuide.tsx` component formatted for A4 printing and PDF export, adhering to the structure of the Sallandse Heuvelrug guide:
- **Cover Page**: Title, subtitle/location, route key metrics summary (Startpunt, Eindpunt, Aantal dagen, Aantal nachten, Km per dag, Periode, Beste periode) and introductory narrative.
- **Table of Contents**: Automatic table of contents referencing all included sections with page jump anchors.
- **Section Image Attachments**: Planners SHALL be able to provide optional image URLs for key guidebook sections (Cover photo, Omgeving/Landschap, Overnachten/Camping, Outdoorlicious recept), which are rendered with rounded border styling and captions as seen in the reference publication.
- **Route Overview & Day Stages**: Route description per day/stage, static map snapshot, and elevation profile.
- **Surface Breakdown**: Terrain breakdown table and segmented bar chart (unpaved, gravel, paved percentages).
- **Navigation & Technology**: App guidance, offline caching recommendations, and battery conservation tips.
- **Attached Packing List**: Full gear table categorized into Uitrusting, Slapen, Elektronica, Koken, Eetgerei, Afwas, Toiletspullen, Kleding, and Aantrekken.
- **Curated POI Locations**: Direct address listings, opening hours, and clickable website links for Campings, Supermarkten, and Bezienswaardigheden.
- **Outdoorlicious**: Meal strategies, ingredient lists, and step-by-step camp recipes (breakfast and dinner).
- **Omgeving & Natuur**: Historical context, geology, flora, fauna, and points of interest.
- **Vertragen**: Mindfulness prompts and pause suggestions.
- **Noodnummers & Veiligheid**: 112, 0900-8844, animal rescue numbers, and distress call checklist.
- **Pagination & Print Cleanliness**: Strict CSS print rules (`@page`, `page-break-before: always` for primary chapters, `break-inside: avoid` for cards, tables, and images).

#### Scenario: User clicks "Print Gids"
- GIVEN a route with completed guidebook metadata
- WHEN the user clicks "Print / PDF Gids"
- THEN a printable preview opens with pagination and print layout
- AND browser print dialog triggers with clean A4 margins
