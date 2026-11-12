# SC-602 — common gates and footguns (included by every implementation/review brief; binding)

Worktree: /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save
dse: /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save/draw-steel-elements (branch sc602-live-preview-focus-on-save)
Verify `pwd` / `git -C <dse> branch --show-current` before any write. Workers NEVER call the tracker (Linear) — not to read, not to post.

## Gates — full battery per the dse-verify skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md), in order.
Expected (baseline dse develop 93e8e48c, after SC-580 (supersedes 622b0904); `git -C <dse> fetch origin` and rebase onto origin/develop first if it moved — report the sha):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: 10746 passed / 2 skipped in a fresh worktree plus your new tests (report the delta). Known load timeouts: re-run the suite
  alone and report both runs.
- lifecycle 60/60 at base (61/61 if this ticket adds G-S104) in SIX (or seven) `--only` parts, EACH its own foreground Bash call, output to a log:
  1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
  2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
  3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9) — ~480 s: add NO phases to G-S64
  4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7) — ~395 s, full: no new scenario or phase here
  6. `G-S92 G-S96 G-S97` (3) — ~230 s, room for about one ~60 s scenario. Only if the owner has approved a lifecycle scenario:
     G-S104 goes in part 6 (SCENARIOS order after G-S97, before G-S56) if it is ~60 s or less; anything bigger runs alone as
     part 7 (say so, report both walls). Real-Obsidian coverage defaults to e2e, not lifecycle.
  Verify these part lists against dse-verify's CURRENT block (they can move); report each part's wall time.
  A lifecycle call can exceed 180 s: the Bash tool backgrounds such calls — read the dse-verify note on this; set the Bash `timeout`
  to 600000 and keep each part under ~420 s.
- e2e `285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (known bugs SC-257, SC-355, SC-384). Run e2e as one
  foreground call to a log.
- styles.css: no CSS change expected — compare sha256 of the built styles.css against a clean 93e8e48c build (dse-verify CURRENT names
  `5e5ff488…` (build a clean 93e8e48c styles.css yourself to get the full hash)). If identical, shots 592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze 280/280 and
  parity 0/0/24 carry and you skip them (say so). If it differs, STOP and return NEEDS_CONTEXT.

- Superproject: the worktree's superproject branch must be rebased onto current workspace `origin/main` before land-ready
  (`git -C /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save fetch origin` then rebase); report its sha.

## Footguns
- No compound `cd`. Use `git -C <abs path>` for every git command and `devbox run -c <abs dse path> -- …`. For multi-command
  shells, write a script file (Write tool) in your private scratch folder and run `devbox run -c <abs dse path> -- bash <script>`;
  record exit codes inside the script (`bash -c '…; echo rc=$?'` under devbox always records 0). Read each gate's own summary line.
- Private scratch folder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-<round>-<role>/
  (the session scratchpad is shared by every agent; never a generic script name at its top level).
- Never `rm` with a variable target. NEVER `rm -rf` a /tmp glob (e.g. `/tmp/dse-obsidian-lifecycle-*`: every concurrent effort's
  lifecycle vault matches); delete only literal paths you created and recorded. Never `rm -rf` anything under the shared
  `.superpowers/` dir.
- One gate per Bash call, in the FOREGROUND, output redirected to a log file (the 600 s stream watchdog kills silent agents).
  No background gates, no Monitor (a job you start does not wake you). If a call is backgrounded by the tool anyway, poll that
  run's OWN log / exit-code file (unique per run), never a notification.
- Never set DSE_LIFECYCLE_PORT. Any camera/shots run gets a private DSE_CAMERA_TMP in your scratch folder; never a long TMPDIR.
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree (no
  pkill/killall by name — other efforts (SC-607, SC-580, SC-608 and others) run Obsidian concurrently).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and
  a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- The e2e runner reads test titles for scenario ids: never put a bracketed ticket id (e.g. `[SC-602]`) in a test title.
- `npm ci` after any rebase that changes package.json's obsidian version.
- Commits: no pushes, no tags ever, no co-author or AI attribution lines in commit messages. Commit after every coherent step.
- The main checkout /home/scott/code/steelCompendium/workspace is shared: never edit it except your report/log files in the
  ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/ (filenames prefixed
  `sc602-`). Its dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected.
  Workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
  /home/scott/code/steelCompendium/worktrees/sc602-live-preview-focus-on-save/CHANGELOG.md — never under the main checkout.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me.
  If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a
  message anyway, its FIRST WORD must be `SC-602:`.
- If the report-file write is blocked by your harness, return the report inline.
- Do not edit dse-verify SKILL.md; proposals go in the ledger dir as a file (`sc602-dse-verify-proposal.md`).

## Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path
of every evidence artifact you produced. Every report file opens with a <=10-line executive summary.
Report extras as `Drive-by fixes:` (made; obviously correct, local, cannot move a gate baseline) and `Follow-ups:` (left alone).
