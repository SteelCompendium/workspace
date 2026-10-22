# SC-465 r1 implementer report

## Executive summary
- Verdict: DONE. Keyboard (and mouse) heal that disables the heal button while it holds focus now hands focus to the next enabled tab stop in the Stamina modal (Reset); both pool "Spend Recovery" and no-pool "Heal Recovery Value" (after Confirm) paths fixed.
- dse: branch `sc465-heal-focus` = `7f83724` on base `e4c5cf6` (commits `adb0684` fix + jest, `7f83724` e2e). origin/develop still `e4c5cf6`. Tree clean.
- superproject: `7671c43` (CHANGELOG bullet) on `6bf71ca` (rebased onto origin/main; ff, no conflicts). The worktree's pointer for draw-steel-elements shows modified (uncommitted; wt-finish owns it).
- Gates (all on final head): tsc+tsc -p e2e clean; lint clean; jest 5717 passed / 1 skipped / 238 of 239 suites (base 5711 + 6 new); lifecycle 31/31 ok, 0 failed; e2e 104/104 ok, 0 failed, 0 known-bug, coverage 69/69 pairs (base 101 + 3 new); shots 580, 0 FAIL, no ALLOWLISTED; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- Ring measured in real Obsidian 1.14.4: keyboard heal -> Reset shows `:focus-visible` true; mouse heal -> Reset `:focus-visible` false.

## What changed
`draw-steel-elements/src/views/StaminaEditModal.ts`
- New exported `focusNeighbourStop(root, from, visible)` + private `showsFocusRing(el)` (above `class StaminaEditModal`): next enabled tab stop after `from` in DOM order inside `root` (disabled, `tabindex=-1`, `[hidden]` skipped), else the previous one, else nothing moves (never body). `focus({preventScroll:true, focusVisible: visible})`. No existing kit helper did this (kit only has the first-focusable query in managedModal), so it is local; its selector mirrors `managedModal.FOCUSABLE`.
- `refresh()` (pool path and no-pool path both go through it): captures whether the heal button holds focus (and its ring state) before applying `setDisabled`, then after the state is applied calls the helper if it held focus and is now disabled. Root = `this.modalEl ?? this.containerEl`. Input type is irrelevant (mouse, Enter, Space all treated alike, as SC-428).
- SC-432 confirmation return-focus (was `() => spendRecoveryBtn?.buttonEl.focus()`): the ring state is captured at press time (before the dialog takes focus); on dismiss, if the heal button is disabled -> `focusNeighbourStop`, else plain `healEl.focus()` as before (Cancel / Escape / X / non-filling Confirm unchanged).
- Focus targets: Reset on both paths (heal button is the last quick action; Reset is the next stop in the footer). Next Tab then lands on Apply (verified in e2e).

`e2e/specs/stamina-bar/stamina-modal-focus.e2e.ts` (new), `e2e/manifest/stamina-edit-modal.ts` (3 added kinds, no new control ids): `sedit.spend-recovery` +`press:Enter`, `sedit.free-heal.confirm` +`press:Enter`, `sedit.reset` +`press:Tab`.
`CHANGELOG.md` (superproject): one bullet under `## Unreleased`.

## Tests
jest (`test/dom/views/stamina-edit-modal.test.ts`, describe "SC-465: focus stays inside the Stamina modal when the heal button disables itself", 6 tests):
1. pool hero: Spend Recovery filling Stamina moves focus to Reset
2. no-pool hero: Heal Recovery Value + Confirm filling Stamina leaves focus on enabled Reset in the modal
3. no-pool: Confirm that does not fill Stamina still returns focus to the enabled heal button
4. no-pool: Cancel returns focus to the heal button
5. focus only moves when the heal button held it (another focused control keeps focus)
6. `focusNeighbourStop` unit: next wins, else previous, else nothing moves (skips disabled / tabindex -1)

e2e (real keys, real Obsidian): `[STAM-Q14]` keyboard Spend Recovery -> focus Reset, ring true, Tab -> `sedit.apply`; `[STAM-Q15]` keyboard Heal Recovery Value + keyboard Confirm -> Reset, ring true, Tab -> Apply; `[STAM-Q16]` mouse Spend Recovery -> Reset, ring false. No fixtures added (Healing in the Apply box stages 8/18 first so one heal reaches max).

## Discrimination (run against unfixed source)
- jest, unfixed `StaminaEditModal.ts` + new tests: 3 failed / 3 passed. Failed: #1 (pool: activeElement stays the now-disabled button), #2 (activeElement is `<body>`), #6 (helper does not exist). Passed on both: #3, #4, #5 (regression pins of unchanged behaviour). Fixed source: 6/6.
- e2e, source restored to `e4c5cf6`: Q14, Q15, Q16 all FAIL (`focusedControl` expected `sedit.reset`, received `null` = body), rc=1. Fixed source: 3/3 ok. Log: `.../scratchpad/sc465-r1-impl-A/e2e-only-baseline.log` (fixed: `e2e-only-fixed.log`).

## Survey of other controls that can disable themselves while focused
- Folded: none needed. In StaminaEditModal.ts the only control whose own press disables itself is the heal button. Kill / Full Heal / Damage / Healing / Reset never disable themselves; Apply disables only after Reset or a stepper edit, never while it holds focus (pressing Apply closes the modal); SC-433 temp "-" and the Stamina "+/-" are kit stepper buttons (below).
- Follow-up (shared kit, not changed, needs owner ruling): `src/framework/kit/stepper.ts` `render()` (~:175-176) `setDisabled`s the "-" at `min` and "+" at `max` after a commit. A keyboard user pressing "+" at the last step (Stamina to max, temp "-" to 0) disables the focused button, so focus drops to body, same shape. Affects every stepper consumer (StaminaEditModal, MinionStaminaPoolModal, others). Not reproduced in e2e.

## Drive-by fixes
None.

## Follow-ups
1. Kit `stepper` bound-disable focus loss (above); one fix in the kit would cover all consumers, and could reuse/generalise `focusNeighbourStop` (currently local + exported for the jest unit test).
2. Minor, unchanged behaviour: `FreeHealConfirmModal.onDismissed` also runs when the Stamina modal is closed from under it (view unload); the callback then focuses a control inside a closing modal. Harmless (no body fallback is introduced), left as is.
3. Gate note: `coverage driven: 70` vs `69/69` manifest pairs in the full e2e line is pre-existing reporting (gate passed); not investigated.

## Evidence artifacts (scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r1-impl-A/)
tsc.log, lint.log, jest-first.log (before shots: 5716/2 skipped), jest-final.log (after shots: 5717/1 skipped), lifecycle.log, e2e-full.log, e2e-only-fixed.log, e2e-only-baseline.log, shots.log, freeze.log, parity.log.
Session note: a 429 session-limit kill was reported by the dispatcher; all gates above were run in this session on the final head (no source change after the e2e commit).
