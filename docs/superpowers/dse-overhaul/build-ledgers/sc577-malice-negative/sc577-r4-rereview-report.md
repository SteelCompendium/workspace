# SC-577 R4 scoped re-review (Opus): fix round 49271a6b..93b3a382

Executive summary
- Verdict: LAND-READY. 0 HIGH, 0 MEDIUM, 0 LOW, 4 INFO (all cosmetic or optional).
- Reviewed: dse `93b3a382` on develop f2889351. Superproject worktree `cb5d5691`. Both trees left as found (dse clean; superproject ` M draw-steel-elements`, the pointer for wt-finish).
- Gates measured: initiative jest suites 424/424. Full jest 7107 passed / 1 skipped. e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (exit 0, no flakes). All match the implementer's numbers.
- O6 holds. `addToMalicePool` is the only arithmetic for Advance round (`model.ts:478`) and the quick-add (`view.ts:680`). The other writers are the stepper's direct `v` (`view.ts:500`, already floored by the kit's `min: 0` and seed clamp) and the reset (`EncounterData.ts:665`, writes 0).
- Stored −2 behaviour (jsdom probe, deleted): it shows 0 both writable and read-only; nothing is written on render; − is disabled and a click writes nothing. + writes 1, Advance with gain 3 writes 3 (log +3), a +3 quick-add writes 3. A −1 quick-add writes 0, Advance with gain −3 writes 0, and Reset writes 0.
- Mutations (each restored exactly):
  - `maliceValueOf` without its floor: 4 tests go red (jsdom [M05], [M07] read-only, and [R01] −2+3, plus the unit O6 test).
  - `addToMalicePool` without its outer floor: 5 go red ([R01] negative gain, [R01] table row −5, [M03-M05] clamp, plus both unit tests).
- Known-bug markers unchanged: [M09] SC-578, [M10] SC-589 and [M04] SC-588 are still `test.failing` and the suites are green, so their bodies still fail. In e2e, INIT-M09 (SC-578) and INIT-F01 (SC-588) still count as known bugs.
- Range-diff: the 3 SC-577 commits are `=` (4edfc0be=4648603d, 4238f430=f9491da3, 56e79252=49271a6b). The command as given (`734d7745..56e79252`) also lists the two SC-566 commits as dropped, because they sit in that base range. That is expected; b4e7b4f4 is the true base.
- R2 folds verified: MEDIUM-1 dse CHANGELOG `[FIX]` bullet (`CHANGELOG.md:25-30`), LOW-1 (`view.ts:510`), LOW-2 rows (`initiative-matrix.test.ts:215-216, :252`), INFO-6 docs (`docs/initiative-tracker.md:250, :346-347`), O7 describe split (`:865` "Malice never goes below 0 (SC-577)"; `:913` "known bugs: the quick-add (SC-578, SC-588, SC-589)").

## INFO
- INFO-1. `test/dom/elements/initiative-matrix.test.ts:898`: the new accepted quick-add test is tagged `[M05]`. In this file's scheme and in e2e (INIT-M05), M05 is the rejected submit; the accepted add is M03 (INIT-M03, the `[M03-M05]` valid-quick-add table). Optional retag to `[M03]`.
- INFO-2. `src/elements/initiative/view.ts:493`: the writable stepper is still seeded with raw `data.malice.value`. It shows 0 only because of the kit's default `clampInitial`. `maliceValueOf`'s doc says a negative counts as 0 "on every display". Seeding with `maliceValueOf(data.malice)` would make that true by construction (same behaviour, no write). Optional.
- INFO-3. Superproject `CHANGELOG.md:14` (cb5d5691) is now about 150 characters, while its neighbours wrap at about 120. Cosmetic.
- INFO-4. `maliceValueOf` uses `Math.max(0, NaN)`, which is NaN. That is pre-existing for a YAML `.nan` and out of scope; noted only because the helper is now the single choke point.

## Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-rev-r2-opus/r4/`
- `probe.log`: the stored −2 probes (one-line PROBE JSON).
- `mut-valueOf.log`, `mut-addFloor.log`: the helper mutations.
- `jest-init.log` (424/424), `jest-full.log` (7107/1), `e2e-full.log` (258/264, 6 known-bug, 164/164, E2ERC=0).
