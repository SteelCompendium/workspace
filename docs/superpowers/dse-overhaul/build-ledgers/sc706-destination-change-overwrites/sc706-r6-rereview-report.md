# SC-706 r6 — scoped re-review of the r5 delta (cbdf98d6..71660971)

**Executive summary**
- **Verdict: FIX REQUIRED.** The r5 delta itself is correct: R4-H1 and R4-L1 are fixed, both O8 guards are sound, and every mutant is caught. One pre-existing sibling, R6-H1, overwrites a user's note in real Obsidian on a changed-Destination path. It is present at `e783b068`, not made worse by SC-706, and sits outside the delta. If the owner rules it out of SC-706 (file it), the branch is LAND-READY as it stands.
- The branch is at `71660971` (plugin tree clean); the superproject is at `98b2a527` (` M draw-steel-elements` only). `origin/develop` is still `e783b068`.
- **Counts:** CRITICAL 0 · HIGH 1 (pre-existing, outside the delta) · MEDIUM 0 · LOW 0 · INFO 1.
- **Gates:**
  - tsc (both projects) rc 0; lint rc 0.
  - jest fresh: `Tests: 2 skipped, 15014 passed, 15016 total`, rc 0.
  - e2e full: `OBSIDIAN-E2E done: 935/955 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`, rc 0. SET-X03/X04 ok; SYNC-K12 and D11-D15 ok.
  - sync element: `90/101 ok, 0 failed, 11 known-bug`, rc 0.
  - styles.css sha256 `50436d6b…e37e98`, the same as the clean `e783b068` build.
- **R4-H1 is fixed.** The r4 probes all pass on `71660971`, and scratch e2e SYNC-P01 prints `manifest root=Legacy B claims mine=false`; the user's note survives the second migration and the sync after it.
- **The O8 guards are correct and no wider than needed.** A same-folder stopped-run resume still self-heals, re-key branch included (PROBE-R6b). The start-of-sync `reconcile(options.root)` is unchanged.
- **R4-L1 is fixed.** A re-keyed manifest carries `migrated:v3.x`, so "Check for updates" (`upToDate = releaseTag === tag`) can no longer report up to date over legacy content.
- **Item 4 ruling:** no e2e is owed for the re-key guard. With the reset in place no product path reaches it: guard-off still passes D15 and P01 in real Obsidian. jest kills that mutant.

## Findings

### HIGH (pre-existing, outside the r5 delta, owner ruling: fold or file)

**R6-H1. After a migration STOPPED part-way in the old folder, `markSettled(newRoot)` hands the old folder's moved-paths list to the new folder.**
The next Sync's `reconcile` then claims the user's own note there, and that Sync overwrites it, with no window and no copy.
`src/data/CompendiumMigration.ts:334-343` (`markSettled`: `state.root = root` while keeping `state.migrated`), reached from `main.ts:794-797`. The claim happens in `reconcile`'s non-re-key branch, at `:698-707`.

- **Scenario.**
  1. The user starts the layout migration in `DS Compendium` and clicks Stop after a few moves. The run's write-ahead window recorded all its destinations in `state.migrated`, and `incomplete` is true.
  2. They point the Destination at `Notes`. `Notes` holds their own notes, one at a 7.0.0 path the stopped run recorded but did not move.
  3. **Sync 1.** The migration is pending, `Notes` has children and no legacy files, so `markSettled('Notes')` runs: `state.root = Notes`, the list is kept.
    - `manifestHere` is false, so "Existing compendium folder found" opens.
    - On **Keep everything**, the note is skipped (correct) and the manifest moves to `Notes` without it.
  4. **Sync 2.** `reconcile('Notes')` sees `existing.root = Notes` and `state.root = Notes`, loops the old list under `Notes`, and hashes the user's note into the manifest.
    - `manifestHere` and `installedHere` are now true and the rel is in `files`, so Phase 1 calls `modifyBinary`. The note is gone.
- **Measured, real Obsidian** (scratch `head/e2e/specs/sync/zz-r6-probe.e2e.ts`, `[SYNC-P02]`, on `71660971`):
  - after sync 1 the note is kept and the manifest (`root=Notes`) has no entry for it;
  - sync 2's Notice reads `compendium v4 synced — 0 new, 1 updated, 0 removed.`;
  - after sync 2 the manifest claims the note and `Notes/dynamic-terrain/environmental-hazards/frozen-pond.md = "official …"`: FAIL, user text lost.
  - The probe's first run passed only because it read the file before sync 2's writes landed. The two later runs wait for the sync to finish (`syncService.isBusy()` false) and both fail.
- **Measured, jest** (scratch `head/test/unit/data/sc706r6Probe.test.ts` "PROBE-R6a", the same service calls in `main.syncCompendium`'s order): the note is overwritten at sync 2 (`claims note=true`, `note="v6 sage"`) on `71660971`, `cbdf98d6` and `e783b068` alike.
- **Why HIGH.** It is the ticket's guarantee ("a Sync into a changed Destination never overwrites a file the plugin did not install there") broken on a reachable path. It is the same mechanism as R4-H1 (a moved-paths list carried to another folder), through `markSettled` instead of `execute()`. It is pre-existing and not worsened. On base the overwrite comes one sync earlier, through the old SC-706 path.
- **Prescribed fix (same rule as O8, one place more).**
  - In `markSettled(root)`: when `!sameFolder(state.root, root)`, save `emptyMigrationState(root)` (flags cleared, list empty) instead of moving `state.root` and keeping the list.
  - Optionally widen r5's guard to both branches of `reconcile` (`if (!sameFolder(state.root, effectiveRoot)) return 0`). Then no adoption, re-key or not, ever reads another folder's list. That also closes the mirror case: a migration into `B` whose manifest write failed, followed by a sync while the manifest is still rooted at `A`, would claim `A/<rel>` files under `A`.
  - Accepted side effect, as in O8: the stopped run in the old folder loses its self-heal record (SC-708 territory).
  - Tests: PROBE-R6a as jest and P02 as e2e `[SYNC-D16]` (wait for `isBusy()` false after each sync). Both must go red with the `markSettled` reset removed.

### INFO

- **R6-I1 (item 4).** The reconcile re-key guard (`:696`) is defence in depth. Its only callers are in `execute()`, both after the reset (`:497-501`), so with the reset in place no product path reaches it. Guard-off: jest 1 failed; e2e D15 and P01 pass in real Obsidian. An e2e cannot be red for it, so none is owed. If the owner takes R6-H1's optional widening, the guard becomes the live rule for the non-re-key branch, and the R6-H1 tests cover it.

## Scope checks

| # | Check | Result |
|---|---|---|
| 1 | R4-H1: `sc706r4Probe` on `71660971` | ✔ PROBE-F2, F1 and O4 all pass (`r6-probes-head.log`) |
| 1 | R4-H1: e2e SYNC-P01 on `71660971` | ✔ `claims mine=false`, note kept after the second migration and the sync (`r6-e2e-probe-head.log`) |
| 2 | Reset in `execute()` (`:497-501`) | ✔ correct; it only fires on another folder (`sameFolder` normalizes and is false for a non-string root). Like O8 it also clears `declined` / `incomplete`, which belong to the old folder: correct for the new one |
| 2 | Re-key guard (`:696`) | ✔ correct; it only acts when re-keying |
| 2 | Same-folder stopped-run resume self-heals | ✔ PROBE-R6b: first run stopped with its manifest write failing (manifest for another folder, so the re-key branch), resume in the same folder gives `root=B tag=migrated:v3.x files=[disciple,sage]`, then the sync updates both, 0 skipped. `e783b068` fails this probe (`root=Old`, both skipped: the r2 M1 symptom); `cbdf98d6` passes it with the old tag |
| 2 | Start-of-sync `reconcile(options.root)` unchanged | ✔ `main.ts` is not in the r5 delta; the non-re-key branch is unchanged |
| 3 | R4-L1: tag `migrated:<oldFinalRelease>` | ✔ PROBE-F1 and r5's assertion; `checkForUpdates` compares `releaseTag === tag`, never true for `migrated:…` |
| 4 | Guard-off mutant: jest only | ruled acceptable, R6-I1 |
| 5 | Gates | below |

## Mutation table

Jest = the six sync and migration files (186 tests). E2E from each mutant's scratch copy.

| Mutant | jest | e2e |
|---|---|---|
| reset off (`if (false && …)`) | **2 failed** (the F2 test; "replaces the stored state") | **D15 FAIL** (`manifest.files[…]` holds a hash) |
| re-key guard off | **1 failed** ("adopts nothing from a state recorded for ANOTHER folder") | D15 ok, P01 ok (unreachable, R6-I1) |
| tag off | **2 failed** (both re-key describe cases) | not run (jest-only property) |

## Gates (measured)

| Gate | Result |
|---|---|
| `npm run tsc` | rc 0 |
| `npm run lint` | rc 0 |
| `npx jest` (fresh) | `Test Suites: 1 skipped, 321 passed, 321 of 322 total` · `Tests: 2 skipped, 15014 passed, 15016 total` · rc 0 |
| `npm run e2e` | `OBSIDIAN-E2E done: 935/955 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · rc 0 |
| `npm run e2e -- --element=sync` | `OBSIDIAN-E2E done: 90/101 ok, 0 failed, 11 known-bug` · rc 0 |
| styles.css | `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` (worktree = clean `e783b068`) |
| lifecycle | not run (no sync scenario; `src/data` only); carries unverified |

## Working tree

- Plugin: `git status --porcelain` empty, HEAD `71660971`.
- Superproject: ` M draw-steel-elements`, HEAD `98b2a527`.
- Gitignored `main.js`/`styles.css` were removed before jest and rebuilt by e2e.
- Probes and mutants ran only in scratch `git archive` copies.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r6-rereview/`:

- **Scripts:** `r6-gate-static.sh`, `r6-gate-e2e.sh`, `r6-probes.sh`, `r6-e2e-probe.sh`, `r6-mut.sh`.
- **Gate logs:** `r6-tsc.log`, `r6-lint.log`, `r6-jest.log`, `r6-static-rc.txt`, `r6-e2e-full.log`, `r6-e2e-sync.log`, `r6-e2e-rc.txt`, `r6-styles-sha.txt`.
- **Probes:**
  - jest probe files `head/test/unit/data/sc706r4Probe.test.ts` and `head/test/unit/data/sc706r6Probe.test.ts`;
  - jest logs `r6-probes-head.log`, `r6-probes-cbdf98d6.log`, `r6-probes-e783b068.log`, `r6-probes-rc.txt`;
  - e2e probe files `head/e2e/specs/sync/zz-r4-probe.e2e.ts` (P01) and `head/e2e/specs/sync/zz-r6-probe.e2e.ts` (P02);
  - e2e logs `r6-e2e-probe-head.log` (P01 and the racy first P02 run), `r6-e2e-probe2-head.log`, `r6-e2e-probe3-head.log`;
  - P02 failure bundles `head/e2e/.out/20261127-110435-9cd5/SYNC-P02` and `head/e2e/.out/20261127-110458-c1d5/SYNC-P02`.
- **Mutants:**
  - source trees `mut-guard/`, `mut-reset/`, `mut-tag/`;
  - jest logs `r6-mut-jest-{mut-guard,mut-reset,mut-tag}.log`, `r6-mut-guard-probe.log`;
  - e2e logs `r6-mut-e2e-mut-guard.log`, `r6-mut-e2e-mut-reset.log`, `r6-mut-rc.txt`.
