# SC-644 r1 implementer report

## Executive summary
- Verdict: DONE (one open product question, O2 "Start collapsed", implemented as recommended behind one switch).
- dse head `92940547` on base `620d5774` (develop after SC-637; rebased from 941b814f). 3 commits: `29167670` fix, `faabbbd4` tests, `92940547` e2e defaults fix.
- Superproject head `85869486` on base `28ed9439` (origin/main): CHANGELOG commit `17a1b358` + one pointer bump. Nothing pushed.
- jest 12935 passed / 1 skipped with shots cache (new baseline 12914 + 21 new; fresh worktree before shots: 12895 / 2 on the old base) · lifecycle 64/64 (21+16+9+4+7+4+3, all 0 failed)
- e2e `571/593 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs` (baseline 567/591, 24 known-bug: +2 new tests, 2 markers flipped)
- shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24 · tsc and lint clean.
- No CSS touched; no frozen byte moved.

## Design
- `src/framework/livePrefs.ts`: `watchPrefs(prefs, owner, keys, onChange(key, value))` = `prefs.subscribe` over a declared key set, skipping keys the store does not describe (bare test stores, experimental gate hiding `authoringControls`), bound to `owner` so unload drops every subscription.
- `src/framework/pipeline.ts`: after the first `mountPipelineChrome(model)`, `watchPrefs(prefs, view, CHROME_LIVE_PREFS, ...)` rebuilds ONLY the chrome (`mountPipelineChrome(view.currentModel(), key)`), body not re-rendered, wrapped in try/catch (store notifies synchronously inside `prefs.set`, a throw would block the save and other blocks). `CHROME_LIVE_PREFS` = `collapsibleDefault`, `authoringControls`.
- Rebuild keeps the block's live collapsed state (`chromeHandle.isCollapsed()` carried via `carriedCollapsedFor`) instead of re-resolving from prefs (a block collapsed only by "Start collapsed" has no session entry). Applies to every chrome remount, including the view re-rendering itself.
- O1: if the rebuilt block was collapsed and has no one-line bar now (`summaryEl` undefined), the session toggle is cleared (`session.set(blockKey, 'chrome.collapsed', false)`), so ON again leaves it expanded. `mountChrome` already expands a non-collapsible block; `ensureCollapseInvariant` still runs after every mount.
- Rebuild also strips `data-dse-chrome`, `data-dse-chrome-mobile` and the anchor's `dse-chrome-anchor` so a block with no chrome left equals a fresh render. Stale pipeline comment ("a pref flip triggers a rebuild") corrected.
- O2 switch: `START_COLLAPSED_REACHES_OPEN_BLOCKS` (pipeline.ts, `false`) plus `carriedCollapsedFor`. `true` adds `collapseDefault` to the watched keys and re-resolves (not carries) on that key; a reader's own toggle still wins via the session. Verified by mutant M10 that flipping it is observable.
- SC-645 reuse: add its pref key to a declared list and `watchPrefs(...)` with a rebuild of that element's body (the chrome-only rebuild here is the model for "rebuild only what the pref shapes"). SC-645 / 646 / 647 / 651 markers untouched.

## Files changed (dse)
src/framework/livePrefs.ts (new), src/framework/pipeline.ts, test/dom/framework/chromeLivePrefs.test.ts (new, 21 tests), e2e/specs/settings/live-behavioural.e2e.ts, e2e/specs/settings/gate-on.e2e.ts. Superproject: CHANGELOG.md + pointer.

## Tests
- jest `chromeLivePrefs.test.ts` (21): Collapse control off/on on open block; no-chrome-marks for an empty panel; body not re-rendered; O1 (reader-collapsed; author `collapsed: true`); block keys beat pref both ways; one throwing block does not stop others/save; O2 (open block stays expanded, new block collapsed; OFF keeps collapsed; later chrome rebuild keeps state; view self-rebuild keeps state; collapsed bar survives); pencil on chrome element on/off, non-chrome corner pencil on/off, pencil+Collapse interplay; canPersist=false never gets a pencil; `noAuthoringButton` never; unload then flip does nothing/no error; focus untouched; `watchPrefs` key/value, undescribed key skipped, stops on unload.
- e2e: `SET-L01` and `SET-G06` plain (G06 asserts on then off); new `SET-L05` (Collapsible off expands a collapsed bar, on again stays expanded) and `SET-L06` (Start collapsed leaves open bar; reopened note collapsed). No new coverage pairs (416/416).

## Mutants (chromeLivePrefs.test.ts, all restored)
M1 no watch call: 10 red · M2 carry nothing: 2 red · M3 O1 session toggle kept: 1 red · M4 no try/catch: 1 red · M5 stale `data-dse-chrome` kept: 1 red · M6 authoringControls not watched: 4 red · M7 collapsibleDefault not watched: 7 red · M8 subscription not owned by view: 1 red · M9 anchor class kept: 1 red · M10 O2 switch true: 4 red. Two further mutants survived and were removed as redundant code (reason gate on the O1 session clear; explicit `data-dse-collapsed` removal, which `mountChrome`/`ensureCollapseInvariant` already guarantee).

## Drive-by fixes
None beyond the stale comment.

## Follow-ups
- e2e driver race: `dse.setPrefs(x)` runs `saveData(x)` then disables the plugin, whose unload flushes the previous scenario's debounced pref save OVER it, so a scenario starting with `setPrefs({})` right after a settings flip can keep the old pref in memory. SET-L05/L06 work around it with `diskData()` first (`shippedPrefs` in live-behavioural.e2e.ts); the root fix is a `prefsStorage.flush()` before `saveData` in `e2e/driver/dse.ts`.
- Focus: a rebuild while focus is inside the removed panel drops focus to body (not reachable from the settings window; no handling added).
- dse-verify SKILL numbers to update at landing: jest +21, e2e known-bug 22 / `571/593`, SC-644 markers gone (not edited here).

## Evidence artifacts (scratchpad /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r1-impl/)
jest-r.log, e2e-r.log, shots-r.log, freeze-r.log, parity-r.log, lc-r1.log ... lc-r7.log (+ .rc each), mutate.py, mut-M*.log.
