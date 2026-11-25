# SC-690 r5 rebase report

**Executive summary**
- STATUS: DONE. Plugin rebased onto `bb3a3d10` (confirmed `origin/develop`): head `a0e55f6b` (was `a84fa7a5`), 8 commits (7 rebased + 1 fold). Superproject rebased onto `61af335e` (confirmed `origin/main`): head `80b0934c` (was `980ac82c`), 3 commits.
- Conflicts: plugin `CHANGELOG.md` (commit 3), superproject `CHANGELOG.md` (commit 1). Both resolved by keeping both sides. `.repo-docs/architecture.md` auto-merged with no conflict. Nothing else conflicted.
- Folds done: comment at the roster-place re-check (INFO-r4-1, comment only); no angle brackets in the superproject bullet (INFO-r4-2a).
- Gates at `a0e55f6b`: tsc (+e2e) and lint clean; jest `14716 passed / 1 skipped` (exactly 14674 + 1 shots-cache + 41); lifecycle 64/64; e2e `833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`, exit 0, no "gate FAILED"; shots 592; freeze 280/280; parity 0 / 0 / 24.
- Both branches are fast-forwards of their tracked branch (`merge-base --is-ancestor` true). The submodule checkout is still on `sc690-montage-remove-hero` at `a0e55f6b`; no pointer bump committed.

## Rebase
Plugin (`/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements`): `package.json` / `package-lock.json` unchanged in `aee83dc1..bb3a3d10` (empty diff stat), so no `npm ci`.

| old | new | subject |
|---|---|---|
| `8e8b5c57` | `f6205e58` | feat: removeMontageHero |
| `e02ca829` | `2caffad1` | feat: menu item, window, focus rules, styles, tests |
| `e0856b44` | `8c49b524` | docs: gm-trackers, changelog, architecture note, focus test (CHANGELOG conflict) |
| `13cf641a` | `5748da85` | test: host-leak modal sweep |
| `43574bfe` | `53960ef0` | feat: chip CSS |
| `1d9803a5` | `fc027acd` | fix: r3 fixes |
| `a84fa7a5` | `3441e1cf` | test: D17/D18 open on the reseeded note |
| (new) | `a0e55f6b` | docs(SC-690): note why the roster-place re-check compares the name |

Range-diff saved at `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r5-logs/r5-range-diff.txt`: 6 commits `=` (identical patches), commit 3 `!` (only the CHANGELOG hunk, which now sits after SC-687's bullet), commit 7 of the new head `>` is the fold.

Superproject (`/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero`): `0c6aec5f` -> `67266b57` (CHANGELOG conflict), `980ac82c` -> `383956b9`, new `80b0934c` (reworded bullet: "press the button, which names the hero (for example **Remove Bram**)"). I used `git -c submodule.recurse=false rebase --autostash origin/main`: it left the submodule checkout alone (verified: `rev-parse --abbrev-ref HEAD` = `sc690-montage-remove-hero`, `--short HEAD` = `a0e55f6b`), the autostash popped, `stash list` is empty, ` M draw-steel-elements` remains uncommitted (pointer diff `bb3a3d10 -> a0e55f6b`, for landing).

## Conflicts
- Plugin `CHANGELOG.md`: SC-687's `[FIX]` bullet vs my `[FEATURE]` bullet in the same spot. Kept both, SC-687's first, a blank line between. The following r3 CHANGELOG rewrite applied cleanly.
- Superproject `CHANGELOG.md`: SC-687's `## Unreleased` bullet vs mine. Kept both, theirs first. The later two commits applied cleanly.
- `.repo-docs/architecture.md`: auto-merged (no markers); line 126 still reads "...Add a hero, Remove a hero (SC-690), Set limits".

## Folds
- `src/elements/montage/model.ts`: comment before the re-check: it compares the NAME at that place, enough today because any outside edit closes the window before Remove can be pressed (SC-650 / SC-662); a change that lets the window survive outside edits must compare the roster item itself. No behaviour change.
- Superproject `CHANGELOG.md`: no angle brackets. Grep of the plugin `CHANGELOG.md` and `docs/gm-trackers.md` for `Remove <` / `<name>`: no match in my text (the one `<name>` hit, line 969, is a pre-existing SC-142 line, untouched).

## Gates at plugin head `a0e55f6b` (logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r5-logs/`)
- tsc (+ `tsc -p e2e`), lint: exit 0, 0, 0.
- jest: `Tests: 1 skipped, 14716 passed, 14717 total` (315 suites). Matches the expected 14716 / 1: baseline 14674 / 2 skipped, plus one test that no longer skips with the shots cache, plus SC-690's +41.
- lifecycle (seven parts): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed.
- e2e last 5 lines of `r5-e2e-full.log`:
  ```
  OBSIDIAN-E2E RECOV-R09 ok (511 ms)
  OBSIDIAN-E2E RECOV-R08 ok (435 ms)
  OBSIDIAN-E2E done: 833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs
  OBSIDIAN-E2E coverage driven: 499 (control, kind) pair(s) -> .../e2e/.out/coverage.json
  e2e exit 0
  ```
  `grep -c "gate FAILED"`: 0.
- shots: 592 `ok`, exit 0. freeze: `freeze OK (280/280 ...)`. parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## Fast-forward proof
- `git -C .../draw-steel-elements merge-base --is-ancestor bb3a3d10 HEAD` and `... origin/develop HEAD`: true.
- `git -C .../sc690-montage-remove-hero merge-base --is-ancestor origin/main HEAD`: true.

Drive-by fixes: none. Follow-ups: none.
