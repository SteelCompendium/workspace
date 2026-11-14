# SC-621 — common gates and footguns (included by every implementation/review brief; binding)

Worktree: /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit
dse: /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit/draw-steel-elements (branch sc621-part-pin-one-sided-edit)
Ledger dir (reports, logs): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/ (filenames prefixed `sc621-`)
Verify `git -C <dse> branch --show-current` before any write. Workers NEVER call the tracker (Linear) — not to read, not to post.

## Gates — full battery per the dse-verify skill
Skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (~440 KB, very long lines: do NOT read it whole.
Read "The battery, in order" (lines ~20-133), "Lifecycle and e2e notes" (~177-184), "Block edit form Save and embeds (SC-556)" and
"Hover preview modals (SC-595)" as needed, and the CURRENT entry of "Current expected numbers" (~1497-1500). Use `sed -n 'A,Bp' | cut -c1-1500`.)

Expected at baseline dse develop b1e4f027 (SC-568 landed 2026-11-13; supersedes 9b94baf2 / 14521bf0 / df92a3f6; workspace main 18bba97f). Jest global testTimeout is now 30 s: an 'Exceeded timeout of 30000 ms' is a real hang until proven otherwise. `git -C <dse> fetch origin`; if origin/develop
moved, report the sha (the owner decides on rebases).
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: 11857 passed / 2 skipped in a fresh worktree (without the shots cache; 11858 / 1 once a shots run caches obsidian-app.css), plus your
  new tests (report the delta). Known load timeouts: re-run the suite alone and report both runs.
- lifecycle 63/63 at base (64/64 on the sc621 branch with G-S115) in SEVEN `--only` parts (`--only=` takes comma-separated ids), EACH its own Bash call, output to a log:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9) — full: no new phases
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) — full. A G-S91 FAIL is a real signal (SC-616 fixed its flake) unless the
     outcome says the host was too slow after two re-runs; then free the host and re-run part 5 alone.
  6. `G-S92,G-S96,G-S97,G-S99` (4) — full. SC-622: the camera tool can leave
     `<dse>/demo-vault/.obsidian/appearance.json` dirty, which fails G-S97; `git -C <dse> status` and restore that one file by literal
     path (`git -C <dse> checkout -- demo-vault/.obsidian/appearance.json`) before blaming a change.
  7. `G-S108,G-S112` (2, ~130 s) — a new scenario G-S115 goes here, placed before G-S56 in SCENARIOS order (G-S56 stays last).
  Verify these lists against the skill's part list; report each part's wall time.
  A Bash call over 180 s is moved to the background by the tool even with a 600000 ms timeout (dse-verify "Running a lifecycle part"):
  keep one part per call, output to a per-run unique log, and poll your OWN node pid (`/proc/<pid>/cwd` is your worktree's dse) with
  `timeout 175 tail --pid=<pid> -f /dev/null` (repeat), then read the log. Never wait for a notification.
- e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355, SC-384). One call, output to a log.
- styles.css / main.js: no CSS change expected. Build a clean b1e4f027 export (scratch, `git -C <dse> worktree add <abs scratch path> b1e4f027`
  or `git archive`) and compare sha256 of its built styles.css with your branch's. If identical, shots 592 / host-leak 163/978 / modal
  host-leak 40/240 / capture clip 147, freeze 280/280 and parity 0/0/24 carry and you skip them (say so). If it differs, STOP and return
  NEEDS_CONTEXT.
- Superproject (implementer, final round only): the worktree superproject branch carries ONE CHANGELOG commit (a bullet under
  `## Unreleased` in /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit/CHANGELOG.md), rebased on current workspace
  `origin/main`. NO pointer commits from you — the owner arranges the single pointer bump.

## Footguns
- No compound `cd`. `git -C <abs path>` for every git command; `devbox run -c <abs dse path> -- …`. For multi-command shells, write a
  script file (Write tool) in your private scratch folder and run `devbox run -c <abs dse path> -- bash <script>`; record exit codes inside
  the script (`bash -c '…; echo rc=$?'` under devbox always records 0). Read each gate's own summary line.
- Private scratch folder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-<round>-<role>/
  (the session scratchpad is shared by every agent; never a generic script name at its top level). Use the Write tool for scratch files.
- Never `rm` with a variable target, and NEVER `rm -rf` / `rm -f` a glob (in /tmp, the scratchpad, anywhere — e.g.
  `/tmp/dse-obsidian-lifecycle-*` matches every concurrent effort's lifecycle vault). Delete only literal paths you created and recorded.
  Never `rm -rf` anything under the shared `.superpowers/` dir.
- One gate per Bash call, output redirected to a log file (the 600 s stream watchdog kills silent agents). No Monitor, no
  `run_in_background`; a job you start does not wake you. Poll the run's OWN log / pid, never a notification.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and
  a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Never set DSE_LIFECYCLE_PORT. Any camera/shots run gets a private DSE_CAMERA_TMP in your scratch folder; never a long TMPDIR.
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree (no pkill/killall
  by name — other efforts (SC-586, SC-568 and others) run Obsidian and jest concurrently).
- The e2e runner reads test titles for scenario ids: NEVER put a bracketed ticket id (e.g. `[SC-621]`) in any test title (jest or e2e).
  Plain `SC-621` without brackets is fine.
- `npm ci` after any rebase that changes package.json's obsidian version. Remove a stale `main.js` / `styles.css` in the dse root by
  literal path before jest (dse-verify "Stale main.js").
- Commits: no pushes, no tags ever, no co-author or AI attribution lines in commit messages. Commit after every coherent step.
- The main checkout /home/scott/code/steelCompendium/workspace is shared: never edit it except your report/log files in the ledger dir.
  Its dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected.
  Workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
  /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit/CHANGELOG.md — never under the main checkout.
- If a tool call would need a permission prompt you cannot get answered, do it another way (Write tool, literal paths) rather than wait.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me.
  If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a
  message anyway, its FIRST WORD must be `SC-621:`.
- If the report-file write is blocked by your harness, return the report inline.
- Do not edit dse-verify SKILL.md; proposals go in the ledger dir as a file (`sc621-skill-proposal.md`).

## Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path
of every evidence artifact you produced. Every report file opens with a <=10-line executive summary.
Report extras as `Drive-by fixes:` (made; obviously correct, local, cannot move a gate baseline) and `Follow-ups:` (left alone).
