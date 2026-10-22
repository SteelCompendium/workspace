# SC-279 r4 fix round

## Executive summary
- DSE head `12aad64` (branch `sc279-roll-ux`; base unchanged, origin/develop still `f8693b5`, no rebase). Superproject head `a2740db` (DESIGN.md only; submodule pointer not bumped).
- Per-finding: HIGH-1 FIXED `aa51688`; LOW-4 FIXED `8d806c6`; MEDIUM-1, LOW-1, LOW-2, LOW-3 FIXED `12aad64`; LOW-5 FIXED superproject `a2740db`. Out-of-scope items untouched.
- Gates: tsc clean; lint clean (exit 0); jest 4392 passed / 1 skipped / 215 of 216 suites (r2: 4387, +5); lifecycle 25/25 ok; shots 580 ok, 0 FAIL (two full runs); parity 0 gaps / 0 undeclared / 24 declared.
- Freeze: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `roll--steel-print.png` + `roll--steel-realprint.png`, both runs. Their hashes are UNCHANGED from r2, so `sc279-rebaseline.txt` stands as-is (diffed). The 12 new screen-only shots are byte-identical across the two runs.
- Negative check: the two new HIGH-1 tests fail with `renderFeature.ts` reverted to HEAD (2 failed), pass with the fix.

## Fixes
- HIGH-1 (`renderFeature.ts`, `statblock/view.ts`, `featureblock/view.ts`): `renderFeatureList` wraps `opts.roll.session` per listed feature with an `f<i>::` prefix (`namespacedRoll`). Because statblock (villain band: `rest` + `villains` calls) and featureblock (one call per level run) render the list in several calls, a new `RenderFeatureOptions.rollIndices` (parallel to `configs`) carries each feature's position in the WHOLE list so keys stay stable; statblock uses `configs.indexOf`, featureblock a running offset. The nested-features call clears `rollIndices` (it addressed the outer list) and its stale "acceptable collision" comment is replaced; nested keys now compound (`f0::f0::`). Single `ds-feature` (not via the list) keeps un-prefixed keys. Tests (feature-roll.test.ts): statblock fixture, and a 3-ability featureblock in level runs 0/1/0, A rolled with an edge + strip opened, then B (and C) first-click: strips collapsed, no edge in summary or breakdown, A keeps its state.
- MEDIUM-1 (`rollBar.ts`): Reset records whether it had focus, and if so focuses the Modifiers header after `setState`. Tests: focused Reset -> header focused; unfocused (skill checkbox focused) Reset does not steal focus.
- LOW-4 (`roll/view.ts`): `mainAction: last?.mainAction ?? model.mainAction` (`defaults` still carry the authored value). Test: tick Main action, Roll, rebuild a new view over the same session -> checked, summary "main action".
- LOW-1 (CSS): `.dse-rollbar .dse-stepper__input { box-sizing:border-box; height: var(--dse-control-min, var(--dse-touch-min)) }`. Measured: all three steppers y=362, button rects 23.8px, aligned (was Reason 2.7px low).
- LOW-2 (CSS): `.dse-rollbar__reset { padding-inline-start: 0 }`; icon x 64.6 vs column x 63.6 (was 72.8).
- LOW-3: header basis `1 1 7rem`; at 300px on a card Roll + "Modifiers" share one row and the summary wraps under as a unit (collapsed and expanded shots g/h); the Main-action label's "19–20" is in `.dse-rollbar__nowrap` (`white-space:nowrap`, textContent unchanged); checkbox rows are a grid (`align-items:baseline; align-content:center`) so the box sits on the label's first line and one-line labels stay centred in the control-height row.
- LOW-5: DESIGN.md carve-out: header "states in words every modifier that differs from its default, plus the characteristic".

## Files
`src/elements/feature/renderFeature.ts`, `src/elements/statblock/view.ts`, `src/elements/featureblock/view.ts`, `src/elements/roll/view.ts`, `src/framework/kit/rollBar.ts`, `styles-source.css`, `test/dom/elements/feature-roll.test.ts` (+2), `test/dom/elements/roll.test.ts` (+1), `test/dom/kit/rollBar.test.ts` (+2); worktree `DESIGN.md`.

## Drive-by fixes
None. (Prettier was NOT run on `renderFeature.ts`; edits are surgical, LF preserved.)

## Follow-ups
- The checkbox glyph (INFO-1) and the harness blank-below-2400px limit (SC-409) are untouched, per the brief.
- `docs/Roll.md`/CHANGELOG were not changed this round (no user-visible wording changes beyond the fixes; CHANGELOG's Reset/layout text stays accurate).
- featureblock `rollIndices` is only exercised in jest; shots do not cover a multi-run featureblock with rolling on.

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- sc279-r4-evidence/: a-ds-roll-collapsed-dark, b-ds-roll-expanded-dark, c-card-after-first-click-strip-collapsed-dark, d-card-strip-expanded-1edge-skill-checked-dark, e-ds-roll-expanded-narrow300-dark, f-ds-roll-expanded-light (.png each); NEW g-card-narrow300-strip-expanded-full-dark.png and h-card-narrow300-strip-collapsed-dark.png (whole strip incl. Reset, element-level capture, not blanked); print-before/after roll--steel-print/realprint (unchanged from r2).
- Logs: sc279-r4-tsc/lint/jest-full/lifecycle/shots1/shots2/freeze1/freeze2/parity (.log, .exit), sc279-r4-hash1/2.txt, sc279-r4-new1/2.txt, sc279-r4-jest-neg.log (negative check), probe `sc279-r4-probe.mjs` + `sc279-r4-probe-final/probe.json`.
- sc279-rebaseline.txt (unchanged, 2 lines).
