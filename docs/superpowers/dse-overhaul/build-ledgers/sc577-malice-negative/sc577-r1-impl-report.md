# SC-577 R1 implementer report

Executive summary
- Verdict: DONE. Malice never goes below 0 on the stepper, round gain, and Advance label (O1-O5).
- dse head (rebased onto origin/develop b4e7b4f4): 56e79252 (3 commits: 4edfc0be fix, 4238f430 e2e fix, 56e79252 manifest). Not pushed.
- Superproject worktree commit (CHANGELOG only): see `git -C /home/scott/code/steelCompendium/worktrees/sc577-malice-negative log -1` (message "docs: changelog bullet for SC-577").
- Gates on the REBASED head: tsc 0, lint 0, jest 7089 passed / 1 skipped (expected 7088+1 new), lifecycle 53/53 (21+16+9+4+3), e2e 257/263 ok, 0 failed, 6 known-bug, coverage 164/164, shots 592 + host-leak 163/978 + modal 39/234 + clip 147, freeze 280/280, parity 0/0/24.
- e2e arithmetic: "ok" excludes known-bug (baseline 255 ok + 7 kb = 262), so +1 new test and -1 known-bug gives 257 ok + 6 kb = 263 (brief said 256/262).
- Coverage went 163 to 164 pairs: INIT-M07 clicks the disabled - button, declared in e2e/manifest/initiative.ts as `click-disabled`.
- Flakes (reload under loadavg 14-27): jest twin-reuse SC-547 + initiative-default-keys timed out in a full run, pass alone (78/78); e2e CENSUS-07 (45 s timeout) x2, RECOV-R07 x1, shots montage board-scroll wheel gate x1: all passed on rerun. Final numbers above are clean runs.

Superproject sha: dddf8cfe (CHANGELOG.md only; the dse submodule pointer is left modified/uncommitted for the owner's wt-finish).

## Changes
- view.ts `buildMaliceTotal`: stepper `min: 0`; `buildRoundControls`: label sign rule (`+` for >=0, bare `-`).
- model.ts `advanceRound`: `value = Math.max(0, value + gain)`, log keeps configured amount; doc comment updated.
- Tests: jest [M07] [R01] `test.failing` to `test`; new unit test in test/unit/model/economy-serialize.test.ts (floor + log shape + normal reduction); e2e [INIT-M07] knownBug to `it` (plus settle + note read); new e2e [INIT-R03] (externalEdit round_gain -9 after openNote; label, floor, log, disabled -).
- e2e/manifest/initiative.ts: dec gains `click-disabled`, M07; comment updated.
- Gotchas found: `dse.openNote` restores the fixture (edit after opening); the runner parses `[ID]` tokens in titles (no `[SC-577]` in a title).

## Evidence
Logs (rebased): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-impl-r1-main/rb-*.log, rblc1-5.log (and .rc beside each). Freeze: rb-freeze.log. Pre-rebase logs (not counted) have no rb- prefix.

## Follow-ups
- A hand-edited `value: -2` displays 0 but Advance round computes from -2 (-2 + 3 = 1, not 3) because `parse` does not coerce (per O2). Owner may want to floor the base in advanceRound.
- The matrix test file still has a "known bugs" describe holding [M07]/[R01] (now plain tests) beside [M09]; comment updated, title unchanged.
Drive-by fixes: none.
