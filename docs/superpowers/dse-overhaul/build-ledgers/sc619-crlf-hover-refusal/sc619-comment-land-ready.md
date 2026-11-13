The fix is ready to land. In a note saved with Windows line endings, a + / - or an Edit form Save in a hover preview of a heading is saved into the hovered counter again. No decision is needed from you.

**What was wrong.** When you hover `[[Note#Heading]]`, Obsidian gives the preview the text under the heading. It cuts that text one character after the heading line. In a plain (LF) note that character is the line break. In a Windows (CRLF) note the line break is two characters, so the preview's text began with a leftover line break. The plugin compares the preview's text with the note line by line before it writes. Everything was one line off, so it refused the write and showed the "changed on disk first" Notice.

**It was wider than the ticket said.** Every CRLF heading hover was refused, including notes where the counter is the only one. A twin elsewhere in the note was not required. Block links (`[[Note#^id]]`), embeds and whole-note previews were not affected.

**The fix.** For a heading hover in a CRLF note, the plugin drops that one leftover line break before the compare. Plain (LF) notes are handled exactly as before. The note keeps its Windows line endings after the write.

**Still refused, as before.** If the note really changed under the open preview, the write is still refused with the Notice, and nothing is written to the other counter. Examples: two heading names swapped from outside, or the hovered one of two identical sections deleted. This now behaves the same in CRLF notes as in LF notes.

**One rare new refusal, accepted under your 2026-11-10 ruling ("Save nothing with a notice is fine.").** Suppose a note is converted from Windows to plain line endings by another app while its heading preview is open. A + in that preview is now refused with the Notice; before this fix it was saved. Closing and reopening the preview saves again.

**Checked in real Obsidian** by a new lifecycle scenario, G-S112:
- Saved: + in Reading view, + in Live Preview, a hover of the other heading, an Edit form Save, and a heading with no blank line under it.
- Refused: heading names swapped from outside, and the upper of two identical sections deleted.

+++ Agent notes

- dse branch `sc619-crlf-hover-refusal` @ `df92a3f6` on develop `3a5986d3`: r1 failing tests (`test/dom/framework/reading-mode-host-crlf-hover.test.ts`, 23 tests), fix in `cardLinkLine` (`src/framework/host/ReadingModeBlockHost.ts`, +9/-4), lifecycle G-S112 (part 7).
- Superproject: one CHANGELOG commit on workspace origin/main; no interim pointer commits.
- Battery on `df92a3f6`: tsc/lint clean; jest 11817 passed / 2 skipped / 0 failed (+23: 20 + 3 tests in the new file); lifecycle 63/63 (seven parts, part 7 = G-S108, G-S112); e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0/0/24.
- Review: independent review r3 LAND (0 critical/high/medium; 2 LOW folded or ruled, 73 real-Obsidian cells, no wrong-counter write; CR-only notes measured, unaffected); scoped re-review r5 of the rebase + fix delta LAND (0 findings above INFO; real Obsidian: the LF-conversion residual refuses once, reopening the preview saves).
- CR-only notes (SC-460): measured in r3, they save and refuse exactly as LF notes; the new branch never fires for them.
- Measured cause (Obsidian 1.15.1): the heading hover part is cut at heading-content-end + 1. CRLF part `"\n\r\n```ds-counter…"` with `lineStart` 2, LF part `"\n```ds-counter…"` with `lineStart` 1. `cachedRead`, `embed.data` and the metadata cache offsets are raw CRLF and consistent, so only `cardLinkLine` failed.

+++
