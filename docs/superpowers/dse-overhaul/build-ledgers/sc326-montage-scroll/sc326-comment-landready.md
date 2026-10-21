**One question for you: when you scroll a long montage sideways, should the hero-name column stay pinned on the left?** Today it scrolls away with the rounds. Reply yes and I'll file it as its own ticket; reply no and nothing changes. This doesn't block landing.

**The fix is ready to land: a montage with many rounds now scrolls sideways inside its board, so every round and the Tally column can be reached.** Before, the right-hand rounds and the Tally were cut off with no way to reach them. This was worst on touch screens, where it started at 5 rounds.

Before (12-round montage, touch-sized controls, 900px pane). The board ends at round 4. Rounds 5–12, including round 12 that is in play, and the Tally cannot be reached:

{{IMG:sc326-rv2-scott-before.png}}

After, the same montage scrolled all the way right. Rounds 9–12 and the Tally are visible. The thin bar under the round 12 column, on the board's bottom edge, is the scrollbar:

{{IMG:sc326-rv2-scott-after-right.png}}

What else changed, all inside the montage:

- **The board keeps its place when you act.** Before, logging a result, saving a sheet or ending a round in a far column snapped the board back to round 1. Now it stays where you were. If you were at the far end, it moves to the new far end so an added round shows up.
- **Tab never lands on a hidden cell.** Tabbing to a control in a partly hidden column scrolls the board until the whole cell is visible.
- **The Tally column keeps its full width when the board scrolls.** Before, the "× n" chip touched or slightly crossed the board's right border.
- **Nothing changes for a montage that already fits.** All 572 screenshots match the base byte-for-byte.

Out of scope, filed separately: **SC-467**. Other scrolling areas inside a DSE block still jump back to the start after a write; the fix here covers the montage board only.

---

Mechanics:

- dse branch `sc326-montage-scroll` @ `0ce76dd`, on develop `aaa88b7`. Superproject branch @ `58a1df5` (workspace CHANGELOG bullet only), on main `e0d3f47`. Changes are in `styles-source.css` (board `overflow-x: auto; overflow-y: hidden`), `BoardView.ts` (Tally track `minmax(max-content, auto)`, focus keeps the cell in view) and `view.ts` (scroll position kept across the rebuild and the host's adoption move).
- New gates:
  - The shots-run check `montage board scroll OK` uses a real 14-round montage, fine and coarse pointer. It checks that every cell is reachable, that cell content stays inside its cell, and that every Tab stop is fully visible.
  - Lifecycle scenario **G-S13**: two 20-round boards in real Obsidian, one at a middle scroll position and one at the far end, both held across taps and End round.
  - Every new check was shown to fail on the pre-fix code.
- Battery at `0ce76dd`: tsc/lint clean · jest 5408 passed / 1 skipped / 231 of 232 suites · lifecycle **29/29** (was 28) · e2e 88/92 ok, 0 failed, 4 known-bug, 64/64 pairs · shots 572, 0 FAIL · freeze 276/276 byte-identical · parity 0/0/24.
- Pipeline: implementer, then an independent review. The review found 2 MED and 4 LOW. Both MEDs were fixed and 3 of the LOWs; one LOW was dropped (a desktop scrollbar for 1px of overflow, only at pane widths from 488.5 to 490px). A scoped re-review then returned land-ready. Its one leftover, a stale count in a code comment, was fixed in the final round.
