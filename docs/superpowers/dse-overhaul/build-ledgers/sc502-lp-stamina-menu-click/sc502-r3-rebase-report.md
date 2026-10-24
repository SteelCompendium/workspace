# SC-502 r3 rebase report

## Executive summary
- STATUS: DONE. dse `1da9486` (8 commits) on origin/develop `f89f69f`; superproject `b3ce567` (3 commits) on origin/main `27f4c8c`. Not pushed, pointer not bumped.
- Fixed: HIGH-1 (`display: flow-root` on the widget rule + G-S44 height check for counter, feature 48px, statblock 16px), MEDIUM-1 (CHR-L01 waits + a real CDP press for Collapse), LOW-1 (96px strip, comment rewritten with Obsidian's font size, jest bound -86). DESIGN.md bullet updated. INFO-1 accepted, INFO-3/4 no action.
- SC-523 part 1 confirmed on the rebased head with a real click on a ds-counter pencil: `SC523 {"before":{"cursor":"10:0","pe":"auto","hit":"span.dse-btn__icon"},"after":{"cursor":"10:0","modals":["form"]}}` (base: `hit div.cm-line`, cursor 10:0 -> 3:0, no modal).
- Gates on `1da9486`: tsc+lint clean; jest 6084 passed / 1 skipped / 246 of 247 (base 6078 + 6: 3 r1 + 2 r2 + 1 flow-root test); lifecycle 39/39; e2e 124/124 87/87, 5 consecutive full runs on the final head; shots 592, 0 FAIL, button host-leak 114/684; freeze 280/280; parity 0/0/24.
- Note for the owner: the r3 target said jest 6079; the SC-512 relay says 6083 (6078 + 5); I add one more test (flow-root pin), hence 6084.
- Rebase conflicts: only the lifecycle header and scenario list (kept G-S40, G-S45 and G-S44; header says 39 scenarios in all) and the CHANGELOG (both bullets kept). Order in the scenario array: G-S45 then G-S44.

## HIGH-1: flow-root + G-S44 height check
- CSS: `display: flow-root` added to the one widget rule (comment rewritten: three load-bearing parts).
- G-S44 (loop over counter, feature, statblock; new fixture `Lifecycle/feature-lp.md`): `cm.lineBlockAt(cm.posAtDOM(widget)).height` must equal `next.top - prev.bottom` (the on-screen gap between the line above and the line below), and `widget.top - prev.bottom` must be 0. All three blocks are checked before the first failure is reported.
- FAIL on 84c903b (bundle built from that head's CSS): `OBSIDIAN-LIFECYCLE G-S44 FAIL: feature: CodeMirror's height for the widget is 222.578125px but the block takes 270.578125px on screen (the block's margins escape the widget) | feature: the widget starts 24px below the line above (its margins escape the widget) | statblock: CodeMirror's height for the widget is 443.9375px but the block takes 459.9375px on screen (the block's margins escape the widget) | statblock: the widget starts 8px below the line above (its margins escape the widget)` (`r3-gs44-84c.log`). Counter has no margin and passes on both.
- PASS on the fix: `G-S44 ok (… counter: height map = screen, 3 buttons reachable …; feature: height map = screen …; statblock: height map = screen …)` (`r3-gs44-fix.log`); also in the full run `r3b-lifecycle.log`.
- The per-block parked cursor line now comes from the fixture (feature's fence is longer than the old fixed line).

## MEDIUM-1: CHR-L01
- Test now: wait for the block's rect to be stable (3 identical reads), hover the root until the panel is revealed (up to 3 attempts), wait for `pointer-events: auto`, hover Collapse, wait again for the revealed state, then press with a real CDP pointer (`dse.click(collapse, { cdp: true })`).
- The reviewer's prescribed waits alone were NOT enough: with them, full run 1 of 3 on the rebased head failed again (`CHR-L01 FAIL: element click intercepted … Other element would receive the click: <div class="cm-line"` at point (1211, 260); bundle copied to `r3-chrl01-fail/`, run log `r3-e2e-run1.log`). The default WebDriver click scrolls the button into view and hit-tests it before moving the pointer; under full-run load that pre-check saw the panel click-through. The CDP press moves the pointer onto the button first, the same path G-S44 uses. The Expand click (not hover dependent) stays a normal click.
- Proof: **5 consecutive full `npm run e2e` runs** (10 isolated runs judged less representative: the flake only showed under full-run load): `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` x5 on `bd2fd83` (pre-f89f69f head, `r3-e2e-final1..5.log`) and x5 again on the final head `1da9486` (`r3b-e2e1..5.log`). Still fails on the base CSS: `CHR-L01 FAIL: timed out waiting for the chrome panel to stay revealed with the pointer on Collapse` (`r3-e2e-l01-base.log`).

## LOW-1: strip
96px (`clip-path: inset(-96px -1px -1px -1px)`); derivation in the comment: panel is em-sized off the editor font, so Obsidian's font size (16 default, 30 max) scales it: 73.4px with touch buttons at 140% text and font 30 (reviewer-measured) + 10px shadow + 3px focus ring = 86.4 -> 96. jest bound `top <= -86`.

## Rebase and SC-523
- dse: `git fetch`; first onto 253aa5f, then (SC-512) onto f89f69f; package.json unchanged, no `npm ci`. Superproject onto origin/main `27f4c8c`.
- SC-523 part 1: scratch probe on G-S45's counter fixture (`# form stale counter\n\nABOVE\n\n<counter>\n\nBELOW`), Live Preview, authoringControls on, the G-S45 hover path (card centre -> straight above the pencil -> up), real press+release. Head bundle: `{"before":{"cursor":"10:0","pe":"auto","hit":"span.dse-btn__icon"},"after":{"cursor":"10:0","modals":["form"]}}`; a0365a4-built base bundle: `{"before":{"cursor":"10:0","pe":"none","hit":"div.cm-line"},"after":{"cursor":"3:0","modals":[]}}` (`r3-sc523-head.log`, `r3-sc523-base.log`). Run on the code just before the SC-512 rebase (SC-512 is harness-only). Part 2 not touched.

## Gate summary lines (final head dse 1da9486 / superproject b3ce567)
- tsc `tsc rc=0` (incl. e2e), lint `lint rc=0`.
- jest `Tests: 1 skipped, 6084 passed, 6085 total`, `Test Suites: 1 skipped, 246 passed, 246 of 247 total`.
- lifecycle `OBSIDIAN-LIFECYCLE done: 39/39 ok, 0 failed`.
- e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (x5).
- shots 592 PNGs, 0 FAIL; `button host-leak OK (114 button kinds x 3 states x dark/light = 684 comparisons …)`, modal 228, chrome placement OK, chrome host-leak OK, host-copy pin OK (1.15.0); the first shots attempt (pre-SC-512 rebase) was killed by me by PID, not counted.
- freeze `freeze OK (280/280 …)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## dse-verify G-S44 row text and CURRENT numbers (dispatcher applies at landing)
`SC-502 G-S44 — Live Preview real-mouse clicks on the chrome panel: the stamina bar's Edit pencil opens only the edit form and Collapse collapses without moving the editor cursor; a click where the hidden panel would be still lands on the editor line above; the panel stays revealed when the pointer moves straight up across Obsidian's own \`</>\` button to Collapse; on the collapsed one-liner a real click on Expand expands and a real click on \`</>\` still enters the block's source; counter, feature and statblock: CodeMirror's height for the widget equals its on-screen height (the block's margins stay inside the widget), every panel button hit-tests to itself and real Collapse/Expand clicks work`. e2e CHR-L01 (Live Preview Collapse + Expand by real pointer). CURRENT: lifecycle 39/39, jest 6084/1/246 of 247, e2e 124/124 87/87, shots 592 with button host-leak 114/684, freeze 280/280, parity 0/0/24.

## Drive-by fixes:
none.

## Follow-ups:
1. CHR-L01's first version (reviewer's waits only) still flaked; if another Live Preview e2e is written, press hover-dependent controls with `{ cdp: true }`.

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/`: `r3b-tsc.log r3b-lint.log r3b-jest.log r3b-lifecycle.log r3b-e2e1..5.log r3b-shots.log r3b-freeze.log r3b-parity.log`, earlier-head evidence `r3-e2e-final1..5.log r3-e2e-run1.log r3-chrl01-fail/ r3-e2e-l01-base.log r3-gs44-84c.log r3-gs44-fix.log r3-sc523-head.log r3-sc523-base.log`, bundles `r3-bundle-84c903b/ r3-bundle-head/`.
