---
name: orchestrate
description: DEPRECATED (2026-08-27) — superseded by the `orchestration` plugin (dispatcher + Fable ticket-owners). Install it, then use `orchestration:orchestrate`.
---

# Orchestrate (deprecated)

This skill is superseded by the portable `orchestration` plugin. Install it:

```bash
claude plugin marketplace add https://github.com/scottTomaszewski/orchestration-plugin
claude plugin install orchestration@tski
```

Then use `orchestration:orchestrate` (dispatcher) and `orchestration:ticket-owner` (Fable
ticket-owner) in place of this skill.

This repo's project-specific adapter lives at `.claude/orchestrate/PROJECT.md`. Design and
rationale: `docs/superpowers/specs/2026-08-27-orchestration-v2-design.md`.

Delete this stub once the plugin is confirmed installed on both machines.
