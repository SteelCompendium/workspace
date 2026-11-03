The scroll pin now waits for Obsidian's redraw instead of a fixed 2.5 s timer. On a slow or busy machine, a note no longer jumps up after a tracker changes. It is ready to land; no decision needed from you.

**What changed for a reader**

- A tracker change in a note open in two panes no longer drops the Reading pane from 2779 px to 2001 px. In a Live Preview note that embeds a tracker, the drop from 7486 px to 3745 px is gone too. Both used to happen when the machine was busy.
- Scrolling while a late redraw is still coming no longer lets the note jump. This includes scrolling a second tracker into view.
- On a normal machine the hold now lets go about 0.5 s after the redraw, not always at 2.5 s.
- Opening another note in the same pane lets go at once. It used to hold for 2.5 s, with up to 4544 px of empty space.
- Fixed an old bug: every hold added 64 px of empty space below the note. A reader at the very end was snapped back 64 px when the hold ended.
- One small trade: when a change makes the end of a note shorter, the empty space under it stays about 1 second longer than before. The page still ends in the same place.

**How it is guarded**

A new lifecycle check, G-S59, slows the CPU 8x and keeps the main thread busy for 4 s after each write, so Obsidian's redraw starts after the old 2.5 s timer would have let go. It fails on the current plugin in every write. It also fails on three weaker designs we tried along the way:

- a plain 2.5 s timer;
- a release on any page change;
- a release 1 s after the reader's scroll.

**Review**

Three independent review rounds. The first two each found a way a reader's scroll could still make the note jump. Both are fixed, with lifecycle phases that fail without the fix. The last round approved with no open findings.

Mechanics, below the line:
- dse `0698550f` on develop `367a2f1d`; superproject `351e3bb0` (CHANGELOG; the dse pointer bump is left for landing).
- Gates: tsc and lint clean; jest 6378 passed / 1 skipped / 253 of 254 suites; lifecycle 49/49 in five parts (21 + 16 + 7 + 4 + G-S59); e2e 128/128 ok, 0 failed, coverage 89/89 pairs; shots 592, 0 FAIL, button host-leak 161/966; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 declared.
- dse-verify text to apply at landing: `.superpowers/sdd/sc472-scroll-pin-timer/sc472-dse-verify-proposal.md`. Lifecycle becomes 49/49, run in five `--only` parts with G-S59 alone.
- Split out: SC-548 (a Live Preview pane also redraws trackers in its hidden Reading view).
