# D8 — GM Subsystems Spec

**Program:** DSE Overhaul (see `README.md` in this directory) — Wave 2, planning only.
**Author:** Fable (D8), 2026-07-01.
**Depends on:** **F1** (Element Framework v2 — interfaces imported verbatim), **F2** (data-unified
+ SDK 3.x; specifically **F2 OD-1**, the `ds-sb` emission, and the `SccResolver`/`scc` ref
provider), **D6** (compendium reference-by-SCC — the "entity by code → typed model" path this
spec *consumes*, does not redesign).
**Status:** Draft for Scott's review. Zero code changes; all file/data references verified
against the working trees and `data/data-unified` on this date.

**One-line summary:** a suite of GM-facing subsystems — Encounter Builder, Malice tracker,
Montage Test tracker, Project/Downtime tracker, Party tracker, and a per-turn action economy —
built as thin F1 elements, **plus a reusable sidebar `ItemView` host** (a third `BlockHost`
alongside reading-mode and the deferred Live-Preview host) that lets any mode-agnostic F1 view
run as a persistent, note-navigation-surviving panel. D7 (hero sheet) consumes the sidebar host;
this spec owns it.

> **Reference-math honesty note.** The workspace `reference/` docs are condensed **Heroes-book**
> references. Three numbers this spec needs — the **encounter EV/budget formula**, the **Malice
> per-round generation formula**, and the **XP-per-Victory rate** — are **Monsters-book /
> Director's-guide content that is *not present* in the workspace reference** (confirmed by a
> full read of all three files). Where a number is citable it is cited inline
> (`REF §N` = `reference/draw-steel-reference.md`, `AGENT` =
> `reference/draw-steel-agent-reference.md`). Where it is absent, this spec **parameterizes** the
> value into a data-driven, user-editable table with a documented default and routes the sourcing
> to an Open Decision (§9) — it never fabricates a rule.

---

## 0. Scope & coordination (stay-in-lane map)

| This spec OWNS | This spec CONSUMES (owned elsewhere) | This spec COMPLEMENTS (does not rebuild) |
|---|---|---|
| Sidebar `ItemView` host pattern (`DseSidebarView` + `SidebarBlockHost`) | D6: SCC code → typed `Statblock`/`Feature` model | Initiative Tracker (extend: Malice surfacing, turn economy, round counter) |
| `ds-encounter`, `ds-montage`, `ds-project`, `ds-party` elements | F2: `SccResolver` / `ReferenceService` `scc` provider; F2 OD-1 `ds-sb`/`ds-fb` emission; statblock `ev`/`role`/`organization` + feature `cost` fields | Negotiation Tracker (sibling pattern for `ds-montage`; not modified) |
| Malice tracker (primarily an initiative sub-view) + turn/round economy (initiative extension) | F1: `ElementDefinition`, `ElementView`, `RenderContext`, `BlockHost`, `ReferenceService`, `SessionStore`, `ElementPipeline` | Existing `EncounterData` schema (extend additively; byte-stable) |

Guardrails honored throughout: **vanilla TS + DOM**; **no new dependencies**; persisted trackers
**round-trip byte-stable YAML** via `def.serialize` (F1 §4.2, the "note is the database"
contract); the sidebar reuses F1 views unchanged (**mode-agnostic**, F1 §2.1 principle 2).

---

## 1. Sidebar `ItemView` host pattern (the reusable framework capability)

### 1.1 Why this is a *framework* capability, not an initiative feature

F1 already decoupled "a rendered DSE element" from "where it is mounted": a view receives only a
root `HTMLElement` and a `RenderContext`; everything mode-specific hides behind `BlockHost`
(F1 §2.1 principle 2, §3.4). F1 ships **one** host (`ReadingModeBlockHost`) and declares a
**deferred** second (`LivePreviewBlockHost`). D8 adds the **third concrete host —
`SidebarBlockHost`** — and the `ItemView` shell that owns it. Because views are mode-blind, the
*same* migrated Initiative view (or hero sheet, or party tracker) mounts in a sidebar leaf with
**zero view-code changes**. That is the entire value: the running-session tracker (M1/F) and D7's
pinned hero sheet are the same drop-in.

The canonical use is the **running initiative tracker**: a leaf in the right sidebar that survives
navigating between notes, because an `ItemView` leaf is independent of the active markdown leaf.

### 1.2 The two pieces

```
src/framework/host/
  SidebarBlockHost.ts   ← implements BlockHost (§3.4), file-backed instead of ctx-backed
src/framework/sidebar/
  DseSidebarView.ts     ← extends obsidian.ItemView; owns N SidebarPanel children
  SidebarPanel.ts       ← a Component: one mounted element + its SidebarBlockHost
  registration.ts       ← registerView + ribbon + commands + "send to sidebar" wiring
```

`framework/host/` and `framework/sidebar/` live **inside** `src/framework/` (F1 §2.5), so the
import-boundary lint (F1 OD-8) still forbids importing `src/elements/*` — the sidebar mounts
elements only through the `ElementRegistry`/`ElementPipeline`, never by direct import.

### 1.3 `DseSidebarView extends ItemView`

```ts
export const VIEW_TYPE_DSE_SIDEBAR = "dse-sidebar";

export interface SidebarPanelState {
  filePath: string;      // backing note; "" only for the ephemeral plugin-data exception (§1.6)
  alias: string;         // e.g. "ds-initiative" — selects the ElementDefinition via registry.get
  anchorId: string;      // durable block anchor (§1.5)
  collapsed?: boolean;
}
export interface DseSidebarState { panels: SidebarPanelState[]; }

export class DseSidebarView extends ItemView {
  getViewType() { return VIEW_TYPE_DSE_SIDEBAR; }
  getDisplayText() { return "Draw Steel"; }
  getIcon() { return "swords"; }              // lucide; D2/D3 may retheme
  async onOpen()  { /* rebuild panels from state */ }
  async onClose() { /* Component cascade tears down panels + hosts */ }
  getState(): DseSidebarState { … }           // workspace-serialized → survives restart
  async setState(s: DseSidebarState) { … }     // re-mounts panels
  addPanel(state: SidebarPanelState): SidebarPanel { … }
  removePanel(panel: SidebarPanel): void { … } // panel.unload() → host + view teardown
}
```

- Registered in `main.ts` via `plugin.registerView(VIEW_TYPE_DSE_SIDEBAR, leaf => new DseSidebarView(leaf, services))`.
- Opened via a ribbon icon and a command **"Open Draw Steel sidebar"**
  (`workspace.getRightLeaf(false)` → `setViewType` → `revealLeaf`).
- `ItemView` **is** an Obsidian `Component`, so panels/hosts/views attach to its lifecycle and tear
  down automatically on leaf close, plugin unload, or workspace reset (F1 §4.5 cleanup semantics
  extend here unchanged).

### 1.4 `SidebarBlockHost implements BlockHost` — the crux

This is the only genuinely new code the pattern needs. It satisfies the **exact F1 `BlockHost`
interface (§3.4)** but is backed by a *file + block anchor* rather than a live
`MarkdownPostProcessorContext`:

| `BlockHost` member | Reading-mode host | **SidebarBlockHost** |
|---|---|---|
| `mode` | `"reading"` | `"sidebar"` *(requires additive widening of F1 `RenderMode` — OD-1)* |
| `sourcePath` | `ctx.sourcePath` | `backingFile.path` |
| `containerEl` | the postprocessor `el` | the `SidebarPanel`'s content `div` |
| `canPersist` | `getSectionInfo != null` | backing block currently locatable in `backingFile` (§1.5) |
| `addChild(c)` | proxies to the `MarkdownRenderChild` | proxies to the `SidebarPanel` Component |
| `getBlockInfo()` | from `ctx.getSectionInfo(el)` | scans `backingFile` for the anchored fence (§1.5) |
| `replaceSource(s)` | `Vault.process` + line splice on `ctx.sourcePath` | **identical `Vault.process` + splice on `backingFile`, independent of any active leaf** |
| `blockKey()` | `sourcePath::lang::lineStart` | `filePath::alias::anchorId` |

The load-bearing difference is `replaceSource`: reading-mode persistence rides on the *currently
rendered* section; the sidebar host addresses the backing file **directly by path**, so the panel
keeps persisting correctly no matter which note is focused — the property that makes it a
"running-session tool." Mechanics are otherwise the byte-stable `Vault.process` read-modify-write
F1 §4.2/§3.4 already mandates (preserve fence chars + alias, splice exactly the
`getBlockInfo()` line range).

### 1.5 Block addressing without `getSectionInfo`

Reading mode gets block identity free from `ctx.getSectionInfo`. The sidebar has no such context, so
it must *re-derive* which fenced block in `backingFile` is "this panel's block." Design:

- **Anchor by durable id.** When a block is "sent to sidebar" (§1.7), the wiring stamps a stable id
  and records it. Two options for the id carrier:
  - **(recommended) a reserved YAML key** inside the block body, e.g. `_dse_anchor: 8f3a1c` — round-trips
    through `serialize` for free, survives edits and line moves, and is trivially greppable.
    Persisted-element models add an optional passthrough field for it (ignored by game logic).
  - a sibling Obsidian block-reference `^id` on the fence line (fragile: users delete them).
- **`getBlockInfo()`** = `Vault.cachedRead(backingFile)` → find the ```` ```<alias> ```` fence whose
  body contains `_dse_anchor: <id>` → return `{language, lineStart, lineEnd}`. If not found →
  `canPersist=false`, the panel renders read-only with a "backing block not found — re-link" notice
  (mirrors F1 §4.4 non-addressable handling).
- Anchoring is **best-effort but robust to line drift** (unlike the reading-mode
  `lineStart`-keyed `SessionStore`), because the id travels *in* the content.

### 1.6 Live refresh & self-echo (new vs. reading mode)

Reading mode gets re-render for free (an external edit or our own write-behind re-runs the
postprocessor → teardown + fresh mount, F1 §4.2 step 3). The sidebar **owns its own refresh**:

- On mount, the host registers `plugin.registerEvent(vault.on("modify", f => { if (f === backingFile) refresh() }))`.
- `refresh()` re-reads the anchored block body; if it differs from the mounted model's serialization,
  it calls **`view.update(newModel)`** — F1's `ElementView.update()`/`onUpdate()` in-place path
  (F1 §3.3). **The sidebar is the first real consumer of `onUpdate`** (F1 explicitly designed it
  "so an LP host — and any future same-DOM refresh — can hand a changed model to a live view without
  rebuild"). This makes the sidebar tracker update smoothly when the same block is edited in a note
  view side-by-side.
- **Self-echo guard:** our own `persist()` write triggers `vault.on("modify")`. The host stamps the
  last source it wrote and short-circuits `refresh()` when the incoming body equals it — avoiding a
  write→modify→update loop. (Reading mode tolerates the echo rebuild; the sidebar must suppress it
  because it owns the loop.)

### 1.7 Binding a block to the sidebar

- **"Send to sidebar"** — a context-menu / command action available on a rendered persisted block
  (initiative, hero sheet, party…): captures `{filePath, alias}`, ensures an `_dse_anchor`, and
  `DseSidebarView.addPanel(...)`. This is the primary path (explicit, discoverable).
- **"New tracker in sidebar"** — command that creates or picks a backing note, inserts a fresh block
  (e.g. empty `ds-initiative`), anchors it, and mounts it. Keeps the "note is the database" contract:
  every panel is a real block in a real note.
- **Ephemeral exception (plugin-data-backed).** The Encounter Builder's *scratch* working set (§2)
  may mount with `filePath: ""` backed by a plugin-data JSON doc rather than a note block — this is
  the **only** non-note-backed case, explicitly opt-in, and it does **not** claim the byte-stable
  note contract (there is no note). Everything a user would be angry to lose ends up in a note block
  on hand-off.

### 1.8 Single-panel MVP → multi-panel GM dashboard

MVP = one panel (the running initiative tracker). The `panels[]` state is a list from day one, so
the multi-panel "GM dashboard" (initiative + malice + party + montage stacked, reorderable,
collapsible) is additive — no host or view change, only `DseSidebarView` chrome. Presented as
**OD-4** (ship single-panel first vs. build the stack immediately).

### 1.9 What D7 consumes

D7's hero sheet is a persisted F1 element. To pin it during play, D7 needs **nothing D8-specific** —
it uses `addPanel({ filePath, alias: "ds-hero", anchorId })` exactly like initiative. D8's contract
to D7: **(a)** the sidebar host is element-agnostic (no initiative assumptions); **(b)** `onUpdate`
in-place refresh works for any view; **(c)** `SidebarPanelState`/`addPanel` are the public surface.

---

## 2. Encounter Builder — `ds-encounter`

**Shape:** `persisted` (the GM saves a planned encounter in a note; budget is computed live).
**Deps:** F2 OD-1 (monsters need resolvable `ds-sb` blocks), F2 `SccResolver`, **D6** (SCC code →
typed `Statblock`). **Consumes D6's resolution path; does not reimplement it.**

### 2.1 Compendium consumption (via D6 / F2)

The builder never parses statblock files itself. For each monster row it holds an **SCC code** and
resolves it through the F1 `ReferenceService` (`refs.resolve("scc.v1:…", sourcePath)` →
`ResolvedRef.data`, F1 §3.7) — the same seam F2 fills and D6 wraps into a typed `Statblock`. From the
resolved model it reads the fields **already present in `data-unified` statblock frontmatter**
(verified; F2 §1.4): **`ev`** (Encounter Value — the real per-monster point cost), `level`,
`role`, `organization` (MINION/HORDE/PLATOON/ELITE/SOLO/LEADER), `name`, `stamina`, characteristics,
and the `keywords`. `ev` is thus **real data**, not something D8 computes.

### 2.2 Budget / EV / difficulty math

- **Spent EV (citable, from data):** `spentEV = Σ over rows (row.count × statblock.ev)`, with the
  minion nuance below. Every term comes from compendium `ev`.
- **Party budget (NOT in workspace reference — parameterized, OD-2).** The formula mapping
  `(heroCount, heroLevel, victories)` → an EV budget lives in the Monsters book and is **absent from
  `reference/`**. D8 models it as a **data-driven, user-editable table** `budgetTable` with a shipped
  default flagged "verify against Draw Steel core rules." The builder computes
  `budget = budgetTable(heroCount, heroLevel)` (+ optional victory adjustment) and never hardcodes a
  formula into logic. When the number is unknown, the UI shows spent EV and the party inputs but marks
  the budget "unset — configure in settings," so the tool is useful even before the table is sourced.
- **Difficulty bands (also parameterized).** `ratio = spentEV / budget` → a band
  (trivial / easy / standard / hard / extreme) via a `bandTable`, defaults flagged for verification.
  The one difficulty fact the reference *does* give: a **"hard encounter" awards 2 Victories vs 1**
  (REF §13 line 370; AGENT line 999) — surfaced as the victory payout for the `hard`/`extreme` bands.
- **Victory payout (citable).** `victories = (band ∈ {hard, extreme}) ? 2 : 1`
  (REF §13; AGENT Part 12). Shown as "on victory, party earns N" and fed to the Party tracker (§6).

### 2.3 Squad / minion handling (align with existing `EncounterData`)

The initiative model already encodes squads (`is_squad`, `squad_role: "minion"|"captain"`,
shared `minion_stamina_pool`, `EncounterData.ts`). The builder mirrors it:

- A **minion row** carries `count` (number of minions) and contributes `count × ev` (minions are
  individually cheap; `ev` is per-minion). The `role: "MINION"` from the statblock auto-flags the row
  as squad-eligible.
- On hand-off, a minion row becomes an `enemy_group` with `is_squad: true`, a `creatures[]` entry
  `{ squad_role: "minion", amount: count, max_stamina }`, and (optionally) a captain creature —
  matching the exact shape `parseEncounterData` validates (≤2 creatures, one minion type, ≤1 captain).

### 2.4 Hand-off into the Initiative Tracker

The builder's output **is** an `EncounterData` YAML (the `ds-initiative` schema). Hand-off maps
builder rows → `enemy_groups[]`:

```
each monster row →
  enemy_groups[]: {
    name: <statblock.name or user label>,
    is_squad: <role === MINION or user-grouped>,
    creatures: [{
      name: <statblock.name>,
      amount: <count>,
      max_stamina: <statblock.stamina>,
      squad_role?: "minion"|"captain",
      statblock: "scc.v1:<code>"   ← keep the SCC ref so the tracker stays LIVE (resolves via F2)
    }]
  }
heroes: []   (left empty, or populated from a Party tracker ref — §6)
malice: { value: 0 }
```

Emitting `statblock: scc.v1:<code>` (rather than inlining stats) means the tracker re-resolves the
monster through F2 — auto-filling name/stamina/image (`EncounterData.ts` already does this for string
`statblock` refs) and letting the **Malice tracker (§3) pull the monster's malice features**. Two
hand-off targets (**OD-5**): **(a)** insert/replace a `ds-initiative` block in a chosen note; **(b)**
mount it directly in the sidebar (§1) via `addPanel`. Recommend offering **both** ("Create tracker
block" and "Open in sidebar").

### 2.5 Schema (`ds-encounter`, byte-stable persisted)

```yaml
# ds-encounter
party:
  hero_count: 4            # or omit and set party_ref
  hero_level: 3
  victories: 1             # optional; feeds budget adjustment if the table uses it
  party_ref: "[[Party]]"   # optional: pull hero_count/level from a ds-party block
monsters:
  - code: "scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-cutter"
    count: 6
    squad: minion          # optional; defaults from resolved role
  - code: "scc.v1:mcdm.monsters.v1/monster.dragon.statblock/crucible-dragon"
    count: 1
label: "Ambush at the ford"
_dse_anchor: 8f3a1c        # sidebar anchor (§1.5); ignored by game logic
# derived-and-cached (recomputed on render; stored only so a stale note still shows numbers):
_computed: { spent_ev: 44, budget: 40, ratio: 1.1, band: hard, victories: 2 }
```

`_computed` is a **cache**, never authoritative — the view recomputes from live `ev` on every mount
and rewrites it; treat divergence as "recompute wins." (Keeps the note readable offline without making
stale data load-bearing.)

---

## 3. Malice tracker

**Complements the Initiative Tracker — does not duplicate it.** Initiative already persists
`malice: { value: number }` with ± steppers (`initiativeProcessor.ts:112-130`, `EncounterData.ts:45`).
D8 upgrades that surface and adds spendable monster malice features; it introduces **no second source
of truth** for the pool.

### 3.1 Two deliverables

1. **First-class Malice panel (initiative sub-view).** Replace the bare ± widget with a panel showing:
   the current pool; a **round counter** (new — §7) and an **"Advance round (+gain)"** button that adds
   the per-round gain; a manual ± stepper (keyboard-accessible, replacing today's click-only `div`s and
   inline styles per F1 §1.4 "fix while migrating"); and a lightweight **spend log**
   (`[{ round, amount, label }]`) so the table can see where Malice went.
2. **Spendable monster malice features (compendium-powered).** For each distinct monster in the
   encounter, resolve — via F2/D6 — its malice features and render them as spend buttons that deduct
   the cost from the pool and append to the log.

### 3.2 Malice-feature data is real and resolvable (verified)

`data-unified` encodes monster malice features two ways, both SCC-addressable:

- **Group malice features** — files with `kind: malice`, SCC
  `mcdm.monsters.v1/monster.<group>/<group>-malice` (verified: `goblin-malice`, `crucible-dragon-malice`,
  `ogre-malice`, `bredbeddle-malice`), whose `features[]` each carry
  **`cost: "<N> Malice"`**, a `name`, and `body`/`power_roll`, under the flavor "At the start of a
  <monster>'s turn, you can spend Malice to activate one of the following features."
- **Per-statblock malice-costed actions** — individual statblock `features[]` with `cost: "<N> Malice"`
  (verified: `goblin-cursespitter` `1 Malice`, `war-spider` `5 Malice`, `dwarf-launcher` `3 Malice`).

So the tracker: for each encounter monster, follow its group (from the statblock's SCC group segment)
to the `<group>-malice` code and resolve it, **plus** scan the resolved statblock's own features for
`cost` matching `/^\s*(\d+)\s+Malice/i`. Parse `N` from the cost string; render `<name> (N)` buttons,
enabled only when `pool ≥ N`; on click, `pool -= N` and log. This is pure consumption of D6/F2
resolution — **no new steel-etl/SDK field is required** (the `cost` string already exists).

### 3.3 Per-round gain (NOT in workspace reference — OD-3)

The reference states Malice is "gained at encounter start and from specific triggers" (AGENT lines
1014-1016) but **omits the per-round formula** (Director's-guide content). D8 makes the round gain a
**configurable value** used by the "Advance round" button, with a documented default and a "verify
against core rules" flag. Trigger-based gains (e.g. Feytouched +3, AGENT line 230; troubadour Appeal
to the Muses) stay **manual ± with an optional labeled quick-add**, matching how the reference frames
them as event-driven rather than formulaic.

### 3.4 Placement (OD-6)

**Recommended:** the Malice tracker is an **initiative sub-view** (single source of truth = the
`ds-initiative` block's `malice`). A standalone `ds-malice` block is **optional**; if built it shares
the exact `{ value, log?, round? }` model shape so state can migrate either way. This avoids the
two-pools-of-truth footgun the existing `// REVIEW` comment in `EncounterData.ts:58` gestures at.

---

## 4. Montage Test tracker — `ds-montage`

**Shape:** `persisted`. **Sibling to Negotiation** (reuse the negotiation view decomposition
pattern: `ArgumentView`/`PatienceInterestView`-style sub-views, F1 migration step 8). **No compendium
dep.**

### 4.1 Rules (fully citable — AGENT lines 89-98; REF §7 lines 252-254)

- **Multi-round, default 2 rounds** (REF line 253). Configurable.
- **Each hero acts once per round:** test / assist / use an ability (AGENT line 93).
- **No skill reuse per hero** across the montage (AGENT line 94) — surface as a warning, not a hard block.
- **Director sets `success_limit` and `failure_limit`** from difficulty + party size (AGENT line 95);
  the specific numbers are Director-set (not fixed) → free-entry fields, not a formula.
- **Three outcome bands** (AGENT line 96): **total success** = successes reach `success_limit`;
  **partial success** = time/failures run out but `successes − failures ≥ 2`; **total failure**
  otherwise.
- **Victory payout** (AGENT line 98): total success and **hard** partial success award Victories →
  feeds Party tracker (§6).
- **A "test"** = 2d10 + characteristic, +2 for an applicable skill (AGENT lines 66, 82). If D5's Power
  Roll roller exists, a montage test row can invoke it; otherwise results are entered manually.

### 4.2 Schema (`ds-montage`, byte-stable)

```yaml
# ds-montage
title: "Cross the Ashfall Wastes"
rounds: 2
success_limit: 5
failure_limit: 3
successes: 0
failures: 0
participants:                       # optional per-hero tracking for the no-reuse rule
  - name: "Kira"
    skills_used: ["Nature", "Endurance"]
current_round: 1
_dse_anchor: 4c19ff
```

`outcome` (total/partial/failure) is **derived** from `successes`/`failures` vs limits (band logic
above) and rendered live — not stored (or stored only as a display cache like §2.5). Steppers for
successes/failures; a per-hero "record test" that appends the used skill and warns on reuse.

---

## 5. Project / Downtime tracker — `ds-project`

**Shape:** `persisted`. **Dep:** optional D6 resolution of a `project` goal by code (data-unified has a
`project` type, M1/C note); inline fallback otherwise.

### 5.1 Rules (citable — REF §10 lines 308-319; AGENT lines 872-908)

- **Project rolls** = characteristic + skill; totals accrue as **project points** toward a goal
  (REF line 313).
- **Breakthrough:** natural 19-20 → **+20 points and another roll** (AGENT line 878).
- **Goal point totals** (examples, AGENT lines 882-908): Build Airship **3000**, Teleportation
  Platform **1500**, Imbue Treasure **150** per tier (1st/5th/9th), Discover Lore
  **15/45/120/240** by rarity, Go Undercover **15**, Learn From a Master **120/500/1000**.
- **Prerequisites:** item component + a project source (book/tutor) in a specific language (REF line 319).
- **Respite cadence:** progress accrues across **respites** (24-hour rests; regain all Stamina &
  Recoveries; Victories → XP; one activity — REF line 310).

### 5.2 Schema (`ds-project`, byte-stable)

```yaml
# ds-project
goal_name: "Craft Teleportation Platform"
goal_code: "scc.v1:…/project/…"     # optional: resolve target/points via D6
goal_points: 1500
accrued: 340
prerequisites:
  item: "planar lodestone"
  source: "Aetheric Cartography (Old Vaslorian)"
rolls:                               # log; breakthrough flagged
  - { respite: 1, roll: 14, points: 14 }
  - { respite: 2, roll: 20, points: 34, breakthrough: true }  # +20 & bonus roll
current_respite: 2
_dse_anchor: 77aa10
```

Progress bar `accrued / goal_points`; "Add project roll" (points, optional breakthrough); a
**"Log respite"** action that increments `current_respite` and can nudge the Party tracker's
victory→XP conversion (§6). Roll totals are entered manually (or via D5's roller when present).

---

## 6. Party tracker — `ds-party`

**Shape:** `persisted`. **No compendium dep.** The hub other subsystems read from.

### 6.1 Rules (citable — REF §11 lines 334-338, §13; AGENT lines 962-1005)

- **Victories → XP at respite** (REF line 310); classes **start combat with heroic resource =
  Victories** (AGENT, each class line, e.g. line 231) — surfaced as a reminder.
- **Renown:** starts 0, **~+1/level**; followers at thresholds **3/6/9/12 → 1/2/3/4 followers**
  (REF line 335; AGENT line 962).
- **Wealth:** abstract **1-6**, start 1, **~+1 every 2 levels**; magic items unpurchasable (REF line 338).
- **XP-per-Victory rate: NOT in workspace reference** (only the qualitative Victories→XP→level chain).
  The "Convert victories to XP" action therefore either (a) just tracks the conversion event and lets
  the GM enter XP, or (b) uses a configurable rate flagged for sourcing (OD-2 sibling). Default: (a) —
  track the event, don't invent a rate.

### 6.2 Schema (`ds-party`, byte-stable)

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
    hero_ref: "[[Kira]]"      # optional link to a D7 ds-hero note (OD-8)
party:
  hero_tokens: 2              # table-wide pool (AGENT line 87)
_dse_anchor: a01b22
```

Actions: ± victories per member (or party-wide "award N victories" fed from Encounter/Montage
payouts); **"Convert victories to XP (respite)"** (zeroes victories, logs the event, applies rate if
configured); renown/wealth steppers with follower-threshold and echelon hints derived from the cited
scales. The party roster feeds **Encounter Builder** (`hero_count`/`hero_level` for budget, §2) and can
seed the Initiative Tracker's `heroes[]`.

---

## 7. Turn / round economy (Initiative extension)

**Enhancement of Initiative, not a new element.** Additive to `EncounterData`; old blocks default the
new fields so existing notes round-trip unchanged (byte-stable bar, F1 §4.2).

### 7.1 Rules (citable — REF §8 lines 259-266; AGENT lines 763-781)

Per turn a creature gets: **1 main action + 1 maneuver + 1 move action, in any order** (REF line 262;
main may be **downgraded** to a maneuver or move, AGENT line 779), plus **1 triggered action per
round** (free triggered actions don't count, AGENT line 780) and unlimited **free maneuvers** (trivial
activities, AGENT line 781). Round structure: **alternating activation, no initiative rolls**; d10 at
start, **6+ = players choose who goes first**; when one side is exhausted the other takes remaining
turns consecutively; **first-round order persists** (REF line 260; AGENT lines 763-772).

### 7.2 Design

- **Per-actor action checklist.** Extend each hero/creature row's detail view with four toggles —
  **[Main] [Maneuver] [Move] [Triggered]** — as a per-turn checklist, complementing the existing
  binary `has_taken_turn`. Keyboard-accessible controls (F1 §1.4). "Triggered" is **per round**, so it
  resets on round advance, not turn end.
- **Round counter + "Advance round."** Initiative currently has "Reset Round" (clears `has_taken_turn`,
  `initiativeProcessor.ts:62-83`) but **no round number**. Add `round: number`. An **"Advance round"**
  control (shared with the Malice panel §3) increments `round`, clears `has_taken_turn` +
  per-actor `actions`, applies the Malice per-round gain (OD-3), and is the natural hook to tick
  save-ends / end-of-turn condition durations later.
- **First-round order (optional, low priority).** A "who goes first" toggle recording the d10 result;
  purely informational.

### 7.3 Schema additions (`EncounterData`, additive)

```yaml
# ds-initiative (additions)
round: 1                      # NEW; absent → default 1
heroes:
  - name: "Kira"
    has_taken_turn: false
    actions: { main: false, maneuver: false, move: false, triggered: false }   # NEW; absent → all false
# … enemy_groups[].creatures[].instances[] gain the same optional `actions` object
malice:
  value: 3
  round_gain: 0               # NEW optional (OD-3); absent → manual-only
  log: []                     # NEW optional spend log (§3.1)
```

All new keys are **optional with absent-defaults**, so pre-D8 initiative blocks serialize identically
until a user touches the new controls (byte-stable migration).

---

## 8. Build sequence & dependencies

### 8.1 Dependency graph

```
F1 (framework: pipeline, ElementView, BlockHost, ReferenceService, SessionStore, registry)
 │   └─ Initiative + Negotiation migrated onto F1 (F1 §6 steps 8–9)  ← prerequisite for §3/§7
 ├─ D8.1 Sidebar host (SidebarBlockHost + DseSidebarView) ── unblocks D7 ── needs only F1
 ├─ D8.7 Turn/round economy  ┐
 ├─ D8.3 Malice surfacing     │ initiative extensions — F1 only, no compendium
 ├─ D8.6 Party tracker        │ F1 only
 ├─ D8.4 Montage tracker      │ F1 only
 └─ D8.5 Project tracker      ┘ F1 only (+ optional D6 goal resolution)

F2 OD-1 (steel-etl emits ds-sb/ds-fb) + data-unified release + D6 (SCC→typed model)
 ├─ D8.2 Encounter Builder            ── HARD-gated on F2 OD-1 + D6
 └─ D8.3b Spendable malice features   ── HARD-gated on F2 OD-1 + D6
```

### 8.2 Recommended order

1. **Sidebar host** (D8.1) — highest leverage, unblocks D7, needs only F1 + the migrated initiative view.
   Ship single-panel MVP (OD-4).
2. **Turn/round economy + Malice surfacing** (D8.7, D8.3a) — initiative extensions; no compendium; make
   the running tracker (in the new sidebar) genuinely session-useful.
3. **Party tracker** (D8.6) — the hub; simple; feeds later pieces.
4. **Montage tracker** (D8.4) — self-contained sibling of Negotiation.
5. **Project/Downtime tracker** (D8.5) — self-contained (+ optional D6).
6. **Encounter Builder** (D8.2) — the GM headline; **wait for F2 OD-1 + data-unified release + D6**.
7. **Spendable malice features** (D8.3b) — layer onto the Malice panel once monsters resolve.

### 8.3 Cross-repo gate (inherited from F2)

Steps 6–7 sit behind the **F2 critical path** (README §"Cross-repo critical path"): SDK 3.2.0
published, **steel-etl emits `ds-sb`/`ds-fb` in md-dse (F2 OD-1)**, and a data-unified GitHub Release
cut. Until then, Encounter Builder + malice-features can be **developed against a hand-cut release**
(F2 §3.2) but **not shipped**. Steps 1–5 have **no cross-repo dependency** and can proceed as soon as
F1 lands.

---

## 9. Open Decisions — needs Scott

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **OD-1** | Sidebar needs a mode value; F1 `RenderMode = "reading" \| "live-preview"` | widen F1's `RenderMode` union to add `"sidebar"` (additive; views never branch on `mode`, so safe) vs. reuse `"reading"` | **Widen to `"sidebar"`** — coordinate the one-line F1 change; keeps host telemetry honest |
| **OD-2** | Encounter **budget formula + difficulty bands + XP-per-Victory** are **not in the workspace reference** (Monsters/Director's-book content) | (a) parameterized, user-editable tables with a "verify vs core rules" default · (b) block the builder until sourced · (c) hardcode a guessed formula | **(a)** — data-driven tables; tool stays useful (shows spent EV vs. an unset budget) before the numbers are sourced; **never fabricate a rule into logic** |
| **OD-3** | Malice **per-round gain** formula absent from reference | configurable round-gain value + manual trigger quick-adds, default flagged "verify" vs. hardcode | **Configurable**, default flagged; trigger gains stay manual (matches how the reference frames them) |
| **OD-4** | Sidebar scope | single-panel MVP (running tracker) vs. multi-panel GM dashboard now | **Single-panel MVP**; `panels[]` list keeps the dashboard a pure additive follow-up |
| **OD-5** | Encounter Builder hand-off target | emit `ds-initiative` block into a note · mount directly in sidebar · both | **Both** ("Create tracker block" + "Open in sidebar") |
| **OD-6** | Malice tracker home | initiative sub-view (single source of truth) vs. standalone `ds-malice` block | **Sub-view primary**; optional standalone block shares the `{value,log,round}` model |
| **OD-7** | Malice-feature spend data source | rely on existing statblock/feature `cost: "N Malice"` strings (verified present) vs. request a typed field from steel-etl/SDK | **Use existing `cost` strings** (no cross-repo change); parse `N` from `/^(\d+)\s+Malice/i`. Revisit a typed field only if parsing proves brittle |
| **OD-8** | Party roster ↔ D7 hero sheet linkage | `hero_ref` by `[[wikilink]]`/scc vs. inline hero data | **Ref-by-link** (`hero_ref`), coordinate the key name with D7; inline fields stay as fallback |
| **OD-9** | Block anchoring for the sidebar (§1.5) | reserved YAML key `_dse_anchor` (round-trips via serialize) vs. Obsidian `^block-id` on the fence | **`_dse_anchor` YAML key** — survives edits/line moves, greppable, model-passthrough |

---

*Cross-references: F1 (`F1-element-framework-v2-spec.md` §3 interfaces, §4 state/persistence, §3.4
`BlockHost`, §3.3 `onUpdate`), F2 (`F2-…-spec.md` §1.4 statblock frontmatter, §3.3/OD-1 `ds-sb`
emission, §4.2 `SccResolver`), D6 (compendium reference-by-SCC — sibling Wave-2 spec, consumed not
redesigned), M1 §C + §F (ideation source), existing `draw-steel-elements/src/…/EncounterData.ts`
+ `initiativeProcessor.ts` (the persisted-tracker patterns extended here), `reference/` docs
(cited inline; encounter-EV / Malice-per-round / XP-rate confirmed absent and routed to OD-2/OD-3).*
