# SC-433 r2 fix report

## Executive summary
- Verdict: DONE. Rebased and LOW-1 folded.
- dse head `e4c5cf6` on `sc433-temp-stamina-minus`, rebased onto origin/develop `424f47b` (not newer). Commits: `7db087f` (fix + tests), `52271b1` (e2e T14), `e4c5cf6` (fix(SC-433) LOW-1). Not pushed.
- Superproject head `fb6a3f8`, rebased onto origin/main `89bd345` (newer than the briefed 415c086; it only adds a handoff doc commit). One conflict: CHANGELOG `## Unreleased` vs SC-361's bullet, resolved by keeping both. The `draw-steel-elements` pointer is not committed (still shows ` M`).
- Gates: tsc + lint clean; jest 5711 passed / 1 skipped / 238 of 239; lifecycle 31/31; e2e `101/101 ok, 0 failed, 0 known-bug, coverage 66/66`; shots 580, 0 FAIL, no ALLOWLISTED line, text-scale + modal host-leak lines present; freeze 280/280; parity 0 gap / 0 undeclared / 24 declared.
- LOW-1: stored temp read once as `Math.max(0, temp_stamina ?? 0)` (`StaminaEditModal.ts`, the `currentTempStamina` const in `onOpen`); every temp path (field start, Damage, Kill, Full Heal, labels, Apply) derives from it. 5 new jsdom tests; 4 fail without the fix.
- `package.json`/lockfile unchanged by the rebase (3973b56..424f47b), so no `npm ci`.

## LOW-1 detail
- Tests (in the SC-433 describe, `test/dom/views/stamina-edit-modal.test.ts`): stored -3 opens with field 0, "-" disabled, nothing staged, Apply disabled, `bar.temp_stamina` still -3, no callback; Damage 5 labels exactly "Lose 5 Stamina" and Apply writes stamina 10 / temp 0; Full Heal labels exactly "Gain 5 Stamina" (no temp gain), Apply writes 20 / 0; Kill label has no "Temp"; "+" then "-" returns to 0 with nothing staged.
- Behaviour to note: Apply after any edit on a negative stored temp writes the clamped 0 (as the ruling says for Damage/Full Heal); this includes a Stamina-only Apply (temp -3 -> 0). Opening and cancelling writes nothing.
- Out of scope, untouched: initiative writing `temp_stamina: 0` (SC-485).

## Evidence
Logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/`: `sc433-r2-tsc.log`, `sc433-r2-lint.log`, `sc433-r2-jest-focused.log`, `sc433-r2-jest-revert.log` (fix stashed: 4 failed / 103 passed of 107), `sc433-r2-jest.log`, `sc433-r2-lifecycle.log`, `sc433-r2-e2e.log`, `sc433-r2-shots.log`, `sc433-r2-freeze.log`, `sc433-r2-parity.log`. r1 screenshots in `evidence/` still apply (no UI change).

Follow-ups: none. Drive-by fixes: none.
