# SC-646 r1 implementer report

## Executive summary

- STATUS: DONE (one owner-visible item: `main.ts` was touched, see "main.ts").
- Plugin branch `sc646-sync-uncaught-promise` head `281f1f43` (fix `6f2dcc90`, tests `281f1f43`); cut from `a9f0af1d`, which was still `origin/develop`. Nothing pushed.
- Superproject CHANGELOG commit `a434c174` (one bullet under `## Unreleased`). No submodule pointer bump committed (worktree shows ` M draw-steel-elements`, unstaged).
- tsc (incl. `-p e2e`) clean; lint clean (exit 0); jest 13359 passed / 2 skipped (13353 + 6 new, fresh, no shots cache).
- Lifecycle 64/64 in 7 parts: 21 + 16 + 9 + 4 + 7 + 4 + 3, all 0 failed, no flakes.
- e2e `608/620 ok, 0 failed, 12 known-bug, coverage: 417/417 pairs` (SET-C04 ok, 960 ms).
- `styles.css` sha256 identical at HEAD and at clean `a9f0af1d`: `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; no CSS file in the diff, so shots / freeze / parity carry (not re-run).
- Mutant: with the fix reverted (main.ts, SettingsTab.ts, CompendiumSearchModal.ts at `a9f0af1d`) all 6 new jest tests go red, the other 357 in the 4 touched suites stay green; fix restored.
- Call sites fixed: 6 (settings Sync button, palette command, search modal CTA, syncAfter, syncAnyway, legacy onChoice).

## Call-site audit

"Notice?" = does a rejection reach the user as a Notice. All sync-service failures: yes, `CompendiumSyncService.sync` shows "compendium sync failed — msg" + `console.error`, then rethrows (unchanged).

| # | Site | Before | Notice for the sync failure? | Verdict / fix |
|---|---|---|---|---|
| 1 | `src/views/SettingsTab.ts:634` Sync button `void this.plugin.syncCompendium()` | rejection unhandled | yes (service) | FIXED: `.catch(() => {})` with comment |
| 2 | `src/views/SettingsTab.ts:641` Check for updates -> `checkForCompendiumUpdates` | try/catch, `Update check failed — msg` Notice | yes | already handled, no change |
| 3 | `main.ts:591` command `sync-compendium`, `callback: () => this.syncCompendium()` (Obsidian ignores the returned promise) | unhandled | yes (service) | FIXED: `.catch(() => {})` with comment |
| 4 | `src/authoring/CompendiumSearchModal.ts:173` CTA `void this.opts.onSyncRequested?.()` (fed by `compendiumInsert.ts:402` `() => plugin.syncCompendium()` for both insert commands) | unhandled | yes (service) | FIXED in the modal (one site covers both commands): `Promise.resolve(...).catch(() => {})`; `compendiumInsert.ts` untouched, so its source-hygiene regex test is unchanged |
| 5 | `main.ts` migration `syncAfter`: `void this.syncService.sync(latest)` | unhandled | yes (service) | FIXED: `.catch(() => {})` with comment |
| 6 | `main.ts` migration `syncAnyway` async IIFE (`markSettled` then `sync`) | unhandled | sync failure: yes; `markSettled` failure: NO Notice | FIXED with `logUnlessSyncReported` (see below) |
| 7 | `main.ts` LegacyCompendiumModal `onChoice` async IIFE (`trashFile` then `sync`) | unhandled | sync failure: yes; `trashFile` failure: NO Notice | FIXED with `logUnlessSyncReported` |
| 8 | `main.ts` internal `syncService.sync(options, token)` calls inside `syncCompendium` | awaited; propagates to callers 1, 3, 4 | yes | no change |
| 9 | `syncService.checkForUpdates()` (only caller is #2) | n/a | yes (#2's catch) | already handled |
| 10 | `main.ts` `declined` (`void (async () => markDeclined...)`) | unhandled if `markDeclined` throws | NO | not a sync start; left, see Follow-ups |
| 11 | `main.ts` `finishRemaining: void this.offerMigration(root)` and command `migrate-compendium-layout` | `offerMigration` catches `plan` errors; `markSettled` / `markDeclined` inside can reject unhandled | partly | not a sync start; left, see Follow-ups |

No other caller of `syncCompendium`, `sync(` or `checkForUpdates` exists in `src/` or `main.ts` (grepped).

## Design notes

- Sites 1, 3, 4, 5: empty `.catch(() => {})`, one-line comment naming `CompendiumSyncService.sync` as the reporter. No second Notice, no second log line (jsdom test with a real failing sync through the command asserts exactly one failure Notice and one `compendium sync failed` console.error).
- Sites 6 and 7: an empty catch would silently swallow a `trashFile` / `markSettled` failure (today those reach the console as uncaught only). So a `syncStarted` flag is set right before the `sync()` call; module-level `logUnlessSyncReported(error, syncStarted)` in `main.ts` is the catch: after the flag, nothing (service already reported); before it, one `console.error("Draw Steel Elements: compendium sync could not start:", error)`. No new Notice anywhere.
- Residual by design (ruling 1: empty catch at the Sync callers): a failure inside `syncCompendium`'s PRELUDE (`reconcile`, `manifestStore.load`, `isPending`, `offerMigration`) before `syncService.sync` is reached has no Notice; at sites 1, 3, 4 it is now silent instead of an uncaught console error. See Follow-ups.

## main.ts (owner: tell the dispatcher; SC-653 may touch the sync path)

Edited `main.ts` (+32/-6 lines): the `sync-compendium` command callback, `syncAfter`, `syncAnyway`, the legacy-modal `onChoice`, and a new module-level helper `logUnlessSyncReported` placed after `registerBuiltinElements`-style registration function and before the class. `CompendiumSyncService` is unchanged.

## Mutant result

Reverted `main.ts`, `src/views/SettingsTab.ts`, `src/authoring/CompendiumSearchModal.ts` to `a9f0af1d` (tests kept), ran the 4 suites (`syncCompendiumBusy`, `settings-matrix`, `compendiumSearchModal`, `settings-tab`): 6 failed / 357 passed. Red tests:
1. settings-matrix: "SC-646: a Sync whose run rejects leaves no unhandled promise rejection behind..."
2. compendiumSearchModal: "SC-646: choosing the sync CTA when the sync rejects leaves no unhandled promise rejection..."
3. syncCompendiumBusy: the "Sync compendium" command test
4. syncCompendiumBusy: syncAfter test
5. syncCompendiumBusy: syncAnyway test
6. syncCompendiumBusy: LegacyCompendiumModal onChoice test
Log: `.../sc646-r1-impl/sc646-r1-jest-mutant.log`. Restored with `git checkout HEAD -- <3 files>`; working tree clean afterwards. The e2e SET-C04 was a known-bug at baseline failing with exactly `rejection: Error: GitHub release lookup failed (HTTP 404)` and now passes as a plain test with the `rejection:` alternative dropped from `allowPageErrors`.

## Diff summary (`a9f0af1d..281f1f43`, 7 files, +175/-11)

- `main.ts` +32/-6; `src/views/SettingsTab.ts` +5/-1; `src/authoring/CompendiumSearchModal.ts` +4/-1
- `e2e/specs/settings/compendium.e2e.ts` +5/-5 (`knownBug` -> `it`, `failsWith` dropped, `rejection:` alternative dropped, unused `knownBug` import removed)
- `test/dom/views/settings-matrix.test.ts` +19; `test/dom/authoring/compendiumSearchModal.test.ts` +18; `test/dom/framework/syncCompendiumBusy.test.ts` +96 (new describe, 4 tests)
- Superproject: `CHANGELOG.md` +6 (one bullet, `a434c174`)
- 6 new jest tests (one per fixed call-site group); no new e2e tests.

## Gate numbers

- tsc: `npm run tsc` rc=0 (re-run after a test type fix; first run caught `plugin.commands` typing in my new test, fixed before commit amend).
- lint: rc=0. jest full: `Tests: 2 skipped, 13359 passed, 13361 total`; `Test Suites: 1 skipped, 291 passed`.
- Lifecycle parts (each ran with `--only=`, counts match the part sizes): p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7 (G-S91 ok first run), p6 4/4 (G-S97 ok), p7 3/3 (G-S115 ok first run). Total 64/64.
- e2e full: `608/620 ok, 0 failed, 12 known-bug, coverage: 417/417 pairs`; no INIT-W10 / SET-X03 / SET-X04 flake, no re-run needed.
- Another effort (sc640 worktree) was running its own lifecycle concurrently with my parts 1-3; no effect seen.

## Drive-by fixes:

None.

## Follow-ups:

1. `syncCompendium` prelude failures (`migrationService.reconcile`, `manifestStore.load`, `isPending`, `offerMigration` / `markSettled`) have no Notice and no log of their own; with the ruled empty catch at the Sync callers they are now silent (previously an uncaught console error). Suggest SC-653 or a small ticket: have `syncCompendium` log/Notice prelude errors itself (needs a `main.ts` change).
2. `main.ts` `declined` callback (`markDeclined` in a `void (async ...)()`) and `finishRemaining: void this.offerMigration(root)` can leave an unhandled rejection if `markDeclined` / `markSettled` throws. Not sync starts, so left alone.
3. `compendiumInsert.ts` has a source-hygiene test pinning `const onSyncRequested = () => plugin.syncCompendium();`; I kept that line unchanged on purpose (the catch lives in the modal).
4. The dse-verify skill's "Current expected numbers" (jest 13353, e2e 607/620 + 13 known-bug) will need the new values (13359, 608/620 + 12 known-bug) when the owner lands this.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/sc646-r1-implementer-report.md`
- Logs dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r1-impl/` (`sc646-r1-tsc2.log`, `sc646-r1-lint.log`, `sc646-r1-jest-full.log`, `sc646-r1-jest-mutant.log`, `sc646-r1-lc-p1.log` .. `sc646-r1-lc-p7.log`, `sc646-r1-e2e-full.log`, `sc646-r1-css.log`)
