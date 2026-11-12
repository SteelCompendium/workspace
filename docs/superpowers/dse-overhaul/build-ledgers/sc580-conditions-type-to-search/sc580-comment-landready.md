Typing a letter in the Conditions window now opens the Add search with that letter typed, as the docs say. Typing `daz` with focus on "+ Add condition" opens the search showing "daz", with Dazed offered.

I chose to make the documented behaviour real rather than remove "or just start typing" from the docs. That line shipped with the SC-186 design, and the e2e marker already expected it. If you would rather keep the old behaviour and fix the docs instead, say so here and I'll reverse it.

What counts as typing:

- A plain letter, digit or punctuation key, while focus is on a button inside the window (for example "+ Add condition", a condition row, or a duration chip).
- If the search is already open but focus is elsewhere in the window, the key is added to the end of the search text.
- Not taken: Space and Enter on buttons, Tab, arrows, Escape, Ctrl/Cmd/Alt shortcuts, and keys typed into any text box or search box.
- If a letter on a chip opened the search, Escape puts focus back on that chip.

One gap is left for later and filed as SC-613 (Backlog): after clicking the window's title or an empty part of it, typing does nothing, because that click moves focus out of the window.

Branch is land-ready. No screenshots, because nothing visible changed until you type.

+++ Agent notes

* Plugin branch `sc580-conditions-type-to-search` @ `93e8e48c` on develop `622b0904`. Superproject branch @ `6d68df08` on main `02dbf30c`.
* Mechanism: keydown listener on the modal's own element (`src/views/ConditionsModal.ts`), registered through the modal lifecycle, so it is removed on close. Real Obsidian 1.14.4 delivers the keys to it.
* Gates at the branch head: tsc and lint clean. jest 10747 passed / 1 skipped (10746 / 2 on a fresh worktree; +31). Lifecycle 60/60. e2e `285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`. COND-N07 is no longer a known bug; COND-N08 through N11 are new. Shots 592, freeze 280/280, parity 0/0/24.
* Review: the r2 independent review returned LAND with 2 LOW findings. LOW-2 (the Escape focus) was fixed; LOW-1 became SC-613. 13/13 jest mutants were killed. The r4 scoped re-review returned LAND with two test gaps; both tests were added in r5, and each kills its mutant.
* Ledger: `.superpowers/sdd/sc580-conditions-type-to-search/`.

+++
