# Capability: Packing Lists & Gear Management

## Purpose

Provide a comprehensive packing list management system allowing hikers to create, organize, check off, and calculate weights for gear categories, and link recommended packing lists directly to hiking routes.

## Requirements

### Requirement: Categorized Packing List Data Model
The system SHALL support gear items grouped into standardized outdoor categories:
- `uitrusting`: Tent, backpack, rain cover, trekking poles, camp chair/pad
- `slapen`: Sleeping bag, sleeping pad, liner, travel pillow, stuff sack
- `elektronica`: Headlamp, powerbank, cables, earphones, drybags
- `koken`: Camp stove, pot, fuel canister, matches/firesteel
- `eetgerei`: Spork, cup, bowl, water bladder/bottle, food bag
- `afwas`: Biodegradable soap, camp towel, mini sponge
- `toiletspullen`: First aid kit, tick tweezers, medication, sunscreen, trowel, hygiene
- `kleding`: Insulation jacket, rain gear, spare socks, thermal layers
- `aantrekken`: Worn apparel, boots, hat, watch

Each packing item MUST support:
- `id`: unique identifier
- `name`: string description
- `category`: gear category
- `quantity`: positive integer (default 1)
- `weightGrams`: integer weight in grams (0 for untracked)
- `isWorn`: boolean indicating whether the item is worn on the body (excluded from base pack weight)
- `isConsumable`: boolean indicating food/fuel/water
- `isPacked`: boolean checkbox state

### Requirement: Packing List CRUD REST API
The backend API SHALL expose:
- `GET /api/packing-lists`: returns all packing lists owned by the authenticated user
- `POST /api/packing-lists`: creates a new packing list with title, description, and initial items
- `GET /api/packing-lists/:id`: retrieves a packing list with all items
- `PUT /api/packing-lists/:id`: updates packing list metadata and full item collection
- `DELETE /api/packing-lists/:id`: removes the packing list
- `POST /api/packing-lists/:id/duplicate`: clones an existing list as a new template

#### Scenario: Creating a multi-day trek packing list
- GIVEN an authenticated user
- WHEN the user submits a new packing list titled "Zomer Trekking 3 Dagen" with 15 items
- THEN the list is persisted in D1
- AND the server responds with the created packing list and calculated total weight

### Requirement: Weight Calculations
The system SHALL compute aggregated gear metrics:
- `baseWeightGrams`: sum of weights of all non-worn, non-consumable items
- `consumableWeightGrams`: sum of food, fuel, and water items
- `wornWeightGrams`: sum of items marked as `isWorn`
- `totalPackWeightGrams`: base weight + consumable weight
- `packedProgress`: percentage of items marked as `isPacked`

#### Scenario: Tallying base weight
- GIVEN a packing list with 8kg tent/sleeping/cooking gear (in pack) and 2kg boots/clothing (worn)
- WHEN weight metrics are calculated
- THEN `baseWeightGrams` MUST equal 8,000 grams
- AND `wornWeightGrams` MUST equal 2,000 grams

### Requirement: Linking & Duplicating Packing Lists on Routes
The system SHALL allow linking a packing list to a hiking route:
- The route schema in D1 SHALL support an optional `packingListId` foreign key
- When creating a new packing list, it SHALL always initialize as a clean, empty list where the user enters their own custom gear items (no forced boilerplate templates)
- When viewing a route that has an attached packing list, any visitor or hiker SHALL be able to click a "Kopieer naar mijn paklijsten" (Duplicate to my packing lists) action
- Duplicating a route's packing list creates an independent copy in the user's personal packing lists with all items unchecked, allowing the hiker to check off gear during packing without modifying the creator's master list

#### Scenario: Hiker duplicates a route's recommended packing list
- GIVEN a route "Sallandse Heuvelrug 2-daagse" linked to creator's master packing list ID `pack-123`
- WHEN an authenticated hiker clicks "Kopieer naar mijn paklijsten"
- THEN a new personal packing list is created for that hiker containing identical items with `isPacked = false`
- AND the hiker can check off items and adjust weights independently

### Requirement: Persistent Multi-Day Inpakmodus (Packing Checklist Mode)
The system SHALL provide a dedicated "Inpakmodus" (Packing Mode) accessible directly from an active route or personal packing list:
- Prominent interactive checkboxes allowing hikers to mark items as packed while filling their backpack
- State changes (`isPacked: boolean`) MUST be saved immediately to the D1 database (via `PATCH /api/packing-lists/:id/items/:itemId/pack`) and mirrored in local cache so hikers can pack gradually over multiple days without losing progress
- Live packing progress indicator showing packed count and percentage (e.g. "21 van 30 ingepakt · 70%")
- Filter views: "Nog inpakken" (shows only unpacked items), "Alles" (full categorized list), and "Al ingepakt"
- "Paklijst resetten" (Reset packing status) action to uncheck all items when preparing for a subsequent hike

#### Scenario: Packing gear across multiple days
- GIVEN a hiker packing their tent and sleeping gear on Thursday and closing the app
- WHEN the hiker re-opens the inpakmodus on Friday
- THEN the tent and sleeping gear remain checked as packed
- AND the hiker can continue checking off clothing and food items

### Requirement: Multi-Platform External Gear List Import
The system SHALL support importing gear lists directly from external hiking and ultralight gear planning tools:
- **LighterPack**: Accepts exported CSV text or public LighterPack URL / JSON
- **Packwizard**: Accepts Packwizard CSV export text or JSON
- **Packstack / StackPack**: Accepts exported CSV or JSON data
- **GearGrams & Don't Forget The Spoon**: Accepts standard gear CSV exports
- **Spreadsheets (Google Sheets & Excel)**: Accepts CSV / TSV text with smart fuzzy detection of standard header columns (`Category/Categorie`, `Name/Item/Omschrijving`, `Weight/Gewicht`, `Unit/Eenheid`, `Qty/Aantal`, `Worn/Gedragen`, `Consumable/Verbruik`)
- The importer SHALL automatically:
  - Map external categories to standard categories (`uitrusting`, `slapen`, `koken`, `kleding`, etc.)
  - Convert imperial units (oz, lbs) to metric grams (`1 oz = 28.3495 g`, `1 lb = 453.592 g`)
  - Detect `worn` flag and assign `isWorn = true`
  - Detect consumable items (food, fuel) and assign `isConsumable = true`
  - Create the packing list and optionally link it immediately to the active route

#### Scenario: Importing a Packwizard or LighterPack CSV export
- GIVEN a CSV export from Packwizard, LighterPack, or Google Sheets
- WHEN the user uploads or pastes the CSV text via the import modal
- THEN the system automatically detects column mappings, converts weights to integer grams, and generates a new packing list
- AND links it to the route upon confirmation
