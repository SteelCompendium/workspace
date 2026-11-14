# SC-568 r2b addendum — replacement reviewer (read AFTER sc568-r2-review-brief.md)

The first r2 reviewer hung on a permission prompt (a `rm -f` + `rmdir` of its throwaway tests).
You replace it. Its state, all under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r2-rev/`:

- `br/` = scratch git worktree at `ed4044aa` (detached), `base/` = scratch git worktree at
  `df92a3f6` (detached). Each has untracked throwaway tests `test/unit/zzsc568r2/` and
  `test/dom/zzsc568r2/` (a 6 s sleep and a 31 s sleep per project).
- Probe 1 is DONE (owner read the logs `logs/throwaway-br.log`, `logs/throwaway-base.log`):
  branch: both 6 s tests pass, both 31 s tests fail "Exceeded timeout of 30000 ms";
  base: all 4 fail "Exceeded timeout of 5000 ms". So the 30 s default covers both projects.
  Do not redo it. Start at probe 2.

**No `rm` at all, of any kind, in this round** (not `rm -f`, not `rmdir`, not on a literal path).
To get the throwaway tests out of the way, either run
`git -C <abs scratch worktree> clean -fdq -- test/unit/zzsc568r2 test/dom/zzsc568r2` (literal
paths), or leave them and pass `--testPathIgnorePatterns=zzsc568r2` to every jest run in those
scratch worktrees. If any command would delete a file and you are unsure it is allowed, do not
run it: leave the file and note it in the report. For the stale `main.js`/`styles.css` rule,
use `git -C <wt> clean -fq -- main.js styles.css` (they are untracked build outputs) instead of `rm`.
Do NOT remove the scratch worktrees at the end; the owner cleans up.

Scope unchanged: review `df92a3f6..ed4044aa` (dse develop has since moved to `14521bf0`; the
rebase is a later round, not yours). Report path changes to
`.../sc568-jest-load-timeouts/sc568-r2b-review.md`; raw logs in `.../scratchpad/sc568-r2b-rev/logs/`
(new folder, unique names).
