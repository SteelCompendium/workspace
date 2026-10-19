# SC-430 independent review brief — round 1

## 1. Context loading
- Read: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc430-apply-click/decisions.md (ledger), sc430-brief-impl.md (what the implementer was asked), sc430-report-impl-r1.md (what it says it did) — all in that dir. Workers NEVER call the tracker.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc430-apply-click/draw-steel-elements, branch `sc430-apply-click`, review head = 7659528, base develop 0d69ec9. Do NOT commit to this branch. If you need to experiment, use `git worktree add` into an absolute scratch path under your session scratchpad, never re-point remotes. `git -C <absolute path>` for every git command.
- Read /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md for the battery and its footguns.

## 2. The task — EXECUTE AND PROBE, don't just read
Adversarially review the diff `0d69ec9..7659528`. The bug: after typing a new Stamina value (focus still in the field), the first click on Apply's padding was swallowed because Apply was disabled until blur. Design calls D1–D4 are in the ledger; verify each is honored.

Scope note: the branch also fixes MinionStaminaPoolModal (ledger F1, commit 7659528) — review that too, same probes (incl. kill-checkbox prediction while a draft is pending, and no double application).

Probe at least:
- Does the fix actually work for a real pointer press on Apply's padding in real Obsidian (the e2e `[STAM-S13]` scenario, now unmarked)? Confirm the scenario genuinely discriminates: temporarily revert just the src fix in a scratch worktree and confirm STAM-S13 FAILS there.
- Edge cases: draft equal to current value; empty / non-numeric / negative / over-max draft; typing then Escape writes nothing; typing then Tab/blur then click; typing in Temp Stamina (D3) and any other typed field gating Apply; Apply label ("Lose N"/"Gain N") matches what clampStamina persists, including hero negative floor and over-max; double-application risk (draft committed on Apply click AND by the blur that the click causes — is anything applied twice or is the number written once?).
- D1: kit stepper default behavior unchanged for all other callers; lifecycle G-S3 still green.
- Vacuous tests: do the new jest tests fail without the fix?
- Re-run: jest, lifecycle (`DSE_LIFECYCLE_PORT=9289`), full e2e. Shots/freeze/parity only if src touched anything render-visible on first paint.
Expected numbers: jest 4732 passed / 1 skipped / 227 of 228 suites + implementer's additions · lifecycle 25/25 · e2e `60/71 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs` (or as the report states with justification) · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc430-apply-click/sc430-report-review-r1.md — opens with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 4. Return contract
Final text goes to the ticket-owner, not a human: verdict, reviewed sha, findings list (severity, file:line, one line each), measured gate lines, absolute paths of every artifact. No prose.

## Footguns
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents. Read the process's own output or a per-run unique path.
- Redirect long output to a file; run gates in the FOREGROUND with a timeout; never background a gate and wait for a notification.
- Never pkill/killall by pattern; kill only by PID whose command line contains your own worktree path.
- Never rm -rf the shared `.superpowers/` dir.
- Read gate exit codes through a wrapper script file (devbox eats `$?`).
- You cannot SendMessage me; end with STATUS: NEEDS_CONTEXT if blocked. Any message you send anyway must start with `SC-430:`.
