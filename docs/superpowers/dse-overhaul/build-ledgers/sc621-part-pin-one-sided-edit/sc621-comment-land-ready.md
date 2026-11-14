The fix is ready to land. A + / - or a form Save in a hover preview or an embed of part of a note no longer writes the other of two identical counters in this shape. It is refused with the "changed on disk first" Notice instead. No decision is needed from you.

**It was real.** Before the fix, in real Obsidian, every case of the ticket's shape that could be clicked wrote the other counter with no Notice: 16 of 16. That covers heading links (`[[Note#Heading]]`) and block links (`[[Note#^id]]`), hover previews and embeds, Reading view and Live Preview, + and the form's Save.

**The cause.** When you click in a preview, the plugin first finds the counter the preview was drawn from in the note as it is now. When every change sits on one side of the two identical counters, its check could not tell the two apart. It picked the survivor and wrote it.

**The fix.** For a note with identical counters, the plugin now uses the same "is there only one sensible answer" check SC-612 added for a note open in its own pane. If the note could have changed either way, it writes nothing and shows the Notice.

**What you may notice.**
- The refusal also happens when the outside change removed the OTHER identical counter, or added one, together with a nearby edit. In each of these the note really is ambiguous.
- Obsidian often does not redraw such a preview after the outside change. Each click in it is refused again until you reopen it: move the pointer away and hover again, or reopen the note. The reopened preview saves as usual. This matches what SC-607 already does for previews. Both are covered by your 2026-11-10 ruling ("Save nothing with a notice is fine.").
- A note without identical counters behaves exactly as before.

**Still written, as before the fix.** Three rare cases:
- an identical counter moved to another place among the identical ones;
- the shown section deleted while a neighbouring section is renamed to its name;
- the ticket's shape combined with a very large outside change (more than about 400 lines in one write).

In the first two, the note's text cannot show which counter was meant. The third is too large a change for the plugin to compare.

**Checked in real Obsidian** by a new lifecycle scenario, G-S115, with 9 cases. The six ticket shapes write nothing and show one Notice; before the fix they wrote the other counter. The three controls save into the right counter. An independent reviewer tried 26 cases per build, including Windows line endings, three identical counters and callouts. Before the fix 15 of them wrote the other counter; after it, none did.

+++ Agent notes

- dse branch `sc621-part-pin-one-sided-edit` @ `27120710` on develop `b1e4f027` (9 commits; the last is comment-only on `96955985`, main.js byte-identical): r1 red tests, fix in `rebaseCardPin` (`src/framework/host/ReadingModeBlockHost.ts`, +7 code lines: twinned -> require `placedUniquely` at the drawn->now step), M2 + persistence tests, sweep + seeded fuzz suite (`reading-mode-host-part-pin-sweep.test.ts`, ~18 s), lifecycle G-S115 (part 7), residual comment, G-S115 dead-code removal, suites on SC-568's `settleVaultReads`.
- Superproject `sc621-part-pin-one-sided-edit` @ `1907a338` on workspace origin/main `e7e34279`: `3022c223` CHANGELOG + `1907a338` ONE pointer bump to `27120710`; no interim pointer commits.
- Battery on `96955985` (= `27120710` minus one comment): tsc/lint clean; jest 11892 passed / 2 skipped (11857 + 35); lifecycle 64/64 (seven parts; part 7 `G-S108,G-S112,G-S115` 200 s); e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; styles.css byte-identical to a clean b1e4f027 build -> shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24 carry.
- Review: independent r3 LAND (0 critical/high/medium; 4 LOW folded: docs + G-S115 dead code); 72,600-cell jest probe: other-counter writes only in the three documented residuals; 1,446 new refusals, all oracle ties in twin notes, 0 in unambiguous notes. Scoped re-review r5 LAND (0 findings above INFO; range-diff of the rebase clean; G-S115 still fails on a b1e4f027 build and passes on the branch). r6: residual-reason wording only (comment + CHANGELOG), main.js byte-identical.
- Follow-up SC-624 (a load flake seen in review) was already fixed by SC-568; closed Done.

+++
