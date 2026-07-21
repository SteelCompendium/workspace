# Steel Compendium Workspace

Workspace orchestration for the Steel Compendium multi-repo project -- a structured,
searchable reference for the Draw Steel TTRPG by MCDM Productions. This repo holds
workspace-level config (justfile, devbox) and reference docs; all other authored code lives
in sub-repos pinned as **git submodules** (clone with `--recurse-submodules`, or run
`just bootstrap`). Generated `data/` is not pinned — the pipeline regenerates it.

This file is a **router**: current state + pointers only. Depth lives in the linked files —
see "Keeping docs in sync" below for where each kind of fact belongs. Do **not** grow this
file with detail or dated history.

## ⚠️ MUST READ / MUST OBEY before any change

These rules are non-negotiable. Read them every session; they override convenience.

1. **Do your editing in an isolated worktree — not the shared main checkout.**
   This checkout is **shared global state**: another agent or session may be working in it
   right now, and `just deploy*` resets submodules to `origin/main`
   (`git checkout -B main origin/main`), which **silently discards any uncommitted work**
   sitting here. So **before editing any submodule file**, make your own environment:

   ```bash
   just wt-new <name>      # ../worktrees/<name>: isolated worktree, every submodule on branch <name>
   # …edit / verify there…
   just wt-finish <name>   # land it: pushes each touched submodule + the superproject pointer
   ```

   **Reserve the main checkout for `just sync` and `just deploy*` only.** Edit directly in the
   main checkout *only* if the user explicitly tells you to — and even then, first confirm it
   is clean (`git status`; the `deploy*` recipes now hard-abort on a dirty tree rather than
   clobber it). Full guide: [`docs/worktrees-and-submodules.md`](docs/worktrees-and-submodules.md).

2. **Start new work from latest `origin/main`; the workspace is a submodule superproject.**
   Full rules in [`docs/git-workflow.md`](docs/git-workflow.md) — read it before branching,
   committing, or pushing. The essentials:
   - One remote everywhere: `origin` → `SteelCompendium/<repo>` (source of truth — push here).
     `main` tracks `origin`. There is **no `fork` remote** anymore.
   - **Before making changes:** `git fetch origin && git rebase origin/main` (or branch from
     `origin/main`), then `just sync` to move the submodules to their pinned commits.
   - Editing a submodule is **two commits** (commit inside the submodule, then commit the
     superproject pointer bump). `just wt-finish` does both for an env (rule 1).

3. **Never edit generated output.** Never hand-edit files in `data/data-unified/`,
   `v2/docs/Browse/`, `v2/docs/Read/`, or `v2/docs/scc/` — `steel-etl` overwrites them every
   build. Content changes go in the book sources under `steel-etl/input/` (e.g.
   `steel-etl/input/heroes/Draw Steel Heroes.md`).

## Dev environment (devbox)

Go, Node, Python, just, etc. are **not** on the system PATH — activate devbox first.
`devbox run --` executes from the **devbox project root (the workspace)**, which has no
`go.mod`, and it ignores the surrounding shell's `cd` — so always wrap with `bash -c`:

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./...'
devbox run -- just <recipe>        # just recipes are fine bare (they cd themselves)
```

Caveat: `$PIPESTATUS` / `${var:-x}` substitutions break under devbox's `sh` wrapper —
use plain forms. `devbox.json` packages: bash, python, just, jq, yq-go, perl, figlet,
nodejs, go (go1.26.1).

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

- `justfile` -- Workspace recipes (`bootstrap`, `sync`, `wt-new`/`wt-rm`/`wt-status`/`wt-finish`, `deploy`, `deploy-api`, `deploy-v2`)
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
  `git-workflow.md`, `worktrees-and-submodules.md` (submodule + worktree cheatsheet),
  `scc-reference.md` (SCC current state), `scc-log.md` (dated SCC history),
  `followups-archive/` + `roadmap-archive/`, `handoffs/` (per-session `HANDOFF.md`; see
  `creating-handoffs` skill), `superpowers/` (workspace-level plans/specs).
- [`reference/`](reference/index.md) -- Draw Steel reference docs, SCC specification, brand
  assets, and `design-system/` (see [`reference/index.md`](reference/index.md)).
- `templates/` -- Repo documentation templates (`repo-docs/`) and `TEMPLATE-GUIDE.md`
- `plans/` -- Architecture and design plans (architecture-redesign, schema-enrichment,
  sdk-schema-alignment)
- `steel-etl/` -- Go CLI tool: the primary ETL pipeline and site builder (own CLAUDE.md)
- `v2/` -- MkDocs Material site; `v2/site.yaml` configures the steel-etl site builder. See
  `v2/.repo-docs/` for detailed architecture docs (incl. the SCC permalink system).
- `data/` -- The single generated output repo `data-unified` (the consolidated product).
  Layout: `en/unified/<format>/` (Browse: everything aggregated by type, all formats) and
  `en/books/<book>/<format>/` (Read: book-faithful — `heroes`, `monsters`, `beastheart`,
  `summoner`; all six formats + `clean`). `<locale>` is the top segment (i18n-ready). Do not
  edit directly.
- Sub-repos at top level: `compendium/`, `data-gen/`, `data-sdk-npm/`,
  `draw-steel-elements/`, `statblock-adapter-gl-pages/`, `steelCompendium.github.io/`

## SCC (Steel Compendium Classification)

Hierarchical classification used across all data repos: `source/type/item` (e.g.
`mcdm.heroes.v1/feature.ability.fury.level-1/gouge`). Codes are website permalinks
(`/scc/{code}/`), API keys, and cross-reference links. Scheme spec is **v1.1**.

Registry is **~3,080 codes** across four books (heroes ~1,950, beastheart 241, monsters 662,
summoner 227). `feature` is the umbrella type; companions/fixtures/**retainers**/summoner
statblocks all live in the `monster.*` family. Monsters-book retainers are
`monster.retainer.statblock/<id>` with coded `advancement-features`/`role-advancement`
container siblings (Plan 6, 2026-06-18; per-ability coding deferred — ROADMAP #15). The
summoner retainer (Devil Detective) is modeled like the Rival Summoner (2026-06-21):
`monster.retainer.statblock/devil-detective` + a shared
`monster.retainer.advancement-features/devil-detective`, with its summons nested as
`monster.retainer.summoner.minion.statblock/<id>` (off the index); rival summons gained the
same `.statblock` segment. The 4
summoner fixtures' advancement members are coded `feature.fixture.<category>.<base>.level-N/<member>`
(×12, 2026-06-19 — ROADMAP #16; parser-emitted coded children, no heading/cap change). Gods and
saints live in the `religion.*` family (`religion.god/<id>`, `religion.saint/<id>`;
`religion.domain`/`order`/`pantheon` reserved).

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

**All agent knowledge lives in the repo — never in machine-local memory.** Scott works
across multiple computers, so anything saved to a per-machine agent memory/state store is
invisible everywhere else. Persist working preferences, footguns, and project facts as
repo docs using the routing table below (collaboration preferences →
[`docs/working-preferences.md`](docs/working-preferences.md)).

| When you… | Put it in… |
|---|---|
| Change the pipeline / deploy flow / data flow / an output target | [`ARCHITECTURE.md`](ARCHITECTURE.md) (and its diagram) |
| Change the design language (component system, tokens, look-and-feel rule) | [`DESIGN.md`](DESIGN.md) (`reference/design-system/` stays a frozen archive) |
| Change the SCC scheme / registry / linking | append a dated entry to [`docs/scc-log.md`](docs/scc-log.md) **and** update [`docs/scc-reference.md`](docs/scc-reference.md) + the SCC summary above |
| Change the git remotes / branching workflow | [`docs/git-workflow.md`](docs/git-workflow.md) (and the must-obey callout above) |
| Learn a working preference of Scott's or a cross-cutting collaboration convention | [`docs/working-preferences.md`](docs/working-preferences.md) |
| Hit a small in-scope tangent (deferred bug/gap) | a numbered `## N.` section in [`FOLLOWUPS.md`](FOLLOWUPS.md); clear before the next feature |
| Plan a new feature or larger effort | a numbered `## N.` section in [`ROADMAP.md`](ROADMAP.md) |
| Ship a user-facing change (site feature/fix, API change) | a bullet under `## Unreleased` in [`CHANGELOG.md`](CHANGELOG.md); promote to a dated header at deploy |
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

Shipped history lives in [`CHANGELOG.md`](CHANGELOG.md) (added 2026-07-02; entries are
headed by **deploy date** — this workspace has no release tags, so a "release" is a
deploy of the live site / SCC API). New user-facing work goes under `## Unreleased`
and is promoted to a dated header when deployed. Mechanical deploy history remains
the git log (`chore: bump steel-etl …` / v2 deploy commits) — the changelog carries
the user-facing story, not every pointer bump.

## Sub-repo CLAUDE.md files

Each sub-repo has its own CLAUDE.md with repo-specific context. When working in a sub-repo,
read its CLAUDE.md first.
