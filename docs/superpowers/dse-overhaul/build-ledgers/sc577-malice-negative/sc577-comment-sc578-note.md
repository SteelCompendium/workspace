Once SC-577 lands, Advance round has the same logging gap as the quick-add: when Malice stops at 0, the log records the full round gain. From 0 with `round_gain: -3`, the log reads "-3 — Round gain" while Malice stays 0.

Whichever way this ticket settles it (log the real change, or mark the entry as capped), it should cover both paths. They now share one helper, `addToMalicePool` in `src/elements/initiative/model.ts`, so the fix can go in one place.
