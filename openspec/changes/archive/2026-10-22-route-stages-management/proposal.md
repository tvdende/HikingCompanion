## Why

Long-distance trails (like Pieterpad, GR routes, or West Highland Way) are inherently multi-day hikes composed of multiple stages (etappes). Currently, Hiking Companion displays an aggregate stage count (`Etappes: 1`) and collapses all waypoints into a single hardcoded stage. Users cannot define where a stage begins or ends, view individual stage metrics, designate public transit connections (bus/train/ferry), or edit a specific stage while keeping the overall route visible in context.

Introducing full multi-stage route management allows hikers to plan realistic multi-day itineraries, split routes into distinct day stages, mark transit legs, inspect per-stage metrics (distance, ascent, descent, walking vs transit km), reorder stages via drag-and-drop or step buttons, and navigate/edit individual stages on the map with contextual visibility of the entire trail.

## What Changes

- **Multi-Stage Definition & Splitting**: Users can split an active route into multiple sequential stages at any waypoint or add new stages directly from the planner menu (`+ Nieuwe etappe`, defaulting to the finish of the preceding stage).
- **Stage Merging & Deletion**: Users can merge adjacent stages at their transition point (`F1 / S2`), or delete an entire stage (which removes its route points from the map and sequentially renumbers remaining stages: 1, 2, 3...).
- **Public Transport Segments (OV)**: Stages or legs can be marked with a transport type (`foot`, `bus`, `train`, `ferry`). Transit stages are visually differentiated on the map (dashed polyline with transit icon) and separated in distance metrics (hiking distance vs transit distance).
- **GPX Import Flexibility**:
  - Uploading a GPX file when an active route exists presents a choice modal: *"Toevoegen aan huidige etappe"* (Append to current stage) vs *"Als nieuwe etappe toevoegen"* (Add as new stage).
  - Importing a multi-track / multi-segment GPX (e.g. Pieterpad with multiple `<trk>` or `<trkseg>`) prompts the user: *"Als één samengevoegde etappe"* vs *"Als losse etappes importeren"*.
- **GPX Multi-Track Export**: Multi-stage routes export to standard GPX 1.1 with distinct `<trk>` / `<trkseg>` elements containing stage titles and notes.
- **Visual Stage Distinction & Badges**:
  - Each stage has an outdoor color palette.
  - Active stage is rendered prominently (6px, full opacity, interactive handles); inactive stages remain visible with subdued opacity (4px, 0.55 opacity).
  - Clear transition badges on the map: `S1` (Start), `F1 / S2` (Transition finish/start), `F_n` (Final finish), plus transit icons (🚌 / 🚆 / ⛴️).
- **Stage List & Custom Metadata**:
  - Sidebar panel with stage cards showing distance, elevation, points count, and transport type.
  - Editable stage titles (e.g. *"Etappe 1: Pieterburen – Winsum"*).
  - Optional stage notes field (e.g. *"Overnachting: Camping De Bosrand"* or *"Bereikbaarheid: NS Station Winsum"*).
- **Stage Reordering**: Support reordering stages via both drag-and-drop and step buttons (▲ / ▼).
- **Viewport Navigation**: Clicking a stage smoothly zooms (`fitBounds`) to that stage; a dedicated `🔍 Toon hele route` button at the top of the stage list instantly restores the camera to the complete multi-day trail.

## Capabilities

### New Capabilities
- `route-stages`: Multi-stage route creation, stage boundary definition and splitting, stage merging, stage deletion with point cleanup, stage reordering, public transit leg classification, per-stage metrics computation, stage-focused map camera navigation, and visual stage differentiation.

### Modified Capabilities
- `route-planner`: Update route planner editor to support stage selection, stage-aware waypoint manipulation, GPX import dialogs (append vs new stage, multi-track split), and passing multi-stage polylines with transit styling to the map viewer.

## Impact

- **Frontend**:
  - `apps/web/src/App.tsx`: Route state management with active stage selection, multi-stage recalculation, stage CRUD & reordering, GPX import modals, and undo/redo history.
  - `apps/web/src/components/MapCanvas.tsx`: Multi-stage GeoJSON rendering with stage color palettes, dashed transit styling, transition badges (`S1`, `F1/S2`), split popup button, and merge popup button.
  - `apps/web/src/components/StageManagerPanel.tsx`: New component in the planner sidebar displaying the stage list, per-stage metrics, drag & drop / button reordering, "+ Nieuwe etappe", "🔍 Toon hele route", title/notes editing, and transport type selector.
  - `apps/web/src/components/GpxImportModal.tsx`: User confirmation modal for choosing between appending to active stage vs creating a new stage, and importing multi-track GPX as separate stages.
  - `apps/web/src/i18n/`: Dutch and English translation strings for all stage management, transit, modal, and badge terms (100% parity).
- **Core Library**:
  - `packages/core/src/types/index.ts`: Extend `HikeStage` with `notes?: string; transportType?: 'foot' | 'bus' | 'train' | 'ferry';`.
  - `packages/core/src/route-editing/stages.ts`: Utilities for stage splitting, merging, reordering, deleting, waypoint extraction per stage, and metric computations.
  - `packages/core/src/gpx/parser.ts` & `serializer.ts`: Multi-track GPX parsing and multi-track export with stage metadata and notes.
- **APIs & Database**:
  - Saved route JSON schema already supports `stages: HikeStage[]`; ensure extended fields (`notes`, `transportType`) are persisted in Cloudflare D1.
