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
