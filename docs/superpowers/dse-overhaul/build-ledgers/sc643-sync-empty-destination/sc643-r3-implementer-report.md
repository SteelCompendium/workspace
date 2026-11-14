# SC-643 r3 implementer report

## Executive summary

- Verdict: DONE. dse head `7b9e82cf` (rebased onto `origin/develop` `76520b1f`, no conflict, develop had not moved again). Superproject head `39fc83d8` on `origin/main` `18f8043f`; exactly two commits on top. Nothing pushed.
- L1 folded: a legacy-window answer is dropped (Notice, no trash, no sync, no write) when the re-resolved Destination differs from the folder the window named. 3 tests (probe shape: offered `DS Compendium`, setting changed to `Notes`, both choices).
- L2 folded: 7 tests for M12 (`syncAnyway`), M13 (`syncAfter`), M14 (`offerMigration` guard). M19 dropped, no test.
- L3 folded: modal comment corrected (trash is not always recoverable), `docs/compendium-sync.md` updated, CHANGELOG bullet added verbatim (no wording diff needed).
- Red without the guard: L1 2 red, M12 1 red, M13 1 red, M14 4 red (each guard removed alone, restored after).
- Gates: tsc/lint clean; jest 12681 passed / 2 skipped (12575 base + 96 r1 + 10 r3); lifecycle 64/64; e2e 484/504 ok, 0 failed, 20 known-bug, 287/287 pairs; styles.css identical to base so shots/freeze/parity carry.

## dse commits (on `76520b1f`, plugin root `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/draw-steel-elements`)

- `9b6d918a` fix(SC-643): an empty Destination folder is the default folder; a vault-root one is refused, and the vault root is never offered for trash (r1, rebased)
- `19f2ed83` test(SC-643): Destination-folder resolver table, Sync/Migrate ... link resolvers (r1, rebased)
- `7e875bd6` fix(SC-643): a legacy-window answer is dropped when the Destination folder changed while it was open; correct the 'trash is recoverable' comment
- `b5864e9c` test(SC-643): changed-folder answer, syncAnyway/syncAfter re-resolve, offerMigration vault-root guard
- `7b9e82cf` docs(SC-643): compendium-sync.md says what a blank, spaced, vault-root or outside-vault Destination folder does

## Superproject (`/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination`)

Sits on `origin/main` `18f8043f1874a726d8939d3e381f4d7c7593381e` (it had moved since r1; the branch had no commits of its own, so the rebase was a fast-forward):
- `9d71038e` docs(SC-643): changelog: an empty Destination folder no longer makes Sync offer to trash the vault
- `39fc83d8` chore: bump draw-steel-elements to 7b9e82cf (SC-643: empty Destination folder = DS Compendium, vault root refused and never offered for trash)

`git diff origin/main --stat`: `CHANGELOG.md | 8 ++++++++`, `draw-steel-elements | 2 +-`. Nothing else. Status clean. No interim pointer commits.

## Changes

- `main.ts`: in the legacy-window callback, after `latest` is re-resolved, `if (latest.root !== options.root)` shows `DESTINATION_CHANGED_NOTICE` and returns (before any trash/sync). Both choices (trash and keep) are dropped, since the answer no longer describes what a sync would write. `DESTINATION_CHANGED_NOTICE` (in `src/model/CompendiumDestination.ts`): "Draw Steel Elements: the Destination folder changed while that window was open, so nothing was moved or synced. Run Sync again."
- The comparison is on resolved paths, so `DS Compendium/` or ` DS Compendium/ ` is still the same folder (tested: the answer goes through).
- `src/views/LegacyCompendiumModal.ts` lines 11-13: now says the trash call follows Obsidian's "Deleted files" option and is permanent under "Permanently delete". Comment only.
- `docs/compendium-sync.md`: under Destination folder, blank/spaces-only = `DS Compendium`, end spaces ignored, vault root (`/`, `.`, `./`) and outside-vault (`..`) refused with a Notice.
- CHANGELOG bullet as committed (first under `## Unreleased`), verbatim from `sc643-changelog-bullet.md`; it matches the code (Notice behaviour, `/ . ./ ..`, ignored end spaces), so no adjustment:

  > **DSE plugin: Sync no longer offers to move your whole vault to the trash when the Destination folder is empty (SC-643).** With the Destination folder field cleared (or set to `/`), Sync treated the vault root as an old compendium folder and opened the "Existing compendium folder found" window, whose "Move old compendium to trash" button would have trashed every file in the vault. Now an empty or spaces-only Destination folder means the default folder, `DS Compendium` (the folder the field's placeholder shows), for Sync and for compendium links alike. A Destination that points at the vault root (`/`, `.`, `./`) or outside the vault (`..`) is refused: Sync and Migrate do nothing and show a Notice asking you to choose a folder. Spaces at the start or end of the folder name are ignored. The vault root is never offered for the trash, however it is reached.

## New tests (all in `test/dom/framework/syncCompendiumDestination.test.ts`, file now 38 tests)

- L1: `answering the window (trash=true|false) does nothing` (offered `DS Compendium`, setting then `Notes`; asserts no trash, no sync, `DESTINATION_CHANGED_NOTICE`, whole-vault snapshot equal before/after, zero write-method calls, lock released); `the same folder spelled differently ... still goes through`.
- M12: `syncAnyway after the setting was changed to the vault root` (Notice, no `markSettled`, no `sync`, lock released).
- M13: `syncAfter after the setting was changed to the vault root` (Notice, no `sync`); plus a companion `syncAfter / syncAnyway with the setting unchanged still sync the resolved folder`.
- M14: `offerMigration(%j) called directly` for `''`, `/`, `.`, `..` (Notice, no `plan`, no `markSettled`/`markDeclined`, no window).

## Red-without-guard proofs (`scratchpad/sc643-r3-impl/mutate.py`, `mut-run.sh`; logs `mut-L1.log`, `mut-M12.log`, `mut-M13.log`, `mut-M14.log`)

Each mutant applied to `main.ts` alone, the file re-run, `main.ts` restored with `git checkout`:

| mutant | guard removed | result |
|---|---|---|
| L1 | the `latest.root !== options.root` block | `Tests: 2 failed, 36 passed, 38 total` |
| M12 | `syncAnyway` re-read replaced by the captured `root` | 1 failed, 37 passed |
| M13 | `syncAfter` re-read replaced by the captured `root` | 1 failed, 37 passed |
| M14 | `offerMigration` vault-root guard deleted | 4 failed, 34 passed |

## Gates (final dse head `7b9e82cf`)

| gate | result |
|---|---|
| tsc, lint | exit 0, exit 0, clean |
| jest, fresh, `rm -f main.js styles.css` first | `Test Suites: 1 skipped, 285 passed, 285 of 286 total`; `Tests: 2 skipped, 12681 passed, 12683 total` = 12575 base + 96 (r1) + 10 (r3) |
| lifecycle (`--only=A,B,...`, seven parts) | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed; no re-run |
| e2e | `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`, exit 0; INIT-W10 did not fail; single run |
| styles.css sha256 | head `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; build of `76520b1f` (git archive) `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`: identical, so shots/freeze/parity carry |

Lifecycle ran sequentially with `appearance.json` reset before each part; the host was shared and no flake appeared.

## Drive-by fixes

None.

## Follow-ups

None new. Untouched per brief: SC-653, SC-654, SC-440's `settings-matrix.test.ts` (`syncOptions()?.releaseTag`), e2e specs.

## Artifacts

Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r3-impl/`: `tsc.log`, `lint.log`, `jest-full.log`, `jest-dest.log`, `mut-L1.log`, `mut-M12.log`, `mut-M13.log`, `mut-M14.log`, `lc-part1.log` to `lc-part7.log`, `e2e-full.log`, `styles-head.sha`, `styles-base.sha`, `build-head.log`, `build-base.log`.
Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-r3-implementer-report.md`
