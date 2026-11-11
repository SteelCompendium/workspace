# SC-567 implementer brief, round 1

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc567-pool-modal-overticked-apply/decisions.md`
  (the ledger — current-state truth; this brief quotes it).
- Read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gate
  commands, devbox shapes, freeze/parity rules) and `draw-steel-elements/AGENTS.md` in your worktree.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply`, branch
  `sc567-pool-modal-overticked-apply` in the `draw-steel-elements` submodule. Verify with
  `git -C <abs path> rev-parse --abbrev-ref HEAD` and check every write path is inside that
  worktree. Never write under `/home/scott/code/steelCompendium/workspace/` except your report
  file in the ledger dir.
- Start: `git -C /home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply/draw-steel-elements fetch origin`
  and confirm the branch is at or rebased onto `origin/develop` = `b4e7b4f4` (rebase if develop moved; say so).
- **You never call the tracker (Linear)** — not to read, not to post.
- The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's and expected; ignore it.

## 2. The task

Bug: `draw-steel-elements/src/views/MinionStaminaPoolModal.ts`. Repro (jsdom matrix reproduces it):
squad pool 20 (5 minions x 4). Type 12 (2 kills owed), tick Goblin #1 and #2. Type 16 (1 kill
owed). Both boxes stay ticked, Apply disabled, tooltip and info line say "Select 1 minion(s) to
kill" though 2 are ticked. At 0 owed, ticks already clear (`updateCheckboxes`, `minionsToKill <= 0`
branch); at 1 they do not.

Owner decisions (verbatim from the ledger):

> - **Trim, not reword.** Reasons: the modal already enforces "never more ticks than owed kills"
>   everywhere else — unticked boxes disable once the count reaches the owed kills
>   (`updateCheckboxes`), and at 0 owed every tick clears. The over-ticked state is reachable only
>   by lowering the damage after ticking, so trimming restores the modal's own invariant and adds
>   no new wording.
> - **Which ticks go:** the most recently ticked boxes are unticked first (undo the last pick);
>   the user's earlier picks stay. Boxes the modal ticked itself (the 0-pool auto ticks,
>   `item.auto`) are reverted first exactly as today, before the trim.
> - The SC-430 draft-prediction path in `updateActionButton` must predict the trim too (count =
>   min(user ticks, owed kills)), so Apply's state while typing matches the post-commit state.
> - Out of scope — SC-573 (pool 0 with a minion alive leaves Apply disabled; same enable logic),
>   SC-574, SC-592, SC-591. Do not fold.

Implementation notes (yours to refine):
- You need a tick order. Record it when the user ticks a box (e.g. a monotonically increasing
  sequence number on the checkbox item, set on user check, cleared on uncheck). Make sure
  re-checking after an uncheck gets a fresh (later) number. Auto ticks must not count as user
  picks. Read how `item.auto` and the change handler work before choosing.
- After the trim, the remaining ticked boxes stay enabled and the unticked ones disable (the
  existing `selectedCount >= minionsToKill` rule then applies with selectedCount == owed).
- Check every caller order: the trim must happen before `updateActionButton`/`updateInfoText`
  read the count. Check the +/- / any other path that changes pending damage, not only typing.
- Paths that write state (Apply) must kill exactly the remaining ticked minions — add a test that
  Apply after a trim kills Goblin #1 (the earlier pick), not #2.

Tests (jest, jsdom):
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:760-763` has a `test.failing` citing
  SC-567: flip it to a plain `test` (keep its assertion; update its comment to say trim was chosen).
- Add tests: (a) 2 owed, tick #1 then #2, drop to 1 owed -> #2 unticked, #1 ticked, Apply enabled,
  label "kill 1 minion(s)", no "Select" tooltip; (b) tick order #4 then #1, drop to 1 -> #4 stays
  (it was first); (c) the draft path — while the typed value is still a draft (uncommitted), Apply's
  enabled state already equals the post-commit state; (d) 3 owed with 3 ticked dropping to 1 -> only
  the earliest pick stays; (e) raising owed kills again after a trim does NOT re-tick the trimmed
  box (no silent resurrection); (f) the 0-pool auto-tick then back off case still restores exactly
  the user's ticks, trimmed if they exceed the new owed count; (g) Apply after a trim writes the
  kill to the earlier pick only.
- If the e2e pool driver (`e2e/driver/pool.ts`, SC-435) has an assertion or known-bug marker for
  this state, update it; if adding one e2e step that drives the repro end-to-end in Obsidian is
  cheap, add it. Do not change the e2e coverage contract.

Commit after each coherent step (code+tests, then any e2e). Conventional message, prefix
`fix(pool-modal): ... (SC-567)`. No AI attribution trailers in commits.

## 3. Gates (full dse-verify battery, in its order)

Expected at `b4e7b4f4` (deltas from your new tests are fine; state them):
- tsc clean, lint clean
- jest 7088 passed / 1 skipped baseline (yours: + new tests; the flipped `test.failing` stays
  counted). SC-568 load timeouts can flake a suite under full load — re-run that suite alone; green alone is green.
- lifecycle 53/53, run in FIVE `--only` parts exactly:
  1. `G-S7a … G-S9a` (21 ids — take the exact list from the SCENARIOS order in dse-verify / the lifecycle script)
  2. `G-S9b … G-S40` (16)
  3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
  4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
  5. `G-S59 G-S49 G-S73` (3)
  Never set `DSE_LIFECYCLE_PORT`. Give each run a private `DSE_CAMERA_TMP` inside your scratch folder.
- e2e: `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (RECOV-R07 is a documented
  load flake — re-run alone if it fails). If you add an e2e step, the ok count rises; state it.
- shots 592; host-leak 163/978; modal host-leak 39 kinds / 234 comparisons; capture clip 147
- freeze 280/280 (no visual change is expected — the trim changes only which boxes are ticked
  in a state the shots do not stage; if a frozen hash moves, STOP and report with before/after crops)
- parity 0/0/24 (last)

## Footguns (every one has cost real time)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply/draw-steel-elements -- <cmd>`
  for node/npm. Never `cd X && …`.
- Never `rm` with a variable target; never a glob `rm` (especially under /tmp — other efforts'
  lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- One gate per Bash call, in the FOREGROUND, output redirected to a file in your scratch folder,
  then read the file. No background gates and no Monitor — except shots, which may run in the
  background; if you do, POLL its own log file (unique per-run path) until its summary line
  appears. A job you started never wakes you.
- Devbox eats exit codes and `| tail` eats failures: record exit codes from a script file run
  through devbox (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`)
  is inside your worktree. Never `pkill`/`killall` by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-impl-<yourAgentId>/`
  — uniquely named scripts and logs inside it. Write scratch files with the Write tool, not heredocs.
- Never touch `.superpowers/sdd/freeze-baseline.sha256` or any other effort's ledger. Never
  `rm -rf` anything under `.superpowers/`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output, or a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents.
- Never tag or release draw-steel-elements. Do not push; the dispatcher lands.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message, its
  first word must be `SC-567:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc567-pool-modal-overticked-apply/sc567-impl-r1-report.md`.
If the write is blocked by your harness, return the report inline. It opens with a ≤10-line
executive summary (verdict, branch sha, every gate number), then: files changed, design of the
tick-order tracking, each test added (name + what it pins), `Drive-by fixes:` and `Follow-ups:`.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS /
NEEDS_CONTEXT / BLOCKED), branch head sha, measured gate numbers, plus the absolute path of every
evidence artifact (report, gate logs). No prose.
