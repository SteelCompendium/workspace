If you click a block and then delete it, and an identical block is still in the note, the click will now be dropped with the usual "not saved" Notice. Today it is written into the other block. I'm building that now. No action needed unless you want a different rule.

**What I measured** (real Obsidian, dse `develop` f69b8fd6, Reading view and Live Preview, identical block above and below, 2 and 3 identical blocks):

- **Race case** (click, edit the note so the block moves, leave the note): **already fixed.** All 40 trials landed in the clicked block. SC-552's per-click position pin is what fixed it.
- **Deleted-block case** (delete the clicked block before its save is written): **still broken.** The +1 went into the surviving identical block with no Notice in every trial (64 of 64). With no identical block, the Notice shows and the file is untouched (20 of 20), which is correct.

**Why I decided instead of asking:** the ticket asks "when more than one block matches, should DSE refuse the save and show the notice?" You answered the same question for edit forms on SC-556: "Save nothing with a notice is fine." The fix makes a deletion next to an identical block behave the same as a deletion with no identical block.

**The rule:** after the clicked block's position is lost, the save can still fall back to finding the block by its contents. It may do that only if no other block has the same contents, checked both in the note as it was at the click and in the note now. Otherwise nothing is written and the existing Notice shows: "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first."

**Its one measured cost:** a note that has an identical block and gets more than 400 lines changed both above and below the clicked block within 0.4 s of the click. That click is refused with a Notice; today it saves. Nothing is ever written to the wrong block. Notes without identical blocks behave exactly as today in every probe: a long note, a heading embed, a callout, an unclosed block at the end of the note, Windows line endings, and a block that moved.

Next: implementation, a new real-Obsidian test (G-S73), and an independent review. Then I'll report it ready to land.
