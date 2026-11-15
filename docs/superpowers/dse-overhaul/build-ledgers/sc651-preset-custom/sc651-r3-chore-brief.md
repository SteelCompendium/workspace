# SC-651 r3 — chore brief: CHANGELOG reword + the one pointer bump

Mechanical git chore in the superproject worktree. Your final text goes to the ticket-owner. Never call
the Linear tracker. **Never push anything.**

Worktree superproject: `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom` (branch
`sc651-preset-custom`). Use `git -C <absolute path>` for EVERY git command; never `cd`. Never write under
`/home/scott/code/steelCompendium/workspace/` except your report file below. Never `rm` anything.

## Steps

1. `git -C /home/scott/code/steelCompendium/worktrees/sc651-preset-custom fetch origin`. Check
   `git -C … rev-parse --short origin/main`. Expected `c63ec316`. Check `git -C … log --oneline -2`:
   expected HEAD `e2014106 docs(changelog): SC-651 Preset dropdown refuses a Custom pick` on `c63ec316`.
   If origin/main has moved: `git -C … rebase origin/main` (CHANGELOG conflicts: keep both sides' bullets
   under `## Unreleased`, SC-651's bullet first is fine). If anything else differs, STOP and report.
2. Check `git -C /home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements rev-parse --short HEAD`
   is `031f6ca0` and that its `git status --porcelain` is empty. If not, STOP and report.
3. In `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/CHANGELOG.md`, the SC-651 bullet's
   second line currently starts `  "Custom" is not a preset you can choose: it only appears when your statblock options match none of Steel card,`
   and its third line starts `  Sourcebook or Index card. Picking it used to leave…`. Replace ONLY these two
   wrapped lines' opening sentence so the bullet body reads exactly (keep the 2-space indent, wrap at ~118 cols like the neighbours):

   ```
     The dropdown only reads Custom when your statblock options match none of Steel card, Sourcebook or Index card:
     Custom is not a preset you can apply. Picking it used to leave the dropdown on Custom until you opened another
     settings page and came back, when it read Steel card again. The dropdown now goes straight back to the preset your
     options match (or stays on Custom when they match none), and nothing is saved.
   ```

   The bold first line of the bullet stays as it is. Use the Edit tool.
4. `git -C <superproject> add CHANGELOG.md` then `git -C <superproject> commit --amend --no-edit`.
5. Pointer bump: `git -C <superproject> add draw-steel-elements`, then commit with this exact message
   (no co-author or AI attribution lines):
   `chore: bump draw-steel-elements to 031f6ca0 (SC-651: picking Custom in the settings Preset dropdown snaps back to the preset the options match)`
6. Verify: `git -C <superproject> log --oneline origin/main..HEAD` shows exactly 2 commits (CHANGELOG, then
   the bump); `git -C <superproject> show --stat HEAD` touches only `draw-steel-elements`;
   `git -C <superproject> ls-tree HEAD draw-steel-elements` shows `031f6ca0…`; `git -C <superproject> status --porcelain`
   is empty (or list exactly what is not).

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/sc651-r3-chore-report.md`
opening with a ≤10-line summary: the two new superproject shas, the `origin/main` sha they sit on, the
`ls-tree` line, the status output, and `git -C <superproject> show HEAD~1 -- CHANGELOG.md` pasted in full. If the
write is blocked, return it inline. You cannot SendMessage me; if stuck, end with `STATUS: NEEDS_CONTEXT`.
Final text: raw facts, shas, and the report path.
