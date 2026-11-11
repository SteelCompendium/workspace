# SC-593 r1 implementer report

## Executive summary
- Verdict: DONE. CENSUS-07 no longer times out under heavy load; no per-test timeout backstop needed (measured heavy-load run is 3.2-3.4 s, ~7% of the 45 s budget).
- Final dse sha: `b2b72774` (branch `sc593-census07-load-timeout`, on `c3fd8323` = origin/develop, unmoved). Commits: `fcb08de6` (driver), `b2b72774` (spec). Not pushed; superproject untouched.
- Fix: `eventfulNodes` (e2e/driver/census.ts) now calls `DOMDebugger.getEventListeners` (depth -1) once per top-level in-scope element (3 on the tracker) instead of once per node (~380-526), resolves only the input-eventful backendNodeIds, one batched `callFunctionOn`, objects released via an object group. Signature and result identical (15/15 scans byte-identical to the old walk across CENSUS-01..09). CENSUS-07 scans the title editor once, not twice.
- CENSUS-07 quiet: 5998 ms before -> ~1230 ms after (3 runs: 1275/1220/1237; full e2e: 2391 ms).
- CENSUS-07 under 60 synthetic spinners (loadavg 50-67): before = TIMEOUT at 45 s twice (per-scan 7.3-16.4 s); after = 3366/3227/3227 ms (3 of 3 pass).
- Gates: tsc clean, lint rc 0, jest 7200/1 skipped (after shots), lifecycle 54/54 (21+16+9+4+4), e2e `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` rc 0, shots 592 (host-leak 163/978, modal 39/234, clip 147), freeze 280/280, parity 0/0/24 rc 0.

## 1. Baseline measurement (c3fd8323, temporary uncommitted trace in census.ts, reverted)
CENSUS-07 alone (`npm run e2e -- --only=CENSUS-07`), quiet host (12 cores), loadavg 3.7: test 5998 ms, wall 11.1 s.
Per scan (nodes in scope / eventful / ms): tracker rich.md 526/52/1313 and 526/52/1220 (the duplicate back-to-back pair), captain.md 382/35/864, squad 384/35/866, rider 382/35/847. Scans = ~5.1 s of the 6.0 s.
Trace: `.../sc593-r1-impl/trace-a0b087f1.log` (overwritten by later runs; first run summarized here), logs `base-quiet1-a0b087f1.log`.

Synthetic load 24 spinners (loadavg 14-20): 7934 / 7698 ms (only ~1.3x): `base-loaded1/2-a0b087f1.log`. Not enough to reproduce.
Synthetic load 60 spinners (24 + 36 `node -e 'for(;;){}'`, 12 cores, loadavg 50-67): CENSUS-07 FAILED at the 45 s timeout both runs (`base-heavy1/2-a0b087f1.log`), reproducing the ticket. Per-scan 7.3-16.4 s each (526-node scan ~8 s, vs 1.3 s quiet, ~6x).

## 2. Approach choice and probes
Probed the `depth: -1` listener approach against the old per-node walk by running both in the same test and comparing `JSON.stringify` of the result for every scan in CENSUS-01..09 (temp wrapper, reverted): 15/15 scans `same: true` (twice, over two variants).
- Variant A: one `getEventListeners(document, depth -1)`: identical, but the document holds ~280 eventful nodes vs ~52 in scope, and resolving those 280 (one `DOM.resolveNode` each) cost ~250 ms; floor ~300 ms per scan. Rejected.
- Variant B (shipped): `depth -1` on the top-level in-scope elements only (scope minus elements under another in-scope element; 3 roots on the tracker, a handful elsewhere), resolve only those nodes' backendNodeIds, one `callFunctionOn` on the in-scope array taking them as arguments (filters out-of-scope nodes inside a root's subtree, restores scope order via `indexOf`, reads id/tag/cls/text). Per scan: tracker 47-92 ms vs 720-1266 ms, modal 18-81 vs 27-1044 ms, bar 23-27 vs 154-250 ms (quiet, `cmp-a0b087f1.log`). Under heavy load: 100-170 ms per scan (first scan 1.2-1.4 s warm-up) vs 7.3-16 s.
- Object group per call (`dse-census-N`), `Runtime.releaseObjectGroup` in `finally`; the handler remote objects from `getEventListeners` live in the group of the object they were asked about, so they are released too.
- Event order per node: input types in the order the listeners are reported, deduped (matches the old walk; verified identical).
- Duplicate scan in CENSUS-07 (old lines 99-100) removed: one `editing` scan, two assertions. Scenario id and title unchanged.

## 3. After measurements
Quiet (loadavg 6-9 decaying after killing spinners): CENSUS-07 1275 / 1220 / 1237 ms (wall 6.2-6.4 s); in the full e2e run 2391 ms.
Heavy (60 spinners, loadavg 63.7-64.1): 3366 / 3227 / 3227 ms, all ok; per-scan 101-167 ms except the first (1.2-1.4 s). Backstop threshold was ~22 s (50% of 45 s); measured max 3.4 s, so **no `this.timeout()` added**, global 45 s untouched.
Spinners: 24 + 36 node processes, PIDs in `spin-pids-set1-a0b087f1.txt` / `spin-pids-set2-a0b087f1.txt`, each killed by PID after verifying `/proc/<pid>/cmdline` was the spinner; none alive afterwards.

## 4. Gates at b2b72774 (all foreground blocking calls via script file; rc read from the log's `GATE-RC=` line)
- `npm run tsc` clean rc 0; `npm run lint` rc 0 (`tsc1-a0b087f1.log`, `.lint`).
- `npx jest`: before shots 7199 passed / 2 skipped (fresh worktree, expected); after shots 7200 passed / 1 skipped, rc 0.
- Lifecycle: part1 21/21, part2 16/16, part3 9/9, part4 4/4, part5 4/4 = 54/54 ok, 0 failed.
- `npm run e2e`: `OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0. No load-sensitive failures.
- `npm run shots`: 592 shots; host-leak 163 kinds / 978 comparisons; modal host-leak 39 kinds / 234 comparisons; capture clip 147; rc 0.
- Freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- `npm run parity` (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc593-r1-impl/)
base-quiet1-, base-loaded1/2-, base-heavy1/2-, after-heavy1/2/3-, after-quiet1/2/3-, e2e-full-, jest-, jest2-, lc1..lc5-, shots-, freeze-, parity-, tsc1- `a0b087f1.log`; cmp-run1-data-a0b087f1.log (variant A old-vs-new), cmp-a0b087f1.log (variant B old-vs-new per-scan), trace-after-a0b087f1.log, census-instrumented/new/new2-a0b087f1.ts (scratch copies of temp versions).
Failing-run bundles from the baseline heavy runs: `<worktree>/draw-steel-elements/e2e/.out/20261111-162715-db0c/CENSUS-07`, `.../20261111-162907-f9e5/CENSUS-07` (retention prunes after 12 runs).

Drive-by fixes: none.
Follow-ups: (1) `e2e/README.md` / dse-verify may mention the "sequential per-node" census method; not checked, left alone. (2) Commit `fcb08de6` message has an awkward phrase ("fewer round trips-time"); not pushed, owner may reword at landing. (3) The e2e gate still has other 45 s tests with multi-step flows that could exceed budget at loadavg >60; not measured, out of scope.

---

# Round 2 (fix round: LOW-1, INFO-1, rebase)

## Summary
- Verdict: DONE. Final dse sha `4f0c87f2`, rebased onto origin/develop `94133a5a` (develop moved ec26b709 -> 94133a5a mid-round; the ec26b709 rebase gates were discarded and the full battery re-run on 94133a5a). Not pushed.
- Commits: `be6bd5f3` (driver), `0a5e8ea1` (spec), `4f0c87f2` (LOW-1 + INFO-1, one commit). fcb08de6's wording was not reworded (optional).
- LOW-1: an input-event listener with no `backendNodeId` now throws; INFO-1: `Runtime.releaseObjectGroup` in `finally` has `.catch(() => {})`.
- package.json/lock unchanged by the rebase, no `npm ci` needed; the rebase touched no e2e file.
- Gates at 4f0c87f2: tsc rc 0, lint rc 0, jest 7239 passed / 1 skipped (css cached; fresh would read 7238/2), lifecycle 55/55 (21+16+9+4+5), e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, shots 592 (163/978, 39/234, clip 147), freeze 280/280, parity 0/0/24; all rc 0.
- CENSUS-06 passed (764 ms); CENSUS-07 2380 ms in the full run.

## Detail
Ran as one script (`battery-r2b-a0b087f1.sh`) of sequential gates, each with its own log and `GATE-RC=` line. Logs in `.../sc593-r1-impl/`: `tsc|lint|jest|lc1..lc5|e2e|shots|freeze|parity-r2b-a0b087f1.log`, `battery-done-r2b-a0b087f1.log`.
Earlier discarded ec26b709 run (`*-r2-a0b087f1.log`, head `ad8c9df5`): jest 7207/1, lifecycle parts 1-5 all ok, e2e 262/267 (CENSUS-07 1119 ms, CENSUS-06 629 ms), shots rc 0; freeze/parity not run on it.
Drive-by fixes: none. Follow-ups: none new.
