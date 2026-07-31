# Build ledgers — archive

Rescued SDD build ledgers from efforts whose worktrees have been removed. Working ledgers
normally live in `.superpowers/sdd/` (gitignored scratch); these were copied here before
`just wt-rm` deleted them, because they are the only task-by-task record of how those
builds went.

**Read-only history.** Do not update these — they describe a finished branch. Current state
lives in `docs/handoffs/HANDOFF.md`, Linear, and the plan docs in `../plans/`.

| File | Effort | Covers |
|---|---|---|
| `f2-plans-04-16-17-18-ledger.md` | worktree `f2` (removed 2026-07-31) | Plan 04 (F2 data-integration), plan 16 (D6 compendium reference), plan 17 (D8 GM subsystems), plan 18 (D7 hero suite) |
| `f2-plan04-task-*-brief.md` | worktree `f2` | Per-task briefs for plan 04 |

Plan 20's and plan 21's ledgers still live in the main checkout's gitignored
`.superpowers/sdd/` (`progress-plan20-archive.md`, `progress.md`) — move them here if that
dir is ever cleared.

> **Why this dir exists:** `.superpowers/sdd/` is shared across all concurrent efforts, and
> generic filenames get overwritten by whichever agent finishes last — real build history has
> already been lost that way. See `docs/working-preferences.md` → "Parallel agents".
