# SC-706 r1 implementer report

**Executive summary**
- STATUS: DONE. dse branch `sc706-destination-change-overwrites`, head `6961239e` (dse develop base `e783b068`, `origin/develop` still `e783b068`, no rebase). Superproject head `0e32b647` (CHANGELOG only; the submodule pointer is left unstaged for wt-finish). Nothing pushed, no tags.
- Both D1 halves done: `CompendiumSyncService.applySync` skips a differing file unless the old manifest's root is the new root (normalized compare); `main.ts` `syncCompendium` treats a manifest for another root as no manifest for the first-sync check.
- tsc (incl. `-p e2e`) clean, lint clean. jest 15003 passed / 2 skipped (fresh, no shots cache; baseline 14990 / 2 fresh, delta +13). lifecycle 64/64 (7 parts). e2e `OBSIDIAN-E2E done: 932/952 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`.
- `styles.css` byte-identical to a clean `e783b068` build (sha256 `50436d6b...37e98`), so shots / freeze / parity were NOT run (they carry).
- One existing test changed: `syncCompendiumBusy.test.ts` stubbed the manifest as `{}` (no root); it now carries the Destination as `root`.
- Follow-ups listed below (old-folder files; switching back to an earlier Destination; SC-653 relay).

## Files changed (dse, `draw-steel-elements/`)
- `src/data/CompendiumSyncService.ts` ~L189-195 (`installedHere`, computed before Phase 1) and ~L219 (the `modifyBinary` arm now `installedHere && oldManifest?.files[relativePath] !== undefined`). A manifest whose `root` is not a string counts as not-here (corrupt-but-accepted manifest: `ManifestStore.load` validates only `schemaVersion` and `files`; `normalizePath(undefined)` would throw).
- `main.ts` ~L765-770 (`manifestHere`) and the check block: `if (!manifestHere || migrationPending)` and inner `if (manifestHere) { sync }`. Vault-root refusal, migration detection and `LegacyCompendiumModal` now run for a changed-root manifest. `LegacyCompendiumModal` untouched (D2).
- Tests: `test/unit/data/compendiumSync.test.ts`, `test/dom/framework/syncCompendiumDestination.test.ts`, `test/dom/framework/syncCompendiumBugs.test.ts`, `test/dom/framework/syncCompendiumBusy.test.ts`, `e2e/specs/sync/known-bugs.e2e.ts`.
- `CHANGELOG.md` (plugin, top of `7.0.0 (unreleased)` list, `[FIX]` format as SC-688/SC-391) and the superproject `CHANGELOG.md` `## Unreleased` (as SC-682 etc.).

## Commits (dse)
- `85981444` fix(SC-706): product fix (both halves)
- `113c450a` test(SC-706): jest (service, routing, harness flip, busy-stub fix)
- `285e6f25` test(SC-706): e2e flip K12 + two scenarios
- `6961239e` docs(SC-706): plugin changelog
- superproject `0e32b647` docs(SC-706): workspace changelog

## Tests added / rewritten
- Service (`compendiumSync.test.ts`, +6): root changed + differing file -> skipped, bytes untouched, no `modifyBinary`, not adopted; manifest with no usable root -> skipped, no throw; root unchanged -> still updated in place; root changed + identical -> `unchanged`, no write, adopted; `"DS Compendium/"` and `"DS Compendium//"` manifest root = same root (2 cases).
- Routing (`syncCompendiumDestination.test.ts`, +6, describe `SC-706`): new folder with files -> window opens for that folder, no sync, no vault write before a choice; new folder absent -> sync, no window; new folder empty -> sync, no window; same root spelled with trailing slash -> no window; vault-root lookup with a changed-root manifest -> refused; legacy-layout new folder -> migration window, not a sync.
- Harness (`syncCompendiumBugs.test.ts`, describe `SC-706`): `test.failing` flipped to plain; the "current behaviour" test removed; added "window opens before anything is written" and "Keep everything keeps the colliding note's bytes (reported as skipped)" (net +1 test).
- e2e (`known-bugs.e2e.ts`, new describe `sync: after the Destination folder was changed (SC-706)`): `[SYNC-K12]` flipped from `knownBug` to `it` (moved out of the known-bugs describe; asserts the window opens, tree unchanged, user text intact, dismiss leaves no change); new `[SYNC-D11]` (Keep everything: colliding note keeps bytes, "skipped" Notice, exact tree diff); new `[SYNC-D12]` (changed Destination into an empty folder: syncs, no window, exact tree diff). No new control, so coverage stays 540/540.
- Mutation check (scratch, restored): with the product files at `e783b068`, 8 of the 90 tests in the three jest files fail (log below).

## Existing test whose expectation changed
- `test/dom/framework/syncCompendiumBusy.test.ts` "a migration left pending with nothing to move ...": it stubbed `manifestStore.load` with `{}`; under the new rule that is "a manifest for another root", so the first-sync window opened and `markSettled` never ran. The stub now returns `{ root: <the Destination> }` (one line).
- The old SC-706 "current behaviour" jest test (encoded the overwrite) was removed.
- Nothing else encoded the old behaviour (full jest and e2e green).

## Marker flips (D4)
- e2e `knownBug('SC-706', '[SYNC-K12]')` -> plain `it`. jest `SC-706` `test.failing` -> plain. No other marker moved (e2e known-bug 21 -> 20).

## Gates (measured)
- `npm run tsc` (includes `tsc -p e2e`): clean, rc 0. `npm run lint`: clean, rc 0.
- jest (fresh worktree, no shots cache): `Tests: 2 skipped, 15003 passed, 15005 total`, `Test Suites: 1 skipped, 321 passed`, rc 0. (First run had 1 failure, the Busy stub above, fixed.)
- Lifecycle, seven `--only` parts: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = **64/64 ok, 0 failed** (union).
- e2e full: `OBSIDIAN-E2E done: 932/952 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` (baseline 929/950, 21 known-bug; 930 + 2 new = 932). rc 0. Targeted run of the three scenarios first: 3/3 ok.
- `styles.css`: sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` for both this tree and a clean build of `e783b068` (temporary detached worktree, removed afterwards). Shots / freeze / parity not run.

## Drive-by fixes
- None.

## Follow-ups (owner decides)
1. The OLD folder's compendium files on a Destination change (D3): they stay, untracked. Only files the new release no longer has are trashed (Phase 2 resolves against the OLD root), so the old folder ends up half-emptied: files still in the release stay behind as orphans, upstream-removed ones are trashed. No ticket known to me.
2. Switching back to an EARLIER Destination (A, then B, then A again): the manifest root is B, so A's old compendium files are "not installed by us". A holds files, so the window opens; if the user keeps everything, A's files that differ from the new release are skipped (reported as "skipped to protect your changes") and not updated; identical ones are adopted. Safe, but a stale-file surprise; consequence of D1(a).
3. For the SC-653 owner (relay via dispatcher, D2): a changed-Destination Sync into a folder of the user's notes now shows the existing window, including its "Move old compendium to trash" button, until SC-653 changes it. D1(a) makes "Keep everything" safe on this path; SC-653's fix will now cover both paths. `LegacyCompendiumModal` untouched.
4. Pre-existing, not touched: `ManifestStore.load` validates only `schemaVersion` and `files`, not `root`. I guarded the two new `normalizePath(...root)` calls with a `typeof === 'string'` check; no other code was changed for it.

## Logs (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r1-impl/`)
- `sc706-npmci.log`
- `sc706-tsc.log`, `sc706-tsc-e2e.log`, `sc706-lint.log` (last run, after the guard edit)
- `sc706-jest.log` (final green run; the first, failing run was overwritten)
- `sc706-mutation.log` (old product code vs new tests: 8 failed)
- `sc706-basebuild.log` (clean `e783b068` build for the styles.css comparison)
- `sc706-life1.log` ... `sc706-life7.log` (the seven lifecycle parts)
- `sc706-e2e-only.log` (three scenarios), `sc706-e2e-full.log` (full run)
- scripts: `sc706-*.sh` in the same folder. e2e artifacts of the full run: `/home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites/draw-steel-elements/e2e/.out/` (gitignored).
