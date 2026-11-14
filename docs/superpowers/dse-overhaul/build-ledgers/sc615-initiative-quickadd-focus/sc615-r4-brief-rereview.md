# SC-615 r4 — scoped re-review brief (to the r2 reviewer)

Scoped re-review of the r3 delta ONLY, not a fresh full pass. Read the ledger's "Owner rulings on r2" and r3 entries, and `sc615-r3-fix-report.md` (summary first).

Check:
1. The rebase onto dse develop `f6e504c7` is clean: `git -C <worktree>/draw-steel-elements range-diff 506786cb..8be8ec1d f6e504c7..a5313f9d` shows the r1 commits unchanged except the CHANGELOG merge, plus the r3 commits.
2. INFO-1: the `view.ts` comment now reads as ruled.
3. LOW-1: the two new e2e scenarios (sidebar label, Live Preview label) are real tests of the label path, red with the fix reverted on `f6e504c7`, green on the fix, listed in the `init.malice.quickadd.label` manifest row, fresh global ids, no bracketed ticket ids in titles. Run them yourself (fix and fix-reverted).
4. Superproject: branch = current workspace origin/main + the workspace CHANGELOG commit + exactly ONE pointer-bump commit whose gitlink is the final dse sha; no interim pointer commits; tree clean.
5. Spot-check the implementer's battery logs against the expected numbers (jest 12133 / 1 cached or 12132 / 2 fresh; lifecycle 64/64; e2e 424/437 ok, 0 failed, 13 known-bug, 233/233; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24). Re-run full e2e yourself on the final sha; re-run anything else only if a log looks wrong.

Same command-shape rules as your r2 brief (devbox run -c, git -C, no rm in /tmp or the scratchpad, no pkill by pattern, never trust an echoed $?). Scratch: new private folder `.../scratchpad/sc615-r4-rereview/`. Leave both trees exactly at the r3 shas, clean.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc615-initiative-quickadd-focus/sc615-r4-rereview-report.md`, ≤10-line summary first. Final text: VERDICT (LAND / NOT LAND), findings by severity with file:line, measured numbers, artifact paths. You never call Linear.
