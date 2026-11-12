# SC-589 r5 implementation report (test-only)

**Executive summary**
- Verdict: DONE. Two jest cases pin the `resetRebuild` flag; every mutation of it fails at least one of them; HEAD passes. `src/` unchanged.
- New dse sha: `b5d18f79` (one commit on top of `853f3f18`, only `test/dom/elements/initiative-matrix.test.ts`, +29 lines). Superproject untouched (`f8796a1f`).
- jest fresh: `Tests: 2 skipped, 7328 passed, 7330 total`, 263 of 264 suites (r3: 7326; +2), rc 0. tsc rc 0, lint rc 0.
- Mutations (applied in the worktree, reverted with `git checkout -- src/...`; `git status` shows only the test file afterwards):
  - (a1) read removed (`outside = model !== this.model`): Q18 fails (matrix `1 failed, 172 passed`).
  - (a2) set removed (`this.resetRebuild = true;` deleted): Q18 fails (`1 failed, 172 passed`).
  - (b) clear in `finally` deleted: Q17 fails (`1 failed, 172 passed`).
  - HEAD: matrix 173/173.
- Lifecycle / e2e / shots / freeze / parity carry from r3 (no runtime code changed).

## The cases (`[Q]` group, after Q16)
- **[Q17]** Reset encounter -> Yes (via the real chrome item and confirm), then type a draft, focus the label with selection (2, 5), then an outside `update()` (`refresh()`): the rebuilt label box holds focus, selection `[2, 5]`, draft kept. Kills mutation (b): with the flag stuck `true` the outside wrapper is skipped and focus drops to `<body>`.
- **[Q18]** Reset encounter -> Yes, and while the (async) re-parse is still running focus moves into the old tracker's label box (`label.focus()` synchronously after the confirm click). Expect the rebuilt Reset encounter item to hold focus: the reset path's own hand-back, from the token captured when the item was pressed. Kills (a1) and (a2): without the flag the outside wrapper captures the label box's focus and restores it there first, so the reset path's restore finds focus taken and is a no-op; focus ends on the label box, not the item.

## Evidence
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r5-impl/`: `matrix-HEAD.log`, `matrix-mutA-read-removed.log`, `matrix-mutA-set-removed.log`, `matrix-mutB-clear-deleted.log`, `jest-full.log`, `tsc.log`, `lint.log`.

## Drive-by fixes:
none.

## Follow-ups:
none. (Superproject worktree still shows the unstaged `draw-steel-elements` pointer for the land step.)
