# SC-426 round 1 implement report

## Executive summary
- Verdict: DONE. Roster-cell Stamina edit now repaints the detail row (number, bar, state chip) when it shows the edited instance; Temp Stamina too.
- Branch `sc426-detail-stamina` (dse), head `0d1c0cf`, base origin/develop `f8e050f` (develop had not moved). 3 commits, not pushed.
- tsc (incl. e2e) clean; lint clean, exit 0.
- jest 4769 passed / 1 skipped / 227 of 228 suites (4767 + 2 new tests).
- lifecycle 25/25 (port 9291). e2e `62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`.
- shots 572 PNGs, 0 FAIL. freeze `OK (276/276)`. parity `0 gap(s), 0 undeclared, 24 declared`, exit 0.
- Found while gating: the old known-bug e2e asserted the Steel-hidden detail numeric with `toHaveText`, which reads '' (getText of a visually stood-down control), so it could never go green. Rewritten (see below).

## Commits (dse repo /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements)
- `78debdc` fix(initiative): roster-cell Stamina edit refreshes the detail row (SC-426) — view.ts + jest matrix test.
- `93fb45c` docs(changelog): ... (SC-426) — bullet under "7.0.0 (unreleased ...)" (the repo's Unreleased section), [FIX] style.
- `0d1c0cf` test(e2e): read the detail row's visually stood-down numeric as a property and check its bar (SC-426).

## Files changed
- src/elements/initiative/view.ts
- test/dom/elements/stamina-entry-points-matrix.test.ts
- e2e/specs/initiative/stamina-entry.e2e.ts
- CHANGELOG.md
- docs/superpowers/dse-7.0.0-release-audit.md: NOT changed — it does not list SC-426 or this bug (grep clean).

## The fix and the refresh path reused
- `buildDetailedCreatureRow` stamps the detail container with `data-detail-key=<instanceKey>`.
- New `detailHandlesFor(groupBodyEl, instanceKey)` returns {rowEl, staminaEl, barEl} when the detail row shows that instance, else null.
- In `openCreatureStaminaModal`'s apply callback, when no `rowEl` was passed (grid route): `detail = detailHandlesFor(...)`, then the EXISTING refreshers run on it: `updateStaminaDisplay(detail.staminaEl,...)`, `refreshRowState(detail.rowEl,...)` (winded/dead chip), `refreshRowStamina(barEl ?? detail?.barEl,...)` (bar, incl. temp).
- Deviation from the spec text: the guard compares the DOM stamp, not `group.selectedInstanceKey`. Identical in practice (dblclick is preceded by two clicks that set the selection) but it also covers a fresh group whose detail row defaults to the first instance with `selectedInstanceKey` unset. It is evaluated at apply time, so a row rebuilt while the modal was open is still found. Detail-route callers (rowEl/barEl passed) are unchanged.

## Tests
- jest (matrix test, E12 describe): two `test.failing` -> `test` (suffix "[known bug SC-426]" dropped): readout 10/40, bar 10. New: state chip becomes `winded`/"Winded" at 10/40; Temp Stamina 5 set from the cell shows `40(+5)/40` in the detail readout and `+5` in the bar. The existing non-selected control (dblclick 0-2) was extended: detail bar number stays 40 and chip stays `healthy` as well as the readout. With view.ts reverted to base, 4 of the 5 E12 tests fail (the 5th is the non-selected control, which passes both ways by design).
- e2e `[INIT-STAM-B2]`: `knownBug('SC-426', ...)` -> plain `it(...)` (ID kept, comment rewritten). Assertion changed: the old `toHaveText('50/60')` on `init.detail.stamina` returns '' in real Obsidian because Steel visually stands the numeric down (getText ignores it; the detail-route test passes only because keyboard focus reveals it). Now `toHaveElementProperty('textContent','50/60')` plus the bar number `.dse-init__detail > .dse-init__bar .dse-stamina__ccur` = '50'. Verified in real Obsidian: with view.ts reverted to base it FAILS (Received "60/60"); with the fix it passes (2 isolated runs + the full run).
- No new e2e scenario, so M stayed 72; 61 -> 62 ok, 11 -> 10 known-bug as expected.

## Survey of other entry points (initiative/view.ts)
- Grid dblclick, non-minion creature or captain -> `openCreatureStaminaModal(..., null, null, group)`: THE bug; fixed. (A captain edit that flips the squad bonus already takes the coarse `rebuildAndPersist` path.)
- Grid dblclick, squad minion -> `MinionStaminaPoolModal` -> `rebuildAndPersist` (whole rebuild, SC-417): not stale.
- Detail-row numeric/bar, minion -> same coarse rebuild: fine. Detail-row non-minion: passes row/bar: fine.
- Hero row (`openHeroStamina`): closure has barEl and rowEl: fine; heroes have no grid cell.
- ConditionsModal (line ~2050): reached only from a detail/hero row, rebuilds its own condition row incl. chip: no cell route.
- No other stamina writers in initiative (only model/resolveRefs defaults). Nothing else in this bug class.

## Gate detail / evidence logs (scratch, per-run)
Directory: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc426run/
- tsc.log, tsc-e2e.log, lint.log (rc 0); jest.log -> jest2.log (final: 4769/1 skipped); lifecycle.log (25/25); e2e2.log (final 62/72); shots.log; freeze.log; parity.log; *.rc hold the exit codes (all 0).
- e2e failure bundles from the interim runs: /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements/e2e/.out/20261019-144925-1e2f/INIT-STAM-B2 and .../20261019-145247-80de/INIT-STAM-B2 (pre-fix evidence, Received "60/60").

## Gate-number notes
- The first full jest run (before `npm run shots` had built `visual-harness/dist/obsidian-app.css` in this fresh worktree) read 4768 passed / 2 skipped: `printTwinDeltaAllowedSet.test.ts` `it.skip`s when that cache is absent. After shots, 4769 / 1 skipped. Expect this on any fresh worktree running jest before shots.
- `npm ci` was needed in the new worktree (no node_modules).
- button host-leak now reads `112 kinds x 3 states x dark/light = 672 comparisons` (dse-verify text says 114/684; pre-existing drift, not from this change: no gallery DOM touched).

## Drive-by fixes:
(none)

## Follow-ups:
- dse-verify skill "today" numbers are stale after this lands: e2e `61/72 ... 11 known-bug` -> `62/72 ... 10 known-bug`; owner/dispatcher to refresh at landing (workspace file, not touched).
- Observation, not investigated: in real Obsidian the page holds a second `[data-dse-element="initiative"]` root in the active leaf, outside `.markdown-reading-view`, 0x0 and showing the pre-edit values (60/60) after a write (see `dse-root.html` in the bundle above). The e2e scope selector skips it, so no test is affected. Repro: open initiative note, edit a cell's Stamina, query all initiative roots. May be Obsidian's section re-render / SC-340 adoption leftover; worth a ticket only if it leaks listeners or memory.
- `openCreatureStaminaModal` callback calls `updateStaminaDisplay`/`refreshRowStamina` without `group` (src/elements/initiative/view.ts ~1882 and ~1903); harmless for non-minions (the only callers), left as is for consistency.
