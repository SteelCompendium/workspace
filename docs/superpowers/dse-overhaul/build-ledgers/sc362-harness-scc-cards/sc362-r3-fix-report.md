# SC-362 round 3 fix + rebase report

## Executive summary

- STATUS: DONE. dse branch `sc362-harness-scc-cards` @ `bc4a0c5` (2 commits: `aff5034` impl, `bc4a0c5` review fixes) on base `origin/develop` `08206e3` (SC-466). Clean tree.
- Superproject `sc362-harness-scc-cards` @ `f029e59` = `origin/main`, carries 0 commits of its own. Its only change is the uncommitted `draw-steel-elements` pointer (`wt-finish`/landing commits it).
- Battery on 08206e3: tsc, lint clean. jest 5457 passed / 1 skipped / 232 of 233 suites (base 5446, +11). lifecycle 30/30. e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
- shots 580 PNGs, 0 FAIL, `montage board scroll OK` printed. freeze `freeze OK (276/276 …)` after both sweeps. parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.
- Widening: 4 lines re-hashed on 08206e3; the hashes are UNCHANGED vs the 0ce76dd set. Two clean sweeps byte-identical (all 580 files). 0 collisions; simulated widened baseline 280/280 OK, 0 removed lines.
- `package.json` did not change in either rebase, so no `npm ci`.
- A sweep started on the intermediate base 1c271b5 was killed by PID when 08206e3 landed; its numbers are not used. (The 1c271b5 jest/lifecycle/e2e/freeze/tsc/lint all passed too; discarded per the instruction.)

## Fixes (commit bc4a0c5, "fold" items only)

- LOW-1 `fixtures.test.ts`: the no-compendium mixed-stack test's comment now says it renders an ERROR card ("Compendium not installed") and does not exercise the notice guard (the web-card test does); it also asserts `'error card'` is in the errors. No new `test()` block, so the new-test delta stays +11.
- LOW-2 `entry.ts` heroSparse comment: names the real class `.dse-hero__ability-issue`.
- INFO-3 `entry.ts` `harnessCompendiumModeFor`: fallback comment mentions mountOne's `probeSource` step.
- INFO-4 `entry.ts` `attachHarnessCompendium`: path and `SccResolver` use `deps.settings`, not `DEFAULT_SETTINGS`.
- Not touched (per instruction): SC-469 opt-outs, INFO-2, INFO-5.

## Widening

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-widening.txt`:
```
a06111886c3932c71ead7070c437fe7515b504719b15223f6217720cebb32399  condition-by-scc--steel-print.png
2c8c000f28a0cd0cfe84d5aa6077647de5d33fa641c0890b21679cdd63d76e64  condition-by-scc--steel-realprint.png
1d5d7f7ee7d157211131e338cc90e8c62bb20f3fbd42604d99fd15c71bba260e  rule-by-scc--steel-print.png
e55015057f0847990bc5f1ee5d6d3f088973688aa2b4efb0029ec627c68040d7  rule-by-scc--steel-realprint.png
```
Identical to the 0ce76dd set (cmp). Baseline not edited.

## Evidence

Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r3-fix-w7p2/base08206e3/`: `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `e2e.log`, `shotsA.log`, `shotsB.log`, `freezeA.log`, `freezeB.log`, `parity.log`, `widen-run.log`, `widenA.txt`, `widenB.txt`, `treeA.txt`, `treeB.txt`, `shots-sweepA/` (580 PNGs). Sweep B PNGs: `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements/visual-harness/shots/`.
