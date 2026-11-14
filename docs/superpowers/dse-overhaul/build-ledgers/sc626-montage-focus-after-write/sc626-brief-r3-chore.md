# SC-626 r3 chore brief — put the superproject branch on workspace origin/main with a CHANGELOG commit and ONE pointer bump

You never call the tracker. Do NOT push anything. Do NOT touch the dse submodule's commits.

Superproject worktree: `/home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write` (call it W), branch
`sc626-montage-focus-after-write`, currently at `7aae3668` with no commits of its own and `M draw-steel-elements`
(the dse submodule is checked out at `11fbded6`, which must stay). Every git command is `git -C <absolute path>`; never
`cd X; git …`. Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything anywhere. Do not touch the main checkout
`/home/scott/code/steelCompendium/workspace` except to WRITE your report into the ledger dir below.

Steps:

1. `git -C W fetch origin`; record `git -C W rev-parse origin/main` (expected `42a14300` or later — if later, use it and say so).
2. Confirm `git -C W log --oneline origin/main..HEAD` is empty (no own commits). Then `git -C W merge --ff-only origin/main`.
3. `git -C W status --short` and `git -C W submodule status`. Expected: only ` M draw-steel-elements` (dse at
   `11fbded6`). If any OTHER submodule now shows a different commit from its pin, put it on the pin with
   `git -C W/<sub> checkout -B sc626-montage-focus-after-write <pinned sha>` (the pinned sha is in `git -C W ls-tree HEAD <sub>`).
   Never run `git submodule update` on draw-steel-elements.
4. Verify dse: `git -C W/draw-steel-elements rev-parse HEAD` is `11fbded6…` and
   `git -C W/draw-steel-elements merge-base --is-ancestor $(git -C W ls-tree HEAD draw-steel-elements | awk '{print $3}') HEAD`
   exits 0 (the new head descends from the pin on main).
5. CHANGELOG: insert the bullet in
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/sc626-changelog-bullet.md`
   (copy it exactly, unchanged) into `W/CHANGELOG.md` as the FIRST bullet under `## Unreleased`, followed by one blank
   line before the next bullet. Edit `W/CHANGELOG.md` — the file in the WORKTREE, never
   `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`. Commit only that file:
   message `docs(changelog): SC-626 montage keeps keyboard focus after a press`.
6. Pointer bump: `git -C W add draw-steel-elements` and commit with message
   `chore: bump draw-steel-elements to 11fbded6 (SC-626: the montage keeps keyboard focus after a write, a strip toggle or a window close)`.
7. No AI / co-author lines in either commit message.
8. Verify and record: `git -C W log --oneline origin/main..HEAD` (exactly 2 commits: changelog, then bump);
   `git -C W status --short` (empty except untracked scratch such as `data/` if it was there before);
   `git -C W ls-tree HEAD draw-steel-elements`.

Report: write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/sc626-r3-chore-report.md`
(first lines: a ≤10-line summary with STATUS, origin/main sha used, the two new superproject shas, dse pin). If the write
is blocked, return it inline. If anything differs from what this brief expects (merge not fast-forward, dse sha differs,
another submodule moved and cannot be placed), STOP before committing and return `STATUS: BLOCKED` with the output.
You cannot SendMessage me; if you need input, end with `STATUS: NEEDS_CONTEXT`. Any stray message starts `SC-626:`.
Final text to me: raw facts only.
