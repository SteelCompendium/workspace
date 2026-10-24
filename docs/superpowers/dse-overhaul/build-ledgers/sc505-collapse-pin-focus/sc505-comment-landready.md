Keyboard Collapse, Expand and Pin to sidebar now keep focus in the block. Press Enter on Collapse and focus moves to the collapsed line's Expand button. Press Enter on Expand and focus returns to Collapse. Press Enter on Pin and focus stays on Pin. Each time the focus outline is visible. Mouse clicks behave as before.

No action needed from you. This is ready to land.

**Scope.** The fix is in the shared menu-panel code, so it covers every element with the hover menu, not only the stamina bar. The reviewer checked Collapse and Expand by keyboard on all 19 elements that render one.

**Edge cases fixed during review:**
- With the same note open in two panes, Pin in the second pane used to drop focus to the page. Now focus stays in the pane you pressed. The same holds for a note that embeds the same block twice: focus stays on the copy you pressed.
- A Pin that changes nothing (pressing it again, or a block type that cannot be pinned) used to leave a pending focus move for 3 seconds. In that window, Tabbing to another button in the block and then a redraw would pull focus back to Pin. Now nothing is left pending.

**Not in this ticket:** keyboard "Unpin from sidebar" still drops focus to the page. It needs a decision on where focus should go once the panel is gone, so it is filed as SC-511.

**Mechanics**
- draw-steel-elements `a0365a4` on develop `38f94f4`; workspace `b18b254` (CHANGELOG bullet) on main `2bb85df`.
- New: `src/framework/chrome/focusHandoff.ts`; changes in `mountChrome.ts`, the Pin item in `pipeline.ts`, and `requestPinToSidebar` (now reports whether it wrote the note).
- Gates: tsc and lint clean (0 warnings); jest 6052 passed / 1 skipped / 244 of 245 suites; lifecycle 36/36; e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87 pairs; shots 592, 0 FAIL; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Tests: jest unit tests for keyboard and mouse Collapse, Expand and Pin, two panes, and a Pin that writes nothing. Real-key e2e tests CHR-F01 to CHR-F09 on the stamina bar. Each behaviour test fails on the old code; CHR-F03 (mouse unchanged) and CHR-F09 are guards.
- Reviewed by an independent reviewer: 1 high, 1 medium and 2 low findings, all fixed. Three scoped re-reviews followed. They found 5 more low findings (the double-embed case, a guard that treated any Pin in the pane as its own, two untested checks, a lint warning), all fixed. The last re-review found nothing to fix.
