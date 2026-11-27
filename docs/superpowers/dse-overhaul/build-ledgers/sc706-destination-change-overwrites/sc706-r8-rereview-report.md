# SC-706 r8 — scoped re-review of the r7 delta (71660971..17187e4c)

**Executive summary**
- **Verdict: LAND-READY.** The branch is at `17187e4c` (plugin tree clean); the superproject is at `98b2a527` (` M draw-steel-elements` only). `origin/develop` is still `e783b068`.
- **Counts:** CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3.
- **Gates:**
  - tsc (both projects) rc 0; lint rc 0.
  - jest fresh: `Tests: 2 skipped, 15018 passed, 15020 total`, rc 0.
  - e2e full: `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`, rc 0. SET-X03/X04 ok; SYNC-K12 and D11-D16 ok.
  - sync element: `91/102 ok, 0 failed, 11 known-bug`, rc 0.
  - styles.css sha256 `50436d6b…e37e98`, the same as the clean `e783b068` build.
- **R6-H1 is fixed.** The r6 jest probe passes. Scratch e2e SYNC-P02, which waits for each sync to finish, passes: the note is kept and the manifest (`root=Notes`) has no entry for it. All earlier probes still pass on `17187e4c`.
- **The widened guard breaks no legitimate adoption.** A same-folder resume self-heals in both branches. In the mirror case (manifest write failed, manifest still at the old folder) nothing is stranded: the first sync into the migrated folder skips the moved files, and the next sync adopts and updates them. The widened guard does not cause that one-sync delay; it is identical at `71660971`.
- **The class sweep finds no other reachable overwrite or claim path.**
- **Mutants:** markSettled reset off → jest 1 failed plus D16 and P02 FAIL in real Obsidian. Widened guard back to the r5 form → jest 1 failed; e2e green, because the path it guards is not reachable from the UI with the resets in place (as for r5's guard).

## Checks

### 1. R6-H1

| Probe | `17187e4c` |
|---|---|
| jest PROBE-R6a (stopped run in A → markSettled(B) → Keep everything → second sync) | ✔ `state={root:B, migrated:[]}` after sync 1; sync 2 `reconcile adopted=0 … claims note=false`, `skipped=["career/sage.md"]`, note kept |
| e2e SYNC-P02 (real Obsidian; waits for `syncService.isBusy()` false after each sync) | ✔ `manifest root=Notes claims mine=false`; note = `"MY OWN notes…"`; sync 2 reports "1 file(s) skipped to protect your changes" |
| Earlier probes: PROBE-F1/F2/O4 (r4), PROBE-R6b (r6), SYNC-P01 (r4 e2e) | ✔ all pass (`r8-probes-head.log`, `r8-e2e-probe-head.log`) |

### 2. The widened `reconcile` guard (`CompendiumMigration.ts:705`)

| Case | Result |
|---|---|
| First migration, no manifest (`effectiveRoot = state.root`) | ✔ the guard is trivially true; existing tests "THE POINT …", "adopts the moved files" are green |
| Same folder, non-re-key branch (stopped run resumed, `reconcile` at sync start) | ✔ existing "SCENARIO A", "C1", "C2", "reconcile() alone repairs an unadopted move" are green (full jest) |
| Same folder, re-key branch (manifest for another folder, run stopped with its manifest write failing, resumed in the same folder) | ✔ PROBE-R6b: `root=B tag=migrated:v3.x files=[disciple,sage]`, then the sync updates both |
| Start-of-sync `reconcile(options.root)` when the state belongs to the manifest's folder (Destination changed) | ✔ `effectiveRoot` = manifest root = state root: adopts that folder's own moves into its own manifest, as before |
| **Mirror case**: migration into B with every manifest write failing (manifest stays rooted at A), then Syncs into B | Not stranded. Sync 1: `reconcile=0` (guard), window, Keep everything → both moved files `skipped` (legacy bytes ≠ A's recorded hashes), manifest moves to `root=B`. Sync 2: `reconcile=2` (state root B = manifest root B) → `updated=[disciple, sage]`, 0 skipped. Same at `71660971` |
| …vs `e783b068` | base updates the same-rels variant at sync 1 (via the old-root manifest entries, the SC-706 mechanism) and behaves like head for the other-rels variant. The cost on head is one extra sync plus a misleading "skipped to protect your changes" Notice, only after a failed manifest write. No user bytes are at risk and nothing stays stranded. **Ruled not worse in any way that matters** (R8-I1) |
| State with a non-string `root` (malformed file; `MigrationStateStore.load` does not check `root`) | adopts nothing now (`sameFolder` is false). No writer ever omits `root`, and this fails safe. INFO only |

### 3. Class sweep (other readers of another folder's state or manifest list on a changed-Destination path)

| Reader | Reachable overwrite / claim? |
|---|---|
| `execute()` | no: reset when `stored.root` ≠ `plan.root` (r5) |
| `markSettled` | no: reset when the root differs (r7) |
| `markDeclined(root)` | keeps the other folder's root and list (it only sets `declined`), but every reader that could act on it is now guarded: `markSettled` resets, `execute` resets, `reconcile` refuses a state for another folder. PROBE-R8d: A stopped → B offered and declined → "Sync anyway" → second sync: note kept on head; overwritten on `71660971` and `e783b068`. Closed by r7, not just by the guard. No finding |
| `isPending()` | reads the other folder's flags: re-offers the migration for B at ≥1 legacy path instead of 20. That is an offer, not a write. Not in the class |
| `detect(root)` | reads the new folder only |
| `reconcile` | guarded in both branches (r7) |
| `applySync` | old manifest's hashes: O4 updates only files holding the exact recorded bytes; Phase 2 trashes only recorded-hash files in the old folder. Claims now come only from the folder's own moves |

No reachable path in the class remains.

## Mutation table

Jest = the six sync and migration files (190 tests). Probes = `sc706r6Probe` + `sc706r8Probe`.

| Mutant | jest | probes | e2e |
|---|---|---|---|
| markSettled reset off (back to "move the root, keep the list") | **1 failed** (the STOPPED-in-A test) | **2 failed** (R6a, R8d) | **D16 FAIL** (manifest holds a hash for the note), **P02 FAIL** (note = "official …") |
| widened guard back to the r5 re-key-only guard | **1 failed** (non-re-key "ANOTHER folder than the manifest's") | 5/5 pass | D16 ok, P02 ok (R8-I3) |

## INFO

- **R8-I1. Mirror-case delay (manifest write failed during a migration into a changed Destination).** The moved files are skipped and reported as "skipped to protect your changes" for one sync, then adopted and updated on the next. That is the same as `71660971`. Against `e783b068` it is one sync slower for the same-rels variant and identical for the other. No action asked. Re-keying the start-of-sync `reconcile` when `state.root` equals the Destination would remove the delay, but it reopens the questions r4 ruled out (pulling a manifest back to a folder the user moved away from), so I do not recommend it for SC-706.
- **R8-I2. `main.ts:940` (`syncAnyway`) and `:961` (`syncAfter`) do not re-check `latest.root !== root`, as the "Existing compendium folder found" callback does.**
  - If the Destination is changed while the migration window is open, "Sync anyway" or "Sync now" syncs into the new folder without the first-sync window. D1(a) and O4 still apply there, so nothing of the user's is overwritten. The miss is only "asks first", and it is outside this sweep's overwrite / claim class.
  - Owner may file it beside SC-643's L1; it is not reported as a finding.
- **R8-I3. The widened guard is defence in depth.** Its non-re-key case (a state for another folder than the manifest's) is reachable only after a failed manifest write, and the resets prevent a claim there. So it is caught by jest only, like r5's guard (r6 R6-I1). No e2e is owed.

## Gates (measured)

| Gate | Result |
|---|---|
| `npm run tsc` | rc 0 |
| `npm run lint` | rc 0 |
| `npx jest` (fresh) | `Test Suites: 1 skipped, 321 passed, 321 of 322 total` · `Tests: 2 skipped, 15018 passed, 15020 total` · rc 0 |
| `npm run e2e` | `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · rc 0 |
| `npm run e2e -- --element=sync` | `OBSIDIAN-E2E done: 91/102 ok, 0 failed, 11 known-bug` · rc 0 |
| styles.css | `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` (worktree = clean `e783b068`) |
| lifecycle | not run (no sync scenario; `src/data` only); carries unverified |

## Working tree

- Plugin: `git status --porcelain` empty, HEAD `17187e4c`.
- Superproject: ` M draw-steel-elements`, HEAD `98b2a527`.
- Gitignored `main.js`/`styles.css` were removed before jest and rebuilt by e2e.
- Probes and mutants ran only in scratch `git archive` copies.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r8-rereview/`:

- **Scripts:** `r8-gate-static.sh`, `r8-gate-e2e.sh`, `r8-probes.sh`, `r8-probes-verbose.sh`, `r8-mut.sh`.
- **Gate logs:** `r8-tsc.log`, `r8-lint.log`, `r8-jest.log`, `r8-static-rc.txt`, `r8-e2e-full.log`, `r8-e2e-sync.log`, `r8-e2e-rc.txt`, `r8-styles-sha.txt`.
- **Probes:**
  - jest probe files `head/test/unit/data/sc706r{4,6,8}Probe.test.ts`;
  - jest logs `r8-probes-head.log`, `r8-probes-71660971.log`, `r8-probes-e783b068.log`, `r8-probes-rc.txt`, `r8-probes-verbose-rc.txt`;
  - e2e probe files `head/e2e/specs/sync/zz-r4-probe.e2e.ts` (P01) and `head/e2e/specs/sync/zz-r6-probe.e2e.ts` (P02);
  - e2e log `r8-e2e-probe-head.log`.
- **Mutants:**
  - source trees `mut-settle/`, `mut-guard/`;
  - logs `r8-mut-jest-{mut-settle,mut-guard}.log`, `r8-mut-probe-{mut-settle,mut-guard}.log`, `r8-mut-e2e-{mut-settle,mut-guard}.log`, `r8-mut-rc.txt`.
