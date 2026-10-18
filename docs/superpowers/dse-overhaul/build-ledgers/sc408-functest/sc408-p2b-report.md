# SC-408 P2b report: jsdom fill of the stamina surfaces' uncovered logic

**Executive summary**
1. Verdict: DONE. Worktree `/home/scott/code/steelCompendium/worktrees/sc408-jsdom/draw-steel-elements`, branch `sc408-jsdom`, base `be4f002`, final sha **`4bdcb5c`** (5 commits, test files only, nothing pushed, tree clean).
2. Jest before (baseline at `be4f002`): **4448 passed / 2 skipped / 220 of 221 suites**. After: **4652 passed / 2 skipped / 223 of 224 suites**, 0 failures (+204 tests, +3 suites). `npm run tsc` clean, `npm run lint` clean.
3. New tests: **204** (161 modal matrix, 22 recoveries matrix, 21 entry-points). The 3 new files run 3x identically (204/204 each), deterministic.
4. Known-bug markers (`test.failing`, 27 tests): **SC-427 x11**, **SC-428 x10**, **SC-425 x4**, **SC-426 x2**. Each was verified by re-running with `test.failing` swapped to `test`: every one fails on its intended assertion (not on a thrown setup error).
5. S1 rows: of 25 jsdom-testable UNCOVERED rows in sections E/M/A/S/T/Q/F/W/R/K, **25 now have tests** (F08 is guard-only, see table). 10 UNCOVERED rows left, all `needs-real-obsidian` (E20, E21, A18, S07, S13, S14, W08, W09, F07, K03). PM rows were out of scope.
6. NEW suspected bugs: none. Every red expectation maps to an existing S1 bug (B1, B2, B3, B4, B8, B9, B10, B15, B16).
7. B5 / B6 were not touched (existing suites already pin them). No source changes.

## Files

All under `/home/scott/code/steelCompendium/worktrees/sc408-jsdom/draw-steel-elements/`:
- `test/dom/_staminaHarness.ts` (new, not a test file): shared modal builder + selectors, `makeHost`/`makeDeps`, `expectedApplyLabel`. Existing suites were not edited.
- `test/dom/views/stamina-edit-modal-matrix.test.ts` (161 tests)
- `test/dom/views/stamina-recoveries-matrix.test.ts` (22 tests)
- `test/dom/elements/stamina-entry-points-matrix.test.ts` (21 tests)

Logs (scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/p2b/`): `baseline.log`, `after.log`, `tsc.log`, `lint.log`, `det1.log`..`det3.log`, `m1s.log`/`m2.log`/`m3.log` (failing-marker verification).

Commits: `2d0ebbf` modal matrix, `6af6851` recoveries matrix, `22e81ce` entry points, `e6e1396` F08 guards, `4bdcb5c` harness type fixes (tsc).

## Design notes

- Expected numbers in the quick-action matrix are literals (hero floor -10, creature floor 0, max 20) and the Apply label is spelled by `expectedApplyLabel`, not read from the modal. Each case checks the preview (both steppers, label, disabled), then Apply (bar values, callback count).
- The quick-action matrix: {hero: full, near max, winded, dying, at floor} and {creature: full, near max, winded, near dead, dead} x temp 0/5 x {Damage 6, Damage 99, Healing 6, Healing 99, Kill, Full Heal}.
- Tests for covered rows that fall out of the matrices are labelled with their row ids too (A01-A04, A11-A12, Q01-Q02, Q04, Q06-Q10, F05, R01/R02/R07, S01/S02/S04).

## Row-by-row (S1 uncovered rows now covered)

| S1 row | Test title (abridged) | File |
|---|---|---|
| E06 | `[E06]` unresolved class: bar still opens modal ("/ 0"); Damage 5 persists 26 never 0 `[SC-425]` (failing); Full Heal does not write 0 `[SC-425]` (failing) | entry-points |
| E12 | `[E12]` dblclick on selected instance: cell+note carry 10 (passing); detail readout 10/40 `[SC-426]` (failing); detail bar 10 `[SC-426]` (failing); control: non-selected instance leaves detail alone | entry-points |
| E16 | `[E16]` select the dead minion, click "DEAD": pool modal opens; read-only: inert | entry-points |
| A05 | `[A05]` repeated Damage/Healing accumulate and stay clamped (5 tests) | modal |
| A07 | `[A07]` empty/non-numeric box (`''`,`abc`,`--`,`e`) x Damage/Healing = silent no-op (8) | modal |
| A08 | `[A08]` decimals truncate (`2.9`,`0.9`,`7.0`,`-2.9`) x Damage/Healing (7) | modal |
| A09 | `[A09]` "1e3" Damage / Healing `[SC-427]` (2 failing) | modal |
| A10 | `[A10]` Damage at creature -3 never heals `[SC-427]` (failing) | modal |
| A14 | `[A14]` Healing at 25/20 never damages `[SC-427]` (failing) | modal |
| A15 | `[A15]` Healing matrix (dying/at-floor heroes, dead creature) + Healing 99 from depth | modal |
| A16 | `[A16]` Enter in Apply box wires nothing (characterisation) | modal |
| S08 / S09 | `[S08]`/`[S09]` typed 30/99 and -5/-50: label equals persisted change `[SC-427]` (4 failing) + 4 controls proving persistence IS clamped | modal |
| S10 | `[S10]` typed 22 then + shows 23, persists 20 (documented deviation, pinned) + the low-side mirror | modal |
| Q03 | `[Q03]` Kill below the floor does not say "Gain" `[SC-427]` (hero -10/floor -7, and creature -3; 2 failing) | modal |
| Q05 | `[Q05]` max 0: Damage 5 on 31 persists 26 `[SC-425]`; Full Heal does not write 0 `[SC-425]` (2 failing) | modal |
| Q14 | `[Q14]` opts.spendRecovery {undefined, {}, true, false}; suppressed leaves the other actions working; ds-hero resolved renders it, unresolved does not | modal + entry-points |
| Q15 | `[Q15]` Spend Recovery from hero dying (-4) and at the floor (-15), two presses climb past 0 | modal |
| Q16 | `[Q16]` max 1/2: disabled from the start and inert; max 3 smallest working; reason text not "Already at maximum Stamina" `[SC-428]` (failing) | modal |
| F06 | `[F06]` Reset clears the Apply box `[SC-427]` (failing) | modal |
| F08 | `[F08]` guard-only: initiative error card on missing max_stamina; ds-stamina schema error. The modal-level NaN (P08) is unreachable, so no modal test (see Follow-ups) | entry-points |
| W02 | `[W02]` two Applies inside one debounce: one write carrying the second; separated by the window: two writes in order | entry-points |
| R03 | `[R03]` ds-stamina strip: button disabled / click writes nothing / no "Caught breath" toast at full `[SC-428]` (3 failing); ds-hero: disabled / no write at full `[SC-428]` (2 failing) | recoveries + entry-points |
| R08 | `[R08]` popover Catch breath disabled at 0 Recoveries / dying 0 / dying <0 / full `[SC-428]` (4 failing); plus the passing safety nets (click writes nothing) | recoveries |
| R09 | `[R09]` Escape closes an open popover; inert with no popover; inert with the setting off | recoveries |

Extra matrices (rows already covered, now table-driven): Damage 6/99, Healing 6/99, Kill, Full Heal over 2 host kinds x 5 states x temp 0/5 (A01-A04, A11-A12, Q01-Q02, Q04); Spend Recovery over 10 position/pool states (Q06-Q10); recoveryValue override (Q06); ds-stamina Catch Breath over 8 positions (R01/R02); ds-hero Catch Breath over 4 positions; Reset (F05).

## NEW suspected bugs

None. Observations while writing:
- Every `test.failing` reproduced the S1 symptom exactly (e.g. S08: label "Gain 20 Stamina" for typed 30 on 10/20, persisted +10; S08 hero typed 99 labels "Gain 89"; S09 hero typed -50 labels "Lose 60" while persisting the -10 floor; Q03 creature at -3 also says "Gain 3" on Kill, same B8 root as the hero case).
- ds-hero writes `state.stamina` as block YAML (`stamina:\n  current: 47\n  temp: 0`), not flow style; the tests parse the written block instead of matching text.

## Drive-by fixes:

None.

## Follow-ups:

1. **F08 (modal-level NaN when `max_stamina` is undefined)** has no modal test. It is unreachable (every host rejects first, pinned by the two guard tests), no ticket exists, and a `test.failing` without a ticket would break the known-bug convention. If the owner wants the latent defect marked anyway it is a 6-line test (S1 probe P08).
2. **NRO rows still UNCOVERED in jsdom by design** (belong to the real-Obsidian layer): E20, E21, A18, S07, S13 (B7, SC-430), S14, W08, W09, F07, K03.
3. **PM rows** (pool modal) were out of scope; S1's uncovered PM01-PM30 rows (PM02, PM07-09, PM12, PM13, PM16, PM17, PM21, PM24, PM27, B11-B14 / SC-429) remain for the rollout.
4. When SC-425/426/427/428 land, the matching `test.failing` flips to a failure and the marker must be removed (the bug-fix PR does that). 11 markers carry SC-427, 10 SC-428, 4 SC-425, 2 SC-426.
5. P2a merge note: the shared helper is `test/dom/_staminaHarness.ts`; P2a (functest worktree) should not collide with that name. The three test file names are new.
