# SC-650 r5 fix report

## Summary
- STATUS DONE. dse head `1bceaabf` on origin/develop `a9f0af1d` (unchanged, no rebase). Not pushed; superproject untouched.
- LOW-A `a616b1a9`: `HANDOFF_FALLBACK_MS` and its timer are gone. `WindowSlot.before` (the pane's live roots at open). In `attempt()`, when `find()` is null and the root count changed, a root of the same note that is NOT in `before` and whose content differs from the closing view's gets the Notice once (`noticed`), unclaimed; the watch goes on for focus until the TTL. Untouched neighbour = no news (own save silent); a card arriving after 400 ms is noticed.
- LOW-B: jest OW18b (literal 700 ms), OW18c (differing neighbour, literals), OW18d (slow delete-above: nothing, then ONE Notice, none on later page changes), OW18e (slow own save: no Notice), OW18f (delete-above, block unchanged: no Notice), OW18g (same count, slot holds another note: no Notice); initiative O20b with literal time. All times literal.
- Mutants all red: G2 no count check (OW18g), G3 no once guard (O20b, OW18b, OW18d), G4 no content check (OW18f), G5 ignore `before` (OW18c, OW18e), G6 no sourcePath check (OW18f), G7 fallback removed (O20b, OW18b, OW18d). F1 (instant fallback) no longer exists: there is no timer.
- Gates: tsc/lint rc0; jest 13392 passed / 1 skipped (13388 + 4); e2e `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; lifecycle part 4 4/4, part 7 3/3. Shots/freeze/parity not run (no CSS/DOM).

## Notes
- Accepted side effect per ruling: no Notice when the edit deleted the window's own block while another montage remains (the neighbour was there before). No multi-block OW16 expectation had been added.
- A limit of the design: if a DIFFERENT, redrawn block of the same note arrives first (a Sync that changed both blocks) and the window's own card is not yet there, the Notice shows from that block. An outside edit did happen, so the Notice is true; the first attempt at OW18g exposed it.
- Docs: `.repo-docs/architecture.md` windowHandoff row updated (`1bceaabf`).

## Logs (scratchpad/sc650-r1-impl/)
r5-tsc.log, r5-lint.log, r5-jest.log, e2e-r5.log, life-r5-part4.log, life-r5-part7.log, jest1.log, mut-G2-no-count-check.log, mut-G3-no-once-guard.log, mut-G4-no-content-check.log, mut-G5-ignore-before.log, mut-G6-no-sourcepath.log, mut-G7-no-fallback-at-all.log
