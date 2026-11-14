# SC-643 r4: scoped re-review of the r3 delta

## Executive summary

- **Verdict: LAND.** There are no HIGH, MEDIUM or LOW findings, and two INFO notes. The review covers dse head `7b9e82cf` on develop `76520b1f` (`origin/develop` is still there) and superproject head `39fc83d8` on workspace `origin/main` `18f8043f`.
- **Rebase:** `git range-diff 8a81c5a7..9724c190 76520b1f..19f2ed83` gives `1: a70cb489 = 1: 9b6d918a` and `2: 9724c190 = 2: 19f2ed83`, so the r1 work came through the rebase unchanged.
- **L1 closed.** Probe: the window offers `DS Compendium` and the setting is then changed to `Notes`. Either answer now does nothing: no trash, no lookup, no write, the changed-folder Notice, and the lock is released. I tried 11 setting changes. Blank, empty and `Notes/../DS Compendium` resolve back to `DS Compendium` and go through. `/`, `./` and `..` show the refused Notice. A case variant (`ds compendium`) is dropped, which errs on the safe side. The next Sync gives `Notes` its own first-sync window.
- **L2 closed.** The M12, M13 and M14 mutants are now killed (1, 1 and 4 tests red). The new L1 mutants are also killed: check removed 2 red, raw-string comparison 3 red, check moved after the trash 1 red, M11 re-applied 3 red. M19 survives, as the r2 ruling expects.
- **L3 closed.** The modal comment, `docs/compendium-sync.md` and the CHANGELOG bullet all match the code and the Notice wording.
- **Superproject:** exactly 2 commits on `origin/main`: `9d71038e` changelog and `39fc83d8` pointer bump to `7b9e82cf`. `git diff origin/main --stat` shows only `CHANGELOG.md` and `draw-steel-elements`, and neither commit carries trailers.
- **Gates on `7b9e82cf`:**
  - tsc and lint: both exit 0.
  - jest: `Tests: 4 skipped, 12679 passed, 12683 total`. That equals 12681 / 2: the 2 extra skips are `token-coverage`, which skips when the worktree sits under /tmp.
  - e2e: `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`, rc 0. INIT-W10 passed, so no re-run was needed.

## Rebase

The range-diff (`range-diff.txt`) shows both r1 commits identical after the rebase. The r3 delta `19f2ed83..7b9e82cf` touches 5 files: `main.ts` (+10/-1), `src/model/CompendiumDestination.ts` (+6), `src/views/LegacyCompendiumModal.ts` (comment only), `docs/compendium-sync.md` (+4) and `test/dom/framework/syncCompendiumDestination.test.ts` (+125).

## L1: the changed-folder check (`main.ts:803-810`)

The check is `if (latest.root !== options.root) { new Notice(DESTINATION_CHANGED_NOTICE, 8000); return; }`. It runs after the re-read at `main.ts:801-802`, which refuses root and outside-vault values first, and before the trash at `main.ts:811-818`. It runs inside the `try` block, so the `finally` releases the lock.

The probe (`zzSc643R4L1Probe.test.ts`, 11/11 green) drives the real plugin, the real `sync` and the real `applySync`. Release, download and zip are stubbed. Each case opens the window offering `DS Compendium`, changes the setting, then answers the window:

| setting changed to | answer | trashed | lookup | written | Notice |
|---|---|---|---|---|---|
| `Notes` | trash | none | 0 | none | changed |
| `Notes` | keep | none | 0 | none | changed |
| `'   '` | trash | `DS Compendium` | 1 | only under `DS Compendium/` | sync summary |
| `''` | trash | `DS Compendium` | 1 | only under `DS Compendium/` | sync summary |
| `Notes/../DS Compendium` | trash | `DS Compendium` | 1 | only under `DS Compendium/` | sync summary |
| `/` | trash | none | 0 | none | refused |
| `./` | keep | none | 0 | none | refused |
| `..` | trash | none | 0 | none | refused |
| `ds compendium` | trash | none | 0 | none | changed |

- In the three cases that go through, the setting still resolves to the folder the window named, so the trash and the sync are correct.
- The `ds compendium` case errs on the safe side: on a case-insensitive file system it is the same folder, but the answer is still dropped.
- Two more probe tests: `Notes` then back to `''` before the click goes through. After a dropped answer, the next Sync opens the window for `Notes`.

Nothing else I tried slips through.

## L2: mutants

The 7 test files hold 162 tests; the baseline passes 162/162. Each mutant was applied to the scratch worktree `wt-mut` alone and the file restored afterwards (the `git status` after the runs shows only my untracked probe file).

| mutant | tests red |
|---|---|
| M12 `syncAnyway` uses the captured root | 1 |
| M13 `syncAfter` uses the captured root | 1 |
| M14 `offerMigration` guard dropped | 4 |
| L1a changed-folder check dropped | 2 |
| L1b raw setting compared instead of the resolved root | 3 |
| L1c check moved after the trash | 1 |
| M11r legacy callback uses the captured options | 3 |
| M19 `detect` guard dropped | 0 (dropped by the r2 ruling) |

All other r2 mutants (M01-M10 and M15-M28) are still killed, with 1 to 27 tests red each.

## L3: docs and comment

- **Modal comment**, `src/views/LegacyCompendiumModal.ts:11-13`: it now says the trash follows Obsidian's "Deleted files" option and is permanent under "Permanently delete". That matches the real `FileManager.trashFile` (1.14.4: `"none"` calls `vault.delete`).
  - INFO: line 10 still calls the trash choice "an explicit, confirmed action". It is one click with no separate confirmation step. That is SC-653's subject and outside this delta.
- **`docs/compendium-sync.md:38-41`**: a blank or spaces-only field means `DS Compendium`, and spaces at the ends are ignored. The code trims all whitespace, which is a superset of what the doc says, so the doc is accurate. `/`, `.`, `./` and `..` are refused with a Notice in both Sync and Migrate. This matches `resolveCompendiumDestination` and `requireSyncOptions`.
- **CHANGELOG bullet**, first under `## Unreleased` in the worktree superproject's `CHANGELOG.md`: it is identical to `sc643-changelog-bullet.md`.
  - "show a Notice asking you to choose a folder" matches `DESTINATION_REFUSED_NOTICE`.
  - "cleared (or set to `/`)" matches the pre-fix behaviour: real `normalizePath('/')` is `/`, which is the vault root.
  - INFO: the bullet does not mention the new changed-folder Notice. That is fine for a user-facing summary.

## Superproject

- `git fetch origin`, then: HEAD is `39fc83d8`, `origin/main` is `18f8043f`, and `origin/main` is an ancestor of HEAD.
- `git log origin/main..HEAD` lists 2 commits:
  - `9d71038e` docs(SC-643) changelog
  - `39fc83d8` chore: bump draw-steel-elements to 7b9e82cf
- `git diff origin/main --stat` gives `CHANGELOG.md | 8 +` and `draw-steel-elements | 2 +-`.
- The tree's gitlink is `7b9e82cfce6470e3fe547ff471e8ecd7fb4b01d7`.
- Neither commit has a Co-Authored-By or "Generated" trailer.

## Gates (`wt-gates`, a detached worktree at `7b9e82cf`)

| gate | result |
|---|---|
| tsc | exit 0 |
| lint | exit 0 |
| jest (fresh, `rm -f main.js styles.css` first) | `Test Suites: 1 skipped, 285 passed`; `Tests: 4 skipped, 12679 passed, 12683 total`. The +2 skipped is `token-coverage.test.ts`, which skips when the worktree is outside the workspace. That equals the r3 report's 12681 / 2. |
| e2e | `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`, rc 0, pointer parked. Load average went from 23.8 at the start to 9.8 at the end. |

Lifecycle, shots, freeze and parity were not re-run; `styles.css` is unchanged, as stated in r3.

## Tree hygiene

The branch worktree (checked with `--ignored`), the superproject worktree and the main checkout have the same `git status` before and after. `wt-gates` and `wt-mut` are now registered in the sc643 module repo's `git worktree list`. They are not removed, because the rules forbid rm in scratch.

## Artifacts

Root: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r4-review/`

- `range-diff.txt`
- `gates-r4.sh`, `gates-r4.rc`, `gate-tsc-r4.log`, `gate-lint-r4.log`, `gate-jest-r4.log`, `gate-e2e-r4.log`
- `mutate-r4.py`, `mutate-r4.sh`, `mutate-r4-m11.sh`, `mutate-r4.progress`, `mutate-r4-m11.progress`, `mutate-r4.out`, `mutate-r4-baseline.log`, and one `mutate-r4-<id>.log` per mutant
- `zzSc643R4L1Probe.test.ts.txt` (also copied to `wt-mut/test/dom/framework/zzSc643R4L1Probe.test.ts`; not committed) and `probe-l1-r4.log`
- `status-before-branch.txt`, `status-before-super.txt`, `status-before-main.txt`
