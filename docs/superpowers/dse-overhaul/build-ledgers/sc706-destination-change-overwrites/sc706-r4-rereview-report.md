# SC-706 r4 — scoped re-review of the r3 delta (6961239e..cbdf98d6)

**Executive summary**
- **Verdict: FIX REQUIRED.** Delta reviewed: dse `6961239e..cbdf98d6` and superproject `0e32b647..98b2a527`. The branch is left at `cbdf98d6` (plugin tree clean; superproject only ` M draw-steel-elements`, as found). `origin/develop` is still `e783b068`.
- **Counts:** CRITICAL 0 · HIGH 1 · MEDIUM 0 · LOW 1 · INFO 1.
- **Gates measured:**
  - tsc (both projects) rc 0; lint rc 0.
  - jest fresh: `Tests: 2 skipped, 15011 passed, 15013 total` (321/322 suites), rc 0.
  - e2e full: `OBSIDIAN-E2E done: 934/954 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`, rc 0. SET-X03/X04 both ok this run; the r3 one-off was not seen.
  - e2e `--element=sync`: `89/100 ok, 0 failed, 11 known-bug`, rc 0.
  - styles.css sha256 `50436d6b…e37e98`, identical to the clean `e783b068` build.
- **H1 (O4) is fixed.** The rename probe updates on the first and the second sync. The SC-706 case (the user's own note) and a moved file the user edited both stay skipped. The O4 arm can only overwrite user bytes if the manifest recorded them, which is what R4-H1 below makes happen.
- **M1 (O5) is fixed** for the probed case. The `syncCompendium` start `reconcile(options.root)` is unchanged. `rekey` is passed only by `execute()` (`:491`, `:523`), so a later Destination change is not pulled back.
- **NEW R4-H1 (= F2, HIGH, introduced by r3).** A second migration into a changed Destination claims the user's own note by path. The note sits at a 7.0.0 path an earlier migration moved. The next sync then overwrites it with no copy. Reproduced in real Obsidian (scratch e2e SYNC-P01): red on `cbdf98d6`, green on `6961239e`.
- **F1 → LOW (fold).** A re-keyed manifest keeps the old folder's real tag, so "Check for updates" says up to date while the moved files are at legacy content. The fix is one line.
- **L1/L2 wording:** accurate against the code, except where R4-H1 makes "never overwritten" false until fixed.
- **Mutants:** O4 arm reverted → jest 1 failed, e2e SYNC-D13 FAIL. O5 re-key off → jest 4 failed, e2e SYNC-D14 FAIL. Both are caught.

## Findings

### HIGH

**R4-H1 (r3's F2, ruled newly reachable and worse). A migration into a changed Destination adopts the PREVIOUS folder's whole `state.migrated` list under the new root.**
It claims any file of the user's at those 7.0.0 paths, and the next sync overwrites it.
`src/data/CompendiumMigration.ts:681-684` (the `rekeyed` branch: `files = {}`, `effectiveRoot = root`), looping `state.migrated` at `:686-693`. Reached from `execute()` at `:491` and `:523`. `state.migrated` accumulates across roots: `:492-493` load the old state and only overwrite `state.root`.

- **Scenario.**
  1. The user migrates a pre-7.0.0 compendium in `DS Compendium` and syncs. `state.migrated` now lists about 25 7.0.0 rels with `state.root = DS Compendium`; the manifest root is `DS Compendium`.
  2. They point the Destination at `Legacy B`, which holds another pre-7.0.0 compendium plus a note of their own at one of those 7.0.0 paths (`rule/keyword/abyssal.md`).
  3. The sync offers the migration (D1(b)), and the user runs it.
- **What happens.** The manifest's root differs, so `rekey` starts from `{}` at root `Legacy B` and adopts EVERY rel in `state.migrated`, including the first run's. The user's note is hashed into the manifest as if the plugin had moved it.
- **Next sync.** `manifestHere` and `installedHere` are both true, and the rel is in `files`. Phase 1 calls `modifyBinary` and the user's note is replaced by the release text. There is no window (the manifest is "here" now) and no copy (the migration did not move this file, so it is not in the backup folder).
- **Measured, real Obsidian** (scratch `head/e2e/specs/sync/zz-r4-probe.e2e.ts`, `[SYNC-P01]`):
  - `cbdf98d6`: `R4-PROBE manifest root=Legacy B claims mine=true` · after sync `Legacy B/rule/keyword/abyssal.md = "official rule/keyword/abyssal.md"`, FAIL.
  - `6961239e`: manifest root stays `DS Compendium` · after sync the note reads `"MY OWN notes…"`, ok.
- **Measured, jest** (`sc706r4Probe.test.ts` "PROBE-F2"):
  - `cbdf98d6`: `disciple claimed with MY hash=true`, sync `updated=["career/disciple.md",…]`, note = `"v5 disciple"`.
  - `6961239e`: skipped, note kept.
  - `e783b068`: overwritten (the original SC-706 mechanism).
- **Which call does the damage.** Taking out only the start-of-run re-key (`:491` back to `reconcile(plan.root)`, mutant `mut-o5b`) still overwrites. The adopt path at `:523`, with the accumulated list, does it on its own.
- **Ruling on F2.** It is not "unchanged exposure". On `6961239e` the stale cross-root list was harmless, because adoption stayed keyed to the old manifest root. r3's re-key moves it onto the new folder and turns it into an overwrite of user bytes on a path D1(b) routes users into (also reachable with the Migrate command). That breaks the ticket's guarantee, so SC-706 must fix it.
- **Prescribed fix.**
  - In `execute()`, before the start-of-run `reconcile` (`:491`): when a stored state exists and `normalizePath(state.root) !== normalizePath(plan.root)`, start this run with `migrated: []` (save it). That list describes another folder.
  - Belt and braces, in `reconcile`: when `rekeyed`, adopt only when `normalizePath(state.root) === normalizePath(root)`.
  - Consequence to state in the ledger: an interrupted run in the old folder loses its self-heal record. That folder is no longer the Destination, so this is SC-708 territory.
  - Tests: turn PROBE-F2 into a jest test in `compendiumMigration.test.ts` and P01 into an e2e (`[SYNC-D15]`). Kill check: dropping the reset must turn both red.

### LOW

**R4-L1 (r3's F1, ruled LOW, fold into SC-706). The re-keyed manifest keeps the old folder's real `releaseTag`.**
`src/data/CompendiumMigration.ts` (manifest build, `releaseTag: existing?.releaseTag ?? …`).

- After migrating into a changed Destination, the manifest says `root=New, releaseTag=v4.latest` (PROBE-F1). `checkForUpdates` (`CompendiumSyncService.ts:375-377`) reports `upToDate: true` while the moved files are legacy content. The settings status line names a release that folder never received.
- That breaks the invariant stated in `reconcile`'s own comment: "Never a real data-unified tag … `checkForUpdates` must keep reporting an update available until a real sync has run."
- No data risk. `sync()` does not short-circuit on the tag, and the summary window offers "Sync now".
- Fix: `releaseTag: rekeyed ? \`migrated:${this.map.oldFinalRelease}\` : existing?.releaseTag ?? …`, plus one assertion in r3's "the manifest moves to the migrated folder" test.

### INFO

- **R4-I1.** `docs/compendium-sync.md` and both CHANGELOGs (L1/L2 of r2) read correctly against the code. "Keep everything" plus unedited files keeps updating, which D13 confirms. Edited files are skipped. Old-folder files stay except unedited ones the release dropped, which go to the trash. One gap: "A file of yours at a compendium path in the new folder is never overwritten" is untrue under R4-H1 until it is fixed. No wording change is needed once it is.

## Scope checks (brief §1–§5)

| # | Check | Result |
|---|---|---|
| 1 | H1 per O4: r2 rename probe on `cbdf98d6` | ✔ `updated` on sync 1 and sync 2 (`r4-probes-head.log`) |
| 1 | SC-706 user note / edited moved file / unedited moved file at a changed root | ✔ skipped / skipped / updated (PROBE-O4: `updated=["rule/turn.md"] skipped=["class/shadow.md","kit/panther.md"]`); edited file not tracked |
| 1 | Can the hash rule overwrite user bytes? | Only if the manifest recorded user bytes. Same-root reconcile adopts only moved files; the R4-H1 path records user bytes (and there the root is already "here", so the O4 arm is not even needed) |
| 2 | M1 per O5: r2 migration probe on `cbdf98d6` | ✔ both variants pass (moved files updated) |
| 2 | `reconcile(options.root)` at the start of `syncCompendium` unchanged | ✔ `main.ts:759` untouched in the delta; r3's jest "without the re-key flag … leaves another folder's manifest" passes |
| 2 | `rekey` callers | only `execute()`: `:491` (start of run), `:523` (adopt). See R4-H1 |
| 3 | L1/L2 wording | R4-I1 |
| 4 | F1 / F2 | R4-L1 / R4-H1 |
| 5 | Mutants | table below |

## Mutation table

Jest = the six sync and migration files (183 tests; head 183/183). E2E = `--only=SYNC-D13,SYNC-D14` from the mutant's scratch copy.

| Mutant | Change | jest | D13 | D14 |
|---|---|---|---|---|
| mut-o4 | arm back to `installedHere && oldManifest?.files[rel] !== undefined` | **1 failed** (renamed folder updated in place) | **FAIL** (v2 "1 updated" Notice timed out) | ok |
| mut-o5 | `rekeyed = false && …` | **4 failed** (both re-key describe blocks ×2) | ok | **FAIL** (v4 "25 updated" Notice timed out) |
| mut-o5b | only `:491` back to `reconcile(plan.root)` | not run on the suite; PROBE-F2 still overwrites (R4-H1 lives in the adopt path) | — | — |

## Gates (measured)

| Gate | Result |
|---|---|
| `npm run tsc` | rc 0 |
| `npm run lint` | rc 0 |
| `npx jest` (fresh) | `Test Suites: 1 skipped, 321 passed, 321 of 322 total` · `Tests: 2 skipped, 15011 passed, 15013 total` · rc 0 |
| `npm run e2e` | `OBSIDIAN-E2E done: 934/954 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · rc 0 · SET-X03 ok, SET-X04 ok · SYNC-K12, D11, D12, D13, D14 ok |
| `npm run e2e -- --element=sync` | `OBSIDIAN-E2E done: 89/100 ok, 0 failed, 11 known-bug` · rc 0 |
| styles.css | worktree and clean `e783b068` build both `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` |
| lifecycle | not run (no sync scenario; the delta is `src/data` only); carries unverified |

## Working tree

- Plugin: `git status --porcelain` empty, HEAD `cbdf98d6`.
- Superproject: ` M draw-steel-elements`, HEAD `98b2a527`.
- Gitignored `main.js`/`styles.css` were removed before jest and rebuilt by e2e.
- Every probe and mutant ran in scratch `git archive` copies, never in the worktree.

## Artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r4-rereview/`:

- **Gate scripts:** `r4-gate-static.sh`, `r4-gate-e2e.sh`, `r4-mut.sh`, `r4-probes.sh`, `r4-e2e-probe.sh`.
- **Gate logs:** `r4-tsc.log`, `r4-lint.log`, `r4-jest.log`, `r4-static-rc.txt`, `r4-e2e-full.log`, `r4-e2e-sync.log`, `r4-e2e-rc.txt`, `r4-styles-sha.txt`.
- **Probes:**
  - jest probe file `head/test/unit/data/sc706r4Probe.test.ts`, run with the r2 probes `sc706r2Probe*.test.ts`;
  - logs `r4-probes-head.log`, `r4-probes-6961239e.log`, `r4-probes-e783b068.log`, `r4-probes-rc.txt`, `r4-probe-f2-o5b.log`;
  - e2e P01 spec `head/e2e/specs/sync/zz-r4-probe.e2e.ts`;
  - e2e P01 logs `r4-e2e-probe-head.log`, `r4-e2e-probe-6961239e.log`, `r4-e2e-probe-rc.txt`.
- **Mutants:**
  - source trees `mut-o4/`, `mut-o5/`, `mut-o5b/`;
  - jest logs `r4-mut-jest-{head,mut-o4,mut-o5}.log`, `r4-mut-rc.txt`;
  - e2e logs `r4-mut-e2e-mut-o4.log`, `r4-mut-e2e-mut-o5.log`;
  - failure bundles `mut-o4/e2e/.out/20261127-103931-5646/SYNC-D13`, `mut-o5/e2e/.out/20261127-103955-371e/SYNC-D14`.
