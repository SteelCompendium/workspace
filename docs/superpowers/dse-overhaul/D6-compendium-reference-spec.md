# D6 — Compendium-powered reference family (DSE) — Feature Spec

**Program:** DSE Overhaul (see `README.md` in this directory) — Wave 2, planning only.
**Author:** Fable deep analysis, 2026-07-01.
**Status:** Draft for Scott's review. Zero code changes made; all interface names cited
against F1 §3 / F2 §3–4 verbatim.
**Depends on:** **F1** (Element Framework v2 — `ElementDefinition`, `ElementView`,
`RenderContext`, the reference seam `ReferenceService`/`RefProvider`/`RefRequest`/
`ResolvedRef`/`RefKind`, `renderErrorCard`) and **F2** (data-unified layout, SDK 3.2.0,
`SccResolver`/`SccResolution`, `rewriteSccAnchors`, `CompendiumSyncService` + manifest,
`sccToFilePath`).
**Implements:** M1 section **D** — Reference-by-SCC, `ds-condition`/rule cards, compendium
search/insert, SCC hover-preview, and the Kit/Ancestry/Culture/Career/Class/Title/Perk/
Treasure display family.

Repos referenced (absolute paths):

| Repo | Path |
|---|---|
| DSE plugin | `/home/scott/code/steelCompendium/workspace/draw-steel-elements/` |
| SDK | `/home/scott/code/steelCompendium/workspace/data-sdk-npm/` |
| Data output | `/home/scott/code/steelCompendium/workspace/data/data-unified/` |

---

## 0. Scope, lane, and the one-line shape

D6 is the **reference-consumption layer** that sits on top of F1's pipeline and F2's SCC
resolution. It builds five things, in strict dependency order:

1. **Reference-by-SCC for existing elements** — `ds-statblock`, `ds-feature`, `ds-featureblock`
   accept a *reference* (an SCC code / `@path` / `[[wikilink]]`) in place of inline YAML, pulling
   the payload from the synced compendium.
2. **A display family** — one generic `ElementDefinition` factory over the ten SDK 3.x model
   families (F2 §2.2 A2), producing `ds-kit`, `ds-ancestry`, `ds-culture`, `ds-career`,
   `ds-class`, `ds-title`, `ds-perk`, `ds-treasure`, `ds-complication` from **one declaration
   pattern**, not ten bespoke elements.
3. **`ds-condition` / rule cards** — the tenth family plus the `rule.*` glossary namespace,
   as the smallest display-family instance.
4. **Compendium search + insert** — a command/modal to find an entity and insert either a
   reference or a full block.
5. **SCC hover-preview** — a DSE-rendered hover card on `scc.v1:` links, parity with the v2 site.

Plus a sixth deliverable that is an **API, not a feature**: an *entity-by-code → typed model*
accessor (`CompendiumIndex`) that **D8 (encounter builder)** consumes for monster data.

### Coordination boundaries (stay in lane)

- **F2 owns SCC-resolution semantics + the sync/downloader.** D6 **consumes** `SccResolver`
  (via F1's `ReferenceService` seam) and `CompendiumSyncService`; D6 does **not** redesign
  resolution order, the manifest, or the anchor-rewrite pass. Where D6 needs data F2 does not
  yet emit (full DTOs for the ten families), D6 raises it as a **dependency on an F2 OD**
  (§7), never a re-spec of F2.
- **F1 owns the pipeline + interface names.** D6 adds *elements* and *services*, using only the
  public surface in F1 §3. No pipeline, seam, or `BlockHost` signature changes.
- **D8 owns the encounter-builder UI.** D6 exposes `CompendiumIndex.getStatblock(code)` (§6) and
  stops there — no budget/EV math, no roster UI.
- **D5 (rolling)** later makes the ability cards these elements render *interactive*; D6 renders
  them `static` and does not build the roller.

### One-line summary

> Two input modes for one card: an element body is **either inline YAML (SDK-parsed) or a
> reference (F2-resolved to a compendium `TFile`)**; a single `withReference()` wrapper + a
> single `displayFamily()` factory turn that duality plus the ten SDK models into the whole
> reference family, and the same resolver powers search-insert and hover-preview.

---

## 1. Reference-by-SCC for existing elements

### 1.1 The duality: an element body is YAML *or* a reference

Today `ds-statblock` / `ds-feature` / `ds-featureblock` bodies are **inline YAML** parsed by an
SDK reader (`Statblock.read(new YamlReader(Statblock.modelDTOAdapter), body)` etc., per
F2 §1.2). D6 adds a second accepted body shape — a **reference** — resolved through F2 to the
same payload the inline YAML would have carried. Author once in the compendium, render anywhere:

```md
```ds-statblock
scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker
```

```ds-statblock
goblin-stinker            # bare-code sugar (§1.3)
```

```ds-feature
@Homebrew/Fireball        # @path still works (unchanged legacy behavior)
```

```ds-featureblock
[[Thorn Dragon]]          # [[wikilink]] still works
```
```

Inline YAML is untouched — a body that parses to a mapping is treated as inline data exactly as
today. Reference-by-SCC is **purely additive** (F2 non-goal: "old-resolver removal" — `@path`/
`[[wikilink]]` stay supported indefinitely).

### 1.2 Resolution flow (uses only F1 + F2 surface)

The mechanism is a **single reusable definition wrapper**, `withReference()`, applied to any
`ElementDefinition` whose payload can come from the compendium. It is the *only* new plumbing;
it uses F1's declared `resolveRefs` / `autoResolveRefs` hooks and F1's `ReferenceService` seam,
into which F2 has registered its `scc` `RefProvider`. No pipeline change.

```ts
// elements/shared/withReference.ts  (D6)
type RefOrInline<M> =
  | { kind: "inline"; model: M }
  | { kind: "ref"; raw: string };      // unresolved at parse time

/** Wrap a base display/statblock/feature definition so its block body may be a
 *  whole-block reference instead of inline YAML. Base.parse handles inline data;
 *  this wrapper handles the ref → payload → Base.parse round-trip. */
function withReference<M>(base: ElementDefinition<M>): ElementDefinition<RefOrInline<M>> {
  return {
    ...base,
    autoResolveRefs: false,            // we resolve explicitly (F1 §3.1)
    parse(data, raw): RefOrInline<M> {
      const ref = detectWholeBlockRef(data, raw);   // §1.3
      if (ref) return { kind: "ref", raw: ref };
      return { kind: "inline", model: base.parse(data, raw) };
    },
    async resolveRefs(m, refs): Promise<RefOrInline<M>> {
      if (m.kind !== "ref") return m;
      const resolved: ResolvedRef = await refs.resolve(m.raw, /*sourcePath*/ "");
      // resolved.data is the target's parsed payload — for a statblock, the ds-sb
      // YAML object F2 §3.3(A) guarantees inside the compendium file.
      return { kind: "inline", model: base.parse(resolved.data, /*raw*/ "") };
    },
    createView: (cx) => new RefUnwrapView(cx, base),   // §1.4
  };
}
```

Flow for a reference body, mapped onto F1's pipeline (F1 §2.4):

```
parse           → RefOrInline = { kind:"ref", raw:"scc.v1:…"|"@…"|"[[…]]"|"goblin-stinker" }
resolve refs    → refs.resolve(raw) → F2 scc RefProvider → SccResolver.resolve()
                    ├ kind:"vault"      → read TFile → extract first ds-* block → parseYaml → ResolvedRef.data
                    ├ kind:"web"        → (no local file) → error card "installed compendium required"
                    └ kind:"unresolved" → error card (unknown code)
                  → Base.parse(ResolvedRef.data) → typed SDK model → { kind:"inline", model }
create view     → RefUnwrapView delegates to base.createView
mount           → base view renders the model exactly as an inline block would
```

Why this shape and not the F1 *default* deep-resolve:

- F1's default (`autoResolveRefs !== false`) deep-walks *raw data* and swaps resolvable
  **strings inside a mapping** before `parse`. That correctly handles the *initiative tracker*
  case (`hero.statblock: scc.v1:…` — a string field, F2 §4.3(c)) and needs **no D6 work** — the
  tracker's `statblock`/`creature.statblock` fields resolve for free once F2 registers the
  provider. `withReference()` is only for the **whole-block** case, where the entire body *is*
  the reference and `base.parse` would choke on a bare scalar. Setting `autoResolveRefs:false` +
  an explicit `resolveRefs` keeps the two cases from fighting.
- It reuses `ReferenceResolver`'s existing "extract the first `ds-*` block from the target file"
  step (F2 §4.3(c)) — which is exactly why F2's **OD-1(A)** (steel-etl emits `ds-sb`/`ds-fb`
  blocks into md-dse statblock/featureblock files) is a hard dependency (§7): without it, a
  `ds-statblock: <monster-code>` resolves the `TFile` but finds no block and errors.

### 1.3 Reference detection (`detectWholeBlockRef`) + bare-code sugar

`detectWholeBlockRef(data, raw)` returns the reference string when the block body is a
whole-block reference, else `null`. The rules, cheapest first:

1. **Prefixed / linked forms (canonical).** The trimmed body is a single line matching
   `^(scc(\.v\d+)?:|@|\[\[.*\]\]$)` → it is a reference; return it verbatim. These are exactly
   the forms F1's built-in ref sniffing + F2's `scc` provider already recognize.
2. **Bare-code sugar.** The body parses (via `parseYaml`) to a **bare scalar** (string/number,
   not a mapping) that is *not* one of form 1 → treat it as an SCC **item token** and normalize:
   - If it already looks like a full code (`<source>/<type>/<item>`, i.e. contains `/`), prefix
     with `scc:` and resolve.
   - Otherwise it is an **item slug** (`goblin-stinker`, `panther`): resolve against the
     compendium index (§6) by frontmatter `item_id` / `file_basename`, scoped by the **element's
     expected type family** (a `ds-statblock` bare slug only matches `*.statblock` codes; a
     `ds-kit` bare slug only matches `kit/*`). Ambiguous slug → error card listing the candidate
     codes (so the user disambiguates by pasting the full code).
3. Anything else → `null` (inline YAML path).

Rule 2's slug scoping is what makes `ds-statblock: goblin-stinker` and `ds-kit: panther` (the
M1 shorthand) unambiguous without the user typing full SCC codes. It leans on `CompendiumIndex`
(§6), so bare sugar requires an installed compendium; prefixed/linked forms do not require the
index (path derivation is O(1), F2 §4.2 step 1).

### 1.4 `RefUnwrapView`

A thin `ElementView<RefOrInline<M>>` that, on mount, asserts `model.kind === "inline"` (the
pipeline resolves refs before `createView`), constructs the **base element's view**
(`base.createView(cx)`), `addChild`s it, and mounts it against the resolved model. It exists so
`withReference()` composes with *any* base definition (statblock, feature, or a display-family
member) without the base view knowing references exist. `onUpdate` re-delegates. This keeps the
statblock/feature views (migrated by F1 steps 5–6) **reference-agnostic**.

### 1.5 Fallback when the compendium is absent or the code is missing

Reference-by-SCC degrades along F2's `SccResolution` ladder (F2 §4.2), surfaced through
`renderErrorCard` (F1 §3.8) with D6-specific, actionable copy — never a stack trace:

| `SccResolution` | Compendium state | D6 behavior |
|---|---|---|
| `vault` + block found | installed, code present | render the card (success) |
| `vault` + **no `ds-*` block** | installed, but file is plain md (F2 OD-1(A) not yet shipped) | error card: "*Goblin Stinker* found but not renderable — this compendium predates statblock blocks; re-sync." names file + frontmatter `type` |
| `web` | **not installed** (or code absent locally) | error card with a **"View on steelcompendium.io" button** (the `web` URL) + a "Sync compendium" call-to-action; no silent network fetch |
| `unresolved` | unknown code | error card: "Unknown SCC code `<code>`." + hint to run compendium search (§4) |

The `web` case deliberately does **not** fetch-and-render remote content (no network render;
mirrors F2's click-time-only web fallback, OD-7). A reference-by-SCC block is only a *rich card*
when the data is local; otherwise it is a labeled link out. This is the honest contract: the
element embeds compendium content you have, or points at content you don't.

---

## 2. The display-family pattern (one factory over ten SDK models)

### 2.1 Principle: one declaration, N elements

The ten SDK 3.x families (F2 §2.2 A2) — `Ancestry`, `Career`, `Class`, `Complication`,
`Condition`, `Culture`, `Kit`, `Perk`, `Title`, `Treasure` — are **structurally identical from
the framework's view**: each is a `SteelCompendiumModel` with a static `modelDTOAdapter`
(`(Partial<DTO>) => Model`) and a `read()` via `YamlReader` (verified: `data-sdk-npm/src/model/
{Kit,Condition,Treasure,Ancestry,…}.ts`, all `Object.assign`-constructed from a partial DTO).
D6 therefore ships **one factory**, not ten elements:

```ts
// elements/display/displayFamily.ts  (D6)
interface DisplayFamilyDescriptor<M extends SteelCompendiumModel<any>> {
  id: string;                          // ElementDefinition.id, e.g. "kit"
  aliases: readonly [string, ...string[]];  // e.g. ["ds-kit"]
  name: string;                        // "Kit" — error cards / search / settings
  adapter: ModelDTOAdapter<M, any>;    // Model.modelDTOAdapter — SDK does the parsing
  sccType: string | RegExp;            // frontmatter `type` this element renders (bare-slug scoping, §1.3)
  layout: CardLayout<M>;               // §2.4 — the ONLY per-type authored surface
}

function displayFamily<M extends SteelCompendiumModel<any>>(
  d: DisplayFamilyDescriptor<M>,
): ElementDefinition<M> {
  const base: ElementDefinition<M> = {
    id: d.id, name: d.name, aliases: d.aliases, shape: "static",
    schema: undefined,                 // SDK model tolerates partials; SDK errors surface via error card (F1 §5)
    parse: (data, raw) =>
      d.adapter(typeof data === "string" ? parseYaml(raw) : (data as any)),  // SDK reader = adapter∘parse
    createView: (cx) => new DisplayCardView<M>(cx, d.layout),
  };
  return withReference(base);          // §1 — every display element is reference-capable for free
}
```

Registration is a one-liner list — the whole family in one file:

```ts
export const displayElements = [
  displayFamily({ id: "kit",         aliases: ["ds-kit"],         name: "Kit",         adapter: Kit.modelDTOAdapter,         sccType: /^kit$/,          layout: kitLayout }),
  displayFamily({ id: "ancestry",    aliases: ["ds-ancestry"],    name: "Ancestry",    adapter: Ancestry.modelDTOAdapter,    sccType: /^ancestry$/,     layout: ancestryLayout }),
  displayFamily({ id: "culture",     aliases: ["ds-culture"],     name: "Culture",     adapter: Culture.modelDTOAdapter,     sccType: /^culture$/,      layout: cultureLayout }),
  displayFamily({ id: "career",      aliases: ["ds-career"],      name: "Career",      adapter: Career.modelDTOAdapter,      sccType: /^career$/,       layout: careerLayout }),
  displayFamily({ id: "class",       aliases: ["ds-class"],       name: "Class",       adapter: Class.modelDTOAdapter,       sccType: /^class$/,        layout: classLayout }),
  displayFamily({ id: "title",       aliases: ["ds-title"],       name: "Title",       adapter: Title.modelDTOAdapter,       sccType: /^title$/,        layout: titleLayout }),
  displayFamily({ id: "perk",        aliases: ["ds-perk"],        name: "Perk",        adapter: Perk.modelDTOAdapter,        sccType: /^perk$/,         layout: perkLayout }),
  displayFamily({ id: "treasure",    aliases: ["ds-treasure"],    name: "Treasure",    adapter: Treasure.modelDTOAdapter,    sccType: /^treasure$/,     layout: treasureLayout }),
  displayFamily({ id: "complication",aliases: ["ds-complication"],name: "Complication",adapter: Complication.modelDTOAdapter,sccType: /^complication$/, layout: complicationLayout }),
  displayFamily({ id: "condition",   aliases: ["ds-condition"],   name: "Condition",   adapter: Condition.modelDTOAdapter,   sccType: /^condition$/,    layout: conditionLayout }),  // §3
];
```

**Guardrail honored:** no hand-rolled parsers — each element's `parse` is the SDK's own
`modelDTOAdapter`. Adding an eleventh family later (e.g. a future SDK `Domain` model) is one
descriptor + one `layout`, nothing else.

### 2.2 The alias set

One canonical alias per family, singular, `ds-<type>` (matching the today's-elements convention
`ds-statblock`/`ds-feature` and the SCC `type` name):

| Element id | Canonical alias | SCC type | SDK model | Bare-slug scope (§1.3) |
|---|---|---|---|---|
| `kit` | `ds-kit` | `kit` | `Kit` | `kit/*` |
| `ancestry` | `ds-ancestry` | `ancestry` | `Ancestry` | `ancestry/*` |
| `culture` | `ds-culture` | `culture` | `Culture` | `culture/*` |
| `career` | `ds-career` | `career` | `Career` | `career/*` |
| `class` | `ds-class` | `class` | `Class` | `class/*` |
| `title` | `ds-title` | `title` | `Title` | `title/*` |
| `perk` | `ds-perk` | `perk` | `Perk` | `perk/*` |
| `treasure` | `ds-treasure` | `treasure` | `Treasure` | `treasure/*` |
| `complication` | `ds-complication` | `complication` | `Complication` | `complication/*` |
| `condition` | `ds-condition` | `condition` | `Condition` | `condition/*` |

No abbreviated aliases at launch (unlike the legacy `ds-ft`/`ds-sb` set) — these are new, so we
start clean (F1 OD-6 "aliases are forever": don't mint short ones we'd regret). Abbreviations
can be *added* later without breaking anything if demand appears (OD-D6-3).

### 2.3 Two data sources, one card — the frontmatter-vs-full-DTO problem

**The tension (verified against `data/data-unified`):** F2 ships the **`md-dse` format only**
(F2 §3.1). In md-dse, a family file's **frontmatter is DTO-*shaped* but a subset** — e.g.
`kit/panther.md` frontmatter has `stamina_bonus`/`speed_bonus`/`melee_damage_bonus`/`flavor` but
**not** `signature_ability` or `content`; the signature ability lives only in the rendered body
(as a nested ` ```ds-feature ` block) and the *complete* DTO (`content`, nested
`signature_ability`) exists only in the un-shipped **`yaml/` format**. Ancestry
(`purchased_traits`), Career (`inciting_incidents`) have the same gap. Condition/Class/Culture/
Perk/Title/Complication/Treasure are **effectively complete in frontmatter** (mostly scalars +
`content`, and `content` is the body).

D6 resolves this with a **hybrid render** that always produces *some* typed model and never
loses the rich body:

- **Inline mode** (author wrote full YAML in the block): `d.adapter(parseYaml(body))` yields a
  **complete** SDK model (nested pieces included) → `CardLayout` renders fully structured.
- **By-SCC mode** (resolved from md-dse): the `RefUnwrapView` receives, from `withReference`,
  **both** the frontmatter-derived model **and a handle to the resolved `TFile`**. The card
  renders:
  - **structured chrome** from the frontmatter model (name, flavor, the labeled bonus rows,
    type/echelon/level badges) via `CardLayout`, and
  - **the file's rendered body** (frontmatter stripped) via `ElementView.renderMarkdown` for the
    rich remainder (kit signature ability, ancestry trait list, career incidents) — which is
    *already* canonically rendered sc-md in the compendium file and includes its own nested
    `ds-feature` blocks (those recurse through the normal pipeline, so abilities render as real
    DSE feature cards, and their `scc.v1:` links get `rewriteSccAnchors` for free).

So the by-SCC card = **frontmatter-driven header + body-markdown remainder**, and the inline card
= **fully model-driven**. `CardLayout` declares both halves; the view picks which to emit based
on `model.kind`/data availability. This keeps D6 **within F2's shipped format** (no yaml-sidecar
download) while still giving a rich card. The alternative — asking F2/steel-etl to embed a full
DTO block for the ten families like it does `ds-sb`/`ds-fb` — is filed as **OD-D6-1** with a
recommendation to *defer* it (the hybrid render is good enough and adds no cross-repo gate).

To carry the file handle, `withReference` threads the `ResolvedRef` onto the model wrapper:
`{ kind: "inline", model, source?: { file: TFile; frontmatter } }` — `source` present only on
the by-SCC path. `DisplayCardView` reads `source?.file` to decide hybrid vs. pure-model render.

### 2.4 `CardLayout` and `DisplayCardView` — card layouts per type

`CardLayout<M>` is a **declarative field-map**, the only per-type authored artifact. It is *data*,
not code, so ten layouts are ten small objects, not ten view classes:

```ts
interface CardLayout<M> {
  title: (m: M) => string;                         // header (usually m.name)
  subtitle?: (m: M) => string | undefined;         // e.g. Treasure "Level 3 · Trinket"
  badges?: (m: M) => Badge[];                       // pill row: keywords, echelon, rarity, type
  flavor?: (m: M) => string | undefined;           // italicized lead (m.flavor)
  rows?: FieldRow<M>[];                             // label/value grid (kit bonuses, class stats)
  body?: (m: M) => string | undefined;             // trailing markdown (m.content) for inline mode
  /** By-SCC hybrid: render the resolved file body instead of `body`. Default true. */
  useSourceBody?: boolean;
}
interface FieldRow<M> { label: string; value: (m: M) => string | undefined; markdown?: boolean; }
```

`DisplayCardView extends ElementView<…>` builds one **shared card frame** for all ten types via
`createEl`/`createDiv` — `data-dse-element="<id>"` root (F1 §3.5 contract), header (title +
subtitle + badges), flavor, a `rows` grid, then the body/source-markdown region. All markdown
values go through `this.renderMarkdown` (never the plugin — F1 §3.3). Per-type *look* is CSS
under `[data-dse-element="kit"]` etc. (D2/D3 own the visuals; D6 owns the structure + tokens).

Concrete layouts (fields verified against the SDK models):

| Element | Header / subtitle | Badges | Rows | Body |
|---|---|---|---|---|
| **kit** | name / `kit_type` | armor, weapon | stamina/speed/stability/melee-dmg/ranged-dmg/distance/disengage bonuses; equipment | signature_ability (model or source body) |
| **ancestry** | name | — | signature_trait (name+desc); ancestry_points | purchased_traits list + `content` |
| **culture** | name / `culture_benefit_type` | — | environment, organization, upbringing, language, quick-build skill; skill_options | `content` |
| **career** | name | renown, wealth | skills/skill_group, language, project_points, perk | inciting_incidents table + `content` |
| **class** | name / `heroic_resource` | primary_characteristics | starting/per-level stamina, recoveries, potencies (weak/avg/strong), skills | `content` |
| **title** | name | echelon | prerequisites/benefit fields present on the model | `content` |
| **perk** | name / perk category | — | (scalar fields) | flavor + `content` |
| **treasure** | name / `treasure_type` · `level` | echelon, rarity, keywords | prerequisite, project (source/characteristic/goal), effect; level_effects table | `content` |
| **complication** | name | — | benefit/drawback fields | `content` |
| **condition** | name | "Condition" | — | `content` (§3) |

The table is the whole authored surface of the display family — everything else (parse, refs,
lifecycle, error handling, theming, hover) is shared.

---

## 3. `ds-condition` / rule cards

`ds-condition` is just the smallest `displayFamily(...)` instance (Condition = `name` + `content`,
verified `data-sdk-npm/src/model/Condition.ts`). Its `conditionLayout` is minimal: title = name,
a "Condition" badge, body = `content`. Both input modes work:

```md
```ds-condition
bleeding                  # bare slug → condition/bleeding
```
```ds-condition
scc.v1:mcdm.heroes.v1/condition/frightened
```
```ds-condition
name: Custom Curse        # inline homebrew condition
content: The target …
```
```

**Rule cards.** The `rule.*` namespace (`rule.combat`, `rule.dice`, `rule.health`, … — SCC
reference §Taxonomy) is *not* one of the ten SDK model families; rule pages are plain md-dse
notes with frontmatter identity and a markdown body (verified: `condition/bleeding.md` links to
`rule.combat/triggered-action`, `rule.test/test`, etc., which are their own pages). So a
**rule card renders the resolved file's body** with card chrome derived from frontmatter — there
is no SDK model. D6 handles this with a **model-less display element** built from the same
`DisplayCardView` frame but a **generic `GenericNote` "model"** (just `{ name, type, body }`
lifted from frontmatter + file body):

- Alias `ds-rule` (canonical), reference-only (no inline "author a rule" mode — rules come from
  the compendium; an inline body is treated as raw markdown for the card).
- `ds-rule: might`, `ds-rule: scc.v1:mcdm.heroes.v1/rule.character/might` → resolve → render body
  as a compact glossary card with the term as title.
- Because rule terms are the highest-frequency link targets, `ds-rule` doubles as the natural
  **inline-glossary** element and the primary payload of hover-preview (§5).

This makes `ds-condition` and `ds-rule` two instances of the same machinery: SDK-modeled families
go through `displayFamily`, model-less compendium notes (rules, and any future plain type) go
through a `genericCard(id, aliases, sccType)` sibling factory that shares `DisplayCardView` but
skips the adapter. One card frame, two factories, zero bespoke views.

---

## 4. Compendium search + insert UX

A cross-cutting authoring feature (M1/D, 🔧) with **no code block of its own** — it produces
references/blocks that the elements above render. Built entirely on `CompendiumIndex` (§6) so it
never re-implements resolution.

### 4.1 Surfaces

1. **Command:** "Draw Steel: Insert compendium reference" (id `insert-compendium-reference`) →
   opens the search modal. A second command "Insert compendium block" (full block, not a bare
   reference).
2. **Editor suggest (`/`-style):** an `EditorSuggest` triggered by a sentinel the D9 authoring
   effort also uses (coordinate with D9; D6 ships the compendium-backed *provider*, D9 owns the
   general insert-element suggest). Typing `scc:` or the family shorthand (`kit:`, `mon:`) inside
   a note pops inline results. If D9 lands first, D6 registers a provider into its suggest;
   otherwise D6 ships the standalone command + modal and the suggest is deferred (OD-D6-4).

### 4.2 The search modal (`CompendiumSearchModal extends SuggestModal<CompendiumEntry>`)

- **Source:** `CompendiumIndex.query(text, filters)` (§6) over the frontmatter index F2 already
  maintains (`item_name`, `type`, `source`, `scc`) — no new crawl; fuzzy over `item_name`,
  filterable by type family (a dropdown / prefix: `type:monster`, `type:kit`) and book
  (`source:mcdm.monsters.v1`).
- **Result row:** name, a type-family chip, book, and the bare SCC code (small, monospace).
- **Empty-index state:** if no compendium is synced, the modal shows a "Sync compendium" prompt
  (reuses the F2 settings action) rather than empty results.

### 4.3 Insert actions (per result)

On select, a small action chooser (or modifier keys) decides what lands at the cursor:

| Action | Inserts | Use |
|---|---|---|
| **Reference block** (default) | a fenced `ds-<type>` block whose body is the bare code (`ds-kit\npanther`) | live-updates with the compendium; smallest note |
| **Inline link** | `[Name](scc.v1:<code>)` | in prose; renders via `rewriteSccAnchors` (F2 §4.3) + hover-preview (§5) |
| **Full block (snapshot)** | the resolved YAML expanded inline (`ds-<type>` with full DTO body) | homebrew starting point / offline / editable copy |
| **Copy code** | the bare `scc:<code>` to clipboard | manual use |

The element chosen for a "reference block"/"full block" is derived from the entity's frontmatter
`type` → the matching display-family element (monster/statblock → `ds-statblock`; feature →
`ds-feature`; kit → `ds-kit`; …). "Full block (snapshot)" is the bridge to D9's authoring flow —
it drops editable YAML the user then owns (and which no longer live-updates, by design).

---

## 5. SCC hover-preview

Parity with the v2 site: hovering an `scc.v1:` link shows a **DSE-rendered card** of the target,
not just Obsidian's generic page preview.

### 5.1 What F2 already gives, and what D6 adds

F2's `rewriteSccAnchors` (F2 §4.3) converts a resolvable `scc` anchor into a **native internal
link** (`internal-link` class, `data-href` = target linkpath), which means Obsidian's **core
"Page preview"** already gives a *plain-markdown* hover of the target file for free. D6's
value-add is a **card-quality** preview (a compact statblock / condition / kit card) and coverage
of the `web`/`unresolved` cases — matching the v2 site's hover cards.

### 5.2 Mechanism

D6 registers a hover handler bound to DSE-marked anchors, popout-safe and lifecycle-clean:

- `rewriteSccAnchors` is asked (via a small F2-provided hook or a `data-scc="<code>"` attribute
  it already stamps — **coordinate with F2**, OD-D6-2) to tag each rewritten anchor with its bare
  code. D6 listens on `workspace.on("hover-link")` **and**/or registers a
  `registerHoverLinkSource`, filtering to anchors carrying `data-scc`.
- On hover (respecting the core **Page preview** setting — if the user disabled previews, D6 does
  nothing and lets native behavior stand), D6:
  1. `CompendiumIndex.getEntity(code)` (§6) — sync path-derivation/index, no await stall;
  2. builds a **compact card** into an Obsidian `HoverPopover` using the **same
     `DisplayCardView`/statblock view** in a `preview` density (a `RenderContext` flag
     `mode:"reading"` + a `hoverCompact` hint), reusing `renderMarkdown` for the body;
  3. for `web` → a minimal card "Not installed — open on steelcompendium.io"; for `unresolved`
     → no popover (leave the plain text F2 already produced).
- **Lifecycle:** the popover and its render children are `addChild`-ed to a `Component` tied to
  the hovered view (F1 lifecycle rules, §3.3/§4.5); timers/DOM via `registerDomEvent`; created on
  `rootEl.ownerDocument.defaultView` (popout-safe, F1 §4.5). No listeners on bare `document`.

### 5.3 Scope guard

Hover-preview reuses `DisplayCardView` at a smaller size; it introduces **no new render path**.
It is a `P2` polish item and is explicitly gated behind §1–§3 landing (the card views must exist
first). If the hover density proves fiddly, the fallback is "native internal-link preview only"
(what F2 already delivers) with zero D6 hover code — an acceptable degrade recorded as OD-D6-5.

---

## 6. `CompendiumIndex` — the "entity by code → typed model" API (D8 consumes)

The one piece of D6 that is a **service, not a feature**, and the explicit hand-off to **D8**
(encounter builder) and §4/§5 above. It sits **on top of** F2's `SccResolver` + frontmatter
index — D6 owns the *typed-model accessor* layer; F2 owns raw code→`TFile` resolution.

```ts
// services/CompendiumIndex.ts  (D6)
interface CompendiumEntry {              // lightweight — for search/listing (no file read)
  scc: string;                           // bare identity, "source/type/item"
  type: string;                          // frontmatter type, e.g. "monster.goblin.statblock"
  name: string;                          // item_name
  source: string;                        // book, e.g. "mcdm.monsters.v1"
  file: TFile;
}

interface CompendiumEntity extends CompendiumEntry {
  frontmatter: Record<string, unknown>;
  /** Rendered markdown body with frontmatter + (optionally) the primary ds-* block stripped. */
  body(): Promise<string>;
  /** Typed SDK model when `type` maps to a known family; else undefined. */
  model<M extends SteelCompendiumModel<any>>(): Promise<M | undefined>;
}

interface CompendiumIndex {
  /** True once a compendium is synced (manifest present, F2). Gates search/sugar. */
  readonly available: boolean;
  /** Sync-ish resolve to a listing entry (path derivation + frontmatter index; F2 §4.2). */
  getEntry(code: string): CompendiumEntry | null;
  /** Full entity incl. lazy body + typed model (reads the TFile). */
  getEntity(code: string): Promise<CompendiumEntity | null>;
  /** Convenience for D8: resolve a monster code straight to a typed Statblock. */
  getStatblock(code: string): Promise<Statblock | null>;
  /** Search/listing for §4 and future browse views. */
  query(text: string, filters?: { type?: string | RegExp; source?: string }): CompendiumEntry[];
  /** Slug → candidate codes, scoped by type family (bare-code sugar, §1.3). */
  resolveSlug(slug: string, typeScope: string | RegExp): string[];
}
```

Implementation notes:

- **Backed by F2, not duplicating it.** `getEntry`/`resolveSlug` read the frontmatter-`scc` index
  F2 maintains (F2 §4.2 step 2) and `sccToFilePath` (F2 §4.2 step 1); `getEntity.model()`
  dispatches on `type` to the SDK adapter (`monster.*.statblock` → `Statblock.modelDTOAdapter`;
  `kit` → `Kit.modelDTOAdapter`; …) using the **same type→adapter map** the display family
  registers (single source of truth, shared module). If F2 does not expose its index publicly,
  D6 builds a thin one over `metadataCache` frontmatter — but the **preferred** contract is F2
  exposing its index (OD-D6-2, a small F2 seam request, not a re-spec).
- **`getStatblock` is D8's entry point.** D8 calls `getStatblock(code)` per monster it adds to an
  encounter — a typed `Statblock` (role/organization/keywords/EV/features, SDK 3.x shape) with no
  DSE-rendering coupling. D8 builds its budget math and roster on top; D6 guarantees only the
  typed fetch. This is the "clean get-entity-by-code path D8 reuses" the brief asks for.
- **Sync + cache.** Path-derivation lookups are sync (mirrors F2's `SccResolver.resolve` being
  sync by design, F2 §4.4); only `getEntity`/`getStatblock` (which read + parse a file) are async.
  A small LRU on parsed models keeps hover/search snappy; invalidated on
  `vault.on("modify"/"delete"/"rename")` via `registerEvent` (F1 §4.5 cleanup rules).

---

## 7. Dependencies on F2 (and F1) Open Decisions

D6 cannot ship ahead of these; each is an F2/cross-repo item already on the register, restated as
a D6 gate:

| D6 needs | Depends on | If unmet |
|---|---|---|
| `ds-statblock: <code>` / `ds-featureblock: <code>` render | **F2 OD-1(A)** — steel-etl emits `ds-sb`/`ds-fb` blocks into md-dse statblock/featureblock files | reference-by-SCC works for `ds-feature`/display-family (which have blocks/frontmatter) but **statblock/featureblock refs error** ("found but not renderable", §1.5). D6 statblock refs are **hard-gated** on OD-1(A) |
| Any reference-by-SCC at all | **F2 OD-2** — data-unified publishes downloadable release zips; **F2** `CompendiumSyncService` installs them | no local compendium → every ref falls to the `web`/error path (§1.5). Inline-YAML elements unaffected |
| Typed models with all fields (statblock `cost`/`flavor`/fixture, featureblock `intro`) | **F2 OD-5** — publish SDK **3.2.0** from HEAD, pin exactly | cards render but drop the newest fields; harmless (SDK models are tolerant) but incomplete |
| `scc`/`scc.v1:` reference resolution in `ReferenceService` | **F2 §4.4** registers the `scc` `RefProvider`; **F1 §3.7** seam | without the provider, scc refs → "unresolvable reference" (F1 §3.7 note). `@path`/`[[wikilink]]` still work |
| Full DTO for the ten families in md-dse (avoid the hybrid render, §2.3) | **OD-D6-1** → possible **future** F2/steel-etl ask | **not required** — the hybrid render (frontmatter chrome + source body) is the default and needs nothing new from F2 |
| `data-scc` tagging on rewritten anchors + a public frontmatter index | **OD-D6-2** — small F2 seam additions | D6 falls back to re-deriving codes from `href`/building its own `metadataCache` index (works, slightly redundant) |
| Reference-capable whole-block bodies | **F1 §3.1** `resolveRefs`/`autoResolveRefs` + **F1 §3.7** `ReferenceService.resolve` | these are F1 public surface — no gate, `withReference()` uses them directly |

**Sequencing:** D6 rides the same cross-repo critical path F2 already flagged (SDK 3.2.0 →
steel-etl `ds-sb`/`ds-fb` → data-unified release → DSE 6.0.0). D6's *inline-authored* elements
(display family with hand-written YAML, `ds-condition` homebrew) can be **built and shipped
before** the compendium download exists; only the *reference/search/hover* half is gated.

---

## 8. Open Decisions — needs Scott

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **OD-D6-1** | By-SCC display of `kit`/`ancestry`/`career` needs data md-dse frontmatter lacks (nested signature ability, traits, incidents) | (a) **hybrid render** — frontmatter chrome + resolved file body (nested `ds-feature` blocks recurse) · (b) ask F2/steel-etl to embed a full DTO block per family (like `ds-sb`) · (c) also download the `yaml/` tree | **(a) hybrid** — no cross-repo gate, high fidelity (the body is already canonically rendered); revisit (b) only if a purely-structured card is later needed |
| **OD-D6-2** | How D6 gets codes off anchors + a searchable index | (a) F2 stamps `data-scc` on rewritten anchors + exposes its frontmatter index as a small seam · (b) D6 re-derives codes from `href` and builds its own `metadataCache`-backed index | **(a)** — one shared index/marker avoids drift; it's an additive F2 seam, not a resolution re-spec. Fall back to (b) if F2 declines |
| **OD-D6-3** | Short aliases for the display family (`ds-kit` only, vs `ds-anc`/`ds-cul`/…) | canonical-only now · add abbreviations now | **canonical-only** — new elements, no legacy debt; abbreviations are additive later (F1 OD-6: aliases are forever) |
| **OD-D6-4** | Editor-suggest ownership overlap with D9 | D6 registers a compendium provider into D9's suggest · D6 ships a standalone command+modal and defers suggest to D9 | **defer suggest to D9**, ship the command + `SuggestModal` now (works standalone, no D9 dependency) |
| **OD-D6-5** | Hover-preview fidelity | DSE-rendered compact card (parity with v2 site) · rely on native internal-link page-preview F2 already yields | **DSE card**, but keep native-preview as the zero-code degrade if the compact density proves fiddly (it's P2 polish) |
| **OD-D6-6** | Reference block vs snapshot as the search-insert default | live reference block (`ds-kit\npanther`) · full-YAML snapshot | **live reference block** — the payoff of data-unified is "author once, render anywhere"; snapshot stays an explicit action for homebrew/offline |
| **OD-D6-7** | `ds-rule` inline-authoring | reference-only (rules come from compendium) · allow inline markdown body too | **reference-only + raw-markdown fallback** — an inline body is just rendered as the card's markdown; no bespoke rule model |

---

## 9. Risks & non-goals

### Risks

| Risk | Mitigation |
|---|---|
| **Hard gate on F2 OD-1(A)** for statblock/featureblock refs — the single highest-value D6 case | Ship inline-authored + `ds-feature`/display-family refs first; statblock refs light up when OD-1(A) + a data release land (§7). Error copy is explicit, not broken (§1.5) |
| **Bare-slug ambiguity** (`ds-statblock: goblin` matches several) | Type-scoped slug resolution (§1.3) + error card listing candidate full codes; prefixed form always unambiguous |
| **Hybrid-render seams** (frontmatter chrome + body may double-render a field, e.g. flavor) | `CardLayout` marks which fields the body already contains; by-SCC mode suppresses model-driven rows that the source body repeats (per-type `useSourceBody` + row `omitWhenSource` flags) |
| **Recursion / cost** — a by-SCC kit body contains a `ds-feature` block that itself could reference out | Depth-guard in `withReference` (a resolution refuses to recurse past N hops); compendium bodies are pre-resolved links, not further whole-block refs, so practical depth is 1 |
| **Hover perf on link-dense compendium notes** | `getEntry` is sync/O(1); popover built only on actual hover; respects core Page-preview toggle; LRU cache (§6) |
| **Index staleness after re-sync / user moves** | `CompendiumIndex` invalidates on vault events (§6); resolution's path→index→web ladder (F2) already absorbs code≠path drift |

### Non-goals (D6)

- **Resolution semantics, the downloader, the manifest, the anchor-rewrite pass** — all F2. D6
  consumes them.
- **Encounter builder UI / budget / EV math** — D8 (D6 gives it `getStatblock`, §6).
- **Making ability cards interactive (rolling)** — D5; D6 renders `static` cards.
- **The general insert-element command + editor-suggest framework** — D9; D6 contributes only the
  compendium-backed provider + its own search modal (§4, OD-D6-4).
- **Live Preview** — F1 seam guarantees drop-in later; D6 views are mode-blind by construction.
- **Per-book/per-format selection, locales beyond `en`** — F2 non-goals inherited.
- **New SDK models or SDK changes** — D6 consumes the ten shipped families as-is.
- **Write-back / editing of compendium content** — reference blocks are read-only; the "full
  block (snapshot)" action hands off to D9's authoring surface.

---

*Cross-references: F1 spec §3 (interface names imported verbatim), F2 spec §3–4 (`SccResolver`,
`rewriteSccAnchors`, `CompendiumSyncService`, `sccToFilePath`, OD-1/OD-2/OD-5), M1 §D (item
list), `docs/scc-reference.md` (taxonomy, `rule.*` namespace, code-vs-path principle),
`reference/scc-specification.md` (v1.1 reference form), SDK models
`data-sdk-npm/src/model/{Kit,Ancestry,Culture,Career,Class,Title,Perk,Treasure,Complication,
Condition}.ts` (verified field sets).*
