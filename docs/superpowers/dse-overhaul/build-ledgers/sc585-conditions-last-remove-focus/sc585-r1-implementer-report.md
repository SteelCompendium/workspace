# SC-585 r1 implementer report

## Executive summary
- Verdict: DONE. Rebased onto dse origin/develop 1f1ae442 (package.json unchanged, no npm ci needed) and ALL gates re-run after the rebase.
- dse branch `sc585-conditions-last-remove-focus` @ 7b87b74d (4ba9116d code+jest, 7b87b74d e2e). Superproject @ ce7298cb (CHANGELOG.md only; no pointer bump; still on the old base f9082867, owner rebases).
- tsc clean, lint clean (rc 0). jest 11795 passed / 1 skipped (shots cache present; fresh without cache = 11794 / 2) = baseline 11788 (+1 cache) + 6 new tests.
- lifecycle 62/62 (21+16+9+4+7+4+1; part 7 = G-S108). e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`.
- shots 592 written, rc 0, chrome host-leak ok, button host-leak 163/978, modal host-leak 40/240, capture clip 147. freeze 280/280 byte-identical. parity 0 gaps / 0 undeclared / 24 declared.
- No CSS source touched (diff is 3 files: ConditionsModal.ts, matrix jest test, cond-rows e2e), so styles output is unchanged by construction.

## What changed
- `draw-steel-elements/src/views/ConditionsModal.ts`: new private `focusAddControl()` (before the "inline row editor" section): focuses `.dse-condal__input` when `addOpen` and it exists, else `.dse-condal__add`. `removeAt` (emptied-list branch) calls it; MED-3 comment updated with the SC-585 note.
- `draw-steel-elements/test/dom/views/conditions-modal-matrix.test.ts`: the `test.failing('SC-585: ...')` marker is now a normal `test` (comment states settled behaviour; it stays in its describe, as the SC-581 test does). New describe "removing a row while the Add search is open" in the removal section with 6 tests: last row (same input kept, exactly focused, no "+ Add condition"); typed query survives and menu still matches; aria-activedescendant names a live option and aria-controls the live menu; non-last row (focus on shifted-in cog, search open, text kept); routed-key search opened over the trash button, trash removed, Escape lands on "+ Add condition"; Escape after last removal with normally-opened search lands on "+ Add condition".
- `draw-steel-elements/e2e/specs/conditions-modal/cond-rows.e2e.ts`: `[COND-R07]` (real Shift+Tab, Enter; Ogre #1 Grabbed/Prone): asserts one write, note has no condition, search input still displayed, focused input has label "Add condition" inside the modal (focusedOption), typed `da` kept, "+ Add condition" absent. Local `shiftTab()` helper as in roll-bar-stepper-focus.
- `CHANGELOG.md` (worktree superproject) `## Unreleased`: one SC-585 bullet.
- Plugin docs: `docs/initiative-tracker.md` describes adding/removing but not focus; no change.

## Sweep: every `.dse-condal__add` focus site
1. `removeAt` (ConditionsModal.ts ~l.370, was l.359): CAN run with the search open (keyboard activation sends no mousedown). Fixed via `focusAddControl()`.
2. `closeAdd` (~l.634, was l.627): runs `addOpen=false; renderAdd()` first, so the button exists. Cannot hit the missing-button case. Unchanged (per brief).
No other site focuses the add button (`renderAdd`'s button onClick sets addOpen and renders the combobox, which focuses its own input; `typeToSearch` focuses the input).

## Side checks
- SC-580 `returnFocusEl`: search opened by a routed key over the trash button, trash removed: `back.isConnected` is false so closeAdd falls to the else branch and focuses "+ Add condition" (test above passes; unchanged code).
- Dropdown state: `renderAdd` is not re-run by removeAt, so the combobox, `aria-controls`, `aria-activedescendant` (menu items live in `.dse-condal__addwrap`, not the list) are untouched and valid (test above).

## Stash proof (fix reverted, tests kept)
- Jest (`-t SC-585`, src restored to 2074a152 version): `Tests: 4 failed, 325 skipped, 3 passed` — failing: last row exact-focus, typed query survives, routed-key Escape test, and the flipped marker. With the fix: `7 passed`. Log: `jest-stash-proof-nofix2.log` (and `jest-final-focused-fix.log`). (First stash run before I fixed my own test setup showed 3 failed; superseded.)
- e2e (`--only=COND-R07`, src reverted): FAILS at `toBeFocused` (`Expected: "focused" Received: "not focused"`) — `e2e-stash-proof-nofix.log`. With fix: `e2e-only.log` ok; full runs below.

## Gates (measured; all post-rebase onto 1f1ae442 unless noted)
- tsc: `tsc rc=0`; lint: `lint rc=0`.
- jest: `Test Suites: 1 skipped, 275 passed, 275 of 276 total / Tests: 1 skipped, 11795 passed, 11796 total` (counting: the flipped marker passed under test.failing before and passes as a plain test now, so it adds 0; +6 are the new describe's tests). Pre-rebase run without shots cache: 11713 passed / 2 skipped (= 11707+6).
- lifecycle: part1 `21/21`, part2 `16/16`, part3 `9/9`, part4 `4/4`, part5 `7/7` (no G-S91 flake), part6 `4/4`, part7 `1/1` (G-S108) — union 62/62, 0 failed. (Pre-rebase run: 61/61 in six parts.)
- e2e: `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0. (Pre-rebase: same line.)
- shots: 592 files, rc 0; host-leak lines as in the summary.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`; I did not touch the shared baseline.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0.

## Drive-by fixes:
None.

## Follow-ups:
- None filed. (Jest note: SC-581's normal test and now SC-585's normal test both sit in the describe titled "known bugs (each marker ... fails today)"; the title is stale. Left alone — cosmetic.)

## Artifacts
Logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc585-r1-impl/`: `jest-stash-proof-nofix2.log`, `jest-final-focused-fix.log`, `e2e-stash-proof-nofix.log`, `e2e-only.log`, `tsc-rebased.log`, `lint-rebased.log`, `jest-full-rebased.log`, `lifecycle-r-part1..7.log`, `e2e-full-rebased.log`, `shots-rebased.log`, `freeze.log`, `parity.log` (pre-rebase: `jest-full.log`, `lifecycle-part1..6.log`, `e2e-full.log`, `shots.log`).

---

# r3 fix round (appended)

- Verdict: DONE. dse `3a5986d3` (on origin/develop `1f1ae442`, confirmed unmoved). Superproject `dbd7a210` on origin/main `6630f0e5`; `git log --oneline origin/main..HEAD` = `dbd7a210` (pointer bump to 3a5986d3) + `99c70cdf` (CHANGELOG); `status` clean; diff vs origin/main = CHANGELOG.md (+6) and the pointer only.
- LOW-1: CHANGELOG SC-585 bullet now ends "still moves focus to the next condition (or the one above it, if you removed the bottom one)". The two earlier CHANGELOG commits were squashed to one; the SC-612 bullet conflict was resolved keeping both bullets.
- INFO-1: describe retitled "SC-436 matrix: fixed bugs (SC-581, SC-585) and the open known-bug markers (SC-586: each encodes the correct behaviour and fails today)"; SC-585 test kept (count unchanged). SC-581 test not moved.
- INFO-2: the "Escape after removing the last row with a normally opened search" test now asserts `document.activeElement` is the input before the Escape. Stash proof (only src/views/ConditionsModal.ts reverted to 1f1ae442, then restored): `Tests: 1 failed, 331 skipped` (`jest-r3-stash-proof-nofix.log`).
- Gates: tsc rc=0; lint rc=0; SC-585 matrix tests `10 passed` (-t SC-585, includes the retitled describe); full jest `Test Suites: 1 skipped, 275 passed; Tests: 1 skipped, 11795 passed, 11796 total` (same as r1). e2e/lifecycle/shots not re-run (no src change).
- Logs (scratch dir sc585-r1-impl/): `jest-r3-stash-proof-nofix.log`, `tsc-r3.log`, `lint-r3.log`, `jest-r3-sc585.log`, `jest-full-r3.log`.
