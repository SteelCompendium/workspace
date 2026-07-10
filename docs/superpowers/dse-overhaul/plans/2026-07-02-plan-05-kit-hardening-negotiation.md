# D-wave Plan 05 — Kit hardening + Negotiation migration (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the Plan-01 harness (RED → GREEN → commit). This is a **lean** plan: full interface signatures live in **F1 spec §3**, the per-element migration recipe in **F1 §6**; this file gives task boundaries, exact files/lines, test focus, and impl notes. The implementer writes the code from F1 §3 + the cited source — do **not** transcribe code from here.

**Goal:** Harden the `framework/kit/` (fix the per-collapse-cycle listener/modal-close accumulation, make the harness YAML serializer faithful to Obsidian's real `yaml` package, and style the now-user-reachable error card), then migrate the **Negotiation Tracker** — the first large persisted+session-tab element — onto Element Framework v2.

**Architecture:** The kit fixes are prerequisites the D1 final review gated before any further *persisted/interactive* migration. Negotiation is a self-contained persisted tracker (no external refs — corrects the "Negotiation/Initiative need custom resolveRefs" framing; that is **Initiative-only**, Plan 06). It exercises: persisted write-behind for a big tracker, session-only tab state via `SessionStore`, free-text byte-compat (motivations / pitfalls / interest-level strings), the menu/reset mutation flow, and `ElementView.onUpdate` targeted updates — de-risking Initiative.

**Tech Stack:** vanilla TypeScript + DOM (no Vue, no reactivity lib), esbuild/CJS/ES2018, AJV for schema validation (N/A here — Negotiation has no schema), Jest (multi-project: `unit` node + `dom` jsdom), Obsidian `yaml` package as the persisted-serializer of record.

## Global Constraints

- **Worktree only.** All commits land in the `dse-framework` worktree DSE submodule: `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` (branch `dse-framework`). Never the main checkout.
- **Node/npm via the WORKSPACE devbox**, never the DSE-local devbox: `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements && <cmd>"` (node v24).
- **Migrate onto F1**: Negotiation becomes `src/elements/negotiation/{definition,model,view}.ts` implementing the F1 §3 `ElementDefinition`/`ElementView` contracts, registered in `registerFrameworkElementDefinitions` (`main.ts:151-155`), and **removed from legacy `src/utils/RegisterElements.ts:36-39`** (no double `registerMarkdownCodeBlockProcessor`).
- **Preserve every `ds-*` alias exactly:** `ds-nt`, `ds-negotiation`, `ds-negotiation-tracker` (canonical first). Preserve the ComponentWrapper `collapsible`/`collapse_default` keys if Negotiation wraps.
- **Byte-identical YAML round-trip** for persisted Negotiation — reuse the `NegotiationData` model class verbatim for parse; `serialize` reproduces the exact field set + order the current `CodeBlocks.updateNegotiationTracker` writer emits. Existing notes must round-trip unchanged. `serialize` ends with `.trim()` (matches stamina-bar precedent + `ReadingModeBlockHost.replaceSource`).
- **`autoResolveRefs: false`** on Negotiation (it has no refs; avoids the deep-walk + reserved-`scc:` footgun).
- **CSS:** re-scope each migrated element's `.ds-nt-*` block under `[data-dse-element="negotiation"]` in `styles-source.css`, in the element's own migration task (mirrors skills `:2072` / stamina-bar `:2149`).
- **Do NOT delete `CodeBlocks.updateNegotiationTracker` or the legacy sub-views' shared deps** — F1 §6 step 9 (Initiative) retires `CodeBlocks` wholesale; this plan only stops *using* the negotiation writeback method.
- **Lifecycle discipline (F1 §1.4):** every listener via `Component.registerDomEvent`; every subscription via `Component.register`; `MarkdownRenderer` parented to the view (`this.renderMarkdown`); popout-safe `this.win`, no bare `window`/`document`.
- Vanilla TS + DOM. No new **runtime** deps (Task 2 adds one **test-only** devDep: `yaml`). No new `tsc --noEmit` errors (must stay 0). **NO AI/co-author trailers in commits.**

## File Structure
```
src/framework/kit/componentWrapper.ts     (Task 1 — child Component owns the content body, torn down per cycle)
src/framework/kit/collapsible.ts          (Task 1 — unchanged unless the mock forces it; callers pass the per-cycle owner)
src/elements/skills/view.ts               (Task 1 — content listeners register against the per-cycle owner)
src/elements/stamina-bar/view.ts          (Task 1 — content listeners per-cycle owner; modal-close no longer accumulates)
test/mocks/obsidian.ts                     (Task 2 — parseYaml/stringifyYaml use the `yaml` pkg, matching Obsidian)
package.json                               (Task 2 — add devDependency "yaml": "^2.9.0")
styles-source.css                          (Task 3 — .dse-error-card styling; Task 5 — [data-dse-element="negotiation"] block)
src/elements/negotiation/model.ts          (Task 4 — parse via NegotiationData verbatim + byte-compat serialize)
src/elements/negotiation/definition.ts     (Task 5 — ElementDefinition, shape "persisted", no schema)
src/elements/negotiation/view.ts           (Task 5 — ElementView; reuses the 4 existing sub-views; tabs via SessionStore; onUpdate)
main.ts                                     (Task 5 — import + register negotiationElement)
src/utils/RegisterElements.ts              (Task 5 — remove ds-nt/ds-negotiation/ds-negotiation-tracker lines 36-39)
DELETED at Task 5: src/drawSteelAdmonition/negotiation/NegotiationTrackerProcessor.ts (orchestrator only)
KEEP/move at Task 5: the 4 sub-views PatienceInterestView / MotivationsPitfallsView / ArgumentView / LearnMoreView
```

---

## Task 1: Kit hardening — per-cycle listener/modal-close teardown

**Files:** Modify `src/framework/kit/componentWrapper.ts`, `src/elements/skills/view.ts`, `src/elements/stamina-bar/view.ts` (and `src/framework/kit/collapsible.ts` + `test/mocks/obsidian.ts` only if the mock lacks child-Component teardown); Test: create `test/dom/framework/kit-lifecycle.test.ts`; existing `test/dom/elements/skills.test.ts` + `test/dom/elements/stamina-bar.test.ts` must stay green.

**The bug (survey §5):** `componentWrapper.ts` `renderBody()` (`:64-74`) runs at mount (`:95`) **and on every expand** via `handleClick` (`:81-88`, calls `renderBody` at `:86`). Each call does `bodyEl.empty()` (`:65`, clears DOM only) then `options.renderContent(contentEl)` (`:72`). Content re-registers listeners against the **long-lived view Component** every cycle — `empty()` does not release `registerDomEvent`/`register` handles. Amplified callers: skills `mountCollapsibleHeading(groupEl, this, …)` → `collapsible.ts:81-82` (2 listeners/group/expand); stamina-bar `renderBar` → `stamina-bar/view.ts:95` (bar-click/expand). Separately, stamina-bar `openEditModal` (`stamina-bar/view.ts:127-135`) adds a fresh `this.register(() => modal.close())` (`:133`) on **every bar click** without releasing the prior — N opens ⇒ N closers fire on unload.

**The fix (D1 final review (A); README "kit hardening pass"):**
- In `componentWrapper.ts`, give the content body its own **child `Component`** created fresh each `renderBody` cycle: add it via `owner.addChild(new Component())`; before re-rendering, `owner.removeChild(prev)` (unloads it, releasing its registrations); pass it to content. Change `renderContent`'s signature to `renderContent(contentEl: HTMLElement, contentOwner: Component)` so callers register **per-cycle content listeners against `contentOwner`** (torn down each collapse↔expand), while **view-lifetime** widgets (the wrapper's own eye toggle at `:90-91`) stay on `owner`.
- Update `skills/view.ts` and `stamina-bar/view.ts` `renderContent` callbacks to use the passed `contentOwner` for content-internal listeners (skills' group headings / stamina-bar's bar click). Session-backed state (`SessionStore`) is unaffected — it survives the child teardown by design.
- In `stamina-bar/view.ts`, make the modal-close **not accumulate**: track the current closer and replace it on re-open (or bind close to the modal's own lifecycle), so repeated opens hold exactly one pending closer. Point: `:133`.
- If the harness `Component` mock doesn't unload children on `removeChild`/`unload`, extend it in `test/mocks/obsidian.ts` (consistent with the FW Task 4/7 mock hardening) — the accumulation test depends on real child teardown.

**Interfaces produced (Task 5 consumes):** `mountComponentWrapper(parent, owner, options)` where `options.renderContent(contentEl, contentOwner: Component)` — content listeners bind to `contentOwner`. State whether the collapsed/session key handling is unchanged (it is).

**Test focus (`kit-lifecycle.test.ts`):** mounting a wrapper whose `renderContent` registers a `registerDomEvent` and a `register()` subscription, then toggling collapse→expand **N times**, leaves exactly **one** live registration on the view (assert via a spy/counter on the mock's teardown, or by counting handlers) — not N. Add a stamina-bar case: opening the edit modal N times leaves one pending modal-close, and unload closes it exactly once. Skills + stamina-bar existing suites stay green (behavior parity).

**Impl notes:** this is a real framework change, not a transcription — sonnet-or-higher. Do not alter session-state semantics or the eye-toggle (view-lifetime) registration. Keep the kit generic (D2 builds the full accessible kit on it).

---

## Task 2: Kit hardening — faithful `yaml` serializer + free-text golden

**Files:** Modify `package.json` (add devDependency), `test/mocks/obsidian.ts`; Test: create `test/unit/model/yaml-roundtrip.test.ts`. Run the **full** suite afterward (suite-wide serializer change).

**Why (D1 Task 3 program finding; DECIDED 2026-07-02 by Scott):** Obsidian's `stringifyYaml`/`parseYaml` are the **`yaml` npm package**, not js-yaml. The mock currently uses js-yaml — byte-identical for scalar DTOs (stamina-bar ✓) but **free-text fields fold differently** (Negotiation motivations/pitfalls, the `i5..i0` interest strings; later Initiative notes, Counter labels). Persisted-element byte-compat tests are only meaningful against the real serializer.

**Do:**
- Add `"yaml": "^2.9.0"` to `devDependencies` (already resolved in `node_modules` at 2.9.0 — dependency-free). Install via the workspace devbox; confirm the lockfile change is only `yaml` (no transitive churn).
- Rewrite `test/mocks/obsidian.ts` `parseYaml`/`stringifyYaml` to delegate to `yaml` (`import { parse, stringify } from "yaml"`). Match Obsidian's `stringifyYaml` option set — determine the exact options empirically via the golden below (Obsidian's defaults; the js-yaml `lineWidth:80` watch-item from Plan-01 T-2 is superseded by this). `js-yaml` + `@types/js-yaml` may stay for any non-mock use, but the mock is the serializer of record.
- The change is **suite-wide**: any test asserting serialized YAML now sees `yaml`-pkg output. Run all suites and reconcile — expected divergence is confined to free-text/multiline; scalar fixtures (stamina-bar, counter health) are unaffected.

**Test focus (`yaml-roundtrip.test.ts`):** a **free-text round-trip golden** — take an object with multi-line / long free-text fields (mirroring negotiation motivation text + an `i3` interest-level sentence), `stringify` → `parse` → deep-equal the original, and assert the serialized text matches a checked-in golden string (proving folding is stable and Obsidian-faithful). Then confirm the **existing stamina-bar byte-compat test still passes** (scalar ⇒ unchanged) — the guard that this swap didn't regress the proven persisted path.

**Impl notes:** if reconciling shifts more than free-text assertions, STOP and report — a scalar divergence would mean the mock options are wrong, not the tests. tsc must stay 0.

---

## Task 3: Kit hardening — style the error card

**Files:** Modify `styles-source.css`; Test: none (CSS; self-review). 

**Why (D1 final review (C)):** `renderErrorCard` (`src/framework/pipeline.ts:103-125`) builds `.dse-error-card` with children `.dse-error-card-title`, `.dse-error-card-message`, and (schema failures) `.dse-error-card-list` / `.dse-error-card-list-item`, plus a `data-dse-error-stage` attr (`parse`/`schema`/`reference`/`render`). Survey §6 confirms **zero CSS** exists for any of these today — the card renders unstyled, and it is now **user-reachable in production** via the two schema-validated migrated elements (skills, stamina-bar).

**Do:** add a scoped, token-friendly `.dse-error-card` block to `styles-source.css` (near the legacy `.error-message` rule at `:406`, which is the current per-processor error style — visually align to it so migrated + legacy errors match, but use the new class names). Style card container, title, message, and the `path: message` list; optionally distinguish stages via `[data-dse-error-stage="…"]` accents. Reference **DESIGN.md** ("High-Fantasy Steel") for look, but keep it minimal — D3 owns the token layer; this is functional styling, not a redesign. Do not touch `pipeline.ts` (class names are fixed).

**Test focus:** none automated (no CSS-regression infra). Self-review: every class/attr `renderErrorCard` emits (`pipeline.ts:103-125`) has a rule; the card is legible in both themes; no leakage outside `.dse-error-card`.

**Impl notes:** cheapest-tier, single-file, no logic. Verify the class list against `pipeline.ts:103-125` verbatim.

---

## Task 4: Negotiation model — parse + byte-compat serialize

**Files:** Create `src/elements/negotiation/model.ts`; Test: create `test/unit/model/negotiation-serialize.test.ts`. (The Plan-01 bug-net `test/unit/model/negotiation.test.ts` + fixture `test/fixtures/negotiation/frodo.yaml` already exist — reuse the fixture.)

**Model (mirror `src/elements/stamina-bar/model.ts`):** export `parse(data, raw): NegotiationData` = `parseNegotiationData(raw)` **or** `new NegotiationData(data)` — reuse `src/model/NegotiationData.ts` **verbatim** (`parseNegotiationData` at `:159-168`; classes `NegotiationData` `:3-87`, `CurrentArgument` `:89-127`, `Motivation` `:129-139`, `Pitfall` `:141-149`). Export `serialize(model: NegotiationData): string` producing the **exact YAML the legacy writer emits** — trace `CodeBlocks.updateNegotiationTracker` (called from `NegotiationTrackerProcessor.ts:68`) for the precise DTO shape (field set + order): `stringifyYaml(<that shape>).trim()`. If the legacy writer serializes the whole `NegotiationData` instance, do the same; if it projects a subset, match that subset exactly.

**Interfaces produced (Task 5 consumes):** `parse(data, raw): NegotiationData`, `serialize(model: NegotiationData): string`.

**Test focus:** `serialize(parse(frodo.yaml))` byte-equals what the **current** `CodeBlocks.updateNegotiationTracker` path would write for the same input (field set + order + trailing trim), using the Task-2 faithful serializer so free-text motivations/pitfalls/`i0..i5` fold correctly. Round-trip: `parse → serialize → parse` is stable (deep-equal). Pin any legacy default that `new NegotiationData` applies (patience=5, interest=0) — preserve, do not "fix".

**Impl notes:** persisted model = `serialize` is mandatory (registry rejects otherwise — `registry.ts:92-97`). This task is model-only: no view, no registration, no DOM. Depends on Task 2's serializer being faithful.

---

## Task 5: Negotiation element — view + register + retire the legacy processor

**Files:** Create `src/elements/negotiation/{definition,view}.ts`; Modify `main.ts` (`:32-34` imports, `:151-155` register), `src/utils/RegisterElements.ts` (remove `:36-39`), `styles-source.css`; Delete `src/drawSteelAdmonition/negotiation/NegotiationTrackerProcessor.ts`; Reuse (import in place, or move under `src/elements/negotiation/`) the 4 sub-views `negotiation/{PatienceInterestView,MotivationsPitfallsView,ArgumentView,LearnMoreView}.ts`; Test: create `test/dom/elements/negotiation.test.ts`.

**Definition (`definition.ts`):** `id:"negotiation"`, `name:"Negotiation tracker"`, `aliases:["ds-nt","ds-negotiation","ds-negotiation-tracker"]`, `shape:"persisted"`, **no `schema`** (none exists today — do not invent one), `autoResolveRefs:false`, `parse`/`serialize` from Task 4, `createView: cx => new NegotiationView(cx)`.

**View (`view.ts`, `NegotiationView extends ElementView<NegotiationData>`):** re-express `NegotiationTrackerProcessor.postProcess`'s orchestration as `onMount(root, model)` — **reuse the 4 existing sub-views** (they are already vanilla DOM; the migration replaces the *processor/orchestrator*, not the sub-views). Wire:
- **Tabs / session UI state** → `SessionStore` keyed by `this.cx.host.blockKey()` (mirror skills `view.ts:82-93,127-128`); active tab survives re-render, never written to the note.
- **Persistence** → mutations (patience/interest steppers, argument motivation/pitfall toggles, learn-more) mutate `this.model` then `void this.persist()` (framework debounced write-behind via `host.replaceSource`), replacing the legacy `CodeBlocks.updateNegotiationTracker(app, data, ctx)` call (`NegotiationTrackerProcessor.ts:68`). Gate write actions on `this.cx.host.canPersist` (read-only when false — mirror stamina-bar `view.ts:72,94`).
- **The reset menu** (the "more-vertical" `Menu` at `NegotiationTrackerProcessor.ts:57-72`) → rebuild with Obsidian `Menu`; `resetData()` then `persist()`.
- **`onUpdate(model)`** → targeted re-render of the active tab/section (avoid full teardown on every persist; F1 §3.3). Content listeners bind to the **per-cycle `contentOwner`** from Task 1's `mountComponentWrapper` if wrapped, else to `this` for view-lifetime controls.
- `NegotiationTrackerProcessor` takes `App`; use `cx.app`.

**Registration:** add `import { negotiationElement } from "./src/elements/negotiation/definition"` (match existing import style at `main.ts:32-34`) + `registry.register(negotiationElement);` in `registerFrameworkElementDefinitions` (`main.ts:151-155`); remove the three `ds-nt*` lines from `src/utils/RegisterElements.ts:36-39` and leave a "migrated to Framework v2 (Plan 05, F1 §6 step 8)" comment matching the existing ones (`:27-28`, `:45-47`, `:57-58`); drop the now-unused `NegotiationTrackerProcessor` import (`RegisterElements.ts:2`).

**CSS:** re-scope the `.ds-nt-*` block (`styles-source.css` ~`:1378+`) under `[data-dse-element="negotiation"]` (pipeline stamps the attr at `pipeline.ts:166`); keep shared `.ds-container` (`:27`) global.

**Retire:** delete `NegotiationTrackerProcessor.ts` (orchestrator only). **Keep** `CodeBlocks.updateNegotiationTracker` (Initiative step 9 retires `CodeBlocks` wholesale) and the 4 sub-views. Prove exactly-once registration: `ds-nt`/`ds-negotiation`/`ds-negotiation-tracker` appear in the framework registry and **not** in `RegisterElements.ts` (no double `registerMarkdownCodeBlockProcessor`).

**Test focus (`negotiation.test.ts`, jsdom + vault-fake, T-10 pattern):** render the `frodo.yaml` fixture → patience/interest, motivations/pitfalls, argument tabs present; switch tabs → active tab persists across a re-render via `SessionStore` and performs **zero** vault writes; a persisted mutation (e.g. mark a motivation used, or step interest) → `this.model` mutates → **exactly one** debounced block-body `replaceSource`, surrounding note bytes intact, body byte-compatible with the legacy writer (ties to Task 4); reset-menu → `resetData` → persist; `canPersist=false` → read-only (no writes). Registered-exactly-once check (registry has it, `RegisterElements.ts` doesn't).

**Impl notes:** largest task in this plan — sonnet-or-higher, expect several turns. Reuse sub-views to keep scope bounded; the migration is orchestration + persistence + session-tab wiring, not a sub-view rewrite. Do not add a schema. Keep byte-compat the bar.

---

## Self-review (done)

- **Coverage:** the three D1-final-review kit gating fixes map to Tasks 1 (A: accumulation), 2 (B: yaml serializer + golden), 3 (C: error-card CSS); the Negotiation migration (F1 §6 step 8) maps to Tasks 4 (model/byte-compat) + 5 (element/register/retire).
- **Correction captured:** Negotiation has **no external refs** (survey §7) → `autoResolveRefs:false`, no custom `resolveRefs`; the bare-path `statblock` resolveRefs work is **Initiative-only** and deferred to Plan 06 (flagged there before it starts).
- **Ordering:** kit fixes precede Negotiation because Task 2's faithful serializer is required for Task 4's free-text byte-compat, and Task 1's per-cycle owner is the interface Task 5's view uses. Tasks 1–3 are mutually independent (A: kit+views, B: mock+deps, C: CSS).
- **Interface consistency:** `mountComponentWrapper`'s `renderContent(contentEl, contentOwner)` (Task 1) is consumed by Task 5's view; `parse`/`serialize` (Task 4) consumed by Task 5's definition; both named consistently with the stamina-bar precedent.
- **No placeholders:** every task cites exact files + line ranges from the worktree survey; no "add error handling"/"similar to" stubs.
- **Type safety:** `tsc --noEmit` must remain 0 across all tasks (Global Constraints).
