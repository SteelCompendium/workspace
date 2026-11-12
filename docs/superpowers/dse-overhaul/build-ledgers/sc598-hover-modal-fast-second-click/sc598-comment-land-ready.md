A quick second click inside a window opened from a hover preview no longer closes the window and the preview. The fix is ready to land. Nothing is needed from you.

What changes for you:

- Click the stamina bar's numbers in a preview, then click inside the Stamina window at once. The window and the preview both stay open. Before, both closed if the second click came within about 150 ms.
- Open the window again from the same preview, then click inside it at once. The preview no longer switches to the note's source text behind the window. Before, your next keys could edit the note's source. This bug was older than this ticket; the review found it.
- A quick double-click on the numbers still closes the window, because the second click lands on the dimmed background around it. The same happens in a note. The preview now stays open. Whether a double-click should keep the window open is a separate question, filed as SC-604 (Backlog).

The same fix covers every DSE window opened from a preview: the hero sheet's stamina bar, the initiative tracker's stamina controls, Montage cells and "Log an action…". All of these were checked in real Obsidian.

One case is left as it was. On a very slow machine, if both halves of the second click arrive while the window is still opening, both still close. This was measured only with the CPU slowed 4 to 8 times. Fixing it would need a private Obsidian API, so I left it out.

Also filed: SC-606 (Backlog). Editing a logged Montage action fails when the hero's entry has no skills list. This bug is older than SC-598 and is not caused by it.

---

Mechanics:

- dse branch `sc598-hover-modal-fast-second-click` @ `8b84b635` on develop `b5d18f79`: one change in `src/framework/kit/managedModal.ts`, public DOM only, no private Obsidian API.
  - When a window opens by a click from a preview that is not yet focused, DSE cancels the default of the opening click. It then sends Obsidian's preview one click of its own, so the preview counts as focused after 10 ms instead of 150.
  - For a preview that is already focused, it only cancels the default of the opening click.
- Superproject branch @ `5453d331` on main `f1176824`: CHANGELOG bullet only; the dse pointer is not bumped.
- Gates at `8b84b635`:
  - tsc and lint clean.
  - jest 7341 passed / 2 skipped.
  - lifecycle 57/57; the new scenario G-S91 is in part 5, which took 395 s.
  - e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`.
  - styles.css is byte-identical to develop, so shots (592), freeze (280/280) and parity (0/0/24) carry.
- G-S91 fails on develop in every trial and passes on the branch. Its trials: a second press on the title, on an input and on Apply; a double-click; Escape; and a re-open.
- Review: an independent review returned LAND with no critical or high findings. Its one medium finding is the re-open fix above. A scoped re-review of that fix returned LAND with no findings above INFO.
