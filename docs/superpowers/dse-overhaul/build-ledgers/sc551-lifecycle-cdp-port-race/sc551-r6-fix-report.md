# SC-551 r6 fix report (R16 wrapper launchers, R17 two-listener test)

## Executive summary
- Verdict: DONE. Final sha `45eef821c0b17f387522bf514836b834e2c82357` (one commit on `38b4f856`; `origin/develop` still `711f740d`, checked at start and end, no rebase). Tree clean.
- R16: the LISTEN-socket owner check now accepts `child.pid` OR any descendant (ppid map from `/proc/*/stat`, comm split on the LAST `)`, each pid visited once so a ppid cycle cannot loop, injectable `procStats` seam); a socket outside the child's tree still fails. `foreign-listener` now names the holder: `(our pid 2360539; held by pid 2360527 "obsidian")`.
- Wrapper proof (non-exec `bash` wrapper): lifecycle `DSE_LIFECYCLE_BIN=wrapper`, port 0: rc 0, `G-S6b ok` (r5 logs: rc 2); camera `DSE_CAMERA_BIN=wrapper`: rc 0, `cdp: port 43433 (reported by our obsidian pid=2358296 ...)`, pid 2358296 = the wrapper (marker log); controls with `/usr/bin/obsidian` pass.
- H-1 still closed: two cameras on a shared `DSE_CAMERA_TMP`, 3 pairs at 0 ms: 3/3 winner rc 0 + loser rc 2, `0 wrong-instance`. Lifecycle pinned pair 2/2 one pass + one exit 2.
- R17: two-listener test (ours on 127.0.0.1, stranger on `[::1]`) added; the `some`/`every` mutant now fails it. Also verified: disabling the descendant walk fails 2 tests.
- Gates: tsc 0, lint 0, jest `Tests: 2 skipped, 6325 passed, 6327 total` / `252 of 253` (6321 + 4), lifecycle 48/48 (21 + 16 + 7 + 4, own ports 47521-24), obsidian-shots `all 61 shots written` rc 0, main.js/styles.css = the 711f740d build hashes. e2e not re-run (no file under `e2e/` changed and `grep -a -rn cdp-owned e2e` finds nothing).

## Changes (`scripts/cdp-owned.mjs`, `test/unit/build/cdpOwned.test.ts` only)
- New exports `parseStat(text)` (`{ppid, comm}`, last `)`), `processTree(rootPid, stats)` (bounded, visited set); default `procStats()` reads `/proc/<pid>/stat` of every process; `proveCdpOwned({..., procStats})`. Step (2) collects the socket links of `child.pid` plus every descendant (`child.pid` unreadable is still `unverifiable`; unreadable descendants are skipped), fails if ANY LISTEN inode on the port is not in that set; the message names `held by pid N "comm"` (scanned over all readable pids, only on the failure path). Header (2) updated.
- Tests 15 -> 19: (1) fake wrapper: pid 4300 child of 4242 holds the socket -> accepted; a stranger pid 5000 (ppid 1) holds it -> `foreign-listener`, message contains `held by pid 5000 "obsidian"` and `our pid 4242`; (2) real `/proc` with a real non-exec `bash -c '"$0" -e …; true'` wrapper whose node child serves + writes the report -> accepted; (3) the former "parent pid is foreign" real-`/proc` case is changed to a SIBLING process (a live `sleep` the suite spawns): with descendants the parent of a listener-holder is no longer foreign by construction; message names the holder; (4) two listeners on one port -> `foreign-listener`, control with ours alone passes; (5) `parseStat` (plain, comm with spaces and `)`, garbage) and `processTree` on a ppid cycle (visits each pid once). Mutants: `find`->`every` fails test (4); descendant walk off fails (1) and (2).

## Proofs (evidence `sc551-r6-evidence/`)
- Wrapper, lifecycle (`wrapper-lifecycle.log`, `wrapper-lifecycle-control.log`): `start: … port 32907`, `G-S6b ok`, `done: 1/1 ok` (control `/usr/bin/obsidian` the same, port 35277). No Obsidian left running afterwards.
- Wrapper, camera (`R6CW.log`, `R6CW2.log`, `wrapper-marker.log`): `--element=stamina-bar --bg=dark`, rc 0, `all 1 shots written`, `cdp: port 39281 / 43433 (reported by our obsidian pid=… browser id verified)`; the marker wrapper's pid equals the reported "our obsidian pid".
- H-1 (`H1-r6-offset0.log`): all 3 pairs `A/B` one rc 0 own Obsidian, one rc 2 `OBSIDIAN-CAMERA environment: port N: the listening socket there is not our Obsidian's (our pid …; held by pid … "obsidian") - another instance owns it`; `SUMMARY: 0 wrong-instance camera run(s) in 3 pairs (offset 0 ms)`.
- Lifecycle pinned pair, port 47262 (`r6-pair.out`, `R6P-try*`): try 1 A rc 0 / B rc 2, try 2 A rc 2 / B rc 0; loser prints `never reported a DevTools server on port 47262 … another instance owns it`.

## Gates (load average at start)
- tsc rc=0, lint rc=0 (`r6-gate-tsc.log`, `r6-gate-lint.log`), jest rc=0 `Test Suites: 1 skipped, 252 passed, 252 of 253 total`, `Tests: 2 skipped, 6325 passed, 6327 total` (`r6-gate-jest.log`, load 3.95).
- lifecycle (`gate-lc{1..4}-r6.log`): part 1 :47521 rc=0 189 s `done: 21/21 ok, 0 failed` (10.85); part 2 :47522 rc=0 327 s `16/16` (6.12); part 3 :47523 rc=0 266 s `7/7` (4.38); part 4 `G-S57 G-S62 G-S61 G-S56` :47524 rc=0 293 s `4/4` (11.36). 48/48.
- obsidian-shots (private display :5435, private `DSE_CAMERA_TMP`, no port env, load 1.11; `R6C1.log`): rc 0 `all 61 shots written`, `cdp: port 40849 …`.
- `main.js` `1bb51153578959d07403388265a986e35775c147d8e9a1eff65103eb6fd1882e`, `styles.css` `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b`: equal to the `711f740d` build hashed in r4.

## Drive-by fixes:
- None.

## Follow-ups:
- With a wrapper, lifecycle/camera cleanup still SIGTERMs only the spawned wrapper pid (`killProc`/`killChild` kill the child they spawned, as at eafe76e1); in the runs here no Obsidian was left behind (it exits with its display / parent), but a wrapper that detaches its child could leave one. Pre-existing, not part of SC-551.
- SC-554, SC-553, SC-555 untouched.

## Files
Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-fix-report.md`; evidence `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r6-evidence/`; proposal (one `*_BIN` bullet appended) `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-dse-verify-proposal.md`.
