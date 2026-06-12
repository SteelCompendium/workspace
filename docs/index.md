# Workspace docs

Workspace-level documentation, one topic per file. Sub-repo-specific docs live in the
sub-repos (`steel-etl/docs/`, `v2/.repo-docs/`); routing rules are in
[`CLAUDE.md`](../CLAUDE.md) → "Keeping docs in sync".

- [`scc-log.md`](scc-log.md) — dated history of SCC scheme/registry/linking changes
  (the current-state summary lives in `CLAUDE.md` → "SCC")
- [`followups-archive/`](followups-archive/) — completed `FOLLOWUPS.md` items, pruned
  per cleanup pass; titles keep their "was FOLLOWUPS #N" handles
- [`roadmap-archive/`](roadmap-archive/) — completed `ROADMAP.md` items, same scheme
- [`handoffs/`](handoffs/) — per-session "you are here" handoffs (`HANDOFF.md`);
  ephemeral, owned by the `creating-handoffs` skill
- [`superpowers/`](superpowers/) — workspace-level plans/specs/prompts from skill-driven
  sessions (per-effort status lives in each plan's own `## Status`)
