# SC-603 r4 scoped re-review report (r3 delta)

**Executive summary**
- Verdict: **LAND**. No new findings. r2's LOW-1 and LOW-2 are closed.
- HEAD is dse `5f7c5336` on `da2bdbc6`, which is still `origin/develop` after a fresh fetch. The superproject is unchanged (`9d1568ec`).
- Rebase fidelity: `git range-diff b5d18f79..7813b333 da2bdbc6..5f7c5336` marks all four r1 commits as `=` (identical patches). The one new commit is `5f7c5336`, which only adds F17 and F18 (+32 lines in the test file). `view.ts` is identical at `b5d18f79` and `da2bdbc6`.
- LOW-1: F18 pins it. Mutant M6 (always restore, even when focus was not in the tracker at open) makes F18 fail at `initiative-matrix.test.ts:947`: focus lands on the tracker root `div.dse-chrome-anchor` instead of `<body>`. That is the same failure I measured in real Obsidian in r2.
- LOW-2: F17 pins it. With the base `view.ts`, both F17 cases (X and Escape) fail at `:937` with `<body>` focused.
- Gates (mine, at `5f7c5336`):
  - tsc/lint clean
  - jest `2 skipped, 7685 passed, 7687 total`
  - e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`
  - lifecycle part 5 7/7 (393 s), part 6 G-S92 1/1 (103 s)
  - styles.css sha256 `5e5ff488…2b27`, the same for a clean `da2bdbc6` build, so shots, freeze and parity carry over.

## 1. Rebase fidelity

```
1:  a1fbd847 = 1:  b8be0461 fix(initiative): focus returns to the rebuilt opener after a modal whose save replaces it (SC-603)
2:  1cc9eaf2 = 2:  bb29f66d test(e2e): focus after a modal whose save replaces its opener (SC-603)
3:  b703ffa9 = 3:  4545b900 docs(changelog): focus after the pool modal's Apply and the Conditions window (SC-603)
4:  7813b333 = 4:  3975527f test(e2e): focus-after-modal spec keeps the pool.apply control id for the coverage gate (SC-603)
-:  -------- > 5:  5f7c5336 test(initiative): pool-window condition removal then X/Escape, and no hand-back when focus was not in the tracker (SC-603)
```

The patches did not change at all, not even in context. `git diff b5d18f79 da2bdbc6` for `src/elements/initiative/view.ts`, `controlFocus.ts` and `focusHandoff.ts` is empty. `5f7c5336` touches `test/dom/elements/initiative-matrix.test.ts` only (+32).

## 2. LOW-1 and LOW-2 tests

Each case below was run with `-t SC-603` in a scratch worktree at `5f7c5336`. "Base" means `view.ts` from `da2bdbc6`.

| Variant | Result | Failing |
|---|---|---|
| HEAD | 14 passed | none |
| M6 (`if (focus) this.giveFocusBack(focus)` → `this.giveFocusBack(focus ?? { family: null, nth: 0, ring: false })`) | 1 failed | **F18**, at `:947`: activeElement is `div.dse-chrome-anchor`, expected `<body>` |
| BASE `view.ts` | 6 failed | **F17 x2** (X; Escape through the Scope), at `:937`: activeElement is `<body>`. Also F08, F09, F13, F16 as before |

- F18 asserts `document.activeElement === document.body` before the open, a scripted `click()` open, Apply, focus still on `<body>`, and no `tabindex` on the root. That is exactly the LOW-1 case: focus on body at open. It no longer depends on F11's outside-input setup, which could not catch the mutant.
- F17 removes a condition through the pool modal's `pool.condition` icon. It asserts that the opener was replaced while the window was open, then closes with X or with Escape through the modal Scope, and asserts that focus is on the rebuilt `init.detail.stamina`. That is the LOW-2 route, ZZP-12 in my r2 probe.

## 3. Gate summary lines (mine, dse `5f7c5336`)

- tsc: `tsc rc=0`. Lint: `lint rc=0`.
- jest: `Tests:       2 skipped, 7685 passed, 7687 total`, `Test Suites: 1 skipped, 264 passed, 264 of 265 total`, rc 0. That matches 7671 + 14.
- e2e: `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0, 135 s. Known bugs: SC-257, SC-355, SC-384, SC-580.
- Lifecycle part 5 (`G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`): `7/7 ok, 0 failed`, 393 s. Part 6 (`G-S92`): `1/1 ok, 0 failed`, 103 s. Parts 1-4 were not re-run, by the brief's scope.
- styles.css: `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for both the `git archive da2bdbc6` build and the `5f7c5336` build. 0 lines of CSS diff.

## 4. Tree state

The dse `git status --porcelain` is empty before and after, and HEAD is `5f7c5336`. The superproject shows ` M draw-steel-elements` (the unstaged pointer bump), the same as at the start. The scratch worktree was removed and pruned.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r4-rereview/`:

| Evidence | Files |
|---|---|
| Rebase fidelity | `range-diff.txt` |
| LOW-1 / LOW-2 tests (HEAD, M6, base) | `mut-summary.txt`, `mut-HEAD.log`, `mut-M6.log`, `mut-BASE.log`, `mutate.py`, `g1-mut.sh` |
| tsc, lint, jest | `r4-g2-rc.txt`, `r4-tsc.log`, `r4-lint.log`, `r4-jest.log` |
| e2e | `r4-e2e.log`, `r4-e2e.rc` |
| Lifecycle | `lc-p5.log`, `lc-p5.rc`, `lc-p6.log`, `lc-p6.rc` |
| styles.css | `css-sha.txt` |
