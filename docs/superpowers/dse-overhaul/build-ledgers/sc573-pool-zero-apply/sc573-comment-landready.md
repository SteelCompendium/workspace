A squad whose pool is at 0 with minions still alive can now record their deaths: the pool modal opens with Apply enabled, reading "Kill 5 minion(s)".

{{IMG:sc573-pool0-nothing-staged.png}}

The screenshot is the fixed modal in Obsidian, with nothing staged. The pool is 0 of 20, and all five goblins are still alive and ticked. The modal ticks them itself and locks them. The new line under the damage row reads "The pool is at 0, so 5 minion(s) die." The Apply button at the bottom right reads "Kill 5 minion(s)" and is enabled. Clicking it marks the five goblins dead and leaves the pool at 0.

**Two wording choices I made. Tell me if you want different words:**

- The button reads "Kill N minion(s)" whenever the pool can lose no more damage. Before this, damage staged on an empty pool already enabled the button, but it read "Deal 0 damage, kill 5 minion(s)".
- The info line reads "The pool is at 0, so N minion(s) die." Before this, the line was hidden when nothing was staged.

**Why the fix is in the modal and not in the captain rule:** in Draw Steel, a pool at 0 means every minion in the squad is dead. A pool can reach 0 with minions alive in more than one way: relieving the captain (SC-421) or editing the pool by hand. Fixing the modal covers both. Whether relieving a captain should kill the excess minion stays SC-421's open question for you.

A pool hand-edited below 0 now behaves exactly like a pool at 0, and Apply writes it back as 0. Before this, pressing + then − on a pool of -3 left the modal stuck: the label read "Heal 3 stamina" and Apply was disabled with no reason.

Nothing else changes. A pool above 0 behaves exactly as before. Heals behave as before. A squad with no living minions still shows "No Stamina Change".

---

Mechanics: dse branch `sc573-pool-zero-apply` @ `6c7216e8` on develop `eaa8742a`. Changes are in `src/views/MinionStaminaPoolModal.ts` (`currentPool()`, `poolNumbers()` and `emptyPoolKills`), 14 jsdom tests, e2e step POOL-K07 with a new fixture `e2e/vaults/shipped/Initiative/squad-empty.md`, and a CHANGELOG bullet. The SC-435 `test.failing` marker is now a plain test.

Gates: tsc and lint clean · jest 7191 passed / 1 skipped · lifecycle 54/54 · e2e `259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` · shots 592 · freeze 280/280 · parity 0/0/24. An independent reviewer passed it twice: the full branch (LAND, one pre-existing LOW, folded in) and then the fix delta (LAND, 0 findings needing action). Its probe grid compared 2438 modal states against develop: none differ on a pool above 0.
