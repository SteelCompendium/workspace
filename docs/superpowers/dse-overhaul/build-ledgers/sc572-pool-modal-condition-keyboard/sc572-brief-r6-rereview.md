# SC-572 r6 scoped re-review brief (rebase + INFO-1 fold only)

You are the r2/r4 reviewer, resumed. You did not write this code. Scope: (a) the rebase of the approved
`f62e1f5e` onto dse develop `eeed5182` — check `git -C <plugin> range-diff 97a9c93b..f62e1f5e eeed5182..5b599f70`
and look only at commits that are not `=` (conflict resolutions); (b) the INFO-1 fold commit `a339e7b3`
(after a keyboard removal of a minion's only condition, focus goes to `pool.damage-amount`, never a footer button;
mouse click unchanged). Implementer's report: `sc572-r5-rebase-fold-report.md` (same ledger dir as before).
Same footguns (§4 of sc572-brief-r1-implementer.md), fresh scratch `sc572-r6-rerev-<yourAgentId>/`. You never call
the tracker and never commit.

Lifecycle is now 53 scenarios after SC-480; part 5 is `G-S59 G-S49 G-S73` (G-S56 stays last in part 4).

Probe in real Obsidian: only-condition keyboard removal → focus on the damage field with the 2px ring, a second
Enter does not reset staged damage; damage field absent/disabled case falls back sanely; mouse click unchanged.
Run mutant "fold reverted" (focus back on footer) and confirm a test catches it.

Gates on the final head: e2e (expect 254/262 ok, 0 failed, 8 known-bug, 163/163), jest (the pool suites + full),
lifecycle part 5 (`G-S59 G-S49 G-S73`) plus part 1 (G-S1 drives the pool icon), shots + freeze only if the delta
or the rebase resolution touches CSS or the harness. Known load flakes: RECOV-R07 (SC-517/570), CENSUS-07 (SC-593),
montage wheel (SC-521).

Report `.../sc572-r6-rereview-report.md` (≤10-line exec summary first), verdict LAND-READY / FIX-NEEDED, findings
by severity with file:line. Return raw facts + absolute artifact paths.

Owner pre-check (2026-11-11): range-diff `97a9c93b..f62e1f5e eeed5182..5b599f70` is all `=` (4/4, no conflicts), so
part (a) needs only a confirmation; your real scope is the 11+/8- fold commit `a339e7b3`.
