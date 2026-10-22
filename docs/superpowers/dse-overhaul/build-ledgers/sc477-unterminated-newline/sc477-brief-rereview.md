# SC-477 scoped re-review brief (round 2)

Scope: the fix-round-2 DELTA only. Do not do a fresh full pass.

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/decisions.md`, especially the owner rulings dated 2026-10-22 on HIGH-1 and the rest. Then read the "Fix round 2" section of `sc477-impl-report.md` and your own `sc477-review-r1-report.md`, both in the same dir.
- Range-diff: the branch was rebased from 424f47b onto e4c5cf6 (or newer). `git -C /home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/draw-steel-elements range-diff 424f47b..53b11ac <newbase>..HEAD`. Confirm the rebase carried the r1 commits unchanged apart from conflict resolutions. Name every conflict hunk you see.
- Verify each r1 finding is closed:
  - HIGH-1: re-run your real-Obsidian 9-shape parity probe at the new head. Expected: 9/9 identical, tail kept, 0 Notices.
  - MEDIUM-1, MEDIUM-2 (G-S28 exists and fails on base), LOW-1, LOW-2.
- New in-place integrity probes for the clamp. The clamp now changes the in-place output, so check:
  - A terminated block whose close fence is followed by trailing blank lines is unchanged.
  - The SC-343 terminated-misread trap is not widened.
  - A whitespace-only last line inside a body the user deliberately ends with spaces.
- Re-run jest and lifecycle yourself (expected jest 5711 + new tests / 1 skipped / 238 of 239; lifecycle 32/32). Re-run e2e (expected `101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`), because the in-place write path changed.
- The superproject branch is rebased onto origin/main, its CHANGELOG bullet is reworded, and its pointer equals the dse head.
- Gate mechanics are the same as `sc477-brief-review.md` §3. Use a NEW private scratch subfolder. Leave the tree clean.
- Never call the tracker.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/sc477-rereview-r2-report.md`. Open it with an executive summary of 10 lines or fewer, giving the verdict LAND / FIX. List findings by severity with file:line, and mark whether each is a regression vs develop. If the write is blocked, return the report inline.
- Final text: the raw facts plus absolute paths.
