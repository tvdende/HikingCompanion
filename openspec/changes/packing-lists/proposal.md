## Why

Preparing proper gear is essential for safe, comfortable hiking. Carrying too much weight leads to exhaustion and injuries (as noted in standard hiking guidance, base pack weight should stay within ~20% of body weight), while forgetting critical items (tent stakes, water purification, rain gear) can ruin a trek. Hikers need the ability to build, customize, and manage packing lists with item weights and checkmarks, and route creators need to attach a recommended packing list directly to a hike route so anyone walking that route has an instant packing guide.

## What Changes

- **Packing List Data Model & Categories**: Support comprehensive gear categories matching outdoor practices (as featured in the Sallandse Heuvelrug trail guide):
  - `uitrusting` (Backpack, rain cover, trekking poles, camp chair, tent)
  - `slapen` (Sleeping bag, liner, pillow, sleeping pad, stuff sack)
  - `elektronica` (Headlamp, charging cable, powerbank, earphones, drybag)
  - `koken` (Pot, stove, gas canister, spatula, firestarter)
  - `eetgerei` (Spork, mug, pocket knife, bowl, water bottle/bladder, food sack)
  - `afwas` (Biodegradable soap, sponge, mini basin, camp towel)
  - `toiletspullen` (First aid kit, tick tweezers, painkillers, trowel/toilet paper, toothbrush, sunscreen)
  - `kleding` (Down jacket, wind/rain jacket, rain pants, buff, socks, convertible pants, base layers)
  - `aantrekken` (Hiking boots, trail socks, trekking pants, shirt, fleece)
- **Item Weight & Packed State**: Each item tracks name, category, quantity, weight in grams, whether it is worn or in-pack, and packed checkbox state.
- **Total Weight Calculation**: Automatic tallying of Base Weight (pack weight excluding consumables), Consumables (food/water), Worn Weight, and Total Pack Weight.
- **Inpakmodus (Multi-Day Packing Checklist Mode)**: A dedicated packing screen for a chosen route allowing hikers to check off items as they pack their backpack. Checked states (`isPacked: boolean`) are saved immediately and persistently in D1 so hikers can pack gradually over multiple days without losing progress, complete with progress percentage ("24/38 ingepakt · 63%"), "Alleen nog inpakken" filter, and a reset toggle.
- **LighterPack & Packstack / StackPack Importer**: Ingest packing lists directly from external ultralight gear tools (LighterPack CSV/JSON/URL and Packstack CSV/JSON). Automatically converts imperial units (oz, lbs) to grams, maps custom categories to standard outdoor categories, flags worn gear, and attaches the imported list to the hike route.
- **Full CRUD API & D1 Persistence**: Endpoints in `apps/api`:
  - `GET /api/packing-lists`: List user's packing lists
  - `POST /api/packing-lists`: Create a new packing list
  - `GET /api/packing-lists/:id`: Retrieve packing list details
  - `PUT /api/packing-lists/:id`: Update items and metadata
  - `DELETE /api/packing-lists/:id`: Delete packing list
  - `POST /api/packing-lists/:id/duplicate`: Clone packing list as template
  - `PATCH /api/packing-lists/:id/items/:itemId/pack`: Update item packed status instantly
  - `POST /api/packing-lists/import`: Parse and import LighterPack / Packstack CSV or JSON
- **Route Linking**: Link a packing list to a specific `routeId` so that when a hiker opens or prints the route, the recommended gear list and inpakmodus are accessible.
- **Frontend Packing List Modal & Inpakmodus View**: Interactive modal with gear categories, weight summary cards, live inpakmodus checklist, and external import dialog.

## Capabilities

### New Capabilities
- `packing-lists`: Full CRUD management for categorized hiking gear lists with item weights, base weight calculations, persistent multi-day Inpakmodus checkoff state, LighterPack and Packstack import, and direct linking to hiking routes.

### Modified Capabilities
- `route-library`: Extends route schema and details with an optional `packingListId` link and Inpakmodus launcher.

## Impact

- **Affected Code**: `packages/core/src/types/`, `apps/api/src/db/schema.ts`, `apps/api/src/routes/packing.ts`, `apps/web/src/components/PackingListModal.tsx`.
- **Database**: Adds `packing_lists` and `packing_list_items` tables to D1 SQLite; adds `packing_list_id` to `routes` table.
