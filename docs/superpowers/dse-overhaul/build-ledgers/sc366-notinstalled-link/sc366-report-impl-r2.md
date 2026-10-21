# SC-366 implementer report, round 2

## Executive summary
- Verdict: DONE. New commit `ba20072` on dse branch `sc366-notinstalled-link` (parent 365b08b). Not pushed. No trailers.
- LOW-1 folded: selectors are now `[steel]:not([print]) a.dse-ref-web-card__link` and `... a.dse-ref-web-card__link:hover` (styles-source.css lines 8901 and 8909), matching the family's (0,3,1) / (0,4,1) specificity.
- Pin added: `test/dom/theme/notInstalledLinkColour.test.ts` (3 tests: block present; rest rule carries the selector; `:hover` rule carries it; each under the steel / not-print gate with `color: var(--dse-accent);`).
- Bite proof: with the selector removed from both rules the 2 behaviour tests fail (3 total, 2 failed, 1 passed); restored with `cmp` byte-identical to the committed r2 state. (The test also failed 2/3 against the r1 selector form `.dse-ref-web-card__link`.)
- Gates: tsc + lint clean; jest 5260 passed / 1 skipped / 230 of 231 suites (5257 + 3); lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572 PNGs, 0 FAIL; freeze OK 276/276; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Visual unchanged vs r1: computed link colour dark rgb(77,184,199) teal-cyan accent, light rgb(42,123,136) darker teal-cyan accent, hover same, print UA blue rgb(0,0,238); r2 crops byte-identical to r1 after crops.

## Details
- Diff vs 365b08b: 2 selector lines in styles-source.css (`.dse-ref-web-card__link` -> `a.dse-ref-web-card__link`, base and `:hover`) + new test file. Nothing else touched (no stale-line comments, no fixture; SC-469 not built).
- Test design: reads styles-source.css, bounds the SC-10 in-card link-colour family block (comment banner "In-card link color (SC-10 Task 1" to "Plan 24 / SC-100 Task 3"), strips comments, flattens whitespace, finds the single rule whose selector list contains `<gate> .dse-card a` (or `:hover`), asserts it declares `color: var(--dse-accent);` and lists `<gate> a.dse-ref-web-card__link[:hover]`.
- Bite proof detail: copied styles-source.css, deleted the new selector from both rules, ran the test (log sc366-r2-gate-bite.log: 2 failed, 1 passed), restored the copy; `cmp` against the pre-removal copy = identical (REVERT_BYTE_CLEAN).

Artifacts (dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/): sc366-report-impl-r2.md, sc366-r2-gate-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity,bite}.log, sc366-r2-after-{dark,light}{,-hover,-print}.png, sc366-r2-after-computed.json.

Drive-by fixes: none. Follow-ups: none new.
