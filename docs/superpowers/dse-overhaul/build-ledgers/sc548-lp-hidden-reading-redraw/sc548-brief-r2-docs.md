# SC-548 r2 brief: preserve the ledger and correct one SC-472 doc line (chore, superproject only)

## Context
- Worktree superproject: `/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw` (branch `sc548-lp-hidden-reading-redraw`). ALL writes go there. Never write under `/home/scott/code/steelCompendium/workspace/` except reading the ledger dir below.
- Ledger dir (source to copy, read-only for you): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc548-lp-hidden-reading-redraw/`.
- Workers never call the tracker. Do not push. Do not touch any submodule (no changes inside `draw-steel-elements/` or any other submodule).
- Use `git -C <absolute path>` for every git command. Never `cd` inside a compound command. No `rm` at all.

## Steps
1. Copy the whole ledger dir into the worktree:
   `cp -r /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc548-lp-hidden-reading-redraw /home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/docs/superpowers/dse-overhaul/build-ledgers/`
   Result must be `/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/docs/superpowers/dse-overhaul/build-ledgers/sc548-lp-hidden-reading-redraw/` containing `decisions.md`, `sc548-r1-measure-report.md`, and the other `sc548-*` files.
2. In `/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/docs/superpowers/dse-overhaul/build-ledgers/sc472-scroll-pin-timer/sc472-r1-design-report.md`, find the line that starts with
   `- **A Live Preview leaf keeps a hidden Reading view that also re-renders embeds**`
   and insert this exact line directly after it (use the Edit tool; keep the two leading spaces):
   ```
     - **Correction (2026-11-02, SC-548 r1):** this does not reproduce. Obsidian 1.15.0 skips rendering a hidden Reading view (`MarkdownPreviewRenderer.onRender` returns while the preview element has no `offsetParent`), so DSE runs 0 renders there. The `mh3rd` events here were visible Reading renders: G-S52's `openHost` opens each host in Reading first, and those renders fell into the previous write's timeline window. SC-548 was closed as Canceled. Evidence: `../sc548-lp-hidden-reading-redraw/sc548-r1-measure-report.md`.
   ```
   Change nothing else in that file.
3. Stage exactly those two paths and commit in the superproject worktree:
   `git -C /home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw add docs/superpowers/dse-overhaul/build-ledgers/sc548-lp-hidden-reading-redraw docs/superpowers/dse-overhaul/build-ledgers/sc472-scroll-pin-timer/sc472-r1-design-report.md`
   Commit message (exactly this, no trailer lines of any kind):
   `docs: preserve sc548-lp-hidden-reading-redraw ledger (SC-548 closed: hidden Reading view never renders DSE); correct SC-472 r1 follow-up`
4. Report: `git -C <worktree> log --oneline -1`, `git -C <worktree> show --stat HEAD | tail -5`, and `git -C <worktree> status --porcelain` (should be empty or show only untracked scratch; list whatever it shows).

## Return contract
Final text goes to the ticket-owner: raw facts only — the commit sha, the stat summary line, the status output. If any step fails, stop and report the exact error. If you need input, end with STATUS: NEEDS_CONTEXT and the question (you cannot message me; if you ever do, the first word must be `SC-548:`).
