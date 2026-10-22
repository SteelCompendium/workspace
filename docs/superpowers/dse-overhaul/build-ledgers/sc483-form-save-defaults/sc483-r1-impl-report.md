# SC-483 r1 implementation report (implementer A)

Executive summary
- Verdict: DONE. FormModal Save now omits an untouched select whose key was absent from the source.
- Plugin (draw-steel-elements, branch sc483-form-save-defaults), rebased onto origin/develop bc4a0c5 (no conflicts): 524718d test (red) -> 3cd5a6a fix -> b6f73ed test tsc-lib fix. Superproject f1f4dff (CHANGELOG only; no pointer bump committed).
- Gates on the rebased branch: tsc + lint clean; jest 5469 passed / 1 skipped / 232 of 233 suites (after shots); lifecycle 30/30; e2e 89/93 ok, 0 failed, 4 known-bug, coverage 64/64 (run 20261021-174047-db37); shots 580 PNGs, 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- Judgment call: a REQUIRED select is never stripped (see "The fix"); owner may overrule.
- Follow-ups: skills `style` and roll `difficulty`/`mode` dropdowns show a value the parser does not default to (item (b)).

## The fix (src/authoring/FormModal.ts)
- `untouchedSeeds: Set<string>`: a select key is added when the form seeds enum[0] AND the key was absent from the source (own-property test on the parsed source, so `style:` with a null value counts as declared and is written as before) AND the field is not in the schema's `required` list. The dropdown's `onChange` deletes the key from the set, so any user change (including back to the first option) makes it written. The test is "never touched", not "equals enum[0]".
- `currentBody(forSave)`: Save passes true, and the data is `working` minus the untouched seeds (key order of the rest unchanged) before parse/serialize/stringify, so a model serializer (stamina-bar SC-466) also sees the key as absent. The seed comment at the select case now says it is display/validation-only.
- Required exception: validation sees the seeded value, so a required select absent from the source passes validation; stripping it would write a block failing its own schema. It is therefore kept (written). No built-in element has a required select today (survey), so this is guard-only, covered by a test.
- Existing test "Minor: a select field with no value yet..." asserted `style: default` is written; it now asserts it is not (title updated), because that is the old behaviour this ticket reverses.

## Callers of currentBody()
- Save (`save()` -> `host.replaceSource`): STRIPPED body (forSave=true).
- Live preview (`renderPreview()`, passes it as the `raw` arg to `def.parse(this.working, ...)`): SEEDED (forSave=false). Reason: the preview should render what the dropdowns show, same as validation (`revalidate()` reads `this.working`, seeded).
- Raw/schemaless mode: `currentBody` returns `rawText` verbatim for both; no select seeding exists there.
- No other callers (grep: the only `currentBody` hits outside FormModal are unrelated SidebarBlockHost/pipeline methods).

## Tests (test/dom/authoring/formModal.test.ts; +12 new, 1 existing re-asserted)
Repro stamina bar (exact body `max_stamina: 25\ncurrent_stamina: 15`); no-serialize stringify path; `prefs:` map still re-emitted; touched non-first option written; changed then back to first written; one touched select does not un-strip another; declared key at default byte-identical; null-valued declared key written as before; validation + preview see the seed (required select, mounted model); optional untouched select seen by preview but omitted in write; required select not stripped; with a `serialize()`, parse() receives stripped data on Save and seeded data in preview. Red run: 7 failed before the fix, 22/22 after.

## Survey (22 registered elements; top-level select = schema property with `enum`)
Only three elements have select fields; the rest have none (schemaless, or no enum at top level; nested enums in conditions/skills sit inside textarea sub-editors and never seed).

| element | key | enum | required | parser default | serializer | untouched Save before -> after |
|---|---|---|---|---|---|---|
| stamina-bar | style | default, sheet | no | default | SC-466 `serialize` omits absent-and-default | wrote `style: default` -> clean |
| skills | style | list, ledger, chips | no | ledger (Skills.ts `?? 'ledger'`) | none (stringify path) | wrote `style: list` (CHANGED the layout) -> clean |
| roll | mode | power-roll, test, opposed, flat | no | expression-derived, else power-roll | none (stringify path) | wrote `mode: power-roll` -> clean |
| roll | difficulty | easy, medium, hard | no | none (undefined) | none (stringify path) | wrote `difficulty: easy` -> clean |

Measured through the real FormModal + real definitions (scratch jest, not committed), untouched Save:
- before (aeb1f9b FormModal): skills `skills:\n  - climb\nstyle: list\n`; roll `roll: Might test\nmode: power-roll\ndifficulty: easy\n`; stamina `...current_stamina: 15\nstyle: default`.
- after: `skills:\n  - climb\n`; `roll: Might test\n`; `max_stamina: 20\ncurrent_stamina: 15`. Editing roll Edges 1 -> 2 writes only `roll: Might test\nedges: 2\n`.
- No built-in serializer re-adds a select default after this fix: stamina-bar's is SC-466; skills and roll have no `serialize`. No element name for SC-482 on the select axis.
- Note: skills lowercased "Climb" -> "climb" in that scratch write; that comes from validation's `transform` mutating `working` in place (pre-existing, unrelated to selects).

## Gates (rebased branch, tip b6f73ed, base bc4a0c5; logs in scratchpad dir below)
- tsc (incl. -p e2e): clean. lint (incl. e2e): clean (only the pre-existing .eslintignore warning).
- jest: 5469 passed / 1 skipped / 5470 total, 232 of 233 suites passed (run again after shots). Pre-rebase on 08206e3, before any shots cache: 5457 passed / 2 skipped (= 5446 baseline - 1 + 12 new).
- lifecycle (DSE_LIFECYCLE_PORT=9297): `OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed` (also 30/30 on the 08206e3 base).
- e2e: `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`, run dir e2e/.out/20261021-174047-db37 (89/93 on the 08206e3 base too).
- shots: 580 PNGs, 0 FAIL, host-copy pin OK, button host-leak 112 kinds / 672 comparisons.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- The 08206e3 battery was stopped at shots on the owner's course correction (one shots attempt was killed by a session limit, one by my own timeout); nothing on the old base is evidence of record.
- Rebase: onto origin/develop bc4a0c5 (SC-362, harness only); 3 commits replayed, 0 conflicts. package.json/lock unchanged, so no `npm ci`; node_modules was copied (`cp -a`) from the main checkout (same lockfile) because the new worktree had none.

## Not done / notes
- No lifecycle scenario or e2e surface added (optional per brief); the reviewer probes in real Obsidian.
- Superproject worktree shows ` M draw-steel-elements` (pointer moved by the plugin branch); deliberately not committed (landing does that).

Drive-by fixes: none.

Follow-ups:
1. (b) skills `style`: the dropdown SHOWS `list` (enum[0]) for an absent key while the parser default and the rendered layout are `ledger`; the live preview (seeded `list`) therefore renders a layout the saved block will not have. Same for roll `difficulty` (shows `easy`, real default none) and roll `mode` when `roll:` is an expression like "Might test" (preview seeded `power-roll` overrides the expression-derived mode via `raw.mode ?? parsed?.mode`). Fix would be an authoring hint with an explicit default/"unset" option; not touched.
2. Validation's `transform` (trim/toLowerCase) mutates the form's `working` in place, so Save can write normalized values (e.g. skills `Climb` -> `climb`) the user did not type. Pre-existing, outside this ticket.

Artifacts
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r1-impl-report.md
- Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r1-impl-a/ (rb-tsc.log, rb-lint.log, rb-jest.log, rb-jest2.log, rb-life.log, rb-e2e.log, rb-shots.log, rb-freeze.log, rb-parity.log, jest-formmodal.log for the red/green run; survey-after.out, survey.out)
- Worktree: /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults (plugin: draw-steel-elements/src/authoring/FormModal.ts, test/dom/authoring/formModal.test.ts; CHANGELOG.md)
