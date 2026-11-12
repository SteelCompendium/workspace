# SC-609 r1 implementer report

## Executive summary
- STATUS: DONE (two edge cases left as follow-ups, below). Base dse develop `231f2a3b` (origin/develop unchanged at start).
- dse branch `sc609-roster-click-focus` HEAD `e2537b215c5d8575c4aa564e2e7987333a06d286` (3 commits: fix+jest `00ab6d5d`, e2e `02d65c0e`, changelog `e2537b21`).
- Superproject branch `sc609-roster-click-focus` HEAD `1152d1ec91a3f01adae21d5e8fc8f745698e4b0d` (workspace CHANGELOG.md Unreleased entry only; submodule pointer NOT bumped, still shows ` M draw-steel-elements`).
- Gates: tsc clean, lint clean (rc 0) · jest 10715 passed / 2 skipped (base 10711 + 4 new) · lifecycle 60/60 (21+16+9+4+7+3) · e2e 280/284 ok, 0 failed, 4 known-bug, coverage 171/171 pairs · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 (0 FAILED) · parity 0 gaps / 0 undeclared / 24 declared.
- Fix: in the roster cell's `onClick` (`view.ts`), remember whether focus was inside the tracker before the detail row is swapped; after the swap, if focus is on body, focus the pressed cell (plain focus for a mouse press, ring only for a keyboard click).
- Ruling nuance: the pressed cell is NOT rebuilt by a selection (only the detail row is), so focus goes to the same, surviving cell, not a "replacement".

## Diagnosis (file:line, base 231f2a3b)
- The ticket's "tracker rebuilds" is imprecise: a roster-cell click does not do a whole-tracker rebuild. `src/elements/initiative/view.ts:1828-1857` (cell `iconButton` `onClick`) repaints the grid in place and calls `detailRowContainer.empty()` (`:1844`) then `buildDetailedCreatureRow`. The focused detail-row Stamina control (`init.detail.stamina`, built at `:2016`) is inside that container and is destroyed; focus falls to `<body>`.
- Why SC-588's restore does not cover it: `controlFocus.ts` capture/restore (`src/framework/kit/controlFocus.ts`) is only called from `rebuildAndPersist` (`view.ts:274-278`), `rebuildFromWrittenReset` (`:306-336`), the outside-refresh `update` (`:172-174`) and `openModal`/`giveFocusBack` (`:231`, `:258-261`). The selection path is a sub-container rebuild that calls none of them.
- Why the pressed cell does not hold focus already: `armClickShield` (`src/framework/pipeline.ts:195`, `stop` at `:247-262`) preventDefaults the non-editable pointerdown/mousedown, so the browser never focuses the cell.
- Reproduced in real Obsidian before the fix: INIT-F13 red on base, received `{cell:null, ctl:null, inTracker:false}` (log `e2e-base-f13.log`).

## The fix
`src/elements/initiative/view.ts`, cell `onClick(evt)`:
- Before the repaint/rebuild: `const focusWasInside = captureControlFocus(this.rootEl, FOCUS_FAMILIES) !== null;` (reuses the SC-588 "was focus inside the root" test; nothing happens when focus was outside: SC-588 "a click never pulls focus in").
- After `buildDetailedCreatureRow`: `if (focusWasInside && focusIsFree(doc)) focusControl(handle.buttonEl, isKeyboardClick(evt));` (helpers from `framework/chrome/focusHandoff.ts`; new import line). `focusIsFree` means focus on a control the click does not replace (e.g. Advance round) is left alone. Ring: a mouse press (`detail >= 1`) gets plain focus, a keyboard click keeps the ring.
- Shield not touched; no change to Conditions window, hover-preview pin/+/-, `managedModal.ts`.

## Survey of other mouse-press paths (scratch e2e probes, not committed; log `e2e-survey.log`)
- Whole-tracker rebuilds via `rebuildAndPersist` (Advance round `view.ts:348`, Reset turns `:360`, quick-add `:795`, captain make/relieve `:1509`, pool edits `:1873/:1994/:2111`): focus inside, mouse press. Probes S01 (focus on detail Stamina, press Advance round) and S04 (focus on detail Stamina, press Make captain): focus ends on the rebuilt `init.detail.stamina` (inside the tracker, not body). Not this bug; no change. Note: it lands on the previously focused control's successor, not the pressed control's.
- LEFT, follow-up A (different mechanism): condition remove. Focus on `init.cond.add` (keyboard), mouse press on `init.cond.remove`: probe S02 ends on `<body>`. Cause `buildConditionRow` -> `conditionsEl.empty()` (`view.ts:2215`) via `onRemove` -> `rerender` (`:2236`/`:2262`); the pressed control has no successor (the chip is deleted), so the "focus on the replacement of the pressed control" rule does not apply; it needs a capture-and-restore of the focused control inside that container (SC-603's `giveFocusBack` mechanism, not a press rule).
- LEFT, follow-up B (shield blurs first): focus in the Malice quick-add amount input (editable), mouse press on a roster cell: probe S03 ends on `<body>`. The click shield's `stop` handler (`pipeline.ts:~253-259`) deliberately blurs a focused editable control on pointerdown (click-away saves), so by the time `click` runs focus is already on body and `captureControlFocus` returns null. Fixing it needs an earlier capture (pointerdown, ancestor of the root's capture listener) or a shield change (SC-458 territory). I did not do it.

## Tests added
- jest, `test/dom/elements/initiative-matrix.test.ts`, section [F] (ids F19-F22 free before): F19 focus on detail Stamina + mouse press on cell 0-3: cell holds focus, old control detached, selection happened; F20 plain focus, no forced ring (`focus({preventScroll:true})`, never `focusVisible`); F21 focus outside the tracker is not taken (and body stays body); F22 focus on a surviving control (Advance round) stays.
- Red on base (fix reverted via `git checkout` of view.ts, log `jest-base-red.log`): `Tests: 2 failed, 187 skipped, 2 passed` (F19 and F20 red; F21/F22 are guards that pass on both). Green with fix: `jest-fix-green.log` 4 passed.
- e2e `e2e/specs/initiative/focus-after-cell-press.e2e.ts` (new ids INIT-F13, INIT-F14, grepped unused; no bracketed ticket id in titles): F13 Tab to detail-row Stamina, real press on roster cell 0-3, assert `document.activeElement` is the cell (`init.cell.stamina`, key 0-3, in tracker); F14 focus on note body, real press: focus unchanged (not pulled in); its comment names SC-458 as the ticket that flips it. F13 red on base (`e2e-base-f13.log`), both ok after (`e2e-fix-f13.log`).

## Gate lines (all in `.../scratchpad/sc609-r1-impl/`)
- tsc: `tsc_rc=0` (`gate-tsc.log`); lint: `lint_rc=0` (`gate-lint.log`).
- jest fresh (`rm -f main.js styles.css` first): `Test Suites: 1 skipped, 266 passed, 266 of 267 total / Tests: 2 skipped, 10715 passed, 10717 total`, `jest_rc=0` (`gate-jest.log`). Stack traces in the log are existing tests' expected thrown-error output.
- lifecycle: part1 `done: 21/21 ok, 0 failed`; part2 `16/16`; part3 `9/9`; part4 `4/4`; part5 `7/7`; part6 `3/3`; all rc=0 (`gate-lc1.log` ... `gate-lc6.log`). Union 60/60.
- e2e: `OBSIDIAN-E2E done: 280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc=0 (`gate-e2e.log`). Delta vs base 278/282: +2 ok / +2 total = INIT-F13, INIT-F14; pairs unchanged.
- shots: 592 files, 0 FAIL, host-leak 163 kinds/978 comparisons, modal host-leak 39/234, capture clip 147, rc=0 (`gate-shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`gate-freeze.log`).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc=0 (`gate-parity.log`).
- No deltas from base other than jest +4 (new tests) and e2e +2.

## Changelogs
- `draw-steel-elements/CHANGELOG.md`: `[FIX]` bullet at top of the 7.0.0 (unreleased) list; names two not-covered cases (quick-add box, condition removal).
- Workspace `CHANGELOG.md` `## Unreleased` bullet (superproject commit `1152d1ec`).

## Drive-by fixes:
none.

## Follow-ups:
- A: focus lost to body after a mouse press on a condition remove when focus was on another control in the same conditions container (`view.ts:2215` `conditionsEl.empty()`); needs capture/restore in the conditions-row rebuild (SC-603 mechanism).
- B: focus in an editable tracker control (quick-add inputs, title editor) then a mouse press on a roster cell: shield blurs the input at pointerdown, so focus is on body and the SC-609 fix cannot see it was in the tracker. Needs an earlier capture or a shield change; overlaps SC-458.
- Ruling nuance for the owner: if focus is on a surviving tracker control (Advance round) and the user presses a roster cell, focus stays on that control (browser default would move it to the cell); matches SC-458's "not yet" scope and is pinned by jest F22.
- Observation: the full-tracker rebuild paths restore the previously focused control, not the pressed one (probes S01/S04); fine today, relevant if SC-458 lands.
