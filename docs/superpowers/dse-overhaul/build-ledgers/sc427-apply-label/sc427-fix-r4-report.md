# SC-427 fix round 4 report

**Executive summary**
- STATUS: DONE. DSE head `d58cf6a`, rebased onto `origin/develop` `6bcf9c8`; superproject head `ec016a0`, rebased onto `origin/main` `724c7a1`. Full battery re-run at `d58cf6a` on `6bcf9c8`.
- R3-F5 folded: one helper `appliedStaminaChange(raw)` (`clampStamina(current + raw) - current`, 0 for a zero raw change) now feeds the Apply label, its disabled state, the legacy track and the Steel gauge's pending value in `updateBar`. No second copy of the math.
- Honest finding: the Steel gauge already clamped inside `staminaGaugeGeometry` (pour/wound are min/max-clamped), so its rendering was already right (gauge vars are identical before and after). The unclamped input only showed in the legacy `.dse-stamina__fill/__delta` track (fill 110% / delta 15% for 25/20 Damage 3). No shot, freeze or parity movement.
- Tests: 3 `[M1b]` rows (25/20 Damage 3; hero -14/20 Healing 2; in-range identity). Fail-before: the 2 out-of-range rows fail on r3 src (2 failed / 277 passed), all pass after.
- Rebase: only conflicts were CHANGELOG.md (kept both sides, SC-453 bullet first, in both repos). No conflict in StaminaEditModal or host code.
- Gates at `d58cf6a`: tsc/lint rc 0; jest 4950 passed / 1 skipped / 229 of 230; lifecycle 26/26; e2e 71/76 ok, 0 failed, 5 known-bug, 51/51; shots 572, 0 FAIL, pressed toggle parity OK; freeze 276/276; parity 0/0/24.

## Change
`src/views/StaminaEditModal.ts`: added `private appliedStaminaChange(raw)`; `updateBar` uses it for the legacy fill/delta/kind and the gauge's pending `current`; `updateActionButton` uses it for the label and disabled state (replacing the inline r3 expression). The draft path is unaffected (`updateBar` only runs from `refresh()`, when drafts are null).

## Tests (`test/dom/views/stamina-edit-modal-matrix.test.ts`, `[M1b]`)
- Out-of-range rows compare the pending modal against a second modal opened at the persisted value: where the legacy track ends (fill, plus the delta for a heal) equals the reference fill; band width equals the clamped change (25 for 25/20 Damage 3, 4/30*100 for hero -14/20 Healing 2); gauge `--dse-pour-w`, `--dse-wound-w`, `--dse-cap-x` equal the reference gauge's.
- In-range identity: 10/20 Damage 3 -> fill 35, delta 15.
- Fail-before (r3 src stashed): `Tests: 2 failed, 277 passed, 279 total` (the two out-of-range rows, on the legacy-track assertions; the gauge-var assertions already held); fixed 279/279. Logs: `evidence/r4-prefix-jest.log`, `evidence/r4-focused.log` (both run on base c616e22, before the rebase).

## Rebase
- DSE: `git rebase origin/develop` (6bcf9c8; SC-453). One CHANGELOG conflict (SC-453's CRLF bullet vs SC-427's), resolved keeping both, SC-453 first. All later commits applied clean.
- Superproject: `git rebase origin/main` (724c7a1). CHANGELOG conflict resolved keeping both, SC-453 bullet first; added a spacing commit (`ec016a0`). `draw-steel-elements` is checked out at its branch head `d58cf6a`.
- DSE commits since base: b3106b9, cbc6111, 1c67a01, 6d8a7b7, efbbe9b, f82b7d0, d58cf6a.

## Gates (DSE `d58cf6a`, base `6bcf9c8`)
- tsc (incl. `tsc -p e2e`) rc 0; lint rc 0.
- jest: `Tests: 1 skipped, 4950 passed, 4951 total`; `Test Suites: 1 skipped, 229 passed, 229 of 230`; rc 0.
- lifecycle (port 9291): `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`, rc 0.
- e2e: `OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`, rc 0.
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (96 comparisons ...)`, host-copy pin OK, button host-leak OK (112 kinds, 672), rc 0.
- freeze: `freeze OK (276/276 ...)`, rc 0. parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Drive-by fixes
None. CHANGELOG: no wording change needed for R3-F5 (the visible gauge is unchanged; the legacy track is not the visible instrument).

## Follow-ups
- The legacy `.dse-stamina__fill/__delta` track still draws the STORED position unclamped for a stored value past the bounds (e.g. fill 125% at stored 25/20, before any pending change). Pre-existing, not part of this ticket; the Steel gauge clamps correctly.

## Artifacts
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/evidence/r4-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log|.rc`, `r4-prefix-jest.log|.rc`, `r4-focused.log|.rc`. Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc427-apply-label/sc427-fix-r4-report.md`.
