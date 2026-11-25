**Ask: is this the Remove a hero flow you want? A yes closes the ticket. I made two choices for you, listed under "My calls" below. Tell me if you want either one the other way.**

The montage tracker's menu now has **Remove a hero**, right after Add a hero. It opens a small window listing the heroes. Pick one, and the button changes to name them ("Remove Bram"). Press it and that hero's row is gone from the board and from the note.

{{IMG:sc690-B2-window-picked.png}}

*The window with Bram picked. The picked hero has a check mark, a bold name and a brighter border (teal), so it does not depend on colour. The line under the list says what will be deleted, and the button names the hero. Before a hero is picked the button reads "Remove" and is disabled.*

{{IMG:sc690-C-board-before-after.png}}

*Before (left) and after (right) removing Bram. His row is gone, the head reads "4 heroes", and the totals dropped by his one success and one failure (5 successes / 2 failures became 4 / 1).*

{{IMG:sc690-A-menu-panel-annotated.png}}

*The menu. Remove a hero is the person-with-a-minus icon, third from the left. The text labels were added to the screenshot; in Obsidian they are the hover tooltips.*

**My calls**

1. **Removing a hero also removes the actions logged for them, and the success and failure totals drop to match.** The alternative is to keep their successes and failures in the totals after they leave. I chose removal because an action with no row cannot be seen or corrected on the board, and Undo would then delete something invisible. If you want "the hero left mid-montage, their successes still count", tell me and I will add that as a choice in the window.

2. **It lives in the menu, not as a button on each hero's row.** A delete button on every row would sit beside the row's plus button, which is the most-clicked control on the board. If you would rather remove a hero from their own row, say so.

**Also true**

- There is no Undo after Remove. The window names what will be deleted before you press the button, and a notice confirms it afterwards ("Removed Bram from the montage").
- Success and failure limits do not change when a hero is removed. Limits by number of heroes is SC-691, which is next.
- Removing the last hero works; the board shows its usual "No heroes yet" message.
- The item is not shown on a read-only montage, or when the board has no heroes.

**Mechanics**

- Reviewed and ready to land; it is not on `develop` yet (landing is the next step and does not wait on your answer). It will be in the next rc you cut.
- An independent reviewer tried to break it in real Obsidian with 20 of its own notes: text around the block, a second montage block in the same note, hand-written oddities and hard-to-quote hero names all survive a removal. Its first pass found one blocker (a missing line in the e2e coverage list) and five smaller issues; all are fixed and re-checked.
- One thing from that review changed what you see: the button names the hero ("Remove Bram") instead of a bare "Remove".
- Keys you add to a montage block by hand are kept, but they are written after the montage's own keys. Every montage save already did this; removing a hero does not change it.
- Plugin branch `sc690-montage-remove-hero` @ `a0e55f6b` on `develop` @ `bb3a3d10`; workspace branch @ `80b0934c` (CHANGELOG only).
- Gates at `a0e55f6b`: tsc and lint clean · jest 14716 passed / 1 skipped (+41) · lifecycle 64/64 · e2e `833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs` (+23 tests, +10 pairs) · shots 592 · freeze 280/280 (no print bytes moved) · parity 0 / 0 / 24.
- Docs: `docs/gm-trackers.md` explains the new item; both changelogs have an Unreleased entry.
