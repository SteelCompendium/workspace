# SC-551 r7 re-review (r6 delta 38b4f856..45eef821)

## Executive summary
- Verdict: LAND. No HIGH/MEDIUM correctness findings; the descendant walk accepts only pids in our child's ppid tree and fails closed on every case probed.
- Gates (45eef821, tree clean before and after): tsc rc 0, lint rc 0, jest rc 0 `Test Suites: 1 skipped, 252 passed, 252 of 253 total`, `Tests: 2 skipped, 6325 passed, 6327 total`.
- Mutants of the walk: accept any pid, skip the walk, ancestors-instead-of-descendants each fail 2 tests; first-`)` split fails 1; wrong stat field fails 2. All reverted (`git checkout -- scripts/cdp-owned.mjs`), tree clean.
- Wrapper probe (non-exec bash wrapper as DSE_LIFECYCLE_BIN, DSE_LIFECYCLE_PORT=49371, G-S6b): rc 0, `done: 1/1 ok`.
- LOW-1 (test leak): the non-exec wrapper test leaks one long-lived `node -e` http server per jest run (and bash+node if the test fails before its kill). Not a blocker.
- LOW-2 (test gap): the fail-closed branch for an unreadable descendant (`fdLinks(pid) ?? []`) has no test; a fail-open mutant survives. Behaviour in the code is correct.
- INFO: the cycle test hangs rather than fails if the visited-set is removed (execFileSync has no timeout).

## 1. Does the walk accept only our child's tree? (code read + executed)
- `parseStat` (cdp-owned.mjs:106-112): first `(`, last `)`, ppid = field 2 after comm. Executed on a real process whose exe name is `a) S 1 (b) 9`: raw `2408492 (a) S 1 (b) 9) S 2408485 ...` parses to `{ppid:2408485, comm:"a) S 1 (b) 9"}`; ppid equals `/proc/<pid>/status` PPid for all 542 readable processes (0 mismatches; `sc551-r7-evidence/r7-probe-stat.out`). The kernel's comm is the only field with parentheses, so a hostile comm cannot shift fields. Real-tree check: tree of the probe process contained its weird-named child, not pid 1, not its parent (size 2).
- `processTree` (cdp-owned.mjs:135-148): kids map by ppid, DFS from `rootPid` only (never upward), visited set bounds a cycle. The ppid-cycle unit test passes; removing the visited check (M5) hangs the subprocess (killed by my 120 s timeout), so the bound is load-bearing.
- Unreadable entries fail closed: `child.pid` fdLinks null stays `unverifiable` (checked before the walk); a descendant whose fdLinks is null is skipped, so a listener it holds is not in `ours` and the proof throws `foreign-listener`; a process whose stat is unreadable is absent from `stats` and so is its subtree; `readdir /proc` failure returns an empty map so the tree is the child alone (strict). A descendant that exits mid-walk gives the same (null or missing -> strict).
- pid reuse: stats snapshot and fd reads are microseconds apart; reuse would need a full pid wrap in that window and the reusing process would have to be the stranger that owns the port. Same exposure as the existing `child.pid` read; not actionable. A wrapper that detaches its child (reparented to init) leaves our tree and fails closed with the "another instance owns it" wording; no regression from eafe76e1 beyond what R16 already accepted.
- The failure path's holder scan only runs after the decision is made, uses `stats.get(pid)` for pids taken from `stats.keys()` (no undefined deref), and cannot change the verdict.
- Callers (obsidian-lifecycle.mjs:5270, obsidian-camera.mjs:692) pass `child` and take the default `procStats`; no call-site change needed.

## 2. Mutation results (`cdpOwned.test.ts`, 19 tests; logs `sc551-r7-evidence/r7-mut-*.log`)
| Mutant | Result |
|---|---|
| M1 walk accepts every pid (`stats.keys()`) | killed: 2 failed (r5 LOW-1 stranger test; real-/proc sibling test) |
| M2 skip the walk (`if (false)`) | killed: 2 failed (fake wrapper test; real bash wrapper test) |
| M3 walk ancestors instead of descendants | killed: 2 failed (same two) |
| M4 `indexOf(')')` instead of `lastIndexOf` | killed: 1 failed (parseStat) |
| M5 remove visited check | killed by hang, not by assertion (INFO-1) |
| M6 ppid read from field 3 (pgrp) | killed: 2 failed |
| M7 unreadable descendant fd list treated as holding the listener (fail open) | SURVIVED: 19 passed (LOW-2) |
After each, file restored from the script and finally `git checkout -- scripts/cdp-owned.mjs`; `git status --short` empty.

## 3. Wrapper probe
`DSE_LIFECYCLE_BIN=sc551-r6-evidence/obsidian-wrapper.sh` (`/usr/bin/obsidian "$@"`, no exec), `DSE_LIFECYCLE_PORT=49371`, `--only=G-S6b`, harness-chosen Xvfb (`:162`, ownership proven by its own displayfd check): rc 0; `start: obsidian 1.15.0, display :162, port 49371`, `G-S6b ok (current_value=11 after leaf close)`, `done: 1/1 ok, 0 failed`. Port 49371 free again afterwards; no process of mine left.

## Findings
- LOW-1: `test/unit/build/cdpOwned.test.ts` (new test "with the real /proc, a non-exec bash wrapper ...", ~line 258-268): `wrapper.kill('SIGKILL')` kills only the bash, so the node http server child is orphaned (reparented to `systemd --user`) and never exits. Observed: lone `node -e const http=...` processes (~52 MB RSS) from every jest run, including the implementer's r6 runs (pids 2353425, 2354196, 2354594, 2354989, 2367371, started 18:46-18:51, still alive; I did not touch them) and mine (12 pids killed by exact pid). When the test fails before the kill (M2) the bash survives too, and the kill is not in a `finally`. Fix: spawn `detached` and `process.kill(-pid)`, or have the server child exit by itself (e.g. `setTimeout(() => process.exit(), 20000).unref`-style, or exit when stdin/parent goes), and wrap in try/finally.
- LOW-2: no test covers a descendant whose fd list is unreadable (fail-closed path at cdp-owned.mjs ~248, `fdLinks(pid) ?? []`); mutant M7 survives. One line in the fake-wrapper test (an `fdLinks` returning null for the wrapper's child holding the socket -> `foreign-listener`) would kill it.
- INFO-1: `run()` uses `execFileSync` with no timeout, so a regression that makes `processTree` loop would hang jest instead of failing it.
- INFO-2: the sibling-pid real-/proc test depends on `sleep` and `bash` being on PATH (true in devbox and CI images used here).

## Drive-by fixes:
- None (review only).

## Follow-ups:
- The five r6-era leaked `node -e` servers listed above are still running; the owner may want them stopped.

## Files
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r7-rereview-report.md
- Evidence: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r7-evidence/ (r7-gate-tsc.log, r7-gate-lint.log, r7-gate-jest.log, r7-mut-*.log, r7-probe-stat.out, r7-wrapper-lifecycle.log)
- Scratch scripts: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r7-rereview/
