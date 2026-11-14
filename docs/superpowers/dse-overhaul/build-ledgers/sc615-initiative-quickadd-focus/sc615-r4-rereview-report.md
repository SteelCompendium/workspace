# SC-615 r4 scoped re-review report

## Executive summary
- VERDICT: **LAND.** dse `a5313f9d` on origin/develop `f6e504c7`; superproject `fc2b9f06` on origin/main `7aae3668`. Neither base moved during this review (I fetched again at the end).
- Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (a missing pre-press check in INIT-F25; not blocking).
- Range-diff: the three r1 commits are identical patches (`=`), including the CHANGELOG commit. The r3 commits are the two new ones (`71013b5c`, `a5313f9d`).
- INFO-1 fix: the `view.ts` comment now reads exactly as ruled. LOW-1 fix: INIT-F24 (sidebar label) and INIT-F25 (Live Preview label) pass on the fix. With `view.ts` from `f6e504c7` both fail (focus on `body`), and so do the controls F18 and F22. Both ids appear in the label manifest row, each id appears once in the specs, and no title carries a ticket id.
- Superproject: origin/main `7aae3668`, then `2020544a` (workspace CHANGELOG only; its content is identical to r1's `c44158f8`), then `fc2b9f06` (the only pointer bump; gitlink `a5313f9d`). There are no other commits and the tree is clean.
- My full e2e on `a5313f9d`: **`OBSIDIAN-E2E done: 424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`**. INIT-F17..F25 all ok.
- Spot-checked implementer logs (`b2-*`, all written after the 00:44 rebase that produced `a5313f9d`): tsc/lint clean · jest 12133/1 (cached) · lifecycle 64/64 · e2e 424/437 · shots 592 / 163/978 / 40/240 / 147 · freeze 280/280 · parity 0/0/24. All match the expected numbers. Nothing looked wrong, so I re-ran nothing else.

## 1. Rebase (range-diff `506786cb..8be8ec1d` vs `f6e504c7..a5313f9d`)
```
1:  79b2606c = 1:  73c22018 fix: initiative roster press ...
2:  06648f77 = 2:  58eb89e0 test(e2e): INIT-F17..F22 ...
3:  8be8ec1d = 3:  2479d1b2 test(e2e): INIT-F23 ...; docs: CHANGELOG entry ...
-:  -------- > 4:  71013b5c docs: SC-615 recordCellPress comment ...
-:  -------- > 5:  a5313f9d test(e2e): INIT-F24, INIT-F25 ...
```
- The CHANGELOG commit is `=`: it merged with SC-569's and SC-438's bullets without changing its own hunk.
- `git diff --stat f6e504c7 a5313f9d -- src` touches only `src/elements/initiative/view.ts` (+29/-1).
- No commit carries co-author or AI attribution trailers.

## 2. INFO-1 (`src/elements/initiative/view.ts:341`)
- The comment now reads "shield blurs a focused text box (the Malice quick-add amount or label, the encounter title while it is being edited) on that same pointerdown". That is the ruled wording, and "stepper" is gone. The commit changes the comment only (1 line).

## 3. LOW-1: the new label scenarios
- INIT-F24 (`e2e/specs/initiative/focus-after-cell-press-textbox.e2e.ts:126-137`, sidebar):
  - It types amount 2 and label "Feyt", then asserts focus is in the LABEL before the press.
  - After a real press on cell nth 2, it asserts the detail row shows Ogre #3, the sidebar cell `0-3` holds focus, and both boxes keep their text.
- INIT-F25 (`e2e/specs/initiative/focus-live-preview.e2e.ts:145-159`, Live Preview):
  - It runs the same steps and adds a 1000 ms hold after the save.
  - It asserts `[ctl, cell, tracker, editor] = ['init.cell.stamina','0-3',0,false]` and that both boxes keep their text.
- My runs in a scratch copy of `a5313f9d`:

  | Build | INIT-F18 | INIT-F22 | INIT-F24 | INIT-F25 |
  |---|---|---|---|---|
  | Fix | ok | ok | ok | ok |
  | `view.ts` from `f6e504c7` | FAIL | FAIL | FAIL | FAIL |

  - With the fix reverted, F24 ends with focus `{ctl:null, cell:null, surface:'body'}`, and F25 ends with `[null, null, -1, false]`.
- Manifest (`e2e/manifest/initiative.ts:35,62`): `init.malice.quickadd.label` lists `'F18', 'F24', 'F25'`, and `init.cell.stamina` gained F24 and F25.
- Ids: each of `[INIT-F17]`..`[INIT-F25]` occurs exactly once in `e2e/specs`. F24 and F25 appear in no other worktree's specs and on no remote branch. The titles carry no `[SC-nnn]`.

### INFO-A: INIT-F25 does not check that the label holds focus before the press
- `e2e/specs/initiative/focus-live-preview.e2e.ts:148-150`: INIT-F24 asserts `focusState()` is in the label before the press; INIT-F25 does not.
- It still exercises the label path. `dse.type` clicks the label box, types and never blurs, so the label holds focus at the press. INIT-F22, the amount test in the same file, has the same shape.
- If a future driver change made `type` blur, F25 would keep passing via the "focus outside the tracker" branch only while its final assertion still held. Because that assertion requires focus on the cell, the test would go red rather than become vacuous.
- No action needed. Optional fix: add the pre-press assertion (`expect((await focusState()).ctl).toBe('init.malice.quickadd.label')`).

## 4. Superproject
- `git log origin/main..HEAD`:
  - `2020544a` — `CHANGELOG.md` +5. Its added and removed lines are identical to r1's `c44158f8` bullet.
  - `fc2b9f06` — `draw-steel-elements` gitlink only. `ls-tree`: `160000 commit a5313f9d…`; origin/main has `f6e504c7…`.
- `git merge-base --is-ancestor origin/main HEAD`: true. Working tree clean.

## 5. Battery
- Mine, on `a5313f9d`: full e2e 424/437 ok, 0 failed, 13 known-bug, coverage 233/233 pairs (`wt-e2e.log`).
- Implementer's `b2-*` logs, read from each gate's own summary line:
  - tsc and lint: `GATE_RC=0`, clean.
  - jest: `Tests: 1 skipped, 12133 passed` (280 suites passed, 1 skipped).
  - lifecycle: 21/16/9/4/7/4/3, each `0 failed`, with the expected `--only` id lists. Part 5 includes G-S91, part 6 G-S97, part 7 G-S115.
  - e2e: 424/437 ok, 0 failed, 13 known-bug, 233/233.
  - shots: 592 ok; button host-leak 163/978; modal button host-leak 40/240; capture clip 147.
  - freeze: 280/280.
  - parity: 0 gaps / 0 undeclared / 24 declared.
  - All of these logs were written at 00:45-01:40, after the 00:44 rebase that produced `a5313f9d` (dse reflog).

## Trees
- dse: HEAD `a5313f9d` on branch `sc615-initiative-quickadd-focus`, status empty.
- Superproject: HEAD `fc2b9f06`, status empty.
- Probes ran in a scratch copy, and I did not touch either worktree.

## Artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc615-r4-rereview/`)
- `range-diff.txt`, `ws-cl-r1.diff`, `ws-cl-r3.diff`
- `e2e-copy-fix-*.log` (fix: F18/F22/F24/F25 ok), `e2e-copy-revert-*.log` (`view.ts` from `f6e504c7`: all 4 FAIL)
- `wt-e2e.log` (full e2e on `a5313f9d`)
- `view.base-f6e504c7.ts`, `view.fix-a5313f9d.ts`, the scratch copy `copy/`
