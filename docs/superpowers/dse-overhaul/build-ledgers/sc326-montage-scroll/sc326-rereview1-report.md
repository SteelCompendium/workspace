# SC-326 scoped re-review 1: rounds 3 and 4 (dse `c8880db` on develop `e31e1a0`; superproject `139cfd8` on main `2d4ece3`)

## Executive summary
- **Verdict: LAND-READY.** Every folded finding is fixed, and I confirmed each by running probes, not by reading code. One LOW finding is open: a two-word header fix the owner can take or leave.
- **MED-1 fixed.** At max scroll the last Tally chip now sits **11.23px** (12 rounds) or **11.73px** (20 rounds) from the frame, and 11.52px inside its own cell. This holds for fine and coarse pointers at every pane from 500 to 1600px. Before the fix it was 0.45px from the frame and spilled 0.72 to 4.22px out of its cell.
- **MED-2 fixed.** A real Tab walk through the board leaves no stop clipped: **0/75** (12 rounds) and **0/115** (20 rounds), fine and coarse, at 6 pane widths. On base the same walk clips 5 (fine) and 15 (coarse) stops.
  - **No vertical side effect.** The browser's own vertical scrolling of the reading view during the walk is identical at every stop on base and head. In real Obsidian, focusing a partly visible cell moved only the board (scrollLeft 163 → 99; reading-view scrollTop stayed at 0).
  - **My mouse/touch concern is refuted.** I pressed partly visible controls in real Chromium, with fine and coarse pointers, on slivers down to 11.6px. Every press did what was intended and the board did not move. The cause: the framework's click shield (`pipeline.ts:222-238`) cancels `mousedown`/`pointerdown`, so a press never moves focus and the `focusin` handler never runs on a press. A `:focus-visible` guard is **not needed**; it behaves the same.
- **LOW-2, LOW-3 and LOW-4 fixed.** With the Tally fix reverted, the gate fails, which proves it now measures the shipped track list. G-S13 holds a mid-scrolled board and a second block in real Obsidian. The CHANGELOG now says "Shift + mouse wheel".
- **The new gate checks fail when they should.** I reverted the MED-1 fix alone, then the MED-2 fix alone. Each time the gate exited 1 with loud lines (`CONTENT OUTSIDE ITS CELL ×5`, or `TAB FOCUS NOT FULLY VISIBLE` with 2px of 147px showing). After each run the file was restored byte-identical.
- **Scope is clean.** The rebased change set matches round 3's line for line, apart from the G-S12 → G-S13 rename. There is no breakpoint change, no `adoptView` or framework change, no pinned column, and freeze is byte-identical (276/276).
- **Battery at `c8880db` (my runs):**

  | gate | result |
  |---|---|
  | tsc / lint | clean |
  | jest | 5393 passed / 1 skipped / 231 of 232 |
  | lifecycle | 29/29 |
  | e2e | 88/92 ok, 0 failed, 4 known-bug, 64/64 pairs |
  | shots | 572, no FAIL, `montage board scroll OK` (85 Tab stops visible on each pointer) |
  | freeze | 276/276 |
  | parity | 0 / 0 / 24 |

- **LOW (open):** the scenario header in `visual-harness/obsidian-lifecycle.mjs:42` reads "SC-326 appends G-S13 **(29 total)**". That breaks the rule the dispatcher added in superproject commit `2d4ece3`: "Owners must not put a fixed total in a scenario header." Fix: delete "(29 total)".

## 1. Folded findings, re-verified

The numbers below come from my own scratch probes. I ran them in real Chromium against the real element, using scratch clones of `e31e1a0` and `c8880db` with a genuine 12-round and 20-round montage fixture. Outputs are in `sc326-rr1-probes.log`.

### MED-1 (Tally chips)

At 500, 560, 700, 900, 1200 and 1600px, on both pointers:

| rounds | last chip → frame | chip inside its cell's edge | cell edge → frame |
|---|---|---|---|
| 12 | 11.23px | 11.52px | −0.28px |
| 20 | 11.73px | 11.52px | +0.22px |

The −0.28px for 12 rounds means the cell's padding extends a fraction of a pixel past the frame. The cause is that the maximum scroll position is a whole number of pixels. It is only padding, so it is invisible (INFO).

Before the fix (review 1): the chip was 0.45px from the frame and spilled 0.72 to 4.22px past its cell. Scott-facing zoom: `sc326-rr1-tally-zoom-after.png`.

### MED-2 (Tab focus)

- **Coverage:** the walk reached every control — 75 stops at 12 rounds and 115 at 20 rounds. No stop was clipped at any width, on either pointer.
- **Short-viewport walk (420px high), base vs head:**
  - Base clipped 5 stops (fine) and 15 (coarse); head clipped none.
  - The reading view's vertical scroll position was **identical at every stop** on base and head. The handler adds no vertical movement; the browser's own focus scrolling is unchanged.
- **Real Obsidian (scratch scenario G-RV1):** focusing a cell with only 20px showing moved the board from 163 to 99, made the cell fully visible, and left the reading view's vertical scroll at 0.
- **The accepted deviation holds.** Adjusting `scrollLeft` by hand is horizontally equivalent to `scrollIntoView` and has no vertical side effect.

### My concern: does a press on a partly visible control land on something else?

**Refuted.** I logged every press, focus and click event in real Chromium. Targets were the round-12 quick-trio button (current round) and recorded past cells, at the right and left edges, with 30px and 12px slivers showing. Fine used a real mouse click; coarse used a touchscreen tap.

| | base | head | head + guard |
|---|---|---|---|
| intended action happened | yes, every case | yes, every case | yes, every case |
| board moved during the press | n/a | never (same scrollLeft before and after) | never |
| page scrolled vertically | no | no | no |

- **What the event log shows:** only `pointerdown` and then `click`, both on the intended cell. `mousedown` and `mouseup` never reach the page, and the board gets no `focusin` from a press.
- **Why:** the framework's click shield in `src/framework/pipeline.ts:222-238` cancels `mousedown`/`pointerdown` on every non-editable target inside a DSE element, in Reading view and in the harness alike. A cancelled press does not move focus, so the handler only runs on keyboard focus or code that moves focus.
- A `:focus-visible` guard made no difference, so I am not prescribing it.

### LOW-2 (the gate measures the shipped board)

- The gate now loads a genuine 14-round montage from `probe-rounds-14`, built by `probeSource` in `entry.ts`. That source is not in `FIXTURES`, so it adds no shots and no freeze lines.
- **Proof:** reverting only the Tally line in `BoardView.ts` makes the gate fail, so it is reading the real track list.
- **INFO:** the separate SC-299 containment gate (`shoot.mjs:956`) still keeps a hand-written copy of the track list, updated to `max-content`. That is outside this ruling.

### LOW-3 (G-S13: mid-scroll and two blocks)

From the battery run of the lifecycle gate: block A held at 699 and block B at 1208 for 103 to 143 frames each, through all six writes:

- three quick-trio taps in A (Kira, Bram and Osric, round 10)
- End round in A
- a quick-trio tap in B (round 20, its far end)
- End round in B

My scratch scenario G-RV1 additionally showed:
- **Observers:** `data-dse-moving` observers stayed at 1 across the writes and dropped to 0 after navigating away.
- **Reopen:** both boards start at 0 when the note is reopened.
- **Split leaf:** the observer count went to 4 with a split leaf on the same note and back to 2 after detaching it.
- **Note integrity:** OK.

### LOW-4 (CHANGELOG wording)

- **dse `CHANGELOG.md`:** now reads "Shift + mouse wheel, trackpad, touch, or Tab to a control". The Tab claim is true now.
- **Workspace CHANGELOG (superproject commit `139cfd8`):** one accurate bullet at the top of `## Unreleased`. The SC-474, SC-468 and SC-460 bullets are kept.

## 2. The new gate checks can fail (`sc326-rr1-gate-canfail.log`)

I ran the gate's own function from `shoot.mjs` against a scratch clone of `c8880db`, rebuilding the harness after each change:

| BoardView variant | result |
|---|---|
| unchanged | `montage board scroll OK (… 85 Tab stops all fully visible …)`, exit 0 |
| MED-1 fix reverted (Tally back to `minmax(4.4em, auto)`) | exit 1, both pointers: `CONTENT OUTSIDE ITS CELL — board-total <hero> (content spills 0.72px past its own cell)` ×5 |
| MED-2 fix reverted (no `keepFocusedCellInView`) | exit 1, both pointers. Fine: `TAB FOCUS NOT FULLY VISIBLE — Kira r8: 9px of 83px visible` ×10. Coarse: `Kira r5: 2px of 147px visible` ×15 |

After the runs, `cmp` confirmed BoardView.ts was restored byte-identical and `git diff` was empty.

## 3. Scope and the rebase

- **Change set unchanged by the rebase.** I compared the added and removed lines of `188755b..c27e5a0` against `e31e1a0..c8880db`. They are identical apart from four G-S12 → G-S13 renames: one comment in `view.ts`, one comment in `montage.test.ts`, and in the lifecycle script the header line and the scenario id.
- **What the change set touches:** 8 files, 662 insertions, 4 deletions.
  - `styles-source.css`: only the frame rule.
  - No `src/framework/` change, so no `adoptView` change (SC-467).
  - No breakpoint change (LOW-1 was dropped by the owner).
  - No sticky or pinned column.
- **G-S13 is the right id.** Superproject commit `2d4ece3` reserves "SC-326 = G-S13".
- **LOW (open):** the header line says "(29 total)", which that same commit forbids. Fix: drop "(29 total)" in `obsidian-lifecycle.mjs:42`.
- **INFO:** the r2/r3 commit messages still say "G-S12". The history was not reworded; the content is right.
- **Superproject:** HEAD `139cfd8`, one commit on `origin/main` `2d4ece3`, touching CHANGELOG.md only. The pointer bump to `c8880db` is not staged; `git status --short` shows ` M draw-steel-elements`.

## 4. Battery (my runs at `c8880db`; one gate per call through a scratch script, no `cd` in the command)

| gate | result |
|---|---|
| tsc | clean, rc 0 |
| lint | clean, rc 0 |
| jest | `Tests: 1 skipped, 5393 passed, 5394 total` / `Test Suites: 1 skipped, 231 passed, 231 of 232 total` |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed` (SC-460's G-S12 and our G-S13 both ok) |
| e2e | `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` |
| shots | 572 PNGs, rc 0, no FAIL. `montage board scroll OK (14 rounds x 900px pane, genuine probe-rounds-14 source — fine: 1359px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; coarse: 2255px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; …)`. Track widths OK, quick-trio containment OK, host-copy pin OK, host-leak 112 kinds / 672 comparisons |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 |

The shots run took longer than the tool's 600s limit and finished in the background with rc 0. I read its log only after it had finished.

## 5. Scott-facing pair

Both images use the same genuine 12-round montage as review 1: 5 heroes, 55 entries, 31 successes and 16 failures, current round 12. Settings: coarse pointer, 900px pane, steel dark theme, real Obsidian stylesheet, cropped to the card.

- `sc326-rv2-scott-before.png` (base `e31e1a0`): the board clips (`overflow-x: hidden`). Rounds 5 to 12 and the Tally are cut off.
- `sc326-rv2-scott-after-right.png` (`c8880db`, scrolled fully right, scrollLeft 1270 of 1270): rounds 9 to 12 and the Tally are visible, and the "✓ n" / "× n" chips clear the frame with even padding.
- `sc326-rr1-tally-zoom-after.png` is a close-up of the Tally edge.

## Hygiene

- The dse worktree's `git status --porcelain` was empty before and after; HEAD is `c8880db`.
- The three scratch clones (`sc326-rr1-ad908/{base,head,guard}`) were removed and pruned.
- I killed no processes and ran nothing in the worktree while it was being rebased.
- Gates ran as one call each through `sc326-rr1-scratch-gate.sh`.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/`)

- **Gate logs:** `sc326-rr1-tsc.log`, `sc326-rr1-lint.log`, `sc326-rr1-jest.log`, `sc326-rr1-lifecycle.log`, `sc326-rr1-e2e.log`, `sc326-rr1-shots.log`, `sc326-rr1-freeze.log`, `sc326-rr1-parity.log`
- **Probe results:** `sc326-rr1-gate-canfail.log`, `sc326-rr1-lifecycle-GRV1-scratch.log`, `sc326-rr1-probes.log`
- **Screenshots:** `sc326-rv2-scott-before.png`, `sc326-rv2-scott-after-right.png`, `sc326-rr1-tally-zoom-after.png`
- **Scripts:** `sc326-rr1-scratch-{probe-press.mjs, probe-vert.mjs, canfail.py, canfail.sh, gate.sh, lc.sh, build.sh}`, plus review 1's `sc326-rv1-scratch-*` (the reachability probe, the evidence shooter and the fixture generator).
