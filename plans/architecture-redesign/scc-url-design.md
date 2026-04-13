# SCC URL Design

## URL Scheme

SCC string-form codes serve as permanent, immutable URLs for the Steel Compendium website.

### Format

```
steelcompendium.io/{source}/{type}/{item}
```

Where `{source}`, `{type}`, and `{item}` are the SCC components with `:` replaced by `/` and `.` preserved within components.

### Examples

| SCC Code | URL |
|----------|-----|
| `mcdm.heroes.v1/feature.ability.fury.level-1/gouge` | `steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge` |
| `mcdm.heroes.v1/chapter/classes` | `steelcompendium.io/mcdm.heroes.v1/chapter/classes` |
| `mcdm.heroes.v1/class/fury` | `steelcompendium.io/mcdm.heroes.v1/class/fury` |
| `mcdm.heroes.v1/kit/shining-armor` | `steelcompendium.io/mcdm.heroes.v1/kit/shining-armor` |
| `mcdm.heroes.v1/ancestry/dwarf` | `steelcompendium.io/mcdm.heroes.v1/ancestry/dwarf` |
| `mcdm.heroes.v1/condition/dazed` | `steelcompendium.io/mcdm.heroes.v1/condition/dazed` |
| `mcdm.monsters.v1/monster/chimera` | `steelcompendium.io/mcdm.monsters.v1/monster/chimera` |

### Locale-Prefixed URLs

Translated content gets a locale prefix:

```
steelcompendium.io/es/mcdm.heroes.v1/feature.ability.fury.level-1/gouge
```

English content has no prefix (it is the default locale):

```
steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge
```

### Homebrew / 3rd-Party URLs

Third-party content uses the `2.{publisher}` source prefix:

```
steelcompendium.io/community.{publisher}.{book}/abilities/{ability-id}
```

## SCC Classification Redesign

The SCC classification scheme has been finalized. Decimal codes were dropped (string-form only). Source component confirmed as `mcdm.heroes.v1`. Versioning: errata updates in place, new editions get `v2`.

### Issues Resolved

1. **Type paths are now consistent**: All features use `feature.ability.{class}.level-{N}` or `feature.trait.{class}.level-{N}`. All other types are singular (`class`, `chapter`, `condition`).
2. **No decimal codes**: String-form SCC is the only identifier. No decimal assignment or regeneration needed.
3. **Source component**: Confirmed as `mcdm.heroes.v1` — right granularity per book+edition.
4. **Versioning**: Errata updates content in place (same SCCs). New editions get new source (`mcdm.heroes.v2`).

### Type Taxonomy (Finalized)

All type names are singular. Features use a `feature.ability` / `feature.trait` split with class and level context in the type path. See [scc-taxonomy.md](scc-taxonomy.md) for the full taxonomy.

| Type | Description | Example full SCC |
|------|-------------|-----------------|
| `chapter` | Book chapters | `mcdm.heroes.v1/chapter/introduction` |
| `class` | Class overviews | `mcdm.heroes.v1/class/fury` |
| `feature.ability.{class}.level-{N}` | Abilities by class and level | `mcdm.heroes.v1/feature.ability.fury.level-1/gouge` |
| `feature.ability.common` | Common abilities | `mcdm.heroes.v1/feature.ability.common/grab` |
| `feature.trait.{class}.level-{N}` | Traits by class and level | `mcdm.heroes.v1/feature.trait.fury.level-1/growing-ferocity` |
| `feature.trait.{class}.level-{N}.{kit}` | Kit-specific traits | `mcdm.heroes.v1/feature.trait.fury.level-1.boren/kit-bonuses` |
| `ancestry` | Ancestries | `mcdm.heroes.v1/ancestry/dwarf` |
| `kit` | Kits | `mcdm.heroes.v1/kit/shining-armor` |
| `perk` | Perks | `mcdm.heroes.v1/perk/alert` |
| `career` | Careers | `mcdm.heroes.v1/career/artisan` |
| `culture` | Cultures | `mcdm.heroes.v1/culture/nomadic` |
| `condition` | Conditions | `mcdm.heroes.v1/condition/dazed` |
| `skill` | Skills | `mcdm.heroes.v1/skill/athletics` |
| `complication` | Complications | `mcdm.heroes.v1/complication/criminal-past` |
| `title` | Titles | `mcdm.heroes.v1/title/dragon-knight` |
| `treasure` | Treasures | `mcdm.heroes.v1/treasure/healing-potion` |
| `monster` | Monsters | `mcdm.monsters.v1/monster/chimera` |
| `monster.{category}` | Monsters by category | `mcdm.monsters.v1/monster.ogres/ogre-warrior` |

### Single Classification (No Multi-Classification)

Each item gets exactly one canonical SCC. There are no secondary classifications or indexes. The type path is fully specific — it includes class, level, and kit context where applicable. This eliminates the multi-classification confusion from the original design.

For navigation and search, separate index/view artifacts are generated (e.g., `nav-order.json`), not additional SCC codes.

### Versioning Strategy

| Scenario | Approach |
|----------|----------|
| Errata/patch to existing book | Same SCC codes. Content updated in place. URLs don't change. |
| New edition of a book | New source: `mcdm.heroes.v2`. Old `v1` URLs remain, `v2` gets new URLs. |
| New book | New source: `mcdm.{book-name}.v1` |
| Homebrew | New source: `community.{publisher}.{book}` |

### Freezing Process

Once the SCC scheme is finalized:

1. Regenerate `classification.json` with the new scheme
2. Verify all items have consistent, correct classifications
3. Mark the registry as frozen: new items can be appended, existing codes never change
4. The `steel-etl` tool enforces this: if a build would change an existing SCC code, it fails with an error

## MkDocs Integration

### URL Generation

The `steel-etl` tool outputs a `scc-to-path.json` file mapping each SCC code to its output file path:

```json
{
  "mcdm.heroes.v1/feature.ability.fury.level-1/gouge": "feature/ability/fury/level-1/gouge.md",
  "mcdm.heroes.v1/class/fury": "class/fury.md",
  ...
}
```

The v2 website build uses this mapping to generate the MkDocs directory structure where the SCC components form the directory path. Dots in the type component expand to path separators in the file system (e.g., `feature.ability.fury.level-1` becomes `feature/ability/fury/level-1/`).

### Navigation

The website navigation can be organized differently from the URL structure:
- **Browse by type**: Feature > Ability > Fury > Level 1 > Gouge
- **Read in order**: Chapter 5 > Classes > Fury > Gouge

Both link to the same SCC-based URL. Navigation is a view over the content, not tied to the URL structure.

### SCC Protocol Links

Within markdown content, cross-references use the `scc:` protocol:

```markdown
See [Gouge](scc:mcdm.heroes.v1/feature.ability.fury.level-1/gouge) for details.
```

The `linked` output variant resolves these to relative file paths. The website build resolves them to SCC-based URLs.
