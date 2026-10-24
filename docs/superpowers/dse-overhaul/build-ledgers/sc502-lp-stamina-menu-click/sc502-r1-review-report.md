# SC-502 r1 independent review report

## Executive summary
- VERDICT: **FIX**. Reviewed dse `84c903b` (diff `c2758a2..84c903b`) + superproject `b08fbfd` (CHANGELOG, DESIGN.md). Findings: **1 HIGH, 1 MEDIUM, 1 LOW, 4 INFO**.
- HIGH-1: `contain: none !important` also drops the widget's block formatting context, so a block root's vertical margins now collapse OUT of the Live Preview widget (feature 24px, statblock/featureblock 8px, every chrome root on mobile 2.1em). CodeMirror's height map undercounts each such block (feature -48px): in Live Preview, scrolling a note with feature cards jumps 48px each time one leaves the viewport (10 jumps / 12 blocks; base 0), and a real click on a line below them lands one line off. One-line fix verified: `display: flow-root` on the same rule (geometry = base, 0 jumps, G-S44 still ok).
- MEDIUM-1: e2e `CHR-L01` flaked in 1 of 2 full `npm run e2e` runs (`element click intercepted` by `div.cm-line`, panel never revealed); 6/6 solo runs pass.
- LOW-1: the 64px strip's derivation ignores Obsidian's own font-size setting (panel 55.5px at font 30 + 140% text; 73.4px with touch buttons -> top 9px cut).
- The fix itself works: real CDP mouse in Obsidian 1.15.0 Live Preview, base fails / head passes for pencil (form only, cursor unmoved), Pin, Collapse, Expand, `</>`, the four SURVEY layouts, montage/counter/statblock/initiative/party/feature, popout; hidden-panel clicks and drags on the line above land exactly where CodeMirror says; Reading view pixel-identical (13/13 cases); G-S44 discriminates (base, no-clip, no-reveal, no-pad all FAIL; head ok).
- Battery on 84c903b: tsc/lint clean; jest 6063 / 1 skipped / 246 of 247; lifecycle 38/38; e2e run 1 `123/124, 1 failed` (CHR-L01), run 2 `124/124 ok, 0 failed, 0 known-bug, 87/87`; shots 592, 0 FAIL; freeze OK 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED (all = implementer).
- SC-523 part 1 (ledger ask): confirmed on 84c903b with G-S45's counter fixture in Live Preview: base = pencil centre hits `div.cm-line`, cursor 11 -> 3, no form; head = edit form opens, cursor unmoved. Re-check after the rebase onto `253aa5f`.

All evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-review-821d/` (called `$R` below).

## Method
- Scratch checkouts (`git worktree add --detach`, removed at the end): `$R/dse-base` = `c2758a2`, `$R/dse-head` = `84c903b`, both built with `esbuild.config.mjs production`. Probe = `$R/rv-probe-extra.js` spliced into a copy of each checkout's own lifecycle harness (`$R/rv-run.sh`), real Obsidian 1.15.0 on a private Xvfb, port 9295, real `Input.dispatchMouseEvent` (move along a path, press, release at the button centre). The branch worktree was never written by a probe.
- Variant bundles for test validity (`$R/mkvariants.py`): `v-noclip` (r1 rule removed), `v-noreveal`, `v-nopad`, `v-flowroot` (head + `display:flow-root`).
- Caveat learnt the hard way (INFO-4): `Page.captureScreenshot` with a `clip` drops `:hover`, so my clipped hover crops show no panel. Every hover/hit number below was read before any capture; the panel is painted (full-viewport capture `$R/shots/head-paint-sb-text-full.png`, crop `$R/shots/head-paint-sb-text-crop.png`).

## Findings

### HIGH-1 — the widget's margins collapse out of it; CodeMirror's height map goes wrong (scroll jumps, mis-placed clicks)
- Where: `draw-steel-elements/styles-source.css:16870-16874` (`.markdown-source-view.mod-cm6 .cm-content > .cm-preview-code-block.cm-embed-block:has([data-dse-chrome]) { contain: none !important; overflow: visible; clip-path: … }`).
- Mechanism: on 1.15.0, host `contain: paint` made the widget an independent formatting context, so the block root's own vertical margins stayed INSIDE the widget box. `contain: none` + `overflow: visible` removes that, so the margins collapse through the widget. Measured (`$R/cmp-geo.txt`, `$R/rv-*-geo.log.jsonl`), widget rect base -> head, Live Preview:
  - feature `[376, 208.6, 1020, 1262.1]` -> `[376, 232.6, 1020, 1214.1]` (root margin 24px 24px); wide feature same.
  - statblock `…3619.8` -> `216.6, …3603.8`; featureblock `877.4` -> `861.4` (8px 8px). The survey's -18.2px group (statblock, featureblock, scc, negotiation) all carry that 8px.
  - Mobile chrome mode (`[data-dse-chrome-mobile='on'] { margin-top: 2.1em }`, every chrome element): with the attribute set on a stamina bar, base widget `81.2 -> 114.8` tall (margin inside), head widget stays `81.2` with the root's 33.6px margin outside it (`$R/rv-base-mobile.log`, `rv-head-mobile.log`). Inferred: on Obsidian mobile every chrome block undercounts by 2.1em.
  - Nothing moves on screen (line above and line below identical), but CodeMirror measures the widget's border box: `cm.lineBlockAt(widget).height` 1262.1 -> 1214.1, i.e. the height map is 48px short per feature block.
- Failure scenario (measured, `$R/rv-base-margin.log`, `$R/rv-head-margin.log`): a note with 12 `ds-feature` blocks in Live Preview.
  - Real wheel scrolling, 200px ticks: head moves the text 248px instead of 200px ten times (each time a block leaves CodeMirror's rendered viewport and is replaced by its too-short height-map gap); base 0 jumps. The same marker line's document y drifts by 48px across scroll positions on head, 0 on base.
  - Scrolled to the end, a real click on the last text line `END LINE`: base cursor `420:3` (correct), head `421:0` (the line below).
  - Height map vs DOM for the line below one feature block: base 1384.2 / 1384.2, head 1336.2 / 1384.2.
  - G-S18 (SC-478 scroll hold) and the SURVEY did not catch it: they never scroll past a margin-bearing block.
- Prescribed fix: add `display: flow-root;` to the same rule (BFC without clipping). Verified on bundle `$R/v-flowroot`: geometry identical to base in 70/70 phase comparisons across 13 Live Preview + 13 Reading cases (`$R/rv-flow-geo.log.jsonl` vs base); 0 wheel jumps, `END LINE` click `420:3`, height map = DOM (`$R/rv-headflow-margin.log`); G-S44 ok (`$R/gs44-v-flowroot.log`); mobile emulation widget 114.8 again (`$R/rv-flow-mobile.log`). Pin it: jest — the rule carries `display: flow-root`; lifecycle G-S44 — for the statblock phase, `cm.lineBlockAt(cm.posAtDOM(widget)).height` equals the widget's flow height (`next.top - prev.bottom`) and the widget's top equals the line above's bottom (fails on 84c903b: 3603.8 vs 3619.8). Update the rule's comment and DESIGN.md's one-liner ("lifts the clip" -> also keeps the widget's formatting context).

### MEDIUM-1 — CHR-L01 is flaky in the full e2e run
- Where: `draw-steel-elements/e2e/specs/stamina-bar/chrome-live-preview.e2e.ts:23-24` (`await dse.hover(root.root); await dse.click(root.control('chrome.collapse'));`).
- Failure: full run 1 (`$R/battery-e2e-run1.log:419`): `OBSIDIAN-E2E CHR-L01 FAIL: WebDriverError: element click intercepted: Element <button … data-dse-control="chrome.collapse" …> is not clickable at point (1211, 260). Other element would receive the click: <div class="cm-line" dir="ltr">`; WebDriver retried for ~10 s and the panel never revealed (failure bundle copied to `$R/e2e-chr-l01-fail/`, screenshot shows no panel, pointer not over the block). Full run 2: `124/124 ok` (`$R/battery-e2e-run2.log`). Solo `--only=CHR-L01` x6: 6/6 ok (`$R/e2e-l01-loop.txt`). dse-verify: "No retries, ever: a flake is a bug in the test" — and `npm run e2e` is the required landing gate.
- Likely cause: a single `moveTo` onto the root centre right after `openNote`; if Live Preview is still laying the note out, the pointer ends on a text line and nothing re-hovers (the product path is fine: G-S44 and my probes hover in steps and never miss).
- Prescribed fix: in CHR-L01, wait for the root's rect to be stable before hovering (the driver's `waitStable`), then after `dse.hover(root.root)` wait for `getComputedStyle(panel).pointerEvents === 'auto'` (re-hover once if not), then `dse.hover` the Collapse button itself before `dse.click`. Prove with 2+ full e2e runs.

### LOW-1 — the 64px strip's "derivation" ignores Obsidian's font-size setting
- Where: `styles-source.css:16860-16864` (comment: "the tallest the overhang can get … 40.1px"), `styles-source.css:16873`, `test/dom/framework/chromeLivePreviewClip.test.ts:38` (`top <= -54`).
- The panel is sized in em off the editor font, so Obsidian's Appearance font size (up to 30px) scales it too. Measured on head (`$R/rv-head-clip.log`): font 30 -> panel 40.3px; font 30 + 140% text -> 55.5px (shadow reaches 65.5 > 64, 1.5px of shadow cut; focus ring top 58.5 OK); font 30 + touch-size buttons + 140% text -> 73.4px: the panel's top ~9px is clipped and the top edge of every button no longer hit-tests (`OK/topX`; centres still OK).
- Failure scenario: a large-font user on a touch-screen laptop sees a panel with its top edge sliced off; with only large font + 140% text the shadow is cut by 1.5px (not visible).
- Prescribed fix: open a larger strip (96px covers 73.4 + 10 shadow + 3 ring = 86.4) and rewrite the comment's derivation to include Obsidian's font size (16px default, 30px max); move the jest bound accordingly. (A larger strip costs nothing: only the panel lives up there; the spill scan found no other content above the widget.)

### INFO-1 — Live Preview rest pixels are not byte-identical (sub-visible raster change)
- Dropping `contain: paint` changes rasterisation inside the widget at rest: counter 2,350 px > 16 levels, party 5,837, skills 6,266 (`$R/cmp-geo.txt`, stacked crops `$R/shots/cmp-lp-counter-rest.png`, zoom `$R/shots/zoom-counter.png`, `zoom-skills.png`). Deterministic (head == flow-root variant byte for byte), no geometry change, invisible at 5x zoom. The stamina bar alone is 0-2 px. Not gate-visible (the harness has no Live Preview). No action; mention if anyone asks "pixel-neutral".

### INFO-2 — SC-523 part 1 confirmed (ledger ask)
- `RV-SC523` probe, G-S45's counter fixture (`# form stale counter\n\nABOVE\n\n<counter>\n\nBELOW`), Live Preview, authoringControls on, G-S45's own hover path (card centre -> top edge under the pencil -> straight up), real press/release: base `{"pe":"none/0","hit":"div.cm-line","before":"11:0","after":"3:0","modals":[]}`; head `{"pe":"auto/1","hit":"span.dse-btn__icon","before":"11:0","after":"11:0","modals":["form"]}` (`$R/rv-base-sc523.log`, `$R/rv-head-sc523.log`). On 84c903b, not on 253aa5f; the rebase round should re-run it. Part 2 (form closes on a Live Preview rebuild) not covered by SC-502, not probed.

### INFO-3 — the 36px one-liner padding is unconditional in Live Preview
- `styles-source.css:16895-16899` applies whenever the block is in a Live Preview code-block widget, also when Obsidian's `</>` is not shown (it appears on hover). Ruled acceptable (LP-only move of Expand, owner ruling). Measured: Expand x 1377.5 -> 1347.1 (stamina, statblock), 1376.5 -> 1346.1 (counter), `</>` unchanged at x 1378; Reading view Expand unchanged. No action.

### INFO-4 — evidence-method note for future rounds
- A CDP `Page.captureScreenshot` WITH `clip` drops `:hover` (pointer-events `auto/1` before, `none/0` right after; `$R/rv-head-paint.log`). Crops of a hover-revealed panel must be cut from a full-viewport capture. The implementer's crops are fine; my own clipped hover crops are not used as evidence.

## What was checked and holds (base `c2758a2` -> head `84c903b`, Obsidian 1.15.0, real mouse)
- Stamina bar, Live Preview (`$R/rv-*-main.log`): base pencil centre hits `div.cm-line`, panel hides on the way up (`auto/1` -> `none/0` at the widget edge), press moves cursor `9:0 -> 2:93`, no modal; Collapse same, not collapsed. Head: pencil hit `span.dse-btn__icon`, `modals ["form"]` only (SC-492 guard intact), cursor `9:0` unmoved; Pin hit OK; Collapse collapses, cursor unmoved; real Expand click expands.
- SURVEY layouts (all three panel buttons hit-tested + real Collapse + real Expand): text above inactive, blank line above active (cursor 3 stays 3), first in note, adjacent second and adjacent first, text above active. Base: all miss (hits `div.cm-line`, `div.cm-line.cm-active`, `div.cm-scroller`, previous block's `div.dse-stamina__gchannel` — the press there opened the block above's Stamina modal); head: all OK.
- Other elements: montage (6 buttons, affected on base) OK; feature (NOT affected on base, panel inside the widget) OK on both; counter, statblock, initiative (4), party OK on head, all `div.cm-line` on base.
- Hidden panel (head and base identical): a press at each button centre with the panel not revealed lands on the line above at exactly `posAtCoords` (`2:93` x3), nothing collapses/opens; drag-select along that row from its left edge to the Collapse x selects `2:1 -> 2:93`, Collapse x -> pencil x selects nothing extra; note unchanged.
- Owner rulings: collapsed one-liner Expand expands by real click (cursor unmoved) for stamina bar, statblock, counter; `</>` still enters the source (cursor `4:0`); straight up from BELOW the block (outside it) across `</>` to Collapse keeps the panel revealed and collapses (stamina bar, statblock, counter). Reading reveal rule unchanged (jest + Reading pixels).
- Reading view: 13 element cases, rest and collapsed captures byte-identical base vs head; pencil/Collapse/Expand behave the same.
- Spill: no content of any probed element (incl. a feature with a 1626px-wide markdown table and a 400-char unbroken word, initiative, montage, skills, party) paints outside the widget other than the panel; the wide table stays in its own `div.dse-md-table` scroller on both.
- Clip strip at defaults: panel 26.2px, shadow to 36.2, focus ring top 29.2 above the widget; tooltips are on `<body>`.
- Popout window (`app.workspace.openPopoutLeaf`, real mouse via the popout's own CDP target): Collapse hit OK, collapses, cursor unmoved (`$R/rv-head-clip.log`).
- Test validity (head harness `--only=G-S44`, `$R/gs44-*.log`): base bundle FAIL `line above active: elementFromPoint at the pencil button's centre is div.cm-line.cm-active, not the button (panel revealed: false)`; `v-noclip` same FAIL; `v-noreveal` FAIL `statblock: elementFromPoint at the centre of "Edit Statblock" is div.cm-line`; `v-nopad` FAIL `collapsed: elementFromPoint at the Expand button's centre is div.embed-action.edit-block-button`; head ok; `v-flowroot` ok. Not vacuous: it asserts the panel's revealed state, the hit element, the modal kind and the cursor line. It does not cover HIGH-1 (see the prescribed assertion).
- CHANGELOG bullet (superproject `b08fbfd`): accurate for the user-visible effect; DESIGN.md bullet: accurate except it should mention the formatting-context fix once HIGH-1 lands. AGENTS.md line: accurate.

## Battery (branch worktree, dse 84c903b; logs `$R/battery-*.log`)
- tsc `GATE tsc rc=0` (incl. `tsc -p e2e`); lint `GATE lint rc=0`.
- jest `Tests: 1 skipped, 6063 passed, 6064 total`; `Test Suites: 1 skipped, 246 passed, 246 of 247 total` (= implementer).
- lifecycle `OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed` (Obsidian 1.15.0, port 9295) (= implementer).
- e2e run 1 `OBSIDIAN-E2E done: 123/124 ok, 1 failed, 0 known-bug, coverage: 87/87 pairs` (CHR-L01, MEDIUM-1); run 2 `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 PNGs, 0 FAIL, `GATE shots rc=0`; in-run: chrome placement OK (7 families), chrome host-leak OK (18), host-copy pin OK (1.15.0), button host-leak OK (113 kinds, 678), modal button host-leak OK (228), input 164, checkbox OK, text scale OK (1626), print-twin delta OK (144 ids), expected `OBSIDIAN APP.CSS PIN DRIFT` warning (= implementer). Took >10 min under load 7-14.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, `GATE parity rc=0`.

## Artifacts (`$R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-review-821d`)
- Probe sources: `$R/rv-probe-extra.js`, `$R/rv-run.sh`, `$R/gs44-run.sh`, `$R/mkvariants.py`, `$R/cmp_geo.py`, `$R/gate.sh`, `$R/e2e-loop.sh`.
- Probe logs (+ `.jsonl`): `rv-{base,head,flow}-geo.log`, `rv-{base,head}-main.log`, `rv-{base,head,headflow}-margin.log`, `rv-head-clip.log`, `rv-head-card.log`, `rv-{base,head,flow}-mobile.log`, `rv-{base,head}-sc523.log`, `rv-head-paint.log`, `cmp-geo.txt`.
- G-S44 validity: `gs44-{dse-base,v-noclip,v-noreveal,v-nopad,v-flowroot,dse-head}.log`, FAIL shots `gs44-{base,noclip,noreveal,nopad}-FAIL.png`; variant bundles `v-*/`.
- Battery: `battery-{tsc,lint,jest,lifecycle,e2e-run1,e2e-run2,shots,freeze,parity}.log`, `e2e-l01-loop.txt` + `e2e-l01-loop-{1..6}.log`, CHR-L01 failure bundle `e2e-chr-l01-fail/`.
- Screens: `shots/` (base-/head-/flow- rest captures; `review-sbtext-base-vs-head.png` uses clipped captures, see INFO-4; `head-paint-sb-text-full.png` + `-crop.png` = panel painted on hover).
