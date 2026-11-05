# SC-520 r5 report

## Executive summary
- STATUS: DONE. dse `91e03844` (9 commits) on origin/develop `248e202b` (rebased onto d689b719 first, then again onto 248e202b; the battery below is on the final head). Superproject `cfbaab41` (4 docs commits) on origin/main `1ee7c9af`. Not pushed, pointer not bumped.
- Conflicts: only `visual-harness/obsidian-lifecycle.mjs` (fixtures block and the scenario list, resolved keeping both: SC-533's chrome-frame fixture + G-S49's; G-S49 now follows SC-481's scenario). `mountChrome.ts` did NOT conflict (git merged our click listener next to SC-533's `queueFrameBorders`).
- SC-540 decision: our panel/one-liner `click` `preventDefault` is REDUNDANT and was REMOVED (commit `d9ecaf1a`), together with its 3 jest tests and the e2e census exception (`census.ts` back to develop's). SC-540's `armClickShield` marks the DSE root `.interactive-child` when it sits in `.cm-content .cm-embed-block.cm-callout` (capture click + press); Obsidian's callout click handler skips targets inside `.interactive-child`. The panel and one-liner are inside the root, so every chrome click is already covered. Evidence: G-S49 passes on a build without our listeners (`gs49-nopd.log`), and real-mouse Pin in a LP callout behaves identically with and without it (`pin-head.log`, `pin-nopd.log`).
- Option B (Scott's pick) and rule F unchanged: `--dse-chrome-inset: 24px` in LP callouts with the block first, callout is the sideways scroller.
- Gates on `91e03844`: tsc/lint clean; jest 6474 passed / 1 skipped / 256 of 257 (target 6477 assumed our 7 tests; we now add 4 because 3 chrome.test.ts tests went with the removed listener: 6470 + 4); lifecycle 52/52 (21 + 16 + 9 + 4 + 2, G-S49 ok in part 5); e2e 128/128, 89/89; shots 592, 0 FAIL, host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24.

## Conflicts in detail
- `obsidian-lifecycle.mjs`, commit "test(SC-520): block first in a callout": two hunks. (1) fixtures: HEAD side added SC-533's `Lifecycle/chrome-frame.md` entry inside the same `Object.assign`; kept HEAD's, closed it, then our SC-520 const block and callout fixtures. (2) scenario list: HEAD side ended with SC-481's scenario body; kept it, closed it (`},\n},\n{`) and appended G-S49. Header: git merged both; the G-S49 header count now says "52 scenarios in all". Syntax-checked after each rebase. The later commits applied without conflict.
- On the second rebase (248e202b: SC-490, montage-only) no conflicts in either repo (one more styles-source.css touch-point, merged by git).
- Superproject: CHANGELOG and DESIGN.md merged cleanly twice; kept all bullets.

## SC-540 analysis
- What it does (`d35b7b51`, `da9abf50` in `src/framework/pipeline.ts`): `armClickShield` adds `interactive-child` to the DSE root at `click` (capture) and at press when the root is under `.cm-content .internal-embed` or `.cm-content .cm-embed-block.cm-callout`. Obsidian's widget `click` handler (`hookClickHandler` -> `selectElement`) skips a click whose target sits in `.interactive-child`, so no whole-callout selection/source swap. It deliberately does not cancel `click` (links/checkboxes inside cards need it).
- Our r1 mechanism (Obsidian's callout widget `click` handler moves the cursor into the callout; it honoured `defaultPrevented`) is the same handler, now bypassed by the mark. Our listener was therefore overlapping: harmless but unnecessary, and it would sit on every panel in the plugin for a path already covered.
- Test of removal: build `nopd-bundle` = rebased head minus the two `registerDomEvent(... keepClickOutOfObsidian)` lines. G-S49 (pencil: only the form, cursor unmoved, callout still drawn; Collapse; Expand; Collapse right edge; counter/feature/statblock Collapse/Expand; foldable callout does not fold; Reading view) passes (`gs49-nopd.log`). Probe `probe-pin.js` (real mouse press on Pin in a LP callout; Enter on a focused Collapse/Pin): mouse Pin: cursor 12 -> 13, lines 13 -> 14 (the stamped anchor line, same as top level), callout still drawn, in BOTH the with- and without-listener builds; Enter paths: cursor unmoved, callout drawn, both builds (`pin-head.log`, `pin-nopd.log`).
- Kept: nothing of ours in the click path. G-S49's header comment now names SC-540's mark; AGENTS.md and DESIGN.md say the same; CHANGELOG (user-facing) unchanged and still accurate.

## Gates (final head dse `91e03844`; logs in scratch)
- `gate-tsc.log` / `gate-lint.log`: rc=0 (run on the rebased head: `tsc rc=0`, `lint rc=0`).
- jest: `gate2-jest.log` (after shots) and `gate-jest3.log`: `Tests: 1 skipped, 6474 passed, 6475 total`, `Test Suites: 1 skipped, 256 passed, 256 of 257 total`.
- lifecycle (each a foreground call): `gate2-lc1.log` 21/21, `gate2-lc2.log` 16/16, `gate2-lc3.log` 9/9, `gate2-lc4.log` 4/4, `gate2-lc5.log` 2/2 (`G-S59 G-S49`, `G-S49 ok`) = 52/52.
- e2e `gate2-e2e.log`: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- shots `gate2-shots.log` (private `DSE_CAMERA_TMP`): `shots rc=0`, 592 PNGs, 0 FAIL, button host-leak OK 161 kinds / 966, modal 228, input 15/176, checkbox 7/116, prose 106 [212].
- freeze `gate2-freeze.log`: `freeze OK (280/280 frozen print PNGs byte-identical ...)`; parity `gate2-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- An earlier full battery on the d689b719 rebase (`gate-*.log`, `gate-shots-r5.log`) gave the same numbers (jest 6464 there, before SC-490's +10).

## range-diff `4deb8cf..b746a3c` vs `248e202b..91e03844`
1 `!` (lifecycle fixture/scenario hunks re-fitted around SC-533/SC-481 and header counts: context only), 2 `!` (mountChrome.ts hunk re-fitted around SC-533's `queueFrameBorders`; commit later superseded by r5), 3 `=`, 4 `!` (header context), 5 `=`, 6 `=`, 7 `=`, new 8 (`refactor(SC-520 r5)` removes the listener, 3 jest tests, census exception, updates comments/docs), new 9 (header count 52). All `!` are context drift from the new base, no content change except 8.

## dse-verify proposal
Row 4 additions (lifecycle): the five parts stay `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9), `G-S57 G-S62 G-S61 G-S56` (4; G-S56 last) and **`G-S59 G-S49`** (2; was G-S59 alone, 1). The `done:` line becomes `52/52`. G-S49 description line: `SC-520 G-S49 — a block that is the FIRST thing inside a > [!note] callout: real-mouse clicks on the chrome panel (Live Preview and Reading view): every button hit-tests to itself across its whole face (Obsidian's </> no longer covers Collapse's right edge in Live Preview), the pencil opens only the edit form, Collapse/Expand work, the callout neither opens as source nor folds, the cursor stays, CodeMirror's height for the callout widget equals its on-screen height (counter, feature, statblock), Obsidian's title, fold chevron and </> stay clickable, and a callout that also holds a table far wider than itself still scrolls sideways by a real wheel with the last column reachable`. G-S49 sits after G-S56 in file order, so keep it out of part 4.

CURRENT row (replace on landing):
**CURRENT — dse `develop` @ `<landing sha>` (<date>; SC-520 landed — a block that is the first thing inside a `> [!note]` callout has its hover menu clickable with the mouse in Live Preview and Reading view: Obsidian's `.callout-content` clip no longer cuts the panel off, in a Live Preview callout the panel sits ~14px further left so Obsidian's `</>` button does not cover Collapse, and a callout that also holds wide content scrolls sideways as a whole (its title scrolls with it); three rules in the "Element chrome" section of `styles-source.css`, scoped to a callout whose first content child is a Steel screen chrome block; new lifecycle G-S49 in the fifth part with G-S59):** tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6474 passed / 1 skipped / 256 of 257 suites** (fresh worktree 6473 / 2; +4 tests, all in `test/dom/framework/chromeLivePreviewClip.test.ts`) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-520 r5 implementer at `91e03844` (on `248e202b`).

## Drive-by fixes:
none.

## Follow-ups:
1. G-S49 sits after G-S56 in the SCENARIOS array; harmless with `--only` parts, but a full `npm run obsidian-lifecycle` run puts it last.
2. Enter on a focused chrome button via the harness `t.key` did not collapse in the probe (both builds, identical); not investigated (keyboard Collapse is covered by SC-505's own tests).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r5-report.md`
- Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r5-t3n8/`: `gs49-head.log gs49-nopd.log pin-head.log pin-nopd.log probe-pin.js gate-*.log gate2-*.log` (gate2 = final head), `head-bundle/ nopd-bundle/`.
