# SC-431 r3 rebase report

## Executive summary
- STATUS: DONE. dse `sc431-escape-field` rebased from `73e6a80` onto origin/develop `b6b08f3` (SC-455): new head `ab34293` (5 commits). Superproject rebased from `b67a07c` onto origin/main `8969a34`: new head `7afd315` (2 commits). Nothing pushed or tagged; the `draw-steel-elements` pointer is left unstaged.
- CONFLICTS: none, in either repo (git auto-merged everything; no src/ or test/ logic touched by a conflict). The census/manifest files auto-merged cleanly (SC-455 changed neither census nor manifests that overlap ours).
- CHANGELOG: SC-455's two bullets sit above ours (ours below theirs), as required.
- package.json unchanged -> no npm ci; host-css already cached (jest shows 1 skipped, no extra skip).
- Gates: tsc/lint clean; jest 5262 passed/1 skipped/230 of 231; lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572 0 FAIL + parity line; freeze 276/276; parity 0/0/24.

## Conflicts
None. (dse: `Rebasing (1/5)...(5/5) Successfully rebased`; superproject: `(1/2)(2/2) Successfully rebased`.)

## Coverage figure explained
57/57 = baseline 51 + 1 (r1: `sedit.temp.input` press:Escape) + 5 (r2 conditions-modal: `init.cond.add` click, `cond.add` click + press:Escape, `cond.input` type + press:Escape). SC-455's callout scenarios drive no manifested control pairs, so they add 0 pairs.

## Gates (dse head ab34293)
- tsc rc=0 clean; lint rc=0 clean.
- jest: `Test Suites: 1 skipped, 230 passed, 230 of 231 total` / `Tests: 1 skipped, 5262 passed, 5263 total`, rc=0 (5242 + our 20).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`, rc=0.
- e2e: `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, rc=0.
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (... 96 comparisons ...)`, rc=0.
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`, rc=0.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc=0.

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/)
sc431-r3-rebase-report.md, sc431-r3-tsc.log, sc431-r3-lint.log, sc431-r3-jest.log, sc431-r3-lifecycle.log, sc431-r3-e2e-full.log, sc431-r3-shots.log, sc431-r3-freeze.log, sc431-r3-parity.log
