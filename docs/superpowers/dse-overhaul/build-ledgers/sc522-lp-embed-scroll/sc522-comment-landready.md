A Live Preview note that embeds a tracker note no longer jumps when that tracker changes or is clicked. The fix is reviewed and ready to land; nothing needs your decision.

**One visible behaviour change:** in Live Preview, a click on a tracker inside an embed no longer selects the embed. The cursor does not jump into the embed line and the embed does not get its selection outline. Before, that same click scrolled the note by about 1500 px. A click on embed text outside the tracker, and the embed's open-link icon, still work as before.

**What was wrong** (Obsidian 1.15.0, measured on develop before the fix):

- When the embedded note changes, Obsidian empties the embed for a moment (3190 px down to 135 px) and redraws it. The note gets shorter for that moment, and the browser cuts the scroll position to fit. A note parked at its end went from 6800 to 3745 and showed the top of the embed instead of the end of the note. A note that is mostly the embed went back to the top.
- A click on a control in the embedded tracker made Obsidian select the embed and scroll to it: the text on screen moved 1528 px.

**Before the fix** (develop): the note is parked at its end, so the bottom of the embedded tracker and the note's last lines ("S-BOTTOM", "A-END 1-3") are on screen. Then the embedded tracker's note is written.

{{IMG:sc522-r1-shot-stock-process-end-E-before.png}}

After the write the page has jumped up: the screen shows the filler lines above the embed and the top of the tracker ("Hero 01").

{{IMG:sc522-r1-shot-stock-process-end-E-after.png}}

**With the fix:** the same write; the page does not move — the last lines ("S-BOTTOM", "A-END 1-3") are still on screen.

{{IMG:sc522-r1-shot-proto-process-end-E-after.png}}

(The screenshots are from the first measurement round, on an earlier develop. The same case was measured again on the final code: the note held at 6800 where develop drops to 3745.)

**How it is fixed:**

- From the moment the embedded note changes, the plugin holds the embed at its height until our tracker has redrawn inside it, then lets go. If the write really made the embed shorter (a deleted tracker or paragraph), it lets go as soon as Obsidian has redrawn, so the page settles exactly where it would have settled before, with no blank gap. A 2.5 s timer is only a backstop.
- The tracker inside a Live Preview embed is marked so Obsidian's embed click handling skips it.

**Known limit:** when a write grows or shrinks the embed above where you are reading, the text can be off by about 110 px for one frame before it settles back to 0. Before the fix the same write left it 69 px off for good.

**Filed along the way:** SC-533 (a tracker draw spent about half a second reading border widths; already fixed and landed) and SC-538 in Backlog (an embedded tracker can show an old version and refuse clicks after its note changes; happens on develop too, not caused by this fix).

---

Mechanics:

- dse branch `sc522-lp-embed-scroll` @ `ad018cd` on develop `fb24f8a`; superproject @ `974b567` on origin/main `3ccab07` (CHANGELOG bullet; dse pointer left for landing).
- Gates: tsc and lint clean · jest 6245 passed / 1 skipped / 249 of 250 · lifecycle 45/45 (three parts) · e2e 124/124 ok, 0 failed, 0 known-bug, 87/87 pairs · shots 592, 0 FAIL, button host-leak 157/942 · freeze 280/280 (no rebaseline; styles.css unchanged) · parity 0/0/24.
- New lifecycle scenario G-S52, phases (a)-(f): a write from the app, from disk and from a second pane with the note parked at its end; a hero added with the note parked below the embed; a real click in the embedded tracker; one of two trackers deleted (the hold lets go within frames). It fails every phase on develop; each control fails only its own phases.
- Reviews: independent review approved (0 high / 0 medium); its two low findings were fixed and re-reviewed: the re-review approved with no findings above information level. Rebases onto SC-481, SC-533 and SC-536 changed no SC-522 source line; every measurement was repeated on the final base and matched.
