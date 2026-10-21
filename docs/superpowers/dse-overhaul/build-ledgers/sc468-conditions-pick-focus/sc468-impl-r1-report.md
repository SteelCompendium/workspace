# SC-468 implementer report, round 1

**Executive summary**
- STATUS: DONE. Head `3fdbe2e` on dse branch `sc468-conditions-pick-focus`, rebased onto `origin/develop` `84636a9` (originally cut at `ba20072`; gates re-run in full after the rebase).
- Cause: the SC-186 fix-round MED-3 (`1f298c1`, 2026-08-22) added `focusRowCog` so `renderList()` never drops focus to `<body>`. It named the cog the "stable anchor" for chip picks. That was a stopgap, not a decision that picks belong on the cog, and the option still exists after the pick (the editor stays open), so no STOP condition applied.
- Fix: `setColor` / `setDuration` / `setEffect` now focus the rebuilt twin of the pressed option, found by `aria-label` inside its `role="group"` (the icon picker already re-finds its option the same way). A custom colour keeps the custom `<input type=color>`. If the option is absent the pick falls back to the cog. Add, remove and toggle are untouched.
- Tests: jsdom 1 test replaced by 7 (+6), e2e COND-E02 (keyboard) and COND-E03 (mouse), plus 4 `data-dse-control` ids and 5 manifest rows.
- Gates at 84636a9: tsc/lint clean, jest 5335/1 skipped, lifecycle 28/28, e2e 85/89 ok 0 failed 63/63 pairs, shots 572, freeze 276/276, parity 0/0/24.
- No CSS change. No tracker calls.

## Root cause
`git blame`: `focusRowCog` and its three pick-setter calls come from `1f298c16` "SC-186 fix-round — independent review findings (HIGH/MED/LOW)", finding MED-3. The doc comment says the cog is the stable anchor for row-level actions and for in-editor chip picks because the editor stays open at the same row. Only a jsdom test pinned it (`SC-186 fix-round MED-3: picking a chip in the editor keeps focus on the row's cog`). No e2e or lifecycle scenario asserted focus after a pick (grepped `obsidian-lifecycle.mjs` and `e2e/`). The pick options are rebuilt, not removed, so the ticket's fix applies.

## Changes
- `src/views/ConditionsModal.ts`: new `focusPickedOption(index, group, label)` and `focusCustomColor(index)`. `setDuration` uses `Duration` + the preset label, `setColor` uses `Color` + `Color <hex>` for a preset hex (custom input otherwise), `setEffect` uses `Effect` + the effect name. All fall back to `focusRowCog`. `renderRow` cog gets `control: 'cond.edit'`; duration chips, swatches and effect chips are stamped `cond.duration` / `cond.swatch` / `cond.effect` (attributes only).
- `test/dom/views/conditions-modal.test.ts`: replaced the MED-3 cog-after-chip test with 7 SC-468 tests. Duration chip. "Until removed" (the preset whose value is undefined). Swatch. Custom colour input. Effect chip. Pick lands in its own group. Fallback to the cog (editor closed, all three setters). Each checks that the focused node is the rebuilt twin with `aria-pressed="true"`. Before the fix, 6 of the 7 failed; the fallback test already passed on the old code, as it should.
- `e2e/specs/initiative/conditions-pick-focus.e2e.ts` (new): COND-E02 tabs to a duration chip, a swatch and an effect chip with real Tab, presses Enter on each, and asserts focus is on the rebuilt option (pressed, with `:focus-visible` true) and that the note holds `duration: save-ends, color: '#1e8449', effect: glow`. COND-E03 does a real mouse click on a swatch and asserts focus is on it with `:focus-visible` false.
- `e2e/manifest/conditions-modal.ts`: `cond.input` gains `press:Enter`; new `cond.edit` (click), `cond.duration` (press:Enter), `cond.swatch` (click, press:Enter), `cond.effect` (press:Enter). Coverage 57 to 63 pairs.
- `CHANGELOG.md`: one [FIX] bullet for SC-468.

Existing assertion changed: the MED-3 cog-after-chip jsdom test (see above). No e2e or lifecycle assertion changed.

## Mouse picks
Measured in real Obsidian 1.14.4. Before the fix (focus forced onto the cog) a mouse pick left focus on the cog with `:focus-visible` false. After the fix, focus is on the rebuilt swatch with `:focus-visible` false. Keyboard picks show the ring both before and after. A mouse pick therefore grows no ring it did not have. COND-E03 pins this.

Pre-fix proof: with `focusPickedOption` temporarily forced to the cog, COND-E02 and COND-E03 both failed with focus on `cond.edit` / `Customize Dazed`. The file was restored byte-identical before the commit.

## Notes
- The e2e flow closes the add dropdown with Escape before clicking the cog. A pointer mousedown outside the dropdown collapses the menu mid-click, the modal re-centres, and the click misses the cog (found while writing the scenario; documented in the spec). That is a test-flow matter, not a product change.
- `focusCustomColor` focuses the native colour input after its `change`. That is jsdom-tested only; no e2e drives the native colour dialog.

## Gates (at base 84636a9, after rebase; expected = ticket-owner's numbers)
| Gate | Expected | Measured |
|---|---|---|
| tsc (+ `tsc -p e2e`) | clean | clean, exit 0 |
| lint (+ `e2e/`) | clean | clean, exit 0 |
| jest | 5329 passed + new | 5335 passed / 1 skipped / 230 of 231 suites (+6) |
| lifecycle | 28/28 | 28/28 ok, 0 failed |
| e2e | 83/87 ok, 0 failed, 4 known-bug, 57/57 | 85/89 ok, 0 failed, 4 known-bug, 63/63 pairs (+2 scenarios, +6 pairs) |
| shots | 572, 0 FAIL | 572 PNGs, 0 FAIL; host-copy pin OK; button host-leak 112 kinds / 672 comparisons |
| freeze | 276/276 | `freeze OK (276/276 …)` |
| parity | 0 / 0 / 24 | 0 gaps, 0 undeclared, 24 declared, exit 0 |

First pass at base ba20072 (before the rebase): jest 5265 passed / 2 skipped (fresh, no shots cache) / 230 of 231, lifecycle 27/27, e2e 85/89 ok, 63/63, shots 572 and 0 FAIL. Freeze and parity were first run only after the rebase.

## Commits
- `0618791` fix(conditions): SC-468 keep focus on the picked swatch/chip after a keyboard pick
- `3fdbe2e` fix(conditions): SC-468 e2e COND-E02/E03 (keyboard + mouse pick focus), control ids, changelog
(Pre-rebase shas were `051faf9` and `b40bb96`.)

## Drive-by fixes
None.

## Follow-ups
- The real-Obsidian census (`e2e/specs/_census.e2e.ts`) and jsdom census do not mount the ConditionsModal, so the rest of the modal (icon grid, Done, Remove, the custom colour input) still has no ids. Pre-existing pilot-scope choice (SC-431); not widened here.

## Evidence artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc468-impl-r1-a7f3/`)
- Post-rebase gate logs: `sc468r1-h1-tsc.log`, `sc468r1-h2-lint.log`, `sc468r1-h3-jest.log`, `sc468r1-h4-lifecycle.log`, `sc468r1-h5-e2e.log`, `sc468r1-h6-shots.log`, `sc468r1-h7-freeze.log`, `sc468r1-h8-parity.log`
- Pre-rebase logs: `sc468r1-g1-tsc.log` … `sc468r1-g6-shots.log`
- Pre-fix e2e failure (proof the scenarios bite): `sc468r1-e2e-prefix.log`; jest red/green: `sc468r1-jest1.log`
- e2e bundles: `/home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus/draw-steel-elements/e2e/.out/`
