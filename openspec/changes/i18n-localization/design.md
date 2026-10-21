# Design: Internationalization (NL & EN Localization)

## Architecture

```
+-------------------------------------------------------------------------+
|                              apps/web                                   |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  |     i18n Context / Hook   | <---> |   LanguageSelector.tsx        |  |
|  | - activeLocale: 'nl'|'en' |       | - 🇳🇱 Nederlands / 🇬🇧 English  |  |
|  | - t(key, params)          |       +-------------------------------+  |
|  | - formatDistance(m)       |                                          |
|  | - formatCurrency(cents)   |                                          |
|  +-------------+-------------+                                          |
|                |                                                        |
|        +-------+-------+                                                |
|        v               v                                                |
|  locales/nl.json  locales/en.json                                       |
+-------------------------------------------------------------------------+
```

## Structure of Translation Catalogs
Translation files `apps/web/src/i18n/locales/nl.json` and `en.json` organized into logical namespaces:
- `common`: Generic actions (Save, Cancel, Close, Edit, Delete, Loading, Error)
- `nav`: Topbar and navigation items
- `planner`: Route planning, routing profiles, snapping, and undo/redo
- `library`: Route management, status filters, pricing, and cards
- `surface`: Surface breakdown labels and metrics
- `poi`: Amenities, categories, opening hours, and distance markers
- `weather`: Meteorological conditions, alerts, and timeframes
- `navigation`: Live guidance, off-trail warnings, and Companion Focus View
- `packing`: Gear categories, weights, and items
- `print`: Printable route guide titles and instructions
