# DSE Element Framework v2 — Core Implementation Plan (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task, TDD (write failing test on the Plan-01 harness → run RED → implement → run GREEN → commit). This is a *lean* plan: the exact interface **signatures are normative in the F1 spec §3** — implementers READ them there and implement verbatim; this file gives task boundaries, files, dependency order, test focus, and impl notes.

**Goal:** Build `src/framework/` — declarative element registry + one mode-agnostic render pipeline + the three injection seams + lifecycle-correct plumbing — with the legacy `RegisterElements` path still coexisting (**NO element migrated** in this plan; zero user-visible change).

**Architecture:** Implement F1 §3 interfaces verbatim; pipeline per §2.4; `ReadingModeBlockHost` per §3.4 on `Vault.process`; seams ship minimal default impls (D3/D4/F2 extend later). **Bottom-up task order** along the type-dependency graph so each task compiles + tests green alone (type-only circular imports via `import type` where needed). Vanilla TS + DOM.

**Authoritative spec (read the cited § for exact signatures):** `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md`

## Global Constraints

- **Vanilla TS + DOM. NO Vue. NO new runtime deps** — a new dependency is a STOP-and-report open decision, not a choice.
- Every DOM listener via `Component.registerDomEvent`; every subscription via `owner.register`; views tied to block lifecycle via `host.addChild`. `MarkdownRenderer.render` parented to the **view**, never the plugin.
- Persisted writes via **`Vault.process`** (atomic), splicing exactly the block's lines, **preserving the original fence characters/alias** (do NOT reintroduce CB-5's canonical-alias rewrite). Debounced write-behind (~400ms + flush-on-unload) per F1 OD-3 default.
- No `innerHTML`; `createEl`/`createDiv` only. Popout-safe: timers/document via `rootEl.ownerDocument.defaultView`, never bare `window`/`document`.
- **Import boundary:** `src/framework/` MUST NOT import `src/elements/`; add the ESLint rule (F1 OD-8) in the final task.
- **Additive F1 touches to fold in (README register):** `ElementDefinition.authoring?` (optional, Task 8); `RenderContext.roll?` + a stub `RollService` type (Task 6); a `HeroPanel<S>` base-class stub (Task 7); `RenderMode = "reading" | "live-preview" | "sidebar"` (Task 5/6). Declared-but-minimal so D5/D7/D8 extend without re-touching F1.
- **Coexistence:** legacy `src/utils/RegisterElements.ts` stays and keeps registering all current elements; the new registry registers nothing yet (proven by a fake element in tests). Legacy `src/drawSteelAdmonition/`, `CodeBlocks.ts`, `JsonSchemaValidator.ts`, `ReferenceResolver.ts` are UNTOUCHED (migration/retirement is D1+).
- ES2018 / CJS / esbuild (do not touch `esbuild.config.mjs`); `obsidian`/`electron`/CM6 external. TDD on jest (`test/mocks/obsidian.ts`, new tests under `test/**/framework/`). Commits inside the `dse-framework` worktree DSE submodule; **NO AI/co-author trailers**. node via the workspace devbox.

## File Structure (per F1 §2.5)

```
src/framework/
  validation.ts  ValidationService, ValidationResult
  session.ts     SessionStore
  seams/refs.ts  ReferenceService, RefProvider, RefRequest, ResolvedRef, RefKind (+ at-path/wikilink providers)
  seams/theme.ts ThemeService default, DseThemeId, DseTokenName
  seams/prefs.ts PreferenceStore default, DsePrefs, PrefDescriptor
  host/BlockHost.ts / ReadingModeBlockHost.ts / LivePreviewBlockHost.ts(stub)   BlockHost, BlockInfo, RenderMode
  context.ts     RenderContext (+ RollService stub)
  view.ts        ElementView (+ HeroPanel stub)
  registry.ts    ElementRegistry, ElementDefinition, ElementShape
  pipeline.ts    ElementPipeline, renderErrorCard
  kit/           (empty; D2 populates)
main.ts          wire services + ElementRegistry alongside RegisterElements
.eslintrc        import-boundary rule (framework ⊥ elements)
```

---

## Task 1: ValidationService (plugin-scoped AJV, cached)
**Files:** Create `src/framework/validation.ts`; Test `test/unit/framework/validation.test.ts`.
**Interfaces:** `ValidationService`, `ValidationResult` per F1 §5. Self-contained (no other framework deps). Port the AJV setup from `src/utils/JsonSchemaValidator.ts` (2019 dialect + ajv-keywords + ajv-errors) — do NOT modify the legacy file.
**Test focus:** valid → `{valid:true}`; invalid → `{valid:false, errors:[{path,message}]}` with the real composed messages (reuse an existing YAML schema, e.g. StaminaBar); **compile-once** — validating the same element id twice compiles once (assert via a probe); `addDependencySchema` enables `$ref` to the component-wrapper schema.
**Impl notes:** plugin-scoped (created onload, dropped onunload) — replaces the module-global singleton + recompile-per-call.

## Task 2: SessionStore
**Files:** Create `src/framework/session.ts`; Test `test/unit/framework/session.test.ts`.
**Interfaces:** `SessionStore` per F1 §4.3. Self-contained.
**Test focus:** `set(blockKey,slot,v)`→`get` returns v; blockKeys/slots isolated; missing→undefined; typed round-trip.
**Impl notes:** plugin-scoped `Map`, cleared on unload. Pure.

## Task 3: ReferenceService + built-in providers
**Files:** Create `src/framework/seams/refs.ts`; Test `test/unit/framework/refs.test.ts`.
**Interfaces:** `RefKind`, `RefRequest`, `ResolvedRef`, `RefProvider`, `ReferenceService` per F1 §3.7. Built-in `at-path` + `wikilink` providers port `src/utils/ReferenceResolver.ts` semantics (5-step lookup + first `ds-*` block extraction). Reserve the `scc` slot.
**Test focus (fake vault/metadata):** `@path` + `[[wikilink]]` resolve to the first ds-block's parsed data; `register(provider)` consults later providers before built-ins (override order); an `scc:`/`scc.vN:` string with no provider → standard unresolved error; `resolveDeep` walks nested data. `ResolvedRef.scc` carries the bare identity for kind `scc`.

## Task 4: Theme + Preferences seam defaults
**Files:** Create `src/framework/seams/theme.ts`, `seams/prefs.ts`; Test `test/dom/framework/seams.test.ts`.
**Interfaces:** `ThemeService`/`DseThemeId`/`DseTokenName` (§3.5) + `PreferenceStore`/`DsePrefs`/`PrefDescriptor` (§3.6) — **default/minimal** impls (D3/D4 extend). Storage: plugin `saveData` (F1 OD-2 default; inject a saveData-like fn so it's testable).
**Test focus:** `theme.apply(root,owner)` stamps `data-dse-element` + `data-dse-theme`; `cssVar("accent")==="var(--dse-accent)"`; `prefs.get/set` persists via fake saveData; `prefs.reflect(root,owner)` stamps `data-dse-*` for attr-bearing prefs + updates on change; the `theme` pref descriptor has **NO `attr`** (D3/D4 contract — no double-stamp). Subscriptions auto-unsubscribe via `owner.register`.

## Task 5: BlockHost + ReadingModeBlockHost
**Files:** Create `src/framework/host/BlockHost.ts`, `host/ReadingModeBlockHost.ts`, `host/LivePreviewBlockHost.ts`(stub); Test `test/dom/framework/reading-mode-host.test.ts`.
**Interfaces:** `BlockInfo`, `BlockHost`, `RenderMode` (define `RenderMode="reading"|"live-preview"|"sidebar"` here — additive `sidebar`) per F1 §3.4/§3.2. `ReadingModeBlockHost` wraps a `MarkdownPostProcessorContext` + one `MarkdownRenderChild`; `LivePreviewBlockHost` is a documented throw/no-op stub.
**Test focus:** `replaceSource(newBody)` splices exactly the block body via `Vault.process` (note intact, **fence/alias preserved**); `getBlockInfo()`→`{language,lineStart,lineEnd}`; `canPersist===false` when `getSectionInfo` null → `replaceSource` resolves false; `addChild` ties a Component (unload cascades); `blockKey()` stable.
**Impl notes:** re-implement `CodeBlocks.updateMarkdownCodeBlock` on `Vault.process`; quarantine the canvas-selection fallback here, returning `false` (not console.log) on miss. **Trickiest task — escalate model if blocked.**

## Task 6: RenderContext + RenderMode + RollService stub
**Files:** Create `src/framework/context.ts`; Test `test/unit/framework/context.test.ts`.
**Interfaces:** `RenderContext` per F1 §3.2 (re-export/import `RenderMode` from host via `import type`), plus a minimal `RollService` type stub and additive `RenderContext.roll?` (D5 fills). No view ref, no DOM.
**Test focus:** a constructed context exposes app/plugin/settings/host/mode/theme/prefs/refs/session and `mode===host.mode`. Light — DTO/wiring.

## Task 7: ElementView base (+ HeroPanel stub)
**Files:** Create `src/framework/view.ts`; Test `test/dom/framework/element-view.test.ts`.
**Interfaces:** abstract `ElementView<M> extends Component` per F1 §3.3 (`onMount`/`onUpdate`/`mount`/`update`/`renderMarkdown`/`persist`/`win`), plus a `HeroPanel<S>` base-class stub (additive; mount/update mirror, no container/persist).
**Test focus:** `mount(root,model)` runs `onMount` (createEl DOM); `renderMarkdown` parents the MarkdownRenderChild to the **view** (not the plugin); `Component.onunload` removes listeners; `persist()` calls `def.serialize`→`host.replaceSource`, returns false when `!host.canPersist`; debounced write-behind coalesces rapid calls + flushes on unload. `win` = `rootEl.ownerDocument.defaultView`.

## Task 8: ElementRegistry + ElementDefinition/ElementShape
**Files:** Create `src/framework/registry.ts`; Test `test/unit/framework/registry.test.ts`.
**Interfaces:** `ElementShape`, `ElementDefinition<M>` (incl. additive optional `authoring?`), `ElementRegistry` per F1 §3.1 (references `RenderContext`/`ElementView` via `import type`).
**Test focus:** register a fake def → `get(id)`/`get(alias)`/`all()`; registry **rejects** duplicate id, duplicate alias, or `shape:"persisted"` missing `serialize`. Keep registry storage separable from the Obsidian `registerMarkdownCodeBlockProcessor` wiring (that's Task 10) so this is a pure unit.

## Task 9: ElementPipeline + renderErrorCard
**Files:** Create `src/framework/pipeline.ts`; Test `test/dom/framework/pipeline.test.ts`.
**Interfaces:** `ElementPipeline.run(def, source, host)` per F1 §2.4; `renderErrorCard(root, def, error)` per F1 §3.8.
**Test focus:** end-to-end with a fake **static** element (parse→validate→createView→mount → expected DOM) and a fake **persisted** element (interaction → serialize → exactly one `host.replaceSource`); a parse error, a schema-invalid input, and a throw-in-onMount each render ONE error card (stage + message; validation errors list `path: message`) — no per-element try/catch; refs resolved before parse when `autoResolveRefs!==false`.
**Impl notes:** single error boundary around steps 1–4 + async rejections; apply click-shield + theme-stamp + pref-reflect to root before `onMount` unless `def.noClickShield`.

## Task 10: Wire into main.ts + import-boundary lint
**Files:** Modify `main.ts`; add `.eslintrc`/flat-config boundary rule; Test `test/dom/framework/plugin-wiring.test.ts`.
**Test focus:** loading the plugin (fake App) constructs services + `ElementRegistry` + registers dependency schemas without throwing, while legacy `RegisterElements` still runs (assert a legacy alias like `ds-ft` works AND the new registry exists, empty of migrated elements). Lint: an `import/no-restricted-paths` (or eslint-plugin-boundaries) rule forbids `src/framework/`→`src/elements/`; assert the rule is present in config. **If installing eslint is required to run it, that's a STOP/open-decision — prefer config-only + a doc note** (F3 notes eslint isn't yet a dep).
**Impl notes:** onunload drops services. Migrate no element. Leave the F1 ADR/docs to D1's doc task.

---
## Self-review (done)
Every F1 §3 interface maps to a task; additive touches folded into Tasks 5/6/7/8; **bottom-up order** means each task's deps already exist (type-only `import type` covers context⇄host and registry⇄view cycles); coexistence with legacy registration preserved throughout; no full-code placeholders (code derives from F1 §3 + each test focus).
