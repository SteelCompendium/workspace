A click on a block that is then deleted is no longer saved into an identical block. It is dropped with the usual "not saved" Notice, the same as when no identical block exists. This is ready to land; nothing is needed from you.

**What changed for a user.** A user clicks + or − on a block, and within 0.4 s, before the click is saved, an outside edit (Sync, another pane, another editor) deletes that block. Until now, if another block in the note read exactly the same, the click was written into that other block with no warning. Now nothing is written, the outside edit is kept, and this Notice shows: "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first."

The same refusal covers two neighbours of that case that the review found:

- One outside edit deletes the clicked block and changes another block so it reads like the clicked one.
- One outside edit copies the clicked block, so the note now holds two of it.

**What did not change.**

- Notes with no identical block save as before, including when the clicked block moves, is swapped with another block, or the blocks are reordered.
- The race in the original ticket (click, edit so the block moves, leave the note) was already fixed by SC-552 and still lands in the clicked block.
- Edit forms keep your SC-556 rule: their Save never writes into another block.

**Refusals and limits.** All are listed in the CHANGELOG. None writes to a wrong block.

- A click is refused (Notice) when, at that same moment, an identical block exists and the clicked block was cut and pasted elsewhere, or hundreds of lines changed around it.
- A click is also refused when one outside edit deleted another block and moved the clicked block into its place. That leaves exactly the same text as the "neighbour made identical" case, so DSE cannot tell them apart.
- After a refusal whose block is still in the note, the card keeps showing the click. The next click on that card saves it together with the new one, and leaving the note first drops it. I chose this over rebuilding the card. Your SC-556 forms work the same way: a refused Save leaves the form open with your value.
- Two identical blocks separated only by blank lines: deleting the upper one still saves into the one left. The note text is the same whichever one was deleted. This limit was already accepted on SC-556.

---

**Mechanics**

- Code: `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts`. When a card write's position pin misses, its fallback is allowed only if the block's contents are unique in the note as clicked and in the note now (`countByBody`), and only if the fallback block is not a different block from the click-time note that has since vanished (`landsOnOtherBlock`). Unpinned card writes (none seen in 1,041 recorded writes) keep today's path.
- Branch: dse `eeed5182` on `develop` `fbaba3da`; superproject `3b280a4c` (CHANGELOG only).
- New real-Obsidian test G-S73 (18 trials, lifecycle part 5). It fails on the old code.
- Gates on `eeed5182`:
  - tsc and lint: clean.
  - jest: 7076 non-skipped pass, +20 over `fbaba3da`. The SC-568 load timeouts pass when run alone.
  - lifecycle: 53/53.
  - e2e: `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`.
  - styles.css: identical to a clean `fbaba3da` build, so shots, freeze and parity carry.
- Review: an independent reviewer did three rounds and returned LAND.
  - It probed 30+ note shapes in Reading view and Live Preview.
  - Round 1 found the "neighbour made identical" gap; round 2 found that the first fix refused swaps and reorders in notes with no identical block. Both are fixed.
  - Every mutant it wrote against the final guard fails a test.
