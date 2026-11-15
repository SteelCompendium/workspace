# SC-656 chore — lifecycle parts at the landing head, then superproject: CHANGELOG bullet + ONE pointer bump

Your final text goes to the ticket-owner. **Never call the tracker.** Never push anything to origin.
**Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything** (it hangs on a permission prompt). Never `pkill`/`killall`
by pattern. Use `git -C <absolute path>` for every git command — never `cd X; git …`. Never touch
`/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except to read this brief and the bullet file.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus` (superproject branch
`sc656-negotiation-outside-edit-focus`, cut at `2945c3ea`, no commits of its own; expected dirt only
` M draw-steel-elements`). Plugin dir: `<worktree>/draw-steel-elements`, branch `sc656-negotiation-outside-edit-focus`
at `d62f0b267dad207fd47b8e5758af698cd9813b69` — do NOT change the dse branch.

Private scratch folder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-chore-<your agent id>/`.
Write scripts with the Write tool; uniquely named logs.

## Part A — lifecycle parts 1, 2, 3, 5, 6 at d62f0b26 (parts 4 and 7 already green there)

Run each part as ONE Bash call through a script file, output to its own log:
`devbox run -c <abs plugin dir> -- bash <script>` where the script does
`cd <abs plugin dir> && npm run obsidian-lifecycle -- --only=<ids> > <log> 2>&1; echo $? > <log>.rc`.
The `--only=` MUST use the equals sign (a space runs the whole suite). Ids comma-separated:

1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)

Any call over 180 s is moved to the background by the Bash tool: then poll the log's `.rc` file and the log's last
line (`OBSIDIAN-LIFECYCLE done: …`) with short `timeout 170 tail --pid=<your node pid> -f /dev/null` waits on YOUR OWN
node pid (`readlink /proc/<pid>/cwd` must be your plugin dir). Never wait for a background-completion notice. Check the
first lines of each log: it must name only that part's ids. Expected: each part `N/N ok, 0 failed`.
- If G-S91 fails, re-run part 5 once (real failure unless it says the host was too slow after two re-runs).
- If G-S97 fails, run `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` and re-run part 6 once.
- Any other failure: stop and report (log path + the FAIL line). Do not continue to Part B.
After Part A, `git -C <plugin dir> status --porcelain` must be empty (report anything there; do not clean it).

## Part B — superproject

1. `git -C <worktree> fetch origin`. Record `origin/main` (expected `0a1db8ba` or newer).
   `git -C <worktree>/draw-steel-elements fetch origin`; confirm
   `git -C <worktree>/draw-steel-elements merge-base --is-ancestor origin/develop HEAD` succeeds (origin/develop
   expected `bab0dbb2`). If it fails, STOP and report the origin/develop sha.
2. `git -C <worktree> merge --ff-only origin/main`. If ff fails, STOP. After it,
   `git -C <worktree>/draw-steel-elements rev-parse HEAD` must still be `d62f0b26…` (if not:
   `git -C <worktree>/draw-steel-elements checkout sc656-negotiation-outside-edit-focus`).
3. Commit 1 — CHANGELOG: insert the bullet from
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/sc656-changelog-bullet.md`
   verbatim (all lines) as the FIRST bullet directly under `## Unreleased` in `<worktree>/CHANGELOG.md` (the
   worktree's copy, never the main checkout's). Keep the neighbours' blank-line spacing. Commit only CHANGELOG.md:
   `docs(changelog): SC-656 an outside change keeps keyboard focus on the Negotiation card`.
4. Commit 2 — `git -C <worktree> add draw-steel-elements`, commit
   `chore: bump draw-steel-elements to d62f0b26 (SC-656: an outside change keeps keyboard focus on the Negotiation card)`.
5. Verify: `git -C <worktree> log --oneline origin/main..HEAD` shows exactly those 2 commits;
   `git -C <worktree> status --porcelain` empty (report anything else); `git -C <worktree> ls-tree HEAD draw-steel-elements`
   shows `d62f0b267dad207fd47b8e5758af698cd9813b69`.

Commit messages: no Co-Authored-By trailer, no AI attribution (Scott's global rule).

If the report-file write is blocked, report inline. You cannot `SendMessage` me; if stuck, end with
STATUS: NEEDS_CONTEXT and the question.

## Report (inline, no file)

Each lifecycle part's `done` line and log path; plugin dir status; origin/main and origin/develop shas; the 2 new
commit shas; the ls-tree line; superproject status output.
