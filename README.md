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
  compendium/           # Obsidian vault (v1)
  v2/                   # MkDocs Material site (v2)
  data-gen/             # ETL pipeline: PDF -> Markdown -> YAML/JSON
  data-sdk-npm/         # TypeScript SDK for consuming data repos
  draw-steel-elements/  # Web components for Draw Steel content
  statblock-adapter-gl-pages/  # Statblock rendering adapter
  steelCompendium.github.io/   # GitHub Pages site
  data/
    data-md/            # Core Markdown (heroes)
    data-md-dse/        # DSE-formatted Markdown
    data-md-linked/     # Markdown with scc: links resolved
    data-md-dse-linked/ # DSE Markdown with links resolved
    data-rules-md/      # Rules Markdown
    data-rules-md-dse/  # Rules DSE Markdown
    data-rules-md-linked/      # Rules Markdown with links
    data-rules-md-dse-linked/  # Rules DSE Markdown with links
    data-rules-json/    # Rules as JSON
    data-rules-yaml/    # Rules as YAML
    data-bestiary-md/   # Bestiary Markdown
    data-bestiary-md-dse/  # Bestiary DSE Markdown
    data-bestiary-json/ # Bestiary as JSON
    data-bestiary-yaml/ # Bestiary as YAML
    data-adventures-md/ # Adventures Markdown
```

## Recipes

| Recipe | Description |
|--------|-------------|
| `just clone-all` | Clone all sub-repos into the workspace |
| `just switch_repos_to <branch>` | Switch all data repos to a given branch |
