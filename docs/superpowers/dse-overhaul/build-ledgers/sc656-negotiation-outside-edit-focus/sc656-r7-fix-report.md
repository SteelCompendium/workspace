# SC-656 r7 fix report

## Executive summary
- STATUS DONE. dse branch `sc656-negotiation-outside-edit-focus`, head `d62f0b26` (docs commit on top of `c4592178`). origin/develop still `bab0dbb2` after fetch; no rebase. Not pushed; superproject untouched.
- LOW-C folded: reviewer's `candG-input-scope.diff` applied to `view.ts` (keydown/pointerdown drop `atChange` only when the card is on the page AND the input target is outside it; wheel drops whenever the card is on the page).
- LOW-D folded: jsdom OE33 (host knows `lastKnownBody`, redrawn card content differs, no Notice). INFO folded: product comments say SC-656, no "CANDIDATE" labels left.
- Tests: jest +3 (OE31, OE32, OE33; file = 35 tests). No new e2e (ruling allowed jsdom).
- Red: OE31 and OE32 red on 57d57a03 (view.ts reverted, restored); OE33 red with mutant Z6 (`!o.silent` guard in `act` removed). OE27/OE28 (MED-A) stay green.
- Gates at head: tsc/lint rc 0 · jest `1 skipped, 13642 passed` (13639+3) · e2e `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (no flake) · lifecycle parts 4 and 7: 4/4 and 3/3 (the delta is `view.ts` + tests + a docs line only; no `windowHandoff.ts` change).
- Shots/freeze/parity not re-run: no CSS, kit or static DOM change.
- Shared files: none touched this round (`windowHandoff.ts` only temporarily mutated for Z6, restored).

## Finding -> fix -> test
| finding | fix | tests |
|---|---|---|
| LOW-C a key or pointer press in the gap between the modify and the Reading view unload cancels the hand-off (r5 regression) | `dropOnInput`: `if (root.isConnected && (evt.type === 'wheel' \|\| !root.contains(evt.target))) drop()`, registered for pointerdown/keydown/wheel on `root.ownerDocument` (capture); a pointer press elsewhere on the page may still drop (user acted elsewhere: accepted by ruling) | OE31 (key dispatched ON the focused chip between modify and redraw -> same chip), OE32 (key and pointer on the page while the old root is already out of the document -> hand-off still lands); MED-A tests OE27/OE28 unchanged and green |
| LOW-D `!o.silent` guard in `act` untested | OE33: mount with `lastKnownBody` set on old and redrawn card (contents differ), assert focus lands and `Notice.notices` is `[]` | OE33; mutant Z6 red |
| INFO `R4 CANDIDATE` label | reworded to SC-656 (both comments) | n/a |

## Red / mutants
- vs 57d57a03 (`jest-vs-57d57a03.log`): `2 failed, 33 passed` of 35: OE31, OE32.
- Z6 (`if (!noticed && !o.silent && mounted...` -> without `!o.silent`; `jest-z6.log`): `1 failed, 34 passed`: OE33. Source restored (`git status` clean, `vs-x.log`).

## Gates
- tsc `g-tsc.log` rc 0; lint `g-lint.log` rc 0.
- jest `g-jest.log`: `Tests: 1 skipped, 13642 passed, 13643 total`.
- e2e `e2e-full.log`: `OBSIDIAN-E2E done: 646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`.
- lifecycle `lc-part4.log` 4/4 (G-S61 green), `lc-part7.log` 3/3.

## Drive-by fixes
None.

## Follow-ups
None.

## Logs (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r7-impl/)
tsc1.log, jest-new1.log, jest-vs-57d57a03.log, jest-z6.log, z6-diff.log, vs-x.log, g-tsc.log, g-lint.log, g-jest.log, e2e-full.log, lc-part4.log, lc-part7.log
