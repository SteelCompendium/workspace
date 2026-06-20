# Workspace docs

Workspace-level documentation, one topic per file. Sub-repo-specific docs live in the
sub-repos (`steel-etl/docs/`, `v2/.repo-docs/`); routing rules are in
[`CLAUDE.md`](../CLAUDE.md) → "Keeping docs in sync".

- [`git-workflow.md`](git-workflow.md) — git remotes, branching from `origin/main`, and the
  submodule superproject sync (must-obey essentials mirrored in `CLAUDE.md`)
- [`worktrees-and-submodules.md`](worktrees-and-submodules.md) — cheatsheet for the submodule
  superproject + per-agent worktree environments (commands, the two-commit rule, gotchas)
- [`scc-reference.md`](scc-reference.md) — SCC **current state**: taxonomy, companion/fixture/
  summoner schemes, group landings, linking, printing-vs-version
- [`scc-log.md`](scc-log.md) — **dated history** of SCC scheme/registry/linking changes
  (current state lives in `scc-reference.md`; the short summary in `CLAUDE.md` → "SCC")
- [`followups-archive/`](followups-archive/) — completed `FOLLOWUPS.md` items, pruned
  per cleanup pass; titles keep their "was FOLLOWUPS #N" handles
- [`roadmap-archive/`](roadmap-archive/) — completed `ROADMAP.md` items, same scheme
- [`handoffs/`](handoffs/) — per-session "you are here" handoffs (`HANDOFF.md`);
  ephemeral, owned by the `creating-handoffs` skill
- [`superpowers/`](superpowers/) — workspace-level plans/specs/prompts from skill-driven
  sessions (per-effort status lives in each plan's own `## Status`)
