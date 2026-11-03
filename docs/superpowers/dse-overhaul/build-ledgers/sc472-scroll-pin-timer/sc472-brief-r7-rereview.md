# SC-472 r7 — scoped re-review of the r6 delta (reviewer, resumed r3/r5)

Worker for ticket-owner SC-472. **You never call the tracker; commit nothing.** All r3 footguns apply (`sc472-brief-r3-review.md` §Footguns), plus: use your own `DSE_LIFECYCLE_PORT` (SC-551); **never glob-rm under /tmp** — another effort's worker deleted 6 `/tmp/dse-obsidian-lifecycle-*` dirs today; delete only your own run's dirs by literal path.

Context (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`): ledger `decisions.md` ("Owner rulings on r5" = what r6 had to fix; "Owner rulings on r6" = what you check), r6 report `sc472-r6-fix-report.md`, your `sc472-r5-rereview-report.md`.

Head: dse **`83486f84`** on develop **`711f740d`**; superproject **`649374a3`**. r6 reports jest 6359 / 1 / 252 of 253, lifecycle 49/49 in five parts.

Scope: the r6 delta (use `git range-diff` from `4a9e77fb` across the rebase onto `711f740d`), not a fresh pass. Verify by executing:
1. r5 MEDIUM-1 fixed: re-run your two-tracker probes (`sc472-r5-two*`) and Risk 4 probes on the head bundle — held; stock still holds.
2. Dropping evidence (b) + "recovered since the arm counts as recovered" misses no real redraw and never sticks a pin: pin life on redrawn writes (G-S8 on/off, G-S42, G-S52, sibling), a re-armed pin during a redraw, two writes in flight.
3. G-S59 (c) at the 2.4 s release point: the 1 s-delay control FAILs; a correct build never trips the "pin on at 2.4 s" assertion or the exact end bound (run G-S59 twice).
4. **G-S61 (e) flake** — run `--only=G-S61` at least 3× on head and 3× on a `711f740d` base bundle at similar load (record loadavg). Only on head → a finding with a prescribed fix; on both → say so (owner files a flake ticket); neither → say so.
5. Rebase-conflict resolution in `visual-harness/obsidian-lifecycle.mjs`: G-S61 / G-S62 / G-S59 bodies intact (diff each against develop / r4), SCENARIOS order ends `… G-S61 G-S59 G-S56`.
6. Docs: KNOWN LIMIT (3), CHANGELOG scroll clause, proposal's five-part layout and controls, accurate.
7. Re-run tsc, lint, jest, lifecycle `--only` G-S8,G-S15,G-S18,G-S42,G-S52 and G-S59.

Report `sc472-r7-rereview-report.md` (evidence `sc472-r7-`), ≤10-line executive summary first: APPROVE / REQUEST_CHANGES, counts by severity, gate lines. Findings with file:line, scenario, prescribed fix. Final text: raw facts + absolute paths.
