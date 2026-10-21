# Design: Packing Lists & Gear Management

## System Architecture

```
+-------------------------------------------------------------------------+
|                               apps/web                                  |
|  - PackingListModal.tsx (Category cards, item rows, checkoff mode)      |
|  - WeightBreakdownBar.tsx (Base weight, consumables, worn weight)       |
|  - RouteDetails / PrintView integration (attached packing list table)   |
+------------------------------------+------------------------------------+
                                     |
                             REST API Endpoints
                                     v
+-------------------------------------------------------------------------+
|                               apps/api                                  |
|  - /api/packing-lists (CRUD, duplicate, item updates)                   |
|  - D1 SQLite Tables: `packing_lists` & `packing_list_items`              |
|  - Route relation: `routes.packing_list_id`                             |
+------------------------------------+------------------------------------+
```

## Database Schema (`apps/api/src/db/schema.ts`)

```typescript
export const packingLists = sqliteTable('packing_lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const packingListItems = sqliteTable('packing_list_items', {
  id: text('id').primaryKey(),
  packingListId: text('packing_list_id').notNull().references(() => packingLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'uitrusting' | 'slapen' | 'koken' | ...
  quantity: integer('quantity').default(1).notNull(),
  weightGrams: integer('weight_grams').default(0).notNull(),
  isWorn: integer('is_worn', { mode: 'boolean' }).default(false).notNull(),
  isConsumable: integer('is_consumable', { mode: 'boolean' }).default(false).notNull(),
  isPacked: integer('is_packed', { mode: 'boolean' }).default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});
```

## Domain Types (`packages/core`)

```typescript
export type PackingCategory =
  | 'uitrusting'
  | 'slapen'
  | 'elektronica'
  | 'koken'
  | 'eetgerei'
  | 'afwas'
  | 'toiletspullen'
  | 'kleding'
  | 'aantrekken';

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  weightGrams: number;
  isWorn: boolean;
  isConsumable: boolean;
  isPacked: boolean;
  sortOrder: number;
}

export interface PackingList {
  id: string;
  userId: string;
  title: string;
  description?: string;
  items: PackingItem[];
  createdAt: string;
  updatedAt: string;
}
```
