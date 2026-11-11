# SC-573 independent review brief, round 1

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc573-pool-zero-apply/decisions.md`
  (ledger), the implementer brief `sc573-brief-impl-r1.md` and its report `sc573-impl-r1-report.md`
  in the same dir (read the report's executive summary; do not trust its claims — verify).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for gate shapes.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply`,
  submodule `draw-steel-elements`, branch `sc573-pool-zero-apply`. Review the diff
  `origin/develop...HEAD` (develop is `eaa8742a` — SC-577 and SC-584 landed after the impl brief was cut at `f2889351`; the branch must be rebased onto it; `git -C <abs> fetch origin` first).
- **You never call the tracker (Linear).** You do not edit the branch: you are the reviewer.
  If you write probe tests, put them in your scratch folder or revert them before you finish
  (`git -C <abs> status` must be clean at the end). The main checkout's dse vault dirt
  (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's and expected.

## 2. The task

Adversarial review of the SC-573 fix in `src/views/MinionStaminaPoolModal.ts`: a squad whose pool
is at 0 (or below) with minions still alive can now record their deaths from the pool modal. Owner
decisions are in the ledger — check the code honours each one verbatim (the exact label
"Kill N minion(s)", the exact info sentence "The pool is at 0, so N minion(s) die.", heal at pool 0
unchanged), and that SC-421/574/584/591/592 behaviour was NOT changed.

Execute and probe, not just read. At minimum:
- Throwaway jsdom probes (scratch copy of the matrix test harness) for: pool 0 nothing staged; pool 0
  + damage via the Apply Damage row; pool 0 + stepper +/- (can the stepper move off 0 upward = heal,
  and back down = 0 staged?); pool 0 + typed draft (SC-430 draft path vs committed state agree);
  pool 0 + heal (refused, reason intact); Reset; negative hand-edited pool; pool 0 with some minions
  already dead; pool 0 with 0 alive; a captained squad (captain bonus folded) at pool 0; a squad whose
  pool is 0 because a captain was relieved, built through `EncounterData` the real way if feasible.
- Regression: every pool > 0 state must render byte-identical labels/info/enabled/title to
  `origin/develop`. Diff a probe's output across both builds for a grid of pool/pending/ticks states.
- Apply writes: pool written as 0 (never negative), exactly the living minions marked dead, persist
  once, no double-write; nothing else in the group mutated.
- Accessibility: the button's accessible name, `title`, and the info line's visibility (`hidden`
  attribute, never inline display) in each state.
- Vacuity: run the new tests against the unfixed src (stash the src change in your scratch, not on
  the branch) — each new test should fail there unless it is a stated regression pin.
- If an e2e step was added: run it, and check it is not vacuous (does it actually reach pool 0 with
  living minions?).
- Gates: full jest; full e2e (expected `258/264 ok` plus any new steps, `0 failed, 6 known-bug,
  coverage: 164/164 pairs` (+ any new pair); jest baseline 7177 passed / 2 skipped (fresh worktree) plus new tests; lifecycle 54/54; RECOV-R07 is a documented load flake — re-run alone). Lifecycle and shots:
  spot-check only if the diff touches anything they exercise; say which and why.
- One real-Obsidian screenshot of the modal at pool 0, nothing staged (label + info line visible),
  if the implementer did not produce one — and if they did, eyeball it and say whether it shows the
  decided strings. Save under your scratch folder.

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## Footguns (every one has cost real time)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply/draw-steel-elements -- <cmd>`
  for node/npm. Never `cd X && …`.
- Never `rm` with a variable target; never a glob `rm` (especially under /tmp — other efforts'
  lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- One gate per Bash call, in the FOREGROUND, output redirected to a file in your scratch folder,
  then read the file. No background gates and no Monitor — except shots, which may run in the
  background; if you do, POLL its own log file (unique per-run path). A job you started never wakes you.
- Lifecycle, if you run it: FIVE `--only` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16;
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4;
  `G-S59 G-S49 G-S73 G-S77` 4, ~272 s; part 3 runs close to 480 s under load — use a 600000 ms timeout), G-S56 stays LAST in SCENARIOS order; never set `DSE_LIFECYCLE_PORT`;
  a private `DSE_CAMERA_TMP` per run inside your scratch folder.
- Devbox eats exit codes and `| tail` eats failures: record exit codes from a script file run
  through devbox (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`)
  is inside your worktree. Never `pkill`/`killall` by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-review-<yourAgentId>/`
  — uniquely named scripts and logs inside it. Write scratch files with the Write tool, not heredocs.
- Never touch `.superpowers/sdd/freeze-baseline.sha256` or any other effort's ledger. Never
  `rm -rf` anything under `.superpowers/`.
- Never key a wait-loop on a scratch filename or its contents — read the process's own output, or a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents.
- Never tag or release draw-steel-elements. Do not push or commit.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message, its
  first word must be `SC-573:`.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc573-pool-zero-apply/sc573-review-r1-report.md`.
If the write is blocked by your harness, return the report inline. It opens with a ≤10-line
executive summary (verdict LAND / FIX-FIRST, finding counts by severity, gate numbers you measured),
then findings, then the probe list with results.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, finding counts, measured
gate numbers, plus the absolute path of every evidence artifact (report, probe files, logs,
screenshot). No prose.
