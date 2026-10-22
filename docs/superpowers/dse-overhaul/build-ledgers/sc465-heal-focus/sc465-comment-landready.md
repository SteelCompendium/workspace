Keyboard focus now stays in the Stamina window when a heal turns its own button off. After Spend Recovery (or Heal Recovery Value, after Confirm) fills Stamina or uses the last Recovery, focus moves to Reset, the next button, and the next Tab goes to Apply instead of the top of the page.

No decision is needed from you. The branch is ready to land; the coordinator lands it next.

**What you would see**

- With the keyboard, Reset gets the normal focus ring after the heal.
- With the mouse, focus also moves to Reset, but no ring shows (the same as any mouse click).
- A heal that does not reach max leaves focus on the heal button, as before.
- Cancel, Escape or the X on the "Heal without spending a Recovery?" dialog still return focus to the heal button.
- Nothing changes in what gets written to the note.

**Not in this ticket**

The "−" and "+" stepper buttons (for example Temporary Stamina at 0) lose focus the same way when they reach their limit. That is a shared control used on many surfaces, so it is filed separately as SC-495.

**Mechanics**

- draw-steel-elements `sc465-heal-focus` @ `e8f6a14` on `develop` `c0e761b` (ab70ad4 fix + jest, 59017c7 e2e, e8f6a14 review folds; rebased onto SC-279 with no conflicts). Workspace CHANGELOG `c2b8d18` on `main` `636c122`.
- New tests: 6 jest; e2e STAM-Q14 (pool hero, keyboard), STAM-Q15 (no-pool hero, keyboard Confirm), STAM-Q16 (mouse). All three e2e scenarios fail on the old code with focus on the page body.
- Gates on the final head: tsc and lint clean; jest 5743 passed / 1 skipped; lifecycle 31/31; e2e 104/104 ok, 0 failed, 0 known-bug, coverage 69/69; shots 592; freeze 280/280 (no rebaseline); parity 0 gaps / 0 undeclared / 24 declared.
- Independent review: approved, 0 critical/high/medium; two small findings folded in. 13 extra real-Obsidian probes (Space key, Shift+Tab, initiative tracker, dialog Cancel/Escape/X) all pass.
