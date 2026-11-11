# SC-567 independent review brief, round 1

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc567-pool-modal-overticked-apply/decisions.md`
  (ledger), the implementer brief `sc567-brief-impl-r1.md` and its report `sc567-impl-r1-report.md`
  in the same dir (read the report's executive summary; do not trust its claims — verify).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for gate shapes.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply`,
  submodule `draw-steel-elements`, branch `sc567-pool-modal-overticked-apply`. Review the diff
  `origin/develop...HEAD` (develop was `b4e7b4f4` at dispatch; `git -C <abs> fetch origin` first).
- **You never call the tracker (Linear).** You do not edit the branch: you are the reviewer.
  If you write probe tests, put them in your scratch folder or revert them before you finish
  (`git -C <abs> status` must be clean at the end, except Scott's expected vault dirt in the MAIN
  checkout, which is not your concern).

## 2. The task

Adversarial review of the SC-567 fix: when the owed kills drop below the number of ticked minions
in the minion stamina pool modal, the surplus ticks are trimmed, most recent pick first. Owner
decisions are in the ledger — check the code honours each one verbatim, and that SC-573/574/591/592
behaviour was NOT changed.

Execute and probe, not just read. At minimum:
- Write throwaway jsdom probes (scratch copy of the matrix test harness) for: tick order across
  uncheck/re-check; mixed auto-ticks (pool to 0) then back to 1-2 owed; the draft (uncommitted typed
  value) path vs the committed path giving the same Apply state; +/- or any other damage-changing
  control; heal paths (`minionsToKill < 0`); Apply after a trim writing exactly the kept minions to
  the vault/state; a squad where some minions are already dead (aliveMinions < total); modal
  reopen (does stale tick-order state leak across opens or across squads?).
- Look for: the trim firing when it should not (owed kills unchanged, or rising); any path where
  the count shown in label/tooltip/info disagrees with the boxes; tick-order bookkeeping that leaks
  or is never cleared; tests that are vacuous (would pass on the unfixed code — check by stashing
  the src change against the new tests, in your scratch, not on the branch).
- Re-run jest in full and the pool-relevant e2e (`e2e` full run is the gate: expected
  `>=255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`; RECOV-R07 is a documented load
  flake). Lifecycle and shots: spot-check only if the diff touches anything they exercise; say which.

## Footguns

- No compound `cd`; `git -C <abs path>` for git, `devbox run -c /home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply/draw-steel-elements -- <cmd>` for node/npm.
- Never `rm` with a variable target; never a glob `rm` (above all under /tmp). Literal paths you created only.
- One gate per Bash call, foreground, output redirected to a file; read the file. No background
  gates, no Monitor. Lifecycle (if run) in the five `--only` parts named in the dse-verify skill,
  G-S56 last in SCENARIOS order; never set DSE_LIFECYCLE_PORT; private DSE_CAMERA_TMP.
- Devbox eats exit codes; run gates via a script file and read summary lines.
- Kill processes by literal PID only, whose cwd is inside this worktree. Never pkill by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-review-<yourAgentId>/`; Write tool for scratch files.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to files (600s watchdog).
- Never touch `.superpowers/sdd/freeze-baseline.sha256`, never `rm -rf` under `.superpowers/`.
- You cannot `SendMessage` me. Need input: end with `STATUS: NEEDS_CONTEXT` and the question. Any
  message you do send starts with `SC-567:`.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc567-pool-modal-overticked-apply/sc567-review-r1-report.md`
(inline if the write is blocked). Opens with a ≤10-line executive summary: verdict (LAND / FIX
FIRST), counts by severity, gate numbers you measured. Then findings by severity
(HIGH/MEDIUM/LOW/INFO) with file:line, a concrete failure scenario, and a prescribed fix. List
every probe you ran and its result.

## 4. Return contract

Final text to the ticket-owner, not a human: verdict, findings count by severity, the sha you
reviewed, measured numbers, absolute paths of the report and any probe files/logs. No prose.
