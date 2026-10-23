# SC-488 r0 design survey: block edit form select shows enum[0] instead of the real default

## Executive summary

1. **Recommendation: Option B+C.** Every optional select gets a leading "Default (<value>)" option that stands for "key absent". It is not seeded into `working`, and choosing it deletes the key. The label's `<value>` is computed live from the element's own `parse()`: it names the enum option whose model equals the key-absent model, so roll `mode` follows the `roll:` expression as the user types. When no option matches, the label is "None". Required selects keep today's seed-and-never-strip path, but the seed becomes schema `default` (when it is in the enum) before `enum[0]`.
2. **Precedent:** this is the same pattern Scott ruled for the font dropdowns on 2026-08-02: one leading "Default (…)" option meaning no override (`src/prefs/fontStacks.ts:98-101`, `src/views/SettingsTab.ts:476-478`). It ships in real Obsidian today.
3. **Census:** 22 registered elements, 8 with a schema, **4 select fields in 3 elements**: (a) enum[0] is already the effective default: 1 (`ds-stam style`). (b) A different static default: 1 (`ds-skills style`, enum[0] `list`, real value `ledger`). (c) Derived: 1 (`ds-roll mode`). (d) No value: 1 (`ds-roll difficulty`). No required select exists. `ds-conditions` `duration` is nested in an array, so it renders as a textarea, not a select. `ds-hero` has no enum.
4. **SC-483 compatibility:** all four SC-483 outcomes hold: untouched absent → not written; changed → written; changed back to an explicit first option → written; required → never stripped. Once optional selects stop seeding, the `untouchedSeeds` strip machinery becomes dead code (owner call: remove it or keep it).
5. **Files:** `src/authoring/FormModal.ts` (main), `src/authoring/formModel.ts` + `src/authoring/schemaShape.ts` (carry `default` and `required` onto FormField), `test/mocks/obsidian-core.ts` (FakeDropdown needs a `selectEl` for the live relabel), `test/dom/authoring/formModal.test.ts` (new SC-488 cases; 3 SC-483 assertions re-asserted). No schema, element or model edits. No e2e manifest, census or camera impact.
6. **Taste calls for Scott:** (i) label wording: "Default (test)" vs "Automatic (test)" for roll mode, and "None" for an absent difficulty; (ii) whether stamina/skills also get the extra entry (stamina would read "Default (default)" because its enum value is literally `default`). Decided by Expected, not taste: the preview must render the absent-key model, and the dropdown must show the real value.

Baseline at dse `424f47b` (= origin/develop after fetch, unchanged): `formModal*.test.ts` 2 suites / 34 tests pass. Probe logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r0-survey-k7q2xz/probe1.log`, `probe2.log` in the same folder.

---

## 1. How the form builds a select today (dse 424f47b)

- **Field definitions come from the JSON schema**, not a widget map. `fieldsFromSchema` (`src/authoring/formModel.ts:42-66`) walks `def.schema` through `shapeFromSchemaYaml` (`src/authoring/schemaShape.ts:77-86`, root + allOf + `$ref` to component-wrapper). `widgetFor` returns `'select'` for any node with an `enum` (`formModel.ts:27-28`). Optional per-field overrides come from `def.authoring.fields` (`AuthoringFieldHint`, `src/framework/registry.ts:20-26`: label/widget/order/hidden/help). No built-in sets `widget: 'select'`; only ds-hero uses `fields` (`state: { hidden: true }`). `FormField` carries `enum` (`formModel.ts:60`) but **not `default` or `required`**, and `RawSchemaNode` (`schemaShape.ts:18-26`) has no `default` member.
- **The `enum[0]` fallback:** `FormModal.ts:172` `const fallback = field.enum?.[0]`, then `:173` `initial` = fallback when `current == null`.
- **Seed into working data:** `FormModal.ts:174-178`. If `current == null` (absent OR present-with-null), `working[key] = fallback`. If the key was absent from the source (`hasOwnProperty` check at `:175`) and is not in `requiredKeys`, it is added to `untouchedSeeds` (`:177`). The dropdown gets one option per enum value (`:180`) and `setValue(initial)`. `onChange` deletes the key from `untouchedSeeds` and sets `working` (`:181-184`).
- **requiredKeys:** `FormModal.ts:99`, top-level + allOf `required` only (doc at `:59-62`).
- **Validation consumes the seed:** `revalidate()` validates `this.working` (`FormModal.ts:244`).
- **The live preview consumes the seed:** `renderPreview()` runs `def.parse(this.working, this.currentBody(false))` (`FormModal.ts:263`). `currentBody(false)` keeps the seeds (`:203-205`).
- **SC-483 strip at Save:** `save()` → `currentBody(true)` (`FormModal.ts:303`) → `withoutUntouchedSeeds()` (`:220-223`) filters the `untouchedSeeds` keys out before `serialize(parse(data))` or `stringifyWorking` (`:207-215`). A required select never enters the set, so it is never stripped.
- **Who opens the form:** the pipeline pencil or chrome item (`src/framework/pipeline.ts:723`, `:774`), gated on `canPersist && !def.noAuthoringButton && authoringControls` (`:672`). Separately, ds-hero's "Edit definition" calls `openFormEditor` (`src/elements/hero/view.ts:257`).

**Observed today (probe1, real definitions, real ValidationService, real views):**

| Source | Dropdown shows | Preview model | Save writes |
|---|---|---|---|
| ds-skills `skills: [climb]` | Style=`list` | style=`list` (no `data-skills-style` attr → classic list) | `skills:\n  - climb` (real block renders `ledger`) |
| ds-roll `roll: Might test` | Mode=`power-roll`, Difficulty=`easy` | mode=`power-roll`, difficulty=`easy`, caption "Might test · easy difficulty" | `roll: Might test` (real block: mode test, no difficulty) |
| ds-roll `` (empty) | Mode=`power-roll`, Difficulty=`easy` | caption "Power Roll · easy difficulty" | `` |
| ds-stam `max_stamina: 20` | Style=`default` | style=`default` | `max_stamina: 20` (correct) |

This confirms the ticket: Save is already right (SC-483); the display and the preview are wrong for 3 fields.

## 2. Every built-in select field

Census: every element `registerFrameworkElementDefinitions` registers (`main.ts:290-351`), run through `fieldsFromSchema` (probe1). Schema'd elements: skills, stamina-bar, roll, conditions, resource, surges, tokens, hero. Only 3 render selects:

| Element | Field | enum | enum[0] | schema `default` | Effective value when absent (cite) | Class |
|---|---|---|---|---|---|---|
| ds-stam | `style` | default, sheet | default | `default` (`src/model/schemas/StaminaBarSchema.yaml:54-62`) | `"default"`: constructor param default `src/model/StaminaBar.ts:102`, assigned `:128` | **(a)** no bug |
| ds-skills | `style` | list, ledger, chips | list | `ledger` (`src/model/schemas/SkillsSchema.yaml:17-33`) | `ledger`: `src/model/Skills.ts:76` `style ?? 'ledger'` (comment `:72-75`: "Keep in sync with the schema's own `default:`"); view `src/elements/skills/view.ts:182` stamps `data-skills-style` unless `list` | **(b)** |
| ds-roll | `mode` | power-roll, test, opposed, flat | power-roll | none (`src/elements/roll/schema.yaml:17-19`) | `raw.mode ?? parsed?.mode ?? 'power-roll'` (`src/elements/roll/model.ts:54`); `parsed.mode` = `test` if the word "test" appears, else `power-roll` (`src/framework/roll/parse.ts:32`). It never derives `opposed`/`flat`. An explicit `mode:` beats the expression (probe: `roll: Might test` + `mode: power-roll` → power-roll). | **(c)** |
| ds-roll | `difficulty` | easy, medium, hard | easy | none (`roll/schema.yaml:38-40`) | `undefined`: `roll/model.ts:98` `difficulty: raw.difficulty`; used only in the caption (`src/elements/roll/view.ts:32-37`) | **(d)** |

Not selects: ds-conditions `conditions[].duration` enum (`src/elements/conditions/schema.yaml:36-38`) sits under an array, so the field is a textarea. ds-skills `skills[]` item enum: array → textarea. ds-hero/resource/surges/tokens: no enum. Schemaless elements (feature, statblock, counter, negotiation, etc.) get the raw-YAML textarea. No select is in `required` anywhere. ds-roll and ds-hero are `deferred` (experimental-only); skills and stamina are not.

## 3. Design options

Shared facts:
- AJV runs without `useDefaults` (`src/framework/validation.ts:50-54`), so a schema `default` is annotation only and never mutates data.
- The schema `default` keyword is read only by `scaffold.ts:33`, and only when an element has no curated `example`. All three affected elements have one.
- A key-absent object validates clean: probe shows `{}` passes for roll and skills. `mode: ''` / `difficulty: ''` / `style: ''` each fail enum validation, so an "absent" option must map to *delete the key*, never to `''` in `working`.
- Obsidian `DropdownComponent` exposes `selectEl: HTMLSelectElement`, `addOption(value, display)`, `setValue`, `getValue` (`node_modules/obsidian/obsidian.d.ts:2299-2339`). An empty-string sentinel option already ships (`DEFAULT_FONT_OPTION.value = ''`, `fontStacks.ts:98-101`), and so does a non-empty sentinel (`CUSTOM_FONT = '__custom__'`, `SettingsTab.ts:57`).
- The jest `FakeDropdown` (`test/mocks/obsidian-core.ts:858-877`) records options/value but has **no `selectEl`**.

### A. Schema `default` as the display/seed fallback (`default ∈ enum ? default : enum[0]`)

- (a) stamina: shows `default`. Unchanged.
- (b) skills: shows `ledger`. It is seeded, so validation and the preview see `ledger` and the preview renders the ledger layout. Save: untouched → stripped (SC-483); changed → written; changed back to `ledger` → written (`style: ledger`, per the SC-483 rule).
- (c) roll mode: there is no static truth. Adding `default: power-roll` to the schema is wrong for `roll: Might test`, so the bug stays.
- (d) difficulty: no value to show; still `easy`. The bug stays.
- Cost: `default` added to `RawSchemaNode`/`FormField`, plus about 2 lines in FormModal. **It fixes 1 of the 3 ticket cases.** It also leaves a drift risk between the schema `default` and the parser default (Skills.ts:72-75 already warns about it).

### B. A leading "absent" option (sentinel value mapping to "key absent")

- On open with the key absent: the sentinel is selected and **nothing is seeded**.
- Validation sees the key absent (valid). The preview parses the key-absent data, so it renders exactly what the saved block renders.
- Save: untouched → key absent → not written (no strip needed). Explicit option → written. Explicit then back to the sentinel → `delete working[key]` → not written. A source that **declared** the key (`style: sheet`) and is switched to the sentinel → the line is removed. This is new: today the form can never remove a select key. It is a user action, so it does not conflict with SC-483's "present keys are written".
- Covers all four classes uniformly. With a static label ("Automatic (from the roll)", "None", "Default (ledger)") it needs a per-field label hint, and for (c) the label does not name the value.
- Required selects: no sentinel (an absent required key is invalid). Keep seed + never strip.
- DropdownComponent: fine (see precedent). Prefer a non-empty sentinel constant (for example `'__dse-unset__'`) over `''`: no collision with any enum value, and it never reaches data.

### C. Compute the effective value from the current data

Two ways to get it:
- **C1 (explicit hook):** add `effective?: (model) => string | undefined` to `AuthoringFieldHint`, plus four one-liners in three definitions. Explicit, but it is per-element form code, which goes against FormModal's "No per-element form code" header (`FormModal.ts:6`). A future select without the hook falls back to a wrong or static value.
- **C2 (generic, parser-derived):** effective = the enum option `v` with `JSON.stringify(parse({...working, key: v})) === JSON.stringify(parse(working minus key))`. Exactly one hit → that value; zero → none; more than one → indeterminate. It cannot drift from the parser and covers future selects with no code. Probe2 checks it against every built-in case: skills `{skills:[climb]}`→ledger, `{}`→ledger; stam→default; roll `{}`→power-roll, `Might test`→test, `Power Roll + Might`→power-roll, `Might test`+`dice`→test, the curated example→power-roll; difficulty→(none). Cost: 1000 skills probes in 5 ms, and enums have ≤4 options. Fragility: a model holding Map/Set or a raw-data copy would compare wrong. Guard: try/catch, and on 0 or more than 1 hits fall back to a neutral label.

C alone (relabel the real options and keep seeding): for (c), an untouched dropdown would have to follow the expression via `setValue` on every revalidate. The user then cannot tell "derived test" from "explicit test", and (d) still has no value. **So C works only as the label source for B.** When the user edits `roll:` from "Might test" to "Power Roll + Might", the untouched mode dropdown stays on the sentinel and its label goes from "Default (test)" to "Default (power-roll)". The preview re-parses the same data, so the two always agree.

### Hybrid A + B-for-(c)/(d) only

skills/stamina show the real value (A, seeded and stripped as today); roll gets a sentinel with hint labels. This is the smallest visual change for skills/stamina, but it gives two select semantics in one form, SC-483 seeding stays live, and it goes against the uniform "Default (…)" first-option pattern Scott already ruled for fonts.

## 4. Recommendation: B + C2 (uniform sentinel, parser-derived live label), A for required selects

Behaviour per class (optional selects):

| Class | Field | On open (key absent) | Validation | Preview | Save: untouched / changed / changed back to Default |
|---|---|---|---|---|---|
| (a) | stam style | "Default (default)" selected; options: Default (default), default, sheet | key absent, valid | `default` bar | not written / written / not written |
| (b) | skills style | "Default (ledger)" | absent | ledger layout | not written / written / not written |
| (c) | roll mode | "Default (test)" for `roll: Might test`; relabels live as `roll:` is edited | absent | mode derived from the expression | not written / written (explicit `mode:` then pins it) / not written |
| (d) | roll difficulty | "None" (zero C2 hits) | absent | caption without "difficulty" | not written / written / not written |

- Key **present** in the source with a value: that option is selected as today; it is written as today, or removed if the user picks Default.
- Key **present with null** (`style:`): today it is seeded with enum[0] and written as `style: <enum[0]>` (the SC-483 test "a key present in the source with a null value…"). **Owner call.** Recommended: treat null as absent, i.e. delete the key on open, select Default, and Save drops the valueless line. Real rendering of `style:` null is an AJV type error card, so this "repairs" to the real default instead of to enum[0]. The alternative is to keep the null key so validation flags it.
- **Required** select (none built-in): no sentinel; seed = schema `default` if it is in the enum, else enum[0]; never stripped (SC-483 guard kept).
- **Label recompute timing:** in `revalidate()`, before the `saveDisabled` early-return in `renderPreview` (so an unrelated invalid field still relabels); try/catch per field; keep the previous label on a throw.
- **SC-483 machinery:** with optional selects unseeded and required ones never added, `untouchedSeeds` is always empty, so `withoutUntouchedSeeds` and `currentBody(forSave)` become dead. **Owner call:** remove them (the SC-483 jest cases stay as outcome pins) or keep them as a guard. Recommended: remove, with a comment pointing to SC-488.

Files it would touch:
- `src/authoring/FormModal.ts`: select case `:163-187` (sentinel option, no seed for optional, delete on sentinel, null-as-absent), a label-recompute helper called from `revalidate()` `:234-251`, a `required`-aware seed fallback, and possible removal of `:54-58`/`:199-223`.
- `src/authoring/formModel.ts`: `FormField` gains `default?: string` and `required: boolean` (`:12-19`, `:55-62`).
- `src/authoring/schemaShape.ts`: `RawSchemaNode.default?: unknown` (`:18-26`).
- `test/mocks/obsidian-core.ts`: `FakeDropdown` gets a real jsdom `selectEl` populated by `addOption` (`:858-877`), so tests can read the relabelled option text. This is additive.
- `test/dom/authoring/formModal.test.ts`: new `describe('SC-488')`: skills Default (ledger) + preview `data-skills-style="ledger"` + Save omits; roll `Might test` label "Default (test)" → edit roll → "Default (power-roll)", preview mode follows; difficulty "None" + caption has no "difficulty"; explicit pick written; explicit then Default not written; source `style: sheet` → Default removes the line; required select has no sentinel, seeds the schema default, is written. Plus a registry census test: every optional select on every registered element leads with the sentinel and its C2 label equals the effective value of `parse(absent)`. That catches future selects and parser drift. Re-assert 3 SC-483 expectations: `formModal.test.ts:398` and `:426` (preview `style:'default'`), where the preview no longer sees a seed; `:379-384` (the null-key case), if null-as-absent is taken.
- No change to: element schemas or definitions/models, e2e manifests (FormModal has 0 `data-dse-control`; `test/dom/e2eCensus.test.ts` does not cover it), browser shots/freeze. The obsidian-camera `modal-form` shot (`visual-harness/obsidian-camera.mjs:204-213`) opens a schemaless `feature` form (textarea), so it is unaffected. There is no lifecycle gate on the form, so no G-S29 is needed unless the owner wants one. A real-Obsidian probe (reviewer B) should confirm the sentinel option and its live relabel through the real `DropdownComponent.selectEl`.

Taste calls for Scott vs. decided:
- **Taste:** the sentinel label format ("Default (x)" per the font-dropdown precedent, or "Automatic (x)" for derived fields); the zero-match label ("None" vs "Default (none)"); whether to accept stamina's "Default (default)" or special-case it.
- **Decided by Expected:** absent → display names the value the block uses; preview = saved result (both follow from B + C2 with no seed).
- **Owner (not Scott):** null-valued key handling; removing the dead SC-483 strip code; C2 (generic) vs C1 (per-field hook).

## Environment notes

- `git -C <plugin> fetch origin`: `origin/develop` = `424f47b` (not moved); HEAD `424f47b`; branch `sc488-form-real-default`.
- The worktree had no `node_modules`. I copied it (`cp -a`) from the main checkout (identical `package-lock.json`, the same precedent as SC-483 r1). It is gitignored and left in place for the implementer.
- My probe test `test/dom/authoring/zzSc488ProbeK7q2xz.test.ts` ran under jest and was deleted by exact path. `git -C <plugin> status --porcelain` is empty.
- jest footgun: `--selectProjects dom <path>` swallows the path as a project name and runs all 155 dom suites. Put the path first: `npx jest <path> --selectProjects dom`.
