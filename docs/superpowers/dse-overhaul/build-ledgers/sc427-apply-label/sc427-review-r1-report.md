# SC-427 independent review, round 1 (scope c616e22..943fc47, incl. F1-F3)

**Executive summary**
- VERDICT: **FIX**. 0 CRITICAL, 0 HIGH, **1 MEDIUM**, 1 LOW, 4 INFO.
- M1: O1's invariant still breaks on a hand-edited out-of-range stored value when Damage or Healing moves it only part of the way back into range. Example: 25/20, Damage 3 gives the label "Lose 3 Stamina", the field shows 20, and Apply persists 20 (a loss of 5). Reproduced in jsdom and in real Obsidian at 943fc47.
- Everything else holds. O1 for typed, ±, draft, Escape, Reset and Apply-without-blur; O2 (all three examples plus current == max/floor); O3; O4 (no kit change needed: the kit reads "1e3" as 1000); O5; O6; O7; F1, F2 and F3 as the ledger states them.
- An invariant sweep of 7,560 one- and two-step action sequences over 9 stored states found 104 violations. All 104 are M1 (Damage or Healing on an out-of-range stored value). There were 0 field/persist mismatches, 0 "disabled but wrote" cases, and 0 draft-label mismatches (81 draft cases).
- Gates measured at 943fc47: tsc 0 · lint 0 · jest 4882 passed / 1 skipped / 228 of 229, rc 0 · e2e 71/76 ok, 0 failed, 5 known-bug, 51/51, rc 0 · lifecycle 25/25 (port 9293), rc 0.
- Fail-before: on pre-fix src (c616e22 versions of both modals), jest had 42 failures in the 4 affected files and e2e failed 0/3 (STAM-S08, D09, F06).

## Findings

### MEDIUM M1: on an out-of-range stored value, a partial Damage or Healing makes the Apply label understate what Apply persists
- **Where:** `src/views/StaminaEditModal.ts:378` (Damage: `pendingStaminaChange -= Math.min(remaining, amountToDeath)`), `:401` (Healing: `+= Math.min(adj, amountToMaxStamina)`), `:607` (Apply clamps the raw sum), and `updateActionButton` (the label is computed from the raw `pendingStaminaChange`).
- **Scenario A** (real Obsidian, `ds-stamina-bar` 25/20, so the hero rules apply):
  1. Open the editor. It shows "No Stamina Change" and the field shows 20 (O8, correct).
  2. Put 3 in the Apply box and press Damage.
  3. The label says **"Lose 3 Stamina"** and the field shows 20.
  4. Press Apply. `current_stamina: 20` is persisted, which is a loss of **5**.
- **Scenario B** (real Obsidian, hero -14/20, floor -10): Healing 2 gives the label **"Gain 2 Stamina"**, the field shows -10, and Apply persists -10, which is a gain of **4**.
- **Scenario C** (jsdom): the same happens for creature -3/20 with Healing 2 ("Gain 2", persists 0, a gain of 3), hero -10/15 (floor -7) with Healing 2, and hero 18/15 with temp 4 and Damage 3 twice ("Lose 2", persists 15, a loss of 3).
- **Cause:** the raw sum (stored + pending) is still outside [floor, max]. The stepper display and Apply both clamp it, but the label does not. The stepper path (`-` from the shown 20 gives 19, "Lose 6") and Spend Recovery (`recoverySpendResult` rebases) are both truthful. Only Damage and Healing still stage against the raw stored value.
- **Scope:** this is not F2 or F3. F3 covers only `pendingStaminaChange === 0`. The defect existed before this branch, but it is the ticket's item-1 defect (label ≠ persisted) under item 2's precondition, and both CHANGELOG headlines now claim "says exactly what it will apply".
- **Fix (pick one; option A is recommended because it keeps every persisted number as it is today):**
  - **A.** In `updateActionButton`, label the stamina part with the delta Apply will actually write: `const raw = draft ?? pending; const staminaChange = raw === 0 ? 0 : clampStamina(currentStamina + raw, floor, max) - currentStamina;`. Use the same value for the disabled check. Pass `currentStamina`, floor and max in, or capture them. The results become "Lose 5" for 25/20 Damage 3, and "Gain 3" for -3 Healing 2.
  - **B.** Rebase Damage and Healing onto the clamped position, the way `recoverySpendResult` does: `before = clamp(current + pending)`, then `after = before ∓ amount` (clamped), then `pending = after - current`. **Guard the wrong-side case:** if Damage gives `after > current`, or Healing gives `after < current`, leave `pending` unchanged. Without the guard, Damage at creature -3 turns into "Gain 3", which breaks the A10/A14 tests. With B, 25/20 Damage 3 gives "Lose 8" and the field shows 17.
  - **Tests for either option:** add jest rows for the 4 scenarios above (label == `expectedApplyLabel(persisted - stored)`, and field == persisted). The reviewer probe sweep at `evidence/zz-sc427-review-probe.test.ts` drops to 0 violations once this is fixed.

### LOW L1: both CHANGELOG headlines overclaim until M1 is fixed
- **Where:** `draw-steel-elements/CHANGELOG.md:25` ("the Apply button now says exactly what it will apply") and superproject `CHANGELOG.md:11` (same claim).
- **Scenario:** M1.
- **Fix:** this resolves itself when M1 is fixed. If M1 is deferred instead, soften the claim (for example, "for any value you type or step").
- The rest of both bullets is accurate and in plain language. Each claim was checked against behaviour: snap on commit, the draft label, ± stopping at the limits, Damage/Healing/Kill/Full Heal never inverting, a Temp-only Apply leaving Stamina alone, "1e3" in the Apply box and in both minion pool boxes, and Reset.

### INFO
- **I1 (F2 side effect):** F2 also closes the Full Heal half of SC-425. The jest markers `[Q05] Full Heal on 31 does not write 0` (stamina-edit-modal-matrix.test.ts) and `[E06] Full Heal then Apply does not write current 0` (stamina-entry-points-matrix.test.ts) were flipped to plain tests. The known-bug rule forces this, but it goes against the letter of ledger F4 ("[Q05] markers stay"). The Damage `[Q05]`/`[E06]` rows are still `test.failing` under SC-425. The owner should note on SC-425 that only the Damage half remains.
- **I2 (O8):** I probed the clamped display and it never stages a change. Across the 7,560-sequence sweep there were 0 cases of Apply being disabled while a write happened or the label said something other than "No Stamina Change". Opening at 25/20, creature -3, hero -10/15, and exactly at max or floor stages nothing and writes nothing.
- **I3 (kit):** the kit stepper is unchanged (the src diff touches only `StaminaEditModal.ts` and `MinionStaminaPoolModal.ts`), so other stepper consumers are unaffected. The full jest suite is green, including the minion pool modal tests. The kit already uses `Number()`: Temp "1e3" gives 1000. The browser and jsdom clear "1e400" and "e" to "", which is a no-op. "-0", "2.5" (becomes 2) and "" all behave correctly in all three fields.
- **I4 (not re-run):** I did not re-run shots, freeze or parity. The change has no CSS or DOM-structure edits, so I am relying on the implementer's numbers. Jest went from 4849 at base to 4882 (+33); the extra 9 over r1's 4873 are the F1-F3 tests.

## Evidence

Scratch worktree `/tmp/claude-1000/sc427-review-r1b-be71a0a9` at 943fc47. It has been removed. The evidence below sits in the session scratchpad, which may not survive a crash.

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/evidence/`:
- r1-tsc.log/.rc
- r1-lint.log/.rc
- r1-jest.log/.rc
- r1-e2e.log/.rc
- r1-lifecycle.log/.rc
- r1-jest-prefix.log/.rc (42 failed / 322 passed)
- r1-e2e-prefix.log/.rc
- probe-invariant-sweep.log, plus the probe source zz-sc427-review-probe.test.ts
- r1-e2e-probe.log/.rc (M1 in real Obsidian), plus zz-review-probe.e2e.ts, zz-review-over.md, zz-review-under.md
- e2e-probe-bundles/ZZREV-01, ZZREV-02 (failure bundles)
