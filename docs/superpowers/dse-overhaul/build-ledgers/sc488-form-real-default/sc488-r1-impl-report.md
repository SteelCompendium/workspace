# SC-488 r1 implementation report (implementer A)

## Executive summary
- Plugin (draw-steel-elements) branch `sc488-form-real-default`: tip `459ce81`, on base `e4c5cf6` (retargeted from 424f47b after SC-433 landed; rebased clean, no conflicts). Superproject: `a2716cb` (CHANGELOG only) on origin/main `6bf71ca`. Submodule pointer NOT bumped, nothing pushed.
- Design D1-D9 implemented as written. No element schema/definition/model edits.
- Gates, all on 459ce81: tsc clean, lint clean, jest 5725 passed / 1 skipped / 238 of 239 suites (5711 + 14 new), lifecycle 31/31, e2e 101/101 ok 0 failed 0 known-bug 66/66 pairs, shots 580 / 0 FAIL, freeze OK 280/280, parity 0 GAP / 0 undeclared / 24 declared.
- Deviations: none from the ledger. Two drive-by test-title/header edits (below). Red commit's "nothing is seeded" test had a test bug (the label probe also calls parse with the key), fixed in the fix commit.

## Commits
Plugin (draw-steel-elements, branch sc488-form-real-default):
- `868ac51` test(SC-488): red tests for the block edit form's Default option on optional selects (RED: 14 failed / 26 passed in formModal.test.ts at that commit)
- `459ce81` fix(SC-488): block edit form shows the value an absent select will actually use
Superproject:
- `a2716cb` docs(changelog): SC-488 block edit form dropdowns show the value the block really uses

## What changed per file
- `src/authoring/FormModal.ts`: optional select leads with `UNSET = '__dse-unset__'` option labelled `Default`; nothing seeded; null key deleted on open (D5); onChange(UNSET) deletes the key, otherwise sets it. Required select: no sentinel, seed = schema `default` if in enum else enum[0], always written (D6). New `refreshDefaultLabels()` called in `revalidate()` before `renderPreview` (so before the `saveDisabled` early return): label = `Default (v)` for exactly one enum option whose `parse({...absent,key:v})` JSON-equals `parse(absent)`, `Default (none)` for zero, `Default` for several; any throw keeps the previous label (per-field try/catch). Removed `untouchedSeeds`, `requiredKeys`, `withoutUntouchedSeeds`, `currentBody(forSave)` (now `currentBody()`), with a comment pointing to SC-488; dropped the unused `shapeFromSchemaYaml` import.
- `src/authoring/formModel.ts`: `FormField` gains `default?: string` and `required: boolean` (from the resolved shape's `required`).
- `src/authoring/schemaShape.ts`: `RawSchemaNode.default?: unknown`.
- `test/mocks/obsidian-core.ts`: `FakeDropdown` gets a real jsdom `selectEl` (options mirror `addOption`, value mirrors `setValue`/`trigger`). Additive.
- `test/dom/authoring/formModal.test.ts`: new `describe('SC-488')` (14 tests) + 3 re-asserted SC-483 expectations.
- `CHANGELOG.md` (worktree superproject): one bullet under `## Unreleased`, above the SC-483 bullet.

## Tests (14 new, all in the SC-488 describe)
Red pre-fix (11): skills `Default (ledger)` + ledger preview + Save omits; roll `Default (test)` -> `Default (power-roll)` live relabel with preview model following; roll difficulty `Default (none)` + caption without "difficulty"; stam `Default (default)`; nothing seeded (preview model has no key); pick then Default removes the line; declared key switched to Default loses the line; required select seeds schema default (`ledger`) and is written; label naming rule (one/several/none hits); label recomputes while another field is invalid and keeps previous on parse throw; registry census (table of the 4 optional selects checked against parse; fails on any new select).
Green pre-fix (pinned outcomes, 3): explicit source pick selected and written; null value selects Default; required select seeds enum[0] when schema default missing/not in enum.

## Re-asserted SC-483 expectations (D7: exactly three, old -> new)
1. null key `name: Goblin\nstyle:`: writes `name: Goblin\nstyle: default` -> writes `name: Goblin` (D5).
2. "preview keeps the seeded value for an optional untouched select": preview model `toMatchObject({style:'default'})` -> `not.toHaveProperty('style')`.
3. "with a serialize(): parse() is handed the stripped data": preview-time `previewSaw` `toMatchObject({style:'default'})` -> `toEqual({name:'Goblin'})`.
No other existing assertion went red.

## Gate table (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-impl-a-x7k3qz/)
| Gate | Result | Log |
|---|---|---|
| tsc (incl. -p e2e) | clean, rc 0 | tsc.log |
| lint (incl. e2e) | clean, rc 0 | lint.log |
| jest | 5725 passed, 1 skipped, 238 passed + 1 skipped of 239 suites | jest.log |
| lifecycle (port 9311) | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` | life.log |
| e2e | `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` | e2e.log |
| shots | 580 files, rc 0, 0 FAIL; button host-leak OK (112 ... 672), modal button host-leak OK (10 ... 9 ... 38 ... 228), no ALLOWLISTED, pipette selected look OK, pressed toggle parity OK (96), modal text-scale anchoring OK + text scale OK + text scale once OK | shots.log |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` | freeze.log |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | parity.log |
Earlier gates on the old base 424f47b (superseded, kept in `old/`): jest 5716+2 skipped fresh, lifecycle 31/31, e2e 96/99, shots complete. Scratch dir also holds jest-form-*.log (targeted runs: red 14 failed/26 passed; fix 40/40).

## Drive-by fixes:
- `test/dom/authoring/formModal.test.ts`: the stale "Minor: ... writes its implicit default back to `working` on open" test title and the file-header bullet, and the SC-483 describe's header comment, reworded to the SC-488 behaviour (assertions untouched).

## Follow-ups:
- None needed in SC-489/493/494/492 areas; nothing noticed beyond the brief.
- Known limits (accepted by design): parse-equality uses JSON.stringify, so a model holding Map/Set compares equal for every option and the label degrades to plain `Default`; a conditionally required select (if/then, dependentRequired, oneOf) is not seen as required and gets a Default option. No built-in element has either.
- Real-Obsidian check of the live relabel through the real `DropdownComponent.selectEl` is left to reviewer B (jest uses the FakeDropdown selectEl).
