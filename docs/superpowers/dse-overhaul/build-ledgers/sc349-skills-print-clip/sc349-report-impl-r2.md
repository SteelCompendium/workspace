# SC-349 implementer report, fix round 1 (r2)

## Executive summary
- Verdict: DONE. Head `acbacbd` (one commit on `d34b0fe`); `origin/develop` is still `0ce76dd`. Not pushed. Tree clean.
- Zero PNG bytes moved: two shots runs on `acbacbd`, all 572 sha256s equal to the proofA run on `d34b0fe` and to each other. `rebaseline.txt` (40 lines) and `rebaseline-skills-only.txt` (8) stand unchanged.
- HIGH-1: the gallery is now a named exemption (`CLIP_EXEMPTIONS`, reason + SC-484) printed by the OK line; the gate no longer claims it is whole.
- MED-1: the shot-time check is independent of the growth measurement (`#mount` rect: `top >= 0`, `bottom <= innerHeight`; for fullPage shots, no scrolling ancestor hiding overflow).
- LOW-1: wording and counts fixed (139 screen-media + 41 print-media precaution, "reached below the viewport").
- INFO: top crops for the 3 ids in the ledger dir.
- Gates: tsc/lint clean; jest 5417 passed / 1 skipped / 232 of 233; shots 572, 0 FAIL, both gate lines present; freeze exactly the 40 lines FAILED, applied-copy rc 0; parity 0/0/24. Lifecycle and e2e skipped: the diff is inside `visual-harness/` and `test/unit/build/` only.

## Changes (commit `acbacbd`)
- `visual-harness/capture-viewport.mjs`: `captureClipProblems` now takes `{viewportHeight, mountTop, mountBottom, fullPage, hiddenOverflow, layoutBefore, layoutAfter}`. It fails on `mountBottom > viewportHeight + 0.5`, on `mountTop < -0.5`, on `hiddenOverflow` entries for a fullPage shot, and on a layout-fingerprint change. The message no longer says blank for print media.
- `visual-harness/shoot.mjs`: new in-page `measureShotVisibility()` (mount's raw viewport rect, innerHeight, ancestors with `overflow-y` != visible and `scrollHeight - clientHeight - scrollTop > 1`), run after the screenshot, independent of `measureCaptureBottoms` (which still only decides the growth). `CLIP_EXEMPTIONS = { gallery: … SC-484 }`: a gallery capture is recorded in `exemptCaptures` and not checked. The OK line splits the count into screen-media captures that reached below the viewport and print-media captures grown as a precaution, and ends with `NOT covered — named exemption(s): gallery--steel-dark.png (…); gallery--steel-light.png (…)`.
- `test/unit/build/captureViewport.test.ts`: gate tests rewritten for the new signature, +1 test (9 total): inside, bottom below, top above, hidden-overflow scroller for a fullPage shot (ignored for an element shot), layout change.

## Measured
- Shots runs (rc 0 both, 0 FAIL, 572 PNGs): `proofB-run1.sha256` == `proofB-run2.sha256` == `proofA-run1.sha256` (cmp). 
- Gate line (literal start): `capture clip OK (139 screen-media capture(s) whose element reached below the viewport were shot with it grown to cover them and then restored; 41 print-media capture(s) were grown the same way as a precaution — print media is never clipped, their bytes do not move; every other capture, and every grown one, was checked at shot time to have #mount's whole box inside the viewport, and growing it moved no layout. NOT covered — named exemption(s): gallery--steel-dark.png (every element family in one ~25,000 CSS px page … (SC-484)); gallery--steel-light.png (…))`. The new gate flagged nothing else in 572 captures (no false positive on hover/click/scroll shots, realprint or fullPage modal shots).
- Gate bite proof (untracked scratch copy `visual-harness/shoot-r2bite.mjs`, deleted afterwards, never committed): growth disabled for `skills-hero-picks--steel-dark` and `node … --element=skills` fails with `CAPTURE CLIPPED — 1 problem(s) … skills-hero-picks--steel-dark: its element reaches 2028px but the viewport is 1200px tall …`, exit 1 (log `r2-bite.log`). First attempt disabling growth on `skills--steel-print` was caught earlier by the older `assertPrintTwinDelta` (32 px vertical drift twin vs realprint), so I used a non-print id to exercise this gate.
- Exemption reporting: confirmed in the full-run OK line above.
- freeze (`check-freeze.sh` on the proofB run2 shots): `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`; the failed names equal the 40 names of `rebaseline.txt` (diff empty); scratch baseline copy with `rebaseline.txt` applied: `sha256sum -c` rc 0.
- tsc rc 0; lint rc 0; jest `Test Suites: 1 skipped, 232 passed, 232 of 233 total`, `Tests: 1 skipped, 5417 passed, 5418 total`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0.

## Top crops (INFO), ledger dir
`sc349-r2-chrome-hover-statblock-steel-print-top-{before,after}.png` (rows 0-900), `sc349-r2-chrome-skills-menu-steel-print-top-{before,after}.png` (rows 0-900), `sc349-r2-montage-guide-open-steel-print-top-{before,after}.png` (rows 0-1700: the base is blank down to its first content row ~1369; after shows the header and test tiers). Before = base run `aaa88b7`, after = proofB (byte-equal to proofA). Visually checked chrome-hover-statblock: base has a blank band above the card, after shows it painted.

## Artifacts
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`: this report, the 6 r2 crops, unchanged `rebaseline.txt`, `rebaseline-skills-only.txt`, `sc349-clipped-list.txt`.
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r1/`: `proofB-run{1,2}.log`, `proofB-run{1,2}.sha256`, `proofB-run{1,2}-shots/`, `r2-bite.log`, `r2-subset.log`, `r2-jest.log`, `r2-tsc.log`, `r2-lint.log`, `r2-parity.log`.

Drive-by fixes: none.
Follow-ups: the exemption text prints the gallery reason once per gallery file (two copies on the OK line); cosmetic, left alone to avoid a third shots proof. Gallery coverage itself is SC-484 (out of scope).
