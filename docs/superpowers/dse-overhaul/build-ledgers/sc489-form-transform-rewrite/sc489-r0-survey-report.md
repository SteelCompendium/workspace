# SC-489 r0 design survey — validation `transform` rewrites saved values

## Executive summary

1. **Recommendation: B.** Validate a deep **container** clone (not `structuredClone`: it is `undefined` in the jest jsdom env). Keep that normalised copy as `this.checked`. The **preview and the SC-488 `Default (…)` labels parse `checked`**, which mirrors the real pipeline. **Save writes the raw `working`.** The select's **initial display** falls back to `checked[key]` when the raw value is not an option. One file in src (`src/authoring/FormModal.ts`), plus jest in `test/dom/authoring/formModal.test.ts`.
2. **Census: 4 `transform`s in 2 of the 8 schema'd elements.** Skills `style` (select), Skills `skills[]` items (YAML textarea), Skills `custom_skills[].skill_group` (YAML textarea), and stamina-bar `style` (select). There are none in ComponentWrapper, hero, surges, conditions, tokens, roll or resource. ajv has no `useDefaults`, `removeAdditional` or `coerceTypes`, so `transform` is the only keyword that mutates data.
3. **Reproduced at `0dff966`** (jest probe). The Save output is `skills:\n  - climb`, then `style: chips\nskills:\n  - climb\nonly_show_selected: true`, then `max_stamina: 20\ncurrent_stamina: 15\nstyle: sheet`.
4. **The real pipeline lowercases first, and the parsers and views are case-SENSITIVE for `style`.** `pipeline.ts:149-156,451,473` validates `rawData` itself, then parses it. Skills `view.ts:182` and `StaminaBarPanel.ts:98` compare exactly. So option A alone breaks the preview: the probe shows `data-skills-style="Chips"`, and stamina `Sheet` renders the green bar instead of the sheet notice.
5. **Trap 1 (select vs `Chips`) is broken TODAY, not just under a naive fix.** `renderField` runs before the first `revalidate()` (`FormModal.ts:115` before `:125`). So the dropdown is set to `Chips` and opens BLANK (`selectedIndex -1`). The same happens for stamina `Sheet` and for a required `Alpha`. B fixes this by showing the normalised option.
6. **Trap 2 (stamina `serialize`) needs no extra fix.** `StaminaBar.parse` passes `style` through as written (`StaminaBar.ts:76`). `serialize` writes every declared key (`stamina-bar/model.ts:22-29`). Under A or B, Save writes `style: Sheet`. Probed for cases v and vi. SC-494 (`collapsed:` dropped) is not touched.
7. **SC-488 is not affected.** The labels already run on transformed data today, so B keeps them identical. `setKeyInSourceOrder` works on `working` and is unaffected.
8. **Taste call (FYI, not blocking):** under B, an untouched `style: Chips` shows as the option `chips` while Save keeps `Chips`. The ticket's Expected already decides the Save half. The display half is the owner's call; recommended: show the normalised option.
9. **No G-S34 lifecycle scenario and no e2e change.** No lifecycle scenario or e2e spec touches FormModal, and it has no `data-dse-control`. This matches SC-488 D8. Jest covers it, plus reviewer B's real-Obsidian probe.
10. **Tangent for a backlog ticket (out of scope):** in the sidebar, `_dse_anchor` makes the pipeline validate a SHALLOW clone. Top-level `style: Sheet` / `Chips` is then never normalised for `parse`, so a sidebar-mounted `style: Sheet` bar would render the default bar. Probed: `prepareModel` gives `Sheet` with an anchor and `sheet` without.

Probe source, kept outside the tree: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r0-survey-k7q2xm/zz-sc489-r0-probe.test.ts.txt`. Raw results: `…/sc489-r0-survey-k7q2xm/probe-out.json`, log `…/probe.log` (28/28 passed, rc 0). The worktree is at `0dff966` and `git status --porcelain` is empty after the probe file was deleted. A later fetch shows `origin/develop` at `53e1e48` (SC-485). `git diff --stat 0dff966 origin/develop` over `src/authoring`, `src/framework/{validation,pipeline}.ts`, `src/model` and `src/elements/{skills,stamina-bar}` is empty, so the survey still holds there. I did not rebase. `npm ci` was run in the worktree; `node_modules` is gitignored.

---

## 1. The mutation path

| Step | file:line | What happens |
|---|---|---|
| Open | `src/authoring/FormModal.ts:97-104` | `working = parseYaml(source)` (after popping `prefs:`). |
| Fields render first | `FormModal.ts:115`, `:144` | Each control reads its initial value from the **raw** `working[key]`. Select: `:194` `initial = scalarToString(current)`, and `:198` `d.setValue(initial)`. |
| Then validate | `FormModal.ts:125` -> `:275` `this.validation.validate(id, schema, this.working)` | `working` is passed **by reference**. |
| ajv | `src/framework/validation.ts:50-55` (Ajv2019 + `addKeywords` + `addErrors`; no useDefaults/removeAdditional/coerceTypes), `:71` `validateFn(data)` | ajv-keywords `transform` writes `parentData[prop] = transformed`. This hits `working.style` and items **inside** the `working.skills` array and the `working.custom_skills[i]` objects. |
| Save | `FormModal.ts:363` -> `currentBody()` `:241-254` | Stringifies, or `serialize(parse(working))`, from the now-mutated `working`. |

**Nothing else in FormModal mutates `working`.**
- `refreshDefaultLabels` (`:295`, `:298`) and `renderPreview` (`:323`) pass `working` or shallow `{...}` copies to `def.parse`.
- `Skills.parse` keeps a reference to `raw.skills` (`src/model/Skills.ts:59`) but does not write to it. `SkillsView.buildActiveSkills` copies it (`skills/view.ts:117`).
- `StaminaBar.parse` and `recordingDefaults` only read (`elements/shared/undeclaredDefaults.ts:45-57`).
- `extractPrefOverrides` pops `prefs:`, which is intended.
- **Consequence for the fix:** a shallow clone is NOT enough. `skills[]` and `custom_skills[]` are shared by reference, so the clone must deep-copy arrays and objects.

**The real render pipeline.** `prepareModel` (`src/framework/pipeline.ts:447-451`) validates `dataForSchemaValidation(rawData)`. That returns **`rawData` itself** when there is no `_dse_anchor` (`:149-152`). It then parses that same `rawData` (`:473`). So the block renders as chips + climb **because the pipeline lowercases in place first**, not because the parser is case-insensitive.

Parser and view sensitivity:
- Skills `style`: passed through as written (`Skills.ts:64`). The view stamps the raw value: `if (style !== 'list') setAttribute('data-skills-style', style)` (`skills/view.ts:182`). CSS keys on `[data-skills-style='ledger'|'chips']` (`styles-source.css:12939…`). An un-normalised `Chips` therefore gets the generic styled rules but not the chips layout. An un-normalised `List` would render as a styled layout instead of the list.
- Skills `skills[]`: matched case-insensitively but **not trimmed** (`view.ts:197-198`). `Climb` matches; ` Climb ` does not.
- Skills `skill_group`: the view trims and lowercases it itself (`view.ts:95`).
- Stamina `style`: passed through as written (`StaminaBar.ts:76`, constructor default `"default"` `:102`). The sheet check is an exact match: `opts.style === 'sheet'` (`framework/kit/StaminaBarPanel.ts:98`).

Pipeline probe (`prepareModel`, real ValidationService):

| source | model.style | model.skills | skill_group |
|---|---|---|---|
| `style: Chips` + `- Climb` | `chips` | `["climb"]` | – |
| same + `_dse_anchor: a1` | **`Chips`** | `["climb"]` | – |
| stamina `style: Sheet` | `sheet` | – | – |
| same + `_dse_anchor: a1` | **`Sheet`** | – | – |
| custom `skill_group: " Exploration "` | `ledger` | `[]` | `exploration` |

The anchor rows are the tangent in summary item 10. The cause is the shallow clone at `pipeline.ts:153`: the top-level transform lands on the copy, while nested items still mutate `rawData`. Do **not** "fix" the pipeline by making it stop mutating. Its `parse` depends on the normalised data, so the right pipeline fix is "parse the validated copy". That is a separate ticket.

## 2. Transform census (every registered schema)

`grep -rn transform src/` shows `transform` keys only in `SkillsSchema.yaml` and `StaminaBarSchema.yaml`. That covers every element `schema.yaml` (hero, surges, conditions, tokens, roll, resource) and `ComponentWrapperSchema.yaml`, the only dependency schema (`framework/dependencySchemas.ts:26-31`). There are no others: none nested, behind `$ref`, or in `allOf`.

| # | Location | Form control | parse() / serialize() with an un-normalised value |
|---|---|---|---|
| 1 | `SkillsSchema.yaml:25-27` `style` (enum list/ledger/chips, default ledger) | **select**, optional, leads with `Default (…)` (`FormModal.ts:189-205`) | Passed through as written (`Skills.ts:64`). The view stamps `Chips` as written, so the chips CSS does not apply (`view.ts:182`). No serialize. |
| 2 | `SkillsSchema.yaml:40-42` `skills[]` items (enum of 56) | **YAML textarea** (array; `formModel.ts:31-45`) | Array passed by reference (`Skills.ts:59`). The view matches case-insensitively without trimming (`view.ts:197-198`). |
| 3 | `SkillsSchema.yaml:136-138` `custom_skills[].skill_group` (no enum) | **YAML textarea** (array of objects) | Passed through as written (`Skills.ts:88`). The view trims and lowercases it (`view.ts:95`), so there is no render difference. |
| 4 | `StaminaBarSchema.yaml:56-58` `style` (enum default/sheet, default default) | **select**, optional, `Default (default)` | Passed through as written (`StaminaBar.ts:76`). `serialize` = `stringifyOmittingUntouched` writes every declared key (`stamina-bar/model.ts:46-52`, `undeclaredDefaults.ts:86-91`), so `Sheet` survives Save. The kit renders the bar, not the notice, for `Sheet` (`StaminaBarPanel.ts:98`). |

## 3. Reproduction at 0dff966 (jest, real ValidationService and real element definitions)

| case | Save text today |
|---|---|
| untouched `skills:\n  - Climb` | `skills:\n  - climb` |
| `style: Chips\nskills:\n  - Climb`, only "Only show selected" toggled on | `style: chips\nskills:\n  - climb\nonly_show_selected: true` |
| stamina `max_stamina: 20\ncurrent_stamina: 15\nstyle: Sheet`, untouched | `max_stamina: 20\ncurrent_stamina: 15\nstyle: sheet` |

There is also a finding that is new relative to the ticket. At open, the `Style` select for `style: Chips` and for stamina `style: Sheet` has `selectEl.value === ''` and `selectedIndex === -1`, so it shows blank. The same happens for a required select with a transform and `style: Alpha`. The reason is that `renderField` runs before the first `revalidate()`.

## 4. Options, case by case

**A** validates a container clone, and preview, labels and Save all use `working`.
**B** is A, plus the preview and the labels use the normalised clone, and the select's initial display falls back to the normalised value.
**C** works per key: Save re-emits the source text of every key the user did not touch.

Rows marked "probed" come from the jest run (A was emulated by wrapping the ValidationService in a clone; "today" is the B preview by construction). The B select display is derived; it has no probe.

| case | Opens showing | Validation sees | Preview renders | Save writes |
|---|---|---|---|---|
| (i) untouched `- Climb` | textarea `- Climb` (all options) | `climb` (copy, all options) | climb on (today, A and B, probed) | today `climb`; **A/B `Climb`** (probed) |
| (ii) `style: Chips` + toggle | today and A: **blank** select (probed); **B: `chips`** | `chips` | today/B: chips layout; **A: `data-skills-style="Chips"`** (wrong; probed) | today `style: chips…`; **A/B `style: Chips\nskills:\n  - Climb\nonly_show_selected: true`** (probed) |
| (iii) `Chips` -> user picks `list` | as in (ii) | `list` | list layout, all options (probed) | `style: list\nskills:\n  - Climb` for A/B (probed) |
| (iv) `Chips` -> user picks `Default (…)` | as in (ii) | key absent | ledger; label stays `Default (ledger)` (probed) | A/B `skills:\n  - Climb` (probed; the style line is removed) |
| (v) stamina `Sheet` untouched | today/A blank (probed); **B `sheet`** | `sheet` | today/B: sheet notice; **A: green bar** (wrong; probed) | today `style: sheet`; **A/B `style: Sheet`** (probed) |
| (vi) stamina `Sheet` + Max 25 | as in (v) | `sheet` | as in (v) | A/B `max_stamina: 25\ncurrent_stamina: 15\nstyle: Sheet` (probed) |
| (vii) user types `- " Climb "` | – | `climb`, valid | today/B: climb on; **A: climb off** (the view does not trim; probed) | today `- climb`; **A/B `- " Climb "`** (what the user typed; probed) |
| (vii-b) user types `- Climb` | – | `climb` | climb on | today `- climb`; A/B `- Climb` (probed) |
| (viii) required select, `style: Alpha` (test schema) | today/A blank (probed); **B `alpha`** | `alpha`, valid | – | today `style: alpha`; **A/B `style: Alpha`** (probed) |
| (ix) custom `skill_group: " Exploration "` | textarea as written | `exploration` | same in all three (the view normalises) | today `exploration`; A/B `" Exploration "` (probed) |

**C is rejected for this ticket.** It would also preserve formatting and comments of untouched keys, which today's re-stringify loses. But it changes the whole Save path, overlaps SC-494 (the serializer path drops `collapsed:`), and needs per-key source spans. The Expected line only needs "do not rewrite values". B meets that.

How B shows `Chips` against lowercase options (trap 1): at open, compute the normalised clone once **before** the field loop. In the select case, if `scalarToString(current)` is not in `options` but `checked[key]` is, `setValue(checked[key])`. No change event fires, so `working` keeps `Chips` until the user actually picks something. If the user re-picks the shown option, the native select fires no change, so Save still writes `Chips`. If they pick another option and then come back to `chips`, Save writes `chips`. That is a user change, the same precedent as SC-483. A value that does not normalise to any option (e.g. `Grid`) stays blank and shows the validation error, as today.

The alternative would be to add a literal `Chips` option. That shows exactly what is in the source, but it lists `Chips` next to `chips`, which reads as a duplicate. Not recommended.

Trap 2: under A or B, stamina keeps `Sheet` (probed for v and vi). The minimal fix is none beyond the clone, because `parse` passes the value through and `serialize` keeps declared keys. Caveat: a future serialize element whose `parse` normalises would still lose case. No built-in element does that today.

SC-488 effects:
- **`Default (…)` labels** (`FormModal.ts:291-311`): today they run on the transformed `working`. B keeps exactly that by running them on `checked`. Under A they would run on raw data; built-ins give identical labels (probed: `Default (ledger)` / `Default (default)` in both), but they would drift from the pipeline for any element whose `parse` is case-sensitive.
- **LOW-1 `setKeyInSourceOrder`** (`:217-235`): it operates on `working`, has no interaction with the clone, and is unaffected.
- **D6 required seed** (`:179-182`): the seed is an enum value written to `working` and is unaffected. The B display fallback applies to the `current != null` branch at `:182`.

## 5. Recommendation: B

Changes, all in `src/authoring/FormModal.ts`:

1. Add a module helper `cloneContainers(v)`: recurse into arrays and plain objects, and keep every other value by reference. Do not use `structuredClone`: `typeof structuredClone === 'undefined'` in the jest dom env (probed; the first probe run died with `ReferenceError: structuredClone is not defined` at `FormModal.ts:275`), and it is not polyfilled in `test/setup/`. Only containers need copying, because ajv-keywords `transform` only assigns into its parent container.
2. Add a field `private checked: Record<string, unknown>`, plus a `normalise()` that clones `working`, validates the clone and stores it. Call it once in `onOpen` **before** the field loop, so the selects can read `checked`. `revalidate()` (`:274-277`) validates a fresh clone each time and stores it as `checked`.
3. Select case (`:182` and `:194`): when `current` is non-null and not in `options`, and `checked[key]` is in `options`, show `checked[key]`. Leave `working` alone.
4. `refreshDefaultLabels` (`:295`) builds `absent` from `checked` instead of `working`.
5. `renderPreview` (`:323`) calls `def.parse(this.checked, this.currentBody())`. That is normalised data plus un-normalised text, exactly what `pipeline.ts:473` passes (`rawData` normalised in place, `bodySource` as written).
6. `currentBody()` and `save()` stay as they are, built from raw `working`. Update the header and doc comments (`:237-240`; the SC-488 comment that says the preview and Save use the same `working`) to say the preview mirrors the render of the saved text.

The SC-489 test list, in a new `describe('SC-489')` in `test/dom/authoring/formModal.test.ts`, with real elements and a real ValidationService. Rows 1-6, 9 and 11 should fail at `0dff966`:

1. Untouched `skills:\n  - Climb`: Save is `skills:\n  - Climb`.
2. `style: Chips` + toggle Only show selected: Save is `style: Chips\nskills:\n  - Climb\nonly_show_selected: true`.
3. Stamina `style: Sheet` untouched: `max_stamina: 20\ncurrent_stamina: 15\nstyle: Sheet`. With Max set to 25: `max_stamina: 25\ncurrent_stamina: 15\nstyle: Sheet`.
4. Select display at open: `Chips` gives `selectEl.value === 'chips'`; stamina `Sheet` gives `'sheet'`; required test schema `Alpha` gives `'alpha'`.
5. Preview parity: `Chips` gives `[data-skills-style="chips"]`; `Sheet` gives `.dse-stamina__notice`.
6. Typed `- " Climb "`: the preview marks climb as owned, and Save is `skills:\n  - " Climb "`.
7. `Chips` -> `list` writes `style: list`; `Chips` -> Default removes the line, and the label stays `Default (ledger)` (pins).
8. Custom `skill_group: " Exploration "` untouched is kept as written.
9. Required select, `style: Alpha` untouched: `canSave()` is true and Save writes `style: Alpha`.
10. Invalid un-normalised `style: Grid`: blank select, Save disabled (pin).
11. Guard: after open plus one revalidate, `working` (read back through a Save) still holds `Climb` inside a nested array (covered by 1 and 8). Optionally, spy on `validate` and assert `data !== working`.

No existing test pins the lowercased Save: grep for `Sheet|Chips|Climb` in `formModal*.test.ts` finds nothing, so no re-assertions are needed. Suggested mutants for reviewer B:
- validate `working` again: rows 1-3, 6 and 8 go red;
- preview from `working`: row 5 and row 6's preview half go red;
- drop the display fallback: row 4 goes red;
- shallow clone: rows 1, 6 and 8 go red.

Also: a CHANGELOG bullet under `## Unreleased` in the superproject (as in SC-488 D9). No lifecycle scenario (G-S34 unused), no e2e manifest change, no shot change expected.

**Owner calls versus already decided:**
- **Decided by the Expected line:** Save keeps `Climb`, `Chips` and `Sheet`, and keeps what the user typed (` Climb `).
- **Owner call, FYI to Scott:** the select shows the normalised `chips` while Save keeps `Chips`. Recommended as above.
- **Not this ticket, owner may file:**
  - the sidebar `_dse_anchor` shallow-clone tangent (summary item 10, `pipeline.ts:149-156`);
  - Save re-stringifies untouched keys' formatting and comments (option C territory, pre-existing);
  - SC-494 and SC-493 as already listed.
