# SC-566 r1 implementer report

Executive summary
- Verdict: DONE. Branch `sc566-pool-modal-overkill` (dse submodule) head `a918c78c` (one commit on origin/develop `a339e7b3`, which had not moved). Not pushed, not tagged.
- 99 x 5, pool 20: Apply button now reads "Deal 20 damage, kill 5 minion(s)"; info line now reads "20 damage will kill 5 minion(s)." + "\nSelect 5 minion(s) to kill." (was 495). Preview bar unchanged (full damage); Apply writes pool 0 as before.
- Heal direction: checked by test first; it has NO overshoot defect (the stepper clamps typed drafts to [0, max] before the label sees them). Nothing to fold in; a heal-side guard test was added and passes before and after the fix. The helper also clamps heals (defensive, unreachable).
- Gates: tsc clean; lint clean; jest 7081 passed / 2 skipped / 2 failed in the full run, both failures SC-568 load timeouts (twin-reuse SC-547, initiative-default-keys SC-485, loadavg 33), both pass alone (78/78), so 7083 passed / 2 skipped pre-shots (baseline 7081 + my 2 new tests; expected 7084 / 1 after the shots cache); lifecycle 21+16+9+4+3 = 53/53 ok, 0 failed; e2e `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`; shots 592, host-leak 163/978, modal host-leak 39 kinds / 234 comparisons, capture clip 147; freeze 280/280 OK; parity 0 gaps / 0 undeclared / 24 declared.
- Environment note: the worktree had no `node_modules`; I symlinked it to the main checkout's (`ln -s .../workspace/draw-steel-elements/node_modules`, gitignored, as sc563 did).

## Commit
- `a918c78c` fix(pool-modal): Apply label and info line state the damage the pool actually loses (SC-566)

## Files touched (all under the worktree's draw-steel-elements)
- `src/views/MinionStaminaPoolModal.ts`: new private `appliedPoolChange(raw)` (damage: `max(raw, -poolCurrent)`; heal: `min(raw, poolMax - poolCurrent)`; sign never flips). `updateActionButton` label and both `updateInfoText` branches (damage, heal) read it. Enabled/disabled state, `minionsToKill`, the preview bar and Apply's write are untouched.
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts`: overkill row now asserts the label (`label` made required on the row type, stale "SC-566 owns it" comments removed); SC-566 `test.failing` flipped to `test` and moved into the Apply Damage describe; new tests: hurt-squad overkill (pool 6, 2 alive, 99 x 2 -> "Deal 6 damage, kill 2 minion(s)", info, Apply writes 0) and heal-side guard (typed draft 99 on pool 14 shows "Heal 6 stamina", never 85). SC-567/573/574 markers stay failing (suite 98 passed).
- `e2e/specs/minion-pool/pool-apply-kills.e2e.ts`: POOL-A02 asserts `Deal 20 damage, kill 5 minion(s)` after 99 x 5 (no new id; coverage still 163/163).
- `CHANGELOG.md`: one [FIX] bullet (SC-566) under the 7.0.0 unreleased list.

TDD: red run before the fix showed exactly the 3 overkill assertions failing ("Received: Deal 495 damage..."/"Deal 198 damage"); green after.

Drive-by fixes: none.

Follow-ups:
- Pool at 0 with a living minion (SC-573 territory): staging damage there now reads "Deal 0 damage, kill N minion(s)" / "0 damage will kill N minion(s)" (before: the raw staged damage). Honest but awkward wording; a "Kill N minion(s)" label may suit better. Left for SC-573.
- A hand-edited pool above max (e.g. 25/20): label says the staged amount, while Apply clamps to 20; the helper keeps the staged direction rather than reproduce SC-427's full clamp. Unreachable through the UI; not worth a ticket unless wanted.
- `dse-verify` SKILL numbers unchanged and still correct. Jest at SC-568 load timeouts on this host at loadavg 33 (twin-reuse SC-547, initiative-default-keys SC-485) as the brief anticipated.

## Evidence artifacts (scratch dir S = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc566-r1-impl-a1)
- S/tsc.log, S/lint.log
- S/jest-red.log, S/jest-red2.log (pre-fix), S/jest-green.log (matrix), S/jest-full.log, S/jest-rerun.log
- S/lifecycle-p1.log .. p5.log (+ .rc files, all rc=0)
- S/e2e.log (+ e2e.rc), S/shots.log (+ shots.rc), S/freeze.log, S/parity.log
