A Reading view now keeps its scroll position when a tracker in it changes from another pane, a popout, or an outside edit (Sync, git, another plugin). This is ready to land; nothing needs your decision.

**What was wrong.** The SC-198 scroll pin only held the pane you clicked in. A second pane on the same note jumped from 3020 px to the top on every click, and an edit arriving from Sync threw the open note from 2416 px to the top.

**What changed.**
- The plugin now listens for every change to a note. Before Obsidian redraws, it pins every open Reading view of that note that shows a Draw Steel block. Measured: the change always arrives before the redraw (42 of 42 observations), including for disk writes picked up by Obsidian's file watcher.
- Holding the scroll position is much cheaper. Setting and releasing it used to cost about 200 ms of frozen screen per pane on a big tracker note; it now costs about 2 ms. This also makes the clicked pane itself stutter less.
- The hold now only ever raises the page height. It follows the height Obsidian wants, so text added while it is held stays reachable. An embedded note in the page is no longer stretched while the hold is on.
- Notes without a Draw Steel block, Live Preview panes, and panes scrolled to the top are left alone.

**Known limit.** For up to 2.5 seconds after a change, there can be extra empty space below the end of the note. It is up to about 1,300 px, because the hold follows Obsidian's own height estimate while it redraws. You only see it if you are scrolled to the very bottom, and it disappears on its own. Empty space for up to 2.5 seconds has been the accepted limit since SC-198; the hold never makes the page jump.

**Filed separately, not fixed here:**
- SC-478: Live Preview panes jump the same way. That is a different scroller and needs its own fix.
- SC-479: a tracker inside an embedded note may still jump the page that embeds it. Not reproduced yet.
- SC-472 got new data: the 2.5-second hold can run out before a slow redraw.

---

Mechanics:
- dse `sc470-scroll-pin-panes` @ `1c271b5` on develop `0ce76dd`
- New lifecycle check **G-S15**, with three parts: second pane, external edit, file-watcher disk write.
  - It fails on the old code (2/2) and passes on the fix (2/2).
  - With the hold's style rule switched off, both G-S8 and G-S15 fail (2/2).
- Gates: tsc and lint clean; jest 5428 passed / 1 skipped; lifecycle 30/30; e2e 88/92 ok, 0 failed, 4 known-bug, coverage 64/64 pairs; shots 572, 0 FAIL; freeze 276/276 (no rebaseline); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Review: an independent review found an embed-stretch bug, a height cap, and a popout leak, and all three were fixed. The re-review approved it with no new findings.
