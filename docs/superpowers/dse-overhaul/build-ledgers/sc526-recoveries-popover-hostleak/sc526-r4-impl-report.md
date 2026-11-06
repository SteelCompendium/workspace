# SC-526 r4 impl report

## Executive summary
1. STATUS DONE. dse branch sc526-recoveries-popover-hostleak = 6270e84a1... (6270e84a) on origin/develop 69b5c0d4 (rebased from 7bd8040b after SC-349 landed; full battery re-run on the final base).
2. dse commits: 190d1d49 option A CSS + 5 tests; 1901b894 sweep popover mount + 4 tests; 6270e84a r4 fixes (LOW-1 comment "the ds-stamina-bar element's", INFO-5 "until SC-526 the gallery sweep never mounted them").
3. Superproject head f99741d0 on origin/main e642f51b: ef4e60c3 CHANGELOG bullet (Unreleased) + f99741d0 LOW-2 ("text colour and font size"). dse pointer bump unstaged. Other submodules at their pins (no change). package.json unchanged, no npm ci.
4. Gates (all rc 0): tsc, lint; jest 6492 passed / 1 skipped / 257 of 258; lifecycle 52/52 (21+16+9+4+2); e2e 128/128 ok, 0 failed, 0 known-bug, 89/89; shots 592 0 FAIL, button host-leak 163/978, 34-record boundary unchanged, capture clip OK; 592 PNGs sha-identical to 69b5c0d4 run; freeze 280/280 no rebaseline; parity 0 gap / 0 undeclared / 24 declared.
5. Drive-by fixes: none. Follow-ups: none.
Evidence: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r4-impl-w3p8/ (tsc.log lint.log jest.log lc1-5.log e2e.log base.log final.log base-592.sha256 final-592.sha256 freeze.log parity.log; superseded 7bd8040b runs in pre-rebase/).

## Notes
- origin/main moved twice during the round (292baee2 -> 219b4848 -> e642f51b, docs/handoff only); the superproject CHANGELOG commits were re-rebased last, after the gates (no gate depends on superproject docs).
- Log diff base.log vs final.log: only the button host-leak line (161/966 -> 163/978) and harness.css size. Anti-vacuity from r2 not re-run (mount and CSS unchanged apart from comment text).
- lifecycle part 5 = G-S59 G-S49 (2 ok), part 4 = G-S57 G-S62 G-S61 G-S56 (4 ok).
