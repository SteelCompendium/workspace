# SCC Type Taxonomy (Redesigned)

**Date:** 2026-04-12
**Updated:** 2026-04-13
**Status:** Implemented in steel-etl Phase 1 -- needs review before freezing

## Principles

1. **One canonical SCC per item.** No multi-classification. Book-order navigation is a separate output artifact, not a classification.
2. **Semantic taxonomy.** SCC classifies what something IS, not where the book puts it. Level, echelon, category are metadata in frontmatter, not part of the SCC.
3. **String-form only.** No decimal codes. The classification registry is a set of known string-form SCCs for freeze enforcement.
4. **Annotation overrides.** `@scc` in annotations can override auto-derived classification. `@scc-alias` adds redirect/lookup aliases.
5. **Immutable once frozen.** After freeze, new items can be added but existing SCCs never change. `steel-etl` enforces this at build time.

## SCC Format

```
{source}/{type}/{item}
```

- **Source:** Publisher, book, version. Dotted string. Example: `mcdm.heroes.v1`
- **Type:** What kind of content. Dotted for sub-types. Example: `feature.ability.fury.level-1`
- **Item:** Slug identifier. Example: `brutal-slam`
- **Separator:** `/` between components (`:` in the legacy string-form; `/` in URLs and the new canonical form)

### Separator Decision

The canonical SCC form uses `/` everywhere (URLs, references, registry). The legacy `:` form (`mcdm.heroes.v1:abilities.fury:brutal-slam`) is recognized but normalized to `/` on input. Note that legacy type names (e.g., `abilities.fury`) are also remapped to the new format (`feature.ability.fury.level-1`) during normalization.

## Source Component

| Source | Description |
|--------|-------------|
| `mcdm.heroes.v1` | Draw Steel Heroes, 1st release |
| `mcdm.monsters.v1` | Draw Steel Monsters, 1st release |
| `community.{publisher}.{book}` | Third-party / homebrew content (future) |

### Versioning

| Scenario | Approach |
|----------|----------|
| Errata/patch | Same SCCs. Content updated in place. URLs don't change. |
| New edition | New source: `mcdm.heroes.v2`. Old `v1` URLs remain. |
| New book | New source: `mcdm.{book-name}.v1` |

## Type Component

The type component classifies what the content IS. Uses `.` for sub-types within a component.

### Heroes Book Types

| SCC Type | Description | Example SCC |
|---|---|---|
| `chapter` | Top-level book chapters | `mcdm.heroes.v1/chapter/introduction` |
| `class` | Class overviews | `mcdm.heroes.v1/class/fury` |
| `feature.ability.{class}.level-{N}` | Abilities belonging to a class at a level | `mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam` |
| `feature.ability.{kit}` | Kit signature abilities | `mcdm.heroes.v1/feature.ability.panther/panther-strike` |
| `feature.ability.common` | Common abilities (maneuvers, free strikes) | `mcdm.heroes.v1/feature.ability.common/grab` |
| `feature.trait.{class}.level-{N}` | Non-ability class features (traits) at a level | `mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity` |
| `feature.trait.{class}.level-{N}.{kit}` | Kit-specific traits | `mcdm.heroes.v1/feature.trait.fury.level-1.boren/kit-bonuses` |
| `ancestry` | Ancestries | `mcdm.heroes.v1/ancestry/dwarf` |
| `kit` | Equipment kits | `mcdm.heroes.v1/kit/panther` |
| `perk` | Character perks | `mcdm.heroes.v1/perk/alert` |
| `career` | Careers | `mcdm.heroes.v1/career/artisan` |
| `culture` | Culture benefits | `mcdm.heroes.v1/culture/nomadic` |
| `condition` | Status conditions | `mcdm.heroes.v1/condition/dazed` |
| `skill` | Skills | `mcdm.heroes.v1/skill/athletics` |
| `complication` | Character complications | `mcdm.heroes.v1/complication/amnesia` |
| `title` | Reward titles | `mcdm.heroes.v1/title/dragon-knight` |
| `treasure` | Reward treasures | `mcdm.heroes.v1/treasure/healing-potion` |
| `movement` | Movement rules | `mcdm.heroes.v1/movement/forced-movement` |
| `negotiation` | Negotiation rules | `mcdm.heroes.v1/negotiation/interest` |

### Monsters Book Types

| SCC Type | Description | Example SCC |
|---|---|---|
| `chapter` | Top-level book chapters | `mcdm.monsters.v1/chapter/introduction` |
| `monster` | Monster entries | `mcdm.monsters.v1/monster/chimera` |
| `monster.{category}` | Monsters by category | `mcdm.monsters.v1/monster.ogres/ogre-warrior` |
| `dynamic-terrain` | Dynamic terrain features | `mcdm.monsters.v1/dynamic-terrain/lava-pool` |
| `retainer` | Retainer NPCs | `mcdm.monsters.v1/retainer/squire` |

## Classification Rules

The SCC classifier auto-derives a canonical SCC from the annotation context stack. One SCC per item.

The type path is built from context: `feature` types incorporate class, level, and kit context from the annotation stack. Level uses the `level-{N}` format (e.g., `level-1`, `level-3`) for readability. Cost suffixes like `(3 Ferocity)` are stripped from headings before slugifying.

| Section @type | Parent context | SCC Type | SCC Item |
|---|---|---|---|
| `chapter` | (root) | `chapter` | `@id` or slugified heading |
| `class` | (any) | `class` | `@id` or slugified heading |
| `ability` | class = X, level = N | `feature.ability.{X}.level-{N}` | `@id` or slugified clean heading |
| `ability` | kit = X | `feature.ability.{X}` | `@id` or slugified clean heading |
| `ability` | (common context) | `feature.ability.common` | `@id` or slugified clean heading |
| `feature` | class = X, level = N | `feature.trait.{X}.level-{N}` | `@id` or slugified heading |
| `feature` | class = X, level = N, kit = K | `feature.trait.{X}.level-{N}.{K}` | `@id` or slugified heading |
| `ancestry` | (any) | `ancestry` | `@id` or slugified heading |
| `kit` | (any) | `kit` | `@id` or slugified heading |
| `perk` | (any) | `perk` | `@id` or slugified heading |
| `career` | (any) | `career` | `@id` or slugified heading |
| `culture` | (any) | `culture` | `@id` or slugified heading |
| `condition` | (any) | `condition` | `@id` or slugified heading |
| `skill` | (any) | `skill` | `@id` or slugified heading |
| `complication` | (any) | `complication` | `@id` or slugified heading |
| `title` | (any) | `title` | `@id` or slugified heading |
| `treasure` | (any) | `treasure` | `@id` or slugified heading |
| `monster` | category = X | `monster.{X}` | `@id` or slugified heading |
| `monster` | (no category) | `monster` | `@id` or slugified heading |
| `statblock` | (any) | *(not classified)* | part of parent monster |
| `dynamic-terrain` | (any) | `dynamic-terrain` | `@id` or slugified heading |
| `retainer` | (any) | `retainer` | `@id` or slugified heading |
| `movement` | (any) | `movement` | `@id` or slugified heading |
| `negotiation` | (any) | `negotiation` | `@id` or slugified heading |
| `feature-group` | (any) | *(not classified)* | container only, provides level context to children |

### Annotation Overrides

The auto-derived SCC can be overridden or supplemented via annotations:

| Annotation | Effect |
|---|---|
| `@scc` | Replace the auto-derived canonical SCC entirely |
| `@scc-alias` | Add an additional lookup alias (for redirects, cross-references) |

Example:
```markdown
<!--
@type: ability
@scc: mcdm.heroes.v1/feature.ability.fury.level-1/reactive-strike
@scc-alias: mcdm.heroes.v1/feature.ability.common/reactive-strike
-->
#### Reactive Strike
```

The canonical SCC is what appears in URLs and `scc-to-path.json`. Aliases resolve to the canonical SCC's URL (redirect).

### End Markers

Section boundaries are normally inferred from the next annotation or heading. For edge cases, an explicit end marker closes a section:

```markdown
<!-- @end: brutal-slam -->
```

The id after `@end:` must match the section's `@id` (explicit or auto-derived slug). The parser verifies the match at build time. End markers are rare — most sections don't need them.

## Classification Registry

The registry (`classification.json`) is a flat set of known SCCs:

```json
{
  "version": 1,
  "frozen": false,
  "codes": [
    "mcdm.heroes.v1/chapter/introduction",
    "mcdm.heroes.v1/class/fury",
    "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam",
    "mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity",
    "..."
  ],
  "aliases": {
    "mcdm.heroes.v1/feature.ability.common/reactive-strike": "mcdm.heroes.v1/feature.ability.fury.level-1/reactive-strike"
  }
}
```

When `frozen: true`, the `steel-etl` build fails if:
- An existing code in `codes` would be removed
- An existing code would change (e.g., reclassified)

New codes CAN be appended. Aliases CAN be added or updated.

## Sample URLs

```
steelcompendium.io/mcdm.heroes.v1/chapter/introduction
steelcompendium.io/mcdm.heroes.v1/class/fury
steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam
steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge
steelcompendium.io/mcdm.heroes.v1/feature.ability.panther/panther-strike
steelcompendium.io/mcdm.heroes.v1/feature.ability.common/grab
steelcompendium.io/mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity
steelcompendium.io/mcdm.heroes.v1/feature.trait.fury.level-1.boren/kit-bonuses
steelcompendium.io/mcdm.heroes.v1/ancestry/dwarf
steelcompendium.io/mcdm.heroes.v1/kit/panther
steelcompendium.io/mcdm.heroes.v1/perk/alert
steelcompendium.io/mcdm.heroes.v1/career/artisan
steelcompendium.io/mcdm.heroes.v1/condition/dazed
steelcompendium.io/mcdm.heroes.v1/title/dragon-knight
steelcompendium.io/mcdm.heroes.v1/treasure/healing-potion
steelcompendium.io/mcdm.monsters.v1/monster/chimera
steelcompendium.io/mcdm.monsters.v1/monster.ogres/ogre-warrior

# Locale-prefixed
steelcompendium.io/es/mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam
```

## Design Decisions

### 1. No decimal codes

Decimal codes added complexity, were insertion-order-dependent, and regenerated on any input change. No consumer used them. String-form SCC is the only identifier.

### 2. Single canonical SCC per item

Multi-classification creates confusion ("is `feature.ability.fury.level-1/gouge` the same as `feature.ability.fury/gouge`?"). Every consumer would need to deduplicate. Instead, each item gets one canonical SCC. Book-order navigation is a separate output artifact (`nav-order.json`), not a classification axis.

### 3. Semantic taxonomy, not book-order

SCC classifies what something IS (an ability, a feature, a kit), not where the book puts it. This produces clean, meaningful URLs and lets the taxonomy survive book reorganizations. The book-order reading experience is generated as a navigation view.

### 4. Flat types for categories that are really metadata

Perks, titles, treasures, and cultures are flat (not sub-typed by category/echelon/treasure-type). These dimensions are metadata in frontmatter, available for filtering and display, but don't belong in the permanent URL.

### 5. Unified feature namespace with ability/trait distinction

All class features live under `feature.*`, split into `feature.ability` and `feature.trait` sub-types. This aligns with the data-sdk-npm model where `Feature` has a `feature_type` of `"ability"` or `"trait"`. Abilities have structured fields (keywords, usage, distance, target, power roll tiers). Traits are open-ended (plain text, choices, sub-traits, or nested abilities).

### 6. Level context in the type path

Level is encoded in the type path as `level-{N}` (e.g., `feature.ability.fury.level-1/gouge`) rather than in the item ID. This prevents same-name collisions (e.g., "Perk" at levels 1, 2, and 3) without polluting the item slug. The `level-{N}` format is preferred over bare `{N}` or `{N}th-level` for readability and consistent sorting.

### 7. Kit context in the type path

Kit-specific features (e.g., Stormwight kit bonuses under Fury) include the kit ID in the type path: `feature.trait.fury.level-1.boren/kit-bonuses`. This avoids collisions when multiple kits at the same level have identically-named features.

### 8. Singular type names

All type names are singular (`class`, `chapter`, `condition`) not plural (`classes`, `chapters`, `conditions`). The type classifies what the item IS, not a collection.

## Migration Mapping

| Old `type` (data-rules-md) | New SCC Type |
|---|---|
| `chapter` | `chapter` |
| `class` | `class` |
| `class/{class}/level` | *(removed -- levels are context in type path)* |
| `feature/ability/{class}/{N}th-level-feature` | `feature.ability.{class}.level-{N}` |
| `feature/trait/{class}/{N}th-level-feature` | `feature.trait.{class}.level-{N}` |
| `feature/trait/{class}/{N}th-level-feature/{kit}` | `feature.trait.{class}.level-{N}.{kit}` |
| `common-ability/*` | `feature.ability.common` |
| `kit-ability/{kit}` | `feature.ability.{kit}` |
| `kit` | `kit` |
| `ancestry` | `ancestry` |
| `perk/*` | `perk` |
| `career` | `career` |
| `culture_benefit/*` | `culture` |
| `condition` | `condition` |
| `skill` | `skill` |
| `complication` | `complication` |
| `title/*` | `title` |
| `treasure/*` | `treasure` |
| `movement` | `movement` |
| `motivation_or_pitfall` | *(dropped or reclassified)* |
| `reference_table/*` | *(index file, not classified)* |
| `index` | *(index file, not classified)* |
