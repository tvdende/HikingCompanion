## Why

When users upload several GPX files at once (for example three day-stages of a
multi-day hike), the files are imported in whatever order the browser hands
them over. That order is often wrong (`etappe-10` before `etappe-2`, or the
order in which files were clicked), so stages end up shuffled and must be
fixed afterwards by hand. Users need to review and choose the stage order up
front, as part of the upload, and should see problems with individual files
before anything is imported.

## What Changes

- The multi-file GPX import dialog shows the selected files as an ordered
  list, before the user picks an import option.
- The list starts in natural filename order (`etappe-2` before `etappe-10`)
  instead of the browser-provided order.
- Users can reorder files both by dragging and with accessible move-up /
  move-down buttons (keyboard and touch friendly). Keyboard focus stays on the
  moved file.
- A "Suggest order" button sorts the files by how well their endpoints connect
  (end of one file closest to start of the next).
- Each file is parsed when the dialog opens. The list shows its distance and
  track count, or a per-file error for files that cannot be read. Import is
  blocked while a broken file is in the list.
- Users can remove a file from the list (at least one file always remains).
- The confirmed order determines:
  - the stage order when importing each file as separate stages (a file with
    multiple tracks contributes its stages as one consecutive block);
  - the concatenation order when merging all files into a single stage;
  - the order of the new stages when adding files to an existing route.
- Merging multiple files into a single stage now really produces one stage.
  Today it still produces one stage per file.
- **BREAKING (behavior)**: with an active route, "merge into a single stage"
  appends the merged stage after the existing stages instead of silently
  replacing the active route.
- Uploading multiple files through "append to active route" now also shows the
  ordering step, instead of importing in browser order without a dialog.
- The GPX import dialog becomes fully keyboard accessible: it closes on Escape,
  keeps focus inside the dialog, and restores focus to the triggering control.
- Hardcoded Dutch stage titles in the planner import flow are replaced by
  translated text.
- Single-file uploads and single files with multiple track segments keep
  their current choices (no ordering step).
- All new UI text is available in Dutch and English.
- Saving a route no longer waits for, or fails on, an automatic server-side
  surface analysis. Routes without a surface breakdown are saved immediately;
  the breakdown is calculated on request with "Analyseer ondergrond".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `gpx-engine`: The "Multi-GPX Upload and Track Stitching" requirement changes
  so that the user-confirmed file order (initially natural filename order)
  determines stage and stitching order. It also adds the reviewable file
  list (per-file details and errors, removal, suggested order), and requires
  a merged multi-file import to yield a single stage.
- `route-stages`: The "GPX Import Multi-Stage & Append Handling" requirement
  changes so that multi-file uploads to an active route include the ordering
  step, merging with an active route appends instead of replacing, and the
  import dialog meets keyboard accessibility expectations.
- `surface-analysis`: The "Automatic Surface Analysis on Route Save"
  requirement changes so that saving never waits for an external surface
  analysis; a provided breakdown is persisted, otherwise none is stored.

## Impact

- `apps/web/src/components/GpxImportModal.tsx`: ordered file list with drag,
  move, remove, and suggest-order controls; per-file details and errors; new
  append-ordering mode; Escape, focus trap, and focus restoration.
- `apps/web/src/App.tsx`: pre-parsing pending files, initial natural sort,
  applying the confirmed order, routing multi-file append uploads through the
  dialog, appending merged imports to an active route, and translated default
  stage titles.
- `apps/web/src/utils/`: pure helpers for natural sorting and endpoint-based
  order suggestion.
- `packages/core/src/gpx/stitcher.ts`: option to stitch multiple routes into a
  single stage.
- `apps/web/src/i18n/locales/nl.ts` and `en.ts`: new `gpxModal` keys.
- `apps/web/src/index.css`: styles for the reorderable list.
- `tests/unit` and `tests/e2e`: new and updated scenarios.
- `docs/`: GPX import documentation.
- `apps/api/src/routes/routes.ts`: save and update no longer call the
  surface analysis; `apps/api/src/routes/surface.ts` tolerates stages without
  coordinates.
- No database changes.
