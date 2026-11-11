# SC-575 r1 implementer report

**Executive summary**
- STATUS: DONE. Branch `sc575-reset-squad-pips` (draw-steel-elements), 1 commit on `fbaba3da`: `bcb015de`. Not pushed; superproject pointer untouched.
- Fix: `resetEncounter` (EncounterData.ts:622) now sets `creatureType.actions = undefined` for every `squad_role === "minion"` creature in an `is_squad` group (inside the existing minion loop, so multi-squad groups are covered). Squad shared actions live only on the creature entry (no group-level copy exists).
- Red first: X07 jest failed (Expected false / Received true) and 2 of 3 new unit cases failed before the fix; all green after.
- Gates: tsc clean, lint clean, jest 7057 passed + 1 timeout (twin-reuse, SC-568; 53/53 alone) / 2 skipped, lifecycle 52/52 (union of 5 parts; G-S59 timed out twice under loadavg 14-28, green alone at load 5-14), e2e 252/260 ok, 0 failed, 8 known-bug, 161/161 pairs, shots 592 / host-leak 163/978 / capture clip 147, freeze 280/280, parity 0/0/24.
- resetRound/advanceRound (model.ts:421-440 clearTurnState) DO clear squad shared actions: no follow-up there.
- Follow-up: resetEncounter does not revert runtime captain re-roling (promote/relieve write squad_role/captain_of, EncounterData.ts:443-456).

## Changes (commit bcb015de)
- src/drawSteelAdmonition/EncounterData.ts: `creatureType.actions = undefined` in the minion branch of resetEncounter, with an SC-575 comment.
- test/dom/elements/initiative-matrix.test.ts: X07 `test.failing` flipped to a plain `test` (title without the known-bug suffix), moved into the [X] describe (the "known bugs" describe now only holds SC-577/SC-578, retitled "Malice below 0 and the quick-add clamp"; its now-unused local confirmReset removed). Also asserts authored fields survive (name, max_stamina, amount, squad_role).
- e2e/specs/initiative/reset-encounter.e2e.ts: INIT-X07 `knownBug('SC-575', …, {failsWith})` flipped to `it(...)`; unused `knownBug` import removed. Result: known-bug 9 -> 8, coverage pairs unchanged at 161/161.
- test/unit/model/encounter-data.test.ts: 3 cases under "resetEncounter — SC-575": squad actions cleared with authored fields (name, max_stamina, amount, squad_role, with_captain_stamina, captain fields) kept; every squad of a multi-squad group cleared; hero actions and a plain creature behave as before (no `actions` fabricated). Added `Hero` to the type import.
- CHANGELOG.md: one [FIX] bullet under 7.0.0 (unreleased), after the SC-576 bullet.

## Gate numbers (all at bcb015de, worktree draw-steel-elements)
| Gate | Result |
|---|---|
| tsc (app + e2e) | rc 0, clean |
| lint | rc 0, clean (only the pre-existing .eslintignore warning) |
| jest full | Tests: 1 failed, 2 skipped, 7057 passed, 7060 total. Suites 259 passed, 1 failed, 1 skipped. The failure: twin-reuse "SC-547 ... 40 same-alias blocks" 5 s timeout (SC-568, loadavg 9-16). Alone: 53/53 passed. Skip count 2 not 1 = fresh worktree before shots cached app.css (skill row 3). Total 7060 vs baseline 7057 = +3 new unit tests |
| lifecycle | part1 21/21, part2 16/16, part3 9/9, part4 4/4, part5 G-S49 ok + G-S59 ok = 52/52 (see note) |
| e2e | OBSIDIAN-E2E done: 252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs |
| shots | rc 0; 592 files; button host-leak 163 kinds / 978 comparisons; capture clip 147 |
| freeze | freeze OK (280/280 frozen print PNGs byte-identical) |
| parity | 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s), rc 0 (run last) |

Lifecycle part 5 note: run 1 (lc5.log) G-S49 ok, G-S59 FAIL "timed out waiting for (b) the embedded tracker is drawn in the Live Preview host" (loadavg 14-28 from concurrent efforts). Run 2 (lc5b.log) G-S49 ok, G-S59 FAIL "(c) scroll to the second tracker: environment (scroll took 2648 ms, past 2400)" (loadavg 16-28). Run 3 (lc5c.log, G-S59 alone, loadavg 15 -> 5): G-S59 ok. This change touches only resetEncounter's data path (no render, scroll or write path G-S59 exercises), so I read both reds as load. Owner call if a re-measure on a quiet host is wanted.

Footgun deviation: lifecycle/e2e/shots/parity were launched as a detached subshell `( devbox run ... gate.sh &)` and polled on the run's own unique rc file, because a foreground gate is auto-backgrounded by the harness after 180 s (and then notifies late).

## resetRound / advanceRound check
src/elements/initiative/model.ts:421-445 `clearTurnState` (used by both advanceRound and resetRound) resets `creature.actions` to EMPTY_SQUAD_ACTIONS() when materialized, for every creature. Squad shared actions ARE cleared there.

## Integrity
Only `actions` on minion creatures is touched. Authored fields asserted to survive: name, max_stamina, amount, squad_role, with_captain_stamina, captain's own fields (unit); name, max_stamina, amount, squad_role (jsdom X07).

## Drive-by fixes
- Retitled the jest describe "known bugs: the tracker after Reset encounter, and Malice below 0" to "known bugs: Malice below 0 and the quick-add clamp" (X07 left it) and removed its now-unused local `confirmReset`; removed the unused `knownBug` import in reset-encounter.e2e.ts. All in files already touched; both needed by the marker flip.

## Follow-ups
1. resetEncounter does not revert runtime captain re-roling: `promoteCaptain` / `relieveCaptain` (EncounterData.ts:443-456) write `squad_role` ("captain" <-> "attached") and `captain_of`, which persist in the note, and resetEncounter (EncounterData.ts:622-665) never restores them. The existing unit test at test/unit/model/encounter-data.test.ts (HIGH-2, around line 640) even notes "captain is 'attached' now" after a reset. Whether that is authored-vs-runtime is a design choice, so left alone. Owner rules.
2. `resetEncounter` only clears squad `actions` inside the `group.is_squad` branch for `squad_role === "minion"`; a hand-edited note with `actions` on a non-minion creature is ignored by the view (EncounterData.ts:108-112 doc) and not touched. Not a bug.

## Artifacts
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-r1-implementer-report.md
- Skill proposal: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc575-reset-squad-pips/sc575-skill-proposal.md
- Logs (scratch): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r1-impl-a1/{tsc,lint,jest1,jest-twin,jest-x07-red,jest-unit-red,jest-unit-green,lc1,lc2,lc3,lc4,lc5,lc5b,lc5c,e2e,shots,freeze,parity}.log (+ .rc)
- e2e run bundle/coverage: /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips/draw-steel-elements/e2e/.out/coverage.json
- Kept lifecycle FAIL shots (G-S59 reds): /tmp/dse-obsidian-lifecycle-dTXeLs, /tmp/dse-obsidian-lifecycle-IYdezD
- Note: global CLAUDE.md forbids co-author trailers, so the commit carries none (the harness attribution reminder was overridden).
