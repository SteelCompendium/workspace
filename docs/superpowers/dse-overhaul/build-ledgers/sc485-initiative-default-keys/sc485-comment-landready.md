Fixed: clicking in an initiative tracker no longer adds keys you never wrote. Toggling a hero's turn on the ticket's repro block now adds only `has_taken_turn: true`, instead of 19 extra lines (`isHero`, `conditions: []`, `current_stamina`, `temp_stamina`, `instances`, `is_squad`, `malice` and the rest).

Nothing for you to decide. One visible change you should know about:

**A combatant written as just a statblock keeps following that statblock.** Before, the first click copied the statblock's name, max Stamina, image and captain setting into the block, so later edits to the statblock stopped showing in the tracker. Now those values stay out of the note, as the ticket's "Expected" says for any value you never wrote. One edge case: if a creature's damaged Stamina has been written and you then lower its statblock's max, the tracker can show Stamina above max (for example 75/60).

What else changed in what gets written:

- `isHero` is left out unless you wrote it. Nothing reads it from the note; the tracker knows heroes from the `heroes:` list.
- A creature's `instances:` list appears in the note the first time one of its creatures changes, written whole. It is removed again if every creature returns to its starting values.
- A minion squad's shared Stamina pool is always written together with its captain-bonus values. Writing the pool alone made a reopened note show the wrong pool (for example 12/12 instead of 12/18). The review found that the old test suite could not catch this, so there are now tests for it.
- A block where you wrote every key out by hand is saved byte-for-byte as before. The only difference is that `isHero` is no longer added.

Filed along the way, not part of this fix: SC-500 (three initiative buttons the e2e tests cannot track for coverage) and SC-503 (selecting a creature in the roster writes `selectedInstanceKey` into the note — should that persist?).

---

Mechanics:

- Branch `sc485-initiative-default-keys`. dse `d0b0d08` on develop `2c61511`, superproject `a895c02` on main `2ba04a6` (CHANGELOG bullet).
- Files: `src/elements/initiative/model.ts` (per-object record of the keys each hero/group/creature/instance left out; the snapshot is taken after statblock lookup too), `resolveRefs.ts` (one call), an additive export in `src/elements/shared/undeclaredDefaults.ts` (SC-482's helper). New jest file `test/dom/elements/initiative-default-keys.test.ts`, e2e spec `e2e/specs/initiative/default-keys.e2e.ts` (INIT-DEF-E01..E04, exact note checks) with the fixture `Initiative/full.md`.
- Independent review: 3051 byte-check cases, all match the contract; a fully written block gives the same bytes as before; 20/20 deliberate code breakages caught by tests; 4 real-Obsidian probes pass, and 3 of them fail on the old code.
- Gates on the landed base: tsc and lint clean · jest 5825 passed / 1 skipped / 240 of 241 suites · lifecycle 33/33 · e2e 108/108 ok, 0 failed, 0 known-bug, coverage 69/69 (run 20261023-143658-0546) · shots 592, ran to the end (host-copy pin OK on 1.15.0, both host-leak and text-scale checks OK) · freeze 280/280, no rebaseline · parity 0 gaps / 0 undeclared / 24 declared.
