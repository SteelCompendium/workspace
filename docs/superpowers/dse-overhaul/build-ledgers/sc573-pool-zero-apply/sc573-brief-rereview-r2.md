# SC-573 scoped re-review brief, round 2

You reviewed round 1 (`75cd1acb`, verdict LAND, report `sc573-review-r1-report.md` in this dir).
The implementer folded all five of your findings (owner ruling in `decisions.md`, 2026-11-11 —
read the "finding rulings" entry). Their report: `sc573-impl-r2-report.md` (executive summary first;
verify, do not trust).

Scope: the DELTA only — `git -C /home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply/draw-steel-elements diff 75cd1acb..HEAD`
(if the branch was rebased, use `git range-diff` against your reviewed commits instead).

Check:
- LOW-1: rerun your negative-pool probe (pool -3, + then −) and your head-vs-develop grid
  (`probe-grid` in your r1 scratch folder). Pools > 0 must still show 0 differences; the -3 case must now
  equal the pool-0 nothing-staged state; Apply writes 0.
- The normalisation does not change heal behaviour for any squad (consistent or underfunded captained —
  SC-421's class stays exactly as develop).
- INFO-1 CHANGELOG wording makes no claim that is false for an underfunded captained squad.
- INFO-2/3/4 done as ruled; if a branch of `appliedPoolChange` was removed, confirm it is dead.
- Vacuity of any new test.
- Gates: re-read the implementer's gate logs for the new head (paths in their report) and rerun full
  jest plus POOL-K07 alone yourself. Full e2e only if the delta touches anything beyond the modal file,
  tests and CHANGELOG.

Same footguns as your r1 brief (`sc573-brief-review-r1.md` §Footguns). New scratch subfolder
`sc573-review-r2/`. Do not edit or commit on the branch.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc573-pool-zero-apply/sc573-rereview-r2-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, findings by severity, numbers).
Final text to the ticket-owner: verdict, counts, numbers, artifact paths. No prose. If you need input,
end with STATUS: NEEDS_CONTEXT.
