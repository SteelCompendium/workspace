# SC-372 r6 rebase report

## Executive summary
- Verdict: DONE. Rebased onto origin/develop **1640ed0** (SC-408); dse branch `sc372-textscale` @ **6737031** (12 commits). Superproject docs commit unchanged: 51e5d8d.
- Conflicts: none. git merged CHANGELOG.md, styles-source.css and shoot.mjs automatically. Checked after: the registry CSS block, `assertTextScale` (called at shoot.mjs:5794) and `assertTextScaleOnce` (:5796), the `TEXT_SCALE_*` tables, and the CHANGELOG SC-372 entry all survived. SC-408's `portrait mark parity` gate still runs.
- `npm ci` run (package.json/lockfile changed: SC-408 e2e deps).
- Gates (exit codes read from script-written files): tsc incl. `tsc -p e2e` clean; lint incl. `e2e/` clean; jest 4732 passed / 1 skipped / 227 of 228 suites; lifecycle 25/25; e2e `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`; shots 572, 0 FAIL, `text scale OK (1146)`, `text scale once OK (102969 comparisons over 199 loads)`, `portrait mark parity OK`, `turn mark parity OK`; freeze `OK (276/276)`; parity 0 GAPs / 0 undeclared / 24 DECLARED (last).
- Frozen bytes moved: NO. Working tree clean after the battery.

## Drive-by fixes:
none.
## Follow-ups:
none.
