# SC-614 r1 implementer report

## Executive summary
- Verdict: DONE. Removing a condition from the tracker's conditions row keeps keyboard focus in the row (mouse and keyboard presses), hero and creature rows.
- Final dse sha `283cb2f5` (branch `sc614-conditions-mouse-remove-focus`, rebased onto develop `27120710`, 4 commits). Superproject `c98a004d` (one CHANGELOG commit rebased onto workspace origin/main `a7a989ef`; no pointer bump).
- Gates on `283cb2f5`: tsc/lint clean · jest 11900 passed / 1 skipped (shots cache present; base 11892 + 7 new + 1 cache) · lifecycle 64/64 (7 parts, part 7 `G-S108,G-S112,G-S115`) · e2e `340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · parity 0 GAPs / 0 undeclared / 24 declared.
- Shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280 were measured on the same code before the SC-621 rebase (`18c986c0`, develop `b1e4f027`); the rebase changed no CSS (`styles-source.css` untouched in 9b94baf2..27120710), so they carry.
- Base moved twice during the effort (b1e4f027, then 27120710); rebased both repos each time.

## Diagnosis
Confirmed at `9b94baf2`. The click shield (`armClickShield`, pipeline.ts) `preventDefault()`s mousedown on non-editable targets, so a mouse press on a chip never moves focus: focus stays on Add Condition (or another chip). The chip's click handler runs `onRemove` -> `rerender()` -> `buildConditionRow` -> `conditionsEl.empty()`, which destroys the focused node; focus falls to `<body>`. Keyboard removal (Enter/Space on the focused chip) drops to `<body>` the same way.

## Fix
- `src/elements/initiative/view.ts`: new `CONDITION_ROW_FAMILIES` (`init.cond.remove` and `init.cond.add` as ONE family, removes first then Add). In `buildConditionIcons`' `onRemove`: `captureControlFocus(container, ...)` before the redraw (container = that conditions row, so focus elsewhere in the tracker or outside it captures null and nothing changes), `nth` shifted down by one when the focused control sat after the removed chip, then `restoreControlFocus(container, focus, ...)` right after `rerender()`. Result: Add -> new Add; another chip -> that condition's new chip; the removed chip itself (keyboard) -> next control by `controlSuccessor`, and for the last chip -> Add Condition (never `<body>`). Ring follows what the old node showed (existing `captureControlFocus` behaviour).
- `src/framework/kit/conditionIcons.ts`: `onRemove(entry, button)` now also passes the pressed button (needed to know which chip went). Additive; the two existing kit tests that asserted exact args were updated.

## Tests
jest (`test/dom/elements/initiative-matrix.test.ts`, describe "after a mouse press on a condition's remove button redraws the conditions row"): F23 focus on Add -> rebuilt Add; F24 focus on another chip -> same condition's rebuilt chip; F25 creature detail row; F26 focus on the pressed chip itself -> successor (Add for the last); F27 focus on `<body>` / in another field -> not pulled in; F28 focus on Advance round untouched; F29 keyboard press (detail 0) keeps focus in row. Red on base `9b94baf2` (run with the fix absent): F23, F24, F25, F26, F29 fail (focus on `<body>`); F27, F28 pass on base and fix by design (negatives). All 7 green on the fix. `test/dom/kit/conditionIcons.test.ts`: 2 assertions updated for the second argument.
e2e (`e2e/specs/initiative/focus-after-condition-remove.e2e.ts`, ids INIT-F15, INIT-F16, no collisions on develop/other worktrees; manifest row `init.cond.remove` lists them): F15 Tab to the detail row's Add Condition, mouse press on its Dazed chip, condition gone, `document.activeElement` is a NEW Add Condition button in the detail row; F16 blur to `<body>` (start state asserted, tracker not holding focus), mouse remove, focus still `<body>`. Red on base: F15 fails (focus ctl null, not in tracker), F16 passes (negative). Note: the chip click is driven by control id (`init.cond.remove` nth 1), not a css selector: a css-driven click made the coverage gate fail ("driven pair in no manifest").

## Survey
(a) Keyboard removal (Enter/Space on a chip): before the fix focus dropped to `<body>` (F29 red on base). The same capture/restore + successor rule fixed it in the same lines, so it is fixed and covered by F29 (jest). No separate e2e.
(b) Conditions-window apply callback (`rerender()` in the Add Condition `ConditionsModal` callback): focus is inside the window then, not in the row, and SC-603's token hands focus back on close. Unchanged, no capture added; existing jest F13 (closing the window after an edit gives focus to the rebuilt Add Condition) and e2e INIT-F11 still pass.
Sidebar: the same view code runs in the pinned sidebar tracker. A throwaway e2e probe (not committed, file deleted) pinned `Sidebar/initiative-pinned.md` with a hero condition, focused the sidebar's Add Condition, real mouse click on the chip: focus ended on a new `init.cond.add` inside `.dse-sidebar`. Probe was run on the fix only.

## Drive-by fixes
- dse `CHANGELOG.md`: the SC-609 entry's "Not covered: ... a click that removes a condition from the row focus was in (SC-614)" is no longer true; removed that clause.

## Follow-ups
- None filed by me. Note for owner: the first jest full run after the kit change failed 2 kit tests (exact-arg asserts); fixed in `283cb2f5`.

## Evidence artifacts (logs)
Directory `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc614-r1-impl/`: `jest-matrix-base.log` (red), `jest-matrix-fix.log`, `e2e-only-base.log` (INIT-F15 red), `e2e-only-fix.log`, `e2e-only-probe.log` (sidebar probe), final battery on `283cb2f5`: `final-gtsc.log`, `final-glint.log`, `final-gjest.log`, `final-glc1..7.log`, `final-ge2e.log`, `final-gparity.log`; pre-rebase shots/freeze: `final-shots.log`, `final-freeze.log`.
