# SC-457 chore — drop dse-verify SKILL.md from the superproject branch

Mechanical git chore. Never call the tracker. Every git command uses `git -C /home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang` (absolute path, never `cd`). Never touch `/home/scott/code/steelCompendium/workspace/`. Do not touch the `draw-steel-elements` submodule (a reviewer is working in it) and leave the superproject's unstaged `draw-steel-elements` pointer modification exactly as it is. No push.

State: superproject branch `sc457-fence-space-lang` has 2 commits on `origin/main` (`3d18dd5`): `9344eb1` (CHANGELOG bullet + dse-verify SKILL.md) and `928764b` (dse-verify SKILL.md G-S13→G-S14). Goal: ONE commit on `origin/main` that changes ONLY `CHANGELOG.md` (keeping the SC-457 bullet exactly as in `928764b`).

Steps (W=/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang):
1. `git -C $W fetch origin`; record `git -C $W rev-parse HEAD origin/main` and `git -C $W status --short`.
2. `git -C $W show 928764b:CHANGELOG.md > <scratch>/sc457-chore-CHANGELOG.md` (backup).
3. `git -C $W reset --soft origin/main` (only if origin/main is still `3d18dd5`; if it moved, STOP and report — do not resolve conflicts).
4. `git -C $W restore --source=origin/main --staged --worktree .claude/skills/dse-verify/SKILL.md`
5. `git -C $W diff --cached --stat` must list ONLY `CHANGELOG.md`. If anything else is staged, STOP and report.
6. `git -C $W commit -m "docs(changelog): a block with a space before its name keeps saving (SC-457)"` (no trailers of any kind).
7. Verify: `git -C $W diff origin/main..HEAD --stat` shows only `CHANGELOG.md`; `git -C $W diff origin/main..HEAD -- CHANGELOG.md` equals `git -C $W diff 3d18dd5..928764b -- CHANGELOG.md`; `git -C $W status --short` shows only ` M draw-steel-elements` (as before); `git -C $W show HEAD:.claude/skills/dse-verify/SKILL.md | cmp - <(git -C $W show origin/main:.claude/skills/dse-verify/SKILL.md)` identical.

Scratch: only `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-chore-<yourAgentId>/`. No glob deletes.

Return (final text goes to the ticket-owner, raw facts): STATUS, old HEAD, new HEAD sha, origin/main sha, the outputs of every step-7 check. If you need input, end with STATUS: NEEDS_CONTEXT. You cannot SendMessage me; if you ever do message anyway, the first word must be `SC-457:`. If a report-file write is blocked, return inline (no report file needed).
