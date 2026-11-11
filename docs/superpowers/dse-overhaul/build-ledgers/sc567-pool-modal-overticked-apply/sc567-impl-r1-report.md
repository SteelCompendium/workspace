# SC-567 implementer report, round 1

## Executive summary
- Verdict: DONE. Trim chosen (per ledger): surplus ticks are unticked, latest user pick first.
- Branch `sc567-pool-modal-overticked-apply` (draw-steel-elements), head `dee48526`; base `b4e7b4f4` (= origin/develop, no rebase needed). Commits: `24c3bb51` code+tests, `dee48526` e2e POOL-K06.
- tsc clean, lint clean. jest 7098 passed / 2 skipped (full run 7097 passed + 1 flake that passes alone = 7098; baseline 7088 + 11 new tests = 7099, minus 1 because a fresh worktree skips the printTwin test until shots caches the app css).
- jest full run had 1 SC-568-style load timeout (`twin-reuse.test.ts` SC-547, 5000 ms); re-run alone 53/53 green.
- lifecycle 53/53 (parts 21 + 16 + 9 + 4 + 3, all 0 failed).
- e2e 256/263 ok, 0 failed, 7 known-bug, coverage 163/163 pairs (+1 ok: new [POOL-K06]).
- shots 592; host-leak 163/978; modal host-leak 39 kinds / 234 comparisons; capture clip 147.
- freeze 280/280 byte-identical; parity 0 gaps / 0 undeclared / 24 declared.

## Files changed
- `draw-steel-elements/src/views/MinionStaminaPoolModal.ts` (+36/-?)
- `draw-steel-elements/test/dom/views/minion-stamina-pool-modal-matrix.test.ts`
- `draw-steel-elements/e2e/specs/minion-pool/pool-apply-kills.e2e.ts`

## Design of the tick-order tracking
- Each `minionCheckboxes` entry gains `tick: number` (0 = not a user pick); the modal holds a monotonically increasing `tickSeq`.
- One `handToggled()` closure per row (used by both the `change` handler and the name-click handler): clears `auto`, sets `tick = checked ? ++tickSeq : 0`. A re-tick after an untick therefore gets a fresh, later number.
- Auto ticks (0-pool rule) never get a number; they revert first, exactly as before, in `updateCheckboxes`.
- Trim lives in `updateCheckboxes`, in the `minionsToKill > 0` branch, after the auto revert and before the enable/disable pass: checked boxes sorted ascending by `tick` (stable, so unnumbered ties keep DOM order), `slice(minionsToKill)` unticked and zeroed. The existing `selectedCount >= minionsToKill` rule then locks the unticked boxes.
- `tick` is also zeroed in the `minionsToKill <= 0` clear branch and in Reset.
- Draft path (`updateActionButton`): the final branch predicts `min(user ticks, minionsToKill)`.
- Every state-changing path (typing/commit, stepper +/-, Apply Damage row, Reset) goes through `refresh()` -> `updateCheckboxes()` before `updateActionButton()`; the change/name-click handlers call `updateCheckboxes()` first too. Apply kills `checked` boxes, which are exactly the post-trim ones.

## Tests added (matrix file, describe `SC-567: fewer owed kills than ticks trims the latest picks`)
1. 2 owed, tick #1 then #2, drop to 1: #2 off, #1 on, Apply enabled, label "Deal 4 damage, kill 1 minion(s)", no title, info line.
2. Tick order not row order: #4 then #1, drop to 1 -> #4 stays.
3. Name click is a pick; re-tick after untick is the latest pick.
4. 3 owed, 3 ticked (#3, #1, #5), drop to 1 -> only #3 stays.
5. Apply Damage row + stepper trim the same way.
6. Draft: typed (uncommitted) 16 already shows the post-commit Apply state (enabled, label, no title); commit leaves it identical; boxes re-derive only at commit.
7. Raising owed kills again does not re-tick the trimmed box.
8. 0-pool auto ticks revert first, then the user's two ticks trimmed to 1.
9. 0-pool round trip with fewer user ticks than owed: exactly the user's tick comes back (passes before the fix too; regression guard).
10. Apply after a trim kills #1 (earlier pick) only, pool 16, persisted once.
11. Reset clears the pick order.
- Flipped `test.failing` SC-567 to a plain `test` (assertion kept), moved into the new describe, comment updated to say trim was chosen.
- Verified: with the src change stashed, 11 of the matrix tests fail (all but #9); with it, matrix + original pool suite 180/180.
- e2e: `[POOL-K06]` in `pool-apply-kills.e2e.ts` drives the repro in real Obsidian (type 12, tick #1 #2, type 16, boxes `o----`, Apply enabled with no title, Apply writes Goblin #1 dead only). No manifest/coverage change; 163/163 pairs.
- No known-bug marker for SC-567 existed in e2e.

## Drive-by fixes:
none.

## Follow-ups:
- Fresh worktrees have no `node_modules`; `npm ci` was needed (ran it, ~1 call). Not in the brief; consider noting in `just wt-new` / dse-verify.
- Jest full run flaked `twin-reuse.test.ts` SC-547 on a 5000 ms timeout under load (SC-568, known); green alone.

## Evidence artifacts (scratch dir)
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-impl-r1/`: `tsc.log`, `lint.log`, `jest-full.log`, `jest-twin.log`, `jest-matrix.log`, `jest-matrix-nofix.log`, `lc1.log`..`lc5.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`.
