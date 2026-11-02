# SC-481 r2 implementation report

## Executive summary
1. Verdict DONE_WITH_CONCERNS (concerns: shots needed a background run; one e2e flake; see below). Option 1 implemented as specified; Option 2 not needed.
2. Plugin HEAD `d250e97` on branch `sc481-twin-block-vanish`, rebased onto origin/develop `4deb8cf` (was cut at 9be397e, rebased through 4f73043). Superproject `f390b80f` (CHANGELOG only; submodule pointer NOT bumped).
3. Red to green: jest twin-reuse suite 6 of 8 cases red on 9be397e (commit b625438 equivalent), 8/8 green on HEAD. Lifecycle G-S53 FAILS on a 9be397e bundle (every phase, with the r1 numbers) and PASSES on HEAD.
4. Gates on final HEAD: tsc, tsc -p e2e, lint clean; jest 6161 passed / 1 skipped / 249 of 250 suites (6153 + 8 new, +1 suite); lifecycle 42/42 (21 + 21); e2e 124/124, 0 known-bug, 87/87 pairs; shots 592, 0 FAIL, button host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
5. Shots, freeze and parity were measured on 4f73043 + my commits. The later 4deb8cf commit touches only `obsidian-lifecycle.mjs` and `e2e/driver/recorders.ts`, so those three were not rerun after the last rebase. tsc/lint/jest/lifecycle/e2e were rerun on the final HEAD.
6. Mutations (a), (b), guard-line each caught by jest and by G-S53 (details below).

## What changed (plugin repo, `draw-steel-elements`)
- `src/framework/host/remountReused.ts` (new, `ReusedElementRemounter`):
  - `remountVacated(prevEl, prevCtx, alias)` (step a): after adoption, if `prevCtx.getSectionInfo(prevEl)` still resolves, empty `prevEl` and draw a fresh view from that section's fence body.
  - `reconcile(sourcePath)` (step b): for every live registry entry of the note, `host.reusedBlockBody()`; if non-null, `registry.release(entry, 'reused-by-twin')`, empty the element, draw a fresh view from the body.
- `ReadingModeBlockHost.ts`: `lastWriteLineStart` (set at the splice), `remountTarget()`, read-only `reusedBlockBody(linesOf)`.
- `viewRegistry.ts` claim guard: `winnerLine = lastWriteLineStart ?? live read ?? cached line`.
- `registerFrameworkElements.ts`: runs (a) after a successful adoption and (b) on every processor call (adopted and fresh paths); awaits them with the main render.
- Tests: `test/dom/framework/twin-reuse.test.ts` (new, 8 cases); `view-adoption.test.ts` one line (see Deviations).
- Lifecycle `G-S53` + 3 fixtures (`Lifecycle/twin-pair.md`, `twin-triplets.md`, `twin-montage.md`); `.repo-docs/architecture.md` rows.
- Superproject: `CHANGELOG.md` bullet under `## Unreleased`.

## Deviations from the brief / report §3, with reasons
1. `reconcile` is scoped by `sourcePath`, not `(docId, sourcePath)`. In Live Preview every code-block widget gets `docId: St(16)` (a fresh random id per widget, app.js 1.15.0), so the writer's widget never shares a docId with the new widget whose processor call this is. With docId scoping the Live Preview phase of G-S53 stayed red (cards [6,6] vs disk [6,5]). Each view is judged against its own ctx, so another pane or embed of the same note is judged by its own renderer state.
2. `reusedBlockBody` also skips an element still sitting on the line this host's last write landed at. Reason: `knownBody` is set inside the write, ahead of the section text, so a processor call for another block between a write and its rebuild would otherwise read as "reused" (in-flight write false positive). A reused element is always at the twin's (different) line.
3. `test/dom/framework/view-adoption.test.ts`: one existing test's fake context never reports a discarded section as gone (`makeFakeContext.getSectionInfo` ignores the element), so after adoption the old element looked like it was still in use and was remounted (`registry.size` 2). Added `ctx1.getSectionInfo = () => null` (real Obsidian resolves nothing for a replaced section). No behavior assertion changed.
4. Shots could not run inside one 600 s foreground call: two foreground attempts were killed at 595 s / 599 s (logs kept as `-run1-killed-at-595s` / `-run2-killed-at-599s`), because another agent's shots run (sc520) was loading the host at the same time. The final shots run was a single `run_in_background` call, waited on by its own PID. Everything else was a foreground call.

## Red to green proof
- Jest on 9be397e (commit b625438, red): 6 failed / 2 passed of 8. The 2 passing are the intended guards (different bodies untouched; callout window skipped).
- Jest on HEAD: 8/8.
- G-S53 on a 9be397e bundle (built from `git archive` into the scratch `base-src`, `DSE_LIFECYCLE_BUNDLE`), log `sc481-r2-gate-lifecycle-*` is HEAD; base-fail log is in the scratch dir (`lc-gs53-base2.log`). Base numbers match r1: 2 twins upper click cards [6,6] vs disk [6,5], collisions +1, adopted 0; lower click disk [7,5], 1 card for 2 blocks; 3 twins 2 cards for 3, middle click disk [6,5,6]; montage [2,2] vs [2,1] then [3,1]; adoption off [6,6] vs [6,5] then [7,5]; form Save upper then lower: names ["Twin","Twin"], disk [6,5], 1 card; Live Preview [6,6] vs [6,5] then [7,5]. Form Save phase also run alone on base: fails the same way.
- G-S53 on HEAD: ok. 2 twins [6,5] then [6,6]; 3 twins [6,5,5] / [6,6,5] / [6,6,6] and middle-first [5,6,5] / [5,6,6]; montage [2,1] then [2,2]; adoption off [6,5] / [6,6]; form Save upper cards ["Edited=5","Twin=5"], then lower [5,6] names [Edited, Twin]; Live Preview [6,5] / [6,6]. Every first click: claims +1, collisions +0 (adoption on). Whole note equals fixture plus intended changes (sorted-line block signatures + outside-text integrity); 0 Notices, 0 page errors.

## Integrity probes (real Obsidian 1.15.0, HEAD; `int-head/p481-int.json`; scratch harness, nothing committed)
- Outside the blocks (above, between, below): identical to the fixture after upper, lower, upper clicks (outside text length 52 chars, 3/3 identical, block count 2 each time, TOP / MID / BOTTOM present).
- Different-body blocks (`Twin`/`Other`): cards 2/2, disk [6,5] then [6,6], 0 extra `pipeline.run` calls (counter wrapped in-page), tagged roots of both cards kept, claims +2, collisions +0, releases 0. For comparison, identical twins: upper click draws exactly 1 view (the twin remount), claims +1, collisions +0. On base the twin note read cards [6,6] / disk [6,5].
- Hand edit to the upper twin (5 to 9 on disk), then click lower: cards [9,6] / disk [9,6]; then click upper: [10,6]. Hand edit making them twins again ([6,6]), upper click [7,6], lower click [7,7]. Integrity ok.
- Deleting one twin then clicking the other: upper deleted, 1 card Twin=5, click gives [6]; lower deleted, 1 card Twin=5, click gives [6]. Right block each time.
- SC-518 keyboard Save on the upper twin: G-S50 phase 3b green in both lifecycle halves (focus in the edited upper card only, pencil with ring, note is the fixture with only the name changed).
- Scroll (tall note, 40 paragraphs above, 80 below, cards at 40% of the pane): scrollTop 1270 before and after, min 1270 / max 1270 over 151 frames, card tops [488, 625] before and after, for the upper click and the lower click. Base: same hold (scrollTop 1270) but wrong cards. G-S8, G-S15, G-S42 green.

## Mutation checks (each reverted afterwards; `git status` clean after)
- (a) `remountVacated` disabled: jest 3 red (2 twins upper, 3 twins upper, 3 twins middle); G-S53 FAIL (2 twins: 1 card for 2 blocks, 3 twins missing cards, lower click writes wrong block).
- (b) `reconcile` disabled: jest 2 red (adoption off, form Save); G-S53 FAIL in adoption off, form Save and Live Preview phases (Reading view adoption-on phases stay green, as expected).
- Guard-line change reverted (live read of the winner's line): jest 3 red (guard-line case, 2 twins upper, 3 twins middle); G-S53 FAIL (collisions +1, adopted 0 in 2 twins, 3 twins middle, montage).

## Gate details
Logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/`:
- tsc, tsc -p e2e, lint: all rc=0 (final HEAD).
- jest: first run after the rebase on a fresh worktree read 6160 passed / 2 skipped (expected until shots cached the app.css); final run after shots 6161 / 1 skipped / 249 of 250 suites. 6153 + 8.
- lifecycle halves 21/21 + 21/21 on final HEAD (G-S50, G-S8, G-S15, G-S42, G-S1..G-S6i, G-S7a/b green).
- e2e: final HEAD 124/124. On the 4f73043 rebase, run 1 read 123/124 (CHR-F02 chrome.collapse not displayed after 8000 ms, in `stamina-bar/chrome-focus.e2e.ts`, no counters/twins involved); the immediate rerun read 124/124. Both logs kept. Treated as a load flake (load average 6.5 at the time), not in the known list (CHR-L01 / SC-529 is the known one).
- shots (4f73043 + mine): 592 PNGs, rc=0, 0 FAIL; button 157 kinds / 942, 34-record boundary; modal 228; input 15/176; checkbox 7/116; prose 106 [212].
- freeze 280/280; parity 0 gap(s), 0 undeclared, 24 declared.

## Drive-by fixes
None.

## Follow-ups
- e2e CHR-F02 (`chrome.collapse` not displayed within 8000 ms) flaked once under load; passed on rerun. Worth a ticket if it recurs.
- Shots now takes more than 600 s under load (with the SC-527 sweeps), which no longer fits the "one foreground call" rule in the gate skill. The dse-verify skill text and brief template should say to run it in the background and wait on its PID.
- SC-518's `obsidian-lifecycle.mjs` comment "old root/pencil stay in the document (inside the twin)" for `mode === 'twin'` (G-S50) is no longer literally true, as predicted in r1 §3; the phase's asserts still pass (it only asserts the new pencil focus). Comment not changed (out of scope).
- Per the ledger: the bug could write the wrong block and erase a saved form edit (see G-S53 base numbers); priority is Scott's call.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r2-impl-report.md`
- Gate logs (same dir): `sc481-r2-gate-tsc-lint.log`, `sc481-r2-gate-jest.log`, `sc481-r2-gate-lifecycle-1.log`, `sc481-r2-gate-lifecycle-2.log`, `sc481-r2-gate-e2e.log`, `sc481-r2-gate-e2e-run1-CHR-F02-fail.log`, `sc481-r2-gate-shots.log`, `sc481-r2-gate-shots-run1-killed-at-595s.log`, `sc481-r2-gate-shots-run2-killed-at-599s.log`, `sc481-r2-gate-freeze.log`, `sc481-r2-gate-parity.log`
- Screenshots (Reading view, after fix): `sc481-r2-twins-after-upper-click.png` (6 / 5), `sc481-r2-twins-after-lower-click.png` (6 / 6)
- Scratch (probe harness, base-fail logs, mutation logs, probe JSON): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r2-impl-b2/` (`int-head/p481-int.json`, `int-base/p481-int.json`, `lc-gs53-base2.log`, `lc-gs53-base-form.log`, `mut-*-jest.log`, `mut-*-lc.log`)
