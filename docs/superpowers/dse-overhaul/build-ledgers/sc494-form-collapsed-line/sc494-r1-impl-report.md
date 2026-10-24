# SC-494 r1 implementer report

## Executive summary
- STATUS: DONE. Reproduced at base `efc17de`, then fixed. Red commit dse `7560ce5`, fix commit dse `13b5df6`, superproject CHANGELOG `0eb4ac5` (pointer left unbumped; superproject fast-forwarded to origin/main `7e45f8d` first).
- Base bug: stamina bar `collapsed: true` + max/current, press Save with no edit, the real write is `max_stamina: 20\ncurrent_stamina: 15` (the `collapsed:` line is gone). Same for `collapsed: false`.
- Second symptom also real: skills, conditions, surges (closed schemas) show a schema error with the key in `working`, Save is disabled (form cannot save at all).
- Fix: FormModal pops the claimed keys at open (`extractCollapseKeys`, new shared `claimsLegacyCollapseKeys(def)` in `chrome/collapsedKey.ts`, also now used by `pipeline.ts`) and re-emits only the popped keys via `withCollapseKeys` inside `withPrefOverrides`, on both the serialize and the stringify path (one `withReservedKeys` wrapper).
- Gates: tsc+lint clean; jest 6024 passed / 1 skipped / 243 of 244 suites (base 6003 + 21 new); lifecycle 36/36; e2e 114/114, coverage 79/79; shots 592, 0 FAIL; freeze OK 280/280; parity 0 GAP / 0 undeclared / 24 DECLARED. No flake seen.

## Step A - reproduction (base `efc17de`)
New file `test/dom/authoring/formModalCollapseKeys.test.ts` (real Edit button -> real FormModal -> real `ReadingModeBlockHost.replaceSource` -> vault; re-render via real `ElementPipeline` on a fresh host). 18 tests at the red commit `7560ce5`: 13 red, 5 green at base.

Red at base: stamina `collapsed: true`/`false` no-edit (written bytes lack the line); stamina edit (`max_stamina: 25`, line gone); stamina `prefs:`+`collapsed:`; skills `collapsed: true` (form error "Skills object must not have extra properties", Save off); skills prefs+collapsed edit; stamina `collapsed:` + owned `collapsible:` (0 `collapsed` lines written); conditions `collapsed: true` (`#/additionalProperties` error, Save off); surges all three keys (3 errors); surges edit (Save off so nothing written); stub chrome def, claimed legacy keys; stub non-boolean `collapsed:`; stub serializer-throws fallback; stub body of only `collapsed: true`.
Green at base: `collapse_default: true` on stamina-bar and on skills (model-owned, one line, still collapsed); raw-mode `ds-counter` with `collapsed: true` (box verbatim, no-edit and edited Save keep it, re-renders collapsed); stub def without chrome (originally asserted "left alone"; that case was green at base only because the closed schema rejects `collapsed:`; see below).
Test corrections after the red commit (in the fix commit): the no-chrome stub test now asserts the pipeline's rule (`collapsed:` is ALWAYS popped, `collapsible:` is not claimed without chrome) which is red at base; skills prefs test uses `collapsed: true` (the skills schema oddly accepts `collapsed: false` alone but rejects `true`; probed: `{collapsed:false,skills}` valid, `{collapsed:true,skills}` invalid, `{prefs:{},collapsed:false,skills}` invalid) and a `submit()` helper asserts Save is enabled so no test is vacuous; +3 order tests.

## Step B - fix
- `src/framework/chrome/collapsedKey.ts`: `claimsLegacyCollapseKeys(def)` = `def.chrome !== undefined && def.collapseKeysOwnedByModel !== true` (type-only import of `ElementDefinition`).
- `src/framework/pipeline.ts`: one-line swap to call that helper (no behaviour change).
- `src/authoring/FormModal.ts`: `collapsePopped` field; `onOpen` pops after `prefs:`; `currentBody()` / `stringifyWorking()` go through `withReservedKeys()` (collapse keys innermost, `prefs:` outermost = pipeline order). `sourceKeyOrder` is taken after the pops. Header + `parseRaw` doc comments updated.

## Points to settle
1. Byte-identity / ordering. Both paths (stamina-bar serialize; skills stringifyWorking; surges serialize claiming legacy keys) write the SAME result for every probed source. Canonical source order (`collapsed:` first, or `prefs:` then `collapsed:`) is byte-identical on a no-edit Save. Odd orders normalise to the pipeline's order (`prefs:`, collapse keys, body): `collapsed:` last -> first; `collapsed:` between body keys -> first; `collapsed:` before `prefs:` -> after `prefs:`. This is the same normalisation `prefs:` already had and the pipeline's own write-back does. No new ordering scheme; the three cases are pinned in 3 tests. Across the reserved keys themselves the order is collapsed, collapsible, collapse_default (extractCollapseKeys read order). Probe log: `.../scratchpad/sc494-r1-impl-a1/order-fixed.log`, probe source `zzProbe3.test.ts.txt` (same dir; not committed).
   Non-boolean `collapsed: maybe`: warned and dropped on Save (the pipeline drops it identically on a write-back).
2. Pipeline also peels leading collapse lines for non-mapping bodies (`peelLeadingCollapseKeys` / `withPeeledKeys`) inside `readBlockBody`. Confirmed SC-493's `readBlockBody` is what the raw-box check (`parseRaw`) uses, so the raw check peels already (existing SC-493 test "leading collapse keys above prose are peeled"). Raw mode writes `rawText` verbatim: confirmed by the `ds-counter` test (green at base and after). The raw check does NOT pop `collapsed:` out of mapping data (it stays in the data handed to `def.parse`); no raw-mode element's parse tripped on it (counter test). Left as is, comment updated.
3. Preview inside the form: probed on a stamina bar with `collapsed: true`: the preview mounts `def.createView` directly (no pipeline chrome), so it is always rendered expanded with no `data-dse-collapsed` and no `.dse-chrome`. Unchanged by the fix.
4. Defs whose form behaviour changes (chrome AND a schema with fields, i.e. a field form; raw-mode defs are unchanged): `stamina-bar` (serialize; owns collapsible/collapse_default, `collapsed:` popped), `skills` (NO serialize -> stringify path; owns the pair, `collapsed:` popped), `conditions`, `heroic-resource`, `surges`, `hero-tokens`, `hero` (all serialize; claim all three keys; closed schemas). `hero` splices raw definition text on serialize: `withCollapseKeys` has the "already declares it" guard, but hero's form passes `stringifyYaml(working)` (no collapse lines) as the body so no double emit is expected; NOT probed by a test - reviewer should probe `hero` and `heroic-resource`. Raw-box (schemaless) chrome defs unchanged: negotiation, initiative, counter, encounter, montage, project, party, feature, featureblock, statblock, values-row, characteristics, scc (and display family).

## Gate numbers (worktree dse `13b5df6`)
- `npm run tsc` (incl. e2e) rc=0, clean; `npm run lint` rc=0, clean.
- jest before shots: 6023 passed / 2 skipped / 243 suites passed + 1 skipped. After shots (final): **6024 passed / 1 skipped / 243 of 244 suites**, rc=0.
- lifecycle `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed` (port 9294).
- e2e `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`.
- shots: 592 files in `visual-harness/shots`, no FAIL line (only "montage-failed" names match grep); freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- `test/dom/elements/initiative-default-keys.test.ts` (SC-506 flake) did not fire in either full run.

## Drive-by fixes
None.

## Follow-ups
- Skills schema oddity: `collapsed: false` alone validates against the skills schema (no "extra properties" error) while `collapsed: true` does not. Irrelevant after the fix (the key is popped) but suggests the closed-schema check is order/value dependent; not investigated.
- The form's raw-box check (`parseRaw`) does not pop `prefs:`/collapse keys from mapping data the way the pipeline does; harmless today (no raw-mode parse tripped), only matters if a raw-mode element's parse ever rejects unknown keys.
- A non-boolean `collapsed:` line is silently deleted by a form Save (same as the pipeline's own write-back); a form-level Notice could warn.

## Evidence paths
- Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r1-impl-a1/` (red2.log/red3.json = base red run; green3.json; jest-a.log, jest-b.log; lifecycle.log; e2e.log; shots.log; freeze.log; parity.log; tsc.log; lint.log; order-fixed.log; preview.log).
- Commits: dse `7560ce5` (red), `13b5df6` (fix) on branch `sc494-form-collapsed-line` in `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements`; superproject `0eb4ac5` (CHANGELOG only) in `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line`.
- Test: `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements/test/dom/authoring/formModalCollapseKeys.test.ts`.
