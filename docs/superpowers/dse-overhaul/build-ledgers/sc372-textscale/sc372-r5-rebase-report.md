# SC-372 r5 rebase report

## Executive summary
- Verdict: DONE. Rebased onto origin/develop **e9502a8** (SC-390); one CHANGELOG conflict, both entries kept; `npm ci` run (package.json changed).
- dse branch `sc372-textscale` @ **aebc0a9**. Superproject docs commit **51e5d8d** (D3-token-map; not rebased, submodule pointer not bumped).
- Folds done: INFO-1 (tokens.ts count), INFO-2 (CHANGELOG describes only the user-visible change, "scales once, not twice" dropped), INFO-3 (font-sizes.md says the sweep cannot catch inert text), plus the addendum (Large help text now "card names, band titles, ability keyword and action chips and display stat numbers"; CHANGELOG uses the same wording).
- Gates: tsc clean; lint clean; jest 4508 passed / 1 skipped / 223 of 224 suites (base e9502a8 = 4501, derived: branch adds 7 tests); lifecycle 25/25; shots 572 PNGs, 0 FAIL, `text scale OK (1146)`, `text scale once OK (102969 comparisons over 199 loads)`; freeze `OK (276/276)`; parity 0 GAPs / 0 undeclared / 24 DECLARED (last).
- Frozen bytes moved: NO. After the addendum edit (catalog.ts, CHANGELOG, settings.md) jest, lifecycle, shots, freeze and parity were all re-run on the final tree.

## Commits (on e9502a8)
6cab8b7 tokens.ts count; 65f6d02 CHANGELOG + font-sizes; aebc0a9 addendum (catalog help text, CHANGELOG, docs/settings.md).

## Drive-by fixes:
- `docs/settings.md` "Large text size" bullet now uses the same list as the help text (same subject, user-facing docs; one sentence).

## Follow-ups:
none.
