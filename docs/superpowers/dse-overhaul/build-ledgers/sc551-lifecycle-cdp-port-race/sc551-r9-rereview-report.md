# SC-551 r9 re-review (r8 delta 45eef821..367a2f1d, test-only)

## Executive summary
- Verdict: LAND. No findings. Diff touches only test/unit/build/cdpOwned.test.ts (+15/-5); scripts/cdp-owned.mjs untouched. Tree clean at start and end (HEAD 367a2f1d).
- Leak: 3 consecutive runs of the test file (19/19 passed each): node http servers and bash wrappers 0/0 before and 0/0 after each run.
- Positive control for the counter: with the kill removed, one run left exactly 1 server (pid 2423779, cwd = this worktree), so the count would have caught a leak. I killed it by exact pid; it is gone.
- Forced failure inside the wrapper test (throw after `prove`, before the `finally`): test fails (1 failed, 18 passed) and 0 new servers remain, so the `finally` process-group kill covers the failure path.
- R19: fail-open mutant (null fd list treated as holding the listener) now fails 1 test, the extended fake-wrapper test (18 passed); original restored.
- Gate: jest rc 0, `Test Suites: 1 skipped, 252 passed, 252 of 253 total`, `Tests: 2 skipped, 6325 passed, 6327 total`; servers 0 before and 0 after the full run.
- INFO-1 fix verified by reading: `execFileSync(..., { timeout: 60000, killSignal: 'SIGKILL' })` (cdpOwned.test.ts:91), so a looping walk fails the test instead of hanging.

## Checks
1. Leak count: `sc551-r9-evidence/r9-leak3.out`. Counter greps `ps` for the test's `node -e const http=require('http'),fs=require('fs');const s=http.createServer` and `bash -c "$0" -e "$1" "$2" "$3"; true`.
2. Forced failure: temporary edit adding `throw new Error('forced')` inside the `try` (`r9-F1_forced_failure_after_prove.log`); reverted with `git checkout`. Positive control (`r9-F2_positive_control_no_kill.log`): `process.kill(-wrapper.pid, ...)` removed, test passes, 1 orphan; this proves the detached + `kill(-pid)` in `finally` is what removes the tree. Both reverted.
3. R19 mutant (`r9-M7_fail_open_unreadable.log`): failing test is "SC-551 r5 LOW-1: a launcher wrapper that does not exec ..." via `out.unreadableReason`; with the shipped code it passes (jest runs above).
4. Reading: `detached: true` makes the wrapper a group leader; `try { process.kill(-wrapper.pid, 'SIGKILL') } catch {}` in `finally` also covers a failed spawn (`-undefined` -> NaN throws, caught). The server's own 60 s `process.exit` backstop is a belt for a killed jest worker. Residual (not a finding): a worker SIGKILLed mid-test leaves the tree for at most 60 s.

## Drive-by fixes:
- None (review only).

## Follow-ups:
- None.

## Files
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r9-rereview-report.md
- Evidence: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r9-evidence/ (r9-leak3.out, r9-leak-run{1,2,3}.log, r9-force.out, r9-F1_*.log, r9-F2_*.log, r9-M7_*.log, r9-gate-jest.log, r9-gate9.out)
- Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r7-rereview/
