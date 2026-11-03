# SC-552 r5 brief — scoped re-review of the r4 delta + the ea78ebf8 rebase seam (no commits)

You (R1) did the r3 review; you did not write r4. Review ONLY the r4 delta and the rebase seam, not a fresh full pass. Final text goes to the ticket-owner.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/decisions.md` — "Owner rulings on r3 (2026-11-03)" (MEDIUM-1, LOW-1..3, INFO proposal all FOLD; LOW-2 comment only) and the ea78ebf8 entry (SC-547: `PassMemo` per `reconcile` pass, per-alias block list, in `ReadingModeBlockHost.ts` and `remountReused.ts`).
- r4 report: `.../sc552-r4-fix-report.md` (old→new sha map, HEAD sha). Your r3 report and mutant script `sc552-r3-mutants.py` are in the same dir.
- Range-diff the r3-reviewed series against the rebased one: `git -C <plugin> range-diff 0698550f..260763ab ea78ebf8..<HEAD>`; every pre-existing commit should be `=` or a conflict-resolution-only change; the new commits are the r4 fixes.
- `git -C <plugin> fetch origin`; report whether `origin/develop` moved past ea78ebf8.

## Check
1. MEDIUM-1 fixed: re-run your holder-leak jest probe (`sc552-r3-jest-holder-leak-probe.test-snippet.ts`) → 0 holders over 5 cycles; real Obsidian registry `_children` stays flat over 5 Saves and over Cancel + outside edit; the new G-S64 assertion exists and FAILS with the `closed` guard removed (mutant).
2. LOW-3: R3-M9 now red in jest.
3. LOW-1: CHANGELOG (worktree superproject) claims only what was measured; nothing about SC-556's case.
4. LOW-2: comment present and accurate.
5. Rebase seam with SC-547: conflict resolution in `ReadingModeBlockHost.ts` keeps SC-547's `PassMemo`/per-alias behaviour and our pin/pinnedTarget/keep-open behaviour. G-S57, G-S61, G-S64 green (run them yourself: `--only=G-S57,G-S61,G-S64`-style per dse-verify row 4 — check the real flag syntax); jest green; tsc/lint clean.
6. Proposal file `sc552-dse-verify-proposal.md`: numbers match r4's measured ones, 19 phases ((a)-(i),(k)-(t); (t) added in r4 for the Cancel + outside-edit holder check), part placement correct.
Findings by severity with file:line, verdict LAND-READY or NOT.

## Footguns
Same as `sc552-brief-r3-review.md` §4 (devbox `-c`, no compound cd, `git -C`, foreground one gate per call, no glob/variable `rm`, PID-only kills, private scratch `.../scratchpad/sc552-r5-<agentId>/`, commit nothing, tree status before/after, NEEDS_CONTEXT instead of messaging, never call the tracker).

## Report
`.../sc552-r5-rereview-report.md`, ≤10-line executive summary first. Final text: verdict, findings, gate lines, mutant results, tree status, absolute paths of every artifact.
