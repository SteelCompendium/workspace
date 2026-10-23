# SC-495 r2 fix report

## Executive summary
- Verdict: DONE. All three fixes landed: MEDIUM-1 (pointer press moves nothing), LOW-1 (CHANGELOG reworded), LOW-2 (real-Obsidian read-only stepper test).
- dse: branch `sc495-stepper-focus` head `c4b51ce` (`58221aa` MEDIUM-1 fix + jest + SF03, `c4b51ce` roll-bar e2e) on origin/develop `9f08f06` (unmoved).
- Superproject: `4cd1e12` (CHANGELOG reword) on origin/main `3c7f392` (moved from `6a176e6`; rebased my one commit, no conflict). dse pointer left unstaged.
- Gates on final head: tsc + tsc -p e2e clean; lint clean; jest 5859 passed / 1 skipped / 241 of 242 suites (after a shots run; test count unchanged: pointer tests rewritten in place); lifecycle 34/34; e2e 113/113 ok, 0 failed, 0 known-bug, coverage 77/77 pairs (73 + 4 new roll-bar pairs); shots 592, 0 FAIL; freeze OK 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- SF03 red on 247bd27, green after fix (also red on the wheel check alone: value 0 -> 3 on 247bd27). Roll-bar test red under both mutations (no `tabindex="-1"`; no `.dse-stepper__value:focus-visible` rule).
- rollBar/rollController gained attributes only (`control` ids); shots and freeze did not move.

## 1. MEDIUM-1: pointer press moves nothing
- `src/framework/kit/stepper.ts` `render()`: focus moves only when the button held focus AND was `:focus-visible` before it disabled (keyboard), with `{ preventScroll: true, focusVisible: true }`. A pointer press (not `:focus-visible`) moves nothing, for editable and read-only steppers. Comment now says why (a focused number field takes the mouse wheel; a field focused by a tap raises the phone soft keyboard) and drops the wrong "next Tab starts at the top" claim.
- jest `test/dom/kit/stepper.test.ts`: the two pointer tests (editable, read-only) now assert `focus` is never called and the value node is not active; the describe comment says so. On the unfixed r1 code: 2 failed / 52 passed (log `.../sc495-r2-impl-m3q8/jest-r2-red.log`); fixed: 54/54 (`jest-r2-green.log`).
- e2e `[STAM-SF03]`: 5 mouse clicks take Temp "-" to 0; focus is NOT `sedit.temp.input`; then three real wheel notches over the number field leave the value 0 and the Apply label unchanged. On 247bd27: FAIL at the focus assertion (`e2e-sf03-red.log`); with that one assertion removed, FAIL on the wheel alone (`Expected "0", Received "3"`, `e2e-sf03-wheelonly.log`). After the fix: SF01/SF02/SF03/CTR-F01 4/4 ok (`e2e-sf03-green.log`).

## 2. LOW-1: CHANGELOG
Reworded in the worktree's `CHANGELOG.md` (superproject commit `4cd1e12`): keyboard use, what was actually lost (Enter/Space did nothing, outline vanished, screen reader lost place), names Edges and Banes, no Malice, no "restarted at the top" claim, "Using the mouse behaves as before".

## 3. LOW-2: read-only stepper in real Obsidian
- New `[ROLL-SF01]` in `e2e/specs/roll-bar/roll-bar-stepper-focus.e2e.ts`: `rollingEnabled` pref on/off, `ds-feature` fixture `e2e/vaults/shipped/Feature/feature.md`, click Roll, open Modifiers, Tab to Edges "+" and Enter x9, assert focus is the value SPAN (`roll.edges.value`), `tabindex="-1"`, `:focus-visible`, computed outline `solid` 2px; Tab -> `roll.banes.inc`; Shift+Tab -> `roll.edges.dec` (the span is skipped, so it is not a Tab stop); then Banes "+" x9 to 9 -> `roll.banes.value` with the same ring, Shift+Tab -> `roll.banes.dec`.
- Ids (attributes only): `roll.edges` / `roll.banes` stepper prefixes (`rollBar.ts`), `roll.modifiers` on the Modifiers header (`rollBar.ts`), `roll.launch` on the launch button (`feature/rollController.ts`). New manifest `e2e/manifest/roll-bar.ts` (roll.launch click, roll.modifiers click, roll.edges.inc press:Enter, roll.banes.inc press:Enter) = 4 new pairs, all driven; coverage Y/Y 77/77.
- Mutations (each reverted afterwards, tree clean): (M3) `tabindex="-1"` line commented out -> ROLL-SF01 FAIL (`Expected "roll.edges.value", Received null`, `e2e-roll-m3.log`); (M7) `.dse-stepper__value:focus-visible,` removed from the shared ring rule -> FAIL (`outline: "solid"` expected, `"none"` received, `e2e-roll-m7.log`). Unmutated: ok (`e2e-roll.log`).

## Gate summary lines (final head c4b51ce; logs `.../sc495-r2-impl-m3q8/final/`)
- tsc (`g-tsc.log`) rc 0; lint (`g-lint.log`) rc 0.
- jest (`g-jest2.log`, after shots): `Tests: 1 skipped, 5859 passed, 5860 total` / `Test Suites: 1 skipped, 241 passed, 241 of 242 total`.
- lifecycle (`g-life.log`, port 9295): `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed`.
- e2e (`g-e2e.log`): `OBSIDIAN-E2E done: 113/113 ok, 0 failed, 0 known-bug, coverage: 77/77 pairs`.
- shots (`g-shots.log`): rc 0, 592 PNGs, 0 FAIL.
- freeze (`g-freeze.log`): `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- parity (`g-parity.log`): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Drive-by fixes:
None.

## Follow-ups:
- `roll.launch` is stamped on every effect's launch button; a feature with several rolls repeats the id (the test uses a one-effect fixture; `dse.block` scopes to the block). The `ds-roll` element also mounts the same rollBar, so its Edges/Banes/Modifiers now carry the ids too (attributes only).

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r2-impl-m3q8/`: `jest-r2-red.log`, `jest-r2-green.log`, `e2e-sf03-red.log`, `e2e-sf03-wheelonly.log`, `e2e-sf03-green.log`, `e2e-roll.log`, `e2e-roll-m3.log`, `e2e-roll-m7.log`, `final/g-*.log` + `.rc`.
