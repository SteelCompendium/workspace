# SC-588 r1 implementer report

**Executive summary**
- Verdict: DONE. All five actions hand keyboard focus to the rebuilt control; real-Obsidian e2e proves it (red before the fix, green after).
- Branch `sc588-initiative-focus-after-rebuild`, dse rebased onto `origin/develop` 79da77f8 (clean, no conflicts; package.json unchanged). dse HEAD **d62803db** (fix 40f760f9, tests/e2e/changelog d62803db). Superproject CHANGELOG commit 9dd7cbf8; submodule pointer left unstaged for wt-finish.
- Gates at the rebased HEAD: tsc (incl. e2e) and lint clean; jest 7279 passed / 2 skipped / 263 of 264 suites (fresh worktree); lifecycle 55/55 (21+16+9+4+5); e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`.
- styles.css sha256 identical to a clean 79da77f8 build (5e5ff488...2b27), so shots / freeze / parity carry (not re-run).
- e2e known-bug list is now SC-257, SC-355, SC-384, SC-580. SC-588 marker (INIT-F01) is a plain test.

## Focus mapping per action

Pressed control -> where focus lands after the rebuild (only when focus was inside the tracker at press time):
| Action | Focus before | Focus after |
|---|---|---|
| Advance round | `init.round.advance` | the rebuilt `init.round.advance` |
| Make captain / Relieve captain | `init.captain.make` / `.relieve` | the other one of the pair on the same position (family `init.captain`, nth control of the family; one badge per group detail row) |
| Reset turns (chrome item) | `init.reset-turns` | the rebuilt chrome item `init.reset-turns` |
| Reset encounter -> Yes | the chrome item `init.reset-encounter` (captured at press, before the modal takes focus) | the modal closes; the rebuilt `init.reset-encounter` chrome item (restored after `inert` is lifted) |
| Enter in the quick-add amount / label box | that input (`init.malice.quickadd.amount` / `.label`) | the rebuilt input of the same id (value is cleared, as before; SC-589 half-typed loss untouched) |

Fallbacks (generic, in the helper): list shrank -> last control of the id/family; control gone or focused node had no control id -> the tracker root (`tabindex=-1` set by script, not a Tab stop); never `<body>`. Keyboard ring follows the old node's `:focus-visible`, so a pointer focus is restored without forcing a ring. A mouse click in real Obsidian reading view does not focus the button at all (click shield), so there is nothing to hand back and nothing is moved (INIT-F06 pins that).

## Design choice

New helper `src/framework/kit/controlFocus.ts` (`captureControlFocus` / `restoreControlFocus`, with an optional id->family map), used at the two initiative rebuild sites rather than patching five actions:
- `rebuildAndPersist()` (covers Advance round, captain, Reset turns, quick-add, plus the other callers) captures before `update()` and restores right after it (the framework's afterRender chrome remount has run by then, so the chrome items are the new ones).
- `rebuildFromWrittenReset(focus)` (Reset encounter): the focus token is captured in the chrome item's `onClick` (the confirm modal owns focus by the time the rebuild runs) and restored after the `finally` block that lifts `inert` (an inert node cannot take focus).
- Not put into `ElementView.update()` itself: that would change behaviour for every element (statblocks, montage, etc.) and the brief says not to widen. The helper is generic, so another element can opt in later.
- Only captures when `root.contains(activeElement)`; restore is a no-op when anything already holds focus (user/modal), so rebuilds raised from elsewhere never steal focus.

## Files changed (dse, line refs at HEAD)
- `src/framework/kit/controlFocus.ts` (new, 67 lines)
- `src/elements/initiative/view.ts`: imports + `FOCUS_FAMILIES` const above the class; `rebuildAndPersist` capture/restore; `rebuildFromWrittenReset(focus)` signature + restore after `finally`; Reset encounter `onClick` captures before `openModal`.
- `test/dom/kit/controlFocus.test.ts` (new, 7 tests), `test/dom/elements/initiative-matrix.test.ts` (new `[F]` group F01-F07, 10 tests; the `test.failing` M04 for SC-588 removed; describe renamed to SC-589 only)
- `e2e/specs/initiative/focus-after-rebuild.e2e.ts` (new: INIT-F02..F06), `e2e/specs/initiative/malice.e2e.ts` (INIT-F01 knownBug -> plain test, stronger assertion; `knownBug` import dropped), `e2e/manifest/initiative.ts` (+5 `press:Enter` pairs: advance, reset-turns, reset-encounter, captain.make, captain.relieve; coverage 164 -> 169)
- `CHANGELOG.md` (dse, [FIX] bullet in the 7.0.0 section before SC-578) and workspace `CHANGELOG.md` (`## Unreleased`, top bullet), the SC-578 pattern (both files).

## Tests, red before the fix
- jest: with `view.ts` reverted to base, 8 of the new tests failed (F01, F02, F03 x2, F04 x2, F05 Yes, F07); F05 Cancel and F06 (no steal) pass either way by design (guards). Log: `jest-red.log`. Green after: 156/156 in the two files; full jest 7279 passed.
- e2e: with `view.ts` reverted, INIT-F01..F05 failed in real Obsidian 1.14.4, INIT-F06 passed (guard); with the fix 6/6. Logs: `e2e-red.log`, `e2e-focus.log`.
- Reset encounter -> Yes in real Obsidian (INIT-F05, keyboard path: Tab to the chrome item, Enter, Tab to Yes, Enter): the DseModal/Obsidian focus return and the rebuild did not leave body; final resting place is `init.reset-encounter`, ring on.

## Gate summary lines (at rebased d62803db, base 79da77f8)
- tsc: `TSC_EXIT=0`; lint: `LINT_EXIT=0`
- jest: `Tests: 2 skipped, 7279 passed, 7281 total`; `Test Suites: 1 skipped, 263 passed, 263 of 264 total`; `JEST_EXIT=0`
- lifecycle: `done: 21/21 ok, 0 failed`; `16/16`; `9/9`; `4/4` (G-S56 last); `5/5`, all exit 0
- e2e: `OBSIDIAN-E2E done: 270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, `E2E_EXIT=0`
- styles.css: sha256 equal to clean 79da77f8 build; shots/freeze/parity carried, not re-run.
- Note: an earlier full pass at the previous base (4f0c87f2): jest 7256/2, lifecycle parts 1-3 green; superseded by the rebased run above (the part-4 run in flight at the rebase was killed by PID and rerun).

## Drive-by fixes
None.

## Follow-ups
- The dse-verify skill's CURRENT numbers/known-bug text (`SC-588` in the known-bug list, e2e 264/269, 164 pairs) need updating at land: now 270/274, 4 known-bug (SC-257, SC-355, SC-384, SC-580), 169/169 pairs.
- The test comment block in `initiative-matrix.test.ts` says e2e twins carry knownBug markers for SC-589 (M10) - still true; nothing else open.
- Other `rebuildAndPersist` callers (squad-pool/grid edits that open modals): focus returned by the modal to a now-detached node is not handled; out of scope here.
- `npm ci` was needed in the fresh worktree (no node_modules); not a repo issue.

## Artifacts (scratch, `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc588-r1-impl/`)
`jest-red.log`, `jest-full.log`, `tsc-a.log`, `lint-a.log`, `life-p1..p5.log`, `e2e-red.log`, `e2e-focus.log`, `e2e-full.log`, `css-sha.log`
