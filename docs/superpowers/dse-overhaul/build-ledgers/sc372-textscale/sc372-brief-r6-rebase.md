# SC-372 — round 6 brief (rebase onto 1640ed0 + new required e2e gate)

Context: ledger decisions.md; your r5 report. Worktree /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements, branch `sc372-textscale` @ aebc0a9 on e9502a8. Never call the tracker.

1. `git -C <dse> fetch origin && git -C <dse> rebase origin/develop` (expected 1640ed0 — report the base sha). SC-408 also touched `styles-source.css`, `visual-harness/shoot.mjs` and `CHANGELOG.md`, so expect conflicts. Keep both sides' intent; for shoot.mjs, make sure SC-408's additions AND your `assertTextScale` / `assertTextScaleOnce` gates + `TEXT_SCALE_PAGES` rows all survive and are still called. List every conflict hunk and how you resolved it in the report. `npm ci` if package.json / lockfile changed (SC-408 added e2e deps — very likely).
2. Re-read the `dse-verify` skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md): it now has step 4b, `npm run e2e`, REQUIRED to land any dse change (Scott, SC-408: "make it required to land future changes"), plus `tsc -p e2e` and lint over `e2e/`. Follow its e2e rules exactly: never `--headed` and never DISPLAY `:1`; run.mjs starts its own Xvfb; the Obsidian cache is shared at `~/.cache/dse-e2e-obsidian` — don't delete it.

Gates — the full battery in dse-verify's order, on the rebased tree. Expected (dse-verify CURRENT @ 1640ed0 + your 7 tests):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest 4732 passed / 1 skipped / 227 of 228 suites (base 4725 / 226 of 227)
- lifecycle 25/25 (own DSE_LIFECYCLE_PORT, e.g. 9291)
- e2e `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`, exit 0
- shots 572, 0 FAIL, all in-run gates OK incl. `text scale OK (1146 …)`, `text scale once OK (… ~199 loads)`, `portrait mark parity OK`, `turn mark parity OK`
- freeze `freeze OK (276/276 …)` — any mismatch: stop and report, never rebaseline
- parity 0 / 0 / 24 DECLARED, LAST

Read exit codes through a script file (dse-verify "THE exit-code footgun").

Report: sc372-r6-rebase-report.md (≤10-line exec summary first), logs `logs/r6-*.log`. Final text → ticket-owner: raw facts (base sha, branch sha, conflict list, every gate number) + artifact paths.

Footguns: report write blocked → inline · never key a wait-loop on a scratch filename/contents · redirect output, gates in the FOREGROUND, never end your turn waiting on a background job · `git -C <abs>` always · no pattern pkill, only PIDs containing `worktrees/sc372-textscale/` · never touch the shared freeze baseline · NEEDS_CONTEXT → end your turn with the question; any message you send starts `SC-372:`.
