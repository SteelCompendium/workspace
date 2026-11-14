Ready to land: clicking a creature in the roster while typing in a tracker text box now moves keyboard focus to that creature's cell instead of dropping it to the page. What you typed in the box stays.

This works from the Malice quick-add amount and label boxes in Reading view, the pinned sidebar tracker and Live Preview, and from the encounter title while you are editing it (tested in Reading view). A click while focus is outside the tracker still does not pull focus into it. Clicking away from a text box still saves it, exactly as before.

No decision needed from you. An independent review found no blocking problems; its one small gap (no tests for the label box in the sidebar and Live Preview) was filled with two more real-Obsidian tests.

Mechanics, below the line:

- Fix: `src/elements/initiative/view.ts` remembers, at the moment the mouse button goes down, whether focus was inside the tracker, before the click shield takes focus out of the text box. The roster cell's click uses that once. No framework file changed.
- Tests: 8 jest tests and 9 real-Obsidian e2e scenarios (INIT-F17 to INIT-F25); with the fix removed, 4 jest tests and 7 e2e scenarios fail. The other two e2e scenarios check that focus outside the tracker is not pulled in.
- dse `a5313f9d` on develop `f6e504c7`; superproject `fc2b9f06` on workspace main `7aae3668` (one pointer bump).
- Gates on `a5313f9d`: tsc and lint clean · jest 12133 passed / 1 skipped · lifecycle 64/64 · e2e 424/437 ok, 0 failed, 13 known-bug, coverage 233/233 pairs · shots 592 · freeze 280/280 (no screenshot changed) · parity 0/0/24.
