# D8 — GM Subsystems Implementation Plan

> **STATUS 2026-07-18: BUILT — READY-PENDING-GATES.** Tasks 1-10 + docs MUST-FIX landed
> (plugin `5c6e33d`); opus whole-branch review clean after the docs fix. Gates: tsc · jest
> 1725 · shots 139 · obsidian-shots 110 (incl. visually-confirmed sidebar leaf). Rides the
> F2/D6 landing gate (SDK 3.2.0 publish). Records: Linear SC-1 + worktree ledger.


> **STATUS 2026-07-18: DRAFT — READY TO EXECUTE.** Written against the BUILT F1/F2/D6
> framework at worktree `f2`, plugin branch tip **`68ba54e`** (jest baseline **1453** green,
> fixtures `23`, shots `119`, obsidian-shots `93`). Rides the same F2 landing gate as D6:
> Tasks 1–5, 9 need only F1/D6 (already landed) and can execute now; **Tasks 4 (encounter) and
> the spendable-malice half of Task 5 are HARD-gated on F2 OD-1 (`ds-sb` in md-dse) + a
> data-unified release** — developed against the hand-cut release, not shipped until the gate
> clears (spec §8.3). Task record: Linear + worktree ledger.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Program:** DSE Overhaul — plan **17** (Wave 2, D-series; D8). Spec: `../D8-gm-subsystems-spec.md`.
**Written:** 2026-07-18, against the BUILT framework at worktree `f2`, plugin branch tip **`68ba54e`** (jest baseline **1453** green).
**Recon of record:** `workspace/.superpowers/sdd/d8-recon.md` — the ground truth for the shipped plugin surface. **Where the D8 spec cites a path/interface that differs from the recon, the recon wins.** The deltas that reshape this plan versus the spec's sketches:

1. **`initiativeProcessor.ts` is DELETED** (recon; retired at Plan 06 Task 5). The spec §3/§7 cite `initiativeProcessor.ts:112-130` (malice stepper) and `:62-83` (reset). The migrated homes are `src/elements/initiative/view.ts` (malice stepper `:185-208`; `rebuildAndPersist()` `:119`; the Reset menu `:139-159`) and `resetEncounter()` in `src/drawSteelAdmonition/EncounterData.ts:62`. Malice-panel and turn-economy work **extends the F1 `InitiativeView`**, never the deleted processor.
2. **`RenderMode` already reserves `"sidebar"`** (recon; `BlockHost.ts:18` — `'reading' | 'live-preview' | 'sidebar'`, `sidebar` documented "reserved for D8, no impl"). So spec **OD-1** ("widen F1's `RenderMode`") is **already satisfied at the type level** — this plan needs **no F1 union change**; `SidebarBlockHost` simply implements the reserved member. (Adopted; noted below.)
3. **`Malice` is `{ value: number }` only** (recon; `EncounterData.ts:45`, `REVIEW` note `:58`). Spec §3/§7.3's `round_gain`/`log`/`round` are **additive optional fields**, absent-default, so pre-D8 blocks serialize byte-identically (Task 9 hard invariant).
4. **`serialize = stringifyYaml(model).trim()`** over the WHOLE model object (recon; `model.ts:256`). Byte-stability therefore hinges on **`parse` never materializing a new field that was absent from the input** — `stringifyYaml` emits exactly the keys present on the object. `parse` mutates-and-returns the parsed object in place, so an unknown passthrough key (e.g. `_dse_anchor`) already round-trips for free; new economy keys must be conditional.
5. **`ev` is a STRING** on the SDK `Statblock` model (recon; `:14/:23`) and **no `cost` field is typed** on `Statblock`/`Feature`. Encounter EV math and malice-cost parsing are **defensive string parses**, never numeric-field reads.
6. **`CompendiumIndex.getStatblock(code): Promise<Statblock | null>` is the D8 entry point** (recon; landed in D6 Task 2). Encounter + malice-features **consume** it; they never re-implement SCC→model resolution.
7. **The `ItemView` mock is a bare stub** (`getViewType` only, `obsidian-core.ts:744`); the `App.workspace` mock has **only** `getActiveViewOfType` (`:265`); `Plugin` has **no** `registerView` (`:397-440`). Task 1 extends all three, test-only.
8. **The negotiation sub-view pattern lives at `src/elements/negotiation/`** (`ArgumentView`/`PatienceInterestView`/`MotivationsPitfallsView`, `view.ts` uses `cardHead`/`iconButton`/`tabs`) — **not** the spec's stale `src/drawSteelAdmonition/negotiation/`. Montage (Task 6) mirrors the F1 element, not the legacy dir.
9. **The `Counter` view is the malice/tracker stepper clone source** (recon; `counter/view.ts` — one kit `stepper()`, `editable: canPersist`, `onChange → persist()`).

**Open Decisions — adopted (spec §9; autonomy window, Scott reviews asynchronously):**

| OD | Decision adopted |
|---|---|
| **OD-1** | Sidebar mode = the **already-reserved** `"sidebar"` `RenderMode` member — **no F1 union widening needed** (recon delta 2). `SidebarBlockHost.mode = "sidebar"`. |
| **OD-2** | Encounter budget/difficulty/XP-rate are **parameterized, user-editable tables** with shipped defaults flagged `// verify against Draw Steel core rules`; the tool shows spent EV vs. an "unset" budget before the numbers are sourced. **Never fabricate a rule into logic.** |
| **OD-3** | Malice per-round gain = a **configurable value** (`malice.round_gain`, absent → manual-only); trigger gains stay manual labeled quick-adds. |
| **OD-4** | Sidebar ships **single-panel MVP**; `panels[]` is a list from day one so the GM dashboard is a pure additive follow-up. |
| **OD-5** | Encounter hand-off offers **both** "Create tracker block" (insert `ds-initiative`) and "Open in sidebar" (`addPanel`). |
| **OD-6** | Malice tracker is an **initiative sub-view** (single source of truth = the block's `malice`); a standalone `ds-malice` element is **deferred** (not in the 23→27 sweep), sharing the `{ value, log?, round? }` shape if ever built. |
| **OD-7** | Malice-feature spend reads the **existing `cost: "N Malice"` strings**, parsed `/^\s*(\d+)\s+Malice/i`; **no** cross-repo typed-field request. |
| **OD-8** | Party↔hero linkage is **ref-by-link** (`hero_ref` `[[wikilink]]`/scc); inline fields are the fallback. Coordinated key name = `hero_ref` (D7 contract). |
| **OD-9** | Sidebar block anchoring = a reserved YAML key **`_dse_anchor`** (round-trips via `serialize`, survives line drift, greppable) — never an Obsidian `^block-id`. |

**Goal:** Ship the GM subsystem suite on F1/D6: (1) a reusable **sidebar `ItemView` host** (`SidebarBlockHost` + `DseSidebarView`) that mounts any mode-agnostic F1 view as a note-navigation-surviving panel — the D7 hero-sheet consumer's dependency; (2) four new persisted elements — `ds-encounter`, `ds-montage`, `ds-project`, `ds-party`; (3) a first-class **Malice panel** + **turn/round economy** as *additive, byte-stable* initiative extensions.

**Architecture (the one-line shape):** the sidebar is the **third concrete `BlockHost`** — file-backed instead of `ctx`-backed — behind which the *unchanged* F1 views mount; the four trackers are thin `persisted` F1 elements cloning the `Counter`/`Negotiation` patterns, each with a byte-stable `serialize`; the encounter builder is a pure **consumer** of `CompendiumIndex.getStatblock`; the economy/malice work only **adds optional fields** to `EncounterData` and extends `InitiativeView`, leaving every existing serialize byte-identical.

**Tech Stack:** TypeScript (ES2018, CJS), Obsidian plugin API (`ItemView`, `WorkspaceLeaf`, `registerView`, `getRightLeaf`, `Vault.process`, `parseYaml`/`stringifyYaml`), `steel-compendium-sdk` 3.x (`Statblock`), the F1 framework (`ElementView`, `BlockHost`, `RenderContext`, `ElementPipeline`, `kit.stepper`/`cardHead`/`iconButton`/`tabs`, `RollService`), Jest 30 + ts-jest (`unit` node / `dom` jsdom projects; `test/mocks/obsidian-core.ts`; `test/fakes/fakeObsidian.ts`). No new runtime dependencies.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Worktree only.** All work in `/home/scott/code/steelCompendium/worktrees/f2` — never the shared main checkout. Every command runs from the worktree root as `devbox run -- bash -c 'cd draw-steel-elements && <cmd>'` (node/npm/just are not on the system PATH).
- **TDD, always.** Write the failing test first, watch it fail for the stated reason, implement, watch it pass. Per the exemplar (Plan 16) task shape.
- **Gates per task:** `npm run tsc` clean **and** full `npx jest` green. **Baseline is 1453 passing at `68ba54e`** — every task only adds. Whole-branch camera gates before landing: `npm run shots` and `npm run obsidian-shots` (Task 10) at their new counts.
- **No new runtime dependencies.** Obsidian API + the SDK + existing devDeps only. No new `dependencies` in `package.json`.
- **Mobile-safe:** no Node builtins (`fs`/`path`/`crypto` node module) in `src/` or `main.ts` (`isDesktopOnly: false` stays). Node APIs are allowed **in test files only**.
- **`autoResolveRefs` defaults OFF** — set it explicitly `false` on every new def (matches every existing def).
- **Persisted elements MUST have `serialize` + a byte-stable round-trip test.** The registry rejects a `persisted` def with no `serialize` (`registry.ts:129-132`). Every new persisted element ships a `test/unit/model/<el>-serialize.test.ts` proving `parse → serialize` is byte-stable on a realistic body (mirroring `initiative-serialize.test.ts` / `negotiation-serialize.test.ts`).
- **`EncounterData` serialization of EXISTING fields is frozen.** Task 9's new fields are **additive, optional, absent-defaulted**; `parse` must never materialize them when absent. **`test/unit/model/initiative-serialize.test.ts` stays green UNMODIFIED** — if a change would touch it, the change is wrong. (Self-review gate.)
- **Fixtures↔registry equality + `aliases.json` invariants** (`test/dom/visual-harness/fixtures.test.ts` count + `aliases.test.ts` deep-equal) **must be updated in the SAME commit** as each element registration. The current asserted count is **23**; this plan takes it to **27** (Task 4 →24, Task 6 →25, Task 7 →26, Task 8 →27).
- **Aliases are forever, canonical-only** (D6 OD-D6-3 precedent; spec §9): one alias per family — `ds-encounter`, `ds-montage`, `ds-project`, `ds-party`. No abbreviated aliases. Never rename or remove an alias once shipped.
- **Fixtures are REAL data-unified files** where an element resolves compendium data (encounter). Copy read-only from the **main workspace checkout** (the worktree `data/` is empty): source root `/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/`. `md-dse/` for by-SCC dom fixtures, `yaml/` for inline harness `example.yaml`. Self-authored trackers (party/montage/project/encounter working set) get a **realistic multi-entity** `example.yaml` per the `initiative/example.yaml` convention.
- **Commits:** conventional-commit style inside `draw-steel-elements`, one commit per task. **No AI/co-author attribution trailers.**
- **Stay in lane:** D8 consumes D6's `CompendiumIndex`/`getStatblock` and F1's pipeline/host seam; it does **not** redesign resolution, the manifest, the anchor-rewrite pass, or any existing `BlockHost`/pipeline signature. It adds one concrete `BlockHost` and four elements, and extends one element additively.
- **Assumed landed (verify in preflight):** the F1 framework (`registry.ts`, `view.ts`, `context.ts`, `pipeline.ts`, `kit`, `session.ts`, `host/BlockHost.ts` + `ReadingModeBlockHost.ts`), the D6 layer (`CompendiumIndex`, `typeAdapters`, `cx.compendium` seam), SDK 3.x `Statblock`, and the migrated `initiative`/`negotiation`/`counter` elements. Version is already **6.0.0** — this plan does not bump it.

---

## File Structure

```
draw-steel-elements/
  main.ts                                          MODIFY  registerView(DseSidebarView); register 4 new element defs;
                                                           add sidebar ribbon/commands; wire encounter hand-off
  src/
    framework/
      host/
        SidebarBlockHost.ts                        NEW     Task 2 — BlockHost, mode:"sidebar", file-backed
      sidebar/
        DseSidebarView.ts                          NEW     Task 2 — extends ItemView; owns N SidebarPanel
        SidebarPanel.ts                            NEW     Task 2 — Component: one mounted element + its host
        registration.ts                            NEW     Task 2 — registerView + ribbon + commands + "send to sidebar"
        anchor.ts                                  NEW     Task 2 — _dse_anchor stamping/lookup helpers (OD-9)
    drawSteelAdmonition/
      EncounterData.ts                             MODIFY  Task 9 — additive optional round/actions/malice.log|round_gain
    elements/
      initiative/
        model.ts                                   MODIFY  Task 9 — conditional-emit new economy fields (byte-stable)
        view.ts                                    MODIFY  Task 5/9 — Malice panel sub-view + per-actor action checklist
      encounter/
        model.ts  view.ts  definition.ts  budget.ts  example.yaml   NEW  Task 4 — ds-encounter
      montage/
        model.ts  view.ts  definition.ts  example.yaml
          + montage/{RoundTrackView,ParticipantsView}.ts           NEW  Task 6 — ds-montage
      project/
        model.ts  view.ts  definition.ts  example.yaml             NEW  Task 7 — ds-project
      party/
        model.ts  view.ts  definition.ts  example.yaml             NEW  Task 8 — ds-party
  visual-harness/
    entry.ts                                       MODIFY  FIXTURES +4 (encounter/montage/project/party): 23 → 27
    aliases.json                                   MODIFY  +4 primary aliases (same commit as each registration)
    obsidian-camera.mjs                            MODIFY  Task 3/10 — sidebar-leaf capture (investigate) + new element notes
  test/
    mocks/obsidian-core.ts                         MODIFY  Task 1 — ItemView lifecycle, WorkspaceLeaf, workspace/plugin view APIs
    mocks/obsidian-core.selftest.test.ts           NEW     Task 1 — pin the new mock surface
    dom/framework/sidebarBlockHost.test.ts         NEW     Task 2
    dom/framework/dseSidebarView.test.ts           NEW     Task 2
    dom/framework/sidebarInitiative.test.ts        NEW     Task 3 — initiative-in-sidebar e2e
    unit/model/encounter-serialize.test.ts         NEW     Task 4
    unit/elements/encounterBudget.test.ts          NEW     Task 4
    dom/elements/encounter.test.ts                 NEW     Task 4
    dom/elements/malicePanel.test.ts               NEW     Task 5
    unit/model/montage-serialize.test.ts           NEW     Task 6
    dom/elements/montage.test.ts                   NEW     Task 6
    unit/model/project-serialize.test.ts           NEW     Task 7
    dom/elements/project.test.ts                   NEW     Task 7
    unit/model/party-serialize.test.ts             NEW     Task 8
    dom/elements/party.test.ts                     NEW     Task 8
    unit/model/initiative-serialize.test.ts        UNCHANGED (must stay green — the freeze proof)
    unit/model/economy-serialize.test.ts           NEW     Task 9 — new fields absent → byte-identical; present → round-trips
    dom/elements/turnEconomy.test.ts               NEW     Task 9
    dom/visual-harness/fixtures.test.ts            MODIFY  count 23 → 24 → 25 → 26 → 27 (per registration commit)
  .repo-docs/integration.md                        MODIFY  Task 10 — sidebar host + D7 contract; 4 trackers; economy
  CHANGELOG.md                                     MODIFY  Task 10 — extend the 6.0.0 section (GM subsystems)
```

**Dependency order:** Task 1 (mocks) → 2 (sidebar host+view) → 3 (initiative-in-sidebar e2e) → 9 (economy fields — landed early so §5/§7 controls have their model) → 5 (Malice panel + action checklist) → { 6 (montage) ∥ 7 (project) ∥ 8 (party) — independent } → 4 (encounter — gated) → 10 (registration sweep + docs + gates). Tasks 6/7/8 are mutually independent once 1 lands; 4 is last because of the F2 gate.

> **Note on order vs. spec §8.2:** the spec recommends encounter LAST (gate) and sidebar FIRST — honored. Economy (Task 9) is pulled *ahead* of the Malice panel because the panel's round counter + spend log read the fields Task 9 adds; doing them together would blur the "existing-field freeze" proof, so the additive-schema commit lands first and standalone.

---

### Task 1: Obsidian mock extensions for sidebar `ItemView` work (test-only)

The sidebar host + view (Task 2) need Obsidian surfaces the mock does not yet have. Recon: `ItemView` is a bare stub (`obsidian-core.ts:744`, `getViewType` only), `App.workspace` has **only** `getActiveViewOfType` (`:265`), and `Plugin` has **no** `registerView` (`:397-440`). Extend all three, **test-only**, matching this file's established mock style (real jsdom `containerEl`, records-what-it's-asked, never simulates real Electron/CM6). Pin the surface with a self-test so a later drift breaks loudly. **No `src/` change in this task.**

**Files:**
- Modify: `test/mocks/obsidian-core.ts` (extend `ItemView`; add `WorkspaceLeaf`; widen the `App.workspace` object + add `Plugin.registerView`)
- Test: `test/mocks/obsidian-core.selftest.test.ts` (new — pins the mock)

**Interfaces (added to the mock, mirroring real Obsidian signatures):**
- `class WorkspaceLeaf` — `view: ItemView | null`; `containerEl: HTMLElement` (jsdom); `async setViewState(state: { type: string; active?: boolean }): Promise<void>` (constructs the registered view via the factory, calls its lifecycle); `getViewState()`; `detach(): void` (calls `view.onClose`, unregisters from the workspace).
- `class ItemView extends Component` — ctor `(leaf: WorkspaceLeaf)`; `leaf`; `containerEl: HTMLElement` with a real child `.view-content` (jsdom); `getViewType()`/`getDisplayText()`/`getIcon()` overridable; `async onOpen()`/`async onClose()` no-op defaults; `load()`/`unload()` inherited from `Component` (so `addChild` cascades — the sidebar relies on this).
- `App.workspace` widened to an object exposing: `getActiveViewOfType` (unchanged), `getRightLeaf(_split: boolean): WorkspaceLeaf` (returns a fresh leaf tracked in `_leaves`), `getLeavesOfType(type: string): WorkspaceLeaf[]`, `revealLeaf(leaf: WorkspaceLeaf): void` (records the reveal; sets `_activeLeaf`), `detachLeavesOfType(type: string): void` (detaches each matching leaf), and an internal `_viewFactories: Map<string, (leaf) => ItemView>` populated by `Plugin.registerView`.
- `Plugin.registerView(type: string, factory: (leaf: WorkspaceLeaf) => ItemView): void` — stores the factory on `this.app.workspace._viewFactories` (real Obsidian registers on the workspace + auto-detaches on unload; the mock records the factory and detaches on `Plugin.unload`).

- [ ] **Step 1: Write the failing self-test**

Create `test/mocks/obsidian-core.selftest.test.ts` (jsdom):

```ts
/** @jest-environment jsdom */
import { App, Plugin, ItemView, WorkspaceLeaf, Component } from "./obsidian-core";

const VIEW = "dse-test-view";

class ProbeView extends ItemView {
    opened = 0; closed = 0;
    getViewType() { return VIEW; }
    getDisplayText() { return "Probe"; }
    async onOpen() { this.opened++; this.containerEl.querySelector(".view-content")!.textContent = "up"; }
    async onClose() { this.closed++; }
}

function setup() {
    const app = new App();
    const plugin = new Plugin(app);
    plugin.registerView(VIEW, (leaf: WorkspaceLeaf) => new ProbeView(leaf));
    return { app, plugin };
}

describe("obsidian-core mock: ItemView/WorkspaceLeaf/workspace view APIs (D8 Task 1)", () => {
    test("registerView + getRightLeaf + setViewState constructs and opens the view", async () => {
        const { app } = setup();
        const leaf = app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW, active: true });
        const view = leaf.view as ProbeView;
        expect(view).toBeInstanceOf(ProbeView);
        expect(view.opened).toBe(1);
        expect(view.containerEl.querySelector(".view-content")!.textContent).toBe("up");
    });
    test("getLeavesOfType finds the open leaf; revealLeaf records it", async () => {
        const { app } = setup();
        const leaf = app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW });
        app.workspace.revealLeaf(leaf);
        expect(app.workspace.getLeavesOfType(VIEW)).toEqual([leaf]);
    });
    test("detachLeavesOfType calls onClose and removes the leaf", async () => {
        const { app } = setup();
        const leaf = app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW });
        const view = leaf.view as ProbeView;
        await app.workspace.detachLeavesOfType(VIEW);
        expect(view.closed).toBe(1);
        expect(app.workspace.getLeavesOfType(VIEW)).toEqual([]);
    });
    test("ItemView is a Component — addChild cascades unload", async () => {
        const { app } = setup();
        const leaf = app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW });
        const view = leaf.view as ItemView;
        let unloaded = false;
        const child = new (class extends Component { onunload() { unloaded = true; } })();
        view.addChild(child);
        await app.workspace.detachLeavesOfType(VIEW);
        expect(unloaded).toBe(true);
    });
    test("plugin.unload detaches its registered views", async () => {
        const { app, plugin } = setup();
        const leaf = app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW });
        const view = leaf.view as ProbeView;
        plugin.unload();
        expect(view.closed).toBe(1);
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/mocks/obsidian-core.selftest.test.ts'
```
Expected: FAIL — `WorkspaceLeaf` not exported; `ItemView` has no `containerEl`/`onOpen`; `workspace.getRightLeaf`/`registerView` don't exist.

- [ ] **Step 3: Extend the mock**

Replace the stub `ItemView` (`:744`) and widen `App`/`Plugin`. Sketch (adapt to the file's jsdom `createDiv`/`createEl` helpers, already present — `Modal`'s mock uses them):

```ts
export class WorkspaceLeaf {
    view: ItemView | null = null;
    containerEl: HTMLElement = document.createElement("div");
    private state: { type: string; active?: boolean } = { type: "empty" };
    constructor(private workspace: FakeWorkspace) {}
    async setViewState(state: { type: string; active?: boolean }): Promise<void> {
        if (this.view) { await this.view.onClose(); this.view.unload(); }
        this.state = state;
        const factory = this.workspace._viewFactories.get(state.type);
        this.view = factory ? factory(this) : null;
        if (this.view) { this.view.load(); await this.view.onOpen(); this.workspace._track(state.type, this); }
    }
    getViewState() { return this.state; }
    async detach(): Promise<void> {
        if (this.view) { await this.view.onClose(); this.view.unload(); }
        this.workspace._untrack(this);
        this.view = null;
    }
}

export class ItemView extends Component {
    containerEl: HTMLElement;
    constructor(public leaf: WorkspaceLeaf) {
        super();
        this.containerEl = document.createElement("div");
        (this.containerEl as any).createDiv({ cls: "view-content" });
    }
    getViewType(): string { return "fake-item-view"; }
    getDisplayText(): string { return ""; }
    getIcon(): string { return "document"; }
    async onOpen(): Promise<void> {}
    async onClose(): Promise<void> {}
}
```

Add a `FakeWorkspace` class holding `_viewFactories: Map`, `_leaves: WorkspaceLeaf[]`, `_activeLeaf`, plus `getActiveViewOfType` (KEEP the existing `null` semantics), `getRightLeaf(_split) → new WorkspaceLeaf(this)`, `getLeavesOfType(type) → _leaves.filter(l => l.getViewState().type === type)`, `revealLeaf(leaf) → { this._activeLeaf = leaf }`, `async detachLeavesOfType(type) → for each match, await leaf.detach()`, and `_track`/`_untrack`. Set `App.workspace = new FakeWorkspace()`. Add `Plugin.registerView(type, factory)` storing into `this.app.workspace._viewFactories` and `this.register(() => void this.app.workspace.detachLeavesOfType(type))`.

> **Verify** every existing consumer of the old plain-object `workspace` still compiles (only `getActiveViewOfType` was exposed — keep it identical). Run the FULL suite in Step 4, not just the self-test.

- [ ] **Step 4: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/mocks/obsidian-core.selftest.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add test/mocks/obsidian-core.ts test/mocks/obsidian-core.selftest.test.ts
git -C draw-steel-elements commit -m "test(mocks): ItemView lifecycle + WorkspaceLeaf + workspace/plugin view APIs for sidebar (D8 Task 1)"
```

---

### Task 2: `SidebarBlockHost` + `DseSidebarView` — the reusable sidebar framework (spec §1)

The one genuinely new subsystem. A **third concrete `BlockHost`** (file-backed, `mode: "sidebar"`) plus the `ItemView` shell that owns N `SidebarPanel` children, each mounting an F1 element **unchanged** through the `ElementPipeline`. The note is still the database (spec §1.4/§1.7): the panel persists through `Vault.process` on the *backing file directly by path*, so it keeps writing correctly no matter which note is focused. Block identity is re-derived from a durable `_dse_anchor` YAML key (OD-9), not `getSectionInfo`. `framework/host/` + `framework/sidebar/` live **inside** `src/framework/`, so the F1 OD-8 import boundary still forbids `src/elements/*` imports — the sidebar mounts elements only through the registry/pipeline.

**Files:**
- Create: `src/framework/host/SidebarBlockHost.ts`, `src/framework/sidebar/DseSidebarView.ts`, `src/framework/sidebar/SidebarPanel.ts`, `src/framework/sidebar/registration.ts`, `src/framework/sidebar/anchor.ts`
- Modify: `main.ts` (Task 10 wires `registerView` + commands; a minimal wire here to prove production registration compiles — see Step 6)
- Test: `test/dom/framework/sidebarBlockHost.test.ts`, `test/dom/framework/dseSidebarView.test.ts`

**Interfaces:**
- `anchor.ts`: `function ensureAnchor(body: string): { body: string; id: string }` (finds an existing `_dse_anchor:` line or appends one with a fresh 6-hex id); `function readAnchor(body: string): string | null`; `function findAnchoredBlock(content: string, alias: string, id: string): BlockInfo | null` (scans for the ```` ```<alias> ```` fence whose body contains `_dse_anchor: <id>`, returns `{ language, lineStart, lineEnd }`). Ids come from a small non-crypto generator (`Math.random().toString(16)` slice — mobile-safe, no `crypto` node module).
- `SidebarBlockHost.ts`: `class SidebarBlockHost implements BlockHost` — ctor `(plugin: Plugin, backingFile: TFile, alias: string, anchorId: string, containerEl: HTMLElement, owner: Component, onExternalChange: (body: string) => void)`. `mode = "sidebar"`; `sourcePath = backingFile.path`; `canPersist` = `findAnchoredBlock(...) !== null` (re-scanned live); `getBlockInfo()` scans the file cache; `replaceSource` does the atomic `Vault.process` splice on `backingFile`; `blockKey()` = `${filePath}::${alias}::${anchorId}`; `addChild` proxies to `owner`. Owns the `vault.on("modify")` refresh + self-echo guard (§1.6).
- `SidebarPanel.ts`: `class SidebarPanel extends Component` — ctor `(cx-less: { plugin, app, pipeline, registry, backingFile, state: SidebarPanelState })`; `async mount(container: HTMLElement)` resolves the def via `registry.get(alias)`, builds a `SidebarBlockHost`, reads the anchored block body, drives it through the pipeline's single-block render path, and installs the read-only degrade card when `!canPersist`.
- `DseSidebarView.ts`: `VIEW_TYPE_DSE_SIDEBAR = "dse-sidebar"`; `interface SidebarPanelState { filePath: string; alias: string; anchorId: string; collapsed?: boolean }`; `interface DseSidebarState { panels: SidebarPanelState[] }`; `class DseSidebarView extends ItemView` with `getViewType`/`getDisplayText` (`"Draw Steel"`)/`getIcon` (`"swords"`), `onOpen`/`onClose`, `getState`/`setState` (workspace-serialized → survives restart), `addPanel(state): SidebarPanel`, `removePanel(panel)`.
- `registration.ts`: `function registerDseSidebar(plugin, services): void` — `plugin.registerView(VIEW_TYPE_DSE_SIDEBAR, leaf => new DseSidebarView(leaf, services))`, a ribbon icon, and the two commands **"Open Draw Steel sidebar"** (`getRightLeaf(false)` → `setViewState` → `revealLeaf`) and **"Send block to sidebar"** (§1.7). `function sendToSidebar(services, filePath, alias): Promise<void>` — the shared "bind a block" entry point D7/encounter reuse.

- [ ] **Step 1: Failing test — the file-backed persistence crux**

Create `test/dom/framework/sidebarBlockHost.test.ts` (jsdom, `fakeObsidian` vault). Seed a note containing a persisted block (`ds-counter` is the simplest persisted element — one stepper) with an `_dse_anchor`, then:
- `getBlockInfo()` locates the anchored fence by id even after **prepending unrelated lines** to the note (line drift) — the id, not a cached `lineStart`, finds it.
- `replaceSource("current_value: 5\n...")` writes byte-stably: re-read the note, the block body changed, fences + alias preserved, no spurious blank line before the close fence.
- After the anchored block is **deleted from the note**, `canPersist` flips to `false` and `replaceSource` resolves `false` (never throws).
- A `vault.on("modify")` from an *external* edit calls `onExternalChange` with the new body; a `modify` caused by the host's **own** `replaceSource` does **not** (self-echo guard — the host stamps the last body it wrote).

```ts
/** @jest-environment jsdom */
import * as path from "path";
import { SidebarBlockHost } from "@/framework/host/SidebarBlockHost";
import { Component } from "obsidian";
import { makeFakeApp, seedNote } from "../../fakes/fakeObsidian";
// … construct plugin+file, an anchored ```ds-counter fence body, wire the host …
```

- [ ] **Step 2: Failing test — the view owns panels**

Create `test/dom/framework/dseSidebarView.test.ts` (jsdom, uses the Task 1 mocks). Register `DseSidebarView`, open it via `getRightLeaf`, `addPanel({ filePath, alias:"ds-counter", anchorId })`, and assert: a `.dse-sidebar__panel` mounts with the counter's `[data-dse-element="counter"]` inside; `getState()` returns the panel list; a fresh view `setState(saved)` re-mounts the same panels (restart survival); `removePanel` tears the panel + host down (the counter's `onunload` fires — reuse the Component-cascade proof from Task 1); `onClose` cascades teardown of all panels.

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework/sidebarBlockHost.test.ts test/dom/framework/dseSidebarView.test.ts'
```
Expected: FAIL — modules do not exist.

- [ ] **Step 4: Implement `anchor.ts` + `SidebarBlockHost`**

`SidebarBlockHost.replaceSource` mirrors `ReadingModeBlockHost.replaceSource` **exactly** (atomic `Vault.process`; re-parse the fence run + language live; splice `getBlockInfo()`'s line range; preserve fence chars + alias; trim the body so no blank line precedes the close fence) — the ONE difference is that it addresses `this.backingFile` by path rather than `ctx.sourcePath`, and locates the block via `findAnchoredBlock` rather than `ctx.getSectionInfo`. Self-echo: keep `private lastWritten: string | null`; set it to the trimmed body just before `process`; in the `modify` handler, if the freshly-read anchored body `=== lastWritten`, return without calling `onExternalChange`.

```ts
export class SidebarBlockHost implements BlockHost {
    readonly mode: RenderMode = "sidebar";
    private lastWritten: string | null = null;
    constructor(
        private plugin: Plugin, private backingFile: TFile, private alias: string,
        private anchorId: string, readonly containerEl: HTMLElement,
        private owner: Component, private onExternalChange: (body: string) => void,
    ) {
        this.plugin.registerEvent(this.plugin.app.vault.on("modify", (f) => {
            if (f.path !== this.backingFile.path) return;
            void this.handleExternalModify();
        }));
    }
    get sourcePath(): string { return this.backingFile.path; }
    get canPersist(): boolean { return this.getBlockInfo() !== null; }
    addChild<T extends Component>(child: T): T { return this.owner.addChild(child); }
    getBlockInfo(): BlockInfo | null {
        const content = this.readCachedSync();               // cachedRead-backed snapshot
        return content === null ? null : findAnchoredBlock(content, this.alias, this.anchorId);
    }
    async replaceSource(newSource: string): Promise<boolean> { /* Vault.process splice; set lastWritten */ }
    blockKey(): string { return `${this.backingFile.path}::${this.alias}::${this.anchorId}`; }
    private async handleExternalModify(): Promise<void> { /* re-read anchored body; if === lastWritten skip; else onExternalChange(body) */ }
}
```

> `getBlockInfo` needs synchronous content; `Vault.process`/`cachedRead` are async. Resolve by keeping a cached content string the `modify` handler refreshes (seeded on mount via one `await vault.cachedRead`), so `canPersist`/`getBlockInfo` read the last-known content synchronously — the real vault's `metadataCache` gives the same "last parsed" guarantee. Document this as the sidebar's analogue of reading-mode's `getSectionInfo` snapshot.

- [ ] **Step 5: Implement `SidebarPanel` + `DseSidebarView` + `registration.ts`**

`SidebarPanel.mount`: `const def = registry.get(state.alias)`; read the backing file, `findAnchoredBlock` → extract the body; build the `SidebarBlockHost` (its `onExternalChange` calls `def`'s view `update(newModel)` — F1 `onUpdate` in-place path, §1.6; the sidebar is the **first real consumer of `onUpdate`**); drive `def.parse` → `def.resolveRefs?` → `createView` → `mount` through the **existing** pipeline single-block entry (reuse whatever `ElementPipeline` exposes for "render this def+source into this host"; if the only entry is the markdown-postprocessor path, factor a thin `pipeline.renderInto(host, def, body)` that the reading-mode processor already calls internally — verify and reuse, do not fork the render logic). When `host.canPersist === false`, render the F1 read-only degrade (the "backing block not found — re-link" notice, mirroring §1.5 / F1 §4.4).

`DseSidebarView`: `onOpen` rebuilds panels from `this.state`; `getState`/`setState` serialize `panels[]`; `addPanel` pushes state, constructs a `SidebarPanel` as a child (Component cascade), mounts it into a `.dse-sidebar__panel` div; `removePanel` calls `this.removeChild(panel)` (→ `unload` → host + view teardown). MVP renders one panel (OD-4); the `panels[]` list keeps the dashboard additive.

`registration.ts`: `registerDseSidebar` does `registerView`, ribbon, and the two commands; `sendToSidebar(services, filePath, alias)` ensures a `_dse_anchor` in the target block (read → `ensureAnchor` → write back via `Vault.process` if it added one), then finds/opens the sidebar leaf (`getLeavesOfType(VIEW_TYPE_DSE_SIDEBAR)[0]` or a fresh `getRightLeaf`), and calls `view.addPanel({ filePath, alias, anchorId })`.

- [ ] **Step 6: Minimal main.ts wire (compile-proof) + run + commit**

Add `registerDseSidebar(this, <services>)` inside `onload` after the framework is initialized (full command/ribbon polish is Task 10). Confirm the import-boundary lint still passes (no `src/elements/*` import from `framework/sidebar/`).

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework/sidebarBlockHost.test.ts test/dom/framework/dseSidebarView.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/framework/host/SidebarBlockHost.ts src/framework/sidebar main.ts test/dom/framework/sidebarBlockHost.test.ts test/dom/framework/dseSidebarView.test.ts
git -C draw-steel-elements commit -m "feat: SidebarBlockHost + DseSidebarView reusable sidebar host (spec §1, OD-1/4/9)"
```

---

### Task 3: Initiative-in-sidebar end-to-end (spec §1's canonical use)

The running-session tracker: open a note's `ds-initiative` block as a sidebar leaf, **same view code unchanged**, persistence flowing to the backing note, surviving note navigation, with the read-only degrade path. This is the acceptance proof that the sidebar is element-agnostic (the D7 contract, §1.9). No new production code beyond wiring the `initiative` alias through `sendToSidebar` — the point is that Task 2's host mounts the *unmodified* `InitiativeView`.

**Files:**
- Modify: `main.ts` (register a "Send initiative to sidebar" affordance — folds into Task 10's command sweep; a thin wire here proves the path)
- Modify (investigate): `visual-harness/obsidian-camera.mjs` (a sidebar-leaf capture, if the camera can host it)
- Test: `test/dom/framework/sidebarInitiative.test.ts`

- [ ] **Step 1: Failing e2e test**

Create `test/dom/framework/sidebarInitiative.test.ts` (jsdom). Seed a note `Session.md` containing a realistic `ds-initiative` block (copy the body of `src/elements/initiative/example.yaml`) with an `_dse_anchor`. Then:
1. **Open in sidebar:** `sendToSidebar(services, "Session.md", "ds-initiative")` → the sidebar leaf mounts a `SidebarPanel` whose subtree contains `[data-dse-element="initiative"]` with the hero rows and the Malice stepper (the *same* `InitiativeView`).
2. **Persistence flows to the backing note:** drive the malice stepper's `onChange` (or click the +) → after the 400ms debounce flush (advance jest timers), re-read `Session.md`: the `ds-initiative` block body now has the incremented `malice.value`, and **every other line of the note is byte-identical** (fence + alias preserved).
3. **Survives note navigation:** simulate the active markdown leaf switching to a different note (the sidebar leaf is independent — set `workspace._activeLeaf` to another leaf); the panel still persists correctly on a second stepper change, because `SidebarBlockHost` addresses `Session.md` by path, not via any active `ctx`.
4. **Read-only degrade:** delete the anchored block from `Session.md`; trigger the panel's refresh → the panel renders the "backing block not found — re-link" read-only notice and a subsequent stepper interaction no-ops (`canPersist === false`, `replaceSource → false`).
5. **`onUpdate` live refresh:** externally edit `Session.md`'s block (change a hero's stamina), fire `vault.on("modify")` → the panel calls `view.update(newModel)` (in-place, no full rebuild — assert the root element identity is stable) and the DOM reflects the new stamina.

- [ ] **Step 2: Run to verify failure, then confirm it passes with ZERO InitiativeView changes**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework/sidebarInitiative.test.ts'
```
If this needs any edit to `src/elements/initiative/view.ts`, the sidebar host is **not** truly mode-agnostic — stop and fix the host, not the view. The only permitted initiative edits in the whole plan are Tasks 5/9 (malice panel + economy), which are unrelated to mounting.

- [ ] **Step 3: obsidian-camera sidebar-leaf capture (investigate F5 window handling)**

The `obsidian-camera.mjs` (F5) opens `demo-vault/Harness/<element>.md` in **reading mode** and clip-screenshots `[data-dse-element]` over the theme×bg matrix via raw CDP `Runtime.evaluate` + `Page.captureScreenshot`. A sidebar leaf is a different surface (an `ItemView` leaf, not a reading-mode markdown leaf). **Investigate:** whether the camera can, via one extra `Runtime.evaluate`, invoke the **"Open Draw Steel sidebar"** command (`app.commands.executeCommandById(...)`), `addPanel` the demo `ds-initiative` note, wait for `.dse-sidebar__panel [data-dse-element="initiative"]`, and clip-screenshot the leaf's `containerEl`.
- **If feasible:** add ONE ground-truth shot `initiative--obsidian-sidebar-steel-dark.png`, bumping the obsidian-shots count by 1 (record the new N in Task 10). This is the sidebar analogue of D6's by-SCC recursion ground-truth shot.
- **If not feasible** (right-split geometry not deterministic under the headless `--user-data-dir`, or the leaf clip is unstable): document exactly why in a code comment + the plan ledger, and fall back to the **jest-level proof** (Steps 1–2 already exercise the full mount→persist→navigate→degrade→onUpdate path in jsdom). Do not block the task on the camera — the jsdom e2e is the binding acceptance gate; the camera shot is corroborating.

- [ ] **Step 4: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/framework && npm test && npm run tsc'
git -C draw-steel-elements add test/dom/framework/sidebarInitiative.test.ts main.ts visual-harness/obsidian-camera.mjs
git -C draw-steel-elements commit -m "feat: initiative-in-sidebar e2e (persist/navigate/degrade/onUpdate) + camera investigation (spec §1)"
```

---

### Task 4: `ds-encounter` — Encounter Builder (spec §2)

> **HARD-GATED (spec §8.3):** needs F2 OD-1 (`ds-sb` in md-dse) + a data-unified release + D6 `CompendiumIndex.getStatblock`. Develop against the hand-cut release; **do not ship** until the gate clears. Executes LAST of the trackers.

A `persisted` element: the GM saves a planned encounter; the budget is computed **live** from real compendium `ev`. The builder never parses statblock files — it holds SCC codes and resolves each through `cx.compendium.getStatblock(code)` (the D6 seam). **`ev` is a STRING** on the model (recon delta 5) → parse defensively. Budget/difficulty/XP use **parameterized tables** with flagged defaults (OD-2). `_computed` is a display cache, never authoritative (spec §2.5).

**Files:**
- Create: `src/elements/encounter/model.ts`, `budget.ts`, `view.ts`, `definition.ts`, `example.yaml`
- Test: `test/unit/model/encounter-serialize.test.ts`, `test/unit/elements/encounterBudget.test.ts`, `test/dom/elements/encounter.test.ts`

**Schema (verbatim from spec §2.5):**

```yaml
# ds-encounter
party:
  hero_count: 4
  hero_level: 3
  victories: 1
  party_ref: "[[Party]]"          # optional
monsters:
  - code: "scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-cutter"
    count: 6
    squad: minion                 # optional; defaults from resolved role
  - code: "scc.v1:mcdm.monsters.v1/monster.dragon.statblock/crucible-dragon"
    count: 1
label: "Ambush at the ford"
_dse_anchor: 8f3a1c
_computed: { spent_ev: 44, budget: 40, ratio: 1.1, band: hard, victories: 2 }
```

**Interfaces:**
- `model.ts`: `interface EncounterParty { hero_count?: number; hero_level?: number; victories?: number; party_ref?: string }`; `interface EncounterRow { code: string; count: number; squad?: "minion" | "captain" }`; `interface EncounterComputed { spent_ev: number; budget: number | null; ratio: number | null; band: string | null; victories: number }`; `interface EncounterModel { party: EncounterParty; monsters: EncounterRow[]; label?: string; _dse_anchor?: string; _computed?: EncounterComputed }`. `parse(input, raw)` validates shape (monsters is a list; each row has `code` + numeric `count`), preserving unknown keys (so `_dse_anchor` round-trips); `serialize = stringifyYaml(model).trim()`.
- `budget.ts`: the pure, testable math (no DOM, no async):
  - `function parseEv(ev: string | number | undefined): number` — `/(-?\d+)/` first-integer parse; non-numeric/absent → `0`. (Defensive per recon delta 5.)
  - `const DEFAULT_BUDGET_TABLE` / `const DEFAULT_BAND_TABLE` — data-driven, each entry commented `// verify against Draw Steel core rules` (OD-2). `budgetTable(heroCount, heroLevel): number | null` (null = "unset — configure in settings"). `bandTable(ratio): string`.
  - `function spentEv(rows: { count: number; ev: string | number }[]): number` = `Σ count × parseEv(ev)`.
  - `function victoryPayout(band: string | null): number` = `band ∈ {hard, extreme} ? 2 : 1` (citable — REF §13, AGENT Part 12).
  - `function computeEncounter(rows, party, tables): EncounterComputed`.
- `view.ts`: `class EncounterView extends ElementView<EncounterModel>` — async `onMount` resolves each row via `cx.compendium?.getStatblock(code)` (parallel `Promise.all`), builds the roster table (name/role/organization/count/per-row EV), computes budget/ratio/band/payout, renders the summary bar, **rewrites `_computed`** and persists it (recompute-wins), and offers the two hand-off actions (OD-5). Unresolved code / no compendium → the row shows "unresolved — sync compendium" and is excluded from EV (defensive). Read-only when `!canPersist`.

- [ ] **Step 1: Copy real fixtures + write the budget unit test (pure math first)**

```bash
cd draw-steel-elements
S=/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified
mkdir -p test/fixtures/md-dse/monster/goblin/statblock
cp "$S/md-dse/monster/goblin/statblock/goblin-cutter.md" test/fixtures/md-dse/monster/goblin/statblock/ 2>/dev/null \
  || cp "$S/md-dse/monster/goblin/statblock/"goblin-*.md test/fixtures/md-dse/monster/goblin/statblock/
```
> Verify the exact goblin md-dse filenames under the workspace checkout before copying (the D6 fixture set already includes `goblin-stinker.md`; reuse it if `goblin-cutter` is absent). Never hand-write a statblock fixture.

Create `test/unit/elements/encounterBudget.test.ts`: `parseEv("40")` → 40, `parseEv("~120 (minion)")` → 120, `parseEv(undefined)` → 0; `spentEv([{count:6,ev:"4"},{count:1,ev:"20"}])` → 44; `victoryPayout("hard")` → 2, `victoryPayout("standard")` → 1, `victoryPayout(null)` → 1; `budgetTable` returns a number for a known cell and `null` for an unconfigured one; `bandTable(1.1)` returns the documented band; `computeEncounter` assembles the whole `EncounterComputed`.

- [ ] **Step 2: Write the serialize + dom tests**

`test/unit/model/encounter-serialize.test.ts`: `parse → serialize` byte-stable on the `example.yaml` body; `_dse_anchor` and an unknown key survive the round-trip; `_computed` present in the input round-trips (it is a stored cache).

`test/dom/elements/encounter.test.ts` (jsdom, `_refHarness` seeded with the goblin fixture + a live `CompendiumIndex`): render the example body → the roster resolves the goblin row via `getStatblock`, the summary shows spent EV (= `count × parseEv(ev)`), and — with a configured `budgetTable` cell — a band + victory payout; with an **unconfigured** budget, the summary shows spent EV and "budget unset — configure in settings" (tool still useful, OD-2); an **unresolvable** code shows the per-row degrade and is excluded from EV; the "Create tracker block" and "Open in sidebar" actions exist and are gated on `canPersist`.

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/elements/encounterBudget.test.ts test/unit/model/encounter-serialize.test.ts test/dom/elements/encounter.test.ts'
```

- [ ] **Step 4: Implement `budget.ts` → `model.ts` → `view.ts` → `definition.ts` + hand-off**

The hand-off maps rows → `EncounterData` (spec §2.4): each row → an `enemy_groups[]` entry with `creatures: [{ name, amount: count, max_stamina: parseInt(statblock.stamina), squad_role?, statblock: "scc.v1:<code>" }]`, `is_squad` from `role === "MINION"` or user grouping; minion rows produce the squad shape `parseEncounterData` validates (≤2 creatures, one minion type, ≤1 captain — recon: `EncounterData.ts:176-208`). Emit the SCC ref (not inlined stats) so the tracker stays live. **"Create tracker block"** inserts/replaces a `ds-initiative` block in a chosen note; **"Open in sidebar"** calls `sendToSidebar` (Task 2) with the freshly written block. `definition.ts`: `id:"encounter"`, `aliases:["ds-encounter"]`, `shape:"persisted"`, `autoResolveRefs:false`, `parse`/`serialize`, `createView`, `authoring:{ example }`.

- [ ] **Step 5: Register + wire harness (SAME commit) — 23 → 24**

`main.ts`: `registry.register(encounterElement)`. `visual-harness/entry.ts`: import `encounter/example.yaml`, add `encounter` to FIXTURES. `visual-harness/aliases.json`: `"encounter": "ds-encounter"`. `test/dom/visual-harness/fixtures.test.ts`: 23 → 24.

- [ ] **Step 6: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/elements/encounterBudget.test.ts test/unit/model/encounter-serialize.test.ts test/dom/elements/encounter.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/encounter main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/elements/encounterBudget.test.ts test/unit/model/encounter-serialize.test.ts test/dom/elements/encounter.test.ts test/fixtures/md-dse/monster
git -C draw-steel-elements commit -m "feat: ds-encounter builder — live EV budget via CompendiumIndex.getStatblock + initiative hand-off (spec §2, OD-2/5)"
```

---

### Task 5: Malice tracker — first-class initiative sub-view (spec §3)

> **Executes AFTER Task 9** (it reads `malice.round_gain`, `malice.log`, and the `round` counter that Task 9 adds). **OD-6:** the Malice tracker is an **initiative sub-view** (single source of truth = the block's `malice`) — **no new element, no new alias, no fixtures-count change.** A standalone `ds-malice` element is deferred.

Two deliverables (spec §3.1). Deliverable **1 (Malice panel)** is F1-only and ships now. Deliverable **2 (spendable monster malice features)** is **HARD-gated** on F2 OD-1 + D6 (same gate as Task 4) — layered on once monsters resolve.

**Files:**
- Modify: `src/elements/initiative/view.ts` (replace the bare ± widget `:185-208` with the Malice panel sub-view)
- Test: `test/dom/elements/malicePanel.test.ts`

- [ ] **Step 1: Failing test — the panel (Deliverable 1)**

Create `test/dom/elements/malicePanel.test.ts` (jsdom, initiative pipeline harness). Render a `ds-initiative` block and assert the Malice surface now shows: the current pool via a **keyboard-accessible kit `stepper`** (clone the `Counter` view pattern — `editable: canWrite`, `integer:true`, `onChange → mutate + persist()`), replacing today's click-only `div`s; an **"Advance round"** button that increments `round` (Task 9 field), clears `has_taken_turn` + per-actor `actions`, and **adds `malice.round_gain`** to the pool (absent `round_gain` → no auto-gain, manual only, OD-3); a **spend log** rendering `malice.log` entries `{ round, amount, label }`; and a labeled **quick-add** for trigger-based gains (e.g. "+3 Feytouched") that appends to the log. When `!canWrite`, all controls are inert (static value), matching the existing read-only contract. Assert byte-stable persistence: a stepper change flushes to the block and the log/round survive round-trip.

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/malicePanel.test.ts'
```

- [ ] **Step 3: Implement the panel** — extract a `buildMalicePanel(container, data, owner)` helper in `InitiativeView` (replacing the `:185-208` inline widget). Reuse `stepper` (like `counter/view.ts`), `iconButton` for "Advance round" (shared with the Task 9 round control — call the same `advanceRound()` method so the two surfaces can't diverge), and a simple list for `malice.log`. All new writes go through the existing `persist()` (400ms debounce) / `rebuildAndPersist()` paths — no new write machinery. **The `round` increment / turn reset live in Task 9's `advanceRound()`**; this task only surfaces it and wires the gain + log.

- [ ] **Step 4 (GATED — F2 OD-1 + D6): spendable monster malice features (Deliverable 2)**

For each distinct monster in the encounter (from `enemy_groups[].creatures[].statblock` SCC refs), resolve its malice features via D6/F2 and render spend buttons (spec §3.2, OD-7):
- Follow the statblock's SCC group segment to the `<group>-malice` code (e.g. `mcdm.monsters.v1/monster.goblin/goblin-malice`) and resolve it via `cx.compendium.getEntity(code)` → its `features[]`;
- **plus** scan the resolved statblock's own `features[]` for `cost` matching `/^\s*(\d+)\s+Malice/i`.
- Render `<name> (N)` buttons, **enabled only when `pool ≥ N`**; on click, `pool -= N` and append `{ round, amount: N, label: name }` to `malice.log`. Parse `N` defensively from the `cost` STRING (recon delta 5 — no typed `cost` field). Add a gated dom test (seeded with a `goblin-malice` md-dse fixture) asserting a spend deducts and logs. This step is committed separately if the gate is not yet clear at Task 5 time; otherwise fold into the Step 5 commit.

- [ ] **Step 5: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/malicePanel.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/initiative/view.ts test/dom/elements/malicePanel.test.ts
git -C draw-steel-elements commit -m "feat: first-class Malice panel initiative sub-view (round gain, spend log, a11y stepper) (spec §3, OD-3/6)"
```

---

### Task 6: `ds-montage` — Montage Test tracker (spec §4)

A `persisted` element, **sibling to Negotiation** (mirror the F1 `src/elements/negotiation/` decomposition — recon delta 8: `cardHead` + `iconButton` reset menu + `tabs` + sub-views under the element dir, **not** the stale `src/drawSteelAdmonition/negotiation/`). **No compendium dep.** Rules fully citable (AGENT 89-98; REF §7).

**Files:**
- Create: `src/elements/montage/model.ts`, `view.ts`, `definition.ts`, `example.yaml`, `RoundTrackView.ts`, `ParticipantsView.ts`
- Test: `test/unit/model/montage-serialize.test.ts`, `test/dom/elements/montage.test.ts`

**Schema (verbatim from spec §4.2):**

```yaml
# ds-montage
title: "Cross the Ashfall Wastes"
rounds: 2
success_limit: 5
failure_limit: 3
successes: 0
failures: 0
participants:
  - name: "Kira"
    skills_used: ["Nature", "Endurance"]
current_round: 1
_dse_anchor: 4c19ff
```

**Interfaces:**
- `model.ts`: `interface MontageParticipant { name: string; skills_used: string[] }`; `interface MontageModel { title?: string; rounds: number; success_limit: number; failure_limit: number; successes: number; failures: number; participants?: MontageParticipant[]; current_round: number; _dse_anchor?: string }`. `parse` defaults `rounds:2`, counters `0`, `current_round:1` (only when the input omits them — do **not** materialize keys the input already fixes, to keep serialize honest); `serialize = stringifyYaml(model).trim()`.
- `function montageOutcome(m: MontageModel): "total" | "partial" | "failure"` (pure, tested): total = `successes ≥ success_limit`; partial = time/failures exhausted but `successes − failures ≥ 2`; failure otherwise (AGENT 96). **Derived, never stored** (spec §4.2).
- `view.ts`: `cardHead(title)` + reset `iconButton`/`Menu` (canPersist-gated, negotiation pattern); `RoundTrackView` = steppers for `successes`/`failures` + a live outcome-band readout (recomputed via `montageOutcome`) + round `current_round`/`rounds`; `ParticipantsView` = per-hero "record test" that appends the used skill to `skills_used` and **warns** (not blocks) on reuse (AGENT 94). If D5's Power Roll roller exists a test row can invoke `RollService.resolve` (2d10 + characteristic, +2 skill); otherwise results are entered manually.

- [ ] **Step 1: Failing serialize + outcome unit test**

`test/unit/model/montage-serialize.test.ts`: byte-stable `parse → serialize` on `example.yaml`; `montageOutcome` for the three bands (total at limit; partial when `successes − failures ≥ 2` with failures at limit; failure otherwise); `_dse_anchor` round-trips.

- [ ] **Step 2: Failing dom test**

`test/dom/elements/montage.test.ts` (jsdom): render `example.yaml` → title, success/failure steppers, live outcome readout; step successes to `success_limit` → readout flips to "total success"; "record test" for Kira with an already-used skill surfaces a reuse warning but still records; reset menu gated on `canPersist`. If the montage test row invokes the roller, drive it with a **deterministic** `RollService.resolve(input, replaySource([d10a, d10b]))` (injected `DiceSource`, recon: `service.ts:37/54`) and assert the recorded success/failure follows the seeded 2d10 result — never `NATIVE_DICE` in tests.

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/montage-serialize.test.ts test/dom/elements/montage.test.ts'
```

- [ ] **Step 4: Implement, register + harness (SAME commit) — 24 → 25**

Build the model/views/definition (`id:"montage"`, `aliases:["ds-montage"]`, `shape:"persisted"`, `autoResolveRefs:false`). `main.ts` register; `entry.ts` FIXTURES `montage`; `aliases.json` `"montage":"ds-montage"`; `fixtures.test.ts` 24 → 25.

- [ ] **Step 5: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/montage-serialize.test.ts test/dom/elements/montage.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/montage main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/montage-serialize.test.ts test/dom/elements/montage.test.ts
git -C draw-steel-elements commit -m "feat: ds-montage test tracker (negotiation-sibling; derived outcome bands, skill-reuse warning) (spec §4)"
```

---

### Task 7: `ds-project` — Project / Downtime tracker (spec §5)

A `persisted` element. **Optional D6 dep** (resolve a `project` goal by code — data-unified has a `project` type); inline fallback otherwise. Rules citable (REF §10; AGENT 872-908). Self-contained — clone the `Counter`/tracker patterns.

**Files:**
- Create: `src/elements/project/model.ts`, `view.ts`, `definition.ts`, `example.yaml`
- Test: `test/unit/model/project-serialize.test.ts`, `test/dom/elements/project.test.ts`

**Schema (verbatim from spec §5.2):**

```yaml
# ds-project
goal_name: "Craft Teleportation Platform"
goal_code: "scc.v1:…/project/…"     # optional (D6 resolve target/points)
goal_points: 1500
accrued: 340
prerequisites:
  item: "planar lodestone"
  source: "Aetheric Cartography (Old Vaslorian)"
rolls:
  - { respite: 1, roll: 14, points: 14 }
  - { respite: 2, roll: 20, points: 34, breakthrough: true }
current_respite: 2
_dse_anchor: 77aa10
```

**Interfaces:**
- `model.ts`: `interface ProjectRoll { respite: number; roll: number; points: number; breakthrough?: boolean }`; `interface ProjectModel { goal_name?: string; goal_code?: string; goal_points?: number; accrued: number; prerequisites?: { item?: string; source?: string }; rolls: ProjectRoll[]; current_respite: number; _dse_anchor?: string }`. `parse` defaults `accrued:0`, `rolls:[]`, `current_respite:1` only when absent; `serialize = stringifyYaml(model).trim()`.
- `view.ts`: `class ProjectView extends ElementView<ProjectModel>` — progress bar `accrued / goal_points`; **"Add project roll"** (points + optional breakthrough → appends a `ProjectRoll`, increments `accrued`; **breakthrough** natural 19-20 → `+20 points and another roll`, AGENT 878 — surface the +20 and a "roll again" affordance); **"Log respite"** increments `current_respite`; optional D6 resolution of `goal_code` → prefill `goal_points`/name (via `cx.compendium.getEntity`), inline fields as fallback. Roll totals entered manually (or via D5's roller when present, deterministic `DiceSource` in tests). Read-only when `!canPersist`.

- [ ] **Step 1: Failing serialize + dom tests**

`test/unit/model/project-serialize.test.ts`: byte-stable round-trip on `example.yaml` (including the `rolls[]` with a `breakthrough` flag and `prerequisites`); `_dse_anchor` survives. `test/dom/elements/project.test.ts` (jsdom): render → progress bar reflects `340/1500`; "Add project roll" of 20 with breakthrough appends a roll, adds `20 + 20` breakthrough points, and shows the bonus-roll affordance; "Log respite" bumps `current_respite`; a `goal_code`-only model resolves points via a seeded `CompendiumIndex`.

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/project-serialize.test.ts test/dom/elements/project.test.ts'
```

- [ ] **Step 3: Implement, register + harness (SAME commit) — 25 → 26**

`id:"project"`, `aliases:["ds-project"]`, `shape:"persisted"`, `autoResolveRefs:false`. `main.ts` register; `entry.ts` FIXTURES `project`; `aliases.json` `"project":"ds-project"`; `fixtures.test.ts` 25 → 26.

- [ ] **Step 4: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/project-serialize.test.ts test/dom/elements/project.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/project main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/project-serialize.test.ts test/dom/elements/project.test.ts
git -C draw-steel-elements commit -m "feat: ds-project downtime tracker (project points, breakthroughs, respite log; optional D6 goal resolve) (spec §5)"
```

---

### Task 8: `ds-party` — Party tracker (spec §6)

A `persisted` element; **no compendium dep.** The hub other subsystems read from (feeds Encounter Builder `hero_count`/`hero_level`, seeds Initiative `heroes[]`, receives Victory payouts). Rules citable (REF §11/§13; AGENT 962-1005). **XP-per-Victory rate is NOT in the reference** → the "Convert victories to XP" action **tracks the event** (default OD-2(a)); it does not invent a rate.

**Files:**
- Create: `src/elements/party/model.ts`, `view.ts`, `definition.ts`, `example.yaml`
- Test: `test/unit/model/party-serialize.test.ts`, `test/dom/elements/party.test.ts`

**Schema (verbatim from spec §6.2):**

```yaml
# ds-party
members:
  - name: "Kira"
    level: 3
    class: "Shadow"
    ancestry: "Wode Elf"
    victories: 1
    xp: 24
    renown: 3
    wealth: 1
    hero_ref: "[[Kira]]"      # optional D7 link (OD-8)
party:
  hero_tokens: 2
_dse_anchor: a01b22
```

**Interfaces:**
- `model.ts`: `interface PartyMember { name: string; level?: number; class?: string; ancestry?: string; victories?: number; xp?: number; renown?: number; wealth?: number; hero_ref?: string }`; `interface PartyModel { members: PartyMember[]; party?: { hero_tokens?: number }; _dse_anchor?: string }`. `parse` validates `members` is a list; `serialize = stringifyYaml(model).trim()`.
- `view.ts`: `class PartyView extends ElementView<PartyModel>` — per-member ± victories (and a party-wide "award N victories" fed from Encounter/Montage payouts); **"Convert victories to XP (respite)"** zeroes each member's `victories` and logs the event (no invented rate — OD-2(a)); renown/wealth steppers with **derived** follower-threshold hints (3/6/9/12 → 1/2/3/4, REF §11) and echelon/wealth hints from the cited scales; a `hero_tokens` stepper. `hero_ref` renders as a link when present (OD-8). Read-only when `!canPersist`.

- [ ] **Step 1: Failing serialize + dom tests**

`test/unit/model/party-serialize.test.ts`: byte-stable round-trip on the multi-member `example.yaml`; optional fields absent on a member do **not** materialize on round-trip; `_dse_anchor` survives. `test/dom/elements/party.test.ts` (jsdom): render → member rows with victories/renown/wealth; "award N victories" adds to each member; "Convert victories to XP" zeroes victories and records the event; renown 3 shows the "1 follower" threshold hint.

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/party-serialize.test.ts test/dom/elements/party.test.ts'
```

- [ ] **Step 3: Implement, register + harness (SAME commit) — 26 → 27**

`id:"party"`, `aliases:["ds-party"]`, `shape:"persisted"`, `autoResolveRefs:false`. `main.ts` register; `entry.ts` FIXTURES `party`; `aliases.json` `"party":"ds-party"`; `fixtures.test.ts` 26 → 27.

- [ ] **Step 4: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/party-serialize.test.ts test/dom/elements/party.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/party main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/unit/model/party-serialize.test.ts test/dom/elements/party.test.ts
git -C draw-steel-elements commit -m "feat: ds-party tracker (victories/renown/wealth, respite XP-event conversion, follower hints) (spec §6, OD-8)"
```

---

### Task 9: Turn / round economy — additive `EncounterData` extension (spec §7)

> **Executes BEFORE Task 5** (the Malice panel reads the fields added here). **HARD INVARIANT:** additive optional fields only; **`test/unit/model/initiative-serialize.test.ts` must stay green UNMODIFIED**; new fields serialize **only when present** (recon delta 4 — `serialize` stringifies the whole object, so `parse` must not materialize an absent field).

An enhancement of Initiative, not a new element. Adds a `round` counter, a per-actor `actions` checklist (`main`/`maneuver`/`move`/`triggered`), and optional `malice.round_gain`/`malice.log`. Old blocks default the new fields at *render* time and round-trip byte-identically.

**Files:**
- Modify: `src/drawSteelAdmonition/EncounterData.ts` (additive optional interface fields + `resetEncounter` clears per-actor `actions`)
- Modify: `src/elements/initiative/model.ts` (`parse` reads new fields **only if present**; add an `advanceRound(data)` helper)
- Modify: `src/elements/initiative/view.ts` (per-actor `[Main][Maneuver][Move][Triggered]` toggles + round counter + "Advance round")
- Test: `test/unit/model/economy-serialize.test.ts`, `test/dom/elements/turnEconomy.test.ts`

**Schema additions (verbatim from spec §7.3):**

```yaml
# ds-initiative (additions)
round: 1                      # NEW; absent → default 1 (render-time), NOT written back unless touched
heroes:
  - name: "Kira"
    has_taken_turn: false
    actions: { main: false, maneuver: false, move: false, triggered: false }   # NEW; absent → all false
malice:
  value: 3
  round_gain: 0               # NEW optional (OD-3); absent → manual-only
  log: []                     # NEW optional spend log (§3.1)
```

**Interfaces:**
- `EncounterData.ts`: add `interface ActorActions { main: boolean; maneuver: boolean; move: boolean; triggered: boolean }`; add optional `round?: number` to `EncounterData`, optional `actions?: ActorActions` to `Hero` and `CreatureInstance`, and optional `round_gain?: number` + `log?: MaliceLogEntry[]` to `Malice` (`interface MaliceLogEntry { round: number; amount: number; label?: string }`). **Do not** make any of these required.
- `model.ts`: `parse` leaves `round`/`actions`/`malice.round_gain`/`malice.log` **untouched when absent** (never assign a default onto the object — the view supplies render-time defaults via `?? 1` / `?? {main:false,…}` reads). Add `export function advanceRound(data: EncounterData): void` — `data.round = (data.round ?? 1) + 1`; clear every `has_taken_turn` and per-actor `actions` (Triggered is **per round**, so it resets here, not on turn end); apply `data.malice.value += data.malice.round_gain ?? 0` and append a log entry if a gain occurred.
- `view.ts`: extend each hero/creature detail row with four keyboard-accessible toggles bound to `actor.actions.<slot>` (materialize `actions` on the object **only on first user toggle** — that is the "user touched the new control" moment that legitimately makes it serialize); a round counter display; and the shared **"Advance round"** control calling `advanceRound` via `rebuildAndPersist()`. The existing "Reset Round" (clears `has_taken_turn`) stays.

- [ ] **Step 1: Failing byte-stability test (the freeze proof)**

Create `test/unit/model/economy-serialize.test.ts`:
- **Legacy block, no new fields:** parse a pre-D8 initiative body (no `round`, no `actions`, `malice: { value: 3 }`) → serialize → assert the output is **byte-identical** to the input's canonical serialization (i.e. the new fields do **not** appear). This is the invariant.
- **New fields present:** parse a body carrying `round: 2`, an `actions` object on a hero, and `malice: { value: 3, round_gain: 2, log: [{round:1,amount:1,label:"x"}] }` → serialize → byte-stable round-trip (all new fields survive in order).
- **`advanceRound`:** on a model at `round:2`, `round_gain:2` → `round` becomes 3, `malice.value += 2`, all `has_taken_turn`/`actions.*` cleared, a log entry appended.

- [ ] **Step 2: Failing dom test**

`test/dom/elements/turnEconomy.test.ts` (jsdom): render an initiative block; a hero row exposes four toggles; toggling `main` materializes `actions` and persists (flush timers, re-read block → `actions` now serialized on that hero only); "Advance round" increments the round display, resets all turn/action state, and (with `round_gain>0`) bumps Malice + logs; "Triggered" resets on round advance.

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/economy-serialize.test.ts test/dom/elements/turnEconomy.test.ts'
```

- [ ] **Step 4: Implement — then prove the freeze**

Implement the additive interface fields, the conditional-emit `parse`, `advanceRound`, and the view toggles. **Then run `initiative-serialize.test.ts` and confirm it passes UNMODIFIED** (this is the load-bearing check — if it needs an edit, the additive contract is broken):

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/initiative-serialize.test.ts test/unit/model/economy-serialize.test.ts test/dom/elements/turnEconomy.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/drawSteelAdmonition/EncounterData.ts src/elements/initiative/model.ts src/elements/initiative/view.ts test/unit/model/economy-serialize.test.ts test/dom/elements/turnEconomy.test.ts
git -C draw-steel-elements commit -m "feat: turn/round action economy — additive EncounterData round/actions/malice fields (byte-stable) (spec §7)"
```

---

### Task 10: registration sweep, harness fixtures, docs-as-done, full gates

Finalize `main.ts` (sidebar `registerView` + ribbon + the two commands + the four element registrations + encounter hand-off), confirm the harness fixtures/aliases invariants at **27**, refresh docs, and run both camera batteries at their new counts.

**Files:**
- Modify: `main.ts` (definitive construction order — see Step 1)
- Modify: `visual-harness/entry.ts`, `visual-harness/aliases.json` (final state: +4 → 27), `visual-harness/obsidian-camera.mjs` (new element notes + the sidebar shot from Task 3 if feasible)
- Modify: `.repo-docs/integration.md`, `CHANGELOG.md`, workspace `CHANGELOG.md`, workspace `CLAUDE.md` (element counts)
- Test: whole-suite + shots + obsidian-shots

- [ ] **Step 1: `main.ts` definitive wiring** — register `DseSidebarView` via `registerDseSidebar(this, services)` (ribbon + "Open Draw Steel sidebar" + "Send block to sidebar" commands); register `encounterElement`/`montageElement`/`projectElement`/`partyElement` in `registerFrameworkElementDefinitions` (after the D6 `displayElements` loop); wire the encounter "Open in sidebar" hand-off to `sendToSidebar`. Confirm the sidebar services bundle (registry + pipeline + app + `cx.compendium`) is threaded once, no duplicate construction. Verify the import-boundary lint (F1 OD-8) stays green.

- [ ] **Step 2: Harness fixtures/aliases at 27** — confirm `visual-harness/entry.ts` FIXTURES and `aliases.json` carry all four new elements with realistic `example.yaml` bodies (per the `initiative/example.yaml` multi-entity convention), and `fixtures.test.ts` asserts **27** and `aliases.test.ts` deep-equals. These were added per-task; Step 2 is the reconciliation check, not a re-add.

- [ ] **Step 3: Docs-as-done** —
  - `.repo-docs/integration.md`: document the **sidebar host** (`SidebarBlockHost`/`DseSidebarView`, the `_dse_anchor` contract, the `onUpdate` live-refresh + self-echo guard) and the **D7 consumer contract** (§1.9: `addPanel({filePath, alias:"ds-hero", anchorId})`, element-agnostic, `onUpdate` works for any view); the four new elements; the turn/round economy + Malice panel; and the adopted OD-1…OD-9.
  - `CHANGELOG.md`: extend the existing **6.0.0** section (GM subsystems: sidebar tracker, `ds-encounter`/`ds-montage`/`ds-project`/`ds-party`, first-class Malice panel, turn/round economy). Do **not** add a new version.
  - Workspace `CHANGELOG.md`: one `## Unreleased` bullet ("GM subsystems: sidebar-pinned trackers, encounter builder, montage/project/party trackers, malice + turn economy").
  - Workspace `CLAUDE.md`: bump any element-count reference to reflect 27 registered elements (verify the current wording before editing; keep it a router-level summary, not detail).

- [ ] **Step 4: Full gates**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npm test'
devbox run -- bash -c 'cd draw-steel-elements && npm run shots'          # +4 gallery fixtures × variants — record the new N
devbox run -- bash -c 'cd draw-steel-elements && npm run obsidian-shots' # +4 element notes (+1 sidebar shot if Task 3 feasible) — record the new N
```
`npx jest` must be green (1453 baseline + all new tests). `fixtures.test.ts` asserts **27**; `aliases.test.ts` deep-equals. If the obsidian camera uses a separate fixture wiring (recon: `visual-harness/obsidian-camera.mjs` has its own element list + the D6 by-SCC ground-truth shot), extend it to cover the four new elements and (if feasible) the sidebar-leaf capture. Record the new `shots`/`obsidian-shots` counts in the commit message.

- [ ] **Step 5: Commit**

```bash
git -C draw-steel-elements add main.ts visual-harness .repo-docs CHANGELOG.md test
git -C draw-steel-elements commit -m "feat: wire sidebar+GM elements into main.ts; D8 docs + camera gates (27 elements)"
git add CHANGELOG.md CLAUDE.md && git commit -m "docs(changelog): D8 GM subsystems (Unreleased)"
```

---

## Self-review (spec-coverage sweep)

- **§1** sidebar `ItemView` host → Tasks 1 (mocks) + 2 (`SidebarBlockHost`/`DseSidebarView`/`SidebarPanel`/`_dse_anchor`/`onUpdate`+self-echo) + 3 (initiative-in-sidebar e2e: mount/persist/navigate/degrade/onUpdate + camera investigation). D7 contract (§1.9) documented in Task 10.
- **§2** Encounter Builder → Task 4 (`ds-encounter`; live EV via `getStatblock`; parameterized budget/band/payout tables OD-2; squad/minion hand-off; `_computed` cache; both hand-off targets OD-5).
- **§3** Malice tracker → Task 5 (first-class panel sub-view: round gain OD-3, spend log, a11y stepper; gated spendable monster malice features via `cost` string parse OD-7) — single source of truth OD-6.
- **§4** Montage → Task 6 (`ds-montage`; negotiation-sibling; derived outcome bands; skill-reuse warning; deterministic `RollService` tests).
- **§5** Project → Task 7 (`ds-project`; project points, breakthroughs, respite log, optional D6 goal resolve).
- **§6** Party → Task 8 (`ds-party`; victories/renown/wealth, respite XP-event conversion no invented rate, follower hints, `hero_ref` OD-8).
- **§7** Turn/round economy → Task 9 (additive `EncounterData` `round`/`actions`/`malice.round_gain`/`log`; `advanceRound`; byte-stable freeze).
- **Placeholder scan:** every task has failing-test-first steps, exact `devbox` commands, verbatim schemas from the spec, and one conventional commit. Encounter fixtures are REAL data-unified files (copied read-only from the workspace checkout); tracker `example.yaml`s follow the multi-entity `initiative/example.yaml` convention.
- **Type consistency:** `SidebarPanelState`/`DseSidebarState`/`BlockInfo`(reused)/`EncounterModel`/`EncounterComputed`/`MontageModel`/`ProjectModel`/`PartyModel`/`ActorActions`/`MaliceLogEntry` are each introduced once and reused verbatim downstream. `mode:"sidebar"` uses the already-reserved `RenderMode` member (no F1 union change). `ev`/`cost` are STRING-parsed defensively everywhere (never numeric-field reads).
- **EncounterData existing-field serialization is NOT modified by any task:** Task 9 adds only optional, absent-defaulted fields; `parse` never materializes an absent field; `advanceRound`/view toggles materialize a new field only on explicit user action; and **`test/unit/model/initiative-serialize.test.ts` stays green unmodified** — Task 9 Step 4 makes running it the explicit freeze proof. No other task touches `EncounterData` serialization.
