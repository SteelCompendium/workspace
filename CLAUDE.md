# Steel Compendium Workspace

Workspace orchestration for the Steel Compendium multi-repo project -- a structured,
searchable reference for the Draw Steel TTRPG by MCDM Productions. This repo holds
workspace-level config (justfile, devbox) and reference docs; all other code lives in
sub-repos cloned via `just clone-all`.

This file is a **router**: current state + pointers only. Depth lives in the linked files —
see "Keeping docs in sync" below for where each kind of fact belongs. Do **not** grow this
file with detail or dated history.

## ⚠️ MUST READ / MUST OBEY before any change

These two rules are non-negotiable. Read them every session; they override convenience.

1. **Start new work from latest `origin/main`, and know your remotes.** Full rules in
   [`docs/git-workflow.md`](docs/git-workflow.md) — read it before branching, committing, or
   pushing. The essentials:
   - Two remotes: `origin` → `SteelCompendium/workspace` (upstream, source of truth — push
     here) and `fork` → `vexa-tski/workspace` (personal fork that lags — **don't**
     rebase/push against it by default; it throws spurious `steel-etl` submodule conflicts).
     `main` tracks `origin`.
   - **Before making changes:** `git fetch origin && git rebase origin/main` (or branch from
     `origin/main`) so you're not building on stale code, then
     `git submodule update --init steel-etl` to sync the submodule working tree.

2. **Never edit generated output.** Never hand-edit files in `data/data-rules/`,
   `data/data-unified/`, `data/data-rules-clean/`, `v2/docs/Browse/`, `v2/docs/Read/`, or
   `v2/docs/scc/` — `steel-etl` overwrites them every build. Content changes go in the book
   sources under `steel-etl/input/` (e.g. `steel-etl/input/heroes/Draw Steel Heroes.md`).

## Dev environment (devbox)

Go, Node, Python, just, etc. are **not** on the system PATH — activate devbox first:

```bash
devbox run -- go build ./...   # prefix any Go/just/node command with `devbox run --`
```

`devbox.json` packages: bash, python, just, jq, yq-go, perl, figlet, nodejs, go (go1.26.1).

## Deploy

```bash
just deploy       # Full pipeline: gen + API + v2 site
just deploy-api   # Pipeline + SCC API only
just deploy-v2    # Pipeline + v2 site only
```

These recipes **regenerate and commit+push the generated output themselves** (v2 `docs/`,
`data/*`, the SCC API) — **never hand-commit generated content.** The full
commit → merge → deploy flow across the `steel-etl` submodule and the independent v2 / data
/ org-site clones (incl. the `chore: bump steel-etl to <sha>` pointer step) is in
[`docs/git-workflow.md`](docs/git-workflow.md) → "Committing, merging & deploying".

Pipeline details, data flow, and editable-vs-generated rules:
[`ARCHITECTURE.md`](ARCHITECTURE.md) — **you must read it** before pipeline/deploy work.

## Layout

- `justfile` -- Workspace recipes (`clone-all`, `deploy`, `deploy-api`, `deploy-v2`)
- `devbox.json` / `devbox.lock` -- Dev environment
- [`ARCHITECTURE.md`](ARCHITECTURE.md) -- Pipeline architecture, data flow, editable vs.
  generated files. You MUST read this.
- [`DESIGN.md`](DESIGN.md) -- UI design language ("High-Fantasy Steel"): look, feel, tokens,
  component map, preference system. Read before any v2 look-and-feel work.
- [`FOLLOWUPS.md`](FOLLOWUPS.md) -- In-scope tangents found mid-task, cleared before starting
  a new feature (numbered `## N.` sections).
- [`ROADMAP.md`](ROADMAP.md) -- New features and larger planned / in-flight efforts
  (numbered `## N.` sections).
- [`docs/`](docs/index.md) -- Workspace-level docs (see [`docs/index.md`](docs/index.md)):
  `git-workflow.md`, `scc-reference.md` (SCC current state), `scc-log.md` (dated SCC
  history), `followups-archive/` + `roadmap-archive/`, `handoffs/` (per-session `HANDOFF.md`;
  see `creating-handoffs` skill), `superpowers/` (workspace-level plans/specs).
- [`reference/`](reference/index.md) -- Draw Steel reference docs, SCC specification, brand
  assets, and `design-system/` (see [`reference/index.md`](reference/index.md)).
- `templates/` -- Repo documentation templates (`repo-docs/`) and `TEMPLATE-GUIDE.md`
- `plans/` -- Architecture and design plans (architecture-redesign, schema-enrichment,
  sdk-schema-alignment)
- `steel-etl/` -- Go CLI tool: the primary ETL pipeline and site builder (own CLAUDE.md)
- `v2/` -- MkDocs Material site; `v2/site.yaml` configures the steel-etl site builder. See
  `v2/.repo-docs/` for detailed architecture docs (incl. the SCC permalink system).
- `data/` -- Generated output repos (`data-rules`, `data-unified`, `data-bestiary`,
  `data-beastheart`, `data-summoner`). Do not edit directly.
- Sub-repos at top level: `compendium/`, `data-gen/`, `data-sdk-npm/`,
  `draw-steel-elements/`, `statblock-adapter-gl-pages/`, `steelCompendium.github.io/`

## SCC (Steel Compendium Classification)

Hierarchical classification used across all data repos: `source/type/item` (e.g.
`mcdm.heroes.v1/feature.ability.fury.level-1/gouge`). Codes are website permalinks
(`/scc/{code}/`), API keys, and cross-reference links. Scheme spec is **v1.1**.

Registry is **~3,012 codes** across four books (heroes ~1,915, beastheart 242, monsters 632,
summoner ~224). `feature` is the umbrella type; companions/fixtures/summoner statblocks all
live in the `monster.*` family.

- **Current-state detail** (taxonomy, companion/fixture/summoner schemes, group landings,
  linking, printing-vs-version): [`docs/scc-reference.md`](docs/scc-reference.md).
- **Dated history** of every change: [`docs/scc-log.md`](docs/scc-log.md).
- **Spec:** `reference/scc-specification.md`.

## Draw Steel TTRPG reference

Four reference docs + the SCC spec live in `reference/` — see
[`reference/index.md`](reference/index.md) for what each covers and reading order. Start with
`reference/draw-steel-overview.md`.

## Keeping docs in sync

**Updating docs is part of "done."** Route every new fact by lifespan into its canonical
home — don't let detail or dated history pool back into this router.

| When you… | Put it in… |
|---|---|
| Change the pipeline / deploy flow / data flow / an output target | [`ARCHITECTURE.md`](ARCHITECTURE.md) (and its diagram) |
| Change the design language (component system, tokens, look-and-feel rule) | [`DESIGN.md`](DESIGN.md) (`reference/design-system/` stays a frozen archive) |
| Change the SCC scheme / registry / linking | append a dated entry to [`docs/scc-log.md`](docs/scc-log.md) **and** update [`docs/scc-reference.md`](docs/scc-reference.md) + the SCC summary above |
| Change the git remotes / branching workflow | [`docs/git-workflow.md`](docs/git-workflow.md) (and the must-obey callout above) |
| Hit a small in-scope tangent (deferred bug/gap) | a numbered `## N.` section in [`FOLLOWUPS.md`](FOLLOWUPS.md); clear before the next feature |
| Plan a new feature or larger effort | a numbered `## N.` section in [`ROADMAP.md`](ROADMAP.md) |
| Write a per-effort plan/spec | the sub-repo's `docs/superpowers/` if confined to one repo; the workspace `docs/superpowers/` if it spans repos or changes a workspace-level contract (SCC scheme, deploy flow, schemas) |
| Write a deep single-topic reference | the owning repo's `docs/` + its `docs/index.md` |
| Find non-obvious "funky logic" (workaround, footgun, magic number) | capture it where it lives: inline comment if local, `ARCHITECTURE.md` / the relevant sub-repo doc if cross-cutting |
| Pause mid-task / hand off | `docs/handoffs/HANDOFF.md` (the `creating-handoffs` skill owns this) |

`FOLLOWUPS.md` / `ROADMAP.md` exist **only at the workspace root** — sub-repos must not grow
their own. Historical (dated) docs stay where they were written; fix routing only going
forward.

**Two structural rules keep this file from rotting:**

- **This file (and each sub-repo's CLAUDE.md) is a router: current state + pointers only,
  never dated history or deep detail.** "On <date> X changed…" belongs in the matching log
  (`docs/scc-log.md`), plan, or ADR; mechanical detail belongs in `docs/` or
  `ARCHITECTURE.md`. If a section here needs a second dated sentence or a paragraph of
  mechanics, it has outgrown the router — move it out and leave a summary + pointer. (This
  file has twice grown a multi-thousand-character SCC history this way.)
- **`FOLLOWUPS.md` / `ROADMAP.md` numbers are permanent IDs — never reused, never
  renumbered.** Each new item takes its number from the `<!-- next-id: N -->` counter in the
  file header (then increments it), never from "highest live item + 1". On a prune pass, move
  completed items to the archive keeping their original number as a `(was #N)` handle and
  leave survivors' numbers untouched (gaps like 1, 2, 5, 8 are expected). A `#N` reference
  then resolves forever — either still live, or in the archive under `(was #N)`.

This repo has **no `CHANGELOG.md`**: it is an orchestration workspace with no release tags —
shipped history is the git log (`chore: bump steel-etl …` commits and v2 deploy commits).

## Sub-repo CLAUDE.md files

Each sub-repo has its own CLAUDE.md with repo-specific context. When working in a sub-repo,
read its CLAUDE.md first.
