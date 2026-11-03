# SC-548 r1 brief: measure the hidden Reading-view render (measurement round, no commits)

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc548-lp-hidden-reading-redraw/decisions.md` — read it first. It is the current state; there are no Scott rulings yet.
- Prior evidence (SC-472, landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc472-scroll-pin-timer/`.
  - `sc472-r1-design-report.md`: executive summary, the survey table (section A), and the Follow-ups (last item is this ticket).
  - The `mh3rd` events in `sc472-r1-summ-b-gs52-thr8-1-stock.txt` and the other `sc472-r1-summ-*.txt` files. Find the event legend in `sc472-r1-summ.py.txt` / `sc472-r1-probe-block.mjs.txt`.
  - Reusable tooling: `sc472-r1-probe-block.mjs.txt` (P472 scenarios + page timeline recorder), `sc472-r1-mkharness.cjs.txt`, `sc472-r1-run.sh`, `sc472-r1-realload.sh`, `sc472-r1-mkbundle.sh`, `sc472-r1-variant.sh`. SC-472 r3/r5/r7 refreshed the probe (`sc472-r7-probe-block.mjs.txt` is the newest). Adapt them; do not trust their hard-coded paths or ports.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw`, dse submodule at `draw-steel-elements/` on branch `sc548-lp-hidden-reading-redraw`, cut at dse `develop` `0698550f`. First run `git -C /home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw/draw-steel-elements fetch origin` and report whether `origin/develop` has moved past `0698550f` (do not rebase; just report it, and say whether `src/framework/host/` changed).
- Verify `pwd`/paths before any write. Nothing gets written into the tree in this round: build bundles from `git archive` exports in your scratch dir, run the lifecycle harness as a scratch copy with your probe injected (the SC-472 r1 method). At the end `git status --porcelain` must be empty in the worktree and its dse submodule; report that.
- **Workers never call the tracker** — not to read history, not to post. The ledger and the files above are your whole context.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, leave it alone.

## 2. The task

The ticket's direction is not decided. Its text (an agent's note, not a Scott ruling), quoted from the ledger:

> **Possible direction (not decided):** skip or defer the DSE render when the host is a Reading view that is not the leaf's current mode. Measure how much of the write-to-redraw latency it accounts for first.

Answer these four questions with measured numbers. Stop when they are answered; this is a bounded round (aim for at most ~30 harness runs). If one cannot be answered in budget, say what is missing.

**Q1. Mechanism.** In a Live Preview leaf, confirm that the leaf's hidden Reading view (`MarkdownView.previewMode`) re-renders an embed when the embedded note is written. Name the path: which Obsidian event triggers it, which DSE entry point runs (code-block processor → which host class in `src/framework/host/`), and how much of DSE's mount runs (full tracker mount? its own pins/holds?). Count DSE renders per write: visible LP pane vs hidden Reading view. Check whether the same happens for (a) an LP leaf showing the embedded note's host note, (b) the note itself open in LP (no embed), (c) a second pane. Does the SC-472 `pinReadingViewsOf()` pin the hidden Reading view too?

**Q2. Cost.** Per write, main-thread time spent rendering the hidden Reading view, split into DSE's own share (what a DSE skip could remove) and Obsidian's markdown render share (which DSE cannot remove). Then the share of the write-to-visible-redraw latency (vault `modify` → visible LP block remounted and painted) it accounts for. Measure unloaded and at 8x CDP CPU throttle, on the G-S52 shape (LP embed tracker) and SC-470's LP sibling shape. Record loadavg at start and end of every run (other efforts run gates concurrently).

**Q3. Prototype the skip** in a scratch bundle: DSE does not render (or defers until the view becomes active) when its host element sits in a Reading view whose leaf's current mode is source/Live Preview. Measure the latency delta on the same shapes. Then probe correctness of the skip/defer, at least:
- switching that leaf LP → Reading after a skipped write: does the block show, fresh, without a blank or stale frame? Does Obsidian re-render on mode switch or reuse the hidden render?
- switching back; and a write while in Reading mode (must be unchanged);
- export to PDF / print, hover popover, and any other consumer of the hidden preview you find;
- the SC-472 pin/hold/backstop (G-S8, G-S52, G-S59 must stay green on the prototype — run those lifecycle scenarios on it);
- where the guard would live, and whether it collides with SC-547 (LP twin check in `ReadingModeBlockHost.ts`) or SC-552 (`ReadingModeBlockHost.replaceSource` twin form saves).

**Q4. Recommendation**, one of: ship the skip, ship a defer, close as not worth it, or a question Scott must decide. Give the deciding numbers and the risk list. If you recommend shipping, sketch the change (files, approx lines) and the tests (jest + a G-S66 lifecycle scenario placed in part 3 or part 4 before G-S56 — "G-S56 must stay last").

## 3. Gates

No gates to pass this round (nothing is committed). Lifecycle scenarios you run on stock and prototype use the dse-verify skill's lifecycle shapes (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, row 4 and the CURRENT block). Since SC-551 lifecycle picks its own CDP port — no private `DSE_LIFECYCLE_PORT` is needed. For reference, CURRENT at `0698550f`: jest 6378 passed / 1 skipped / 253 of 254 suites; lifecycle 49/49 in five `--only` parts (21 + 16 + 7 + 4 + 1); e2e 128/128, 89/89 pairs.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc548-lp-hidden-reading-redraw/sc548-r1-measure-report.md`. Put every evidence file (logs, timelines, patch, scripts) in the same dir with the prefix `sc548-r1-`. The report must open with an executive summary of at most 10 lines: the Q4 recommendation first, then the deciding numbers.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, shas, bundle hashes, measured numbers, no prose — plus the absolute path of every evidence artifact you produced.

## Footguns (all of them apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever do send a message anyway, its first word must be `SC-548:`.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc548-r1-reviewer/` with uniquely named (`sc548-r1-*`) scripts and logs. Never a generic name like `gate.sh`.
- Use the Write tool for scratch files (no heredoc writes). Never `cd` inside a compound command; use `git -C <absolute path>` for every git command and `devbox run -c <absolute path> -- …` for devbox. Devbox eats `$?` and pipes eat failures: record exit codes from a script file run through `devbox run -c <path> -- bash <script>`, and read each run's summary line.
- No `rm` with a shell-variable target, no glob `rm`, and never `rm -rf` a `/tmp` pattern such as `/tmp/dse-obsidian-lifecycle-*` (other efforts' vaults match it). Delete only paths you created and recorded, by literal path. Never touch `.superpowers/` outside this effort's dir.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains your own worktree or scratch path (check `readlink /proc/<pid>/cwd` when the command line has none). Busy-loop load generators: record their PIDs and kill exactly those.
- Run each harness run as one blocking foreground call under the 10-minute tool timeout; no `run_in_background`, no Monitor. If a run must be backgrounded, poll its own log/exit file.
