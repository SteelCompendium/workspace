# SC-573 implementer report, round 2 (fix round 1)

## Executive summary
- Verdict: DONE. Branch `sc573-pool-zero-apply` (draw-steel-elements), head `6c7216e8` (r2 commit on top of r1 `75cd1acb`); origin/develop still `eaa8742a`, no rebase needed.
- All five review findings folded (LOW-1, INFO-1..4); heal behaviour untouched (SC-421 stays out of scope).
- tsc clean, lint clean; jest 7191 passed / 1 skipped (7190 + 1 new test); lifecycle 54/54 (21+16+9+4+4, part 5 = `G-S59 G-S49 G-S73 G-S77`).
- e2e `259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`; shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147.
- freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.

## What changed (commit `6c7216e8`, `fix(pool-modal): ... (SC-573 r2)`)
1. LOW-1: new `private currentPool()` = `Math.max(0, minionPoolOf(...) ?? minionPoolMaxOf(...))`, the one read used by the stepper base (`onOpen`'s `poolCurrentStamina`, which also feeds `onChange`, `onDraftInput` and the Apply handler) and `poolNumbers()`. Pools above 0 are unchanged (`max(0, x) = x`). Apply already clamps the write; a -3 pool now stages nothing from + then -, and Apply writes 0.
   Test: `a hand-edited negative pool: + then - lands back on the nothing-staged kill state (r2), and Apply writes 0` (pool -3; + reads "Heal 1 stamina" measured from 0, not "Heal 4"; then - gives "Kill 5 minion(s)", enabled, no title, info sentence, heal icon hidden, boxes `xxxxx`; Apply writes 0, five dead, one persist).
2. INFO-1: CHANGELOG bullet no longer says "A heal at pool 0 is still refused"; it says "Heals are unchanged." and adds one sentence on the below-0 pool fix.
3. INFO-2: the heal-draft test is renamed `(pin) a heal draft is refused before and after the commit` with a regression-pin comment.
4. INFO-3: `else if (pending <= 0 && newStamina <= 0)` is now `else if (newStamina <= 0)` (a heal took the branch above); comment says so.
5. INFO-4: the negative-pool branch of `appliedPoolChange` is provably dead once `currentPool()` floors the pool, so it is removed (`-Math.max(0, poolCurrentStamina)` becomes `-poolCurrentStamina`); the doc comment is updated.

## Files
- src/views/MinionStaminaPoolModal.ts, test/dom/views/minion-stamina-pool-modal-matrix.test.ts, CHANGELOG.md (all under the worktree's `draw-steel-elements/`).

## Gate logs
Folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-impl-r2/b/`: tsc.log, lint.log, jest.log, jest2.log (after shots), lc1.log..lc5.log, e2e.log, shots.log, freeze.log, parity.log.

## Drive-by fixes
- None.

## Follow-ups
- None new. (Underfunded captained ladders still allow a heal from pool 0: SC-421 class, per review INFO-1.)
