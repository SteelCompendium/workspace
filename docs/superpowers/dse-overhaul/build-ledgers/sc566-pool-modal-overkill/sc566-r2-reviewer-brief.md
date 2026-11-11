# SC-566 r2 — independent reviewer brief

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc566-pool-modal-overkill/decisions.md`
  (the spec, quoting the ticket verbatim) and the implementer's report
  `…/sc566-r1-implementer-report.md` in the same dir (read its summary; treat its claims as
  claims to verify, not facts). **You never call the tracker** (Linear).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc566-pool-modal-overkill`, plugin at
  `…/draw-steel-elements`, branch `sc566-pool-modal-overkill`. The diff under review is
  `git -C <worktree>/draw-steel-elements diff a339e7b3..HEAD` (confirm `origin/develop` is still
  `a339e7b3` after `git fetch`). Do not commit to this branch; you are reviewing, not fixing.
- Prior art for the expected behaviour: SC-427 in the stamina edit modal (commit `d58cf6a7` and
  neighbours, helper `appliedStaminaChange`).

## 2. Task — execute and probe, do not just read

The ticket asks that, on overkill, the minion pool modal's Apply button and info line state the
change that will actually happen (the clamped amount), while the preview bar keeps showing the
full damage and Apply's written result stays the same.

Probe at least:
1. The 99 × 5 / pool 20 repro and its neighbours: exact-kill (damage equal to the pool), damage
   one under/over the pool, a single minion ticked with overkill, damage with no minions ticked,
   pool already partly spent, a squad whose pool sits below its living minions' threshold. Does
   the label's kill count still agree with what Apply does in each?
2. Heal direction (the owner's ruling folded it in only if same code path): heal past the pool
   max, and whatever the implementer did or reported.
3. Label, info line, Apply-disabled tooltip and preview bar are mutually consistent and none of
   them contradicts the stepper.
4. The note bytes Apply writes are unchanged versus `a339e7b3` for every probe (write a scratch
   jsdom test under your scratch dir, or a temporary test file you delete before finishing —
   never leave it in the worktree).
5. The SC-567 / SC-573 / SC-574 / SC-591 / SC-592 `test.failing` markers still fail for their
   original reason (not newly passing or failing for a different reason).
6. The flipped SC-566 test is not vacuous: revert just the src change in a scratch copy (or
   `git stash` on a scratch clone — never in the worktree while gates run) and confirm it fails.
7. Re-run jest and the e2e gate yourself (dse-verify skill, command shapes there). Expected:
   jest 7082 passed / 1 skipped plus any tests the implementer added; e2e
   `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs` unless the report explains a
   delta. You need not re-run lifecycle, shots, freeze, parity unless the diff touches code they
   cover beyond this modal's text.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario,
and a prescribed fix.

## 3. Footguns

- No compound `cd`; `git -C <abs path>` and `devbox run -c <abs path> -- …` always.
- Devbox eats `$?`: exit codes from a script file run via `devbox run -c <path> -- bash <script>`;
  read each gate's own summary line; never pipe a gate into `tail`.
- One gate per Bash call, in the foreground; no background jobs or monitors. Redirect long
  output to a file (600 s stream watchdog).
- Never key a wait-loop on a scratch filename or its contents.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc566-r2-rev-<yourAgentId>/`;
  unique script/log names; use the Write tool. Private `DSE_CAMERA_TMP` per e2e run.
- Never `rm` with a variable target, never a glob `rm` (above all under `/tmp`); never touch
  `.superpowers/` outside this effort's dir.
- Kill by literal PID only, after `readlink /proc/<pid>/cwd` shows your worktree. Never
  `pkill`/`killall` — SC-575 and SC-584 run the same gates concurrently.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's and expected.
- Leave the worktree as you found it (`git status` clean at the end; report if not).
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` and the question if blocked. Any
  message you send anyway starts with `SC-566:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc566-pool-modal-overkill/sc566-r2-reviewer-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / FIX-ROUND), finding counts by
severity, the measured jest and e2e lines, the reviewed head sha.

## 5. Return contract

Final text goes to the ticket-owner: raw facts (verdict, sha, findings one line each, measured
numbers), no prose, plus absolute paths of every artifact you produced.
