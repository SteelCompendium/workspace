A Live Preview pane now keeps its place when a tracker in the note changes. That covers a change made from another pane, from a popout, by clicking in the pane itself, or by an outside edit (Sync, git, another plugin). This is ready to land, and nothing needs your decision.

**What was wrong.** When a tracker changed, Obsidian threw away its drawing of the block and put in a 50 px placeholder, so the editor's idea of the note's height collapsed. The pane then jumped, from 3032 px to the top in a second pane and from 2428 px to the top on an outside edit. The pane you clicked in jumped too. Notes without a Draw Steel block were never affected.

**What changed.**
- **Before Obsidian redraws:** the plugin records the line you are reading in every open Live Preview pane of that note, plus each tracker's height.
- **While the tracker redraws:** it is held at its old height.
- **After the redraw:** the pane goes back to the line you were reading. This happens in the same frame, so you never see the jump.
- **If you scroll in the meantime, your scroll wins.** The recorded spot follows your scroll; it never pulls you back.
- **Untouched:** the cursor, the selection, plain notes, and raw Source mode.
- **Cost:** about 1 ms per pane. The tracker is now drawn right away rather than when you scroll back to it. On a 25-hero tracker in the test harness that drawing takes up to about a second, which is the existing cost filed as SC-491.

**Known limits.**
- **Edits above the tracker:** say one outside edit changes both the tracker and text above it, such as the title. The pane then lands near the first changed line instead of exactly where you were. It still does better than before in every case measured. Filed as SC-496.
- **Text added at the tracker's first line:** if an edit adds text right where the tracker starts while you are reading inside the tracker, the view moves down by the height of that text (48 px in the test). The editor does the same in any note.

**Filed separately, not fixed here:**
- SC-496: an outside edit that changes a tracker and text above it lands you above your reading spot.
- SC-491: a large initiative tracker takes 0.5–1 s to draw.
- SC-479: trackers inside embedded notes, still not measured.
- SC-472 got another data point: a second pane's redraw arrived 2.47 s after the change.

---

Mechanics:
- dse `sc478-livepreview-scroll` @ `2c61511` on develop `907f55c`; superproject `a0b229c` on origin/main `8fafc7b` (CHANGELOG bullet)
- New `src/framework/host/livePreviewScrollHold.ts`, wired in `registerFrameworkElements.ts`
- New lifecycle check **G-S18**, with six phases:
  - another pane's write;
  - an outside `vault.process`;
  - a disk write picked up by Obsidian's file watcher;
  - the clicked pane itself;
  - a scroll before a late redraw;
  - an insert above the tracker plus a tracker change in one write.
- G-S18 results:
  - It fails on the old code (2/2) and passes on the fix (2/2).
  - Each of these four switched off makes it fail (2/2): the restore, the height hold, scroll-following, and the position matching.
- Gates: tsc and lint clean; jest 5797 passed / 1 skipped / 239 of 240; lifecycle 33/33 (on Obsidian 1.15.0); e2e 104/104 ok, 0 failed, 0 known-bug, coverage 69/69 pairs; shots 592, 0 FAIL (rc 0, host-copy pin 1.15.0, both host-leak checks, both text-scale checks); freeze 280/280 (no rebaseline); parity 0 GAPs / 0 undeclared / 24 DECLARED. Lifecycle and e2e were last run on `d152ea4`; the only later develop change (SC-497, the Obsidian 1.15.0 pin) does not touch either harness or the built plugin.
- Review:
  - The design round compared five approaches. Only "restore the line + hold the height" held in every case.
  - An independent review found 2 medium and 2 low problems. They were: scrolling during a slow second-pane redraw undid the fix; a combined insert-and-change lost the hold; a callout that took a deleted tracker's place was held; and three guards had no test. All four were fixed.
  - The re-review proved those fixes live, and found the SC-496 case. Its one small test gap was fixed in the rebase round.
