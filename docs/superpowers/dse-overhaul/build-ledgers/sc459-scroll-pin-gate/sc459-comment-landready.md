The lifecycle check G-S8 now fails when the SC-198 scroll pin is turned off. Before this change it passed either way. No decision is needed from you; this is ready to land.

**Why the old check passed with the pin off.** On Obsidian 1.14.4 the jump to the top still happens, but only when a write redraws a Draw Steel block from scratch. Since SC-340, a click in a tracker reuses the existing tracker instead of redrawing it, so the old G-S8 never reached the jump at all.

**What G-S8 does now.** It runs the same click twice on the tall test note:
1. With the default settings, where the tracker is reused. This checks the scroll position holds, same as before.
2. With tracker reuse switched off for that one write, so the tracker is redrawn and the jump would happen. It checks that the redraw happened, that the pin attribute `data-dse-scroll-pin` was on the scroller at the moment the page got short, and that the scroll position never moved.

Measured on 1.14.4 with the pin off, the second click drops from 2779 px to 2001 px. With the pin on, it holds at 2779 px.

**Proof that it catches a broken pin:**
- Pin call disabled in the code: G-S8 FAIL, "data-dse-scroll-pin was not on the scroller when the sizer collapsed".
- Pin's CSS rule deleted: G-S8 FAIL, "scrollTop moved: start 2779 min 2001".
- Unmodified build: G-S8 ok.

**Keeping the pin.** The pin is still needed. It protects every write where Obsidian redraws the tracker instead of reusing it.

**New gap, filed as SC-470.** The pin only protects the pane where you clicked. If the same note is open in a second pane, that pane still jumps to the top on every tracker write, measured 3020 px to 0. An outside edit, such as Sync, does the same to the open note.

**Second new gap, filed as SC-472 (low priority).** The pin holds the page height for a fixed 2.5 seconds. With the CPU slowed 8 times, Obsidian's redraw starts after that, and the note still jumps. At 6 times slower it holds.

---
Mechanics:
- dse branch `sc459-scroll-pin-gate` @ `0267b8a` on develop `84636a9`. Changed only the G-S8 scenario in `visual-harness/obsidian-lifecycle.mjs` and the header comment of `src/framework/host/previewScrollPin.ts`. Built `main.js` and `styles.css` are byte-identical to a build of develop `84636a9`.
- An independent reviewer approved the final head after two small fix rounds. It re-ran the broken-pin checks, and checked that SC-460's new G-S12 scenario in the same file is untouched.
- G-S8 now takes about 3.2 seconds per phase. It also passes 2 of 2 runs with the CPU slowed 6 times.
- Gates: tsc and lint clean · jest 5328 passed, 2 skipped (fresh worktree without the shots cache; the documented equivalent of 5329 passed, 1 skipped) · lifecycle 28/28 ok · e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 pairs · shots, freeze and parity skipped because the built output is byte-identical.
- The SC-198 root-cause doc is not on this machine, so the 1.13.7 numbers could not be compared directly.
