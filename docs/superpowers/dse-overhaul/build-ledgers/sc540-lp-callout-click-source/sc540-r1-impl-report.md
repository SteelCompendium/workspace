# SC-540 r1 implementer report

## Executive summary
- STATUS: DONE. Plugin (draw-steel-elements) HEAD `992375b6` on branch `sc540-lp-callout-click-source` (4 commits on `eaf64ba6`: `e04a1d8c` tests-red, `c11f7d11` fix, `98b4b65e` lifecycle G-S62, `992375b6` comment-only docs). Superproject `5a18ee74` (CHANGELOG only; submodule pointer NOT bumped, nothing pushed). `origin/develop` was still `eaf64ba6` at start (no rebase).
- Base (eaf64ba6, real Obsidian 1.15.0, real CDP mouse): + on a counter in a `> [!note]` callout writes the note and the callout becomes raw source (selection 0-0 -> whole callout; the card is gone); a click on the card's text does the same; Enter on the pencil opens the form but moves the selection into the callout (the callout stayed drawn while the form was open, contrary to the ticket text); with the callout's top 30 px clipped, the click also scrolls 829 -> 796.
- Fix: `armClickShield` (src/framework/pipeline.ts) also puts `interactive-child` on the DSE root when `root.closest('.cm-content .cm-embed-block.cm-callout')` (SC-522's mark was only for `.cm-content .internal-embed`). No click stopPropagation, no click preventDefault.
- Measured at HEAD: card stays, selection and scroll unmoved for +, Enter/Escape, card text, nested callout; callout text/title/`</>` still open source; chevron folds; plain and Ctrl-click on an internal link still open; plain fence unchanged.
- Red/green: jest 5 new tests FAIL on the eaf64ba6 source (45 pass), all 50 pass at HEAD. Lifecycle G-S62 FAILs (a), (b), (e) on the eaf64ba6 bundle and on the "no callout mark" control bundle, passes (c), (d), (f) there, and passes all six phases at HEAD (75 s alone).
- Gates at HEAD: tsc clean, lint clean, jest 6269 passed / 1 skipped / 249 of 250 (fresh 6268 / 2), lifecycle 47/47 (21 in 192 s + 16 in 339 s + 10 in 429 s), e2e 124/124 ok, 0 failed, 0 known-bug, coverage 87/87, shots 592 0 FAIL (button 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212]), freeze 280/280, parity 0 GAPs / 0 undeclared / 24 DECLARED. G-S57 and G-S52 re-run separately on HEAD: both ok.
- Deciding screenshots: `sc540-r1-base-callout-raw-after-plus.png`, `sc540-r1-head-callout-card-after-plus.png` (same dir as this report).

Evidence dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r1-evidence/` (logs, probe summaries, probe script). Proposed dse-verify text: `…/sc540-r1-dse-verify-proposal.md`.

## Setup notes
- The worktree had no `node_modules`; ran `npm ci` through devbox (package-lock unchanged, tree clean after).
- Probe harness: a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with an injected `P540` scenario (`sc540-r1-evidence/probe540.mjs.txt` + `mkharness.cjs.txt`), run against bundles built with `git archive eaf64ba6` (base, `main.js` sha256 prefix `aa4efdf671c9`) and the working tree (head1, `1e1036c0aeb1`, byte-identical to the tree's own `main.js` after the lifecycle build). Own port 9540/9541. Each case opens a fixture fresh in Live Preview, cursor on line 0, scrolls the block into view (never counts `.cm-embed-block`), real CDP mouse/key.
- Obsidian 1.15.0 app.js was checked against the asar's recorded sha256 (`12194d5e…`), copy at `…/scratchpad/sc540-r1-impl-a1/obsidian-1.15.0-app.js`.

## Step A: base reproduction (eaf64ba6 bundle)
Selection is CodeMirror's `anchor-head` offsets; "raw" = a `.cm-line` whose text is `> [!…`. Sources: `probe-base-summary.txt`, `probe-base-extra-summary.txt`, `probe-base-body-summary.txt`, `probe-base-cb-summary.txt`.

| # | Case | Base result | HEAD result |
|---|---|---|---|
| 1 | real click on + of a counter in a `> [!note]` callout | disk [6,5] written; callout RAW (DSE roots in callout 1 -> 0, callout widget gone); selection 0-0 -> 197-316 (whole callout); scrollTop 433 -> 433 (callout fully on screen) | disk [6,5]; card (roots 1 -> 1); selection 0-0 -> 0-0; scrollTop 433 -> 433 |
| 1b | same, callout top clipped 30 px | RAW; selection 0-0 -> 197-316; scrollTop 829 -> 796 | card; selection unmoved; scrollTop 829 -> 829 |
| 2 | focus the Edit pencil, Enter, then Escape | form opens (modal true); selection 0-0 -> 197-316 at Enter; callout stays drawn (card) while the form is open and after Escape; selection stays 197-316; note unchanged | form opens; card; selection 0-0 at Enter and after Escape |
| 3 | real click on card text (the counter's name) | RAW; selection -> 197-316; note unchanged | card; selection unmoved; note unchanged |
| 4a | click on callout body text outside the card | RAW, selection -> 197-316 | same (RAW) |
| 4b | click on the callout title | RAW | same (RAW) |
| 4c | click on the callout's `</>` button | RAW | same (RAW) |
| 4d | fold chevron, `> [!note]-` (collapsed) | unfolds (`is-collapsed` true -> false), card, selection unmoved | same |
| 4e | fold chevron, `> [!note]+` (open) | folds ([true,false] -> [true,true]), card, selection unmoved | same |
| 4f | + on a counter inside the open `+` callout | RAW | card |
| 5a | plain click on an internal link (`[[…]]` in a feature effect) in a callout | the tab navigates to the target; callout not selected | same |
| 5b | Ctrl-click on that link | a new tab opens on the target (leaves 1 -> 2), this tab stays on the note | same |
| 5c | links in a plain-fence feature (control) | same as 5a/5b | same |
| 6 | + on a plain fence outside any callout | disk [5,6]; card; selection 0-0 -> 0-0; scroll unmoved | same |
| N1 | callout in a callout, + on the counter in the inner one | RAW (selection 0-0 -> 197-326) | card; selection unmoved |
| N2 | `![[embedded counter note]]` inside a callout, + on its counter | card, selection unmoved, embedded note written [6] (already covered by SC-522's `.cm-content .internal-embed` match) | same |
| N2b | click on callout text next to that embed | RAW | RAW |
| N3 | callout inside an embedded note (`![[note-with-callout]]`), + | card, selection unmoved, embedded note written [6] (the callout is a Reading-style callout inside the embed; no `.cm-callout`) | same |

Notes on the table: the 1 and 1b runs used scroll-by-the-harness only to bring the block into view. Row 2: the ticket says Enter makes the callout raw; measured, the selection moves into the callout but the widget is still drawn while focus is in the card/form, so the symptom is the moved selection (G-S62 (b) asserts selection and card). All probe runs had 0 page errors.

## `interactive-child` in Obsidian 1.15.0 app.js (sha256 `12194d5e…`, offsets in the extracted file)
Six uses; no CSS rule for the class in app.css 1.15.0 (grep 0) or in the plugin's CSS:
1. @1764356 `hookClickHandler` (shared base of image, internal-embed, callout, math and html-embed widgets): the click handler walks from the target to the editor's content and returns (no `selectElement`) when a node matches `.cm-editor, .interactive-child`. This is the one SC-522 and SC-540 use. Its callers: @2637743 (image/embed url), @2639434 (internal-embed), @2642539 (callout and base widget, with `addEditButton` = the `</>` button), @2645111 (math), @2645862 (html embed). The shared click helper `Ah` (@820778) additionally ignores a click that is `defaultPrevented`, `detail>1`, shift-click, with a text selection in the widget, or while `document.activeElement` is inside the widget.
2. @2236537 Bases embed (`kf`): adds `bases-embed interactive-child` to its own container.
3. @2238477 canvas card/file node: its click-to-edit handler skips a target in `button, input, .collapse-indicator, .interactive-child`.
4. @2662579 editor Mod+A keydown on `contentDOM`: a target inside `.interactive-child` selects the input's / contenteditable's text instead of the whole note.
5. @2810162 Bases code-block post-processor: adds `bases-embed interactive-child`.
6. @2937585 canvas node (`rL`): double-click and click start editing unless the target is in `button, input, .collapse-indicator, .interactive-child`.
What else the class changes for a DSE root in an LP callout: only (1) and (4). (4) is a user-visible side effect, an improvement: Mod+A with focus in a DSE input (e.g. a counter's stepper) in a callout now selects the input's text instead of the whole note, as already so in an embed (SC-522 r3). I did not probe (4) for callouts in real Obsidian (read from source only); see Follow-ups.

## The fix
`src/framework/pipeline.ts`, `armClickShield`: `markInEditorEmbed` became `markInEditorWidget`; it adds `interactive-child` when `root.closest('.cm-content .internal-embed') || root.closest('.cm-content .cm-embed-block.cm-callout')`. Same call sites (click capture on the root, and at the start of the mousedown/pointerdown shield). The selector comes from the measured DOM (`.cm-content > .cm-embed-block.cm-callout > .markdown-rendered > .callout …`, and a plain fence is a `.cm-embed-block` without `.cm-callout`). Nested callouts and an embed in a callout match on the ancestor. The SC-522 comment block now explains both cases. Comment-only pointer added in `src/framework/host/livePreviewScrollHold.ts` ("CLICKS IN THE EMBEDDED CARD" paragraph) and G-S57's header comment in the lifecycle harness (it said "a click in a callout opens it as source, SC-540").
Why this lever (not the switch the ledger allows): a mark at capture changes only what Obsidian's callout handler sees; the click still bubbles, is not cancelled, so Obsidian's link handling (measured: plain and Ctrl-click on an internal link still navigate at HEAD) and checkbox defaults are untouched. No alternative was needed.

## Tests
Jest (`test/dom/framework/pipeline.test.ts`, new `describe('SC-540 Live Preview callout…')`, 7 tests incl. a 3-way `test.each`): click/pointerdown/mousedown in an LP callout marks the root (3); a callout inside a callout marks it; after the click Obsidian's handler walk (copy of the app.js loop) skips the card but still selects for the callout title; the click still bubbles unprevented to the widget and the document; Reading-view callout, a `.cm-callout` with no `.cm-content` around it, a plain `.cm-embed-block` and a `.cm-line` are left unmarked.
Red on the eaf64ba6 source: `Tests: 5 failed, 45 passed, 50 total` (`sc540-r1-evidence/jest-red.log`; the two guard tests, bubbling and "left alone", pass on base by design). Green at HEAD: 50/50 (`jest-green1.log`).
Lifecycle G-S62 (`visual-harness/obsidian-lifecycle.mjs`, before G-S56; fixtures `Lifecycle/callout-click.md`, `callout-fold.md`, `callout-link.md`): phases (a) + (callout top clipped 30 px so a selection would scroll), (b) Enter/Escape on the focused pencil, (c) Obsidian's own controls (text, title, `</>` open source = anti-vacuity; chevron folds), (d) internal link plain + Ctrl-click, (e) card text click, (f) plain-fence + control. It owns its leaf (keep set includes the scenario's own tab; detaches added leaves), asserts no Notice and no page error.

## Red/green evidence for G-S62 (own port 9541; logs in the evidence dir)
- HEAD (`lc-g62-head1b.log`): ok, 75 s. Numbers: (a) card, selection 0-0, scrollTop 856; (b) card, selection 0-0 at form open and after close; (c) text/title/`</>`: source, selection 0-0 -> 327-208, chevron collapsed true -> false; (d) plain click: tab shows `Lifecycle/other.md`, Ctrl-click: new tab `Lifecycle/other.md`, this tab still `callout-link.md`; (e) card, selection 0-0, scrollTop 856; (f) selection 0-0, scrollTop 1168.
- eaf64ba6 bundle (`lc-g62-base.log`): FAIL, 75 s. (a) callout shown as source (1 raw line), no DSE card in a callout widget (0 of 1 roots), selection 0-0 -> 327-208, scrollTop 856 -> 796; (b) selection moved 0-0 -> 327-208 at form open and at close; (e) same numbers as (a). (c), (d), (f) pass.
- "No callout mark" control bundle = HEAD with the `.cm-callout` clause removed (`nocallout`, `main.js` `564f63159c17`; `lc-g62-nocallout.log`): FAIL with the identical (a), (b), (e) numbers; (c), (d), (f) pass.
- Screenshots (probe, same click): base `sc540-r1-base-callout-raw-after-plus.png` (callout shows `> [!note] Camp … current_value: 6`), HEAD `sc540-r1-head-callout-card-after-plus.png` (card drawn, counter 6).

## Gates (HEAD `992375b6`, plugin tree)
| Gate | Result |
|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | clean, 16-18 s (re-run after the comment edits: clean) |
| lint (incl. `e2e/`) | clean, 19-24 s |
| jest, fresh worktree | `Tests: 2 skipped, 6268 passed, 6270 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250 total`, 115 s |
| jest, after shots | `Tests: 1 skipped, 6269 passed, 6270 total`, 249 of 250 suites, 78 s (6262 + 7 new) |
| lifecycle part 1 `G-S7a … G-S9a` | `done: 21/21 ok, 0 failed`, 192 s |
| lifecycle part 2 `G-S9b … G-S40` | `done: 16/16 ok, 0 failed`, 339 s |
| lifecycle part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` | `done: 10/10 ok, 0 failed`, 429 s (under 540 s; loadavg after ~5) |
| lifecycle total | 47/47 |
| G-S57 and G-S52 on HEAD, separately (`lc-g57g52.log`) | `done: 2/2 ok, 0 failed`, 159 s; also ok inside part 3 |
| e2e | `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, plus `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`, 74 s |
| shots | rc 0, 740 s (the foreground call hit the 600 s limit and ran on; the log was polled): 592 files, 0 FAIL, `button host-leak OK (161 … 966 …)`, modal 228, input 15 kinds/176, checkbox 7 kinds/116, prose 106 [212] |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |
Plugin tree status after all gates: clean except the two comment edits, then committed (`992375b6`).

## Docs
- Superproject `CHANGELOG.md` `## Unreleased`: one SC-540 bullet in plain words.
- `.repo-docs/`: there is no existing note on SC-522's interactive-child mark (it lives in the `livePreviewScrollHold.ts` comment), so no architecture note was added; the `armClickShield` comment is the home and the livePreviewScrollHold comment now points to it.
- dse-verify proposal written (not applied): `sc540-r1-dse-verify-proposal.md`.

## Drive-by fixes:
- G-S57's header comment in `visual-harness/obsidian-lifecycle.mjs` said "a click in a callout opens it as source, SC-540"; reworded (comment only). `livePreviewScrollHold.ts` comment gained a pointer to the callout case. Both are comment-only, named in commit `992375b6`.

## Follow-ups:
- Mod+A with focus in a DSE input inside an LP callout: the `interactive-child` mark changes it (select the input's text, not the whole note); read from app.js @2662579 only, not measured in a callout. Probably worth one real-Obsidian probe by the reviewer (SC-522 r3 measured it for embeds).
- Double-click inside a DSE card in a callout: not probed (the class is also read by canvas code, but the LP callout handler only reads it in the click path, so I expect no change).
- SC-463 (older Backlog ticket, same bug) can be closed as a duplicate at landing, as the ledger says; SC-520's `preventDefault` on the chrome click is now redundant for the callout case but harmless.
- Probe keyboard note: I used `focus({ focusVisible: true })` + a real Enter key (as G-S57 does) rather than real Tab navigation into the card.
- The harness leaves `/tmp/dse-obsidian-lifecycle-*` directories whenever a screenshot was taken (194 old dirs exist in /tmp, none of them mine now; I removed the ones my runs left by literal path).

## Artifacts (absolute paths)
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r1-impl-report.md`
- Proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r1-dse-verify-proposal.md`
- Screenshots: `…/sc540-r1-base-callout-raw-after-plus.png`, `…/sc540-r1-head-callout-card-after-plus.png`
- Evidence: `…/sc540-r1-evidence/` (probe summaries, `lc-g62-*.log`, `gate-*.log`, `jest-*.log`, probe and bundle scripts)
- Probe JSON/PNGs per case: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r1-impl-a1/out/`; bundles: `…/sc540-r1-impl-a1/bundles/{base,head1,nocallout}/`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source` (plugin `draw-steel-elements` HEAD `992375b6`, superproject HEAD `5a18ee74`)
