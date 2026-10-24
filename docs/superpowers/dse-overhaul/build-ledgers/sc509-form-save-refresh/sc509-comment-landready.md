The block edit form's Save now redraws the card right away. A montage saved from `title: The Heist` to `title: Other Job` reads "Other Job" as soon as Save closes the form, in Reading view and in the sidebar. You no longer have to leave the note and come back.

No ask. This is FYI, and the fix is ready to land.

**Before the fix** (develop at 7046eb0): the note file says `Other Job`, but the card still reads "THE HEIST".

{{IMG:sc509-r3-base-reading-montage.png}}

**After the fix:** the same note and the same Save, and the card reads "OTHER JOB". The "ABOVE line" and "BELOW line" text around the block is unchanged.

{{IMG:sc509-r3-head-reading-montage.png}}

**What was wrong.** The plugin keeps a card's existing view when it rewrites its own block, so clicking inside a card doesn't flash or rebuild it. That rule applied to every write, including the form's Save. So the old card, holding the old content, was kept. The sidebar had the same problem in a second place. The fix limits the rule to the card's own writes. A form Save now redraws the card the same way an edit from outside does.

**Checked in real Obsidian.** These all redraw after Save:
- montage, counter and stamina bar
- two counters in one note (the other counter is untouched)
- a block with `prefs:` and `collapsed: true` (both keys are kept)
- the hero card's "Edit definition"
- the sidebar panel

Clicks inside a card still don't rebuild it, scroll position holds, and Live Preview was never affected.

**Found along the way and filed** (both in Backlog, out of scope here):
- SC-518: after Save, keyboard focus lands on the page instead of going back to the pencil. This is a side effect of the card being redrawn. Before the fix, focus went back to the pencil.
- SC-519: if you open the form within about half a second of an in-card click, the form starts from the content before the click, so Save undoes the click. This is older than this fix.

---
Mechanics:
- dse branch `sc509-form-save-refresh`: red tests `211f483`, fix `ad163a4`, G-S40 `f1db21d` and its whole-note check `c2758a2`, on develop `a0365a4`. Superproject CHANGELOG `f04f28c` on main `86bdd53`.
- Files changed: `src/framework/host/{BlockHost,ReadingModeBlockHost,SidebarBlockHost,LivePreviewBlockHost}.ts` and `src/framework/view.ts`. `FormModal.ts` and `pipeline.ts` are untouched.
- New lifecycle scenario G-S40: it clicks the real pencil and Save, then reads the card. It fails on the old code and passes on the fix.
- Battery: tsc and lint clean · jest 6058 passed / 1 skipped · lifecycle 37/37 · e2e 123/123 with coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24
- Independent review: land-ready, 0 high and 0 medium findings. All 9 mutants were caught. A scoped re-review of the whole-note check found it catches a save that changes text outside the block.
