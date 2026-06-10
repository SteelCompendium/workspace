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

An SCC code is also **future-proofed on two independent axes** so it can serve as a durable primary key for third-party caches:

- A code may carry an explicit **scheme version** (`scc.v1:…`) recording the grammar it was minted under, so the classification scheme itself can evolve without old and new codes silently colliding (§2.0).
- The same entity can be fetched in multiple **formats** (markdown, JSON, YAML, dse-markdown) without that choice ever becoming part of the code's identity (§8).

Both axes are optional and default cleanly, so the simplest form — a bare `{source}/{type}/{item}` — remains the canonical identity. See §9 for how this specification has evolved.

## 2. Format

An SCC code has three required components separated by `/`:

```
{source}/{type}/{item}
```

This bare three-part string is the **canonical identity**: the frozen, immutable form stored in the registry and used as a cache key. The full grammar also permits two **optional affixes** that wrap it — a leading scheme-version prefix and a trailing format qualifier:

```
[scc.vN:]{source}/{type}/{item}[#format]
```

Neither affix changes which entity the code identifies. The scheme-version prefix is covered in §2.0 (and, as the `scc:` protocol marker, in §3.2); the `#format` qualifier in §8. The three required components are detailed below.

| Component | Description | Character Set |
|-----------|-------------|---------------|
| **source** | Publisher, book, and version | `a-z`, `0-9`, `.` |
| **type** | Content classification | `a-z`, `0-9`, `.`, `-` |
| **item** | Unique identifier within type | `a-z`, `0-9`, `-` |

All components are lowercase. No spaces, underscores, or uppercase characters.

### 2.0 Scheme Version Prefix (optional)

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

The mapping above is the conceptual identity→URL relationship. The **live, shareable entry point** for a code is a stable redirect stub at `steelcompendium.io/scc/{code}/`, which 302-redirects to the friendly, indexable Browse page for that entity. (The friendly Browse page — organized for human navigation — is the canonical, search-indexed location; the `/scc/{code}/` redirect is the permanent address external tools and links should cite.)

Two optional refinements wrap this without changing which entity is addressed:

| Form | URL | Status |
|---|---|---|
| Bare (implicit scheme v1) | `steelcompendium.io/scc/mcdm.heroes.v1/class/fury/` | Live |
| Explicit scheme version | `steelcompendium.io/scc.v1/mcdm.heroes.v1/class/fury/` | Reserved (§9) |
| Format-negotiated | `…/scc/mcdm.heroes.v1/class/fury/?format=json` or `Accept:` header | Reserved (§8) |

The bare and explicit-scheme forms resolve to the same entity; format selection (§8) returns a different *representation* of that one entity, never a different identity.

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

A link MAY use the explicit scheme-version prefix and/or a `#format` qualifier; the resolver normalizes both:

```markdown
[Gouge](scc.v1:mcdm.heroes.v1/feature.ability.fury.level-1/gouge#json)
```

- **Scheme version.** Bare `scc:` is treated as `scc.v1:`. The resolver resolves only links whose scheme version matches the active registry's `scheme_version`. A link tagged with a *different* version (e.g. a future `scc.v2:`) is **not** resolved against the current registry — it is reported as unresolvable-in-this-build and left as plain display text, so a future-version reference can never silently bind to current content.
- **Format qualifier.** The `#format` fragment is stripped before lookup (reserved for future per-format fetch; see §8.2). `…/gouge`, `…/gouge#json`, and `…/gouge#yaml` all resolve to the same entity.

*(The prefix-normalization and `#format`-stripping behavior is implemented in `steel-etl` as of scheme v1.1; see §9.)*

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
| Scheme change | New scheme-version prefix | New grammar under `scc.v2:...`. Old `scc.v1:` codes remain and resolve. |

Errata updates are the most common case. The SCC stays the same; only the content behind it changes. This means bookmarks, links, and API references continue to work.

New editions create entirely new SCC codes. The old version's codes remain valid and continue to resolve. This allows both editions to coexist.

### 5.1 Scheme Versioning vs. Edition Versioning

The first four rows above version **content**: the `version` field *inside* the source (e.g. `heroes.v1` → `heroes.v2`) when a publisher revises a book. The last row versions the **classification grammar itself**: the `scc.vN` prefix that wraps the whole code (§2.0).

These are independent axes. A content-edition bump does not bump the scheme version, and a scheme-version bump does not re-edition any content — `mcdm.heroes.v1` content could in principle be re-expressed under an `scc.v2:` grammar. A scheme bump is reserved for breaking grammar changes only and is expected to be rare-to-never; see §2.0 for the full model and the three-versions disambiguation.

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

*Status (scheme v1.1): reserved/planned.* The pipeline today produces each representation as a
**separate build artifact** (e.g. `data/data-rules/en/md`, `…/md-linked`, plus JSON/YAML outputs),
not via live HTTP content negotiation. The `Accept` / `?format=` contract above defines the intended
interface for when a unified content endpoint is built; see §9.

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

## 9. Revision History

This section records how the **specification** has evolved and why. The *code-set* is frozen and never
changes (§7.5); this history tracks the grammar, rules, and surrounding model — not the codes themselves.
Every change to the scheme is additive and backward-compatible: prior forms keep resolving.

| Version | Date | Summary | Rationale |
|---|---|---|---|
| **1.0** | 2026-05-21 | Initial frozen specification (1,432 codes). `{source}/{type}/{item}` grammar, URL mapping, allocation rules, registry, design principles. | Establish a permanent, immutable identifier scheme — designed, reviewed, and frozen *before* any external consumer depended on it. |
| **1.1** | 2026-06-09 | Added the optional **scheme-version prefix** (`scc.vN:`, bare = implicit v1; §2.0), **format negotiation** as a non-identity axis (§8), and the registry `scheme_version` field (§6.1). No existing code changed. | Insure the *grammar* against a future breaking change or re-mint without old/new code strings colliding, and let tools request representations without polluting the identity / cache key. |

### 9.1 Detail — v1.1 (2026-06-09)

**What changed**

- New optional `scc.vN:` scheme-version prefix; bare `scc:` is a permanent implicit-v1 alias (`scc:X` ≡ `scc.v1:X`).
- New `#format` reference qualifier (reserved) and the HTTP `Accept` / `?format=` model — format is explicitly *not* part of identity.
- New `scheme_version` integer in the registry (`classification.json`), defaulting to `1`.
- The `steel-etl` resolver now recognizes and normalizes the prefix and the `#format` qualifier, and **refuses to resolve a non-current scheme version** against the current registry.

**Why**

The scheme was frozen at v1.0 on the assumption it would never need to change. But a frozen grammar with
*no version marker* is a latent trap: if a breaking change ever proved necessary — a misjudged structure,
or a wholesale re-mint — a v1 code string and a v2 code string would be **indistinguishable**, silently
corrupting any tool that had cached them. Embedding an optional, defaulted scheme version converts that
latent risk into an explicit, forward-safe axis, exactly as long-lived data formats reserve a version field
they rarely bump. Separately, downstream tools needed a way to request alternate representations
(JSON / YAML / dse-markdown) without the format leaking into the identity and fragmenting their caches.

**Design & implementation record**

- Design spec: `steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md`
- Implementation plan: `steel-etl/docs/superpowers/plans/2026-06-09-scc-scheme-versioning.md`
- Deferred follow-ups (bare→explicit `scc.v1:` restamp, `/scc.v1/` website alias, HTTP format entry point): workspace `FOLLOWUPS.md` §8.

**Implementation status**

| Capability | Status |
|---|---|
| `scc.vN:` prefix recognized + normalized in links (bare ≡ v1) | **Implemented** |
| Non-current scheme version refused against current registry | **Implemented** |
| `#format` qualifier stripped to canonical identity | **Implemented** |
| `scheme_version` recorded in the registry | **Implemented** |
| `scheme_version` surfaced in the published API (`index`/`scc`/`types.json` top-level + per-entry `resolve/*.json`) | **Implemented** |
| Per-format content emission via `#format` / `Accept` / `?format=` | **Reserved** |
| Explicit `/scc.v1/` website URL alias | **Reserved** |
| Bare→explicit `scc.v1:` restamp of existing links | **Deferred** (FOLLOWUPS §8) |
