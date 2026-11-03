# SC-472 r5 — scoped re-review of the r4 delta (reviewer, resumed r3)

Worker for ticket-owner SC-472. **You never call the tracker; commit nothing.** All r3 footguns still apply (see `sc472-brief-r3-review.md` §Footguns).

Context: ledger `decisions.md` ("Owner rulings on r3" = what r4 had to fix), r4 report `sc472-r4-fix-report.md` (exec summary), your own `sc472-r3-review-report.md`. All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`.

Scope: the delta `ebd81e5e`-equivalent → r4 head (use `git range-diff` across the rebase onto `423e798d`, then review the new commits), plus the superproject CHANGELOG commit. Not a fresh full pass.

Verify, executing your own probes:
1. MEDIUM-1 fixed: re-run your Risk 4 probes (`sc472-r3-risk4-*`) on the r4 head bundle — held, no clamp; stock still holds; and the redraw-start evidence rule does not now miss a real redraw (G-S8 adoption on and off, G-S42, G-S52, G-S59 (a)(b) still ok; a pin never sticks to the 20 s cap on a normal redrawn write).
2. G-S59 (c) discriminates: FAILs on the ebd81e5e head bundle, passes on r4 head.
3. LOW-2: navigating a pinned leaf to another note releases at once (numbers vs stock 2548 ms and ebd81e5e 3524 ms).
4. `takeRecords()` hardening closes your same-delivery re-pin case.
5. Docs/CHANGELOG/proposal wording (LOW-1/3/4, units, "about 1 second longer") accurate.
6. Spot-check 2 new mutation claims. Re-run tsc, lint, jest (expect r4's number; develop eafe76e1 is 6287 / 1 / 251 of 252), lifecycle `--only` G-S8,G-S15,G-S18,G-S42,G-S52 and G-S59 — with your own `DSE_LIFECYCLE_PORT` (SC-551: concurrent runs on 9262 mass-FAIL). Base for controls is now `eafe76e1`.

Report `sc472-r5-rereview-report.md` (evidence `sc472-r5-`), ≤10-line executive summary first: APPROVE / REQUEST_CHANGES, counts by severity, gate lines. Findings with file:line, scenario, prescribed fix. Final text: raw facts + absolute paths.

## Addendum (owner, after r4)

r4 head: dse **`4a9e77fb`** on develop **`eafe76e1`** (the pre-fix head is now `b8f7fcb2` after the rebase); superproject **`1db278aa`** on origin/main `55588e9a`. r4 reports jest 6338 / 1 / 252 of 253, lifecycle 47/47 (port 9481), e2e 128/128 89/89, shots 592 161/966, freeze 280/280, parity 0/0/24.

Also judge r4's own follow-ups:
7. Evidence (b) counts any new root, so a reader who scrolls a SECOND tracker into view for the first time during a late redraw, while the first is virtualised out, could start the redraw early (KNOWN LIMIT (3)). Try to reproduce it once; if it clamps where stock holds, report a finding with a prescribed fix.
8. G-S59 (c) waits a fixed 300 ms after the scroll, so a build that releases the pin later than that would pass it. Is (c) weakened in a way that matters? If yes, prescribe the wait (e.g. until the sizer has recovered or the backstop fired) — would a "release 1 s after the root leaves" variant escape it today?
9. (c) judges the clamp by the scroller's height during the collapse, not scrollTop equality, and bounds the end position loosely (1000 px). Is that criterion sound, or can a real clamp pass it?
