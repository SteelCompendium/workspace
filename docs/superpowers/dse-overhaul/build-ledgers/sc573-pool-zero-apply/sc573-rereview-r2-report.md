# SC-573 scoped re-review, round 2

## Executive summary
- Verdict: **LAND**. Head `6c7216e8` (one commit on top of the r1 head `75cd1acb`; origin/develop is still `eaa8742a`). Delta: modal file, matrix test, CHANGELOG.
- Findings: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 2 (no action needed for either). All five r1 findings are folded as the owner ruled.
- Grid, head vs develop: 2438 states (23 squad specs x 106 sequences). **0 differences on pools above 0**. The 818 differences are all on pools at or below 0.
- Head r1 vs head r2: 288 differences, all on the 6 negative-pool specs. In 277 of them the heal's enable state, title, boxes and Apply outcome are identical and only the heal amount text changed (now measured from 0). 10 are the LOW-1 fix: Heal (disabled) becomes "Kill N" (enabled, writes 0, all dead, 1 persist). 1 is a squad with pool -3 and 0 alive, where + then − now reads "No Stamina Change", disabled.
- Equivalence: a negative pool behaves exactly like the same squad at pool 0 in 636 of 636 paired runs. The squads cover -3, -4, -3 with 3 dead, -3 with 5 dead, a captained squad at -3 with max 26, and a captained squad at -7 with max 30.
- Heal path: no change at all for any pool at or above 0, including SC-421's underfunded captained ladder. That ladder still allows the heal from 0, the same as develop.
- Vacuity: the new r2 test fails on r1's code (1 of 123 fail) and on develop's code (12 of 123 fail). The renamed "(pin)" test passes on both, as a pin should.
- Gates I measured on `6c7216e8`:
  - jest, full run: 7189 passed, 2 failed, 1 skipped. Both failures were 5 s timeouts in the documented load-sensitive suites `initiative-default-keys` and `twin-reuse`, at loadavg 28. Re-run alone they pass 78/78, so 7191 passed / 1 skipped effective.
  - POOL-K07 alone: `1/1 ok`.
  - I did not run the full e2e: the delta touches only the modal, its tests and the CHANGELOG.
- Implementer's gate logs, re-read; every log was written after the `6c7216e8` commit:
  - tsc and lint clean; jest 7191 / 1.
  - Lifecycle 21+16+9+4+4 = 54/54.
  - e2e `259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`.
  - Shots: capture clip 147 and the inline, checkbox and prose host-leak checks report OK.
  - freeze 280/280; parity 0/0/24.

## Fold-by-fold check
- **LOW-1** (`MinionStaminaPoolModal.ts:397-399`, `currentPool()`, used at `:102` and `:354`): it floors the pool at 0. That one value now feeds the stepper base, `onChange`, `onDraftInput`, the Apply handler (through `poolCurrentStamina` from `onOpen`), `poolNumbers()`, `appliedPoolChange`, `clampedNewStamina` and `updateStaminaBar`. No raw `minionPoolOf` read is left in the file.
  - Pool -3, + then −: "Kill 5 minion(s)", enabled, no title, info sentence, heal icon hidden, boxes `xxxxx`. Apply writes 0, all dead, 1 persist.
  - Pool -3, + alone: "Heal 1 stamina", refused, "(at most 0)". In r1 this read "Heal 4" with "(at most -4)" for pool -4.
  - A side benefit: the negative heal ceilings ("at most -4", "at most -6") that r1 showed on negative pools are gone.
  - `Math.max(0, x) = x` for any x of 0 or more, which matches the 0 grid differences on pools above 0.
- **INFO-1** (`CHANGELOG.md:117-118`): the line "A heal at pool 0 is still refused" is gone. The bullet now says "Heals are unchanged." plus a sentence that a hand-edited pool below 0 counts as 0. That makes no claim that is false for an underfunded captained squad. For pools below 0 the heal amount text did change (it is now measured from the 0 the stepper shows), but the very next sentence covers that case.
- **INFO-2** (`matrix:878-879`): the test is renamed "(pin) a heal draft is refused before and after the commit" with a comment saying it is a pin. It passes on develop, r1 and r2.
- **INFO-3** (`:371`): the condition is now `else if (newStamina <= 0)`, with a comment saying the heal is handled by the branch above. It behaves the same: the grid shows 0 differences between r1 and r2 for any pool at or above 0.
- **INFO-4** (`:417`): `-Math.max(0, poolCurrentStamina)` became `-poolCurrentStamina`. This is safe because `currentPool()` guarantees the value is 0 or more, so the inner `max` did nothing. The doc comment is updated.

## INFO findings (no action)
- **INFO-A**: a squad with pool -3 and 0 alive. In r1, + then − staged a "Heal 3 stamina" that would rewrite the stored -3 as 0. In r2 it is "No Stamina Change", disabled, and the stored -3 stays on disk until some other write. Nothing changes for the user: no minion is alive and the window shows 0. Just noting it.
- **INFO-B**: `updateStaminaBar` now draws a negative pool's current fill as 0% instead of a negative percentage. This is visual only, on pools below 0, which no write path produces. The shots, freeze and host-leak results above are unaffected.

## Probes (in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-review-r2/`)
- `ZzSc573ReviewProbeR2.test.ts` and `run-probe-r2.sh`. These compare develop, r1 (`75cd1acb`) and head over 23 specs: the r1 18 plus pool -4, -3 with 3 dead, -3 with 5 dead, a captained squad (max 26) at -3 with 2 dead, and a captained squad (max 30) at -7. The script also runs the captain-relief, corner and EQUIV tests.
  - Output: `probe-grid-r2.json`, `probe-grid-r2.json.r1-vs-r2.json`, `probe-grid-r2.json.corners.json`, `probe-grid-r2.json.captain.json`, `probe-grid-r2.json.equiv.json`.
  - Summaries: `probe-grid-r2-summary.txt`, `probe-r2-heal-check.txt`.
  - Logs: `probe-r2-run.log` (3/3, `compared=2438 diffs=818 posPoolDiffs=0 r1VsR2=288`) and `probe-r2-equiv-run.log` (`compared=636 mismatches=0`).
- Vacuity: `run-vacuity-r2.sh`, `vacuity-r2-on-r1src.log` (1 failed / 122 passed), `vacuity-r2-on-devsrc.log` (12 failed / 111 passed).
- Gates: `gate-jest.log`, `gate-jest-rerun.log`, `gate-e2e-k07.log`.
- The temporary probe files and swapped source files were removed or restored. `git status --porcelain` in the submodule is empty.
