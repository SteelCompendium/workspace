CENSUS-07 no longer times out under heavy load. Alone it now takes about 1.2 s on a quiet host, down from 6 s. At a load average of 50-61 it takes about 10 s, well inside its 45 s limit. At that load the old code took 42.6 s in one run and hit the 45 s limit in the other. Nothing needs your decision; this is ready to land.

**What was slow.** The census asks Chrome which elements listen for clicks, pointer or key events. It asked one element at a time: 380-526 round trips per scan of the initiative tracker. CENSUS-07 runs that scan several times, so under load the round trips added up past the 45 s limit.

**What changed** (test code only; the plugin itself is untouched):
- `e2e/driver/census.ts`: one Chrome call now covers each top-level element in the scanned area and everything inside it. That is 3 calls on the tracker instead of hundreds. It returns the same nodes and events as before.
- `e2e/specs/_census.e2e.ts`: CENSUS-07 had scanned the open title editor twice in a row. It now scans once and checks the result twice.
- The 45 s timeout is unchanged. The worst loaded run used about 23% of the 45 s budget.

**How we know the census still catches what it should.** The old and new methods ran side by side on all 13 census scans (CENSUS-01 to CENSUS-09), and their results were identical.

An independent reviewer also planted an unlabeled clickable element inside four of the scanned areas. CENSUS-01, 04, 06 and 07 each failed on it, so the faster census still catches a control with no id. The census now also stops with an error, instead of silently skipping, if Chrome ever reports a listener it cannot tie to an element.

**Gates** at dse `4f0c87f2`, on develop `94133a5a`:
- jest 7239 passed, 1 skipped
- lifecycle 55/55
- e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`
- shots 592
- freeze 280/280
- parity 0 gaps, 0 undeclared warnings, 24 declared deferrals
