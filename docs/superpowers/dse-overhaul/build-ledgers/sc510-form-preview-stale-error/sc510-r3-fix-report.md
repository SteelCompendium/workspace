# SC-510 r3 fix report (implementer A)

## Executive summary
- STATUS: DONE. Rebased, LOW-1 and FU-2 folded, full battery green on the rebased tip.
- Rebased: dse onto origin/develop **f89f69f** (0 conflicts; be35c6a -> 51f24b6, 47892bb -> 550827d); superproject onto origin/main **27f4c8c** (dca5433 -> bc5c1d7, `--autostash` for the unbumped pointer). No package.json/lockfile change, no `npm ci`.
- New dse commits: 7bab707 (red), 8cda8a2 (pure-move extraction), 2d01bd8 (fix). Superproject: 088bbc9 (CHANGELOG wording). dse tip **2d01bd8**, superproject tip **088bbc9**, pointer still unbumped.
- Red on the rebased r1 FormModal (be35c6a logic): 2 failed / 19 passed of 21 (feature + statblock "same error card as the real card"). Green on 2d01bd8: 21/21. Mutant M2 (host containerEl = previewEl) now FAILS 2 tests; mutant "stale rejection draws without the identity check" FAILS 2 tests.
- Gates on 2d01bd8: tsc/lint clean; jest 6099 passed / 1 skipped / 246 of 247; lifecycle 38/38; e2e 123/123 ok, 0 failed, 0 known-bug, 87/87; shots 592, 0 FAIL, button host-leak 114/684; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Decisions: pure-move extraction to `src/framework/errorCard.ts` (no import cycle); Read-only badge removed while the error card is up.

## What changed
- LOW-1: the test's `createView` wrapper now records `cx.host.containerEl` and the root passed to `mount`; a new test asserts they are the same `.dse-form__preview-slot`, unique per render, the last is a direct child of `.dse-form__preview`, earlier ones are detached, the box has exactly 1 child. Mutant M2 fails it (feature + statblock).
- FU-2: `view.mount(slot, model).catch((error) => { if (this.previewSlot !== slot) return; renderErrorCard(slot, this.def, error); this.previewEl?.removeAttribute('data-dse-readonly'); })`. `previewSlot` (new private field) is the slot on show; it is reset to null by every render's `empty()`. A superseded slot's late rejection returns without drawing anything.
- Tests (feature `# only a comment`, statblock `features: {a: 1}`): the preview's `.dse-error-card` text equals the real card's text for the same `@Bad.md` body (real card rendered through the pipeline in the same test); box has 1 child; no badge; 0 unhandled rejections (jest-circus fails on any). Stale case: `@Bad.md` typed, then `@Ref.md`; `@Ref.md`'s lookup released first, then the `@Bad.md` one (its mount rejects late), then the rest: the Ref preview and its badge are untouched throughout.
- CHANGELOG bullet reworded: the preview "shows the same 'failed to render' message the block itself would show" (was "stays blank").

## Extraction vs import
Pure move. `renderErrorCard`, `ElementStageError`, `ErrorStage` and the private `isValidationResult` moved verbatim (docs included) from `src/framework/pipeline.ts` to the new `src/framework/errorCard.ts`; pipeline imports them and re-exports `ElementStageError`, `renderErrorCard` and type `ErrorStage`, so `RefUnwrapView` and the pipeline tests import from `@/framework/pipeline` unchanged. The only other edit in pipeline.ts is dropping the now-unused `ValidationResult` type import (lint warned). FormModal imports `@/framework/errorCard`, so there is no pipeline <-> FormModal cycle. Separate commit 8cda8a2; tsc, lint and the framework/authoring/refUnwrapView suites were green on it apart from the 2 expected red tests.

## Badge decision
Removed while the current slot shows the error card. Reason: that preview is an error, not a rendering of the block; the SC-493 r2 rule is "badge only while a block preview is on show" (the badge, absolutely positioned top-right of the box, would sit over the card text once the card gives the box height). The next render re-sets it (valid mount path). Caveat for the owner: the error cards that RefUnwrapView draws itself for a lookup failure ("Reference file ... not found", "Failed to parse YAML ...") still show with the badge, unchanged from r1 and not touched here (element code, and the badge is on show for a successful mount of the wrapper). I did not look at the pixels in real Obsidian this round.

## Diff stat (dse f89f69f..2d01bd8)
src/authoring/FormModal.ts +23/-?; src/framework/errorCard.ts +75 (new); src/framework/pipeline.ts -75/+~7; test/dom/authoring/formModalStalePreview.test.ts +340 (new in branch). Total 4 files, 442 insertions, 71 deletions. Superproject: CHANGELOG.md +7 over origin/main.

## Gate logs (ledger dir, `sc510-r3-*.log`)
tsc, lint, jest, lifecycle, e2e, shots, freeze, parity, red-jest, mutant-M2-containerEl, mutant-stale-rejection. jest was run after the earlier shots had cached `visual-harness/dist/obsidian-app.css` (1 skipped), 6078 + 21 = 6099. Shots exceeded the 600 s tool timeout, was backgrounded by the harness, and I waited on its PID with `tail --pid`; rc 0.

Drive-by fixes: dropped the unused `ValidationResult` import in pipeline.ts (consequence of the move, lint-flagged).

Follow-ups: none new. SC-525 (the "Reference nesting too deep" case) untouched, `RefUnwrapView.ts` and `view.ts` untouched.
