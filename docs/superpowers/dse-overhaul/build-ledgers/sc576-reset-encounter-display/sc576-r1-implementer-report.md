# SC-576 r1 implementer report

**Executive summary**
- DONE. Plugin branch `sc576-reset-encounter-display`, final sha `2b1525ba` (2 commits on top of `origin/develop` = `97a9c93b`; rebased there mid-round per the owner's message, clean, no conflicts, package.json unchanged). All gates below were run on the rebased head.
- tsc (incl. `-p e2e`) clean; lint clean.
- jest (shots CSS cache present): 7050 passed / 1 skipped / 259 of 261 suites, 1 failed = `twin-reuse` SC-547 5 s timeout (SC-568 load); alone, `twin-reuse` + `initiative-default-keys` = 78/78 passed. Effective 7051 passed. (An earlier full run on the fresh worktree also timed out in `initiative-default-keys`; passes alone.)
- lifecycle: 52/52 (21 + 16 + 9 + 4 + 2, five `--only` parts, private `DSE_CAMERA_TMP` each, run back to back).
- e2e: `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`. INIT-X05 ok, INIT-X06 ok, INIT-X07 still known-bug SC-575.
- shots 592, 0 FAIL, `button host-leak OK (163 button kinds ...)`, `capture clip OK (147 ...)`. freeze `OK (280/280 ...)`. parity `0 gap(s), 0 undeclared warning(s), 24 declared`.
- Markers removed: jsdom `[X05]` `test.failing` -> plain test; e2e `knownBug('SC-576')` on INIT-X05 and INIT-X06 -> plain `it`; stale comment deleted. No SC-575/SC-588/SC-590 marker flipped.

## Root cause and fix choice
`resetEncounter` leaves the model un-normalised (instances and hero `current_stamina` dropped; `parse()` re-derives them on load). The old path did `update(this.model)` then `persist()`, and the view paints `?? 0` / iterates `creature.instances?.forEach`, so the screen was empty/Dying while the note was right.
Fix (view-level, `InitiativeView.rebuildFromWrittenReset`, used only by the Reset encounter confirm): serialize the reset model, `persist()` + `flushPendingWrite()` (so serialize runs synchronously on the reset model and the write is unchanged), then rebuild from `parse(parseYaml(yaml))` + `resolveInitiativeRefs(..., cx.refs)` (the exact pipeline load stages) via `update(fresh)`. The screen is literally what a reload shows, and later writes serialize it like any freshly loaded model (SC-485 absent-key records are the parser's own). Chosen over in-place re-normalising because that would re-record SC-485 "absent" snapshots wrongly (authored keys, statblock-merged fields) and could change bytes. On a re-parse failure it logs and keeps the reset model (old behaviour).

## Files changed (plugin `draw-steel-elements`)
- `src/elements/initiative/view.ts` (+ header comment fix)
- `test/dom/elements/initiative-matrix.test.ts`
- `e2e/specs/initiative/reset-encounter.e2e.ts`

## Written bytes unchanged: proof
- `[X01]` (pins the reset write, one write) passes unchanged.
- Scratch comparison (not committed, file deleted): three fixtures (a rich live encounter with title, round, hero conditions/actions/temp stamina, authored instances with conditions, a captained squad with pool/trio/actions, Malice log; a two-squad group with per-creature pools; a bare group), Reset -> Yes via the real pipeline. `replaceSource` bytes with the old `view.ts` (stashed) and the new one were byte-identical (`diff` exit 0), exactly 1 write each. Outputs: `.../sc576-impl-r1-k7q2xz/bytes-old.json`, `bytes-new.json`.
- New `[X05]` also asserts the written hero is `{name, max_stamina}` and `instances` absent.

## Tests added / converted
- `[X05]` (converted from `test.failing`, moved into the `[X]` describe, now also: 3 roster cells, detail `60/60`, heroes `30/30` and `40/40` incl. a hero authored at -4, no `data-state="dying"/"dead"` on stamina controls or state chips, written bytes, and a click on a rebuilt cell writes `selectedInstanceKey: 0-2`).
- `[X05]` minion squad: 3 cells, detail `12/12 (4)` (pool back at full).
- e2e INIT-X05 / INIT-X06: plain `it`.
- Net jest: +1 test (2 added, 1 failing-marker converted).

## Other `rebuildAndPersist` callers (same bug class?)
Reset Round, Advance round, Malice quick-add, captain promote/relieve, minion pool modal (x2), captain-bonus transition: all mutate with concrete values; none set `undefined` / drop instances. Not the same bug class; left as is.

Drive-by fixes: none (the header "UPDATE STRATEGY" comment in `view.ts` was updated because the fix made it stale; part of the change, not a separate fix).

Follow-ups:
- Observed while proving bytes: Reset keeps a minion squad's `actions` (shared action pips) in the written note. That is SC-575 (out of scope, `[X07]`/INIT-X07 marker still failing as expected).
- Process note: `npm ci` was needed in the fresh worktree (no node_modules).
- No real-Obsidian screenshot of the after-Reset tracker exists: passing e2e tests keep no `.out` bundle. INIT-X05/X06 assertions read the real DOM in real Obsidian instead.

## Deviations
- Lifecycle parts were run sequentially from one driver script (same five `--only` lists, same order, G-S56 last in part 4) rather than five separate Bash calls; the harness auto-backgrounds calls after 180 s anyway. I polled each part's own rc file under a private per-run dir.
- A first pass of lifecycle part 1+2 and jest on the old base (`32441332`) was discarded after the rebase; part 3 was killed by literal PID; everything reported above is from the rebased head.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-impl-r1-k7q2xz/`)
- Rebased-head gates in `rb/`: `tsc.log`, `lint.log`, `static.rc`, `jest.log`, `jest-rerun.log`, `jest2.log`, `lc1.log`..`lc5.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`.
- Red/green TDD: `jest-red.log`, `jest-green.log`. Bytes: `bytes-old.json`, `bytes-new.json`.
- e2e output bundle: `/home/scott/code/steelCompendium/worktrees/sc576-reset-encounter-display/draw-steel-elements/e2e/.out/20261111-003608-c659/` (known-bug scenarios only, no X05/X06).
