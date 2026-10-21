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
