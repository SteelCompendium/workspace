If you open the block edit form right after a click inside the card, the form now includes that click, and Save keeps it. For example, click Increase on a counter at 3 and open the pencil at once: the form reads `current_value: 4`, and Save leaves the note at 4. Before the fix the form read 3, and Save quietly put the note back to 3.

No ask. This is FYI, and the fix is ready to land.

**What was wrong.** A click inside a card waits about 400 ms before it writes the note, so that fast clicks become one write. The form read the note during that wait, before the click had been written. Now, opening the form first writes the waiting click, then reads the note. With nothing waiting, the form opens at once, as before.

**The sidebar had a second version of this.** A form opened from the sidebar panel read the block as it was when the panel was first built. So it could undo a click that had already been saved, or an edit made elsewhere in the note. It now reads the current block.

**Checked in real Obsidian**, in Reading view and the sidebar:
- counter: click, then pencil at once, then Save keeps the click
- the hero card's "Edit definition" (the waiting write lands before the form opens)
- two counters in one note, and two identical counters: neither touches the other
- a quick second pencil click opens one form, not two
- text above and below the block is unchanged
- SC-509's fix still holds: a form Save redraws the card

**Found along the way and filed** (both in Backlog, both older than this fix):
- SC-523: in Live Preview, the pencil can't be clicked with the mouse (the line above the card covers it). And a form opened while a click is still saving closes by itself. Nothing is lost there; the click is saved.
- SC-524: when a card's write fails on disk (for example, a read-only note), no message appears. The form then opens from content the note doesn't have.

---
Mechanics:
- dse branch `sc519-form-stale-open`: red tests `3b760b8`, fix `82aa704`, G-S45 `1e97599`, fix round `253aa5f`, on develop `c2758a2`. Superproject CHANGELOG `9797d3c` + `f0cd44b` on main `2bfd07d`.
- Fix: `ElementView.openAfterPendingWrite` in `src/framework/view.ts`, used by the pipeline pencil and ds-hero "Edit definition"; the sidebar body read goes through `SidebarBlockHost.currentBody()`. `FormModal.ts` is untouched.
- New lifecycle scenario G-S45: it holds the plugin's 400 ms timer at a hook (no timed race), checks the note is still old when the pencil is clicked, then saves. It fails on c2758a2 and passes on the fix.
- Battery on `253aa5f`: tsc and lint clean · jest 6074 passed / 1 skipped · lifecycle 38/38 · e2e 123/123 with coverage 87/87 · parity 0/0/24. Shots 592, 0 FAIL and freeze 280/280 on `1e97599`; the fix round changed no rendered code.
- Independent review: land-ready, 0 high findings. The medium finding (Live Preview) was already broken before this fix and is filed as SC-523. All 8 mutants were caught. A scoped re-review of the fix round found nothing above INFO: the new sidebar wait fails when it is broken, and G-S40/G-S45 passed 3 of 3 runs.
