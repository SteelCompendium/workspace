# Target Architecture

## System Overview

```
                              ┌─────────────────────────────────────┐
                              │        Annotated Markdown           │
                              │  (Draw Steel Heroes.md + comments)  │
                              └──────────────┬──────────────────────┘
                                             │
                              ┌──────────────▼──────────────────────┐
                              │          steel-etl (Go CLI)         │
                              │                                     │
                              │  1. Read document frontmatter       │
                              │  2. Pre-pass: extract annotations   │
                              │  3. Parse markdown AST (goldmark)   │
                              │  4. Walk AST with context stack     │
                              │  5. Invoke content parsers per type │
                              │  6. Classify (assign SCC codes)     │
                              │  7. Generate outputs                │
                              └──────────────┬──────────────────────┘
                                             │
                 ┌───────────────────────────┬┴┬───────────────────────────┐
                 │                           │ │                           │
    ┌────────────▼────────────┐ ┌────────────▼─▼──────────┐ ┌────────────▼────────────┐
    │      data-rules/        │ │    data-bestiary/        │ │    data-unified/        │
    │  en/                    │ │  en/                     │ │  en/                    │
    │    md/                  │ │    md/                   │ │    md/                  │
    │    md-linked/           │ │    json/                 │ │    md-linked/           │
    │    json/                │ │    yaml/                 │ │    json/                │
    │    yaml/                │ │    md-dse/               │ │    ...                  │
    │    md-dse/              │ │  es/                     │ │  es/                    │
    │    md-dse-linked/       │ │    ...                   │ │    ...                  │
    │  es/                    │ └──────────────────────────┘ └─────────────────────────┘
    │    md/                  │
    │    ...                  │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────────────────────────────────────────────────────┐
    │                              Consumers                                 │
    │                                                                        │
    │  ┌──────────────┐  ┌────────────────┐  ┌───────────┐  ┌────────────┐  │
    │  │ v2 Website   │  │ Draw Steel     │  │ MCDM VTT  │  │ Community  │  │
    │  │ (MkDocs)     │  │ Elements       │  │            │  │ Tools      │  │
    │  │              │  │ (Obsidian)     │  │            │  │            │  │
    │  │ SCC-based    │  │ Uses SDK       │  │ Uses JSON/ │  │ Cards,     │  │
    │  │ URLs         │  │               │  │ API        │  │ Builders   │  │
    │  └──────────────┘  └────────────────┘  └───────────┘  └────────────┘  │
    └─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Input

1. **Annotated markdown** -- One file per book (e.g., `Draw Steel Heroes.md`) with:
   - Standard YAML frontmatter at the top (book-level metadata)
   - HTML comment annotations before headings (section-level metadata)
   - Well-structured content that content parsers can extract data from

2. **Pipeline config** (`pipeline.yaml`) -- Cross-cutting concerns:
   - Output formats and variants
   - Output directories
   - Locale
   - Classification registry path

3. **Classification registry** (`classification.json`) -- SCC code assignments:
   - Set of known string-form SCC codes (no decimal codes)
   - Append-only after freeze (new items get new codes, existing codes never change)

### Processing

The `steel-etl` tool performs a single pass over the annotated markdown:

1. **Read frontmatter** -- Parse standard YAML frontmatter for book-level metadata (source, title, etc.)
2. **Annotation pre-pass** -- Scan for `<!-- @key: value -->` patterns, build a map of line numbers to metadata
3. **Parse AST** -- goldmark parses the markdown into an AST
4. **Walk with context stack** -- Traverse the AST top-to-bottom. At each heading:
   - Pop context stack back to this heading level
   - If an annotation exists for this heading, push it onto the context stack
   - If the annotation has a `@type`, invoke the registered content parser
5. **Content parsers** -- Each parser extracts structured data from the section body:
   - Ability parser: keywords, cost, action type, distance, target, power roll tiers, effect text
   - Statblock parser: stats, immunities, speed, features
   - Class parser: overview text, heroic resource, subclass options
   - Chapter parser: passthrough (just captures content)
   - Kit parser: stat bonuses, equipment, signature ability
6. **SCC classification** -- Derive SCC codes from annotation hierarchy:
   - Book source from frontmatter
   - Type chain from annotation stack (e.g., `class` + `feature-group` + `ability`)
   - Item ID from annotation `@id` or derived from heading text (slugified)
   - Register string-form SCC in classification registry
7. **Output generation** -- For each parsed section, run all configured output generators

### Output

Each output generator produces files in a specific format:

| Generator | Description | Output Path |
|-----------|-------------|-------------|
| `markdown` | Per-section .md with YAML frontmatter | `data-rules/en/md/` |
| `json` | Per-section .json | `data-rules/en/json/` |
| `yaml` | Per-section .yaml | `data-rules/en/yaml/` |
| `linked` | Markdown with SCC cross-reference links injected | `data-rules/en/md-linked/` |
| `dse` | Markdown with Obsidian DSE formatting | `data-rules/en/md-dse/` |
| `dse-linked` | DSE + linked | `data-rules/en/md-dse-linked/` |
| `stripped` | Annotation-free copy of input markdown | Distribution-ready clean copy |
| `aggregate` | Full-book markdown, index files | `data-unified/en/md/` |
| `scc-map` | SCC-to-path mapping for website URL resolution | `scc-to-path.json` |

## Website Integration

The v2 MkDocs website uses SCC string-form codes as permanent URLs:

```
steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge
```

The website build pipeline:
1. Reads from `data-unified/en/md-linked/` (or locale equivalent)
2. Uses `scc-to-path.json` to generate the URL structure
3. MkDocs Material i18n support provides language switching
4. Language switcher uses SCC codes to link equivalent content across locales

## Translation Pipeline

```
English annotated markdown
  → Translation teams receive a copy
  → They translate content, preserve structure + annotations
  → Translated annotated markdown stored in input/i18n/{locale}/
  → steel-etl gen --locale es
  → Output goes to data-rules/es/md/, etc.
  → Website serves at steelcompendium.io/es/mcdm.heroes.v1/...
```

## Homebrew / 3rd-Party Content (Future)

Third-party content uses the same annotated markdown format with a different source prefix:

```yaml
---
book: community.homebrew.{publisher-id}
source: {publisher-name}
title: {book title}
---
```

SCC codes for third-party content use the `community` source prefix:
- `community.publisher-name.book-name/feature.ability.common/custom-strike`

A registration process assigns publisher IDs and validates content against the JSON schemas.
