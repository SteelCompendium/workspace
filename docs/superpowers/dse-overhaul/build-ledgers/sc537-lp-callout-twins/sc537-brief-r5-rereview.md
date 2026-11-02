# SC-537 r5 — scoped re-review of the r4 fix round (delta only)

You reviewed SC-537 in r3. Now review only the r4 delta. Final text goes to the ticket-owner. **Workers never call the tracker.**

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/decisions.md` — "owner rulings on r3" (authoritative; MEDIUM-2 → SC-544 and plugin off/on → SC-545 are OUT OF SCOPE).
- Your r3 report: `.../sc537-r3-review-report.md`. The r4 report: `.../sc537-r4-fix-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins`: plugin HEAD `aca83702` (rebased from `4e3de39c` on f81a277 onto **88cb7db9** (SC-522 + SC-539 landed after fb24f8a2)), superproject `4380db57` on origin/main `07710b0f`. Do not commit; restore anything you touch; end with clean `git status`.

## Task
1. `git range-diff f81a277..4e3de39c 88cb7db9..HEAD` (plugin): the r2 commits are unchanged apart from conflict resolution; the new r4 commits are the delta. Check the G-S56 interaction: G-S57 must sit before G-S56 or set up its own leaves.
2. Confirm in real Obsidian on a HEAD bundle: HIGH-1 (far-apart twins incl. form Save), MEDIUM-1 (title click < 100 ms) fixed; G-S57 phases (f)/(g) FAIL on the 4e3de39c bundle and PASS on HEAD; LOW-1 cost IN REAL OBSIDIAN (40-block callout per-keystroke ms vs your r3 16-18 ms and base 1.1 ms; and per scroll frame now that the pass runs on viewportChanged — the implementer measured only jsdom: 143.8 -> 25.7 ms); scroll in a tall note unchanged; no false remounts while scrolling or moving the cursor (selectionSet) through identical callouts; LOW-2 CHANGELOG wording; the `livePreviewScrollHold.test.ts` assertion.
3. Re-run the r4 mutants (incl. the guard-without-viewportChanged/selectionSet mutant): caught?
4. Re-run tsc/lint, jest, lifecycle (three `--only` calls: G-S7a…G-S9a; G-S9b…G-S40; G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S56 — or as the r4 report moved G-S57; each one blocking foreground call), e2e. Expected: jest per the r4 report (6245 + 7 + r4 cases / 1 skipped / 249 of 250); lifecycle 46/46; e2e 124/124 0 known-bug 87/87.
5. Findings by severity with file:line; verdict LAND-READY or NOT.

## Report
`.../sc537-lp-callout-twins/sc537-r5-rereview-report.md`, ≤10-line executive summary first. Logs `sc537-r5-*.log`.

## Return contract
Raw facts: verdict, findings (severity, file:line), measured numbers, absolute paths of every artifact.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — use per-run unique paths and read the process's own output.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- One blocking foreground Bash call per gate / Obsidian run (< 600 s). No `run_in_background`, no Monitor, no background jobs.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/draw-steel-elements -- bash <script file>`; never `cd X && …`; `git -C <abs path>` always. Record exit codes inside a script file.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r5-review-<your agentId>/`, unique names; Write tool for files; no variable or glob `rm`.
- No `pkill`/`killall` by pattern; kill only your own PIDs (check `readlink /proc/<pid>/cwd`). Never `rm -rf` a shared `/tmp` glob. Never touch `.superpowers/` beyond your own `sc537-` files.
- You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT. Any message you send anyway starts with `SC-537:`.
