# SC-646 r2 scoped re-review (delta only)

## Executive summary

- Verdict: **LAND**. Counts: HIGH 0, MEDIUM 0, LOW 1 (a test gap, not blocking), INFO 2.
- Reviewed plugin `1a8efe3a..975f0dcc` (r2: `ee4d76d3`, `975f0dcc`), on dse develop `cefa9ca8`. The range-diff of the r1 pair is identical (`6f2dcc90 = 2091c3d2`, `281f1f43 = 1a8efe3a`). Superproject `origin/main..HEAD` is exactly CHANGELOG `cd7e3d4b` plus ONE pointer `972e5c6b`, which stages only `draw-steel-elements` and points at `975f0dcc` (the plugin HEAD). Both histories fast-forward. Remote main is still `c63ec316` and remote develop is still `cefa9ca8`. No attribution trailers. Both trees were clean before and after.
- HIGH fixed. I made each of the 5 prelude steps throw: `reconcile`, `manifestStore.load`, `isPending`, `markSettled`, and `markSettled` inside `offerMigration`. Each gives exactly 1 `compendium sync could not start` line, no failure Notice, nothing unhandled, and the lock released. The caller shape used by the Settings tab and the search window gives the same result, and a direct call still rejects. A real failed sync still gives exactly 1 Notice and 1 `compendium sync failed` line, with no extra line, from the command, `onChoice`, `syncAnyway` and `syncAfter`.
- MEDIUM fixed. A `markDeclined` failure logs exactly once, both from `decline` and from `dismissed(null)`. `finishRemaining` and the migrate command log exactly once. The decline Notice still shows when nothing fails. A `plan` failure is still handled once inside `offerMigration`, with no double log.
- LOW (from r1) fixed. The 3 dead `unhandledRejection` listeners are gone, and the new comments correctly say that Jest fails the test.
- Mutants: I removed each new catch in turn, plus the flag sites, a catch that swallows, and a `logMigrationFailure` that stays silent. 7 of the 8 go red. The one survivor is this report's LOW.
- Gates: I re-ran tsc, `tsc -p e2e` and lint at `975f0dcc` (all rc=0) and the 3 touched suites (303/303). The implementer's logs end as reported: jest 13402/2, lifecycle 21+16+9+4+7+4+3 = 64/64, e2e `612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs` (SET-C04 ok), styles.css sha identical. All of those logs were written after the rebased commits.

## Findings

### LOW 1: no test covers the first `syncStarted = true` (main.ts:794)

- Where: `main.ts:794`. This is the `manifest !== null` arm inside the pending-migration branch: the migration is pending, the folder is non-empty, nothing is left to move, `markSettled` runs, then `sync` runs.
- Mutant M5 deletes that line, and all 303 tests in the 3 touched suites still pass.
- With M5 applied, my probe `p09` shows a sync failure that `CompendiumSyncService.sync` already reported, followed by an extra `compendium sync could not start` line. That is the double log the owner's ruling forbids. At HEAD the same probe gives 0 extra lines, so the code is correct and only the guard is missing.
- The path is reachable: a user who declined the migration earlier, and then has nothing left to move, presses Sync.
- Prescribed fix (optional, 1 test): add a case to the SC-646 describe in `test/dom/framework/syncCompendiumBusy.test.ts`:
  1. Run `seedLegacyModalTrigger(plugin)`.
  2. Mock `manifestStore.load` to resolve `{}`.
  3. Mock `isPending` to resolve `true` and `markSettled` to resolve.
  4. Leave the real `sync` failing.
  5. Run the `sync-compendium` command, then `await settle()`.
  6. Expect 1 failure Notice, 1 `compendium sync failed` line, 0 `could not start` lines, and `isBusy()` false.

  It turns M5 red. Not blocking: the owner can fold it in or land without it.

### INFO

1. **Stale comment at `main.ts:801-803`.** It still says "Wrap in a `void`-discarded async IIFE … identical … error handling, just an explicit `void`". r2 removed the `void`, and SC-646 gave the IIFE its own `.catch`. Suggested wording: "Wrap in an async IIFE whose `.catch` is `logUnlessSyncReported`". This is a comment only, with no behaviour change.
2. **Shadowed `let syncStarted`.** The legacy `onChoice` IIFE (`main.ts:816`) declares its own `let syncStarted`, which shadows the new outer one (`main.ts:754`). This is correct: the callback runs after `syncCompendium` has returned, so it must not share the outer flag. Lint passes. No change needed.

## Probe matrix at HEAD `975f0dcc` (`rr-probe-head.jsonl`; 19/19 jest tests passed, so nothing was unhandled)

| Case | console.error | Notices | Busy after |
|---|---|---|---|
| p01-p05: each prelude step throws (command) | 1× `compendium sync could not start` | none (p05: only the transient "checking…") | false |
| p06: `reconcile` throws, Settings/search caller shape | 1× could not start | none | false |
| p07: `reconcile` throws, `syncCompendium()` called directly | 1× could not start; the promise still rejects | none | false |
| p08 / p18 / p19 / p20: real failed sync (command / `onChoice(false)` / `syncAnyway` / `syncAfter`) | 1× `compendium sync failed` | 1× failure Notice | false |
| p09 / p10: a `sync` that already reported rejects, at site :794 / :855 | 0 | none | false |
| p11 / p12: `plan` throws (from the sync command / the migrate command) | 1× could not plan | 1× could not check | false |
| p13 / p14: `markDeclined` throws (`decline` / `dismissed(null)`) | 1× could not record the declined… | none | false |
| p15: `decline`, nothing fails | 0 | decline Notice | false |
| p16 / p17: `markSettled` throws (`finishRemaining` / migrate command) | 1× migration could not continue | only the transient "checking…" | false |

## Mutants (`rr-mutants-summary.log`; each run covers the 3 touched suites, 303 tests)

| Mutant | Result |
|---|---|
| M1: remove the `syncCompendium` catch | 4 red (the 3 prelude `test.each` cases and the prelude `markSettled` test) |
| M2: remove the `declined` `.catch` | 1 red |
| M3: remove the `finishRemaining` `.catch` | 1 red |
| M4: remove the migrate-command `.catch` | 1 red |
| M5: remove `syncStarted = true` at :794 | **0 red** (LOW 1) |
| M6: remove `syncStarted = true` at :855 | 1 red (the real-failure command test) |
| M7: the catch swallows instead of rethrowing | 3 red |
| M8: `logMigrationFailure` stays silent | 2 red |

`main.ts` was restored after each mutant, with `git status` empty each time.

## Artifacts

All of these are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r2-rereview/`:

- Static checks and touched suites: `rr-static.log` (tsc, lint) and `rr-jest-touched.log` (303/303).
- Probe at HEAD: `probe-block.ts.txt`, `rr-probe.sh`, `rr-probe-head.log`, `rr-probe-head.jsonl`.
- Mutants: `mutate.py`, `rr-mutants.sh`, `rr-mutants-summary.log`, and one `rr-jest-M*.log` per mutant.
- M5 confirmation: `rr-probe-m5.sh`, `rr-probe-m5.log`, `rr-probe-m5-jest.log`, `rr-probe-m5.jsonl` (p09 shows the extra log).
