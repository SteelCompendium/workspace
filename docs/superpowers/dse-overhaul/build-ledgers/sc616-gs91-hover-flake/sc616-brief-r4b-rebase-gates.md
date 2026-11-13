# SC-616 r4b — rebase onto 3a5986d3, finish the r4 docs fixes, run the battery (implementer, replacement)

You replace an r4 worker that stalled on a permission prompt before its last step. Your final text goes to the SC-616 ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/decisions.md` — read "Owner rulings" O1-O5 and the newest "Dispatcher update" (SC-585, baseline 3a5986d3).
- r3 review: `.../sc616-r3-review-report.md` — sections LOW-1 and INFO-6 (proposal wording; LOW-1 gives exact replacement text).
- Proposal under edit: `.../sc616-dse-verify-proposal.md`.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~360 KB; read in PARTS: lines 20-220 for the battery, devbox wrapping and the exit-code footgun).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`; dse submodule `.../draw-steel-elements`, branch `sc616-gs91-hover-flake`, now at `de60b4c9` = three SC-616 commits (`87092b17` release+gate, `dad054fc` retry, `de60b4c9` r3 comment fixes + INFO-4 message) on `1f1ae442`. The previous worker's gates on `de60b4c9` were all green (supporting evidence only, logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r4-afb42389/`: tsc, lint, jest 11788/2, lifecycle 7 parts all ok, e2e 330/333 0 failed 176/176). Do NOT write into that folder.

Main checkout (`/home/scott/code/steelCompendium/workspace`) is shared: never write code there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected.

## 2. Task

1. `git -C /home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/draw-steel-elements fetch origin`, confirm `origin/develop` is `3a5986d3` (if it moved further, rebase onto the newest and say so), then `git -C … rebase origin/develop`. SC-585 touched only Conditions window code, tests and docs, so no conflict is expected; if one occurs in `visual-harness/obsidian-lifecycle.mjs`, keep both sides and report exactly what you resolved. `npm ci` only if `package.json`/lockfile changed. Confirm the branch is exactly three SC-616 commits on `3a5986d3` and the only file they change is `visual-harness/obsidian-lifecycle.mjs`.
2. In `sc616-dse-verify-proposal.md`: make sure LOW-1 is fixed with r3's replacement wording and INFO-6 is fixed (all 6 trials fail on the base, not "every non-dblq trial"); refresh every sha and the CURRENT-block draft to the final head on `3a5986d3` and the numbers below. Do NOT edit SKILL.md itself.
3. Gates on the final head (expected):
   - tsc + lint clean
   - jest **11794 passed / 2 skipped** (fresh worktree, no shots cache)
   - lifecycle **62/62 in SEVEN `--only` parts** (`--only=` takes comma-separated ids; read the exact part lists from SKILL row 4 and the harness SCENARIOS array): part 1 `G-S7a … G-S9a` (21), part 2 `G-S9b … G-S40` (16), part 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9), part 4 `G-S57,G-S62,G-S61,G-S56` (4), part 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7), part 6 `G-S92,G-S96,G-S97,G-S99` (4), part 7 `G-S108` (1). Report per-part time. Known issue SC-622: if G-S97 fails, check your worktree's `demo-vault/.obsidian/appearance.json` / stray folders first and report.
   - e2e **`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`**
   - `main.js` and `styles.css` byte-identical to a build of `3a5986d3` (build it from `git -C <dse> archive 3a5986d3` into your own scratch dir, or a scratch `git worktree add` at an absolute path in your scratch dir; report both sha256 pairs). If not identical, stop and report.
   - G-S91 alone x3 on the final head: pass count, gapEnd values, retries fired.

## 3. Run mechanics (each one cost real time before — follow exactly)

- **No glob `rm`, no `rm` with a shell variable in the path, no `mv`/`rm` housekeeping at all.** The previous worker hung on exactly `rm -f $N/*.rc`. Use fresh, uniquely named files for every log and exit code; overwrite with `>` if you must reuse one. Never `rm -rf` a `/tmp` glob (other efforts' lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`). If your own FAIL runs leave temp dirs, delete them only by literal full path.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r4b-<yourAgentId>/`; create it once with `mkdir -p <literal path>`; write scripts there with the Write tool, uniquely named.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command. Devbox eats `$?` and `| tail` eats failures: each script writes its own exit code to its own file and redirects output to a log; read each gate's summary line.
- Each gate as ONE blocking foreground Bash call under 600 s (one lifecycle part per call). No `run_in_background`, no Monitor, no waiting for notifications.
- `git -C <absolute path>` for every git command.
- Never `pkill`/`killall` by pattern; kill only by PID whose `readlink /proc/<pid>/cwd` is inside YOUR worktree.
- Commit nothing new unless a rebase conflict forces it; no AI attribution trailer; never a bracketed ticket id in a test title.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-r4-fix-report.md`, opening with a <=10-line executive summary (final sha, gate lines, hashes, G-S91 runs). Copy gate logs into the ledger dir with `sc616-r4b-` prefixes. If the report-file write is blocked, return the report inline.

## 5. Footguns

- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-616:`.

## 6. Return contract

Final text: raw facts — STATUS, final dse sha and its 3 commits, clean-tree confirmation, each gate's summary line, per-part lifecycle times, hashes (head vs 3a5986d3), G-S91 runs, what you changed in the proposal, and the absolute path of every evidence artifact.
