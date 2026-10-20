# SC-427 decisions ledger

Ticket: SC-427 "Stamina modal: Apply label disagrees with what is applied for out-of-range values, "1e3" reads as 1, Reset keeps the Apply box"
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc427-apply-label (every submodule on branch sc427-apply-label)
DSE base: origin/develop 9ed8dc6 (2026-10-19)

## Spec (ticket description, verbatim, 2026-10-19)

1. **Typed Stamina outside the allowed range makes the Apply label lie (medium).** Max 20, current 10, type 30: label "Gain 20 Stamina", but 20 is persisted (a gain of 10). A creature typed to −5: label "Lose 15", persists 0 (a loss of 10). Persistence is right; the label is wrong. Fix: clamp the typed commit to \[floor, max\], or compute the label from the clamped value.
2. **Out-of-range current values invert the controls (low; needs hand-edited YAML or a max that later drops).** Damage at creature −3 gives pending +3; Healing at 25/20 gives pending −5; Kill at hero −10 with floor −7 says "Gain 3 Stamina". Cause: `amountToDeath`/`amountToMaxStamina` go negative (\~line 660-666). Fix: `Math.max(0, …)` on both, and label Kill from the clamped value.
3. **"1e3" in the Apply box is read as 1 (low).** `parseInt` on a valid number-input value (\~lines 335, 365). Fix: `Math.trunc(Number(v))` or `valueAsNumber`.
4. **Reset leaves the Apply box value in place (low)** (\~lines 524-535). The minion pool modal resets its inputs; this one should match.

## Scott's rulings

(none yet)

## Owner rulings (2026-10-19)

- O1 (item 1 mechanism): **Invariant: the Stamina stepper's shown value, the Apply label (committed AND half-typed draft), and the persisted value always agree.** Mechanism: of the ticket's two options, take "clamp the typed commit to [floor, max]" — a typed or ± stepped Stamina value commits clamped into [negativeStaminaLimit, maxStamina], so the field itself shows what Apply will write. This also retires the StaminaEditModal "KNOWN DEVIATION (degenerate overshoot corridor)" (type 22 → `+` → 23 while Apply persists 20); rewrite that comment and the `[S10]` pinned test to the new behaviour. The half-typed draft label (SC-430 `onDraftInput`) is computed from the clamped value too. Reason: a field that shows 30 when 20 will be written is the same lie as the label.
- O2 (out-of-range current guard): opening the modal on a hand-edited out-of-range current (e.g. 25/20, creature −3, hero −10 with floor −7) must NOT by itself stage a change — the modal opens on "No Stamina Change" with Apply disabled, exactly as today. Bounding the stepper must not silently clamp its initial value into a pending change.
- O3 (item 2): as the ticket says — `Math.max(0, …)` on `amountToDeath` and `amountToMaxStamina`; Kill's label derives from the clamped amount (never "Gain"). 
- O4 (item 3): same defect class in the shared kit stepper is in scope — if the integer stepper (Stamina / Temp fields) also misreads "1e3", fix it there too with tests, and report it.
- O5 (item 4): Reset mirrors the minion pool modal's Reset for its inputs (read that modal and copy its behaviour exactly; report what it does).
- O6: every existing SC-427 known-bug marker flips to a plain passing test (jest `test.failing` in test/dom/views/stamina-edit-modal-matrix.test.ts; e2e `knownBug('SC-427')` ×3 in e2e/specs/stamina-bar/stamina-modal.e2e.ts and stamina-modal-stepper.e2e.ts), titles drop "[known bug SC-427]", each confirmed failing on pre-fix src. The pinned-unclamped draft test in test/dom/views/stamina-edit-modal.test.ts (~line 1005, "SC-427 owns that label") is rewritten to the clamped label.
- O7: user-facing CHANGELOG bullets in both the DSE CHANGELOG and the worktree superproject CHANGELOG (`## Unreleased`).

## Base moves
- 2026-10-19: dse origin/develop 9ed8dc6 → **c616e22** (SC-450 landed: `setPressedState` in kit/iconButton.ts + new jest guard `test/unit/build/ariaPressedWriters.test.ts` — fails if src/ writes aria-pressed/data-pressed outside the helper). New baselines: jest **4849 passed / 1 skipped / 228 of 229 suites** · lifecycle 25/25 · e2e 68/76 ok, 0 failed, 8 known-bug, coverage 51/51 · shots 572 + in-run line `pressed toggle parity OK (96 comparisons …)` · freeze 276/276 · parity 0/0/24 DECLARED. Land-ready must be on c616e22.

## Round log
- r1 implementer (Sonnet, orchestration:implementer): DSE head `9aab55b` on c616e22 (commits d04f894, 99fb142, 9aab55b); superproject `3dba6f1` (CHANGELOG). Gates: jest 4873/1 skipped/228 of 229; lifecycle 25/25; e2e 71/76 ok, 0 failed, 5 known-bug, 51/51; shots 572 0 FAIL; freeze 276/276; parity 0/0/24. Mechanism: kit stepper min/max = [negativeStaminaLimit, maxStamina], no kit change.

## Owner rulings, round 1 (2026-10-19)
- O8 (implementer's judgement call): ACCEPTED — on a hand-edited out-of-range stored value the Stamina field displays the clamped value (25/20 shows 20; creature −3 shows 0; hero −10 under −7 shows −7) while nothing is staged and Apply stays disabled. Reason: it is O1's invariant (the field shows what Apply would write); the alternative leaves ± enabled past the bounds.
- Follow-up F1 FOLD: `src/views/MinionStaminaPoolModal.ts:177-178` `parseInt(damageInput.value)` / `parseInt(minionCountInput.value)` — same "1e3 reads as 1" defect; fix with the same `Math.trunc(Number(v))` treatment + jest tests (and flip any existing SC-427/A09-class marker there if one exists).
- Follow-up F2 FOLD: Full Heal on a stored value past max (25/20) stages "Lose 5" — item 2's inverted-control class. Full Heal at or above max is no change (Apply's disabled state/label follow).
- Follow-up F3 FOLD: Apply with only a Temp (or Recoveries) change on an out-of-range stored Stamina silently rewrites current Stamina to the clamp, and the label does not say so. Fix: when the pending Stamina change is 0, Apply leaves `current_stamina` exactly as stored (no silent rewrite); clampStamina still owns every real Stamina change. Test both directions (25/20 and creature −3).
- ~~Follow-up F4 DROP: hero with unresolved class (max 0) `[Q05]` markers stay — owned by SC-425.~~ superseded by R1-I1 below (F2 fixes SC-425's Full Heal half; its markers flip per the known-bug rule).
- 2026-10-19: session crash killed both workers. Survived: DSE r2 commits 4d51550 + 943fc47, superproject 929cfc2 (no r2 report/gates). Implementer resumed to self-check r2, rebase superproject onto origin/main (9d8e2f9), re-gate at 943fc47. Reviewer scope widened to c616e22..943fc47 (r1 + F1–F3).

## Owner rulings, review round 1 (2026-10-19; reviewer verdict FIX, 0C/0H/1M/1L/4I, report sc427-review-r1-report.md)
- R1-M1 FIX, option A: "compute the stamina part of the label and Apply's disabled state from `clampStamina(current + (draft ?? pending)) − current` when that sum is non-zero. Every persisted number stays as it is today." (Reviewer's text.) Scenarios that must become truthful: stored 25/20 Damage 3 → label "Lose 5 Stamina", persists 20; hero −14/20 (floor −10) Healing 2 → "Gain 4 Stamina", persists −10; creature −3/20 Healing 2; hero −10/15 Healing 2; hero 18/15 temp 4 Damage 3 twice. If the clamped stamina part is 0 and nothing else is pending, the label is "No Stamina Change" and Apply is disabled. Option B (rebasing Damage/Healing) rejected: it changes persisted numbers.
- R1-L1: CHANGELOG headlines become accurate once M1 lands; the fixer re-reads both bullets against the final behaviour.
- R1-I1 ACCEPT: the SC-425 `[Q05] Full Heal on 31` and `[E06] Full Heal then Apply` flips stay (known-bug rule). Owner notes on SC-425 that only its Damage half remains.
- R1-I2/I3/I4: no action.
- r3 (implementer): DSE `7433218` (M1 option A), superproject `2cebbc6` rebased onto origin/main `fb413cc`. Gates green: jest 4888/1/228 of 229; lifecycle 25/25; e2e 71/76, 0 failed, 5 known-bug, 51/51; shots 572 0 FAIL + pressed toggle parity OK; freeze 276/276; parity 0/0/24.
- R3-F5 FOLD (owner, 2026-10-19): the preview gauge (`updateBar`) must draw the CLAMPED pending position — the same `clampStamina(current + (draft ?? pending))` the label uses — so the gauge never shows a pending marker past max/floor (e.g. 22 under max 20). Same O1 invariant.
- 2026-10-19 base move: dse origin/develop c616e22 → **6bcf9c8** (SC-453: CRLF notes, host write path + sidebar, new lifecycle G-S10); workspace main 724c7a1 (SC-453 bullet at top of ## Unreleased). Baselines: jest 4908/1/229 of 230 · lifecycle 26/26 · e2e 68/76, 0 failed, 8 known-bug, 51/51 · shots 572 + pressed-toggle parity · freeze 276/276 · parity 0/0/24. Land-ready must be on 6bcf9c8. Our expected after rebase: jest 4908 + our +39 + r4 rows; e2e 71/76, 5 known-bug.
- r4 (implementer): DSE `d58cf6a` on 6bcf9c8 (rebased; r1–r3 now b3106b9..f82b7d0, r4 d58cf6a), superproject `ec016a0` on origin/main 724c7a1. Single helper `appliedStaminaChange(raw)` feeds label, disabled state, legacy bar and gauge. Steel gauge already clamped; only the legacy `.dse-stamina__fill/__delta` track changed. Gates green: jest 4950/1/229 of 230; lifecycle 26/26; e2e 71/76, 0 failed, 5 known-bug, 51/51; shots 572 0 FAIL + pressed toggle parity OK; freeze 276/276; parity 0/0/24.
- R4 follow-up (legacy track draws an out-of-range STORED value unclamped, e.g. fill 125% at 25/20 before any change): owner rules DROP if the reviewer confirms the legacy track is not visible in the shipped Steel theme; FOLD (clamp the stored fill) if it is visible.
- Re-review r3 (reviewer): LAND, 0C/0H/0M/0L/2I at d58cf6a. Sweep 0 violations (104 at efbbe9b), persisted values identical across all 7,560 sequences. Legacy track `display:none` in Steel → R4 follow-up resolves to DROP. I1 (gauge shows no band when a change only corrects an out-of-range stored value) accepted under O8.
- LAND-READY 2026-10-19: DSE `d58cf6a` on develop 6bcf9c8; superproject `ec016a0` on main 724c7a1.
