A mouse click inside an edit form opened from a hover preview no longer closes the form, and what you typed is kept. The same fix covers every other Draw Steel window opened from a preview. Nothing for you to decide; this is ready to land.

**What you'll see**

- Hover a link to a note with a counter, press the pencil, and click anywhere in the form: the form and the preview both stay open. Type, click Save, and the counter changes.
- Esc now closes a form opened from a preview. Before, Esc did nothing. In Live Preview it also moved the cursor into the note behind the form.
- After Save, Cancel or Esc, the preview stays on screen until you click outside it. Obsidian already does this for any preview you have clicked into.
- The same holds for the other windows a preview can open: the Stamina window and its free-heal confirmation, the Conditions windows (initiative tracker and conditions panel), the minion stamina pool, Reset encounter, the Montage windows, and the hero sheet's windows.

**Why it happened**

Obsidian closes a hover preview when you click anywhere outside it. The form is drawn outside the preview, so your first click counted as "outside". The preview closed, and the form closed with it, because a form only stays open while its note is on screen (SC-552). Draw Steel windows opened from a preview now keep their own clicks from reaching the preview. Nothing about how Save writes to the note changed.

**Found and fixed along the way**

Review found two gaps in the first version, and a missing test in a later one. None ever reached develop.

- A button that redraws its own window, such as "Add condition", still closed the window.
- The click that closes a window still closed the preview. On the free-heal confirmation, it also closed the Stamina window behind it, and the staged heal was lost.
- Esc in a window opened by clicking on text (the Stamina numbers) had no test. It now has one in jest and one in real Obsidian.

**The other way it could work**

The preview could close and leave the form open on its own. I did not do this: it fixes only the edit form, not the other windows, and you lose the preview you were reading. Say so if you'd prefer it.

**New Backlog tickets**

Neither is covered by this fix. Both likely need the same change: telling Obsidian the preview is in use when a window opens from it.

- **SC-597 (Low):** a window opened from a preview with the keyboard alone (Enter or Space on a Stamina bar) closes by itself about a third of a second later.
- **SC-598 (Low):** a second click within about 150 ms of opening a window from a preview (a fast double-click on the Stamina numbers) closes the window and the preview. Nothing typed can be lost; the window has only just opened.

---

Mechanics: dse branch `sc595-hover-form-click-closes` @ `94133a5a` on develop `ec26b709`; superproject `f18a69e8`. `DseModal` (`src/framework/kit/managedModal.ts`) gets an anchor from every opener; when the anchor sits in `.hover-popover`, the modal stops its own `click` at its document in the bubble phase (`composedPath()`, `stopPropagation`, never `preventDefault`; removed one task after close) and re-pushes its keymap scope after Obsidian's click-to-edit helper (10 ms and 150 ms, armed from the opening click). New lifecycle scenario G-S83 (real CDP mouse, Reading view and Live Preview; red on the old code).
Gates: tsc and lint clean · jest 7238 passed / 2 skipped (fresh worktree; develop 7206 + 32 new) · lifecycle 55/55 · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · styles.css byte-identical to develop, so shots 592 / freeze 280/280 / parity 0/0/24 carry · 19 deliberate breaks of the fix each fail a test (one equivalent break excluded; one caught only by G-S83).
