Fixed: after Reset encounter → Yes, the tracker now shows every enemy group's creatures and every hero at full Stamina, with no Dying chip. Nothing needed from you; this goes to landing.

{{IMG:prb576-01-after-reset.png}}

The screenshot is real Obsidian right after Reset → Yes on the fix. Alice Alpha reads 30 / 30 and Bruno Beta 40 / 40, with no Dying chip. Ogres shows its three creature cells at 60/60 with the detail row. Troll Boss shows 100 / 100. The round is back to 1 and Malice to 0.

What changed: after Reset writes the note, the tracker rebuilds from the note it just wrote, the same way a reload would. Before, it rebuilt from a half-cleared copy in memory. The bytes Reset writes to the note are unchanged.

This also closes a quieter bug. Before the fix, damaging a 30-Stamina hero by 5 right after Reset wrote `current_stamina: -5` into the note instead of 25.

If the tracker can't rebuild after Reset (for example, a creature's statblock note was renamed while the tracker was open), it now shows the same error card a reload would, not the empty-groups screen. Once the statblock is back and the note changes, the tracker returns, in the note and in a pinned sidebar.

Not in this fix: a minion squad's action pips staying pressed after Reset is SC-575.

---

Mechanics: draw-steel-elements branch `sc576-reset-encounter-display` @ `fbaba3da` on develop `97a9c93b`.
Gates: tsc/lint clean · jest 7056 passed / 1 skipped · lifecycle 52/52 · e2e `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` · shots 592, host-leak 163/978, capture clip 147 · freeze 280/280 · parity 0/0/24.
Markers: the jsdom `[X05]` and the e2e `[INIT-X05]` / `[INIT-X06]` SC-576 markers are now plain tests (e2e known-bug 11 → 9). Independent review: LAND; its two medium and two low findings were fixed, then one more medium from the re-review (a pinned sidebar tracker stayed on the error card), fixed and re-reviewed. Final review: LAND, no findings above info.
