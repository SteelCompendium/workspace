# SC-495 r1 implementer report

## Executive summary
- Verdict: DONE. A kit stepper now hands focus to its value node when a focused "-"/"+" disables itself at its bound (editable: the `<input>`; read-only: `.dse-stepper__value`, `tabindex="-1"`, not a tab stop). Never the opposite button. Ring follows the input (keyboard true, pointer false).
- dse: branch `sc495-stepper-focus` head `247bd27` (`c1f65e0` fix + jest + CSS ring, `247bd27` e2e), rebased onto origin/develop `9f08f06` (no conflicts). Superproject `64464bf` (CHANGELOG bullet) on origin/main `6a176e6`; one hand-resolved CHANGELOG conflict (kept both bullets, ours first). dse pointer left unstaged.
- Gates on final head: tsc + tsc -p e2e clean; lint clean; jest 5859 passed / 1 skipped / 241 of 242 suites (base 5847 + 12 new); lifecycle 34/34 ok; e2e 112/112 ok, 0 failed, 0 known-bug, coverage 73/73 pairs (base 108 + 4; pairs 69 + 4); shots 592, 0 FAIL; freeze OK 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- CSS added: YES (one selector, `.dse-stepper__value:focus-visible`, joined to the kit's shared focus-ring rule; no new token). Measured: without it the focused read-only value node has `outline: none`; with it `solid 2px` ring. Owner may want a screenshot for Scott: `.../sc495-r1-impl-x7k2/ring-malice.png` (ring on initiative Malice value) vs `ring-malice-nocss.png`.
- G-S35: NO (the e2e harness drove an in-note stepper write: `ds-counter`).
- New e2e control stamps: `ds-counter` stepper now has `control: 'counter'` (`counter.dec/.input/.inc`), new manifest `e2e/manifest/counter.ts`, new fixture `e2e/vaults/shipped/Counter/counter.md`.

## What changed (dse)
- `src/framework/kit/stepper.ts`: `render()` captures, before `setDisabled`, whether a +/- button is `document.activeElement` and whether it shows `:focus-visible`; after applying the bound state, if that held button is now `disabled`, focuses `inputEl ?? valueEl` with `{ preventScroll: true, focusVisible }`. Read-only value node gets `tabindex="-1"`. Local `showsFocusRing` (same try/catch shape as StaminaEditModal/adoptView).
- `styles-source.css`: `.dse-stepper__value:focus-visible` added to the shared ring rule (one-rule contract kept); `test/dom/kit/kit-index.test.ts` list gets the new selector.
- `src/elements/counter/view.ts`: `control: 'counter'` (attribute stamps only).
- Tests: `test/dom/kit/stepper.test.ts`, e2e `e2e/specs/stamina-bar/stamina-modal-stepper-focus.e2e.ts`, `e2e/specs/counter/counter-focus.e2e.ts`; manifests `e2e/manifest/{counter,stamina-edit-modal}.ts` (added kinds: `sedit.stamina.inc` press:Enter, `sedit.temp.dec` press:Enter, `sedit.temp.input` press:Enter, `counter.dec` press:Enter).

## Survey
1. Activity order: `commit()` does `current = next; render(); opts.onChange(current)`. `render()` (where the disable happens, and now the focus move) runs BEFORE the caller's `onChange`, so the focus move happens while the stepper DOM is live and before any note write/redraw. Across the in-note redraw, `adoptView` captureFocus/restore keeps the same element (adoption moves the existing root; restore only acts when activeElement is body). Proven in real Obsidian: e2e CTR-F01 (counter): Enter on "-" 1 -> 0, exactly 1 write, note `current_value: 0`, after settle focus is `counter.input` with ring true, next Tab lands on `counter.inc`.
2. Value-node ring: NO existing CSS gave it one. Measured in real Obsidian 1.14.4 on the initiative Malice value (a `renderValue` caller, SC-377 caption+numeral): without my rule `outline: none 3px`; with it `solid 2px rgb(77,184,199) offset 2px`, `:focus-visible` true. Screenshot `ring-malice.png` shows the ring around the Malice node, looks right. Note: scratch-only probe (a throwaway spec, deleted, not committed). Malice is unbounded, so I focused it programmatically with `focusVisible: true` for this measurement. A bounded read-only in-note stepper does not exist in shipped specs (ds-roll was not rendering in the e2e vault; all `editable: canPersist` steppers are inputs when writable).
3. Screen readers: the value node already has `aria-live="polite"`; the render happens in the same press as before (same live announcement). Focus adds one focus announcement of the node's content ("Malice 3" style via the group label), which for a polite live region is at worst a repeated value, not a conflicting one. I did not add ARIA. Editable path: the input already carried `aria-live` and is the same element as before.
4. Pointer path: ring state is read from `held.matches(':focus-visible')` on the BUTTON before it is disabled (same method as SC-465 `showsFocusRing` / adoptView `captureFocus`). Real Obsidian: keyboard Enter -> ring true (SF01, SF02, CTR-F01), mouse click -> ring false (SF03). Mouse click focuses the button on Linux Chromium and drops it to body today; the rule applies to both.
5. No spurious writes: jest "blurring the input after the focus move commits nothing" (onChange stays at 1 = the press itself); e2e SF01 presses Enter on the focused input at 0 and the value stays 0.
6. `stepper(` call sites: `src/framework/kit/rollBar.ts:134` (characteristic, editable), `:151` Edges / `:159` Banes (read-only, format capped), `src/elements/party/view.ts:119` and `:177` (editable: canPersist), `src/elements/tokens/view.ts:26` (editable: canPersist), `src/elements/counter/view.ts:39` (editable: canPersist), `src/elements/surges/panel.ts:44` (editable: canPersist), `src/elements/resource/panel.ts:48` (editable: canPersist), `src/elements/initiative/view.ts:411` (read-only Malice, unbounded min/max so never disables), `src/views/StaminaEditModal.ts:148` (staminaStepperRow, editable) and `:525` (Temporary Stamina, editable). No call site works around the loss locally (grep of every `.focus(` in `src/`); nothing removed. `focusNeighbourStop` in StaminaEditModal untouched.

## Tests and red-on-unfixed evidence
jest `test/dom/kit/stepper.test.ts` describe "SC-495" (12 tests incl. test.each): "-" to min, "+" to max, pointer ring false, (each editable + read-only); a press not reaching the bound leaves focus; no move when the button did not hold focus (setValue, typed commit, opposite button focused); min===max (clampInitial:false) editable + read-only; `tabindex="-1"` on the read-only node and tab order = [dec, inc], input has no tabindex; blur after move fires no onChange. Unfixed `stepper.ts` + new tests: 10 failed / 44 passed (failures = all the behaviour tests; the 2 regression pins "press not reaching the bound" and "no move when not focused" pass on both). Log `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r1-impl-x7k2/jest-stepper-red.log`. Fixed: all pass (kit dir 418/418).
e2e (real keys, real Obsidian 1.14.4): `[STAM-SF01]` Temp Stamina "-" with Enter x5 to 0 -> focus `sedit.temp.input`, ring true, value 0, extra Enter on input leaves 0, next Tab -> `sedit.temp.inc`; `[STAM-SF02]` Stamina "+" to 20 -> `sedit.stamina.input`, ring true, Tab stays in modal; `[STAM-SF03]` mouse clicks to 0 -> input, ring false; `[CTR-F01]` in-note counter (above). With stepper.ts restored to `53e1e48`: all 4 FAIL (focusedControl expected the `.input` id, received null = body), rc=1. Log `.../sc495-r1-impl-x7k2/e2e-only-baseline.log`; fixed run `e2e-only-fixed.log` (4/4 ok).

## Gate summary lines (final head 247bd27, base 9f08f06; logs in `.../sc495-r1-impl-x7k2/final/`)
- tsc (`g-tsc.log`): rc 0, clean (incl. `tsc -p e2e`). lint (`g-lint.log`): rc 0, clean.
- jest (`g-jest2.log`, after shots): `Tests: 1 skipped, 5859 passed, 5860 total` / `Test Suites: 1 skipped, 241 passed, 241 of 242 total`.
- lifecycle (`g-life.log`, port 9295): `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed`.
- e2e (`g-e2e.log`): `OBSIDIAN-E2E done: 112/112 ok, 0 failed, 0 known-bug, coverage: 73/73 pairs`.
- shots (`g-shots.log`): rc 0, 592 PNGs, 0 FAIL; host-copy pin OK; button host-leak OK (113 kinds, 678 comparisons); modal button host-leak OK (10 scenarios, 38 kinds, 228).
- freeze (`g-freeze.log`): `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- parity (`g-parity.log`): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
(An earlier full battery on pre-rebase head `6ff2e30`/base `53e1e48` was also green: jest 5852 post-shots, lifecycle 33/33, e2e 112/112 73/73, shots 592, freeze 280/280, parity 24 declared; superseded by the final run above.)

## Drive-by fixes:
None.

## Follow-ups:
1. e2e covers the "+" bound only on the Stamina modal; no shipped in-note stepper exercises the read-only value-node path (Malice is unbounded; rollBar Edges/Banes need the experimental roll element, which did not render in the e2e vault). The read-only path is covered by jest and by the one-off ring probe only.
2. Clicking a read-only stepper's value node with the mouse now focuses it (tabindex=-1), with no ring (not `:focus-visible`). Harmless, noted for the reviewer.
3. The superproject worktree's `draw-steel-elements` pointer shows modified (unstaged on purpose, per brief).

## Evidence paths
Scratch root `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r1-impl-x7k2/`: `jest-stepper-red.log`, `e2e-only-fixed.log`, `e2e-only-baseline.log`, `ring-malice.png`, `ring-malice-nocss.png`, `scratch-ring.log`, `scratch-ring-nocss.log`, `final/g-{tsc,lint,jest,jest2,life,e2e,shots,freeze,parity}.log` (+ `.rc`).
