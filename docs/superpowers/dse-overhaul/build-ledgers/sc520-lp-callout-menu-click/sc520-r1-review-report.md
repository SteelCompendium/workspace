# SC-520 r1 independent review report

## Executive summary
- VERDICT: **FIX** (one MEDIUM; the owner rules on the scoped alternative, which costs a title-scroll trade-off). Reviewed dse `43d57e5` on `ed368f6`, superproject `c151b62`. (The coordinator reports dse develop is now `71437da`: land-ready needs a rebase + re-run.)
- Findings: **0 HIGH, 1 MEDIUM, 2 LOW, 4 INFO**.
- MEDIUM-1: any callout that holds a Steel chrome block (first OR anywhere in it) loses its sideways scroll: a wide table / long code line / long word in the same callout is now cut by `.callout { overflow: hidden }` and unreachable (base: scrolls 0->400; head: nothing moves), LP and RV. Scoped alternative "F" tested live: all buttons hit, title/chevron/`</>` OK, height map = screen, wide table reachable; trade-off: the title scrolls sideways with the content.
- LOW-1: with the panel revealed, Obsidian's `</>` (stacked above the panel) covers the right 8px of 25.5px of Collapse (x 1364-1372); a real press there opens the callout's source (cursor 11 -> 4). `</>` itself is fully reachable (63/63 grid points). Overlap 10 x 21.3px; the `</>` glyph is painted over the panel's right edge.
- LOW-2: the `display: flow-root` rationale (CSS comment, jest comment) is wrong: without it G-S49 still passes and the CodeMirror height map still equals the screen (margins cannot escape `.callout`'s 12px padding). flow-root only keeps `.callout-content`'s own box where it was.
- Battery on 43d57e5: tsc/lint clean; jest r1 1 failed (SC-485 initiative 5s timeout at loadavg 33 = load), r2 `6117 passed / 1 skipped / 247 of 248`; lifecycle `40/40`; e2e `124/124, 0 failed, 0 known-bug, 87/87` x2; shots 592, 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze `280/280`; parity `0 / 0 / 24` — all = targets.
- CHR-L01 flake is PRE-EXISTING: base `ed368f6` full e2e failed CHR-L01 in 1 of 3 runs (`still not displayed after 8000ms`, loadavg 13.3); solo x8 all ok -> Backlog, not a fold.

All evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-review-h3x8/` (`$R` below).

## Pause / resume log
- Paused mid-shots (Scott, via coordinator); shots finished rc=0 during the pause; resumed 2026-10-29: freeze, parity, sidebar probe run; scratch worktrees `$R/dse-head`, `$R/dse-base` removed (`git worktree remove --force`, rc=0; none left in `git worktree list`).
- Branch worktree untouched: `git status --porcelain` before = after (superproject ` M draw-steel-elements` = unbumped pointer as found; dse clean at `43d57e5`).

## Method
Detached scratch checkouts (removed at the end), bundles `$R/bundle-dse-head`, `$R/bundle-dse-base`, variant `$R/bundle-noflow` (head minus `display: flow-root`). Probes (`$R/rv-probe-extra.js`, `$R/rv-probe-alt.js`, `$R/rv-probe3.js`, `$R/rv-probe4.js`) spliced into a copy of the scratch checkout's own lifecycle harness (`$R/rv-run.sh`, port 9341), real Obsidian 1.15.0, CDP `Input.dispatchMouseEvent` / key events. The branch worktree was only used for the battery.

## Findings

### MEDIUM-1 — a callout with a chrome block loses sideways scrolling for everything in it
- Where: `draw-steel-elements/styles-source.css:16939-16942` (`.callout-content:has(...[data-dse-chrome]) { overflow: visible; display: flow-root }`); the comment at `:16935-16937` says only "a block wider than the callout is now cut ... DSE cards size to their container".
- The `:has()` matches a chrome block ANYWHERE in the callout (not only first), and the cut applies to every child, not just DSE blocks.
- Measured (`$R/cmp-scroll.txt`, `$R/base-scroll.log.jsonl`, `$R/head-scroll.log.jsonl`): callout = counter + 14-column table + 300-char code line + 300-char word, LP and RV, block first (`scr-mixed-first`) and block LAST (`scr-mixed-last`): table extends 1003px past the callout; base: a real sideways wheel moves `div.callout-content 0->400`; head: callout-content `overflow visible`, wheel moves nothing, the right 1003px are unreachable. Control without DSE (`scr-nodse`): scrolls on both. Crop: `$R/crops/scroll-mixed-first-lp-base-vs-head.png` (top base scrolled, bottom head cut).
- Wide DSE blocks in a 440px pane (all 20 chrome elements, LP+RV): no real regression — only statblock had 14px of callout scroll on base (now 2.4px cut past the callout border); characteristics/encounter keep their own inner scrollers; hero's overhang (97.8px) is identical on base (not a callout scroll).
- Rest pixels: the same callout loses its horizontal scrollbar, so it is a few px shorter and everything below shifts (`$R/crops/rest-diff-mixed-lp.png`).
- Scoped alternative tested live (`$R/rv-probe-alt.js`, injected over the head bundle; `$R/alt-dse-head-F.log.jsonl`):
  - **F (recommended):** keep the head rule and add `.callout:has(> .callout-content [data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-chrome]) { overflow-x: auto; overflow-y: hidden; }` — the CALLOUT becomes the sideways scroller; its padding box already holds the panel. Result LP+RV, 6 cases: every panel button hits (3/3), title/chevron hit themselves, foldable folds/unfolds by chevron, Collapse/Expand by real click with cursor unmoved, height map = screen (topOff 0), wide table: wheel moves `div.callout 0->1003`, last heading visible and hittable. Rest pixels = head. Trade-off: when scrolled sideways the callout title scrolls with the content (title left -903 at full scroll); at rest nothing changes.
  - B (keep `.callout-content` as scroller, `margin-top:-2.5em` + matching `padding-top`, `pointer-events:none` with children `auto`): LP worked (title fixed), but in RV the sideways wheel moved nothing; hackier, theme-background risk. Not recommended.
- Prescribed fix: add rule F (or ask Scott whether the title-scroll trade-off is acceptable); pin it in jest (`chromeLivePreviewClip.test.ts`) and add a wide-table-in-callout phase to G-S49 (real `mouseWheel` deltaX moves a scroller; last column reachable). Update the CSS comment, DESIGN.md note and CHANGELOG bullet's "nothing else changes" framing.

### LOW-1 — Collapse's right 8px are under Obsidian's `</>`; a press there opens the callout source
- Where: panel placement unchanged (`styles-source.css` "Element chrome"); newly revealed in callouts by `:16939`.
- Measured (`$R/head-ovl.log.jsonl`, `$R/edge-dse-head.log.jsonl`), stamina bar / counter first in a callout, LP, panel revealed (`pe auto/1`): panel `[1293.5..1374] x [239.3..265.4]`, `</>` `[1364..1392] x [236.6..260.6]` -> overlap 10 x 21.3px; `</>` stacks ABOVE the panel: 9x7 grid over `</>` = 63/63 `</>`, centre and left edge+1/+3 = `</>`. Horizontal scan along Collapse (x 1346.5-1372): 1347-1363 Collapse, 1365-1371 `</>`. Real press at x 1367 (approached along the panel from Collapse's centre): panel hides, cursor 11 -> 4, callout swapped for source, not collapsed. Base: same spot also opens the source (panel not drawn there at all). Statblock: overlap 10 x 13.3; feature: no vertical overlap.
- Owner's ruling asked "check the two do not overlap": they do; `</>` wins everywhere in the overlap, and its glyph is drawn over the panel's right edge (`$R/crops/edge-sb-revealed-x4.png`, from full capture `$R/shots/dse-head-edge-sb-revealed.png`; feature for contrast `$R/crops/edge-feature-revealed-x4.png`).
- `</>` remains fully clickable in every path (centre press from the block, from the title, left-edge press: cursor -> 4, source opens). Collapsed one-liner: Expand `[1353.6..1377.4] x [270.5..294.3]` is below `</>` (bottom 260.6): no vertical overlap, hits OK.
- Prescribed fix (owner/Scott choice): (a) accept (Collapse's centre is clear; same class as the SC-502 one-liner `</>` ruling), or (b) in a callout give the panel the same 36px right clearance the SC-502 one-liner has (moves the panel 28px left only inside callouts — a visible change for Scott), or (c) stack the panel above `</>` while revealed (then `</>`'s left 10px are covered while the panel shows; its centre stays clear). Not tested live.

### LOW-2 — the `display: flow-root` rationale is wrong (rule fine, comment + jest reason wrong)
- Where: `styles-source.css:16929-16933` ("flow-root keeps the box a block formatting context so the block's own vertical margins ... stay INSIDE it ... CodeMirror's height ... stays equal (SC-502 HIGH-1)"); `test/dom/framework/chromeLivePreviewClip.test.ts:86-88` ("Without flow-root ... CodeMirror undercounts the callout widget"); DESIGN.md:344-349 ("so no pixel moves").
- Measured with `$R/bundle-noflow` (head minus flow-root): G-S49 `ok` (`$R/gs49-bundle-noflow.log`); RV-GEO (`$R/noflow-geo.log.jsonl` vs `$R/head-fgn.log.jsonl`): cmH == gap for nested / nested-second / block-last / feature-first / stamina-first, callout bottoms and root tops identical; only `.callout-content`'s own top moves down by the margin (e.g. feature 174.4 -> 198.4). The margins collapse out of `.callout-content` but stop at `.callout` (12px padding), so the widget never undercounts. flow-root's real value: `.callout-content`'s box (and a theme's `--callout-content-background`) stays where the scroll container put it.
- Prescribed fix: reword the CSS comment and the jest comment to that reason; G-S49's height checks are fine but do not discriminate flow-root (say so, or drop the claim).

### INFO-1 — rest pixels: not byte-identical in LP for margin-bearing cards
- `$R/cmp-rest.txt`, `$R/crops/rest-diff-feature-lp.png`: panel hidden, base vs head: stamina bar / foldable / block-second LP+RV and feature RV: 0 px; feature LP 25,498 px and statblock LP 38,943 px differ by at most 5/255 (the card's drop shadow is no longer clipped at the content box and shows faintly in the callout's padding); statblock RV 150 px <= 2/255. Invisible; contradicts only the implementer's "pixel-identical" wording. Mixed-content callouts change (MEDIUM-1).

### INFO-2 — the click `preventDefault` in shared chrome code: no regression found
- Panel and one-liner hold only `iconButton`s and spans (`mountChrome.ts:187-199`); no link, checkbox, label, summary/details or form. Only DSE `click` reader of `defaultPrevented`: none (grep; the Recoveries click-outside at `RecoveriesStrip.ts:308` checks only `rootEl.contains`).
- Real mouse (`$R/head-func.log.jsonl`): top level and in a callout, LP and RV: Collapse, Expand, Edit (form only), Pin (sidebar panel mounts, anchor stamped) all hit and work, cursor unmoved (Pin's +1 line is the stamped anchor line). Popout window LP, callout: Collapse/Expand/Edit work through the popout's own CDP target, cursor unmoved, callout stays drawn. Recoveries popover (popover pref on) on block A closes on a real click on block B's Collapse, RV and LP. Sidebar panel's own chrome (`$R/sidebar-dse-head.log.jsonl`, pinned from a callout and from the top level, RV): items unpin/collapse/expand; real-mouse Collapse hits (panel `pe auto`), collapses; Expand hits, expands; note unchanged beyond the anchor line.
- Keyboard (`$R/edge-dse-head.log.jsonl` vs `$R/edge-dse-base.log.jsonl`): Enter on focused Collapse collapses, focus -> Expand with ring; Space on Expand expands, focus -> Collapse with ring; top level and callout, LP and RV; identical on base; note unchanged.

### INFO-3 — test validity
- G-S49 (head harness): base bundle FAIL `elementFromPoint at the centre of "Edit Stamina bar" is div.callout-title ... (panel revealed: false)` (`$R/gs49-bundle-dse-base.log`, shot `$R/shots/gs49-base-FAIL.png`); head ok in the full lifecycle run. It does not discriminate flow-root (LOW-2) and has no wide-content phase (MEDIUM-1).
- jest revert-and-run (`$R/jest-revert.sh`): head 68/68 (`$R/jest-new-head.log`); with styles-source.css + mountChrome.ts reverted to ed368f6: 5 failed / 63 passed (`$R/jest-new-reverted.log`). Real tests.
- `e2e/driver/census.ts:27` `CHROME_SURFACE`: the exclusion now covers the whole `.dse-chrome` / `.dse-chrome-summary` subtree; today both hold only `[data-dse-chrome-item]` buttons and text spans, so CENSUS-01/05 lose nothing. Tighter alternative if wanted: exclude the two container elements themselves (`el.matches('.dse-chrome, .dse-chrome-summary') || el.closest('[data-dse-chrome-item]')`) so a future non-chrome control placed in them would still be censused.

### INFO-4 — CSS scope, fold, geometry: hold
- Rule must not match (`$R/head-fgn.log.jsonl` NOMATCH): no DSE block -> `.callout-content` overflow auto/auto, display block (LP+RV); printPreview on (`data-dse-print="on"`) -> auto/auto, block; screen chrome block -> visible/flow-root. The theme is always `steel` (`seams/theme.ts`), so the non-steel case is hypothetical.
- Foldable (`FOLD`): `[!note]-` starts folded (`display: none` inline wins over flow-root, block hidden), chevron unfolds/folds in RV and LP (Obsidian animates with inline `overflow-y: clip`, then `display: none`), LP cursor unmoved.
- Geometry (`GEO`): nested callout, nested-second, block last, feature first, stamina first: CodeMirror height == on-screen gap, widget top offset 0; real click on the line below the callout lands on it (41:3, 148:3, 41:3, 40:3, 11:3). Wheel over 10 feature callouts: 0 jumps. Mobile margin (`data-dse-chrome-mobile` stamped by hand): the 33.6px margin stays inside the callout content (CodeMirror not re-measured by the hand stamp — inconclusive for the height map only).
- Coarse pointer: `Emulation.setEmulatedMedia` cannot set `pointer`; `Emulation.setTouchEmulationEnabled` does (`pointer: coarse`, `hover: none`). Panel in a callout (desktop hover-reveal): 29px tall, top 3.7px (stamina) / 11.7px (statblock) BELOW the callout top, both buttons hit at top and centre, LP and RV (`COARSE` records, shots `$R/shots/dse-head-coarse-*.png`). Not clipped at default font size.

## Owner-assigned probe answers (§2.1)
1. `</>` with the panel revealed: centre and left edge hit `</>` (63/63 grid), panel right edge 1374 vs `</>` left 1364 -> they OVERLAP by 10 x 21.3px (stamina/counter), `</>` on top; Collapse's right 8px unusable (LOW-1). Collapsed one-liner at the top of a callout: Expand below `</>`, no overlap, both hit and work.
2. Lost horizontal scroll: REAL for non-DSE wide content in the same callout (MEDIUM-1); negligible for DSE blocks in a 440px pane (statblock 14px). Scoped alternative F tested live and works.
3. CHR-L01: flakes on base `ed368f6` too — full e2e 1 of 3 (`$R/e2efull-dse-base-summary.txt`, bundle `$R/e2e-base-chrl01-fail/`), loadavg 13.3; solo x8 ok at load 18-32 (`$R/l01-dse-base-summary.txt`). Pre-existing -> Backlog. Head: 2/2 full runs green.
4. Coarse pointer: emulable via touch emulation; panel in a callout fits and hits (INFO-4).

## Battery (branch worktree, dse 43d57e5; logs `$R/battery-*.log`)
- tsc `GATE tsc rc=0`; lint `GATE lint rc=0`.
- jest r1 `1 failed, 1 skipped, 6116 passed` (SC-485 `initiative-default-keys` 5s timeout at loadavg 33 — load), r2 `Tests: 1 skipped, 6117 passed, 6118 total` / `Test Suites: 1 skipped, 247 passed, 247 of 248 total`.
- lifecycle `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed` (G-S49 ok).
- e2e r1 and r2 `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots (`$R/battery-shots.log`): `GATE shots rc=0`, 592 PNGs, 0 FAIL; button host-leak OK (145 kinds, 870), modal button host-leak 228, input 15 kinds / 176, checkbox 7 kinds / 116, prose 106 [212], chrome placement OK, chrome host-leak OK, host-copy pin OK (1.15.0), expected `OBSIDIAN APP.CSS PIN DRIFT` warning = targets.
- freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`$R/battery-freeze.log`).
- parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, `GATE parity rc=0` (`$R/battery-parity.log`).

## Docs
- CHANGELOG (`CHANGELOG.md:11`): plain, accurate for the click fix; silent on the lost sideways scroll (update with MEDIUM-1's outcome).
- DESIGN.md (`DESIGN.md:344-349`): accurate except "so no pixel moves" (MEDIUM-1, INFO-1) and the flow-root reason (LOW-2).

## Recommendations for the owner
- Fix round: MEDIUM-1 (rule F or Scott's call on the title-scroll trade-off; jest pin + a G-S49 wide-table phase), LOW-2 (comment/jest wording); LOW-1 needs an owner/Scott ruling (accept / 36px clearance in callouts / stack the panel above `</>`).
- Backlog: CHR-L01 load flake on base `ed368f6` (evidence `$R/e2efull-dse-base-summary.txt`, `$R/e2e-base-chrl01-fail/`).
- Rebase onto current develop (`71437da` per coordinator) before land-ready; re-run the battery there.
