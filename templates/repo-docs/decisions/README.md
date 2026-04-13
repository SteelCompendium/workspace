# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) — short documents that
capture significant design decisions along with their context and consequences.

## Why ADRs?

- Decisions age; the reasons behind them don't survive in memory
- New contributors (human or agent) need to understand *why*, not just *what*
- Prevents relitigating settled decisions without new information

## How to Create an ADR

1. Copy `0000-template.md` to a new file with the next sequence number:
   ```sh
   cp decisions/0000-template.md decisions/0001-my-decision.md
   ```
2. Fill in all sections. The "Options Considered" section is important even for
   seemingly obvious decisions.
3. Set status to `proposed` until the decision is confirmed, then `accepted`.
4. Add a row to the summary table in [architecture.md](../architecture.md).

## Numbering

- Use 4-digit zero-padded numbers: `0001`, `0002`, etc.
- Numbers are never reused, even if an ADR is deprecated.
- Sequence reflects creation order, not priority.

## Statuses

| Status | Meaning |
|--------|---------|
| `proposed` | Under discussion, not yet final |
| `accepted` | Active and authoritative |
| `superseded` | Replaced by a newer ADR (link to it) |
| `deprecated` | No longer relevant (explain why) |

## Index

<!-- Keep this list updated as ADRs are added. -->

| # | Title | Status | Date |
|---|-------|--------|------|
| — | No decisions recorded yet | — | — |
