# SC-490 rereview1 brief — scoped re-review of the r2 delta + rebase

You are the SC-490 review1 reviewer, resumed for a SCOPED re-review (delta only, not a fresh full pass). Same rules as `sc490-review1-brief.md` §4 (command and safety rules) — they still apply in full. Final text goes to the ticket-owner. Workers never call the tracker.

## Context
- Ledger `decisions.md` ("Base moves", "Review 1 rulings") and `sc490-r2-report.md` (exec summary first), both in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column`. dse head `e4f394fa` on develop `09ece2eb` (you reviewed `b3378747` on `0698550f`). Superproject head `a01d8001` on main `ca0cbd1b`.

## Scope
1. `git range-diff 0698550f..b3378747 09ece2eb..e4f394fa~2` (dse): confirm the six r1 commits carry no content change. Superproject: confirm the CHANGELOG conflict kept both bullets and the pointer is `e4f394fa`.
2. Review the two new commits `214f17e4` (LOW-1 option A: cross-reference comments + jest guard that the four fill literals stay inside their theme's `--dse-card-bg` stops) and `e4f394fa` (INFO-4: board-scroll gate in light theme too). Probe that each guard/check can fail (re-run one can-fail of each yourself) and is not vacuous. Check the rulings were followed as written (ledger "Review 1 rulings" LOW-1 and INFO-4) and nothing ruled DROP was done.
3. Re-run only: tsc, lint, jest (expect `6425 passed / 1 skipped`, 254 of 255 suites), the shots run (592, 0 FAIL, 161/966, `montage board scroll OK` naming both themes; check `/proc/loadavg` first; if it's high, wait or note it), freeze (280/280), parity (0/0/24). Lifecycle and e2e are NOT required from you: the r2 changes are a CSS comment, a jest test and a harness gate, and r2 ran them green on this head. Say if you disagree.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-rereview1-report.md` is WRONG — write to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-rereview1-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-ROUND, severity counts, measured gate lines). Findings by severity with file:line and a prescribed fix. Return contract: raw facts + absolute artifact paths. If you need input: STATUS: NEEDS_CONTEXT. If you ever message anyway, first word `SC-490:`.
