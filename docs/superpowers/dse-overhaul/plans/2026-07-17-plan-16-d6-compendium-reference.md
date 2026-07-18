# D6 — Compendium-powered Reference Family Implementation Plan

> **STATUS 2026-07-17: BUILT — READY-PENDING-GATES.** Tasks 1-11 + final MUST-FIX landed
> (plugin `68ba54e`, steel-etl `74d54d0`); opus whole-branch review clean. Gates: tsc ·
> jest 1453 · shots 119 · obsidian-shots 93 (incl. by-SCC recursion ground-truth camera).
> Rides the F2 landing gate (SDK 3.2.0 publish → plan-04 Task 14 → wt-finish f2 →
> release-data re-cut). Hover-preview deferred (OD-D6-5). Task record: Linear SC-3/SC-6 +
> worktree ledger.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Program:** DSE Overhaul — plan **16 of 16** (Wave 2, D-series). Spec: `../D6-compendium-reference-spec.md`.
**Written:** 2026-07-17, against the BUILT F1/F2 framework at worktree `f2`, plugin branch tip **`dbfef73`** (jest baseline **1292** green).
**Recon of record:** `workspace/.superpowers/sdd/d6-recon.md` — the ground truth for the shipped framework. **Where the D6 spec cites F1-paper interfaces that differ from the recon, the recon wins.** The three deltas that reshape this plan versus the spec's §1.2/§2 sketches:

1. **`autoResolveRefs` defaults OFF** (recon; amended 2026-07-02). Every def opts in explicitly; whole-block refs never rely on the deep-resolve default.
2. **`SccRefProvider.resolve` THROWS on `web`/`unresolved`** (recon (d)) — it is the ds-block extractor for statblock/feature/featureblock, not a classifier. The §1.5 degrade ladder and bare-slug sugar therefore resolve in the **view** (which holds full `cx` — `cx.sccAnchors`, and D6's new `cx.compendium`), never in `resolveRefs(model, refs)` (which only gets `cx.refs`). See Task 3's "Resolution home" note.
3. **`ResolvedRef` carries no `frontmatter`** (recon (b)). Display-family cards read frontmatter off `metadataCache` via `ResolvedRef.file`/`CompendiumEntry.file`.

**Deferred (NOT a task):** **SCC hover-preview (spec §5)** is deferred per **OD-D6-5**. F2's `rewriteSccAnchors` already converts a resolvable `scc` anchor into a native `internal-link`, so Obsidian's core Page-preview gives a plain-markdown hover for free — the acceptable zero-code degrade. A DSE card-quality hover reuses `DisplayCardView` and can be added later with no new render path; it is gated behind §1–§3 landing and is out of scope here. Recorded so a future plan can pick it up; the `data-scc` stamping this plan adds (Task 1) is exactly the hook it will need.

**Goal:** Ship the reference-consumption layer on top of F1's pipeline and F2's SCC resolution: (1) reference-by-SCC for `ds-statblock`/`ds-feature`/`ds-featureblock`; (2) a **one-factory** display family (`ds-kit`, `ds-ancestry`, `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`, `ds-treasure`, `ds-complication`, `ds-condition`) over the ten SDK 3.x models; (3) `ds-rule` model-less cards; (4) a compendium search/insert command + modal; (5) `CompendiumIndex` — the typed `entity-by-code → model` accessor **D8 (encounter builder)** consumes.

**Architecture (the one-line shape):** an element body is **either inline YAML (SDK-parsed) or a whole-block reference (compendium-resolved to a `TFile`)**. A single `withReference()` wrapper turns any base def reference-capable; a single `displayFamily()` factory + a declarative `CardLayout` turn the ten SDK models into ten elements; a `genericCard()` sibling handles model-less notes (`ds-rule`); and one `CompendiumIndex` service (backed by a small new public seam on F2's `SccResolver`) powers refs, bare-slug sugar, and search-insert. New optional `RenderContext` seam `cx.compendium` (symmetric with the existing `cx.sccAnchors`) threads the index into views.

**Tech Stack:** TypeScript (ES6/ES2018 output, CJS), Obsidian plugin API (`SuggestModal`, `MetadataCache`, `TFile`, `parseYaml`/`stringifyYaml`), `steel-compendium-sdk` 3.x (ten model families, each with a static `modelDTOAdapter`), Jest 30 + ts-jest (`unit` node / `dom` jsdom projects; `test/mocks/obsidian.ts`; `test/fakes/fakeObsidian.ts` from Plan 04 Task 3). No new runtime dependencies.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Worktree only.** All work in `/home/scott/code/steelCompendium/worktrees/f2` — never the shared main checkout. Every command runs from the worktree root as `devbox run -- bash -c 'cd draw-steel-elements && <cmd>'` (node/npm/just are not on the system PATH).
- **TDD, always.** Write the failing test first, watch it fail for the stated reason, implement, watch it pass. Per Plan 04 Task 8 / Task 1 shape.
- **Gates per task:** `npm run tsc` clean **and** full `npx jest` green. **Baseline is 1292 passing at `dbfef73`** — every task only adds. Whole-branch gates before landing: `npm run shots` and `npm run obsidian-shots` (Task 11) at their new counts.
- **No new runtime dependencies.** Everything is Obsidian API + the SDK + existing devDeps (`js-yaml` in tests). No new `dependencies` in `package.json`.
- **Mobile-safe:** no Node builtins (`fs`/`path`/`crypto` node module) in `src/` or `main.ts` (`isDesktopOnly: false` stays). Node APIs are allowed **in test files only**.
- **`autoResolveRefs` defaults OFF** — set it explicitly `false` on every new def (matches the existing `statblock`/`feature`/`featureblock` defs and horizontal-rule).
- **Fixtures are REAL data-unified files.** Copy them read-only from the **main workspace checkout** — the worktree's `data/` dir is EMPTY (submodule not populated there). Source root: `/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/`. Inline-mode harness fixtures (`example.yaml`) are cut from the `yaml/` format (full SDK DTO); by-SCC dom-test fixtures are cut from the `md-dse/` format (frontmatter + rendered body). Never hand-write an approximation.
- **Fixtures↔registry equality + `aliases.json` invariants** (`test/dom/visual-harness/fixtures.test.ts` count + `aliases.test.ts` deep-equal) **must be updated in the SAME commit** as each element registration. The current asserted count is **12**; this plan takes it to **23** (Task 6 →15, Task 7 →22, Task 8 →23).
- **Aliases are forever, canonical-only** (OD-D6-3): one `ds-<type>` alias per family; no abbreviated aliases at launch (unlike legacy `ds-sb`/`ds-ft`). Never rename or remove an alias once shipped.
- **Commits:** conventional-commit style inside `draw-steel-elements`, one commit per task. **No AI/co-author attribution trailers.**
- **Stay in lane:** D6 consumes F2's resolution/sync and F1's pipeline; it does not redesign resolution order, the manifest, the anchor-rewrite pass, or any `BlockHost`/pipeline signature. The only F2-side change is Task 1's additive read seam on `SccResolver` (adopted OD-D6-2(a)).
- **Assumed landed (verify in Task 0/preflight):** the whole F2 data-integration branch (`SccResolver`, `SccRefProvider`, `rewriteSccAnchors`, `CompendiumSyncService`, `ManifestStore`, SDK 3.x, `cx.sccAnchors` threading), the F1 framework (`registry.ts`, `view.ts`, `context.ts`, `seams/refs.ts`, `pipeline.ts`), and the D9 authoring surface (`src/authoring/insert.ts` `registerInsertCommands`, `DsElementSuggest`). Version is already **6.0.0** (`manifest.json`/`package.json`) — this plan does not bump it.

---

## File Structure

```
draw-steel-elements/
  main.ts                                          MODIFY  register display+rule defs; construct CompendiumIndex;
                                                           thread cx.compendium; add search/insert commands
  src/
    framework/
      context.ts                                   MODIFY  add optional `compendium?: CompendiumIndex` seam (+ factory)
      pipeline.ts                                  MODIFY  thread deps.compendium into createRenderContext
    refs/
      SccResolver.ts                               MODIFY  Task 1 — public read seam: entries()/codeToPath()
      rewriteSccAnchors.ts                         MODIFY  Task 1 — stamp data-scc="<bare code>" on vault+web anchors
    services/
      CompendiumIndex.ts                           NEW     Task 2 — entity-by-code → typed model (D8 consumes)
      typeAdapters.ts                              NEW     Task 2 — single shared type→(file → element model) map
    elements/
      shared/
        withReference.ts                           NEW     Task 3 — RefOrInline<M>, withReference(), detectWholeBlockRef
        RefUnwrapView.ts                           NEW     Task 3 — resolves ref in-view; §1.5 degrade ladder; source threading
        CardLayout.ts                              NEW     Task 5 — CardLayout<M>, FieldRow, Badge, DisplayCardView, SourceAware
        cardFrame.css                              NEW     Task 5 — shared card frame (token-based; steel/legacy/print)
      statblock/definition.ts                      MODIFY  Task 4 — wrap with withReference (view untouched)
      feature/definition.ts                        MODIFY  Task 4 — wrap with withReference
      featureblock/definition.ts                   MODIFY  Task 4 — wrap with withReference
      display/
        displayFamily.ts                           NEW     Task 6 — displayFamily() factory + genericCard() (Task 8)
        layouts.ts                                 NEW     Task 6/7 — ten CardLayout objects, verified vs SDK models
        index.ts                                   NEW     Task 6/7 — displayElements[] + ruleElement (Task 8)
        kit/example.yaml … condition/…             NEW     inline-mode harness fixtures (cut from yaml/ format)
    authoring/
      CompendiumSearchModal.ts                     NEW     Task 10 — first SuggestModal in repo; fuzzy + type:/source: filters
      compendiumInsert.ts                          NEW     Task 10 — insert-reference / insert-block commands + actions
  visual-harness/
    entry.ts                                       MODIFY  FIXTURES: +11 display/rule fixtures (12 → 23)
    aliases.json                                   MODIFY  +11 primary aliases (same commit as each registration)
  test/
    fixtures/md-dse/{kit,condition,treasure,…}/…   NEW     real md-dse files (by-SCC dom tests)
    unit/refs/sccResolverSeam.test.ts              NEW     Task 1
    dom/rewriteSccAnchorsDataScc.test.ts           NEW     Task 1
    unit/services/compendiumIndex.test.ts          NEW     Task 2
    unit/elements/withReference.test.ts            NEW     Task 3
    dom/elements/refUnwrapView.test.ts             NEW     Task 3
    dom/elements/statblockRef.test.ts              NEW     Task 4
    dom/elements/displayCard.test.ts               NEW     Task 5
    dom/elements/displayFamily.test.ts             NEW     Task 6/7
    dom/elements/ruleCard.test.ts                  NEW     Task 8
    dom/elements/displayCardHybrid.test.ts         NEW     Task 9
    dom/authoring/compendiumSearchModal.test.ts    NEW     Task 10
    (fixtures.test.ts / aliases.test.ts)           MODIFY  count 12 → 15 → 22 → 23 (per registration commit)
  .repo-docs/integration.md                        MODIFY  Task 11 — D6 reference family + CompendiumIndex/D8 contract
  CHANGELOG.md                                     MODIFY  Task 11 — extend the 6.0.0 section (reference family)
```

**Dependency order:** Task 1 → 2 (services) → 3 (wrapper) → { 4 (existing-element refs) ∥ 5 (card frame) } → 6 (factory + first 3) → 7 (remaining 7) → 8 (`ds-rule`) → 9 (hybrid by-SCC) → 10 (search/insert) → 11 (docs + gates). Tasks 4 and 5 are independent once 3 lands.

---

### Task 1: F2 read seam on `SccResolver` + `data-scc` anchor stamping (OD-D6-2(a))

`CompendiumIndex` (Task 2) needs to enumerate every synced code and to look a code up to a path, but `SccResolver.index` is **private** with no public enumeration (recon). Rather than have D6 build a parallel `metadataCache` index (the OD-D6-2(b) fallback, which drifts), we adopt **OD-D6-2(a)**: a minimal, additive **read** surface on the resolver (F2 owns the write/resolution side; this only exposes what it already holds). Separately, `rewriteSccAnchors` today stamps no code onto its rewritten anchors (recon) — Task 1 adds `data-scc="<bare code>"` on the `vault` and `web` branches so the deferred hover-preview (spec §5) and any future consumer can recover a code from an anchor without re-parsing `href`.

**Files:**
- Modify: `src/refs/SccResolver.ts` (add two public methods; keep `index` private)
- Modify: `src/refs/rewriteSccAnchors.ts` (stamp `data-scc`)
- Test: `test/unit/refs/sccResolverSeam.test.ts`, `test/dom/rewriteSccAnchorsDataScc.test.ts`

**Interfaces:**
- Produces on `SccResolver`:
  - `entries(): CompendiumCodeEntry[]` — seeds the index if needed, returns `{ scc: string; path: string }[]` (a snapshot copy, not the live map).
  - `codeToPath(code: string): string | null` — bare-code → indexed vault path (seed-on-demand), or `null`.
  - `export interface CompendiumCodeEntry { scc: string; path: string; }`
- Produces: `rewriteSccAnchors` stamps `data-scc="<bare code>"` on the anchor for `vault` and `web` resolutions (the bare code is `normalizeSccTarget(href)`); the `unresolved` span is unchanged.

- [ ] **Step 1: Write the failing tests**

Create `test/unit/refs/sccResolverSeam.test.ts`:

```ts
import * as path from "path";
import { SccResolver } from "@/refs/SccResolver";
import { DEFAULT_SETTINGS } from "@model/Settings";
import { makeFakeApp, loadFixtureIntoVault } from "../../fakes/fakeObsidian";

const FIXTURES = path.join(__dirname, "../../fixtures/md-dse");
const GOBLIN = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";

function setup() {
    const { app, vault, metadataCache } = makeFakeApp();
    loadFixtureIntoVault(vault, metadataCache,
        path.join(FIXTURES, "monster/goblin/statblock/goblin-stinker.md"),
        "DS Compendium/monster/goblin/statblock/goblin-stinker.md");
    return new SccResolver(app, DEFAULT_SETTINGS);
}

describe("SccResolver public read seam (OD-D6-2a)", () => {
    test("entries() enumerates every frontmatter-scc code with its path", () => {
        const entries = setup().entries();
        expect(entries).toContainEqual({
            scc: GOBLIN,
            path: "DS Compendium/monster/goblin/statblock/goblin-stinker.md",
        });
    });
    test("entries() returns a copy — mutating it does not corrupt the resolver", () => {
        const resolver = setup();
        resolver.entries().push({ scc: "junk", path: "junk.md" });
        expect(resolver.codeToPath("junk")).toBeNull();
    });
    test("codeToPath resolves an indexed code, null for an unknown one", () => {
        const resolver = setup();
        expect(resolver.codeToPath(GOBLIN))
            .toBe("DS Compendium/monster/goblin/statblock/goblin-stinker.md");
        expect(resolver.codeToPath("mcdm.heroes.v1/class/nonesuch")).toBeNull();
    });
});
```

Create `test/dom/rewriteSccAnchorsDataScc.test.ts`:

```ts
/** @jest-environment jsdom */
import { rewriteSccAnchors, SccAnchorResolver } from "@/refs/rewriteSccAnchors";
import { SccResolution } from "@/refs/SccResolver";
import { fakeTFile } from "../fakes/fakeObsidian";

function stub(map: Record<string, SccResolution>): SccAnchorResolver {
    return { resolve: (raw) => map[raw] ?? { kind: "unresolved", code: raw } };
}
function anchor(href: string): HTMLElement {
    const root = document.createElement("div");
    root.innerHTML = `<a href="${href}">link</a>`;
    return root;
}

const CODE = "mcdm.heroes.v1/class/shadow";

describe("rewriteSccAnchors data-scc stamping (OD-D6-2a)", () => {
    test("vault anchor carries data-scc with the bare code", () => {
        const root = anchor(`scc.v1:${CODE}`);
        rewriteSccAnchors(root, stub({
            [`scc.v1:${CODE}`]: { kind: "vault", file: fakeTFile("x.md"), linkpath: "x.md" },
        }));
        expect(root.querySelector("a")!.getAttribute("data-scc")).toBe(CODE);
    });
    test("web anchor carries data-scc with the bare code", () => {
        const root = anchor(`scc:${CODE}`);
        rewriteSccAnchors(root, stub({
            [`scc:${CODE}`]: { kind: "web", url: `https://steelcompendium.io/scc/${CODE}/` },
        }));
        expect(root.querySelector("a")!.getAttribute("data-scc")).toBe(CODE);
    });
    test("unresolved span is unchanged (no data-scc, still a span)", () => {
        const root = anchor(`scc.v1:${CODE}`);
        rewriteSccAnchors(root, stub({ [`scc.v1:${CODE}`]: { kind: "unresolved", code: CODE } }));
        expect(root.querySelector("a")).toBeNull();
        expect(root.querySelector("span.ds-scc-unresolved")).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccResolverSeam.test.ts test/dom/rewriteSccAnchorsDataScc.test.ts'
```
Expected: FAIL — `entries`/`codeToPath` are not exported; anchors carry no `data-scc`.

- [ ] **Step 3: Add the read seam to `SccResolver`**

In `src/refs/SccResolver.ts`, add above the `SccResolution` type:

```ts
/** A single synced code → vault-path record (OD-D6-2a read seam). */
export interface CompendiumCodeEntry {
	scc: string;
	path: string;
}
```

and add these two public methods to the `SccResolver` class (keep `index` private — these are the ONLY new public surface):

```ts
	/** OD-D6-2a: enumerate every indexed frontmatter-`scc` code → path (seeds on demand).
	 *  Returns a snapshot copy so callers (CompendiumIndex) cannot mutate the live index. */
	public entries(): CompendiumCodeEntry[] {
		if (this.index === null) this.seedIndex();
		const out: CompendiumCodeEntry[] = [];
		for (const [scc, path] of this.index!) out.push({ scc, path });
		return out;
	}

	/** OD-D6-2a: bare code → indexed vault path (seeds on demand), or null. Path-derivation
	 *  (the resolve() fast path) is deliberately NOT consulted here — this is the identity
	 *  index only; callers wanting the full ladder use resolve(). */
	public codeToPath(code: string): string | null {
		if (this.index === null) this.seedIndex();
		return this.index!.get(code) ?? null;
	}
```

- [ ] **Step 4: Stamp `data-scc` in `rewriteSccAnchors`**

In `src/refs/rewriteSccAnchors.ts`, inside the loop, after computing `resolution`, stamp the bare code on the two anchor-preserving branches. Import `normalizeSccTarget` from `./SccResolver` and, in the `vault` and `web` branches, add:

```ts
			const bareCode = normalizeSccTarget(href);
			if (bareCode) anchor.setAttribute("data-scc", bareCode);
```

Place it once at the top of the `vault` branch and once at the top of the `web` branch (the `unresolved` branch replaces the anchor with a span and stays untouched). Keep every existing attribute mutation intact.

- [ ] **Step 5: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccResolverSeam.test.ts test/dom/rewriteSccAnchorsDataScc.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/refs/SccResolver.ts src/refs/rewriteSccAnchors.ts test/unit/refs/sccResolverSeam.test.ts test/dom/rewriteSccAnchorsDataScc.test.ts
git -C draw-steel-elements commit -m "feat: SccResolver read seam (entries/codeToPath) + data-scc anchor stamping (OD-D6-2a)"
```

---

### Task 2: `CompendiumIndex` service + shared type→adapter map (spec §6)

The one D6 piece that is a **service, not a feature**, and the explicit hand-off to **D8**. It sits on top of Task 1's seam + `metadataCache` frontmatter and owns the **typed-model accessor** layer. The `type → (file → element model)` dispatch lives in **one shared module** (`typeAdapters.ts`) so the display family (Task 6) and `CompendiumIndex.getEntity().model()` use the identical source of truth. ResolvedRef/entries carry no frontmatter (recon (b)) → frontmatter is read off `metadataCache` via the `TFile`.

**Files:**
- Create: `src/services/typeAdapters.ts`, `src/services/CompendiumIndex.ts`
- Test: `test/unit/services/compendiumIndex.test.ts`

**Interfaces:**
- `typeAdapters.ts` produces:
  - `type ElementModel = unknown;` and `interface TypeAdapter { /** how to turn a resolved file into the element's model */ fromFile(app: App, file: TFile): Promise<unknown>; /** SCC-type test: matches a frontmatter `type` value */ matches(type: string): boolean; }`
  - `const TYPE_ADAPTERS: TypeAdapter[]` — one entry per element family. Two shapes:
    - **ds-block families** (`monster.*.statblock` → `StatblockConfig.readYaml(blockText)`; `feature.*`/`feature` → `FeatureConfig.readYaml(blockText)`; `*.featureblock` → `FeatureblockConfig.readYaml(blockText)`): read the file, extract the first `ds-*` block **text** (a text-returning variant of `extractFirstDsBlock`), feed the SDK reader — these bases parse from `raw`, not the pre-parsed object.
    - **frontmatter families** (`kit`/`ancestry`/…/`condition` → `Kit.modelDTOAdapter(frontmatter)` …): read `metadataCache.getFileCache(file).frontmatter`, feed the SDK adapter.
  - `function adapterForType(type: string): TypeAdapter | undefined`
- `CompendiumIndex.ts` produces the `CompendiumEntry` / `CompendiumEntity` / `CompendiumIndex` interfaces from spec §6, plus `class DseCompendiumIndex implements CompendiumIndex` and `function createCompendiumIndex(app, resolver): CompendiumIndex`. Consumed by Tasks 3, 8, 10 and by D8 (`getStatblock`).

- [ ] **Step 1: Write the failing tests**

Create `test/unit/services/compendiumIndex.test.ts`:

```ts
import * as path from "path";
import { createCompendiumIndex } from "@/services/CompendiumIndex";
import { SccResolver } from "@/refs/SccResolver";
import { DEFAULT_SETTINGS } from "@model/Settings";
import { makeFakeApp, loadFixtureIntoVault } from "../../fakes/fakeObsidian";

const F = path.join(__dirname, "../../fixtures/md-dse");
const GOBLIN = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";
const KIT = "mcdm.heroes.v1/kit/panther";
const COND = "mcdm.heroes.v1/condition/bleeding";

function setup(empty = false) {
    const { app, vault, metadataCache } = makeFakeApp();
    if (!empty) {
        loadFixtureIntoVault(vault, metadataCache,
            path.join(F, "monster/goblin/statblock/goblin-stinker.md"),
            "DS Compendium/monster/goblin/statblock/goblin-stinker.md");
        loadFixtureIntoVault(vault, metadataCache,
            path.join(F, "kit/panther.md"), "DS Compendium/kit/panther.md");
        loadFixtureIntoVault(vault, metadataCache,
            path.join(F, "condition/bleeding.md"), "DS Compendium/condition/bleeding.md");
    }
    const resolver = new SccResolver(app, DEFAULT_SETTINGS);
    return { index: createCompendiumIndex(app, resolver) };
}

describe("CompendiumIndex (spec §6)", () => {
    test("available reflects whether any compendium code is indexed", () => {
        expect(setup(true).index.available).toBe(false);
        expect(setup().index.available).toBe(true);
    });

    test("getEntry returns a lightweight listing record (no file read)", () => {
        const entry = setup().index.getEntry(KIT)!;
        expect(entry.scc).toBe(KIT);
        expect(entry.type).toBe("kit");
        expect(entry.name).toBe("Panther");
        expect(entry.source).toBe("mcdm.heroes.v1");
    });

    test("getEntity().model() parses a frontmatter family (kit) via the SDK adapter", async () => {
        const entity = await setup().index.getEntity(KIT);
        const model = await entity!.model();
        expect((model as any).name).toBe("Panther");
        expect((model as any).stamina_bonus).toBeDefined();
    });

    test("getStatblock returns a typed SDK Statblock (D8 entry point)", async () => {
        const sb = await setup().index.getStatblock(GOBLIN);
        expect(sb!.name).toBe("Goblin Stinker");
        expect(sb!.role).toBe("Controller");
        expect(sb!.organization).toBe("Horde");
    });

    test("resolveSlug scopes candidates by type family (bare-slug sugar, §1.3)", () => {
        const index = setup().index;
        expect(index.resolveSlug("panther", /^kit$/)).toEqual([KIT]);
        expect(index.resolveSlug("bleeding", /^condition$/)).toEqual([COND]);
        // A kit slug does NOT match under a statblock scope.
        expect(index.resolveSlug("panther", /statblock/)).toEqual([]);
    });

    test("query fuzzy-matches item_name and honors type/source filters", () => {
        const index = setup().index;
        expect(index.query("panth").map((e) => e.scc)).toContain(KIT);
        expect(index.query("", { type: /^condition$/ }).map((e) => e.scc)).toEqual([COND]);
        expect(index.query("", { source: "mcdm.monsters.v1" }).map((e) => e.scc)).toEqual([GOBLIN]);
    });

    test("getEntity is null for an unknown code", async () => {
        expect(await setup().index.getEntity("mcdm.heroes.v1/kit/nonesuch")).toBeNull();
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/services/compendiumIndex.test.ts'
```
Expected: FAIL — modules do not exist. (Copy the `kit/panther.md` and `condition/bleeding.md` fixtures now — see Task 6 Step 1's `cp` block; the goblin fixture already exists from Plan 04 Task 3.)

- [ ] **Step 3: Implement the shared type→adapter map**

Create `src/services/typeAdapters.ts`. Add a **text-returning** block extractor alongside the parsed one (or export it from `ReferenceResolver.ts` — reuse the same `blockRegex`). Keep the frontmatter families driven by `modelDTOAdapter`:

```ts
import { App, TFile } from "obsidian";
import {
	Kit, Ancestry, Culture, Career, Class, Title, Perk, Treasure, Complication, Condition,
} from "steel-compendium-sdk";
import { StatblockConfig } from "@model/StatblockConfig";
import { FeatureConfig } from "@model/FeatureConfig";
import { FeatureblockConfig } from "@model/FeatureblockConfig";

/** First ds-* block RAW TEXT (the SDK readers parse text, not a pre-parsed object). */
export async function extractFirstDsBlockText(app: App, file: TFile): Promise<string | null> {
	const content = await app.vault.read(file);
	const match = content.match(/^([`~]{3,})ds-[\w-]+\s*\n([\s\S]+?)\n^\1/m);
	return match ? match[2] : null;
}

function frontmatterOf(app: App, file: TFile): Record<string, unknown> {
	return (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as Record<string, unknown>;
}

export interface TypeAdapter {
	/** SCC frontmatter `type` test (e.g. /^kit$/, /monster\..*\.statblock$/). */
	matches(type: string): boolean;
	/** Turn a resolved compendium file into the element's model, or null when unavailable. */
	fromFile(app: App, file: TFile): Promise<unknown>;
}

/** ds-block family: SDK reader over the first ds-* block text (statblock/feature/featureblock). */
function dsBlockAdapter(re: RegExp, readYaml: (text: string) => unknown): TypeAdapter {
	return {
		matches: (type) => re.test(type),
		fromFile: async (app, file) => {
			const text = await extractFirstDsBlockText(app, file);
			return text === null ? null : readYaml(text);
		},
	};
}
/** frontmatter family: SDK modelDTOAdapter over the file's frontmatter. */
function frontmatterAdapter(re: RegExp, adapter: (fm: any) => unknown): TypeAdapter {
	return { matches: (type) => re.test(type), fromFile: async (app, file) => adapter(frontmatterOf(app, file)) };
}

/** SINGLE SOURCE OF TRUTH — the display family (Task 6) and CompendiumIndex share this. */
export const TYPE_ADAPTERS: TypeAdapter[] = [
	dsBlockAdapter(/(^|\.)statblock$/, (t) => StatblockConfig.readYaml(t)),
	dsBlockAdapter(/(^|\.)featureblock$/, (t) => FeatureblockConfig.readYaml(t)),
	dsBlockAdapter(/^feature($|\.)/, (t) => FeatureConfig.readYaml(t)),
	frontmatterAdapter(/^kit$/, Kit.modelDTOAdapter),
	frontmatterAdapter(/^ancestry$/, Ancestry.modelDTOAdapter),
	frontmatterAdapter(/^culture$/, Culture.modelDTOAdapter),
	frontmatterAdapter(/^career$/, Career.modelDTOAdapter),
	frontmatterAdapter(/^class$/, Class.modelDTOAdapter),
	frontmatterAdapter(/^title$/, Title.modelDTOAdapter),
	frontmatterAdapter(/^perk$/, Perk.modelDTOAdapter),
	frontmatterAdapter(/^treasure$/, Treasure.modelDTOAdapter),
	frontmatterAdapter(/^complication$/, Complication.modelDTOAdapter),
	frontmatterAdapter(/^condition$/, Condition.modelDTOAdapter),
];

export function adapterForType(type: string): TypeAdapter | undefined {
	return TYPE_ADAPTERS.find((a) => a.matches(type));
}
```

> **Note (statblock ds-block extraction ordering):** `dsBlockAdapter` for `statblock`/`featureblock` must precede `feature` so `monster.goblin.statblock` matches the statblock entry, not `feature`. The `type` frontmatter value drives dispatch (e.g. `type: kit`, `type: monster.goblin.statblock`, `type: feature`). Verify each fixture's `type` value against `matches`.

- [ ] **Step 4: Implement `CompendiumIndex`**

Create `src/services/CompendiumIndex.ts`. Back it with Task 1's `resolver.entries()`/`codeToPath()` + `metadataCache`; LRU-cache parsed models; invalidate on vault events. `getStatblock` unwraps `StatblockConfig.statblock` to the raw SDK `Statblock` for D8.

```ts
import { App, TFile, Plugin } from "obsidian";
import type { Statblock } from "steel-compendium-sdk";
import { SccResolver } from "@/refs/SccResolver";
import { adapterForType, extractFirstDsBlockText } from "./typeAdapters";
import { StatblockConfig } from "@model/StatblockConfig";

export interface CompendiumEntry {
	scc: string; type: string; name: string; source: string; file: TFile;
}
export interface CompendiumEntity extends CompendiumEntry {
	frontmatter: Record<string, unknown>;
	/** Rendered markdown body (frontmatter stripped). */
	body(): Promise<string>;
	/** Typed element model when `type` maps to a known family; else undefined. */
	model(): Promise<unknown | undefined>;
}
export interface CompendiumIndex {
	readonly available: boolean;
	getEntry(code: string): CompendiumEntry | null;
	getEntity(code: string): Promise<CompendiumEntity | null>;
	getStatblock(code: string): Promise<Statblock | null>;
	query(text: string, filters?: { type?: string | RegExp; source?: string }): CompendiumEntry[];
	resolveSlug(slug: string, typeScope: string | RegExp): string[];
	/** Wire vault-event cache invalidation (plugin lifetime). */
	registerWatchers(plugin: Plugin): void;
}

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n?/;

class DseCompendiumIndex implements CompendiumIndex {
	private readonly modelCache = new Map<string, unknown>(); // code → parsed model (LRU-ish)
	private static readonly CACHE_MAX = 128;

	constructor(private app: App, private resolver: SccResolver) {}

	get available(): boolean { return this.resolver.entries().length > 0; }

	getEntry(code: string): CompendiumEntry | null {
		const path = this.resolver.codeToPath(code);
		if (path === null) return null;
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return null;
		const fm = (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as Record<string, unknown>;
		return {
			scc: code,
			file,
			type: typeof fm.type === "string" ? fm.type : "",
			name: typeof fm.item_name === "string" ? fm.item_name
				: typeof fm.name === "string" ? fm.name : file.basename,
			source: typeof fm.source === "string" ? fm.source : code.split("/")[0],
		};
	}

	async getEntity(code: string): Promise<CompendiumEntity | null> {
		const entry = this.getEntry(code);
		if (entry === null) return null;
		const app = this.app, self = this;
		return {
			...entry,
			frontmatter: (app.metadataCache.getFileCache(entry.file)?.frontmatter ?? {}) as Record<string, unknown>,
			async body(): Promise<string> {
				return (await app.vault.read(entry.file)).replace(FRONTMATTER_RE, "");
			},
			async model(): Promise<unknown | undefined> {
				if (self.modelCache.has(code)) return self.modelCache.get(code);
				const adapter = adapterForType(entry.type);
				if (!adapter) return undefined;
				const model = await adapter.fromFile(app, entry.file);
				if (model != null) self.cachePut(code, model);
				return model ?? undefined;
			},
		};
	}

	async getStatblock(code: string): Promise<Statblock | null> {
		const entry = this.getEntry(code);
		if (entry === null || !/statblock$/.test(entry.type)) return null;
		const text = await extractFirstDsBlockText(this.app, entry.file);
		return text === null ? null : StatblockConfig.readYaml(text).statblock;
	}

	query(text: string, filters?: { type?: string | RegExp; source?: string }): CompendiumEntry[] {
		const q = text.trim().toLowerCase();
		return this.resolver.entries()
			.map((e) => this.getEntry(e.scc))
			.filter((e): e is CompendiumEntry => e !== null)
			.filter((e) => (filters?.source ? e.source === filters.source : true))
			.filter((e) => (filters?.type ? matchType(e.type, filters.type) : true))
			.filter((e) => (q === "" ? true : fuzzy(e.name.toLowerCase(), q)));
	}

	resolveSlug(slug: string, typeScope: string | RegExp): string[] {
		const s = slug.trim().toLowerCase();
		return this.resolver.entries()
			.map((e) => this.getEntry(e.scc))
			.filter((e): e is CompendiumEntry => e !== null && matchType(e.type, typeScope))
			.filter((e) => e.file.basename.toLowerCase() === s
				|| (String(this.app.metadataCache.getFileCache(e.file)?.frontmatter?.file_basename ?? "")).toLowerCase() === s
				|| e.name.toLowerCase() === s)
			.map((e) => e.scc);
	}

	registerWatchers(plugin: Plugin): void {
		const drop = () => this.modelCache.clear();
		plugin.registerEvent(this.app.vault.on("modify", drop));
		plugin.registerEvent(this.app.vault.on("delete", drop));
		plugin.registerEvent(this.app.vault.on("rename", drop));
	}

	private cachePut(code: string, model: unknown): void {
		if (this.modelCache.size >= DseCompendiumIndex.CACHE_MAX) {
			this.modelCache.delete(this.modelCache.keys().next().value as string);
		}
		this.modelCache.set(code, model);
	}
}

function matchType(type: string, scope: string | RegExp): boolean {
	return typeof scope === "string" ? type === scope : scope.test(type);
}
/** Subsequence fuzzy match — cheap and dependency-free (matches the SuggestModal intent). */
function fuzzy(haystack: string, needle: string): boolean {
	let i = 0;
	for (const ch of haystack) { if (ch === needle[i]) i++; if (i === needle.length) return true; }
	return needle.length === 0;
}

export function createCompendiumIndex(app: App, resolver: SccResolver): CompendiumIndex {
	return new DseCompendiumIndex(app, resolver);
}
```

- [ ] **Step 5: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/services/compendiumIndex.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/services test/unit/services/compendiumIndex.test.ts test/fixtures/md-dse/kit test/fixtures/md-dse/condition
git -C draw-steel-elements commit -m "feat: CompendiumIndex service + shared type→adapter map (spec §6, D8 getStatblock entry point)"
```

---

### Task 3: `withReference()` + `detectWholeBlockRef` + `RefUnwrapView` (spec §1)

The single reusable wrapper that makes any base def accept a **whole-block reference** in place of inline YAML. **Resolution home (recon (d), binding):** the spec §1.2 sketch puts resolution in `resolveRefs(model, refs)`, but the built `SccRefProvider.resolve` *throws* on `web`/`unresolved`, `resolveRefs` gets only `cx.refs` (no `cx.sccAnchors`/`cx.compendium`), and display families resolve from **frontmatter**, not the first ds-block that `SccRefProvider` extracts. Therefore **all ref resolution lives in `RefUnwrapView`** (which holds full `cx`): it does bare-slug→code via `cx.compendium.resolveSlug`, classifies via the sync `cx.sccAnchors.resolve` for the §1.5 degrade ladder, and pulls the typed model + source via `cx.compendium.getEntity`. `withReference` sets `autoResolveRefs:false` and **no** `resolveRefs` hook — parse merely tags ref-vs-inline; the view does the async work. This keeps the base statblock/feature/display views reference-agnostic (§1.4).

**New `cx.compendium` seam:** add `readonly compendium?: CompendiumIndex` to `RenderContext` (`context.ts`) + `createRenderContext` args, symmetric with `sccAnchors`; thread it through `pipeline.ts` (`deps.compendium` → `createRenderContext`). Wired live in main.ts (Task 11); absent in bare test contexts (the view degrades to "compendium not installed").

**Files:**
- Create: `src/elements/shared/withReference.ts`, `src/elements/shared/RefUnwrapView.ts`
- Modify: `src/framework/context.ts`, `src/framework/pipeline.ts`
- Test: `test/unit/elements/withReference.test.ts`, `test/dom/elements/refUnwrapView.test.ts`

**Interfaces:**
- `withReference.ts`:
  - `interface RefSource { file: TFile; frontmatter: Record<string, unknown>; body: string; }`
  - `type RefOrInline<M> = { kind: "inline"; model: M } | { kind: "ref"; raw: string };`
  - `interface SourceAware { setSource(source: RefSource): void; }` (base views opt in; DisplayCardView implements it, Task 5)
  - `interface WithReferenceOptions { sccType: string | RegExp; }`
  - `function detectWholeBlockRef(data: unknown, raw: string): string | null` (spec §1.3 rules)
  - `function withReference<M>(base: ElementDefinition<M>, opts: WithReferenceOptions): ElementDefinition<RefOrInline<M>>`
- `RefUnwrapView.ts`: `class RefUnwrapView<M> extends ElementView<RefOrInline<M>>` (ctor `(cx, base, opts)`).

- [ ] **Step 1: Add the `cx.compendium` seam (context + pipeline)**

In `src/framework/context.ts`: add `import type { CompendiumIndex } from '@/services/CompendiumIndex';`, add `readonly compendium?: CompendiumIndex;` to `RenderContext` (documented like `sccAnchors`), add `compendium?: CompendiumIndex;` to the `createRenderContext` args, and set `compendium: args.compendium` in the returned object. In `src/framework/pipeline.ts`, add `compendium?: CompendiumIndex` to `ElementPipelineServices`/deps and pass `compendium: this.services.compendium` (or `deps.compendium`) into the `createRenderContext(...)` call — mirror exactly how `sccAnchors` is threaded. No behavior change when absent.

- [ ] **Step 2: Write the failing unit test for `detectWholeBlockRef`**

Create `test/unit/elements/withReference.test.ts`:

```ts
import { detectWholeBlockRef } from "@/elements/shared/withReference";
import { parseYaml } from "obsidian";

function detect(raw: string): string | null {
    return detectWholeBlockRef(parseYaml(raw), raw);
}
const CODE = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";

describe("detectWholeBlockRef (spec §1.3)", () => {
    test("prefixed scc.v1: / scc: forms are refs, returned verbatim", () => {
        expect(detect(`scc.v1:${CODE}`)).toBe(`scc.v1:${CODE}`);
        expect(detect(`scc:${CODE}`)).toBe(`scc:${CODE}`);
    });
    test("@path and [[wikilink]] are refs (legacy forms preserved)", () => {
        expect(detect("@Homebrew/Fireball")).toBe("@Homebrew/Fireball");
        expect(detect("[[Thorn Dragon]]")).toBe("[[Thorn Dragon]]");
    });
    test("a bare scalar slug is a ref (bare-code sugar)", () => {
        expect(detect("goblin-stinker")).toBe("goblin-stinker");
        expect(detect("panther")).toBe("panther");
    });
    test("a full source/type/item scalar (contains /) is a ref", () => {
        expect(detect(CODE)).toBe(CODE);
    });
    test("inline YAML mapping is NOT a ref (returns null)", () => {
        expect(detect("name: Custom\ncontent: hi")).toBeNull();
    });
    test("empty / whitespace body is not a ref", () => {
        expect(detect("")).toBeNull();
        expect(detect("   ")).toBeNull();
    });
});
```

- [ ] **Step 3: Implement `withReference.ts`**

```ts
import type { ElementDefinition } from "@/framework/registry";
import type { TFile } from "obsidian";
import { RefUnwrapView } from "./RefUnwrapView";

export interface RefSource {
	file: TFile;
	frontmatter: Record<string, unknown>;
	body: string;
}
export type RefOrInline<M> =
	| { kind: "inline"; model: M }
	| { kind: "ref"; raw: string };

/** A base view that wants the resolved source file threaded in (display family, §2.3). */
export interface SourceAware {
	setSource(source: RefSource): void;
}
export interface WithReferenceOptions {
	/** SCC type family this element renders — scopes bare-slug sugar (§1.3). */
	sccType: string | RegExp;
}

const PREFIXED_RE = /^(scc(\.v\d+)?:|@)/;

/**
 * Spec §1.3 — the block body IS a whole-block reference (return the ref string) or it is
 * inline YAML (return null). Cheapest first: prefixed/linked forms, then a bare scalar
 * (slug or full code), else null (a mapping = inline data).
 */
export function detectWholeBlockRef(data: unknown, raw: string): string | null {
	const trimmed = raw.trim();
	if (trimmed.length === 0) return null;
	// 1. Prefixed / linked canonical forms — single line.
	if (!trimmed.includes("\n")) {
		if (PREFIXED_RE.test(trimmed)) return trimmed;
		if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) return trimmed;
	}
	// 2. Bare-code sugar: parseYaml yielded a bare scalar (string/number), not a mapping.
	if (typeof data === "string" && data.trim().length > 0 && !data.includes("\n")) {
		return data.trim();
	}
	if (typeof data === "number") return String(data);
	// 3. Otherwise inline YAML.
	return null;
}

/**
 * Wrap a base display/statblock/feature definition so its block body may be a whole-block
 * reference instead of inline YAML. `base.parse` still owns inline data; RefUnwrapView owns
 * the ref → payload round-trip and the §1.5 degrade ladder (recon (d): resolution needs full
 * cx, so it lives in the view, not resolveRefs). autoResolveRefs stays OFF.
 */
export function withReference<M>(
	base: ElementDefinition<M>,
	opts: WithReferenceOptions,
): ElementDefinition<RefOrInline<M>> {
	return {
		...base,
		autoResolveRefs: false,
		parse(data, raw): RefOrInline<M> {
			const ref = detectWholeBlockRef(data, raw);
			if (ref !== null) return { kind: "ref", raw: ref };
			return { kind: "inline", model: base.parse(data, raw) };
		},
		createView: (cx) => new RefUnwrapView<M>(cx, base, opts),
	};
}
```

- [ ] **Step 4: Implement `RefUnwrapView.ts`** (the degrade ladder + source threading)

```ts
import { ElementView } from "@/framework/view";
import { renderErrorCard } from "@/framework/pipeline"; // exported error-card helper
import type { RenderContext } from "@/framework/context";
import type { ElementDefinition } from "@/framework/registry";
import type { RefOrInline, RefSource, WithReferenceOptions } from "./withReference";

/**
 * Resolves a whole-block reference IN THE VIEW (recon (d): full cx available here).
 * inline  → mount the base view directly.
 * ref     → slug→code (cx.compendium.resolveSlug) → classify (cx.sccAnchors.resolve):
 *             vault (model found)     → mount base view with the typed model (+ source)
 *             vault (no renderable model / OD-1A missing) → "found but not renderable" card
 *             web                     → "View on steelcompendium.io" + "Sync compendium" card
 *             unresolved / no index   → unknown-code / not-installed card
 */
export class RefUnwrapView<M> extends ElementView<RefOrInline<M>> {
	constructor(cx: RenderContext, private base: ElementDefinition<M>, private opts: WithReferenceOptions) {
		super(cx);
	}

	protected async onMount(root: HTMLElement, model: RefOrInline<M>): Promise<void> {
		if (model.kind === "inline") return this.mountBase(root, model.model);
		await this.resolveAndMount(root, model.raw);
	}

	protected async onUpdate(model: RefOrInline<M>): Promise<void> {
		this.rootEl.empty();
		await this.onMount(this.rootEl, model);
	}

	private async resolveAndMount(root: HTMLElement, raw: string): Promise<void> {
		const index = this.cx.compendium;
		if (!index || !index.available) {
			return this.errorCard(root, "Compendium not installed — run “Sync compendium” to render references.");
		}
		// Resolve to a bare code (bare slug → scoped candidates; prefixed/linked → SccResolver).
		const code = this.toCode(raw, index);
		if (code === null) return; // toCode already rendered the right card
		const resolution = this.cx.sccAnchors?.resolve(`scc:${code}`);
		if (!resolution || resolution.kind === "unresolved") {
			return this.errorCard(root, `Unknown SCC code \`${code}\`. Try Draw Steel: Insert compendium reference.`);
		}
		if (resolution.kind === "web") {
			return this.webCard(root, code, resolution.url);
		}
		// vault → typed model + source, or the "found but not renderable" degrade.
		const entity = await index.getEntity(code);
		const parsed = entity ? await entity.model() : undefined;
		if (!entity || parsed === undefined) {
			const name = entity?.name ?? code;
			return this.errorCard(root,
				`*${name}* found but not renderable — this compendium predates the required block; re-sync.`);
		}
		const source: RefSource = { file: entity.file, frontmatter: entity.frontmatter, body: await entity.body() };
		this.mountBase(root, parsed as M, source);
	}

	/** Bare slug → code (scoped, §1.3); prefixed/linked → strip to code via SccResolver’s data-scc. */
	private toCode(raw: string, index: NonNullable<RenderContext["compendium"]>): string | null {
		const isPrefixed = /^(scc(\.v\d+)?:|@|\[\[)/.test(raw);
		if (isPrefixed) {
			const resolution = this.cx.sccAnchors?.resolve(raw);
			// scc: forms carry a code; @path/[[..]] resolve via the legacy providers elsewhere —
			// for the display/statblock ref case we require an scc code, so fall to unknown if not.
			if (resolution && resolution.kind !== "unresolved") return this.codeFromRaw(raw);
			if (raw.startsWith("scc")) return this.codeFromRaw(raw);
			this.errorCard(this.rootEl, `Reference \`${raw}\` is not an SCC code.`);
			return null;
		}
		if (raw.includes("/")) return raw; // already a full source/type/item code
		const candidates = index.resolveSlug(raw, this.opts.sccType);
		if (candidates.length === 1) return candidates[0];
		if (candidates.length === 0) {
			this.errorCard(this.rootEl, `No compendium entry matches \`${raw}\` for this element.`);
		} else {
			this.errorCard(this.rootEl,
				`\`${raw}\` is ambiguous — paste a full code: ${candidates.map((c) => `\`${c}\``).join(", ")}`);
		}
		return null;
	}

	private codeFromRaw(raw: string): string {
		return raw.trim().replace(/^scc(\.v\d+)?:/, "").split("#")[0].trim();
	}

	private mountBase(root: HTMLElement, model: M, source?: RefSource): void {
		const view = this.base.createView(this.cx);
		if (source && isSourceAware(view)) view.setSource(source);
		this.addChild(view);
		void view.mount(root, model);
	}

	private errorCard(root: HTMLElement, message: string): void {
		renderErrorCard(root, { id: this.base.id, name: this.base.name }, new Error(message));
	}

	private webCard(root: HTMLElement, code: string, url: string): void {
		const card = root.createDiv({ cls: "dse-ref-web-card", attr: { "data-scc": code } });
		card.createDiv({ cls: "dse-ref-web-card__msg", text: "Not installed locally." });
		const a = card.createEl("a", { cls: "dse-ref-web-card__link", text: "View on steelcompendium.io", href: url });
		a.setAttribute("target", "_blank");
		a.setAttribute("rel", "noopener");
		card.createDiv({ cls: "dse-ref-web-card__cta", text: "Run “Sync compendium” to embed it here." });
	}
}

function isSourceAware(v: unknown): v is { setSource(s: RefSource): void } {
	return typeof (v as { setSource?: unknown }).setSource === "function";
}
```

> **Verify** `renderErrorCard` is exported from `pipeline.ts` (recon: it is, at `pipeline.ts:128`, signature `renderErrorCard(root, def: Pick<ElementDefinition,'id'|'name'>, error)`). If `createEl`/`createDiv`'s `attr` option is not in the mock's typings, set attributes with `.setAttribute` instead.

- [ ] **Step 5: Write the dom test for `RefUnwrapView`** (inline passthrough + degrade cards)

Create `test/dom/elements/refUnwrapView.test.ts`. Build a trivial base def (an `ElementView` that renders `data-test-model`), wrap it with `withReference`, and drive it through the REAL `ElementPipeline` (reuse the `makeDeps()`/`makeHost()` shape from `test/dom/elements/horizontal-rule.test.ts`). Cover:
- inline body → base view renders (no error card, no ref resolution).
- ref body with **no `cx.compendium`** → "Compendium not installed" card.
- ref body, stub `cx.compendium.available=false` → same.
- Provide a fake `cx.compendium` + `cx.sccAnchors` (build the pipeline deps with `compendium`/`sccAnchors` set) resolving a code to `web` → `.dse-ref-web-card` with the steelcompendium.io link.
- unresolved → error card naming the code.

(Full model resolution against real fixtures is exercised in Task 4/6; here the base is a stub and the focus is the ladder.)

- [ ] **Step 6: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/elements/withReference.test.ts test/dom/elements/refUnwrapView.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/shared/withReference.ts src/elements/shared/RefUnwrapView.ts src/framework/context.ts src/framework/pipeline.ts test/unit/elements/withReference.test.ts test/dom/elements/refUnwrapView.test.ts
git -C draw-steel-elements commit -m "feat: withReference wrapper + RefUnwrapView degrade ladder + cx.compendium seam (spec §1)"
```

---

### Task 4: reference-capable `ds-statblock` / `ds-feature` / `ds-featureblock` (spec §1, §7)

Wrap the three existing defs with `withReference` **at registration** — do NOT rewrite their views (recon: their `parse` is `(_data, raw) => XConfig.readYaml(raw)`; `withReference.parse` calls `base.parse(data, raw)` on the inline path, so inline YAML still flows through `readYaml(raw)` unchanged). By-SCC resolution flows through `CompendiumIndex.getEntity().model()`, whose `TYPE_ADAPTERS` entry for these types calls the SAME `XConfig.readYaml` over the extracted ds-block text — so a by-SCC statblock renders **byte-identical** to the inline one. Statblock refs are hard-gated on F2 OD-1(A) (ds-sb blocks in md-dse); that shipped (`steel-etl 33a84a8`, data-unified `f40b10b8` per Plan 04 status), so this is live.

**Files:**
- Modify: `src/elements/statblock/definition.ts`, `src/elements/feature/definition.ts`, `src/elements/featureblock/definition.ts`
- Test: `test/dom/elements/statblockRef.test.ts`

**Interfaces:** each `export const xElement` becomes `withReference(baseXElement, { sccType: /…/ })`. Keep `id`/`name`/`aliases`/`authoring` intact (they spread through `withReference`). Extract the base into a local `const baseStatblockElement` so `withReference` wraps it. `sccType`: statblock `/statblock$/`, feature `/^feature($|\.)/`, featureblock `/featureblock$/` (bare-slug scope; verified against `TYPE_ADAPTERS`).

- [ ] **Step 1: Write the failing dom test — by-SCC statblock === inline statblock**

Create `test/dom/elements/statblockRef.test.ts`: load the real `monster/goblin/statblock/goblin-stinker.md` md-dse fixture into a fake vault, build pipeline deps with a live `SccResolver` + `CompendiumIndex` + `sccAnchors` (all pointing at that vault), then render two blocks:
1. `ds-statblock` with body `scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker`
2. `ds-statblock` with the **inline** goblin YAML (extracted ds-sb block text from the same fixture).

Assert both produce the same rendered statblock DOM (compare the `[data-dse-element="statblock"]` subtree's key text: title "Goblin Stinker", the "Horde Controller" line, EV, feature count), and neither has a `.dse-error-card`. Add: a bare-slug `goblin-stinker` body renders the same (scoped by `/statblock$/`), and an `@path`/`[[wikilink]]` body still resolves via the legacy path (unchanged).

> The test wires the pipeline like `horizontal-rule.test.ts`'s `makeDeps()` but adds `sccAnchors: sccResolver` and `compendium: createCompendiumIndex(app, sccResolver)` to the deps, and registers `SccRefProvider` on `refs`. Factor a `makeCompendiumDeps(vault)` helper into a shared `test/dom/elements/_refHarness.ts` for reuse in Tasks 5–9.

- [ ] **Step 2: Run to verify failure** (`withReference` not yet applied → ref body errors)

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/statblockRef.test.ts'
```

- [ ] **Step 3: Wrap the three defs**

Example for `src/elements/statblock/definition.ts` (feature/featureblock identical shape):

```ts
import { withReference } from "@/elements/shared/withReference";
// … existing imports …

const baseStatblockElement: ElementDefinition<StatblockConfig> = {
	id: 'statblock',
	name: 'Statblock',
	aliases: ['ds-sb', 'ds-statblock'],
	shape: 'static',
	parse: (_data, raw) => StatblockConfig.readYaml(raw),
	autoResolveRefs: false,
	createView: (cx) => new StatblockElementView(cx),
	authoring: { example: statblockExample, sdkModel: 'statblock' },
};

export const statblockElement = withReference(baseStatblockElement, { sccType: /statblock$/ });
```

Do NOT touch `StatblockElementView`/`FeatureElementView`/`FeatureblockElementView`. The registry registrations in `main.ts` (`registry.register(statblockElement)` …) are unchanged — they now register the wrapped def.

- [ ] **Step 4: Run + full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/statblockRef.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/statblock/definition.ts src/elements/feature/definition.ts src/elements/featureblock/definition.ts test/dom/elements/statblockRef.test.ts test/dom/elements/_refHarness.ts
git -C draw-steel-elements commit -m "feat: reference-by-SCC for ds-statblock/ds-feature/ds-featureblock (spec §1)"
```

> **Golden-render pins:** the existing statblock/feature/featureblock dom goldens render through `id`/`aliases` that are unchanged; `withReference` spreads them, so the harness `fixtures.test.ts` count stays 12 here (no new element — these are wraps). If any golden compares the def *object* identity, update it to the wrapped export. FIXTURES/aliases are untouched by Task 4.

---

### Task 5: `CardLayout<M>` + `DisplayCardView` shared frame (spec §2.4)

The shared, declarative card frame every display element renders through — `data` (ten small `CardLayout` objects), not ten view classes. All markdown goes through `this.renderMarkdown` (so `rewriteSccAnchors` fires for free, and nested `ds-*` blocks recurse through the pipeline). The pipeline stamps `data-dse-element` on the root (recon: `pipeline.ts:200`), so `DisplayCardView` renders its frame INTO the root and does not re-stamp it. It implements `SourceAware` (Task 3) for the by-SCC hybrid (Task 9). CSS is minimal and token-based — **no `:root` token additions**; reuse existing DSE tokens; steel/legacy/print-safe.

**Files:**
- Create: `src/elements/shared/CardLayout.ts` (types + `DisplayCardView`), `src/elements/shared/cardFrame.css`
- Test: `test/dom/elements/displayCard.test.ts`

**Interfaces:**
```ts
interface Badge { text: string; tone?: "keyword" | "echelon" | "rarity" | "type"; }
interface FieldRow<M> { label: string; value: (m: M) => string | undefined; markdown?: boolean;
	/** By-SCC: suppress this row when the source body already contains it (§2.3 double-render guard). */
	omitWhenSource?: boolean; }
interface CardLayout<M> {
	title: (m: M) => string;
	subtitle?: (m: M) => string | undefined;
	badges?: (m: M) => Badge[];
	flavor?: (m: M) => string | undefined;
	rows?: FieldRow<M>[];
	body?: (m: M) => string | undefined;      // inline-mode trailing markdown (usually m.content)
	/** By-SCC hybrid: render the resolved file body instead of `body`. Default true. */
	useSourceBody?: boolean;
}
class DisplayCardView<M> extends ElementView<M> implements SourceAware { constructor(cx, layout: CardLayout<M>); setSource(s: RefSource): void; }
```

- [ ] **Step 1: Write the failing dom test**

Create `test/dom/elements/displayCard.test.ts` with a hand-built tiny model + layout (title/subtitle/badges/flavor/rows/body), mount `DisplayCardView` through the pipeline (reuse `_refHarness.ts`), and assert the DOM structure: `.dse-card` frame under the `[data-dse-element]` root, `.dse-card__title`, `.dse-card__subtitle`, `.dse-card__badge` (one per badge, tone class), `.dse-card__flavor` (italic), a `.dse-card__rows` grid with `.dse-card__row` label+value pairs (undefined-valued rows omitted), and a `.dse-card__body` with rendered markdown. Assert markdown ran through `renderMarkdown` (a `**bold**` in body becomes `<strong>`). Assert `omitWhenSource` rows still render in **pure-model** (no-source) mode.

- [ ] **Step 2: Implement `DisplayCardView`** (frame builder; `createEl`/`createDiv` only; markdown via `renderMarkdown`)

```ts
export class DisplayCardView<M> extends ElementView<M> implements SourceAware {
	private source?: RefSource;
	constructor(cx: RenderContext, private layout: CardLayout<M>) { super(cx); }
	setSource(source: RefSource): void { this.source = source; }

	protected async onMount(root: HTMLElement, model: M): Promise<void> {
		const card = root.createDiv({ cls: "dse-card" });
		const head = card.createDiv({ cls: "dse-card__head" });
		head.createDiv({ cls: "dse-card__title", text: this.layout.title(model) });
		const subtitle = this.layout.subtitle?.(model);
		if (subtitle) head.createDiv({ cls: "dse-card__subtitle", text: subtitle });
		const badges = this.layout.badges?.(model) ?? [];
		if (badges.length) {
			const row = head.createDiv({ cls: "dse-card__badges" });
			for (const b of badges) row.createSpan({ cls: `dse-card__badge dse-card__badge--${b.tone ?? "type"}`, text: b.text });
		}
		const flavor = this.layout.flavor?.(model);
		if (flavor) await this.renderMarkdown(flavor, card.createDiv({ cls: "dse-card__flavor" }));

		const hybrid = this.source !== undefined;
		const rows = (this.layout.rows ?? []).filter((r) => !(hybrid && r.omitWhenSource));
		const rendered = rows.map((r) => ({ r, value: r.value(model) })).filter((x) => x.value != null && x.value !== "");
		if (rendered.length) {
			const grid = card.createDiv({ cls: "dse-card__rows" });
			for (const { r, value } of rendered) {
				const rowEl = grid.createDiv({ cls: "dse-card__row" });
				rowEl.createSpan({ cls: "dse-card__row-label", text: r.label });
				const valEl = rowEl.createSpan({ cls: "dse-card__row-value" });
				if (r.markdown) await this.renderMarkdown(value!, valEl); else valEl.setText(value!);
			}
		}

		// Body: hybrid (source file body) when present + useSourceBody !== false; else inline body.
		const useSource = hybrid && this.layout.useSourceBody !== false;
		const bodyMd = useSource ? this.source!.body : this.layout.body?.(model);
		if (bodyMd && bodyMd.trim()) await this.renderMarkdown(bodyMd, card.createDiv({ cls: "dse-card__body" }));
	}
}
```

Add `cardFrame.css` (token-based; import it wherever element CSS is aggregated — verify how existing element CSS is bundled, e.g. a `styles.css` import list or esbuild css entry). Use existing DSE color/spacing tokens only; give `.dse-card__badge--{keyword,echelon,rarity,type}` distinct-but-tokened backgrounds; ensure `@media print` keeps it legible; no `:root {}` block.

- [ ] **Step 3: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/displayCard.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/shared/CardLayout.ts src/elements/shared/cardFrame.css test/dom/elements/displayCard.test.ts
git -C draw-steel-elements commit -m "feat: CardLayout + DisplayCardView shared card frame (spec §2.4)"
```

---

### Task 6: `displayFamily()` factory + first three instances (`ds-kit`, `ds-condition`, `ds-treasure`)

The factory that turns one descriptor into one reference-capable element, plus the first three layouts. Real fixtures cut from data-unified. Registration + `example.yaml` + harness FIXTURES/aliases + fixtures-count bump (**12 → 15**) all land in this commit.

**Files:**
- Create: `src/elements/display/displayFamily.ts`, `src/elements/display/layouts.ts` (kit/condition/treasure), `src/elements/display/index.ts`
- Create: `src/elements/display/{kit,condition,treasure}/example.yaml` (cut from `yaml/` format)
- Create: `test/fixtures/md-dse/{kit,condition,treasure}/…` (cut from `md-dse/` format — kit/condition already added in Task 2)
- Modify: `main.ts` (register), `visual-harness/entry.ts` (FIXTURES +3), `visual-harness/aliases.json` (+3), `test/dom/visual-harness/fixtures.test.ts` (count 12→15)
- Test: `test/dom/elements/displayFamily.test.ts`

**Interfaces:**
```ts
interface DisplayFamilyDescriptor<M> {
	id: string; aliases: readonly [string, ...string[]]; name: string;
	adapter: (source: Partial<any>) => M;   // Model.modelDTOAdapter
	sccType: string | RegExp; layout: CardLayout<M>;
}
function displayFamily<M>(d: DisplayFamilyDescriptor<M>): ElementDefinition<RefOrInline<M>>;
```

- [ ] **Step 1: Copy real fixtures (read-only, from the workspace checkout)**

```bash
cd draw-steel-elements
S=/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified
# md-dse fixtures (by-SCC dom tests)
mkdir -p test/fixtures/md-dse/{kit,condition,treasure/leveled/weapon}
cp "$S/md-dse/kit/panther.md"                                   test/fixtures/md-dse/kit/
cp "$S/md-dse/condition/bleeding.md"                            test/fixtures/md-dse/condition/
cp "$S/md-dse/treasure/leveled/weapon/executioners-blade.md"   test/fixtures/md-dse/treasure/leveled/weapon/
# inline-mode harness fixtures (example.yaml — full SDK DTO from the yaml/ format)
mkdir -p src/elements/display/{kit,condition,treasure}
cp "$S/yaml/kit/panther.yaml"                                  src/elements/display/kit/example.yaml
cp "$S/yaml/condition/bleeding.yaml"                           src/elements/display/condition/example.yaml
cp "$S/yaml/treasure/leveled/weapon/executioners-blade.yaml"  src/elements/display/treasure/example.yaml
```

Verify each `example.yaml` parses through its `modelDTOAdapter` (the harness `fixtures.test.ts` will enforce a clean mount). If a `yaml/` DTO carries keys the inline `example.yaml` should not preview (e.g. `metadata`), it is harmless — the SDK tolerates extras.

- [ ] **Step 2: Write the failing dom test**

Create `test/dom/elements/displayFamily.test.ts`: for each of kit/condition/treasure, render **inline** (the `example.yaml` body) and assert the card shows the expected title/badges/rows (e.g. kit → "Panther", a signature-ability body; condition → "Bleeding" + "Condition" badge + content; treasure → name + rarity/keywords badges + level rows). Then render **by-SCC** (bare slug `panther`/`bleeding` + full `scc.v1:` code) against a fake vault seeded with the md-dse fixtures via `_refHarness.ts`, and assert the same title renders with **hybrid** body (source markdown) and no error card. Assert bare-slug scoping: `ds-kit` body `bleeding` → error card (no kit named bleeding).

- [ ] **Step 3: Implement `displayFamily` + the three layouts**

`displayFamily.ts`:

```ts
import { parseYaml } from "obsidian";
import type { ElementDefinition } from "@/framework/registry";
import { DisplayCardView, CardLayout } from "@/elements/shared/CardLayout";
import { withReference, RefOrInline } from "@/elements/shared/withReference";

export interface DisplayFamilyDescriptor<M> {
	id: string;
	aliases: readonly [string, ...string[]];
	name: string;
	adapter: (source: Partial<any>) => M;
	sccType: string | RegExp;
	layout: CardLayout<M>;
}

export function displayFamily<M>(d: DisplayFamilyDescriptor<M>): ElementDefinition<RefOrInline<M>> {
	const base: ElementDefinition<M> = {
		id: d.id, name: d.name, aliases: d.aliases, shape: "static",
		autoResolveRefs: false,
		parse: (data, raw) => d.adapter(typeof data === "string" || data == null ? parseYaml(raw) : (data as any)),
		createView: (cx) => new DisplayCardView<M>(cx, d.layout),
		authoring: { example: undefined },   // example.yaml imported in index.ts
	};
	return withReference(base, { sccType: d.sccType });
}
```

`layouts.ts` — kit/condition/treasure (fields verified against the SDK recon; **all `*_bonus` and Treasure `level` are strings**):

```ts
import { Kit, Condition, Treasure } from "steel-compendium-sdk";
import { CardLayout, Badge } from "@/elements/shared/CardLayout";

export const kitLayout: CardLayout<Kit> = {
	title: (m) => m.name,
	subtitle: (m) => m.kit_type,
	badges: (m) => [
		...(m.armor ?? []).map((a): Badge => ({ text: a, tone: "keyword" })),
		...(m.weapon ?? []).map((w): Badge => ({ text: w, tone: "keyword" })),
	],
	flavor: (m) => m.flavor,
	rows: [
		{ label: "Stamina", value: (m) => m.stamina_bonus },
		{ label: "Speed", value: (m) => m.speed_bonus },
		{ label: "Stability", value: (m) => m.stability_bonus },
		{ label: "Melee damage", value: (m) => m.melee_damage_bonus },
		{ label: "Ranged damage", value: (m) => m.ranged_damage_bonus },
		{ label: "Melee distance", value: (m) => m.melee_distance_bonus },
		{ label: "Ranged distance", value: (m) => m.ranged_distance_bonus },
		{ label: "Disengage", value: (m) => m.disengage_bonus },
		{ label: "Equipment", value: (m) => m.equipment_text, markdown: true },
	],
	// Inline mode: render the signature ability from the model; by-SCC uses the source body
	// (which already carries the nested ```ds-feature block — recurses through the pipeline).
	body: (m) => m.signature_ability
		? "```ds-feature\n" + featureToYaml(m.signature_ability) + "\n```"
		: m.content,
	useSourceBody: true,
};

export const conditionLayout: CardLayout<Condition> = {
	title: (m) => m.name,
	badges: () => [{ text: "Condition", tone: "type" }],
	body: (m) => m.content,
	useSourceBody: true,
};

export const treasureLayout: CardLayout<Treasure> = {
	title: (m) => m.name,
	subtitle: (m) => [m.treasure_type, m.level != null ? `Level ${m.level}` : undefined].filter(Boolean).join(" · ") || undefined,
	badges: (m) => [
		...(m.echelon ? [{ text: `Echelon ${m.echelon}`, tone: "echelon" as const }] : []),
		...(m.rarity ? [{ text: m.rarity, tone: "rarity" as const }] : []),
		...(m.keywords ?? []).map((k): Badge => ({ text: k, tone: "keyword" })),
	],
	rows: [
		{ label: "Prerequisite", value: (m) => m.item_prerequisite },
		{ label: "Project", value: (m) => [m.project_source, m.project_roll_characteristic, m.project_goal != null ? String(m.project_goal) : undefined].filter(Boolean).join(" · ") || undefined },
		{ label: "Effect", value: (m) => m.effect, markdown: true, omitWhenSource: true },
	],
	body: (m) => m.content,
	useSourceBody: true,
};
```

> `featureToYaml(signature_ability)` — reuse the SDK's `Feature.toDTO()` + Obsidian `stringifyYaml`, or the existing `FeatureConfig` serializer if one exists; verify the exact helper. If none exists, the simplest correct path is `stringifyYaml(m.signature_ability.toDTO())`. (Inline kit rendering of the signature ability is a nice-to-have; the by-SCC path — the primary use — renders it from the source body regardless.)

`index.ts`:

```ts
import { displayFamily } from "./displayFamily";
import { Kit, Condition, Treasure } from "steel-compendium-sdk";
import { kitLayout, conditionLayout, treasureLayout } from "./layouts";
import kitExample from "./kit/example.yaml";
import conditionExample from "./condition/example.yaml";
import treasureExample from "./treasure/example.yaml";

export const kitElement = displayFamily<Kit>({ id: "kit", aliases: ["ds-kit"], name: "Kit", adapter: Kit.modelDTOAdapter, sccType: /^kit$/, layout: kitLayout });
export const conditionElement = displayFamily<Condition>({ id: "condition", aliases: ["ds-condition"], name: "Condition", adapter: Condition.modelDTOAdapter, sccType: /^condition$/, layout: conditionLayout });
export const treasureElement = displayFamily<Treasure>({ id: "treasure", aliases: ["ds-treasure"], name: "Treasure", adapter: Treasure.modelDTOAdapter, sccType: /^treasure$/, layout: treasureLayout });

// authoring.example is on the WRAPPED def via spread; re-attach the imported example text:
(kitElement.authoring ??= {}).example = kitExample;
(conditionElement.authoring ??= {}).example = conditionExample;
(treasureElement.authoring ??= {}).example = treasureExample;

export const displayElements = [kitElement, conditionElement, treasureElement];
```

> **example wiring:** `authoring.example` must survive the `withReference` spread. Simplest robust approach: pass `example` into the descriptor and set `base.authoring = { example }` inside `displayFamily` before wrapping. Adjust `DisplayFamilyDescriptor` to carry `example: string` and drop the post-hoc reassignment — cleaner and keeps `authoring.example` on the wrapped def for D9's `/ds` suggest.

- [ ] **Step 4: Register + wire harness (SAME commit)**

- `main.ts`: import `displayElements`, add `for (const el of displayElements) registry.register(el);` inside `registerFrameworkElementDefinitions` (after the existing 12).
- `visual-harness/entry.ts`: import the three `example.yaml`, add `kit`/`condition`/`treasure` to `FIXTURES`.
- `visual-harness/aliases.json`: add `"kit": "ds-kit"`, `"condition": "ds-condition"`, `"treasure": "ds-treasure"`.
- `test/dom/visual-harness/fixtures.test.ts`: change the `(all 12)` assertion to `(all 15)` and its title text.

- [ ] **Step 5: Run everything + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/displayFamily.test.ts test/dom/visual-harness && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/display main.ts visual-harness/entry.ts visual-harness/aliases.json test/dom/visual-harness/fixtures.test.ts test/dom/elements/displayFamily.test.ts test/fixtures/md-dse
git -C draw-steel-elements commit -m "feat: displayFamily factory + ds-kit/ds-condition/ds-treasure (spec §2)"
```

---

### Task 7: remaining seven display layouts (`ds-ancestry`, `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`, `ds-complication`)

Seven more `displayFamily(...)` descriptors + layouts + fixtures + harness wiring (FIXTURES/aliases **15 → 22**). Per-type fields are verified against the SDK models (recon) and the spec §2.4 table. No new machinery.

**Files:**
- Modify: `src/elements/display/layouts.ts` (+7 layouts), `src/elements/display/index.ts` (+7 descriptors)
- Create: `src/elements/display/{ancestry,culture,career,class,title,perk,complication}/example.yaml`
- Create: `test/fixtures/md-dse/{ancestry,culture,career,class,title,perk,complication}/…`
- Modify: `main.ts` (already loops `displayElements` — just extend the array), `visual-harness/entry.ts`, `aliases.json`, `fixtures.test.ts` (15→22)
- Test: extend `test/dom/elements/displayFamily.test.ts` (parametrize over all ten)

- [ ] **Step 1: Copy real fixtures**

```bash
cd draw-steel-elements
S=/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified
for t in ancestry culture career class title perk complication; do mkdir -p test/fixtures/md-dse/$t src/elements/display/$t; done
cp "$S/md-dse/ancestry/human.md"                    test/fixtures/md-dse/ancestry/
cp "$S/md-dse/culture/urban.md"                      test/fixtures/md-dse/culture/
cp "$S/md-dse/career/soldier.md"                     test/fixtures/md-dse/career/
cp "$S/md-dse/class/tactician.md"                    test/fixtures/md-dse/class/
cp "$S/md-dse/title/champion-competitor.md"          test/fixtures/md-dse/title/
cp "$S/md-dse/perk/familiar.md"                      test/fixtures/md-dse/perk/
cp "$S/md-dse/complication/chosen-one.md"            test/fixtures/md-dse/complication/
cp "$S/yaml/ancestry/human.yaml"                     src/elements/display/ancestry/example.yaml
cp "$S/yaml/culture/urban.yaml"                      src/elements/display/culture/example.yaml
cp "$S/yaml/career/soldier.yaml"                     src/elements/display/career/example.yaml
cp "$S/yaml/class/tactician.yaml"                    src/elements/display/class/example.yaml
cp "$S/yaml/title/champion-competitor.yaml"          src/elements/display/title/example.yaml
cp "$S/yaml/perk/familiar.yaml"                      src/elements/display/perk/example.yaml
cp "$S/yaml/complication/chosen-one.yaml"            src/elements/display/complication/example.yaml
```

- [ ] **Step 2: Add the seven layouts** (fields per recon; note strings-that-look-numeric)

```ts
export const ancestryLayout: CardLayout<Ancestry> = {
	title: (m) => m.name,
	flavor: (m) => m.flavor,
	rows: [
		{ label: "Signature trait", value: (m) => m.signature_trait_name && m.signature_trait_description
			? `**${m.signature_trait_name}.** ${m.signature_trait_description}` : m.signature_trait_name, markdown: true },
		{ label: "Ancestry points", value: (m) => m.ancestry_points != null ? String(m.ancestry_points) : undefined },
		{ label: "Purchased traits", value: (m) => (m.purchased_traits ?? []).map((t) => `${t.name} (${t.cost})`).join(", ") || undefined },
	],
	body: (m) => m.content, useSourceBody: true,
};
export const cultureLayout: CardLayout<Culture> = {
	title: (m) => m.name, subtitle: (m) => m.culture_benefit_type, flavor: (m) => m.flavor,
	rows: [
		{ label: "Environment", value: (m) => m.environment },
		{ label: "Organization", value: (m) => m.organization },
		{ label: "Upbringing", value: (m) => m.upbringing },
		{ label: "Language", value: (m) => m.language },
		{ label: "Quick-build skill", value: (m) => m.quick_build_skill },
		{ label: "Skill options", value: (m) => (m.skill_options ?? []).join(", ") || undefined },
	],
	body: (m) => m.content, useSourceBody: true,
};
export const careerLayout: CardLayout<Career> = {
	title: (m) => m.name, flavor: (m) => m.flavor,
	badges: (m) => [
		...(m.renown != null ? [{ text: `Renown ${m.renown}`, tone: "type" as const }] : []),
		...(m.wealth ? [{ text: `Wealth ${m.wealth}`, tone: "type" as const }] : []),
	],
	rows: [
		{ label: "Skills", value: (m) => [(m.skills ?? []).join(", "), m.skill_group].filter(Boolean).join("; ") || undefined },
		{ label: "Language", value: (m) => m.language },
		{ label: "Project points", value: (m) => m.project_points != null ? String(m.project_points) : undefined },
		{ label: "Perk", value: (m) => [m.perk, m.perk_group].filter(Boolean).join(" · ") || undefined },
		{ label: "Inciting incidents", value: (m) => (m.inciting_incidents ?? []).map((i) => `${i.roll}: ${i.name ?? i.description}`).join("; ") || undefined, omitWhenSource: true },
	],
	body: (m) => m.content, useSourceBody: true,
};
export const classLayout: CardLayout<Class> = {
	title: (m) => m.name, subtitle: (m) => m.heroic_resource, flavor: (m) => m.flavor,
	badges: (m) => (m.primary_characteristics ?? []).map((c): Badge => ({ text: c, tone: "keyword" })),
	rows: [
		{ label: "Starting stamina", value: (m) => m.starting_stamina != null ? String(m.starting_stamina) : undefined },
		{ label: "Stamina / level", value: (m) => m.stamina_per_level != null ? String(m.stamina_per_level) : undefined },
		{ label: "Recoveries", value: (m) => m.recoveries != null ? String(m.recoveries) : undefined },
		{ label: "Potencies", value: (m) => [m.weak_potency, m.average_potency, m.strong_potency].filter(Boolean).join(" / ") || undefined },
		{ label: "Skills", value: (m) => [(m.skills ?? []).join(", "), m.skill_group].filter(Boolean).join("; ") || undefined },
	],
	body: (m) => m.content, useSourceBody: true,
};
export const titleLayout: CardLayout<Title> = {
	title: (m) => m.name, flavor: (m) => m.flavor,
	badges: (m) => m.echelon ? [{ text: `Echelon ${m.echelon}`, tone: "echelon" }] : [],
	rows: [
		{ label: "Prerequisite", value: (m) => m.prerequisite },
		{ label: "Effect", value: (m) => m.effect, markdown: true, omitWhenSource: true },
		{ label: "Benefits", value: (m) => (m.benefits ?? []).join("; ") || undefined },
	],
	body: (m) => m.content, useSourceBody: true,
};
export const perkLayout: CardLayout<Perk> = {
	title: (m) => m.name, subtitle: (m) => m.perk_group,
	flavor: (m) => m.flavor,
	rows: [{ label: "Prerequisites", value: (m) => m.prerequisites }],
	body: (m) => m.content, useSourceBody: true,
};
export const complicationLayout: CardLayout<Complication> = {
	title: (m) => m.name, flavor: (m) => m.flavor,
	rows: [
		{ label: "Benefit", value: (m) => m.benefit, markdown: true, omitWhenSource: true },
		{ label: "Drawback", value: (m) => m.drawback, markdown: true, omitWhenSource: true },
	],
	body: (m) => m.content, useSourceBody: true,
};
```

- [ ] **Step 3: Extend `index.ts`, register, wire harness (SAME commit)** — add the seven descriptors to `displayElements`, import seven `example.yaml`, extend `FIXTURES` + `aliases.json` (+7), bump `fixtures.test.ts` 15 → 22. Parametrize `displayFamily.test.ts` so every one of the ten mounts inline **and** by-SCC with no error card.

- [ ] **Step 4: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/display main.ts visual-harness test/dom test/fixtures/md-dse
git -C draw-steel-elements commit -m "feat: ds-ancestry/culture/career/class/title/perk/complication display layouts (spec §2)"
```

---

### Task 8: `genericCard()` + `ds-rule` (spec §3)

The model-less sibling factory: same `DisplayCardView` frame, no SDK adapter. `ds-rule` is reference-only (rules come from the compendium; an inline body is treated as raw markdown for the card — OD-D6-7). The "model" is a `GenericNote = { name, type, body }` lifted from frontmatter + file body. Harness FIXTURES/aliases **22 → 23**.

**Files:**
- Modify: `src/elements/display/displayFamily.ts` (add `genericCard`), `src/elements/display/index.ts` (add `ruleElement`)
- Create: `src/elements/display/rule/example.yaml` (raw-markdown inline fallback — NOT a DTO)
- Create: `test/fixtures/md-dse/rule/combat/opportunity-attack.md`
- Modify: `main.ts`, `visual-harness/entry.ts`, `aliases.json`, `fixtures.test.ts` (22→23)
- Test: `test/dom/elements/ruleCard.test.ts`

**Interfaces:**
- `interface GenericNote { name: string; type: string; body: string; }`
- `function genericCard(cfg: { id: string; aliases: readonly [string, ...string[]]; name: string; sccType: string | RegExp; example: string; }): ElementDefinition<RefOrInline<GenericNote>>`

- [ ] **Step 1: Fixture + failing test**

```bash
cd draw-steel-elements
S=/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified
mkdir -p test/fixtures/md-dse/rule/combat src/elements/display/rule
cp "$S/md-dse/rule/combat/opportunity-attack.md" test/fixtures/md-dse/rule/combat/
printf 'The rule card renders this body as **markdown** with no SDK model.\n' > src/elements/display/rule/example.yaml
```

Create `test/dom/elements/ruleCard.test.ts`: inline body (raw markdown) → `.dse-card` with the markdown rendered (`<strong>`), title falls back to a sensible default (see below); by-SCC (`ds-rule` body `opportunity-attack` or `scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack`) against the seeded vault → card titled from frontmatter `item_name`, body = source markdown, no error card, and any `scc.v1:` links inside get rewritten (assert an `a.internal-link` or `.ds-scc-web` appears if the body links out).

- [ ] **Step 2: Implement `genericCard`** (shares `DisplayCardView`; a `GenericNote` layout; ref path builds the note from `RefSource`)

```ts
export interface GenericNote { name: string; type: string; body: string; }

const genericLayout: CardLayout<GenericNote> = {
	title: (m) => m.name,
	badges: (m) => m.type ? [{ text: humanizeType(m.type), tone: "type" }] : [],
	body: (m) => m.body,
	useSourceBody: false,   // GenericNote.body already IS the source/inline body
};

export function genericCard(cfg: {
	id: string; aliases: readonly [string, ...string[]]; name: string;
	sccType: string | RegExp; example: string;
}): ElementDefinition<RefOrInline<GenericNote>> {
	const base: ElementDefinition<GenericNote> = {
		id: cfg.id, name: cfg.name, aliases: cfg.aliases, shape: "static",
		autoResolveRefs: false,
		// Inline: no SDK model — the raw body IS the card body (OD-D6-7 raw-markdown fallback).
		parse: (_data, raw) => ({ name: cfg.name, type: "", body: raw }),
		createView: (cx) => new DisplayCardView<GenericNote>(cx, genericLayout),
		authoring: { example: cfg.example },
	};
	return withReference(base, { sccType: cfg.sccType });
}
```

The by-SCC path threads a `RefSource`; but `DisplayCardView` for `GenericNote` needs the note built from that source, not from the inline `parse`. Two clean options — pick one and note it:
- **(a, preferred)** Give `genericCard` its own tiny view (`GenericCardView extends DisplayCardView<GenericNote>`) that overrides `setSource` to rebuild `this.model = { name: source.frontmatter.item_name ?? …, type: source.frontmatter.type, body: source.body }` before render, and set `useSourceBody:false` so the body comes from `model.body`. This keeps `CompendiumIndex.getEntity().model()` returning `undefined` for rule types (no adapter) — which `RefUnwrapView` would treat as "not renderable". **Therefore** register a `TYPE_ADAPTERS` entry for `rule.*` that returns a `GenericNote` (so `getEntity().model()` yields one), OR special-case model-less types in `RefUnwrapView` to fall back to a `GenericNote` built from `entity.frontmatter` + `entity.body()` when `model()` is `undefined` but the resolution is `vault`.
- Decision for the plan: **add a `rule.*` (and catch-all) `GenericNote` adapter to `TYPE_ADAPTERS`** — `matches: (t) => /^rule($|\.)/.test(t)`, `fromFile: async (app,file) => ({ name: item_name|name|basename, type, body: await extractBody(file) })`. This keeps `RefUnwrapView` uniform (it always gets a model), and `DisplayCardView` renders it via `genericLayout`. `getEntity().model()` then returns a `GenericNote` for rule notes.

Register in `index.ts`:

```ts
import ruleExample from "./rule/example.yaml";
export const ruleElement = genericCard({ id: "rule", aliases: ["ds-rule"], name: "Rule", sccType: /^rule($|\.)/, example: ruleExample });
```

- [ ] **Step 3: Register + harness (SAME commit)** — add `ruleElement` to registration (either append to `displayElements` or register separately after it), FIXTURES `rule`, `aliases.json` `"rule":"ds-rule"`, bump `fixtures.test.ts` 22 → 23.

- [ ] **Step 4: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/ruleCard.test.ts test/dom/visual-harness test/unit/services && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/display src/services/typeAdapters.ts main.ts visual-harness test/dom/elements/ruleCard.test.ts test/dom/visual-harness/fixtures.test.ts test/fixtures/md-dse/rule
git -C draw-steel-elements commit -m "feat: genericCard + ds-rule model-less compendium cards (spec §3)"
```

---

### Task 9: hybrid by-SCC render — frontmatter chrome + source body (spec §2.3, §9)

Tasks 5–8 already thread `RefSource` and set `useSourceBody`. Task 9 hardens the hybrid contract and its edge cases: the `omitWhenSource` suppressions (no double-render of a field the body already contains), nested `ds-feature`/`ds-sb` blocks in the source body recursing through `renderMarkdown` into real DSE cards (with their `scc.v1:` links rewritten), and a **depth guard** against a by-SCC body that itself references out (spec §9 risk — practical depth is 1 since compendium bodies carry pre-resolved links, not whole-block refs, but the guard is explicit).

**Files:**
- Modify: `src/elements/shared/RefUnwrapView.ts` (depth guard), `src/elements/shared/CardLayout.ts` (confirm `omitWhenSource` honored — already in Task 5)
- Test: `test/dom/elements/displayCardHybrid.test.ts`

- [ ] **Step 1: Write the failing/█ test** — using the real `kit/panther.md` fixture (its body carries a nested `ds-feature` block), render `ds-kit` by-SCC and assert: (a) the frontmatter-driven rows render (stamina/speed bonuses from frontmatter), (b) the nested `ds-feature` block in the source body renders as a real `[data-dse-element="feature"]` card (recursion), (c) a model-driven row flagged `omitWhenSource` does NOT appear in by-SCC mode but DOES in inline mode, (d) a synthetic fixture whose body contains a whole-block `ds-kit` self-reference does not infinitely recurse (renders an error/stops at the depth cap).

- [ ] **Step 2: Add the depth guard** — thread a depth counter via `RenderContext` session or a `WeakMap`/counter keyed on `cx.host.blockKey()`; when `RefUnwrapView` resolves a ref, increment; refuse past `MAX_REF_DEPTH = 2` with an error card ("reference nesting too deep"). Simplest: a module-level `Set<string>` of in-flight `blockKey|code` pairs, cleared on unmount — a resolving code already in the set is refused. Document the reasoning (compendium bodies are depth-1 in practice).

- [ ] **Step 3: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements/displayCardHybrid.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/elements/shared test/dom/elements/displayCardHybrid.test.ts
git -C draw-steel-elements commit -m "feat: hybrid by-SCC render (frontmatter chrome + source body) + ref depth guard (spec §2.3)"
```

---

### Task 10: compendium search + insert (spec §4)

The first `SuggestModal` in the repo (recon: all existing modals extend `DseModal`; no `SuggestModal`/`FuzzySuggestModal` anywhere). Fuzzy over `item_name` with `type:`/`source:` prefix filters, empty-index sync CTA. Two commands (`insert-compendium-reference` default, `insert-compendium-block`) with the insert-actions table (OD-D6-6: reference block is the default). The D9 editor-suggest provider is deferred (OD-D6-4) — this ships standalone.

**Files:**
- Create: `src/authoring/CompendiumSearchModal.ts`, `src/authoring/compendiumInsert.ts`
- Modify: `main.ts` (register the two commands, passing the live `CompendiumIndex` + `syncService`)
- Test: `test/dom/authoring/compendiumSearchModal.test.ts`

**Interfaces:**
- `class CompendiumSearchModal extends SuggestModal<CompendiumEntry>` (ctor `(app, index, onChoose, opts?)`); `getSuggestions(query)` parses `type:`/`source:` prefixes then `index.query(text, filters)`; `renderSuggestion(entry, el)` shows name + type chip + source + bare code (monospace); empty index → a single synthetic "Sync compendium" item whose selection triggers the sync CTA.
- `compendiumInsert.ts`: `function registerCompendiumInsertCommands(plugin, index, syncService)` adds the two commands; `function insertReferenceBlock(editor, entry)` / `insertInlineLink(editor, entry)` / `insertFullBlock(editor, entity)` / `copyCode(entry)` — the actions table. The element chosen for reference/full block is derived from `entry.type` → the matching `ds-<type>` alias (monster/statblock → `ds-statblock`, feature → `ds-feature`, kit → `ds-kit`, …), via a small `typeToAlias(type)` helper (reuse `adapterForType` ordering / a type→alias map co-located with `TYPE_ADAPTERS`).

Insert actions (per result; default = reference block, OD-D6-6):

| Action | Inserts |
|---|---|
| **Reference block** (default) | ```` ```ds-<type>\n<bare code>\n``` ```` |
| **Inline link** | `[Name](scc.v1:<code>)` |
| **Full block (snapshot)** | ```` ```ds-<type>\n<full DTO YAML>\n``` ```` — from `entity.model()` → `stringifyYaml(model.toDTO())` |
| **Copy code** | `scc:<code>` to clipboard |

- [ ] **Step 1: Write the failing test** — jsdom test constructing `CompendiumSearchModal` with a fake `CompendiumIndex` (seeded via `_refHarness.ts`): assert `getSuggestions("panth")` returns the kit entry; `getSuggestions("type:condition ")` filters to conditions; `getSuggestions("source:mcdm.monsters.v1 ")` filters by book; an empty index yields the single "Sync compendium" affordance. Test `insertReferenceBlock` writes the expected fenced block at the editor cursor (fake `Editor` with a `replaceSelection` spy), and `typeToAlias("monster.goblin.statblock")` → `"ds-statblock"`, `typeToAlias("kit")` → `"ds-kit"`.

> Obsidian's `SuggestModal` must exist in the test mock (`test/mocks/obsidian.ts`). Recon notes no `SuggestModal` is used yet — **verify the mock exports it**; if not, add a minimal `SuggestModal` base to the mock (constructor stores `app`; `getSuggestions`/`renderSuggestion`/`onChooseItem` are overridden) in the SAME commit, mirroring how `Modal`/`Setting` are mocked. This is a test-infra addition, not a runtime dep.

- [ ] **Step 2: Implement the modal + insert commands + `main.ts` wiring**

`main.ts`: after constructing `this.compendiumIndex = createCompendiumIndex(this.app, this.sccResolver)` (Task 11 wires this into onload) and `this.compendiumIndex.registerWatchers(this)`, call `registerCompendiumInsertCommands(this, this.compendiumIndex, this.syncService)`. The reference command opens `new CompendiumSearchModal(app, index, (entry) => insertReferenceBlock(activeEditor, entry))`; the block command uses `insertFullBlock`. Empty-index selection calls `this.syncCompendium()` (the existing method).

- [ ] **Step 3: Run + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/authoring/compendiumSearchModal.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/authoring/CompendiumSearchModal.ts src/authoring/compendiumInsert.ts main.ts test/dom/authoring/compendiumSearchModal.test.ts test/mocks/obsidian.ts
git -C draw-steel-elements commit -m "feat: compendium search modal + insert-reference/insert-block commands (spec §4)"
```

---

### Task 11: wiring sweep, docs-as-done, and full gates

Finalize the `main.ts` construction order, verify D9's `/ds` suggest auto-lists the new elements (it loops the registry — recon: `DsElementSuggest(app, registry)`), refresh docs, and run the whole-branch visual gates at their new counts.

**Files:**
- Modify: `main.ts` (construct `CompendiumIndex` once, thread it into the pipeline deps as `compendium`, `registerWatchers`, and reuse it for search/insert — remove any duplicate construction)
- Modify: `.repo-docs/integration.md` (D6 reference family; `CompendiumIndex`/`getStatblock` = D8's entry point; the OD-D6 decisions), `.repo-docs/index.md` if it indexes docs
- Modify: `CHANGELOG.md` (extend the existing **6.0.0** section — do not add a new version)
- Modify: workspace `CHANGELOG.md` (`## Unreleased` bullet — user-facing: "compendium reference cards, `ds-kit`…`ds-rule`, and compendium search/insert")
- Test: whole-suite + shots + obsidian-shots

- [ ] **Step 1: `main.ts` construction order** — construct `CompendiumIndex` right after `this.sccResolver` (it depends only on app + resolver), BEFORE `initializeElementFrameworkV2(...)` so it can be threaded into the pipeline deps as `compendium` (mirror how `this.sccResolver` is passed as `sccAnchors`). Add a `compendiumIndex` field, `this.compendiumIndex.registerWatchers(this)`, and pass it to `registerCompendiumInsertCommands`. Verify `initializeElementFrameworkV2`/`ElementFrameworkV2Services` accepts/threads the new `compendium` dep into `createRenderContext` (Task 3 added the seam; confirm the wiring reaches production, not just tests).

- [ ] **Step 2: Verify D9 `/ds` suggest auto-lists new elements** — no code change expected (the suggest loops `registry.all()`); add/confirm a test that `DsElementSuggest` offers `ds-kit`/`ds-rule`. Confirm the D9 per-element Insert command loop (`registerInsertCommands`) also picks them up. If either filters by `shape` or `authoring.example`, ensure display/rule defs satisfy it (they set `authoring.example`).

- [ ] **Step 3: Docs** — `.repo-docs/integration.md`: document the reference family, the by-SCC hybrid contract, `CompendiumIndex` as the typed accessor D8 consumes (`getStatblock(code)`), the `cx.compendium` seam, and record OD-D6-1(a hybrid)/-2(a seam)/-3(canonical aliases)/-4(suggest deferred)/-5(hover deferred)/-6(reference default)/-7(rule raw fallback). `CHANGELOG.md`: extend the 6.0.0 section with the reference cards, the ten display elements + `ds-rule`, reference-by-SCC for statblock/feature/featureblock, and compendium search/insert. Workspace `CHANGELOG.md`: one `## Unreleased` bullet.

- [ ] **Step 4: Full gates**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npm test'
devbox run -- bash -c 'cd draw-steel-elements && npm run shots'          # count grows by the new gallery fixtures × variants — record the new N
devbox run -- bash -c 'cd draw-steel-elements && npm run obsidian-shots' # ditto; if the obsidian camera has a separate fixture list, add the new elements there
```
`npx jest` must be green (1292 baseline + all new tests). `fixtures.test.ts` asserts **23**. `aliases.test.ts` deep-equals. Record the new `shots`/`obsidian-shots` counts in the commit message; if the obsidian camera uses a separate fixture wiring (recon: `visual-harness/obsidian-camera.mjs`), extend it to include the 11 new elements so both cameras cover them.

- [ ] **Step 5: Commit**

```bash
git -C draw-steel-elements add main.ts .repo-docs CHANGELOG.md test
git -C draw-steel-elements commit -m "feat: wire CompendiumIndex into pipeline+commands; D6 docs + gates"
git add CHANGELOG.md && git commit -m "docs(changelog): D6 compendium reference family (Unreleased)"
```

---

## Self-review (spec-coverage sweep)

- **§1** reference-by-SCC → Tasks 3 (`withReference`/`RefUnwrapView`/`detectWholeBlockRef`, §1.2–1.5 degrade ladder) + 4 (statblock/feature/featureblock).
- **§2** display family → Tasks 5 (`CardLayout`/`DisplayCardView`, §2.4), 6 (`displayFamily` + 3), 7 (+7), 9 (§2.3 hybrid + `omitWhenSource`/`useSourceBody`).
- **§3** `ds-condition` (Task 6) + `ds-rule`/`genericCard` (Task 8).
- **§4** search + insert → Task 10.
- **§6** `CompendiumIndex` → Task 2 (+ Task 1 seam it is backed by); `getStatblock` = D8 entry point.
- **§5** hover-preview → **deferred** (OD-D6-5), recorded in the header + Task 11 docs; `data-scc` hook shipped in Task 1.
- **Type consistency:** `RefOrInline<M>`/`RefSource`/`SourceAware`/`CardLayout<M>`/`DisplayCardView`/`CompendiumEntry`/`CompendiumEntity`/`TYPE_ADAPTERS`/`GenericNote` are introduced once and reused verbatim downstream. `cx.compendium` seam introduced in Task 3, wired in Task 11.
- **No placeholders:** every task has failing-test-first steps, exact `devbox` commands, real fixture paths (verified to exist under `workspace/data/data-unified/en/unified/`), and one conventional commit.
