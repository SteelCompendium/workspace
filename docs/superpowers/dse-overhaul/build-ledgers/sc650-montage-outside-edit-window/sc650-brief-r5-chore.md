# SC-650 r5 — chore: superproject branch onto workspace origin/main, CHANGELOG bullet, ONE pointer bump

Your final text goes to the ticket-owner. **Never call the tracker.** Never push.

Superproject worktree: `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window`
(branch `sc650-montage-outside-edit-window`, currently at `fded411f`, only dirt ` M draw-steel-elements`).
dse submodule inside it: branch `sc650-montage-outside-edit-window` at `42c26272 (full sha: run `git -C <worktree>/draw-steel-elements rev-parse HEAD` and confirm it starts 42c26272)` — do NOT touch the dse branch.
Use `git -C <absolute path>` for every git command — never `cd X; git …`. Never touch
`/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except to read this brief and write your report.

Steps:
1. `git -C <worktree> fetch origin`. Record `origin/main` sha (expected `f66b58ce` or newer).
2. Fast-forward the superproject branch onto `origin/main`: `git -C <worktree> merge --ff-only origin/main`
   (the branch has no commits of its own; the dirty submodule pointer is fine). If ff fails, STOP and report.
   After the merge, `git -C <worktree>/draw-steel-elements rev-parse HEAD` must still be `42c26272 (full sha: run `git -C <worktree>/draw-steel-elements rev-parse HEAD` and confirm it starts 42c26272)` (merge must not
   move the submodule checkout; if it did, `git -C <worktree>/draw-steel-elements checkout sc650-montage-outside-edit-window`).
3. Commit 1 — CHANGELOG: insert the bullet from
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc650-montage-outside-edit-window/sc650-changelog-bullet.md`
   (verbatim, all lines) as the FIRST bullet directly under `## Unreleased` in
   `<worktree>/CHANGELOG.md` (the worktree's copy — never the main checkout's). Keep a blank line between bullets as the
   neighbours do. Commit only CHANGELOG.md: `docs(changelog): SC-650 an outside change closes a Montage window with a Notice and returns keyboard focus`.
4. Commit 2 — pointer bump: `git -C <worktree> add draw-steel-elements` and commit
   `chore: bump draw-steel-elements to 42c26272 (SC-650: an outside change closes a Montage window with a Notice and returns focus)`.
5. Verify: `git -C <worktree> log --oneline origin/main..HEAD` shows exactly those 2 commits;
   `git -C <worktree> status --porcelain` is empty (ignore untracked `.superpowers/` if present — report it);
   `git -C <worktree> ls-tree HEAD draw-steel-elements` shows `42c26272 (full sha: run `git -C <worktree>/draw-steel-elements rev-parse HEAD` and confirm it starts 42c26272)`.

Commit messages: no Co-Authored-By trailer, no AI attribution (Scott's global rule).
No `rm` of anything. If a step fails, stop and report.

Report inline (no file needed): origin/main sha, the 2 new commit shas, the ls-tree line, status output.
