Malice in the initiative tracker no longer goes below 0. The − button greys out at 0, a negative round gain stops at 0, and the round button reads "Advance round (-3 Malice)" instead of "(+-3 Malice)". Nothing for you to decide; this is ready to land.

**What changed for a user**

- − on Malice is disabled at 0 (it was writing `value: -1`).
- A negative `round_gain` still subtracts at the start of a round, but the pool stops at 0. From 1 with a gain of -3, Malice becomes 0.
- A hand-edited negative value (say `value: -2`) shows as 0 and counts as 0: + makes it 1, Advance round with a gain of 3 makes it 3. The file is not rewritten until Malice changes.
- The read-only tracker (embeds, hosts that cannot save) shows the same 0.

This matches the quick-add box, which already stopped at 0.

**Left for SC-578.** When the pool stops at 0, the log still records the full amount. A gain of -3 from 0 logs "-3 — Round gain" while Malice stays 0, the same as a quick-add of -9 from 2 logs -9 today. Whether the log should record the real change is SC-578's question, and it now covers both paths.

**Mechanics**

- Branch `sc577-malice-negative`: draw-steel-elements `93b3a382` on develop `f2889351`; workspace `cb5d5691` (changelog bullet).
- One helper now does the Malice arithmetic for Advance round and the quick-add (`addToMalicePool` in `src/elements/initiative/model.ts`); the stepper has `min: 0`.
- Gates on `93b3a382`: tsc and lint clean · jest 7107 passed / 1 skipped · lifecycle 53/53 · e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (the SC-577 known-bug marker is gone; one new e2e for the negative round gain) · shots 592 · freeze 280/280 · parity 0/0/24.
- Independent review: no blocking findings in either pass. With each part of the fix removed, the tests that cover it fail.
