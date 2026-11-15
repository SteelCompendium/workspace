# SC-649 R3 report

## Executive summary
- Verdict: DONE. All four R2 folds (LOW-1, LOW-2, INFO-1, INFO-2) are in, with tests. Both new mutants are killed.
- Plugin head `5f96239026` on branch `sc649-negotiation-roll-counts`, rebased onto dse develop `2777484c` (the second baseline move; `e1be1775` was the first, and the battery on it was stopped and discarded).
- Superproject head `a7532b61`, on current workspace `origin/main` `fded411f`: exactly 2 commits (CHANGELOG, then the one pointer bump). Not pushed.
- Gates on `2777484c`+mine: tsc and lint clean; jest 13345 passed / 1 skipped; lifecycle 64/64; shots 592 / host-leak 163/978 / modal 40/240 / clip 147; freeze 280/280; parity 0/0/24.
- e2e: first full run `596/613 ok, 2 failed` (SET-X03, SET-X04: the known SC-657 flake under load); `--only=SET-X03,SET-X04` re-run 2/2 ok; second full run `598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`.

## Plugin changes (4 plugin commits on develop `2777484c`)
- `31c0ddcf` (R1 fix) and `742a7b4d` (R1 e2e NEGO-A14), unchanged apart from the rebase.
- `d83ad953` fix(SC-649): Same Argument is drawn unchecked while a Motivation is chosen (LOW-2).
  - `ArgumentView.syncMods`: `checked: arg.sameArgumentUsed && !motivated`, `disabled: motivated`. Display only: the stored flag is untouched and nothing is written on render.
  - Tests in `test/dom/elements/negotiation-bugs.test.ts`:
    - A stale `sameArgumentUsed: true` with a motivation chosen is drawn `{checked:false, disabled:true}`, the tiers are the motivation ones, and the note is unchanged.
    - Click path: check Same, press the motivation (Same drawn unchecked and disabled, motivation tiers, the written note still holds `sameArgumentUsed: true`), un-press it (Same drawn checked and enabled, Same tiers), Complete at High writes [2,2] and the flag ends false.
  - LOW-1: the Case 2 Complete test now asserts the Reuse box is `{checked:false, disabled:true}`.
  - INFO-1: the harness exposes the raw note (I added `raw()` to the file's `mount` helper), so both "writes nothing" checks now compare bytes (`raw()` before and after a flush).
- `5f962390` test(SC-649): 3 unit tests in `test/unit/model/negotiation.test.ts` for `argumentUsesMotivation`, `argumentUsesPitfall` and `argumentReuseChecked` (INFO-2).
- Mutants (both die, each caught by the new tests): `checked: arg.reusedMotivation` fails the Case 2 Complete test; `checked: arg.sameArgumentUsed` fails both new Same Argument tests.
- No test title contains a bracketed ticket id (K11-K13 keep their pre-existing ids). `NEGO-A14` is still the only use of that id.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r1-impl/`)
- tsc rc=0 (`r4-tsc.log`); lint rc=0 (`r4-lint.log`).
- jest: `Tests: 1 skipped, 13345 passed, 13346 total` (`r4-jest.log`; 13334 + 1 shots cache + 5 R1 + 5 R3).
- lifecycle: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3, 0 failed each (`r4-lc1.log` to `r4-lc7.log`).
- e2e run 1: `OBSIDIAN-E2E done: 596/613 ok, 2 failed, 15 known-bug, coverage: 415/417 pairs`, rc=1 (`r4-e2e.log`; bundles `e2e/.out/20261115-023908-e8f8/SET-X03` and `SET-X04`). SET-X03 timed out waiting for the picker to filter; SET-X04 found `defaultImagePath` left over by SET-X03.
- e2e re-run: `--only=SET-X03,SET-X04`: `done: 2/2 ok, 0 failed` (`r4-e2e-setx-rerun.log`).
- e2e run 2: `OBSIDIAN-E2E done: 598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`, rc=0 (`r4-e2e-full2.log`).
- shots 592 ok, host-leak 163 kinds x 3 x 2 = 978, modal 40 kinds = 240, capture clip 147, rc=0 (`r4-shots.log`).
- freeze `280/280 frozen print PNGs byte-identical`, rc=0 (`r4-freeze.log`).
- parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc=0 (`r4-parity.log`).

## Superproject (`/home/scott/code/steelCompendium/worktrees/sc649-negotiation-roll-counts`)
- Branch `sc649-negotiation-roll-counts` was put on `origin/main` `fded411f` (no commits of its own existed) with `git checkout -B ... origin/main`, because the stale unstaged pointer blocked a rebase. The only dirt afterwards was `draw-steel-elements`; no other submodule showed modified, so no `git submodule update` was run.
- `e4cb35e3` docs(changelog): the bullet from `sc649-changelog-bullet.md`, verbatim, as the first bullet under `## Unreleased` (+10 lines).
- `a7532b61` chore: bump draw-steel-elements to 5f962390; only the gitlink changed. Tree entry: `160000 commit 5f962390269965599e68f48d69b6a31022ec0872`.
- `git log --oneline origin/main..HEAD` shows exactly these 2 commits; `git status --porcelain` is clean. No trailer, no push.

## Drive-by fixes:
None.

## Follow-ups:
- `negotiation-bugs.test.ts` header comment and describe name ("SC-439 filed bugs", `test.failing`) are stale for the SC-649 tests now living there; cosmetic.
- SET-X03/SET-X04 flaked again (SC-657), as expected under load.
