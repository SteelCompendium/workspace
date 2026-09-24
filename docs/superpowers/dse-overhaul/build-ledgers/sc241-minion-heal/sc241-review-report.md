# SC-241 independent review — draw-steel-elements `sc241-minion-heal` @ 46c0c4c

## Executive summary

- **Verdict: APPROVE.** No HIGH, MEDIUM or LOW findings. There are 4 INFO notes, and none of them needs action on this branch.
- The fix does what Scott and the owner ruled: `Math.max(0, …)` on BOTH parsed values at the parse boundary (`src/views/MinionStaminaPoolModal.ts:149-151`) plus `min="0"` on `damageInput` (`:122`). It uses the same idiom as SC-133 RC-3 in `StaminaEditModal.ts:326,341,369`.
- Red-first reproduced independently: with only `src/` reverted, **4 failed / 30 passed / 34 total**, and each failure is for the right reason (warn shown; pending +6; pending -6; min null).
- Mutation check: 5 mutants (damage unclamped, minions unclamped, no `min`, product-clamp instead of per-operand, `refresh()` dropped). **Each one is killed by exactly one distinct SC-241 test.** The suite is not vacuous.
- Edge-case probe (`-0`, `-3.5`, `-1.2`, `-1e3`, whitespace, `-`, empty, repeated applies, negative after positive, persisted pool): the fixed code never heals. On the unfixed code, 6 of 15 probe tests fail. The legit stepper-increase warning still fires.
- Gates at 46c0c4c: jest **3930 passed / 1 skipped / 202 of 203 suites / 3 snapshots**; tsc clean; lint exit 0. These match the implementer's numbers. I did not re-run shots, freeze or parity: the change is a `min` attribute plus onClick math, with no CSS or pixel surface (see INFO-4).
- Working tree: `git status --porcelain` was empty before and after. All probe edits were reverted, and the probe file was deleted.

## Diff reviewed

`origin/develop` (0c132d8, = merge-base) `..HEAD` (46c0c4c): `CHANGELOG.md` +6,
`src/views/MinionStaminaPoolModal.ts` +10/-1, `test/dom/views/minion-stamina-pool-modal.test.ts` +48.

## Execution evidence

| Probe | Result | Log |
|---|---|---|
| Red-first (src reverted to origin/develop, tests kept) | 4 failed / 30 passed / 34. Test 1 fails at `warn.hidden` (true expected, false received); test 2 pending 6≠0; test 3 pending -6≠0; test 4 min null≠"0". Positive guard passes. | `scratchpad/rev-redfirst-1790229769119193830.log` |
| M1: `clampedDamage = damage` | killed by "damage -3, minions 1" | `scratchpad/mut-M1-damage-unclamped-*.log` |
| M2: `clampedMinions = minions` | killed by "damage 3, minions -2" | `scratchpad/mut-M2-minions-unclamped-*.log` |
| M3: drop `setAttribute('min','0')` | killed by "damageInput carries min=0" | `scratchpad/mut-M3-no-min-*.log` |
| M4: `totalDamage = Math.max(0, damage*minions)` (wrong clamp point) | killed by "double negative" test | `scratchpad/mut-M4-product-clamp-*.log` |
| M5: remove `this.refresh()` from Apply onClick | killed by the positive guard test | `scratchpad/mut-M5-no-refresh-*.log` |
| Edge probe, fixed source | 15/15 pass | `scratchpad/probe-fixed-1790229854532425329.log` |
| Edge probe, unfixed source | 6 failed / 9 passed (`-3.5`, `-1.2`, `-1e3` ×2 inverted into heals; accumulation; persisted-pool at 17 → 20) | `scratchpad/probe-unfixed-1790229862376329654.log` |
| Full jest (`rm -f main.js styles.css && npx jest`) | 202 passed / 1 skipped suites (202 of 203); 3930 passed / 1 skipped / 3931 tests; 3 snapshots | `scratchpad/jest-full-1790229879435238809.log` |
| tsc | clean | `scratchpad/tsc-1790229879435238809.log` |
| lint | exit 0 (only the known ESLintIgnoreWarning) | `scratchpad/lint-1790229879435238809.log` |

The scratchpad is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/`.

## Checks against the brief

- **Vacuity:** all tests drive the real DOM. They set the two `.dse-sedit__apply-input` values and click the `Apply Damage` kit button. Test 1 also clicks the footer action button and asserts the persisted `group.minion_stamina_pool`. On its own, that persisted-pool assertion discriminates fixed from unfixed (my probe, unfixed: 17 → 20). Tests 2 and 3 read the private `pendingStaminaChange`. That is acceptable, because M2 and M4 show they are still discriminating. If the clamp sat on the wrong variable (M1/M2) or `refresh()` never ran (M5), the suite would go red.
- **Remaining inversion paths in the modal:** none found.
  - The stepper (`:93-107`) is bounded `[0, poolMax]` and sets an absolute value. It is not a signed-magnitude input.
  - Reset zeroes the pending change.
  - Condition-icon removal does not touch stamina.
  - `-0` gives `Math.max(0,-0)` = +0, so pending stays +0 (verified with `Object.is`).
  - Whitespace and `-` are sanitized to `''` by `type=number`, which gives NaN and a no-op.
  - Empty either box: no-op.
- **Accumulation:** `3,1` then `2,1` gives -5. A following `-5,1` and `1,-1` leave it at -5, so a negative entry can no longer cancel earlier damage.
- **Warning still fires for a legit heal:** the existing test at `test/dom/views/minion-stamina-pool-modal.test.ts:228-242` passes post-fix, and my probe (pool 16, Increase) also shows it.
- **Other constructors/dependents:** `src/elements/initiative/view.ts:1453` and `:1567` only construct the modal with a persist callback. `EncounterData.ts:314` is a comment. Nothing depends on negative-input behavior. No DSE doc still describes the bug as open.
- **Changelog:** `CHANGELOG.md:18-23` has a `[FIX]` bullet at the top of `## 7.0.0 (unreleased; previously numbered 6.0.0)`, above SC-278, in the same shape. It is accurate and in plain language.

## Findings

### HIGH / MEDIUM / LOW
None.

### INFO (no action required on this branch)

1. **INFO — `src/views/MinionStaminaPoolModal.ts:142-143`: `parseInt` truncation is pre-existing.** `1e3` parses to 1 and `3.7` to 3 (probe: pending -1, -3). That means under-damage, not inversion, and `StaminaEditModal.ts:335,366` has the same semantics. An existing test even pins parseInt coercion for the stepper (`test/…minion-stamina-pool-modal.test.ts:210`). Fix, if ever wanted: a separate ticket switching both modals to `Number()` + `Math.trunc`. Out of scope here.
2. **INFO — `src/views/MinionStaminaPoolModal.ts:130`: the minion-count `max` is not enforced at parse.** `max = instances.length` counts dead instances too, and a typed count above the alive count still multiplies the damage. This is not an inversion, and the Apply-time clamp at `:229` floors the pool at 0. No action.
3. **INFO — implementer report accuracy (`sc241-impl-report.md`, jest row).** It says the file gained "net +4 new tests beyond the pre-existing 30". It actually has 5 new tests on top of 29 pre-existing, for 34 in total. The red-first "30 passed" is 29 old tests plus the new positive guard. This is report bookkeeping only; the suite totals (3930) are correct.
4. **INFO — pixel surface.** `min="0"` can only change rendering through `:invalid` / `:out-of-range` styling. A grep of `src/` and the stylesheets found no such selector, and the shots fixtures never type a negative value. So skipping the shots/freeze/parity re-run is justified. The implementer's 524 / 260/260 / 0-0-16 stand.

## Working-tree hygiene

- `git status --porcelain` in `/home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements` was empty before and after the review.
- Every src mutation was restored with `git checkout --`, and the probe test file `test/dom/views/zz-sc241-probe.test.ts` was deleted.
- `main.js` and `styles.css` (gitignored build outputs) were removed per the brief's jest command.
- No commits were made.
