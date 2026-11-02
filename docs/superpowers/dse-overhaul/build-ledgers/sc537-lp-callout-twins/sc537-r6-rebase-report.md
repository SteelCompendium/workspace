# SC-537 r6 rebase report

1. Plugin `dabfb518` on `sc537-lp-callout-twins`, rebased onto origin/develop `97284051` (SC-530, harness only); 0 conflicts. Superproject `c23f0512` (CHANGELOG only, no pointer bump), rebased onto origin/main `d807b78e`; 0 conflicts.
2. r5 INFO-2: `visual-harness/obsidian-lifecycle.mjs` lines 103 (G-S57) and 111 (G-S52) now say "46 scenarios in all" (comment only, commit `dabfb518`). Note: line 111 is SC-522's G-S52 header, which was true as "45" when it landed; changed because it was asked for.
3. Gates on `dabfb518`: tsc / `tsc -p e2e` / lint clean; jest 6262 passed / 1 skipped / 249 of 250 suites; shots 592, 0 FAIL, button host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] (foreground call moved to the background at 600 s; rc line read from its own log); freeze 280/280, no rebaseline; parity 0 gaps / 0 undeclared / 24 declared. Lifecycle and e2e not re-run (no src or scenario change).

## Artifacts (under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/`)
- `sc537-r6-rebase-report.md`
- `sc537-r6-gate-tsc-lint.log`, `sc537-r6-gate-jest.log`, `sc537-r6-gate-shots.log`, `sc537-r6-gate-freeze.log`, `sc537-r6-gate-parity.log`
