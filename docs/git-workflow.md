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
| `draw-steel-elements/` | submodule | **`develop`** (mainline; `main` = RELEASED content only — see below) | `SteelCompendium/draw-steel-elements` |
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

After any pull/rebase that moves recorded pointers, `just sync` brings the submodule working
trees in line with the recorded commits. Skipping this is the usual cause of a "dirty"
submodule entry that looks like an accidental change. `just sync` leaves each submodule on its
**tracked branch** (`main`, or `v3` for `data-sdk-npm` / `data-gen`) at the pinned commit —
fast-forward only, never resetting — so you can edit immediately without the detached-HEAD
footgun (uncommitted work isn't silently wiped by the next update, and commits land on a

### `draw-steel-elements` branching model (SC-163, 2026-08-16)

The DSE plugin repo is the one submodule with a two-branch model, because its docs
(README + `docs/`, deployed to gh-pages by its `ci.yml` **on pushes to `main`** via
`mkdocs gh-deploy`) are user-facing and must describe only *released* behavior:

- **`develop` is the mainline** — every feature branch, worktree landing, and pointer bump
  targets `develop` (`.gitmodules` `branch = develop` makes all the workspace machinery —
  `just sync`, `wt-finish`, `wt-status` — follow it automatically).
- **`main` holds released content only.** It sits at the last released tag (reset to
  `6.0.1` / `0645aca` at the model's introduction; the pre-reset 7.0.0 tip is preserved on
  `develop` and on the `main-7.0-backup` branch). It advances ONLY at a release: Scott
  fast-forwards `main` to the release sha on `develop`
  (`git push origin <release-sha>:refs/heads/main`), which also triggers the docs deploy —
  then tags (his action alone, never an agent's).
- GitHub's default branch stays `main`, so the repo's rendered README/docs are release-true.
- CI: `plugin-ci.yml` runs on pushes to `main` AND `develop` (+ all PRs); the docs-deploy
  `ci.yml` runs on both — `main` → mike `latest`, `develop` → mike `dev` (SC-164).

**Two footguns of this model, both hit on 2026-08-16 (`land-stack` skill has the checks):**

1. **A worktree created BEFORE a tracked-branch change carries the OLD `.gitmodules`.**
   `wt-finish` reads the tracked branch from the *worktree's* superproject file, so an
   old worktree pushes to the old branch. This fast-forwarded dse `main` from 6.0.1 to a
   7.0 sha (recovered with a lease-guarded `push 0645aca:refs/heads/main`). Sync a
   worktree's `.gitmodules` from `origin/main` before its first landing.
2. **Any push to dse `main` runs the ci.yml *at that sha*.** Restoring `main` to 6.0.1
   re-ran the OLD `mkdocs gh-deploy --force`, which overwrote gh-pages and wiped the mike
   layout (recovered with a lease-guarded push of the mike tip back to gh-pages). Until a
   release moves `main` past SC-164, treat every push to `main` — including a restore — as
   a gh-pages wipe, and restore gh-pages from the last mike commit afterward.


branch). The raw `git submodule update --init --recursive` still detaches at the pin; prefer
`just sync`.

## Edit in a worktree, not the shared main checkout

The main checkout is **shared global state** — another agent or session may be working in it
at the same time, and `just deploy*` resets submodules (`git checkout -B main origin/main`),
which silently discards any uncommitted work sitting there. So **edit in an isolated worktree
by default**, and reserve the main checkout for `just sync` and `just deploy*`. (Edit in the
main checkout only when explicitly told to, and only when it is clean — the `deploy*` recipes
now hard-abort on a dirty publish-target tree rather than clobber it.)

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
     Step-by-step landing procedure (pre-flight FF/scope checks, cleanliness, verification,
     teardown): the `land-stack` skill (`.claude/skills/land-stack/`).
   - ⚠️ **Pushing `v2` main IS a deploy.** The v2 repo's CI (`v2/.github/workflows/ci.yml`)
     runs `mkdocs gh-deploy` on every push to main, so landing a v2-only change
     (`docs/javascripts/`, `docs/stylesheets/`, `overrides/`, `mkdocs.yml`) goes live on
     steelcompendium.io/v2 within minutes with **no deploy recipe needed** — verify by
     polling the live asset URL, and give the CHANGELOG entry a dated header, not
     `## Unreleased`. `just deploy-v2` exists to regenerate *content* (steel-etl gen +
     site); run it only when generated output must change.
2. **Record the new submodule pointer(s)** in the workspace (the two-commit rule): after the
   submodule push, `just sync` (or `git submodule update --remote <sub>`), then commit the
   moved pointer with the house pattern **`chore: bump <sub> to <short-sha> (<one-line what>)`**
   and push to `origin`. `wt-finish` and the `deploy*` recipes do this automatically for the
   repos they touch. Workspace-only changes (docs, `justfile`, specs/plans) commit to the
   workspace repo the same way.
3. **Deploy = regenerate + commit generated output + bump pointers.** `just deploy` (or
   `deploy-v2` / `deploy-api`) **must run from a clean `main` checkout** — each recipe first
   calls `_require-clean` on its publish targets (`steel-etl` + `v2` / `steelCompendium.github.io`)
   and **hard-aborts if any has uncommitted changes**, so a concurrent agent's WIP can't be
   silently clobbered by the reset. From a clean checkout it runs `steel-etl gen --all`,
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

### Post-deploy incidental churn (restore, don't commit)

After a clean `just deploy-v2` the working tree shows two dirty entries that are **not**
part of the deploy and must be discarded:

- ` M devbox.lock` — devbox rewrites `plugin_version` fields at startup. Environment
  noise: `git restore devbox.lock`. (The v2 submodule has its own `devbox.lock` that
  gets the same treatment after in-worktree builds.)
- ` M steelCompendium.github.io` — `gen --all` regenerates the SCC API, rewriting only
  the `generated:` timestamps in `docs/api/v1/{index,scc}.json`. Only `deploy-api` /
  `deploy` commit the API; restore it after `deploy-v2`:
  `git -C steelCompendium.github.io restore docs/api/v1/index.json docs/api/v1/scc.json`.

**Chicken-and-egg with the clean-guards:** every `devbox run -- …` re-dirties
`devbox.lock` at devbox startup, *before* your command runs — so a naive
`devbox run -- just wt-finish` (or `deploy-v2`) can abort with "dirty checkout" right
after you restored the lock. Fix: restore and run the guarded recipe in the SAME
activated shell: `devbox run -- bash -c 'cd <workspace> && git checkout -- devbox.lock && just wt-finish <name>'`
— the inner `just` runs inside the active env and triggers no second lock rewrite.

**If the v2 remote advanced under a deploy of generated artifacts:** don't 3-way merge
regenerated `docs/` — `git reset --hard origin/main`, regenerate fresh, then commit.
