# SC-662 r5 — superproject chore (CHANGELOG + ONE pointer bump)

You are a chore worker for SC-662. Your final text goes to the ticket-owner, not a human. Never call the tracker. Never push anything to origin. Never `rm` anything in /tmp or the scratchpad. Every git command is `git -C <absolute path>`; never `cd X; git …`.

Superproject worktree: `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves` (branch `sc662-sidebar-pending-saves`). Its dse submodule (`.../draw-steel-elements`, same branch name) is at `129beb18af27c641cca026ec519090af20372715` — do not change anything in the submodule.

Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout). The CHANGELOG you edit is `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves/CHANGELOG.md`.

Steps:

1. `git -C /home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves fetch origin`. Record `origin/main`'s sha.
2. Check the superproject branch has no commits of its own: `git -C … log --oneline origin/main..HEAD` should be empty. If it is not empty, stop and report the list. Then move the branch to `origin/main`: `git -C … merge --ff-only origin/main`. If the fast-forward fails, stop and report. Do NOT run `git submodule update`: the dse submodule must stay at `129beb18af27c641cca026ec519090af20372715`.
3. Commit 1, CHANGELOG. Insert the bullet text from `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/sc662-changelog-bullet.md` verbatim. It goes as the FIRST bullet under `## Unreleased`, followed by one blank line before the existing first bullet. Commit only `CHANGELOG.md` with the message `docs(changelog): SC-662 the pinned sidebar no longer loses a pending save or the outside change`. No co-author or AI trailer.
4. Commit 2, the ONE pointer bump. `git -C … add draw-steel-elements` and commit with the message `chore: bump draw-steel-elements to 129beb18 (SC-662: the pinned sidebar keeps pending saves and outside changes)`. No trailer. This must be the only commit that changes the submodule pointer.
5. Verify:
   - `git -C … log --oneline origin/main..HEAD` shows exactly these 2 commits.
   - `git -C … diff origin/main --stat` shows only `CHANGELOG.md` and `draw-steel-elements`.
   - `git -C …/draw-steel-elements rev-parse HEAD` = `129beb18af27c641cca026ec519090af20372715`.
   - `git -C …/draw-steel-elements merge-base --is-ancestor origin/develop HEAD` exits 0. Fetch origin inside the submodule first.
   - `git -C … status --porcelain` is empty, apart from untracked scratch such as `data/`; report anything else.

Final text: raw facts only. Give the superproject origin/main sha, the two new commit shas, each verify result, and the dse sha. Report any deviation.
