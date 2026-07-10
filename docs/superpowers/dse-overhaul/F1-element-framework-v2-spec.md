# F1 — Element Framework v2 (DSE) — Architecture Spec

**Status:** proposed (planning only — no code changes)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin, v5.1.1)
**Audience:** downstream effort specs — D1 (Vue removal), D2 (UI overhaul), D3 (theming /
Legacy theme), D4 (preferences), F2 (SCC resolution). Those specs **import the interface
names defined in §3 verbatim**; do not rename without updating this file.

**One-line summary:** replace the per-element processor pattern (and the Vue detour) with a
single declarative element registry + one mode-agnostic render pipeline
(parse → validate → resolve-refs → render → update → teardown), with three injection seams
(theming, preferences, reference/SCC resolution) and lifecycle-correct Obsidian plumbing
baked into the framework instead of copy-pasted into 11 processors.

---

## 1. As-is analysis

### 1.1 The processor/Vue duality

Today each `ds-*` code block maps to a hand-wired processor
(`src/utils/RegisterElements.ts`, ~70 lines of `registerMarkdownCodeBlockProcessor` calls).
Two rendering strategies coexist:

- **DOM processors** (`src/drawSteelAdmonition/`): a `*Processor` class exposing
  `readonly handler = (source, el, ctx) => this.postProcess(...)`, which parses YAML via a
  model's static `parseYaml()`/`readYaml()`, builds DOM through `View` classes
  (`FeatureView`, `StatsView`, …) with `createEl`, and hand-rolls a try/catch error `div`.
- **Vue processors** (`src/utils/ComponentProcessor.ts` + `src/drawSteelComponents/`):
  `genericComponentProcessor` mounts a Vue 3 app per block, `provide()`s
  `obsidianPlugin/App/Context`, and stashes the app on the wrapper element
  (`(vueWrapper as any)._vueApp`) — **it is never unmounted**. Used by StaminaBar,
  SkillList, HorizontalRule.

The ADR `.repo-docs/decisions/2026-04-06-revert-vue-3-adoption.md` (accepted, unexecuted)
already decided Vue goes. `.repo-docs/architecture.md` still describes Vue as go-forward —
treat it as the as-is snapshot this spec replaces.

### 1.2 Costs of the current shape (what v2 must eliminate)

| Cost | Evidence |
|---|---|
| **Duplicated boilerplate ×11** | Every processor re-implements: handler lambda, container creation, try/catch error card (same copy 6×), the mousedown/pointerdown "click shield". |
| **No lifecycle management** | Raw `addEventListener` everywhere; Vue apps never unmounted; nothing uses `Component`/`MarkdownRenderChild`; `MarkdownRenderer.render(..., this.plugin as Component)` parents rendered markdown to the *plugin*, accumulating children for the plugin's whole life (a known Obsidian anti-pattern and leak). |
| **Full-rebuild updates** | Interactive elements update by `container.empty(); this.buildUI(...)` **plus** writing YAML back to the file, which triggers Obsidian to re-run the postprocessor — a second full rebuild per click. |
| **Persistence via `Vault.modify`** | `CodeBlocks.updateMarkdownCodeBlock` does read → splice lines → `vault.modify` (non-atomic; the Obsidian guideline is `Vault.process` for background modifications). Canvas writeback works by matching the *currently selected* canvas node's text — silent data loss if selection moved. |
| **Two mental models** | DOM `View` classes vs. Vue SFCs; a *third* half-model exists: dead DOM twins of Vue elements (`drawSteelAdmonition/StaminaBar/StaminaBarProcessor.ts` + `StaminaBarView.ts` are imported by RegisterElements but never registered; `Common/horizontalRuleProcessor.ts` duplicates `HorizontalRule.vue`). |
| **Global mutable validation state** | `JsonSchemaValidator.ts` module-level singleton (`globalAjv`, `registeredSchemas`) reset manually in `onunload`; `validateJsonSchema` nonetheless builds a **fresh AJV instance and recompiles the schema on every validation**. |
| **Mode lock-in** | Processors receive `MarkdownPostProcessorContext` directly and call `ctx.getSectionInfo(ctx.el)` deep inside views/modals — nothing can be reused in a CM6 Live-Preview widget. |
| **Inline styles** | e.g. `staminaEl.style.color = "red"` in `initiativeProcessor.ts` — blocks theming (D3) and violates plugin-review guidance. |
| **Build/tooling tax** | `vue`, `unplugin-vue`, `vue-tsc`, `shims-vue.d.ts`, Vue `define` flags in `esbuild.config.mjs` — all for 3 elements. |

### 1.3 Element inventory by shape

The framework must serve three shapes. (Shape names are load-bearing: they appear in
`ElementDefinition.shape`, §3.1.)

| # | Element | Aliases | Impl today | Shape | Notes |
|---|---|---|---|---|---|
| 1 | Feature / Ability | `ds-ft` `ds-feat` `ds-feature` | DOM (`Features/`) | **static** | SDK-backed (`Feature.read(new YamlReader(...))`); heavy `MarkdownRenderer` use |
| 2 | Featureblock | `ds-fb` `ds-featureblock` | DOM (`featureblock/`) | **static** | SDK-backed |
| 3 | Statblock | `ds-sb` `ds-statblock` | DOM (`statblock/`) | **static** | SDK-backed; composes `HeaderView`/`StatsView`/`FeaturesView`; a `CodeBlocks.updateStatblock` writeback helper exists but the render path is static today |
| 4 | Initiative Tracker | `ds-it` `ds-init` `ds-initiative` `ds-initiative-tracker` | DOM (533-line processor) | **persisted** | Full encounter state round-trips through block YAML; 4 modals; conditions; minion pools; canvas support |
| 5 | Negotiation Tracker | `ds-nt` `ds-negotiation` `ds-negotiation-tracker` | DOM (`negotiation/`) | **persisted** | Tabs (session UI state) + persisted progress; `Menu`, `Notice` |
| 6 | Stamina Bar | `ds-stam` `ds-stamina` `ds-stamina-bar` | **Vue** | **persisted** | Edit modal → `CodeBlocks.updateStaminaBar`; schema-validated |
| 7 | Counter | `ds-ct` `ds-counter` | DOM (`Counter/`) | **persisted** | `CodeBlocks.updateCounter` |
| 8 | Characteristics | `ds-char` `ds-characteristics` | DOM | **static** | |
| 9 | Skills | `ds-skills` | **Vue** | **interactive** (session-only) | Collapsible groups; schema-validated; no writeback |
| 10 | Values Row | `ds-vr` `ds-value-row` `ds-values-row` | DOM (`ValuesRow/`) | **static** | |
| 11 | Horizontal Rule | `ds-hr` `ds-horizontal-rule` | **Vue** (+ dead DOM twin) | **static** | Zero config; simplest element |

Shape definitions:

- **static** — render once from the model; no internal state beyond what CSS handles.
- **interactive** — has in-view UI state (tabs, collapse, selection) that lives for the
  session but is *not* written back to the note.
- **persisted** — user actions mutate the model and the mutation is serialized back into
  the code block's YAML (the note is the database).

Elements can mix (Negotiation is persisted *and* has session-only tab state); `shape`
records the strongest requirement.

### 1.4 Preserve vs. replace

**Preserve (behavioral contracts users depend on):**

- All `ds-*` aliases exactly as registered today (they are user-facing API).
- YAML input formats per element, including `ComponentWrapper`'s `collapsible` /
  `collapse_default` keys.
- "The note is the database": persisted elements round-trip their state through the block
  YAML via `stringifyYaml` — this survives sync/git and is a feature, not a bug.
- Reference syntax `@path` and `[[wikilink]]` resolving to the first `ds-*` block of the
  target file (`ReferenceResolver` semantics, incl. compendium-directory fallback and
  `metadataCache.getFirstLinkpathDest`).
- SDK-backed parsing for Feature/Featureblock/Statblock (`steel-compendium-sdk`, bundled
  at build time).
- AJV + YAML-format JSON-schemas as the validation technology (schemas in
  `src/model/schemas/`, imported as raw text by the esbuild YAML loader).
- Canvas-card writeback (best-effort, quarantined — see §4.4).
- Reading-mode click shield (capture-phase `mousedown`/`pointerdown` stop) — as a
  framework default with per-element opt-out.
- ES2018 / CJS / esbuild build; `obsidian`, `electron`, CM6 external.

**Replace:**

- `RegisterElements.ts` → declarative `ElementRegistry` (§3.2).
- `genericComponentProcessor` + all Vue components → `ElementView` subclasses (D1 executes
  the removal; this spec defines what they migrate onto).
- Per-processor try/catch copies → one pipeline error boundary + `renderErrorCard` (§3.7).
- `CodeBlocks` static methods → `BlockHost.replaceSource()` (§3.4) using `Vault.process`.
- Module-global AJV singleton → plugin-scoped `ValidationService` (§5).
- Dead code: `drawSteelAdmonition/StaminaBar/*` (unregistered DOM twin), the Vue `Common/`
  kit (rebuilt vanilla by D2).

**Fix while migrating (correctness debts):**

- Every DOM listener via `Component.registerDomEvent`; every subscription via
  `Component.register`; views attached to the block's lifecycle via `ctx.addChild`.
- `MarkdownRenderer.render` parented to the **view**, never the plugin.
- No inline `el.style.*` — semantic classes + tokens (lands fully with D3).
- Popout-window safety: timers created on the element's own window
  (`rootEl.ownerDocument.defaultView`), no bare `window`/`document`.
- Keyboard accessibility for interactive controls (turn indicators, malice steppers,
  condition icons are click-only `div`s today) — framework kit provides accessible
  primitives; D2 owns the sweep.

---

## 2. Framework v2 architecture

### 2.1 Principles

1. **Declare, don't wire.** An element is a data object (`ElementDefinition`) that names
   its aliases, schema, parser, serializer, and view factory. The framework owns
   registration, parsing, validation, ref-resolution, error handling, lifecycle, and
   persistence plumbing.
2. **Views are mode-blind.** A view receives a root `HTMLElement` and a `RenderContext`;
   it never touches `MarkdownPostProcessorContext` or CM6. Everything mode-specific hides
   behind `BlockHost`. Live Preview later = implement `LivePreviewBlockHost`, change zero
   view code.
3. **Views are Obsidian `Component`s.** Lifecycle (`onload`/`onunload`,
   `registerDomEvent`, `register`, child components) is the platform's, not ours. In
   reading mode the view is `addChild`-ed to the block's `MarkdownRenderChild`, so
   teardown on re-render / file close / popout close is automatic.
4. **Update in place; persist behind.** Interactive views mutate their own DOM via
   targeted update methods (no `container.empty()` rebuild); persistence is a debounced
   write-behind through the host.
5. **Seams are interfaces registered at load, consumed via `RenderContext`.** Theming
   (D3), preferences (D4), and reference/SCC resolution (F2) are pluggable services; the
   framework ships minimal default implementations so F1 stands alone.
6. **Vanilla TS + DOM.** No rendering library, no reactivity dependency (candidate
   micro-helper deferred to §8, OD-1).

### 2.2 ASCII architecture diagram

```
                         ┌──────────────────────────────────────────────────────────┐
                         │                    DrawSteelElementsPlugin (main.ts)      │
                         │  onload:                                                  │
                         │   services = { ThemeService, PreferenceStore,             │
                         │                ReferenceService, ValidationService,       │
                         │                SessionStore }                             │
                         │   registry = new ElementRegistry(plugin, services)        │
                         │   registry.register(featureElement, statblockElement, …)  │
                         └───────────────┬──────────────────────────────────────────┘
                                         │ registerMarkdownCodeBlockProcessor(alias)  (one per alias)
                                         ▼
   ```ds-xyz block   ┌───────────────────────────────┐        later (out of scope):
   in reading mode──▶│  ReadingModeBlockHost          │        CM6 ViewPlugin ──▶ LivePreviewBlockHost
                     │  (wraps MarkdownPostProcessor- │        (same pipeline, same views)
                     │   Context; MarkdownRenderChild)│
                     └───────────────┬───────────────┘
                                     │ host: BlockHost
                                     ▼
                     ┌───────────────────────────────────────────────┐
                     │            ElementPipeline.run(def, source,    │
                     │                                host)           │
                     │  1 parseYaml(source)                           │
                     │  2 ValidationService.validate(def.schema, data)│──▶ invalid ──▶ renderErrorCard
                     │  3 def.parse(data, source)          → model    │
                     │  4 def.resolveRefs?(model, refs)    → model'   │   (uses ReferenceService:
                     │  5 view = def.createView(cx)                   │    @path │ [[wikilink]] │ scc.v1: ◀── F2 RefProvider)
                     │  6 host.addChild(view); view.mount(root,model')│
                     └───────────────┬───────────────────────────────┘
                                     │ cx: RenderContext
                                     ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │  ElementView (extends obsidian.Component)                        │
      │   onMount(root, model)        ← build DOM (createEl/createDiv)   │
      │   onUpdate?(model)            ← in-place DOM update              │
      │   this.registerDomEvent(...)  ← auto-cleanup listeners           │
      │   this.renderMarkdown(md, el) ← MarkdownRenderer, view as owner  │
      │   this.persist()              ← def.serialize(model) ─▶ host.    │
      │                                 replaceSource() [debounced,      │
      │                                 Vault.process / canvas node]     │
      │   cx.theme.apply(root, this)  ← data-dse-theme + tokens   (D3)   │
      │   cx.prefs.reflect(root,this) ← data-dse-* pref attrs     (D4)   │
      └──────────────────────────────────────────────────────────────────┘
```

### 2.3 The element declaration / registry model

- Each element lives in `src/elements/<element-id>/` as:
  - `definition.ts` — exports `const staminaBarElement: ElementDefinition<StaminaBarModel>`
  - `model.ts` — plain typed model + `parse(data, raw)` / `serialize(model)` functions
    (static-class ceremony dropped; SDK-backed models keep calling the SDK inside `parse`)
  - `view.ts` — the `ElementView` subclass (plus sub-view classes as needed)
  - `schema.yaml` — the AJV schema (optional, but see OD-5)
- `ElementRegistry.register(def)`:
  1. Validates the definition (unique id, unique aliases, `serialize` present when
     `shape === "persisted"`).
  2. For each alias calls
     `plugin.registerMarkdownCodeBlockProcessor(alias, (source, el, ctx) => pipeline.run(def, source, new ReadingModeBlockHost(plugin, el, ctx, alias)))`.
  3. Records the definition for lookup (`registry.get("ds-stam")` → definition) — used by
     error cards, settings UI (D4 lists elements), and future LP integration.
- **Incremental migration switch:** during migration, `RegisterElements.ts` remains and
  registers *only* not-yet-migrated processors; migrated elements register through the
  registry. Both paths coexist; the plugin ships at every step (§6).

### 2.4 Render pipeline & lifecycle

Lifecycle of one block instance:

```
parse ──▶ validate ──▶ resolve refs ──▶ create view ──▶ mount ──▶ [update]* ──▶ teardown
 (sync)    (sync)        (async)          (sync)         (async)    (in-place)     (auto)
```

1. **parse** — pipeline runs Obsidian `parseYaml(source)` once. Parse failure → error card.
2. **validate** — if `def.schema` set, `ValidationService.validate(def.id, data)` (compiled
   validator cached per element id, §5). Invalid → error card listing `path: message`
   per error (current UX preserved, centrally formatted).
3. **resolve refs** — `def.resolveRefs?.(model, cx.refs)` if declared; otherwise, if
   `def.autoResolveRefs === true` (**opt-in; default OFF as of 2026-07-02** — amended from
   default-ON per the framework-core final review, so un-migrated elements aren't whole-YAML
   ref-walked and don't hit the reserved-`scc:` throw), the pipeline deep-walks the *raw
   data* with `ReferenceService.resolveDeep` **before** `def.parse` (the
   `parseEncounterData`-style `@path` expansion). Async; the pipeline shows nothing until
   resolution completes.
4. **render** — `view = def.createView(cx)`; `host.addChild(view)` ties the view's
   `Component` lifecycle to the block; `view.mount(rootEl, model)` builds DOM. The
   pipeline applies the click shield (unless `def.noClickShield`), theme stamping and
   pref reflection to the root before `onMount` runs, so CSS attributes are present at
   first paint.
5. **update** — two triggers:
   - *Internal mutation* (persisted/interactive): the view mutates the model, calls its
     targeted DOM updates, then `this.persist()`.
   - *External change* (user edited the block, or our own write-behind landed): reading
     mode re-runs the postprocessor → old `MarkdownRenderChild` unloads (auto-teardown),
     new pipeline run mounts a fresh view. `onUpdate` exists so an LP host (and any
     future same-DOM refresh) can hand a changed model to a *live* view without rebuild;
     the default implementation is teardown-and-remount of children.
6. **teardown** — `Component.onunload` cascades: DOM listeners (`registerDomEvent`),
   intervals (`registerInterval`), pref/theme subscriptions (`register`), child views,
   markdown render children. Views must not hold references outside their subtree; the
   framework never stores views on the plugin (only the registry of *definitions*).

Error boundary: any throw in steps 1–4 (and async rejections) is caught once by the
pipeline → `renderErrorCard(root, def, error)` (§3.7). No per-element try/catch.

### 2.5 Proposed source layout

```
src/
  framework/                  ← F1 deliverable; MUST NOT import from src/elements (lint-enforced)
    registry.ts               ElementRegistry, ElementDefinition, ElementShape
    pipeline.ts               ElementPipeline, renderErrorCard
    view.ts                   ElementView
    context.ts                RenderContext, RenderMode
    host/
      BlockHost.ts            BlockHost, BlockInfo
      ReadingModeBlockHost.ts (canvas writeback quarantined here)
      LivePreviewBlockHost.ts (stub + doc comment only; out of scope)
    seams/
      theme.ts                ThemeService, DseThemeId, DseTokenName   (default impl; D3 extends)
      prefs.ts                PreferenceStore, DsePrefs, PrefDescriptor (default impl; D4 extends)
      refs.ts                 ReferenceService, RefProvider, RefRequest, ResolvedRef, RefKind
    validation.ts             ValidationService (plugin-scoped AJV)
    session.ts                SessionStore
    kit/                      shared vanilla widgets (D2 populates: modal, collapsible, stepper…)
  elements/
    horizontal-rule/  values-row/  characteristics/  skills/  stamina-bar/  counter/
    feature/  featureblock/  statblock/  negotiation/  initiative/
      definition.ts  model.ts  view.ts  schema.yaml  (per element)
```

`src/drawSteelAdmonition/`, `src/drawSteelComponents/`, `src/utils/ComponentProcessor.ts`,
`src/utils/CodeBlocks.ts` shrink to empty over the migration and are then deleted.

---

## 3. Concrete interfaces

These are the **exact public names** downstream specs import. Signatures are normative;
bodies are illustrative. All live under `src/framework/`.

### 3.1 Element definition

```ts
// framework/registry.ts
export type ElementShape = "static" | "interactive" | "persisted";

export interface ElementDefinition<M = unknown> {
  /** Stable machine id, kebab-case, never reused. e.g. "stamina-bar" */
  id: string;
  /** Human name for error cards / settings UI. Sentence case. e.g. "Stamina bar" */
  name: string;
  /** Code-block languages. First entry is canonical (used when rewriting blocks). */
  aliases: readonly [canonical: string, ...rest: string[]];
  /** Strongest behavioral requirement — drives pipeline wiring (§1.3). */
  shape: ElementShape;
  /** YAML-text JSON Schema (esbuild yaml-loader import). Omit ⇒ no validation. */
  schema?: string;
  /**
   * Parsed-YAML data → typed model. `raw` is the original block text for
   * SDK readers that consume text (Feature.read(new YamlReader(...), raw)).
   * Throw Error with a user-facing message on bad input.
   */
  parse(data: unknown, raw: string): M;
  /**
   * Model → YAML block body for write-back. REQUIRED when shape === "persisted"
   * (registry rejects the definition otherwise). Typically stringifyYaml(dto).
   */
  serialize?(model: M): string;
  /** View factory; called once per mounted block instance. */
  createView(cx: RenderContext): ElementView<M>;
  /**
   * Custom reference resolution. If omitted AND autoResolveRefs === true, the pipeline
   * deep-resolves @path / [[wikilink]] / scc.vN: strings in the raw data BEFORE parse()
   * via ReferenceService.resolveDeep. (Default is OFF — see autoResolveRefs.)
   */
  resolveRefs?(model: M, refs: ReferenceService): Promise<M>;
  /** Opt IN (true) to whole-YAML deep ref-resolution. DEFAULT OFF (amended 2026-07-02;
   *  was default-ON). Elements doing field-scoped resolution use a custom resolveRefs. */
  autoResolveRefs?: boolean;
  /** Suppress the reading-mode click shield. Default false (shield on). */
  noClickShield?: boolean;
}

export interface ElementRegistry {
  register<M>(def: ElementDefinition<M>): void;
  get(idOrAlias: string): ElementDefinition | undefined;
  all(): readonly ElementDefinition[];
}
```

### 3.2 Render context

```ts
// framework/context.ts
export type RenderMode = "reading" | "live-preview";

export interface RenderContext {
  readonly app: App;                       // obsidian
  readonly plugin: Plugin;                 // DrawSteelElementsPlugin; avoid deep coupling
  readonly settings: Readonly<DSESettings>;
  readonly host: BlockHost;                // §3.4 — the mode adapter
  readonly mode: RenderMode;               // convenience === host.mode
  readonly theme: ThemeService;            // seam (a) — §3.5
  readonly prefs: PreferenceStore;         // seam (b) — §3.6
  readonly refs: ReferenceService;         // seam (c) — §3.7
  readonly session: SessionStore;          // §4.3 — best-effort session UI state
}
```

`RenderContext` is constructed by the pipeline per block instance. It contains **no view
reference and no DOM** — views own DOM; context owns services.

### 3.3 Element view

```ts
// framework/view.ts
export abstract class ElementView<M> extends Component {
  protected readonly cx: RenderContext;
  protected model!: M;
  /** The element's root container (a child of host.containerEl), assigned by mount(). */
  protected rootEl!: HTMLElement;

  constructor(cx: RenderContext) { super(); this.cx = cx; }

  /** Build the DOM. createEl/createDiv only; register listeners via this.registerDomEvent. */
  protected abstract onMount(root: HTMLElement, model: M): void | Promise<void>;
  /** Apply a changed model in place. Optional; default = unload children + onMount again. */
  protected onUpdate?(model: M): void | Promise<void>;

  // Provided (final) — called by the pipeline / host, not overridden:
  mount(root: HTMLElement, model: M): Promise<void>;
  update(model: M): Promise<void>;

  /** Render embedded markdown lifecycle-bound to THIS view (never the plugin). */
  protected renderMarkdown(markdown: string, el: HTMLElement): Promise<void>;
  // impl: MarkdownRenderer.render(cx.app, markdown, el, cx.host.sourcePath, this)

  /** Persisted elements: serialize current model → host.replaceSource(). Debounced
   *  write-behind (§4.2); returns false when host.canPersist is false. */
  protected persist(): Promise<boolean>;

  /** The window this view lives in (popout-safe timer/document access). */
  protected get win(): Window; // rootEl.ownerDocument.defaultView
}
```

### 3.4 Mode adapter — `BlockHost`

The single boundary between "a rendered DSE element" and "where it is mounted".
F1 ships `ReadingModeBlockHost`; `LivePreviewBlockHost` is a **deferred drop-in**
(declared, documented, unimplemented).

```ts
// framework/host/BlockHost.ts
export interface BlockInfo {
  /** Alias actually used in the document, e.g. "ds-stam". */
  language: string;
  lineStart: number;   // fence line, inclusive
  lineEnd: number;     // closing fence line, inclusive
}

export interface BlockHost {
  readonly mode: RenderMode;
  /** Note path; "" for canvas text nodes (mirrors ctx.sourcePath today). */
  readonly sourcePath: string;
  /** Container the pipeline mounts the element root into. */
  readonly containerEl: HTMLElement;
  /** Whether replaceSource can possibly succeed here (false: embeds, print/export,
   *  hover popovers, unresolvable canvas nodes). Views render read-only when false. */
  readonly canPersist: boolean;
  /** Tie a Component's lifecycle to this rendered block (reading mode: the
   *  MarkdownRenderChild; LP later: the widget's lifecycle). */
  addChild<T extends Component>(child: T): T;
  /** Position/identity of the block in its document, when addressable. */
  getBlockInfo(): BlockInfo | null;
  /**
   * Replace the fenced block's BODY (not the fences) with newSource.
   * Reading mode: Vault.process + section-info line splice; canvas fallback.
   * Live Preview later: a CM6 transaction. Resolves false if not addressable.
   */
  replaceSource(newSource: string): Promise<boolean>;
  /** Best-effort stable key for session state (§4.3). */
  blockKey(): string;
}
```

`ReadingModeBlockHost` construction (pipeline-internal):
`new ReadingModeBlockHost(plugin, el, ctx, alias)` — wraps
`MarkdownPostProcessorContext`, creates one `MarkdownRenderChild(el)` and
`ctx.addChild`s it; `addChild` proxies to that render child. `replaceSource` re-implements
`CodeBlocks.updateMarkdownCodeBlock` on **`Vault.process`** (atomic read-modify-write),
preserving the fence style/language it finds; the canvas-selection fallback moves here
verbatim, returning `false` instead of console-logging when no node matches.

### 3.5 Seam (a) — theming / tokens

Minimal in F1 (`active` is effectively constant); **D3 owns the value space** (`DseThemeId`
members, the `DseTokenName` union, and the `--dse-*` CSS custom-property sheet in
`styles-source.css`). Compatible with DESIGN.md's preference pattern: state = `data-*`
attributes, CSS reflows, no re-render.

```ts
// framework/seams/theme.ts
export type DseThemeId = "steel" | "legacy" | (string & {});   // D3 finalizes members
export type DseTokenName = string;                              // D3 narrows to a union

export interface ThemeService {
  readonly active: DseThemeId;
  /** Stamp data-dse-theme (and theme-dependent attrs) on an element root; re-stamps on
   *  change for the lifetime of `owner` (auto-unsubscribe via owner.register()). */
  apply(rootEl: HTMLElement, owner: Component): void;
  /** Subscribe to theme changes; returns unsubscribe (callers wrap in owner.register). */
  onChange(cb: (theme: DseThemeId) => void): () => void;
  /** Token → CSS var reference, e.g. cssVar("accent") === "var(--dse-accent)". */
  cssVar(name: DseTokenName): string;
}
```

Contract downstream code relies on: every element root carries
`data-dse-element="<def.id>"` and `data-dse-theme="<active>"` (stamped by the pipeline);
all element CSS is scoped under `[data-dse-element]`. "Legacy" (D3) = today's visual
styling expressed as a theme.

### 3.6 Seam (b) — preferences

F1 ships the storage + reflection machinery with a near-empty pref surface; **D4 owns the
pref catalog** (extends `DsePrefs`, defines `PrefDescriptor`s, builds the settings UI).

```ts
// framework/seams/prefs.ts
export interface DsePrefs {
  theme: DseThemeId;
  // D4 extends this interface (module augmentation) with e.g. cardStyle, density, …
}

export interface PrefDescriptor<K extends keyof DsePrefs = keyof DsePrefs> {
  key: K;
  default: DsePrefs[K];
  /** Reflected onto element roots as data-dse-<attr>="<value>" when set. */
  attr?: string;
  /** Settings-tab metadata (label, control type, options) — shape finalized by D4. */
  ui?: unknown;
}

export interface PreferenceStore {
  get<K extends keyof DsePrefs>(key: K): DsePrefs[K];
  set<K extends keyof DsePrefs>(key: K, value: DsePrefs[K]): Promise<void>;
  /** Live subscription; auto-unsubscribed when owner unloads. */
  subscribe<K extends keyof DsePrefs>(
    key: K, owner: Component, cb: (value: DsePrefs[K]) => void): void;
  /** Stamp all attr-bearing prefs on rootEl as data-dse-* and keep them current
   *  for owner's lifetime. Called by the pipeline on every element root. */
  reflect(rootEl: HTMLElement, owner: Component): void;
  /** D4: register descriptors (defaults, attrs, settings UI rows). */
  describe(descriptors: readonly PrefDescriptor[]): void;
}
```

Storage backend: plugin `saveData` (merged into the existing settings object under a
`prefs` key) — see OD-2. Reflection onto element roots (not `document.body`) keeps popout
windows and per-element scoping correct by construction.

### 3.7 Seam (c) — reference / SCC-link resolution

Generalizes `ReferenceResolver` into a provider chain. F1 ships the `at-path` and
`wikilink` providers (current behavior, moved) **plus the `scc` provider slot that F2
fills**. The pipeline consumes only `ReferenceService`.

```ts
// framework/seams/refs.ts
export type RefKind = "at-path" | "wikilink" | "scc" | (string & {});

export interface RefRequest {
  /** Raw reference text: "@Creatures/Goblin", "[[Thorn Dragon]]",
   *  "scc.v1:mcdm.heroes.v1/class/shadow" (bare "scc:" ≡ v1 per spec v1.1). */
  raw: string;
  kind: RefKind;
  /** Referencing note's path — context for wikilink resolution. */
  sourcePath: string;
}

export interface ResolvedRef {
  /** Parsed YAML payload of the resolved target (today: first ds-* block of the file). */
  data: unknown;
  /** Vault file the data came from, when applicable. */
  file?: TFile;
  /** Bare SCC identity ("source/type/item") when kind === "scc". */
  scc?: string;
}

export interface RefProvider {
  readonly kind: RefKind;
  /** Cheap syntactic test — first provider whose canResolve passes wins. */
  canResolve(raw: string): boolean;
  resolve(req: RefRequest): Promise<ResolvedRef>;
}

export interface ReferenceService {
  /** F2 calls register(sccRefProvider). Returns unregister. Later providers are
   *  consulted BEFORE built-ins (override order). */
  register(provider: RefProvider): () => void;
  resolve(raw: string, sourcePath: string): Promise<ResolvedRef>;
  /** Deep-walk arbitrary parsed-YAML data, replacing every resolvable string with its
   *  ResolvedRef.data (today's ReferenceResolver.resolveReferences, generalized). */
  resolveDeep(data: unknown, sourcePath: string): Promise<unknown>;
  /** BARE-path resolution (added Plan 06 for Initiative's `statblock` field): resolve a
   *  raw ref string the way the legacy `ReferenceResolver.resolveReferences` did —
   *  `@path` / `[[wikilink]]` / **bare name** — via the 5-step `findFile` fallback +
   *  first-`ds-*`-block extraction, returning the parsed block or `null` (block parses to
   *  null). Throws the legacy not-found / no-`ds-*`-block / malformed-YAML messages. */
  resolveBarePath(path: string): Promise<ResolvedRef | null>;
}
```

**Amendment (Plan 06, 2026-07-02): `resolveBarePath`.** The provider chain deliberately does
**not** resolve bare strings (only `@` / `[[…]]` / `scc:`), but the Initiative `statblock`
field's documented syntax is a **bare name** (`statblock: "Thorn Dragon"`). `resolveBarePath`
is a **direct method, not a registered provider** — so `resolveDeep` and every other element
stay unaffected (no global catch-all footgun). It uses `sourcePath = ""` for the
`metadataCache.getFirstLinkpathDest` step, byte-exact with the legacy `ReferenceResolver`.
Elements that need it call it from a custom `resolveRefs` (field-scoped); it is never part of
the automatic deep-walk.

Note for F2: the built-in string sniffing recognizes the `scc:` / `scc.vN:` prefix and
routes to the `"scc"` provider; until F2 registers one, such refs produce the standard
"unresolvable reference" error card message. `ResolvedRef.scc` carries the **bare
identity** (no prefix), consistent with the workspace rule that the prefix is the
*reference form*, not the identity.

### 3.8 Error card

```ts
// framework/pipeline.ts
export function renderErrorCard(
  root: HTMLElement,
  def: Pick<ElementDefinition, "id" | "name">,
  error: unknown,                       // Error | ValidationResult
): void;
```

One visual + copy standard for all elements (replaces six hand-rolled variants):
element name, failure stage (parse / schema / reference / render), message, and for
`ValidationResult` a `path: message` list. Built with `createEl`; styled via tokens.

---

## 4. State & persistence

### 4.1 The three state tiers

| Tier | Lives in | Survives re-render? | Survives reload? | Examples |
|---|---|---|---|---|
| **Document state** (the model) | Block YAML in the note | yes (it *causes* re-render) | yes | encounter heroes/HP/conditions, negotiation progress, counter value, stamina |
| **Session UI state** | `SessionStore` (in-memory, plugin-scoped) | best-effort (keyed by `blockKey()`) | no | active tab, collapse open/closed, selected creature cell |
| **Ephemeral view state** | The view instance | no | no | hover, open modal, in-flight edit |

Rule: anything a user would be angry to lose is document state — persisted elements keep
today's "note is the database" contract.

### 4.2 Persisted write path

1. User interaction mutates `this.model` (plain object; no reactivity layer — views call
   their own targeted DOM update methods, e.g. `updateStaminaDisplay(el)` becomes a method
   on a small sub-view instead of a rebuild).
2. View calls `this.persist()`:
   - no-op returning `false` if `!cx.host.canPersist` (view should have rendered
     read-only affordances already);
   - `def.serialize(model)` → `host.replaceSource(yaml)`;
   - **write-behind**: debounced ~400 ms trailing per block instance, with a mandatory
     flush in the view's `onunload` (so closing the note or switching files never drops a
     click) — see OD-4;
   - reading mode implementation uses `Vault.process` (atomic) and splices exactly the
     lines from `getBlockInfo()`, preserving the original fence characters and alias.
3. The file change makes Obsidian re-run the postprocessor: old view auto-unloads, new
   pipeline run parses the just-written YAML. This echo rebuild is **accepted** (it is
   today's behavior and guarantees view ≡ document). The debounce collapses click storms
   (e.g. malice `+1` ×5) into one write/rebuild. Views must therefore keep *pending* model
   state authoritative until flush — the pipeline never mutates a mounted view.
4. Session UI state (selected tab/cell) is re-hydrated from `SessionStore` on the rebuild,
   which is how e.g. `selectedInstanceKey` stops needing to be *persisted* state (today it
   is written into the YAML purely to survive the echo rebuild — with `SessionStore` it
   can migrate out of the document; keep writing it during migration for compatibility,
   revisit after — FOLLOWUP candidate).

### 4.3 SessionStore

```ts
// framework/session.ts
export interface SessionStore {
  get<T>(blockKey: string, slot: string): T | undefined;
  set<T>(blockKey: string, slot: string, value: T): void;
}
```

Plugin-scoped `Map`, cleared on plugin unload. `BlockHost.blockKey()` =
`${sourcePath}::${language}::${lineStart}` when block info is available, else a
content-hash fallback — *documented as best-effort*: keys drift when blocks move. Good
enough for tab/collapse/selection; never used for document state.

### 4.4 Canvas and non-addressable contexts

- Canvas text nodes (`sourcePath === ""`): `ReadingModeBlockHost` ports the existing
  selected-node text-matching fallback, quarantined in one file and returning
  `false`/`canPersist=false` rather than silently logging. It remains best-effort and is
  flagged as a risk (§9).
- Embeds, hover previews, export/print: `getSectionInfo` returns null →
  `canPersist === false` → interactive elements render with controls disabled (visible
  but inert, with a tooltip "read-only in this context") instead of today's
  broken-on-click behavior.

### 4.5 Cleanup semantics (normative)

- Every listener: `this.registerDomEvent(target, ...)`. Every interval:
  `this.registerInterval(this.win.setInterval(...))`. Every service subscription:
  the service takes `owner: Component` and internally does `owner.register(unsub)`.
- Modals opened by a view must be closed on view unload: views `register(() => modal.close())`
  when opening (framework `kit/` modal base handles this).
- No view references stored on the plugin; no plugin-as-component for `MarkdownRenderer`.
- Popout safety: no bare `window`/`document`; the view's `win` getter is the source of
  truth; DOM `instanceof` checks use Obsidian's cross-window-safe helpers.

---

## 5. Schema / validation

- **Technology unchanged:** AJV 2019 + `ajv-keywords` + `ajv-errors`; schemas remain
  YAML-text JSON-Schemas imported as strings by the esbuild YAML loader; authored per
  element in `src/elements/<id>/schema.yaml`.
- **`ValidationService`** (plugin-scoped, created in `onload`, dropped in `onunload` —
  replaces the module-level singleton and its manual reset):

```ts
// framework/validation.ts
export interface ValidationService {
  /** Register shared $ref dependency schemas (e.g. component-wrapper) once at load. */
  addDependencySchema(id: string, yamlSchema: string): void;
  /** Compile-on-first-use, cached per element id thereafter (fixes the
   *  recompile-per-validation cost in JsonSchemaValidator.validateJsonSchema). */
  validate(elementId: string, yamlSchema: string, data: unknown): ValidationResult;
}
export interface ValidationResult {           // unchanged from today
  valid: boolean;
  errors: ValidationError[];                  // { message, path, value? }
}
```

- **Fit with the declaration model:** the pipeline is the only caller —
  `if (def.schema) svc.validate(def.id, def.schema, data)` between parse and
  `def.parse`. Models stop importing the validator; `parseYaml`-then-validate-then-parse
  ceremony currently duplicated in each model's `parseYaml()` collapses into the pipeline.
- Shared `component-wrapper` schema (`collapsible`/`collapse_default`) stays a dependency
  schema registered at load; element schemas `$ref` it as today.
- Coverage today is only StaminaBar + Skills; policy for the other nine is OD-5.
- SDK-backed elements (feature/featureblock/statblock) may keep `schema` unset — the SDK
  reader's own errors surface through the same error card.

---

## 6. Migration strategy

Ground rules: one element per PR-sized step; old and new registration paths coexist
(§2.3); plugin builds and ships after every step; each migrated element deletes its old
processor/Vue files in the same step; add a Jest DOM harness with a golden-render snapshot
per element *as it migrates* (the repo has Jest configured and zero tests — migration is
the occasion to fix that).

| Step | Element(s) | Why this order | Retires |
|---|---|---|---|
| 0 | **Framework core** — `framework/` (registry, pipeline, view, ReadingModeBlockHost, seams with default impls, validation, session, error card) | Everything else depends on it; no user-visible change | — |
| 1 | **Horizontal Rule** ← **first migration target** | Smallest element (zero config, static); proves registry + pipeline + error card end-to-end; kills a Vue component immediately → starts D1 | `HorizontalRule.vue`, dead `Common/horizontalRuleProcessor` external use |
| 2 | **Values Row**, **Characteristics** | Trivial static DOM elements; exercises model+schema declaration ergonomics without SDK or state | their processors |
| 3 | **Skills** | First *interactive* (session collapse state via `SessionStore` + kit collapsible); second Vue kill | `SkillList.vue` + Vue `Common/` collapse widgets |
| 4 | **Stamina Bar** | First *persisted* (serialize + write-behind + modal-from-view); last Vue kill → **unblocks D1 execution** (drop `vue`, `unplugin-vue`, `vue-tsc`, shims, esbuild Vue plugin/defines; `tsc` replaces `vue-tsc`) | `StaminaBar.vue`, `StaminaEditModal.vue`, `ModalProcessor`, `ComponentProcessor.ts`, dead DOM `StaminaBar/*` twins |
| 5 | **Feature/Ability** | First SDK-backed static; establishes the `renderMarkdown` + sub-view pattern (`EffectView` et al.) the next two reuse | `Features/*Processor` |
| 6 | **Featureblock**, then **Statblock** | Reuse step-5 sub-views (`FeaturesView`, `HeaderView`, `StatsView` move under `elements/` or `framework/kit/`) | their processors |
| 7 | **Counter** | Small persisted element; validates the §4.2 write path against a simple case before the big two | `CounterProcessor`, `CodeBlocks.updateCounter` |
| 8 | **Negotiation Tracker** | Large persisted + session tab state; sub-view decomposition already exists (`ArgumentView` etc.) | `negotiation/*`, `CodeBlocks.updateNegotiationTracker` |
| 9 | **Initiative Tracker** | Largest and riskiest (4 modals, minion pools, conditions, canvas users) — goes last, onto a by-then battle-tested framework | `initiativeProcessor.ts`, `CodeBlocks` entirely, `RegisterElements.ts` |
| 10 | **Cleanup & docs** | Delete empty legacy dirs; update `.repo-docs/architecture.md` (stale Vue description) + the 2026-04-06 ADR **Outcome**; new ADR "Element Framework v2" | — |

Per-element migration recipe (steps 1–9 all follow it):

1. Create `src/elements/<id>/{definition,model,view}.ts` (+ `schema.yaml` if adopted).
2. Move parse logic out of the static-class model into `parse(data, raw)`; persisted
   elements gain `serialize(model)` (initiative/negotiation: reuse the exact
   `stringifyYaml(data)` shape written today — **byte-compatible output is the
   compatibility bar**, existing notes must round-trip unchanged).
3. Re-implement the view as `ElementView` (mechanical for DOM processors: `build(parent)`
   → `onMount(root, model)`, raw listeners → `registerDomEvent`, plugin-as-component →
   `this.renderMarkdown`); Vue templates are re-expressed as `createEl` trees (state via
   plain fields + targeted update methods).
4. `registry.register(def)`; delete the corresponding lines from `RegisterElements.ts`;
   delete old files; snapshot test; manual check of the docs-site example blocks.

**First migration target (feeds D1): Horizontal Rule** — after step 4 the plugin is
Vue-free and D1 is a pure dependency/tooling removal, exactly as the ADR envisioned.

---

## 7. Impact on downstream efforts

- **D1 — Vue removal (execution):** consumes migration steps 1/3/4 (§6). Its own scope
  reduces to: delete `vue`/`unplugin-vue`/`vue-tsc`/`@vue/compiler-sfc` deps,
  `shims-vue.d.ts`, esbuild Vue plugin + `__VUE_*` defines; switch `build`/`tsc` scripts
  to plain `tsc`; fill in the 2026-04-06 ADR Outcome. No new interfaces — D1 is done when
  step 4 lands and tooling is stripped.
- **D2 — UI overhaul:** builds *inside* `ElementView.onMount` implementations and the
  shared `framework/kit/` (accessible modal, collapsible, stepper, icon-button — the
  vanilla replacement for `drawSteelComponents/Common/`). Consumes: `ElementView`,
  `RenderContext`, `ThemeService.cssVar`, the `data-dse-element` root-attribute scoping
  contract (§3.5). D2 must not alter pipeline or seam signatures.
- **D3 — theming / Legacy theme:** owns the `DseThemeId` member set, the `DseTokenName`
  union, and the `--dse-*` token sheet; implements the real `ThemeService`
  (F1's default is a constant-theme stub). Consumes: `ThemeService`, the
  `data-dse-theme` stamping contract, `PreferenceStore` (theme is pref key `"theme"`).
  "Legacy" = today's element styling captured as a selectable theme; "Steel" aligns
  tokens with the workspace High-Fantasy Steel language (DESIGN.md) where it maps onto
  Obsidian constraints.
- **D4 — preferences:** owns the pref catalog: augments `DsePrefs`, supplies
  `PrefDescriptor[]` via `PreferenceStore.describe`, builds the settings-tab UI from
  descriptors. Consumes: `PreferenceStore` (`get/set/subscribe/reflect`), the
  `data-dse-<attr>` reflection contract (§3.6) — mirroring the v2 site's
  attribute-driven, CSS-reflow preference pattern.
- **F2 — SCC resolution:** implements `RefProvider { kind: "scc" }` and calls
  `ReferenceService.register(provider)` at load; resolves `scc:`/`scc.vN:` references
  (spec v1.1: bare `scc:` ≡ v1) to compendium content (downloaded compendium files and/or
  SCC API), returning `ResolvedRef { data, file?, scc }` with `scc` = bare identity.
  Consumes: `RefProvider`, `RefRequest`, `ResolvedRef`, `ReferenceService`. No pipeline
  changes needed — deep resolution already routes `scc`-prefixed strings to the provider.

---

## 8. Open Decisions — needs Scott

- **OD-1 — Reactivity micro-helper for interactive views.** Guardrail honored: no
  external lib adopted. Options: (a) *none* — plain fields + explicit targeted update
  methods (the spec's default; matches today's code, verbose for initiative);
  (b) an **in-repo ~40-line `Signal<T>`** (`get/set/subscribe`, auto-unsubscribe via
  `owner.register`) to declutter initiative/negotiation; (c) external micro-lib
  (`@preact/signals-core`, ~3 kB — rejected by default: new dep, new mental model).
  **Recommendation:** (a) for steps 1–7, decide (b) before step 8 with real code in hand.
- **OD-2 — Preference storage backend.** Plugin `saveData` (per-vault, syncs with the
  vault, one store with settings) vs `localStorage` (per-device, matches the v2 site's
  `mkdocs:fontPrefs` semantics). **Recommendation:** `saveData`; revisit per-device
  overrides in D4 if users ask.
- **OD-3 — Write-behind debounce for persisted elements** (§4.2): ~400 ms trailing +
  flush-on-unload vs today's immediate-write-per-click. Debounce removes the
  rebuild-per-click flicker but introduces a short window where the note lags the UI.
  **Recommendation:** debounced; the unload flush covers navigation.
- **OD-4 — Validation coverage policy** (§5): mandate a `schema.yaml` for all 11 elements
  as they migrate (best errors, most authoring work) vs keep schemas only where they exist
  (StaminaBar, Skills) and where cheap. Also: hard-fail on invalid (today) vs
  render-with-warning-banner. **Recommendation:** schema for every non-SDK element,
  hard-fail retained.
- **OD-5 — `selectedInstanceKey` demotion** (§4.2): today the initiative tracker persists
  UI selection into the note's YAML; with `SessionStore` it could become session-only
  (cleaner notes, but a behavior change for shared vaults where selection currently
  syncs). **Recommendation:** keep writing it through the v2 migration; decide demotion
  afterward.
- **OD-6 — Alias hygiene.** Keep all current aliases forever (spec default) — or take the
  v2 opportunity to deprecate oddballs (`ds-value-row` vs `ds-values-row`) with a
  release-notes window. **Recommendation:** keep all; aliases are cheap and users' notes
  are forever.
- **OD-7 — Statblock interactivity.** `CodeBlocks.updateStatblock` implies planned
  in-statblock stamina tracking that never shipped. Is interactive statblock state in
  scope for the v2 migration (step 6) or a post-overhaul feature (ROADMAP)?
  **Recommendation:** migrate statblock as `static`; new interactivity is a new effort.
- **OD-8 — Import-boundary enforcement.** Add an ESLint rule (`import/no-restricted-paths`
  or eslint-plugin-boundaries) so `src/framework/` never imports `src/elements/`, and
  elements never import each other except via `framework/kit`. Small tooling cost, keeps
  the keystone honest. **Recommendation:** yes, in step 0.

---

## 9. Risks & non-goals

### Risks

| Risk | Mitigation |
|---|---|
| **Initiative-tracker behavioral regressions** (largest, most-used interactive element; modals, minion pools, canvas users) | It migrates **last** (step 9) onto a framework proven by 8 predecessors; byte-compatible `serialize`; snapshot tests; manual test vault with the documented examples |
| **Non-addressable contexts** — `getSectionInfo` null (embeds, hover previews, print/export) currently yields broken interactions | `canPersist=false` read-only mode is designed in (§4.4); still needs explicit QA per context |
| **Canvas writeback fragility** — selection-based node matching can write to the wrong node or fail silently | Quarantined in `ReadingModeBlockHost`, converted to explicit `false`/read-only; a proper canvas-node identity fix is out of scope (FOLLOWUPS candidate) |
| **YAML round-trip lossiness** — `stringifyYaml` re-emission drops user comments/key order in persisted blocks | Pre-existing behavior; document it in element docs; byte-compat bar only covers plugin-written blocks |
| **Vue re-expression fidelity** — StaminaBar's scoped styles + computed classes must be hand-ported to `styles.css` + explicit updates | Small surface (3 components); visual snapshots; StaminaBar migrates after two simpler rehearsals |
| **SDK parse coupling** — `Feature.read` consumes raw text, so pipeline must pass both parsed data *and* raw source (designed: `parse(data, raw)`); SDK error messages are the UX for those elements | Error card shows stage + message; improving SDK errors is `data-sdk-npm` scope |
| **Echo rebuilds still visible** (write → file change → remount) | Debounce (OD-3) bounds frequency; full echo suppression (same-source memoization can't reuse DOM in reading mode anyway) is explicitly not attempted |
| **Framework built before LP validates the seam** — `BlockHost` could turn out to miss an LP need | Interface kept minimal (mount, lifecycle, block identity, source replacement — each with a known CM6 realization: widget DOM, widget destroy, `syntaxTree` block ranges, `view.dispatch`); stub file documents the mapping |

### Non-goals (explicitly out of F1 scope)

- **Live Preview implementation.** `LivePreviewBlockHost` and CM6 `ViewPlugin`/widget work
  are **not** built here — F1 only guarantees the seam (`BlockHost`, mode-blind views) so
  LP is a drop-in later effort. The 2024-08-18 reading-mode-only decision stands until
  that effort supersedes it.
- Visual redesign of any element (D2) and the token sheet / Legacy theme content (D3).
- The preference catalog and settings UI (D4).
- SCC provider implementation and compendium/SCC-API wiring (F2).
- Vue dependency/tooling removal mechanics (D1 — unblocked at step 4, executed by D1).
- New elements, editing UX (in-note editors, autocomplete), mobile-specific UI work.
- `CompendiumDownloader`, settings tab, and release tooling — untouched except where the
  settings object gains the `prefs` key.
- SDK (`data-sdk-npm`) changes.

---

*Cross-references: DSE as-is docs (`draw-steel-elements/.repo-docs/architecture.md` — stale
Vue framing, update at step 10), ADR 2026-04-06 (revert Vue), ADR 2024-08-18 (reading-mode
only), workspace `DESIGN.md` (preference/attribute pattern this framework mirrors),
`docs/scc-reference.md` + `reference/scc-specification.md` (SCC v1.1 reference form).*
