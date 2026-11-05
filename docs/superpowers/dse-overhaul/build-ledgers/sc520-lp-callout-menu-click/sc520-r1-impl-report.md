# SC-520 r1 implementer report

## Executive summary
- STATUS: DONE_WITH_CONCERNS. dse `43d57e5` (3 commits on origin/develop `ed368f6`: `5605a49` tests, `227e18d` fix, `43d57e5` e2e census); superproject `c151b62` (CHANGELOG + DESIGN.md, on `5902c18`). Not pushed, pointer not bumped.
- Mechanism: TWO causes. (1) Obsidian's `.callout-content { overflow-x: auto }` (computed overflow auto both axes) clips the panel, which hangs over the callout's title row (block starts where the title ends): the click lands on `div.callout-title`. (2) Once (1) is lifted, Obsidian's callout widget still handles `click` (bubble) and moves the cursor into the callout, turning it into its source; the SC-377 shield only covers pointerdown/mousedown.
- Fix: CSS `.callout-content:has([data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-chrome]) { overflow: visible; display: flow-root }`, plus `mountChrome` default-prevents `click` on the panel and on the one-liner (`evt.preventDefault()`, NOT stopPropagation, so the Recoveries popover's document click-outside still works; Obsidian's callout handler honours defaultPrevented).
- Premise correction for the owner: Reading view is ALSO broken on base (same clip, `elementFromPoint` = `div.callout-title`, panel not drawn). The ticket's "as in Reading view" does not hold; the fix applies to both views.
- Survey (real Obsidian 1.15.0, 20 element types, panel revealed): callout cases default / custom title / foldable / nested-in-callout / block second: base 225 of 792 button centres hit their button (only `ds-feature` and the block-second control), fixed 792 of 792. 240 hidden-panel crops base vs fixed are pixel-identical (RGBA) in LP and RV. CodeMirror widget height == on-screen gap, widget top offset 0, for every LP sample.
- Gates on `43d57e5` (rebased onto `ed368f6`): tsc/lint clean; jest 6117 passed / 1 skipped / 247 of 248 (6112+5); lifecycle 40/40; e2e 124/124, 87/87 (x2 on final head); shots 592, 0 FAIL, button host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze OK 280/280; parity 0/0/24.
- For the owner's eye: (a) VISIBLE CHANGE: the panel newly appears over the callout title row on hover, in LP and RV (same SC-169 position, nothing moves; crops below). (b) A block wider than its callout is now cut by the callout's `overflow: hidden` instead of scrolling sideways. (c) The 6-run e2e series had one CHR-L01 flake under load (loadavg 13), 5 other runs green.

## Base reproduction (c558759, real Obsidian 1.15.0, CDP press+release at the button centre after hovering)
- Stamina bar first in `> [!note]` (LP): `elementFromPoint` at Edit/Pin/Collapse = `div.callout-title`; panel `pointer-events` flips back to none (the pointer left the block over the title). Real press: cursor line 12 -> 4 (callout source opened, widget gone), no modal, not collapsed. Foldable `[!note]+`: the click on the title also toggled the fold (`callout is-collapsed`).
- Reading view, same note: hit = `div.callout-title` for all 3 buttons.
- Logs: `.../sc520-r1-impl-k4v9/first.log`, `press-base-default.log`, `press-base-fold.log`, `gs49-base.log`.

## Mechanism evidence
- Chain at the panel (LP): root -> `div.block-language-ds-stamina-bar` -> `div.callout-content` (`overflow: auto/auto`) -> `div.callout` (`overflow: hidden`, padding 12px) -> `div.cm-embed-block.cm-callout` (`contain: paint`, `overflow: hidden`). Panel: top 239.3, bottom 265.4; title 244.6-265.4; callout/widget top 232.6. So the panel sits 5.3px above the title top and wholly over the title, but inside the callout's 12px padding and the widget box: only the `.callout-content` scroll container clips it. RV: identical chain (`div.el-div` outside), same numbers.
- The SC-502 rule's selector (`.cm-content > .cm-preview-code-block.cm-embed-block:has([data-dse-chrome])`) does not match the callout widget (`cm-embed-block cm-callout`). It does not need to (above).
- Hypothesis injection on the live page (`hyp.log`): `.callout-content:has([data-dse-chrome]) { overflow: visible }` alone makes all buttons hit (LP and RV); also lifting `.callout` overflow adds nothing. cmHeight == gap == widgetH in every variant.
- Second cause (`ev-fix.log`, `ev2-fix.log`): with only the CSS lifted a real Collapse/pencil press still moved the cursor 12 -> 4 and swapped the callout for source (collapse state still toggled; pencil modal opened). Events at the widget: pointerup and click bubble to the callout widget; injected variants: stopPropagation of `click` on the panel -> cursor stays; of `pointerup`/`mouseup` -> no help; `preventDefault()` on `click` -> cursor stays, widget stays (so Obsidian's handler checks defaultPrevented). The note's own ledger (sc455) had filed the general case (clicking a card inside a callout in LP opens the source) as SC-463; this change covers only chrome buttons.

## Survey (base vs fixed; scripts `probe-survey.js`, `summarize.js`; per-record JSON in `survey-{base,fix}-s*.log`, summary `survey-summary.txt`)
Rows = case x mode. Columns: samples (element types) / buttons hitting their button, base then fixed; panel top minus callout-title bottom (px); Reading-view result is the RV row.

| case | mode | base hits | fixed hits | panel top - title bottom | notes |
|---|---|---|---|---|---|
| default title | LP | 3/66 | 66/66 | -23.3 | base hits are `ds-feature` (panel overhang is only 2px, centre inside the content box) |
| default title | RV | 3/66 | 66/66 | -23.3 | RV was broken on base too |
| custom title | LP / RV | 3/66 / 3/66 | 66/66 / 66/66 | -23.3 | |
| foldable `[!note]+` | LP / RV | 3/66 / 3/66 | 66/66 / 66/66 | -23.3 | fold chevron is at the LEFT of the title: panel never covers it; chevron hit-tests to itself fixed (20/20 each mode) |
| plain `>` blockquote | LP | not rendered | not rendered | - | Live Preview does not render a fence inside a plain blockquote (source shown, no block, no panel) |
| plain `>` blockquote | RV | 66/66 | 66/66 | n/a | no callout title, no clip: unaffected |
| nested `> > [!note]` first line | LP | not rendered | not rendered | - | same: not rendered in LP |
| nested `> > [!note]` | RV | 3/66 | 66/66 | -23.3 | |
| callout inside a callout (`> > [!tip]` under `> [!note] Outer`) | LP / RV | 3/66 / 3/66 | 66/66 / 66/66 | -23.3 | |
| block second (text above), control | LP / RV | 66/66 / 66/66 | 66/66 / 66/66 | +30.3 | panel over the text, never clipped |

Totals (non-vacuous samples: 240 = 20 elements x 12 LP/RV callout cells, all rendered ones): base 225/792, fixed 792/792. Element types: stamina-bar, counter, statblock, feature, featureblock, conditions, skills, hero, montage, project, characteristics, scc, tokens, encounter, negotiation, initiative, values-row, surges, party, resource (all shared the one fix; none needed own code). Encounter needed a harness fix (the plugin appends lines to the note on first render, which put the parked cursor inside the callout); its rows are in `survey-*-s9.log`.
Obsidian's own controls (panel hidden, pointer away; both bundles): title, fold chevron and `</>` all hit-test to themselves in 240/240 fixed samples; real press: chevron toggles fold, title toggles fold, `</>` opens the callout source (cursor line 4), identical base and fixed (`obs-base.log`, `obs-fix.log`). With the panel revealed the panel's Collapse button overlaps `</>` by 8px horizontally (1364-1372) but Collapse's centre is clear of it.
Collapsed one-liner at the top of a callout vs `</>`: Expand (t 270.5) sits below `</>` (t 236.6-260.6), no overlap, hit OK on base and fixed; real press on Expand expands, cursor unmoved (`press-fix-*.log`, `prfix-*-P-COLLAPSED.log`).

## Fix (files)
- `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click/draw-steel-elements/styles-source.css`: one rule after the SC-502 one-liner rule in "Element chrome", fully commented (`flow-root` keeps the block's margins, e.g. feature 24px / statblock 8px / mobile 2.1em, inside the content box as the scroll container did; panel keeps `pointer-events: none` until hovered, so a hidden panel still lets title clicks through). No placement property touched.
- `.../src/framework/chrome/mountChrome.ts`: `keepClickOutOfObsidian = (evt) => evt.preventDefault()` registered (owner-bound `registerDomEvent`) on the panel and the one-liner.
- `.../e2e/driver/census.ts`: `CHROME_SURFACE` (`[data-dse-chrome-item], .dse-chrome, .dse-chrome-summary`) is the default exclusion, because the real-Obsidian census (CENSUS-01/05) flagged the two containers for listening to click (inert marker, not controls). Without it e2e read 122/124.
- Docs: `.../AGENTS.md` (callout line), worktree `CHANGELOG.md` Unreleased bullet and `DESIGN.md` chrome-panel callout note (superproject commit `c151b62`).

Pixel check: 240 hidden-state crops (callout box +-40px, panel not hovered), base vs fixed, LP and RV, all 20 elements x callout cases: identical RGBA. Frozen print shots untouched (freeze 280/280).

## Tests (fail on base, pass on fix)
- lifecycle **G-S49** (`visual-harness/obsidian-lifecycle.mjs`, 40 scenarios): real CDP mouse; stamina bar first in a default callout (every button centre hits itself; pencil -> only the edit form, cursor unmoved, callout still the drawn callout; Collapse collapses; Expand expands; title and `</>` hit themselves, `</>` still opens the source); foldable callout (pencil and Collapse leave it unfolded, chevron still folds and unfolds); counter, feature, statblock first in a callout (all buttons hit, CodeMirror widget height == on-screen gap, top offset 0, Collapse/Expand by real click, note byte-identical); block second (control); Reading view for both callouts. Why lifecycle: newest Obsidian (1.15.0), the pencil needs `experimental` + `authoringControls` (no e2e control id), LP geometry like G-S44.
  - Base (`gs49-base.log`): `G-S49 FAIL: Live Preview, stamina bar first in a callout: elementFromPoint at the centre of "Edit Stamina bar" is div.callout-title, not the button (... panel revealed: false)`.
  - CSS only (`gs49-cssonly.log`): `FAIL: the Edit pencil click moved the editor cursor to line 4 (Obsidian's callout widget opened the callout as source)`. TS only (`gs49-tsonly.log`): same first failure as base. Fix (`gs49-fix6.log`, full run `gate-lifecycle.log`): `G-S49 ok`.
- jest (no new suite): `chromeLivePreviewClip.test.ts` +2 (callout rule: overflow visible + flow-root; Steel screen scope and no placement/size/reveal property), `chrome.test.ts` +3 (Collapse click default-prevented, still collapses, still reaches a document listener; Expand click default-prevented; every panel button of a stamina bar). On base (CSS+TS stashed): 5 failed, 63 passed (`jest-new-BASE.log`); on fix 68/68 (`jest-new.log`).

## Gates (final head dse `43d57e5`, logs in scratch folder)
- tsc `tsc rc=0` (incl. e2e), lint `lint rc=0` (`gate-tsc.log`, `gate-lint.log`).
- jest `Tests: 1 skipped, 6117 passed, 6118 total`, `Test Suites: 1 skipped, 247 passed, 247 of 248 total` (twice, after shots: `gate-jest-r1.log`, `gate-jest-r2.log`).
- lifecycle `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed` (`gate-lifecycle.log`).
- e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` x2 on the final head (`gate-e2e-r1.log`, `gate-e2e-r2.log`). Pre-rebase series (`gate-e2e1..6.log`): run 1 122/124 (the census finding, fixed by `43d57e5`), run 2 CHR-L01 `timed out waiting for the chrome panel to stay revealed with the pointer on Collapse` at loadavg 12.7 (bundle `e2e-chrl01-fail1/`), runs 3-6 green. CHR-L01 is the SC-502 r3 load flake; no callout involved. Not proven on base.
- shots 592 PNGs, 0 FAIL: button host-leak 145 kinds / 870, modal 228, input 15 kinds / 176, checkbox 7 / 116, prose 106 [212], chrome placement OK, chrome host-leak OK, host-copy pin OK (1.15.0), expected `OBSIDIAN APP.CSS PIN DRIFT` warning (`gate-shots.log`).
- freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`gate-freeze.log`); parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 (`gate-parity.log`).

## dse-verify text for the dispatcher (I did not edit SKILL.md)
G-S49 row: `SC-520 G-S49 - a block that is the FIRST thing inside a > [!note] callout: real-mouse clicks on the chrome panel (Live Preview and Reading view): every button hit-tests to itself, the pencil opens only the edit form, Collapse/Expand work, the callout neither opens as source nor folds, the cursor stays, CodeMirror's height for the callout widget equals its on-screen height (counter, feature, statblock), and Obsidian's title, fold chevron and </> stay clickable`. CURRENT: lifecycle 40/40, jest 6117/1/247 of 248, e2e 124/124 87/87.

## Drive-by fixes:
none.

## Follow-ups:
1. SC-463 (already filed per sc455 ledger): clicking a NON-chrome part of a card inside a callout in Live Preview still opens the callout as source. The same `click` + defaultPrevented lever probably fixes it for the whole card (e.g. in `armClickShield`); not done here (scope).
2. A block wider than its callout no longer scrolls sideways inside it (cut by `.callout { overflow: hidden }`). Not measured with a real wide block; DSE cards size to their container.
3. Touch-size panel (`pointer: coarse`, up to 73px) in a callout would overhang past the callout's 12px padding and be cut by `.callout` / the widget; the mobile mode reserves 2.1em of top space instead of overhanging, so likely moot; not tested.
4. CHR-L01 flakes under heavy load (loadavg 12+) even with the SC-502 r3 CDP press; observed once in 6 runs.
5. The harness: the encounter block rewrites its note on first render (extra lines appended), which can put a parked cursor inside a callout in probes (no product change implied).
6. The panel covers the foldable callout's right side only; chevron is on the left, so no conflict now, but a theme that right-aligns the chevron would be covered while the panel is revealed.

## Artifacts (scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-impl-k4v9/`)
- Deciding crops (panel revealed, top = base, bottom = fixed): `crops-ba/before-after-stamina-bar-default-LP.png`, `crops-ba/before-after-stamina-bar-default-RV.png`; also `before-after-stamina-bar-fold-LP.png`, `before-after-statblock-default-LP.png`, `before-after-counter-second-LP.png`. Hidden-state crops: `crops-base/`, `crops-fix/` (+ `pxdiff.py`).
- Survey: `survey-summary.txt`, `survey-base-s*.log`, `survey-fix-s*.log`, `summarize.js`; probes `probe-survey.js probe-hyp.js probe-obs.js probe-ev.js probe-ev2.js probe-crop.js mkprobe.sh`; mechanism logs `first.log hyp.log ev-fix.log ev2-fix.log obs-base.log obs-fix.log press-*.log prfix-*.log`.
- Tests: `gs49-base.log gs49-cssonly.log gs49-tsonly.log gs49-fix6.log jest-new-BASE.log jest-new.log`.
- Gates: `gate-tsc.log gate-lint.log gate-jest-r1.log gate-jest-r2.log gate-lifecycle.log gate-e2e-r1.log gate-e2e-r2.log gate-e2e1..6.log gate-shots.log gate-freeze.log gate-parity.log`; bundles `base-bundle/ fix-bundle/ cssonly-bundle/ tsonly-bundle/` (pre-rebase builds); e2e flake bundle `e2e-chrl01-fail1/`.
- Repo: `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click` (dse `43d57e5`, superproject `c151b62`).
