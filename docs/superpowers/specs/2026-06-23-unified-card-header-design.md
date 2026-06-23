# Unified Card Header — the "6-slot header" — design

**Date:** 2026-06-23
**Status:** Specced (not yet implemented)
**Scope:** Cross-repo — `steel-etl/internal/site/` (Go card renderers) + `v2/docs/stylesheets/` (CSS). Changes a workspace-level design contract (how every card surfaces its identity fields), hence a workspace spec rather than a sub-repo one.

## Problem

The v2 site renders many card types — abilities, features/traits, statblocks, featureblocks (terrain / fixtures / malice / advancement), their preview variants, and the sub-features nested inside statblocks/featureblocks. Each card hand-rolls its own header, and **what goes in the "eyebrow" vs the top-right slot was decided per-card by feel.** The result drifts:

- "Black Ash Teleport" as a **Feature** shows eyebrow `Shadow Feature`.
- "Black Ash Teleport" as an **Ability** shows eyebrow `Maneuver - Black Ash`.

Same entity, two unrelated header vocabularies. Worse, because each card owns its own header logic, fields silently disappear under some setting permutations (e.g. cost shown *or* level, never both). There is no shared contract guaranteeing that a given kind of information always lands in the same place — which directly violates the design language's **Predictable lookup** principle (DESIGN.md §Motivation #2).

## Goal

One shared header model that **every** card type fills from a common slot vocabulary, so:

1. The same *kind* of information always lands in the same place, across all card types.
2. No field is lost across setting permutations.
3. The model is simple enough to extrapolate to card types not enumerated here.
4. It stays legible on mobile.

## The model: a 6-slot header

The header is a **3-row × 2-column grid**. Three horizontal **lanes** (eyebrow / primary / deck) span two **columns** (left / right), giving six slots:

```
          LEFT (stack)              RIGHT (rail)
  top   left-eyebrow             right-eyebrow
  mid   left-primary             right-primary
  bot   left-deck                right-deck
```

### Slots

| Slot | slug | Position |
|---|---|---|
| Left eyebrow | `left-eyebrow` | stack, above name |
| Left primary | `left-primary` | stack, middle (always the **name**) |
| Left deck | `left-deck` | stack, below name |
| Right eyebrow | `right-eyebrow` | rail, top |
| Right primary | `right-primary` | rail, middle |
| Right deck | `right-deck` | rail, bottom |

The two columns are **`left`** (the "stack") and **`right`** (the "rail").

### Three rules make the model work

1. **The lane is the consistency contract.** Top→bottom, the lanes mean the same *emphasis* on both sides: `eyebrow` = small context, `primary` = the headline, `deck` = quiet detail. The slot names are **positional, not purpose-bound** — a slot never declares what it "must" hold, so it never lies when a card stuffs something unexpected into it.

2. **Render style is a separate modifier.** Each slot renders as a `--line` (text) or a `--chip` (pill/badge), chosen independently of the slot name. **Default right-column rendering** (reusable everywhere, still overridable per slot): eyebrow = chip, **primary = mini-title** (a prominent line, mirroring the left's name), deck = chip. This gives the header a small / big / small rhythm on *both* sides — it reads as **two mirrored title blocks**.

3. **Every slot is independently optional.** A sparse card fills only what it has; empty slots simply leave a gap (we explicitly chose gaps over promotion/reflow — see Decisions).

### Lane semantics (the fill guideline)

The slots are positional, but a *guideline* keeps fills consistent across card types:

- **`left-eyebrow` = the kind-noun** — the "…is a ___" phrase. Specialized per family (see below).
- **`left-primary` = the name** (always present; the one dominant slot).
- **`left-deck` = provenance**, format **`class · subclass`** (source · specialization). Empty when provenance is absent or implied by context.
- **`right-eyebrow` = progression** — Level / Echelon. Empty when the card has none.
- **`right-primary` = the headline attribute** — the card's single most important distinguishing attribute, chosen per family: for **stat-bearing** cards (statblocks, featureblocks) it's the colored **category** (organization+role / type+role); for **resource-bought** cards (abilities, costed features) it's the **cost**. (Abilities *have* a category — usage — but it's deliberately demoted to `right-deck`; see the Ability note.)
- **`right-deck` = a secondary attribute** — cost / usage / EV.

### `left-eyebrow` kind-noun is *specialized* per family

The eyebrow declares what the object fundamentally **is**, specialized so it reads true:

- Statblocks: **Monster / Companion / Retainer / Summon** (the SCC code already encodes the family).
- Features: **Feature**, or **Trait** for ancestry + monster passives (per the existing narrowed taxonomy — `feature_type: trait`).
- Featureblocks: **Dynamic Terrain / Fixture / Malice / Advancement / Featureblock**.
- Abilities: **Ability**.

## Per-card fill maps

`left-primary` = the name in every row, so it's omitted from the table.

| Card | `left-eyebrow` | `left-deck` | `right-eyebrow` | `right-primary` | `right-deck` |
|---|---|---|---|---|---|
| **Statblock** | Monster / Companion / Retainer / Summon | keywords | Level | **Organization + Role** *(colored)* | EV |
| **Ability** | Ability | class · subclass | Level | **cost** | usage |
| **Feature / Trait** | Feature / Trait | class · subclass | Level | cost *(when present)* | — |
| **Featureblock** *(terrain / malice / advancement)* | Dynamic Terrain / Malice / Advancement / Featureblock | — | Level | **type + Role** *(combined, colored)* | EV |
| **Fixture** | Fixture | class · subclass *(e.g. Summoner · Fire)* | Level | type + Role | EV |

### Notes per card

- **Statblock.** The current keyword/provenance line (`sb__kw`, today *above* the name) moves to `left-deck` *below* the name; the eyebrow becomes the kind-noun. `right-primary` already combines `organization + " " + role`, colored by role (`roleKey`) — unchanged in content, just relabeled as the right mini-title. Summoner-book summons often have **no Level** (`right-eyebrow` empty) and carry a resource **cost in the EV slot** (`right-deck`) — the optional-slot rule covers this. The existing `summonerProvenanceEyebrow` override (SCC-derived provenance for summoner statblocks) feeds `left-deck`.

- **Ability.** Today's eyebrow-as-action-label is dropped. **Usage** (Main Action / Maneuver / Triggered) becomes a small scannable chip in `right-deck` — not the headline — because usage already reappears below the header in ledger style, and a top-right usage chip is a good quick-filter affordance. **Cost** (Signature / "1 pt" / "3 Essence") is the `right-primary` mini-title. The card's color-keyed crest + left border (by usage type) still carry usage's visual identity, so demoting usage to a small chip loses nothing. Abilities with **no cost at all** leave `right-primary` empty (gap) — see Decisions.

- **Feature / Trait.** Mostly no category, so `right-primary` carries the cost (ancestry "1 Point", "11 Piety") when present, else empty. This *upgrades* today's behavior, which shows cost **or** level; the 6-slot model shows **both** (Level in `right-eyebrow`, cost in `right-primary`).

- **Featureblock family.** Featureblocks are "statblock-like in anatomy" (collection cards: identity header + loose-stat grid + sub-feature list), so they map almost 1:1 onto the statblock. The book treats a terrain's **type + role together** the way statblocks treat organization + role, so they combine into the single `right-primary` mini-title ("Trap Hazard"), colored by role (`fbDataRole`). Only **EV** is promoted into `right-deck`; the **rest of the loose stats** (Stamina per square, etc.) stay in the body `fb__stats` grid — exactly as a statblock keeps Size/Speed/Stamina in its defenses row and promotes only EV. Malice / advancement blocks fill the same skeleton, just sparser (often empty right column).

- **Fixture.** A featureblock variant. Its `left-deck` carries provenance like any other card: the summoner **circle/element** as `class · subclass` → **"Summoner · Fire"**.

## Sub-features (nested inside statblocks/featureblocks)

The features *inside* a statblock or featureblock get a **second tier** of header. Their kind, provenance, and level are all implied by the parent card, so those lanes are dead. Only **name + cost + usage** survive:

| Slot | Carries |
|---|---|
| `left-eyebrow` | — *(kind implied by parent)* |
| `left-primary` | name |
| `left-deck` | — *(provenance implied by parent)* |
| `right-eyebrow` | — *(no per-feature level)* |
| `right-primary` | cost |
| `right-deck` | usage |

Passive traits with neither cost nor usage collapse to just the name. **Featureblock sub-features use this identical pattern.**

### Flat-list Feature Style

When the **Feature Style** preference is "Flat list" (`data-sb-featstyle` / `data-fb-featstyle` = `flat`), there is no room for a stack/rail. The header collapses: the right rail is **inlined onto the name's line**, and all stack structure is dropped:

```
Card style:                          Flat-list style:
┌─────────────────────────┐
│ Cleave        Signature  │          Cleave · Signature · Main Action
│               Main Action│          <effect text follows inline…>
│ <effect text…>           │
└─────────────────────────┘
```

The same three fields (name · cost · usage) survive in both styles — they relocate from a right rail to an inline `name · cost · usage` run. Nothing is lost; that is the entire point of the exception.

## Preview / index cards

`.sc-prev` (ability/feature/trait previews) and `.sb-prev` (statblock previews) on index and group-landing pages **reuse their type's full header fill map verbatim.** Only the *body* below the header stays preview-specific (compact flavor + foot markers like "Grants…", "N options", distance·target). A preview and its full card cannot drift because they consume the same header.

## Mobile degradation

When width is tight, the busy slots — `left-deck` ("Summoner · Fire", "Shadow · College of Black Ash") and the right `--mini-title` — **wrap to a second line** rather than truncate. Nothing is hidden. Trade-off accepted: mobile card heights become uneven and the tidy 3-row rhythm breaks on the narrowest screens.

## Extrapolating to a new (or forgotten) card type

This spec enumerates the known entity cards, but the model is meant to generalize. To map **any** card type, fill the six slots by asking:

1. `left-eyebrow` — what is this, as a kind-noun? Specialize it so "‹name› is a ‹eyebrow›" reads true.
2. `left-primary` — the name.
3. `left-deck` — its provenance as `class · subclass`. Empty if it has none, or if the context already implies it (e.g. a nested sub-feature).
4. `right-eyebrow` — its progression position (Level / Echelon), else empty.
5. `right-primary` — its single most important attribute, as the mini-title: a stat-bearing card's colored **category**, or a resource-bought card's **cost**. (If a card has both a category and a cost, decide which is the true headline — for abilities we chose cost and demoted the category/usage to `right-deck`.)
6. `right-deck` — a secondary attribute (cost / usage / EV / value), else empty.

Then apply the invariants:

- Lanes carry the same *role* of information they do everywhere else.
- Render line-vs-chip by the defaults (right `primary` = mini-title; right `eyebrow`/`deck` = chips) unless there's reason to override.
- Provenance is `class · subclass`.
- Nested sub-features drop kind/provenance/level → name + cost + usage; flat-list inlines them.
- Empty slots leave gaps.

## Implementation approach

**One shared header component, consumed by every card type.** This is the key architectural move: today each card owns its header (`sc-ability__eyebrow`, `sc-trait__eyebrow`, `sb__head`, `fb__head`, the `sc-prev__*` previews), which is precisely why they drifted. A single renderer + a single CSS contract makes consistency *structural* rather than a matter of remembering.

- **Go:** a new shared header builder (e.g. `internal/site/card_head.go`) exposing something like `renderCardHead(slots)` over a small `cardHeadSlots` struct (six optional fields + per-slot line/chip flags). Each existing renderer builds its slot struct from frontmatter/parsed data and calls it:
  - `ability_cards.go` (`renderAbilityCard`)
  - `trait_cards.go` (`wrapTraitSection` / `traitEyebrow*`)
  - `statblock_card.go` (`renderStatblockHead`)
  - `featureblock_page.go` (`fbEyebrow`, `renderFeatureblockCard`)
  - `feature_index.go` (`renderAbilityPrev`, `renderTraitPrev`)
  - `statblock_preview.go`
- **CSS:** a shared header block (a new `steel-cardhead.css`, or folded into `steel-redesign.css`) defining `.sc-head` and the six slot classes + the `--line`/`--chip`/`--mini-title` modifiers and the mobile wrap. The per-card sheets keep only their color/spine specifics and reference the shared header classes. Respect `extra_css` load order (DESIGN.md §Token vocabulary).
- **Settings:** reuse the existing `data-sb-featstyle` / `data-fb-featstyle` (`card` / `flat`) attributes for the flat-list collapse; no new preference is required.

The work is large enough to stage (one card type at a time, statblock first since it already embodies the model), validated against the Go renderer golden tests (`*_golden.html`, `*_test.go`).

## Out of scope

- Navigational **category index cards** (`cards.go` `.sc-card`) and **book/chapter cards** (`cards_book.go`) — these are folder tiles, not entity cards, and do not take the 6-slot header.
- Body content below the header (power-roll panels, defense rows, loose-stat grids, foot markers) — unchanged except where a field migrates *into* the header (e.g. statblock keywords).

## Decisions (resolved during design)

- **Identity vs. attributes**, with the line drawn at *intrinsic kind* vs. *instance properties*: only the kind-noun is intrinsic (eyebrow); class, subclass, level, cost, role are all properties (deck / rail). Class and subclass are **not** special — they're properties exactly like level, which is why provenance lives in a deck/rail slot, not the eyebrow.
- **Slot names are positional** (`left/right` × `eyebrow/primary/deck`), not purpose-named ("origin/tier/role/cost"), so a slot's name never constrains or misrepresents its contents.
- **No-cost abilities leave `right-primary` empty** (a gap) rather than promoting usage — "see how it looks" first.
- **Mobile wraps, never truncates.**

## Open / deferred

- Whether `left-eyebrow` should ever specialize further for abilities (e.g. "Signature Ability", "Villain Action") — left as plain "Ability" for now; the specialization mechanism exists if wanted.
- Exact `--mini-title` typography/sizing and chip styling — an implementation-time look-and-feel pass.
- Likely a card type or two not enumerated here; the **Extrapolating** section is the contract for handling them.
