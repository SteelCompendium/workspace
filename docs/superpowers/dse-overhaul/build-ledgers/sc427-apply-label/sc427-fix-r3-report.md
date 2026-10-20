# SC-427 fix round 3 report (folds r2)

**Executive summary**
- STATUS: DONE. DSE head `7433218` on base `c616e22` (unmoved); superproject head `2cebbc6` on `origin/main` `fb413cc`. No history rewritten (r3 = one commit on `943fc47`).
- R1-M1 fixed (option A): `updateActionButton` labels the Stamina part, and sets Apply's disabled state, from `clampStamina(current + (draft ?? pending)) - current` when the raw change is non-zero. Persisted numbers unchanged.
- 5 new jest rows (the 5 review scenarios) fail on pre-fix src (5 failed), pass after; plus an in-range identity row.
- R1-L1: both CHANGELOG bullets re-read and extended with the part-way-back Damage/Healing case. R1-I1: SC-425 Full Heal flips kept.
- Gates at 7433218: tsc/lint rc 0; jest 4888 passed / 1 skipped / 228 of 229; lifecycle 25/25; e2e 71/76 ok, 0 failed, 5 known-bug, 51/51; shots 572, 0 FAIL, pressed toggle parity OK; freeze 276/276; parity 0/0/24.
- r2 (F1-F3) self-check folded below; the r2 code was committed in 4d51550/943fc47 and its battery was superseded by this one.

## R1-M1 (r3)
`src/views/StaminaEditModal.ts`: new `staminaFrame {current, floor, max}` set in `onOpen`; `updateActionButton` uses
`raw === 0 ? 0 : clampStamina(current + raw, floor, max) - current` for both the label and `setDisabled`. In range it is the identity. Results: stored 25/20 Damage 3 -> "Lose 5 Stamina" (field 20, persists 20); hero -14/20 (floor -10) Healing 2 -> "Gain 4 Stamina" (field/persist -10); creature -3/20 Healing 2 -> "Gain 3 Stamina" (0); hero -10/15 (floor -7) Healing 2 -> "Gain 3 Stamina" (-7); hero 18/15 temp 4 Damage 3 twice -> "Lose 3 Stamina and Lose 4 Temp Stamina" (persists 15, temp 0).
Not covered by a UI-reachable test: the "clamped part is 0 with a non-zero raw change" branch (needs a raw change that clamps back onto the stored value; none of the UI actions produce it). The code path is the same expression, so the label would read "No Stamina Change" and Apply stay disabled.

Tests (`test/dom/views/stamina-edit-modal-matrix.test.ts`, `[M1]` describe, 5 `test.each` rows + 1 in-range identity row): label, enabled state, field value, persisted Stamina and persisted Temp. Fail-before: `git stash push -- src` then jest on `test/dom/views/stamina-edit-modal` -> `Tests: 5 failed, 271 passed, 276 total` (all five [M1] rows; `evidence/r3-prefix-jest.log`); with the fix 276/276 (`evidence/r3-jest-focused.log`).

## r2 self-check (F1-F3, diff 9aab55b..943fc47)
- F1: `readAmount` exported and used for both pool-modal Apply Damage boxes (damage, minions). Tests: "1e3" damage equals a typed 1000; minion count "1e1" -> 10, capped at 5 living and shown 5; "2.9" truncates, empty does nothing. No pool-modal marker existed. Complete.
- F2: Full Heal is `Math.max(0, max - current)`. Tests: 25/20 -> No Stamina Change (+ temp-only variant), hero -10/15 Full Heal still "Gain 25". Complete.
- F3: Apply leaves `current_stamina` as stored when pending Stamina is 0. Tests: creature 25/20, creature -3/20, hero -10/15 Temp-only Apply keep stored Stamina; a real change still clamps. Complete (Recoveries-only cannot occur without a Stamina change).
- Side effect (flagged, owner accepted as R1-I1): `[Q05] Full Heal on 31` (matrix) and `[E06] Full Heal then Apply` (entry-points) SC-425 markers flipped to plain tests, because Full Heal at max 0 now stages nothing (Apply disabled, no write). SC-425 Damage half still open.
- Process note: a transient `sidebarInitiative.test.ts` (SC-288 r2) failure appeared once in the r2 jest run under load; it passes alone (11/11) and the full re-run was green. Logs `evidence/r2-jest-run1-sidebar-flake.log`, `evidence/r2-jest-sidebar-rerun.log`.
- The scratch dir was wiped by the crash; node_modules is a copy of another worktree's (same lockfile).

## CHANGELOG (R1-L1)
Both bullets (`draw-steel-elements/CHANGELOG.md`, superproject `CHANGELOG.md`) re-read against final behaviour. Headline "the Apply button says exactly what it will apply" is now true for typed, stepped, Damage, Healing, Kill and Full Heal; added: "a Damage or Healing that only brings it part of the way back still shows the change that really gets saved".

## Gates at 7433218 (base c616e22)
- tsc (incl. `tsc -p e2e`) rc 0; lint rc 0.
- jest: `Tests: 1 skipped, 4888 passed, 4889 total`, `Test Suites: 1 skipped, 228 passed, 228 of 229`, rc 0.
- lifecycle (port 9291): `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`, rc 0.
- e2e: `OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`, rc 0 (run twice; the first overlapped a lifecycle run by mistake, the log kept is the clean serial rerun).
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (96 comparisons ...)`, host-copy pin OK, button host-leak OK (112 kinds, 672), rc 0.
- freeze: `freeze OK (276/276 ...)`, rc 0. parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Drive-by fixes
None.

## Follow-ups
- The preview gauge/legacy bar (`updateBar`) still draws `current + raw pending`, so on an out-of-range stored value after a partial Damage/Healing the gauge's pending marker can sit past the bound (e.g. 22 under max 20) while the label/field/persist agree. Not flagged by the review; unchanged.

## Artifacts
Evidence dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/evidence/`: `r3-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log|.rc`, `r3-prefix-jest.log|.rc`, `r3-jest-focused.log|.rc`; r2 files `r2-*`. Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/sc427-fix-r3-report.md`.
