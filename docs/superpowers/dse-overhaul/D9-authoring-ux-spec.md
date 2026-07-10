# D9 — Authoring & Editing UX (DSE) — Feature Spec

**Program:** DSE Overhaul (see `README.md` in this directory) — Wave 2, planning only.
**Author:** Fable deep analysis, 2026-07-01.
**Status:** Draft for Scott's review. **Zero code changes** — this is a spec.
**Depends on:** F1 (Element Framework v2 — the registry, `ElementDefinition.schema`,
`ValidationService`, `BlockHost`) and F2 (SDK 3.x readers for the text importer).
**Menu item:** M1 section E (Insert commands + editor suggest · Form/GUI editor · Text
importer · YAML schema hints).

**One-line summary:** the four authoring tools are **generators, not editors** — each one
loops over F1's `ElementRegistry` and reads each element's `schema`, so registering a new
element in F1 automatically yields an insert command, a `/`-suggestion, a scaffold, a form,
and schema hints, with **zero per-element authoring code**.

Repos / paths referenced:

| Thing | Path |
|---|---|
| DSE plugin | `/home/scott/code/steelCompendium/workspace/draw-steel-elements/` |
| F1 spec | `docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md` |
| F2 spec | `docs/superpowers/dse-overhaul/F2-data-unified-sdk-integration-spec.md` |
| SDK source | `/home/scott/code/steelCompendium/workspace/data-sdk-npm/src/io/` |
| Existing schemas | `draw-steel-elements/src/model/schemas/*.yaml` |
| Existing validator | `draw-steel-elements/src/utils/JsonSchemaValidator.ts` |

---

## 1. Core principle — registry/schema-driven authoring

Today authoring is unsupported: users hand-write raw YAML into `ds-*` fences with no
scaffold, no completion, and no feedback until the block fails to render. D9 fixes this
**without adding per-element work**, by making every authoring tool a pure function of F1's
declaration model.

**The single source of truth is F1's `ElementRegistry` (F1 §2.3, §3.1).** Every element is
already an `ElementDefinition` carrying exactly the metadata authoring needs:

```ts
interface ElementDefinition<M> {
  id: string;                 // "stamina-bar" — stable machine id
  name: string;               // "Stamina bar" — human label for palette/suggest/form title
  aliases: readonly [canonical: string, ...string[]]; // "ds-stam" first → fence we emit
  shape: ElementShape;        // static | interactive | persisted
  schema?: string;            // YAML-text JSON-Schema → drives scaffold, form, hints, validation
  parse(data, raw): M;
  serialize?(model): string;  // present on persisted elements → form/importer write path
  createView(cx): ElementView<M>; // → live preview inside the form/importer
}
```

**The whole of D9 is four functions of `registry.all()` and `def.schema`:**

| Tool | Reads from the definition | Produces |
|---|---|---|
| Insert commands + `EditorSuggest` | `id`, `name`, `aliases[0]`, `schema` (for the scaffold body) | one command + one suggestion per element |
| Form/GUI editor | `schema` (→ controls), `serialize`/`parse` (→ round-trip), `createView` (→ preview) | a modal form per element |
| Text importer | SDK-model backing (→ reader), `aliases[0]` (→ fence), `schema` (→ post-validate) | a `ds-*` block from pasted text |
| Schema hints + squiggles | `schema` (→ keys, enums, validation), `aliases` (→ which element a fence is) | completion + inline diagnostics |

**Consequences (non-negotiable design rules):**

1. **No per-element authoring code, ever.** There is no `insertStaminaBar()`,
   no `StaminaBarForm`. Adding an element to the registry in F1 is the *only* action needed
   to get all four tools (§6).
2. **Reuse F1's `ValidationService` (F1 §5)** for every validation surface — the form,
   the importer preview, and the inline squiggles all call
   `validationService.validate(def.id, def.schema, data)` (compiled-per-id cache). D9 does
   **not** build a second validator, and it retires the free-function
   `validateJsonSchema`/`validateYamlWithYamlSchema` calls in `JsonSchemaValidator.ts` as
   authoring paths move onto the service.
3. **Reuse F1's `BlockHost` (F1 §3.4)** as the write path. The form editor is, mechanically,
   a *generic persisted editor* for any element: it serializes a working object and calls
   `host.replaceSource()` — the same atomic `Vault.process` path persisted elements already
   use. D9 adds no new file-writing code.
4. **Reuse SDK readers/writers (F2)** for the text importer. D9 hand-rolls **no**
   statblock/ability parsing — it delegates to `AutoDataReader` / `MarkdownStatblockReader`
   / `MarkdownFeatureReader` / `MarkdownFeatureblockReader` and re-emits via `YamlWriter`.

**One small additive coordination with F1** (Open Decision OD-1): scaffolds and forms are
*fully functional from the schema alone*, but a curated example block and per-field UI hints
noticeably improve them. We propose an **optional** `authoring` member on
`ElementDefinition` — absence changes nothing (full support still derived from the schema),
presence only enriches:

```ts
// additive, back-compatible extension to F1's ElementDefinition — OD-1
interface ElementDefinition<M> {
  // …all F1 fields unchanged…
  authoring?: {
    /** Curated starter block body (overrides the schema-derived scaffold). */
    example?: string;
    /** SDK model this element parses, so the importer can route reader → fence. */
    sdkModel?: "statblock" | "feature" | "featureblock";
    /** Per-field label / widget / order overrides for the form; schema is the fallback. */
    fields?: Record<string, { label?: string; widget?: FormWidget; order?: number; hidden?: boolean }>;
  };
}
```

This is the *only* proposed change to an F1 interface, it is purely additive, and it is
flagged for sign-off rather than assumed. Everything else consumes F1/F2 verbatim.

---

## 2. Insert commands + `EditorSuggest` (scaffolding from definitions)

Two entry points, one generator. Both are registered in `onload` by looping the registry.

### 2.1 Insert commands (command palette)

```ts
for (const def of registry.all()) {
  plugin.addCommand({
    id: `insert-${def.id}`,
    name: `Insert Draw Steel: ${def.name}`,     // sentence case per plugin guidelines
    editorCallback: (editor: Editor) => insertScaffold(editor, def),
  });
}
```

`insertScaffold` replaces the selection (or inserts at the cursor) with a fenced block and
drops the cursor on the first editable value:

````ts
function buildScaffold(def: ElementDefinition): { text: string; cursorOffset: number } {
  const alias = def.aliases[0];                 // canonical fence
  const body  = def.authoring?.example ?? scaffoldFromSchema(def.schema);
  return wrapFence(alias, body);                // ```<alias>\n<body>\n```
}
````

`scaffoldFromSchema(schema)` walks the parsed JSON-Schema and emits YAML for **required
properties first, then a commented block of common optionals**, choosing placeholders by
type: `default` if present → `enum[0]` if present → a typed stub (`0`, `""`, `[]`, `{}`) with
the property `description` as a trailing `# comment`. For SDK-backed elements that carry no
plugin schema (feature/featureblock/statblock today), the scaffold falls back to
`def.authoring.example` (a curated minimal block); this is why those three elements are the
main beneficiaries of OD-1's `example`.

### 2.2 `EditorSuggest` (`/`-style scaffolding)

Obsidian's `EditorSuggest<T>` is a **first-class API** (not raw CM6) that works in source
mode and Live-Preview editing. One suggester covers all elements:

```ts
class DsElementSuggest extends EditorSuggest<ElementDefinition> {
  onTrigger(cursor, editor): EditorSuggestTriggerInfo | null {
    // match a trigger token at the cursor, e.g. /ds… (OD-2 finalizes the token)
    const line = editor.getLine(cursor.line).slice(0, cursor.ch);
    const m = /(?:^|\s)\/ds([a-z-]*)$/i.exec(line);
    return m ? { start: {...}, end: cursor, query: m[1] } : null;
  }
  getSuggestions(ctx) {
    const q = ctx.query.toLowerCase();
    return registry.all().filter(d =>
      d.name.toLowerCase().includes(q) || d.aliases.some(a => a.includes(q)));
  }
  renderSuggestion(def, el) { /* def.name + canonical alias + one-line description */ }
  selectSuggestion(def, _evt) {
    // replace the trigger token with buildScaffold(def), place cursor inside
    this.context!.editor.replaceRange(scaffold.text, this.context!.start, this.context!.end);
  }
}
plugin.registerEditorSuggest(new DsElementSuggest(app, registry));
```

The suggester **shows every registered element by name/alias**, filters by the typed query,
and on selection replaces the trigger token with the full scaffold — the "type `/`, pick an
element, get a ready-to-edit block" flow.

### 2.3 CM6 / LP-deferral note

- `EditorSuggest` and `Editor` commands operate in the **edit surface** (source mode + Live
  Preview *editing*), which exists today regardless of F1's reading-mode-only rendering.
  **These tools are not blocked by the LP render deferral** — F1 defers
  `LivePreviewBlockHost` (the *render* side); insert/suggest run at authoring time in the
  editor and need no render host. Call this out explicitly to avoid a false "blocked on LP"
  assumption.
- Only real risk is **trigger-token collision** with Obsidian's core slash-command menu and
  other community suggesters (OD-2). Low overall risk; ship this tool first.

---

## 3. Form/GUI editor (schema → form; read/write via `BlockHost`)

The form editor is the "edit an element without touching YAML" tool. It is a single generic
modal parameterized by an `ElementDefinition` — **no per-element form classes**.

### 3.1 Schema → form generation

`buildForm(def)` walks the parsed `def.schema` (JSON-Schema) and maps nodes to controls:

| Schema node | Control |
|---|---|
| `string` | text input |
| `string` + `enum` | dropdown (`enum` values; `default` preselected) |
| `integer` / `number` | number input (respect `minimum`/`maximum`) |
| `boolean` | toggle |
| `array` | repeatable rows (add/remove; item control from `items`) |
| `object` / `$ref` | nested fieldset (resolves shared `component-wrapper` `$ref`) |
| `description` | field help text / tooltip |
| `required` + `errorMessage` | required marker + inline error slot |

Per-field `label`, `widget`, `order`, and `hidden` come from `def.authoring.fields` when
present, else are derived from the schema (property name → sentence-case label, declaration
order). The form is built with `createEl`/Obsidian `Setting` rows — vanilla, no form lib.

### 3.2 Read/write through `BlockHost`

The form is a thin front-end over F1's persisted write path:

1. **Open** (two entry points):
   - **From the editor** — command `edit-ds-element-form` ("Edit Draw Steel element as
     form") finds the `ds-*` fence enclosing the cursor, reads its language, `registry.get`s
     the definition, and seeds the form with `parseYaml(body)`.
   - **From a rendered element** — an optional pencil affordance inside the reading-mode
     `ElementView` opens the same form. This works in reading mode because the write path is
     `BlockHost.replaceSource()` (atomic `Vault.process` + section-info line splice, F1
     §3.4) — no editor required. Gated by `host.canPersist` (disabled in embeds/exports).
2. **Edit** — the form maintains a plain working object (no reactivity dep). Every change
   runs `validationService.validate(def.id, def.schema, working)` and reflects
   `path → message` errors inline (§5 reuse), disabling **Save** while invalid (hard-fail
   parity with F1 OD-4; a "save anyway" escape hatch is OD-6).
3. **Live preview** — the form renders the element live beside the fields by running the
   F1 pipeline against the working object into a throwaway container
   (`def.createView(cx)` + `view.mount(previewEl, def.parse(working, raw))`), torn down with
   the modal. Mode-blind views (F1 principle 2) make this free.
4. **Save** — body = `def.serialize?.(model) ?? stringifyYaml(working)`; then
   `host.replaceSource(body)`. For persisted elements this is literally their existing
   write-behind; for static elements the form supplies the first `serialize`-shaped emitter
   (plain `stringifyYaml`).

### 3.3 SDK-backed elements without a schema

Feature/featureblock/statblock have **no plugin `schema`** (F1 §5 — SDK owns their parse).
The form degrades gracefully (OD-4): either (a) generate the form from the **SDK's own
JSON-schema** (shipped in `steel-compendium-sdk`, draft-2019 — the `ValidationService` is
already 2019-capable per F1/F2), or (b) fall back to a raw-YAML textarea with live validation
via the SDK reader's own errors. Recommendation: (b) now, (a) once F1 OD-4 lands schemas.

### 3.4 CM6 / LP-deferral note

No CM6 involvement — the form is a `Modal` writing through `BlockHost`. The reading-mode
pencil path is fully supported today; an in-editor form uses `Editor` block addressing. LP
deferral does not affect it.

---

## 4. Text importer (SDK-reader-backed)

Turns pasted raw text into a `ds-*` block. **All parsing is delegated to the SDK** (F2
§2.2 A4) — D9 writes no statblock/ability grammar.

### 4.1 Flow

Command `import-ds-element` ("Import Draw Steel element from text…") opens a modal with a
paste textarea, a **type selector** (`Auto` default, or explicit Statblock / Ability /
Featureblock), a generated-YAML pane, and a live rendered preview.

```
paste text ─▶ reader.read(text) ─▶ SDK model ─▶ YamlWriter.write(model) ─▶ body
                    │                                                        │
                    └─ AutoDataReader / MarkdownStatblockReader /            ▼
                       MarkdownFeatureReader / MarkdownFeatureblockReader   wrap in ```<alias>```
                                                                            │
                    fence alias from registry (model type → def.authoring.sdkModel → aliases[0])
                                                                            ▼
                            ValidationService.validate(def.id, def.schema, parseYaml(body))
                                                                            ▼
                                                       preview (F1 pipeline) → Insert at cursor
```

- **Parse:** `Auto` uses `AutoDataReader`, which calls `SteelCompendiumIdentifier.identify()`
  to sniff the format and hand back the right reader. An explicit type selection instantiates
  that reader directly (`new MarkdownStatblockReader().read(text)` etc.).
- **Emit:** the parsed SDK model is serialized back to YAML with the SDK's **`YamlWriter`**
  (the same shape the elements consume), then wrapped in the canonical fence for that model
  type: Statblock → `ds-sb`, Feature → `ds-feature`, Featureblock → `ds-fb`. The
  model-type → element mapping is read from the registry
  (`def.authoring.sdkModel`), not hard-coded — so a future SDK-backed element joins the
  importer by declaring its `sdkModel`.
- **Validate + preview:** the generated body is validated via `ValidationService` and
  rendered live with the F1 pipeline before the user commits. **Insert** drops the block at
  the cursor (reusing §2's insert helper).

### 4.2 Supported inputs (v1)

The importer covers exactly what the SDK readers cover:

- **sc-md statblock text** — the `> 🔳 / ⭐️` blockquote monster format (`MarkdownStatblockReader`).
- **ability / feature markdown** — the `MarkdownFeatureReader` format.
- **featureblock markdown** — `MarkdownFeatureblockReader`.
- **plain YAML or JSON** — `AutoDataReader` identifies and re-emits it canonically (a handy
  "clean up my YAML" path).

Out of scope: OCR/PDF, screenshots, and arbitrary homebrew prose that the SDK readers do not
recognize.

### 4.3 Confidence / fallback

- `SteelCompendiumIdentifier.identify()` returns a `SteelCompendiumFormat`; `Unknown`
  surfaces a "couldn't recognize this text" message and invites the user to pick a reader
  explicitly or fall back to inserting a **blank scaffold** (§2) to fill in by hand.
- A reader `throw` is caught and shown with the **F1 error-card copy standard** (stage +
  message) inside the modal — never a silent failure or a half-built block.
- The generated-YAML pane is editable before insert, so a near-miss parse can be hand-corrected
  with live validation, then inserted.

### 4.4 Dependency note

The importer depends on **F2's SDK 3.2 bump** (readers/writers must match the data shape the
elements parse). Until F2 lands, the importer can be built against the pinned SDK but its
statblock output won't carry the 3.x `role`/`organization`/`keywords` fields.

---

## 5. Schema hints & inline validation (CM6 surface)

Two editor-side surfaces, both derived from `def.schema`, both reusing `ValidationService`.
**This is the highest-complexity part of D9** and the one place CM6 is unavoidable.

### 5.1 Key/enum autocomplete (low risk)

A second `EditorSuggest` fires **inside** a `ds-*` fence: `onTrigger` walks upward from the
cursor to find the enclosing opening fence, reads its language, `registry.get`s the element,
and suggests from `def.schema`:

- at a line where a key is being typed → **property-name completions** (unused required keys
  first, then optionals), each annotated with its schema `description`;
- after `key:` where the property has an `enum` → **enum-value completions**;
- respects `component-wrapper` `$ref` so `collapsible` / `collapse_default` are offered.

`EditorSuggest` is a supported API, so this surface is low-risk and ships before the linter.

### 5.2 Inline validation squiggles (the hard part)

Underlining schema violations as-you-type requires a real CM6 editor extension registered via
`registerEditorExtension`:

```ts
plugin.registerEditorExtension([
  dsLinter(registry, validationService),   // @codemirror/lint linter() — debounced
]);
```

For each `ds-*` fenced block in the document, the linter extracts the body, parses it
(`parseYaml`), runs `validationService.validate(def.id, def.schema, data)`, and turns each
`ValidationError` into a CM6 diagnostic. The reuse boundary is clean: **the linter maps
errors to ranges; it does not judge validity — `ValidationService` does.**

**Biggest risk — error-path → source-range mapping.** AJV returns an `instancePath`
(`/properties/max_stamina`), not a character offset. Obsidian's `parseYaml` discards source
positions, so mapping an error to the exact token needs either a heuristic (find the key's
line within the block by name) or a **position-aware YAML parser** (a CST parse) — a new dep
(OD-3). Mitigation ladder:

1. **v1 — block-level diagnostics:** underline the opening fence (or the whole block) with a
   hover/gutter listing every `path: message`. No positional YAML parser needed; reuses the
   error list the error card already formats. Ships with zero new deps.
2. **v2 — per-line diagnostics:** map each error's leaf key back to its line by scanning the
   block text for `^\s*<key>:`. Good enough for flat schemas (most DSE elements), still no dep.
3. **v3 — precise ranges:** adopt a CST YAML parser (`yaml` package's `parseDocument` exposes
   node ranges) to underline exact values — **new dependency, OD-3**.

### 5.3 CM6 / LP-deferral interplay (call out explicitly)

- **`obsidian`, `electron`, and CM6 packages are external/host-provided** (per DSE's build);
  the linter imports `@codemirror/view`, `@codemirror/state`, and `@codemirror/lint` as
  externals — **confirm `@codemirror/lint` is on the Obsidian-provided CM6 surface** (OD-4);
  if it is not bundled, either bundle it (small) or hand-roll a `Decoration`-based underline.
- **LP-deferral does NOT block this.** F1 defers `LivePreviewBlockHost`, which is about
  *rendering* `ds-*` blocks in Live Preview. Schema hints live in the **edit** surface
  (source mode + Live-Preview editing), which is present today. The linter reads block text
  and underlines it in the editor — it never renders an element, so it needs no render host
  and is independent of the LP-render deferral. This is worth stating because "CM6 + LP" reads
  as blocked when it is not.
- **Performance:** debounce validation on document changes; early-exit documents with no
  `ds-` fence (mirrors F2's `querySelector` early-exit discipline). `ValidationService`'s
  compiled-per-id cache (F1 §5) keeps per-keystroke cost to a validate call, not a recompile
  (fixing today's recompile-per-validation in `JsonSchemaValidator.validateJsonSchema`).

---

## 6. How new elements get authoring support for free

This is the payoff and the acceptance test for the whole spec. When a future effort (D5–D8)
adds an element by registering an `ElementDefinition` in F1, **with no D9 code change** it
immediately gains:

| From the definition | Authoring support it unlocks |
|---|---|
| registered in `registry` | an **Insert command** and an **`EditorSuggest` entry** (§2) |
| `schema` present | a **scaffold body**, a **generated form**, **key/enum completion**, and **inline validation** (§2.1, §3.1, §5) |
| `serialize` (persisted) / `stringifyYaml` fallback | **form save** through `BlockHost` (§3.2) |
| `createView` | a **live preview** in the form and importer (§3.2, §4.1) |
| `authoring.sdkModel` (optional) | inclusion in the **text importer** with the right reader + fence (§4.1) |
| `authoring.example` / `authoring.fields` (optional) | a nicer scaffold and a tuned form — pure enhancement (§1) |

The only element that needs *any* optional metadata to be first-class is an SDK-backed one
(so the importer knows its reader) — one line of `authoring.sdkModel`. Everything else is
derived. This is why D9 is small: it is four generators over F1's registry, not authoring UI
multiplied across 11+ elements. It also aligns the incentives — F1 OD-4 ("a `schema.yaml`
for every non-SDK element") directly buys better authoring here, so the two efforts reinforce.

---

## 7. Dependencies & Open Decisions

### Dependencies (on other efforts)

- **F1** — hard dependency: `ElementRegistry`, `ElementDefinition` (`schema`, `aliases`,
  `serialize`, `createView`), `ValidationService`, `BlockHost.replaceSource`,
  `ElementView` + pipeline (for the form/importer live preview), `renderErrorCard` copy
  standard. D9 imports these names verbatim.
- **F2** — text-importer dependency: SDK 3.2 readers (`AutoDataReader`,
  `MarkdownStatblockReader`, `MarkdownFeatureReader`, `MarkdownFeatureblockReader`,
  `SteelCompendiumIdentifier`) and `YamlWriter`.
- **Obsidian APIs** — `addCommand`/`editorCallback`, `EditorSuggest` +
  `registerEditorSuggest`, `Modal`/`Setting`, `registerEditorExtension`. No `fetch`, no Node
  builtins; nothing mobile-hostile.

### New third-party dependencies

- **None required** for insert/suggest, the form, or the importer (all Obsidian + F1 + SDK).
- **Possible one** for precise squiggle ranges: a position-aware YAML parser (`yaml`'s
  `parseDocument`) — **only** for §5.2 v3, and only if we want exact-token underlines.
  Written up as OD-3 per program decision #4 (new tech = explicit Open Decision). The v1/v2
  ladder needs no new dep.

### Open Decisions — needs Scott

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **OD-1** | Additive `ElementDefinition.authoring` field in F1 (example snippet, `sdkModel`, per-field UI hints) | (a) add it — richer scaffolds/forms, needs an F1 interface touch (additive, back-compat) · (b) schema-only — no F1 change, but no curated examples and the importer needs a separate model→element map | **(a)** — additive and cheap; makes SDK-backed elements first-class in the importer and lets curated examples beat bare schema stubs. Coordinate the field into F1. |
| **OD-2** | `EditorSuggest` trigger token for insert scaffolding | `/ds…` · bare `ds-` · a configurable prefix | **`/ds…`** — discoverable, unlikely to fire mid-word; make it a setting if it collides with users' other suggesters. |
| **OD-3** | Squiggle precision vs a new YAML-CST dep | (v1) block-level diagnostics · (v2) per-line key scan · (v3) precise ranges via a CST YAML parser (new dep) | **Ship v1 → v2 with no dep; defer v3** until users ask for exact-token underlines. |
| **OD-4** | `@codemirror/lint` availability + SDK-backed form generation | lint: on host CM6 surface vs bundle it · form for schemaless SDK elements: raw-YAML fallback vs generate from SDK JSON-schema | **Verify `@codemirror/lint` is host-provided (else bundle — small); raw-YAML fallback now, SDK-schema form once F1 OD-4 lands element schemas.** |
| **OD-5** | Importer type detection default | `Auto` (via `SteelCompendiumIdentifier`) vs force an explicit picker | **`Auto`, with the picker as override** — lowest friction; explicit reader on `Unknown`. |
| **OD-6** | Form hard-fail vs save-with-warning | disable Save while invalid (F1 OD-4 parity) vs allow "save anyway" | **Hard-fail with a visible "save anyway" escape hatch** for power users editing mid-refactor. |
| **OD-7** | Reading-mode "edit as form" pencil affordance | add it (great discoverability, writes via `BlockHost`) vs editor-command-only (smaller surface) | **Add it, gated on `host.canPersist`** — the write path already exists in F1; discoverability is the whole point of D9. |

### Non-goals (D9)

- **Live-Preview rendering** of `ds-*` blocks (F1 defers `LivePreviewBlockHost`; D9's editor
  tools are unaffected but do not implement it).
- **Compendium search-and-insert** (M1 D — pairs with these tools but is F2-gated; separate).
- **Bulk/vault-wide import** (one paste at a time in v1).
- **A visual grid/token editor** or any WYSIWYG beyond schema-generated forms.
- **New elements themselves** (D5–D8) — D9 only makes authoring them free.
```
