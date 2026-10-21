Edits in Reading view now save in notes that have a stray carriage-return character above the block. The fix is ready to land; nothing is needed from you.

**What was wrong.** Obsidian counts a lone carriage return (`\r` with no newline after it) as a line break. The plugin only counted newlines, so everything below a stray `\r` was one line off. A click could not find its block, so nothing saved. Since SC-455 you would at least have seen a "couldn't be saved" Notice.

**What changed.**
- The plugin now numbers lines the way Obsidian does. Every place that finds or writes a block uses that one rule. That covers Reading view, Live Preview, the sidebar, and adding a block from the encounter builder.
- Every byte outside the block is left alone, including the stray `\r` characters. A Windows (CRLF) note stays CRLF. A note that only uses `\r` line breaks keeps them.
- The sidebar had the same off-by-one: with a stray `\r` above two blocks, "Send block to sidebar" could pin the wrong one. That is fixed too.

**Checked in real Obsidian 1.14.4**, by an independent reviewer comparing the saved file byte for byte:

| Path | After the fix | Before the fix |
|---|---|---|
| Reading view | 30 of 30 saved correctly | 7 of 30 |
| Live Preview | 14 of 14 | 10 of 14 |
| Sidebar | 13 of 13 | 4 picked the wrong block, 3 failed to mark it |
| Randomly generated notes | 27,000 with 0 failures | — |

**Filed separately:** SC-471, an older bug found during review. The "Send block to sidebar" hotkey does nothing when the cursor is on a block's opening fence line. SC-460 did not cause it.

---
Mechanics: dse branch `sc460-stray-cr` @ `84636a9` on `develop` @ `ba20072`. Gates: tsc + lint clean · jest 5329 passed / 1 skipped (+69 over base 5260) · lifecycle 28/28 (new G-S12: a stray `\r` above a block, and a `\r`-only note, in real Obsidian) · e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs · shots 572, 0 FAIL · freeze 276/276 · parity 0/0/24. Pipeline: implementer → independent review (2 medium, 1 low; all fixed) → scoped re-review: LAND-READY, 0 findings above INFO. Reports: `.superpowers/sdd/sc460-stray-cr/` (`sc460-impl-report.md`, `sc460-review-report.md`, `sc460-fix1-report.md`, `sc460-rereview-report.md`).
