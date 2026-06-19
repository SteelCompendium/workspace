# Level-grouping annotation standardization — design

**Date:** 2026-06-18
**Status:** Design (approved direction; spec under review)
**Scope:** book sources (`steel-etl/input/{summoner,beastheart}`), `steel-etl` `validate`
command. Cross-book SCC-convention contract → workspace-level spec.

## Problem

The same structural concept — the **"Nth-Level Features" section header** that groups a
class's features for a given level — is annotated three different ways across books:

| Book | "Nth-Level Features" header | Result |
|---|---|---|
| **Heroes** | `@type: feature-group` (107 uses) | Structural — **no page, no SCC code**; pushes `level-N` context to children |
| **Summoner** | `@type: feature \| @id: Nth-level-features` | A real **feature with its own page + SCC code** |
| **Beastheart** | *bare heading* (no annotation) | Structural; children inherit `level-N` from their own `@level` |

Heroes' `feature-group` is the intended model: `FeatureGroupParser` produces **no standalone
output**, only pushing `level`/group context down to the real features beneath it. Summoner
instead mints ~10 phantom "feature" pages (`feature.summoner.level-2/2nd-level-features`, …)
that represent nothing a character "has" — they are section headers. This phantom feature
layer is also the main source of the apparent "features are HIGHLY nested" smell: it wraps
every real level-2 feature inside a spurious outer feature.

This was surfaced while fixing a rendering bug where summoner fixture **featureblocks** (e.g.
"The Boil") rendered as generic Feature niches inside the `2nd-Level Features` card — see
[`2026-06-16-inline-item-cards-design.md`](2026-06-16-inline-item-cards-design.md) →
"Composition with the trait-card transform". That rendering fix is **complementary and
stays** (see "Interaction" below); this spec fixes the underlying data inconsistency.

## Canonical convention (set by Heroes — adopt everywhere)

Heroes already establishes the exact two-tier pattern we need; we converge all books on it:

| Header kind | `@type` | Behavior |
|---|---|---|
| Pure level grouping — **"Nth-Level Features"** | `feature-group` | Structural; no page/SCC code; pushes `level-N` to children. No `@id`. |
| Referenceable sub-grant container with a lookup table — **"Nth-Level Domain/Circle Feature"** | `feature` | Real addressable page; carries its table + nests its sub-features. |

Heroes' own `1st-Level Domain Feature` (`@type: feature`, holds a domain→feature table,
nested *inside* the `1st-Level Features` `feature-group`) is the precedent for the second
row. Summoner's "Circle Feature(s)" are the same shape and **stay `feature`**.

## Migration

### Summoner — the real fix (`input/summoner/Draw Steel Summoner.md`)

Convert the **plain** level groupings `@type: feature \| @id: <N>-level-features \| @level: N`
→ `@type: feature-group \| @level: N` (drop the `@id`, matching Heroes). Affected: 1st (already
bare → make explicit), 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th "Features" headers.

**Keep as `feature`** (do **not** touch): `1st-level-circle-features`,
`5th-level-circle-feature`, `8th-level-circle-feature`. The reason is **not** "they're circle
features" — it is that they are **referenceable table containers**: each carries a
circle→feature lookup table and is a link target from the Summoner Advancement table, the
Heroes "Domain Feature" shape. (The circle-vs-summoner *track* is a separate concern captured
by the `feature_source` field — see
[`2026-06-18-summoner-feature-source-design.md`](2026-06-18-summoner-feature-source-design.md).
Most circle features, e.g. Summoner's Dominion, are *plain* features under a `feature-group`,
so "is it a grouping header" and "is it circle" are orthogonal.)

**Why child codes are safe:** the `level-N` path segment comes from `@level`, not the parent's
`@id` — `feature.summoner.level-2/summoners-dominion` is already a *flat sibling* under
`level-2`, not nested under `…/2nd-level-features`. Converting the parent to `feature-group`
removes only the parent's own (unlinked) code; children are unchanged. Verified by
registry diff before shipping (see "Validation").

### Beastheart — consistency (`input/beastheart/Draw Steel Beastheart.md`)

Its "1st/2nd-Level Features" headers are bare and already output-correct (no phantom page).
Convert them to explicit `@type: feature-group \| @level: N` so all three books read the same
and the validate guard can also flag bare grouping headers. **Output-neutral** — confirmed by
registry diff (zero code changes expected).

### Heroes / Monsters

No change. Heroes is the canonical reference; Monsters has no level-feature groupings.

## Validate guard (`steel-etl validate`)

Add a warning when a section parsed as `@type: feature` has an `@id` matching the
grouping shape `^\d+(st|nd|rd|th)-level-features$` (plural "features", no "circle"/"domain"
qualifier). This catches the exact mis-annotation without false-positiving the intentional
`*-circle-feature` / `domain-feature` containers (they contain "circle"/"domain", or are
singular). Message points at the `feature-group` convention. Non-fatal (a `WARN:`), consistent
with the existing annotation-coverage warnings.

## Interaction with the shipped embed fix

The embed-deferral fix (feature/trait pages with a standalone descendant skip the inline
trait-card transform so `embedItemCards` renders them) **remains necessary and unchanged**.
After this migration, `2nd-Level Features` is a `feature-group` (no page), but **Summoner's
Dominion** — a genuine level-2 `feature` — still directly contains the Demon/Elemental/Fey/
Undead Portfolio fixtures (statblocks + featureblocks). Its leaf page (`summoners-dominion.md`)
keeps deferring to embed and renders the fixtures as proper `.fb-wrap`/`.sb-wrap` cards. So
feature→standalone nesting is real and correctly handled; only the spurious feature→feature
wrapping is removed.

## SCC / registry impact + validation

1. `steel-etl gen --all` then `steel-etl classify --diff` (or `validate --scc-stable`) must show:
   - **Removed:** only the ~10 phantom `feature.summoner.level-N/<N>-level-features` codes.
   - **Unchanged:** every child code (`…/summoners-dominion`, `…/perk`, fixture codes, etc.).
   - **Beastheart:** zero code changes.
2. The 3 circle-feature links still resolve (`validate` reports 0 unresolved `scc:` links).
3. A clean MkDocs build: 0 broken-link warnings.

The registry is rebuilt fresh on `gen --all` (`resetRegistryForRebuild`), so the removed
phantom codes self-prune; the live site + permalink stubs are built from page frontmatter,
so no stale stubs persist.

## Testing

- **Go unit (content):** a `feature-group` section under a class produces no standalone output
  and pushes `level-N` to a child feature (assert child SCC `feature.<class>.level-N/<id>`);
  a sibling `feature` retains its page. (Extend existing `feature` parser tests.)
- **Go unit (validate):** the new guard warns on a `feature` with id `2nd-level-features`, and
  does **not** warn on `5th-level-circle-feature` or a normal feature id.
- **Build assertion:** after a real `site` build, `Browse/feature/summoner/level-2/` lists
  Perk / Summoner's Dominion / New Portfolio Minion and has **no** `2nd-level-features.md`
  leaf; `summoners-dominion.md` still carries the fixture `.fb-wrap`/`.sb-wrap` cards.
- **Registry diff** as above (the authoritative safety check).

## Risks

- **A circle-feature is actually a pure grouping after all.** Mitigated: they carry a lookup
  table and are link targets — addressable units, matching Heroes' Domain Feature. Left as
  `feature`.
- **A beastheart child silently re-codes** when its bare parent becomes a `feature-group`.
  Mitigated: registry diff gate (expected zero changes); revert the beastheart edit if any
  child code moves.
- **Hidden inbound links to a plain "Nth-Level Features" code.** Mitigated: `grep` confirmed
  only the 3 circle codes are linked; `validate` unresolved-link check is the backstop.

## Out of scope

- Any rendering/CSS change (the embed + trait-card renderers are untouched).
- Restructuring `monster-group` (the fixture container) — it is already structural.
- Re-pointing or removing the circle-feature links (they stay valid).
- Heroes/Monsters source changes.
