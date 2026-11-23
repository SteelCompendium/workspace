**"Start collapsed" stays as you chose: switching it on leaves blocks that are already open alone, and they are drawn collapsed the next time the note is opened. The fix is ready to land; nothing more is needed from you.**

What you get once it lands:

- **Collapsible by default**: switching it off removes the Collapse button from blocks already on screen; switching it on brings the button back. No need to reopen the note.
- **Show edit button on rendered blocks** (experimental switch on): the Edit pencil, and the hero sheet's "Edit definition" button, appear on or disappear from open blocks at once.
- **Start collapsed**: no change to open blocks, as above.
- Blocks pinned in the sidebar follow the first two settings the same way.

Since the screenshots in the previous comment, the code that runs has not changed. The branch was moved onto today's develop (it had fallen about 100 commits behind while it waited) and tested again.

One related thing the last review noticed is already on the backlog as SC-665, and is not part of this fix: a block pinned in the sidebar does not notice when you hand-edit its `collapsed:` line in the note.

---

Mechanics:

- Plugin branch `sc644-settings-reach-open-blocks` at `fefd9029` on develop `bdf0255e`; workspace branch at `a8f93953` on main `565a35c1` (changelog bullet + one pointer bump).
- Tests on that head: jest 13903 passed / 1 skipped; lifecycle 64/64; e2e `664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`; tsc and lint clean. The built `styles.css` is byte-identical to develop, so the screenshot, freeze and parity checks carry over from develop unchanged (592 shots, freeze 280/280, parity 0 / 0 / 24); the last full run of them on this branch, one base earlier, read the same.
- The two SC-440 known-bug e2e markers that cited this ticket (`SET-L01`, `SET-G06`) are plain passing tests now; `SET-L05` and `SET-L06` are new.
- Review: an independent reviewer re-checked the move onto the new develop (verdict: land, no findings), including pinned sidebar cards, blocks with hand-written `prefs:` / `collapsed:` lines, and keyboard focus while a window is open over the block.
- The code comment above the Start-collapsed switch (`START_COLLAPSED_REACHES_OPEN_BLOCKS` in `src/framework/pipeline.ts`) now records your decision and says the other behaviour is untested.
