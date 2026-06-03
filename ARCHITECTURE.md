# Architecture

## Pipeline Overview

All content flows through a single pipeline: annotated source markdown is processed by `steel-etl` into structured data and a deployable website.

```
                              steel-etl gen
                          (pipeline.yaml config)
                                  │
    ┌─────────────────────────────┼──────────────────────────────────┐
    │                             │                                  │
    ▼                             ▼                                  ▼
 Input                      Classification                      Output (7 targets)
 steel-etl/input/           classification.json                 ├─ data/data-rules/en/md
 heroes/Draw Steel             (generated,                      ├─ data/data-rules/en/json
   Heroes.md                    gitignored)                     ├─ data/data-rules/en/yaml
                                                                ├─ data/data-rules/en/md-linked
                                                                ├─ data/data-rules/en/md-dse
                                                                ├─ data/data-rules/en/md-dse-linked
                                                                ├─ data/data-rules-clean/  (stripped)
                                                                ├─ data/data-unified/en/md (aggregate)
                                                                ├─ steelCompendium.github.io/docs/api/
                                                                └─ steel-etl/output/scc-to-path.json
                                  │
                                  │  steel-etl site
                                  │  (v2/site.yaml config)
                                  │
                                  ▼
                          data/data-rules/en/md-linked
                                  │
                                  ├── section mapping (Browse; Read grouped by book, source-ordered)
                                  ├── book-faithful subtree render (RenderSubtree → PageBody)
                                  ├── index generation
                                  ├── SCC permalink stubs
                                  └── scc-manifest.js
                                  │
                                  ▼
                              v2/docs/
                                  │
                                  ▼
                          MkDocs Material build
                              (mkdocs.yml)
```

## Step-by-step: `just deploy`

The `deploy` recipe runs `deploy-api` then `deploy-v2`. The full sequence:

### 1. `steel-etl gen` (pipeline)

Reads the annotated source markdown, parses sections using 14 content-type parsers, assigns SCC codes via the classifier, and writes structured output to multiple targets.

**Input:** `steel-etl/input/heroes/Draw Steel Heroes.md` -- hand-annotated markdown with `<!-- @type: ... -->` comment tags that identify content sections (classes, abilities, kits, ancestries, etc.)

**Config:** `steel-etl/pipeline.yaml`

**Outputs (all generated, cleaned on each run):**

| Target | Format | Purpose |
|--------|--------|---------|
| `data/data-rules/en/md` | Markdown with YAML frontmatter | Primary structured output |
| `data/data-rules/en/json` | JSON | SDK consumption |
| `data/data-rules/en/yaml` | YAML | SDK consumption |
| `data/data-rules/en/md-linked` | Markdown with resolved `scc:` links | Input for site builder |
| `data/data-rules/en/md-dse` | Draw Steel Elements plugin format | Obsidian plugin |
| `data/data-rules/en/md-dse-linked` | DSE + resolved links | Obsidian plugin |
| `data/data-rules-clean/` | Stripped markdown (no annotations) | Distribution / reading |
| `data/data-unified/en/md` | Aggregated markdown + indexes | Unified browsing |
| `steelCompendium.github.io/docs/api/` | SCC resolution API (JSON) | External tool integration |
| `steel-etl/output/scc-to-path.json` | SCC-to-filepath mapping | Internal tooling |
| `steel-etl/classification.json` | SCC registry (gitignored) | Generated from parsed content |

### 2. `steel-etl site` (site builder)

Transforms the `md-linked` output into the MkDocs directory structure that the v2 site serves.

**Input:** `data/data-rules/en/md-linked` (output from step 1)

**Config:** `v2/site.yaml`

**Output:** `v2/docs/` (cleaned before each run, preserving `stylesheets/`, `javascripts/`, `Media/`)

Key operations:
- **Section mapping** -- copies content into `Browse/` and `Read/` tab directories. The `Read/` tab is grouped per book (`Read/<book>/`, configured via `books:` in `v2/site.yaml`) and chapters are ordered by their position in the source document (`order:` frontmatter), not alphabetically.
- **Book-faithful pages** -- each `md-linked` page is a full book-order render of its source section's subtree (own body + all nested descendants inline, headings normalized, ability statblocks un-blockquoted). Produced by `RenderSubtree` → `ParsedContent.PageBody`, consumed by the `md-linked` generator. The site builder maps these directly into `Browse/` and `Read/` — no composite reassembly. The `md`/`json`/`yaml`/`dse` outputs remain per-section structured outputs.
- **Group remapping** -- nests kit abilities under `Kits/` subdirectory
- **Index generation** -- creates navigable index pages with natural sort
- **SCC permalink stubs** -- generates `scc/{code}/index.html` redirect files
- **SCC manifest** -- writes `javascripts/scc-manifest.js` for client-side URL rewriting
- **Static overrides** -- copies `v2/static_content/docs/` last (hand-authored pages override generated ones)

### 3. Index transforms (Python)

`v2/scripts/transform_indexes.py` converts generated index pages into MkDocs Material grid card layouts.

### 4. Commit and push

The v2 repo is committed with the steel-etl SHA in the commit message and pushed. MkDocs builds on GitHub Pages.

## Data flow summary

```
Annotated source (hand-edited)
  steel-etl/input/heroes/Draw Steel Heroes.md
       │
       ▼
  steel-etl gen ──► data/data-rules/     (6 format dirs)
       │          ► data/data-rules-clean (stripped)
       │          ► data/data-unified     (aggregate)
       │          ► org-site/docs/api/    (SCC API)
       │
       ▼
  steel-etl site ──► v2/docs/            (MkDocs source)
       │
       ▼
  MkDocs build ───► steelcompendium.io/v2
```

## What to edit vs. what is generated

| Path | Status | Edit? |
|------|--------|-------|
| `steel-etl/input/heroes/` | Source of truth | Yes -- all content changes go here |
| `steel-etl/pipeline.yaml` | Config | Yes |
| `steel-etl/internal/` | Go source | Yes |
| `v2/site.yaml` | Site builder config | Yes |
| `v2/docs/stylesheets/` | Hand-authored CSS | Yes |
| `v2/docs/javascripts/` | Hand-authored JS (except `scc-manifest.js`) | Yes |
| `v2/static_content/` | Static overrides for generated pages | Yes |
| `v2/overrides/` | MkDocs theme overrides | Yes |
| `v2/mkdocs.yml` | MkDocs config | Yes |
| `data/data-rules/` | Generated by `steel-etl gen` | No -- overwritten on each run |
| `data/data-unified/` | Generated by `steel-etl gen` | No |
| `data/data-rules-clean/` | Generated by `steel-etl gen` | No |
| `v2/docs/Browse/` | Generated by `steel-etl site` | No |
| `v2/docs/Read/` | Generated by `steel-etl site` | No |
| `v2/docs/scc/` | Generated by `steel-etl site` | No |
| `steel-etl/classification.json` | Generated, gitignored | No |
| `steel-etl/output/` | Generated, gitignored | No |
