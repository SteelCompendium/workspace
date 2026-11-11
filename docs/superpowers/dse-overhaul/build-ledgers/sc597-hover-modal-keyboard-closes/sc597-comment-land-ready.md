Pressing Enter or Space on a Stamina bar or a Montage cell inside a hover preview now opens a window that stays open. Before, the window and the preview vanished about a third of a second later. Ready to land. Nothing is needed from you.

**What changed for the user**

- The keyboard path now does what a mouse click does. The window stays open with the preview behind it. Clicks inside it keep it open, Escape closes only the window, and Apply saves (Healing 3 took a note from 15 to 18 Stamina in the test).
- After the window closes, the preview stays until you click outside it. That is how a preview you have clicked into already behaves.
- Outside hover previews nothing visible changes, with one exception. On a Montage cell, Ctrl, Cmd or Alt with Enter no longer opens the window. That matches the Stamina bar.

**How**

Enter and Space on these two openers now send a click to the same element the mouse clicks. Obsidian keeps a preview open only after a click goes through it, and a key press alone never counted. Only two openers had this problem: the Stamina bar (on its own and on the hero sheet) and the Montage board cell. Every other DSE opener is a real button, and a button already turns Enter into a click.

Two other fixes were tried in real Obsidian and rejected:

- Sending the click from the window code itself turned the preview into a text editor.
- Obsidian's private "focused" switch left the preview stuck open after the window closed.

**Checks**

- dse `e5b6f9f2` on develop `79da77f8`. Superproject branch `f205df8a` changes only CHANGELOG.
- jest 7283 passed, 2 skipped.
- Lifecycle 56/56. That includes the new scenario G-S87: a real mouse hover, then Enter or Space in Reading view and Live Preview. It fails on the old code in all 4 trials.
- e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`.
- `styles.css` is byte-identical, so the screenshot, freeze and parity results carry over.
- An independent review found no code fix needed: 0 critical, 0 high. One process item (the rebase) and two wording fixes were folded in.

Follow-ups filed: SC-601. It covers a suspected, not yet reproduced case: a Compendium search opened while a hover preview is being edited.
