In Live Preview, a half-typed Malice quick-add now survives the tracker's own save. Type an amount and a label, press Advance round or the Malice - / + stepper, and both boxes keep your text instead of emptying half a second later. Ready to land; nothing needed from you.

What changed for the user:

- The amount and label stay in the boxes after any tracker action that saves (Advance round, the stepper, Make/Relieve captain, Reset turns, Reset encounter). If you were still typing in a box, the caret stays where it was.
- Only a successful Add empties the boxes, as before. The draft is never written to the note. After a carried save, the note's bytes are identical to a normal save.
- A mouse click still never moves keyboard focus into the tracker.
- An edit to the note from outside still starts the boxes empty.
- Reading view and the pinned sidebar tracker are unchanged.

Not covered, filed as SC-620 (Backlog): if the same tracker appears twice (an identical twin block, or the same note open in a second pane), the other copy still loses its own draft when this copy saves. That was already the behaviour before this change.

How it works, briefly: just before Obsidian removes the old tracker, the plugin reads the two boxes. It hands them to the new tracker for that same block, in that same pane, before the new one is drawn, so the boxes never show empty first. The hand-off is used once and expires after 1.5 seconds.

Mechanics:

- dse branch `sc605-lp-quickadd-draft-on-save` @ `63e00d7e` on `develop` `d984b115`; superproject `723f4170` on workspace `main` `298a4ef9` (CHANGELOG only; pointer bump at landing).
- New `src/framework/host/livePreviewStateCarry.ts`; small edits in `framework/view.ts` (opt-in `carryState()` / `receiveCarriedState()`), `pipeline.ts`, `registerFrameworkElements.ts`, `livePreviewFocusCarry.ts`, `elements/initiative/view.ts`. Only the initiative tracker opts in.
- Gates on `d984b115`: tsc and lint clean · jest 11648 passed / 2 skipped · lifecycle 61/61 · e2e `315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (9 new Live Preview tests, INIT-L09..L17; 7 fail without the fix, 2 are guards) · no CSS change, so shots, freeze and parity carry.
- Pipeline: design and prototype round, implementation, independent review (0 high, 0 medium, 3 low, all fixed), scoped re-review land-ready (its one low, a missing test, added). 20 real-Obsidian probes, including a popout window, two panes, twins, rapid presses and closing/reopening the note.
