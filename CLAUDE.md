# Steel Compendium Workspace

## What this project is

Workspace orchestration for the Steel Compendium multi-repo project -- a structured, searchable
reference for the Draw Steel TTRPG by MCDM Productions.

This repo contains workspace-level config (justfile, devbox) and reference documents.
All other code lives in sub-repos cloned via `just clone-all`.

## Dev environment (devbox)

This workspace uses **devbox** for toolchain management (Go, Node, Python, just, etc.). Go and other tools are NOT on the system PATH -- you must activate devbox first.

```bash
# Activate devbox (run this before any Go/just/node commands):
devbox run --

# Verify:
go version    # go1.26.1
just --version
node --version
```

For example, `devbox run -- go build ./...`

For scripts and subagents, prefix commands with the eval line above. The `devbox.json` packages: bash, python, just, jq, yq-go, perl, figlet, nodejs, go.

## Layout

- `justfile` -- Workspace recipes (`clone-all`, `deploy`, `deploy-api`, `deploy-v2`)
- `devbox.json` / `devbox.lock` -- Dev environment (Go, Node, Python, just, etc.)
- `FOLLOWUPS.md` -- Deferred tasks identified during other work
- `reference/` -- Draw Steel condensed reference docs and SCC specification (see below)
- `templates/` -- Repo documentation templates (`repo-docs/`) and `TEMPLATE-GUIDE.md`
- `plans/` -- Architecture and design plans (architecture-redesign, schema-enrichment, sdk-schema-alignment)
- `steel-etl/` -- Go CLI tool: the primary ETL pipeline and site builder (has its own CLAUDE.md)
- `v2/` -- MkDocs Material site; `v2/site.yaml` configures the steel-etl site builder. See `v2/.repo-docs/` for detailed architecture docs including the SCC permalink system.
- Sub-repos at top level: `compendium/`, `data-gen/`, `data-sdk-npm/`, `draw-steel-elements/`, `statblock-adapter-gl-pages/`, `steelCompendium.github.io/`
- Sub-repos in `data/`: all `data-*` content repos (markdown, JSON, YAML variants) are primarily output repos

## Draw Steel TTRPG Reference

Four reference documents live in `reference/`:

- `reference/draw-steel-overview.md` -- High-level overview (~3 pages). Design philosophy, core mechanics, hero building, combat summary, setting.
- `reference/draw-steel-reference.md` -- Comprehensive condensed reference (~15 pages). All ancestries, classes, kits, skills, combat rules, conditions, negotiation, downtime, rewards, gods/domains, and progression.
- `reference/draw-steel-agent-reference.md` -- Detailed agent reference (~40 pages). Everything in the condensed reference plus: all ability names per class organized by cost tier, all domain features/piety triggers/prayer effects, all 21 kit stat tables, all 48 perks with descriptions, all career grants, stormwight kit details with Growing Ferocity tables, all treasure/trinket/artifact names, all title names organized by echelon with benefit choices, collision damage rules, and more.
- `reference/scc-specification.md` -- Full SCC specification (format, rules, examples).

Read the overview first. Use the condensed reference for moderate detail. Use the agent reference when you need granular mechanical specifics (e.g., what a specific domain does, what abilities a class has at a given level, kit stat comparisons).

## SCC (Steel Compendium Classification)

Hierarchical classification system used across all data repos: `source/type/item` (e.g. `mcdm.heroes.v1/abilities.fury/gouge`).
SCC codes are permanent identifiers used as website permalinks (`/scc/{code}/`), API keys, and cross-reference links. The registry is frozen (1,432 codes). See `reference/scc-specification.md` for the full spec.

## Sub-repo CLAUDE.md files

Each sub-repo has its own CLAUDE.md with repo-specific context. When working in a sub-repo, read its CLAUDE.md first.
