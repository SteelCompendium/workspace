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
  justfile              # Workspace recipes (clone-all, deploy, deploy-api, deploy-v2)
  devbox.json           # Devbox environment (Go, Node, Python, just, jq, yq, etc.)
  reference/            # Draw Steel condensed reference docs for AI agents
  steel-etl/            # Go ETL pipeline + site builder — THE source of truth for content
                        #   input/{heroes,beastheart,monsters}/*.md = annotated sources
  v2/                   # MkDocs Material site (v2) — built by `steel-etl site`
  compendium/           # MkDocs Material site (v1, deprecated)
  data-gen/             # Legacy ETL pipeline: PDF -> Markdown (deprecated; reference only)
  data-sdk-npm/         # TypeScript SDK for consuming data repos
  draw-steel-elements/  # Web components for Draw Steel content
  statblock-adapter-gl-pages/  # Statblock rendering adapter
  steelCompendium.github.io/   # Root GitHub Pages site (also hosts the SCC API)
  data/                 # Generated output (gitignored build artifacts; do not edit)
    data-rules/         # Heroes book — md/json/yaml/linked/dse, by locale
    data-bestiary/      # Monsters book — statblocks, featureblocks, terrain, retainers
    data-beastheart/    # Beastheart book
    data-unified/       # All books merged together
    data-rules-clean/   # Stripped markdown (annotations removed) for distribution
    data-bestiary-*     # Legacy bestiary output (data-gen era; kept as validation reference)
```

Content flows: annotated `steel-etl/input/*` → `steel-etl gen` → `data/*` → `steel-etl site` → `v2/docs/` → MkDocs build. See `ARCHITECTURE.md` and `steel-etl/README.md`.

## Recipes

| Recipe | Description |
|--------|-------------|
| `just clone-all` | Clone all sub-repos into the workspace |
| `just switch_repos_to <branch>` | Switch all data repos to a given branch |
| `just deploy` | Full pipeline: gen + SCC API + v2 site |
| `just deploy-api` | Pipeline + SCC resolution API only |
| `just deploy-v2` | Pipeline + v2 site only |
