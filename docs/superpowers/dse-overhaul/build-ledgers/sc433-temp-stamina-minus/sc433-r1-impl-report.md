# SC-433 r1 implementation report

## Executive summary
- Verdict: DONE. The Temporary Stamina field (stepper "-", "+", typed value) is now a direct edit: `stagedTemp = value - currentTempStamina`; the stepper's min 0 floors it.
- dse head `e0b14f3` on `sc433-temp-stamina-minus` (on top of origin/develop `3973b56`, not moved): `d20a57a` (fix + tests), `e0b14f3` (e2e T14 reopen fix). Superproject `78e4d6b` (CHANGELOG bullet; dse pointer NOT bumped).
- Effect-grant path: none exists (modal or host). Nothing keeps take-the-higher; no new UI.
- Gates: tsc (+e2e) clean, lint clean; jest 5699 passed / 1 skipped / 238 of 239 suites (5698 / 2 skipped before shots); lifecycle 31/31; e2e `100/100 ok, 0 failed, 0 known-bug, coverage 66/66`; shots 580, 0 FAIL, both text-scale lines + modal host-leak line; freeze `280/280`; parity 0 GAP / 0 undeclared / 24 DECLARED.
- G-S27 not added: e2e T14 covers the lower-Apply-reopen round trip against the note file.
- Evidence screenshots in `evidence/` (a/b/c).

## Survey (file:line, pre-fix numbering, `draw-steel-elements/src/views/StaminaEditModal.ts`)
- `:484-485` `stagedTemp` = `Math.max(value, current + pending) - current` (the cause); used by `onChange` (:512) and the SC-430 draft preview `onDraftInput` (:496).
- `:400-402` Damage: temp absorbs first from the running position (`current + pending`); `:533` Kill and `:550` Full Heal set `pending = -current`. All unchanged.
- `:666` Apply writes `temp_stamina = currentTempStamina + pendingTempStaminaChange`. `:825` + `updateActionButton` labels "Gain/Lose N Temp Stamina" from pending or the draft.
- `src/framework/kit/stepper.ts:175`: `minusBtn.setDisabled(min !== undefined && current <= min)` — with min 0 the "-" is really disabled at 0, enabled above (CB-8 holds automatically once the staged value follows the field).
- Effect-grant search: `grep` of every `temp_stamina` write in `src/` outside the modal finds only `EncounterData.ts` (:625 clear to undefined, :747/:889 `?? 0` defaults, :876 seed 0), `initiative/{model,resolveRefs}.ts` (`?? 0` defaults), `StaminaBar.ts` (:120, :137, :142 plain copy). No method or UI grants temp from an effect. So take-the-higher survives nowhere.

## Design notes
- One-line logic change plus comment rewrite (the SC-133 RC-5 comment now states the new rule and the "no effect-grant path" fact). The field edits the running position, so Damage-then-minus works (A2: 5, Damage 3 -> 2, minus -> 1).
- Negative typed value: stepper clamps to 0, staged as `-currentTemp` (same clamp as before; now actually applied).
- Hand-edited stored negative temp is untouched (not in scope).

## Test changes
Jest (`test/dom/views/stamina-edit-modal.test.ts`), suite 102 passed:
- Flipped `test.failing` markers to plain tests: "typing a temp value lower than the current...3 over 5", "a typed temp value after an earlier typed grant (9 then 3 gives 3)", "A2: Damage absorbs 3 of 5 ... minus lowers to 1"; the old "bounds that hold today" test replaced by the exact "minus lowers temp by one: Apply writes 4, minus stays enabled" test (the 4th failing marker).
- Added: CB-8 minus disabled exactly at 0 / enabled above (and disabled on open at 0); ticket repro 5,+,+,- -> 7 -> 6, Apply 6; mistyped 50 -> Apply -> reopen -> type 5 -> Apply 5; typed negative clamps to 0 and applies as 0.
- Rewrote: describe title and header comment; "Temp Stamina: the take-higher floor (SC-133 RC-5) applies to the draft preview too" (pinned old behaviour) now asserts a typed 2 over 5 previews "Lose 3 Temp Stamina", enabled, and Apply persists 2; I4 "characterization, NOT a spec" retitled to a plain spec ("+" x3 steps to 8); A1/A4/Kill/Full Heal titles reworded off "grant/take higher" (assertions unchanged and still pass).
- No test matched "the minus button cannot walk temp below the session-start value" or "[current behaviour — ruling pending SC-408]" in the repo any more (already converted to the `[known bug SC-433]` markers).

e2e (`e2e/specs/stamina-bar/stamina-modal.e2e.ts`): T03, T04, T10 `knownBug('SC-433')` -> plain `it` (T10 now also asserts the field shows 0, "-" disabled, and the NOTE has temp_stamina 0 after Apply). T11 tightened to exact values (field 4, "Lose 1 Temp Stamina", no write until Apply). New T13 (repro 5,+,+,- -> 6, note temp_stamina 6) and T14 (typed 50 -> Apply -> note 50 -> click bar again -> field 50 -> type 5 -> Apply -> note 5). T14 reopens by clicking the bar, not `openNote`, because `openNote` resets fixtures (first run failed on that, fixed in `e0b14f3`). Dropped the unused `knownBug` import. No manifest change (no new control). `grep SC-433` in src/test/e2e now returns only history/rationale comments plus the new test titles.

Docs: `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/CHANGELOG.md` `## Unreleased` bullet (commit `78e4d6b`). No DSE user doc described the temp field as keep-the-higher (`docs/stamina-bar.md` is silent); the historical dse CHANGELOG SC-133 entry left as history.

## Gates (logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/`)
tsc `sc433-r1-tsc.log` rc 0, `sc433-r1-tsc-e2e.log` rc 0; lint `sc433-r1-lint.log` rc 0; jest `sc433-r1-jest.log` (5699 / 1 skipped; first pre-shots run 5698 / 2 skipped); lifecycle `sc433-r1-lifecycle.log` 31/31 (port 9433); e2e `sc433-r1-e2e.log` (final: `OBSIDIAN-E2E done: 100/100 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`; an earlier run 99/100 failed on T14's reopen, fixed); shots `sc433-r1-shots.log` 580 files, 0 FAIL; freeze `sc433-r1-freeze.log` `freeze OK (280/280 ...)`; parity `sc433-r1-parity.log` `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. Also `sc433-r1-npmci.log` (fresh worktree had no node_modules; `npm ci` ran).

Evidence (`.../evidence/`, cropped to the modal, real Obsidian via a throwaway spec that is deleted, not committed): `sc433-a-temp-7-after-plus-plus.png` (temp 7, "Gain 2 Temp Stamina"), `sc433-b-temp-6-after-minus-minus-enabled.png` (temp 6, "-" enabled, "Gain 1 Temp Stamina"), `sc433-c-temp-0-minus-disabled.png` (temp 0 block, "-" disabled).

## Follow-ups
- None filed beyond: the `dse-verify` SKILL.md "today" numbers (95/98, 3 known-bug) now read 100/100, 0 known-bug, jest 5699/1 — owner to refresh at landing.

## Drive-by fixes
- None.
