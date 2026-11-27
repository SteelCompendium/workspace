# SC-706 r5 implementer report

**Executive summary**
- STATUS: DONE. dse branch `sc706-destination-change-overwrites`, head `71660971` (r4 head `cbdf98d6`). Superproject unchanged (`98b2a527`, pointer unstaged). Not pushed, no tags.
- R4-H1 fixed, both parts of O8, in `src/data/CompendiumMigration.ts` only. R4-L1 (O9) fixed. R4-I1 (O10): wording re-read, true, no edit.
- jest `Tests: 2 skipped, 15014 passed, 15016 total` (r4: 15011, +3). tsc (incl. e2e) rc 0, lint rc 0.
- e2e full `OBSIDIAN-E2E done: 935/955 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`; sync element `90/101 ok, 0 failed, 11 known-bug`.
- Mutation, each guard reverted alone: reset -> 2 jest fail + e2e D15 fails; reconcile guard -> 1 jest fails; tag -> 2 jest fail.
- `styles.css` sha256 `50436d6b...37e98` unchanged (identical to clean `e783b068`); shots / freeze / parity carry. Lifecycle carries (only `src/data`, tests, e2e changed).

## Changes
- `src/data/CompendiumMigration.ts`
  - new module helper `sameFolder(a: unknown, b: string)` (normalized compare, false for a non-string root).
  - `execute()` (before the start-of-run `reconcile`): loads the stored state; when its root is not the same folder as `plan.root`, saves `emptyMigrationState(plan.root)`, so the run starts with `migrated: []`. The old folder's moved paths are never carried over (O8 part 1).
  - `reconcile(root, rekey)`: when re-keying, returns 0 unless `sameFolder(state.root, root)` (O8 part 2).
  - re-keyed manifest `releaseTag` = `` `migrated:${this.map.oldFinalRelease}` `` (O9); non-rekey path unchanged.
- Why both parts are needed (measured): reverting only the reset leaves the end-of-run `adopt()` claiming the old folder's paths, because `execute()` has set `state.root` to the new folder by then; the reconcile guard alone does not stop that.

## Tests
- jest `test/unit/data/compendiumMigration.test.ts`, "the handoff to the sync engine":
  - "a second migration into ANOTHER Destination never claims the user's own note ... the next sync leaves it alone" (the reviewer's PROBE-F2: manifest root B, only `career/sage.md` claimed, sync updates sage, skips the user's `career/disciple.md`, bytes kept);
  - "reconcile(root, rekey) adopts nothing from a state recorded for ANOTHER folder (the manifest stays put)";
  - "a run into another folder replaces the stored state" (state root B, `migrated` = only this run's);
  - the existing re-key test now also asserts `releaseTag` is `migrated:v3.20260403152914`.
- e2e `[SYNC-D15]` (`e2e/specs/sync/known-bugs.e2e.ts`, describe `sync: after the Destination folder was changed (SC-706)`): the reviewer's P01 scenario, with the manifest asserted (`root` = `Legacy B`, no entry for the user's path) and the note's bytes asserted after the next sync.

## O10 re-read
- `CHANGELOG.md` L27, `../CHANGELOG.md` L13, `docs/compendium-sync.md` L80-92: "a file of yours at a compendium path is never overwritten", "only a file that still holds exactly the text the plugin last wrote is updated", the old-folder sentence. All true after O8 (D15 proves the claim path is closed). No edit.

## Gates (measured)
- `npm run tsc` (both projects) rc 0; `npm run lint` rc 0.
- jest: `Test Suites: 1 skipped, 321 passed, 321 of 322 total`; `Tests: 2 skipped, 15014 passed, 15016 total`; rc 0.
- e2e targeted D13, D14, D15: `3/3 ok, 0 failed`.
- e2e full: `OBSIDIAN-E2E done: 935/955 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`, rc 0.
- e2e `--element=sync`: `OBSIDIAN-E2E done: 90/101 ok, 0 failed, 11 known-bug, coverage: 59/540 pairs (partial run: gate skipped)`, rc 0.
- Mutation (one guard reverted at a time, restored with `git checkout HEAD -- src`; tree clean afterwards):
  - reset off: jest 2 failed (the F2 test and the "replaces the stored state" test); e2e D15 FAIL (`manifest.files[...]` defined, received a hash).
  - reconcile guard off: jest 1 failed (the "reconcile(root, rekey) adopts nothing" test).
  - tag off: jest 2 failed (both re-key describe cases).
- styles.css sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98`.

## Commits (dse)
- `74666482` fix(SC-706): migration into another Destination starts from an empty list, adopts only its own moves, migrated: tag
- `71660971` test(SC-706): jest + e2e D15, tag assertion

## Drive-by fixes
- None.

## Follow-ups
- Per O8: an interrupted run in the old folder loses its self-heal record when the next run is in another folder (SC-708 note for the owner).

## Logs
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r5-impl/`: `r5-tsc.log`, `r5-lint.log`, `r5-jest.log`, `r5-jest-mig.log`, `r5-e2e-new.log`, `r5-e2e-full.log`, `r5-e2e-sync.log`, `r5-mut-reset-jest.log`, `r5-mut-guard-jest.log`, `r5-mut-tag-jest.log`, `r5-mut-reset-e2e.log`, scripts `r5-*.sh`, `mut.py`.
