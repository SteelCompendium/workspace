# Submodules + Worktrees: Scalable Multi-Repo Workspace — Design

**Date:** 2026-06-20
**Status:** Design (awaiting review)
**Scope:** Workspace-level contract change (repo wiring, branching/worktree workflow,
deploy flow, devbox/justfile recipes, agent-facing docs). Spans all sub-repos.

## 1. Problem & goals

The workspace is a multi-repo project, but its repos are wired inconsistently:

- `steel-etl` is the **only** git submodule (pinned, bumped via `chore: bump steel-etl`).
- Every other sub-repo is an **independent `.gitignore`d clone**, materialized by
  `just clone-all`. The workspace has no idea what version of `v2`, `data-sdk-npm`, etc.
  it has.

This blocks two things the user wants:

1. **Parallel agents on one machine** without stepping on each other — i.e. git
   **worktrees**. But a worktree of the workspace today would be nearly empty of the repos
   that actually get edited (`v2`, etc.), because they're gitignored, not part of the tree.
2. **Coherent state across 3 machines** that share no filesystem and reconcile only through
   GitHub. Today "what state is machine 2 in?" has no single answer.

### Goals

- Make the workspace a **superproject** that pins a coherent set of authored sources, so one
  ref describes the whole source tree.
- Enable **isolated per-agent environments** via worktrees, each reproducing the full
  sibling layout the pipeline expects, with independent branches and isolated generated
  output.
- Keep the one dangerous shared operation — **deploy/publish** — serialized on `main`.
- Replace stale tooling (`clone-all`, etc.) rather than accrete around it.

### Constraints (established during brainstorming)

- **Dominant task spans repos**: workspace docs + `steel-etl` change → regenerates `data/`
  consumed by `v2` and the data repos. Occasional tiny single-repo changes (a v2
  stylesheet).
- **3 machines, no shared filesystem**, driven via SSH; sync only through GitHub.
- **Parallelism is same-machine**: multiple agents/sessions on one box (the case worktrees
  solve). Cross-machine isolation is inherent.
- **`data/` consolidation is in flight** on another machine (the `data-*` repos are going
  3 → 1 into `data-unified`). The design must not touch `data/` wiring.
- **Solo, no self-PRs**: the user reviews locally (sometimes deploys v2 to localhost) and
  merges directly to `main`. External contributors (e.g. localization) may use PRs; that
  does not affect this tooling.
- **`main` is special**: the only branch that publishes the site, and (future) the only one
  that cuts non-prerelease semver tags + artifacts for the data repos.

## 2. Decision: repo wiring

> **Rule: every authored repo is a submodule; only `data/` floats** (it is pure build
> product, fully determined by `steel-etl SHA + input SHA`).

### Pinned as submodules (authored sources)

| Repo | Notes |
|---|---|
| `steel-etl` | already a submodule; no change |
| `v2` | authored shell (CSS/JS/overrides/config) must stay coordinated with steel-etl; generated `docs/` also lives here but the authored core wins the classification |
| `steelCompendium.github.io` | same shape as `v2`: authored index page + generated `docs/api`; treated as a source |
| `data-sdk-npm` | authored, warm |
| `data-gen` | authored but **deprecated/frozen** (steel-etl is its rewrite); pinned at current state |
| `compendium` | authored, cold |
| `draw-steel-elements` | authored, cold |
| `statblock-adapter-gl-pages` | authored, cold |

### Floating / not pinned (regenerable)

- **All of `data/`** — treated wholesale as per-environment scratch that `gen` rebuilds.
  We deliberately do **not** worktree individual `data-*` repos; this sidesteps the in-flight
  3 → 1 consolidation entirely. Stays `.gitignore`d.

### Why generated repos are *not* submodules

Pinning a build product is all cost, no benefit: the pointer records nothing not already
implied by the source pins; it churns on every `gen`; it can drift into self-contradiction
(snapshot says one thing, regeneration yields another); and it adds worktree weight for
trees you immediately overwrite. (`steelCompendium.github.io` *is* pinned despite holding
generated `docs/api`, because — like `v2` — it has a genuine authored core.)

### Why this works without config changes

`pipeline.yaml` and `site.yaml` reference siblings by **relative path** (`../data/...`,
`../v2/site.yaml`, `../steelCompendium.github.io/docs/api`). As long as an environment
reproduces the **sibling layout** (a root containing `steel-etl/ v2/ data/
steelCompendium.github.io/ …` as children), every path resolves *inside that env* with zero
config edits. Submodules supply the source siblings; the env-setup recipe materializes the
generated siblings (`data/`, the org-site output dir) as empty scratch dirs so `gen` can run.

## 3. Worktree environment model

An **environment** = one worktree of the workspace superproject, with its submodules
checked out on per-env branches, plus empty scratch dirs for generated output. Each agent
gets its own; they share git history (cheap) but have fully independent working files and
branches.

### Layout

Worktrees live in a sibling directory so they never nest inside the main checkout:

```
steel_compendium/
  workspace/                 # main checkout, normally on main
  worktrees/
    fix-tooltips/            # env for agent A
      steel-etl/  v2/  ...   # submodules, on branch fix-tooltips
      data/                  # empty scratch; gen fills it
    bestiary-pass/           # env for agent B
      ...
```

### Recipes

- **`just wt-new <name>`**
  1. `git worktree add ../worktrees/<name> -b <name>` (branch off current `main`).
  2. `git -C ../worktrees/<name> submodule update --init --recursive` (checks out every
     submodule at the pinned SHA).
  3. In each submodule, create + check out a branch `<name>` so agents **never edit in
     detached HEAD** (the chief submodule footgun). Untouched submodules simply accrue no
     commits.
  4. `mkdir -p` the scratch `data/` and any pipeline output dirs.
  5. Print the env path.
- **`just wt-rm <name>`** — guard against uncommitted/unpushed work, then remove the
  worktree, prune, and delete the per-env submodule branches.
- **`just wt-status <name>`** — show, across the superproject and every submodule, which are
  ahead of their tracked branch and which have pending pointer bumps (makes the two-commit
  rule visible).
- **`just wt-finish <name>`** — see §4.

### The two-commit rule (the core submodule concept to internalize)

Editing a submodule is **two commits**: first commit *inside* the submodule (e.g. in `v2`),
then a commit in the **superproject** recording the new pointer. That second commit is what
makes the env branch a coherent snapshot of "these exact sub-repo versions together." It is
the same `chore: bump steel-etl` dance already in use, now applied per submodule. `wt-status`
and lazygit's Submodules panel surface it so it is never a surprise.

## 4. The `main` / deploy model

`main` is the only branch that publishes; deploy is serialized there. Two phases:

### Finishing an env's work — `just wt-finish <name>`

Direct-to-`main`, no PRs (matches solo workflow):

1. For each submodule with commits on the env branch: merge that branch into the
   submodule's tracked branch locally and push to `origin`. Submodules with no commits are
   skipped.
2. In the workspace env branch: update each submodule pointer to the landed commit, commit
   the coherent bump, merge into workspace `main`, push.
3. `just wt-rm <name>`.

`wt-finish` mainly automates the tedious pointer-bump bookkeeping; the merges can also be
done by hand in lazygit.

### Deploying — `just deploy` (run from a clean `workspace` on `main`, never from an env)

Regenerate `data/` fresh, publish the v2 site + org-site, and (future) cut data semver
tags/artifacts. Adapted from today's recipe to bump submodule pointers as part of the flow.
Feature branches in envs may run `gen` to verify but write only to their scratch `data/` and
**never publish** — so N parallel agents structurally cannot collide on deploy.

## 5. Multi-machine sync

No shared filesystem; machines reconcile only through GitHub. Submodules make this a single
lockstep operation.

- **First-time setup on a machine:**
  `git clone --recurse-submodules git@github.com:SteelCompendium/workspace.git`
  (replaces `clone-all`'s top-level loop).
- **Day-to-day — `just sync`:**
  `git pull && git submodule update --init --recursive` — a pull moves every sub-repo to its
  matching pinned version in lockstep.
- **Detached HEAD is normal** after `submodule update` (consuming a pinned version). You only
  branch when editing — which `wt-new` does for you. Documented prominently so it is never
  alarming.
- **`fork` remote removed.** The `vexa-tski` fork existed only before `vexa` became a
  SteelCompendium contributor; it lags and throws spurious submodule conflicts. Remove it
  from the workspace and every submodule, leaving `origin` → SteelCompendium as the sole
  remote. Strip the "two remotes" section from CLAUDE.md / `docs/git-workflow.md`.
- All submodule URLs use SSH (`git@github.com:...`) to match how all 3 machines authenticate.

## 6. Tooling (light touch)

Mechanics solid and legible; no opinionated editor config baked in (preferences still
forming).

- **lazygit** — primary learning aid. Its **Worktrees panel** (create/switch/remove) and
  **Submodules panel** (enter a submodule, see pointer ahead/behind, stage the bump) make
  the two-commit rule *visible*. The cheatsheet documents the exact keys.
- **zellij** — one tab/session per env keeps agents visually separated. `wt-new` may
  optionally open a zellij tab named `<name>`, cd'd into the env, with an editor/agent/lazygit
  pane split, provided as an optional **layout file** (not a hard dependency).
- **nvim/lazyvim** — open nvim at the **env root**; it sees all sibling repos at once. No
  forced config; git signs respect submodule boundaries.

## 7. Migration plan

Done **incrementally on a workspace branch**, verifying `gen` + site build after each step,
then merged to `main`. It rewires only *source* repos and never touches `data/`, so it will
not collide with the data-unified consolidation on the other machine.

### Pre-flight (safety)

- Discard `steelCompendium.github.io`'s 44 generated `docs/api` changes (regenerated by
  deploy; no real work lost).
- Switch `draw-steel-elements` off `repo-docs` onto `main` before pinning. (Follow-up the
  user owns: review/merge/delete the unmerged `repo-docs` branch — not a migration blocker.)
- Confirm every source repo is clean and its target commit is pushed to `origin` (a
  submodule pins a SHA that must exist upstream).

### Per-repo conversion (repeat for the 7 non-steel-etl sources)

1. Ensure committed + pushed at the intended branch tip.
2. Register as a submodule pinned to that SHA, tracking the correct branch in `.gitmodules`.
3. Remove its entry from `.gitignore`.
4. Run `gen` / site build → confirm nothing broke.

### Tracked branches

| Repo | Tracked branch |
|---|---|
| `steel-etl`, `v2`, `steelCompendium.github.io`, `compendium`, `statblock-adapter-gl-pages` | `main` |
| `data-sdk-npm` | `v3` (active mainline; `main` = deprecated v2 line) |
| `data-gen` | `v3` (current checkout; deprecated/frozen, low-stakes) |
| `draw-steel-elements` | `main` |

### Workspace-level cleanup (recipes are fair game to rewrite/remove)

- Replace `clone-all`'s top-level loop with submodule init; keep `/data/` gitignored and
  regenerated.
- Add `wt-new` / `wt-rm` / `wt-status` / `wt-finish` / `sync`.
- Adapt `deploy` to bump submodule pointers.
- Remove the `fork` remote (workspace + submodules).

## 8. Documentation deliverables

- **`docs/worktrees-and-submodules.md`** — a learning-oriented cheatsheet: everyday commands,
  the two-commit rule, detached-HEAD-and-how-to-avoid-it, updating an env after `main` moved,
  cleanup, and the relevant lazygit keys. Written for someone learning these tools.
- **Agent-facing docs** — run the `documenting-repos-for-agents` skill to update the CLAUDE.md
  router and `docs/git-workflow.md` for the submodule + worktree model (and remove the
  obsolete two-remotes section).

## 9. Risks & open items

- **Worktree + submodule friction.** Each worktree needs its own `submodule update --init`;
  per-env submodule branches must be cleaned up by `wt-rm`. Mitigated by wrapping in recipes.
- **Pointer-bump ceremony extends to `v2`** (the second-hottest repo). Accepted: already paid
  for steel-etl; `wt-finish`/`deploy` automate the bookkeeping; buys multi-machine coherence.
- **Coordination with the in-flight data consolidation** — mitigated by leaving `data/`
  untouched, but the other machine should `sync` after this lands.
- **`data-gen` tracked branch** pinned to its current `v3` checkout; revisit if the repo's
  canonical branch is later normalized.

## 10. Out of scope (YAGNI)

- Converting `data/` repos to submodules (pure build product; consolidation in flight).
- PR-based finishing flow (solo, direct-merge today; revisit if/when contributors grow).
- Opinionated nvim/lazyvim or lazygit config beyond the cheatsheet.
- Splitting generated `docs/` out of `v2` / org-site (separate existing decision).
- Normalizing `data-sdk-npm` / `data-gen` branch names (user-owned, separate work).
