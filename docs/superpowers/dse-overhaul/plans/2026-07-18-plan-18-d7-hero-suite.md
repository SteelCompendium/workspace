# D7 — Hero-facing Suite Implementation Plan

> **STATUS 2026-07-18: BUILT — SHIP (opus whole-branch verdict).** All 11 tasks landed
> (plugin `5c6e33d..903fe4a`, 15 commits incl. fix rounds). Gates at tip `903fe4a`: tsc ·
> jest **1936** / 142 suites · registered elements **32** · shots **164** · obsidian-shots
> **131** (incl. visually-confirmed hero sheet + hero-in-sidebar ground-truth shots). Final
> review: no MUST-FIX/HIGH; MED-1 (trailing-comment-after-`state:` absorbed on persist) + six
> LOWs routed to workspace FOLLOWUPS #28. Notable in-flight catches: fabricated tier≥2 surge
> auto-spend removed (74d2401); sidebar anchor vs `additionalProperties:false` schemas fixed
> framework-wide (161bd45); camera stale-panel isolation (903fe4a). Rides the same SDK-3.2.0
> landing gate as F2/D6/D8. Records: Linear SC-2 + worktree ledger.
>
> _Original draft stamp:_ written against F1/F2/D5/D6/D8 at tip `5c6e33d` (jest 1725, elements
> 27, shots 139, obsidian-shots 110); D7 composes D5 (rolling), D6 (compendium-by-SCC), D8
> (sidebar host) — no task externally gated.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Program:** DSE Overhaul — plan **18** (Wave 3, D-series; D7). Spec: `../D7-hero-suite-spec.md`.
**Written:** 2026-07-18, against the BUILT framework at worktree `f2`, plugin branch tip **`5c6e33d`** (jest baseline **1725** green).
**Recon of record:** `workspace/.superpowers/sdd/d7-recon.md` — the ground truth for the shipped plugin surface. **Where the D7 spec cites a path/interface that differs from the recon, the recon wins.** The deltas that reshape this plan versus the spec's sketches:

1. **The hero→feature roll bridge ALREADY EXISTS** (recon §1): `feature/view.ts:43 setCharacteristicProvider(provider)` → `featureRollHooks(cx, provider)` (`rollController.ts:35`), gated by `cx.roll` + the `rollingEnabled` pref. The hero sheet's ability cards are the **third consumer** of this bridge — the sheet builds a `CharacteristicProvider` (`framework/roll/binding.ts:7 {get(ch)}`) backed by `model.state`/`defn.characteristics` and hands it to each embedded Feature/Ability view. The spec's `RollService.rollPower(req)` sketch (§3.5) is **superseded** by this existing seam; the sheet does **not** define a new roll interface.
2. **Hero ref resolution belongs at VIEW level via `cx.compendium`, NOT `def.resolveRefs`** (recon §6): `def.resolveRefs` only receives `cx.refs` and `SccRefProvider` throws on web/unresolved paths (`withReference.ts:5-14`), so it is right **only for bare vault paths** (as in `initiative/resolveRefs.ts:42`). The hero's `class`/`ancestry`/`kits[]` SCC refs resolve in `HeroSheetView` via `cx.compendium.getEntity(code)` — mirroring `RefUnwrapView`. Spec §3.6's `resolveRefs: (m, refs) => m.resolveDefinition(refs)` is **dropped**; `autoResolveRefs:false` and **no** `resolveRefs` on the def.
3. **The three render cores the sheet reuses are element-PRIVATE and need EXTRACTION** (recon §3/§4/§7): stamina-bar's `renderBar`/`updateBarDisplay` are fence-private (`stamina-bar/view.ts:73/119`); characteristics' grid is inline in `onMount` (`characteristics/view.ts:20`, not reusable); condition icons are `InitiativeView.buildConditionIcons` **private** (`initiative/view.ts:858`). Task 1 extracts all three into shared, exported presentational cores with **zero behavior change** (existing goldens/tests stay green UNMODIFIED as the proof). This is the concrete form of spec §2.3's "factor render into a `HeroPanel`."
4. **The definition-vs-state YAML split is GREENFIELD** (recon §8): all 8 existing persisted elements interleave authored + play fields in one flat YAML; no nested `state:` block exists anywhere. The `hero:`/`state:` two-section model + the byte-stable **state-scoped splice serialize** (spec §3.4) is net-new machinery this plan fully specifies (Task 7).
5. **D9's `openFormEditor` is reusable for the definition half** (recon §9): `authoring/FormModal.ts:257 openFormEditor(owner, cx, def, source, validation)` (via `openManagedModal`, gated by the `authoringControls` pref) drives a schema-derived form. If the hero def ships a `schema.yaml` (Task 7), the sheet's "Edit definition" affordance reuses it verbatim — no bespoke definition editor.
6. **Sidebar opt-in is UNIVERSAL — no per-element work** (recon §5): `sidebar/registration.ts:95 sendToSidebar(services, filePath, alias, cursorLine?)` works for **any** registered alias (`ensureAnchor` + `view.addPanel`); `SidebarPanel.mount()` drives the real `pipeline.run` and `handleExternalChange` uses the shared `prepareModel()` → `previous.update()`. So the spec §5 addendum is **nearly free**: `ds-hero` rides D8's mode-agnostic host with zero view-code change (Task 10 is verification + a camera shot, not new plumbing).
7. **The conditions modals are typed against `Hero|CreatureInstance`** (recon §7): `AddConditionsModal(app, character: Hero|CreatureInstance, mgr, onAdd)` + `CustomizeConditionModal` are typed against `EncounterData` shapes. The hero play-state is a distinct model — this plan **loosens** (widens) the modal ctor param to a minimal structural `ConditionHolder` superset rather than fabricating encounter-only fields onto the hero (decided + justified below, Task 2/9).

**Open Decisions — adopted (spec §8; autonomy window, Scott reviews asynchronously):**

| OD | Decision adopted |
|---|---|
| **OD-1** | Definition storage = the **in-block `hero:`/`state:` split** in one `ds-hero` block (spec §3.1). Ref-capable per field; one self-contained block. |
| **OD-2** | `serialize` = **state-scoped splice** — re-emit only `state:`, splice the authored `hero:` definition back byte-for-byte (comments + key order intact). Not a full re-serialize (recon delta 4; "do the right thing over minimizing"). |
| **OD-3** | Hero Tokens = a **canonical standalone `ds-tokens` party pool** sheets read-through/spend-into when addressable; per-hero `state.tokens` is wrong (party-wide). True cross-note live sync stays deferred to a future party tracker (D8's `ds-party` already ships — the sheet reads it read-through via `state.tokens_ref`). |
| **OD-4** | Derived stats (max Stamina / recoveries / resource-per-turn) = **derive when compendium-resolved** (Task 8 `deriveHeroStats`), **always allow explicit override** (`max_stamina`/`recoveries_max`/`resource` in `hero:`), works fully offline. |
| **OD-5** | Ability rendering = **compact rows + lazy expand** to a full Feature/Ability card, **plus a cost/type tab filter** (Signature/Heroic/Triggered/All), via the existing kit `tabs` (recon §2). |
| **OD-6** | Roll boundary = **D5 owns the roll + edge/bane resolver**; the sheet only supplies a `CharacteristicProvider` via the existing `setCharacteristicProvider` bridge and reacts (spend surges, apply triggers as `applyPatch` mutations). No edge/bane toggles on the sheet. |
| **OD-7** | `HeroPanel` contract + the three extracted cores live in **`src/framework/kit/`** (alongside the existing kit widgets, barrel `index.ts`, pinned by `test/dom/kit/kit-index.test.ts`). Import boundary holds (kit → utils only, never `src/elements/*`). |
| **OD-8** | Include a **minimal `[respite]` button** in the flagship (Task 9): restore Stamina + Recoveries, clear surges + temp + EoE conditions; Victories→XP conversion prompt optional (event only, no invented rate). |
| **OD-9** | Multi-hero / party-in-one-note & initiative import = **out of D7 core**; a cross-effort follow-up (D8's `ds-party`/initiative already exist). Not in this plan's 27→32 sweep. |

**Goal:** Ship the hero-facing suite on F1/D5/D6/D8: **five new persisted elements** — four standalone proving-grounds (`ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`) + the flagship **`ds-hero`** — plus a backward-compatible **Recoveries/Winded extension** to the existing `ds-stamina`, all built over **one new presentational contract (`HeroPanel`)** into which three existing render cores are extracted **zero-behavior-change**.

**Architecture (the one-line shape):** the hero suite is five thin `persisted` F1 elements over one new `HeroPanel` presentational contract; three existing render cores (StaminaBar, Characteristics grid, condition-icons) are **extracted** into shared kit panels with **byte-identical output** (goldens unmodified); the flagship `ds-hero` owns a **two-section YAML** (durable `hero:` + volatile `state:`) with a **state-scoped byte-stable splice** serialize, resolves `class`/`ancestry`/`kits[]` refs at **VIEW level** via `cx.compendium` (degrade-per-ref), composes the extracted panels + the **existing** `setCharacteristicProvider` roll bridge + a **loosened** conditions modal, and edits its definition half through **D9's `openFormEditor`**; the sidebar is free (universal opt-in).

**Tech Stack:** TypeScript (ES2018, CJS), Obsidian plugin API (`Component`, `parseYaml`/`stringifyYaml`, `Vault.process`), `steel-compendium-sdk` 3.x (`@model/StaminaBar`, `Statblock`, `CompendiumEntity`), the F1 framework (`ElementDefinition`/`ElementView`/`RenderContext`/`BlockHost`/`SessionStore`, `ElementPipeline`, kit widgets `stepper`/`iconButton`/`tabs`/`cardHead`/`collapsible`/`managedModal`, `framework/roll` `RollService`/`CharacteristicProvider`, `authoring/FormModal.openFormEditor`), D6 `CompendiumIndex` (`cx.compendium`), D8 `sendToSidebar`. Jest 30 + ts-jest (`unit` node / `dom` jsdom projects; `test/mocks/obsidian-core.ts`; `test/fakes/fakeObsidian.ts`). **No new runtime dependencies.**

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Worktree only.** All work in `/home/scott/code/steelCompendium/worktrees/f2` — never the shared main checkout. Every command runs from the worktree root as `devbox run -- bash -c 'cd draw-steel-elements && <cmd>'` (node/npm/just are not on the system PATH).
- **TDD, always.** Write the failing test first, watch it fail for the stated reason, implement, watch it pass. Per the exemplar (Plan 17) task shape.
- **Gates per task:** `npm run tsc` clean **and** full `npx jest` green. **Baseline is 1725 passing at `5c6e33d`** — every task only adds (except the three neutral extractions in Task 1, which keep count identical). Whole-branch camera gates before landing: `npm run shots` and `npm run obsidian-shots` (Task 11) at their new counts.
- **No new runtime dependencies.** Obsidian API + the SDK + existing devDeps only. No new `dependencies` in `package.json`.
- **Mobile-safe:** no Node builtins (`fs`/`path`/`crypto` node module) in `src/` or `main.ts` (`isDesktopOnly: false` stays). Node APIs are allowed **in test files only**.
- **`autoResolveRefs` defaults OFF** — set it explicitly `false` on every new def (matches every existing def). `ds-hero` additionally ships **no** `resolveRefs` (view-level resolution, recon delta 2).
- **Persisted elements MUST have `serialize` + a byte-stable round-trip test.** The registry rejects a `persisted` def with no `serialize`. Every new persisted element ships a `test/unit/model/<el>-serialize.test.ts` proving `parse → serialize` is byte-stable on a realistic body (mirroring `initiative-serialize.test.ts`).
- **Existing serialization is FROZEN.** The `ds-stamina` extension (Task 4) adds only **optional, absent-defaulted** fields; `parse` must never materialize them when absent. The existing stamina serialize/golden test **stays green UNMODIFIED** — if a change would touch it, the change is wrong. (Self-review gate.) Likewise the three extractions in Task 1 change **no** rendered DOM: every existing golden + dom snapshot passes **unmodified**.
- **Harness invariants same-commit.** Fixtures↔registry equality (`test/dom/visual-harness/fixtures.test.ts` count) + `aliases.json` deep-equal (`aliases.test.ts`) + the kit barrel pin (`test/dom/kit/kit-index.test.ts`) **must be updated in the SAME commit** as each element registration / kit export. The current asserted fixtures count is **27**; this plan takes it to **32** (Task 2 →28, Task 3 →29, Task 5 →30, Task 6 →31, Task 9 →32; Task 4 adds no element).
- **Aliases are forever, canonical-only** (D6 OD-D6-3 precedent; spec §8 aliases-forever): **one alias per family** — `ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`, `ds-hero`. The spec sketches abbreviated/synonym aliases (`ds-cond`, `ds-hr`, `ds-character`, `ds-sheet`, …); those are **dropped** — canonical-only. Never rename or remove an alias once shipped.
- **Persisted byte-stable round-trips.** `ds-hero` uses the **state-scoped splice** (Task 7); the four small elements use `serialize = stringifyYaml(model).trim()` over the whole model with conditional-emit `parse` (no absent-field materialization).
- **Never-fabricate for any game constant.** Class resource names/per-turn rules, Stamina formulas, recovery/winded math, follower thresholds — every game constant is **cited** (RR §n / AR) at its definition site or flagged `// verify against Draw Steel core rules`. Never invent a rule into logic (e.g. no XP-per-Victory rate).
- **Commits:** conventional-commit style inside `draw-steel-elements`, one commit per task. **No AI/co-author attribution trailers.**
- **Stay in lane:** D7 **consumes** D5's roll seam, D6's `cx.compendium`, and D8's `sendToSidebar`/sidebar host; it does **not** redesign resolution, the roll engine, or the sidebar. It adds five elements, one kit contract + three extractions, and one additive `ds-stamina` extension.
- **Assumed landed (verify in preflight):** F1 framework (`registry`, `pipeline`, `context`, `kit`, `session`, `host/*`), D5 (`framework/roll/*`, `feature/view.ts:setCharacteristicProvider`), D6 (`CompendiumIndex`, `typeAdapters`, `cx.compendium`), D8 (`framework/sidebar/*`, `sendToSidebar`, `DseSidebarView`), D9 (`authoring/FormModal.openFormEditor`), the migrated `stamina-bar`/`characteristics`/`skills`/`counter`/`initiative`/`feature` elements. Version is already **6.0.0** — this plan does not bump it.

---

## File Structure

```
draw-steel-elements/
  main.ts                                          MODIFY  register 5 new element defs; extend authoring/sidebar wiring
  src/
    framework/
      kit/
        HeroPanel.ts                               NEW     Task 1 — presentational sub-view contract (Component-based)
        StaminaBarPanel.ts                         NEW     Task 1 — extracted from stamina-bar render (zero behavior change)
        CharacteristicsGrid.ts                     NEW     Task 1 — extracted from characteristics onMount
        conditionIcons.ts                          NEW     Task 1 — extracted from InitiativeView.buildConditionIcons
        index.ts                                   MODIFY  Task 1 — barrel: export the 4 new kit members
    elements/
      stamina-bar/
        view.ts                                    MODIFY  Task 1 delegate to StaminaBarPanel; Task 4 recoveries/winded
        model.ts                                   MODIFY  Task 4 — optional recoveries/recoveries_max (additive, byte-stable)
      characteristics/view.ts                      MODIFY  Task 1 — delegate to CharacteristicsGrid (DOM identical)
      initiative/view.ts                           MODIFY  Task 1 — delegate to kit conditionIcons (DOM identical)
      conditions/
        model.ts view.ts definition.ts panel.ts example.yaml schema.yaml   NEW  Task 2 — ds-conditions
      resource/
        model.ts view.ts definition.ts panel.ts example.yaml schema.yaml
          + resourceByClass.ts                     NEW     Task 3 — ds-resource (class-aware map)
      surges/
        model.ts view.ts definition.ts panel.ts example.yaml schema.yaml   NEW  Task 5 — ds-surges
      tokens/
        model.ts view.ts definition.ts example.yaml schema.yaml            NEW  Task 6 — ds-tokens (party pool)
      hero/
        model.ts                                   NEW     Task 7 — HeroModel: defn+state, state-scoped splice serialize
        schema.yaml                                NEW     Task 7 — AJV (drives D9 openFormEditor for the defn half)
        deriveHeroStats.ts                         NEW     Task 8 — pure derived-stat math (cited constants)
        resolve.ts                                 NEW     Task 8 — view-level class/ancestry/kit resolution via cx.compendium
        view.ts                                    NEW     Task 9 — HeroSheetView: compose panels + roll bridge + conditions
        definition.ts                              NEW     Task 7/9 — heroElement def
        example.yaml                               NEW     Task 9 — realistic authored hero
  src/views/ConditionSelectModal.ts                MODIFY  Task 2 — widen ctor param to ConditionHolder superset (loosen)
  src/views/CustomizeConditionModal.ts             MODIFY  Task 2 — same widening
  visual-harness/
    entry.ts                                       MODIFY  FIXTURES +5 (conditions/resource/surges/tokens/hero): 27 → 32
    aliases.json                                   MODIFY  +5 canonical aliases (same commit as each registration)
    obsidian-camera.mjs                            MODIFY  Task 10/11 — hero-in-sidebar shot + new element notes
  test/
    dom/kit/kit-index.test.ts                      MODIFY  Task 1 — +4 kit exports (same commit)
    dom/kit/staminaBarPanel.test.ts                NEW     Task 1
    dom/kit/characteristicsGrid.test.ts            NEW     Task 1
    dom/kit/conditionIcons.test.ts                 NEW     Task 1
    unit/model/conditions-serialize.test.ts        NEW     Task 2
    dom/elements/conditions.test.ts                NEW     Task 2
    unit/model/resource-serialize.test.ts          NEW     Task 3
    unit/elements/resourceByClass.test.ts          NEW     Task 3
    dom/elements/resource.test.ts                  NEW     Task 3
    unit/model/stamina-serialize.test.ts           UNCHANGED (freeze proof — Task 4 must not touch it)
    dom/elements/staminaRecoveries.test.ts         NEW     Task 4
    unit/model/surges-serialize.test.ts            NEW     Task 5
    dom/elements/surges.test.ts                    NEW     Task 5
    unit/model/tokens-serialize.test.ts            NEW     Task 6
    dom/elements/tokens.test.ts                    NEW     Task 6
    unit/model/hero-serialize.test.ts              NEW     Task 7 — state-scoped splice byte-stability
    unit/elements/deriveHeroStats.test.ts          NEW     Task 8
    dom/elements/heroResolve.test.ts               NEW     Task 8
    dom/elements/heroSheet.test.ts                 NEW     Task 9
    dom/framework/heroInSidebar.test.ts            NEW     Task 10
    dom/visual-harness/fixtures.test.ts            MODIFY  count 27 → … → 32 (per registration commit)
  .repo-docs/integration.md                        MODIFY  Task 11 — HeroPanel contract; 5 elements; state-split; roll bridge
  CHANGELOG.md                                     MODIFY  Task 11 — extend 6.0.0 (hero suite)
```

**Dependency order:** Task 1 (extraction — the foundation every panel-consuming element needs) → Task 2 (`ds-conditions`) → Task 3 (`ds-resource`) → Task 4 (`ds-stamina` recoveries/winded ext) → Task 5 (`ds-surges`) → Task 6 (`ds-tokens`) → Task 7 (`ds-hero` model + state-split + serialize) → Task 8 (`ds-hero` view-level compendium resolution + derived stats) → Task 9 (`ds-hero` sheet view — composes everything) → Task 10 (sidebar addendum — verification + camera) → Task 11 (registration sweep + docs + gates). Tasks 2–6 are the standalone proving-grounds (spec §6 order); each depends only on Task 1. Tasks 7–9 are the flagship split (≥3 tasks) and depend on Tasks 1–6.

---

### Task 1: `HeroPanel` contract + extract StaminaBar / Characteristics / condition-icons into shared kit cores (spec §2.1/§2.3, recon delta 3)

The foundation. Introduce the `HeroPanel<S>` presentational contract (OD-7 → `framework/kit/`) and extract the three element-private render cores the hero sheet reuses into shared, exported kit members — **with zero behavior change**. The binding proof: **every existing test and golden for `stamina-bar`, `characteristics`, and `initiative` passes UNMODIFIED.** The elements delegate their render into the new cores; the emitted DOM is byte-identical.

**Files:**
- Create: `src/framework/kit/HeroPanel.ts`, `StaminaBarPanel.ts`, `CharacteristicsGrid.ts`, `conditionIcons.ts`
- Modify: `src/framework/kit/index.ts` (barrel), `src/elements/stamina-bar/view.ts`, `src/elements/characteristics/view.ts`, `src/elements/initiative/view.ts`
- Test: `test/dom/kit/staminaBarPanel.test.ts`, `characteristicsGrid.test.ts`, `conditionIcons.test.ts`; modify `test/dom/kit/kit-index.test.ts`

**Interfaces (all in `framework/kit/`, kit→utils imports only — never `src/elements/*`):**
- `HeroPanel.ts`: `interface PanelHost { readonly readOnly: boolean; readonly roll?: RollService }` and `abstract class HeroPanel<S> extends Component` with ctor `(cx: RenderContext, host: PanelHost)`, `abstract mountPanel(root: HTMLElement, slice: S, onChange: (patch: Partial<S>) => void): void`, `abstract updatePanel(slice: S): void`. Mirrors `ElementView`'s mount/update split minus container concerns (spec §2.1 verbatim); listeners use `this.registerDomEvent`, children `this.addChild` — teardown cascades because a panel is a `Component`.
- `StaminaBarPanel.ts`: `function renderStaminaBar(root, s: { current; temp; max }, opts)` + `updateStaminaBar(root, s)` — the exact body lifted from `stamina-bar/view.ts:73/119` (`renderBar`/`updateBarDisplay`), producing identical `.dse-stamina` DOM. (A thin function pair, not a `HeroPanel` subclass — the standalone `StaminaBarView` and the sheet's `StaminaPanel` both call it.)
- `CharacteristicsGrid.ts`: `function renderCharacteristicsGrid(root, chars: {might,agility,reason,intuition,presence}, opts?)` — the `.dse-statgrid` builder lifted from `characteristics/view.ts:20`, identical DOM; `opts.onScoreClick?(ch)` reserved (unused by the standalone element → no DOM change).
- `conditionIcons.ts`: `function buildConditionIcons(container, conditions: Condition[], mgr: ConditionManager): void` — lifted from `InitiativeView.buildConditionIcons` (`initiative/view.ts:858`), identical icon markup; imports `ConditionManager` from `utils/Conditions.ts` (utils, not elements — boundary OK).

- [ ] **Step 1: Write the failing kit tests + extend the barrel pin**

`test/dom/kit/staminaBarPanel.test.ts` (jsdom): `renderStaminaBar` into a div produces the same class/structure the current stamina golden asserts (assert `.dse-stamina` + bar fill width for `current/max`); `updateStaminaBar` mutates in place (no rebuild — root identity stable). `characteristicsGrid.test.ts`: `renderCharacteristicsGrid` yields five `.dse-statgrid` cells with signed scores. `conditionIcons.test.ts`: `buildConditionIcons` renders one icon per condition with the manager's key/color. Extend `test/dom/kit/kit-index.test.ts` to assert the barrel now exports `HeroPanel`, `renderStaminaBar`, `renderCharacteristicsGrid`, `buildConditionIcons`.

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/kit'
```
Expected: FAIL — kit modules do not exist; barrel pin fails.

- [ ] **Step 3: Extract, delegate, add barrel exports**

Move the render bodies verbatim into the kit modules; make `StaminaBarView.renderBar`/`updateBarDisplay` call `renderStaminaBar`/`updateStaminaBar`, `CharacteristicsElementView.onMount` call `renderCharacteristicsGrid`, and `InitiativeView.buildConditionIcons` call the kit `buildConditionIcons`. Delete the now-duplicate private bodies. Export all four from `framework/kit/index.ts`.

> **Neutrality is the whole point.** No selector, class, attribute, or child order may change. If any existing `stamina-bar` / `characteristics` / `initiative` golden or dom test needs an edit, the extraction is wrong — revert and re-extract until they pass untouched.

- [ ] **Step 4: Run full suite (the neutrality proof) + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/kit && npm test && npm run tsc'
git -C draw-steel-elements add src/framework/kit src/elements/stamina-bar/view.ts src/elements/characteristics/view.ts src/elements/initiative/view.ts test/dom/kit
git -C draw-steel-elements commit -m "refactor(kit): extract StaminaBar/Characteristics/condition-icons cores + HeroPanel contract (zero behavior change) (D7 spec §2.1/§2.3)"
```
The load-bearing check: `npm test` green with **every existing golden/dom test unmodified** (1725 baseline unchanged — three extractions add three kit tests + none removed, so the count rises only by the new kit tests).

---

### Task 2: `ds-conditions` — single-actor conditions strip (spec §4.4)

The simplest new persisted element: proves condition-engine reuse standalone. Reuses `ConditionManager` + the extracted kit `buildConditionIcons` (Task 1) and the `ConditionSelectModal`/`CustomizeConditionModal`. **Recon delta 7 decision — LOOSEN the modals:** widen their ctor `character` param from `Hero|CreatureInstance` to a structural `ConditionHolder = { conditions: Condition[] }` superset. **Justification:** the hero/conditions play-state is a distinct model; conforming it to a full `CreatureInstance` would require fabricating encounter-only fields (initiative order, statblock ref, id). Widening a parameter type is **source-compatible** — every existing `Hero|CreatureInstance` caller (the initiative tracker) still typechecks and its tests stay green — while letting `ds-conditions`/`ds-hero` pass a minimal holder. The modal only reads/writes `character.conditions`, so the wider type is honest.

**Files:**
- Create: `src/elements/conditions/{model,view,definition,panel}.ts`, `example.yaml`, `schema.yaml`
- Modify: `src/views/ConditionSelectModal.ts`, `src/views/CustomizeConditionModal.ts` (widen ctor param)
- Test: `test/unit/model/conditions-serialize.test.ts`, `test/dom/elements/conditions.test.ts`

**Schema (verbatim from spec §4.4):**

```yaml
~~~ds-conditions
conditions:
  - { key: bleeding, effect: "save ends" }
  - { key: slowed,   effect: "EoT" }
  - Restrained            # bare string = no duration
~~~
```

**Interfaces:**
- `model.ts`: `interface ConditionsModel { conditions: Condition[] }` (`Condition` = `{key, color?, effect?}` reused from `EncounterData.ts`); `parse(d)` normalizes bare strings → `{key}`; `serialize = stringifyYaml(m.dto()).trim()`.
- `panel.ts`: `class ConditionsPanel extends HeroPanel<Condition[]>` — chips (icon via kit `buildConditionIcons` + name + duration badge save-ends/EoT/EoE + remove ✕); "+ add condition" opens `AddConditionsModal` with the loosened `ConditionHolder`. Save-ends chips offer a d10 save via `cx.roll` (`RollService.resolve`) when present, else a simple confirm prompt. `updatePanel` re-renders the chip strip in place.
- `view.ts`: `class ConditionsPanelContainer extends ElementView<ConditionsModel>` — thin persist container wrapping `ConditionsPanel`; read-only when `!canPersist`. `definition.ts`: `id:"conditions"`, `aliases:["ds-conditions"]`, `shape:"persisted"`, `autoResolveRefs:false`, `authoring:{example}`.

- [ ] **Step 1: Failing serialize + dom tests.** `conditions-serialize.test.ts`: byte-stable round-trip on `example.yaml` (bare `Restrained` string round-trips as authored — do not rewrite it to a map unless the user edits it). `conditions.test.ts` (jsdom): render → three chips with correct duration badges; "+ add" opens the modal (assert it constructs with a `{conditions}` holder, not a fabricated CreatureInstance); remove ✕ drops a chip + persists; a save-ends chip with a seeded deterministic `DiceSource` resolves the d10 (never `NATIVE_DICE` in tests).
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/conditions-serialize.test.ts test/dom/elements/conditions.test.ts'`
- [ ] **Step 3: Widen the modal ctors, implement, register + harness (SAME commit) — 27 → 28.** Verify the initiative tracker's modal callers + their tests stay green (widening is source-compatible). `main.ts` register; `entry.ts` FIXTURES `conditions`; `aliases.json` `"conditions":"ds-conditions"`; `fixtures.test.ts` 27 → 28.
- [ ] **Step 4: Run + commit.**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/conditions-serialize.test.ts test/dom/elements/conditions.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/conditions src/views/ConditionSelectModal.ts src/views/CustomizeConditionModal.ts main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/conditions-serialize.test.ts test/dom/elements/conditions.test.ts
git -C draw-steel-elements commit -m "feat: ds-conditions single-actor strip (reuse condition engine; loosen modals to ConditionHolder) (spec §4.4)"
```

---

### Task 3: `ds-resource` — heroic resource tracker, class-aware (spec §4.1)

A `persisted` element: a signed stepper (Talent Clarity goes negative) with a per-class label + gain-rule hint. Class-aware via a static `RESOURCE_BY_CLASS` map (spec §1.2, **cited**), not the compendium — D6 only enriches the gain rule when present. Distinct from `ds-counter`: signed, class-defaulted label, hint line.

**Files:** create `src/elements/resource/{model,view,definition,panel}.ts`, `resourceByClass.ts`, `example.yaml`, `schema.yaml`; test `test/unit/model/resource-serialize.test.ts`, `test/unit/elements/resourceByClass.test.ts`, `test/dom/elements/resource.test.ts`.

**Schema (verbatim from spec §4.1):**
```yaml
~~~ds-resource
class: fury         # class-aware: fills type=Ferocity, min=0, gain-hint
current: 4
~~~
```

**Interfaces:**
- `resourceByClass.ts`: `const RESOURCE_BY_CLASS: Record<string, { type: string; min: number; gainHint: string }>` — the 9-class table from spec §1.2 verbatim, each row commented with its RR §4 / AR citation. `resolveResource(class?, overrides?)` merges class defaults with explicit `type`/`min`.
- `model.ts`: `interface ResourceModel { class?: string; type?: string; current: number; min: number; max?: number }`; `parse(d)` applies class defaults for absent `type`/`min` (**at render**, not materialized onto the serialized object — keep authored YAML honest); `serialize = stringifyYaml(m.dto()).trim()` emits only authored keys.
- `panel.ts`: `class ResourcePanel extends HeroPanel<{type,current,min}>` — a signed kit `stepper` (floor = `min`, no ceiling) + a hint line (class gain rule). `view.ts`: `ResourcePanelContainer extends ElementView<ResourceModel>`. `definition.ts`: `id:"heroic-resource"`, `aliases:["ds-resource"]`.

- [ ] **Step 1: Failing tests.** `resourceByClass.test.ts`: `resolveResource("fury")` → `{type:"Ferocity", min:0, …}`; `resolveResource("talent")` → `min` below 0 (Clarity strained floor, cite AR); unknown class → generic label, `min:0`. `resource-serialize.test.ts`: byte-stable round-trip (`class: fury` + `current: 4` round-trips **without** materializing `type`/`min`). `resource.test.ts` (jsdom): `class: fury` renders "Ferocity" + gain hint; stepper decrements below 0 for a Talent model; clamps at `min` for Fury.
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/resource-serialize.test.ts test/unit/elements/resourceByClass.test.ts test/dom/elements/resource.test.ts'`
- [ ] **Step 3: Implement, register + harness (SAME commit) — 28 → 29.** `main.ts`; `entry.ts` `resource`; `aliases.json` `"resource":"ds-resource"`; `fixtures.test.ts` 28 → 29.
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/resource-serialize.test.ts test/unit/elements/resourceByClass.test.ts test/dom/elements/resource.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/resource main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/resource-serialize.test.ts test/unit/elements/resourceByClass.test.ts test/dom/elements/resource.test.ts
git -C draw-steel-elements commit -m "feat: ds-resource class-aware heroic-resource tracker (signed, gain-rule hint) (spec §4.1)"
```

---

### Task 4: `ds-stamina` Recoveries / Winded extension — additive, byte-stable (spec §4.2)

> **HARD INVARIANT:** additive optional fields only; **`test/unit/model/stamina-serialize.test.ts` (and the stamina golden) must stay green UNMODIFIED**; new fields serialize **only when present**. Recon delta 3: `stamina-bar/model.ts` wraps the SDK `@model/StaminaBar`; the plugin-side wrapper carries the new fields (if the SDK model can't hold them, store alongside on the wrapper and emit conditionally).

Not a new element — extend the migrated `ds-stamina` model + `StaminaBarPanel` (Task 1). M1 §B: "Fold recoveries into the Stamina element."

**Files:** modify `src/elements/stamina-bar/model.ts`, `src/elements/stamina-bar/view.ts`; test `test/dom/elements/staminaRecoveries.test.ts` (new). `stamina-serialize.test.ts` stays UNCHANGED.

**Schema additions (verbatim from spec §4.2):**
```yaml
~~~ds-stamina
max_stamina: 48
current_stamina: 31
temp_stamina: 0
recoveries: 6           # NEW — remaining
recoveries_max: 10      # NEW — pool size (else omit for display-less)
~~~
```

**Interfaces:**
- `model.ts`: add optional `recoveries?: number`, `recoveries_max?: number`; **derive** (never store) winded = `⌊max/2⌋`, dying `≤0`, death `−winded`, recovery value `⌊max/3⌋` (**cite RR §8**). `parse` leaves the new keys untouched when absent (no materialization).
- `view.ts`: `StaminaBarView` gains, **only when `recoveries_max` present**, a recoveries pip row, a **Catch Breath** kit `iconButton` (−1 recovery, +recovery-value stamina; disabled when dying / none left; cite RR §8), and a winded/dying badge. Persist via the existing stamina write path. Backward compatible: old blocks with no `recoveries*` render **exactly** as today.

- [ ] **Step 1: Failing dom test.** `staminaRecoveries.test.ts` (jsdom): a block with `recoveries: 6, recoveries_max: 10` renders 10 pips (6 filled) + a Catch Breath button; clicking heals `⌊48/3⌋ = 16` and decrements recoveries + persists; a block **without** `recoveries*` renders no pip row / no button (the legacy shape). Winded badge shows when `current ≤ ⌊max/2⌋`.
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/staminaRecoveries.test.ts'`
- [ ] **Step 3: Implement — then prove the freeze.** Add the additive fields + panel affordances. **Then run `stamina-serialize.test.ts` and the stamina golden and confirm they pass UNMODIFIED** (the load-bearing additive-contract check).
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/stamina-serialize.test.ts test/dom/elements/staminaRecoveries.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/stamina-bar/model.ts src/elements/stamina-bar/view.ts test/dom/elements/staminaRecoveries.test.ts
git -C draw-steel-elements commit -m "feat: ds-stamina recoveries/winded/Catch-Breath (additive, byte-stable) (spec §4.2)"
```

---

### Task 5: `ds-surges` — surge tracker (spec §4.3)

Trivial `persisted` stepper — proves the surge slice the sheet + D5 share. "Surges · each = +N damage" (N = highest characteristic when provided). Cleared to 0 at end of encounter (surface, not auto).

**Files:** create `src/elements/surges/{model,view,definition,panel}.ts`, `example.yaml`, `schema.yaml`; test `test/unit/model/surges-serialize.test.ts`, `test/dom/elements/surges.test.ts`.

**Schema:** `~~~ds-surges` body `{ surges: <int>, highest_characteristic?: <int> }`.

**Interfaces:** `model.ts`: `interface SurgeModel { surges: number; highest_characteristic?: number }`; `serialize = stringifyYaml(m.dto()).trim()`. `panel.ts`: `class SurgePanel extends HeroPanel<{surges}>` — labeled kit `stepper` (floor 0) + "each = +N damage" when `highest_characteristic` present (**cite AR §Surges**). `definition.ts`: `id:"surges"`, `aliases:["ds-surges"]`.

- [ ] **Step 1: Failing serialize + dom tests** (byte-stable round-trip; render → label reflects N; stepper floors at 0).
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/surges-serialize.test.ts test/dom/elements/surges.test.ts'`
- [ ] **Step 3: Implement, register + harness (SAME commit) — 29 → 30.** `entry.ts` `surges`; `aliases.json` `"surges":"ds-surges"`; `fixtures.test.ts` 29 → 30.
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/surges-serialize.test.ts test/dom/elements/surges.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/surges main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/surges-serialize.test.ts test/dom/elements/surges.test.ts
git -C draw-steel-elements commit -m "feat: ds-surges tracker (labeled stepper; highest-char damage hint) (spec §4.3)"
```

---

### Task 6: `ds-tokens` — Hero Tokens party pool (spec §4.5, OD-3)

A `persisted` element holding the **canonical** party-wide token pool (Hero Tokens are party-wide, RR §7 — **not** per-hero). The hero sheet (Task 9) shows a **read-through** of this pool via `state.tokens_ref` and spends into it when the referenced block is addressable; true cross-note live sync stays deferred (OD-3). This task ships only the canonical block; the cross-block read-through wiring lives in Task 9.

**Files:** create `src/elements/tokens/{model,view,definition}.ts`, `example.yaml`, `schema.yaml`; test `test/unit/model/tokens-serialize.test.ts`, `test/dom/elements/tokens.test.ts`.

**Schema (verbatim from spec §4.5):**
```yaml
~~~ds-tokens
label: "Session 12 party pool"
tokens: 3
~~~
```

**Interfaces:** `model.ts`: `interface TokenPoolModel { tokens: number; label?: string }`; `serialize = stringifyYaml(m.dto()).trim()`. `view.ts`: `TokenPoolContainer extends ElementView<TokenPoolModel>` — labeled kit `stepper` (floor 0) with a ♦ token glyph; read-only when `!canPersist`. `definition.ts`: `id:"hero-tokens"`, `aliases:["ds-tokens"]`.

- [ ] **Step 1: Failing serialize + dom tests** (byte-stable; render → label + count; stepper mutates + persists).
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/tokens-serialize.test.ts test/dom/elements/tokens.test.ts'`
- [ ] **Step 3: Implement, register + harness (SAME commit) — 30 → 31.** `entry.ts` `tokens`; `aliases.json` `"tokens":"ds-tokens"`; `fixtures.test.ts` 30 → 31.
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/tokens-serialize.test.ts test/dom/elements/tokens.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/tokens main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/tokens-serialize.test.ts test/dom/elements/tokens.test.ts
git -C draw-steel-elements commit -m "feat: ds-tokens canonical party pool (party-wide Hero Tokens) (spec §4.5, OD-3)"
```

---

### Task 7: `ds-hero` (a) — model, `hero:`/`state:` split, byte-stable state-scoped serialize + schema (spec §3.1/§3.4, OD-1/OD-2)

The flagship, part 1 of 3: the **greenfield** two-section model and the state-scoped splice serialize (recon delta 4 — no `state:` block exists anywhere today). This task ships **no view** — just the model, the AJV schema (which also drives Task 9's D9 form-editor reuse), and the definition wired for parse/serialize. The proof is a byte-stability test: an authored `hero:` definition with comments + key order round-trips **byte-identically** across a `state:` mutation.

**Files:** create `src/elements/hero/model.ts`, `schema.yaml`, `definition.ts`, `example.yaml`; test `test/unit/model/hero-serialize.test.ts`. (No `view.ts` yet — `createView` throws a "not yet implemented" stub replaced in Task 9; the element is **not registered** until Task 9.)

**YAML shape (verbatim from spec §3.1 — the block has two top-level maps):**
```yaml
~~~ds-hero
# ── definition (authored / resolved; not rewritten by normal play — §3.4) ──
name: Torin Stonefist
level: 3
ancestry: scc.v1:mcdm.heroes.v1/ancestry/dwarf     # or inline; D6 resolves
class:   scc.v1:mcdm.heroes.v1/class/fury           # → resource, stamina, recoveries, potency
subclass: berserker
kits:    [scc.v1:mcdm.heroes.v1/kit/mountain]       # 0–2 (Tactician: 2)
characteristics: { might: 2, agility: 2, reason: -1, intuition: 0, presence: 1 }
skills:  [Endurance, Intimidate, Nature]
abilities:                                          # SCC codes or inline ability YAML
  - scc.v1:mcdm.heroes.v1/.../brute-strike           # signature
  - scc.v1:mcdm.heroes.v1/.../into-the-fray          # heroic (costs ferocity)
# optional overrides when NOT compendium-resolving:
max_stamina: 48            # else derived from class+kit+level
recoveries_max: 10         # else class-derived
resource: { type: Ferocity, min: 0 }   # else class-derived
# ── state (the persisted play surface — small; rewritten on interaction) ──
state:
  stamina: { current: 31, temp: 0 }
  resource: 4
  surges: 1
  recoveries: 6
  victories: 2
  conditions:
    - { key: bleeding, effect: "save ends" }
  tokens_ref: "@Party/Session"   # optional: canonical party pool block (§4.5, OD-3)
~~~
```

**Interfaces & the serialize algorithm (verbatim from spec §3.4):**
- `model.ts`: `interface HeroDefn { name: string; level: number; ancestry?; class?; subclass?; kits?: string[]; characteristics: CharBlock; skills?: string[]; abilities?: (string|object)[]; max_stamina?; recoveries_max?; resource?: { type: string; min: number }; /* + optional display-only titles/perks/treasures/complication */ }`; `interface HeroState { stamina: {current:number; temp:number}; resource?: number; surges?: number; recoveries?: number; victories?: number; conditions?: Condition[]; tokens_ref?: string }`; `class HeroModel { defn: HeroDefn; state: HeroState; private defnRaw: string }`.
- `parse(data, raw)`: split `raw` at the top-level `state:` key — capture `defnRaw` = the block text with the `state:` sub-block **stripped, kept byte-for-byte** (comments + key order intact); parse the `hero:` fields from the part before `state:` and the `state:` map from after. Seed `state` defaults **in memory only** (current=max, recoveries=max, resource=min, surges/victories=0, conditions=[]) — not written until first interaction (mount stays side-effect-free, spec §3.4).
- `serialize(model)` = `defnRaw + "\nstate:\n" + indent(stringifyYaml(model.state))`. Re-emit **only** `state:`; splice the untouched authored definition back verbatim. This is stronger than F1's baseline byte-compat — the ~8-line `state:` map is the only churn.
- `schema.yaml` (AJV, spec §3.1): `hero` object with `name` required, `level` int 1–10, `characteristics` keys constrained to the five, `abilities` array of `string|object`; `state` object with typed optional sub-fields (a sheet with no `state:` is valid). Refs (`scc*`/`@path`/`[[wikilink]]`) validate as strings (resolution is Task 8, not schema).
- `definition.ts`: `id:"hero"`, `aliases:["ds-hero"]`, `shape:"persisted"`, `schema: heroSchemaYaml`, `autoResolveRefs:false`, **no `resolveRefs`** (recon delta 2), `parse`, `serialize`, `createView:(cx)=>{ throw … }` (stub until Task 9).

- [ ] **Step 1: Failing byte-stability test.** `hero-serialize.test.ts`:
  - **Round-trip:** parse `example.yaml` → serialize → the `hero:` region (with its `#` comments + `{ … }` inline maps + array order) is **byte-identical** to the input; only `state:` is re-emitted.
  - **State mutation:** apply a stamina change to `model.state.stamina.current` → serialize → the authored definition region is **still byte-identical**; only the `state.stamina.current` line changed.
  - **No-`state:` author:** parse a body with `hero:` only (no `state:`) → in-memory defaults seeded → `serialize` appends a fresh `state:` block; the authored region is untouched.
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/hero-serialize.test.ts'`
- [ ] **Step 3: Implement `model.ts` + `schema.yaml` + `definition.ts` (stub view).**
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/hero-serialize.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/hero/model.ts src/elements/hero/schema.yaml src/elements/hero/definition.ts src/elements/hero/example.yaml test/unit/model/hero-serialize.test.ts
git -C draw-steel-elements commit -m "feat: ds-hero model — hero:/state: split + byte-stable state-scoped serialize + schema (spec §3.1/§3.4, OD-1/2)"
```

---

### Task 8: `ds-hero` (b) — view-level compendium resolution + derived stats (spec §3.5/§1.1, OD-4, recon delta 2)

Part 2 of 3: resolve the definition refs the sheet needs (`class`/`ancestry`/`kits[]`) **at VIEW level via `cx.compendium`** (mirroring `RefUnwrapView`), feed `deriveHeroStats(defn)`, and **degrade visibly per ref** when a ref is unresolvable or the compendium is absent. Still no full sheet — this task ships the pure derived-stat math + the resolution helper + a dom test that mounts a thin harness view exercising resolution/degrade. (Task 9 composes the real sheet on top.)

**Files:** create `src/elements/hero/deriveHeroStats.ts`, `resolve.ts`; test `test/unit/elements/deriveHeroStats.test.ts`, `test/dom/elements/heroResolve.test.ts`. (Copy real `class`/`kit`/`ancestry` md-dse fixtures read-only from the workspace checkout — never hand-write; source `/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/md-dse/`.)

**Interfaces:**
- `resolve.ts`: `async function resolveHeroDefinition(defn: HeroDefn, compendium?: CompendiumIndex): Promise<{ class?: ResolvedEntity; ancestry?: ResolvedEntity; kits: ResolvedEntity[]; issues: RefIssue[] }>` — for each `scc*` ref call `cx.compendium.getEntity(code)` (parallel `Promise.all`); an unresolvable code / absent compendium yields a `RefIssue { field, code, reason }` and that slot stays `undefined` (the sheet renders inline overrides + a per-ref "unresolved — sync compendium" notice, spec §3.5 degrade). `abilities[]` SCC codes are **left unresolved** here (rendered lazily per-row in Task 9).
- `deriveHeroStats.ts`: `function deriveHeroStats(defn, resolved): DerivedStats` — pure, tested, **every constant cited**: Max Stamina = class base + per-level growth + kit bonus (RR §4/§5), recovery value `⌊max/3⌋`, winded `⌊max/2⌋`, death `−winded` (RR §8), recoveries max = class value (AR), resource-per-turn = class rule (AR, **display-only, not auto-rolled**). When a needed ref is unresolved, prefer the explicit override (`max_stamina`/`recoveries_max`/`resource`) and mark the stat `source:"authored"` vs `"derived"` (OD-4).

- [ ] **Step 1: Failing tests.** `deriveHeroStats.test.ts`: Fury L3 + Mountain kit → max stamina / recovery value / winded / death match the cited formulas; explicit `max_stamina` override wins and is flagged `authored`; missing class + no override → `null` derived + an issue. `heroResolve.test.ts` (jsdom, seeded `CompendiumIndex` with the copied fixtures): a `class`/`kits` ref resolves and feeds derived stats; an unresolvable `ancestry` code surfaces a per-ref degrade notice; **no compendium** → the model falls back to inline overrides and shows notices, still fully functional.
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/elements/deriveHeroStats.test.ts test/dom/elements/heroResolve.test.ts'`
- [ ] **Step 3: Implement `deriveHeroStats.ts` + `resolve.ts`.**
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/elements/deriveHeroStats.test.ts test/dom/elements/heroResolve.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/hero/deriveHeroStats.ts src/elements/hero/resolve.ts test/unit/elements/deriveHeroStats.test.ts test/dom/elements/heroResolve.test.ts test/fixtures/md-dse
git -C draw-steel-elements commit -m "feat: ds-hero view-level compendium resolution + derived stats (degrade-per-ref) (spec §3.5/§1.1, OD-4)"
```

---

### Task 9: `ds-hero` (c) — the sheet view: compose panels + roll bridge + conditions + respite + definition editor (spec §3.2/§3.3, OD-5/6/8, recon delta 1/5/7)

Part 3 of 3, the composition. `HeroSheetView extends ElementView<HeroModel>` builds the scaffold (spec §3.2 layout) and, per region, `addChild`s a `HeroPanel` fed a read-only slice: **Characteristics** (kit `CharacteristicsGrid`, Task 1), **Stamina + Recoveries + Winded** (kit `StaminaBarPanel` + the Catch-Breath affordance, Task 1/4), **Resource** (`ResourcePanel`, Task 3), **Surges** (`SurgePanel`, Task 5), **Conditions** (`ConditionsPanel`, Task 2 — the loosened modal), **Skills** (inline chip list — **decision:** skills are display-oriented and not in the Task 1 extraction scope, so the sheet renders them directly, no `SkillsPanel` extraction), and **Abilities** (compact rows + lazy expand + a cost/type `tabs` filter, OD-5). `applyPatch(region, patch)` merges into `model.state`, re-derives dependents (stamina→winded/dying → refresh conditions/stamina panels), `updatePanel`s each affected panel, then debounced `persist()`. This is where the **existing `setCharacteristicProvider` roll bridge** (recon delta 1) and the **D9 `openFormEditor`** definition editor (recon delta 5) wire in. Register the element here (its `createView` stub from Task 7 is replaced) — **31 → 32**.

**Files:** create `src/elements/hero/view.ts`; modify `src/elements/hero/definition.ts` (real `createView`), `main.ts` (register); test `test/dom/elements/heroSheet.test.ts`; harness `entry.ts`/`aliases.json`/`fixtures.test.ts` (31 → 32).

**Interfaces & wiring:**
- **Roll bridge (recon delta 1, OD-6):** ability cards render lazily (row → expand → the migrated Feature/Ability view via `renderMarkdown` parented to the sheet). Before rendering each ability card the sheet calls its `setCharacteristicProvider(provider)` where `provider: CharacteristicProvider = { get(ch) => defn.characteristics[ch] }` (`framework/roll/binding.ts`). The card's existing `featureRollHooks(cx, provider)` then drives the roll (tiers/edges/banes/crit are **D5's**, spec §3.5). On a result the sheet reacts as `applyPatch` mutations: decrement `state.surges` by surges spent, surface the tier, apply player-confirmed resource/victory triggers. **If `cx.roll` absent / `rollingEnabled` off:** ability rows render static (full card, no roll button) — the sheet is still fully usable.
- **Conditions play-state shape (recon delta 7):** the sheet passes `model.state` (a `ConditionHolder` — `{conditions}`) to `ConditionsPanel`/the loosened modal (Task 2). **Decision restated + justified:** loosen (already done in Task 2) rather than conform the hero to a `CreatureInstance`; the sheet never fabricates encounter-only fields.
- **Respite (OD-8):** a header `[respite]` kit `iconButton` → restore Stamina + Recoveries to derived/authored max, clear surges + temp + EoE conditions; optional Victories→XP prompt is an **event only** (no invented rate — never-fabricate). All via `applyPatch`.
- **Definition editor (recon delta 5):** a header `[⚙]`/"Edit definition" affordance calls `openFormEditor(this, cx, heroElement, defnSource, cx.validation)` (gated by the `authoringControls` pref) — the schema (Task 7) drives the D9 form for the **definition half**; play-state is edited via the panels. This keeps the byte-stable splice honest (the form rewrites `hero:`, panels rewrite `state:`).
- `onUpdate(model)`: diff slices, `updatePanel` each changed panel; teardown+remount only if the **definition** changed (re-runs Task 8 resolution). Read-only mode (`!cx.host.canPersist`): panels mount with `PanelHost.readOnly = true` (disabled steppers/buttons + tooltip); view-only rolls still work.
- **Tokens read-through (OD-3):** when `state.tokens_ref` addresses a `ds-tokens` block, render a read-through of its pool and spend into it via the same `replaceSource` path when addressable; read-only otherwise.

- [ ] **Step 1: Failing dom test.** `heroSheet.test.ts` (jsdom, `_refHarness` seeded with class/kit fixtures + a live `CompendiumIndex`, deterministic `DiceSource`): render `example.yaml` →
  - all seven regions mount (characteristics grid, stamina+recoveries+winded, resource, surges, conditions, skills chips, ability rows);
  - a stamina change re-derives the winded badge **and** refreshes the conditions panel, then persists (flush timers → block's `state.stamina` updated, `hero:` region byte-identical);
  - an ability row expands to a full card; with `cx.roll` seeded, the roll uses the hero's characteristic via the provider and a tier-2 result decrements `state.surges`;
  - `[respite]` restores stamina/recoveries, clears surges/temp/EoE conditions;
  - "Edit definition" invokes `openFormEditor` (assert it is called with `heroElement` + the definition source; gated by `authoringControls`);
  - read-only mount (`canPersist=false`) disables steppers/buttons.
- [ ] **Step 2: Run to verify failure.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/heroSheet.test.ts'`
- [ ] **Step 3: Implement `view.ts` + real `createView`; register + harness (SAME commit) — 31 → 32.** `main.ts` register `heroElement`; `entry.ts` FIXTURES `hero`; `aliases.json` `"hero":"ds-hero"`; `fixtures.test.ts` 31 → 32.
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/heroSheet.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/hero/view.ts src/elements/hero/definition.ts main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/dom/elements/heroSheet.test.ts
git -C draw-steel-elements commit -m "feat: ds-hero sheet view — compose panels + setCharacteristicProvider roll bridge + conditions + respite + D9 defn editor (spec §3, OD-5/6/8)"
```

---

### Task 10: Sidebar addendum — `ds-hero` in the D8 sidebar (spec §5)

> **Nearly free (recon §5):** sidebar opt-in is universal — `sendToSidebar(services, filePath, "ds-hero")` works for any registered alias, `SidebarPanel.mount()` drives the real pipeline, `handleExternalChange` uses `prepareModel()` → `previous.update()`. **No new production plumbing** — this task is the acceptance proof that the *unmodified* `HeroSheetView` mounts under `SidebarBlockHost` + a camera shot.

**Files:** modify (investigate) `visual-harness/obsidian-camera.mjs`; test `test/dom/framework/heroInSidebar.test.ts`. Any need to edit `src/elements/hero/view.ts` to make this pass means the sheet is **not** mode-agnostic — fix the sheet's host assumptions, not the sidebar.

- [ ] **Step 1: Failing e2e test.** `heroInSidebar.test.ts` (jsdom, Task-1-era sidebar mocks + `fakeObsidian`): seed a note with an anchored `ds-hero` block; `sendToSidebar(services, "Hero.md", "ds-hero")` → the sidebar leaf mounts a `.dse-sidebar__panel` containing `[data-dse-element="hero"]` (the **same** `HeroSheetView`); a stamina stepper change flushes to `Hero.md` (state updated, `hero:` region byte-identical); survives active-note navigation (host addresses the file by path); read-only degrade when the anchored block is deleted; `onUpdate` live-refresh on an external edit (in-place, root identity stable).
- [ ] **Step 2: Run to verify failure, then confirm it passes with ZERO `HeroSheetView` changes.** `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework/heroInSidebar.test.ts'`
- [ ] **Step 3: obsidian-camera hero-in-sidebar shot (investigate).** Following D8 Task 3's pattern: invoke "Open Draw Steel sidebar" + `addPanel` the demo `ds-hero` note, wait for `.dse-sidebar__panel [data-dse-element="hero"]`, clip-screenshot the leaf. **If feasible:** add one shot `hero--obsidian-sidebar-steel-dark.png` (record the +1 in Task 11). **If not** (right-split geometry unstable headless): document why in a code comment + the ledger and rely on the jsdom e2e (the binding gate). Do not block on the camera.
- [ ] **Step 4: Run + commit.**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework/heroInSidebar.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add test/dom/framework/heroInSidebar.test.ts visual-harness/obsidian-camera.mjs
git -C draw-steel-elements commit -m "feat: ds-hero in sidebar e2e (mount/persist/navigate/degrade/onUpdate) + camera investigation (spec §5)"
```

---

### Task 11: Registration sweep, harness at 32, docs-as-done, full gates

Finalize `main.ts` (five element registrations + the authoring/sidebar wiring), confirm the harness invariants at **32**, refresh docs, and run both camera batteries at their new counts.

**Files:** modify `main.ts`, `visual-harness/{entry.ts,aliases.json,obsidian-camera.mjs}`, `.repo-docs/integration.md`, `CHANGELOG.md`, workspace `CHANGELOG.md`, workspace `CLAUDE.md` (element counts); whole-suite + shots + obsidian-shots.

- [ ] **Step 1: `main.ts` definitive wiring** — confirm `conditions`/`resource`/`surges`/`tokens`/`hero` are registered in `registerFrameworkElementDefinitions`; the `ds-hero` "Edit definition" reuses the existing `openFormEditor` path (no duplicate authoring wiring); the sidebar services bundle is threaded once. Verify the F1 import-boundary lint stays green (`framework/kit` imports utils only; no `src/elements/*` from kit).
- [ ] **Step 2: Harness invariants at 32** — `entry.ts` FIXTURES + `aliases.json` carry all five new elements with realistic `example.yaml` bodies; `fixtures.test.ts` asserts **32**; `aliases.test.ts` deep-equals; `kit-index.test.ts` pins the four new kit exports. (Added per-task; Step 2 is the reconciliation check.)
- [ ] **Step 3: Docs-as-done** —
  - `.repo-docs/integration.md`: document the **`HeroPanel` contract + the three extracted kit cores** (container/presentational split), the **five new elements**, the **`hero:`/`state:` split + state-scoped splice serialize**, the **`setCharacteristicProvider` roll bridge** consumption, the **view-level compendium resolution** (why not `def.resolveRefs`), the **loosened conditions modals**, and the adopted OD-1…OD-9.
  - `CHANGELOG.md`: extend the existing **6.0.0** section (Hero suite: `ds-hero` sheet + `ds-conditions`/`ds-resource`/`ds-surges`/`ds-tokens` + stamina recoveries/winded). Do **not** add a new version.
  - Workspace `CHANGELOG.md`: one `## Unreleased` bullet ("Hero suite: flagship hero sheet + conditions/resource/surges/tokens trackers + stamina recoveries").
  - Workspace `CLAUDE.md`: bump the element-count reference to **32** (verify current wording; keep it a router-level summary).
- [ ] **Step 4: Full gates**
```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npm test'
devbox run -- bash -c 'cd draw-steel-elements && npm run shots'          # +5 gallery fixtures × variants — record the new N
devbox run -- bash -c 'cd draw-steel-elements && npm run obsidian-shots' # +5 element notes (+1 hero-sidebar shot if Task 10 feasible) — record the new N
```
`npx jest` must be green (1725 baseline + all new tests). `fixtures.test.ts` asserts **32**; `aliases.test.ts` + `kit-index.test.ts` pass. Record the new `shots`/`obsidian-shots` counts (from 139 / 110) in the commit message.
- [ ] **Step 5: Commit**
```bash
git -C draw-steel-elements add main.ts visual-harness .repo-docs CHANGELOG.md test
git -C draw-steel-elements commit -m "feat: wire hero suite into main.ts; D7 docs + camera gates (32 elements)"
git add CHANGELOG.md CLAUDE.md && git commit -m "docs(changelog): D7 hero suite (Unreleased)"
```

---

## Self-review (spec-coverage sweep)

- **§1 hero data model** → the definition/state split (Task 7 `HeroDefn`/`HeroState`), derived stats with cited constants (Task 8 `deriveHeroStats` — RR §4/§5/§8, AR), the class resource map (Task 3 `RESOURCE_BY_CLASS`, spec §1.2), stamina/recoveries/winded (Task 4, RR §8), surges/victories/tokens (Tasks 5/6, AR/RR §7/§10), conditions engine reuse (Task 2/Task 1 extraction, RR §8).
- **§2 composition strategy** → the `HeroPanel` contract + container/presentational split (Task 1); the three extracted cores (Task 1); conditions-engine reuse decoupled from encounter (Task 2). OD-7 adopted: kit location.
- **§3 `ds-hero` flagship** → split across **3 tasks**: (a) Task 7 model + `hero:`/`state:` split + byte-stable state-scoped serialize + schema; (b) Task 8 view-level `cx.compendium` resolution + derived stats + degrade-per-ref; (c) Task 9 sheet view composing extracted panels + the `setCharacteristicProvider` roll bridge + loosened conditions + respite + D9 `openFormEditor`. Layout/decomposition/persisted-state/consumed-hooks all covered.
- **§4 standalone pieces** → Task 2 (`ds-conditions`), Task 3 (`ds-resource`), Task 4 (stamina recoveries/winded ext), Task 5 (`ds-surges`), Task 6 (`ds-tokens`) — spec §6 order, each a proving-ground before the flagship.
- **§5 sidebar addendum** → Task 10 — nearly free (universal opt-in, recon §5); verification e2e + camera shot; zero `HeroSheetView` change.
- **§6 build sequence** → tasks mirror D7.0→D7.7 (Task 1 = D7.0 extraction; Tasks 2–6 = D7.1–D7.5; Tasks 7–9 = D7.6 flagship split; Task 10 = D7.7 sidebar; Task 11 = sweep).
- **§7 dependencies** → D5 roll bridge (existing `setCharacteristicProvider`, degrade if `cx.roll` absent), D6 `cx.compendium` (degrade-per-ref, inline fallback), D8 `sendToSidebar` (universal opt-in) — all landed; no external gate.
- **§8 open decisions** → OD-1…OD-9 all adopted per recommendation (header table); the non-recommend variants are explicitly rejected in-line.
- **Extraction-task neutrality check (Task 1):** the three extractions change **no** rendered DOM — every existing `stamina-bar`/`characteristics`/`initiative` golden + dom test passes **UNMODIFIED** (Step 4 makes `npm test` with zero test edits the load-bearing proof); the kit barrel pin is updated same-commit.
- **Placeholder scan:** every task has failing-test-first steps, exact `devbox` commands, verbatim schemas from the spec, and one conventional commit. Compendium fixtures are REAL data-unified files (copied read-only); tracker `example.yaml`s follow the multi-entity convention. No game constant is fabricated — each is cited or flagged.
- **Type consistency:** `HeroPanel<S>`/`PanelHost`/`ConditionHolder`/`HeroDefn`/`HeroState`/`HeroModel`/`DerivedStats`/`RefIssue`/`ResourceModel`/`SurgeModel`/`TokenPoolModel`/`ConditionsModel` each introduced once and reused downstream. `ds-hero` uses `autoResolveRefs:false` + **no** `resolveRefs` (view-level resolution); the four small elements use `stringifyYaml(model).trim()` with conditional-emit `parse`. Aliases are canonical-only (one per family). `ev`/game constants never numeric-guessed.
- **Existing serialization is NOT modified:** Task 4 adds only optional, absent-defaulted `ds-stamina` fields and `stamina-serialize.test.ts` + the stamina golden stay green unmodified (Task 4 Step 3 is the explicit freeze proof); no other task touches an existing element's serialize.
