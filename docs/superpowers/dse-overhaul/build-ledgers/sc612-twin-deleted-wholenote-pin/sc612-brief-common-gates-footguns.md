# SC-612 — common gates and footguns (included by every implementation/review brief; binding)

Worktree: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin
dse: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin/draw-steel-elements (branch sc612-twin-deleted-wholenote-pin)
Ledger dir (reports, logs): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/ (filenames prefixed `sc612-`)
Verify `git -C <dse> branch --show-current` before any write. Workers NEVER call the tracker (Linear) — not to read, not to post.

## Gates — full battery per the dse-verify skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md, ~400 KB: read "The battery, in order", "Lifecycle and e2e notes", "Block edit form Save and embeds (SC-556)" and the CURRENT block of "Current expected numbers" — not the whole file), in order.
Expected at baseline dse develop 2074a152 (SC-581 landed 2026-11-13; supersedes 1516f894 / c0995beb / 63e00d7e; workspace main 019d804e) (`git -C <dse> fetch origin`; if origin/develop moved, rebase onto it and report the sha):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: 11707 passed / 2 skipped in a fresh worktree (without the shots cache), plus your new tests (report the delta). Known load timeouts: re-run the suite alone and report both runs.
- lifecycle 61/61 in SIX `--only` parts (`--only=` takes comma-separated ids), EACH its own foreground Bash call, output to a log:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9) — full: no new phases
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) — full. G-S91 has a known timing flake (SC-616): re-run part 5 alone before blaming a change.
  6. `G-S92,G-S96,G-S97,G-S99` (4) — full.
  A new scenario (id G-S108) gets its own part 7, placed before G-S56 in SCENARIOS order (G-S56 stays last).
  Verify these lists against the dse-verify CURRENT block / the part list in the skill; report each part's wall time.
  A Bash call over 180 s is moved to the background by the tool even with a 600000 ms timeout (the dse-verify "Running a lifecycle part" note):
  keep one part per call, output to a per-run unique log, and poll your OWN node pid (`/proc/<pid>/cwd` is your worktree's dse) with
  `timeout 175 tail --pid=<pid> -f /dev/null`, then read the log. Never wait for a notification.
- e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355, SC-384). One call, output to a log.
- styles.css: no CSS change expected — SC-563 moved styles.css, (and SC-581 may have) — build a clean 2074a152 export (scratch, `git -C <dse> worktree add` or `git archive`) and compare sha256 of its built styles.css with your branch's. If identical, shots 592 /
  host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze 280/280 and parity 0/0/24 carry and you skip them (say so). If it
  differs, STOP and return NEEDS_CONTEXT.
- Superproject: before land-ready the worktree's superproject branch is rebased onto current workspace `origin/main`
  (`git -C /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin fetch origin` then rebase); report its sha.
  NO dse pointer commits on the superproject branch (the dispatcher does ONE pointer bump at landing); superproject commits are docs only (CHANGELOG).

## Footguns
- No compound `cd`. `git -C <abs path>` for every git command; `devbox run -c <abs dse path> -- …`. For multi-command shells, write a
  script file (Write tool) in your private scratch folder and run `devbox run -c <abs dse path> -- bash <script>`; record exit codes inside
  the script (`bash -c '…; echo rc=$?'` under devbox always records 0). Read each gate's own summary line.
- Private scratch folder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc612-<round>-<role>/
  (the session scratchpad is shared by every agent; never a generic script name at its top level).
- Never `rm` with a variable target. NEVER `rm -rf` a /tmp glob (e.g. `/tmp/dse-obsidian-lifecycle-*`: every concurrent effort's
  lifecycle vault matches); delete only literal paths you created and recorded. Never `rm -rf` anything under the shared `.superpowers/` dir.
- One gate per Bash call, in the FOREGROUND where it fits, output redirected to a log file (the 600 s stream watchdog kills silent agents).
  No Monitor; a job you start does not wake you. Poll the run's OWN log / pid, never a notification.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and
  a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Never set DSE_LIFECYCLE_PORT. Any camera/shots run gets a private DSE_CAMERA_TMP in your scratch folder; never a long TMPDIR.
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree (no pkill/killall
  by name — other efforts (SC-608, SC-563 and others) run Obsidian concurrently).
- The e2e runner reads test titles for scenario ids: never put a bracketed ticket id (e.g. `[SC-612]`) in a test title.
- `npm ci` after any rebase that changes package.json's obsidian version. Remove a stale `main.js` / `styles.css` in the dse root by literal path before jest if the skill says so.
- Commits: no pushes, no tags ever, no co-author or AI attribution lines in commit messages. Commit after every coherent step.
- The main checkout /home/scott/code/steelCompendium/workspace is shared: never edit it except your report/log files in the ledger dir.
  Its dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected.
  Workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
  /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin/CHANGELOG.md — never under the main checkout.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me.
  If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a
  message anyway, its FIRST WORD must be `SC-612:`.
- If the report-file write is blocked by your harness, return the report inline.
- Do not edit dse-verify SKILL.md; proposals go in the ledger dir as a file (`sc612-dse-verify-proposal.md`).

## Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path
of every evidence artifact you produced. Every report file opens with a <=10-line executive summary.
Report extras as `Drive-by fixes:` (made; obviously correct, local, cannot move a gate baseline) and `Follow-ups:` (left alone).
