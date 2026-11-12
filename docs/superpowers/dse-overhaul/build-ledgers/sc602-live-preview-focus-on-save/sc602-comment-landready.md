In Live Preview, keyboard focus now stays on the button you pressed when the element saves and Obsidian redraws it. Before this fix, focus fell to the page about half a second later. Ready to land; nothing needed from you.

**What changes for you**

- Press a counter's + with Enter in Live Preview, and focus stays on the + with its keyboard ring after the save.
- The same holds for initiative Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, the stamina bar's Catch Breath, and elements inside callouts.
- If the pressed control no longer exists after the redraw, focus goes to the control that replaced it. If none exists, it goes to the element itself, never to the page.
- The earlier focus fixes now hold in Live Preview too: the SC-588 tracker actions, the SC-609 roster cell click, and the SC-603 squad-pool Apply.
- A mouse click still never pulls focus into an element.
- Reading view behaves as before.

**Not covered**

- A half-typed Malice quick-add amount is still lost when the tracker saves in Live Preview (SC-605). It needs its own fix: the press there is a mouse click, and the draft lives on the old view.
- The Conditions window still closes when a write lands in Live Preview (SC-384).

**How it works**

The fix is in the framework, so every element gets it without element-specific code. In Live Preview an element's own save always mounts a fresh copy of the block; it is never reused the way Reading view reuses it. The fix records which control had focus just before Obsidian removes the old copy. When the new copy mounts, focus moves to the same control. The record is used once and only for that block, so an outside edit, a second note, or a twin block never takes focus.

**Checks**

- An independent review re-ran every gate and 25 real-Obsidian probes: twins, two panes, a popout window, note switch, rapid Enter, mouse presses, and focus moved away before the save. Result: 0 high, 0 medium, 3 low (wording and a stricter e2e wait), all fixed.
- 14 new e2e tests in Live Preview (INIT-L01..L08, CTR-L01..L05, CALL-L04). 10 of them fail without the fix; the 4 guard tests pass either way.

+++ Agent notes

- Branch `sc602-live-preview-focus-on-save`: dse `711844f3` on `develop` `d0561a68`; superproject `0594056f` on `main` `5d4611a3` (CHANGELOG only; dse pointer bump left for landing).
- Gates at `711844f3`: tsc and lint clean · jest 10784 passed / 2 skipped (+25) · lifecycle 60/60 (six parts; one G-S91 Reading-view hover timing fail in part 5, green alone and on re-run, also flakes on base) · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (+14 tests, +2 pairs) · styles.css identical to a clean `d0561a68` build, so shots 592 / freeze 280/280 / parity 0/0/24 carry.
- Root cause: in Live Preview an own save is a fresh mount, never an adoption (`viewRegistry.ts` claim needs the same docId; every LP widget gets a new one), and Obsidian releases the old render child inside its StateField update, before the DOM update, while focus is still on the control.
- Mechanism: `ViewRegistry.beforeRelease` hook + a CodeMirror ViewPlugin (twin hand-off) in new `src/framework/host/livePreviewFocusCarry.ts` arm a one-shot `armSuccessorFocus` request keyed by the written block; SC-518's `claimChromeFocus` claims it on the new mount via `controlSuccessor` (`kit/controlFocus.ts`). Arms only when the root is in `.cm-content`, focus is inside it, and the view has an unused own-write ticket.
- CHANGELOG: the SC-588, SC-609 and SC-603 entries no longer say Live Preview loses focus (SC-603 claims only the pool Apply route).
- Not measured: Canvas; the SC-603 Conditions-window route in LP. No lifecycle scenario added (G-S104 unused).
- Ledger: `.superpowers/sdd/sc602-live-preview-focus-on-save/` (design r1, impl r2/r4, review r3/r5).

+++
