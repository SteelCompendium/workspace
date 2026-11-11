# SC-575 r3 rebase report

**Executive summary**
- STATUS: DONE. Rebased onto `eeed5182`; new plugin head `3609e3e9` (branch sc575-reset-squad-pips). Not pushed; superproject pointer not staged.
- `git log --oneline eeed5182..HEAD`: `3609e3e9` review fixes, `8f7e1c91` the SC-575 fix (was bcb015de).
- Superproject CHANGELOG commit: `776f7fad` (only /CHANGELOG.md staged, in the worktree superproject).
- One conflict (plugin CHANGELOG.md, both added a bullet under 7.0.0): kept both, SC-480 bullet first, then SC-575. No other conflict; package.json unchanged, no npm ci.
- Gates: tsc/lint clean; jest 7080 passed / 1 skipped, 0 failed; lifecycle 53/53; e2e 252/260 ok, 0 failed, 8 known-bug, 161/161; shots 592, 163/978, 147; freeze 280/280; parity 0/0/24 (last).
- G-S59 green first time this round (loadavg 2-5 throughout the lifecycle parts).

## Folded review items (commit 3609e3e9)
- LOW-1 src/elements/initiative/model.ts:27-29 header: appended "— except a minion squad's shared `Creature.actions` (SC-278), cleared explicitly (SC-575)".
- LOW-2 plugin CHANGELOG.md: "second Move" -> "Second move".
- INFO-2 e2e INIT-X07: after the note assertion, also asserts aria-pressed="false" on all five `init.detail.squad-action` controls (nth 0-4) on screen. Passed in the full run (INIT-X07 ok, 1939 ms).
- INFO-3 workspace CHANGELOG bullet under "## Unreleased" (top), commit 776f7fad in /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips.

## Gate lines (all at 3609e3e9)
- tsc rc 0; lint rc 0.
- jest: Test Suites: 1 skipped, 260 passed, 260 of 261 total; Tests: 1 skipped, 7080 passed, 7081 total. No timeouts this round. 7080 vs the brief's 7079: the skipped printTwinDeltaAllowedSet test ran because app.css was cached by the r1 shots in this worktree (baseline 7076 non-skipped + 3 = 7079 on a fresh worktree; +1 = that test).
- lifecycle: part1 21/21, part2 16/16, part3 9/9, part4 4/4, part5 3/3 (G-S59 G-S49 G-S73) = 53/53.
- e2e: OBSIDIAN-E2E done: 252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs
- shots: rc 0, 592 files, button host-leak 163 kinds / 978 comparisons, capture clip 147.
- freeze: freeze OK (280/280 frozen print PNGs byte-identical)
- parity: 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s), rc 0.

## Paths
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r3-rebase-report.md
- Skill proposal (updated): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md
- Gate logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r3-impl-a1/{tsc,lint,jest1,lc1,lc2,lc3,lc4,lc5,e2e,shots,freeze,parity}.log (+ .rc)
- e2e coverage: /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements/e2e/.out/coverage.json
