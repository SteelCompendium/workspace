# SC-441 r5 scoped re-review: the r4 fix round (`88ea9c87..4b455727`)

## Executive summary

- **Verdict: LAND-READY.** dse `4b455727` on `develop` `4b233886`. Reviewer: the r3 reviewer (not the author).
- **r3 findings:** I re-ran my own probe for each one, and all are fixed: H1, M1, M2, M3, M4, M5 CAUGHT / hold now; L1-L5 and I1 confirmed by reading the diff and the probe runs.
- **SC-706 marker:**
  - SYNC-K12 and its jest twin assert the correct behaviour and fail today for the ticket's reason.
  - K12 flips to `appears fixed` under a real-fix mutant, and goes red ("failed differently") under a partial fix.
  - It restores the Destination, and the next scenario starts pristine.
- **New in r5:** 0 CRITICAL / 0 HIGH / 0 MEDIUM, 3 LOW, 2 INFO. The most notable LOW is that a product write to `.obsidian/app.json` is caught only by the NEXT scenario's pristine check.
- **Product diff:** `4b233886..4b455727 -- src main.ts styles.css` is still attributes only (21 changed lines, all `control`); 0 lines changed since `88ea9c87`.
- **Gates:** tsc 0, lint 0; jest `14916 passed / 1 skipped` (shots cache present); `--element=sync` ×2 `84/96 ok, 0 failed, 12 known-bug`; FULL e2e `OBSIDIAN-E2E done: 927/948 ok, 0 failed, 21 known-bug, coverage: 539/539 pairs` (429 s). These match the implementer.
- **Safety:** the machine trash still has 0 entries.
- **Working tree clean: YES** (`status --short` empty; every probe reverted by named-file checkout).

## 1. Each r3 finding, re-probed

| r3 finding | probe (mine, re-run) | result |
|---|---|---|
| H1 move inference depends on folder order | `walkasc` / `walkdesc`: the snapshot walk sorted ascending / descending, on M28, M30, M10, M18, E04 | **5/5 ok under both orders** (was: all red). FIXED |
| M1 SC-653 markers | `sc653ii` (refuse with a Notice) | K01 `appears fixed`, K02 `appears fixed` (was: K01 timeout). FIXED |
| | `sc653i` (no trash button) | K01 `appears fixed`, K02 `appears fixed` |
| | `sc653plan` (always `.trash`) | K02 `appears fixed` (was: stuck known-bug); K01 known-bug (correct: this plan does not touch a notes-only folder); E09 red (expected, ledger O23) |
| M2 `execute` leak | describes of `migration-run.e2e.ts` reversed; M23..M27, then M16, R04, M10, M13 | **9/9 ok** (was: M16 / M10 FAIL). FIXED |
| M3 `.obsidian` invisible | mutant `obs` on S01, R01, D09 | **all 3 FAIL** (`created: … sync-cache.json, .obsidian/stray-from-sync.md`) (was: MISSED). FIXED |
| M4 E04 / E05 not whole-tree | mutant `iic` on E04, E05, E09 | **all 3 FAIL** (`removed: got ["Stamina/dying.md"]`) (was: E04 / E05 MISSED). FIXED |
| M5 a held run leaks into the next scenario | `forced37`: CENSUS-37 throws right after `reachRunning(2)`, then CENSUS-38, 39 | 37 FAIL (forced); **38 ok, 39 ok** (was: 38 `not pristine … stray file … migration report`). FIXED |
| L1 D08 / D09 / D10 | diff read; D08 / D09 / D10 ran in both sync runs and the full run | D08 and D09 pin the writes, D10 `expectChange({})` + `ENOTDIR`. FIXED |
| L2 M03, M07..M09 | diff read | publish the tree and assert `calls()` is `[]`. FIXED |
| L3 M10 10 s wait | durations | M10 2.2 s (was 12 s). FIXED |
| L4 K09 stops at `.trash` | diff read | both Destinations tried before the verdict. FIXED |
| L5 K10 loose pattern | diff read | asserts `alwaysUpdateLinks === false` and the setting's exact label. FIXED |
| I1 stub answers 404 | diff read | an unknown URL now throws (`sync.ts:267`). FIXED |

## 2. The SC-706 marker (SYNC-K12) and its jest twin

**Assertion.** The user's text must survive somewhere in the vault, AND the sync either asked (a window) or wrote nothing into `Notes/`. This is the ledger O22 wording. `failsWith` pins `the user's own note was overwritten by the sync into the changed Destination`.

**Today.** `known-bug SC-706` (2.0 s), followed by K10, K11 and D08 in the same session, all clean (`sc441r5-e2e-k12seq.log`).

**Flip checks:**
- `sc706full2` (a real fix: when the manifest's folder differs, it goes through the first-sync check and opens the window): K12 `appears fixed`; K10 and S01 unaffected (`sc441r5-e2e-mut-sc706full2.log`).
- `sc706partial` (only the in-place update checks the folder: the note survives, but the release is still poured in without asking): K12 `failed differently than pinned … the sync wrote into a folder of the user's files without asking`. That is correct: the ticket asks for both halves.
- My first full-fix mutant (`sc706full`) left `main.ts`'s `if (manifest !== null) sync()` branch in place, so K12 stayed known-bug there. That was my mutant's gap, not the test's.

**Restores.** The Destination is reset in `finally` and again by `resetSyncTree`. The next scenario's pristine assertion passed.

**Jest twin** (`syncCompendiumBugs.test.ts`, describe `SC-706`):
- The plain current-behaviour test passes.
- Run as a plain test, the `test.failing` fails on `Expected: true, Received: false` for the "survives" assertion (`sc441r5-jest-bugs-unfailing.log`: 12 failed / 12 passed, the 11 r3 ones + SC-706).
- The reworked SC-653 twin fails on its `.trash` assertion, not on a timeout.

## 3. Harness: the canary fix and the `.obsidian` allowlist

**Canary.** It now waits for `metadataCache.getFileCache(<canary>)` before `trashFile` (`sync.ts:70`). Bounded (5 s), and it runs before any scenario trash. Fine. No canary failure in 2 sync runs + 1 full + ~20 targeted runs.

**Allowlist.**
- Named exact paths: `workspace.json`, `workspaces.json`, `appearance.json`, plus `app.json` compared with `trashOption` / `alwaysUpdateLinks` removed. `.obsidian` is matched only at the vault root.
- Not wide enough to hide a file write: mutant `obs` is caught.
- Two narrower gaps remain (r5-L1, r5-L2 below):
  - mutant `appkey` (product sets an unrelated `app.json` key) is caught only one scenario late;
  - mutant `appharness` (product flips `alwaysUpdateLinks`) is invisible by design.

## 4. Product diff

`git diff 4b233886..4b455727 -- src main.ts styles.css`: the same 2 files and 21 lines as at r3 (`control:` ids and the `pathSection(control, …)` plumbing). `git diff 88ea9c87..4b455727 -- src main.ts styles.css` is empty.

## New findings (r5)

**r5-L1 (LOW): a product write to `.obsidian/app.json` is not caught by the scenario that makes it.** `e2e/driver/sync.ts` `settled()` / `entryOf` (`:106-118`).
- Obsidian saves its config after a delay, and `settled()` (two equal snapshots 150 ms apart) does not wait for that save.
- The change surfaces only in the NEXT scenario's pristine check. That blames the wrong test, and `resetSyncTree` does not restore `app.json`, so every later scenario in the session goes red too.
- A scenario that is last in its session, or run alone, misses it.
- **Shown:** mutant `appkey` (`setConfig('showUnsupportedFiles', true)` in `applySync`): S01 ok; R01 and S02 FAIL `not pristine … config file .obsidian/app.json differs from the session's start` (`sc441r5-e2e-mut-appkey.log`).
- **Fix:** compare `app.vault.config` page-side (in memory, minus the two harness keys) against the session baseline in `settled()`, and restore `app.json` in `resetSyncTree`.

**r5-L2 (LOW): the two harness keys are invisible to the diff.** `sync.ts` `HARNESS_APP_KEYS`.
- `trashOption` and `alwaysUpdateLinks` are removed from the comparison, so a product that flips the user's "Automatically update internal links" or "Deleted files" setting is invisible.
- **Shown:** mutant `appharness` (flip `alwaysUpdateLinks` in `applySync`): S01, R01 and S02 all pass (`sc441r5-e2e-mut-appharness.log`). L03 does assert the links setting stays OFF, but only in that scenario.
- `trashOption` is read back only at the start of each scenario.
- **Fix:** instead of dropping the keys, compare them against the values `startSyncTest` set for this scenario.

**r5-L3 (LOW): K01 and K02 report "appears fixed" when the Sync does nothing visible.** `known-bugs.e2e.ts` K01 / K02.
- Both accept "no window" after an 8 s `within()` that may simply time out.
- **Shown:** mutant `silent` (`syncCompendium` returns with neither a window nor a Notice): K01 and K02 `appears fixed` (`sc441r5-e2e-mut-silent.log`). The marker goes red either way, but a fixer reading "appears fixed" would write a plain test that passes on a silent no-op.
- **Fix:** take the "no window" branch only when a Notice was seen (`within(...)` returned true).

**r5-I1 (INFO).** The 3-line header comment of the `SC-701` describe in `test/dom/framework/syncCompendiumBugs.test.ts` was deleted along with the old SC-653 `test.failing` (line ~327). Every other defect block keeps its `// ---------- SC-nnn` header.

**r5-I2 (INFO).** `quiesce()` adds at least 3 × 150 ms to every sync scenario. The sync-only run went 61-62 s (r3) → 67 s (r5).

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`)

| gate | log | summary |
|---|---|---|
| tsc (incl. `-p e2e`) | `sc441r5-tsc.log` / `.rc` | rc 0 |
| lint | `sc441r5-lint.log` / `.rc` | rc 0 |
| jest | `sc441r5-jest-full.log` / `.rc` | rc 0, `Tests: 1 skipped, 14916 passed, 14917 total` (shots cache present, = 14915/2 fresh) |
| `--element=sync` #1 | `sc441r5-e2e-sync1.log` | rc 0, `84/96 ok, 0 failed, 12 known-bug` (67 s) |
| `--element=sync` #2 | `sc441r5-e2e-sync2.log` | rc 0, `84/96 ok, 0 failed, 12 known-bug` (67 s) |
| **FULL e2e** | `sc441r5-e2e-full.log` / `.rc` | **rc 0, `OBSIDIAN-E2E done: 927/948 ok, 0 failed, 21 known-bug, coverage: 539/539 pairs`** (429 s); no flake |

## Evidence artifacts

All in the scratch folder above:
- `sc441r5-mut.py` (mutants incl. `walkasc`, `walkdesc`, `forced37`, `appkey`, `appharness`, `silent`, `sc706partial`, `sc706full`, `sc706full2`)
- `sc441r5-probe.sh`, `sc441r5-e2e.sh`
- `sc441r5-e2e-mut-{walkasc,walkdesc,obs,iic,forced37,sc653ii,sc653i,sc653plan,silent,appkey,appharness,sc706partial,sc706full,sc706full2}.log` (+ `.rc`, `sc441r5-mut-*.diff` / `.status`, all empty)
- `sc441r5-e2e-reversed-run.log`, `sc441r5-e2e-k12seq.log`, `sc441r5-jest-bugs-unfailing.log`

Final `git -C …/draw-steel-elements status --short`: empty, head `4b455727`. Nothing was committed.

## r7

**Verdict: LAND-READY** at dse `e783b068` (rebased onto develop `44bab481`); the delta checked is `e783b068` only. Worktree clean, nothing committed.
**The r5 LOWs are fixed:**
- `appkey` and `appharness` now fail in the scenario that makes the change.
- `silent` no longer reads "appears fixed".
- `--element=sync` clean: `84/96 ok, 0 failed, 12 known-bug`.
**One residual, LOW, not blocking:** after a real product change to `app.json`, the NEXT scenario also fails at its pristine check, because the on-disk file catches up late. In a clean run this has no effect.

### What the commit does, read for correctness
- `settled()` now calls `assertConfigUnchanged()`. It compares Obsidian's in-memory `app.vault.config` against two things:
  - the session baseline, minus the two harness keys;
  - each harness key against the value this scenario set (`expectedHarness`, which `startSyncTest` assigns after its own `setTrash` / link set-up).
- `resetSyncTree` puts back the baseline in memory. It drops keys that were added, with `setConfig(k, undefined)`, and resets keys that changed.

**False-alarm paths I looked for:**
- No driver or spec calls `setConfig` on any key other than the two harness keys.
- The product never calls `setConfig`.
- The L-scenarios answer Obsidian's prompt with "Do not update" or "Just once", never "Always update", which would really flip `alwaysUpdateLinks`. If a future spec clicks "Always update", the check flags it, correctly.
- G03 and K09 call `startSyncTest` twice; `expectedHarness` is re-assigned each time.
- No false alarm in the clean `--element=sync` run, and none in the implementer's full run.

**K01 / K02:** both now need `within(...)` to have seen a window or a Notice; otherwise they throw `the Sync showed neither a window nor a Notice`.

### Re-run mutants

| mutant | tests | result |
|---|---|---|
| `appkey` (`setConfig('showUnsupportedFiles', true)` in `applySync`) | S01, R01, D03, D04 | **S01 FAIL** `Obsidian's configuration changed during the scenario: showUnsupportedFiles is true, the session started with undefined` (was: S01 ok). R01 FAIL at its pristine check: `config file .obsidian/app.json differs from the session's start` (see the residual). D03, D04 ok, so the restore lands one scenario later |
| `appharness` (flip `alwaysUpdateLinks` in `applySync`) | S01, R01, D03, D04 | **S01 FAIL** `alwaysUpdateLinks is false, this scenario set true` (was: invisible). R01 FAIL the same way: it syncs, so the change is its own. D03, D04 ok |
| `silent` (`syncCompendium` returns, no window, no Notice) | K01, K02 | both `failed differently than pinned … the Sync showed neither a window nor a Notice` (was: "appears fixed") |

### The residual (r7-L1, LOW, not blocking)
- `resetSyncTree` restores the config in memory, but Obsidian saves `app.json` to disk late.
- So the next scenario's disk-based pristine check still sees the old `app.json` and fails. That is a misleading second red, and it happens only after a real product change to `app.json`.
- Possible fix: in `resetSyncTree`, after the restore, wait until `app.json` on disk (with the harness keys removed) matches the baseline.

### Gate
`--element=sync` (`sc441r7-e2e-sync.log`, rc 0, 67 s): `OBSIDIAN-E2E done: 84/96 ok, 0 failed, 12 known-bug, coverage: 59/540 pairs (partial run: gate skipped)`.
Machine trash: 0 entries. `git status --short`: empty at `e783b068`.

### Evidence
In `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`:
- `sc441r7-mut.py`, `sc441r7-probe.sh`, `sc441r7-e2e.sh`
- `sc441r7-e2e-mut-{appkey,appharness,silent}.log` (+ `.rc`, `sc441r7-mut-*.diff` / `.status`, all empty)
- `sc441r7-e2e-sync.log`
