# SC-520 r2 fix report

## Executive summary
- STATUS: DONE (two visible changes await Scott's ask). dse `32fcace` (6 commits: r1's 3 + `544e839` tests, `19afe08` fix, `32fcace` header) on origin/develop `9be397e` (rebased twice: 71437da, then 9be397e; conflicts only in the lifecycle header/scenario list, kept both sides). Superproject `49367042` (2 commits) on origin/main `ca6be094`/`33e95393`; CHANGELOG conflict resolved keeping all bullets. Not pushed, pointer not bumped.
- MEDIUM-1: rule F adopted (`.callout:has(> .callout-content > :first-child > CH) { overflow-x: auto; overflow-y: hidden }`) AND the first-child narrowing adopted (reliable, see below). G-S49 has a wide-table phase (real `mouseWheel` deltaX, last column reachable), LP and RV, block first and block second.
- LOW-1: option (b): `--dse-chrome-inset: 24px` for the panel, Live Preview callouts whose first child is the chrome block only (36px clear of the widget edge, panel ~14px left of before; 24px = 36px minus the callout's 12px padding). Collapse hit-tests across its full face for all 20 element types; G-S49 checks it and presses its right edge.
- LOW-2 (flow-root rationale), INFO-1 wording, INFO-3 (census excludes only the two container elements) done in CSS comment, jest comment, DESIGN.md, CHANGELOG, `e2e/driver/census.ts`.
- Gates on `32fcace`: tsc/lint clean; jest 6155 passed / 1 skipped / 248 of 249 (6148 + 7); lifecycle 42/42 (halves 21/21 + 21/21); e2e 124/124, 87/87 x2; shots 592, 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24.
- Ask image for Scott (labelled A/B/C and wide table at rest/scrolled): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-fix-m7q3/ask/sc520-ask-crops.png`.

## MEDIUM-1: sideways scroll
- CSS (`styles-source.css`, Element chrome section): three rules, all narrowed to `> :first-child > [data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-chrome]`: `.callout-content` (overflow visible + flow-root), `.callout` (rule F), and the LP-only inset rule. Comment rewritten (trade-off stated: the callout title scrolls with the content once such a callout is scrolled sideways).
- First-child narrowing result: ADOPTED, reliable in LP and RV DOM. The block's root is the only child of Obsidian's `div.block-language-*`, which is the content's first child, in both views. Survey with the narrowed rules (head build, `survey-new1-*.log`, `summ2.js`): 20 element types x {default title, foldable, callout-inside-callout, block second} x {LP, RV} plus {callout inside plain blockquote, plain blockquote} in RV: buttons hitting across their whole face 66/66 in every cell; `</>` 63/63 grid points in every LP sample; hidden-state title/chevron/`</>` all ok; CodeMirror height == on-screen gap, widget top offset 0 in every LP sample; panel/`</>` overlap none. Block-second cells are untouched by any rule and unchanged. Nested case: only the inner callout matches (outer first child is the inner callout).
- Wide-table phase of G-S49: fails on the F-less build (`nof-bundle`, = 43d57e5 behaviour for this finding): `G-S49 FAIL: Live Preview, wide table, block first: the table sticks out 2262px past the callout but nothing scrolls sideways (the chrome block cut the callout's own scrolling)` (`gs49-nof.log`). Passes on head: LP block first scrolls on `.callout`, block second on `.callout-content`, RV wide table scrolls.
- jest pin: `chromeLivePreviewClip.test.ts` (rule F body, narrowing in all three selectors).

## LOW-1: `</>` over Collapse
- Base measurement (43d57e5 behaviour, `survey-pre-a.log`): 19 of 20 element types had Collapse partly covered (stamina/counter etc. overlap 10 x 21.4, statblock/featureblock/scc/negotiation 10 x 13.4; only feature had none), grid hit 47/66.
- Fixed: grid 66/66, overlap none, `</>` still 63/63 in all 20.
- Crops: `crop-low1-a-unchanged.png` (strip of 9 points across Collapse: `CCCCCCEEE`, 3 of 9 hit `</>`), `crop-low1-b-moved.png` (`CCCCCCCCC`), `crop-low1-c-stacked.png` (panel on top of `</>`, injected CSS `.markdown-source-view .cm-callout .callout { position: relative; z-index: 5 }`: `CCCCCCCCC`; panel z-index alone does nothing because Obsidian sets `.callout { mix-blend-mode: lighten }`, which makes the whole callout one stacking layer below the `.embed-actions` button). All in `.../sc520-r2-fix-m7q3/ask/` (tight to the callout's top-right, 2x), plus `crop-med1-rest.png` and `crop-med1-scrolled.png` (1x; scrolled shows the title and panel scrolled out with the content while Obsidian's `</>` stays put).
- Test: G-S49 `hitAcross` (5 x 3 points over every panel button, and 9 x 7 over `</>`), plus a real press on Collapse's right edge. Fails on the pre-r2 build: `G-S49 FAIL: Live Preview, stamina bar first in a callout: "Collapse Stamina bar" is covered 19px of 26px across, 4px down: elementFromPoint there is div.embed-action.edit-block-button` (`gs49-pre.log`; also `gs49-noinset.log`).
- Option (a) is the pre-r2 build, (c) needs the injected CSS above (not shipped).

## LOW-2, INFO-1, INFO-3
- LOW-2: CSS comment, jest comment, DESIGN.md now say flow-root keeps `.callout-content`'s own box (and a theme's content background) where the scroll container had it, and that CodeMirror's height is right either way; G-S49's height checks no longer claim to prove flow-root.
- INFO-1: docs say "at rest looks as before except the card's drop shadow is no longer cut (at most 5/255) and a callout with wide content has no scrollbar of its own (it scrolls instead)". The r1 report's "pixel-identical" wording is superseded. I did not re-measure rest pixels in r2.
- INFO-3: `eventfulNodes` now excludes `[data-dse-chrome-item]` descendants plus the two container elements themselves (`.dse-chrome`, `.dse-chrome-summary`); descendants of the containers that are not chrome items stay censused. CENSUS-01/05 pass (e2e 124/124).

## Tests (FAIL on pre-r2 / PASS on head)
- lifecycle G-S49: pre `.../gs49-pre.log` FAIL (Collapse right edge); no-F `gs49-nof.log` FAIL (wide table); no-inset `gs49-noinset.log` FAIL (Collapse right edge); head `gs49-new1.log` ok, and in the full battery `gate-lc2.log` (`G-S49 ok`).
- jest: on r1's CSS (styles-source.css stashed) 4 failed, 108 passed (`jest-new-ON-43d57e5.log`); on head 112/112 (`jest-new.log`).

## Gates (final head dse `32fcace`; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-fix-m7q3/`)
- `gate-tsc.log` `tsc rc=0`, `gate-lint.log` `lint rc=0`.
- `gate-jest1.log` / `gate-jest2.log`: `Tests: 1 skipped, 6155 passed, 6156 total`, `Test Suites: 1 skipped, 248 passed, 248 of 249 total`.
- `gate-lc1.log`: `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`; `gate-lc2.log`: `done: 21/21 ok, 0 failed` (42 ids, G-S49 in the second half).
- `gate-e2e1.log`, `gate-e2e2.log`: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (no CHR-L01 flake).
- `gate-shots.log`: `shots rc=0`, 592 PNGs, button host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212].
- `gate-freeze.log`: `freeze OK (280/280 frozen print PNGs byte-identical ...)`; `gate-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Interaction with SC-518 (9be397e)
SC-518 reads the click's `currentTarget` inside the chrome button's own handler (focus hand-back); `keepClickOutOfObsidian` runs afterwards on the panel (bubble), so no interaction; G-S50 passes in the full run.

## Drive-by fixes:
none.

## Follow-ups:
1. Stacking of Obsidian's `</>` above the panel is caused by `.callout { mix-blend-mode: lighten }` (option (c) would need `position: relative; z-index` on the LP callout, which also covers `</>`'s left edge).
2. Same as r1: SC-463 (non-chrome clicks inside a callout in LP open its source); CHR-L01 load flake is SC-534 (not seen in r2).
3. The `--dse-chrome-inset` override applies to every `.dse-chrome-anchor` inside the first block, so a nested element's panel (if a first block contains one) also moves 14px; none observed in the 20 element types.

## Artifacts (absolute)
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r2-fix-report.md`
- Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-fix-m7q3/`: `ask/sc520-ask-crops.png`, `ask/crop-low1-a-unchanged.png`, `ask/crop-low1-b-moved.png`, `ask/crop-low1-c-stacked.png`, `ask/crop-med1-rest.png`, `ask/crop-med1-scrolled.png`; surveys `survey-new1-{a,b,c}.log`, `survey-pre-a.log`, `summ2.js`; test logs `gs49-{pre,nof,noinset,new1}.log`, `jest-new*.log`; gates `gate-*.log`; probes `probe-survey.js probe-ask.js probe-stk.js`; bundles `pre-bundle/ new1-bundle/ head-bundle/ nof-bundle/ noinset-bundle/`.
