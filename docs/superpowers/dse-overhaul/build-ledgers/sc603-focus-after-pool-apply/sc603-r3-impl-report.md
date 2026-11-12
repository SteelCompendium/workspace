# SC-603 r3 implementer report

**Executive summary**
- Verdict: DONE. Rebased onto dse `origin/develop` `da2bdbc6` (SC-594 landed; supersedes the `8b84b635` base of the first r3 brief). Nothing pushed.
- New dse HEAD `5f7c5336`. Commits: `b8be0461` fix, `bb29f66d` e2e, `4545b900` dse CHANGELOG, `3975527f` e2e coverage-id fix, `5f7c5336` the new jest tests (LOW-1, LOW-2). Superproject unchanged at `9d1568ec` (CHANGELOG only; dse pointer left unstaged for `wt-finish`).
- Rebase: no conflicts (both moves); `package.json` unchanged, no `npm ci`.
- New jest: F17 (x2: X and Escape) for LOW-2, F18 for LOW-1. That is 3 tests (the brief said 2: F17 is a `test.each`), so jest is 7685, not 7684.
- Gates at `5f7c5336`: tsc clean, lint clean, jest `7685 passed / 2 skipped`, lifecycle 58/58 (21+16+9+4+7+1), e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` at HEAD and at a `da2bdbc6` view.ts build: identical, so shots 592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147 / freeze 280/280 / parity 0/0/24 carry (not re-run).
- The first r3 pass (on `8b84b635`: jest 7355, lifecycle parts 1-4 green, part 5 killed by me when the base moved) is superseded; logs in `.../sc603-r3-impl/8b84-superseded/` (parts 1-4 only) and not used for any number here.

## Rebase

`git fetch origin`; `origin/develop` = `da2bdbc6eac75438ede1eeaf2fa52ef8747b0544`; `git rebase origin/develop`: "Successfully rebased", no conflicts (the earlier `8b84b635` rebase was also clean). The superproject CHANGELOG commit was not touched. Superproject branch still sits on `f1176824` (not asked to rebase).

## The two new tests (`test/dom/elements/initiative-matrix.test.ts`, in the SC-603 describe inside [F])

- **F17 (LOW-2), `test.each` X / Escape.** Squad whose selected minion has a `grabbed` condition; keyboard-focused detail Stamina control opens the pool modal; clicking the pool modal's `pool.condition` icon rebuilds the tracker behind the open window (asserts `init.detail.stamina` is a new node); closing with the X or with Escape through the modal Scope gives focus to the rebuilt `init.detail.stamina`. Red on base: both cases fail (base view.ts from `da2bdbc6` checked out over the fix: 6 failed = F08, F09, F13, F16 plus F17 x2; log `jest-red-F17-base.log`). Green with the fix.
- **F18 (LOW-1).** Focus on `<body>` at open (asserted), mouse-style open of the pool modal (click, nothing focused), Apply: focus stays on `<body>` and the tracker root got no `tabindex`. A red-with-check-removed run: temporarily deleting the "focus not inside the tracker" guard in `controlFocus.ts captureControlFocus` (`active === body || !root.contains(active)` -> only `!active`) fails exactly F18 (`1 failed, 13 passed`; log `jest-red-F18-mutant.log`), and the mutation was reverted (`git status` clean, the file is not in the diff). On the real code it passes (F18 is a guard; it is not red on base because the base has no hand-back at all).
- SC-603 jest slice: 14 passed (was 11).
- No e2e added (owner ruling: no e2e required).

## Gate summary lines (dse `5f7c5336`, base `da2bdbc6`)

- tsc (incl. `tsc -p e2e`): `tsc rc=0`, clean. Lint (incl. `e2e/`): `lint rc=0`, clean.
- jest: `Test Suites: 1 skipped, 264 passed, 264 of 265 total`, `Tests: 2 skipped, 7685 passed, 7687 total` (base 7671 + 14: 11 from r1, 3 now).
- Lifecycle, six foreground `--only` parts: `21/21 ok, 0 failed`; `16/16`; `9/9`; `4/4` (G-S56 last); `7/7` (`G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`); `1/1` (`G-S92`) = 58/58.
- e2e: `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0 (known bugs SC-257, SC-355, SC-384, SC-580).
- styles.css: HEAD sha256 = `5e5ff488...2b27`; build with the `da2bdbc6` `view.ts` = the same sha (`css-sha.txt`, two identical lines). It is also the same sha as the r1 builds on `b5d18f79`; neither SC-594 nor SC-598 changed it.

Evidence dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r3-impl/`: `gate-tsc.log`, `gate-lint.log`, `jest-full.log`, `lc1.log` .. `lc6.log`, `e2e-full.log`, `css-sha.txt`, `jest-new-green.log`, `jest-red-F17-base.log`, `jest-red-F18-mutant.log`.

## Drive-by fixes:
None.

## Follow-ups:
- `dse-verify` "Current expected numbers" at `5f7c5336`: jest 7685/2 fresh, lifecycle 58 in six parts, e2e `278/282`, `171/171`.
- SC-608 and SC-609 untouched, as instructed.
