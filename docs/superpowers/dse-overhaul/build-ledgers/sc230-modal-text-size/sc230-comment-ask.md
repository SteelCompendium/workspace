**Ask: two quick checks. (1) Does the fixed dialog look right at a larger text size? (2) Should the dialog's title grow with the text, or stay at Obsidian's size?** I shipped "title grows" as the default; say "keep title small" if you'd rather it didn't.

**The fix:** DSE's pop-up dialogs (conditions editor, forms, and the rest) now follow the *Text size* setting the same way blocks in your notes do. Before, bumping text size to 140% enlarged your blocks but left every dialog at 100%. Card zoom already worked in dialogs; now both settings behave the same.

**Before and after, at 140% text size (real Obsidian 1.14.2, conditions dialog):**

{{IMG:sc230-ask-before-after-140.png}}

Left (before): the list, buttons and "Done" are at 100% size even though text size is set to 140%. Right (after): everything inside the dialog is 1.4 times larger, the same ratio as blocks in a note.

**The title question (both at 140%):**

{{IMG:sc230-ask-title-options.png}}

Left, option B: the "CONDITIONS" title stays at Obsidian's normal size, so it ends up smaller than the row text under it. Right, option A (what the branch does now): the title grows by the same 1.4 times, so it stays the largest text in the dialog.

At the default 100% text size nothing changes. The after dialog is pixel-identical to today's, and all 260 frozen print screenshots are unchanged.

---

Mechanics (for reference):

- Repo: draw-steel-elements, branch `sc230-modal-text-size`, head `0dbab59`, rebased on develop `c524fd2`.
- Root cause: the text-size rule in `styles-source.css` only targeted rendered blocks, never `.dse-modal`. Also, Obsidian's own stylesheet resets the font size of a dialog's content area, so the scale has to be applied to the dialog's body and footer directly.
- Review: an independent reviewer found a double-scaling risk (1.96 times instead of 1.4 if a theme drops Obsidian's reset) and a print-exclusion guard in the wrong place. Both are fixed, pinned by tests, and re-verified by a second review. A pre-existing accessibility gap it noticed is filed as SC-355. The title is scaled through a new `.dse-modal__title-text` span.
- Gates: tsc and lint clean; jest 3990 passed (7 new), 0 failed; shots 524, 0 FAIL; freeze 260/260; parity 0 gaps / 0 undeclared / 16 declared.
- CHANGELOG `[FIX]` entry, plus the Text size help text and `docs/settings.md` now mention dialogs.
