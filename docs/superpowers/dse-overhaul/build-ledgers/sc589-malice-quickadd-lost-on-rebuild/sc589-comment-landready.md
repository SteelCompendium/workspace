A half-typed Malice quick-add now survives Advance round and every other action that rebuilds the tracker. This holds in Reading view and in the pinned sidebar tracker. The fix is reviewed and ready to land; nothing is needed from you.

**What you will see.** Type an amount and a label into the quick-add boxes, then press Advance round (or Make/Relieve captain, Reset turns, Reset encounter, the + / - stepper, or collapse the section). Both boxes still hold what you typed. Add commits it and empties them, as before. What you type is never written to the note.

**Also fixed.** In the pinned sidebar tracker, a change to the note from somewhere else no longer throws keyboard focus out of the box you are typing in. The cursor stays where it was.

**Not fixed here: Live Preview.** In Live Preview the boxes keep the text for about half a second, then empty when the tracker saves to the note. That save redraws the block as a new tracker, which starts empty. It has the same cause as SC-602 (focus lost on that redraw), so it is filed separately as SC-605. Both changelog entries say "Reading view and the pinned sidebar tracker" and point at SC-605.

Closing or reopening the note still starts with empty boxes. That is intended.

---

Mechanics:
- dse branch `sc589-malice-quickadd-lost-on-rebuild` @ ``b5d18f79`` on `develop` `e0e49d4d`; superproject CHANGELOG @ ``f8796a1f``.
- Fix: `src/elements/initiative/view.ts`. The draft lives on the tracker view (`quickAddDraft`), is read off the boxes in `update()` before the rebuild and put back when the boxes are rebuilt. An outside model change also captures and restores focus.
- Tests: the SC-437 jest marker `[M10]` is now a plain passing test; 24 new jest cases (Q group); e2e INIT-M10 (Advance round keeps the draft, Add clears it) and INIT-M11 (sidebar outside write keeps draft, focus and caret). All new tests were red on the base.
- Gates: jest 7328 passed / 2 skipped (fresh worktree) · lifecycle 56/56 · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (base 270/274; the 4 known bugs are SC-257, SC-355, SC-384, SC-580) · `styles.css` is byte-identical to the base, so shots 592, freeze 280/280 and parity 0/0/24 carry.
- Pipeline: implementer → independent review (0 high, 1 medium = the Live Preview gap, 2 low folded) → fix round → scoped re-review (LAND; 1 low folded as two more tests) → test-only round..
