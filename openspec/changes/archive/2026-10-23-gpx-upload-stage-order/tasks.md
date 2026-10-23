## 1. Ordering foundation

- [x] 1.1 Add `apps/web/src/utils/gpxFileOrder.ts` with a stable `sortFilesNaturally` helper using `localeCompare` with `{ numeric: true, sensitivity: 'base' }`, and verify it with a new `tests/unit/gpx-file-order.test.ts` covering `etappe-10/etappe-2/etappe-1`, mixed case, and stable equal names
- [x] 1.2 Add `suggestFileOrder` to the same module, using a greedy nearest-neighbor chain from every start candidate, selecting the lowest total gap, keeping ties stable, and placing files without coordinates last. Verify it with unit tests for the B → A → C chain, ties, and missing coordinates
- [x] 1.3 Add a `singleStage` option to `stitchGpxRoutes` in `packages/core/src/gpx/stitcher.ts` that emits one stage containing all stitched coordinates and recalculated metrics. Verify it with new cases in `tests/unit/gpx-stitching.test.ts`, while existing cases keep passing
- [x] 1.4 Add Dutch and English `gpxModal` keys (`orderHint`, `orderListLabel`, `orderPosition`, `movedAnnouncement`, `fileDetails`, `fileError`, `btnRemoveFile`, `removedAnnouncement`, `btnSuggestOrder`, `orderSuggestedAnnouncement`, `importBlockedByErrors`, `multiFileAppendTitle`, `multiFileAppendSubtitle`, `btnAppendInOrder`) with full key parity, and verify with `npm run test:unit` (`i18n.test.ts`) and `npm run build`

## 2. Pending file model and import flow

- [x] 2.1 In `App.tsx`, replace the parallel `files`/`texts` pending payload with `PendingGpxFile[]`. Pre-parse each file with a per-file `try/catch`, store its distance, track count, start, end, or error, sort naturally, and only then open any multi-file dialog. Verify that the TypeScript build passes and that the initial list is in natural order
- [x] 2.2 Change `handleGpxModalChoice` and `executeGpxProcessing` to consume the ordered `PendingGpxFile[]` returned by the modal. Verify that stage order follows the confirmed order for separate-stage and existing-route new-stage imports, and that a multi-track file's stages stay consecutive
- [x] 2.3 Make `merged-single` pass `singleStage: true`. With an active route, append the merged stage after the existing stages instead of replacing the route. Verify that exactly one new stage is created and existing stages are preserved
- [x] 2.4 Route append-mode uploads with more than one file through the `multi-file-append` dialog, while single-file appends still import directly. Verify that cancelling leaves the route unchanged
- [x] 2.5 Replace the hardcoded `'Etappe 1'` and `` `Etappe ${n}` `` titles in `App.tsx` with `t('planner.stageDefaultTitle', { number })`, and verify that no hardcoded user-facing stage titles remain in `App.tsx`

## 3. Reviewable file list in the import dialog

- [x] 3.1 Extend `GpxImportModal` with a `files: PendingGpxFile[]` prop and local ordered state that resets on open, and make `onChoice` return `(choice, orderedFiles)`. Verify that the TypeScript build passes
- [x] 3.2 Render the ordered list for `multi-file` and `multi-file-append`: drag handle, position number, truncated filename with a full-name `title`, distance and track count or a per-file error, and move-up, move-down, and remove buttons using the `stages.moveUp`/`stages.moveDown` labels. Disable boundary moves and removal of the last file. Verify the list in the running app
- [x] 3.3 Disable the import actions and show `importBlockedByErrors` while any listed file has an error. Verify that removing the broken file re-enables import
- [x] 3.4 Add native HTML5 drag-and-drop reordering, then verify by dragging in a desktop browser
- [x] 3.5 Keep focus on the moved file after a button move, falling back to the other move button at list boundaries, and move focus to a neighbor after removal. Announce moves, removals, and suggested-order changes in a polite live region. Verify with keyboard-only operation
- [x] 3.6 Add the "Suggest order" button using `suggestFileOrder`, and verify that it reorders the list without importing
- [x] 3.7 Add the `multi-file-append` variant with a single "add in this order" action that returns `append-active`, and verify its title, subtitle, and result
- [x] 3.8 Add Escape-to-close, a Tab focus trap, initial focus, and focus restoration to an explicit trigger element in `GpxImportModal`, following the `ConfirmationModal` approach. Have `App` pass the upload button or drop zone as the trigger, and verify with keyboard-only operation
- [x] 3.9 Add styles in `apps/web/src/index.css` for the ordered list, including a scrollable maximum height, ellipsis truncation, error state, drag-over indicator, and mobile layout. Verify on desktop and mobile viewports

## 4. Specs, tests, and documentation

- [x] 4.1 Ensure the `route-stages` delta spec exists in this change, covering ordered multi-file uploads to an active route, merged imports appending instead of replacing, multi-file append ordering, and import-dialog keyboard accessibility. Verify with `openspec validate gpx-upload-stage-order --strict`
- [x] 4.2 Update the multi-file E2E test in `tests/e2e/e2e/route-library.spec.ts` for natural initial order. Add E2E scenarios for move-button reordering with focus retention, boundary-disabled buttons, file details, removal, an unreadable file blocking import, suggested order, merged single-stage result, existing-route ordering and merge-append, append-mode ordering, cancel, Escape with focus restoration, and English labels. Verify with `npm run test:e2e`
- [x] 4.3 Add one desktop-only drag-reordering E2E scenario using Playwright `dragTo`, and verify that it passes on the desktop project
- [x] 4.4 Update `docs/route-stages-and-transit.md` section 2.3 and the GPX import notes in `docs/product-vision-and-techstack.md` to cover ordering, suggested order, per-file errors, and merge-append behavior. Verify that the docs match the implemented behavior
- [x] 4.5 Run `npm run test:unit`, `npm run build`, and `npm run test:e2e`, and verify that all pass with no hardcoded user-facing text in touched components

## 5. Save without surface analysis

- [x] 5.1 Remove the automatic server-side surface analysis from `POST /api/routes` and `PUT /api/routes/:id`: persist a provided `surfaceBreakdown`, otherwise store none, and clear it on geometry updates without one. Make `analyzeRouteSurface` tolerate stages without coordinates. Add the `surface-analysis` delta spec, update the docs, and verify that saving without an analysis succeeds immediately
