# SC-577 R3 fix report

Executive summary
- STATUS: DONE. Folded O6, O7, MEDIUM-1, LOW-1, LOW-2, INFO-6. Rebased onto origin/develop f2889351 (package.json unchanged, no npm ci). Not pushed.
- dse head 93b3a382 (cf6535c2 code+tests, 93b3a382 plugin CHANGELOG + docs; R1 commits 4648603d, f9491da3, 49271a6b below). Superproject cb5d5691 (CHANGELOG only; the dse pointer stays modified).
- Gates on the rebased head: tsc 0, lint 0, jest 7107 passed / 1 skipped (expected 7098+1+8 new), lifecycle 53/53 (21+16+9+4+3), e2e 258/264 ok, 0 failed, 6 known-bug, 164/164, shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24. All first runs, no flakes this round.

## Changes
- model.ts: new `maliceValueOf(malice)` (max(0, stored)) and `addToMalicePool(malice, amount)` (max(0, maliceValueOf + amount)); `advanceRound` and the view's quick-add both call the helper; parse unchanged (O2). Log entries unchanged (SC-578).
- view.ts: read-only branch renders `maliceValueOf(...)` (LOW-1).
- jest: new describe "Malice never goes below 0 (SC-577)" holds [M07], [R01] plus new rows (read-only -2 shows 0 like the stepper; -2 + gain 3 writes 3 via Advance; -2 + quick-add 3 writes 3); the old describe is retitled "known bugs: the quick-add (SC-578, SC-588, SC-589)" (O7; M09/M10/M04 keep their markers). LOW-2: label row [-3, 'Advance round (-3 Malice)'], advance rows [1,-2,2,1,1] and [1,-5,2,0,1].
- unit: economy-serialize.test.ts, stored -2 + gain 3 -> 3 and helper agreement (log amount unchanged).
- draw-steel-elements/CHANGELOG.md [FIX] bullet at the top of 7.0.0 (MEDIUM-1); docs/initiative-tracker.md one sentence in each place (INFO-6); superproject CHANGELOG bullet mentions "counts as 0".
- No e2e added this round.

## Evidence
Logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-impl-r1-main/ : r3-tsc, r3-lint, r3-jest, r3lc1-5, r3-e2e, r3-shots, r3-freeze, r3-parity (.log + .rc).

Drive-by fixes: none.
Follow-ups: none new.
