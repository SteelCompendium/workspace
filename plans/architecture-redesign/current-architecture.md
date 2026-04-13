# Current Architecture (Reference)

This document describes the system as it exists today, for reference during migration. This architecture is being replaced.

## Data Flow

```
PDF (Draw Steel book)
  → Manual conversion to markdown (one big file per book)
  → pandoc: markdown → HTML
  → XPath extraction: HTML → individual HTML sections (guided by YAML config files)
  → pandoc: HTML sections → individual markdown files
  → Frontmatter injection: add YAML metadata to each markdown file
  → SCC classification: assign classification codes
  → Linking: inject cross-reference links using SCC protocol
  → DSE formatting: create Obsidian-compatible variants
  → Copy to output repos: 15 data-* repos
  → Aggregation: combine into unified repos (data-md, data-md-linked)
  → v2 website: clone data-md-linked, restructure, fix links, build MkDocs
```

## Repository Map

### Orchestration
- **workspace/** -- This repo. justfile + devbox for workspace-level operations.

### ETL Pipeline
- **data-gen/** -- The ETL pipeline.
  - `input/heroes/Draw Steel Heroes.md` -- Single large markdown file (entire Heroes book)
  - `input/heroes/*.yml` -- YAML config files defining extraction rules (chapters.yml, abilities.yml, careers.yml, kits.yml, etc.)
  - `input/monsters/Draw Steel Monsters.md` -- Single large markdown file (Monsters book)
  - `input/classification.json` -- SCC classification registry
  - `etl/justfile` -- Main entry point, imports 27 module .just files
  - `etl/*.just` -- Pipeline stages (heroes.just, monsters.just, extract_html_sections.just, frontmatter.just, sc_classification.just, linker.just, etc.)
  - Many .just files contain substantial embedded Python (heroes_frontmatter.just has ~190 lines of Python)

### Output Data Repos (under `data/`)

| Repo | Content | Format |
|------|---------|--------|
| data-rules-md | Hero rules (abilities, classes, kits, etc.) | Markdown with frontmatter |
| data-rules-md-linked | Same, with SCC cross-reference links | Markdown |
| data-rules-md-dse | Same, Obsidian DSE formatting | Markdown |
| data-rules-md-dse-linked | DSE + linked | Markdown |
| data-rules-json | Hero rules | JSON |
| data-rules-yaml | Hero rules | YAML |
| data-bestiary-md | Monsters | Markdown with frontmatter |
| data-bestiary-md-dse | Monsters, Obsidian formatting | Markdown |
| data-bestiary-json | Monsters | JSON |
| data-bestiary-yaml | Monsters | YAML |
| data-md | Aggregated (rules + bestiary + adventures) | Markdown |
| data-md-linked | Aggregated with links | Markdown |
| data-md-dse | Aggregated DSE | Markdown |
| data-md-dse-linked | Aggregated DSE + linked | Markdown |
| data-adventures-md | Adventure content | Markdown |

### Consumers
- **v2/** -- MkDocs Material website. Pulls from data-md-linked (v3 branch). Heavy bash in justfile for restructuring content into Browse/Read/Full Book tabs, fixing links with sed/perl, injecting search exclusion frontmatter, generating .nav.yml files.
- **data-sdk-npm/** -- TypeScript npm package (steel-compendium-sdk). Models, DTOs, JSON schemas, readers/writers for JSON/YAML/Markdown, CLI tool (sc-convert).
- **draw-steel-elements/** -- Obsidian plugin. Renders YAML in `ds-*` fenced code blocks as ability cards, statblocks, etc. Uses steel-compendium-sdk.
- **compendium/** -- Legacy v1 site (deprecated)
- **statblock-adapter-gl-pages/** -- Web adapter

## Output File Format Example

Each output markdown file has YAML frontmatter with metadata:

```yaml
---
action_type: Main action
class: censor
cost: 5 Wrath
cost_amount: 5
cost_resource: Wrath
distance: Melee 1
feature_type: ability
file_basename: Arrest
file_dpath: Abilities/Censor/1st-Level Features
flavor: '"I got you, you son of a bitch."'
item_id: arrest-5-wrath
item_index: '06'
item_name: Arrest (5 Wrath)
keywords:
  - Magic
  - Melee
  - Strike
  - Weapon
level: 1
scc:
  - mcdm.heroes.v1:feature.ability.censor.1st-level-feature:arrest-5-wrath
scdc:
  - 1.1.1:11.2.7.1:06
source: mcdm.heroes.v1
target: One creature
type: feature/ability/censor/1st-level-feature
---
```

## SCC Classification System

Hierarchical `source:type:item` format with string and decimal forms.

- **String form:** `mcdm.heroes.v1:abilities.fury:gouge` (slug characters: `[a-z0-9-]`)
- **Decimal form:** `1.1.1:2.4:28` (1-based indexing, `0` = 10th position)

Components separated by `:`, sub-codes separated by `.`.

Source allocation:
- `1` = MCDM (first-party)
- `2` = third-party
- `3-9` = reserved

Current registry stored in `data-gen/input/classification.json` as nested trees.

## Pain Points (Why We're Redesigning)

1. **XPath fragility**: Section extraction depends on HTML IDs derived from heading text. Translated headings produce different IDs.
2. **Embedded Python in just**: ~500+ lines of Python spread across .just files. Not importable, not testable.
3. **HTML roundtrip**: markdown → HTML → XPath → HTML → markdown is slow and lossy.
4. **sed/perl in v2 build**: The website build does 6+ text manipulation passes with sed/perl/Python. A single-character regex error breaks the build silently.
5. **No tests**: Zero automated tests in the ETL pipeline.
6. **Manual metadata**: Adding a new content type requires writing YAML configs with XPath selectors.
7. **No locale support**: No mechanism for translations at any layer.
8. **15 repos**: Each format variant and linking variant is a separate git repo.
