# Git remotes & syncing

> **The must-obey essentials are mirrored in `CLAUDE.md` → "MUST READ / MUST OBEY"** so they
> load every session. This file is the full version — read it before branching, committing,
> or pushing. If the workflow changes, update **both** this file and that callout.

## Remotes

Two remotes; `main` **tracks `origin`** (a bare `git push` / `git pull` goes there):

- `origin` → `SteelCompendium/workspace` — the upstream org repo. **This is the source of
  truth; push here.**
- `fork` → `vexa-tski/workspace` — a personal fork that runs behind. **Don't rebase/push
  against it by default** — `fork/main` lags the submodule bumps and will throw spurious
  `steel-etl` submodule conflicts.

## Always start new work from latest `origin/main`

So you're never building on stale code:

```bash
git fetch origin && git rebase origin/main   # or branch from origin/main
git submodule update --init steel-etl        # sync the submodule working tree
```

The repo carries the `steel-etl` **submodule**, so after any pull/rebase that moves the
recorded pointer, run `git submodule update --init steel-etl` to bring the working tree in
line with the recorded commit. Skipping this is the usual cause of a "dirty" `steel-etl`
entry that looks like an accidental change.

## Why the fork lags

`fork/main` does not carry the latest `steel-etl` submodule bumps. Rebasing or pushing
against it surfaces submodule conflicts that don't exist against `origin`. Treat `fork` as
read-mostly; default all sync operations to `origin`.

## Repo topology (who owns what)

The workspace dir holds **one submodule** and several **independent clones** (cloned by
`just clone-all`, gitignored by the workspace — `git check-ignore v2 data` confirms):

| Path | Kind | Tracked by workspace? | Push target |
|---|---|---|---|
| `steel-etl/` | **submodule** (`.gitmodules`) | yes — as a recorded commit pointer | `SteelCompendium/steel-etl` |
| workspace root (`justfile`, `docs/`, `devbox*`, `*.md`, `plans/`, `reference/`) | the workspace repo itself | yes | `SteelCompendium/workspace` (`origin`) |
| `v2/` | independent clone | no (gitignored) | `SteelCompendium/v2` |
| `data-sdk-npm/` | independent clone — **on the `v3` branch** (canonical), holds the published JSON-schema copy | no (gitignored) | `SteelCompendium/data-sdk-npm` (`origin`) |
| `steelCompendium.github.io/` | independent clone | no | the org pages repo |
| `data/data-{rules,bestiary,unified}/` | independent clones (published output) | no | their own origins |

So a single change set can touch **three+ separate repos**, each pushed on its own.

**`data/` mixes published clones with local-only output.** Only
`data/data-{rules,bestiary,unified}` are clones with their own `.git` (the deploy commits to
them); `data/data-{summoner,beastheart}` and `data/data-rules-clean` are local-only build
output with no remote. So `rm -rf data` destroys the three clones' `.git`; restore them with
`just clone-all` **before** re-running `gen`. (`clone-all` clones a `data/<repo>` only when the
dir is absent — once `gen` has recreated it as a non-empty dir without `.git`, the clone fails
with `destination path already exists and is not an empty directory`, so `rm -rf` that dir
first.)

## Committing, merging & deploying

Route each change to its repo, then integrate in this order. **Generated output is
committed by the `just deploy*` recipes — never hand-commit it** (see below).

1. **steel-etl code** → branch in `steel-etl/`, PR to `SteelCompendium/steel-etl`, merge to
   its `main`. (steel-etl is the source of truth for the pipeline + site builder.)
   - **If the change edits `steel-etl/schemas/*.schema.json`,** the identical edit must also
     land in `data-sdk-npm/src/schema/*.schema.json` **on the `v3` branch** and be committed +
     pushed in that repo (its own `origin`). The two copies are hand-synced with nothing
     enforcing agreement — see [`ARCHITECTURE.md`](../ARCHITECTURE.md) → "Schemas: two
     hand-synced copies". The steel-etl copy ships with the steel-etl PR; the SDK copy ships
     from the `data-sdk-npm` clone.
2. **Record the new submodule pointer** in the workspace: after the steel-etl merge,
   `cd steel-etl && git fetch origin && git checkout origin/main` (or `git submodule update
   --remote steel-etl`), then in the workspace root commit the moved pointer with the
   house pattern **`chore: bump steel-etl to <short-sha> (<one-line what>)`** and push to
   `origin`. Workspace-only changes (docs, `justfile`, specs/plans, `ROADMAP.md`) commit to
   the workspace repo the same way.
3. **Hand-authored `v2/` source** (e.g. `site.yaml`, `docs/javascripts/`,
   `docs/stylesheets/`, `overrides/`, `static_content/`, `mkdocs.yml`) → commit + push in
   the `v2/` repo. These are inputs, not generated output.
4. **Deploy = regenerate + commit generated output.** `just deploy` (or `deploy-v2` /
   `deploy-api`) runs `steel-etl gen --all`, builds the site (`steel-etl site`), stamps
   `mkdocs.yml` with the steel-etl sha, then
   **commits and pushes** the generated trees itself:
   - `v2`: `git add docs/* mkdocs.yml` → `chore: update v2 site content (steel-etl <sha>)`
   - `data/data-{bestiary,rules,unified}`: `chore: update generated data (steel-etl <sha>)`
   - `steelCompendium.github.io` (`deploy`/`deploy-api`): `chore: update SCC resolution API`

**Do not hand-commit generated content** (`v2/docs/Browse`, `v2/docs/Read`, `v2/docs/scc`,
`data/*`, `steelCompendium.github.io/docs/api`). Running `steel-etl site` by hand and
committing `docs/Browse` skips the `mkdocs.yml` stamp, producing
a partial tree that diverges from a real deploy. Build by hand only to **verify** a change
(then `git restore`/leave uncommitted); let `just deploy*` produce the committed output
once the steel-etl change is merged. The recipes are idempotent (`commit … || echo "no
changes"`), so a deploy with nothing to ship is a safe no-op.
