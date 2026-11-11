# SC-480 r6 fix report (MEDIUM-R5-1, LOW-R5-1)

## Executive summary
- STATUS DONE. Base ended on dse origin/develop fbaba3da (rebased from 97a9c93b; one CHANGELOG conflict with SC-576's bullet, kept both). dse HEAD eeed5182; superproject HEAD 3b280a4c (CHANGELOG only; dse pointer left dirty).
- MEDIUM-R5-1: `landsOnOtherBlock` is now the reviewer's fix3: refuse only when the block that stood at the mapped line in the note as clicked is no longer anywhere in the note (`countByBody(content, lang, other.body) === 0`). Swap and reorder of twin-free blocks land; bumped neighbour, move-into-deleted-neighbour still refused (by design); remaining gap (bumped neighbour's old body elsewhere) documented in a code comment only.
- LOW-R5-1: bumped-neighbour test with a paragraph inserted above the neighbour (back and forward maps disagree); mutant G4 (map forward) now red.
- Red evidence: 4 new jest tests (swap x2 modes, reorder x2 modes) fail on 63492c9a (4 failed / 70 passed); G-S73 swap-solo fails on a 63492c9a bundle (RV + LP only), 18/18 on mine.
- Mutants on the pin suite (74 tests): g4 1 red, g9 (always refuse) 4 red, g10 (never refuse) 3 red; g11 (`!other` -> false) survives (unreachable branch, kept defensive).
- Gates on the final head: tsc/lint rc 0; jest 7074 passed / 2 skipped + 2 SC-568 timeouts (78/78 alone); lifecycle 53/53 (21+16+9+4+3); e2e 251/260 ok, 0 failed, 9 known-bug, 161/161 pairs; styles.css 4295ca33 == clean fbaba3da.
- CHANGELOGs (both): "A note with no identical block behaves as before" now carries the exception "if the same outside edit deleted another block and moved this one into its place, the click is refused with the same Notice".

## Commits (dse on fbaba3da; shas after the rebase)
- 31ec7144 fix(SC-480 r6): the reverse-map guard refuses only when the neighbour as clicked is gone; +5 jest tests (swap x2, reorder x2, move-into-deleted-neighbour refused; bumped neighbour rewritten with a line shift, replacing the r4-era shape that did not reach the guard).
- ffb1f4db test(SC-480 r6): G-S73 swap-solo (RV + LP, leave): lands, no Notice. 18 trials.
- eeed5182 docs(SC-480 r6): dse CHANGELOG. Superproject 3b280a4c: CHANGELOG.
- Earlier branch commits rebased: 56dba234, c4510cc0, e4fe151a, e58473e8, 3a0d5881, b9c8e37d, b5f6f3dd (superproject unchanged: 3efbbc13, 6152e66e, bbfbeade).

## Gate summary lines (final head, base fbaba3da; logs in the ledger dir)
- tsc `npm run tsc` rc=0 (sc480-r6-gate-tsc.log); lint rc=0 (sc480-r6-gate-lint.log).
- jest: `Test Suites: 2 failed, 1 skipped, 258 passed, 260 of 261 total` / `Tests: 2 failed, 2 skipped, 7074 passed, 7078 total` (sc480-r6-gate-jest.log); the 2 are the SC-568 timeouts, alone `Tests: 78 passed, 78 total` (sc480-r6-gate-jest-sc568-alone.log). fbaba3da 7056 + 20 = 7076 non-skipped.
- lifecycle: part1 `21/21 ok` 207 s; part2 `16/16` 349 s; part3 `9/9` 397 s; part4 `4/4` 312 s; part5 `3/3` (`G-S73 ok (18 trials ...)`) 266 s = 53/53 (sc480-r6-gate-lifecycle-part{1..5}.log).
- e2e `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`, rc=0, 342 s (sc480-r6-gate-e2e.log). RECOV-R07 did not fail this time.
- styles.css: mine `4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01` == clean fbaba3da build (same hash); shots/freeze/parity carry, not run.

## Red evidence
- sc480-r6-red-on-63492c9a-jest.log: r4 host source + new tests: `Tests: 4 failed, 70 passed, 74 total` (swap-adjacent and reorder-three, each in "its new place" and "no section" mode).
- sc480-r6-red-on-63492c9a-lifecycle-G-S73.log: 63492c9a bundle: `G-S73 FAIL` on swap-solo (Reading view, leave) and (Live Preview, leave) only, "the + did not land in the clicked block (want [3,6])".
- sc480-r6-lifecycle-G-S73-mine.log: `G-S73 ok (18 trials ...)`.
- Mutation logs in scratch .../sc480-r2-implementer/mut-g4.log, mut-g9.log, mut-g10.log, mut-g11.log.
- Note on the LOW-R5-1 test: the first draft (neighbour pair adjacent, same body lines) made the line diff PLACE the pin on the neighbour (a placed pin, never reaching the guard); the shipped test uses prose-separated blocks (`build`), where the pin misses, and one inserted paragraph above the neighbour so the map back (right) and forward (wrong) disagree.

## Drive-by fixes:
- None.

## Follow-ups:
- None new. Accepted corner cases stay as ruled: bumped neighbour's old body still elsewhere in the note lets the write through (code comment); move-into-deleted-neighbour and replace-neighbour-by-x refused (CHANGELOG names it).
