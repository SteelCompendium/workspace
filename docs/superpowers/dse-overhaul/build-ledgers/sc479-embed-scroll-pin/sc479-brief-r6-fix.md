# SC-479 r6 brief — fix round (implementer, resumed r2)

Final text goes to the ticket-owner. Workers never call the tracker.

## Context
- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/decisions.md` — "r5 DONE" and "Owner rulings on r5".
- r5 report `.../sc479-r5-rereview-report.md` (MEDIUM-1 section, the `alt-geo` guard and how it was built) and `.../sc479-r5-evidence/` (probes `probe-q*.log`, scripts `*.txt`, the R5-INSIDE / BELOW / R3-END probe definitions — copy into your private scratch, never edit in place).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`: dse `e6b02ca` on develop `c558759` (still the tip at dispatch); superproject `f6661ad` on `5902c18` (dse pointer unstaged — keep it so). If develop or origin/main moved, rebase first and report it.

## Rulings (verbatim from the ledger)

> - **Bar: never worse than stock (base) in any measured geometry**, and keep head's below-the-embed improvement where it costs nothing.
> - **MEDIUM-1 → FOLD a geometry gate decided at pin time (r5's "combined rule"):** apply the embed anchoring stop when (i) a DSE root inside an embed intersects the viewport, OR (ii) no DSE-bearing embed intersects the viewport (reader wholly outside the embeds, e.g. below them); do NOT apply it when the viewport intersects a DSE-bearing embed but none of its DSE roots (reader inside the embed's other content — anchoring there compensates correctly). Measure: G-S42 (a)-(e), r3host end ×5 writers, R5-INSIDE add/remove at +150/+500 (must be 0 px), BELOW+100 add/remove (must be 0 px). **If the combined gate fails any of these, fall back to `alt-geo`** (r5's exact guard) and say which geometry failed.
> - Add **G-S42 phase (f)**: reader inside a tall embed below the tracker; a hero added; the visible text must not move. Add control **"embed stop with no geometry gate"** (= e6b02ca) which must FAIL (f). Keep all existing controls (the "scroller rule" control still FAILs (e)).
> - **Information only, no fix:** with a DSE root on screen and the viewport wholly inside a tall tracker, a hero added ABOVE the viewport — measure base vs head and report (expected: the pin holds scrollTop and the text shifts by the row height, the same as SC-198/SC-470's own-view pin). Not a finding unless head is worse than base.
> - Header `:105-110` → rewrite with the measured gate and its reasons.

Jest: the gate's three branches each get a test that fails when the branch is removed (mutation-check and list). Phase (f): no timed delay decides an outcome (dse-verify authoring rule); anti-vacuity checks as in (e). Commit after each coherent step. No Co-Authored-By trailer.

## Gates on the final head (full battery, dse-verify order)
tsc + lint clean · jest **6105 + SC-479's tests passed / 1 skipped / 247 of 248** · lifecycle **40/40** (split into `--only` halves if needed to stay under 600 s; report the union) · e2e **124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs** · shots **592, 0 FAIL** with `button host-leak OK (114 … 684 …)` · freeze **280/280** · parity **0/0/24** (last). `styles.css` byte-identical to a base build.
Discrimination, 2 runs each, `--only=G-S8,G-S15,G-S18,G-S42`, per-phase results: head ok; base FAIL; "host pins without the anchoring rule" FAIL; "host pin disabled" FAIL; "anchoring stop on the scroller" FAIL (e); new "embed stop with no geometry gate" FAIL (f); G-S8/G-S15/G-S18 ok throughout.
Plus the probe table above (R3-END ×5, R5-INSIDE ×4, BELOW+100 ×2, and the information-only row), base vs head, 2 reps each.

## Footguns (unchanged)
`devbox run -c <dse abs path> -- bash <script file>`; no `cd` in compound commands; `git -C` always; exit codes from inside script files. One blocking foreground gate per Bash call; no `run_in_background`, no detached subshells, no `Monitor`. No `rm` with a variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob. No pattern kills; PID in your worktree only. Scratch only in `…/scratchpad/sc479-r6-<agentId>/`, files via the Write tool. Never key a wait-loop on a scratch filename or contents. Workspace-level files (CHANGELOG.md) only in your worktree's superproject.

## Report
`.../sc479-r6-fix-report.md`, ≤10-line executive summary first (shas, which gate shipped — combined or alt-geo and why — probe table, gates, discrimination). Updated proposed dse-verify text (G-S42 phases (a)-(f), four controls). Evidence under `.../sc479-r6-evidence/`. If the write is blocked, return it inline. Final text: raw facts + absolute paths. Need input → STATUS: NEEDS_CONTEXT.
