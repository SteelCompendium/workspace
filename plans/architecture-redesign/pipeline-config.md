# Pipeline Configuration

## Overview

The pipeline config file (`pipeline.yaml`) defines cross-cutting concerns for a pipeline run. It sits alongside the annotated markdown input and tells `steel-etl` what to generate and where to put it.

## Config File Spec

```yaml
# pipeline.yaml

# ─── Input ───────────────────────────────────────────────────────────
# Book identifier and input file
book: mcdm.heroes.v1
input: ./input/heroes/Draw Steel Heroes.md

# Locale (default: en)
locale: en

# ─── Classification ─────────────────────────────────────────────────
classification:
  # Path to the SCC classification registry
  registry: ./input/classification.json

  # If true, fail if a build would change an existing SCC code
  # Set to true after freezing the classification
  freeze: true

# ─── Output ──────────────────────────────────────────────────────────
output:
  # Base directory for output (relative to config file or absolute)
  base_dir: ../../data-rules

  # Output formats to generate
  formats:
    - md          # Markdown with YAML frontmatter
    - json        # JSON
    - yaml        # YAML

  # Output variants to generate
  variants:
    linked: true       # SCC cross-reference links injected
    dse: true          # Obsidian DSE formatting
    dse_linked: true   # Both DSE + linked

  # Stripped markdown (annotations removed) for distribution
  stripped:
    enabled: true
    output_dir: ../../data-rules-clean

  # Aggregation into unified repo
  aggregate:
    enabled: true
    output_dir: ../../data-unified

  # SCC-to-path mapping for website
  scc_map:
    enabled: true
    output_file: ./output/scc-to-path.json

# ─── Content Parser Overrides ────────────────────────────────────────
# Override or configure specific content parsers
# Usually not needed — parsers auto-detect from @type annotations
parsers:
  # Example: use chapter parser for a section that would normally
  # be parsed differently
  overrides:
    - type: "negotiation"
      parser: "chapter"

# ─── Multiple Books ─────────────────────────────────────────────────
# For multi-book pipelines, define additional books
# Each book can override any top-level setting
books:
  - book: mcdm.monsters.v1
    input: ./input/monsters/Draw Steel Monsters.md
    output:
      base_dir: ../../data-bestiary
```

## Directory Structure

The output directory structure follows this pattern:

```
{base_dir}/
  {locale}/
    md/
      {file_hierarchy}/
        {item}.md
    md-linked/
      ...
    md-dse/
      ...
    md-dse-linked/
      ...
    json/
      {file_hierarchy}/
        {item}.json
    yaml/
      {file_hierarchy}/
        {item}.yaml
```

### File Hierarchy

The file hierarchy within each format directory is derived from the annotation structure:

```
md/
  Chapters/
    Introduction.md
    Classes.md
    ...
  Classes/
    Fury.md
    Shadow.md
    ...
  Abilities/
    Fury/
      1st-Level Features/
        Gouge.md
        Brutal Slam.md
        ...
      2nd-Level Features/
        ...
    Shadow/
      ...
  Kits/
    Shining Armor.md
    ...
  Ancestries/
    Dwarf.md
    ...
```

The mapping from annotation type/id to file path is deterministic:
- `@type: chapter, @id: classes` → `Chapters/Classes.md`
- `@type: class, @id: fury` → `Classes/Fury.md`
- `@type: ability, @id: gouge` (under class fury, level 1) → `Abilities/Fury/1st-Level Features/Gouge.md`

## Environment Variables

Config values can be overridden via environment variables:

| Variable | Overrides |
|----------|-----------|
| `STEEL_ETL_LOCALE` | `locale` |
| `STEEL_ETL_OUTPUT_DIR` | `output.base_dir` |
| `STEEL_ETL_REGISTRY` | `classification.registry` |

## Multi-Book Pipeline

When `--all` is passed to `steel-etl gen`, it processes all books defined in the config sequentially, then runs the aggregation step to produce unified output.

```bash
# Process all books defined in pipeline.yaml
steel-etl gen --config pipeline.yaml --all

# Process a single book
steel-etl gen --config pipeline.yaml --book mcdm.heroes.v1
```

## Locale Pipeline

For translations, a separate pipeline config can be used, or the locale can be overridden:

```bash
# Use a locale-specific config
steel-etl gen --config pipeline-es.yaml

# Override locale on the command line
steel-etl gen --config pipeline.yaml --locale es --input ./input/i18n/es/heroes/Draw\ Steel\ Heroes.md
```

The locale affects:
- Output directory: `{base_dir}/es/md/` instead of `{base_dir}/en/md/`
- SCC codes: Same as English (SCC is language-independent)
- Website URL: `steelcompendium.io/es/mcdm.heroes.v1/feature.ability.fury.level-1/gouge`
