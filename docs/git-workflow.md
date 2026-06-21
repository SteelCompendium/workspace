# Git remotes & syncing

> **The must-obey essentials are mirrored in `CLAUDE.md` → "MUST READ / MUST OBEY"** so they
> load every session. This file is the full version — read it before branching, committing,
> or pushing. If the workflow changes, update **both** this file and that callout.

## Remotes

**One remote everywhere.** `main` tracks `origin`:

- `origin` → `SteelCompendium/<repo>` — the upstream org repo. **This is the source of truth;
  push here.** Every submodule has the same single `origin` remote.

There is **no `fork` remote** anymore (the `vexa-tski` fork existed only before `vexa` became
a SteelCompendium contributor). If an old clone on another machine still has one,
`git remote remove fork`.

## The workspace is a submodule superproject

The workspace pins exact commits of the **authored** sub-repos as git submodules; only
**generated `data/`** floats (it is `.gitignore`d and rebuilt by the pipeline).

| Path | Kind | Tracked branch | Push target |
|---|---|---|---|
| `steel-etl/` | submodule | `main` | `SteelCompendium/steel-etl` |
| `v2/` | submodule | `main` | `SteelCompendium/v2` |
| `steelCompendium.github.io/` | submodule | `main` | the org pages repo |
| `compendium/` | submodule | `main` | `SteelCompendium/compendium` |
| `draw-steel-elements/` | submodule | `main` | `SteelCompendium/draw-steel-elements` |
| `statblock-adapter-gl-pages/` | submodule | `main` | `SteelCompendium/statblock-adapter-gl-pages` |
| `data-sdk-npm/` | submodule | **`v3`** (canonical; `main` = deprecated v2 line) | `SteelCompendium/data-sdk-npm` |
| `data-gen/` | submodule | **`v3`** (deprecated/frozen) | `SteelCompendium/data-gen` |
| workspace root (`justfile`, `docs/`, `devbox*`, `*.md`, `plans/`, `reference/`) | the workspace repo | `main` | `SteelCompendium/workspace` (`origin`) |
| `data/` | **floating, gitignored** | — | regenerated scratch (not pinned) |

One workspace commit therefore pins a **coherent snapshot** of every source repo — `git pull`
brings them all to matching versions in lockstep.

> **`data/` output repo.** There is a single consolidated published data repo,
> `data/data-unified` (`en/books/<book>/` for Read + `en/unified/` for Browse). `just bootstrap`
> clones it; `just deploy` commits and pushes it. The rest of `data/` is pure regenerable
> scratch the pipeline rewrites each run. `data-unified` is a normal clone, **not** a submodule
> (it is generated output, not authored source).

## First-time setup on a machine

    git clone --recurse-submodules git@github.com:SteelCompendium/workspace.git
    cd workspace && just bootstrap   # idempotent: submodule init + data/ scratch

## Always start new work from latest `origin/main`

So you're never building on stale code:

```bash
git fetch origin && git rebase origin/main   # or branch from origin/main
just sync                                     # pull + move submodules to pinned commits
```

After any pull/rebase that moves recorded pointers, `just sync` (or
`git submodule update --init --recursive`) brings the submodule working trees in line with the
recorded commits. Skipping this is the usual cause of a "dirty" submodule entry that looks
like an accidental change. Submodules end in **detached HEAD** at the pinned commit — that is
normal for *consuming* a version; you only branch when *editing* (see below).

## Parallel work — worktree environments

For isolated, parallel work (multiple agents/tasks on one machine), use a worktree
environment instead of editing the main checkout:

```bash
just wt-new <name>      # ../worktrees/<name>: workspace worktree + submodules on branch <name>
# ... edit, run gen to verify (writes to the env's own scratch data/) ...
just wt-finish <name>   # land it (PUBLISHES — see below)
just wt-rm <name>       # tear down
```

Full command reference, the two-commit rule, and gotchas:
[`worktrees-and-submodules.md`](worktrees-and-submodules.md).

## The two-commit rule

Editing a submodule is **two commits**: first commit *inside* the submodule, then a commit in
the **superproject** recording the new pointer (`git add <submodule>`). The second commit is
what makes a workspace commit a coherent snapshot. `just wt-status <name>` and lazygit's
Submodules panel surface pending pointer bumps.

## Committing, merging & deploying

Route each change to its repo, then integrate. **Generated output is committed by the
`just deploy*` recipes — never hand-commit it** (see below).

1. **Source change in a submodule** (e.g. `steel-etl` code, hand-authored `v2/` source like
   `site.yaml` / `docs/javascripts/` / `docs/stylesheets/` / `overrides/` / `mkdocs.yml`) →
   commit in that submodule on a branch, merge to its tracked branch (`main`, or `v3` for
   `data-sdk-npm` / `data-gen`), and push to its `origin`.
   - **If the change edits `steel-etl/schemas/*.schema.json`,** the identical edit must also
     land in `data-sdk-npm/src/schema/*.schema.json` **on the `v3` branch** and be committed +
     pushed there. The two copies are hand-synced with nothing enforcing agreement — see
     [`ARCHITECTURE.md`](../ARCHITECTURE.md) → "Schemas: two hand-synced copies".
   - From a worktree env, `just wt-finish <name>` does all of this (pushes each touched
     submodule's branch onto its tracked branch on origin), **and** lands the superproject.
2. **Record the new submodule pointer(s)** in the workspace (the two-commit rule): after the
   submodule push, `just sync` (or `git submodule update --remote <sub>`), then commit the
   moved pointer with the house pattern **`chore: bump <sub> to <short-sha> (<one-line what>)`**
   and push to `origin`. `wt-finish` and the `deploy*` recipes do this automatically for the
   repos they touch. Workspace-only changes (docs, `justfile`, specs/plans, `ROADMAP.md`)
   commit to the workspace repo the same way.
3. **Deploy = regenerate + commit generated output + bump pointers.** `just deploy` (or
   `deploy-v2` / `deploy-api`), run from a clean `main` checkout, runs `steel-etl gen --all`,
   builds the site, stamps `mkdocs.yml` with the steel-etl sha, then **commits and pushes**
   the generated trees and **bumps the submodule pointers**:
   - `v2`: `chore: update v2 site content (steel-etl <sha>)` + v2 pointer bump
   - `steelCompendium.github.io`: `chore: update SCC resolution API` + org-site pointer bump
   - `data/data-{bestiary,rules,unified}` (if present): `chore: update generated data (...)`
   - workspace: `chore: bump submodule pointers (deploy <sha>)`

**Do not hand-commit generated content** (`v2/docs/Browse`, `v2/docs/Read`, `v2/docs/scc`,
`data/*`, `steelCompendium.github.io/docs/api`). Build by hand only to **verify** a change
(then `git restore`/leave uncommitted); let `just deploy*` produce the committed output once
the source change is merged. The recipes are idempotent (`commit … || echo "no changes"`), so
a deploy with nothing to ship is a safe no-op.
