# SC-643 r2 — independent adversarial review

## Executive summary

- **Verdict: LAND.** No HIGH findings. One MEDIUM is a landing hazard with SC-440, not a defect in this branch. Head `9724c190` on dse develop `8a81c5a7`; `origin/develop` is still `8a81c5a7`.
- The ticket's Expected holds, in real Obsidian 1.14.4 and in the mocks. With `''` or `'   '`, Sync looks up the release for `DS Compendium`, opens no window and trashes nothing. `/`, `.`, `./`, `//`, `Stamina/..` show the "Destination folder" Notice, with no lookup, no window and no trash. No vault file was added or removed.
- The guard does not depend on `normalizePath`. The real `normalizePath` (decompiled from the cached 1.14.4 asar) differs from the jest mock on `./`, `./.`, `./x` and NBSP, so a guard built on it would have passed in jest and failed in real Obsidian. The resolver has its own segment logic, which agrees with real Obsidian on all 42 inputs probed.
- Gates on the head: tsc 0, lint 0. Jest gives 12645 passed / 4 skipped; the 2 extra skips are `token-coverage`, which skips by location in a /tmp worktree, so this equals 12647 / 2 measured inside the workspace. First full e2e run: 477/500 with 1 failure, INIT-W10, under load 30 on an unrelated surface; it passed 3 of 3 alone. Second full run: `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`.
- Mutations: 24 of 28 caught. The 4 survivors are untested defence-only guards: the `syncAnyway` and `syncAfter` re-reads, the `offerMigration` guard, and the `detect` guard, which is redundant anyway.
- **MEDIUM M1:** SC-440's `test/dom/views/settings-matrix.test.ts:483` calls `syncOptions().releaseTag`. SC-643 makes `syncOptions()` nullable, so the two branches together fail tsc with TS2531, measured. Whichever lands second must fix it.
- LOW: (1) If the setting is changed to a different real folder while the legacy window is open, Sync trashes the old folder and then syncs into the new one without that folder's first-sync check. (2) Untested guards. (3) No CHANGELOG bullet or docs line yet.
- r1 follow-up 3 (old manifest `root: ""`): safe. The next Sync trashes only manifest-tracked, unmodified files that are gone upstream, and leaves the rest of the old tree orphaned at the vault root. That is the existing behaviour for any root change.
- Judgment: **yes, file a ticket.** Any non-empty user folder named as the Destination on a first sync gets "Move old compendium to trash". It takes one click with no confirmation, and with Obsidian's "Permanently delete" option it is not recoverable (real `trashFile` → `vault.delete`).

## Scope and method

- Read: ledger D1-D5, r1 report, `git diff 8a81c5a7..9724c190`, the dse-verify skill (lines 1-240).
- Scratch only, all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r2-review/`:
  - `probe-wt`: detached worktree at `9724c190`. Gates ran here.
  - `probe-mut`: detached worktree at `9724c190`. Mutations, the revert run, and the jest probe files, which are not committed.
  - `probe-e2e`: a scratch clone of SC-440 head `e4e2be2f` with the SC-643 source diff applied, plus the real-Obsidian probe spec, which is not committed.
- The branch worktree, the main checkout and the SC-440 worktree are byte-identical before and after (`git status --porcelain --ignored`). One side effect: `probe-wt` and `probe-mut` now appear in the sc643 module repo's `git worktree list`. I did not remove them because the brief forbids rm.

## Findings

### HIGH

None.

### MEDIUM

**M1. Landing hazard: SC-440 and SC-643 together fail tsc.** Location: `test/dom/views/settings-matrix.test.ts:483` on SC-440 head `e4e2be2f`.

- Measured: `npm run tsc` on SC-440 with the SC-643 source applied gives `test/dom/views/settings-matrix.test.ts(483,10): error TS2531: Object is possibly 'null'.`
- The offending line is `expect(loaded.plugin.syncOptions().releaseTag).toBeUndefined();`. SC-643 changed `main.ts:677` to `syncOptions(): SyncOptions | null`. Line 480 compiles and still passes at runtime: `'Rules/Draw Steel'` resolves to itself.
- The ledger's Cross-effort section records SET-C03 flipping, but not this break.
- Failure scenario: whichever of SC-440 and SC-643 lands second fails tsc, which is gate 1.
- Fix: whoever lands second changes line 483 to `loaded.plugin.syncOptions()?.releaseTag` (or `!.releaseTag`). Record it next to SET-C03 in the ledger.

SET-C03 itself does flip. In real Obsidian, `''` typed into the field gives a lookup, no window and no trash (R2P-01 below).

### LOW

**L1. A different real folder entered while the legacy window is open: the old folder is trashed and the new one synced without its first-sync check.** Location: `main.ts:799-812`.

- D2 is respected: a change to the vault root while the window is open is refused, and that case is tested. But the callback re-reads the setting (`latest`) while it still trashes the captured `root`.
- Probe (`zzSc643R2PluginProbe`, "setting edited to a DIFFERENT real folder"): the setting is `''`, so the window opens for `DS Compendium`. While it is open, the user types `Notes`, then clicks the trash button.
  - Result: `trashedPaths ["DS Compendium"]`, the manifest root becomes `Notes`, and `Notes/rule/turn.md` and `Notes/Welcome.md` are created inside the user's notes folder.
  - `Notes` never got its own "existing folder" check.
  - Nothing at the vault root was touched. The folder that was trashed is the one the window named.
- Fix: in the callback, when `latest.root !== options.root`, show a Notice ("the Destination folder changed while this window was open — run Sync again") and do nothing. Add a jsdom test for that case.

**L2. Untested guards (mutation survivors).**

| Mutant | Location | Result | Why it matters |
|---|---|---|---|
| M12 | `main.ts:905-906` (`syncAnyway` re-read) | all 152 tests still pass | no test |
| M13 | `main.ts:917-918` (`syncAfter` re-read) | all 152 tests still pass | no test |
| M14 | `main.ts:847-850` (`offerMigration` vault-root guard) | all 152 tests still pass | defence only; both callers pass a resolved root |
| M19 | `src/data/CompendiumMigration.ts:345-347` (`detect` guard) | all 152 tests still pass | the guard is redundant: without it `detect('')` builds the prefix `//` (in real Obsidian too) and counts 0. The test passes on zeros alone, so it is vacuous for this guard. |

- Fix: add a jsdom test where the setting changes to `/` while the CompendiumMigrationModal is open, and `syncAnyway` / `syncAfter` are then called: Notice, no `sync`, no `markSettled`.
- Fix: add a direct test that `(plugin as any).offerMigration('')` shows the Notice and calls no `plan`.
- Either delete the `detect` guard or keep it and note that it is belt-and-braces.

**L3. User-facing change without a CHANGELOG bullet or docs line.**

- The ledger says r1 follow-up 2 (whole-value trim) is "noted in the CHANGELOG bullet". There is no SC-643 bullet in the worktree's `CHANGELOG.md` yet, and r1 made no CHANGELOG edit.
- `draw-steel-elements/docs/compendium-sync.md:35-38` says "Default value: `DS Compendium`". It does not say that an empty field uses it, or that the vault root and paths outside the vault are refused.
- Fix: the owner adds both at landing.

### INFO

**I1. r1 follow-up 3, old manifest `root: ""`, probed on the fake vault** (`zzSc643R2Probe`, 3 tests, green).

- Setup: the old manifest tracks `rule/turn.md` (still upstream), `rule/removed.md` (gone upstream, unmodified), `rule/edited.md` (gone upstream, user-edited) and `Welcome.md` (a user file with the same name). All of them sit at the vault root, beside user notes. The next `applySync` targets `DS Compendium`.
- Result: `trashed ["rule/removed.md"]` and nothing else changed. `rule/edited.md` and `Welcome.md` → `keptModified`; `rule/turn.md` is orphaned at the root, neither updated nor trashed; the new files go under `DS Compendium/`.
- `applySync` phase 2 (`CompendiumSyncService.ts:237-250`) only trashes `TFile`s, never folders, and only when the hash matches the manifest entry.
- Worst case: a user file at a manifest path that is byte-identical to the tracked content is trashed. This is the same as any root change since F2.
- `reconcile` with manifest root `""` adopts nothing and writes nothing. Before the fix it looked up `state.migrated` paths at the vault root. That could adopt a user note sitting at such a path, and the next Sync would then overwrite it. The guard is strictly safer.
- Residual: `reconcile` prefers the manifest root over the current root (`CompendiumMigration.ts:677`; this predates the branch). So with manifest root `""` followed by a migration run in `DS Compendium`, the moved files are not adopted. A cleanup or migration ticket for "stale manifest root ≠ current destination" would cover both this and the orphaned root tree. Nothing destructive.

**I2. Real vs mock `normalizePath`, and the resolver.**

- Source: `obsidian-1.14.4.asar` `app.js` (the same as r1's 1.15.1): `Fl(e)=xl(Rl(e)).normalize("NFC")`. `Rl` collapses `[\\/]+` to `/`, strips leading and trailing `/`, and turns `""` into `"/"`. `xl` maps NBSP and NNBSP to a space.
- Real `vault.getAbstractFileByPath` is a raw `fileMap` lookup. The root `TFolder` has `path === "/"` and `isRoot() { return "/" === this.path }`.
- Full table: `inputs-r2.out` (path below). Key rows:

| input | resolver (this branch) | real normalizePath | mock | old code: root was vault root? |
|---|---|---|---|---|
| `''` | folder `DS Compendium` | `/` | `/` | yes (the bug) |
| `' '`, `'   '`, `\t`, `\n`, ` \t\n `, NBSP, NNBSP, U+3000, U+2003, U+FEFF, U+2028 | folder `DS Compendium` | unchanged (not root) | same (NBSP/NNBSP differ) | no |
| U+200B (zero-width space) | folder `"\u200B"` | unchanged | same | no |
| `/`, `//`, `///`, `\`, `\\` | REFUSED root | `/` | `/` | yes |
| `.` | REFUSED root | `.` | `.` | no |
| `./` | REFUSED root | `.` | `/` (**differs**) | no |
| `./.` | REFUSED root | `./.` | `.` (**differs**) | no |
| `..`, `../x`, `a/../..` | REFUSED outside-vault | unchanged | same | no |
| `DS Compendium/..`, `a/b/../..`, ` . `, ` / ` | REFUSED root | unchanged | same | no |
| `/ /` | folder `' '` | `' '` | same | no |
| `. /` | folder `'. '` | `'. '` | same | no |
| `DS Compendium/`, `/DS Compendium` | folder `DS Compendium` | `DS Compendium` | same | no |
| `./DS Compendium` | folder `DS Compendium` | `./DS Compendium` | `DS Compendium` (**differs**) | no |
| `a/./b` | folder `a/b` | `a/./b` | same | no |
| `' My Compendium '` | folder `My Compendium` (trimmed, follow-up 2) | unchanged | same | no |
| `C:\x` | folder `C:/x` | `C:/x` | same | no |

- In the old code, only `''` and separator-only values gave the vault root.
- The new code never hands a refused or root path to `normalizePath` before the decision. Every `normalizePath` call downstream receives a resolved, non-empty folder, which cannot normalize to `/`. So the jest/real difference cannot hide a bypass.
- `/ /` → a folder named `' '`. On Windows, Obsidian's `checkPath` throws "File names cannot end with a dot or a space." when Sync creates it, so it fails loudly and is not the root.
- Interior NBSP (`DS\u00A0Compendium`): Sync writes `DS Compendium` with a plain space (real `normalizePath`). The readers in `refs.ts:110-120` and `ReferenceResolver.ts:132-142` look up the raw path without `normalizePath`, so they miss. This predates the branch and needs a hand-typed NBSP. `SccResolver` normalizes, so it agrees with Sync.

**I3. Pre-fix red count.** With `main.ts src/data src/framework src/refs src/utils src/views` reverted to `8a81c5a7` (resolver kept), 67 of the 152 tests in the 7 branch test files fail; r1 reported 62. My 25 probe tests also fail (18 of 25) on the reverted code and pass on the head.

**I4. INIT-W10 in the first full e2e run.**

- Failure: `[INIT-W10] … one Notice`: `noticeCount()` expected 1, received 0 (`outside-edit-window.e2e.ts:212`). Load average was about 30, with a concurrent e2e run (sc625) and my mutation jest runs.
- The test passed 3 of 3 alone (`--only=INIT-W10`, load 21-30), and the second full run is clean.
- The surface is initiative outside-edit; nothing SC-643 touches. Bundle copied to `evidence-INIT-W10/`.
- Likely cause, not proven: `waitNotice` plus a 2500 ms pause outlasted the Notice's default lifetime on a starved host. Worth a ticket only if it recurs.

## Probes by brief item

1. **Every path to `trashFile` / migration / sync** (all in `main.ts`):
   - Command-palette Sync and the Settings Sync button both call `syncCompendium()`; `compendiumInsert` also routes there. All go through `requireSyncOptions()` (`main.ts:723-727`).
   - The Migrate command: `migrateCompendium()` at `main.ts:831`.
   - `offerMigration` (guard at 847). Its callbacks `syncAnyway` and `syncAfter` re-read the setting; `finishRemaining` re-enters the guarded `offerMigration`; `decline` calls the guarded `markDeclined`.
   - The legacy window choice: re-reads the setting, guards the trash site, and acquires the lock first.
   - Service: `sync()` guard, `applySync()` guard. Phase-2 `trashFile` only receives `TFile`s.
   - `detect`, `plan`, `execute`, `reconcile`, `markDeclined`, `markSettled` are all guarded.
   - The vault root cannot reach `trashFile` by any path I found. A setting changed to the root while a window is open is refused: tested, and my probe "Keep everything" also syncs nothing and releases the lock. A change to a *different real* folder is L1.
2. **Inputs:** see I2 and `inputs-r2.out`.
3. **D1 consistency:** with `''`, `syncOptions().root`, the `detect` argument, the migration plan root and the manifest root are all `DS Compendium`. `refs.ts`, `ReferenceResolver.ts` and `SccResolver.ts` all use `compendiumFolderPath()`, so they agree. The stored setting stays `''` (real Obsidian R2P-01: `setting ""`; jsdom probe the same). `visual-harness/entry.ts:2049` is harness seeding only (ledger: drop).
4. **Integrity:**
   - Fake-vault `applySync` with `''`, `'   '`, `\t`, NBSP and U+3000: every user file is byte-identical (hex compare), additions are only under `DS Compendium/`, and nothing is trashed.
   - The real plugin `syncCompendium()` with the real `sync`/`applySync` (release, download and zip stubbed) for `''`, `'   '`, `\t`, `\n`: the same.
   - 11 root/outside forms: the vault snapshot is unchanged, no lookup, no window, no trash, no manifest, and Migrate does not plan.
5. **Tests are real.** Revert: 67 red. Mutations:

| id | mutant | branch tests red (of 152) |
|---|---|---|
| M01 | drop `isRoot()` | 1 |
| M02 | drop resolve-trim | 11 |
| M03 | drop classify-trim | 3 |
| M04 | drop both trims | 19 |
| M05 | `.` as a normal segment | 19 |
| M06 | climbing `..` ignored | 5 |
| M07 | `..` not resolved | 15 |
| M08 | blank not defaulted | 21 |
| M09 | pre-window guard dropped | 1 |
| M10 | trash-site guard dropped | 1 |
| M11 | legacy callback not re-reading | 1 |
| M12 | `syncAnyway` not re-reading | **0** |
| M13 | `syncAfter` not re-reading | **0** |
| M14 | `offerMigration` guard dropped | **0** |
| M15 | raw root in `syncOptions` | 11 |
| M16 | `syncCompendium` raw options | 15 |
| M17 | `sync()` guard dropped | 9 |
| M18 | `applySync` guard dropped | 3 |
| M19 | `detect` guard dropped | **0** |
| M20 | `plan` guard dropped | 8 |
| M21 | `execute` guard dropped | 8 |
| M22 | `markDeclined` guard dropped | 1 |
| M23 | `markSettled` guard dropped | 1 |
| M24 | `reconcile` guard dropped | 1 |
| M25 | modal `onOpen` guard dropped | 5 |
| M26 | `refs.ts` raw setting | 3 |
| M27 | `ReferenceResolver` raw setting | 3 |
| M28 | `SccResolver` raw setting | 2 |

   Baseline: 152 / 152.
6. **Real Obsidian** (feasible, about 10 min). Spec `probe-e2e/e2e/specs/settings/zz-sc643-r2-probe.e2e.ts`, run with `npm run e2e -- --only=R2P-01..05`, on SC-440 head plus the SC-643 source.
   - Safety: `app.fileManager.trashFile`, `app.vault.trash` and `app.vault.delete` were replaced page-side with recording no-ops before any click. The release lookup was stubbed and never answered. The trash button was never clicked, and windows were closed through their X.
   - Result: 5/5 ok.

| id | Destination | lookup | window | Notice | trash / delete | vault added / missing | `syncOptions()` |
|---|---|---|---|---|---|---|---|
| R2P-01 | `''`, typed into the field | 1 (`releases/latest`) | none | "resolving compendium release…" | [] / [] | [] / [] | `{root:"DS Compendium"}` |
| R2P-02 | `/` | none | none | the refused Notice | [] / [] | [] / [] | `null` |
| R2P-03 | `'   '` | 1 | none | "resolving…" | [] / [] | [] / [] | `{root:"DS Compendium"}` |
| R2P-04 | `./`, `.`, `//`, `Stamina/..` | none | none | the refused Notice | [] / [] | [] / [] | `null` |
| R2P-05 | `Stamina` (judgment) | none | **"Existing compendium folder found"** | – | [] / [] | [] / [] | `{root:"Stamina"}` |

   The refused Notice reads: "Draw Steel Elements: the Destination folder can't be the vault root (or outside the vault). Choose a folder inside the vault in Settings → Draw Steel Elements → Compendium."
7. **Gates on `9724c190`** (`probe-wt`):

| gate | result |
|---|---|
| tsc | rc 0 |
| lint | rc 0 |
| jest (fresh, `rm -f main.js styles.css`) | `Test Suites: 1 skipped, 285 passed`; `Tests: 4 skipped, 12645 passed, 12649 total`. The +2 skipped is `token-coverage.test.ts:56`, which skips when the workspace design map is not at a path relative to the repo, as in a /tmp worktree. Same as r1's 12647 / 2. |
| e2e run 1 (load about 30) | `477/500 ok, 1 failed, 22 known-bug, coverage: 287/287 pairs` (INIT-W10, see I4) |
| INIT-W10 alone | 3/3 ok |
| e2e run 2 (load 4-20) | `OBSIDIAN-E2E done: 478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`, rc 0, pointer parked |

   Lifecycle was not run, per the brief.
8. **Scope:** no regressions found.
   - Settings tab: no change (D4).
   - Status row: driven by the manifest, independent of the root.
   - "Check for updates": `checkForUpdates()` does not read the root, so it works whatever the Destination.
   - First run with no folder: blank or default → `DS Compendium` is created by `applySync` (probe).
   - The "not found in root, X, or when searching the cache" error message shows the raw setting when refused (cosmetic).
9. **Follow-up 3:** see I1.

## Judgment: the "any non-empty folder" offer — worth its own ticket (yes)

Evidence from real Obsidian, R2P-05 (Destination `Stamina`, a user folder of notes; e2e vault; no manifest):

- **Title:** "Existing compendium folder found".
- **Body:** "\"Stamina\" already contains files but no sync manifest — most likely a compendium downloaded by an older version of this plugin. You can move that folder to the trash before the first sync, or keep everything in place. Files you keep are never overwritten or deleted; any that collide with compendium paths are skipped and reported."
- **Buttons:**
  - "Keep everything": `dse-btn dse-btn--accent`, **focused by default**.
  - "Move old compendium to trash": `dse-btn dse-btn--danger`.
- **One click, no confirmation step.** The click calls `app.fileManager.trashFile(folder)` on the whole folder (`main.ts:810`).
- **Not always recoverable.**
  - The real `FileManager.trashFile` (1.14.4 `app.js`) reads `vault.getConfig("trashOption")`: `"system"` → OS trash, `"local"` → `.trash/`, `"none"` → `vault.delete(e, true)`, which is a permanent delete.
  - So for a user whose "Deleted files" setting is "Permanently delete", one click erases their notes folder.
  - `LegacyCompendiumModal.ts:11-12` claims "Obsidian's trash is always recoverable". That is false for that setting.
- **Trigger** (`main.ts:741-794`): this is not a corner case. It needs:
  - a first sync (no manifest) or a pending migration;
  - a Destination folder that has any children;
  - a legacy layout check that fails.

  Anyone who points Destination at an existing notes folder (e.g. `Notes`, `Campaign`, or a folder the suggester offered) meets it on their first Sync. The wording tells them it is "most likely a compendium", which invites the click.
- **Severity:** High. Data loss is one click away, with a default-safe focus but no confirmation, and it can be irreversible.
- **Suggested direction for the ticket (not done here):**
  - Offer the trash only when the folder looks like a legacy compendium (`detect().legacyPaths` at or above a threshold, or known compendium top-level folders).
  - Otherwise say "this folder has your files; the compendium will be added beside them".
  - Add a typed or second confirmation naming the file count.
  - Fix the "always recoverable" comment.
  - SC-441 (real-Obsidian e2e for these modals) should pin it.

## Artifacts

Root: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r2-review/`

- `inputs-r2.ts`, `inputs-r2.out`: the resolver / real / mock input table.
- `obs1144/app.js`: real Obsidian 1.14.4 `app.js`, extracted with `asar_extract_r2.py`.
- `gates-r2.rc`, `gate-tsc-r2.log`, `gate-lint-r2.log`, `gate-jest-r2.log`, `gate-e2e-r2.log` (run 1), `e2e2-r2.rc`, `gate-e2e2-r2.log` (run 2).
- `w10-r2.rc`, `w10-r2-1.log`, `w10-r2-2.log`, `w10-r2-3.log`, `evidence-INIT-W10/`.
- `mutate-r2.py`, `mutate-r2.sh`, `mutate-r2.progress`, `mutate-r2.out`, `mutate-r2-baseline.log`, `mutate-r2-M01.log` … `mutate-r2-M28.log`.
- `revert-r2.sh`, `revert-r2.log`.
- `probe-mut/test/unit/data/zzSc643R2Probe.test.ts` and `probe-unit-r2.log`: integrity and follow-up 3.
- `probe-mut/test/dom/framework/zzSc643R2PluginProbe.test.ts` and `probe-dom-r2.log`: real plugin end to end, and the races.
- `probe-e2e/e2e/specs/settings/zz-sc643-r2-probe.e2e.ts`, `e2eprobe-r2.log`, `e2eprobe-r2-tsc.log` (the M1 evidence), `sc643-src-r2.patch`.
- `status-before-*.txt`, `status-after-*.txt`: the before/after `git status`.
