# D1 — Vue Removal & First Element Migrations — Implementation Plan (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the Plan-01 harness (RED → GREEN → commit). Lean plan: full interface signatures are in the **F1 spec §3** and the migration recipe in **F1 §6**; the design rationale is in **D1-vue-removal-migration-spec.md**. This file gives task boundaries, files, test focus, impl notes.

**Goal:** Migrate the 3 Vue-based elements (Horizontal Rule, Skills, Stamina Bar) onto the now-complete Element Framework v2, wire the framework's registered elements into Obsidian, then remove Vue entirely (deps, build plugin, SFCs) and swap `vue-tsc`→`tsc`. The other 8 elements stay legacy (untouched). End state: single rendering strategy, Vue gone, `tsc` green.

**Sources:** framework `src/framework/` (Plan 02, complete @ `76b8cbc`+); F1 spec `docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md` (§3 interfaces, §6 migration recipe); D1 spec `docs/superpowers/dse-overhaul/D1-vue-removal-migration-spec.md`; F3 §3 Vue-removal inventory.

## Global Constraints

- **Migrate onto F1**: each element becomes `src/elements/<id>/{definition,model,view}.ts` implementing the F1 `ElementDefinition`/`ElementView` contracts, registered via the framework `ElementRegistry`, and **removed from legacy `RegisterElements.ts`** (no double `registerMarkdownCodeBlockProcessor`). The other 8 elements + `Common/horizontalRuleProcessor.ts` (used internally by statblock/featureblock) stay legacy — do NOT touch them.
- **Preserve every `ds-*` alias** exactly + the `collapsible`/`collapse_default` ComponentWrapper keys.
- **Byte-identical YAML round-trip** for the persisted Stamina Bar — keep the `StaminaBar` model class verbatim; `serialize = stringifyYaml(model)`; align `stringifyYaml`/`dump()` options with Obsidian (the Task-2 watch-item, likely `lineWidth:-1`) so existing notes round-trip unchanged.
- **CSS**: port each migrated SFC's scoped styles into `styles-source.css`, re-scoped under `[data-dse-element="<id>"]`, **in that element's own migration step**.
- **Vue teardown is the LAST feature step, separately revertible**, gated on all 3 migrations green.
- Vanilla TS + DOM, NO new deps. TDD on the harness. No new tsc errors introduced (the legacy 11 are *removed* in Task 5). Commits inside the `dse-framework` worktree DSE submodule; **NO AI/co-author trailers**.

## File Structure
```
src/elements/horizontal-rule/{definition,view}.ts        (static; no model)
src/elements/skills/{definition,model,view}.ts           (interactive; reuse model/Skills.ts + utils/SkillsData.ts)
src/elements/stamina-bar/{definition,model,view}.ts      (persisted; reuse model/StaminaBar.ts verbatim)
src/framework/kit/{collapsible,componentWrapper}.ts      (seeded in Task 2 — the vanilla ComponentWrapper)
src/framework/registerFrameworkElements.ts               (Task 1 — the registry→Obsidian wiring loop)
main.ts                                                   (call registerFrameworkElements after initializeElementFrameworkV2)
DELETED at Task 4: all src/drawSteelComponents/*.vue, ComponentProcessor.ts, ModalProcessor.ts(if Vue-only),
  shims-vue.d.ts; package.json vue deps; esbuild.config.mjs Vue plugin/defines.
```

---

## Task 1: Horizontal Rule migration + the framework→Obsidian wiring loop
**Files:** Create `src/framework/registerFrameworkElements.ts`, `src/elements/horizontal-rule/{definition,view}.ts`; Modify `main.ts`, `src/utils/RegisterElements.ts`, `styles-source.css`; Test `test/dom/elements/horizontal-rule.test.ts`, `test/dom/framework/register-framework-elements.test.ts`.
**The wiring (F1 §2.3 "incremental migration switch"):** `registerFrameworkElements(plugin, framework)` iterates `framework.registry.all()`; for each def + each alias, calls `plugin.registerMarkdownCodeBlockProcessor(alias, (source, el, ctx) => framework.pipeline.run(def, source, new ReadingModeBlockHost(plugin, el, ctx, alias)))`. Call it in `main.ts onload` after `initializeElementFrameworkV2(...)`, once the HR def is registered into `framework.registry`.
**HR element:** static, zero-config. Its `view.onMount` builds the same `<hr class="…">` the legacy `Common/horizontalRuleProcessor.build` produces (reuse that DOM logic; do NOT delete that file — statblock/featureblock still use it). `parse` returns `{}`/trivial. Register `ds-hr`,`ds-horizontal-rule` via the framework; **remove those two aliases from `RegisterElements.ts`** (the `HorizontalRule.vue` genericComponentProcessor registration). Port the HR SFC's styles into `styles-source.css` under `[data-dse-element="horizontal-rule"]`. Delete `src/drawSteelComponents/HorizontalRule.vue`.
**Test focus:** the wiring loop registers every alias of every registered def and routes to `pipeline.run` (fake a registry with a fake def, spy `registerMarkdownCodeBlockProcessor`); rendering a `ds-hr` block through the pipeline produces the expected `<hr>` DOM (golden vs the legacy output); `ds-hr` is no longer double-registered (grep/behavior).
**Impl notes:** this is the first real element on the framework — prove the end-to-end path. `data-dse-element="horizontal-rule"` + `data-dse-theme` present.

## Task 2: Skills migration (interactive; seed `framework/kit/`)
**Files:** Create `src/elements/skills/{definition,model,view}.ts`, `src/framework/kit/collapsible.ts`, `src/framework/kit/componentWrapper.ts`; Modify `RegisterElements.ts`, `styles-source.css`; Test `test/dom/elements/skills.test.ts` (+ kit tests).
**Element:** interactive (session-only collapse). Reuse `src/model/Skills.ts` + `src/utils/SkillsData.ts` (renderer-agnostic — keep). The view renders the skill groups; **collapse state lives in `SessionStore`** (keyed by `blockKey`), not the note. Seed the vanilla `kit/componentWrapper` (the `collapsible`/`collapse_default` wrapper, replacing `Common/ComponentWrapper.vue`) + `kit/collapsible` (heading + toggle, replacing the Vue collapse widgets). Keep `only_show_selected` behavior. `schema` = the existing `SkillsSchema.yaml`. Register `ds-skills` via the framework; remove it from `RegisterElements.ts`. Port SFC styles → `styles-source.css` under `[data-dse-element="skills"]`. Delete `SkillList.vue`, `SkillGroup.vue`.
**Test focus:** renders the skill list; toggling a group collapses/expands and the state persists across a re-render via `SessionStore`; `collapsible:false` hides the toggle; `collapse_default:true` starts collapsed; `only_show_selected` filters. Kit `collapsible`/`componentWrapper` unit-tested.
**Impl notes:** first `kit/` widgets — keep them small and reusable (D2 extends them). Second Vue element gone.

## Task 3: Stamina Bar migration (persisted — byte-compat)
**Files:** Create `src/elements/stamina-bar/{definition,model,view}.ts`; Modify `RegisterElements.ts`, `styles-source.css`, `test/mocks/obsidian.ts` (align `stringifyYaml` dump opts — see below); Test `test/dom/elements/stamina-bar.test.ts`.
**Element:** persisted. **Reuse `src/model/StaminaBar.ts` verbatim** for parse (keep byte-compat). `serialize(model) = stringifyYaml(<the exact DTO shape written today>)`. `shape:"persisted"`; persistence flows through the framework debounced write-behind (`ReadingModeBlockHost.replaceSource`, atomic + alias-preserving). The view renders the bar (health/temp overlays) and on click opens the **existing DOM** `src/views/StaminaEditModal.ts` (do NOT re-express the Vue modal). `schema` = `StaminaBarSchema.yaml`. Register `ds-stam`,`ds-stamina`,`ds-stamina-bar` via the framework; remove from `RegisterElements.ts`. Port SFC styles → `styles-source.css` under `[data-dse-element="stamina-bar"]`. Delete `StaminaBar.vue`, `StaminaAdjustor.vue`, `StaminaBar/StaminaEditModal.vue`.
**Byte-fidelity (Task-2 review watch-item):** before writing the round-trip test, align the harness mock's `stringifyYaml` (`test/mocks/obsidian.ts`) `dump()` options with Obsidian's actual output (Obsidian uses js-yaml `dump` with specific opts — determine + match, likely `lineWidth: -1`, no `flowLevel`, `sortKeys:false`) so the byte-compat comparison is meaningful. This resolves the deferred watch-item.
**Test focus:** parse a documented stamina-bar fixture → view renders; simulate an edit → `serialize` → the block body written is **byte-identical in structure** to what the legacy path wrote (round-trip a real fixture); persisted via exactly one `replaceSource` (framework write-behind); fence/alias preserved. Last Vue element gone → **unblocks Task 4**.

## Task 4: Vue teardown (deps, SFCs, esbuild, CSS pipeline) — separately revertible
**Files:** Modify `package.json`, `esbuild.config.mjs`, `.gitignore`; Delete the Vue-removal inventory (F3 §3): all remaining `src/drawSteelComponents/*.vue` (Common chrome, `VerticalRule.vue`, empty `Modal.vue`, any leftover), `src/utils/ComponentProcessor.ts`, `src/utils/ModalProcessor.ts` (verify Vue-only first), `shims-vue.d.ts`, dead DOM twins per F3 DC-1..4 if now unused; Test: build succeeds.
**Do:** remove `vue`, `@vue/compiler-sfc`, `unplugin-vue`, `vue-tsc` from `package.json`; remove `unplugin-vue/esbuild` import + plugin entry + `__VUE_*` defines from `esbuild.config.mjs`; rework `copyToStylesPlugin` (the SFC-style→`main.css`→`styles.css` path) now that no SFC styles exist — styles come only from `styles-source.css` (imported by `main.ts`). Confirm `npm run build-no-check` (esbuild) still produces a working `main.js`/`styles.css`.
**Test focus:** `grep` proves zero `.vue` files / zero `vue` imports remain; the production bundle builds; the 3 migrated elements still render (full suite green). Gate: this task starts only after Tasks 1–3 are green.

## Task 5: Tooling swap (`vue-tsc`→`tsc`) + fix the legacy tsc errors
**Files:** Modify `package.json` (scripts), `justfile` (release recipe), the legacy `src/` files carrying the 11 known tsc errors (F3 TS-1: `CodeBlocks.ts` `ctx.el`, `initiativeProcessor`/`Images` null-vs-string, `StatblockProcessor` optional, `KeyValuePairs`, `RegisterElements`, etc.); Test: `npx tsc --noEmit` clean.
**Do:** change `build`/`tsc` scripts from `vue-tsc --noEmit` → `tsc --noEmit`. Then **fix the 11 pre-existing legacy tsc errors** so `tsc --noEmit` passes with **zero** errors (these are the enabling condition for a real type-check CI gate — F3). Update the `justfile` `release` recipe to run `npm run build` (type-checked) not `build-no-check`.
**Test focus:** `npx tsc --noEmit` → 0 errors; the build still works; full suite green.
**Impl notes:** the fixes are small and localized (per F3 TS-1). If any fix would change runtime behavior, STOP and report — this task is type-correctness only.

## Task 6: Docs / ADR
**Files:** Modify `.repo-docs/decisions/2026-04-06-revert-vue-3-adoption.md` (fill Outcome), `.repo-docs/architecture.md` (remove Vue framing → describe Framework v2), `CLAUDE.md` (drop "two rendering strategies").
**Do:** fill the revert-Vue ADR's empty **Outcome** section (Vue removed, framework v2 migration path, 3 elements moved, single strategy); rewrite `architecture.md`'s stale Vue sections to describe the framework (registry/pipeline/seams/host) + the coexistence-then-migration model; update the DSE `CLAUDE.md` "Key Architecture" bullets.
**Test focus:** none (docs) — self-review for accuracy against the shipped code.

---
## Self-review (done)
Every D1-spec step maps to a task; the framework→Obsidian wiring (missing after Plan 02) is Task 1's first deliverable; migration order HR→Skills→StaminaBar is simplest→persisted (proving static, then interactive+SessionStore, then persisted+write-behind); Vue teardown gated after all 3 migrations; byte-fidelity + the dump()-alignment watch-item land in Task 3; legacy 8 elements + the internal HR DOM twin left untouched throughout.
