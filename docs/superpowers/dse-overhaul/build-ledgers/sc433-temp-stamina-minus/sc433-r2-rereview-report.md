# SC-433 r2 scoped re-review (reviewer B)

## Executive summary
- **Verdict: APPROVE.** Reviewed dse `e4c5cf6` (`7db087f`, `52271b1`, `e4c5cf6` on `424f47b` = origin/develop) and superproject `fb6a3f8` (on `89bd345` = origin/main). The dse tree is clean. The superproject shows only ` M draw-steel-elements`: the pointer is not committed.
- Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO.
- Rebase: `range-diff 3973b56..e0b14f3 424f47b..52271b1` shows `1: d20a57a = 1: 7db087f` and `2: e0b14f3 = 2: 52271b1`, so both r1 commits are unchanged. CHANGELOG `## Unreleased` keeps SC-361's bullet first and SC-433's bullet second.
- LOW-1 fix: one change, at `src/views/StaminaEditModal.ts:299`, `currentTempStamina = Math.max(0, temp_stamina ?? 0)`. It is the only read of the stored temp; every other temp use derives from it (`:355`, `:360`, `:403`, `:488`, `:492`, `:531`, `:548`, `:664`, `:686`). For temp ≥ 0 it is the identity.
- Gates measured at `e4c5cf6`:
  - tsc (incl. `-p e2e`): rc 0, clean
  - lint: rc 0, clean
  - jest: **5711 passed / 1 skipped / 238 of 239 suites**, rc 0 (= 5703 + 3 + 5)
  - e2e: **`OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`**, rc 0
- The implementer's logs agree: shots 580 PNGs, 0 FAIL, no ALLOWLISTED line, both text-scale lines and the modal host-leak line present; freeze `280/280`; parity `0 gap / 0 undeclared / 24 declared`; lifecycle `31/31`.
- Discrimination: with only the clamp reverted (modal at `52271b1`, in a scratch copy), **11 tests fail**:
  - 4 of the branch's 5 new LOW-1 tests;
  - 6 of my 7 modal probes;
  - my note-level probe W2.

## Probes (`zz-sc433-r2-review-probe.test.ts`; on HEAD 12/12 pass)
Run inside `test/dom/elements/` and deleted after the run; `git status` was clean afterwards.
- **N1:** stored −3 opens with the field at 0, "−" disabled and Apply disabled. Typing 0 stages nothing. `bar.temp_stamina` is still −3 and the update callback is never called.
- **N2:** "+" shows "Gain 1 Temp Stamina", then "−" puts Apply back to disabled.
- **N3:** Damage 5 shows "Lose 5 Stamina", the field stays at 0, and Apply writes 10 Stamina / 0 temp. In r1 the same case took 8 Stamina.
- **N4:** Full Heal shows exactly "Gain 5 Stamina". Kill's label has no "Temp", and Apply writes −10 / 0.
- **N5:** Healing 2 shows "Gain 2 Stamina" and writes 17 / 0 (see INFO-1).
- **N6:** typing 4 shows "Gain 4 Temp Stamina" and writes 4.
- **N7:** a typed Stamina-only edit to 12 shows "Lose 3 Stamina" and writes 12 / 0.
- **P (temp ≥ 0 unchanged):** at temps 0, 1 and 5, Damage of (temp + 2) absorbs the temp first and writes 13 / 0.
- **W1 (real pipeline, note has `temp_stamina: -3`):** Damage staged but no Apply, then the debounce waited out twice: no vault write, and the note is byte-identical.
- **W2:** Damage 5 then Apply writes exactly `max_stamina: 20` / `current_stamina: 10` / `temp_stamina: 0`, and the text around the block is intact.
- **Hosts:** the clamp lives in the modal, so it reaches all four openers: stamina-bar `view.ts:159`, hero `view.ts:380`, initiative `view.ts:1437` and `:1881`. All four copy `bar.temp_stamina` back unchanged.

## Findings

### INFO-1: an Apply on a negative stored temp sets temp to 0, even when the label only mentions Stamina
`StaminaEditModal.ts:664`. With stored −3, Healing 2 is labelled "Gain 2 Stamina" but Apply also changes temp from −3 to 0. The owner has accepted this (the user acted, and it cleans up invalid data). Opening and cancelling writes nothing (N1, W1). No action needed.

### INFO-2: one of the 5 new LOW-1 tests also passes without the clamp
The test "the field shows 0, the minus is disabled, and opening stages nothing" passes without the fix, because the kit stepper already clamps what the field shows. It still pins the "nothing written until the user acts" contract, which is worth keeping. The other 4 new tests discriminate. No action needed.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc433-r2-review/`:
- gate scripts and logs `sc433-r2-rev-{tsc,lint,jest,e2e}.{sh,log,rc}`
- the probe `zz-sc433-r2-review-probe.test.ts` and `sc433-r2-rev-probe.{sh,log,rc}`
- the clamp-reverted run `sc433-r2-rev-revert.{sh,log,rc}`
