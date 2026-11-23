**Ask: is it right that turning on "Start collapsed" leaves blocks that are already open alone, and collapses them only the next time they are drawn? (Third image.) A "yes" and the fix can land.**

The fix is built, reviewed twice, and all tests pass. The three settings now reach blocks that are already on screen, without reopening the note. The screenshots below are from real Obsidian, taken with the fixed plugin.

**1. Collapsible by default.** Left: an open stamina bar with its Collapse button (the small up-arrow button above the top-right corner of the card). Right: after switching the setting off in the settings window, the button is gone and the block stays open. Same note, not reopened.

{{IMG:sc644-shot-collapsible.png}}

**2. Show edit button on rendered blocks** (visible with the experimental switch on). Top row: the stamina bar's menu panel without, then with, the Edit pencil. Bottom row: an open hero sheet with only the Respite button, then with an "Edit definition" button beside it. The hero sheet draws its own button, and review found it was also not updating; it now does.

{{IMG:sc644-shot-editbutton.png}}

**3. Start collapsed (the decision).** Left: the block is open. Middle: after switching "Start collapsed" on, the open block is unchanged. Right: after reopening the note, the block is drawn collapsed to its one-line "STAMINA (15/20)" bar.

{{IMG:sc644-shot-startcollapsed.png}}

If you would rather have open blocks collapse at once when you switch it on, say so; it is one switch in the code plus its tests.

Smaller behaviour, no decision needed:

- If a block is collapsed when you switch "Collapsible by default" off, it expands, because with no Collapse button there would be no way to open it.
- If the keyboard cursor is on a button that goes away (the Collapse button, the pencil, "Edit definition"), it moves to another control in the same block instead of being lost.

---

Mechanics: open blocks now subscribe to these settings (`src/framework/livePrefs.ts`, `watchPrefs`) and rebuild only their top bar, not the block body. SC-645 ("Edit Recoveries with a popover") can reuse the same mechanism. The two SC-440 known-bug e2e tests (`SET-L01`, `SET-G06`) are plain tests now, and `SET-L05` / `SET-L06` are new. The branch is being rebased onto today's latest develop (SC-628) for a final full test run before it is handed for landing.
