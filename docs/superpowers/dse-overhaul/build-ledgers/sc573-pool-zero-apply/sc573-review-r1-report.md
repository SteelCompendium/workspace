# SC-573 independent review, round 1

## Executive summary
- Verdict: **LAND**. Branch `sc573-pool-zero-apply` head `75cd1acb` (on origin/develop `eaa8742a`; 3 commits `64ca2310`, `ca4dfdaf`, `75cd1acb`).
- Findings: HIGH 0 · MEDIUM 0 · LOW 1 (existed before this branch; folding it is optional) · INFO 4.
- Owner decisions are implemented word for word: "Kill N minion(s)", "The pool is at 0, so N minion(s) die." (with nothing staged and with damage staged), a heal at pool 0 is still refused with its reason, and a squad with 0 alive stays disabled with no info line.
- Regression grid, head vs develop: 1908 (squad x input sequence) states compared. 298 differ, all on pool <= 0 squads and all in the two intended ways. **0 differ on the 12 pool > 0 squads** (label, aria-label, disabled, title, info, info hidden, warn icon, boxes, pool input, Apply outcome).
- Gates measured on `75cd1acb`: tsc clean · lint clean · jest **7190 passed / 1 skipped** (261 suites) · e2e full `258/265 ok, 1 failed (RECOV-R07, loadavg 24.5), 6 known-bug, coverage: 164/164 pairs`, then RECOV-R07 alone `1/1 ok` (so 259/265 effective).
- Vacuity: 11 matrix tests fail on develop's src (10 new + the edited SC-566 test). 3 new tests pass there and pin behaviour that has not changed. POOL-K07 fails on develop at the label (`"No Stamina Change"`) after passing its pool-0 and `xxxxx` checks, so the fixture really does reach pool 0 with 5 living minions. It passes on head.
- Not run: lifecycle, shots, freeze and parity. Lifecycle has no reference to the pool modal. Shots stage the pool modal only on the `fight` fixture, whose pool is wounded but above 0, and the grid shows that render is byte-identical. The diff is modal-only (no print, CSS or token change).
- Implementer screenshot checked: it shows "The pool is at 0, so 5 minion(s) die.", Apply "Kill 5 minion(s)" enabled and the stepper at 0 / 20.
- Worktree is clean at start and at end (`git status --porcelain` empty in the submodule; the superproject shows ` M draw-steel-elements`, the pointer that has not been bumped yet, as it did before the review).

## Findings

### LOW-1: a hand-edited negative pool locks Apply after the stepper is pressed + then − (this existed before the branch)
- `src/views/MinionStaminaPoolModal.ts:134` (`this.pendingStaminaChange = value - poolCurrentStamina`), together with `:102` and `:354`, which read the raw `minionPoolOf(...)` (for example -3) and do not clamp it.
- Scenario: the pool is hand-edited to -3 with 5 alive. The modal opens correctly ("Kill 5 minion(s)", enabled; this is new and correct). The GM presses `+` and then `−`. The stepper shows 0, but pending is `0 - (-3) = +3`, so the modal reads that as a heal. It then shows label "Heal 3 stamina", Apply **disabled with no title or reason**, info "Heal 3 stamina; dead minions stay dead.", the heal warning icon, and all five boxes ticked and locked (`xxxxx`). `+` alone reads "Heal 4 stamina" while the stepper shows 1. Reset recovers. Probe output: `probe-grid.json.corners.json` ("pneg3 inc,dec", "pneg3 inc").
- develop behaves the same way: these sequences are not in the grid diff. SC-573 does not cause it. However, the ledger says "pool <= 0 … Apply marks them dead", and the new negative-pool test (matrix `:840`) only covers the nothing-staged state.
- Prescribed fix, either of:
  - (a) fold it: normalize the current pool once, `Math.max(0, minionPoolOf(...) ?? poolMaxStamina)`, at `:102` and `:354`. Every pool > 0 is unchanged, because `max(0, x) = x`. Apply already clamps the write. Add one matrix test: `{ pool: -3 }`, inc, dec, then expect "Kill 5 minion(s)" enabled.
  - (b) file a Backlog follow-up linking SC-573.
- The pool is hand-edited only and no write path produces a negative value, so this does not block landing.

### INFO-1: a heal at pool 0 is not refused on an underfunded captained ladder (this existed before the branch, in the SC-421 class)
- Scenario, built the real way (`promoteCaptain` + `applyCaptainBonusTransition`): 5 Goblins of 4 with 2 dead and pool 12. Promoting a captain with `with_captain_stamina: 2` gives max 26 with a per-minion step of 6. Then set the pool to 0. The modal opens with "Kill 3 minion(s)" (correct). Pressing `+` gives an **enabled** "Heal 1 stamina" with no reason, and Apply would write pool 1 and kill no one. Cause: `initialMinionsKilled = floor(26/6) = 4`, so `healCeiling = 2`. develop behaves the same (grid spec `cap26p0d2` `[inc]` shows no diff). The ledger says "unchanged", and it is unchanged.
- The CHANGELOG sentence "A heal at pool 0 is still refused." (`CHANGELOG.md:117`) is true for squads whose ladder is consistent, which covers every squad with no captain. Optional: no change, or narrow the claim. Note it for SC-421.

### INFO-2: one new test is an unstated regression pin
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:859`: "a heal draft is refused before and after the commit" passes on develop's src. That is correct, because the heal path did not change. The tests at `:829` (0 alive) and `:909` (pool > 0) are stated pins, but `:859` is not labelled as one. Optional fix: add a one-word "(pin)" comment.

### INFO-3: redundant guard
- `src/views/MinionStaminaPoolModal.ts:371`: in `else if (pending <= 0 && newStamina <= 0)`, the `pending <= 0` can never be false, because the `pending > 0` branch at `:369` comes first. It is harmless and the comment explains the intent. No action needed.

### INFO-4: the SC-566 test edit is justified
- `matrix:358`: the -5 pool test now expects "Kill 5 minion(s)" and the new sentence. The test's purpose (no negative or sign-flipped amount) still holds, because the label no longer shows an amount at all. Side effect: the negative-current branch of `appliedPoolChange` (`raw < 0 && current < 0`) can no longer be reached from the label or info line. Reaching it would need damage staged while alive > 0, which now takes the `emptyPoolKills` branch, and with 0 alive the minion count clamps to 0. It is now dead code but harmless. No action needed.

## Checked and correct
- `poolNumbers()` widening `pending < 0` to `pending <= 0` (`:371`): when the pool is above 0, `pending === 0` means `newStamina` equals the current pool, which is above 0, so the branch is never taken. The grid confirms 0 diffs on pool > 0 squads, including squads whose ladder is underfunded (`p3d0`, `p5d2`), captained squads (`cap30`, `cap8d3`, `cap26p2d2`) and a pool above its max (`p25`).
- `emptyPoolKills` (`:387`) is a single value read by the label (`:506`), the info line (`:450`, `:452-454`) and enablement (through `minionsToKill`, `:521`). A staged heal (`pending > 0`) never gets it, so the refused heal keeps its title and its aria-label `Heal 1 stamina — Minions can't regain Stamina past a dead minion's share (at most 0)`. Stepping back to 0 restores "Kill 5" with no stale title, and its aria-label is reset by `setButtonText`.
- Enabled condition `(staminaChange === 0 && minionsToKill === 0) || mismatch`: no pool > 0 state has `staminaChange === 0` with `minionsToKill !== 0`, as the grid confirms.
- The SC-430 draft path agrees with the commit at pool 0. Checked: a heal draft of 4 (refused), then a draft of 0 (back to the Kill state), and a heal draft of 4 followed by an empty draft (Kill state; Apply then reverts the invalid draft and writes 0 with all five dead).
- Accessibility, in every Kill state across all 298 diff states: aria-label equals the visible label, there is no `title`, the info line uses the `hidden` attribute with an empty inline `display`, and the warn icon is hidden.
- Apply's writes, compared as a whole-encounter deep diff: pool 0 / 0+3 dead / -3 / 0 with damage staged each give 1 persist and close the modal. Exactly the living minions' `isDead` changes. The pool is written only when it was negative (-3 becomes 0). Nothing else changes: the conditions on #1, the other group and the heroes are untouched. The Apply onClick is not changed by the diff.
- Real captain relief (`initMinionPool` builds 30/30, then pool 2 with 4 dead, then `relieveCaptain` + `applyCaptainBonusTransition` gives pool 0 and max 28 with 1 alive). Head shows "Kill 1 minion(s)" enabled; Apply writes pool 0, all five dead, 1 persist. develop shows "No Stamina Change" disabled, which is the reported bug reproduced. A squad that was already inconsistent (pool 5, 0 dead) goes to pool 0 on relief and gets "Kill 5", which Apply records.
- A captained squad at pool 0 with its captain still bound (bonus folded in): "Kill 5", and `+` is refused with "(at most 0)".
- e2e fixture `e2e/vaults/shipped/Initiative/squad-empty.md` follows the `squad-hurt.md` conventions and has a README row. Nothing else lists shipped fixtures (the e2eCensus test uses only named fixtures), and coverage stays 164/164.
- CHANGELOG bullet is under `## 7.0.0 (unreleased…)` in the SC-566/567 voice. Its "used to read 'Deal 0 damage, kill 5 minion(s)'" matches what develop does (confirmed by the grid).
- The SC-574 known-bug markers are still in place. The diff touches only kill/label/info/enable logic in the pool modal, and does not touch SC-421, 574, 584, 591 or 592 code.

## Probes (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-review-r1/`)
- `ZzSc573ReviewProbe.test.ts`: the grid compares develop's modal (a temporary copy, `dev-MinionStaminaPoolModal.ts`) with head across 18 squad specs x 106 input sequences (typed values 0-31, drafts, Apply Damage d x m including negative and over-alive, +/- combinations, Reset, ticks and name clicks, and mixed sequences). It also covers the captain relief, promote and bound-captain cases, plus corner states. Results: `probe-grid.json`, `probe-grid-summary.txt`, `probe-grid.json.captain.json`, `probe-grid.json.corners.json`. Run log: `probe-run.log` (3/3 pass, `compared=1908 diffs=298 posPoolDiffs=0`).
- `ZzSc573ApplyDiff.test.ts`: whole-encounter deep diff of what Apply writes. Output in `probe-grid.json.applydiff.json`, log in `probe-applydiff-run.log`.
- Vacuity: `run-vacuity.sh` and `vacuity-run.log` (develop src: 11 failed / 111 passed of the matrix's 122).
- POOL-K07 on develop and on head: `run-e2e-k07-on-develop.sh`, `e2e-k07-on-develop.log` (FAIL at label "No Stamina Change"), `e2e-k07-on-head.log` (1/1 ok).
- Gate logs: `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-e2e.log`, `gate-e2e-recov-r07.log`.
- Probe files were copied into the worktree only while they ran and were deleted afterwards. The branch file swapped for the vacuity runs was restored with `git checkout`. The tree is clean.
