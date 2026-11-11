# SC-573 implementer report, round 1

## Executive summary
- Verdict: DONE. Branch `sc573-pool-zero-apply` (draw-steel-elements), head `75cd1acb`, rebased onto origin/develop `eaa8742a` (develop moved twice during the run; the full battery below ran on `75cd1acb`).
- Commits: `64ca2310` fix + jsdom tests, `ca4dfdaf` e2e step + fixture, `75cd1acb` CHANGELOG.
- tsc clean, lint clean. jest 7190 passed / 1 skipped (baseline 7177 + 12 new tests + 1 un-skipped after shots cached the app css).
- lifecycle 54/54 (21 + 16 + 9 + 4 + 4; part 5 = `G-S59 G-S49 G-S73 G-S77`).
- e2e `259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (258/264 baseline + POOL-K07).
- shots 592 files; host-leak 163/978; modal host-leak 39 kinds / 234 comparisons; capture clip 147.
- freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Evidence PNG: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc573-impl-r1/sc573-pool0-nothing-staged.png (real Obsidian modal at pool 0, nothing staged).

## Measured today at pool 0 with damage staged
Before the fix, pool 0 and 5 alive, 3 damage x 1 minion via the Apply Damage row: Apply was ENABLED, label "Deal 0 damage, kill 5 minion(s)", info "0 damage will kill 5 minion(s). \nSelect 5 minion(s) to kill." (pending goes negative, so the `pending < 0 && newStamina <= 0` branch gives minionsToKill = alive, the boxes are auto-ticked, selected equals owed). Nothing staged: "No Stamina Change", disabled, info hidden. So the SC-566 owner's belief (disabled with damage staged) was wrong: only the nothing-staged state was broken. Now both read "Kill N minion(s)" / "The pool is at 0, so N minion(s) die."

## Where the owed-kill value lives
`MinionStaminaPoolModal.poolNumbers()`:
- `minionsToKill`'s empty-pool branch changed from `pending < 0 && newStamina <= 0` to `pending <= 0 && newStamina <= 0` (so nothing staged at pool <= 0 owes `aliveMinions`). A pool above 0 can never have `pending === 0 && newStamina <= 0`, so its behaviour is unchanged. The checkboxes (`updateCheckboxes`, newStamina <= 0 rule) and the SC-430 draft prediction in `updateActionButton` already agree with it, so no change was needed there.
- New returned field `emptyPoolKills = pending <= 0 && poolCurrentStamina <= 0 ? minionsToKill : 0`: "kills owed by a pool that is already empty". `updateActionButton` (label "Kill N minion(s)"; enable = `!(staminaChange === 0 && minionsToKill === 0)` and the existing selection match) and `updateInfoText` (shown, sentence "The pool is at 0, so N minion(s) die.") read this single value. A staged heal has pending > 0, so it never gets `emptyPoolKills` and stays refused with its old tooltip/aria reason.

## Files changed (worktree draw-steel-elements)
- src/views/MinionStaminaPoolModal.ts
- test/dom/views/minion-stamina-pool-modal-matrix.test.ts
- e2e/specs/minion-pool/pool-apply-kills.e2e.ts, e2e/driver/pool.ts (`EMPTY` constant), e2e/vaults/shipped/Initiative/squad-empty.md (new fixture), e2e/README.md (fixture row)
- CHANGELOG.md (one [FIX] bullet in the 7.0.0 unreleased section)

## Tests added (jest, in the matrix file, new describe "SC-573: a pool at 0 with living minions: Apply records their deaths"; 13 tests, of which the moved marker was already counted as passing as test.failing, so jest net +12)
1. The former `test.failing` marker, moved out of "known bugs" to a plain test (assertion kept, comment updated).
2. Nothing staged: "Kill 5 minion(s)", enabled, no title, info visible with the sentence, heal icon hidden, boxes `xxxxx`.
3. Apply: all five dead, pool 0, persist once, modal closes.
4. Damage staged on the empty pool: same label and sentence (not "Deal 0 damage" / "0 damage will kill"); Apply result.
5. 3 already dead: "Kill 2 minion(s)", Apply kills exactly those two.
6. Staged heal still refused (old title + aria-label + info), nothing persisted; stepping back restores the kill state (no leak).
7. 0 alive at pool 0: disabled, "No Stamina Change", info hidden, Apply is a no-op.
8. Negative hand-edited pool (-3): behaves as 0, writes 0.
9-11. Draft path (SC-430): a heal draft predicts the same refused state the commit shows; a draft of 0 stays the enabled kill state before/after commit; negative pool + draft 0 agree.
12. Reset after a staged heal / staged damage returns to the enabled "Kill 5 minion(s)" state.
13. Regression pin: pools above 0 (full, 12 with 2 dead, 1) with nothing staged stay "No Stamina Change", disabled, no title, info hidden.
Updated one existing test: the SC-566 "-5 pool labels damage as 0" test now expects "Kill 5 minion(s)" and the new sentence (superseded by the owner decision; its point, no negative or sign-flipped amount, still holds).

## e2e step
`[POOL-K07]` in e2e/specs/minion-pool/pool-apply-kills.e2e.ts, opening the new fixture `Initiative/squad-empty.md` (pool 0, five alive; the existing fixtures cannot reach pool 0 with minions alive): checks pool input 0, boxes `xxxxx`, label "Kill 5 minion(s)", enabled, no title, info line, then Apply writes once, note shows five `isDead` and pool 0, roster cells read DEAD. It drives existing (control, kind) pairs only: coverage stays at the baseline pair count (164/164 at eaa8742a). The screenshot was taken once by a temporary line (removed before commit).

## Drive-by fixes
- None.

## Follow-ups
- `npm ci` was needed in the fresh worktree (no node_modules); worth a line in worktree docs if not already there.
- The dse-verify skill file is ~290 KB and does not fit one Read; a pointer table in its head would help agents. Not touched.
