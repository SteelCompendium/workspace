A Reading-view note no longer jumps to the top when a tracker in a note it embeds changes. Nothing is needed from you; this is ready to land.

**What was happening.** Note A embeds note B (`![[B]]`), and B has a tracker. When B changed (from Sync, another pane, or a click inside the embed), A jumped from where you were reading to its title. It reproduced in real Obsidian 1.15.0, but only when A is mostly the embed and you are scrolled near its end: scrollTop 2887 -> 0, and 3574 -> 0 when the write came from a second pane. Long notes with text around the embed held still in every case measured.

Before the write (bottom of the embedded tracker, "C-BOTTOM" under it) and after it (back at A's title):

{{IMG:sc479-r1-shot-7046eb0-process-end-C-before.png}}

{{IMG:sc479-r1-shot-7046eb0-process-end-C-after.png}}

**Why the ticket's suggested fix was not enough.** A's own page height never changed. The embed shrank for an instant (3190 -> 135 px) and came back before anything was drawn. In that instant the browser's scroll anchoring, which follows a line inside the embed, moved A to the top. Holding A's page height alone still jumped. The fix holds A's page height and, for about 2.5 s, tells the browser not to follow a line inside the embed. It only does that when the embedded tracker is on screen or you are reading outside the embed. When you are reading other text inside the embed, the browser's own anchoring already keeps that text still, so the fix leaves it alone.

**What changed.**
- Any write to a note now also holds every open Reading view that shows a tracker embedded from that note, including nested embeds and `![[B#heading]]`.
- A click inside an embed now holds the page you are scrolling, not the embed's own inner view.
- Adding or removing a hero in the embed while you read below it, or inside the embed under the tracker, no longer moves the text on screen.
- New lifecycle check **G-S42** (six phases): it fails on the old code, passes with the fix, and fails again with each of four deliberately broken versions of the fix.

**Not covered — filed separately.**
- SC-522: the same jump in a **Live Preview** note that embeds a tracker (6800 -> 3745). It happens with or without this fix.
- SC-531: a one-off start-up failure in the lifecycle test harness, seen during review (harness code, not the plugin).

---
Mechanics:
- dse `sc479-embed-scroll-pin` @ `71437da` on develop `ed368f6`; superproject @ `e30728a` on origin/main `d8a109f` (CHANGELOG bullet).
- Code: `src/framework/host/previewScrollPin.ts` (host pins from the `modify` listener, outermost scroller for the writer pin, per-pin `.internal-embed { overflow-anchor: none }` rule behind a pin-time geometry gate), `registerFrameworkElements.ts`, jest, lifecycle G-S42 (phases a-f).
- Gates on 71437da: tsc/lint clean · jest 6127 passed / 1 skipped / 247 of 248 · lifecycle 40/40 · e2e 124/124, 0 failed, 0 known-bug, 87/87 pairs · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24 · `styles.css` byte-identical to develop.
- G-S42, 2 runs each: fix ok; old code FAIL; hold without the anchoring rule FAIL; no host hold FAIL; anchoring off on the whole page FAIL (e); no on-screen check FAIL (f). G-S8 / G-S15 / G-S18 ok in every run.
- Review: independent review found one HIGH (anchoring off on the whole page moved text 110 px when a hero was added while you read below the embed) and, on re-review, one MEDIUM (the embed-wide rule moved text 110 px for a reader inside the embed). Both fixed and re-measured at 0 px; final re-review APPROVE with no findings. 24/24 code-guard mutations caught by jest.
