# SC-575 r5 rebase report

**Executive summary**
- STATUS: DONE. Plugin rebased onto `a339e7b3` with no conflict; new head `734d7745`. Not pushed.
- `git log --oneline a339e7b3..HEAD`: `734d7745` review fixes, `af86ec28` the SC-575 fix.
- Superproject: rebased onto origin/main `b25d1a17`; one conflict (CHANGELOG.md), resolved keeping SC-480's bullet and adding SC-575's (pure addition, 3 lines); new commit `ed94416f` (was 776f7fad). Pointer not staged, no submodule update.
- Gates: tsc/lint clean; jest 7085 passed / 1 skipped (2 SC-568 timeouts in the full run, 78/78 alone); lifecycle 53/53; e2e 255/262 ok, 0 failed, 7 known-bug, 163/163; shots 592, 163/978, modal 39/234, clip 147; freeze 280/280; parity 0/0/24 (last).
- Superproject `status --short`: ` M draw-steel-elements` only.

## Gate lines (at 734d7745)
- tsc rc 0; lint rc 0.
- jest full: Test Suites: 2 failed, 1 skipped, 258 passed; Tests: 2 failed, 1 skipped, 7083 passed, 7086 total (loadavg 27). The two failures were "Exceeded timeout of 5000 ms": twin-reuse SC-547 (40 same-alias blocks) and initiative-default-keys SC-485 (pool back at parse value, captain trio). Both files re-run alone, -w 2: Test Suites: 2 passed; Tests: 78 passed, 78 total. So 7083 + 2 = 7085 passed, 1 skipped.
- lifecycle: 21/21, 16/16, 9/9, 4/4, 3/3 (G-S59 G-S49 G-S73) = 53/53; no red, G-S59 green first time.
- e2e: OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs
- shots: rc 0; 592 files; button host-leak 163 kinds / 978 comparisons; modal button host-leak 10 scenarios over 9 modal classes, 39 button kinds / 234 comparisons; capture clip 147.
- freeze: freeze OK (280/280 frozen print PNGs byte-identical)
- parity: 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s), rc 0.

## Conflicts
- Plugin: none (package.json unchanged between eeed5182 and a339e7b3 -> no npm ci).
- Superproject CHANGELOG.md: upstream's SC-480 bullet and my SC-575 bullet collided at the top of `## Unreleased`. Kept upstream bullets untouched, SC-575 bullet directly after SC-480 (blank line before it, as upstream had between SC-480 and SC-556). `git diff origin/main HEAD` = CHANGELOG.md, 3 insertions, 0 deletions.

## Superproject state
- `git log --oneline origin/main..HEAD`: ed94416f docs: changelog bullet for SC-575 (Reset encounter clears a squad's action pips)
- `git status --short`: ` M draw-steel-elements` (the submodule is on branch sc575-reset-squad-pips at 734d7745; origin/main pins a339e7b3); no other submodule shows as modified.

## Paths
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r5-rebase-report.md
- Skill proposal: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md
- Gate logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r5-impl-a1/{tsc,lint,jest1,jest-alone,lc1,lc2,lc3,lc4,lc5,e2e,shots,freeze,parity}.log (+ .rc)
