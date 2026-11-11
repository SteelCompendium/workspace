# SC-593 decisions ledger — e2e CENSUS-07 hits its 45 s timeout under heavy load

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc593-census07-load-timeout (dse branch `sc593-census07-load-timeout`, cut from develop c3fd8323)

## Ticket ask (description, 2026-11-11)
"A gate that fails only under load costs a re-run each time it fires. Make it robust to load, or give it a load-aware timeout."

No Scott rulings yet (thread empty at start).

## Baseline at c3fd8323 (dispatcher, 2026-11-11)
jest 7200 passed / 1 skipped · lifecycle 54/54 · e2e `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Owner analysis (2026-11-11)
- CENSUS-07 (`e2e/specs/_census.e2e.ts:95`) runs FIVE `eventfulNodes` scans of `[data-dse-element="initiative"] *` (two of them back-to-back on identical state: lines ~99-100), two note opens and three waitFors, all inside one 45 s mocha budget (`e2e/wdio.conf.mts:47`).
- `eventfulNodes` (`e2e/driver/census.ts:27`) does one sequential CDP round trip per node in scope (`DOMDebugger.getEventListeners`) plus one more per eventful node (`Runtime.callFunctionOn`). Cost scales with node count x round-trip latency; under loadavg ~27 the latency balloons. The tracker scope is the largest in the census.
- Preferred direction: make the scan cheap (fewer/batched/concurrent round trips; drop the duplicate scan) so the test is robust to load, rather than only raising its timeout. A per-test timeout raise is acceptable only as a measured backstop, not the fix.
- Constraints: scenario id stays `[CENSUS-07]` (no new ids unless a split is justified; any new id must be unique and not collide with parallel branches); never a bracketed ticket id in a test title (SC-577); findings semantics must be identical (same nodes, same events, same ids).

## Rounds
- 2026-11-11 r1: implementer (orchestration:implementer, id a0b087f1) dispatched with `sc593-brief-r1-impl.md` — measure, make eventfulNodes cheap (identical results), drop duplicate scan, per-test timeout only as measured backstop. Report → `sc593-r1-impl-report.md`. Ticket → Awaiting.
- 2026-11-11 r1 result: DONE at dse `b2b72774` (fcb08de6 driver: getEventListeners depth -1 per top-level scope element + batched callFunctionOn + released object group; b2b72774 CENSUS-07 duplicate scan dropped). CENSUS-07 alone: quiet 6.0 s -> 1.2 s; at loadavg 50-67 timed out 2/2 -> 3.2-3.4 s pass 3/3. Old-vs-new identical on all 15 census scans. No per-test timeout added. Gates all at baseline (jest 7200/1, lifecycle 54/54, e2e 260/265 0 failed 164/164, shots 592, freeze 280/280, parity 0/0/24).
  Follow-up rulings: (1) commit-message wording nit -> drop (cosmetic). (2) docs describing per-node method -> drop: owner grepped, e2e/README.md:69 only names `DOMDebugger.getEventListeners`, still true; dse-verify has no mention. (3) other multi-step tests at loadavg > 60 -> drop: unmeasured, speculative; load flakes already tracked as SC-517/SC-570/SC-534/SC-561.
- 2026-11-11 r1 review: orchestration:reviewer dispatched with `sc593-brief-r1-review.md` -> `sc593-r1-review-report.md`.
- 2026-11-11 dispatcher: SC-574 landed; dse develop now `ec26b709` (supersedes c3fd8323). New CURRENT: jest 7207 passed / 1 skipped · lifecycle 54/54 · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. "Rebase onto ec26b709 before you report land-ready."
  Owner: c3fd8323..ec26b709 touches no census file (pool modal src, pool e2e spec/driver/manifest, a new vault note, README line, CHANGELOG). Reviewer keeps reviewing b2b72774 (its findings stay valid); rebase + battery re-run happens AFTER the reviewer finishes, since it is running gates in the same worktree. Rebased run must also show CENSUS-06 (pool modal) green under the new driver.
- 2026-11-11 r1 review result: LAND-READY, 0 HIGH / 0 MEDIUM / 1 LOW / 4 INFO (`sc593-r1-review-report.md`). Equivalence 13/13 + 13 overlap + 26 planted; vacuity holds (planted unidentified div FAILs CENSUS-01/04/06/07). Reviewer timings CENSUS-07 alone old -> new: quiet 5.9-15.4 s -> 1.3 s; loadavg 21-27 20.5-34.2 s -> 4.7-5.1 s; loadavg 50-61 42.6 s / timeout -> 9.8-10.5 s (23% of budget).
  Rulings: LOW-1 (census.ts:61 input listener without backendNodeId silently skipped) -> FOLD: throw instead of continue. INFO-1 (census.ts:83-85 release in finally can mask original error) -> FOLD: `.catch(() => {})`. INFO-2 (loaded figure ~10 s, not 3.3 s) -> comment quotes reviewer's ~10 s. INFO-3 (15 vs 13 scans) -> comment says 13 (reviewer's probe). INFO-4 (develop moved to ec26b709) -> fix round rebases + full battery on new CURRENT.
- 2026-11-11 r2 fix round: implementer resumed (fold LOW-1 + INFO-1, rebase onto ec26b709, full battery). Scoped re-review of the delta -> r1 reviewer (did not author code).
- 2026-11-11 dispatcher: SC-595 landed; dse develop now `94133a5a` (supersedes ec26b709; DseModal click guard + keymap re-push, new lifecycle G-S83). Lifecycle 55: part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83` (5; ~304 s), G-S56 still last. CURRENT: jest 7238 passed / 2 skipped (fresh worktree) · lifecycle 55/55 (21+16+9+4+5) · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. "Rebase onto 94133a5a before you report land-ready." -> relayed to r2 implementer mid-round.
- 2026-11-11 r2 result: DONE at dse `4f0c87f2` on develop `94133a5a` (be6bd5f3 driver, 0a5e8ea1 spec, 4f0c87f2 LOW-1 + INFO-1). Gates: tsc/lint clean, jest 7239/1 (css cached), lifecycle 55/55, e2e 262/267 0 failed 164/164, shots 592 / 163/978 / 39/234 / 147, freeze 280/280, parity 0/0/24. CENSUS-06 ok, CENSUS-07 2380 ms in full run. Owner verified head/base via git.
- 2026-11-11 r2 scoped re-review: r1 reviewer resumed on delta 4f0c87f2 + rebase sanity.
- 2026-11-11 r2 re-review: LAND-READY, no new findings (throw path + swallowed release probed; range-diff identical; e2e 262/267 0 failed 164/164; CENSUS-07 1145 ms). Land-ready comment posted to SC-593 (`sc593-comment-landready.md`). No CHANGELOG entry (test-only, not user-facing). Ticket stays Awaiting until landed.
- LAND-READY: worktree sc593-census07-load-timeout, dse branch `sc593-census07-load-timeout` @ `4f0c87f2` on develop `94133a5a` (be6bd5f3, 0a5e8ea1, 4f0c87f2). Superproject: pointer bump only.
