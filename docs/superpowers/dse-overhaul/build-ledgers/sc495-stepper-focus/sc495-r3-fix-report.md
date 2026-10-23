# SC-495 r3 fix report

## Executive summary
- Verdict: DONE. LOW-A (keyboard vs pointer now read from the click event) and LOW-B (read-only "-" to min in real Obsidian) fixed.
- dse: branch `sc495-stepper-focus` head `c909c54` on origin/develop `9f08f06` (unmoved). Commits: `489407b` fix + jest + CTR-F02, `55a1bb8` ROLL-SF01 Edges "-", `c909c54` counter manifest row. Superproject `4cd1e12` on origin/main `3c7f392` (both unmoved, no CHANGELOG change). dse pointer unstaged.
- Gates on final head: tsc + tsc -p e2e clean; lint clean; jest 5860 passed / 1 skipped / 241 of 242 (base 5859 + 1 new); lifecycle 34/34; e2e 114/114 ok, 0 failed, 0 known-bug, coverage 79/79 pairs (78 + `counter.dec` click); shots 592, 0 FAIL; freeze OK 280/280; parity 0 / 0 / 24.
- Red/green: CTR-F02 red on c4b51ce (focus moved into `counter.input`), green after. Jest: 3 failed on c4b51ce stepper.ts, 55/55 after.
- One gate hiccup, fixed: the first full e2e run read 114/114 but exit 1 (coverage gate: `counter.dec x click` driven by CTR-F02 but not in the manifest); added the row (`c909c54`), rerun green rc 0.

## LOW-A
- `src/framework/kit/stepper.ts`: both buttons call `commit(current ± step, evt.detail === 0)`; `commit` and `render` take a `keyboard` flag; `render()` moves focus only when the button held focus, `keyboard` is true and the button is now disabled, with `{ preventScroll: true, focusVisible: true }`. The now-unused `showsFocusRing` (`:focus-visible` read) is removed; nothing else in the file used it. The typed-commit, setValue and mount paths pass no flag, so they move nothing. Comment updated (why `detail`, not the focus state: a note's click shield keeps the button's earlier keyboard focus through a mouse click).
- jest (`test/dom/kit/stepper.test.ts`): pointer cases dispatch `new MouseEvent('click', { detail: 1 })` (helper `pointerClick`), editable + read-only; new test "a POINTER click on a button that already holds KEYBOARD focus (:focus-visible) still moves nothing" (the LOW-A shape). The `ring()` helper is gone; keyboard cases use `click()` (detail 0). On c4b51ce source: 3 failed / 52 passed (the two pointer cases + the new one; `jest-r3-red.log`). Fixed: 55/55 (`jest-r3.log`).
- e2e `[CTR-F02]` (`e2e/specs/counter/counter-focus.e2e.ts`): Tab to `counter.dec` (keyboard focus), real MOUSE click to 0 (1 write, note 0), focus is not `counter.input`, three wheel notches over the number plus a click on the note title cause no further write (`expectNoWrite`), value stays 0, note still 0. On c4b51ce stepper.ts: FAIL `Expected: not "counter.input"` (`e2e-ctrf02-red.log`); fixed: ok.

## LOW-B
`[ROLL-SF01]` now also steps Edges "-" with Enter from 9 down to 0: focus is `roll.edges.value` (SPAN, `tabindex="-1"`, `:focus-visible`, outline solid 2px), next Tab is `roll.edges.inc`; then Banes "+" to 9 as before. Manifest `roll.edges.dec` press:Enter added (`e2e/manifest/roll-bar.ts`). Title/describe reworded.

## Gate summary lines (final head c909c54; logs `.../sc495-r3-impl-v6p2/final/`)
- tsc (`g-tsc.log`) rc 0; lint (`g-lint.log`) rc 0.
- jest (`g-jest2.log`, after shots): `Tests: 1 skipped, 5860 passed, 5861 total` / `Test Suites: 1 skipped, 241 passed, 241 of 242 total` (the earlier pre-shots run was identical).
- lifecycle (`g-life.log`, port 9295): `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed`.
- e2e (`g-e2e.log`): `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`, rc 0 (first attempt kept as `g-e2e-first-gatefail.log`).
- shots (`g-shots.log`): rc 0, 592 PNGs, 0 FAIL. freeze (`g-freeze.log`): `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`. parity (`g-parity.log`): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Drive-by fixes:
None.

## Follow-ups:
None new. Note: any programmatic `button.click()` has `detail === 0` and counts as keyboard, so scripted/test clicks move focus the way a keypress does (real pointer clicks, including wdio's, carry `detail >= 1`).

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r3-impl-v6p2/`: `jest-r3.log`, `jest-r3-red.log`, `e2e-only-green.log`, `e2e-ctrf02-red.log`, `final/g-*.log` + `.rc`, `final/g-e2e-first-gatefail.log`.
