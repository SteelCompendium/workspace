# SC-493 r1 implementer report

## Executive summary
- STATUS: DONE. Reproduced, then fixed per ledger D1.
- Base behaviour (real pencil -> real FormModal -> real ReadingModeBlockHost write -> real pipeline re-render): for counter / negotiation / party / encounter, an emptied, whitespace-only or comment-only box leaves Save ENABLED with no form error; the write lands and the block re-renders as an error card. montage / project (controls) save and render fine.
- Fix: the pipeline's parse + rescue ladder moved to `src/framework/blockBody.ts` (`readBlockBody`); `prepareModel` and `FormModal.parseRaw()` both call it. The `?? {}` is gone from the check and the preview.
- Now: emptied counter / negotiation / party / encounter box shows the element's own error and Save is off, nothing written. montage / project still save the empty body and render.
- dse commits on c98bd82 (rebased; develop moved from 66f474b): red 878fd07, fix fc0b8e2. Superproject CHANGELOG a3cefa7 (rebased onto origin/main e4f81d3; pointer unbumped).
- Gates on fc0b8e2: tsc+lint clean, jest 5898/1/242 of 243, lifecycle 34/34, e2e 114/114 79/79 pairs, shots 592 0 FAIL, freeze 280/280, parity 0/0/24.

## Reproduction (base behaviour, red commit before the fix)
Probe output (scratch `probe-out.txt`): for each of empty / whitespace-only / `# nothing here`: saveEnabled=true, formErrors="", written body = the box verbatim, re-render:
- counter: error card `Counter: failed to render (render)` / `Cannot read properties of null (reading 'max_value')`
- negotiation: `Cannot read properties of null (reading 'name')`
- party, encounter: `The input must be a YAML object.`
- montage, project: re-render ok (empty body renders).
Red test commit: 12 failing (4 elements x 3 boxes), 10 passing.

## jest parseYaml mock vs Obsidian
`test/mocks/obsidian-core.ts` `parseYaml` = `yaml` package `parse(src)`. Obsidian 1.15.0 asar: `function en(o){return H2(o,null,{})}` = the same `parse(src, null, {})`. Test asserts null for `''`, whitespace-only and comment-only. No difference found.

## Points to settle
1. Pipeline steps vs the form. Mirrored (shared code): YAML parse; collapse-key peel rescue; whole-block `@ref` rescue; `parseHandlesRawBody` rescue; the `bodySource` handed to `def.parse`. NOT mirrored: popping `prefs:` (needs the pref store; also logs console.warn per keystroke) and the reserved collapse keys (stay in the data the form hands parse; cannot turn a null into an object); schema validation (the six raw-box elements have no schema; a schema'd def with zero form fields would still skip it, as before); ref resolution (`resolveRefs` / `autoResolveRefs`). Side effect: a raw-box body that YAML rejects but the pipeline rescues (e.g. `collapsed: true` above prose, for a raw-body def) is now accepted by the form too, matching the pipeline; an unrescued YAML error still shows the same YAML error text.
2. Error strings an emptied box shows (element's own, no new wording): counter `Cannot read properties of null (reading 'max_value')`; negotiation `Cannot read properties of null (reading 'name')`; party and encounter `The input must be a YAML object.` Pinned by regex in the test (V8 TypeError wording).
3. Preview and check share `parseRaw()`, so both see the same data and body (test: a recording def sees null, never `{}`, from check and preview).
4. Schema'd (non-raw) elements untouched: their branches are unchanged; full jest green.

## Tests
New file `test/dom/authoring/formModalEmptyYaml.test.ts` (26 tests): yaml-mock null checks (3); 6 elements x (empty / whitespace / comment) (18); ordinary counter edit saves (1); prefs-only counter box saves and renders (1); check and preview both get null (1); throwing-on-null def: error shown, Save off, preview empty (1); raw-body def peel (1). No lifecycle scenario (jest reaches the real path).

## Gates (final tip, dse fc0b8e2)
tsc (incl. -p e2e) rc 0; lint rc 0, no errors; jest `Tests: 1 skipped, 5898 passed, 5899 total`, `Test Suites: 1 skipped, 242 passed, 242 of 243` (5872 + 26); lifecycle `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed`; e2e `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`; shots 592 files, 0 FAIL; freeze `freeze OK (280/280 ...)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. The SC-506 flake did not fire. An earlier full battery on 2fab352 (base 66f474b) was also green (jest 5885 after shots, lifecycle 34/34, e2e 108/108, shots 592, freeze 280/280, parity 0/0/24); superseded by the rebased run.

## Drive-by fixes
None.

## Follow-ups
- `ds-hero` etc. (schema'd, field forms) unchanged; raw box still skips `extractPrefOverrides` / collapse pop and schema validation for any schema'd def that falls into raw mode (no such shipped def found).

## Artifacts
Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-impl-A/` (probe-out.txt, tsc2.log, lint2.log, jest2.log, lifecycle.log, e2e2.log, shots2.log, freeze2.log, parity2.log, plus *.rc).

---

# r1b (ledger D5: plain message for an emptied box)

## Executive summary
- STATUS: DONE. Test-first: red `4e8adfb` (13 failing), fix `1175a3b`; dse branch now on c98bd82 + 878fd07, fc0b8e2, 4e8adfb, 1175a3b.
- Superproject CHANGELOG reworded: `c7086e5` (on top of a3cefa7); pointer unbumped.
- `FormModal.parseRaw()`: when `readBlockBody` gives `rawData === null` and `def.parse` throws, it throws `This block can't be empty. Add at least one setting, or press Cancel.`; every other parse error keeps the element's own message. Save stays off.
- Deviation from D5 wording: only `null`, not `undefined`. `undefined` is the raw-body rescue arm (prose for a `parseHandlesRawBody` def), not an empty box; an empty box is always `null`.
- Footer button label is really "Cancel" (aria-label), pinned by a test.
- Tests: 30 in formModalEmptyYaml (was 26): 4 elements x 3 empty boxes show the plain text; party/encounter `just text` keeps "The input must be a YAML object."; stub def throwing on non-null keeps `bad shape`; Cancel label.
- Gates: tsc rc 0, lint rc 0; jest 5902 passed / 1 skipped / 242 of 243; e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`. Lifecycle/shots/freeze/parity not re-run: only a message string in the form changed (no DOM, CSS or write path).
- I did not look for a non-empty invalid box for counter / negotiation; the "keeps own message" tests use party / encounter plus a stub def.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-impl-A/` (jest3.log, e2e3.log, tsc3.log, lint3.log).

---

# r2 (fix round: MEDIUM-1, LOW-1, LOW-2(b))

## Executive summary
- STATUS: DONE. Rebased onto origin/develop `a993a60` (no conflicts); superproject onto origin/main `84b3712`.
- dse shas: rebased r1 `bb71435` (red), `4db446b` (fix), `d07c8e1` (r1b red), `5cf8386` (r1b fix); r2 red `a8d1366` (3 failing), r2 fix `efc17de`.
- Superproject: the CHANGELOG commits conflicted with the new SC-498 bullet on rebase, so I reset to origin/main and re-did them as ONE commit `ca49bf6` (final wording, LOW-1 element list included). Pointer unbumped.
- MEDIUM-1 FOLDED: `renderPreview()` calls `removeAttribute('data-dse-readonly')` after `empty()`; jest asserts it is gone after emptying and back after a valid box.
- LOW-1 FOLDED: CASES now has values-row, characteristics, feature, featureblock (all green; D5 text); CHANGELOG reworded.
- LOW-2(b) FOLDED: `parseRaw` throws the model's own message for a `{kind:'invalid', message}` model. That shape is declared in shared `elements/shared/withReference.ts` (`RefOrInline`) and presented by shared `RefUnwrapView`; only ds-scc returns it today. The check is structural (no element import). Side effect: an empty ds-scc box now shows scc's own "Empty block..." message with Save off (D5's text is not used there); previously Save saved a notice card.
- Gates on `efc17de`: tsc rc 0, lint rc 0; jest 6003 passed / 1 skipped / 242 of 243 (5958 + 30 + 15); lifecycle 36/36; e2e 114/114, 0 known-bug, 79/79; shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.
- Tests in formModalEmptyYaml: 45 (was 30). Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-impl-A/` (jest4.log, lifecycle4.log, e2e4.log, shots4.log, freeze4.log, parity4.log, tsc4.log, lint4.log).
