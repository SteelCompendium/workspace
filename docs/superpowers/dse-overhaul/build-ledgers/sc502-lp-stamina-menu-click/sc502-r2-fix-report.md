# SC-502 r2 fix report

## Executive summary
- STATUS: DONE. dse `84c903b` (r2 commits `2fac844` tests, `bbe832b` fix, `84c903b` print-scope fix) on r1 `ece820b` on develop `c2758a2`; superproject `b08fbfd` (CHANGELOG + DESIGN.md) on origin/main `1b3a833` (unchanged since r1). Not pushed, pointer not bumped.
- Gates on `84c903b`: tsc+lint clean; jest 6063 passed / 1 skipped / 246 of 247 suites (+5 over the 6058 base: 3 from r1 + 2 new in r2, all in `chromeLivePreviewClip.test.ts`); lifecycle 38/38; e2e 124/124, 0 failed, 0 known-bug, coverage 87/87; shots 592, 0 FAIL; freeze OK 280/280; parity 0 / 0 / 24.
- Reveal: in Live Preview the panel stays revealed while the pointer is anywhere over the `.cm-embed-block` widget, `</>` included (new CSS rule; Reading view rule untouched).
- Expand vs `</>`: Expand now sits just left of Obsidian's `</>` button in Live Preview (padding-right 36px on the collapsed one-liner, Live Preview + screen Steel scope only). It MOVES 30.4px left in Live Preview: crops below. `</>` unchanged and still reachable.
- Clip strip: derived, 64px (tallest panel 40.1px measured + 10px shadow + 3px focus ring = 53.1), commented inline.
- Docs: AGENTS.md "Reading mode only" line replaced; DESIGN.md chrome-panel section got one bullet; CHANGELOG bullet rewritten.
- New assertions fail on r1 head `ece820b` and pass on r2 (lines below). Reading view, browser harness pixels and frozen bytes unchanged.

## Ruling outcomes
1. Concern 1 (panel newly visible): in scope, nothing to do; no change this round.
2. Follow-up 1 (Expand under `</>`): FIXED by moving Expand left in Live Preview only (CSS, no JS). Measured (collapsed, hovered): Expand rect x 1365.6 -> 1335.2 (stamina-bar), 1365.6 -> 1335.2 (statblock), 1364.6 -> 1334.2 (counter), width 23.8px unchanged; `</>` rect [1364, y, 28, 24] unchanged; the two no longer overlap (gap 5px). The `</>` button stays reachable: a real click on it still moves the cursor into the fence. Crops (left r1, right r2): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/crops/r2-collapsed-{stamina-bar,statblock,counter}-text-r1-vs-r2.png` (the teal ring on the left Expand-less button is the focus ring from the probe's script collapse click).
3. Concern 2 / Follow-up 2 (hover lost over `</>`): FIXED. New rule `…cm-preview-code-block.cm-embed-block:hover [data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-chrome] .dse-chrome { opacity: 1; pointer-events: auto }`.
4. Follow-up 3 (callout): SC-520, out of scope, untouched.
5. Follow-up 4: AGENTS.md line replaced (dse repo); DESIGN.md (worktree superproject) bullet under "Hover, mobile, print".
6. `clip-path` magic number: replaced by a derived 64px (was 80). Measurements in Live Preview (Obsidian 1.15.0): panel height 26.2px at defaults, 30.5px at 140% text size (max), 29.2px with touch-size buttons (`@media (pointer: coarse)` min-height 2em/44px min width emulated by an injected rule), 40.1px touch + 140% text. Shadow `0 -3px 7px` reaches 10px above; kit focus ring (2px + 2px offset, button top 1px inside the panel) about 3px more: 40.1 + 10 + 3 = 53.1 -> 64. Tooltips are drawn on `<body>` by Obsidian, not inside the widget. Comment is inline in `styles-source.css`; the jest test pins `top <= -54`.

## Fix (styles-source.css, "Element chrome" section, after the r1 rule)
- r1 rule: `inset(-64px -1px -1px -1px)` (comment rewritten with the derivation).
- Reveal rule (above).
- `.markdown-source-view.mod-cm6 .cm-content > .cm-preview-code-block.cm-embed-block [data-dse-theme='steel']:not([data-dse-print="on"]) .dse-chrome-summary { padding-right: 36px }` (4px inset + 28px `</>` + 4px gap, in px because it is Obsidian's px). The first version lacked the print scope and `chrome.test.ts` "every OTHER chrome rule carries the print exclusion" caught it (jest run before the fix: 1 failed); fixed in `84c903b`.
- Scope fence respected: no FormModal, Stamina modal, SC-505 focus code or host-leak sweeps touched.

## Tests changed
- lifecycle G-S44 (`visual-harness/obsidian-lifecycle.mjs`): the pointer now goes sideways inside the block and STRAIGHT UP to the button (the r1 detour around `</>` is gone); collapsed: hit test at Expand centre must be Expand, `</>` hit test must be `</>`, the two rects must not overlap, a real click on `</>` moves the cursor into the fence, a real click on Expand expands (cursor unmoved); Collapse reached straight up across `</>` then expanded by a real click; counter and statblock re-expand by a real click (every script re-expand removed). Header + scenario comments updated.
- e2e CHR-L01: now also a real WebDriver click on `chrome.expand` expands (existing manifest pair, no new pair).
- jest `chromeLivePreviewClip.test.ts`: 5 tests (was 3): strip >= 54px, reveal rule contents + Reading rule unchanged, one-liner padding rule (36px, one declaration).

## Base / r1-head failure proof (all with real Obsidian 1.15.0 lifecycle unless noted; bundles built from the r1 head and from r2 minus one rule)
- r1 head `ece820b` bundle: `OBSIDIAN-LIFECYCLE G-S44 FAIL: collapsed: elementFromPoint at the Expand button's centre is div.embed-action.edit-block-button, not the button (Obsidian's \`</>\` covers it)` (`r2-gs44-r1head.log`).
- r2 without the one-liner padding rule: same FAIL line (`r2-gs44-A-nopad.log`).
- r2 without the reveal rule: `G-S44 FAIL: statblock: elementFromPoint at the centre of "Edit Statblock" is div.cm-line, not the button` (the straight-up path crosses `</>`, the panel hides) (`r2-gs44-B-noreveal.log`). Note: on the stamina bar the straight-up Collapse path happened to keep hover even without the rule; the statblock case is the discriminating one.
- r2: `OBSIDIAN-LIFECYCLE G-S44 ok (Live Preview, real mouse: active line above: every button centre hit-tests to its button; Edit pencil: only the edit form, cursor unmoved; Collapse: collapsed, cursor unmoved; collapsed: \`</>\` still enters the source; Expand: expands by a real click, cursor unmoved; Collapse reached straight up across \`</>\`; hidden panel: the click lands on the editor line above; counter: 3 buttons reachable, Collapse collapses, Expand expands; statblock: 3 buttons reachable, Collapse collapses, Expand expands; no page errors)`.
- e2e CHR-L01 on the r1 head CSS: `FAIL: WebDriverError: element click intercepted: Element <button ... data-dse-control="chrome.expand" ...> is not clickable ... Other element would receive the click: <div class="embed-action edit-block-button"`; on r2: `OBSIDIAN-E2E CHR-L01 ok`.

## Gate summary lines (final head dse 84c903b)
- tsc `tsc rc=0` (incl. `tsc -p e2e`), lint `lint rc=0`.
- jest: `Tests: 1 skipped, 6063 passed, 6064 total`; `Test Suites: 1 skipped, 246 passed, 246 of 247 total`.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 PNGs, 0 FAIL; in-run: chrome placement OK (7 families), chrome host-leak OK (18 combos), host-copy pin OK (Obsidian 1.15.0), button host-leak OK (113 kinds, 678), modal button host-leak OK (228), input 164, checkbox 60, text scale OK 1626, print-twin delta OK (144 ids), expected APP.CSS PIN DRIFT warning.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## dse-verify G-S44 row text (updated; dispatcher applies at landing)
`SC-502 G-S44 — Live Preview real-mouse clicks on the chrome panel: the stamina bar's Edit pencil opens only the edit form and Collapse collapses without moving the editor cursor; a click where the hidden panel would be still lands on the editor line above; the panel stays revealed when the pointer moves straight up across Obsidian's own \`</>\` button to Collapse; on the collapsed one-liner a real click on Expand expands and a real click on \`</>\` still enters the block's source; counter and statblock: every panel button hit-tests to itself and real Collapse/Expand clicks work`. CURRENT numbers: lifecycle 38/38, jest 6063/1/246 of 247, e2e 124/124 87/87 (CHR-L01).

## Drive-by fixes:
none.

## Follow-ups:
1. SC-520 (callout-first block under a callout title) already filed by the owner.
2. In Live Preview the `</>` button also sits over the top-right of EXPANDED blocks' content (e.g. the stamina bar's top-right corner); pre-existing host overlay, not touched.

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/`: `r2-tsc.log r2-lint.log r2-jest2.log r2-lifecycle-full.log r2-e2e-full.log r2-shots.log r2-freeze.log r2-parity.log`, failure proofs `r2-gs44-r1head.log r2-gs44-A-nopad.log r2-gs44-B-noreveal.log r2-gs44-fix1.log r2-e2e-l01-r1head.log r2-e2e-l01-fix.log`, geometry `geo1.log geo-r1.log geo-r2.log h1.log` (panel heights), crops `crops/r2-collapsed-*-r1-vs-r2.png`, bundles `r1-bundle/ r2-bundle/ bundle-A-nopad/ bundle-B-noreveal/`.
