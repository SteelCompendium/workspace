# SC-567 decisions ledger — pool modal: surplus ticks leave Apply disabled

Worktree: /home/scott/code/steelCompendium/worktrees/sc567-pool-modal-overticked-apply
(branch `sc567-pool-modal-overticked-apply` in every submodule). Cut from dse develop
`b4e7b4f4`, workspace main `6ee927e0`.

## Ticket (filed 2026-11-10 by the SC-435 owner, Low, DSE 7.0.0)

Repro: squad pool 20 (5 minions x 4). Type 12 (2 kills owed), tick Goblin #1 and #2. Type 16
(1 kill owed). Both boxes stay ticked, Apply disabled, tooltip and info line both say
"Select 1 minion(s) to kill" although 2 are selected. At 0 owed the ticks clear; at 1 they
do not.

Ticket text: "**Needs a choice when fixed:** either trim the surplus ticks automatically (as
already happens at 0), or keep them and reword the tooltip to "Untick 1 minion". Either is
fine for the test; it only checks that the modal never shows a disabled Apply asking for
fewer kills than are ticked."

## Scott rulings

(none yet)

## Owner decisions

- 2026-11-11 (owner): **Trim, not reword.** Reasons: the modal already enforces "never more
  ticks than owed kills" everywhere else — unticked boxes disable once the count reaches the
  owed kills (`updateCheckboxes`), and at 0 owed every tick clears. The over-ticked state is
  reachable only by lowering the damage after ticking, so trimming restores the modal's own
  invariant and adds no new wording. Not escalated to Scott: no new copy, no new look; the
  closing comment states the behaviour so he can overrule.
- 2026-11-11 (owner): **Which ticks go:** the most recently ticked boxes are unticked first
  (undo the last pick); the user's earlier picks stay. Boxes the modal ticked itself (the
  0-pool auto ticks, `item.auto`) are reverted first exactly as today, before the trim.
- 2026-11-11 (owner): The SC-430 draft-prediction path in `updateActionButton` must predict
  the trim too (count = min(user ticks, owed kills)), so Apply's state while typing matches
  the post-commit state.
- 2026-11-11 (owner): Out of scope — SC-573 (pool 0 with a minion alive leaves Apply
  disabled; same enable logic), SC-574, SC-592, SC-591. Do not fold.

## Rounds

- 2026-11-11 r1: implementer (Sonnet) dispatched on `sc567-brief-impl-r1.md`. Ticket -> Awaiting.
- 2026-11-11 r1 done: implementer DONE at dse `dee48526` (`24c3bb51` fix+11 jest tests, `dee48526` e2e POOL-K06). jest 7098/2 skipped (twin-reuse SC-547 timeout under load, green alone), lifecycle 53/53, e2e 256/263 ok 0 failed 7 known-bug 163/163, shots 592, freeze 280/280, parity 0/0/24. Follow-up "fresh worktree needs npm ci" -> dropped (known worktree setup step, not a defect).
- 2026-11-11 review r1: reviewer (Opus) dispatched on `sc567-brief-review-r1.md` at `dee48526`.
- 2026-11-11 review r1 done: LAND, H0/M1/L2/I3 at `dee48526`. Owner rulings:
  - MEDIUM-1 (no CHANGELOG `[FIX]` bullet) -> fold into fix r2.
  - LOW-1 (POOL-K06 ticks in row order, cannot tell LIFO from bottom-row trim) -> fold: tick nth 1 then nth 0, expect `-o---`, Goblin #2 dead.
  - LOW-2 (matrix test :598 mis-indented) -> fold.
  - INFO-1 (draft label "kill 1" while 2 boxes still ticked) -> drop: by design (ledger decision 3; Apply commits and trims first).
  - INFO-2 (unreachable sort tie-break src:561-570) -> drop: harmless defensive code.
  - INFO-3 (no tick-order leak across opens) -> no action.
- 2026-11-11 fix r2: implementer resumed with MEDIUM-1, LOW-1, LOW-2.
- 2026-11-11 fix r2 done: `edd16374` (CHANGELOG bullet, POOL-K06 out-of-row-order ticks + roster checks, reindent; no src). jest 7097 + 2 load timeouts green on rerun (78/78), e2e 256/263 ok 0 failed 7 known-bug 163/163.
- 2026-11-11 re-review r2: reviewer resumed on delta `dee48526..edd16374`.
- 2026-11-11 re-review r2 done: LAND at `edd16374`, H0/M0/L0/I2 (mutant probe: bottom-row trim fails K06 + 3 matrix tests). INFO-r2-1 (K06 can't catch a top-row trim; matrix test does) -> no action. INFO-r2-2 ("every box ticked" ambiguous) -> fold as r3 CHANGELOG-only one-word edit; owner checks the docs-only diff.
- 2026-11-11 r3 done: `f2889351` CHANGELOG-only (owner verified diff: 1 line). origin/develop still `b4e7b4f4`. Land-ready comment posted. Reported LAND-READY to dispatcher. Ticket stays Awaiting until landed.
- 2026-11-11 DONE: landed by the dispatcher — dse develop `f2889351` (4 commits), workspace main `2ffcf99a` (pointer bump `0259c619`), bookkeeping `ff94c481`; ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc567-pool-modal-overticked-apply/`; worktree removed. SC-567 -> Done.
