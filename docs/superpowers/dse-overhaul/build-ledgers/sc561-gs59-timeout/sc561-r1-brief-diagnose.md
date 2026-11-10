# SC-561 round 1 brief — diagnose the G-S59 lifecycle timeout (reviewer, diagnosis only)

You are a diagnosis worker for ticket SC-561. Your final text goes to the ticket-owner, not a human.

## 1. Context loading
- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/decisions.md` (ticket text, baseline, constraints).
- Read the `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (row 4 = lifecycle; how parts and `--only` work). Also `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout`, plugin at `.../draw-steel-elements` on branch `sc561-gs59-timeout` at `6270e84a` (= origin/develop). Run `git -C /home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout/draw-steel-elements fetch origin` and confirm `origin/develop` is still `6270e84a`; if it moved, report the new sha but do NOT rebase.
- Prior evidence (read the executive parts, not everything):
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r5-review-report.md` (INFO-1, line ~14)
  - `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r5-review-h7c4/battery-lc5-run1.log` (the FAIL), `battery-lc5-r2.log` (the pass), `shots/gs59-head-run1-FAIL.png`.
  - The ledger dir of the effort that added G-S59: SC-472 (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/` — find the sc472 dir, or `docs/superpowers/dse-overhaul/build-ledgers/` in the main checkout) — for the scenario's intent.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — ignore it, and never touch the main checkout.

## 2. The task — diagnosis, no code changes
The ticket (verbatim): "lifecycle scenario G-S59 failed once with `timed out waiting for the pin or hold released and the tracker redrawn` (load average about 5), then passed on the immediate re-run. … **Expected:** G-S59 passes reliably, since lifecycle is required to land every DSE change."

Note from the SC-520 r5 evidence: write -> redraw latencies were 4-12 s in the failing run and 15-16 s in the PASSING run. A tracker redraw after a vault write should not plausibly take seconds, so do not assume the fix is "raise the timeout".

Answer, with file:line and measured evidence:
1. What exactly G-S59 does, step by step, and which wait timed out (file:line of the wait, its timeout, its predicate).
2. Where the multi-second write -> redraw latency comes from. Is it the scenario's own design (e.g. it waits for a pin/hold release that is timer- or idle-driven, a debounce, a metadata-cache/modify-event delay in Obsidian), a harness artefact (polling interval, screenshotting, CDP round-trips), or a plugin defect (a redraw that is dropped or deferred and only recovered by a later event)? Instrument if needed (timestamps in a private copy / scratch build, CDP probes) — do NOT commit anything to the branch.
3. Reproduce: run G-S59 alone several times (`npm run obsidian-lifecycle -- --only=G-S59`, one run per Bash call, foreground), at idle and under synthetic CPU load (e.g. `stress-ng` if available, or N busy `node -e 'for(;;){}'` loops you start and later kill BY LITERAL PID). Record pass/fail and latency per run. Aim for at least one failing run under load, or show it cannot be made to fail and why.
4. Recommend a fix, classified as: (a) harness/scenario-only (e.g. wait on the right signal, budget the timeout from the measured distribution), (b) plugin defect (name it, the user-visible consequence in real Obsidian, and the fix), or (c) both. Give the concrete change (files, approximate lines), what test proves it, and whether it changes any gate number (lifecycle count stays 52 unless you justify a new scenario — G-S67 is the only free id).
5. Anything that needs a decision from Scott (e.g. a real user-facing defect with a behavioural trade-off). Flag it plainly; do not decide it.

## 3. Gates
No gates required this round (diagnosis). Lifecycle baseline at 6270e84a is 52/52 in five `--only` parts; G-S59 runs in part 5 (`G-S59 G-S49`, ~156 s for G-S59 alone at SC-472 r8).

## 4. Footguns (all mandatory)
- No compound `cd`. Use `git -C <abs path>` for every git command and `devbox run -c /home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout/draw-steel-elements -- <cmd>` for node/npm. Verify the path you write to is inside the worktree or your scratch folder before any write.
- Devbox's `sh` wrapper eats `$?`; record exit codes from a script FILE run via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line.
- One gate per Bash call, in the foreground. No `run_in_background`, no Monitor. Redirect long output to a file (the 600 s stream watchdog kills silent agents), then read the file.
- Never set `DSE_LIFECYCLE_PORT` (each run gets an OS-assigned CDP port). Give each run a private `DSE_CAMERA_TMP` inside your scratch folder.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r1-diag-<4 random chars>/`. Uniquely named scripts and logs inside it. Never use a generic name in the shared scratchpad.
- Never `rm` with a shell-variable target, never a glob `rm` (especially never under /tmp — every concurrent effort's lifecycle vault matches `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- Kill processes by literal PID only, and only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree / scratch folder. Never `pkill`/`killall` by pattern — SC-556 and SC-486 are running the same gates concurrently.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never edit dse-verify SKILL.md.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its FIRST WORD must be `SC-561:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-r1-diagnosis-report.md`. It must OPEN with a ≤10-line executive summary: root cause in one line, class (a/b/c), recommended fix in one line, repro result (N runs, M fails, at what load), any Scott decision needed.

## 6. Return contract
Final text: raw facts only — verdict, root cause class, measured numbers (latencies, pass/fail counts, loadavg), shas, and the absolute path of every evidence artifact (report, logs, screenshots, scripts). No prose.
