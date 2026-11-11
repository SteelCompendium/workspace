# SC-595 r5 — scoped re-review of the r4 delta (reviewer)

You did not write this code. Your final text goes to the ticket-owner, not a human. Execute and probe; scope is the r4 delta only, not a fresh full pass.

## 1. Context

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md` (O4-O8).
- The findings r4 had to fix: `sc595-r3-review-report.md` (HIGH-1, HIGH-2, MEDIUM-3, MEDIUM-4, LOW-5, LOW-6) and the reviewer's probes `sc595-r3-probe-scenario.js.txt`, `sc595-r3-jsdom-probe.test.ts.txt`. The fix report: `sc595-r4-fix-report.md` (executive summary first).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`; dse delta `74b138f0 (= r3-reviewed 0f5c9c98 rebased onto 6c7216e8)..a53b0454` (r3 reviewed `0f5c9c98`; old→new sha map is in `sc595-r4-fix-report.md`); superproject head `701674ac (on workspace origin/main 357106d6; draw-steel-elements pointer unstaged by design)`. `git -C … fetch origin`; the branch must sit on `6c7216e8` (or later origin/develop). Do not commit; scratch probes reverted; `git status` clean at the end.
- **Workers never call the tracker.**

## 2. Task

O8 (verbatim):
> fold ALL into r4 fix round (resume I1): HIGH-1 (`composedPath()` instead of `contains()`), HIGH-2 (remove the guard one task after close), MEDIUM-3 (CHANGELOG + dse-verify proposal accurate after the fix), MEDIUM-4 (tests: a click on a control that redraws / closes a modal, in jest and one G-S83 step each; anchor tests that kill r3 mutants M8 M9 M10), LOW-5 (adopt the structural re-push ordering from the r3 prototype; replace the 200 ms margin), LOW-6 (child modal opened within the parent's re-push window must stay on top; push on the modal's own window). INFO items: no action (popout not probed — accept, note in report).

For each finding: is it fixed, with a test that fails without the fix (run the mutant yourself)? Re-run the r3 real-Obsidian probe (`sc595-r3-probe-scenario.js.txt`) on the new head: every case that failed on `0f5c9c98` must pass. Probe the new code for regressions it could introduce: the deferred guard removal (a click right after close — does a genuine outside click within that task still dismiss the preview? a modal reopened immediately?), the new re-push ordering (Esc timings 0-300 ms after the opening click, under CPU throttle; a modal opened from a non-preview element still pushes nothing extra; listeners/scopes after close return to baseline), and the child-modal case (free-heal confirm opened quickly).

Gates: tsc, lint, jest (base 6c7216e8: 7191 passed / 1 skipped, a fresh worktree 1 fewer and 2 skipped, plus SC-595 tests; SC-568 suites green alone), lifecycle part 5 (5/5) and e2e (`259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`; RECOV-R07 load flake → re-run alone). Confirm styles.css is byte-identical to a clean `6c7216e8` build. Check the rebase onto `6c7216e8` (SC-573, minion pool modal) with `git range-diff`.

Findings by severity with file:line, failure scenario, prescribed fix. Verdict LAND or FIX.

## 3. Footguns

No compound `cd` (`git -C`, `devbox run -c <abs>`); exit codes via a script file; never `rm` a variable target or a /tmp glob; one gate per Bash call in the foreground, no background gates/Monitors; long output to files; lifecycle `--only` parts, G-S56 last; never set `DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP`; kill by literal PID inside your worktree/scratch only, never `pkill` by pattern; private scratch `…/scratchpad/sc595-r5-rereview-<agentId>/`; never key a wait-loop on a scratch filename; Scott's main-checkout vault dirt is expected; SC-573/SC-578 run concurrently; if the report write is blocked return inline; you cannot SendMessage me — `STATUS: NEEDS_CONTEXT` (any stray message starts `SC-595:`).

## 4. Report + return

`sc595-r5-rereview-report.md` in the ledger dir, ≤10-line executive summary first; logs `sc595-r5-*`. Final text: verdict, findings one line each, gate summary lines, mutant results, absolute paths of every artifact.
