# D1 — Vue Removal + First Framework-v2 Migrations — Execution Plan

**Status:** proposed (planning only — no code changes, no builds/installs/commits)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin, v5.1.1)
**Depends on:** F1 (Element Framework v2 — interface names imported verbatim), F3 (Vue-limbo
inventory §3 + test harness §4). Proceeds on the program's recommended-default ODs.
**Executes:** F1 §6 migration steps **0 / 1 / 3 / 4** (framework core → Horizontal Rule →
Skills → Stamina Bar) plus the full Vue dependency/tooling teardown F1 defers to D1.

All paths are relative to `draw-steel-elements/` unless absolute.

---

## 1. Scope & end state

### 1.1 In scope

1. **Stand up `src/framework/` core** (F1 step 0): the registry, pipeline, mode-agnostic
   view base, `ReadingModeBlockHost`, the three seams (theme / prefs / refs) with F1's
   default implementations, plugin-scoped `ValidationService`, `SessionStore`, and
   `renderErrorCard` — with the exact public names from F1 §3.
2. **Migrate three elements onto Framework v2**, in F1's order, each killing Vue components:
   - **Horizontal Rule** (F1 step 1) — *static*, zero-config; proves registry + pipeline +
     error card end-to-end.
   - **Skills** (F1 step 3) — *interactive*; first `SessionStore` + kit-collapsible user.
   - **Stamina Bar** (F1 step 4) — *persisted*; first `serialize` + debounced write-behind +
     modal-from-view. Its landing removes the **last** Vue consumer.
3. **Remove Vue entirely** once no `.vue` importer remains: 16 `.vue` files, the Vue TS glue
   (`ComponentProcessor.ts`, `ModalProcessor.ts`), `shims-vue.d.ts`, the empty dead files,
   the `vue` dep + `@vue/compiler-sfc` / `unplugin-vue` / `vue-tsc` devDeps, the
   `unplugin-vue/esbuild` plugin + `__VUE_*` defines, and re-plumb the CSS pipeline now that
   there are no SFC scoped styles to extract.
4. **Swap tooling** `vue-tsc → tsc` for `build` / `tsc` scripts; run plain `tsc` as a real
   gate.
5. **Close the docs debt**: fill the 2026-04-06 revert ADR's **Outcome**, retire the "two
   rendering strategies / Vue" framing in `.repo-docs/architecture.md` and the repo
   `CLAUDE.md` (F3 DS-1 / DS-2 exit criteria).

### 1.2 Out of scope (owned elsewhere; do not touch here)

- The other eight element migrations (F1 steps 2, 5–9).
- Visual redesign / tokens / Legacy theme (D2 / D3) — D1 preserves today's look pixel-for-pixel
  by porting the SFC scoped styles verbatim.
- The preference catalog + settings UI (D4); F1's `PreferenceStore` ships near-empty.
- The SCC `RefProvider` (F2); D1 ships only the `at-path` / `wikilink` built-ins the seam
  needs, and none of D1's three elements exercise references.
- Live Preview (`LivePreviewBlockHost` remains a documented stub).
- The F3 correctness/quick-win backlog (CB-1, CB-3, etc.), **except** the ones the inventory
  hands to D1: **CB-17** (StaminaBar Vue nullish-coalescing bug — dies with the DOM rewrite),
  **ML-2** (Vue apps never unmounted — dies with `ComponentProcessor.ts`), **DC-1/DC-2**
  (dead DOM twins — deleted as their element migrates), **DC-3/DC-4** (empty files / unused
  import — swept at teardown), **BT-7** (Vue build chain), **DS-1/DS-2** (Vue doc staleness).

### 1.3 End state (definition of done)

- `grep -ri vue src/ package.json esbuild.config.mjs tsconfig.json` returns nothing but
  incidental history; `shims-vue.d.ts` is gone.
- `npm run build` runs `tsc --noEmit && node esbuild.config.mjs production` and succeeds;
  `npm run tsc` is `tsc --noEmit`.
- HR / Skills / StaminaBar render and behave as today (StaminaBar YAML round-trips
  byte-for-byte against the current writer), now through `ElementRegistry` +
  `ElementPipeline`; every listener/subscription/child is lifecycle-bound (no
  `plugin`-as-`Component`, no un-unmounted apps).
- `styles.css` is produced from `styles-source.css` alone (no SFC-extracted styles); the
  ported element styles live in `styles-source.css`, scoped under `[data-dse-element="…"]`.
- The 2026-04-06 ADR **Outcome** is filled; architecture.md + CLAUDE.md describe a single
  vanilla-DOM/framework strategy.

---

## 2. Ordered steps

Ground rules (from F1 §6): one element per PR-sized step; the old (`RegisterElements.ts`) and
new (registry) registration paths **coexist** until teardown; the plugin builds and ships
after **every** step; each migration deletes its own Vue/dead-DOM files and lands a
golden-render test. Steps 4–6 are pure post-runtime cleanup and **may ship as one PR** (Vue is
already unused at runtime after step 3).

Legend for "shippable here?": can this PR be released to users without regressing any element?

---

### Step 0 — Framework core scaffold

**Goal:** all of `src/framework/` exists, is instantiated in `onload`, registers **zero**
elements yet → zero user-visible change.

**Files created** (F1 §2.5 layout, names per F1 §3):

| File | Exports (F1 §) | D1 implementation notes |
|---|---|---|
| `framework/registry.ts` | `ElementShape`, `ElementDefinition<M>`, `ElementRegistry` (§3.1) | `register` validates unique id/aliases and rejects `shape==="persisted"` without `serialize`; per alias calls `plugin.registerMarkdownCodeBlockProcessor(alias, (s,el,ctx) => pipeline.run(def, s, new ReadingModeBlockHost(plugin, el, ctx, alias)))`; stores defs for `get`/`all`. |
| `framework/context.ts` | `RenderMode`, `RenderContext` (§3.2) | Plain readonly struct built per block by the pipeline; carries `app/plugin/settings/host/mode/theme/prefs/refs/session`. |
| `framework/view.ts` | `ElementView<M>` (§3.3) | `extends Component`; final `mount`/`update` call abstract `onMount`/optional `onUpdate`; provides `renderMarkdown` (`MarkdownRenderer.render(cx.app, md, el, cx.host.sourcePath, this)` — **owner = the view**, fixing ML-1's pattern for later elements), `persist()` (debounced write-behind, §4.2/OD-3), `win` getter (`rootEl.ownerDocument.defaultView`). |
| `framework/pipeline.ts` | `ElementPipeline`, `renderErrorCard` (§3.8) | `run(def, source, host)`: parseYaml → `ValidationService.validate` (if `def.schema`) → `def.resolveRefs?` / default deep-resolve (skipped when data has no ref strings) → `def.createView(cx)` → `host.addChild(view)` → stamps `data-dse-element`/`data-dse-theme` + `prefs.reflect` + click shield (unless `noClickShield`) → `view.mount(root, model)`. One try/catch → `renderErrorCard`. |
| `framework/host/BlockHost.ts` | `BlockInfo`, `BlockHost` (§3.4) | Interface only. |
| `framework/host/ReadingModeBlockHost.ts` | `ReadingModeBlockHost` | Wraps `MarkdownPostProcessorContext`; creates one `MarkdownRenderChild(el)` + `ctx.addChild`s it; `addChild` proxies to it. `replaceSource` re-implements `CodeBlocks.updateMarkdownCodeBlock` on **`Vault.process`** (atomic; fixes CB-3 for the migrated elements), preserving the user's fence chars + alias (fixes CB-5 for these blocks); the canvas selection-match fallback moves here **quarantined**, returning `false`/`canPersist=false` instead of console-logging (F3 SD-3 / program OD-3 default: read-only + no silent drop). |
| `framework/host/LivePreviewBlockHost.ts` | (stub) | Doc-comment only mapping each `BlockHost` member to its CM6 realization (F1 §9). Not implemented. |
| `framework/seams/theme.ts` | `DseThemeId`, `DseTokenName`, `ThemeService` (§3.5) | Default **constant-theme** stub: `active === "legacy"`, `apply` stamps `data-dse-theme`, `cssVar(n) => \`var(--dse-${n})\``. D3 replaces. |
| `framework/seams/prefs.ts` | `DsePrefs`, `PrefDescriptor`, `PreferenceStore` (§3.6) | Storage = `plugin.saveData` under a `prefs` key (program OD-2); near-empty catalog (`theme` only); `reflect` stamps attr-bearing prefs on the root. D4 extends. |
| `framework/seams/refs.ts` | `RefKind`, `RefRequest`, `ResolvedRef`, `RefProvider`, `ReferenceService` (§3.7) | Ships built-in `at-path` + `wikilink` providers by lifting `ReferenceResolver.findFile` + first-`ds-*`-block extraction (the existing `src/utils/ReferenceResolver.ts` **stays** — still used by initiative/statblock — the providers wrap/share its logic). `scc:`-prefixed strings route to a `"scc"` slot that returns the standard "unresolvable reference" until F2 registers a provider. **No D1 element uses refs**, so this is scaffolding validated by unit test only. |
| `framework/validation.ts` | `ValidationService`, `ValidationResult` (§5) | Plugin-scoped AJV2019 + `ajv-keywords` + `ajv-errors`; `addDependencySchema` (component-wrapper, once at load) + `validate(elementId, yamlSchema, data)` with **compile-once-cache-per-id** (fixes PF-1's recompile-per-render). Created in `onload`, dropped in `onunload` — replaces the `JsonSchemaValidator.ts` module singleton for migrated elements (the old module stays for not-yet-migrated ones). |
| `framework/session.ts` | `SessionStore` (§4.3) | Plugin-scoped `Map<blockKey, Map<slot, value>>`, cleared on unload. |
| `framework/kit/` | (empty; a `.gitkeep` + doc comment) | D2 populates the full accessible kit; D1 seeds only the collapsible in step 2. |

**Wiring:** `main.ts onload` constructs `services = { theme, prefs, refs, validation, session }`
and `registry = new ElementRegistry(plugin, services)`, calls
`validation.addDependencySchema(componentWrapperId, componentWrapperSchemaYaml)`, and registers
**nothing** yet. `onunload` disposes the services (Component-driven).

**F1 interface used:** all of §3.

**Deletions:** none.

**Tooling (OD-8):** add `import/no-restricted-paths` (or eslint-plugin-boundaries) config so
`src/framework/` may not import `src/elements/` and elements may not import each other except
via `framework/kit`. (Lint is not yet runnable — F3 BT-3 — so this is config-only until CI;
document it.)

**Shippable here?** **Yes.** Framework compiles and instantiates; no processor is routed
through it, so behavior is byte-identical to v5.1.1.

---

### Step 1 — Horizontal Rule (F1 step 1) → first Vue kill

**Goal:** the simplest element proves the whole pipeline; `HorizontalRule.vue` dies.

**Files created:** `src/elements/horizontal-rule/`
- `definition.ts` — `export const horizontalRuleElement: ElementDefinition<void> = { id: "horizontal-rule", name: "Horizontal rule", aliases: ["ds-hr", "ds-horizontal-rule"], shape: "static", parse: () => undefined, autoResolveRefs: false, noClickShield: true, createView: cx => new HorizontalRuleView(cx) }`. No `schema`, no `serialize`.
- `view.ts` — `HorizontalRuleView extends ElementView<void>`; `onMount(root)` **reuses the
  existing static builder** `HorizontalRuleProcessor.build(root)` (3-line body). No re-write of
  DOM structure needed.

**F1 interface used:** `ElementDefinition` (static, no schema/refs), `ElementView`,
`ElementRegistry.register`, `renderErrorCard`, `ReadingModeBlockHost`.

**Registration change:** add `registry.register(horizontalRuleElement)` in `main.ts`; delete
`RegisterElements.ts` lines 14 (`import HorizontalRule … .vue`), 32–34 (the
`genericComponentProcessor(... HorizontalRule ...)` + two `registerMarkdownCodeBlockProcessor`).

**Deletions:** `src/drawSteelComponents/HorizontalRule.vue`.
**KEEP (not a Vue file):** `src/drawSteelAdmonition/Common/horizontalRuleProcessor.ts` — still
called internally by `StatblockProcessor.ts:52` and `FeatureblockView.ts:54`; those elements
migrate in F1 steps 5–6, out of D1 scope.

**CSS:** **none.** The Vue SFC's `.h-rule-container` styles were already duplicated as
`.ds-hr-container` / `.ds-hr-*-line` / `.ds-hr-center` in `styles-source.css:330` (that block
backs the DOM builder). Deleting the SFC drops a duplicate; the rendered result is identical.

**Test net:** `T-HR` golden render (jsdom) — mounting `ds-hr` produces the exact
`.ds-hr-container > .ds-hr-left-line + .ds-hr-center + .ds-hr-right-line` structure; empty and
garbage bodies still render the rule (zero-config element ignores its source). Mirrors F3 T-10's
render-smoke pattern.

**Shippable here?** **Yes.** HR renders via the framework; every other element still on its old
path; Vue still present for Skills/StaminaBar.

---

### Step 2 — Skills (F1 step 3) → second Vue kill; introduces the kit collapsible

**Goal:** first *interactive* element; session-only collapse state; `SkillList.vue` +
`SkillGroup.vue` die; the shared collapsible chrome is re-expressed once, in `framework/kit/`.

**Files created:**
- `src/elements/skills/model.ts` — `parse(data, raw): Skills` = `Skills.parse(data)` (the
  existing `@model/Skills` class **stays** — F3 "keep, renderer-agnostic"); no `serialize`
  (not persisted).
- `src/elements/skills/schema.yaml` — the existing `SkillsSchema.yaml` (moved or re-exported;
  keep the `$ref` to `component-wrapper-1.0.0`).
- `src/elements/skills/definition.ts` — `id:"skills"`, `name:"Skills"`, `aliases:["ds-skills"]`,
  `shape:"interactive"`, `schema: skillsSchemaYaml`, `autoResolveRefs:false`,
  `parse`, `createView`.
- `src/elements/skills/view.ts` — `SkillsView extends ElementView<Skills>`; re-expresses
  `SkillList.vue` + `SkillGroup.vue` as `createEl` trees: iterate `SKILL_DATA` + `custom_skills`,
  render groups wrapped in the kit collapsible, per-skill indicator (reuse the existing
  `.ds-skill-indicator.enabled/.disabled` classes, not a new toggle-indicator), `only_show_selected`
  filter, `toProperCase` labels. Group collapse toggles via `this.registerDomEvent` and store
  open/closed in `SessionStore` slot `group:<name>` keyed by `host.blockKey()` (survives the
  echo re-render; program OD-6 default). The `ComponentWrapper` (whole-element
  `collapsible`/`collapse_default`) wraps the group list.
- `src/framework/kit/ComponentWrapper.ts` — **first kit occupant.** Vanilla DOM port of
  `Common/ComponentWrapper.vue` (+ the collapse eye from `ComponentHideIndicator.vue` and the
  `VerticalRule.vue` collapsed-state rail): honors the `collapsible` / `collapse_default` keys
  with the model's defaults (`collapsible` default true, `collapse_default` default false —
  from `@model/ComponentWrapper`); collapsed state → `SessionStore`. `setIcon` for eye/eye-off.
- `src/framework/kit/CollapsibleHeading.ts` — DOM port of `CollapsibleHeading.vue` +
  `RightArrowToggleIndicator.vue` (right-triangle icon, `is-collapsed` class), used by the
  Skills group headings.

**F1 interface used:** `ElementDefinition` (interactive + schema), `ElementView`,
`RenderContext.session` (`SessionStore`), `ValidationService` (via pipeline),
`renderErrorCard`.

**Registration change:** `registry.register(skillsElement)`; delete `RegisterElements.ts`
line 15 (`import SkillList … .vue`), line 18 (`SkillsModel` import if now unused there),
lines 64–65 (skills `genericComponentProcessor` + register).

**Deletions:**
- `src/drawSteelComponents/SkillList/SkillList.vue`, `SkillList/SkillGroup.vue`.
- Dead DOM twin (F3 DC-2, program OD-7 default = delete after seeding): after diffing it as a
  baseline, delete `src/drawSteelAdmonition/Skills/SkillsProcessor.ts` +
  `Skills/SkillsView.ts`.
- **Not yet:** `Common/CollapsibleHeading.vue` / `ToggleIndicator.vue` /
  `ComponentHideIndicator.vue` / `RightArrowToggleIndicator.vue` / `ComponentWrapper.vue` /
  `VerticalRule.vue` — StaminaBar.vue still imports `ComponentWrapper.vue`; these are swept at
  teardown once orphaned. (Orphaned-but-unimported `.vue` files are harmless — esbuild only
  compiles imported SFCs.)

**CSS:** port the SFC scoped styles into `styles-source.css`, scoped under
`[data-dse-element="skills"]` and `.ds-kit-component-wrapper` (kit) — see §3.

**Test net:** `T-Skills` golden render (jsdom): groups + indicators for a fixture with
`skills:` + `custom_skills:` + `only_show_selected:`; collapse click flips the DOM and writes
the `SessionStore` slot **and performs no vault write** (interactive ≠ persisted); invalid body
(bad skill enum) → `renderErrorCard` with the schema `path: message` list. Plus a `ComponentWrapper`
kit unit test for `collapsible`/`collapse_default` matrix.

**Shippable here?** **Yes.** Skills render via the framework; StaminaBar still on Vue.

---

### Step 3 — Stamina Bar (F1 step 4) → **last Vue kill** (unblocks teardown)

**Goal:** first *persisted* element; `serialize` + debounced write-behind + modal-from-view.
After this PR **no `.vue` file is imported anywhere** → Vue is unused at runtime.

**Files created:**
- `src/elements/stamina-bar/model.ts` — `parse(data, raw): StaminaBar` = `StaminaBar.parse(data)`
  (existing `@model/StaminaBar` class **stays**); `serialize(model): string` =
  `stringifyYaml(model)`. **Byte-compat:** serializing the class instance reproduces the exact
  field set + insertion order the current Vue writer emits
  (`collapsible, collapse_default, max_stamina, current_stamina, temp_stamina, height, style`)
  — reusing the class instead of a fresh DTO is the compatibility guarantee (§4).
- `src/elements/stamina-bar/schema.yaml` — existing `StaminaBarSchema.yaml` (keeps the
  component-wrapper `$ref`).
- `src/elements/stamina-bar/definition.ts` — `id:"stamina-bar"`, `name:"Stamina bar"`,
  `aliases:["ds-stam","ds-stamina","ds-stamina-bar"]`, `shape:"persisted"`,
  `schema: staminaBarSchemaYaml`, `autoResolveRefs:false`, `parse`, `serialize`, `createView`.
- `src/elements/stamina-bar/view.ts` — `StaminaBarView extends ElementView<StaminaBar>`:
  re-expresses `StaminaBar.vue` as `createEl` (bar container, stamina indicator, temp-stamina
  overlay, dying/winded overlays, `(cur/max + temp)` pill), wrapped in the kit
  `ComponentWrapper` (step-2 helper — `collapsible` defaults to `!disable_click`, matching the
  SFC prop). Bar width/color computed by explicit **targeted update methods** (plain fields, no
  reactivity lib — F1 OD-1 default (a)); the `barColor`/`overlayWidth`/`calculatePercentFromStamina`
  logic ports 1:1 from the SFC `<script>`. **Fixes CB-17** (the SFC's
  `temp??0 > 0` nullish/precedence bug) as a natural consequence of the rewrite. Click →
  opens the **existing DOM `@views/StaminaEditModal`** (OD-D1-1) with `isHero:true` (standalone
  bars show dying/winded, so the negative floor applies) and an `updateCallback` that mutates
  `this.model` then calls `this.persist()`. `persist()` → `serialize` → `host.replaceSource`
  (Vault.process), debounced ~400 ms + flush-on-unload (OD-3), no-op read-only when
  `!host.canPersist`.

**F1 interface used:** `ElementDefinition` (persisted → `serialize` **required**), `ElementView`
+ `persist()`, `BlockHost.replaceSource` / `canPersist`, `ValidationService`, kit `ComponentWrapper`,
`renderErrorCard`.

**Registration change:** `registry.register(staminaBarElement)`; delete `RegisterElements.ts`
line 16 (`import StaminaBar … .vue`), line 19 (`StaminaBarModel` import if now unused), line 8
(dead `StaminaBarProcessor` import — F3 DC-4), lines 51–54 (stamina `genericComponentProcessor`
+ 3 registers). After this, `RegisterElements.ts` no longer imports `ComponentProcessor`.

**Deletions:**
- `src/drawSteelComponents/StaminaBar/StaminaBar.vue`, `StaminaAdjustor.vue`,
  `StaminaEditModal.vue` (edit flow now uses the DOM modal — OD-D1-1).
- Dead DOM twin (DC-1, OD-7): after diffing as baseline, delete
  `src/drawSteelAdmonition/StaminaBar/StaminaBarProcessor.ts` + `StaminaBarView.ts` (the latter
  also carried an ML-1 leak site).

**CSS:** port `StaminaBar.vue` scoped styles into `styles-source.css` under
`[data-dse-element="stamina-bar"]` (rename `.vue-stamina-bar-container` → `.ds-stamina-bar`);
`--stamina-bar-color*` vars already live at `styles-source.css:2026`. The DOM modal's styles
(`.stamina-bar-container`, `.apply-*`, `.stamina-mod-*`, `.quick-mod-*`, …) are **already** in
`styles-source.css` — no port. See §3.

**Test net:** `T-6` (F3) StaminaBar model — schema-validation failure → composed error;
defaults pinned (CB-15: `current_stamina` omitted defaults to 0 — **preserve today's behavior**,
do not "fix" under D1); `fromHero`→`updateHero` round-trip. Plus `T-StaminaBar`
render+persist (jsdom + vault-fake, F3 T-10 pattern): render bar/overlays/pill; click → modal;
apply damage → model mutates → **exactly one** debounced block-body replacement, surrounding
note bytes intact; and a **byte-compat assertion** that `serialize(parse(yaml))` equals the
current `stringifyYaml(StaminaBar.parseYaml(yaml))` output for the documented example blocks.

**Shippable here?** **Yes.** All three migrated; Vue is dead at runtime (deps still installed).

---

### Step 4 — Vue teardown (deletion) — **trigger point: after Step 3 lands & is verified**

**Trigger:** merge only once HR + Skills + StaminaBar are verified in a test vault against the
documented example blocks. Before this PR, any element regression is a clean single-PR revert
(Vue files + deps still in tree). This is the point of no return for Vue.

**Deletions — orphaned shared chrome SFCs** (now zero importers): `Common/ComponentWrapper.vue`,
`Common/CollapsibleHeading.vue`, `Common/ComponentHideIndicator.vue`,
`Common/RightArrowToggleIndicator.vue`, `Common/ToggleIndicator.vue`, `Common/TooltipHover.vue`,
`Common/DsButton.vue`, `Common/Modal.vue`, `VerticalRule.vue`, and the empty
`drawSteelComponents/Modal.vue` (DC-3). This empties `src/drawSteelComponents/` → remove the dir.

**Deletions — Vue TS glue:** `src/utils/ComponentProcessor.ts` (kills ML-2 — the never-unmounted
apps), `src/utils/ModalProcessor.ts`, `shims-vue.d.ts`, empty
`src/drawSteelComponents/StaminaBar/StaminaEditObsidianModal.ts` (DC-3).

**Deletions — deps** (`package.json`): remove dependency `vue`; devDependencies
`@vue/compiler-sfc`, `unplugin-vue`, `vue-tsc`. (Verify + likely drop `css` / `@types/css`
and `jszip-utils` while here — F3 BT-8 — but that's optional cleanup, not Vue.)

**F1 interface used:** none (pure deletion).

**Shippable here?** **Yes** (bundled with steps 5–6 recommended). Nothing imports the deleted
symbols after step 3.

---

### Step 5 — CSS re-plumb

**Goal:** produce `styles.css` from `styles-source.css` alone, with the SFC-extraction step
gone.

**Files touched:** `esbuild.config.mjs`, `styles-source.css`, `main.ts` (unchanged import).

- **Keep the pipeline shape** (OD-D1-3): `main.ts:8` still `import "./styles-source.css"`;
  esbuild still emits `main.css`; `copyToStylesPlugin` still copies `main.css → styles.css`.
  Post-Vue, `main.css` == `styles-source.css` (no SFC styles injected). Rename the plugin
  `copy-vue-css-to-styles → copy-css-to-styles` and drop the "Vue" comment. `.gitignore` is
  unchanged (`main.css` + `styles.css` already ignored/generated).
- **Remove** the `unplugin-vue/esbuild` import (`esbuild.config.mjs:5`), its plugin entry
  (`:79`), and the `__VUE_OPTIONS_API__` / `__VUE_PROD_DEVTOOLS__` /
  `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` defines (`:85-87`).
- **Remove vestigial Vue CSS** from `styles-source.css`: the `.markdown-source-view.is-live-preview
  .ds-vue-wrapper` margin hack + the "Post Vue Globals" block (`:2017-2023`). **Keep** the
  `--stamina-bar-color*` `:root` vars (used by the ported StaminaBar CSS). The
  `ds-vue-wrapper` / `ds-vue-wrapper-edit-safe` wrapper classes have no remaining producer
  (the `genericComponentProcessor` that emitted them is deleted).

**Shippable here?** **Yes.** `styles.css` builds from a single source; every migrated element's
styles are present (ported in steps 1–3).

---

### Step 6 — Tooling swap (`vue-tsc → tsc`)

**Files touched:** `package.json`, `tsconfig.json` (minimal).

- `package.json` scripts: `build`: `vue-tsc --noEmit && node esbuild.config.mjs production` →
  `tsc --noEmit && node esbuild.config.mjs production`; `tsc`: `vue-tsc --noEmit` →
  `tsc --noEmit`.
- **Run `tsc --noEmit` and drive it to green.** F3 TS-1 warns `vue-tsc` "almost certainly
  fails today" and releases use `build-no-check`; plain `tsc` will surface the **same
  non-Vue** errors (`CodeBlocks.ts` `ctx.el`, `Images.ts` `string|null`, `StatblockProcessor`
  optional-length, `StaminaEditModal` optional arithmetic). D1 fixes this (small) list so the
  build gate is real (OD-D1-4). Do **not** widen `strict` here (TS-3 is F3's, deferred).
- `tsconfig.json`: no path-alias change needed for `@/` framework/elements imports (they live
  under `src/`, covered by `@/*`). Optionally add `@framework/*` / `@elements/*` aliases for
  ergonomics (cosmetic; the boundary lint from step 0 is what matters).

**Shippable here?** **Yes** — this is the D1 finish line for tooling; `npm run build` now
type-checks with `tsc`.

---

### Step 7 — Docs & ADR (DS-1 / DS-2 exit criteria)

**Files touched:**
- `.repo-docs/decisions/2026-04-06-revert-vue-3-adoption.md` — fill the empty **Outcome**:
  Vue removed under D1 on the F1 Element Framework v2; three elements (HR, Skills, StaminaBar)
  migrated to `ElementView`; single vanilla-DOM rendering strategy; `tsc` replaces `vue-tsc`;
  deps/`unplugin-vue`/`shims-vue.d.ts` gone; link the F1 spec + new "Element Framework v2" ADR.
- `.repo-docs/architecture.md` — retire the "two rendering strategies" / "Vue Components"
  sections (F3 DS-1); describe registry + pipeline + `ElementView` + seams (or, if the full
  rewrite is F1-step-10-owned, leave the banner note DS-1 recommends and point at F1).
- `draw-steel-elements/CLAUDE.md` — "Two rendering strategies (DOM + Vue 3)" → single
  DOM/framework; drop the "Vue components: `src/drawSteelComponents/`" line.
- Optionally seed a new `.repo-docs/decisions/2026-…-element-framework-v2.md` ADR (F1 §6
  step 10) — or leave to F1's cleanup step; note the pointer either way.

**Shippable here?** **Yes** (docs only).

---

## 3. CSS migration plan (SFC scoped styles → `styles-source.css` / D3 token layer)

**Principle:** D1 preserves today's look exactly. Each migrated element's SFC `<style scoped>`
is hand-ported into `styles-source.css` and re-scoped under the pipeline-stamped
`[data-dse-element="<id>"]` root attribute (F1 §3.5), so D3 inherits clean, already-scoped
element CSS and can later re-express colors as `--dse-*` tokens without moving selectors. Shared
chrome styles go under a `.ds-kit-*` class. **The port happens in the element's own step**
(1/2/3), so each element renders correctly the moment its Vue registration is removed; step 5
only removes the now-dead extraction pipeline + vestigial wrapper CSS.

| Source SFC (step) | Scoped classes | Destination in `styles-source.css` | Notes |
|---|---|---|---|
| `HorizontalRule.vue` (1) | `.h-rule-container`, `.line*`, `.line-center` | **none** | Already duplicated as `.ds-hr-container`/`.ds-hr-*` (`:330`). Net: delete a duplicate. |
| `SkillGroup.vue` (2) | `.container`, `.skill-list`, `.skill-item`, `.title` | `[data-dse-element="skills"] …` | Merge with existing `.ds-skills-container .ds-skill-list/.ds-skill-item` (`:1954-2014`); reuse `.ds-skill-indicator.enabled/.disabled` instead of `ToggleIndicator`'s classes. |
| `CollapsibleHeading.vue` + `RightArrowToggleIndicator.vue` (2) | `.heading > .heading-collapse-indicator`, `.is-collapsed :deep(svg)` | `.ds-kit-collapsible-heading …` | Uses Obsidian `--collapse-icon-color-collapsed`; keep the LP-scoped selector verbatim. |
| `ComponentWrapper.vue` + `ComponentHideIndicator.vue` + `VerticalRule.vue` (2) | `.component-wrapper`, `.collapsed-wrapper`, `.eye-container/.eye-indicator` (+ LP hover), `.v-rule-*` | `.ds-kit-component-wrapper …` | The shared collapsible chrome for Skills **and** StaminaBar; ported once in step 2, reused in step 3. |
| `StaminaBar.vue` (3) | `.vue-stamina-bar-container`, `.stamina-container`, `.overlay-container`, `.ds-temp-stamina-container`, `.stamina-indicator`, `.temp-stamina-indicator`, `.*-overlay`, `.background-pill` | `[data-dse-element="stamina-bar"] …` (rename `.vue-stamina-bar-container` → `.ds-stamina-bar`) | `--stamina-bar-color*` vars already at `:root` (`:2026`). |
| `StaminaEditModal.vue`, `StaminaAdjustor.vue`, `Modal.vue`, `DsButton.vue`, `TooltipHover.vue` (3) | — | **none** | Edit flow reuses the DOM `@views/StaminaEditModal`, whose CSS (`.stamina-bar-container`, `.apply-*`, `.stamina-mod-*`, `.quick-mod-*`, `.action-button`, …) is already in `styles-source.css`. SFCs dropped, styles not ported. |

**Pipeline change (step 5):** keep `import styles-source.css → main.css →(copy)→ styles.css`;
remove the SFC-style extraction that `unplugin-vue` performed; rename the copy plugin; delete
the `.ds-vue-wrapper*` + "Post Vue Globals" rules. **No `.gitignore` change** (both generated
files already ignored).

**Hand-off to D3:** because every ported block is already scoped under `[data-dse-element="…"]`
and colors reference Obsidian vars (or the `--stamina-bar-color*` seam), D3's token layer /
Legacy theme is a re-mapping of values, not a re-scoping of selectors.

---

## 4. Test net per migrated element (ties to F3 §4)

D1 lands the golden-render harness F1 §6 mandates "per element as it migrates," built on the
F3 §4 substrate (obsidian mock, in-memory **vault-fake**, `.yaml` raw-text transformer,
jsdom project, `js-yaml`-backed `parseYaml`/`stringifyYaml`). If F3's harness (BT-2 bootstrap,
`jest.config.ts` + `test/mocks/obsidian.ts`) has not yet landed, step 1 bootstraps the minimal
version; the `\.vue$ → stub` mapping F3 §4.2 needs **is deleted at teardown** (step 4) since no
`.vue` remains.

| Test | F3 tie | What it pins |
|---|---|---|
| `T-HR` render smoke (jsdom) | template of **T-10** | `ds-hr` → exact `.ds-hr-container` 3-div tree; empty/garbage body still renders; no listeners/writes. |
| `T-Skills` render + interact (jsdom) | **T-10** pattern | groups + indicators for `skills`/`custom_skills`/`only_show_selected` fixtures; collapse click flips DOM + writes `SessionStore`, performs **zero** vault writes; bad-enum body → `renderErrorCard` with `path: message`. |
| `ComponentWrapper` kit unit | — | `collapsible`/`collapse_default` matrix (defaults: collapsible=true, collapse_default=false); collapsed persists via `SessionStore`. |
| `T-6` StaminaBar model (node) | **T-6** verbatim | schema-fail → composed error; **CB-15 default pinned** (current omitted ⇒ 0, today's behavior); `fromHero`→`updateHero` round-trip. |
| `T-StaminaBar` render + persist (jsdom + vault-fake) | **T-10** + T-6 | render bar/overlays/pill; click → DOM `StaminaEditModal`; apply → model mutates → **exactly one** debounced block-body replacement, surrounding bytes intact; read-only when `canPersist=false`. |
| `T-StaminaBar` byte-compat (node + vault-fake) | T-6 | `serialize(parse(yaml))` byte-equals the **current** `stringifyYaml(StaminaBar.parseYaml(yaml))` for every documented example block (field set + order + trailing-trim). |
| `ValidationService` unit | **PF-1** | compile-once-cache-per-id (recompile counter ⇒ 1 across N validations); component-wrapper `$ref` resolves. |
| `ReferenceService` unit | **T-8** subset | `at-path` + `wikilink` provider selection + first-`ds-*`-block extraction; `scc:` string → "unresolvable" until F2. (Scaffolding — no D1 element uses it.) |

De-scoped (F3 §4.5): Vue component tests (deleted), visual/CSS regression (D2/D3), Live Preview.

---

## 5. Risks & rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| **`tsc` surfaces pre-existing type errors** (F3 TS-1) and breaks the build gate | high — TS-1 says `vue-tsc` likely fails today | Run `tsc --noEmit` as a **spike at the start of step 3/4** (before deleting `vue-tsc`), fix the small non-Vue list (CodeBlocks `ctx.el`, Images `string|null`, Statblock optional-length, StaminaEditModal optional arithmetic); if the list is unexpectedly large, keep `build-no-check` as an interim bridge and gate in CI (F3 OD-6) — recorded as OD-D1-4. |
| **StaminaBar visual/behavior drift** (SFC scoped styles + computed classes hand-ported; CB-17 fold-in) | medium | Byte-compat serialize test + jsdom render snapshot + manual test-vault pass against `docs/stamina-bar.md` before the teardown PR; StaminaBar migrates **after** two simpler rehearsals (HR, Skills). |
| **Edit-UX change from unifying on the DOM `StaminaEditModal`** (different layout than `StaminaEditModal.vue`) | medium | Deliberate (OD-D1-1, F3 "unify on one modal"); the DOM modal is already shipped/used by the initiative tracker, so it is the tested path. Flag in release notes; alternative (re-express the Vue modal) costed in §6. |
| **ComponentWrapper collapse parity** (`collapsible`/`collapse_default` keys are a preserved contract) | low–medium | Kit unit test on the defaults matrix; ported from the SFC + `@model/ComponentWrapper` defaults 1:1. |
| **`Vault.process` writeback in `ReadingModeBlockHost` is new code** on the persist path | low | Only StaminaBar exercises it in D1 (one small element); round-trip + concurrent-write tests on the vault-fake; canvas path quarantined + read-only (no silent drop). |
| **Orphaned chrome `.vue` linger between steps 2–4** | low | Harmless (esbuild compiles only imported SFCs); swept wholesale at step 4; a "no `.vue` imported" grep gates the teardown PR. |

**Rollback strategy:**
- **Per-element PRs (steps 1–3)** are independently revertible while Vue files + deps remain in
  tree (through step 3): reverting an element PR restores its `RegisterElements.ts` lines and
  its Vue SFC/import, and the element renders via Vue again.
- **Keep teardown (step 4) as the last, separately-revertible PR** (bundled with 5–6 is fine —
  they are interdependent cleanup). Reverting steps 4–6 restores the Vue deps/tooling/CSS
  pipeline; combined with reverting the offending element PR, the plugin returns to a fully
  working Vue state.
- **Gate the teardown PR** on a green test suite + a manual test-vault sign-off for all three
  elements. This is the only irreversible-in-practice boundary (re-adding Vue later would be a
  new effort, contra the ADR).

---

## 6. Open Decisions — needs Scott

Recommended defaults let D1 proceed; each is a real fork.

- **OD-D1-1 — StaminaBar edit modal.** Unify on the existing DOM `@views/StaminaEditModal`
  (recommended — already shipped/tested, used by initiative, kills `StaminaEditModal.vue` +
  `StaminaAdjustor.vue` + `Modal.vue` + `DsButton.vue` with zero new modal code) **vs.**
  re-express `StaminaEditModal.vue` in DOM to preserve the current StaminaBar-specific edit
  layout (adjustor +/- text input + Kill/Full-Heal/Spend-Recovery). Cost of the alternative:
  ~1 more view + porting 4 chrome SFCs; benefit: pixel-identical edit dialog for existing
  StaminaBar users. **Recommend: unify (DOM modal).**
- **OD-D1-2 — Where the collapsible/ComponentWrapper DOM helpers live.** Seed
  `framework/kit/` now (recommended — F1 §6 step 3 assumes a "kit collapsible" exists by the
  Skills migration; D2 later refines/extends into the full accessible kit) **vs.** co-locate in
  `elements/skills/` and let D2 hoist. **Recommend: seed `kit/` (2 files: ComponentWrapper,
  CollapsibleHeading).**
- **OD-D1-3 — CSS re-plumb shape.** Keep `import styles-source.css → main.css →(copy)→
  styles.css` (recommended — minimal diff, `.gitignore` unchanged, D3-neutral) **vs.** drop the
  copy and track `styles.css` directly / rename the source. **Recommend: keep the copy,
  rename the plugin.**
- **OD-D1-4 — `tsc` gate vs. `build-no-check` bridge.** Fix the (expected small) pre-existing
  type-error list inside D1 so `tsc --noEmit` is a real gate (recommended) **vs.** keep
  `build-no-check` and defer the fix to F3/CI. **Recommend: fix in D1** (it is the enabling
  condition for bugs like CB-1, and D1 already touches the build).
- **OD-D1-5 — Dead DOM twins.** Delete `StaminaBarProcessor`/`StaminaBarView` and
  `SkillsProcessor`/`SkillsView` in their element's step after diffing as a baseline
  (recommended; = program OD-7 "delete after D1") **vs.** keep until a later cleanup. **Recommend:
  delete in-step.**
- **OD-D1-6 — Bundle steps 4–6 into one "Vue removal" PR.** Recommended (they are interdependent
  and Vue is already unused at runtime after step 3) **vs.** three separate PRs for a finer
  bisect. **Recommend: one PR** for teardown+CSS+tooling, kept last and separately revertible.

*Cross-references: F1 §3 (interfaces), §6 (migration steps 0/1/3/4 + recipe), §8 (OD-1
reactivity, OD-3 write-behind, OD-8 boundary lint); F3 §3 (Vue-limbo inventory), §4 (harness,
T-6/T-10), CB-17/ML-2/DC-1–4/BT-7/BT-8/TS-1/DS-1/DS-2; program README decisions 3 & 6 + F1/F3
OD defaults.*
