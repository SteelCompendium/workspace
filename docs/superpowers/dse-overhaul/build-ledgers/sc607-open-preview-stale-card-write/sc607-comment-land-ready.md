A + / - or an Edit form Save in a hover preview or embed that stayed open while the note changed no longer goes into a different, identical counter. It is saved into the counter the preview shows, or refused with the "changed on disk first" Notice and nothing written. Ready to land; no decision needed from you.

**What changed for a user**
- The two shapes in this ticket are fixed: the first of two identical `## Tracker` sections deleted while its preview is open, and two heading names swapped while a preview is open. Both used to write the other counter with no message. Both are now refused with the Notice.
- The same holds for an embed of part of a note (`![[note#Tracker]]`) and for the Edit form opened from a preview or embed.
- Nothing changes for a note open in its own pane, or for a preview or embed of a whole note.

**New refusals you may notice (all safe: a Notice, nothing written)**
- A section moved to another place in the note (for example by Sync, or by dragging it in the outline) while its preview or embed stays open. Every click on that preview is refused until you reopen it. Before, the click was saved correctly. I accepted this under your 2026-11-10 ruling ("Save nothing with a notice is fine."). The only narrower rule we found would let three other shapes write a different counter again.
- An identical block added or deleted right next to the block you are editing.
- A change of more than 400 lines around the block while an identical counter exists elsewhere in the note.
- An outside edit within about a tenth of a second of opening a hover preview: that preview refuses until reopened.

**Still possible, as before this fix (not made worse)**
- Rare timing races: an outside change landing within a few hundredths of a second of Obsidian drawing or redrawing a preview or embed.

**Filed along the way (Backlog)**
- SC-612: the same wrong-counter problem in a note open in its own pane, when the upper of two identical blocks is deleted from outside.
- SC-616: the lifecycle check G-S91 sometimes fails, also on unchanged develop.
- SC-619: in a note with Windows line endings, a + in a hover preview is refused when an identical counter sits elsewhere.

+++ Agent notes

- dse branch `sc607-open-preview-stale-card-write` at c329ff35 on develop dcc53f0f; superproject branch at 807cec69 on main f108e5e9 (CHANGELOG only; one pointer bump at landing).
- Rule: a pin of PART of a note (hover or embed; card write and form) is placed through the link on the note now, and accepted only when the block the card was drawn from (a note snapshot taken at mount, or this host's own last write, the newer first) maps to that same line by BOTH a head-first and a tail-first line map. Such pins are checked the same strict way at write time. When the map gives up (more than 400 edits), the link places it only if the body is unique in both texts. In a hover preview, the mount snapshot must also equal Obsidian's drawn text (`hoverPopover.embed.data`) while that still holds the part.
- Gates on c329ff35: tsc and lint clean · jest 11596 passed / 1 skipped (warm; base 10787 + 808 new) · lifecycle 61/61 in six parts (21/16/9/4/7/4; part 6 `G-S92 G-S96 G-S97 G-S99` 298-310 s) · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · styles.css byte-identical to a clean dcc53f0f build, so shots 592 / freeze 280/280 / parity carry.
- Red on base: the new jest tests fail on the base host code; lifecycle G-S99 (8 cells in Obsidian 1.15.1, part 6) is red on a base bundle in every non-control cell.
- Reviews: r1 design (Opus), r2 implementation (Sonnet), r3 independent review (Opus; FIX, docs + tests only), r4 fixes, r5 scoped re-review (LAND). Mutants: 41 run, 32 killed, 9 equivalent or defence in depth.
- Ledger and reports: `.superpowers/sdd/sc607-open-preview-stale-card-write/` (machine-local; preserved to `docs/superpowers/dse-overhaul/build-ledgers/` at landing). dse-verify SKILL text proposal: `sc607-dse-verify-proposal.md` there.

+++
