# SC-595 r7 — scoped re-check (reviewer R3, resumed or replacement)

Your final text goes to the ticket-owner, not a human. Scope: the r6 delta only.

## Context
- Ledger `decisions.md` (O9) and `sc595-r6-rebase-report.md` (executive summary first) in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`; your own `sc595-r5-rereview-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`; dse head `6725243c` on `c3fd8323`; superproject `6152eb69 (on workspace origin/main ae04f37b; draw-steel-elements pointer unstaged by design)`. Workers never call the tracker. Do not commit; `git status` as you found it at the end.

## Task
1. Rebase check: `git range-diff 6c7216e8..a53b0454 c3fd8323..d15616bc` — every pre-r6 commit `=` or explained; read every conflict resolution, especially `src/elements/initiative/view.ts` (SC-578 Malice log + SC-595 openModal anchor) and `test/dom/elements/initiative.test.ts`. Confirm SC-578's behaviour is intact (its INIT-M09 e2e passes in the full e2e).
2. MEDIUM-1 fix: literal delays in the tests; the 150 ms fake-timer step; the new G-S83 Escape-after-text-click step. Run M16 yourself: red in jest AND in G-S83 (M16 bundle). Spot-check two other mutants.
3. Gates on the final head yourself: tsc, lint, jest (expect 7200 + SC-595 tests / 1 skipped, or 1 fewer passed / 2 skipped in a fresh worktree; SC-568 suites green alone), lifecycle part 5 (5/5) and e2e (`260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`; RECOV-R07 load flake → re-run alone). styles.css byte-identical to a clean `c3fd8323` build.
Verdict LAND or FIX with findings (severity, file:line, fix).

## Footguns
No compound `cd` (`git -C`, `devbox run -c <abs>`); exit codes via a script file; never `rm` a variable target and NEVER a glob `rm` under /tmp; one gate per Bash call in the foreground, no background gates/Monitors; long output to files; lifecycle `--only` parts, G-S56 last; never set `DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP`; kill by literal PID inside your worktree/scratch only; private scratch `…/scratchpad/sc595-r7-recheck-<agentId>/`; never key a wait-loop on a scratch filename; Scott's main-checkout vault dirt is expected; if the report write is blocked return inline; you cannot SendMessage me — `STATUS: NEEDS_CONTEXT` (stray messages start `SC-595:`).

## Report + return
`sc595-r7-recheck-report.md`, ≤10-line executive summary first; logs `sc595-r7-*`. Final text: verdict, findings one line each, gate summary lines, M16 result, absolute artifact paths.
