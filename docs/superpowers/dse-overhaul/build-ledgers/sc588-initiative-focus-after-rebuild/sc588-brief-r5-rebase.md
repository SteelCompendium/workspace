# SC-588 r5: rebase onto ce4937ef and re-gate (implementer, resumed)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/decisions.md`. Read the latest entry, "Base moved a third time".
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild/draw-steel-elements`. HEAD is `a39eaabd` on `e5b6f9f2`.
- You never call the tracker. The r1 footguns still apply:
  - Never `rm -rf` a glob or a /tmp glob, and no `rm` with a variable target.
  - Foreground gates only.
  - Use `git -C <abs>`.
  - Never `pkill` by pattern.
  - Private scratch: `.../scratchpad/sc588-r5-impl/`.

## Task

1. Before rebasing, build at `a39eaabd` and record `sha256sum main.js` and `sha256sum styles.css`. Or reuse the sums from r3 if you recorded them.
2. Run `git -C <plugin> fetch origin`. Then rebase onto `origin/develop` = `ce4937ef`. SC-570 is test code only: `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` and `test/dom/elements/staminaRecoveries.test.ts`. No conflict is expected. Do not modify anything else. The superproject needs no change.
3. Build at the rebased HEAD. Record the sha256 of `main.js` and of `styles.css`.
4. Gates at the rebased HEAD:
   - tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`)
   - jest, fresh: expect 7286 + 18 = **7304 passed / 2 skipped**
   - full e2e: the base is `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`. With SC-588 added, the r3 result was `270/274 … 169/169`. What must hold is **0 failed, 4 known-bug, coverage Y/Y**. Report the exact line.
   - **RECOV-R07 is no longer a known load flake.** A red there is a real signal: report it, do not re-run it away.
5. Lifecycle:
   - If the rebased `main.js` sha256 equals the pre-rebase one, lifecycle 56/56 carries from r3. Say so, with both sums.
   - Otherwise re-run all five parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, with G-S56 last); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6).
   - If `styles.css` is identical, then shots 592, freeze 280/280 and parity 0/0/24 carry.

## Report

Write `.../sc588-r5-impl-report.md`. Open it with an executive summary of at most 10 lines: the new shas, the `main.js` and `styles.css` sums before and after, and the gate summary lines.

Final text to me: raw facts plus artifact paths. If you are blocked, return `STATUS: NEEDS_CONTEXT`.
