# SC-594 — common gates and footguns (included by every implementation/review brief; binding)

## Gates — full battery per dse-verify, in order. Expected (baseline dse develop 8b84b635, after SC-598; rebase onto it first):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: 7341 passed / 2 skipped in a fresh worktree, plus your new tests (report the delta). Known load timeouts: re-run the suite
  alone and report both runs.
- lifecycle 57/57 on develop (58/58 with G-S92) in SIX `--only` parts (G-S92 alone in part 6), EACH its own foreground Bash call, output to a log:
  1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
  2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
  3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9) — ~480 s: add NO phases to G-S64
  4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7) — ~395 s, ceiling ~420 s: no room for another scenario
  6. `G-S92` (1) — this ticket's scenario, its own part
  Verify these part lists against dse-verify's CURRENT block at dispatch (they can move); report each part's wall time.
- e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580).
  A RECOV-R07 red is now a real signal (SC-570). Run e2e as one foreground call to a log.
- styles.css: no CSS change expected — compare sha256 of the built styles.css against a clean 8b84b635 build. If identical, shots
  592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze 280/280 and parity 0/0/24 carry and you skip them
  (say so). If it differs, STOP and return NEEDS_CONTEXT.

## Footguns
- No compound `cd`. Use `git -C <abs path>` for every git command and `devbox run -c <abs dse path> -- …`. For multi-command
  shells, write a script file (Write tool) in your private scratch folder and run `devbox run -c <abs dse path> -- bash <script>`;
  record exit codes inside the script (`bash -c '…; echo rc=$?'` under devbox always records 0). Read each gate's own summary line.
- Never `rm` with a variable target. NEVER `rm -rf` a /tmp glob (a worker did this today and wiped other efforts' kept lifecycle
  FAIL dirs); delete only literal paths you created and recorded. Never `rm -rf` anything under the shared `.superpowers/` dir.
- One gate per Bash call, in the FOREGROUND, output redirected to a log file (the 600 s stream watchdog kills silent agents).
  No background gates, no Monitor (a job you start does not wake you).
- Never set DSE_LIFECYCLE_PORT. Any camera/shots run gets a private DSE_CAMERA_TMP in your scratch folder; never a long TMPDIR.
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree (no
  pkill/killall by name — other efforts (SC-598 and others) run Obsidian concurrently).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and
  a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- The e2e runner reads test titles for scenario ids: never put a bracketed ticket id (e.g. `[SC-594]`) in a test title.
- `npm ci` after any rebase that changes package.json's obsidian version.
- Commits: no pushes, no tags ever, no co-author or AI attribution lines in commit messages. Commit after every coherent step.
- The main checkout /home/scott/code/steelCompendium/workspace is shared: never edit it except your report/log files in the
  ledger dir. Its dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected.
  Workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
  /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write/CHANGELOG.md — never under the main checkout.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me.
  If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a
  message anyway, its FIRST WORD must be `SC-594:`.
- If the report-file write is blocked by your harness, return the report inline.
- Do not edit dse-verify SKILL.md; proposals go in the ledger dir as a file.
