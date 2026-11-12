# SC-606 r4 scoped re-review (reviewer a39ccd19a0e73e279)

## Executive summary
- Verdict: **LAND** (code). 0 CRITICAL / 0 HIGH / 0 MEDIUM / 1 LOW (landing hygiene, superproject only) / 2 INFO. All three r2b findings are closed, as measured.
- Rebase check: `git range-diff 8b84b635..df250b20 5f7c5336..00a990b5` gives `1: 95ca46f0 = 1: d924594c` and `2: df250b20 = 2: 00a990b5`, so the r1 diff was carried unchanged.
- MEDIUM-1 closed (`model.ts:435-446`). On r3 head, a note-only, result-only, round-only or unchanged-Save edit writes no key for a key-less hero and keeps the order of a keyed list ([Nature, Alertness] and [Alertness, Nature, Insight] are unchanged; pre-fix they were reordered). Real skill changes still move: Nature -> Lift gives [Lift], [Alertness, Lift] and [Alertness, Insight, Lift]. A hero change moves the skill to the new hero.
- LOW-1 closed (`model.ts:54-66, 359-376, 497`). For a scalar `skills_used: Climb`: the reuse warning fires in the real sheet; logging Insight gives [Climb, Insight]; removing the Climb entry gives []; Reset gives []; and Bram log / Kira no-skill log / add round / end round each leave `skills_used: Climb` byte-identical. The base bug where the substring `Cl` matched is gone (false).
- LOW-2 closed: `jest.useRealTimers()` now runs in `afterEach` (`montage.test.ts:2434`).
- The new tests are real: the 7 new tests (6 model, 1 DOM) all fail on 00a990b5 src with r3 tests (7 failed of 241). r3 head: 241/241.
- Gates on r3 head 7866426e (`git archive` exports):
  - jest 7705 passed / 4 skipped / 264 of 265 suites. That is 7707 / 2 fresh; the 2 extra skips are token-coverage's workspace-map block, by design.
  - e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (132 s).
  - Lifecycle part 5 7/7 (393 s) and part 6 G-S92 1/1 (103 s).
- CHANGELOG at bf06aa8b: the bullet is unchanged and its last clause is now true. LOW-1 (landing): the superproject branch is based on stale 715368aa and carries 3 pointer bumps, 2 of them to dse shas no branch contains (df250b20, e7bf0708).

## Findings

### LOW-1: superproject branch history (landing hygiene, not code)
- Where: superproject worktree branch `sc606-montage-edit-no-skills`, commits 7ab086d2 (bump to df250b20) and bceda437 (bump to e7bf0708) under bf06aa8b (bump to 7866426e). The branch base is 715368aa; main is at fa22877b, past the SC-594 and SC-603 merges.
- Scenario: `git branch -a --contains` finds no branch containing df250b20 or e7bf0708 (both were orphaned by the rebases). If the branch is merged as is, two workspace commits point at dse commits that will never exist on origin, so `git submodule update` at them fails. Main also gained SC-603's CHANGELOG entry, which hit a CHANGELOG conflict on its own land (e270372d). The same conflict is likely here.
- Fix (at land): rebase the superproject branch onto current main, keep d12a014d (CHANGELOG, resolving the Unreleased conflict) plus ONE bump to the final dse sha, and drop 7ab086d2 and bceda437. That matches the one-bump-per-merge pattern in main's history.

### INFO-1: pre-existing first-occurrence removal reorders a list that holds duplicates
[Nature, Climb, Alertness] + log Climb (the reuse warning fires) then Undo gives [Nature, Alertness, Climb]. The behaviour is identical pre-fix and r3 (`KEYEDCLIMB.log-Climb-then-undo` SAME). It only arises after a warned reuse. No action.

### INFO-2: scalar + net-zero skill change is normalized to a list
Scalar `Climb` + log Climb + Undo gives `[Climb]`, where the note held `Climb` before. The user changed that hero's skills twice (the same class as r2b INFO-2, dropped). No action.

## Probe detail
- Model probe `zzsc606r4probe.test.ts.txt`: 6 shapes (KEYLESS, NULLKEY, SCALAR, SCALARSKILL scalar Climb with a Climb entry, KEYED2, KEYEDCLIMB) × 16 operations, run on pre (00a990b5 src + r3 tests) and r3 head.
  - Same-skill edits (unchanged / note / result / round): pre wrote the key or reordered in every shape; r3 head leaves the list as it was everywhere, with `blockSame: true`.
  - Skill change and hero change are SAME as pre on every non-scalar shape. Scalar shapes now keep Climb (SCALAR Nature -> Lift gives [Climb, Lift]; SCALARSKILL Climb -> Lift gives [Lift]; SCALARSKILL hero change gives Kira [], Bram [Lift, Climb]).
  - The tally is right in every edit (result-only: successes 0, failures 1).
- DOM probe `dom-append-r4.ts.txt`: the real sheet / menu / action bar for KEYLESS, NULLKEY, SCALAR, KEYED2 and KEYED3, 9 cases each. r3 head has 0 page errors.
  - KEYLESS edit-save-unchanged, edit-note-only and edit-result-only write `  - name: Kira\n` with no key; pre wrote `skills_used: [Nature]`.
  - SCALAR edit-open typing Climb shows "Kira already used Climb in this montage — reuse is not allowed"; pre showed no warning.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r4-a39ccd19a0e73e279/)
- range-diff.txt
- setup.sh, setup.log
- zzsc606r4probe.test.ts.txt, model-probe-pre.json, model-probe-r3head.json, model-probe-cmp.txt
- dom-append-r4.ts.txt, dom-probe-pre.json, dom-probe-r3head.json, dom-probe-cmp.txt
- probes.sh, cmp.py, vac-pre.json, vac-r3head.json, vac-summary.txt
- gate-jest.log, gate-jest-prestate.log, gate-e2e.log, gate-lifecycle-p5.log, gate-lifecycle-p6.log
- status-before.txt, status-after.txt (identical; worktree, plugin and main checkout untouched)
