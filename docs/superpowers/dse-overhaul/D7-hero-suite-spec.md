# D7 — Hero-facing Suite (DSE) — Feature Spec

**Status:** proposed (planning only — no code changes)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin)
**Built on:** F1 Element Framework v2 (`F1-element-framework-v2-spec.md`). This spec imports
F1 §3 names verbatim (`ElementDefinition`, `ElementView`, `RenderContext`, `BlockHost`,
`ElementShape`, `SessionStore`, `ReferenceService`) and F1's state model (§4). Read F1 first.
**Ideation source:** `M1-new-element-ideation.md` §B (hero-facing) + §F (sidebar view).
**Rules source:** `reference/draw-steel-reference.md`, `reference/draw-steel-agent-reference.md`,
`reference/draw-steel-overview.md`.

**One-line summary:** a flagship persisted `ds-hero` element that composes a hero from many
small **presentational sub-views** (characteristics, stamina+recoveries+winded, heroic
resource, surges, victories, conditions, kit, abilities, skills) over a single block-local
`state:` model — plus five smaller standalone pieces (`ds-resource`, stamina recoveries
extension, `ds-surges`, `ds-conditions`, `ds-tokens`) that prove each composition seam
before the XL sheet. Rolls are delegated to D5, compendium lookups to D6, the sidebar host
to D8.

---

## 1. Draw Steel hero data model

Everything below cites `reference/draw-steel-reference.md` (RR §n) /
`reference/draw-steel-agent-reference.md` (AR). The model splits into a **durable
definition** (authored / compendium-resolved, rarely changes mid-session) and a **volatile
play-state** (mutated every combat turn). Getting this split right is the spine of §3.

### 1.1 Definition (durable)

| Field | Rules basis | Notes |
|---|---|---|
| `name`, `level` (1–10), `echelon` | RR §13 | Echelon derives from level (1–3 / 4–6 / 7–9 / 10). |
| `ancestry` | RR §2 | 13 ancestries; grants signature trait + purchased traits. Sets base size/speed/stability. |
| `culture`, `career` | RR §3 | Background → skills, languages, renown/wealth/project points, a perk. |
| `class`, `subclass` | RR §4 | Class fixes: **Stamina formula**, **Recoveries count**, **Heroic Resource type**, ability list, potency characteristic. |
| `kit` (0–2) | RR §5 | Grants Stamina/speed/stability/damage/distance bonuses + a signature ability. Tacticians can equip **two** (Field Arsenal). |
| `characteristics` | RR §1 | Might / Agility / Reason / Intuition / Presence, each −5..+5. |
| `skills` | RR §1 | Names from 5 groups (Crafting/Exploration/Interpersonal/Intrigue/Lore); a skill grants +2 to a matching test. |
| `abilities` | RR §4 | Signature (at-will) + heroic (resource-costed, escalating tiers). List of SCC codes or inline ability YAML. |
| `titles`, `perks`, `treasures`, `complication` | RR §6, §11 | Optional; display-only for v1. |

**Derived, never stored** (a `deriveHeroStats(defn)` pure function; needs class+kit+level, so
best when D6 resolves the compendium — see §3.5):

- **Max Stamina** = class base + per-level growth + kit bonus + ancestry/treasure bonuses.
  E.g. Fury `21 + 9/level` (RR §4), Shining Armor kit `+12/echelon` (RR §5).
- **Recovery value** = ⌊max_stamina / 3⌋ (RR §8).
- **Winded threshold** = ⌊max_stamina / 2⌋ — "at half Stamina max or below" (RR §8).
- **Death threshold** = −winded (−⌊max_stamina / 2⌋) (RR §8).
- **Recoveries max** = class value (Fury 10, Censor 12, Conduit 10, Elementalist 8, …) (AR).
- **Resource-per-turn** = class rule (e.g. Fury 1d3/turn +1 on taking damage; Censor 2/turn)
  (AR); **not auto-rolled** — display the rule, let the player enter the gain (§4.1).

### 1.2 Heroic Resource — class-aware (RR §4, AR)

Each class has exactly one resource; the sheet is class-aware via this table (the canonical
map, mirrored in `ds-resource`, §4.1):

| Class | Resource | Per-turn (level 1) | Notable |
|---|---|---|---|
| Censor | **Wrath** | 2/turn | start = Victories; +1 on judged dmg |
| Conduit | **Piety** | 1d3/turn | start = Victories; prayer risk |
| Elementalist | **Essence** | 2/turn | start = Victories; persistent-magic drains gain |
| Fury | **Ferocity** | 1d3/turn | +1 on taking dmg; +1d3 first winded/dying; Growing Ferocity thresholds 2/4/6/8/10/12 |
| Null | **Discipline** | 2/turn | +1 on enemy main-action in field; +1 on Director Malice |
| Shadow | **Insight** | 1d3/turn | start = Victories; +1 on surge damage |
| Tactician | **Focus** | 2/turn | +1 ally-damages-marked; +1 ally heroic ability |
| Talent | **Clarity** | 1d3/turn | **can go negative** ("strained"); self-damage each turn |
| Troubadour | **Drama** | 1d3/turn | +2 3-heroes-act; +2 ally winded; +10 hero death; resurrect at 30 |

Modeling consequences: resource is a signed integer (Talent negative), with an
optional per-class `min` (default 0; Talent lifts the floor). The tracker shows the class
name + gain rule as a hint but does **not** simulate triggers — the player drives it.

### 1.3 Stamina / Recoveries / Winded (RR §8)

- `current_stamina` (signed; can go to −winded), `temp_stamina` (absorbs first, non-stacking,
  clears end of encounter), `max_stamina` (derived or authored).
- **Winded** = current ≤ winded threshold. **Dying** = current ≤ 0 (auto-bleeding, can act,
  can't Catch Breath). **Dead** = current ≤ −winded.
- **Recoveries**: `recoveries_remaining` / `recoveries_max`; **Catch Breath** maneuver =
  spend 1 recovery, heal recovery value (RR §8). Respite restores all Stamina + Recoveries.
- These fold into the **Stamina** element (M1 §B), not a new block (§4.2).

### 1.4 Surges, Victories, Hero Tokens

- **Surges** (AR §Surges): bonus-damage tokens; each adds damage = your **highest
  characteristic** when you deal damage; consumed on use; cleared end of encounter. Integer
  count. Weakened creatures can't gain surges.
- **Victories** (RR §10, §13): earned per encounter; **seed** many classes' starting resource
  (Censor/Conduit/Elementalist/Shadow "start = Victories", AR); convert to XP at respite.
  Integer.
- **Hero Tokens** (RR §7 "Hero Tokens", AR §Hero Tokens): a **party-wide pool**, spent to
  reroll any test; awarded by the Director. Because it is shared across heroes, it is a
  *party* resource, not a per-hero field — see `ds-tokens` (§4.5) and OD-3.

### 1.5 Conditions (single-actor) (RR §8)

Eight standard conditions (Bleeding, Dazed, Frightened, Grabbed, Prone, Restrained, Slowed,
Weakened) + pseudo-conditions (Marked, Winded, Dying, Dead, Hidden, …) already modeled by the
initiative tracker's `ConditionManager` (`src/utils/Conditions.ts`) and `Condition` interface
(`{key, color?, effect?}`, `EncounterData.ts`). A hero's conditions add **duration** semantics
the tracker encodes in `effect` today: **save ends** (roll d10, 6+ ends), **EoT** (end of
turn), **EoE** (end of encounter). D7 reuses that engine verbatim (§2.4, §4.4).

---

## 2. Composition strategy

The hero sheet is XL; F1 already anticipates decomposition ("`updateStaminaDisplay(el)`
becomes a method on a small sub-view instead of a rebuild", F1 §4.2) and a shared
`framework/kit/` for reusable widgets (F1 §2.5). D7 formalizes the pattern.

### 2.1 The container / presentational split

The **one rule** that makes composition tractable: **persistence and model ownership live in
the container; rendering + mutation-intent live in stateless presentational sub-views.**

- **Container** = an `ElementView<M>` (F1 §3.3). It owns the single model `M`, calls
  `this.persist()` (F1's debounced write-behind), resolves refs, and is the only thing that
  touches the block YAML. There are two container flavors:
  - a **standalone element** container (e.g. `StaminaBarView`) whose `M` is just that
    element's slice; **one** persist target.
  - the **hero sheet** container (`HeroSheetView`) whose `M` is the whole `HeroModel`; still
    **one** persist target for the whole `ds-hero` block.
- **Presentational sub-view** = a lightweight `obsidian.Component` (**not** an `ElementView`;
  it has no model/persist/refs of its own) that renders a *slice* and emits change intents:

```ts
// proposed: framework/kit/HeroPanel.ts  (or elements/_shared/ — OD-7)
export interface PanelHost {
  /** true when the owning container can persist (F1 BlockHost.canPersist). */
  readonly readOnly: boolean;
  /** Optional roll seam handed down from the container (D5). Absent ⇒ no roll affordances. */
  readonly roll?: RollService;          // §3.5 / §7 — D5 owns this
}

export abstract class HeroPanel<S> extends Component {
  constructor(protected readonly cx: RenderContext, protected readonly host: PanelHost) { super(); }
  /** Build DOM into `root`; call `onChange(patch)` when the user mutates the slice. */
  abstract mountPanel(root: HTMLElement, slice: S, onChange: (patch: Partial<S>) => void): void;
  /** Apply an externally-changed slice in place (no rebuild). */
  abstract updatePanel(slice: S): void;
}
```

`HeroPanel` deliberately mirrors `ElementView`'s `onMount`/`onUpdate` split minus the
container concerns, so migrating an existing element's render code into a panel is
mechanical. Listeners use `this.registerDomEvent`; children use `this.addChild`; teardown
cascades exactly as F1 §4.5 requires because a panel is a `Component` and the container
`addChild`s it.

### 2.2 State ownership & data flow

```
                 ┌─────────────────────────── HeroSheetView (ElementView<HeroModel>) ──────────────────────────┐
   ds-hero  ───▶ │  model: HeroModel   (defn + state)      persist(): serialize→host.replaceSource (debounced) │
   block YAML    │                                                                                             │
                 │   onChange(patch) ── applies patch to model.state ── panel.updatePanel(slice) ── persist()  │
                 │        ▲            ▲            ▲            ▲            ▲            ▲            ▲          │
                 │   Character-   Stamina/     Resource     Surges/      Conditions    Skills      Abilities    │
                 │   istics       Recoveries   panel        Victories    panel         panel       panel        │
                 │   panel        panel        (§4.1)       (§4.4/§4.3)  (§4.4)        (reuse)     (D5 rolls)   │
                 │   (reuse)      (reuse+§4.2)                                                                   │
                 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Single source of truth:** `HeroSheetView.model`. Panels are given read-only slices; they
  never hold authoritative state. A panel mutation flows *up* via `onChange(patch)`, the
  container mutates `model.state`, targets `panel.updatePanel(slice)` for any panel whose
  slice changed (e.g. stamina change re-derives winded → conditions/stamina panels refresh),
  then `persist()`.
- **One persist per block.** The whole `ds-hero` is one persisted element (F1 shape
  `persisted`); there is exactly one `serialize`/`replaceSource`. No panel writes YAML.
- **Session UI state** (which ability tab is open, which panels are collapsed) lives in
  `SessionStore` keyed by `host.blockKey()` (F1 §4.3), never in the note.

### 2.3 Reusing existing elements

Characteristics, Stamina, Skills, Counter are being rebuilt as F1 elements anyway (F1 §6
steps 2–4, 7). D7's ask of those migrations: **each factors its render into a `HeroPanel`
presentational core**, and the standalone `ElementDefinition` becomes `panel + thin persist
container`. Then:

| Sheet panel | Reuses | Slice `S` |
|---|---|---|
| Characteristics | `CharacteristicsPanel` (from `ds-characteristics`) | `{might,agility,reason,intuition,presence}` |
| Stamina + Recoveries + Winded | `StaminaPanel` (from `ds-stamina`, extended §4.2) | `{current,temp,max,recoveries_remaining,recoveries_max}` |
| Heroic Resource | `ResourcePanel` (from `ds-resource`, §4.1) | `{type,current,min}` |
| Surges | `SurgePanel` (from `ds-surges`, §4.3) | `{surges}` |
| Conditions | `ConditionsPanel` (from `ds-conditions`, §4.4) | `Condition[]` |
| Skills | `SkillsPanel` (from `ds-skills`) | `{skills,custom_skills}` |
| Abilities | `AbilityCard` sub-view (from Feature/Ability element, F1 step 5) + D5 | `AbilityRef[]` |

This is a **coordination note for F1/D2**, not a demand to re-open F1's interfaces:
`HeroPanel` is proposed as a `framework/kit/` addition (OD-7). If F1/D2 decline to factor the
panels, D7 falls back to instantiating the standalone `ElementView`s in a read-through mode —
but that duplicates persist targets and is explicitly the worse path (flagged OD-7).

### 2.4 Conditions engine reuse

`ConditionsPanel` imports `ConditionManager` + the `Condition` interface unchanged from the
initiative tracker (`src/utils/Conditions.ts`, `EncounterData.ts`) and the existing
`ConditionSelectModal`/`CustomizeConditionModal` (moved under `framework/kit/` or shared).
The single-actor strip is the tracker's per-creature condition row, decoupled from an
encounter — exactly M1 §B's "reuses the initiative tracker's condition engine, decoupled."

---

## 3. Hero Sheet — `ds-hero`

**Shape:** `persisted` (F1 §1.3). **Aliases:** `["ds-hero", "ds-character", "ds-sheet"]`
(canonical first, F1 §3.1). **autoResolveRefs:** `false` (selective resolution, §3.5).

### 3.1 YAML schema (definition + state)

The block has two top-level maps: `hero:` fields (definition — authored or compendium-ref)
and `state:` (the volatile play surface, the only thing play mutations rewrite, §3.4).

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

Schema (`elements/hero/schema.yaml`, AJV per F1 §5 / OD-4): `hero` object required; `name`
required; `level` int 1–10; `characteristics` keys constrained to the five; `abilities`
array of string|object; `state` object with typed sub-fields, all optional (a freshly
authored sheet with no `state:` is valid — the pipeline seeds defaults). Refs (`scc*`,
`@path`, `[[wikilink]]`) validate as strings and resolve in `resolveRefs` (§3.5), not schema.

### 3.2 Layout (ASCII mockup)

Wide (multi-column, ≥ ~720px content width); collapses to single column on narrow (CSS
container query, no JS). Every panel is a collapsible section (reuse `ComponentWrapper`'s
`collapsible`/`collapse_default`, F1 §1.4).

```
┌─ ds-hero ─────────────────────────────────────────────────────────────────────┐
│  TORIN STONEFIST                              Lvl 3 · Echelon 1 · Dwarf         │
│  Fury (Berserker) · Mountain kit                              [respite] [⚙]     │
├──────────────────────────────────────────────┬──────────────────────────────────┤
│  CHARACTERISTICS                              │  HEROIC RESOURCE  ── Ferocity     │
│   MGT  AGI  REA  INT  PRE                     │        ◀  4  ▶     (1d3/turn,     │
│   +2   +2   -1   +0   +1                      │                    +1 on dmg)     │
│  (click a score → D5 test roll)               │  SURGES ◀ 1 ▶  (=+2 dmg each)     │
├──────────────────────────────────────────────┤  VICTORIES ◀ 2 ▶   TOKENS: 3(♦)  │
│  STAMINA                             WINDED●  │──────────────────────────────────┤
│  ███████████████░░░░░░░░  31 / 48  (+0 temp)  │  CONDITIONS                       │
│  Winded ≤24 · Dying ≤0 · Dead ≤-24            │   [Bleeding · save ends ✕]        │
│  RECOVERIES  ●●●●●●○○○○  6/10  (val 16)       │   [+ add condition]               │
│  [ Catch Breath -1 rec, +16 ]                 │                                   │
├──────────────────────────────────────────────┴──────────────────────────────────┤
│  ABILITIES                        [ Signature | Heroic | Triggered | All ]        │
│   ▸ Brute Strike        Signature   Melee · Might          [ roll ▸ ]             │
│   ▸ Into the Fray       3 Ferocity  Melee · Might          [ roll ▸ ]  (spends 3) │
│        └ (expanded: full ability card rendered via Feature/Ability sub-view)      │
├───────────────────────────────────────────────────────────────────────────────┤
│  SKILLS         Endurance · Intimidate · Nature            KIT / TRAITS  ▸        │
└───────────────────────────────────────────────────────────────────────────────┘
```

Header actions: **[respite]** = one-click reset (restore Stamina+Recoveries, clear
surges+temp+EoE conditions, convert Victories→XP prompt — OD-9); **[⚙]** = collapse-all /
sheet options. `●WINDED` badge and Stamina bar color state are derived, not stored.

### 3.3 View decomposition

`HeroSheetView extends ElementView<HeroModel>`:

- `onMount(root, model)`: builds the scaffold (`createDiv` regions), then for each region
  constructs a `HeroPanel`, `this.addChild(panel)`, and `panel.mountPanel(regionEl, slice,
  patch => this.applyPatch(region, patch))`. Ability cards render **lazily** (row → expand →
  `renderMarkdown` a Feature/Ability sub-view; F1 §3.3 `renderMarkdown` parented to the view).
- `applyPatch(region, patch)`: merges into `model.state`, re-derives dependent values
  (stamina→winded/dying, resource clamp), calls `updatePanel` on every affected panel, then
  `this.persist()` (debounced, F1 §4.2).
- `onUpdate(model)`: F1's external-change path (someone edited the block / write-behind
  echo) — diff slices, `updatePanel` each changed panel; fall back to teardown+remount only
  if the definition changed (which re-runs `resolveRefs`).
- Read-only mode: when `!cx.host.canPersist` (embeds, print, unresolvable canvas — F1 §4.4),
  panels mount with `PanelHost.readOnly = true`: steppers/buttons render disabled with the
  "read-only in this context" tooltip (F1 §4.4). Rolls (view-only) still work.

### 3.4 Persisted-state design (the key move)

**Only `state:` is rewritten by play.** The definition is authored (often large, with the
player's comments, ability list, notes) and must not be clobbered by a stamina click. F1's
`serialize(model): string` (§3.1) gives us the room to do this **without new host APIs**:

- At `parse(data, raw)`, `HeroModel` captures `defnRaw: string` = the block text with the
  `state:` sub-block stripped (kept byte-for-byte, comments and key order intact).
- `serialize(model)` returns `defnRaw + "\nstate:\n" + indent(stringifyYaml(model.state))`.
  I.e. re-emit **only** `state:` from the model; splice the untouched authored definition
  back verbatim.
- Result: authored definition round-trips **byte-stable** (stronger than F1's baseline "byte-
  compat only for plugin-written blocks", F1 §9 YAML-lossiness risk); the ~8-line `state:` map
  is the only churn. F1's debounced write-behind + unload flush (§4.2, OD-3) apply unchanged.

This keeps the flagship's persistence honest: the note stays diff-friendly and hand-authored
content is never re-emitted. (OD-2 asks whether to instead do a full re-serialize; default is
the state-scoped splice above.)

Defaulting: a sheet authored with no `state:` gets defaults seeded on first mount
(current=max, recoveries=max, resource=min, surges/victories=0, conditions=[]) — written on
first interaction, not on mount (mount stays side-effect-free per F1).

### 3.5 Consumed hooks — roll engine (D5) & compendium (D6)

**Roll engine (D5).** The sheet does **not** implement tier math, edges/banes, or crit
handling. It consumes a `RollService` seam (D5 adds it to `RenderContext`, or exports a
`rollPower(req)`), passing context and reacting to the result:

```ts
// CONSUMED shape (D5 owns the authoritative definition — see §7):
interface RollService {
  rollPower(req: {
    ability?: AbilityRef;        // the ability being used (for tier effects)
    characteristic: CharKey;     // which score drives the 2d10 + mod
    score: number;               // hero's characteristic score
    surges: number;              // available surges (each = highest-char bonus damage)
    highestChar: number;         // for surge damage math
    edges?: number; banes?: number;   // D5's edge/bane resolver may override
  }): Promise<RollResult>;       // tier 1/2/3, crit flag, surges consumed, damage
}
```

Sheet responsibilities on a result: decrement `state.surges` by `result.surgesSpent`,
surface the tier outcome, and (player-confirmed) apply resource/victory triggers the class
rules imply (e.g. Fury +1 ferocity on taking damage) — all as normal `applyPatch` mutations.
Ability rows expose `[ roll ▸ ]`; scores expose click-to-test. **If D5 is absent**, ability
rows render static (full card, no roll button); no tier UI. Edge/bane state is D5's (its
resolver), not the sheet's (OD-6).

**Compendium (D6 / F2).** `resolveRefs(model, refs)` (F1 §3.1, `autoResolveRefs:false`)
resolves **only the definition refs the sheet needs to derive stats**:

- `class` → resource type + name, Stamina formula, Recoveries count, potency characteristic,
  ability catalog.
- `kits[]` → Stamina/speed/damage bonuses + signature ability.
- `ancestry` → traits, base size/speed/stability.

These feed `deriveHeroStats(defn)` (§1.1). `abilities[]` SCC codes are **left unresolved**
and rendered lazily per-row on expand (via D6's reference-by-SCC path → Feature/Ability
sub-view). D6 owns resolution; the sheet consumes `ResolvedRef.data` (F1 §3.7). **If D6/F2 is
absent**, the sheet requires inline definition (explicit `max_stamina`/`recoveries_max`/
`resource`/inline abilities) and shows a notice on unresolved `scc:` refs (F1's standard
"unresolvable reference" error path) — the sheet still fully works from inline YAML.

### 3.6 ElementDefinition sketch

```ts
export const heroElement: ElementDefinition<HeroModel> = {
  id: "hero",
  name: "Hero sheet",
  aliases: ["ds-hero", "ds-character", "ds-sheet"],
  shape: "persisted",
  schema: heroSchemaYaml,
  autoResolveRefs: false,                       // selective — see resolveRefs
  parse: (data, raw) => HeroModel.parse(data, raw),   // captures defnRaw (§3.4)
  serialize: (m) => m.serializeStateSplice(),         // state-scoped write (§3.4)
  resolveRefs: (m, refs) => m.resolveDefinition(refs), // class/kit/ancestry only (§3.5)
  createView: (cx) => new HeroSheetView(cx),
};
```

---

## 4. Standalone pieces

Each is a small F1 `ElementDefinition` **and** exposes a `HeroPanel` presentational core the
sheet reuses (§2.3). They ship first (§6) to prove each seam in isolation.

### 4.1 Heroic Resource — `ds-resource`

```ts
export const resourceElement: ElementDefinition<ResourceModel> = {
  id: "heroic-resource",
  name: "Heroic resource",
  aliases: ["ds-resource", "ds-hr"],
  shape: "persisted",
  schema: resourceSchemaYaml,
  parse: (d) => ResourceModel.parse(d),   // {class?, type?, current, min, max?}
  serialize: (m) => stringifyYaml(m.dto()),
  createView: (cx) => new ResourcePanelContainer(cx),  // wraps ResourcePanel
};
```

```yaml
~~~ds-resource
class: fury         # class-aware: fills type=Ferocity, min=0, gain-hint
current: 4
~~~
```

Class-aware via the §1.2 table (a static `RESOURCE_BY_CLASS` map — no compendium needed for
the name; D6 enriches the gain rule when present). Distinct from `ds-counter`: signed
(Talent Clarity goes negative), shows the class gain rule as a hint, class-defaulted label.
Presentational core `ResourcePanel<{type,current,min}>` — stepper + hint. **Cx: S.**

### 4.2 Recoveries / Winded — Stamina extension (⚡, not a new block)

M1 §B: "Fold into the Stamina element." Extend the migrated `ds-stamina` model + schema:

```yaml
~~~ds-stamina
max_stamina: 48
current_stamina: 31
temp_stamina: 0
recoveries: 6           # NEW — remaining
recoveries_max: 10      # NEW — pool size (else omit for display-less)
~~~
```

`StaminaModel` gains `recoveries?`, `recoveries_max?`; derives winded (⌊max/2⌋), dying (≤0),
death (−winded), recovery value (⌊max/3⌋). `StaminaPanel` gains: recoveries pips, a **Catch
Breath** button (−1 recovery, +recovery-value stamina, disabled when dying/none-left), and a
winded/dying badge. Backwards compatible (new fields optional; old `ds-stamina` blocks
unchanged). Persist via existing stamina write path. **Cx: S.**

### 4.3 Surge tracker — `ds-surges`

```ts
export const surgesElement: ElementDefinition<SurgeModel> = {
  id: "surges",
  name: "Surge tracker",
  aliases: ["ds-surges", "ds-surge"],
  shape: "persisted",
  schema: surgesSchemaYaml,
  parse: (d) => SurgeModel.parse(d),      // {surges, highest_characteristic?}
  serialize: (m) => stringifyYaml(m.dto()),
  createView: (cx) => new SurgePanelContainer(cx),
};
```

Tiny: a labelled stepper ("Surges · each = +N damage", N = highest characteristic if
provided). Cleared to 0 at end of encounter. On the sheet it lives in the resource strip and
its count is spent by D5 roll results (§3.5). **Cx: S.**

### 4.4 Conditions strip (single-actor) — `ds-conditions`

```ts
export const conditionsElement: ElementDefinition<ConditionsModel> = {
  id: "conditions",
  name: "Conditions",
  aliases: ["ds-conditions", "ds-cond"],
  shape: "persisted",
  schema: conditionsSchemaYaml,
  parse: (d) => ConditionsModel.parse(d), // { conditions: Condition[] }
  serialize: (m) => stringifyYaml(m.dto()),
  createView: (cx) => new ConditionsPanelContainer(cx),
};
```

```yaml
~~~ds-conditions
conditions:
  - { key: bleeding, effect: "save ends" }
  - { key: slowed,   effect: "EoT" }
  - Restrained            # bare string = no duration
~~~
```

Reuses `ConditionManager` (icons/keys) + `ConditionSelectModal`/`CustomizeConditionModal`
(§2.4). Chips with icon + name + duration (save-ends/EoT/EoE) + remove ✕; "+ add condition"
opens the select modal. Save-ends chips can offer a d10 save (delegating to D5's roller when
present; else a simple prompt). **Cx: M** (modal + duration semantics).

### 4.5 Hero Tokens (party pool) — `ds-tokens`

```ts
export const tokensElement: ElementDefinition<TokenPoolModel> = {
  id: "hero-tokens",
  name: "Hero tokens",
  aliases: ["ds-tokens", "ds-hero-tokens"],
  shape: "persisted",
  schema: tokensSchemaYaml,
  parse: (d) => TokenPoolModel.parse(d),  // { tokens, label? }
  serialize: (m) => stringifyYaml(m.dto()),
  createView: (cx) => new TokenPoolContainer(cx),
};
```

```yaml
~~~ds-tokens
label: "Session 12 party pool"
tokens: 3
~~~
```

The **canonical party pool** lives in exactly one `ds-tokens` block (a party/session note).
Hero sheets show a **read-through** of the pool via `state.tokens_ref` (§3.1) and can spend
into it *when the referenced block is addressable* (write via the same `replaceSource` path;
read-only otherwise). True cross-note, cross-session live sync is beyond F1's block-local
persistence — deferred to a D8 party tracker (OD-3, §7). **Cx: S** (the block); the
cross-block wiring is the open part.

---

## 5. Sidebar-mode addendum (consumes D8)

M1 §F wants trackers/sheets as persistent `ItemView`s that survive note navigation. D8 owns
"the reusable sidebar `ItemView` host pattern." The hero sheet is designed **code-block-first**
(§3); sidebar mode is an **additive host**, not a rewrite — this is exactly F1's mode-blind
promise (`ElementView` never touches `MarkdownPostProcessorContext`; everything mode-specific
is behind `BlockHost`, F1 §2.1/§3.4).

Design when D8 lands:

- D8 provides a `SidebarBlockHost implements BlockHost` (F1 §3.4): `containerEl` = the
  `ItemView`'s content pane; `sourcePath`/`getBlockInfo`/`replaceSource` point at a **pinned
  source block** (the `ds-hero` block the sidebar is "following"), so edits still round-trip to
  the note (the note remains the database). `addChild` ties the view to the `ItemView`'s
  lifecycle; `canPersist` mirrors the source block's addressability.
- `HeroSheetView` is instantiated identically — same `createView(cx)`, same panels, same
  persist path — only `cx.host` differs. Zero view-code change (F1 §2.2).
- The sidebar adds a "pin this hero" command / following semantics (D8's concern): pick a
  `ds-hero` block → open in sidebar → survives navigation. `SessionStore` keeps the pin +
  panel/tab state across note switches.

**If D8 is absent:** ship `ds-hero` as a code-block element only (fully functional). The
sidebar is a pure add-on later; no design debt is incurred because the seam is F1's `BlockHost`
(this addendum is the whole contract). Dependency noted in §7.

---

## 6. Build sequence (smaller → flagship)

Rationale: each small piece proves one composition seam (persist round-trip, class-awareness,
condition-engine reuse, cross-block sharing) before the XL sheet composes all of them.
Prereq: F1 core + the reused elements' F1 migrations exist — Stamina (F1 step 4),
Characteristics (step 2), Skills (step 3), Feature/Ability (step 5). D7 starts after those.

| Step | Piece | Proves | Depends |
|---|---|---|---|
| D7.0 | `HeroPanel` contract + `elements/_shared/` (or `framework/kit/`) | The container/presentational split (§2.1); OD-7 | F1 core |
| D7.1 | **`ds-conditions`** | Condition-engine reuse (§2.4) as a standalone; simplest new persisted element with a modal | F1; initiative `ConditionManager` |
| D7.2 | **`ds-resource`** | Class-awareness map + signed/negative persist; D6-enrich seam | F1 (D6 optional) |
| D7.3 | **Stamina recoveries/winded** extension (⚡) | Extending an existing element's model+panel backward-compatibly (§4.2) | F1 step 4 (Stamina) |
| D7.4 | **`ds-surges`** | Trivial persisted stepper; the surge slice the sheet + D5 share | F1 |
| D7.5 | **`ds-tokens`** | Party-pool + cross-block reference problem surfaced early (OD-3) | F1 |
| D7.6 | **`ds-hero` flagship** | Full composition: all panels + Characteristics/Skills/Ability cards over one `state:` model; `resolveRefs`; D5 roll hooks; state-scoped serialize (§3.4) | D7.0–D7.5, F1 steps 2–5; D5, D6 (degrade if absent, §3.5) |
| D7.7 | **Sidebar mode** (addendum §5) | Same views under `SidebarBlockHost` | D8 |

Each step: `elements/<id>/{definition,model,view,panel}.ts` (+ `schema.yaml`, OD-4), a Jest
golden-render snapshot (F1 §6), and a byte-stable persist round-trip test (F1 §4 contract).

---

## 7. Dependencies

| Dep | What D7 consumes | If absent |
|---|---|---|
| **F1** (done) | `ElementDefinition`/`ElementView`/`RenderContext`/`BlockHost`/`SessionStore`/`ReferenceService`, persisted write-behind (§4.2), error card. Proposes `HeroPanel` in `framework/kit/` (OD-7). | Hard blocker — F1 is the substrate. |
| **F1-migrated elements** | `CharacteristicsPanel`, `StaminaPanel`, `SkillsPanel`, `AbilityCard` presentational cores (§2.3). | Fall back to rebuilding panels in `elements/hero/` (duplicated render, worse — OD-7). |
| **D5 — rolling** | `RollService.rollPower(req)` seam (§3.5): tier resolution, edges/banes, crit, surge damage. Sheet passes context, reacts (spend surges, apply triggers). | Abilities render static (no roll button); scores non-clickable. Sheet still fully usable. |
| **D6 — compendium-by-SCC** | Resolution of `class`/`kit`/`ancestry`/`abilities` refs → derived stats + ability cards (§3.5), via `cx.refs`/D6 API. | Require inline definition + explicit derived fields; notice on unresolved `scc:`. Sheet works from inline YAML. |
| **D8 — sidebar `ItemView` host** | `SidebarBlockHost implements BlockHost` (§5). | Ship code-block-only; sidebar is a later drop-in (no design debt — the seam is F1's `BlockHost`). |

**Sequencing:** D7 is **Wave-3** relative to F1/D5/D6 (it composes their outputs). D7.1–D7.5
can proceed against F1 alone (D5/D6 optional, degrade gracefully); D7.6 wants D5+D6 for the
full experience but ships without them. D7.7 waits on D8. Coordinate with D8 on
hero↔initiative integration (import a `ds-hero` into the tracker; shared conditions engine).

---

## 8. Open Decisions — needs Scott

- **OD-1 — Definition storage.** `hero:`/`state:` split in one `ds-hero` block (default,
  §3.1) vs. definition in note frontmatter vs. definition wholly compendium-ref'd. Default
  keeps one self-contained block, ref-capable per field. **Recommend:** in-block split.
- **OD-2 — State-scoped write vs. full re-serialize.** `serialize` splices only `state:`,
  preserving authored definition + comments byte-stable (§3.4, default) vs. F1's plain
  full-block re-emit (simpler, loses comments/order on the large authored definition).
  **Recommend:** state-scoped splice — the definition is big and hand-authored; protecting it
  is worth the serializer complexity (aligns with "do the right thing over minimizing").
- **OD-3 — Hero Tokens sharing.** Canonical standalone `ds-tokens` party pool that sheets
  read-through/spend-into when addressable (default, §4.5) vs. per-hero `state.tokens`
  (simple, wrong — tokens are party-wide) vs. frontmatter/sidecar shared store vs. defer all
  sharing to a D8 party tracker. **Recommend:** ship `ds-tokens` canonical now; true
  cross-note live sync deferred to D8.
- **OD-4 — Derived-stat source of truth.** Derive max Stamina / recoveries / resource-per-turn
  from class+kit+level (needs D6, §1.1) vs. always author explicitly. **Recommend:** derive
  when compendium-resolved; always allow explicit override (works offline).
- **OD-5 — Ability rendering density.** Compact rows that expand to a full Feature/Ability
  card lazily (default, §3.2) vs. all cards always expanded (heavy, tall sheet) vs.
  cost-tabbed. **Recommend:** compact rows + lazy expand + a cost/type tab filter.
- **OD-6 — Roll boundary.** D5 owns the roll + edge/bane resolver modal; the sheet only
  supplies context and reacts (default, §3.5) vs. the sheet holds edge/bane toggles itself.
  **Recommend:** D5 owns it — keeps roll math in one place (D5's lane).
- **OD-7 — `HeroPanel` location & ownership.** Add `HeroPanel` (the presentational sub-view
  contract) to `framework/kit/` and have the standalone elements factor their render into
  panels (default, §2.1/§2.3) vs. keep it in `elements/_shared/` vs. don't factor and have
  the sheet rebuild panels. **Recommend:** `framework/kit/HeroPanel` — coordinate with F1/D2
  so Characteristics/Stamina/Skills expose panels; this is the single biggest cross-effort ask.
- **OD-8 — Respite / reset action.** One-click **[respite]** (restore Stamina+Recoveries,
  clear surges+temp+EoE conditions, prompt Victories→XP; §3.2) in D7.6 vs. defer to a later
  effort. **Recommend:** include a minimal respite button in D7.6 (restore + clear); XP
  conversion prompt optional.
- **OD-9 — Multi-hero / party-in-one-note & initiative import.** Several `ds-hero` blocks in
  one note as a party view, and "import this hero into the initiative tracker" — coordinate
  with D8 (party tracker) and the initiative element. **Recommend:** out of D7 core; a
  cross-effort follow-up with D8.

---

*Cross-references: `F1-element-framework-v2-spec.md` (§3 interfaces, §4 state/persistence,
§1.3 shapes); `M1-new-element-ideation.md` §B/§F; `reference/draw-steel-reference.md`,
`reference/draw-steel-agent-reference.md`, `reference/draw-steel-overview.md`;
`draw-steel-elements/src/utils/Conditions.ts` + `EncounterData.ts` (condition engine reuse);
`draw-steel-elements/docs/canvas-character-sheet.md` (prior art — the manual-canvas approach
`ds-hero` supersedes). Consumes D5 (rolling), D6 (compendium-by-SCC), D8 (sidebar host) — each
specced separately; contracts here are the consumed shapes, degrade-gracefully if absent.*
