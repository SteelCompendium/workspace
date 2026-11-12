This bug can happen today: when the note is also open in a second pane, the edit form's Save wrote the identical twin counter, with no Notice, in 5 of 6 tries in real Obsidian 1.15.1. No ask; I'm fixing it.

**How it happens.** A note has two identical counters. You open the edit form (pencil) on one of them from an embed of part of the note, or from a hover preview of a block or heading link. The form must open just after that block was changed from outside, which leaves a window of about 40-110 ms. If the same note is open in another pane, the redraw no longer closes the form. A later Save then writes the other counter.

Without the second pane the form closes 49-98 ms after it opens and nothing is written. The ticket title's "not reachable today" was measured without that pane.

**The fix.** The edit form will find its block the same way the + / - buttons do since SC-594. It uses the link the embed or preview was opened for, checked against the note's text, or else the card's own last write. If neither places the block, Save writes nothing and shows the existing "the block changed on disk first" Notice. The form stays open. Your SC-556 ruling: "Save nothing with a notice is fine."

**What changes for you.** One rare shape that saves today will refuse. That shape is an embed of `#Tracker` from a note that has two `## Tracker` headings holding identical counters. The link names two places, so Save can't tell which one is meant. The + / - buttons already refuse that shape. Hover previews of a block or heading link with an identical counter elsewhere will now save into the hovered counter (today they refuse).

<details><summary>Mechanics</summary>

- r1 jest sweep, 2880 form-Save cells at dse develop da2bdbc6. Today 392 cells write the twin. Under the proposed rule none do: 392 twin cells become refused, 36 refused cells save, and 12 saving cells refuse.
- The probe build wrote nothing in all 13 real-Obsidian cells. The 6 cells with a second pane showed one Notice each and kept the form open.
- Next: implementation, then an independent review. New lifecycle scenario G-S96 runs the second-pane cells. It must show the twin write on the current code first.
- Not covered: SC-607. A still-open preview follows what its link names now; the forms will share that limit.

</details>
