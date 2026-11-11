When you lower the damage after ticking minions, the minion pool window now unticks the extra boxes, starting with the one you ticked last, so Apply is ready again. This fix is ready to land. Nothing is waiting on you.

**The choice I made.** The ticket offered two fixes: untick the extra boxes, or keep them and change the tooltip to "Untick 1 minion". I chose to untick them. The window already never lets you tick more boxes than the damage kills: once the count is reached, the other boxes are locked, and when no kills are owed every tick clears. The only way into the stuck state was lowering the damage after ticking. Unticking keeps that rule and adds no new wording.

Your earlier picks stay ticked. If you raise the damage again afterwards, the unticked box is not ticked back for you.

If you'd rather keep the ticks and change the wording instead, say so and I'll swap it.

**The ticket's repro now behaves.** On a squad with a pool of 20 (five minions at 4 each), set the pool to 12 (two kills owed) and tick Goblin #2, then Goblin #1. Then set the pool to 16 (one kill owed). Goblin #1 is unticked, Goblin #2 stays ticked, and Apply is enabled and reads "Deal 4 damage, kill 1 minion(s)". Applying it marks Goblin #2 dead and leaves Goblin #1 alive.

**Checks.**
- An independent review found nothing blocking. Its three small items (a changelog entry, a stricter end-to-end test, one indent) are fixed.
- Two new kinds of test pin the behaviour: 11 automated tests, and an end-to-end test in real Obsidian (POOL-K06). The test that was marked as a known failure for this bug now passes as a normal one.
- SC-573 and SC-574, the other known problems in this window, are unchanged and still open.

Mechanics: draw-steel-elements branch `sc567-pool-modal-overticked-apply` @ `f2889351` (on develop `b4e7b4f4`). Changes are in `src/views/MinionStaminaPoolModal.ts`, the jsdom matrix test, `e2e/specs/minion-pool/pool-apply-kills.e2e.ts` and `CHANGELOG.md`. Gates:
- jest 7098 passed (two tests time out under full load and pass when re-run).
- lifecycle 53/53.
- e2e 256/263 ok, 0 failed, 7 known-bug, coverage 163/163 pairs.
- shots 592, freeze 280/280 unchanged, parity 0/0/24.
