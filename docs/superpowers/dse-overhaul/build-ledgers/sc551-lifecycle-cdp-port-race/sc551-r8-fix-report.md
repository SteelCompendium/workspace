# SC-551 r8 fix report (R18 test leak, R19 gap + timeout)

## Executive summary
- Verdict: DONE. Final sha `367a2f1d` (full sha in the final message): one test-only commit on `45eef821`; `origin/develop` still `711f740d` (checked). `git diff 45eef821 --stat`: `test/unit/build/cdpOwned.test.ts` only (+15/-5); `scripts/cdp-owned.mjs` untouched, so no lifecycle run. Tree clean.
- R18: the real non-exec-wrapper test spawns the wrapper `detached` and kills the whole process group in a `finally` (`process.kill(-wrapper.pid, 'SIGKILL')`); the node server also exits by itself after 60 s.
- Process count around 3 jest runs of that file (`ps` pattern: the test's `node -e const http=require('http'),fs=require('fs')…` servers plus the `bash -c "$0" -e …` wrapper): BEFORE the fix 6 -> 7 -> 8 -> 9 (+1 per run); AFTER 0 -> 0 -> 0 -> 0.
- Orphans killed by exact pid after checking cmdline and cwd (= the sc551 worktree): the 5 r6 ones 2353425, 2354196, 2354594, 2354989, 2367371, plus the bash wrapper 2354593 (parent of 2354594) and 3 more from my BEFORE runs 2413467, 2413762, 2413960. Count afterwards 0.
- R19: the fake-wrapper test now also has the wrapper's child with an UNREADABLE fd list holding the socket -> `foreign-listener`; the fail-open mutant (null fd list treated as holding the listener) fails that test, with the original code it passes. `execFileSync` in the test helper has `timeout: 60000, killSignal: 'SIGKILL'` (INFO-1).
- Gates: tsc rc 0, lint rc 0, jest `Test Suites: 1 skipped, 252 passed, 252 of 253 total`, `Tests: 2 skipped, 6325 passed, 6327 total` (19 tests in the file, none added: the R19 case extends the existing wrapper test). Count after the full jest run: 0.

## Details
- Server child in the real-wrapper test: `setTimeout(()=>process.exit(0),60000)` added to its script as a belt if the jest worker itself is killed.
- Measurement scripts: `count3.sh` (count before, three `npx jest test/unit/build/cdpOwned.test.ts` runs, count after each), `count-leak.sh` (lists the processes), `kill-orphans.sh` (exact-pid list, cmdline + cwd checks, `kill -KILL`; printed `killed <pid> (cwd ok)` for all 9). Output: `leak-before.txt`, `leak-after.txt`.
- Mutation (R19): the unreadable-descendant mutant failed 1 test (the extended wrapper test); original restored (`git status` clean after).
- No glob `rm` used; no other session's process touched (only pids whose cmdline matched the test's own server/wrapper and whose cwd was this worktree).

## Drive-by fixes:
- None.

## Follow-ups:
- None new. INFO-2 dropped per R19.

## Files
Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r8-fix-report.md`; evidence `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r8-evidence/` (`leak-before.txt`, `leak-after.txt`, `r8-gate-tsc.log`, `r8-gate-lint.log`, `r8-gate-jest.log`, scripts).
