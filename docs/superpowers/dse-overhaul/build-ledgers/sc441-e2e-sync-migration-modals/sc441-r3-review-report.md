# SC-441 r3 independent review: compendium sync + migration windows e2e

## Executive summary

- **Verdict: FIX REQUIRED.** dse `88ea9c87` on `develop` `4b233886`. Reviewer agent: r3 (fresh identity).
- **Findings (test suite):** 0 CRITICAL, 1 HIGH, 5 MEDIUM, 5 LOW, 4 INFO. The HIGH: the tree diff's move inference depends on the order the filesystem lists folders. With sorted order, every complete-run migration scenario goes red (proven).
- **Mutation probes, the brief's 11 classes: 11/11 CAUGHT** (14 caught mutants, plus 1 equivalent mutant that no test can tell apart). Extra probes: a stray hard delete during the trash choice was MISSED by E04/E05. Writes into `.obsidian/` were MISSED by every scenario.
- **Safety: A1 PASS** (guard probe: 95/95 SYNC/CENSUS refused with the O2 message before any other step). **A2 PASS** (trash on `local` and read back, canary in every session; machine trash 0 entries after 2 full + 2 sync-only + ~40 targeted runs; `e2e/vaults` untouched). **A3 PASS** (one network call site, replaced before any sync; unknown URLs get 404 rather than a throw: INFO).
- **Gates:** tsc 0, lint 0; jest `14914 passed / 1 skipped` (the implementer's shots cache is present, so fresh = 14913/2, matches); e2e full #2 `927/947 ok, 0 failed, 20 known-bug, coverage: 539/539 pairs` (494 s). Full #1: `925/947, 2 failed` (SET-X03/X04, the SC-657 flake; both pass alone). Sync only, x2: `84/95 ok, 0 failed, 11 known-bug` each time. No flake on this surface.
- **Product diff:** attributes only (2 window files). No behaviour change.
- **New product bugs: 1, HIGH (loses a user's file).** After one sync, a Destination change syncs into a folder of the user's own notes with no window, and overwrites any of their notes that sits at a release path. Not ticketed; needs a ticket and a `knownBug` marker.
- **Working tree clean: YES** (`git -C …/draw-steel-elements status --short` empty; every probe reverted by named-file checkout).

## Findings by severity

### HIGH

**H1. On another machine, the tree diff can blame a migration's moves on its backup copies.** `e2e/driver/sync.ts:158` and `:163`.
- `diffTrees` pairs each removed path with the FIRST created path that has the same hash. It searches `created` in `fs.readdirSync` walk order.
- A migration creates two files with the old file's bytes: the backup copy `DS Compendium backup (pre-7.0.0)/<old>`, and the moved file `DS Compendium/<new>` (same bytes as the old path, because a move keeps bytes).
- So which one counts as the "move" depends on how the vault root lists `DS Compendium` against `DS Compendium backup (pre-7.0.0)`:
  - ext4 orders entries by name hash, and the hash seed differs per filesystem.
  - APFS returns names sorted.
  - tmpfs returns its own order.
- **Shown:** probe `.sort()` on `created` (the order a sorted listing gives). SYNC-M28, M30 and M10 all FAIL with the moved files reported as created and the backups as moves (`sc441r3-e2e-sortorder.log`). The same holds for every `completeRun` user: M10..M15, M28, M30..M37, L01..L04, R05, M18.
- **Impact:** the gate is "required to land" (Scott, SC-408). On another of Scott's machines it could be red at a clean head.
- **Fix:** make the inference order-independent:
  - Match the moves the scenario names first: for each `expected.moved[from] = to`, accept when `from` was removed and `to` was created with the same hash.
  - Infer the remaining moves only from what is left, over sorted lists.
  - Alternatively, compare a sorted multiset of `(hash, path)` and never infer.

### MEDIUM

**M1. The SC-653 markers do not encode what either of Scott's options, or the ticket's posted plan, would ship.** `e2e/specs/sync/known-bugs.e2e.ts:42`, `:47-58`; `test/dom/framework/syncCompendiumBugs.test.ts:282-286`.
- K01 waits for the "Existing compendium folder found" window. Under option (ii), refuse with a Notice, no window opens.
  - Probe `sc653ii`: K01 → `known bug SC-653 failed differently than pinned … timed out waiting for the window "Existing compendium folder found"`. The plain test the fixer would write from it fails the same way.
  - Under option (i) (probe `sc653i`: no trash button), K01 → `appears fixed` (correct).
  - The brief requires the scenario to hold under BOTH options.
- K02 asserts "no trash button OR the window says permanent". The jest twin asserts "says permanent".
  - SC-653's posted plan (ledger O13 BUG-9) is: the folder always goes to the vault's `.trash`, never a permanent delete.
  - Probe `sc653plan` (`vault.trash(root, false)`): K02 stays `known-bug` and would never flip. E09 goes red.
- **Fix:**
  - K01: after `palette.sync()`, wait for EITHER the window OR a Notice. Fail only when a trash button is offered for that folder.
  - K02 and its jest twin: accept "no trash button", OR "the window says permanent", OR "after the trash choice under `none` the folder's files are under `.trash/`" (which needs the click; inside the disposable vault).

**M2. The error-screen setup leaks into later scenarios.** `e2e/driver/syncMigration.ts:96`; `e2e/driver/sync.ts:519-541`.
- `reachError()` replaces `plugin.migrationService.execute` page-side. Nothing restores it: `resetSyncTree` resets only `mapOverride`.
- It works today only because the error describe is last in its file and last in `census.e2e.ts`.
- **Shown:** with the describes of `migration-run.e2e.ts` reversed, M23..M27 pass, then M16 and M10 FAIL with `timed out waiting for the window "Moving your compendium…"` (`sc441r3-e2e-reversed-run.log`). The first full reversed `--element=sync` run had the same M16..M21 failures (`sc441r3-e2e-reversed.log`).
- **Fix:** `resetSyncTree()` (or `hold.clear()`) runs `delete plugin.migrationService.execute` (an own property over the prototype method), as `hold.clear()` already does for `renameFile` / `createBinary`.

**M3. The tree snapshot cannot see `.obsidian/` apart from 4 named files.** `e2e/driver/sync.ts:93`, `:104-107`.
- Everything under `.obsidian/` is ignored except `data.json`, the manifest (+`.tmp`) and the migration state. A product write anywhere else in the config folder passes every scenario: a new file in the plugin's own folder, a change to `app.json`, a compendium written into `.obsidian/` (SC-700).
- Also, any folder NAMED `.obsidian` at any depth is skipped, e.g. `DS Compendium/x/.obsidian/…` from a zip entry (`isUnsafeRelativePath` allows dot segments).
- **Shown:** probe `obs` (the sync also writes `.obsidian/plugins/draw-steel-elements/sync-cache.json` and `.obsidian/stray-from-sync.md`): S01 and R01 both pass (MISSED; `sc441r3-e2e-mut-obs.log`).
- The pristine check is blind to the same area, so leftovers from D09 / K09 are invisible to the next test.
- **Fix:**
  - Snapshot `.obsidian/` too, with a NAMED volatile allowlist: `workspace.json`, the `app.json` keys the harness sets (compare `app.json` with `trashOption` / `alwaysUpdateLinks` stripped), `appearance.json`, the staged `main.js` / `styles.css` / `manifest.json`.
  - Match `.obsidian` only at the vault root.

**M4. The two trash-by-button scenarios do not check the whole tree.** `e2e/specs/sync/legacy-window.e2e.ts:95-115`. The scenarios are E04 / E05, the highest-consequence pairs on the surface.
- `trashChoice` checks named files and the count under `.trash/`. It never calls `expectChange` / `expectDiff`.
- **Shown:** probe `iic` (the trash branch also hard-deletes `Stamina/dying.md`, outside the folder): E04 and E05 PASS (MISSED). E09, which does use `expectChange`, catches it (`sc441r3-e2e-mut-iic.log`).
- O4 requires the exact difference on every scenario.
- **Fix:** `t.expectChange({ moved: {…3 files → their observed .trash paths}, created: {2 release files + manifest}, modified: {class/shadow.md: 'shadow A'}, dirsCreated: […] })`, with the `.trash` layout pinned once it is observed (S02 already pins the flat layout for a file).

**M5. A scenario that leaves a migration running breaks the next scenario.** `e2e/driver/sync.ts:572-573`; `e2e/specs/sync/known-bugs.e2e.ts:107-109`, `:124-126`.
- `startSyncTest` calls `hold.clear()`, which RELEASES a held run, and then `resetSyncTree()` straight away.
- The released run carries on, moves, and writes its report note at the vault root. `resetSyncTree` removes folders, `.trash`, the manifest and the state, but not root files. So the pristine assertion fails, or races.
- **Shown:** during the census probe, CENSUS-37 failed mid-run and CENSUS-38 then failed with `the vault copy is not pristine … stray file Draw Steel Elements migration report 2026-11-27 0617.md` (`sc441r3-e2e-census-inject.log`). Alone, CENSUS-38 behaved correctly.
- The same tail race exists by design in K05: its `finally` releases the hold and returns without waiting for the run, and K06 starts right after. It did not fire in 2 full + 2 sync runs, so it is a latent flake, and a mask for a real red.
- **Fix:**
  - `hold.clear()` first sets the window's abort (or the test's own Stop).
  - `startSyncTest` waits for the run to finish: no `.modal-container` left, and the migration-state file stable.
  - `resetSyncTree` also deletes vault-root files not in the fixture (report notes).
  - K05 / K06 wait for the `stopped after moving` Notice in `finally`.

### LOW

- **L1. D08 and D09 assert nothing, and D10 does not check what its title claims.** `known-bugs.e2e.ts:197`, `:210`, `:213-228`. D08 and D09 assert `length >= 0`. D10 says "writes nothing" but only LOGS the diff; it asserts only `Notes.md`'s bytes. Fix: D10 `await t.expectChange({})`. D08 / D09 pin the observed writes (3 files under `.trash/…` / `.obsidian/{class,rule,kit}`), so they go red when SC-700 changes the behaviour (K09 is the marker).
- **L2. M03 and M07..M09 would catch a dismissal that falls through into a sync only through the page-error check.** `migration-preview.e2e.ts:53-63`, `:116-148`. They publish no release and never assert `fixtureRelease.calls()`. Under mutant `iii`, M02 failed on the tree; M03 / M07 / M08 / M09 failed only on the page-error invariant (the fallen-through sync's 404 `console.error`). Fix: `publishNewTree(f.pairs)` plus `expect(await fixtureRelease.calls()).toEqual([])` in each.
- **L3. M10 waits 10 s for nothing.** `migration-run.e2e.ts:42`. `await noWindows().catch(() => dismiss('stopped', 'x'))` always times out (the stopped window is open), so M10 takes ~12 s against ~1.7 s for M11. The `migration.stopped.x` credit then comes through a timeout path. Fix: `await dismiss('stopped', 'x'); await noWindows();`.
- **L4. K09 never reaches `.obsidian`.** `known-bugs.e2e.ts:154-164`. The loop throws on the first Destination (`.trash`), so `.obsidian` is not exercised until `.trash` is fixed. Fix: collect both outcomes, then throw once.
- **L5. K10 checks only half of SC-702, with a loose pattern.** `known-bugs.e2e.ts:167-176`. It asserts only the preview half of SC-702, with `/…|prompt|setting/i`, so unrelated wording ("settings") would flip it. L04 pins the summary half as current behaviour, so the fix is still forced. Fix: match a specific phrase the fix must add, or check `getConfig('alwaysUpdateLinks') === false` and look for that setting's name.

### INFO

- I1. The fixture stub answers unknown URLs with 404 instead of throwing (`sync.ts:246`). Unreachable network either way: `syncService.requestUrlFn` is the only request site in `src/` and `main.ts`, and every scenario replaces it before any sync.
- I2. `assertDisposableVault` falls back to `os.tmpdir()` (`/tmp`) when TMPDIR is unset (`sync.ts:42`), i.e. outside `run.mjs`. Every other check still applies (staged plugin dir, not the repo / fixture / `demo-vault` / home).
- I3. Mutant `xic` ("Not now" reduced to `this.close()`) is equivalent: `onClose` declines the same way. M02 / M03 / M06 correctly pass.
- I4. The fixed sleeps are small and bounded: `settled()` polls 150 ms apart until two snapshots match; L04 sleeps 300 ms between Obsidian's prompts.

## Mutation-probe table

Mutant definitions: `sc441r3-mut.py`. Runner `sc441r3-probe.sh` applies one mutant, runs `--only`, then reverts each product file by name. `status --short` was empty after every probe.

| # | mutant | tests run | result |
|---|---|---|---|
| i | "Keep everything" also trashes (`trashOldRoot \|\| true`) | E02, E03, R03 | CAUGHT ×3 (Notice `3 new` instead of `2 new`) |
| ii-a | trash also trashes the sibling `DS Compendium Notes` | E04, E05, E09 | CAUGHT ×3 (E04/E05 count 4 ≠ 3; E09 tree) |
| ii-b | trash trashes nothing | E04, E05, E09 | CAUGHT ×3 |
| ii-c (extra) | trash also hard-deletes `Stamina/dying.md` | E04, E05, E09 | **E04, E05 MISSED**; E09 CAUGHT (tree) |
| iii | a decline (Not now / Escape / X / backdrop) falls through into a sync | M02, M03, M07, M08, M09 | CAUGHT ×5 (M02 tree; the others only by the page-error invariant: L2) |
| iv | the run also moves the unmapped user note | M28, M10, M30 | CAUGHT ×3 (tree: `My own note.md` moved) |
| v | the plan and the run overwrite an occupied destination | M37, CENSUS-38 | CAUGHT ×2 (M37 tree: occupant modified; CENSUS-38 lost the `blocked` list) |
| vi | the backup of a modified file is skipped | M28, M10, M12 | CAUGHT ×3 |
| vii | Stop ignored (`aborted` not set) | M10, M11, M12 | CAUGHT ×3 |
| viii | sync trashes a user-modified file removed upstream | S02 | CAUGHT (Notice `2 removed`) |
| ix | sync writes `kit/*` at the vault root | S01, D02 | CAUGHT ×2 (tree) |
| x | sync appends to every non-release note in the Destination | R01, S02, R03 | CAUGHT ×3 (tree) |
| xi-a | "Keep everything" handler reduced to `close()` | E01, E02, E03 | CAUGHT by E02, E03 (E01 drives no button) |
| xi-b | "Sync the compendium now" reduced to `close()` | M32, M33 | CAUGHT ×2 |
| xi-c | "Not now" reduced to `close()` | M02, M03, M06 | equivalent mutant (same behaviour through `onClose`), passes correctly |
| xi-d | error-screen Close handler deleted | M23, M24 | CAUGHT ×2 |
| obs (extra) | sync writes `.obsidian/plugins/draw-steel-elements/sync-cache.json` + `.obsidian/stray-from-sync.md` | S01, R01 | **MISSED** (M3) |
| sc653ii | SC-653 option (ii): refuse with a Notice | K01 | marker does NOT hold (timeout) (M1) |
| sc653i | SC-653 option (i): no trash button | K01 | `appears fixed` (correct) |
| sc653plan | SC-653 posted plan: always `.trash` | K02, E09 | **K02 stays known-bug** (never flips) (M1); E09 red |
| census | un-id'd `<button>` + click listener in the legacy window and all 4 migration render paths | jsdom `e2eCensus.test.ts`; CENSUS-35..40 | jsdom: 8 failed (legacy, preview, running, error, summary, stopped, the bite test, the no-sharing test), each `no data-dse-control: <button> SC441R3 census probe`. Real Obsidian: 35, 36, 37, 39, 40 report it; 38 reports it when run alone (in the batch it failed first on the M5 cascade) |
| order | describes reversed in `migration-run` (and in 3 more spec files, full sync run) | M23..M27, M16, M10 | **M16, M10 FAIL** after the error describe (M2) |
| sort | `created.sort()` in `diffTrees` (a different directory order) | M28, M30, M10 | **all FAIL** (H1) |

Every jest `test.failing` in `syncCompendiumBugs.test.ts` was run as a plain `test`: 11 failed / 11 passed. Each failure is an assertion on the ticket's own claim (no TypeError, no timeout): SC-694, 695, 357, 696, 697, 698, 699, 700 ×2, 653, 701 (`sc441r3-jest-bugs-unfailing.log`). Every e2e `knownBug` ran as known-bug in both full runs.

## Safety (A1-A3)

- **A1. Guard: PASS.**
  - By reading: every `it` / `knownBug` in `e2e/specs/sync/*` reaches `startSyncTest()`, through `openWindow` / `legacyFixture` / `summary` / `stopped` / `errorScreen` / `failedSync` / `refusedDestination` and friends. G01 calls `assertDisposableVault()` directly, before its canary.
  - `startSyncTest` runs the guard second, after only `dse.openNote` (the runner's own fixture reset). That is before `setTrash`, the canary, `hold.clear`, `resetSyncTree` and the fixture release.
  - By probe: `tmp = real(os.homedir())` in the guard → `--element=sync` `0/95 ok, 95 failed`. All 95 FAIL lines read `O2: the open vault /tmp/dse-e2e-…/shipped-… is not under this run's temp dir /home/scott`, with 0 other failure messages (`sc441r3-e2e-a1guard.log`).
- **A2. Trash: PASS.**
  - `setTrash` writes `'local'` (`'none'` only in G03, E09, K02) and reads it back, throwing otherwise.
  - The canary runs in every spec session before any trash (once per worker, module-level flag; SYNC-G01 logs it).
  - `~/.local/share/Trash/files` and `info`: 0 entries before the review, after full #1, after full #2 and after all probes. There is no `/tmp/.Trash-1000`.
  - `git status --short` in dse is empty after every run, so `e2e/vaults/**` is untouched.
- **A3. Network: PASS.**
  - `src/` and `main.ts` have one request site, `CompendiumSyncService.requestUrlFn` (`CompendiumSyncService.ts:381`, `:401`).
  - `fixtureRelease.install()` replaces it in every `startSyncTest`, before any sync. No sync spec reloads the plugin. E11's `openEditor` network guard leaves a stubbed service alone.
  - The fixture answers unknown URLs with 404 instead of throwing (I1).

## Coverage honesty

- The flake #2 run's `coverage.json` was checked pair by pair. Every one of the 53 SC-441 pairs (plus the host pairs and the 2 entry points) has at least one PLAIN driver.
- Each pair's plain driver asserts the tree after the drive (`expectChange` / `expectSince`), except two:
  - `migration.stopped.x` is credited by M21 (asserts) and by M10 through a timeout path (L3).
  - `sync.legacy.trash` × click / Enter: E04 / E05 do not diff the whole tree (M4); E09 does, for click.
- No pair is credited by a helper that leaves the control alone. Phases are credited correctly (M19's `preview.escape` is at the fresh preview).
- No ids are built from template strings in titles. No bracketed ticket ids appear in titles.
- Ledger O5 (confirm / cancel / close on every window and phase, plus the five re-runs) and O14 Q3 / Q6: all present.
- Allowlist: `data.json` and the manifest are NOT allowlisted (they are tracked). The rest of `.obsidian/` is, wholesale (M3).

## New product bugs

**NB-R3-1, HIGH: after one sync, changing the Destination folder pours the compendium into the new folder with no warning, and overwrites the user's own notes there.**
- **Repro** (real Obsidian 1.14.4, temporary probe SYNC-Z01, reverted):
  1. Sync release v1 into `DS Compendium` (3 files incl. `class/shadow.md`).
  2. The user has their own note `Notes/class/shadow.md` (and `Notes/Session 1.md`).
  3. Set Destination to `Notes`.
  4. Run Sync.
- **Result:**
  - No window opens. Notice: `compendium v1 synced — 2 new, 1 updated, 0 removed.`
  - `Notes/class/shadow.md` now holds `shadow A`. The user's text exists nowhere in the vault: no backup, not in `.trash`.
  - Tree diff: modified `Notes/class/shadow.md` and the manifest; created `Notes/kit/panther.md`, `Notes/rule/combat/turn.md` (`sc441r3-e2e-z01.log`).
- **Cause:**
  - `src/data/CompendiumSyncService.ts:214`: `oldManifest?.files[relativePath] !== undefined` takes a file at `<NEW root>/<rel>` for "we installed it" without checking `oldManifest.root === options.root`. Phase 2 (`:237`) does resolve against the old root.
  - `main.ts:765`: the "Existing compendium folder found" check runs only when `manifest === null`, so a non-empty new Destination never gets it once any sync has happened.
- **What the user loses:** any note of their own in the new Destination folder whose path matches a release file, overwritten with no copy. Beyond that, the whole compendium is written into their folder without asking.
- Not covered by the implementer's 11 integrity probes (they varied file state under a fixed root). Not SC-694 (that one is a file the plugin installed). Needs a ticket and an e2e `knownBug` per O8: "a Sync into a changed Destination never overwrites a file the plugin did not install there, and asks first if the folder holds files".

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`)

| gate | log | summary |
|---|---|---|
| tsc (incl. `tsc -p e2e`) | `sc441r3-tsc.log` / `.rc` | rc 0, no output |
| lint | `sc441r3-lint.log` / `.rc` | rc 0 (only the `.eslintignore` deprecation warning) |
| jest full | `sc441r3-jest-full.log` / `.rc` | rc 0, `Test Suites: 1 skipped, 320 passed` · `Tests: 1 skipped, 14914 passed, 14915 total` (84 s). Shots cache present → equals 14913/2 fresh |
| e2e full #1 | `sc441r3-e2e-full1.log` / `.rc` | rc 1, `925/947 ok, 2 failed, 20 known-bug, coverage: 537/539 pairs` (537 s, loadavg ~12). Fails: SET-X03 `timed out waiting for the picker to filter to Settings/token.svg`, SET-X04 (cascade): SC-657 flake |
| SET-X03, SET-X04 alone | `sc441r3-e2e-setx.log` | `2/2 ok` |
| **e2e full #2** | `sc441r3-e2e-full2.log` / `.rc` | **rc 0, `OBSIDIAN-E2E done: 927/947 ok, 0 failed, 20 known-bug, coverage: 539/539 pairs`** (494 s). Matches the implementer |
| sync only ×2 | `sc441r3-e2e-flake1.log`, `-flake2.log` | `84/95 ok, 0 failed, 11 known-bug` each (61 s, 62 s) |
| alone | `sc441r3-e2e-alone-SYNC-*.log` | M18, K05, E09, M37, D09, L04, R05, M12, K09: all pass alone |

Lifecycle, shots, freeze and parity were not re-run: the product diff is attributes only (`control:` on 11 footer buttons; `pathSection(control, …)` → `collapsible({control})` → `stampControl` only).

## Evidence artifacts

- Scripts: `sc441r3-mut.py` (mutants), `sc441r3-probe.sh`, `sc441r3-e2e.sh`, `sc441r3-census-inject.py`, `sc441r3-reverse.py`, `sc441r3-z01.ts.txt` (the NB-R3-1 probe scenario), `sc441r3-tsclint.sh`, `sc441r3-jest.sh`, `sc441r3-census-jest.sh`, `sc441r3-jest-bugs.sh`
- Probe logs: `sc441r3-e2e-a1guard.log`, `sc441r3-e2e-mut-{i,iia,iib,iic,iii,iv,v,vi,vii,viii,ix,x,xia,xib,xic,xid,obs,sc653ii,sc653i,sc653plan}.log` (+ `.rc`, `sc441r3-mut-*.diff` / `.status`), `sc441r3-census-jest.log`, `sc441r3-e2e-census-inject.log`, `sc441r3-e2e-census-inject38.log`, `sc441r3-e2e-reversed.log` (the run killed by my 170 s wrapper after wdio finished; per-test lines missing, wdio errors present), `sc441r3-e2e-reversed-run.log`, `sc441r3-e2e-sortorder.log`, `sc441r3-e2e-z01.log`, `sc441r3-jest-bugs-unfailing.log`
- All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`

## Working tree

`git -C /home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals/draw-steel-elements status --short` is empty at the end, at head `88ea9c87`. The superproject shows only ` M draw-steel-elements` (the branch pointer), as it did at the start. Nothing was committed.
