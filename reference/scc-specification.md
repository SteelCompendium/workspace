# Steel Compendium Classification (SCC) Specification

**Version:** 1.1
**Date:** 2026-06-09
**Status:** Frozen code-set; scheme additively extended (scheme version + format negotiation)

## 1. Introduction

The Steel Compendium Classification (SCC) is a permanent, immutable identifier scheme for all content in the Steel Compendium. Every piece of game content -- abilities, classes, kits, conditions, monsters, and more -- receives exactly one canonical SCC code. These codes serve as:

- **Permanent URLs** for the Steel Compendium website
- **Cross-reference identifiers** within and across documents
- **API keys** for structured data access
- **Translation links** connecting equivalent content across locales

Once assigned and frozen, an SCC code never changes. External tools, bookmarks, and integrations can rely on SCC codes as stable references.

## 2. Format

An SCC code has three components separated by `/`:

```
{source}/{type}/{item}
```

| Component | Description | Character Set |
|-----------|-------------|---------------|
| **source** | Publisher, book, and version | `a-z`, `0-9`, `.` |
| **type** | Content classification | `a-z`, `0-9`, `.`, `-` |
| **item** | Unique identifier within type | `a-z`, `0-9`, `-` |

All components are lowercase. No spaces, underscores, or uppercase characters.

### 2.0 Scheme Version

An SCC code MAY carry an explicit **scheme version** prefix identifying the grammar it was
minted under. The prefix swaps in wherever the `scc` namespace token already appears:

```
Link / URN / DSL:   scc.v1:mcdm.heroes.v1/class/fury
Website URL:        steelcompendium.io/scc.v1/mcdm.heroes.v1/class/fury
Bare (implicit v1): scc:mcdm.heroes.v1/class/fury        ≡  scc.v1:…
```

The canonical form is explicit (`scc.v1`). The **bare `scc:` form is a permanent implicit-v1
alias** — `scc:X` ≡ `scc.v1:X` — so every existing code, link, URL, and bookmark remains valid.

A scheme-version bump (`scc.v2`, …) is reserved for **breaking grammar changes only** — a
delimiter's meaning changing, incompatible type-nesting rules, a change to the `source` format, or
a wholesale re-mint. Additive taxonomy work (new types, new nesting) stays within the current scheme
version under the existing freeze + alias rules and does **not** bump it. When a new scheme version
appears, the prior version's code-set is untouched and continues to resolve; the two coexist.

**Three distinct "versions" — do not conflate:**

| Name | Token | Versions | Bumps when |
|---|---|---|---|
| Book edition | `v1` inside `mcdm.heroes.v1` | the *content* edition | publisher reprints with changes |
| Registry-file schema | `version` in `classification.json` | the registry file's JSON shape | the registry file format changes |
| SCC scheme version | `scc.v1` prefix | the *grammar* for building codes | a breaking grammar change / re-mint |

The scheme prefix (`scc.v1`) and the book edition (`…heroes.v1`) never collide: one is the leading
prefix, the other lives inside the `source` component.

### 2.1 Source Component

The source identifies the publisher, book, and edition:

```
{publisher}.{book}.{version}
```

| Field | Description | Example |
|-------|-------------|---------|
| `publisher` | Organization identifier | `mcdm` |
| `book` | Book identifier | `heroes` |
| `version` | Edition version | `v1` |

#### Registered Sources

| Source | Description |
|--------|-------------|
| `mcdm.heroes.v1` | Draw Steel Heroes, 1st release |
| `mcdm.monsters.v1` | Draw Steel Monsters, 1st release |
| `community.{publisher}.{book}` | Third-party / homebrew content (reserved) |

### 2.2 Type Component

The type classifies what the content IS. Uses `.` to express sub-types.

Simple types are a single word:

```
class
ancestry
kit
condition
```

Compound types use `.` to add specificity:

```
feature.ability.fury.level-1
feature.trait.shadow.level-3.brawler
monster.ogres
```

#### Type Taxonomy

| Type Pattern | Description | Example SCC |
|---|---|---|
| `chapter` | Book chapters | `mcdm.heroes.v1/chapter/introduction` |
| `class` | Class overviews | `mcdm.heroes.v1/class/fury` |
| `feature.ability.{class}.level-{N}` | Class abilities at a level | `mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam` |
| `feature.ability.{kit}` | Kit signature abilities | `mcdm.heroes.v1/feature.ability.panther/panther-strike` |
| `feature.ability.common` | Common abilities (maneuvers, free strikes) | `mcdm.heroes.v1/feature.ability.common/grab` |
| `feature.trait.{class}.level-{N}` | Class traits at a level | `mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity` |
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
| `project` | Downtime projects | `mcdm.heroes.v1/project/build-airship` |
| `god` | Deities | `mcdm.heroes.v1/god/cavall` |
| `monster` | Monster entries (no category) | `mcdm.monsters.v1/monster/chimera` |
| `monster.{category}` | Monsters by category | `mcdm.monsters.v1/monster.ogres/ogre-warrior` |
| `dynamic-terrain` | Dynamic terrain features | `mcdm.monsters.v1/dynamic-terrain/lava-pool` |
| `retainer` | Retainer NPCs | `mcdm.monsters.v1/retainer/squire` |

### 2.3 Item Component

The item is a slugified identifier for the specific piece of content. Rules:

- Derived from the content's heading text (or explicit `@id` annotation)
- Lowercase, hyphen-separated words
- Cost suffixes stripped before slugifying (e.g., "Brutal Slam (3 Ferocity)" becomes `brutal-slam`)
- Must be unique within its source + type combination

### 2.4 Full Examples

```
mcdm.heroes.v1/chapter/introduction
mcdm.heroes.v1/class/fury
mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam
mcdm.heroes.v1/feature.ability.fury.level-1/gouge
mcdm.heroes.v1/feature.ability.panther/panther-strike
mcdm.heroes.v1/feature.ability.common/grab
mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity
mcdm.heroes.v1/feature.trait.fury.level-1.boren/kit-bonuses
mcdm.heroes.v1/ancestry/dwarf
mcdm.heroes.v1/kit/panther
mcdm.heroes.v1/perk/alert
mcdm.heroes.v1/career/artisan
mcdm.heroes.v1/condition/dazed
mcdm.heroes.v1/title/dragon-knight
mcdm.heroes.v1/treasure/healing-potion
mcdm.monsters.v1/monster/chimera
mcdm.monsters.v1/monster.ogres/ogre-warrior
```

## 3. URL Mapping

SCC codes map directly to website URLs:

```
https://steelcompendium.io/{scc-code}
```

The `/` separators in SCC codes are preserved as URL path separators. The `.` within components is preserved as-is in the URL.

| SCC Code | URL |
|----------|-----|
| `mcdm.heroes.v1/class/fury` | `steelcompendium.io/mcdm.heroes.v1/class/fury` |
| `mcdm.heroes.v1/feature.ability.fury.level-1/gouge` | `steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge` |

### 3.1 Locale-Prefixed URLs

Translated content adds a locale prefix. English (the default) has no prefix:

```
steelcompendium.io/mcdm.heroes.v1/class/fury              (English)
steelcompendium.io/es/mcdm.heroes.v1/class/fury            (Spanish)
steelcompendium.io/pt-br/mcdm.heroes.v1/class/fury         (Brazilian Portuguese)
```

The SCC code itself is locale-independent. The same SCC identifies the same content across all translations.

### 3.2 SCC Protocol Links

Within markdown content, cross-references use the `scc:` protocol:

```markdown
See [Gouge](scc:mcdm.heroes.v1/feature.ability.fury.level-1/gouge) for details.
```

The `steel-etl` linked output variant resolves `scc:` links to relative file paths. The website resolves them to full URLs.

## 4. Allocation Rules

### 4.1 One Canonical SCC Per Item

Every content item gets exactly one canonical SCC code. There is no multi-classification. An ability belongs to one class at one level -- that is its SCC.

Navigation views (e.g., "Browse by class", "Read in book order") are separate output artifacts, not additional SCC codes.

### 4.2 Automatic Derivation

The `steel-etl` tool automatically derives SCC codes from annotated markdown:

1. **Source** comes from document frontmatter (`book` field)
2. **Type** is built from the annotation context stack (e.g., class + level + ability)
3. **Item** is the `@id` annotation value, or the slugified heading text

### 4.3 Annotation Overrides

The auto-derived SCC can be overridden or supplemented via annotations:

| Annotation | Effect |
|---|---|
| `@scc` | Replace the auto-derived canonical SCC entirely |
| `@scc-alias` | Add a lookup alias that resolves to the canonical SCC |

```markdown
<!--
@type: ability
@scc: mcdm.heroes.v1/feature.ability.fury.level-1/reactive-strike
@scc-alias: mcdm.heroes.v1/feature.ability.common/reactive-strike
-->
#### Reactive Strike
```

### 4.4 Third-Party Allocation (Reserved)

Third-party content uses the `community` publisher prefix:

```
community.{publisher-id}.{book-id}/{type}/{item}
```

Publisher IDs are assigned through a registration process. Third-party content follows the same annotated markdown format and is validated against the same JSON schemas.

## 5. Versioning

| Scenario | Approach | SCC Impact |
|----------|----------|------------|
| Errata / patch | Content updated in place | Same SCCs. URLs don't change. |
| New edition | New source version | New SCCs: `mcdm.heroes.v2/...`. Old `v1` codes remain. |
| New book | New source | New SCCs: `mcdm.{book}.v1/...` |
| Homebrew | Publisher source | New SCCs: `community.{pub}.{book}/...` |

Errata updates are the most common case. The SCC stays the same; only the content behind it changes. This means bookmarks, links, and API references continue to work.

New editions create entirely new SCC codes. The old version's codes remain valid and continue to resolve. This allows both editions to coexist.

## 6. Registry

The classification registry (`classification.json`) is the authoritative list of all assigned SCC codes:

```json
{
  "version": 1,
  "scheme_version": 1,
  "frozen": true,
  "codes": [
    "mcdm.heroes.v1/ancestry/devil",
    "mcdm.heroes.v1/ancestry/dwarf",
    "mcdm.heroes.v1/class/fury",
    "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam"
  ],
  "aliases": {
    "mcdm.heroes.v1/feature.ability.common/reactive-strike": "mcdm.heroes.v1/feature.ability.fury.level-1/reactive-strike"
  }
}
```

### 6.1 Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | integer | Schema version (currently `1`) |
| `scheme_version` | integer | The SCC scheme (grammar) version these codes were minted under. Absent ⇒ `1`. |
| `frozen` | boolean | When `true`, existing codes cannot be removed or changed |
| `codes` | string[] | Sorted array of all canonical SCC codes |
| `aliases` | object | Map of alias SCC to canonical SCC (for redirects/lookups) |

### 6.2 Freeze Rules

When `frozen: true`:

- **Existing codes cannot be removed.** A build that would remove a frozen code fails.
- **Existing codes cannot change.** Reclassifying an item to a different SCC fails.
- **New codes can be appended.** New content gets new SCCs added to the registry.
- **Aliases can be added or updated.** Aliases are not subject to the freeze constraint.

The `steel-etl` tool enforces these rules at build time. The `validate --scc-stable` command checks freeze compliance without generating output.

### 6.3 Resolution

To resolve an SCC code:

1. Look up in `codes` -- if found, it is a canonical SCC
2. Look up in `aliases` -- if found, follow to the canonical SCC
3. If neither, the code is unknown

The `scc-to-path.json` output file provides a mapping from canonical SCC codes to file paths for URL generation:

```json
[
  {
    "scc": "mcdm.heroes.v1/class/fury",
    "path": "class/fury.md",
    "name": "Fury",
    "type": "class"
  }
]
```

## 7. Design Principles

### 7.1 Semantic Classification

SCC classifies what content IS, not where a book puts it. A Fury ability is classified as `feature.ability.fury.level-1/gouge` regardless of which chapter or section of the book describes it. Book-order navigation is a separate view over the data.

### 7.2 Singular Type Names

All type names are singular: `class`, `chapter`, `condition`, not `classes`, `chapters`, `conditions`. The type describes what the item is, not a collection.

### 7.3 Flat Categories

Perks, titles, treasures, and cultures use flat types (e.g., `perk/alert`, not `perk.crafting/alert`). Category, echelon, and sub-type information is metadata in frontmatter, available for filtering, but not part of the permanent URL. This keeps URLs stable if categories are reorganized.

### 7.4 Context in the Type Path

Class features encode their context (class name, level, optionally kit) in the type path rather than the item slug. This prevents name collisions (e.g., multiple classes having a "Perk" feature at different levels) and produces descriptive, self-documenting URLs.

### 7.5 Immutability

Once frozen, SCC codes are permanent contracts with the outside world. The scheme was designed, reviewed, and frozen before any external consumer depended on it. The tooling enforces immutability at build time.

## 8. Format Negotiation

An entity exists in multiple representations (`markdown`, `json`, `yaml`, `dse-markdown`). **Format
is never part of an SCC's identity** — every representation denotes the same entity. Format is
selected at fetch time, and an SCC used as a cache key is keyed on the bare identity, with
representations stored as `(identity, format)` variants under that one key.

### 8.1 Over HTTP

The canonical mechanism is the **`Accept` header** (`Accept: application/json`). A **`?format=json`
query parameter** is a convenience for browser/curl users; it lives in the URL query, never in the
path. There is **no file-extension form** (`…/fury.json` is not valid) — it reads as a filename and
would pollute identity.

### 8.2 Reserved reference qualifier (`#format`) — not yet implemented

For non-HTTP contexts (human dialogue, rule-logic DSLs, an SDK that inlines fetched content), a
reference MAY optionally carry a format qualifier using a `#` fragment:

```
scc.v1:mcdm.heroes.v1/class/fury#json
```

The `#…` is a URI-fragment-style view selector. **It is reserved, not yet implemented.** Tooling
that encounters it MUST normalize it away — strip from `#` onward to recover the canonical identity —
so `…/fury#json`, `…/fury#yaml`, and `…/fury` are the same cache key. The `/`, `.`, and `:`
delimiters are claimed by path / scheme-prefix / URN-separator respectively; `#` is the one
punctuation the grammar promises never to claim for identity.
