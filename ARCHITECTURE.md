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
 Input                      Classification                      Output (one repo + 2 targets)
 steel-etl/input/           classification.json                 data/data-unified/
 <book>/Draw Steel             (generated,                      ├─ en/books/<book>/{md,json,yaml,
   <Book>.md                    gitignored)                     │    md-linked,md-dse,md-dse-linked,
                                                                │    clean}   (Read: book-faithful)
                                                                ├─ en/unified/{md,json,yaml,md-linked,
                                                                │    md-dse,md-dse-linked}  (Browse:
                                                                │    cross-book aggregate, all formats)
                                                                ├─ steelCompendium.github.io/docs/api/
                                                                └─ steel-etl/output/scc-to-path.json
                                  │
                                  │  steel-etl site
                                  │  (v2/site.yaml config)
                                  │
                                  ▼
                       data/data-unified/en/books/<book>/md-linked
                                  │
                                  ├── section mapping (Browse; Read grouped by book, source-ordered)
                                  ├── book-faithful subtree render (RenderSubtree → PageBody)
                                  ├── index generation
                                  └── SCC permalink stubs
                                  │
                                  ▼
                              v2/docs/
                                  │
                                  ▼
                          MkDocs Material build
                              (mkdocs.yml)
```

## Step-by-step: `just deploy`

The `deploy` recipe runs `gen --all` **once**, commits the SCC API to the org repo, builds and commits the v2 site, then commits and pushes the regenerated data repos. (The standalone `deploy-api` / `deploy-v2` recipes each self-`gen`; `deploy` inlines a single shared `gen` so the `time.Now()` "generated" stamp in `docs/api/*.json` is committed once — a second `gen` would re-stamp those files and leave the org repo dirty with an uncommitted timestamp-only diff.) The full sequence:

### 1. `steel-etl gen` (pipeline)

Reads the annotated source markdown, parses sections using the content-type parsers registered in `steel-etl/internal/content/registry.go`, assigns SCC codes via the classifier, and writes structured output to multiple targets.

**Input:** `steel-etl/input/heroes/Draw Steel Heroes.md` -- hand-annotated markdown with `<!-- @type: ... -->` comment tags that identify content sections (classes, abilities, kits, ancestries, etc.). Each book has its own `input/<book>/Draw Steel <Book>.md`.

> **Onboarding a new book from PDF.** Supplement PDFs are converted via the fidelity-gated tool `steel-etl/tools/pdf-extract/` (replaces marker-pdf). It extracts the publisher's text **deterministically and font-aware** (so custom icon glyphs can't masquerade as prose) — that text is the sole source of words; AI only structures + annotates it, never retypes a word; and `fidelity_check.py` proves the annotated markdown contains exactly the publisher's word-multiset (zero dropped/changed/added). The Summoner book was the first onboarded this way — see `tools/pdf-extract/README.md` and `docs/superpowers/plans/2026-06-09-summoner-ai-pdf-conversion.md`.

**Config:** `steel-etl/pipeline.yaml`

> **Gotcha — multi-book gen.** `pipeline.yaml` defines a primary book (`mcdm.heroes.v1`) plus secondary books in its `books:` list (`mcdm.beastheart.v1`, `mcdm.monsters.v1`, `mcdm.summoner.v1`). A bare `steel-etl gen --config pipeline.yaml` regenerates **only the primary book** — the secondary books' `data/data-unified/en/books/<book>/` output stays stale, and the cross-book `en/unified/` aggregate is only rebuilt under `--all`. To regenerate everything use `--all` (every book) or `--book <id>`. The `just deploy*` recipes already pass `--all`; only manual `gen` runs hit this. Symptom: edits to `input/beastheart/...` appear ignored because you're reading stale output, and the primary-book "Sections: N parsed" line is heroes-only. (`selectBookConfigs` in `internal/cli/gen.go`.)

**Outputs (all generated, cleaned on each run):**

All book/aggregate output lands in the single consolidated `data/data-unified` repo, with
`<locale>` as the top path segment (`en/` today). Per-book trees ("Read") and the cross-book
aggregate ("Browse") are siblings under each locale; `<book>` is one of `heroes`, `monsters`,
`beastheart`, `summoner`.

| Target | Format | Purpose |
|--------|--------|---------|
| `data/data-unified/en/books/<book>/md` | Markdown with YAML frontmatter | Primary structured output (Read) |
| `data/data-unified/en/books/<book>/json` | JSON | SDK consumption |
| `data/data-unified/en/books/<book>/yaml` | YAML | SDK consumption |
| `data/data-unified/en/books/<book>/md-linked` | Markdown with resolved `scc:` links | Input for site builder |
| `data/data-unified/en/books/<book>/md-dse` | Draw Steel Elements plugin format | Obsidian plugin |
| `data/data-unified/en/books/<book>/md-dse-linked` | DSE + resolved links | Obsidian plugin |
| `data/data-unified/en/books/<book>/clean` | Stripped markdown (no annotations) | Distribution / reading (where enabled) |
| `data/data-unified/en/unified/<format>` | All six formats, aggregated by type + md `_index` | Cross-book browsing (Browse) |
| `steelCompendium.github.io/docs/api/` | SCC resolution API (JSON) | External tool integration |
| `steel-etl/output/scc-to-path.json` | SCC-to-filepath mapping | Internal tooling |
| `steel-etl/classification.json` | SCC registry (gitignored) | Generated from parsed content |

The registry records a `scheme_version` (the SCC *grammar* version, default `1`; spec **v1.1**, 2026-06-09) alongside the registry-file `version`. When resolving `scc:` links in the `*-linked` outputs, the resolver tolerates an optional `scc.vN:` prefix (bare `scc:` ≡ `scc.v1`) and a reserved `#format` qualifier — it strips the qualifier to the canonical identity and resolves only links whose scheme version matches the registry (a future `scc.v2:` link is left unresolved, never bound to v1 content). Format is never part of SCC identity; see `reference/scc-specification.md` §2.0/§8/§9.

### 2. `steel-etl site` (site builder)

Transforms the `md-linked` output into the MkDocs directory structure that the v2 site serves.

**Input:** `data/data-unified/en/books/<book>/md-linked` (output from step 1; `site.yaml` lists one `source_dirs` entry per book)

**Config:** `v2/site.yaml`

**Output:** `v2/docs/` (cleaned before each run, preserving `stylesheets/`, `javascripts/`, `Media/`)

Key operations:
- **Section mapping** -- copies content into `Browse/` and `Read/` tab directories. The `Read/` tab is grouped per book (`Read/<book>/`, configured via `books:` in `v2/site.yaml`) and chapters are ordered by their position in the source document (`order:` frontmatter), not alphabetically. The modular Monsters-book pages (`monster/<category>/…`, `dynamic-terrain/…`, `retainer/…`) live on the **`Browse/`** tab as of 2026-06-10 (moved from the old Bestiary browser; presentation/URL only, **no SCC re-mint**) — monster **group** landings render lore + Malice/Tactical-Stance featureblock cards + statblock preview cards (echelon-grouped for demons/undead/rivals/war-dogs) via `internal/site/bestiary_cards.go`, and the `monster`/`dynamic-terrain` roots render `.sc-folder` cards. The redundant `statblock/` folder is hoisted out of the site URL (`hoistStatblockPath`), so statblocks sit directly under their group (`monster/<group>/<item>`) and `retainer/` is a flat card grid — the SCC codes keep their `.statblock` segment (code≠path). The book-faithful everything-inline monster view still lives on the `Read/` tab's `chapter/monsters` page. The **`Bestiary/` tab is a client-side Search & Filter utility** (Plan B, shipped 2026-06-10): `buildBestiarySearchPage` (`internal/site/bestiary_search.go`, run in `Build()` after `generateIndexPages`) walks the Browse `monster`/`dynamic-terrain`/`retainer` frontmatter and emits `Bestiary/index.md` carrying a `.sc-bestiary-mount` JSON data island (one record per statblock/terrain/retainer; no-op when the Monsters book is absent). The island is mounted client-side by `v2/docs/javascripts/steel-bestiary-browser.js` (`window.SCBestiary`) into a search box + facet chips + Level/EV range filters + a sortable results table — a sibling of the `SCBrowse` `feature/`-landing pattern, reusing the `.sc-browse` shell. SITE-ONLY (read from existing frontmatter; no SCC re-mint, no data-repo change). Monsters generate to `data/data-unified/en/books/monsters/` (see the multi-book gotcha above; `just deploy*` passes `--all`).
- **Book-faithful pages** -- each `md-linked` page is a full book-order render of its source section's subtree (own body + all nested descendants inline, headings normalized, ability statblocks un-blockquoted). Produced by `RenderSubtree` → `ParsedContent.PageBody`, consumed by the `md-linked` generator. The site builder maps these directly into `Browse/` and `Read/` — no composite reassembly. The `md`/`json`/`yaml`/`dse` outputs remain per-section structured outputs.
  - **Per-heading SCC markers:** `RenderSubtree` stamps `{data-scc="<code>"}` (attr_list) onto every descendant heading whose section has an SCC code, so the v2 client (`scc-headerlinks.js`) can offer a stable `/scc/<code>/` permalink on that heading's ¶ icon; structural headings stay unmarked. Because a parent page is visited before its children are classified, `PageBody` rendering + generator writes are **deferred to a post-walk pass** in `internal/pipeline/pipeline.go` so the section→SCC map is complete first. See `v2/.repo-docs/decisions/2026-06-04-scc-heading-permalinks.md`.
- **Group remapping** -- nests kit abilities under `Kits/` subdirectory
- **Index generation** -- creates navigable index pages with natural sort
- **SCC permalink stubs** -- generates `scc/{code}/index.html` redirect files. The SCC URL is a stable, shareable redirect entry point; the friendly Browse page is the canonical, indexable location. (The former client-side `scc-manifest.js` address-bar rewrite was **retired 2026-05-31** — see `v2/.repo-docs/decisions/2026-05-31-retire-scc-address-bar-rewrite.md`.)
- **Static overrides** -- copies `v2/static_content/docs/` last (hand-authored pages override generated ones)

### 3. Commit and push

The v2 repo is committed with the steel-etl SHA in the commit message and pushed. MkDocs builds on GitHub Pages.

### 4. Commit and push the data repo

The single independent published data repo — `data/data-unified` (the `clone-all` target; **not** a submodule) — holds the raw `gen --all` output for every book (`en/books/<book>/`) and the cross-book aggregate (`en/unified/`). `deploy` commits and pushes it (skipping if it isn't a clone or has no changes), so the published JSON/markdown never lags the API + site. (The former per-book repos `data-rules`/`data-bestiary` are deprecated — see their READMEs — and the old local-only `data-beastheart`/`data-summoner`/`data-rules-clean` dirs are retired.)

## Data flow summary

```
Annotated source (hand-edited)
  steel-etl/input/<book>/Draw Steel <Book>.md
       │
       ▼
  steel-etl gen ──► data/data-unified/en/books/<book>/  (6 formats + clean, per book)
       │          ► data/data-unified/en/unified/        (all-format aggregate)
       │          ► org-site/docs/api/                    (SCC API)
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
| `v2/docs/javascripts/` | Hand-authored JS | Yes |
| `v2/static_content/` | Static overrides for generated pages | Yes |
| `v2/overrides/` | MkDocs theme overrides | Yes |
| `v2/mkdocs.yml` | MkDocs config | Yes |
| `data/data-unified/` | Generated by `steel-etl gen` (all books + aggregate) | No -- overwritten on each run |
| `v2/docs/Browse/` | Generated by `steel-etl site` | No |
| `v2/docs/Read/` | Generated by `steel-etl site` | No |
| `v2/docs/scc/` | Generated by `steel-etl site` | No |
| `steel-etl/classification.json` | Generated, gitignored | No |
| `steel-etl/output/` | Generated, gitignored | No |

## Schemas: two hand-synced copies (footgun)

The JSON schemas for the output format exist in **two places** and are **not** linked by any build dependency:

- `data-sdk-npm/src/schema/*.schema.json` — the published SDK contract consumed by third-party tools. **⚠️ The canonical mainline of `data-sdk-npm` is the `v3` branch, not `main`** (the GitHub default still points at `main`). Edit/branch from `v3`; a change landed on `main` will be on the stale line.
- `steel-etl/schemas/*.schema.json` — steel-etl's own copy (steel-etl is Go and cannot import the npm package).

steel-etl does **not** depend on the SDK: it emits SDK-shaped JSON by convention, and its conformance test (`internal/output/schema_validation_test.go`) checks against hand-maintained property allowlists, **not** the schema files at runtime. Nothing programmatically enforces that the two copies agree.

**⚠️ Any schema change must be applied to BOTH copies in the same change.** They drifted during the 2026-06-07 feature/ability/trait refactor (only the SDK copy was updated first); see `steel-etl/docs/superpowers/specs/2026-06-07-feature-taxonomy-design.md`.

**Card ⇄ data parity:** index-card fields scraped from the page body must also be promoted into frontmatter + both schema copies, or the site shows data the data repos lack. See `steel-etl/docs/card-data-parity.md` (precedent: the 2026-06-08 `flavor` + treasure `project_goal`/`project_roll_characteristic`/`echelon` sweep).
