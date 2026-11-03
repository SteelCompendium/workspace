G-S61 no longer fails at random under load. Phase (e) used to fail about one run in three on a busy machine. With the fix it passed every run, loaded or idle, and it still catches the bug SC-544 fixed.

**What was wrong.** G-S61 watches every card frame by frame and fails if a card shows the wrong value 3 frames in a row. On a busy machine the editor's copy of the note can trail the file on disk by up to about 120 ms. During that time the card already shows the new value but the editor still holds the old one, and the old check counted that as a wrong card.

**What changed (test harness only, no plugin code).** A card that shows its block's value as it is on disk, while the editor has not caught up yet, is now "catching up" and not counted. That state may last at most 1000 ms, about 8 times the worst lag measured; longer fails with its own message. If the harness cannot read the note from disk, the phase fails rather than skipping the check.

**Measured.**
- Before the fix, 3 of 8 runs under load failed (e). After the fix, every run passed: 33 runs under heavy CPU load (loadavg up to 26 on 12 cores) and 9 on a quiet machine, 0 failures.
- The build from before SC-544 still fails phases (a) to (i). Each of SC-544's control builds still fails at least one phase.
- New controls for the changed check:
  - editor held back 1.5 s: fails on the 1000 ms limit
  - a card forced to a wrong value for 400 ms: fails
  - the same with every disk read failing: fails

Nothing is needed from you. The dispatcher lands it.

---
Branch `sc557-gs61-stale-frame-flake`, dse head `d689b719` on develop `31d8f779`; `visual-harness/obsidian-lifecycle.mjs` G-S61 block only. Gates: tsc and lint clean, jest 6459 passed / 2 skipped on a fresh worktree (6460 / 1 once shots has cached the app CSS), lifecycle 51/51 in five parts and e2e 128/128 with 89/89 pairs at `f2f25f9f` (later commits touch only the G-S61 recorder; lifecycle part 4 re-run 4/4 at `d689b719`); `main.js` and `styles.css` byte-identical to `31d8f779`, so shots, freeze and parity carry. Reviews: r2 FIX (1 MEDIUM: a failed disk read silently disabled the check — fixed), r4 LAND, then two small folds (a disk read half-written 3 frames in a row now also fails), r6 LAND. Proposed dse-verify wording: `.superpowers/sdd/sc557-gs61-stale-frame-flake/sc557-dse-verify-proposal.md`.
