# SC-427 implementer report, round 1

**Executive summary**
- STATUS: DONE (one judgement call flagged below: what the Stamina field DISPLAYS for a hand-edited out-of-range stored value).
- DSE branch `sc427-apply-label`, head `9aab55b`, rebased onto `origin/develop` `c616e22` (moved from 9ed8dc6 mid-task per owner's message; battery re-run on c616e22). Superproject head `3dba6f1` (CHANGELOG only; pointer bump left to wt-finish).
- Mechanism: kit stepper `min`/`max` (= [negativeStaminaLimit, maxStamina]) on the Stamina stepper; no kit change. Items 1-4 all fixed in `src/views/StaminaEditModal.ts`.
- All 8 jest markers + 3 e2e markers flipped to plain tests; confirmed failing on pre-fix src (33 jest failures, 3/3 e2e).
- Gates on c616e22: tsc/lint clean; jest 4873 passed / 1 skipped / 228 of 229; lifecycle 25/25; e2e 71/76 ok, 0 failed, 5 known-bug, 51/51; shots 572, 0 FAIL; freeze OK 276/276; parity 0/0/24.
- Kit stepper does NOT misread "1e3" (it uses Number()), so O4 needs no kit fix. The pool modal's Apply Damage boxes do (follow-up).

See the return text for full detail; evidence logs are in `evidence/` next to this file.

## What changed (src/views/StaminaEditModal.ts)
1. Stamina stepper gets `min: negativeStaminaLimit, max: maxStamina`. The kit clamps every typed commit, every ± step and the SC-430 `onDraftInput` value (via `parseDraft`) before the modal sees it, so field, label (committed and half-typed) and persisted value agree; ± disable for real at the bounds. KNOWN DEVIATION comment and the `recoverySpendResult` doc rewritten.
2. `amountToDeath` / `amountToMaxStamina` wrapped in `Math.max(0, ...)`; Kill stages `Math.min(0, floor - current)` (never "Gain").
3. Apply box parsed by `readAmount` = trim, empty -> NaN, else `Math.trunc(Number(v))` (SC-133 RC-3 magnitude clamp and NaN guard kept).
4. Reset sets the Apply box to `'0'` (its opening value); `refresh()` already re-renders both steppers, which drops half-typed drafts.

## Judgement call (owner may overrule)
Out-of-range stored value (25/20, creature -3, hero -10 under -7): the modal opens on "No Stamina Change", Apply disabled, nothing pending, nothing written (O2 satisfied, tested for all three). But the kit seeds the stepper with the CLAMPED value, so the field DISPLAYS 20 / 0 / -7, not the stored 25 / -3 / -10. `clampInitial:false` cannot keep it (the modal's `refresh()` calls `setValue`, which always clamps; and its out-of-range ± steps would stage a lying label). The alternative (unbounded kit stepper + clamp in the modal) keeps the stored number on screen but leaves ± enabled at the bounds as silent no-ops. Chosen: bounded kit, because it matches the minion pool modal's idiom and gives real disabled ± buttons.

## Minion pool modal Reset (read and copied)
Sets `pendingStaminaChange = 0`, `damageInput.value = '0'`, `minionCountInput.value = '1'`, unchecks and disables every minion checkbox (`auto=false`), then `refresh()` (which re-renders the pool stepper, dropping any draft). Mirrored here: the single input (Apply box) goes to its opening `'0'`, pendings to 0, `refresh()`.

## Ticket examples, before -> after (max 20, current 10 unless noted)
- Creature type 30: label "Gain 20 Stamina" (field showed 30) -> "Gain 10 Stamina", field shows 20; persists 20. Same while half-typed.
- Hero type 99: "Gain 89" -> "Gain 10", field 20.
- Creature type -5: "Lose 15" (field -5) -> "Lose 10", field 0; persists 0.
- Hero type -50: "Lose 60" -> "Lose 20", field -10.
- Draft 30 at 15/20: "Gain 15" -> "Gain 5" (blur lands the same text).
- Creature -3, Damage: pending +3 "Gain 3" -> no change. 25/20, Healing: pending -5 "Lose 5" -> no change. Hero -10/15 (floor -7), Kill: "Gain 3 Stamina" -> no stamina change (only temp cleared).
- "1e3" Damage on creature 20/20: "Lose 1" -> "Lose 20". Healing 5/20: "Gain 1" -> "Gain 15".
- type 22 then `+` (S10): field 23, persisted 20 -> field 20, `+` disabled.

## Tests
- Flipped (plain, titles drop the marker): matrix A09 x2, A10, A14, Q03 x2, S08/S09 x4 (test.each), F06; e2e STAM-S08, STAM-D09, STAM-F06 (each now closes its modal; S08 also asserts the field shows 20 and the persisted write).
- Rewritten: matrix [S10] (both directions) and `stamina-edit-modal.test.ts` "typed value past max" draft test (now `Gain 5`, blur lands the same text, field 20).
- New jest (net +24 vs base 4849): S11 bounds (± stop at bounds for creature/hero, start disabled when opened at the bound, field shows clamp x4 rows, hero floor -7 vs creature 0); S12 "1e3" in Stamina (clamps to max) and Temp (1000) steppers; O2 three out-of-range opens + first edit stages from stored value + Healing/Damage no-ops + Kill below floor; Reset drops half-typed drafts; Reset after Healing; draft below the floor for creature and hero.
- No new e2e control ids, so no manifest rows needed.

## Fail-before
Pre-fix src (base file swapped in, tests at fixed HEAD): jest 33 failed / 231 passed (`evidence/evidence-jest-prefix-fail.log`); e2e `--only=STAM-S08,STAM-D09,STAM-F06`: 0/3 ok, 3 failed (`evidence/e2e-prefix.log`). With fix: 3/3 ok (`evidence/e2e-subset2.log`). The S12 Temp "1e3" test passes pre-fix (proves temp was never affected).

## Gates (on c616e22 + 3 commits)
- tsc incl. `tsc -p e2e`: rc 0. lint: rc 0.
- jest: `Tests: 1 skipped, 4873 passed, 4874 total; Test Suites: 1 skipped, 228 passed, 228 of 229`, rc 0.
- lifecycle (port 9291): `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`, rc 0.
- e2e: `OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`, rc 0.
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (96 comparisons ...)`, host-copy pin OK, button host-leak OK (112 kinds, 672), rc 0.
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`, rc 0. No rebaseline.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- Non-frozen shot changes: none in the browser harness (it has no Stamina-modal fixtures). The Obsidian-camera `modal-stamina` fixture is 22/48 (mid-range), so `+`/`-` are not disabled there; obsidian-shots not run (needs a display).
- Note: the first jest run in a fresh worktree reads "2 skipped" (no `visual-harness/dist/obsidian-app.css` yet, so one conditional test skips); after `npm run shots` it is the expected 1 skipped.

## Drive-by fixes
None.

## Follow-ups
- `MinionStaminaPoolModal.ts:177-178`: `parseInt(damageInput.value)` / `parseInt(minionCountInput.value)` have the same "1e3 reads as 1" defect (only other `parseInt(<input>.value)` in src; `elements/encounter/budget.ts:40` parses a string, not an input). Not fixed (out of scope).
- Full Heal at a stored value past max (25/20) stages "Lose 5" (pending = max - current). Persisted 20, so the label is true, but it is the same "control inverts" class as item 2; ticket names only Kill. Left as is.
- Apply on an out-of-range stored value with only a Temp change also rewrites current Stamina to the clamp (existing `clampStamina` at Apply), and the label does not mention it. Pre-existing; unchanged.
- Hero with unresolved class (max 0, SC-425): the field now shows the clamped 0 instead of the stored value; matches what Apply persists (still the SC-425 bug, jest [Q05] markers remain `test.failing`).

## Artifacts
- Logs/evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/evidence/` (h-*.log/.rc = final gates on c616e22; evidence-jest-prefix-fail.log; e2e-prefix.log; e2e-subset2.log).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc427-apply-label` (DSE at `.../draw-steel-elements`). Commits: d04f894 (fix + jest), 99fb142 (e2e flips), 9aab55b (DSE CHANGELOG); superproject 3dba6f1 (CHANGELOG).
