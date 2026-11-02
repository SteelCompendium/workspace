# SC-534 r1 — does CHR-L01 still flake after SC-539, and can its re-hover loop go? (measure only, no commits)

You are an independent probe/measurement worker for ticket SC-534. Your final text goes to the ticket-owner, not a
human. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is here and
in the files named below.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/decisions.md` — read it first.
- SC-539's preserved ledger (the root cause and the fix that landed):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc539-e2e-chrf02-flake/` —
  read `decisions.md`, the executive summary of `sc539-r1-diag-report.md`, and reuse the probe instrumentation in
  `sc539-r2-proof-churn-instrumentation.diff.txt` (the `SC539_CHURN_MS` foreign-window churn generator and the
  `SC539-XING` real-pointer-crossing counter in `e2e/driver/session.ts`). `sc539-r4-gate-churn150-head.log` shows the
  expected shape of a churn run.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake` (superproject); the plugin is
  `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements`, branch
  `sc534-e2e-chrl01-flake`, at dse `develop` `97284051` (contains SC-539's park, `88cb7db9`). Verify with
  `git -C <plugin path> log --oneline -1` before anything else and `pwd`-check before any write. Do not rebase; do not commit.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read the e2e gate
  section (incl. the SC-539 "one shared private display; the runner parks the X pointer" bullet and the ugrep note:
  use `command grep -a` on `e2e/run.mjs`) and "Current expected numbers". CURRENT at `97284051`:
  e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, preceded by
  `OBSIDIAN-E2E pointer parked at 0,0 on :2xx (outside every window)`.
- The spec: `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`. Lines 43-48 (`waitStable()` + up to 3 re-hovers until
  `panelRevealed()`) and lines 51-54 (`dse.click(collapse, { cdp: true })`) were both added by SC-502 r3 (`d5aaa406`,
  `c5587597`, 2026-10-24) for "flakes under full-run load", before SC-539 found the real cause.
- The main checkout (`/home/scott/code/steelCompendium/workspace`) shows dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) — Scott's live vault, expected; ignore it. Never write in the main
  checkout except your report file in the ledger dir.

## 2. The task

Dispatcher task (quoted from the ledger):

> First prove whether CHR-L01 still flakes after SC-539 (repeat runs under load and with foreign-window churn, as
> SC-539's r1 did); if it no longer does, the remaining work is only to simplify CHR-L01's re-hover loop
> (e2e/…/chrome-live-preview.e2e.ts:43-48) without weakening what it proves — or close with evidence if that loop
> should stay.

Measure, with the crossing counter on in every run (it shows whether a real foreign pointer-leave reached CHR-L01):

A. **Does the shipped CHR-L01 still flake at `97284051`?**
   1. `--only=CHR-L01` with `SC539_CHURN_MS=150`, park ON (shipped): **20 runs** → expect 20/20 ok, 0 leaves.
   2. Positive control, same churn, **park disabled** (a temporary edit to `e2e/run.mjs`, or whatever switch SC-539 r3
      used for its "park-disabled 0/4"): 5 runs → expect failures and leaves > 0. If the shipped spec's re-hover loop
      makes it PASS here, say so — that is evidence the loop masks the bug class.
   3. Load: renderer CPU throttling via CDP `Emulation.setCPUThrottlingRate` (x20, as SC-539 r1 did) on CHR-L01, park on:
      10 runs. **Do not run CPU-burn stress tools** — other agents run gates on this machine. Record `/proc/loadavg`
      before/after each batch.
   4. Two full `npm run e2e` runs (4 shards, the natural shard churn) at HEAD with the counter on: report the summary
      line and CHR-L01's leave count in each. (Full runs with probe instrumentation are partial evidence only; they
      are not the gate.)
B. **The simplified variant** (temporary spec edit): replace lines 43-48 with a single `await dse.hover(root.root)`
   followed by the existing `dse.waitFor(... 'the chrome panel to be revealed by the hover')`.
   - B1 keeps `await waitStable()`; B2 also drops it. Run each: churn 150 + park on ×20, CPU x20 ×10. Also one full
     e2e run with B2 (or B1 if B2 failed anything).
   - Report whether `waitStable()` is ever needed: does the block's rect actually move after `openNote` returns
     (log how many polls `waitStable` takes and whether the rect changed at all, in the A1/A3 runs)?
C. **Anti-vacuity for the simplified spec.** It must still FAIL on the SC-502 bug (Live Preview clips the chrome panel,
   so a click at Collapse's centre lands on the editor line above). Find SC-502's product fix (`git -C <plugin path>
   log --grep=SC-502 -- src styles-source.css` or similar) and build a temporary bundle/tree with it reverted; run the
   simplified CHR-L01 (B1 or B2) and the shipped CHR-L01 against it and report the exact failure line of each.
   Note the spec header: this suite's pinned Obsidian 1.14.4 "has only the hover half of the clip" — say which
   assertion catches it.
D. **The `{ cdp: true }` click (lines 51-54) — measure only, change nothing permanently.** With the default
   `dse.click(collapse)` instead, run churn 150 + park ×10 and CPU x20 ×10. Report the numbers; the owner rules on it.

Then give a recommendation: drop the loop (B1 or B2), or keep it, with the evidence; and whether D is worth a change.

Probe code: temporary instrumentation is fine, but **revert all of it before you finish** —
`git -C <plugin path> status --short` must print nothing at the end (rebuild `main.js` from the clean tree if you
replaced it). Save every probe diff you used as `.diff.txt` in your scratch folder. No commits.

## 3. Gates / how to run

No landing gate this round. Run e2e the way dse-verify says (`npm run e2e -- --only=CHR-L01`, full `npm run e2e`).
Batch repeat runs in a script FILE (Write tool) that loops sequentially, writes each run's summary line + leave count to
a unique log, and finishes under 9 minutes per Bash call (split batches across calls). Each call is ONE blocking
foreground Bash call.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/sc534-r1-report.md`. It must
open with a **≤10-line executive summary**: still flakes yes/no (k/n per condition), positive control k/n, B1/B2
numbers, waitStable needed yes/no, anti-vacuity result, D numbers, recommendation. Body: a table of every batch
(condition, runs, ok, failed, leaves, loadavg), commands, failure lines, file:line.

## 5. Return contract

Final text: raw facts only — the executive summary's numbers and recommendation — plus the **absolute path of every
evidence artifact** you produced (logs, probe diffs, failure bundles copied out of `e2e/.out/`). Report
`Follow-ups:` (seen, left alone) separately. No prose padding.

## 6. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: make a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r1-<yourAgentId>/`
  and keep every script and log there, uniquely named. Use the Write tool for scratch files (no heredocs).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every e2e batch as ONE blocking foreground Bash call (under 10 min). No `run_in_background`, no Monitor, no
  background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; no `cd X && …`. Devbox eats `$?`; record exit codes from inside the script file
  and read each run's summary line.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob or the shared
  `.superpowers/` dir. Overwrite with `>` or use fresh unique filenames instead.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc534-e2e-chrl01-flake/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e uses its own Xvfb `:200–:239`; never `:1`, never `--headed`. The churn generator must target the run's private
  display only (it inherits the shard's `DISPLAY`) — verify that in the first run's log.
- The e2e failure bundle lives in `e2e/.out/<run>/<test-id>/` with 12-run retention — copy a failure's bundle to your
  scratch folder right after the batch that produced it.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question
  in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-534:`.
