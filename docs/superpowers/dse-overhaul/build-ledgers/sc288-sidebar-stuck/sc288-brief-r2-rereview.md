# SC-288 r2 scoped re-review brief (delta only)

Context: ledger decisions.md (this dir); your own r1 report sc288-r1-review-report.md; implementer's r2 report sc288-r2-fix-report.md (exec summary). Worktree /home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements, branch sc288-sidebar-stuck. Review ONLY `git diff 0dcc6eb..45dcf2b` (r2 delta) — not a fresh full pass. `git fetch origin` first; record whether origin/develop moved from f6fb208 (if it moved, check `git merge-base` and note it — do not rebase yourself). You never call the tracker. Do not commit.

Verify, by executing:
- MEDIUM-1, LOW-1, LOW-2, INFO-1 from your r1 review are closed as you prescribed. Re-run your own scratch probes (sc288-probe.test.ts) against 45dcf2b — especially the undo probe and the forced-interleave race probe.
- Each of the 3 new committed tests is non-vacuous: remove its fix line, see red, restore (leave the tree clean at 45dcf2b, `git status` empty).
- `lastWritten = null` in notifyAnchorLost has no bad side effect: after anchor loss, a genuine self-write that follows recovery is still recognised as self-echo (no double remount / no flicker loop), and surrounding note content survives a post-recovery persist.
- The fast path still runs for normal and post-recovery edits (root node identity kept).
- Doc comments and CHANGELOG bullet are accurate; no "structurally impossible"/"exactly when" overclaims.
- Gates: tsc, lint, jest (`rm -f main.js styles.css` first) — expected 3942 passed / 1 skipped / 3943, 202 of 203 suites. Shots/freeze/parity: the r2 delta touches no CSS or fixtures; re-run freeze + parity only if you see any reason; otherwise cite sc288-r2-{freeze,parity}.log (260/260; 0/0/16). A sidebarEncounterHandoff.test.ts failure under load is known flake SC-352 — re-run before believing it.

Report: sc288-r2-rereview-report.md (≤10-line exec summary: verdict LAND-READY / FIX-ROUND, severity counts), logs sc288-r2-rereview-<x>.log. Findings by severity with file:line, scenario, prescribed fix.

Return contract: final text to the ticket-owner — raw facts (verdict, sha, numbers, findings), absolute artifact paths.
Footguns: run everything in the FOREGROUND with output redirected to files; never background a job and wait for a notification; never key a wait-loop on a scratch filename. devbox `bash -c` with gate command last. If the report write is blocked, return it inline. You cannot SendMessage me; if blocked end with STATUS: NEEDS_CONTEXT (if you message anyway, first word `SC-288:`).
