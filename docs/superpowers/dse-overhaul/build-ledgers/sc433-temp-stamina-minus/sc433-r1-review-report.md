# SC-433 r1 independent review (reviewer B)

## Executive summary
- **Verdict: APPROVE.** dse `e0b14f3` (on `3973b56`), superproject `78e4d6b` (on `262dad6`). Both trees clean before and after the review, except the expected unbumped ` M draw-steel-elements` pointer in the superproject worktree.
- Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (existed before this branch, out of scope, a backlog candidate), 4 INFO.
- Gates I measured at `e0b14f3`: tsc (incl. `-p e2e`) rc 0 clean; lint rc 0 clean; jest **5699 passed / 1 skipped / 238 of 239 suites** rc 0; e2e **`OBSIDIAN-E2E done: 100/100 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`** rc 0.
- I skipped shots, freeze, parity and lifecycle. The diff changes no CSS, fixtures or first-paint render: the modal opens with the same DOM, and only `stagedTemp` math plus comments change.
- Discrimination: with only `src/views/StaminaEditModal.ts` reverted to `3973b56` (in a scratch copy), **9 of the branch's tests fail**: 8 SC-433 modal tests and the SC-430 draft test. **13 of my 15 targeted probes fail** there too; the 2 that still pass are the Damage-then-type and the "+" then Damage cases. On HEAD all 315 probe tests pass.
- The fix is one line: `stagedTemp = value - currentTempStamina` at `src/views/StaminaEditModal.ts:485`. No `Math.max` near temp is left in `src/`, apart from the display clamps in `staminaGauge.ts:131,212` and Damage's `Math.min` at `:401`. No path anywhere grants temp from an effect, so nothing needs to keep take-the-higher.

## What I executed
- **Probe 1** was a throwaway jest file placed at `test/dom/elements/zz-sc433-r1-review-probe.test.ts` and deleted by the script right after the run; `git status` was clean afterwards. On HEAD: 315/315 passed. Against the reverted modal: 13 of the 15 targeted tests failed. The log is `sc433-r1-rev-revert.log`. I overwrote the probe-1 source with probe 2, so it is no longer on disk, but the test names and failures are in the revert log. It covered:
  - **P1 (repro and typed sequences):** 5,+,+,− gives 7, then 6, label "Gain 1 Temp Stamina", Apply writes 6. Typed 2 (committed), then +,−,− gives 1, label "Lose 4", writes 1. An uncommitted typed draft of 2 previews "Lose 3" and Apply writes 2. A draft of −7 previews "Lose 5" and writes 0. Typed 2.9 writes 2.
  - **P2 (CB-8, "−" disabled state):** I checked the state after Damage absorbs all temp (disabled), "+" (enabled), Full Heal (disabled), Reset (enabled at 3), Kill (disabled), typed 4 (enabled) and typed 0 (disabled). Each was correct.
  - **P3 (temp edit and Damage together):** type 2 over 5, then Damage 4: label "Lose 2 Stamina and Lose 5 Temp Stamina", writes 13 Stamina and 0 temp. Damage 3, then type 7: "Gain 2", writes 7. "+"×2, then Damage 6: writes temp 1.
  - **P4 (randomized):** 300 seeded random sequences of +, −, typed −5..64, Damage, Kill, Full Heal, Reset and Healing. After every step, "−" is disabled exactly when the field shows ≤0, and the temp delta in the label equals the field value minus the start value. At the end, Apply writes the field value; when Apply is disabled, the field equals the start value. All 300 pass on HEAD.
  - **P5 (note file, real pipeline over ReadingModeBlockHost):** see INFO-2 for the result.
    - Two blocks in one note, lowering temp in block 2 (9 → 3): the note comes back byte-exact. Only block 2 changes, and the text above, between and below survives.
    - A block with no temp key, "+" then "−": Apply is disabled, and a later Damage adds no `temp_stamina`.
    - A block with no temp key, gain 4 (written), then lower to 0 in a reopened modal.
  - **P6 (hosts):**
    - ds-hero, temp 8, "−"×3: label "Lose 3 Temp Stamina", persisted `state.stamina` is `{current:30,temp:5}`.
    - ds-initiative creature cell, temp 9: reopen shows 9, then "−" and typed 2 give "Lose 7", writes `temp_stamina: 2`, cell shows `40(+2)/40`.
    - ds-initiative hero row (`init.hero.stamina`), temp 6, "−": writes `temp_stamina: 5`.
- **Probe 2** (negative stored temp) is `probe2-negative-temp.test.ts`, log `sc433-r1-rev-probe2.log`. See LOW-1.
- **Host survey:** `StaminaEditModal` is opened by `stamina-bar/view.ts:159`, `hero/view.ts:380`, `initiative/view.ts:1437` (heroes) and `:1881` (creatures). The minion pool modal imports only the shared primitives (`readAmount`, `staminaPreviewBar`, `staminaStepperRow`, `setButtonText`) and has no temp field. Every host copies `bar.temp_stamina` verbatim: `StaminaBar.ts:137,142` and `hero/view.ts:387`. Apply writes `currentTempStamina + pendingTempStaminaChange` with no clamp or max (`StaminaEditModal.ts:661`).
- **Every temp write in `src/`:** `hero/view.ts:275` (respite sets 0), the `?? 0` defaults in initiative `model`/`resolveRefs` and `EncounterData.ts`, and `EncounterData.ts:625` (clear). None of them grants temp, so the "no effect-grant path" claim holds.
- **`grep -rn SC-433`** over src/test/e2e/docs finds only history and rationale comments plus the new test titles. No `knownBug('SC-433'` or `[known bug SC-433]` is left; e2e drops the unused `knownBug` import.

## Findings

### LOW-1: a hand-edited negative stored temp still mis-drives Damage and Full Heal (existed before this branch; not introduced or worsened)
`src/views/StaminaEditModal.ts:296` (`currentTempStamina = temp_stamina ?? 0`), `:400-403` (Damage), `:528`/`:545` (Kill / Full Heal set `pending = -currentTempStamina`).
- **Scenario:** the note says `temp_stamina: -3` and Stamina is 15/20.
  - Damage 5: `tempStaminaUsed = min(5, -3) = -3`, so pending temp becomes +3 and the remaining damage is 8. The label reads "Lose 8 Stamina and Gain 3 Temp Stamina" and Apply writes 7 Stamina and 0 temp. The hit costs 8 Stamina instead of 5.
  - Full Heal: the label reads "Gain 5 Stamina and Gain 3 Temp Stamina".
  - Typing 0 into the temp field (it shows 0, clamped) stages nothing. The way to zero it is "+" then "−", which shows "Gain 3 Temp Stamina".
- **Why it is out of scope:** none of these lines are in the diff, the old code behaved the same way, and the implementer report says hand-edited negative temp is untouched.
- **Prescribed fix (separate Backlog ticket for the owner to file):** read the stored value as `Math.max(0, temp_stamina ?? 0)` for the math only, or floor `tempStaminaAvailable` at 0. Decide whether a stored negative is written back unchanged on a Stamina-only Apply; today it is (−3 survives).

### INFO-1: landing drift
Since the branch was cut, develop has moved to `424f47b` (SC-361). `git diff --name-only 3973b56 424f47b` touches none of this branch's three files.
- **CHANGELOG:** SC-361 added its own `## Unreleased` bullet (superproject `e8cde22`), so `78e4d6b` will need a trivial merge at the top of Unreleased.
- **Expected numbers after the rebase (inferred, not measured):** jest around 5706 passed / 1 skipped (SC-361 added 7, SC-433 adds 3). e2e around 101/101, 0 failed, 0 known-bug; re-measure the coverage pair count.

### INFO-2: a temp key the plugin wrote goes away again when temp returns to 0 in the same session
P5c covers a block that started with no `temp_stamina`. Gain 4 writes `temp_stamina: 4`; lowering it to 0 later in the same session, with no re-parse, writes the body back without the key. This follows the SC-466/SC-482 contract (an absent key whose value equals its parse-time default is omitted). It only becomes reachable now that the field can be lowered. The user never wrote the key, so I consider it correct. No action needed.

### INFO-3: an initiative write fills in `temp_stamina: 0` on untouched creature instances (existed before this branch)
The P6 initiative write also gave instance 2 `current_stamina: 40, temp_stamina: 0` from the `?? 0` fills in `initiative/model.ts:281` and `resolveRefs.ts:236`. Initiative was not in SC-482's scope, and this has nothing to do with SC-433. It is only worth a ticket if one does not already exist.

### INFO-4: what the tests prove
- **Branch tests:** the converted markers are real plain tests with exact values, and the e2e tests (T03, T04, T10, T13, T14) assert the note file through `expectNoteBlock` / `applyAndWrite`. T11 is now exact and checks that nothing is written until Apply. I found no vacuous assertions.
- **My P4 invariant net:** it is not discriminating against the old code, because the old code was self-consistent (a no-op shows no change, labels no change and writes no change). It is a regression net only. The discriminating checks are P1–P3, P5 and P6.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc433-r1-review/`:
- gate scripts and logs `sc433-r1-rev-{tsc,lint,jest,e2e}.{sh,log,rc}`
- the revert discrimination run `sc433-r1-rev-revert.{sh,log,rc}`
- the probe runner `sc433-r1-rev-probe.sh`
- probe 2 `probe2-negative-temp.test.ts` and `sc433-r1-rev-probe2.log`
