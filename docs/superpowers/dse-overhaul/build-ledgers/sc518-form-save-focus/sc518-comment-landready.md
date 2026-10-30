After a block edit form Save, keyboard focus now goes back to the redrawn card's Edit pencil, with the focus ring, instead of jumping to the top of the page. This works in Reading view, the sidebar panel and Live Preview. No action needed from you; this is ready to land.

**What changed for a keyboard user**
- Tab to a card's pencil, press Enter, change a field, press Save: focus is on the new card's pencil, so the next Tab continues from the card. Before this fix (since SC-509), focus fell to the page body.
- The hero sheet's "Edit definition" button gets the same treatment: focus returns to it after Save.
- Cancel, Escape, and a Save that changes nothing behave as before (focus stays on the pencil).
- Two identical blocks of the same kind in one note: focus goes to the card you edited, not its twin. (Before, editing the upper twin left focus on the lower twin's pencil.)
- The page does not scroll when focus moves: on a tall note the card stays exactly where it was.

**Mouse users:** unchanged from before SC-509. A mouse Save leaves focus where it was and does not force the hover menu to stay open.

Authoring controls are still experimental. The note's text is untouched by this change; it only moves focus.

---

Mechanics:
- draw-steel-elements branch `sc518-form-save-focus`, HEAD `9be397e` on develop `71437da`; superproject CHANGELOG `adf89546` on main `ca6be094`.
- One mechanism, reusing the SC-505 focus hand-off (`src/framework/chrome/focusHandoff.ts`): Save arms a one-time, block-keyed focus request (only when the opener held focus, i.e. a keyboard open); the redrawn card claims it. Small changes in `FormModal.ts`, `pipeline.ts`, `elements/hero/view.ts`.
- New lifecycle scenario G-S50 (real Obsidian, real keyboard and mouse): Reading view, sidebar, Live Preview, Cancel, twins, mouse, tall-note scroll. It fails on the old build and passes on the fix.
- Independent review found one bug (twin focus) and three test gaps; all fixed, each new test proven to catch its mutation; the scoped re-review passed (real Obsidian probes for twins, mouse, the pending-click path, hero and tall-note scroll).
- Gates on HEAD: jest 6148 passed / 1 skipped · lifecycle 41/41 · e2e 124/124, 0 known-bug, 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24.
- Filed along the way: SC-529 (e2e CHR-L01 times out under heavy load).
