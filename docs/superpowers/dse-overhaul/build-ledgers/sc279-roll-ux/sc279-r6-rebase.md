# SC-279 r6 — rebase onto SC-406 + folds

## Executive summary
- DSE head `ae0efd8` on `sc279-roll-ux`, rebased onto `origin/develop` `05a6ff3` (was `f8693b5`). Superproject head `41d9a0f` (DESIGN.md wrap only; superproject was not rebased/bumped).
- Conflicts: exactly one, `CHANGELOG.md` (commit f550721). Resolved by keeping both bullets under `## 7.0.0 (unreleased…)`: SC-406's [BREAKING] legacy-sync bullet first, then the SC-279 [FIX] bullet. `styles-source.css` and `visual-harness/entry.ts` auto-merged cleanly. package.json/lock unchanged (no npm ci).
- Gating: the harness already calls `setExperimental(true)` (entry.ts:103, SC-406), so `roll` and `roll-expanded*` still render the strip; no change needed. Card shots unaffected.
- Gates: tsc clean; lint clean (exit 0); jest 4455 passed / 1 skipped / 218 of 219 suites (SC-406 added 3 suites; ours adds +27 tests vs f8693b5, incl. the new villain test); lifecycle 25/25; shots 580 ok, 0 FAIL (= 568 + 12; two full runs); parity 0 gaps / 0 undeclared / 24 declared.
- Freeze: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `roll--steel-print.png` + `roll--steel-realprint.png` (both runs). Rebaseline CHANGED: NO (hashes identical to `sc279-rebaseline.txt`); the 12 new shots are byte-identical across both runs and to r4's.
- Folds: r5 LOW-1 villain-band test added (proved: fails with `statblock/view.ts` reverted to origin/develop's version, `Expected "false" / Received "true"`; 1 failed / 19 passed); r5 INFO-3 DESIGN.md carve-out wrapped.

## Commits (DSE, post-rebase shas; old r4 shas are gone)
44fd81c feat strip · 5ff1315 harness shots · 7e94726 docs (CHANGELOG conflict) · a0d3fa6 roll.png · fe3b453 comment · 4daf6ab HIGH-1 · 3fc59be LOW-4 · cef769f MED-1/LOW-1..3 · `ae0efd8` test(roll) villain band. Superproject: `41d9a0f`.

## Notes
- The dse-verify SKILL "CURRENT" numbers still describe 9ad919d (SC-406 did not update them), and I did not run a detached base battery (no number looked off: suites 215+3, shots 568+12, freeze/parity unchanged).
- Evidence PNGs from r4 are unchanged in content (shots byte-identical), so `sc279-r4-evidence/` stands.

## Drive-by fixes / Follow-ups
None. SC-410 hit-row fill left untouched as instructed.

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
sc279-r6-{tsc,lint,jest-full,lifecycle,shots1,shots2,freeze1,freeze2,parity,jest-neg}.log (+ .exit), sc279-r6-hash1/2.txt, sc279-r6-new1/2.txt, sc279-rebaseline.txt (unchanged).
