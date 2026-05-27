# Steel Compendium Workspace

Orchestration repo for the [Steel Compendium](https://steelcompendium.github.io/) multi-repo project -- a structured, searchable reference for the [Draw Steel](https://www.mcdmproductions.com/draw-steel) TTRPG by MCDM Productions.

## Quick Start

```bash
git clone git@github.com:SteelCompendium/workspace.git steelCompendium
cd steelCompendium
devbox shell
just clone-all
```

`clone-all` clones all sub-repos into the correct locations. Data repos land in `data/`; everything else is at the top level.

## Layout

```
steelCompendium/
  justfile              # Workspace recipes
  devbox.json           # Devbox environment (Python, Node, just, jq, yq, etc.)
  reference/            # Draw Steel condensed reference docs for AI agents
  compendium/           # MkDocs Material site (v1, deprecated)
  v2/                   # MkDocs Material site (v2)
  data-gen/             # Legacy ETL pipeline: PDF -> Markdown -> YAML/JSON (deprecated)
  data-sdk-npm/         # TypeScript SDK for consuming data repos
  draw-steel-elements/  # Web components for Draw Steel content
  statblock-adapter-gl-pages/  # Statblock rendering adapter
  steelCompendium.github.io/   # Root GitHub Pages site
  data/
    data-md/            # Core Markdown (heroes) (deprecated)
    data-md-dse/        # DSE-formatted Markdown (deprecated)
    data-md-linked/     # Markdown with scc: links resolved (deprecated)
    data-md-dse-linked/ # DSE Markdown with links resolved (deprecated)
    data-rules/         # Rules in various formats and languages
    data-rules-md/      # Rules Markdown (deprecated)
    data-rules-md-dse/  # Rules DSE Markdown (deprecated)
    data-rules-md-linked/      # Rules Markdown with link (deprecated)s
    data-rules-md-dse-linked/  # Rules DSE Markdown with links (deprecated)
    data-rules-json/    # Rules as JSON (deprecated)
    data-rules-yaml/    # Rules as YAML (deprecated)
    data-bestiary-md/   # Bestiary Markdown (deprecated)
    data-bestiary-md-dse/  # Bestiary DSE Markdown (deprecated)
    data-bestiary-json/ # Bestiary as JSON (deprecated)
    data-bestiary-yaml/ # Bestiary as YAML (deprecated)
    data-adventures-md/ # Adventures Markdown (deprecated)
    data-unified/         # All current data repos merged together in various formats and languages
```

## Recipes

| Recipe | Description |
|--------|-------------|
| `just clone-all` | Clone all sub-repos into the workspace |
| `just switch_repos_to <branch>` | Switch all data repos to a given branch |
