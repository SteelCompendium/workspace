# SC-243 review: fix round 1 (delta `e8d5274..7af05c2`)

## Executive summary

**Verdict: APPROVE (no blockers).** The code closes L1, L2 and L3 as prescribed.
- **Probes:** my archived P5 and P10, with their expectations flipped to the fixed behaviour, pass, and so do all 12 original probes. Four new lock-release probes also passed, except that jest surfaces the pre-existing fire-and-forget rejections (SC-358) as test errors on the trash, sync and markSettled throw paths. No assertion failed in any of them.
- **Lock release:** the L1 try/finally releases the lock when trash throws, when sync throws, and when sync returns null. syncAnyway's refusal leaves the migration state untouched, so the offer is re-armed.
- **L2 safety:** L2 does not break syncCompendium's legitimate token handoff.
- **Regression tests:** 3 regression tests fail without the fix. The 4th new test (idle legacy choice: trash, then sync) passes both ways by design.
- **Test gap (LOW, recommended):** that 4th test mocks `sync`. A mutation that drops the token from `main.ts:747`/`:834` (which makes both choices refuse themselves even when idle) passes the whole committed suite. Only my probes caught it.
- **Two cheap doc nits:** stale "calls sync BARE" comments, and a stacked JSDoc block.
- **Gates:** tsc and lint are clean. Jest: **4021 passed / 1 skipped / 208 of 209 suites / 3 snapshots**. The working tree is clean and `sc243-evidence.mjs` is gone.
- **Shots and freeze not run:** the delta does not touch rendering. The SettingsTab change is type and comment only, so the emitted JS is identical.

## Checks (owner's items)

1. **L1, L2 and L3 are closed as prescribed.**
   - L1: the legacy `onChoice` (`main.ts:736-751`) and `syncAnyway` (`main.ts:825-838`) call `beginOperation('sync')` first. On null they show `SYNC_BUSY_NOTICE` and return before `trashFile` or `markSettled`. Otherwise they pass the held token into `sync(opts, token)` and call `endOperation` in `finally`.
   - L2 (`CompendiumSyncService.ts:288-291`): a defined `heldToken` that is not `this.busyToken` is refused with a Notice and `null`.
   - L3 (`SettingsTab.ts:113`): `build` is now `=> void | (() => void)`.
   - I copied in the archived probe with the P4/P5/P10 expectations flipped to the fixed behaviour:
     - P5: trash is not called.
     - P10: the call resolves null, makes no network call, shows the busy Notice, and `check` still holds the lock.
     - P4: `markSettled` is not called.
   - Result: **16 tests ran.** All 12 original probes passed. The file was deleted after the run.
2. **try/finally releases on every path.** Probes F2 (trash throws), F3 (sync throws, and sync returns null) and F4 (markSettled throws) each end with `isBusy() === false`, and none produced an assertion failure. Jest marks them errored only because each callback's `void (async…)()` rejects with nobody listening. That is pre-existing I3/SC-358 behaviour, not a regression.
   - F1 and F4 in the idle case: busy is `'sync'` during trash or markSettled, and the real `sync` receives a Symbol token and runs without refusing itself.
   - syncAnyway refused: the modal has already closed with `answered=true`, so `dismissed` and `declined` do not fire, and `markSettled` is skipped. The migration state is exactly what it was: a pending or declined state is re-offered on the next sync, and a null state means the concurrent sync covers it. That is sane.
3. **L2 vs the legitimate handoff.** `syncCompendium`'s token is live when it passes it (`main.ts:717,737`), so the check passes it through. The committed `syncCompendiumBusy` single-call test (requestUrl reached, no busy Notice) and my P1/P2/P3/P8 all pass.
4. **Red without the fix.** With `main.ts` and `CompendiumSyncService.ts` restored to `e8d5274`, 3 of 15 tests fail in the two files: L2 stale token, L1 legacy onChoice, L1 syncAnyway. The idle-ordering test passes, which is expected.
5. **The 4th test** is `syncCompendiumBusy.test.ts:161`, `LegacyCompendiumModal onChoice(true): idle — trashes the root THEN syncs, under its own lock`. It is a same-both-ways sanity test, and the implementer's report does say so in its red-first section. 2 (L1) + 1 (L2) + 1 (idle) = +4, which gives 4021.
6. **Working tree.** `git status --porcelain` in the DSE clone is empty and HEAD is `7af05c2`. `visual-harness/sc243-evidence.mjs` is absent. The superproject worktree shows only ` M draw-steel-elements`, the pointer bump that was already there.

## Findings

### LOW F1 (test gap, recommended): the no-self-refusal path of the new lock-first callbacks is untested
- `test/dom/framework/syncCompendiumBusy.test.ts:161-178`. The idle test stubs `sync` (`:169`, `mockResolvedValue(null)`), so it cannot tell whether the callback passed its token.
- Mutation I ran: replace `sync(this.syncOptions(), trashToken)` at `main.ts:747` and `sync(this.syncOptions(), anywayToken)` at `main.ts:834` with bare `sync(this.syncOptions())`.
  - Effect: both callbacks now hold the lock and then call a bare `sync`, which refuses itself. "Trash and sync", "Keep and sync" and "Sync without moving" would **always** be refused and would never sync.
  - Committed suite: **all green** under the mutation.
  - My probes F1 and F4 go red (`Expected: "symbol", Received: "undefined"`).
- Fix: in the idle test, drop the stub or use a passthrough, and assert:
  - `syncSpy` was called with `(expect.anything(), expect.any(Symbol))`
  - `currentBusy() === 'sync'` inside `trashFile`
  - no `SYNC_BUSY_NOTICE`

  Add the same idle test for `syncAnyway`.

### LOW F2 (stale docs): two comments still describe the pre-fix token flow
- `main.ts:668-675` (the `syncCompendium` doc) says "The `LegacyCompendiumModal`/`offerMigration` callbacks further down call `syncService.sync` BARE (no token)". Only `syncAfter` (`main.ts:841`) does now.
- `CompendiumSyncService.ts:270-273` (the `sync` doc) says the `offerMigration` modal callbacks omit `heldToken`. That is also only true of `syncAfter` now.
- Fix: say that the legacy choice and `syncAnyway` hold their own lock first and pass it in, and that `syncAfter` calls sync bare.

### NIT F3: stacked JSDoc on opRow
- `src/views/SettingsTab.ts:103-113`. The L3 rationale was added as a *second* `/** … */` block directly under opRow's existing JSDoc. TS and IDE hover attach only the nearest block, so opRow's original doc ("label/help are BOTH the rendered name/desc and the row's search keys…") no longer shows.
- Fix: merge the two into one block.

### INFO
- The pre-existing unhandled rejection from each callback's `void (async…)()` when trash, markSettled or sync throws is unchanged, and the lock is still released. This is SC-358's scope.

## Gates (at `7af05c2`, load 4.2)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | **4021 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0 |
| shots / freeze / parity / lifecycle | not run. The delta is callback logic in `main.ts` and `CompendiumSyncService.ts`, plus a type-only and comment-only change in `SettingsTab.ts`. No CSS or rendered DOM changes. |

## Artifacts

Scratch directory: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc243r/`
- `fix1-tsc.log`
- `fix1-lint.log`
- `fix1-jest.log`
- `fix1-red.log` (red-check)
- `probe-fix1.log` (16 probes)
- `mutation.log` (token-drop mutation)
- `zz-sc243-review-probe-fix1.test.ts` (the probe file as run, including F1–F4)
