# SC-706 r7 implementer report

**Executive summary**
- STATUS: DONE. dse branch `sc706-destination-change-overwrites`, head `17187e4c` (r5 head `71660971`). Superproject unchanged (`98b2a527`). Not pushed, no tags.
- R6-H1 fixed per O11, `src/data/CompendiumMigration.ts` only: `markSettled` saves `emptyMigrationState(root)` when the stored root is another folder; `reconcile`, in both branches, adopts nothing from a state whose root differs from the root it reconciles.
- jest `Tests: 2 skipped, 15018 passed, 15020 total` (r5: 15014, +4). tsc (incl. e2e) rc 0, lint rc 0.
- e2e full `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`; sync element `91/102 ok, 0 failed, 11 known-bug`.
- Mutation, each guard reverted alone: markSettled reset -> jest 1 fails + e2e D16 fails; widened reconcile guard -> jest 1 fails (e2e D16 stays green: the markSettled reset covers that path, as with the r5 guard).
- Same-folder interrupted-run resume still self-heals (tests named below).
- `styles.css` sha256 `50436d6b...37e98` unchanged; shots / freeze / parity carry. Lifecycle carries (src/data, tests, e2e only).

## Changes (`src/data/CompendiumMigration.ts`)
- `markSettled(root)`: after the existing early returns, `if (!sameFolder(state.root, root)) { save(emptyMigrationState(root)); return; }`. For the same folder it behaves as before (clears `declined` / `incomplete`, keeps the list; it no longer rewrites `state.root`, which is already equal).
- `reconcile(root, rekey)`: the r5 re-key-only guard is replaced by `if (!sameFolder(state.root, effectiveRoot)) return 0;` placed after `effectiveRoot` is computed, so it covers the re-key and the non-re-key branch. This also closes the mirror case (a migration into B whose manifest write failed, then a sync while the manifest is still rooted at A).

## Tests
- jest `test/unit/data/compendiumMigration.test.ts`, "the handoff to the sync engine":
  - "SC-706: a run STOPPED in A, then the Destination set to B ...: markSettled(B) + Keep everything + a second sync never claim or overwrite the user's note" (the reviewer's PROBE-R6a, in `syncCompendium`'s call order);
  - "SC-706: markSettled for the SAME folder keeps the moved-paths record and only clears the flags";
  - "SC-706: reconcile() without the re-key flag adopts nothing from a state recorded for ANOTHER folder than the manifest's";
  - "SC-706: an interrupted run RESUMED in the same folder still self-heals, also when the manifest belongs to another folder (the re-key branch)" (the reviewer's PROBE-R6b).
- e2e `[SYNC-D16]` (`e2e/specs/sync/known-bugs.e2e.ts`): the reviewer's P02, waiting for `syncService.isBusy()` false after each sync before reading the note; asserts the manifest root `Notes`, no entry for the note, bytes kept after sync 2.
- Same-folder self-heal is proven by these existing tests (all green after the widening): "SCENARIO A: real process death mid-run, then re-run - EVERY moved file ends up managed", "C1: death BEFORE the first checkpoint still leaves the moved file recorded", "C2: death AFTER a checkpoint still re-offers", "reconcile() alone repairs an unadopted move, without any further migration", "reconcile() claims ONLY what the migration moved", plus the new PROBE-R6b and markSettled-same-folder tests above.

## Gates (measured)
- `npm run tsc` (both projects) rc 0; `npm run lint` rc 0.
- jest: `Test Suites: 1 skipped, 321 passed, 321 of 322 total`; `Tests: 2 skipped, 15018 passed, 15020 total`; rc 0.
- e2e D15 + D16: `2/2 ok`.
- e2e full: `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`, rc 0.
- e2e `--element=sync`: `OBSIDIAN-E2E done: 91/102 ok, 0 failed, 11 known-bug, coverage: 59/540 pairs (partial run: gate skipped)`, rc 0.
- Mutation (one guard reverted at a time, restored with `git checkout HEAD -- src`, tree clean afterwards):
  - markSettled reset off (old "move the root, keep the list"): jest 1 failed (the STOPPED-in-A test); e2e D16 `0/1 ok, 1 failed`.
  - widened reconcile guard off (back to the r5 re-key-only guard): jest 1 failed (the non-re-key "ANOTHER folder than the manifest's" test); e2e D16 `1/1 ok`.
- styles.css sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98`.

## Commits (dse)
- `6bf66547` fix(SC-706): markSettled + reconcile guard
- `17187e4c` test(SC-706): jest + e2e D16, same-folder resume

## Drive-by fixes
- None.

## Follow-ups
- Per O8 / O11 (SC-708 territory, owner adds the note): the stopped or interrupted run in the old folder loses its self-heal record when the Destination changes, in `execute()` (r5) and now also in `markSettled`.

## Logs
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r7-impl/`: `r7-tsc.log`, `r7-lint.log`, `r7-jest.log`, `r7-jest-sync.log`, `r7-e2e-new.log`, `r7-e2e-full.log`, `r7-e2e-sync.log`, `r7-mut-settle-jest.log`, `r7-mut-settle-e2e.log`, `r7-mut-guard-jest.log`, `r7-mut-guard-e2e.log`, scripts `r7-*.sh`, `mut.py`.
