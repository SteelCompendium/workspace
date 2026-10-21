# SC-326 r3 report — fix round on review 1

## Executive summary
- STATUS: DONE. dse branch `sc326-montage-scroll`, head `c27e5a0` (one commit on r2's `44186fe`); `origin/develop` still `188755b` (fetched).
- MED-1 FIXED: Tally track `minmax(max-content, auto)` (`BoardView.ts`; the containment gate's copy updated too). Measured at max scroll, 14 rounds, fine AND coarse: the last "x n" chip is 11.86px from the frame (was 0.45px; review expected 11.1-11.7).
- MED-2 FIXED: `focusin` on the board brings the focused cell fully inside the frame. Done horizontally by hand, not with `scrollIntoView` (see "Deviation"). Real Tab walk: 85 of 85 stops fully visible, fine and coarse (at `44186fe`: 10 fine stops and 15+ coarse stops partly clipped; worst 2px of 147px).
- LOW-2 FIXED: the gate renders a genuine 14-round source through the real element (`?fixture=probe-rounds-14`, generator in `entry.ts`, NOT in `FIXTURES`: no new shot or manifest row), so the shipped track list is what is measured. LOW-3 FIXED: G-S12 now has a mid-scroll tap and two blocks in one note (count stays 28). LOW-4 FIXED: "Shift + mouse wheel".
- New gate checks (content-inside-cell, real Tab walk) each fail on `44186fe` and pass after; both can-fail runs recorded, each fix reverted separately too.
- Battery at `c27e5a0`: tsc/lint clean; jest 5266 passed / 1 skipped / 229 of 230; lifecycle 28/28; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24. All 572 shot PNGs still byte-identical to base `188755b`.

## Changes
- `src/elements/montage/BoardView.ts`: Tally track `minmax(max-content, auto)`; `keepFocusedCellInView(board)` (a `focusin` listener registered on the per-mount owner, so it is torn down on every rebuild).
- `visual-harness/entry.ts`: `probeSource(id, fixtureName)`, consulted by `mountOne` only when the name is not in `FIXTURES`; `probe-rounds-N` = 5 heroes, an entry per hero per round before the current one (varied results/skills, a note every 9th), `current_round: N`. Not enumerated by the manifest, so no shot/freeze movement.
- `visual-harness/shoot.mjs`: `assertMontageBoardScroll` drops the cloned DOM and hand-copied track list, navigates to `probe-rounds-14`, and adds (4) content-inside-cell and (5) a real `page.keyboard` Tab walk; the SC-299 containment gate's track-list copy (`:956`) now reads `minmax(max-content, auto)` too. The footer hint now names BoardView's track list and the focusin handler.
- `visual-harness/obsidian-lifecycle.mjs`: fixture `Lifecycle/montage.md` is two 20-round blocks (A: current round 10, 3 heroes; B: current round 20, 2 heroes); G-S12 rewritten (below). Header comment updated.
- `test/dom/elements/montage.test.ts`: +4 tests. `CHANGELOG.md`: "Shift + mouse wheel, trackpad, touch, or Tab to a control".

Deviation from the ruling's literal wording: the ruling says `scrollIntoView({inline:'nearest', block:'nearest'})`. I scroll the board's `scrollLeft` by exactly the hidden part instead. Horizontally identical; but `scrollIntoView` with `block:'nearest'` would also scroll the PAGE vertically whenever the clicked/focused control is partly below the viewport, which a focusin handler would then do on every mouse click too. A fully visible cell is never moved either way. Say if you want the literal `scrollIntoView`.

## MED-1 — Tally
Measured before (review): 0.72px chip spill past the cell at 12 rounds, last chip 0.45px from the frame. At `c27e5a0` (`sc326-r3-tally-gap-measure.log`): last chip 11.86px from the frame at max scroll, fine and coarse (the success chip 53.36px); the gate reports no content spilling past any cell. Board widths when it fits are unchanged: all 572 shot PNGs are byte-identical to base (the one place the track could differ is an overflowing board, and none of the shots overflows). The overflow threshold moves ~24px wider, as the review predicted.
Can-fail (`sc326-r3-gate-canfail-at-44186fe.log`, gate code run against each BoardView):
- A, BoardView at `44186fe` (neither fix): both pointers fail with `CONTENT OUTSIDE ITS CELL — board-total Kira (content spills 0.72px past its own cell)` x5 heroes and the Tab lines below.
- B, only the Tally change reverted (`4.4em`): fails with only the five `CONTENT OUTSIDE ITS CELL` lines, both pointers.
- jest (`sc326-r3-jest-canfail.log`): `the Tally track is minmax(max-content, auto)` fails at `44186fe` (`Expected: true Received: false`).

## MED-2 — Tab
At `44186fe` the new gate's real Tab walk fails with, fine: `Kira r8: 9px of 83px visible`, `Kira r13: 54px of 83px visible` (x5 heroes); coarse: `Kira r5: 2px of 147px visible`, `Kira r8: 125px of 147px`, `Kira r11: 124px of 147px` ... (same numbers as the review). With only the focusin handler removed (C) the fine and coarse walks fail the same way and the Tally lines are absent. At `c27e5a0`: `85 Tab stops all fully visible` for each pointer.
jest (fail at `44186fe`, 3 of the 4 new tests): a cell sticking out right is scrolled in by exactly the hidden part (`Expected: 560 Received: 500`); out left (`Expected: 470 Received: 500`); a fully visible cell is not moved (guard, passes either way). Rects are stubbed because jsdom has no layout.
Interaction: a click on a fully visible quick-trio button leaves the board where it is (G-S12 taps are `.click()` on visible buttons and hold the offset on every frame).

## LOW-3 — G-S12 (real Obsidian 1.14.4)
Two blocks in one note. A scrolled strictly mid (699 of 884; asserted `100 < start < max-100`), B at its far end (908). `.click()` then both boards' `scrollLeft` sampled every frame for 2.5 s after each of: three quick-trio taps in A (Kira, Bram, Osric, round 10), End round in A, a quick-trio tap in B (Yenna, round 20), End round in B. Result: `G-S12 ok (… A held 699, B held 908 over 128 / 129 / 132 / 108 / 122 / 130 frames)` (`sc326-r3-lifecycle-G-S12-extended.log`); i.e. the mid-scroll `saved.left` branch and the adoption re-apply are now proven in real Obsidian, and a write in one block does not move the other. Disk writes and note integrity are asserted. Count stays 28; the full run reads `28/28 ok`.

## Battery at `c27e5a0`
| gate | result |
|---|---|
| tsc (incl. `-p e2e`) / lint | clean / clean |
| jest | `Tests: 1 skipped, 5266 passed, 5267 total`; `Test Suites: 1 skipped, 229 passed, 229 of 230 total` (5262 + 4 new) |
| lifecycle (port 9286) | `OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` |
| shots | 572 PNGs, 0 FAIL; `montage track widths OK`, `montage quick-trio containment OK (6 configurations …)`, `montage board scroll OK (14 rounds x 900px pane, genuine probe-rounds-14 source — fine: 1359px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; coarse: 2255px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; …)` |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |
Extra: sha256 of all 572 shot PNGs vs the base `188755b` run: 0 differences. (The shots run took >10 min wall-clock because another agent's shots ran concurrently.)

## Out of scope, untouched
LOW-1 (1px-overflow scrollbar), the generic `adoptView` scroll reset (SC-467), the off-screen-detach INFO, the pinned name column.

## Drive-by fixes
None.

## Follow-ups
1. The probe generator `probeSource` is montage-only (`probe-rounds-N`); other elements wanting a gate-only genuine source can extend it the same way.
2. The Tally track now takes its content width when the board overflows, so the horizontal overflow threshold moved about 24px wider (expected; no shot overflows).

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/`)
`sc326-r3-report.md`; gate logs `sc326-r3-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`; `sc326-r3-gate-canfail-at-44186fe.log` (A/B/C runs), `sc326-r3-jest-canfail.log`, `sc326-r3-lifecycle-G-S12-extended.log`, `sc326-r3-tally-gap-measure.log`.
