# SC-551 r5 — scoped re-review of the r4 delta

You are the SC-551 reviewer (you did the r1 survey and the r3 review; you wrote none of the code). Scope: the r4
DELTA only, not a fresh full pass. Final text to the ticket-owner: verdict LAND / FIX-FIRST, findings by severity
with file:line, absolute paths. Same rules, private ranges and footguns as `sc551-brief-r3-review.md` (re-read its
Context + Footguns), plus: never use a glob `rm` anywhere — delete only literal paths you created; a run that fails
on a missing vault/udd/kept-FAIL dir is environmental, re-run once and say so.

## Inputs

- Ledger rulings R11–R15 in `decisions.md` (same dir) — judge the delta against them.
- `sc551-r4-fix-report.md` (exec summary first) and `sc551-r1-dse-verify-proposal.md` (R13 text).
- The delta: `git -C /home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements range-diff`
  of the r3 head `5fc0fec2` vs the r4 head over the rebase onto `711f740d` (via `f7c9c7ce`) (or diff the r4 head against
  `5fc0fec2` rebased); confirm the rebase kept SC-540's G-S62 + its harness commit and SC-544's G-S61 intact and did not touch any
  scenario code.

## Probe

1. H-1: re-run YOUR `p-two-cameras` and `p-shared-udd` probes on the r4 head (3+ pairs at 0 ms, a few at 0–600 ms;
   helper-alone 10 tries). Expected: never two runs on one Obsidian; the loser exits 2 naming foreign-listener (or
   equivalent).
2. Mutate the new socket-owner check (e.g. skip it, accept any pid, read only `tcp6`) and confirm a unit test fails.
3. L-1 / L-2 / L-3: one probe or read each.
4. Gates: tsc + lint + jest once (the r4 report's jest line); lifecycle part 1 (21) on a private explicit port. Do
   not re-run the full battery.

## Report

`.../sc551-lifecycle-cdp-port-race/sc551-r5-rereview-report.md` with a ≤10-line executive summary; evidence in
`.../sc551-r5-evidence/`.
