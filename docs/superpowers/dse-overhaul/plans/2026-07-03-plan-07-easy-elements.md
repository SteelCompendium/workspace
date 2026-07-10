# D-wave Plan 07 — the remaining 6 elements (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the harness. Lean plan: F1 §3 interfaces, F1 §6 recipe, and the already-migrated `src/elements/{horizontal-rule,stamina-bar,negotiation,initiative}/` are the patterns. This file gives task boundaries, exact files (from the 2026-07-03 easy-6 survey), test focus, gotchas.

**Goal:** Migrate the last 6 legacy elements onto Element Framework v2 — **Feature, Featureblock, Statblock** (SDK-backed static), **Counter** (persisted), **Values Row** + **Characteristics** (trivial static) — retiring their legacy processors. After this, all 11 elements are on the framework and `RegisterElements.ts` is empty (F1 §6 step 10 territory).

**Architecture:** These are the "easy" elements (survey-confirmed: all vanilla DOM, schema-less, no ref resolution, only Counter persists). Each migration = `src/elements/<id>/{definition[,model],view}.ts` + register in `main.ts` + remove from `RegisterElements.ts` + delete the legacy processor + golden test — mirroring the negotiation migration (which did view+register+retire in one task). 5 tasks; Feature first (FB + Statblock reuse its sub-views).

**Tech Stack:** vanilla TS + DOM, `steel-compendium-sdk` 2.1.5 (the SDK-backed three — this migration uses EXISTING parsing, NOT the F2/SDK-3.x effort), Obsidian `yaml` serializer (Counter), Jest.

## Global Constraints

- **Worktree only:** `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` (branch `dse-framework`). node/npm via WORKSPACE devbox. Commits in the submodule; **NO AI/co-author trailers.**
- **Per element:** create `src/elements/<id>/{definition,view[,model]}.ts` implementing F1 §3; register in `registerFrameworkElementDefinitions` (`main.ts`); remove its aliases from `src/utils/RegisterElements.ts` (house-style "migrated (Plan 07)" comment) + drop the now-unused processor import; delete the legacy processor file; a golden render test per element (drive `pipeline.run(def, source, host)` like `negotiation.test.ts`). **Preserve every alias exactly.**
- **Schema-less:** none of the 6 has a schema — omit `schema` (pipeline skips validation). `autoResolveRefs: false`. No `resolveRefs` (none resolve refs).
- **SDK-backed parse uses RAW, not data** (Feature/Featureblock/Statblock): `parse: (_data, raw) => <Config>.readYaml(raw)` — the SDK `YamlReader` consumes text. `FeatureConfig.readYaml` ALSO double-parses (`parseYaml` for `.indent`) — reuse it verbatim, don't reimplement. The plain three (Counter/ValuesRow/Characteristics) use `parse: (data) => <Model>.parse(data)` (pre-parsed, like stamina-bar/skills).
- **Byte-identical persist (Counter only):** reuse the `Counter` model; `serialize = stringifyYaml(model).trim()` (matches `CodeBlocks.updateCounter` → `CodeBlocks.ts:31`); swap the 3 `CodeBlocks.updateCounter` calls → `this.persist()`; gate writes on `cx.host.canPersist` (read-only — the T3.5 `data-dse-readonly` affordance shows automatically); listeners via `registerDomEvent`/contentOwner (Counter's legacy raw `addEventListener` must move to the framework pattern — mirror stamina-bar).
- **⚠️ CSS — do NOT naive-rescope shared classes.** The SDK-backed three share sub-view classes (`.ds-feature-container`, `.ds-features`, `.ds-header-container`, `.ds-bkv-container`, `.ds-hr-container`, `.ds-pr-*`, `.ds-multiline`, `.ds-container`) that are ALSO used by negotiation (`:1700-1707`), statblock (`:1838`), featureblock (`:1905`), and multiple element ids — re-scoping them under `[data-dse-element="<id>"]` would unstyle those call sites (the exact hazard `horizontal-rule/view.ts` documents for `.ds-hr-container`). So: **leave the shared sub-view CSS GLOBAL** for Feature/Featureblock/Statblock (per-element scoping of those is a D3 job); only **Counter** has a clean self-contained block (`:1946-2003`) to re-scope; **Values Row + Characteristics** share one block (`:2004-2050`) — scope under the combined selector list `[data-dse-element="values-row"], [data-dse-element="characteristics"]` or leave global. Functional migration doesn't depend on re-scoping (global CSS applies regardless of the stamped attr).
- **Keep shared builders in place:** `Features/{FeatureView,EffectView,FeaturesView}`, `Common/{HeaderView,BoldKeyWithValueView,horizontalRuleProcessor}` stay under `src/drawSteelAdmonition/` and are IMPORTED by the new element views (the HR precedent — don't move them into an element dir). Don't touch `CodeBlocks.ts` / the SDK.
- **Drop** each processor's manual click-shield + try/catch (pipeline provides both). **Exception:** Values Row's legacy processor does NOT arm the shield → set `noClickShield: true` on its def (byte-identical behavior, like horizontal-rule).
- `tsc`=0; suite green (currently 423). Reuse the negotiation/stamina-bar/horizontal-rule view + test patterns.

## Task 1: Feature (`ds-ft`/`ds-feat`/`ds-feature`) — FIRST (FB + Statblock depend on it)

**Files:** Create `src/elements/feature/{definition,view}.ts`; Modify `main.ts`, `RegisterElements.ts`; Delete `src/drawSteelAdmonition/Features/FeatureProcessor.ts`; Test `test/dom/elements/feature.test.ts`. KEEP the shared `Features/{FeatureView,EffectView,FeaturesView}.ts` (imported).
**Definition:** `id:"feature"`, `name:"Feature"`, aliases, `shape:"static"`, no schema, `autoResolveRefs:false`, `parse: (_data, raw) => FeatureConfig.readYaml(raw)` (SDK — RAW; `src/model/FeatureConfig.ts:13`), no serialize, `createView`.
**View** (`FeatureView`-based, static): `onMount(root, model)` reuses the existing `new FeatureView(...).build(root)` verbatim (mirror `horizontal-rule/view.ts` reusing its builder). Container `ds-feature-ele-container ds-container`. Drop the manual click-shield + try/catch.
**Registration:** register in `main.ts`; remove `RegisterElements.ts:14-17` (+ FeatureProcessor import). **CSS: leave global** (shared `.ds-feature-*`/`.ds-pr-*` used by negotiation/fb/sb — do NOT re-scope; note as D3 follow-up).
**Test focus:** render a documented feature fixture → the `.ds-feature-container` structure + effects/tiers; nested `effect.features` recurse; static (no writes/listeners); registered-exactly-once.

## Task 2: Featureblock (`ds-fb`/`ds-featureblock`)

**Files:** Create `src/elements/featureblock/{definition,view}.ts`; Modify `main.ts`, `RegisterElements.ts`; Delete `featureblock/FeatureblockProcessor.ts`; Test `test/dom/elements/featureblock.test.ts`. Reuse Feature's core + `featureblock/{FeatureblockView,FeatureblockStatsView}.ts` + `Common/{HeaderView,BoldKeyWithValueView,horizontalRuleProcessor}`.
**Definition:** `id:"featureblock"`, aliases, `shape:"static"`, `parse: (_data, raw) => FeatureblockConfig.readYaml(raw)` (SDK — `FeatureblockConfig.ts:10`), no schema/serialize/refs.
**View:** reuse `FeatureblockView.build` verbatim under `onMount`; container `ds-fb-container ds-container`; drop shield/try-catch.
**Registration:** register; remove `RegisterElements.ts:19-21`. **CSS: `.ds-fb-*` block (`:1898-1945`) — scope only the fb-EXCLUSIVE rules if any; leave the nested-shared `.ds-feature-container`/`.ds-hr-container` global** (mostly leave global).
**Test focus:** render a featureblock fixture (`test/fixtures/featureblock/angulotl-malice.yaml` exists) → header + stats + nested features; static; registered-once.

## Task 3: Statblock (`ds-sb`/`ds-statblock`)

**Files:** Create `src/elements/statblock/{definition,view}.ts`; Modify `main.ts`, `RegisterElements.ts`; Delete `statblock/StatblockProcessor.ts`; Test `test/dom/elements/statblock.test.ts`. Reuse Feature's core + `statblock/StatsView.ts` + `Common/HeaderView` + `horizontalRuleProcessor` + the `FeatureConfig` model.
**Definition:** `id:"statblock"`, aliases, `shape:"static"`, `parse: (_data, raw) => StatblockConfig.readYaml(raw)` (SDK — `StatblockConfig.ts:10`; confirmed NO ref resolution), no schema/serialize/refs.
**View:** **fold the legacy `StatblockProcessor.buildUI(container, data, ctx)` (`:39-56`) into `onMount`** (no legacy `StatblockView` class exists) — build header/stats/features, mapping `data.statblock.features → new FeatureConfig(f)` → `FeaturesView`. Container `ds-sb-container ds-container`; drop shield/try-catch.
**Registration:** register; remove `RegisterElements.ts:32-34`. **CSS: `.ds-sb-*` block (`:1794-1897`) — leave the nested-shared `.ds-feature-container`/`.ds-hr-container` (`:1838`) global; scope only sb-exclusive rules if clean.**
**Test focus:** render `test/fixtures/statblock/human-bandit-chief.yaml` → header + characteristics + features; static; registered-once.

## Task 4: Counter (`ds-ct`/`ds-counter`) — PERSISTED (mirror stamina-bar)

**Files:** Create `src/elements/counter/{definition,model,view}.ts`; Modify `main.ts`, `RegisterElements.ts`, `styles-source.css`; Delete `Counter/CounterProcessor.ts`; Test `test/dom/elements/counter.test.ts` + a model byte-compat test. KEEP `Counter/CounterView.ts` logic (port into the framework view).
**Model:** `parse: (data) => Counter.parse(data)` (plain, pre-parsed — `Counter.ts`); `serialize: (m) => stringifyYaml(m).trim()` (matches `CodeBlocks.updateCounter`).
**Definition:** `id:"counter"`, aliases, `shape:"persisted"`, no schema, `autoResolveRefs:false`, parse+serialize, `createView`.
**View** (`CounterView`-based): port the counter DOM (click-to-edit input, +/− buttons); swap the 3 `CodeBlocks.updateCounter(plugin.app, data, ctx)` (CounterView.ts:55,65,160) → mutate `this.model` + `void this.persist()`; move the raw `addEventListener`s (CounterView.ts:32,51,61,149,163-165) to `this.registerDomEvent`/the contentOwner pattern; gate writes on `cx.host.canPersist` (read-only degrade — mirror stamina-bar; the T3.5 badge shows). Container `ds-counter-ele-container` (view builds `.ds-counter-container`).
**Registration:** register; remove `RegisterElements.ts:40-42`. **CSS: re-scope the clean self-contained block (`:1946-2003`) under `[data-dse-element="counter"]`** (no sharing — safe, like negotiation).
**Test focus (real pipeline + FakeVault):** render a counter fixture (`test/fixtures/counter/health.yaml`) → value + buttons; increment → model mutates → exactly-one byte-compat `replaceSource`; edit-input → persist; `canPersist=false` → read-only + `data-dse-readonly`; registered-once; model byte-compat round-trip.

## Task 5: Values Row (`ds-vr`/`ds-value-row`/`ds-values-row`) + Characteristics (`ds-char`/`ds-characteristics`) — trivial static, together

**Files:** Create `src/elements/values-row/{definition,view}.ts` + `src/elements/characteristics/{definition,view}.ts`; Modify `main.ts`, `RegisterElements.ts`, `styles-source.css`; Delete `ValuesRow/ValuesRowProcessor.ts` + `Characteristics/CharacteristicsProcessor.ts`; Test `test/dom/elements/values-row.test.ts` + `characteristics.test.ts`. KEEP `ValuesRow/ValuesRowView.ts` + `Characteristics/CharacteristicsView.ts` (ported/reused).
**Values Row def:** `id:"values-row"`, aliases (3), `shape:"static"`, no schema, `parse: (data) => KeyValuePairs.parse(data)` (plain — `KeyValuePairs.ts`), **`noClickShield: true`** (legacy doesn't arm the shield — byte-identical). View reuses `ValuesRowView.build`; container `ds-values-row-ele-container`.
**Characteristics def:** `id:"characteristics"`, aliases (2), `shape:"static"`, no schema, `parse: (data) => Characteristics.parse(data)` (plain — `Characteristics.ts`). Legacy arms the shield → leave the framework default (no `noClickShield`). View reuses `CharacteristicsView.build`; container `ds-characteristics-ele-container`.
**Registration:** register both; remove `RegisterElements.ts:51-54` (values-row) + `:44-46` (characteristics). After this, `RegisterElements.ts` registers **nothing** (all migrated) — leave it as an empty function + migrated comments (F1 §6 step 10 may delete it later).
**CSS:** both share the `:2004-2050` block → scope under the combined selector `[data-dse-element="values-row"], [data-dse-element="characteristics"]`, or leave global (they only share with each other). Keep the `@media` (`:2037`).
**Test focus:** render each → rows/cells/values; static (no writes); values-row has NO click-shield (assert or note); both registered-once. **After this task: verify `RegisterElements.ts` is empty + all 11 elements resolve in the framework registry.**

## Self-review (done)

- **Coverage:** the 6 elements → Tasks 1-5 (ValuesRow+Characteristics paired). Feature first (hard dep: FB+Statblock reuse its sub-views). Shared builders stay in place (imported). Counter = the only persisted (stamina-bar template).
- **Gotchas captured:** SDK raw-parse (not `data`); shared CSS stays global (don't naive-rescope — the Feature CSS hazard); ValuesRow `noClickShield`; Counter listener-hygiene + persist + read-only.
- **Byte-compat:** Counter reuses its model + `stringifyYaml(m).trim()`; the static five have no persist (byte-compat is moot — render-only).
- **No placeholders:** every task cites exact files/lines from the survey.
- **End state:** `RegisterElements.ts` empty; all 11 on the framework → D-wave element migration complete (then F1 §6 step 10 cleanup/docs + the deferred FOLLOWUPS bundle).
