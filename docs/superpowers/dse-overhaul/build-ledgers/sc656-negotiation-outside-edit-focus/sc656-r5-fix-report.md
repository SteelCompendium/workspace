# SC-656 r5 fix report

## Executive summary
- STATUS DONE. dse branch `sc656-negotiation-outside-edit-focus`, head `57d57a03` (docs-only on top of `d3709719`), base unchanged: origin/develop still `bab0dbb2` after fetch, no rebase. Not pushed; superproject untouched.
- MED-A, LOW-A, LOW-B folded (table below). `d3709719` = fix + tests; `57d57a03` = architecture.md row.
- Tests: jest +6 (OE27, OE28 x3 [pointerdown, keydown, wheel], OE29, OE30; file = 32 tests); e2e +3 (NEGO-O17, O18, O19); NEGO-O01/O05 notice count fixed.
- Red on bdab956e: jest 5 (OE27, OE28 x3, OE30; OE29 is the over-clearing guard and passes there); e2e 3 (O17, O18, O19); O01/O05 pass either way (LOW-B is a flake fix).
- Mutants: 6 run, all killed (A1 no pointerdown, A2 no keydown, A3 no wheel, A4 no focusout, A5 focusout clears when detached, B1 no root fallback).
- Gates at head: tsc/lint rc 0 · jest `1 skipped, 13639 passed` (13633+6) · e2e `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (643+3, no flake) · lifecycle 64/64 in seven parts (21/16/9/4/7/4/3).
- Shots/freeze/parity not re-run: no CSS, kit or static DOM builder changed.
- Shared files: `windowHandoff.ts` one guard in `focusSuccessor` (silent path only). Initiative/montage unchanged.

## Finding -> fix -> test
| finding | fix | tests |
|---|---|---|
| MED-A stale `atChange` + re-render without modify pulls focus in | reviewer's candG diff applied at the first `onMount`: document capture listeners `pointerdown`, `keydown`, `wheel` set `atChange = null`; root `focusout` clears it one microtask later when the root is connected and focus is not inside it. No timer | jest OE27 (blur to page after modify, then unload with a card at the slot: 0 hand-offs), OE28 x3 (each input type), OE29 (nothing in between: the modify's memory is still used, 1 hand-off); e2e NEGO-O17 (chip press, click away, `previewMode.rerender` -> nothing in a card), NEGO-O18 (long note, top card pressed, wheel+scroll away, rerender -> no focus in the bottom card) |
| LOW-A outside `collapsed: true` hides the focused control -> body | `focusSuccessor`: when `o.silent` and `focusControl(target)` is false and target is not the root, focus the card root (`tabindex=-1`). Initiative/montage unchanged | jest OE30 (focus refused on the target -> root); e2e NEGO-O19 (Complete focused, tier chosen, outside `collapsed: true` -> focus on the card root `DIV`) |
| LOW-B O01/O05 count Obsidian's own Notices | `noticeCount` counts only Notices whose text is the DSE window Notice | O01, O05 (green in full run) |

## Red on bdab956e (view.ts + windowHandoff.ts reverted, restored, status clean)
- jest `jest-vs-bdab956e.log`: `5 failed, 27 passed` of 32: OE27, OE28 (pointerdown), OE28 (keydown), OE28 (wheel), OE30.
- e2e `e2e-vs-bdab956e.log`: `2/5 ok, 3 failed`: O17, O18, O19 red; O01, O05 pass.

## Mutants (jest: negotiation-outside-edit + negotiation-matrix + initiative/montage outside-edit, 518 tests)
| mutant | result |
|---|---|
| A1 no `pointerdown` listener | OE28 (pointerdown) |
| A2 no `keydown` listener | OE28 (keydown) |
| A3 no `wheel` listener | OE28 (wheel) |
| A4 no `focusout` clear | OE27 |
| A5 `focusout` clears even when the card left the document (drops the `isConnected` check) | 13 red (OE01-07, 13, 14, 16, 19, 22, 23) |
| B1 root fallback removed | OE30 |
Source restored after each (status clean). `mutants.out`, `mut-*.log`.

## Gates
- tsc `g-tsc.log` rc 0; lint `g-lint.log` rc 0.
- jest `g-jest.log`: `Tests: 1 skipped, 13639 passed, 13640 total`.
- e2e `e2e-full.log`: `OBSIDIAN-E2E done: 646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`.
- lifecycle (`lc-part1..7.log`): 21/21, 16/16, 9/9, 4/4 (G-S61 green), 7/7, 4/4, 3/3 = 64/64.
- Shots / freeze / parity: not re-run; `styles-source.css`, kit and DOM builders untouched.

## Shared files touched
- `src/framework/chrome/windowHandoff.ts`: one guard in `focusSuccessor` (`!focusControl(...) && o.silent && target !== root` -> root fallback). Silent path only.
- Negotiation-only: `src/elements/negotiation/view.ts` (+14, the candG hunk). Not touched: SC-662's files.

## Drive-by fixes
None.

## Follow-ups
None new. (O18 and the earlier long-note tests create a runtime note, `Negotiation/long-rerender.md`, `long-top-bottom.md`; the driver clears them with the next `openNote`.)

## Logs (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r5-impl/)
tsc1.log, jest-new1.log, mutants.out, mut-*.log, jest-vs-bdab956e.log, e2e-vs-bdab956e.log, e2e-new.log, g-tsc.log, g-lint.log, g-jest.log, e2e-full.log, lc-part1..7.log
