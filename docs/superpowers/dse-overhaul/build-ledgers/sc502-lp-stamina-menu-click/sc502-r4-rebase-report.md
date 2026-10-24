# SC-502 r4 rebase report

## Executive summary
- STATUS: DONE. dse `c558759` (same 8 commits as r3, content unchanged) on origin/develop `08c086c` (SC-510); superproject `abe934f` (same 3 commits) on origin/main `88390ad`. Not pushed, pointer not bumped.
- Both rebases were clean (no conflicts); package.json unchanged, no `npm ci`. No SC-502 file changed in this round.
- Gates on `c558759`: tsc + lint clean; jest 6105 passed / 1 skipped / 247 of 248 suites; lifecycle 39/39; e2e 124/124, 0 failed, 0 known-bug, coverage 87/87; shots 592, 0 FAIL, button host-leak 114/684; freeze 280/280; parity 0 / 0 / 24 DECLARED.
- All targets met exactly (jest 6099 + 6 = 6105).

## Gate summary lines (logs in the scratch folder, `r4-*`)
- tsc `tsc rc=0` (incl. `tsc -p e2e`); lint `lint rc=0`.
- jest `Tests: 1 skipped, 6105 passed, 6106 total`; `Test Suites: 1 skipped, 247 passed, 247 of 248 total`.
- lifecycle `OBSIDIAN-LIFECYCLE done: 39/39 ok, 0 failed`.
- e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (one full run this round; the 5-consecutive-run flake proof for CHR-L01 is in the r3 report and ran on identical SC-502 code).
- shots 592 PNGs, 0 FAIL; `button host-leak OK (114 button kinds x 3 states x dark/light = 684 comparisons …)`; `modal button host-leak OK (… 38 button kinds … = 228 comparisons …)`.
- freeze `freeze OK (280/280 frozen print PNGs byte-identical …)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## dse-verify G-S44 row text and CURRENT numbers (dispatcher applies at landing; SKILL.md not edited)
`SC-502 G-S44 — Live Preview real-mouse clicks on the chrome panel: the stamina bar's Edit pencil opens only the edit form and Collapse collapses without moving the editor cursor; a click where the hidden panel would be still lands on the editor line above; the panel stays revealed when the pointer moves straight up across Obsidian's own \`</>\` button to Collapse; on the collapsed one-liner a real click on Expand expands and a real click on \`</>\` still enters the block's source; counter, feature and statblock: CodeMirror's height for the widget equals its on-screen height (the block's margins stay inside the widget), every panel button hit-tests to itself and real Collapse/Expand clicks work`. e2e CHR-L01 (Live Preview Collapse + Expand by real pointer).

CURRENT for dse `08c086c` + SC-502: tsc/lint clean · jest 6105 passed / 1 skipped / 247 of 248 suites · lifecycle 39/39 · e2e 124/124, 0 failed, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL, button host-leak 114/684 · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Drive-by fixes:
none.

## Follow-ups:
none new.

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/`: `r4-tsc.log r4-lint.log r4-jest.log r4-lifecycle.log r4-e2e.log r4-shots.log r4-freeze.log r4-parity.log`.
