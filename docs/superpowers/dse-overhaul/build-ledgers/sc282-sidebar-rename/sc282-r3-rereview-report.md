# SC-282 r3 scoped re-review (reviewer identity B)

## Executive summary

- **Verdict: LAND.** Findings: BLOCKER 0, HIGH 0, MEDIUM 0, LOW 0, INFO 1.
- I reviewed only the delta `6898b84..6c4f6aa`: `5dd14e4` (fix) and `6c4f6aa` (test). Nothing else changed. Source changes are confined to the `.catch` in `src/framework/view.ts:308-319`. The test file only gained lines: a blockKey assertion in the existing rename test, plus one new LOW-A test.
- **LOW-A fixed.** With the loaded-leaf skip removed (the `noloadedskip` mutation), the new LOW-A test now fails: 1 of 25. In r2 this mutation failed 0 of 24.
- **LOW-B fixed.** A scratch probe fakes a vault write failure (EACCES). It shows `console.error('Draw Steel Elements: block write failed', err)` is called exactly once with the original error. Both coalesced `persist()` waiters resolve `false`. There is no unhandled rejection.
- **LOW-C fixed.** With the live-path key restored (the `livekey` mutation), the rename test's new blockKey assertion now fails: 1 of 25. In r2 this mutation failed 0 of 24.
- **Gates (head `6c4f6aa`):** tsc clean, lint clean. jest 3997 passed / 1 skipped / 3998 total, 206 of 207 suites, as expected. I skipped freeze and parity per the brief, because nothing in `src` changed outside the catch. The tree is clean and nothing was committed.

## Verification

| Item | Check | Result |
|---|---|---|
| Delta scope | `git diff --stat 6898b84..6c4f6aa` | `src/framework/view.ts` +11/-1 (catch only); `test/dom/framework/sidebarRename.test.ts` +45/-1 |
| LOW-A | Mutation: remove `registration.ts:136` loaded-leaf skip | 1 fail: the new "LOW-A: a LOADED sidebar leaf…" test (`sc282-r3-rereview-mutation-noloadedskip.log`) |
| LOW-B | Scratch probe R1 (`sc282-r3-rereview-probe-jest.test.ts.txt`) | `console.error` called once with (message, the original Error); `[p1, p2]` resolve `[false, false]`; 0 unhandled rejections (`sc282-r3-rereview-probe-catch.log`) |
| LOW-C | Mutation: `blockKey()` rebuilt from the live `backingFile.path` | 1 fail: "renaming a pinned note…", via the new `keyBefore` assertion (`sc282-r3-rereview-mutation-livekey.log`) |

Each mutation was reverted, and `git status` was clean after each. The probe file was removed from the worktree; a copy is kept in the ledger dir.

## Findings

### INFO-1 — The expected ENOENT now logs once
When a note is deleted while a write is still pending, the ENOENT from that write now produces one `console.error`. I accepted this in the r2 LOW-B prescription, and it is the intended diagnostic. No action.

## Gates (head `6c4f6aa`, base `c524fd2`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc282-r3-rereview-tsc.log` |
| lint | clean, exit 0 | `sc282-r3-rereview-lint.log` |
| jest | 3997 passed / 1 skipped / 3998; 206 of 207 suites; exit 0 | `sc282-r3-rereview-jest.log` |
| freeze / parity | not re-run (brief: only if src changed outside the catch; it did not) | — |
