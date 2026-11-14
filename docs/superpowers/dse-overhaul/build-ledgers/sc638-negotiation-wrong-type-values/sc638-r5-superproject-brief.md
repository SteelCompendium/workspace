# SC-638 r5 — superproject onto current workspace main, ONE pointer bump

Worktree superproject: `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values` (branch
`sc638-negotiation-wrong-type-values`). Plugin: `<worktree>/draw-steel-elements`, final dse head 12aaf5b5.
Never touch `/home/scott/code/steelCompendium/workspace/` (except your report). `git -C <abs path>` for every git
command. No pushes (landing is the dispatcher's). No `rm` in /tmp or the scratchpad. You never call the tracker.

1. `git -C <worktree> fetch origin`; note `origin/main` sha.
2. Rebase the superproject branch onto `origin/main` so that it carries exactly, in this order:
   - ONE CHANGELOG commit: the SC-638 bullet under `## Unreleased` (squash `de702d1e` + `4df72822` into one; message
     `docs: CHANGELOG bullet for SC-638 (negotiation wrong-type values)`). If the rebase conflicts in CHANGELOG.md,
     keep every bullet main has AND the SC-638 bullet (latest wording from `4df72822`); nothing else changes.
   - ONE pointer bump: stage `draw-steel-elements` at 12aaf5b5; message
     `chore: bump draw-steel-elements to <short 12aaf5b5> (SC-638: negotiation reads wrong-type values without a raw error or data loss)`.
   No other commits, no interim pointer commits. Other submodule pointers must equal origin/main's (check
   `git -C <worktree> diff origin/main --stat` lists only CHANGELOG.md and draw-steel-elements).
   Commit messages: no AI attribution, no co-author trailers.
3. Confirm the dse branch head is 12aaf5b5 and `origin/develop` is an ancestor of it
   (`git -C <plugin> merge-base --is-ancestor origin/develop HEAD`); if develop moved, STOP and report (do not rebase dse).
4. Return: raw facts — origin/main sha, the two new superproject shas, `git log --oneline origin/main..HEAD`, the
   `diff --stat` output, ancestor check result.
5. Housekeeping: the reviewer left two scratch plugin worktrees registered in the plugin repo, at
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r2-review/wt`
   and `.../sc638-r2-review/base`. Unregister both with `git -C <plugin> worktree remove --force <that literal abs path>`
   (no `rm`), then `git -C <plugin> worktree list` and report it.
