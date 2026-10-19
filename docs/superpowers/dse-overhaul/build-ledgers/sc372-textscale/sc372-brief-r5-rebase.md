# SC-372 — round 5 brief (rebase + three INFO folds)

Context: ledger decisions.md ("r4 rulings"), r4 report sc372-r4-rereview-report.md (LOW-1, INFO-1..3) — same dir. Worktree /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements, branch `sc372-textscale` @ f6d29ec. Never call the tracker.

Task (rulings quoted from the ledger):
1. "r5 rebases onto current origin/develop, `npm ci`, full battery." `git -C <dse> fetch origin && git -C <dse> rebase origin/develop` (expected e9502a8 or newer — report the base sha). The r4 replay hit exactly one CHANGELOG conflict; keep both entries.
2. INFO-1: "make the count consistent" in the `src/framework/tokens.ts` ~:123 comment.
3. INFO-2: "the CHANGELOG entry describes only what a user of the last release sees change: the three text-size settings now take effect, nested text included. Drop the \"scales once, not twice\" sentence."
4. INFO-3: "one line in font-sizes.md saying so" — the `text scale once` sweep catches text that scales twice, not text that stops scaling; only the named `TEXT_SCALE_PAGES` rows catch inert text.
Commit each step. Do not touch dse-verify or anything in SC-422's scope.

Gates — full dse-verify battery on the rebased tree. Expected (dse-verify CURRENT + r4 replay): tsc/lint clean · jest ≈ 4508 passed / 1 skipped / 223 of 224 (base e9502a8 + 7; measure and report base if it differs) · lifecycle 25/25 (own DSE_LIFECYCLE_PORT, e.g. 9291) · shots 572, 0 FAIL, all in-run gates OK incl. `text scale OK (1146 …)` and `text scale once OK (~102,969 comparisons over ~199 loads)` · freeze `freeze OK (276/276 …)` — any mismatch: stop and report, never rebaseline · parity 0 / 0 / 24 DECLARED, LAST.

Report: sc372-r5-rebase-report.md (≤10-line exec summary first), logs `logs/r5-*.log`. Final text → ticket-owner: raw facts (base sha, branch sha, superproject sha, every gate number) + artifact paths.

Footguns: report write blocked → inline · never key a wait-loop on a scratch filename/contents · redirect output, gates in the FOREGROUND, never end your turn waiting on a background job · devbox eats exit codes, read summary lines · `git -C <abs>` always · no pattern pkill, only PIDs containing `worktrees/sc372-textscale/` · never touch the shared freeze baseline · NEEDS_CONTEXT → end your turn with the question; any message you send starts `SC-372:`.
