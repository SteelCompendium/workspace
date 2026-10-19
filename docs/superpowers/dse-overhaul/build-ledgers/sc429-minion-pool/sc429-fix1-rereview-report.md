# SC-429 fix round 1: scoped re-review (delta 7b3d6f0..8ab5e91)

**Executive summary**
- VERDICT: **APPROVE.** Findings: HIGH 0, MEDIUM 0, LOW 0, INFO 2 (neither blocks).
- Rebase is clean. `git range-diff a89ffd9..c1cc4fe c78a06b..7b3d6f0` prints `1: c1cc4fe = 1: 7b3d6f0`, an identical commit with nothing extra carried.
- LOW-1, LOW-2 and INFO-2 are each fixed exactly as prescribed (`src/views/MinionStaminaPoolModal.ts:185-190`, `:417-420`, `:438-439`).
- The new tests are not vacuous. With `7b3d6f0`'s modal source put back, **4 of the 5 new tests fail**: LOW-1 draft parity, the full-squad clamp, the 2-dead clamp and the "Select 0" drop. The 5th ("in-range count left as typed") is a control and passes at both commits, as intended.
- Modal suite and e2e census on `8ab5e91` source: `Tests: 74 passed, 74 total`, 2 suites, rc=0. tsc and eslint on the touched files: rc=0. I did not re-run the full battery, per the brief.
- Probes found no regression:
  - Every typed-count edge value tested behaves sensibly: 0, -3, empty, 2.7, 1e3, 6 and junk text.
  - An all-dead squad gives `alive` 0, damage 0 and the box shows 0.
  - Seven typed-pool cases each show the same Apply state and info line while typing as after commit.
  - Two over-count applies in a row add up correctly.

## Per prescribed fix
- **LOW-1** (`:438-439`): adds `else selectedMinions = checked && !auto count` inside the draft-only block. This is exactly the prescription. The committed path is untouched because the block runs only when `draftStaminaChange !== null`.
  - Probe Q3 checks that label, disabled, title, info and info-hidden are the same while typing and after commit, in 7 cases: user ticks then pool 0 then type 1; no ticks, pool 0, type 1; 1 tick, pool 0, type 13; 2 ticks, pool 0, type 9; 2 ticks with 3 kills owed, type 0; the same, type 20; 4 ticks with 4 owed, type 13. Result: 0 mismatches.
- **LOW-2** (`:185-190`): `alive` uses the same `!isDead` rule as `max` and `poolNumbers()`. The count becomes `Math.min(alive, Math.max(0, minions))` and is written back to the box before `refresh()`.
  - The write-back cannot exceed `max`, and the value is still ≥ `min` (0).
  - It has no effect on the SC-430 pool-draft path, since the count box is not a stepper and `refresh()` already discarded any draft.
- **INFO-2** (`:417-420`): the second sentence is appended only when `minionsToKill > 0`. That arm is reachable only with damage pending (`pending < 0`), so a negative kill count can never reach it.
  - Q4 results: 1×1 and 3×1 read "N damage will kill 0 minion(s)." with the line visible. 4×1, 2×3, 4×5 and 7×1 keep both sentences.
  - The text follows the effective pending change, so it is the same while typing and after commit.

## Probe results (Q1, Q2, Q5), from `sc429-rev-probe2.test.ts`
| Typed count, 4 damage, full squad | Box after Apply Damage | Effect |
|---|---|---|
| `0` | `0` | no change, "No Stamina Change", line hidden |
| `-3` | `0` | no change (it used to stay `-3` in the box; showing 0 is clearer) |
| empty | empty | no-op (`parseInt` gives NaN; same as before) |
| `2.7` | `2` | 8 damage, 2 kills |
| `1e3` | `1` | 4 damage (see INFO-a) |
| `6` | `5` | 20 damage, 5 kills, pool 0, all 5 ticked automatically |
| `abc` | empty | no-op |

- **Q2, all-dead squad** (pool 0, and an inconsistent save with pool 4): `max` is 0 and there are no checkboxes. Apply Damage with count 3 gives damage 0, the box shows `0`, and Apply stays "No Stamina Change", disabled. No write, no throw.
- **Q5:** two over-count applies (1×9, twice) give 10 damage, pool 10, "kill 2". Each apply is capped on its own.

## INFO (no action required)
- **INFO-a:** typing `1e3` (valid in a number input) gives `parseInt` 1, and the box is now rewritten to `1`. This parsing is old behaviour, now visible rather than silent. Arguably an improvement; `Number()` would change the semantics, so leave it.
- **INFO-b:** in an all-dead squad the count box opens showing `1` while `max` is `0`, a side effect of round 1's O3. Apply Damage corrects it to `0`, and nothing is written. If wanted, initialise the box to `Math.min(1, alive)`. Cosmetic, and only reachable on a squad that is already fully dead.

## Hygiene
- The branch worktree's `git status --porcelain` was empty before and after; HEAD is `8ab5e91`.
- The scratch worktree `/home/scott/code/steelCompendium/worktrees/sc429-review-scratch2` was removed and pruned.
- I did not touch the main checkout's `draw-steel-elements`.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`:
- `sc429-rev-fix1-basejest.log`: the suite with `7b3d6f0`'s source, 4 failed.
- `sc429-rev-fix1-probe.log`: Q1 to Q5.
- `sc429-rev-fix1-suite.log`: 74 passed.
- `sc429-rev-fix1-tsclint.log`: tsc and eslint, rc=0.
- `sc429-rev-probe2.test.ts`: the probe tests.
