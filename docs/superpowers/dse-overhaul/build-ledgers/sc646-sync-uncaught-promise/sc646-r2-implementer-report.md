# SC-646 r2 implementer report

## Executive summary

- STATUS: DONE. All review findings folded (HIGH, MEDIUM, LOW, `void` nit). Nothing pushed.
- Plugin rebased onto `origin/develop` `cefa9ca8` (no conflicts, package.json unchanged). Plugin head `975f0dcc`: `2091c3d2` fix r1, `1a8efe3a` tests r1, `ee4d76d3` fix r2, `975f0dcc` tests r2.
- Superproject rebased onto `origin/main` `c63ec316` (it had moved past 17af24be): one CHANGELOG conflict, kept both bullets (SC-646 above SC-640). CHANGELOG commit `cd7e3d4b`; the ONE pointer commit `972e5c6b` (stages only `draw-steel-elements`).
- Gates at `975f0dcc`: tsc (+`-p e2e`) rc=0; lint rc=0; jest fresh `13402 passed / 2 skipped` (13389 + 6 r1 + 7 r2); lifecycle 64/64 (21+16+9+4+7+4+3, first run, no flakes); e2e `612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`.
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` at HEAD and at clean `cefa9ca8` (identical; no CSS in the diff), so shots/freeze/parity carry.
- Mutants (re-run at the rebased base): A (r2 `main.ts` changes reverted to the r1 state) 7 red / 363 green; B (all fixes reverted) 13 red / 357 green; both restored, tree clean.

## What changed in r2 (plugin, `main.ts` + tests)

- HIGH: `syncCompendium` has `let syncStarted = false`, set right before each of its two `syncService.sync` calls, and a `catch (error) { logUnlessSyncReported(error, syncStarted); throw error; }` before the `finally`. It still rejects, so the `rejects.toThrow` tests and the service contract are unchanged. The three Sync callers' empty catches (`main.ts` command, `SettingsTab.ts`, `CompendiumSearchModal.ts`) now say: reported by `CompendiumSyncService.sync`, or logged by `syncCompendium`'s own catch. `logUnlessSyncReported`'s doc comment now names all three starters.
- MEDIUM: `declined` IIFE gets `.catch` logging "could not record the declined compendium migration"; new module-level `logMigrationFailure` is the `.catch` at `finishRemaining` and at the `migrate-compendium-layout` command. No catch inside `offerMigration` (it would log twice on the `syncCompendium` path). No new Notice anywhere.
- INFO nit: redundant `void` removed from the three async IIFEs that now end in `.catch` (legacy `onChoice`, `declined`, `syncAnyway`). Reviewer's candidate diff was applied as the base (it applied cleanly).
- LOW: the dead `process.on('unhandledRejection')` listeners are gone from the three r1 tests; comments now say Jest fails a test on an unhandled rejection and the test flushes real macrotasks so one would be reported.

## Tests (all jsdom, `test/dom/framework/syncCompendiumBusy.test.ts` unless noted)

The SC-646 describe is rewritten (11 tests; r1 had 4, so +7 net). New or changed:
1. command with a real failed sync: 1 failure Notice, 1 `compendium sync failed` console.error, no `could not start` line
2. `test.each` x3: `reconcile` / `manifestStore.load` / `isPending` throwing in the prelude: exactly one `compendium sync could not start` log, no failure Notice, lock released
3. `markSettled` throwing in the prelude (nothing left to migrate; and inside `offerMigration`): logged once each, `syncCompendium` still rejects
4. syncAfter, syncAnyway (sync failure: no log; `markSettled` failure: one log), legacy `onChoice` (sync failure: no log; `trashFile` failure: one log, no sync)
5. `declined` and `dismissed(null)` with `markDeclined` failing: one log each, no decline Notice
6. `finishRemaining` and the `migrate-compendium-layout` command with `markSettled` failing: one `the compendium migration could not continue` log, nothing else
Settings-matrix (1) and search-modal (1) r1 tests are kept, listener removed. No new e2e tests; SET-C04 stays a plain test.

## Mutant results (at rebased base, logs in `sc646-r2-impl/`)

- A: `main.ts` at the r1 commit (`1a8efe3a`), tests kept: 7 failed / 363 passed, exactly the 7 new r2 tests (prelude x3 via test.each, prelude markSettled, `declined`, `finishRemaining`, migrate command).
- B: `main.ts`, `SettingsTab.ts`, `CompendiumSearchModal.ts` at `cefa9ca8`: 13 failed / 357 passed, all 13 SC-646 tests (11 busy-suite incl. the 3 each-cases are counted individually, plus settings-matrix and search-modal).
- The same two mutants were also run on the pre-rebase base with identical counts (7 and 13).

## Rebase notes

- Plugin: `git rebase origin/develop` onto `cefa9ca8`, clean (develop changed only negotiation files and e2e/README). All gates were re-run at the rebased sha; the pre-rebase gates (jest 13366, lifecycle parts 1-6, mutants) are superseded and not reported as final.
- Superproject: `origin/main` was `c63ec316` by the time I fetched (the message said 17af24be; it is its parent). Conflict was CHANGELOG `## Unreleased` only; resolved by keeping both bullets, SC-646 first.

## Drive-by fixes:

None.

## Follow-ups:

None new. (The dse-verify "Current expected numbers" update to jest 13402 / e2e 612/622 + 10 known-bug is the dispatcher's job at landing.)

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/sc646-r2-implementer-report.md`
- Logs, all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r2-impl/`: `sc646-r2-tsc-rebased.log`, `sc646-r2-lint-rebased.log`, `sc646-r2-jest-full-rebased.log`, `sc646-r2-rb-mutants-summary.log` (+ `sc646-r2-rb-jest-mutantA.log`, `...B.log`), `sc646-r2-rb-lc-p1.log` .. `sc646-r2-rb-lc-p7.log`, `sc646-r2-e2e-full.log`, `sc646-r2-css2.log`.
