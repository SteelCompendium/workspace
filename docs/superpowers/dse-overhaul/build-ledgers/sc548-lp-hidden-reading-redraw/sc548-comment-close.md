Closing as Canceled: the hidden Reading view never redraws DSE blocks, so there is nothing to skip. No code change.

**What was measured** (Obsidian 1.15.0, dse `develop` `0698550f`)

- 72 Live Preview writes across 6 note layouts, unthrottled and at 8x CPU throttle, plus every write in lifecycle scenarios G-S8, G-S52 and G-S59.
- DSE work in a hidden Reading view: 0 renders, 0 scroll pins, 0 holds.
- Each write ran exactly one DSE render per visible block, and none anywhere hidden.

**Why it never happens.** Obsidian's Reading-view renderer checks whether its element is on screen before it does anything. A hidden Reading view gets the "note changed" call, then returns at once: no parse, no render, no DSE code. Obsidian's own cost for that call is 0.0-0.5 ms per write unthrottled and 1.2-7.4 ms at 8x. That is under 0.1% of the time from write to visible redraw (354-800 ms unthrottled, 6.3-7.8 s at 8x on the G-S52 layout). Obsidian 1.14.4 and 1.13.7 have the same check.

**Why SC-472 thought it did.** The SC-472 lifecycle scenario G-S52 opens each host note in Reading mode first. Those were visible Reading renders, and they fell into the previous write's 12 s timing window. The SC-472 report now carries a dated correction under that follow-up.

**One thing you might notice, which DSE cannot change.** After a note is changed from outside, switching a Live Preview pane to Reading shows the old Reading content for a moment before Obsidian redraws it:

- a tracker in the note itself shows its old value for 0.7-1.45 s;
- an embedded tracker is blank for 0.45-0.9 s.

That is Obsidian redrawing on the mode switch. A DSE skip would not change it, so no ticket was filed.

---

Mechanics:
- A scratch prototype of the skip (+28 lines in `registerFrameworkElements.ts`) fired 0 times in 24 writes and 59 lifecycle code-block calls. G-S8, G-S52 and G-S59 passed 3 of 3 on it and on the baseline. It is not shipped.
- The superproject-only docs commit (SC-548 ledger preserved under `docs/superpowers/dse-overhaul/build-ledgers/sc548-lp-hidden-reading-redraw/`, plus the SC-472 r1 correction line) is on the worktree branch and is handed to the dispatcher for landing. No dse change.
