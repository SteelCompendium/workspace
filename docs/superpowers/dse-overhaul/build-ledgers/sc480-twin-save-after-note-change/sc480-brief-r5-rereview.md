# SC-480 r5 — scoped re-review of the r4 delta (R1, resumed)

Scope: dse cb665989..63492c9a (on base 97a9c93b), superproject 3efbbc13..bbfbeade. Delta only, not a fresh full pass.
Read: decisions.md "Owner rulings on r3" + the LOW-2 ruling (C, superseding the LOW-2 fold), sc480-r4-fix-report.md
(incl. its "Final" section).

Check:
- MEDIUM-1 fixed in real Obsidian: sync-del-bump refused (RV/LP, leave/stay) with exactly 1 Notice, note byte-identical
  to the outside edit. The guard adds no new refusal for twin-free shapes: cutpaste-solo, moved block, long twin-free
  (>400 edits), heading embed, callout, unterminated trailing fence, CRLF, spaced fence; race cells still land.
  Probe the guard's edge: a pin whose block was edited in place (hand-twin, hand-solo), a block moved AND its
  neighbour edited in one change, k=3 twins.
- LOW-3: G-S73 fails on your Mb mutant; LOW-1 + LOW-2(C): both CHANGELOG entries match measured behaviour.
- Mutants of `landsOnOtherBlock` (your own, not the implementer's).
- Re-run: tsc, lint, jest, lifecycle part 5 (`G-S59 G-S49 G-S73`) and part 3, e2e; styles.css = 4295ca33.
All footguns from the r3 brief (sc480-brief-r3-review.md §3) still bind. If the report-file write is blocked again,
return inline. Return: verdict LAND / FIX FIRST, findings by severity with file:line, gate summary lines, artifact paths.
