# SC-612 r6 — rebase onto dse 2074a152 + workspace origin/main, full re-gate (resume of impl-r2)

Read: the ledger "Baseline moves" (decisions.md; the SC-581 entry is verbatim) and any r5 rulings below it; the common brief (sc612-brief-common-gates-footguns.md, updated to base 2074a152), same dir.

Task:
0. Before the rebase, fold the r5 rulings (ledger, "owner rulings on r5"): (a) the CHANGELOG sentence becomes exactly "An edit elsewhere in the note, or a sibling's + / -, does not cause a refusal." (drop "a counter with another value"); (b) document the accepted whitespace residual (r5 MEDIUM, E1 trailing space on a body line / E2 blank line before the closing fence, in a twin note, refused, base saved) in the `pinnedTarget` doc comment (comment only, no code change) and in the residual list of `sc612-dse-verify-proposal.md`. Commit.
1. `git -C <dse> fetch origin`; rebase the dse branch (tip a06dba37) onto origin/develop 2074a152 (or newer if it moved — report). SC-581 touched only the Conditions window; a conflict in host/lineMap code is unexpected — if one appears, STOP and return NEEDS_CONTEXT.
2. `git -C <superproject> fetch origin`; put the single CHANGELOG commit on current origin/main (re-apply the bullet as one commit if the rebase conflicts, as in r4). No pointer commits.
3. Full battery per the common brief: tsc + lint, jest (11707 / 2 at base + the SC-612 delta; r4 was +81), lifecycle 62/62 in seven parts (part 7 `G-S108`; G-S91 flake SC-616: re-run part 5 alone), e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, styles.css sha256 vs a clean 2074a152 build (identical -> shots/freeze/parity carry; else STOP, NEEDS_CONTEXT).
4. Update the CURRENT block in `sc612-dse-verify-proposal.md` with these numbers and shas.

Include in the report the output of `git -C <dse> range-diff 1516f894..a06dba37 <new base>..<new tip>` (it must show only the comment commit as new; no code delta), saved to `sc612-r6-range-diff.txt`.

Report: sc612-r6-rebase-report.md (<=10-line executive summary). Logs `sc612-r6-*`. Final text: STATUS, dse sha + base, superproject sha + base, every gate number, `git status --porcelain` (dse; superproject shows only the unstaged ` M draw-steel-elements`), artifact paths. Raw facts. Same footguns as before (no tracker, no /tmp glob rm, own PIDs only, poll own pid/log).
