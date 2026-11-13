# SC-616 r1 — diagnose the G-S91 hover-preview flake (reviewer, diagnosis round)

You are a worker for the SC-616 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context to load (in this order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/decisions.md` (goal, failure forms, measured rates, baseline).
2. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — about 360 KB, read in PARTS: line 20-133 (battery; row 4 is lifecycle and its six `--only` parts), line 134-220 (devbox wrapping, lifecycle and e2e notes incl. the G-S91 flake bullet at line 182, the exit-code footgun), line 470-486 ("Hover preview modals (SC-595)", incl. the SC-598 "focuses the preview itself for the click that opened it" bullet and its stated RESIDUAL).
3. Prior art (tracked, read summaries/exec-summaries first): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/` (`sc598-r1-design-report.md` — the probe method and Obsidian internals `T3` / click-to-edit helper; `sc598-r3-*` G-S91 matrix logs) and `.../sc607-open-preview-stale-card-write/` (`sc607-r2-gs91-flake-on-base-run4.log`, `sc607-r2-gs91-flake-on-branch-alone-run1.log`, `sc607-r2-gate-lifecycle-p5-run-G-S91-fail-3.log`).
4. Code: G-S91 lives in `draw-steel-elements/visual-harness/obsidian-lifecycle.mjs` (scenario at ~line 8330, `gs91Trial` at ~line 1793, `gs83Kit` helpers). Product: `DseModal.focusHoverPreviewNow` / `arm()` in `src/` (grep `focusHoverPreviewNow`).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`, dse submodule at `.../draw-steel-elements`, branch `sc616-gs91-hover-flake`, at dse develop `c0995beb`. First: `git -C <dse path> fetch origin` and confirm `origin/develop` is still `c0995beb` (if it moved, rebase onto it and say so). Verify `pwd`/use absolute paths before any write. The main checkout (`/home/scott/code/steelCompendium/workspace`) is shared: never write code there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected.

## 2. The task — DIAGNOSIS ONLY, no product or harness commit

The ticket's goal (verbatim, ledger): "Expected: G-S91 passes every run, or the trial is fixed so that it only fails when the product is wrong."

Answer, with measured evidence:

1. **Reproduce.** Run G-S91 alone (`--only=G-S91`) repeatedly on `c0995beb` (aim for >= 10 runs; more if cheap). Also try it under induced load or CPU throttle if the plain rate is too low to study (the SKILL notes `Emulation.setCPUThrottlingRate` / delayed driver replies as deterministic straddle tools for e2e; a lifecycle analogue is fine as an UNCOMMITTED probe). Record each trial's `gap`, `at700`, and pass/fail. Give the rate per failure form.
2. **Find what hides the preview in the failing `title` trial.** Instrument (uncommitted probe; keep the probe as a `.diff.txt` in the ledger dir) the event order with timestamps in the page: the opening click's dispatch start/end, `focusHoverPreviewNow`'s synthetic click, the helper's 10 ms / 150 ms timers firing (when the preview gets focused / `.is-editing`), the second press's mousedown/mouseup/click arrival, Obsidian's window-capture `T3` hide (5 ms after a click), and the modal open/close. Capture at least one failing run with the full timeline and one passing run for contrast.
3. **Classify the cause** — exactly one (or say which mix):
   (a) the known SC-598 RESIDUAL (a second press queued/handled before the helper's 10 ms timer focuses the preview, e.g. because the opening click's dispatch + modal render is a long task and input outranks timers) — i.e. a real product gap the test exposes under load;
   (b) a different product bug;
   (c) a test-harness artifact (e.g. the trial's timing/measurement, the 700 ms sampling, hover state, a leftover from the previous trial, pointer position) — i.e. the product is right and the test is wrong;
   (d) the `155 ms` form: the trial's own validity guard tripping under load (a test-validity issue, not a product failure).
4. **Propose fixes** for each cause found, with cost and risk: a product fix (e.g. focusing the preview synchronously in the opening click — say whether public API allows it; SC-598 held to "Public API only"), and/or a harness fix (e.g. retrying an INCONCLUSIVE trial whose gap is out of range instead of failing; or any change that removes a harness artifact). For any harness fix, state precisely how it keeps the trial red on the pre-SC-598 base (the trial was red-on-base at SC-598: `sc598-r2-red-on-base-G-S91.log`) — a fix must not make G-S91 vacuous. If a product fix is feasible, a quick prototype + a few runs showing the rate drop is worth more than prose.
5. Say plainly whether choosing between options needs a product decision from Scott (e.g. "accept the residual and make the test tolerate it" vs "fix the residual"), and give your recommendation.

Scope: G-S91 and the code it exercises. Do not change other scenarios. Do not edit SKILL.md.

## 3. Gates / run mechanics

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command; devbox eats `$?` and `| tail` eats failures — run via a script FILE that writes its own exit code and redirect output to a log file. Lifecycle command per dse-verify row 4 (`npm run obsidian-lifecycle -- --only=G-S91`; check the exact flag shape in the SKILL / the harness). G-S91 alone is about 51 s with build and start-up.
- Run each gate/batch as ONE blocking foreground Bash call under 600 s (batch e.g. 5 runs per call). No `run_in_background`, no Monitor, no waiting for notifications.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r1-<yourAgentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool.
- Never `rm -rf` a `/tmp` glob or any glob; never `rm` with a shell-variable path; delete only literal paths you created. Never `rm -rf` `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line (or `readlink /proc/<pid>/cwd`) is inside YOUR worktree.
- `git -C <absolute path>` for every git command.
- Revert every probe before you finish: the branch must end at `c0995beb` (or the rebased tip) with a clean tree. Save probes as `.diff.txt` in the ledger dir.

Baseline at `c0995beb`: lifecycle 61/61 (part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`, 7, ~395 s). You need not run the full battery this round.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-r1-diagnosis-report.md`. Copy the deciding logs (one failing timeline, one passing) and probe diffs into the same dir with `sc616-r1-` prefixes. The report must OPEN with a <=10-line executive summary: reproduction rate, the classified cause, the recommended fix, and whether it needs Scott.
If the report-file write is blocked by your harness, return the report inline.

## 5. Footguns

- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-616:`.

## 6. Return contract

Final text: raw facts, no prose — STATUS, rate per failure form (runs, fails), classified cause, recommended fix (one line), needs-Scott yes/no, final branch sha + clean-tree confirmation, and the absolute path of every evidence artifact you produced.
