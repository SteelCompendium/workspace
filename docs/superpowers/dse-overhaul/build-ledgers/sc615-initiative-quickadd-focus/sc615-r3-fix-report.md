# SC-615 r3 fix report

## Executive summary
- STATUS: DONE. dse final sha `a5313f9d` on origin/develop `f6e504c7` (rebased twice: 6785fa06 first, then f6e504c7 per the base-move message; only the f6e504c7 sha was battery-run).
- Superproject: CHANGELOG commit `2020544a`, then ONE pointer commit `fc2b9f06` (draw-steel-elements -> `a5313f9d`), on workspace origin/main `7aae3668` (newer than the 0bf4430e named in the message; it pins dse f6e504c7).
- LOW-1 folded: e2e INIT-F24 (pinned sidebar, quick-add label) and INIT-F25 (Live Preview, quickadd label) added, manifest row `init.malice.quickadd.label` updated; both RED on base `f6e504c7`, green on the fix.
- INFO-1 folded: `recordCellPress` comment now names "the encounter title while it is being edited", no stepper.
- Gates on `a5313f9d`: tsc/lint clean · jest 12133 passed / 1 skipped · lifecycle 64/64 · e2e 424/437 ok, 0 failed, 13 known-bug, 233/233 pairs · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. All as the owner expected.

## Commits
dse (`/home/scott/code/steelCompendium/worktrees/sc615-initiative-quickadd-focus/draw-steel-elements`), top to bottom:
- `a5313f9d` test(e2e): INIT-F24, INIT-F25 (+ manifest rows)
- `71013b5c` docs: SC-615 recordCellPress comment (INFO-1; comment only, `view.ts`)
- `2479d1b2` INIT-F23 + dse CHANGELOG (r1, rebased)
- `58eb89e0` INIT-F17..F22 (r1, rebased)
- `73c22018` the fix + jest F30-F36 (r1, rebased)
Superproject: `2020544a` (workspace CHANGELOG bullet, unchanged content), `fc2b9f06` (the one pointer bump). No interim pointer commits; the first pointer commit made after the 6785fa06 rebase was dropped when the superproject was re-based onto 7aae3668 (`git rebase --onto origin/main f219c18c 5c93fe95`, then one new bump). No pushes.

## New scenarios
- INIT-F24 (`e2e/specs/initiative/focus-after-cell-press-textbox.e2e.ts`, sidebar describe): type amount 2 and label "Feyt" in the pinned tracker, real press on cell nth 2 -> detail "Edit Stamina: Ogre #3", focus on cell `0-3` in the sidebar, both boxes keep text.
- INIT-F25 (`e2e/specs/initiative/focus-live-preview.e2e.ts`): the same in Live Preview, with the 1000 ms hold after write-idle; focus on cell `0-3` of Live Preview tracker 0, not the editor, both boxes keep text.
- Ids: F17..F25 each occur once across `e2e/specs`; the runner reported no collision with SC-438's ids. Titles carry no bracketed ticket id.
- Red on base `f6e504c7` (log `e2e-new-base2.log`, `view.ts` temporarily checked out from f6e504c7, restored with `git checkout HEAD`; tree clean afterwards): INIT-F24 FAIL, focus state `{ctl:null, cell:null, surface:'body'}` where `{init.cell.stamina, 0-3, sidebar}` was expected; INIT-F25 FAIL, `[null, null, -1, false]` where `['init.cell.stamina','0-3',0,false]` was expected. On the fix: both ok (`e2e-new-fix.log`, run on the 6785fa06 base; they also pass in the final full e2e on f6e504c7).

## Gates on `a5313f9d` (full battery, all re-run after the final rebase)
- tsc (incl. `-p e2e`): clean. lint: clean (known `.eslintignore` warning only).
- jest (after `rm -f main.js styles.css`): `12133 passed / 1 skipped` (280 suites passed, 1 skipped). The shots css cache was already present in this worktree from r1's shots run, so this is the "cached" figure.
- lifecycle 64/64 in seven parts: 21, 16, 9, 4, 7 (G-S91 ok), 4 (G-S97 ok), 3 (G-S115 ok). No re-runs. An earlier part-5 run on the 6785fa06 base was stopped (TaskStop) before the second rebase and discarded; every part was re-run on the final base.
- e2e `OBSIDIAN-E2E done: 424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`.
- shots 592 ok, button host-leak 163 kinds / 978, modal button host-leak 40 kinds / 240, capture clip 147. freeze `280/280`. parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Superproject working tree clean after commit; dse working tree clean.

## Artifacts
Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc615-r3-impl/`: `b2-tsc.log`, `b2-lint.log`, `b2-jest.log`, `b2-lc1.log` .. `b2-lc7.log`, `b2-e2e.log`, `b2-shots.log`, `b2-freeze.log`, `b2-parity.log` (the final-base battery); `e2e-new-fix.log`, `e2e-new-base.log` (6785fa06 base), `e2e-new-base2.log` (f6e504c7 base, the red evidence). Files named `gate-*.log` and `lc-part*.log` there are from the superseded 6785fa06-base run and are void.

Drive-by fixes: none. Follow-ups: none.
