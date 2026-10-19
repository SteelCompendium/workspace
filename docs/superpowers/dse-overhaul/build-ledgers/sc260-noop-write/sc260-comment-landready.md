A save that changes nothing no longer leaves blank scroll space at the bottom of a reading-mode note. The fix is reviewed, passes every gate, and is ready to land. Nothing is needed from you.

**What was actually wrong.** As this ticket's correction already says, Obsidian skips writing when the content is identical, so there was never a redundant disk write or re-render. The real cost was elsewhere. The SC-198 scroll pin was taken before every save, even one that changed nothing. It then held the page at full height for 2.5 seconds, waiting for a redraw that never came. Now the pin is taken only when the save is going to change the note.

**What I did not do, on purpose.** I did not add the "equality check before `vault.process`" the ticket describes. A check against the plugin's cached copy of the block could silently drop a real write if the note had changed on disk without the plugin noticing. Obsidian's own read-and-compare inside `vault.process` is the safe check, and it already runs.

**Found along the way, filed separately.** The lifecycle scroll check (G-S8) still passes with the SC-198 pin switched off completely. So no test in real Obsidian guards the pin today. Either Obsidian 1.14.4 no longer needs the pin, or the check uses a note that does not trigger the problem. This is SC-459, in Backlog.

---

Mechanics:
- `draw-steel-elements` branch `sc260-noop-write`, 2 commits on `develop` @ `8ab5e91`: `db40b9f` (pin only when the file changes) and `f818002` (a pin failure can no longer abort a save; test rename).
- Change: `src/framework/host/ReadingModeBlockHost.ts`, where the pin call moved inside the `vault.process` callback. Tests: 4 new jest tests in `test/dom/framework/previewScrollPin.test.ts`. CHANGELOG: one `[FIX]` bullet under 7.0.0 (unreleased).
- Gates at `f818002`: tsc and lint clean · jest 4810 passed / 1 skipped · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, coverage 47/47 pairs · shots 572, 0 FAIL · freeze 276/276 · parity 0 gaps / 0 undeclared / 24 declared.
- Independent review: approved with nits on round 1. The nits were fixed in `f818002`, and a scoped re-review of that delta came back APPROVE with no findings. The reviewer checked against the real Obsidian 1.14.4 `Vault.process` that the pin is taken exactly when Obsidian writes, and always before the write.
