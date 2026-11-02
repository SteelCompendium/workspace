# SC-537 r2 implementation report (Option A, editor-driven Live Preview reconcile)

## Executive summary
1. Verdict: DONE. Option A implemented as ruled; no click-shield, `livePreviewScrollHold.ts` or callout chrome CSS touched.
2. Plugin HEAD `4e3de39c` on branch `sc537-lp-callout-twins`, rebased onto origin/develop `f81a277f` (SC-533; one conflict in `obsidian-lifecycle.mjs`, both G-S54 and G-S57 kept). Superproject `97636536` (CHANGELOG only, no pointer bump) on `367015f3`; origin/main has since moved to `e0f5c76a` (its CHANGELOG change is a separate hunk at the top of `## Unreleased`).
3. Red to green: jest 7 new cases all red on 458abe3 source (no listener), 24/24 green on HEAD; G-S57 FAILS on a 458abe3 bundle with the §1 numbers ([7,5]; names [Twin, Twin]; [7,5,5]; [7,3,5,3]; nested [7,5]) and PASSES on HEAD.
4. Mutants: (1) no LP section in `reusedBlockBody` 4 red; (2) listener not scoped to the editor 5 red; (3) no `lastWriteLine` skip 2 red (1 new, 1 SC-481). Tree clean after each.
5. Gates on `4e3de39c`: tsc/tsc -p e2e/lint clean; jest 6215 passed / 1 skipped / 249 of 250 (6208 + 7); lifecycle 44/44 as 22 + 22 (250 s, 532 s); e2e 124/124, 0 known-bug, 87/87; shots 592, 0 FAIL, button 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280 (no rebaseline); parity 0 gaps / 0 undeclared / 24 declared.
6. Deviations from the report's design: `reconcile` takes the editor VIEW (not just its DOM element) because it needs `posAtDOM` and the update's document; the editor pass judges Live Preview CALLOUT widgets only (plain LP widgets stay processor-time); processor-time calls are unchanged (the LP section is used only when an editor update asks).
7. One existing test touched: `livePreviewScrollHold.test.ts` asserted `registerEditorExtension` called once; now 2 (SC-522 overlap, trivial merge).

## Changes (plugin `draw-steel-elements`)
- `src/framework/host/livePreviewReconcile.ts` (new): `livePreviewReconcileExtension(remounter)` = `EditorView.updateListener`; on `docChanged`, path from `editorInfoField`, `void remounter.reconcile(path, update.view)`.
- `src/framework/host/remountReused.ts`: `reconcile(sourcePath, within?: CmEditorView)`: with `within`, only entries whose root is inside `within.dom` are judged, with a lazy `LivePreviewScope` (the update's `state.doc.toString()`, read once, only if a callout widget is judged; split once through the existing `linesOf` cache). `remountVacated` unchanged.
- `src/framework/host/ReadingModeBlockHost.ts`: `fenceOnElement(..., sectionOf?)` (default still `ctx.getSectionInfo(el)`); `reusedBlockBody(linesOf, scope?)`: with a scope, non-callout widgets return null, `getSectionInfo` is tried first and the editor's callout section (`livePreviewCalloutSection(scope)`, widget must be inside `scope.view.dom`) is used when it is null; the `lastWriteLine` skip and ordinal rule untouched. `calloutWindow()` factored out of `livePreviewCalloutSection` (same behaviour for the workspace-lookup path). `CmEditorView` exported.
- `src/framework/registerFrameworkElements.ts`: one import and one `plugin.registerEditorExtension(livePreviewReconcileExtension(remounter))` line, placed after the `remounter` line, apart from the `lpHold` lines.
- Tests: `test/dom/framework/twin-reuse.test.ts` +7 cases (positive upper click; form Save then lower click; two blocks per callout by ordinal; element on `lastWriteLine`; `docChanged:false` / other editor; plain LP widget not judged; listener registered). Mock: `editorInfoField` placeholder in `test/mocks/obsidian-core.ts` (also serves the harness shim).
- Lifecycle `G-S57` + fixtures `Lifecycle/twin-callouts-3.md`, `-xy.md`, `-nested.md` (`QUOTED_XY`, `QUOTED_NESTED`). Real mouse clicks, cards read after parking the cursor. Phases: (a) 2 callouts upper then lower with anti-vacuity (tagged upper widget sits in the lower slot; a `reused-by-twin` release is recorded via a wrapper on `viewRegistry.release`, removed in `finally`); (b) form Save upper then lower click (names [Edited, Twin]); (c) 3 callouts; (d) two blocks per callout; (e) nested; per phase the note text outside the quotes equals the fixture.
- `.repo-docs/architecture.md`: new `host/livePreviewReconcile.ts` row, `remountReused.ts` row and SC-481 paragraph updated.
- Superproject `CHANGELOG.md`: SC-481 parenthetical removed; SC-537 bullet added under `## Unreleased` (mentions the erased form edit).

## Red to green
- Jest on 458abe3 source: 7 of 7 new cases red (`no editor update listener was registered`): `sc537-r2-red-jest-on-458abe3.log`. (The red cases fail at the first listener call, so they show the missing hook, not each assertion; the mutants below show each assertion bites.)
- G-S57 on a 458abe3 bundle (built from `git archive 458abe3`, run with the HEAD harness): FAIL, `sc537-r2-red-lifecycle-gs57-on-458abe3.log`: (a) cards [6,6] vs disk [6,5], no `reused-by-twin` release (only `render-child-unload`), lower click disk [7,5]; (b) names [Twin, Twin], disk [6,5]; (c) [7,5,5] then [7,5,6]; (d) [7,3,5,3] then [7,3,5,4]; (e) [6,5] then [7,5].
- G-S57 on HEAD (pre-rebase and post-rebase): ok, `sc537-r2-green-lifecycle-gs57-on-head.log`; cards equal disk in every step: (a) [6,5] [6,6]; (b) names [Edited, Twin] [5,5] then [5,6]; (c) [6,5,5] [6,6,5] [6,6,6]; (d) [6,3,5,3] [6,3,6,3] [6,3,6,4]; (e) [6,5] [6,6].

## Mutants (jest, `twin-reuse.test.ts`)
- 1: `reusedBlockBody` without the LP section: 4 red (upper click, form Save, two blocks, docChanged/other-editor). Log `sc537-r2-mut-1-jest.log`.
- 2: listener calls `reconcile(path)` without the editor: 5 red (the four above + plain LP widget, which is then judged at its own section). `sc537-r2-mut-2-jest.log`.
- 3: no `lastWriteLine` skip: 2 red (new "still on lastWriteLine" case + the SC-481 r4 two-docId case). `sc537-r2-mut-3-jest.log`.

## Gates (final HEAD `4e3de39c`; logs `sc537-r2-gate-*.log`, pre-rebase runs on `52e0c7e9`-era tree kept as `sc537-r2-gate-prerebase-*.log`)
- tsc, `tsc -p e2e`, lint: rc 0, no output.
- jest: 6215 passed / 1 skipped / 249 of 250 suites (6208 base on f81a277 + 7). (Pre-rebase, fresh worktree before the shots cache: 6207 / 2 skipped.)
- lifecycle: half 1 = the first 21 + G-S57 = 22/22 ok in 250 s; half 2 = G-S9b ... G-S53, G-S54 = 22/22 ok in 532 s. Total 44/44, 0 failed. Split used: 22 + 22. Half 2 is near the 600 s limit; moving G-S53 (and G-S54) into half 1 would balance it (not done; the split is the dispatcher's list).
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, run twice (pre- and post-rebase), CHR-F02 did not recur.
- shots: 592 PNGs, rc 0, 0 FAIL, button 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; ran in the background on its own log, rc line read from it (post-rebase). 
- freeze `freeze OK (280/280 ...)`, no rebaseline (no CSS change). parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Drive-by fixes
- None.

## Follow-ups
- Click on a DSE control in an LP callout opens it as source (r1 §2.5): SC-540, untouched.
- `test/dom/framework/livePreviewScrollHold.test.ts:545` now expects 2 `registerEditorExtension` calls (was 1). SC-522 edits that area; trivial textual merge, but its rebase should keep the count at the number of registrations.
- Lifecycle half balance: 250 s vs 532 s after SC-533 + SC-537; consider moving two scenarios from the second to the first half.
- Superproject branch is on `367015f3`; origin/main is `e0f5c76a`. Not rebased (submodule pointer left unbumped by instruction); CHANGELOG hunks do not overlap.
- Per-update cost: with a DSE card in the note, each doc-changing update runs one pass over live entries (path + `dom.contains`), and for a callout widget in that editor reads `doc.toString()` once and splits it once (cached). No measurement of large notes was taken.

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/`)
- Report: `sc537-r2-impl-report.md`
- Screenshot (LP, two callouts, upper then lower click, cards [6,6]): `sc537-r2-lp-callouts-upper-then-lower-click-cards-6-6.png`
- Red logs: `sc537-r2-red-jest-on-458abe3.log`, `sc537-r2-red-lifecycle-gs57-on-458abe3.log`; green: `sc537-r2-green-lifecycle-gs57-on-head.log`
- Mutants: `sc537-r2-mut-1-jest.log`, `-2-`, `-3-`
- Gates: `sc537-r2-gate-tsc-lint.log`, `-jest.log`, `-lifecycle-1.log`, `-lifecycle-2.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`; pre-rebase: `sc537-r2-gate-prerebase-*.log`
- Scratch (scripts, base458 bundle source): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r2-impl-b1/`
