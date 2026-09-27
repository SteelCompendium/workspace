# SC-243 review of fix round 2 (delta `7af05c2..2dad7d8`)

## Executive summary

**Verdict: APPROVE.** Findings F1, F2 and F3 from the fix-round-1 review are closed as prescribed, and there are no new findings.

- **F1 (test gap):** closed. I repeated the token-drop mutation, one sync call site at a time, and the full committed jest suite now goes red each time:
  - `main.ts:750` (legacy choice): 1 failure, the legacy idle test.
  - `main.ts:837` (`syncAnyway`): 1 failure, the new `syncAnyway` idle test.
- **F2 (stale docs):** closed. The comments now say the legacy choice and `syncAnyway` hold their own lock and pass the token, and that only `syncAfter` calls `sync` bare.
- **F3 (JSDoc):** closed. `opRow`'s two JSDoc blocks are now one.
- **No runtime change:** every changed line in `main.ts`, `src/data/CompendiumSyncService.ts` and `src/views/SettingsTab.ts` is inside a comment. I filtered the diff for changed lines outside comments and got nothing. The rest of the delta is `test/dom/framework/syncCompendiumBusy.test.ts`: one test tightened, one test added.
- **Gates at `2dad7d8`:**
  - tsc: clean.
  - lint: clean.
  - jest: **4022 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0.
- **Working tree:** clean at HEAD `2dad7d8`, and nothing is committed by me. Shots and freeze were not run because nothing that renders changed.

## Detail

- **F1:** the idle legacy-choice test (tightened) and the new `syncAnyway` idle test now assert three things:
  - `sync` is called with `(expect.anything(), expect.any(Symbol))`
  - `currentBusy() === 'sync'` while the trash (or `markSettled`) runs
  - the busy notice (`SYNC_BUSY_NOTICE`) never appears
- **Residual note (no action needed):** these two tests still stub `sync`, so they prove that *a* Symbol reaches it, not the live token. A wrong token would be refused at runtime by the L2 check anyway.
- **Mutation runs:** each was one line in `main.ts`, run against the full jest suite (4021 passed, 1 failed, 1 skipped each time), then restored with `git checkout HEAD -- main.ts`.

## Logs

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc243r/`:

- `fix2-tsc.log`
- `fix2-lint.log`
- `fix2-jest.log`
- `fix2-mut-legacy.log`
- `fix2-mut-anyway.log`
