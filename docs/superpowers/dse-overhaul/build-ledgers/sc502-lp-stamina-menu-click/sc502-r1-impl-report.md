# SC-502 r1 implementer report

## Executive summary
- STATUS: DONE_WITH_CONCERNS. dse `ece820b` (on tests `232ab0f`, on develop `c2758a2`); superproject `d70f72b` (CHANGELOG, on origin/main `1b3a833`). Not pushed, pointer not bumped.
- Gates on `ece820b`: tsc+lint clean; jest 6061 passed / 1 skipped / 246 of 247 suites (+3); lifecycle 38/38 (G-S44 new); e2e 124/124, 0 failed, 0 known-bug, coverage 87/87 pairs (+1 test, no new pair); shots 592, 0 FAIL; freeze OK 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Mechanism: not stacking. Obsidian clips the Live Preview code-block widget (`contain: paint !important` on `.cm-content > [contenteditable=false]`, new in 1.15.0; `overflow: hidden` on `.cm-embed-block:hover`, present in 1.14.4 too), so the panel that hangs above the block is neither painted nor hit-tested.
- Fix: CSS only, one rule in the "Element chrome" section of `styles-source.css` (shared, so every chrome element is covered): `contain: none !important; overflow: visible; clip-path: inset(-80px -1px -1px -1px)` on `.markdown-source-view.mod-cm6 .cm-content > .cm-preview-code-block.cm-embed-block:has([data-dse-chrome])`.
- Survey (base a0365a4, real Obsidian 1.15.0 Live Preview, panel revealed): 171 chrome buttons across 20 element types x 4 layouts: 6 hit-test to their button on base (all `ds-feature`), 165 fell through to `div.cm-line`/`div.cm-scroller`/the previous block. After the fix: 171/171.
- Pixel-neutral: gates yes (shots 592 / freeze 280/280 / parity unchanged; the browser harness has no Live Preview). BUT in Live Preview itself the panel was never visible on base (clipped), so the fix makes it appear above the block on hover, exactly where SC-169 puts it in Reading view. Placement/size/reveal rules are untouched, panel does not move, block does not grow. This is the one thing the owner should look at (crops below) - see Concerns.
- Other finding: Obsidian's own `</>` edit-block button covers the collapsed one-liner's Expand button in Live Preview (real click enters the block source), so a mouse user who collapses in Live Preview cannot expand by mouse. Pre-existing (also reachable by keyboard Collapse); not fixed. See Follow-ups.

## Base reproduction (a0365a4, Obsidian 1.15.0 headless, CDP press+release at the button centre after hovering the block)
Stamina bar, text line directly above, cursor parked on line 8, panel revealed (`pointer-events: auto`, opacity 1):
- Edit pencil: `elementFromPoint` = `div.cm-line.cm-active`; result: no modal opened, editor cursor 8 -> 0 (the line above the block).
- Collapse: same hit, block not collapsed, cursor 8 -> 0.
- Fixed build, same probe: pencil hit = `span.dse-btn__icon`, 1 modal (the edit form), cursor stays 8. (Log: `.../scratchpad/sc502-r1-impl-x7q2/sym-base.log`, `sym-fixed.log`.)
- Screenshot of the revealed panel on base: no panel drawn at all; only Obsidian's `</>` shows (`crop-base-revealed.png`, `crop-hyps.png`).

## Survey table (base a0365a4; fixed result in last column)
Method: probe scenario (scratch, not committed) opens a note per element built from the element's `example.yaml`, Live Preview, hovers the block with a real mouse, reads `elementFromPoint` at every `.dse-chrome button` centre. Layouts: text line directly above (inactive), blank line above with cursor on it (active), block first in the note, two blocks back to back (no gap and one blank line between; stamina-bar, counter, statblock). Full data: `survey-base.json`, `survey-fix.json` (+ `.log`) in the scratch folder.

Panel bottom is at the block's top edge for every element (panel bottom - anchor top = 0.0 px). Panel top vs widget top:

| element | buttons | panel top vs widget top | base: hit at each centre | fixed |
|---|---|---|---|---|
| stamina-bar, counter, conditions, skills (+Hide unowned), hero (no Edit), montage (7), project, characteristics, tokens, encounter, initiative (5), values-row, surges, party, resource | 2-7 each | -26.2 px (panel wholly outside the widget) | `div.cm-line.cm-active` (text/blank above); `div.cm-scroller` (first in note, or block above is 1st); previous block's own content (adjacent); `div.cm-line` (gap) | all OK |
| statblock, featureblock, scc, negotiation | 3 each | -18.2 px (8 px of the 26 px panel inside the widget) | same (centre is in the clipped part) | all OK |
| feature | 3 | -2.2 px | OK on base (centre inside the widget) | OK |

Totals: base 6 / 171 hit their button; fixed 171 / 171. Layout cases did not change the answer on base (every one falls through; the thing it falls to differs). Edge probes (extra): a block inside a `> [!note]` callout with text above: OK on base and fixed (panel is inside the callout widget); an embedded note `![[...]]`: OK both; a block that is the FIRST thing in a callout (directly under the title): hit = `div.callout-title` on base AND fixed (different widget, `.cm-callout`; not covered - Follow-up).

## Mechanism evidence
- Panel chain at the pencil: `div.dse-chrome` (absolute, z 3) -> `.dse-stamina__cluster.dse-chrome-anchor` -> ... -> `div.cm-preview-code-block.cm-embed-block` with computed `position: relative; contain: paint; overflow: hidden`. `document.elementsFromPoint` at the pencil never lists the panel at all.
- Matching host rules (read from the live stylesheets): `.markdown-source-view.mod-cm6 .cm-content > [contenteditable="false"] { contain: paint !important }`, and `.markdown-source-view.mod-cm6 .cm-embed-block:not(.cm-table-widget, .cm-lang-base):hover { box-shadow; border-radius; overflow: hidden; cursor: text }`. Asar grep: `contain:paint!important` is in Obsidian 1.15.0, absent in 1.14.4; the hover rule is in both.
- Hypothesis injection on the live page: `z-index` on widget/panel/root, `cm-line z-index -1` do nothing (once the Notice overlay is hidden); `contain: none` + `overflow: visible` on the widget makes every button hit-test correctly (`ok: true`). Screenshots: `crop-hyps.png` (none / H1 / H2).
- So the CodeMirror line did not win a stacking contest; the overhang was clipped and the click reached the line beneath. Also: a pointer travelling up out of the block onto the clipped panel un-hovers the block, so the panel hides again (G-S44 base failure shows `panel revealed: false`).

## Fix
`styles-source.css`, directly after the hover-reveal rule of the "Element chrome" section (commented in full):
```
.markdown-source-view.mod-cm6 .cm-content > .cm-preview-code-block.cm-embed-block:has([data-dse-chrome]) {
	contain: none !important;
	overflow: visible;
	clip-path: inset(-80px -1px -1px -1px);
}
```
`clip-path` keeps the host's clip on the other three sides (1 px slack so the host's 1 px hover ring is not cut) and opens only the strip above. Specificity (0,6,0) beats the host's `!important` (0,4,0). The panel keeps `pointer-events: none` until revealed: measured, a click where the HIDDEN panel would be still lands on the editor line above (G-S44 part 2). SC-492 guard holds (pencil opens only the form). Scoped to Live Preview code-block widgets; no print/harness effect. Pixel check: with the rule injected, a pixel diff of the widget band outside the panel showed only 1-level corner antialiasing from the lost hover radius clip.

## Tests (all fail on a0365a4, pass on ece820b)
- lifecycle `G-S44` (`visual-harness/obsidian-lifecycle.mjs`): real CDP mouse in Live Preview. Why lifecycle (also): runs the newest installed Obsidian (1.15.0, the one with `contain: paint`, where the failure was measured), and the Edit pencil needs `experimental` + `authoringControls` and has no e2e control id (adding one means touching `pipeline.ts`, the manifest and both censuses). Covers: line-above-active hit test of every button; pencil click -> only the edit form, cursor unmoved; Collapse click -> collapsed, cursor unmoved; hidden-panel click lands on the editor line above (cursor == line above); counter and statblock: every button hit-tests to itself, real Collapse click collapses; note byte-identical; no page errors. Fixtures `Lifecycle/{stamina,counter,statblock}-lp.md`; header comment updated (38 scenarios in all).
- e2e `[CHR-L01]` (`e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`): real WebDriver hover + click on `chrome.collapse` in Live Preview, cursor stays on line 0. Drives an existing manifest pair (`chrome.collapse` click), no new control/pair. Runs on the pinned 1.14.4 (hover half of the clip).
- jest `test/dom/framework/chromeLivePreviewClip.test.ts` (3 tests): the rule exists with `contain: none !important` + `overflow: visible`; the clip opens only above (top <= -40, other sides within [-1, 0]); selector scope, and no placement/reveal property in the rule.

## Base-failure evidence (proofs on base a0365a4; the rebase onto c2758a2 only added SC-509's G-S40)
- G-S44 on a0365a4 bundle (`DSE_LIFECYCLE_BUNDLE`): `OBSIDIAN-LIFECYCLE G-S44 FAIL: line above active: elementFromPoint at the pencil button's centre is div.cm-line.cm-active, not the button (panel revealed: false)` (`gs44-base.log`).
- CHR-L01 with the CSS rule reverted: `OBSIDIAN-E2E CHR-L01 FAIL: Element <button ... data-dse-control="chrome.collapse" ...> did not become interactable` (`e2e-l01-base.log`).
- jest: the new file's rule is absent on base by construction.
- Pass on fix: `gs44-fix.log`, `e2e-l01-fix.log`; full-battery lines below.

## Gate summary lines (on ece820b; logs in scratch folder)
- tsc: `tsc rc=0` (incl. `tsc -p e2e`); lint: `lint rc=0`.
- jest (after shots): `Tests: 1 skipped, 6061 passed, 6062 total`, `Test Suites: 1 skipped, 246 passed, 246 of 247 total` (delta +3 vs the 6058 target; the first run before shots read 6060 / 2 skipped as dse-verify predicts).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 PNGs, 0 FAIL; in-run lines: `chrome placement OK (7 element families ...)`, `chrome host-leak OK (18 family/scheme combos ...)`, `host-copy pin OK (6 button-reaching rules + 14 tokens ... Obsidian 1.15.0; 18 further rules ...)`, `button host-leak OK (113 button kinds x 3 states ... = 678 comparisons)`, `modal button host-leak OK (10 ... 38 button kinds ... = 228)`, input 164, checkbox 60, text scale OK 1626, `print-twin delta OK (144 capture ids ...)`, expected `OBSIDIAN APP.CSS PIN DRIFT` warning.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## dse-verify row text for G-S44 (dispatcher applies at landing; I did not edit SKILL.md)
`SC-502 G-S44 — Live Preview real-mouse clicks on the chrome panel: the stamina bar's Edit pencil opens only the edit form and Collapse collapses without moving the editor cursor, a click where the hidden panel would be still lands on the editor line above, and every panel button of a counter and a statblock hit-tests to itself`. Also CURRENT numbers: lifecycle 38/38, jest +3, e2e 124/124 (CHR-L01).

## Concerns
1. VISIBLE CHANGE IN LIVE PREVIEW (owner decision). On base the panel was invisible in Live Preview (clipped), so after the fix it newly appears above the block on hover, at the SC-169 position (same as Reading view). Not a move/resize and no gate pixel moves, but it is something Scott has not seen in Live Preview. Crops (left base, right fixed): `.../scratchpad/sc502-r1-impl-x7q2/crops/{stamina-bar-text-0,stamina-bar-first-0,stamina-bar-adjacent-1,statblock-text-0,counter-gap-1,initiative-text-0,montage-text-0}-before-after.png` (adjacent: the panel overlaps the bottom of the block above, as in Reading view; first in note: room above exists). If Scott does not want it shown in Live Preview, the alternative is not a "fix" of this ticket.
2. The panel hides when the pointer passes over Obsidian's `</>` edit-block button on the way to the Collapse button (the button is a sibling of the block root, so `:hover` on the root is lost). Reaching Collapse straight up from under it fails; approaching from the Edit/Pin side works (G-S44 does). Not changed (it would change the reveal rule).

## Drive-by fixes:
none.

## Follow-ups:
1. Expand button on the collapsed one-liner is covered by Obsidian's `</>` button in Live Preview (hit = `div.embed-action.edit-block-button`; a real click moves the cursor into the fence and shows source). Pre-existing; after this fix a mouse user can collapse but not expand in Live Preview. G-S44 re-expands by script click and says why.
2. Panel hover can be lost over the `</>` button (Concern 2); option: also reveal on `.cm-embed-block:hover` in Live Preview.
3. A chrome block that is the first thing inside a `> [!note]` callout: panel buttons hit `div.callout-title` (callout widget, not covered by this rule; same on base).
4. `AGENTS.md` still says "Reading mode only -- no Live Preview support" (stale); DESIGN.md's chrome-panel section does not mention the Live Preview clip - suggest a one-line note at landing.

## Artifacts
Scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-impl-x7q2/`: logs (`tsc.log lint.log jest1.log jest2.log lifecycle-full.log e2e-full.log shots.log freeze.log parity.log gs44-base.log gs44-fix.log e2e-l01-base.log e2e-l01-fix.log sym-base.log sym-fixed.log survey-base.{log,json} survey-fix.{log,json}`), crops (`crops/`, `crop-base-revealed.png`, `crop-hyps.png`), probe sources (`probe-*.js`, `mkprobe.sh`), `base-bundle/` (a0365a4 build).
