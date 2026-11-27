# SC-706 r3 implementer report

**Executive summary**
- STATUS: DONE. dse branch `sc706-destination-change-overwrites`, head `cbdf98d6` (r2 review head `6961239e`); superproject head `98b2a527` (CHANGELOG only, pointer unstaged). Not pushed, no tags.
- Folded: H1 (O4 hash rule), M1 (O5 re-key on the migration run's adopt path only), L1 (both CHANGELOGs), L2 (`docs/compendium-sync.md`). INFO items not touched (O7).
- tsc (incl. `-p e2e`) clean rc 0; lint clean rc 0; jest `Tests: 2 skipped, 15011 passed, 15013 total` (r2: 15003, delta +8).
- e2e full: `OBSIDIAN-E2E done: 934/954 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`. e2e `--element=sync`: `89/100 ok, 0 failed, 11 known-bug`.
- One earlier full run had 2 failures, SET-X03 and SET-X04 (settings file picker timed out; unrelated to sync). The settings element alone passed (`80/82 ok, 0 failed, 2 known-bug`) and a full re-run was green. Log kept.
- Mutation: with the two `src/data` fixes reverted, 5 jest tests and both new e2e scenarios (D13, D14) fail.
- `styles.css` sha256 `50436d6b...37e98`, same as the clean `e783b068` build; shots / freeze / parity carry. Lifecycle not re-run: only `src/data`, tests, e2e and docs changed, and no lifecycle scenario covers sync (r1's 64/64 stands).

## Per finding

**H1 (O4).** `src/data/CompendiumSyncService.ts` ~L189-194 (comment) and ~L222-228: the `modifyBinary` arm is now
`oldManifest?.files[relativePath] !== undefined && (installedHere || currentHash === oldManifest.files[relativePath])`.
A file at a changed root holding exactly the recorded hash is updated in place, reported `updated`, and enters the new manifest; any other differing file stays `skippedConflicts`. Same-root behaviour is untouched (SC-694 arm unchanged apart from the extra clause).
Tests:
- `test/unit/data/compendiumSync.test.ts`: "a renamed compendium folder (root changed, file still the recorded bytes) is updated in place and tracked" (also asserts the unchanged file, the saved manifest root/files, and that the next same-root sync keeps updating); "... a file the user EDITED ... is skipped, bytes untouched"; "a user's own note at a rel the manifest does NOT list is skipped even when the root changed".
- e2e `[SYNC-D13]` in `e2e/specs/sync/known-bugs.e2e.ts` (describe `sync: after the Destination folder was changed (SC-706)`): sync v1, rename the folder through `app.fileManager.renameFile`, set the Destination, v2 sync -> window -> Keep everything -> `0 new, 1 updated, 0 removed`, no "skipped" Notice, changed file updated, manifest root = the new folder; then v3 sync with no window updates it again.
- The r1 SC-706 tests stay green as written (their colliding note is not the recorded bytes).

**M1 (O5).** `src/data/CompendiumMigration.ts` `reconcile(root?, rekey = false)` (~L677-690): when `rekey` is set and the existing manifest's root differs (normalized) from `root`, `files` starts from `{}` and the manifest root becomes `root`; releaseTag / locale / format keep the existing values (the review's "keep the old releaseTag logic"). `execute()` passes `true` at both calls (the start-of-run self-heal at ~L491 and `adopt()` at ~L523). The `reconcile(options.root)` in `main.ts` `syncCompendium` is untouched, so it never re-keys. When nothing is adopted the early `added === 0` return still leaves the manifest as it was.
Tests:
- `test/unit/data/compendiumMigration.test.ts`, "the handoff to the sync engine", `describe.each` over the review's two variants (old-folder manifest lists the same rels / other rels): the manifest moves to the migrated folder and claims exactly the moved files; the next sync updates both moved files, none skipped.
- Same file: "reconcile() without the re-key flag leaves another folder's manifest where it is" (guards the O5 constraint).
- e2e `[SYNC-D14]`: sync into folder A, Destination -> folder B holding 25 pre-7.0.0 files, Sync offers the migration, run it, "Sync the compendium now" -> `0 new, 25 updated, 0 removed`, no "skipped" Notice, every file holds the official text, manifest root = B.

**L1.** `draw-steel-elements/CHANGELOG.md` ~L27 and superproject `CHANGELOG.md` ~L13: the "not removed" sentence now reads "...stay where they are, except files the new release no longer has, which go to the trash as before." plus one sentence on a moved or renamed compendium folder (unedited files keep updating after "Keep everything"; an edited file is skipped and reported).

**L2.** `docs/compendium-sync.md` "First sync into an existing folder": the opening sentence now also covers "when you have changed the Destination folder since the last sync" (and says an empty or absent changed Destination syncs at once). A new paragraph "Changing the Destination folder" covers moving or renaming the compendium folder, the hash rule, and the old folder.

## Commits (dse)
- `0c366214` fix(SC-706): H1 + M1 (src/data only)
- `5e4a3a39` test(SC-706): jest + e2e for both
- `cbdf98d6` docs(SC-706): changelog + compendium-sync.md
- superproject `98b2a527` docs(SC-706): workspace changelog

## Gates (measured)
- `npm run tsc` (both projects) rc 0; `npm run lint` rc 0.
- jest: `Test Suites: 1 skipped, 321 passed, 321 of 322 total`, `Tests: 2 skipped, 15011 passed, 15013 total` rc 0.
- e2e targeted (K12, D11, D12, D13, D14): `5/5 ok, 0 failed`. Mutation (src reverted): jest 5 failed of 76 in the two touched unit files; e2e `0/2 ok, 2 failed` for D13, D14. Source restored from the saved patch before committing.
- e2e full: `OBSIDIAN-E2E done: 934/954 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` (934 = 932 + D13 + D14). Earlier run 1: `932/954 ok, 2 failed` (SET-X03, SET-X04: "timed out waiting for the picker to filter to Settings/token.svg", then X04's consequence), not reproduced.
- e2e `--element=sync`: `OBSIDIAN-E2E done: 89/100 ok, 0 failed, 11 known-bug, coverage: 59/540 pairs (partial run: gate skipped)`.
- styles.css sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98`, equal to the clean `e783b068` build measured in r1. No CSS touched.

## Drive-by fixes
- None.

## Follow-ups
- M1's re-keyed manifest keeps the old folder's `releaseTag` (the review's wording), so after a migration into a changed Destination `checkForUpdates` compares against the OLD folder's last synced tag, not `migrated:<release>`. Same as base's behaviour in the same-rels case; the moved files are legacy content, so a `migrated:` tag on re-key would be more accurate. Not changed; owner call.
- Pre-existing, unchanged: `reconcile()`'s first call in `execute()` can still use a stale `state.root` when a previous run was in a different folder.

## Logs
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r3-impl/`: `r3-tsc.log`, `r3-lint.log`, `r3-jest.log`, `r3-e2e-new.log`, `r3-mut-jest.log`, `r3-mut-e2e.log`, `r3-e2e-full.log` (green run), `r3-e2e-full-run1-flaky.log` (2 settings failures), `r3-e2e-set.log`, `r3-e2e-sync.log`, `r3-src.patch` (the two `src/data` edits, used for the mutation check), scripts `r3-*.sh`.
