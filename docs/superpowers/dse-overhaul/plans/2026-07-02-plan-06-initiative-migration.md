# D-wave Plan 06 — Initiative Tracker migration (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the harness. Lean plan: interface signatures in **F1 §3**, migration recipe in **F1 §6**, per-element pattern in the already-migrated `src/elements/{stamina-bar,negotiation}/`. This file gives task boundaries, exact files/lines (from the 2026-07-02 Initiative survey), test focus, and the resolveRefs design. Implementer writes code from those; do not transcribe from here.

**Goal:** Migrate the **Initiative Tracker** — the largest, riskiest element (~533-line processor, ~353-line async model, 5 modals, ~960 lines of scattered CSS, the only bare-path `statblock` resolver) — onto Element Framework v2, retiring the legacy processor and `CodeBlocks` usage for initiative, and fixing the two data-corruption bugs (CB-1, CB-2) the migration naturally touches.

**Architecture:** Split across 5 tasks along the three independent risk axes: (1) sync model split, (2) bare-path statblock ref-resolution, (3) modal decoupling + the CB-1/CB-2 bug fixes, (4) the view, (5) CSS re-scope. Initiative is a PERSISTED element (`serialize = stringifyYaml(model).trim()` on the whole `EncounterData`, byte-identical to the legacy `CodeBlocks.updateInitiativeTracker` write). It reuses the framework `persist()` / `ReadingModeBlockHost` write-behind proven on stamina-bar + negotiation, and the `resetData → update() rebuild → persist` flow (now hardened with error-handling in the Plan-05 cleanup).

**Tech Stack:** vanilla TS + DOM, esbuild/CJS/ES2018, Jest (unit + dom projects), Obsidian `yaml` serializer, the still-live legacy `src/utils/ReferenceResolver.ts` (F1 §3.7 keeps it for un-migrated ref use — but see the resolveRefs design below).

## Global Constraints

- **Worktree only:** `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` (branch `dse-framework`). node/npm via WORKSPACE devbox (`devbox run -- bash -c "cd <WT> && <cmd>"`). Commits in the submodule; **NO AI/co-author trailers.**
- **Migrate onto F1:** `src/elements/initiative/{definition,model,view}.ts`; register in `registerFrameworkElementDefinitions` (`main.ts:153-158`, currently ends at `negotiationElement`); remove the 4 aliases from `src/utils/RegisterElements.ts:29-33` (leave the house-style "migrated" comment) + drop the `InitiativeProcessor` import (`:1`). Preserve aliases exactly: `ds-it`, `ds-init`, `ds-initiative`, `ds-initiative-tracker`.
- **Byte-identical YAML round-trip:** reuse `EncounterData` as model `M`; `serialize = (m) => stringifyYaml(m).trim()` (matches `CodeBlocks.ts:102`/`:79` whole-object write). Existing vault encounter blocks must round-trip unchanged. **No schema** (none exists; `pipeline.ts:176` skips validation when omitted). `autoResolveRefs:false`.
- **Preserve exact error messages:** `test/unit/model/encounter-data.test.ts` pins ~11 user-facing validation messages — the `parse`/`resolveRefs` split must throw the identical strings at the identical points (model-level `Error.message`, independent of the framework error-card copy).
- **Drop** the legacy manual capture-phase click-shield (`initiativeProcessor.ts:46-47`) and try/catch+`.error-message` (`:48-55`) — the pipeline provides both (default click-shield unless `noClickShield`; `renderErrorCard`).
- **KEEP** `CodeBlocks.updateInitiativeTracker` + the whole `CodeBlocks` class until the very end (other un-migrated elements + the canvas fallback live there); just stop calling it from initiative. (F1 §6 step 10 retires CodeBlocks wholesale later.)
- **Lifecycle discipline (F1 §1.4):** listeners via `registerDomEvent`; modals closed on view unload (single-registration pattern, `stamina-bar/view.ts:53-61`); popout-safe `this.win`.
- `tsc --noEmit` stays 0. Full suite green (currently 343, minus whatever Plan-05 cleanup adds). Reuse the negotiation/stamina-bar view + test patterns verbatim where possible.

## 🔵 Open Decisions — needs Scott (surfaced from the survey)

1. **Canvas persistence regression (USER-VISIBLE).** Legacy initiative persists on Obsidian **canvas** cards via `CodeBlocks.findCanvasNodeAndUpdate` (text-match fallback). The framework host deliberately quarantines canvas (`ReadingModeBlockHost.ts:26-34,81` → `sourcePath===''` ⇒ `canPersist=false`, F1 §9), so **initiative-on-canvas becomes read-only** after migration. This is framework-wide + consistent (stamina-bar/negotiation already behave this way), but initiative is the heaviest canvas user. **Recommended default: accept the regression** (read-only render on canvas + a release note), deferring true canvas persistence to a later effort. **✅ RESOLVED 2026-07-02 (Scott): accept read-only on canvas + the UI MUST clearly indicate read-only** (no silent no-save). Implemented reusably as the new **Task 3.5 read-only affordance** (framework `data-dse-readonly` stamp + shared CSS badge across all persisted elements — also fixes the Negotiation canPersist Minor). True canvas persistence deferred: it's blocked on an Obsidian API gap — the render context gives no stable canvas-node handle, so the only known write path is the fragile text-match legacy used.
2. **Bare-path resolveRefs approach.** The framework `ReferenceService` does NOT resolve bare strings (only `@`/`[[`/`scc:`), so `statblock: "Thorn Dragon"` won't resolve via the default path. **Recommended: add a small additive `ReferenceService.resolveBarePath(path)` method** (exposes the already-ported 5-step `findFile` + first-`ds-*`-block extraction, using the legacy `sourcePath=""` for byte-exact behavior) and have initiative's custom `resolveRefs` call it field-scoped. Rejected alternatives: reuse the legacy `ReferenceResolver` directly (can't get `app` inside `resolveRefs(model, refs)`), or a global catch-all bare provider (footgun for future `resolveDeep`). *Confirm the additive-method approach.*
3. **`findFile` step-5 `sourcePath`.** Legacy hardcodes `""` (global first match); the framework's ported `findFile` uses the real note `sourcePath` (note-relative — an improvement). **Recommended: use `""` in `resolveBarePath` for byte-exact legacy behavior**; note the improvement is available if wanted. *Confirm legacy-exact.*
4. **CB-1 / CB-2 data-corruption fixes ride this migration.** CB-1 (`MinionStaminaPoolModal.ts:226` operator-precedence, pool clamps to alive count) and CB-2 (`:447` empty-language fence rewrite destroys the block) are fixed as a consequence of decoupling the modal (Task 3). This flips their `test.failing` nets (+DC-6) to `test()`. *Recommended: yes, fix them here (they're in the code this task rewrites).* 

## File Structure
```
src/elements/initiative/model.ts        (Task 1 — SYNC parse split from parseEncounterData + serialize)
src/framework/seams/refs.ts             (Task 2 — additive resolveBarePath; existing file)
src/elements/initiative/definition.ts   (Task 2 — ElementDefinition incl. custom resolveRefs; persisted, no schema)
src/views/MinionStaminaPoolModal.ts     (Task 3 — decouple from CodeBlocks/data/ctx; fix CB-1, CB-2)
src/elements/initiative/view.ts         (Task 4 — ElementView; port the 9 build/update methods; wire 5 modals)
main.ts                                  (Task 4 — import + register initiativeElement)
src/utils/RegisterElements.ts           (Task 4 — remove ds-it/ds-init/ds-initiative/ds-initiative-tracker :29-33)
styles-source.css                        (Task 5 — re-scope ~960 lines under [data-dse-element="initiative"])
DELETED at Task 4: src/drawSteelAdmonition/initiativeProcessor.ts
REUSED verbatim (4 modals, callback-based): StaminaEditModal, ResetEncounterModal, ConditionSelectModal(+CustomizeConditionModal)
```

---

## Task 1: Initiative model — sync `parse` split + byte-compat `serialize`

**Files:** Create `src/elements/initiative/model.ts`; Test: create `test/unit/model/initiative-serialize.test.ts` (byte-compat) + keep `test/unit/model/encounter-data.test.ts` green.

**The split (F1 pipeline requires `parse` SYNC; `resolveRefs` async runs AFTER parse — Task 2):** legacy `parseEncounterData(source, app, settings)` (`EncounterData.ts:82`) is async ONLY because it `await`s statblock resolution inline (`:113`,`:213`) BEFORE the name/max_stamina validations that consume the merged values. So:
- `parse(data, raw): EncounterData` = the sync body of `parseEncounterData` MINUS the two `await` statblock-merge blocks (`:110-128`, `:211-228`) MINUS the name/max_stamina validations that depend on merged statblock values (`:130`,`:133` hero; creature equivalents). KEEP: shape validation (`:95-105`), condition normalization (`:137-154`), hero defaults `isHero=true`/`has_taken_turn??false`/`current_stamina??max_stamina`/`temp_stamina??0` (`:156-159`), squad-role validation (`:174-208`), instance materialization (minion shared pool `:249-297`; per-instance `:298-343`), malice default (`:347-348`). Leaves `statblock` strings in place and `name`/`max_stamina` possibly unset (deferred to Task 2). Reuse `EncounterData` interfaces + `resetEncounter` verbatim (do NOT modify `EncounterData.ts`; import from it).
- `serialize(model): string` = `stringifyYaml(model).trim()`.

**Interfaces produced:** `parse(data, raw): EncounterData`, `serialize(model): string`. (Task 2 adds `resolveRefs` to the definition; Task 1 is model-only.)

**Test focus:** byte-compat `serialize(parse(quick-start.yaml))` equals `stringifyYaml(<materialized EncounterData>).trim()`; round-trip idempotence; instance-materialization + defaults pinned (mirror `encounter-data.test.ts` T-1/T-2 happy paths). Confirm the messages that DON'T depend on statblock still fire from `parse` (shape errors, squad-role errors) — the ref-dependent name/max_stamina messages move to Task 2.

**Impl notes:** the split is the subtle part — do it so NO validation that legacy ran post-merge runs in `parse`. sonnet-or-higher. Model-only: no view/definition/registration/DOM.

---

## Task 2: Bare-path `statblock` resolveRefs (`resolveBarePath` + `def.resolveRefs`)

**Files:** Modify `src/framework/seams/refs.ts` (additive `resolveBarePath`); Create `src/elements/initiative/definition.ts`; Test: extend `test/unit/framework/refs.test.ts` (resolveBarePath) + create the ref-merge tests + keep `test/unit/utils/reference-resolver.test.ts` + the ref-dependent `encounter-data.test.ts` messages green.

**`ReferenceService.resolveBarePath(path: string): Promise<ResolvedRef | null>`** (additive, `refs.ts`): expose the already-ported 5-step `findFile` (`refs.ts:74`) + `resolveByPath` (`:106`) for a **bare** path, using `sourcePath=""` in the `getFirstLinkpathDest` step (byte-exact legacy behavior — OD-3). Returns the first-`ds-*`-block payload (`{data, file}`) or null. Does NOT touch the auto provider chain (so `resolveDeep`/other elements are unaffected). Amend F1 §3.7 accordingly (additive method).

**`def.resolveRefs(model, refs): Promise<EncounterData>`** — reproduce the legacy field-scoped merge (`EncounterData.ts:110-128`,`:211-228`) EXACTLY: for each hero/creature whose `statblock` is a string, `const resolved = await refs.resolveBarePath(statblock)`; if resolved, copy **only-if-unset**: `name` (`!x.name && resolved.name`), `max_stamina` (`!x.max_stamina && resolved.stamina` → `+resolved.stamina`), `image` (`!x.image && resolved.image`); leave the `statblock` string in place; on error re-throw the legacy "...multiple instances of '<name>'... specify the full path" hint. THEN run the deferred name/max_stamina validations (the exact `:130`/`:133` messages). Definition: `id:"initiative"`, `name:"Initiative tracker"`, aliases, `shape:"persisted"`, no schema, `autoResolveRefs:false`, `parse`/`serialize` from Task 1, `resolveRefs`, `createView: cx => new InitiativeView(cx)`.

**Test focus:** `resolveBarePath("Thorn Dragon")` resolves via the 5-step chain to the first `ds-*` block (reuse the `reference-resolver.test.ts` fixture pattern); the field merge copies exactly name/`+stamina`/image only-if-unset and preserves the `statblock` string; a statblock string with no local name/max_stamina gets them from the block; the ref-dependent validation messages fire identically; `autoResolveRefs:false` means no deep-walk. Confirm bare strings still pass through `resolveDeep` untouched (no global provider added).

**Impl notes:** this is the crux of the whole migration. Keep `resolveBarePath` additive + side-effect-free on the provider chain. sonnet-or-higher.

---

## Task 3: Decouple `MinionStaminaPoolModal` + fix CB-1 / CB-2

**Files:** Modify `src/views/MinionStaminaPoolModal.ts`; Test: `test/dom/views/minion-stamina-pool-modal.test.ts` (flip the 3 `test.failing` nets to `test`).

**Decouple:** the modal currently imports `CodeBlocks` (`:4`) and calls `CodeBlocks.updateCodeBlock(this.app, data, ctx, "")` at `:447` (condition removal) — it holds `data`+`ctx`. Refactor its constructor from `(app, group, creature, data, ctx, updateCallback)` to drop `data`/`ctx` and route ALL persistence through the injected `updateCallback` (rename to `persist`/`onChange` per the negotiation `(data, persist)` convention). The damage path already uses the callback (`:240`).

**Fix CB-1** (`MinionStaminaPoolModal.ts:226`): operator-precedence bug — `len ?? 0 * max` clamps the pool to alive-minion count. Parenthesize `(len ?? 0) * max`. (Correct pool for the T-4 fixture = 17.)
**Fix CB-2** (`:447`): the empty-language `CodeBlocks.updateCodeBlock(..., "")` destroyed the fence language — now removed entirely (persistence goes through `persist()`, which preserves the fence via `ReadingModeBlockHost`). This is the fix.

**Test focus:** flip `test.failing` → `test` for **CB-1** (pool math = 17), **CB-2** (fence stays `ds-initiative`, block intact), **DC-6** (condition-removal + damage in one session both persist exactly once) — DC-6 goes green once the modal routes through the injected `persist` and CB-1/CB-2 are fixed (the test provides the persist spy). Keep the existing kill-math + kill-flow tests green.

**Impl notes:** the other 4 modals (StaminaEditModal, ResetEncounterModal, ConditionSelectModal, CustomizeConditionModal) are already callback-based — do NOT touch them here (the view reuses them verbatim in Task 4).

---

## Task 4: Initiative view + register + retire the processor  ⚠️ (may split — see note)

**Files:** Create `src/elements/initiative/view.ts`; Modify `main.ts`, `src/utils/RegisterElements.ts`; Delete `src/drawSteelAdmonition/initiativeProcessor.ts`; Test: create `test/dom/elements/initiative.test.ts` (re-point the `initiative-render.test.ts` T-10 template at the real `ElementPipeline` — mirror `negotiation.test.ts`).

**View (`InitiativeView extends ElementView<EncounterData>`):** port the processor's 9 build/update methods (`buildUI :58`, `buildCharacterRow :138`, `buildEnemyGroupRow :202`, `buildDetailedCreatureRow :337`, `editCreatureStaminaModal :390`, `updateTurnIndicator :414`, `updateStaminaDisplay :425`, `buildConditionIcons :466`, `isHero :530`) into `onMount` + helpers. Preserve the MIXED update strategy: in-place targeted updates (turn indicator, stamina text, malice `setText`, condition-icon rebuild) stay in-place; the coarse rebuilds (Reset Round `:78`, minion-pool callback `:324`) become `this.model` mutation → `update()` rebuild (default onUpdate) → `persist()`; mid-level (instance cell select `:312`) rebuilds its sub-container. **Swap all 13 `CodeBlocks.updateInitiativeTracker(app,data,ctx)` calls** (`:82,93,124,129,157,196,219,317,326,377,402,506,523`) for `this.persist()` after mutating `this.model`. Gate writes on `cx.host.canPersist` (read-only when false — canvas per OD-1). Wire the 5 modals with `cx.app` + callbacks; close-on-unload. `conditionManager` = `new ConditionManager()` in the view. Drop the manual click-shield + try/catch.

**Registration:** import + `registry.register(initiativeElement)` in `registerFrameworkElementDefinitions` (`main.ts:153-158`); remove `RegisterElements.ts:29-33` + the `InitiativeProcessor` import (`:1`); the concrete-plugin typing rationale (`RegisterElements.ts:8-14`) is now moot (optional: relax to `Plugin`). Delete `initiativeProcessor.ts`.

**Test focus (real `ElementPipeline` + `ReadingModeBlockHost` + FakeVault):** render `quick-start.yaml` + `squad.yaml` → structure (`.ds-init-container`, hero/enemy rows, malice text, instances grid, conditions); a turn-indicator click → exactly one write with `has_taken_turn:true`, byte-compat body; malice +/− → persist; stamina modal → persist; minion pool modal → persist (uses the Task-3 decoupled modal); reset → resetEncounter → update() rebuild → persist; `canPersist=false` → read-only; registered-exactly-once (registry has the 4 aliases, `RegisterElements.ts` doesn't). A `statblock`-ref fixture renders with merged name/stamina (exercises Task 2 end-to-end).

**⚠️ Split note:** this is the largest task in the whole D-wave (~533-line port + 11 controls + 5 modals). If it exceeds a clean single deliverable, split into **4a** (top bar + heroes + malice + turn/stamina/conditions + definition + register + retire processor + render/first-write test) and **4b** (enemy groups + instances grid + minion pool + detailed-creature rows + their tests). The implementer should report BLOCKED-for-split rather than sprawl.

---

## Task 5: CSS re-scope under `[data-dse-element="initiative"]`

**Files:** Modify `styles-source.css`; Test: none (CSS) — build + self-review.

**The work:** unlike negotiation (single nested block, trivially re-scoped), initiative's CSS is **~960 lines of scattered FLAT top-level rules** spanning `styles-source.css:470-1429` (Turn Indicator, top action bar, character/hero rows, malice `:548-582`, enemy groups, instances grid, stamina modal, minion modal, condition modal, condition effects). Re-scope the in-tracker rules under `[data-dse-element="initiative"]`. **Two hazards:** (a) **modal CSS renders in `document.body`, OUTSIDE the element root** — modal selectors (`.minion-stamina-modal`, `.stamina-header/*`, `.add-condition-modal`, `.customize-condition-*`, condition-modal rules) must stay UNSCOPED (or move to a modal-scoped class), NOT under `[data-dse-element]`; (b) `.condition-icon`, `.stamina-bar-*`, `.condition-effect-*` are **SHARED** between in-tracker DOM and modal DOM — keep the shared ones reachable from both. Keep `.ds-container` (`:27`) global.

**Test focus:** none automated; `npm run build-no-check` succeeds + `styles.css` contains the scoped rules; self-review that in-tracker rules are scoped, modal rules remain body-reachable, shared rules serve both, nothing leaks.

**Impl notes:** error-prone — do it carefully, section by section (the survey's line-range table is the map). Cheapest-tier is NOT appropriate; sonnet-or-higher. This can land last (the element renders with legacy-global CSS until re-scoped, same as HR's deferred re-scope).

---

## Self-review (done)

- **Coverage:** the survey's 5-way split maps to Tasks 1-5; the resolveRefs crux (Task 2) + the parse/resolveRefs split (Task 1) are the F1-pipeline-mandated shape; CB-1/CB-2 ride Task 3 (they're in the code it rewrites); the view (Task 4) may split.
- **Dependencies:** T1 (model) → T2 (resolveRefs, uses model) → T3 (modal decouple, independent) → T4 (view, uses model+resolveRefs+decoupled modal) → T5 (CSS, independent, lands last). T3 before T4 so the view wires an already-decoupled modal.
- **Byte-compat:** `serialize = stringifyYaml(model).trim()` on the reused `EncounterData` instance (same as legacy `CodeBlocks.ts:102`); parse/resolveRefs reproduce the exact materialization + messages.
- **Open Decisions flagged for Scott** (canvas regression, resolveRefs approach, findFile sourcePath, CB fixes) — resolve before executing the affected task.
- **No placeholders:** every task cites exact files + line ranges from the survey.
