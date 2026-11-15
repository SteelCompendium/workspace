# SC-646 r1 independent review

## Executive summary

- Verdict: **FIX** (one blocking finding, against the owner's "visible must not become silent" ruling). Counts: HIGH 1, MEDIUM 1, LOW 1, INFO 4.
- Reviewed plugin `a9f0af1d..281f1f43` (7 files) and superproject `a434c174` (CHANGELOG). The tree was clean before and after (plugin: empty; superproject: only the expected unstaged ` M draw-steel-elements`).
- The fix itself holds. All six fixed sites leave nothing unhandled. A real failure gives exactly 1 failure Notice and 1 `compendium sync failed` console.error, and the busy lock is released. My own mutant (all catches removed) turned all 6 new jest tests red. e2e SET-C04 alone went red with the Settings catch removed (`rejection: Error: GitHub release lookup failed (HTTP 404)`), and still went red with the explicit assertion also removed: the per-test page-error invariant catches it by itself. Green with the fix (SET-C03/C07/C04 3/3 ok).
- HIGH (follow-up 1, confirmed by probe): a failure in `syncCompendium`'s prelude (`reconcile`, `manifestStore.load`, `isPending`, `markSettled`, and `markSettled` inside `offerMigration`) was an unhandled rejection at `a9f0af1d` and is now **fully silent** at HEAD: no Notice, no console line. Fix: give `syncCompendium` the same `syncStarted` flag and catch (log unless sync reported, then rethrow). The three empty caller catches stay as they are.
- MEDIUM (follow-up 2, confirmed): `declined` (`markDeclined`), `finishRemaining` and the `migrate-compendium-layout` command (`markSettled` via `offerMigration`) still leave unhandled rejections. This was already true before the diff. Fix: one `.catch` that logs, at each of the three sites.
- I verified the prescribed fix for both findings as an uncommitted edit, then reverted it. Probes: all 13 cases logged once, nothing unhandled, nothing silent. tsc, tsc -p e2e and lint passed. Full jest: 13359 passed / 2 skipped. Diff: `.../scratchpad/sc646-r1-review/rv-candidate-fix.diff`.
- `logUnlessSyncReported` with the `syncStarted` flag is correct. Keep it, and reuse it in `syncCompendium`.
- Gates at HEAD: tsc, tsc -p e2e and lint rc=0. The 5 touched suites pass 374/374. The implementer's logs end as reported: jest 13359/2, lifecycle 21+16+9+4+7+4+3 = 64/64, e2e `608/620 ok, 0 failed, 12 known-bug, coverage: 417/417 pairs`.

## Findings

### HIGH 1: prelude failures in `syncCompendium` are now silent (owner ruling broken)

- Where: `main.ts:739-852` (`syncCompendium`: `try` at 749, `finally` at 849, no catch). The empty catches at `main.ts:606` (command), `src/views/SettingsTab.ts:634-638` (Sync button) and `src/authoring/CompendiumSearchModal.ts:176` (search-modal CTA) swallow everything `syncCompendium` rejects with.
- Scenario: the user clicks Sync, and `migrationService.reconcile` or `manifestStore.load` throws (for example, `data.json` cannot be read). Before this diff the console showed `Uncaught (in promise) Error: …`. Now nothing appears: no Notice, no log line. The button returns to idle, so it looks as if Sync did nothing.
- Probe (jsdom, through the `sync-compendium` command; the results are in `rv-probe-{base,head,candidate}.jsonl`):

  | Case | `a9f0af1d` | HEAD `281f1f43` | With the prescribed fix |
  |---|---|---|---|
  | `reconcile` throws | unhandled rejection | silent | 1 log line "compendium sync could not start" |
  | `manifestStore.load` throws | unhandled rejection | silent | 1 log line |
  | `isPending` throws | unhandled rejection | silent | 1 log line |
  | `markSettled` (main.ts:785, nothing left to migrate) throws | unhandled rejection | silent | 1 log line |
  | `offerMigration` → `markSettled` (plan has no renames) throws | unhandled rejection | silent (the "checking…" Notice opens and closes) | 1 log line |
  | Control: a real failed sync | unhandled rejection | 1 failure Notice + 1 designed log | unchanged: 1 Notice + 1 log, no extra line |

  Busy state after every case: released (`isBusy()` false).
- Prescribed fix (smallest; it covers all three entry points at once):
  - In `syncCompendium`, declare `let syncStarted = false;` before the `try`.
  - Set `syncStarted = true;` right before each of the two `await this.syncService.sync(options, token)` calls (main.ts:788 and :848).
  - Add `catch (error: unknown) { logUnlessSyncReported(error, syncStarted); throw error; }` before the `finally`.
  - `syncCompendium` keeps rejecting, so the existing `rejects.toThrow()` tests and the service contract are unchanged.
  - Update the three caller comments to say the failure was already reported "by `CompendiumSyncService.sync`, or logged by `syncCompendium`'s own catch".
  - Update the doc comment on `logUnlessSyncReported` (main.ts:355-361), which lists only its two current callers.
- Tests for the fix round: add jsdom tests, for example in the SC-646 describe of `test/dom/framework/syncCompendiumBusy.test.ts`. Through the command, `reconcile` (or `manifestStore.load`) rejecting gives exactly one `compendium sync could not start` console.error, no failure Notice, nothing unhandled, and busy released. At HEAD this test goes red (silent, 0 logs); at the base it goes red (unhandled). My probe block is a ready starting point: `.../scratchpad/sc646-r1-review/probe-block.ts.txt`.

### MEDIUM 1: `declined`, `finishRemaining` and the migrate command still leave an unhandled rejection

- Where:
  - `main.ts:905-912`: `declined`, a `void (async () => { await markDeclined(root); … })()`. It is reached from `decline` and from `dismissed(null)`.
  - `main.ts:944`: `finishRemaining: () => { void this.offerMigration(root); }`.
  - `main.ts:619`: the `migrate-compendium-layout` command, `void this.migrateCompendium()`.
  - `offerMigration` catches only `plan`; its `markSettled` (main.ts:896) can still reject.
- Scenario: the user picks "Not now" in the migration window (or presses Escape), and `markDeclined` fails because the save failed. The decline Notice never appears, and the console shows `Uncaught (in promise)`. The same happens for "finish remaining" and for the migrate command when `markSettled` fails.
- Confirmed: the probes `fu2-decline`, `fu2-dismissed-null`, `fu2-finishRemaining` and `fu2-migrate-command` all fail Jest with the raw unhandled error, both at HEAD and at `a9f0af1d`. This was already true before the diff, so it is not a regression. It is the same dropped-promise class in the same file, which is why the owner folded it in.
- Prescribed fix (verified):
  - `declined`: `})().catch((error: unknown) => console.error('Draw Steel Elements: could not record the declined compendium migration:', error));`.
  - Add one module-level `logMigrationFailure(error)` that does `console.error('Draw Steel Elements: the compendium migration could not continue:', error)`.
  - Use it at `finishRemaining: () => { this.offerMigration(root).catch(logMigrationFailure); }` and in the command, `callback: () => { this.migrateCompendium().catch(logMigrationFailure); }`.
  - Do not put the catch inside `offerMigration`. `syncCompendium` awaits it, and after HIGH 1 that path is logged once by `syncCompendium`'s catch; a catch inside would log it twice.
  - No new Notice: before, these failures surfaced only as a console error. A Notice would be a UX improvement but is not owed by the ruling.
- Tests: one jsdom test per site. They are red today without any extra assertion, because Jest fails a test on an unhandled rejection (see LOW 1).

### LOW 1: the in-test `unhandledRejection` listener never catches anything; Jest's own handling is what turns the tests red

- Where: `test/dom/framework/syncCompendiumBusy.test.ts:273-283` (`unhandledDuring`), `test/dom/views/settings-matrix.test.ts:593-600`, `test/dom/authoring/compendiumSearchModal.test.ts:149-156`.
- Evidence:
  - In both mutant runs (mine, `rv-jest-mutant.log`, and in effect the implementer's), the failures are the raw errors ("boom", "Release undefined has no asset…") pointing at the `mockRejectedValue` line, or a `toHaveLength` on the logged count.
  - `expect(rejections).toEqual([])` never fails. In my base probe the listener's array stayed `[]` in all 9 cases where Jest failed the test for an unhandled rejection.
  - So the tests guard the bug, but not by the mechanism their names and comments state. If Jest's unhandled-rejection behaviour or config changes, the listener will not take over as the guard.
- Fix: in the fix round, either drop the listener and say in one line that Jest fails the test on an unhandled rejection, or keep it and correct the comments. Optional, not blocking.

### INFO

1. **`logUnlessSyncReported` and the `syncStarted` flag: correct.**
   - The flag is set synchronously just before the `sync()` call. The arrow reads the captured `let` when the catch runs.
   - `sync` rejects only from its inner try, after its Notice and console.error.
   - Every early return in `sync` (vault root, stale token, busy) resolves; none rejects.
   - The only theoretical gap is `new Notice(...)` at `CompendiumSyncService.ts:315` throwing, which is negligible.
   - Simpler alternatives I weighed: a module-level `WeakSet` that tags errors `sync` already reported, via a `runSync` wrapper in main.ts, removes the per-site flags but adds a wrapper and identity tracking. Restructuring each IIFE so `sync` sits outside the try is more churn. Keep the flag and reuse it in `syncCompendium` (HIGH 1).
   - Nit: `void (async () => {…})().catch(…)` at main.ts:810/:927 keeps a now-redundant `void`. It is harmless, and lint is clean either way.
2. **Failures handled before the Notice (brief item 2): no new silence on these paths.** The destination guard (vault root), the busy lock, and a destination changed while the legacy window was open all return early with their own Notice and never throw (probes `refusal-busy`, `refusal-destination-root`, `legacy-destination-changed`). Cancelling the legacy window never calls `onChoice`. The Check-for-updates button (`SettingsTab.ts:645` → `checkForCompendiumUpdates`, with try/catch and a Notice) was already handled.
3. **Call-site audit is complete.** I re-ran it with `grep -a`, because the shell's grep wrapper skips files it flags as binary (`e2e/run.mjs` is one). Every `syncCompendium`, `syncService.sync`, `checkForUpdates`, `onSyncRequested`, `migrateCompendium` and `offerMigration` caller is in the implementer's table. Nothing else starts a sync.
4. **CHANGELOG `a434c174`: OK.**
   - One bullet, under `## Unreleased`, at the top, in the neighbours' style.
   - Plain, user-facing words; it names the three entry points; it says the Notice and its one console line are unchanged.
   - The HIGH 1 and MEDIUM 1 fixes add console lines only on rare internal failures, so the bullet needs no change.
   - The dse-verify numbers (jest 13359, e2e 608/620 + 12 known-bug) are the dispatcher's job at landing (ruling 3).

## Artifacts (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r1-review/`)

- `rv-static.log`: tsc, tsc -p e2e and lint at HEAD, all rc=0. `rv-static-candidate.log`: the same with the prescribed fix.
- `rv-jest-head.log`: 374/374 at HEAD. `rv-jest-mutant.log`: 6 failed / 290 passed with every catch removed.
- `rv-jest-candidate.log`: 374/374 with the fix. `rv-jest-candidate-wide.log`: the full suite with the fix, 13359 passed / 2 skipped.
- `rv-e2e-c04-mutant.log`: SET-C04 FAIL with the Settings catch removed. `rv-e2e-c04-mutant-invariant.log`: FAIL from the invariant alone. `rv-e2e-c04-head.log`: SET-C03/C07/C04 3/3 ok.
- `rv-probe-base.jsonl` / `.log`, `rv-probe-head.jsonl` / `.log`, `rv-probe-candidate.jsonl` / `.log`: the 13 probe cases at each of the three points.
- `probe-block.ts.txt`: the probe tests. `rv-candidate-fix.diff`: the verified fix for HIGH 1 and MEDIUM 1.
