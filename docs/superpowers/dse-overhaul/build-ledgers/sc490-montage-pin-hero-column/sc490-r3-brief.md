# SC-490 r3 brief — rebase-only round onto dse develop `d689b719` + full battery

You are the SC-490 r3 implementer. Re-read `sc490-r1-brief.md` §1 (context) and §5 (command and safety rules); both still apply in full. Your final text goes to the ticket-owner. Workers never call the tracker.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/decisions.md`. Read "Resume after Scott's OK". Scott's ruling, verbatim: "The \"after\" screenshots look great". The look is APPROVED as it is at `e4f394fa`. **Change no product code, CSS, tests or gates.** This round is a rebase plus the battery only.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column`. Current state: dse `e4f394fa` on develop `09ece2eb`; superproject `a01d8001` on main `ca0cbd1b`.

## Tasks
1. `git -C <dse path> fetch origin`. Rebase the dse branch onto `origin/develop` (expected `d689b719`; if it is newer, use it and say so). Resolve any conflict while keeping both sides' intent. A likely conflict is the dse `CHANGELOG.md`: keep every bullet. Another likely one is `visual-harness/obsidian-lifecycle.mjs` near G-S13 or the header: keep both. If a conflict touches product logic, stop and return NEEDS_CONTEXT with the hunk. If `package.json`'s obsidian version changed, run `npm ci`.
2. `git -C <superproject worktree path> fetch origin`. Rebase the superproject branch onto `origin/main`, keeping every CHANGELOG `## Unreleased` bullet. Re-point `draw-steel-elements` at the rebased dse head and commit. No AI attribution trailers.
3. Run `git range-diff` for both repos and confirm our commits are `=` or show only conflict-context changes. Describe any `!`.
4. Run the full battery on the final head, in dse-verify order, one gate per foreground call. Check `/proc/loadavg` before each Obsidian or shots gate. If a gate goes red on timing while load is above about 8, re-run it once load drops before you believe the red.

## Expected (at `d689b719`)
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`): clean.
- jest: **6470 passed / 1 skipped / 256 of 257 suites** (6460 base + our 10). A fresh worktree reads one fewer passed and 2 skipped until shots has run.
- lifecycle: **51/51** in FIVE `--only` parts:
  - part 1, `G-S7a … G-S9a`: 21
  - part 2, `G-S9b … G-S40`: 16
  - part 3, `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`: 9
  - part 4, `G-S57 G-S62 G-S61 G-S56`: 4, with G-S56 last
  - part 5, `G-S59`: 1

  Use the exact id lists from the dse-verify SKILL.md row 4. No private `DSE_LIFECYCLE_PORT`.
- e2e: **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`**.
- shots: **592**, 0 FAIL, button host-leak 161/966, and the `montage board scroll OK` line naming fine/coarse × dark/light. Use a private `DSE_CAMERA_TMP`. This is the one gate allowed in the background under load: poll its own log or exit-code file.
- freeze: **280/280**, no rebaseline.
- parity: **0 GAPs / 0 undeclared / 24 DECLARED**.

Then update `sc490-dse-verify-proposal.md` (same dir) to the new base and numbers. Never edit `.claude/skills/dse-verify/SKILL.md`. Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-r3-impl/`. Make it fresh, and give every script and log a unique name.

Safety rules, restated:
- Use `devbox run -c <abs dse path> -- bash <script>`.
- No compound `cd`. Every git command is `git -C <abs path>`.
- No `rm` with a variable target, and no glob `rm`.
- No `pkill`. Kill only by literal PID, after checking `readlink /proc/<pid>/cwd`.
- No Monitor or notification waits.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Redirect long output to a file.

## Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-r3-report.md`, opening with a summary of at most 10 lines. If the write is blocked, return the report inline.

Return contract: raw facts only.
- STATUS.
- dse head and base sha; superproject head and base sha.
- The range-diff summary.
- Every gate's summary line, with the loadavg at each Obsidian or shots gate.
- The absolute path of every artifact.

If you need input, end with STATUS: NEEDS_CONTEXT. You cannot message me. If you ever message anyway, its first word must be `SC-490:`.
