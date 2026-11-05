# SC-520 r2 scoped re-review report

## Executive summary
- VERDICT: **LAND** (code-wise; the two visible changes still need Scott's answer to the batched ask already in flight). Reviewed the r2 delta dse `d5ced02..32fcace` (r1 commits rebased unchanged per `git range-diff ed368f6..43d57e5 9be397e..32fcace`: 2/3 `=`, 1/3 only the lifecycle header), superproject `7b6065c4..49367042`.
- Findings: **0 HIGH, 0 MEDIUM, 0 LOW, 3 INFO**. r1 MEDIUM-1, LOW-1, LOW-2, INFO-3 fixed as ruled; INFO-2 (sidebar chrome) now exercised and OK.
- INFO-1: the `--dse-chrome-inset` override also reaches nested chrome anchors (a party `hero_ref` / feature effect holding a `ds-counter`: nested inset 24px vs 10px at top level), but nested roots draw no panel and no one-liner, so nothing moves. Tightening optional (selector below).
- INFO-2: rest pixels in Live Preview callouts differ from base by up to 9/255 (montage; most elements 8/255) — the card shadow, no longer cut at the content box. DESIGN.md:353 says "at most 5/255": reword to "a few levels (< 10/255)".
- INFO-3: rebase hazards clear: SC-518 (focus hand-back reads `currentTarget`, all focus calls `preventScroll`, no `defaultPrevented` readers) and SC-479 (pin targets `.markdown-preview-view` only); Reading-view scroll pin holds with the callout as the sideways scroller (scrollTop 2211 in all 179 frames, base same).
- Battery on `32fcace` (branch worktree): tsc/lint clean; jest `6155 passed / 1 skipped / 248 of 249`; lifecycle halves `21/21` + `21/21` = 42/42 (G-S42, G-S49, G-S50 ok); e2e `124/124 ok, 0 failed, 0 known-bug, 87/87`; shots 592, 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze `280/280`; parity `0 / 0 / 24` — all = targets.

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-rereview-w5t9/` (`$R`).

## Method
Detached scratch checkouts `$R/dse-head` (32fcace), `$R/dse-base` (9be397e), `$R/dse-r1` (d5ced02 = r1 rebased), bundles `$R/bundle-*`, plus `$R/bundle-noF` (head minus rule F). Probes `$R/rv-common.js` + `$R/rv-r2.js` (= `$R/rv-r2-full.js`) spliced into the scratch checkout's own lifecycle harness (`$R/rv-run.sh`, `$R/r2-run.sh`, port 9341), real Obsidian 1.15.0, CDP mouse/wheel. Battery via `$R/gate.sh` in the branch worktree.

## 1. Fixes as ruled (`styles-source.css:16953-16963`)
- First-child narrowing reliable, LP and RV (`$R/head-r2.log.jsonl`, summary via `$R/summ.py`): rules match for block first after a blank `>` line, after an HTML comment, inside an inner callout, a wide-table callout, and all 20 chrome element types (`cc visible/flow-root`, `callout overflow-x auto`; inset 24px LP / 10px RV). They do NOT match for a block second after text, after an `&nbsp;` paragraph, or second in a wide-table callout (`cc auto/block`, `callout hidden`, inset 10px) — base behaviour exactly.
- Base vs head (`$R/cmp-r2.txt`, base `$R/base-r2.log.jsonl`): panel moves only in Live Preview callouts with the block first (dx -14px, dy 0, all 20 types + the edge cases); Reading view, top level, block second, party at top level: dx 0, dy 0. Rest pixels identical (0 px) for top level, block second (incl. wide), nested-inner, stamina bar, skills, scc in both views; shadow-only changes elsewhere (INFO-2).
- Hits (5x3 grid over every panel button, 9x7 over `</>`): head 15/15 on every button of every case, LP and RV, `</>` 63/63 in every LP case. Base: 0/15 for block-first cases (title clip), 5/15 for statblock/featureblock/negotiation/scc, 15/15 for block-second/top (as in r1).
- Wide table: G-S49's new phase scrolls it (head ok in lc2); `bundle-noF` FAILS `G-S49 FAIL: Live Preview, wide table, block first: the table sticks out 2262px past the callout but nothing scrolls sideways` (`$R/gs49-noF.log`).
- LOW-1: `bundle-dse-r1` (r1 rebased) FAILS the head harness's G-S49 `"Collapse Stamina bar" is covered 19px of 26px across, 4px down: elementFromPoint there is div.embed-action.edit-block-button` (`$R/gs49-r1.log`); head ok.

## 2. Nested chrome anchors (implementer follow-up)
- Nested chrome roots ARE possible: a `ds-party` member `hero_ref` holding a ` ```ds-counter ` fence (the G-S6h fixture) and a `ds-feature` effect holding one both render a nested `[data-dse-element="counter"][data-dse-chrome]` with a `.dse-chrome-anchor` (`$R/head-r2b.log.jsonl`, NEST records). In a block-first LP callout the nested anchor computes `--dse-chrome-inset: 24px` (top level: 10px).
- But the nested roots are read-only and carry no `.dse-chrome` panel and no `.dse-chrome-summary` (LP and RV, callout and top level); hovering the nested card reveals nothing. So the override changes nothing visible today.
- Judgment: no fix required. If the owner wants it future-proof (a nested root that one day draws a panel), tighten rule 3 to the outer root only:
  `.markdown-source-view.mod-cm6 .cm-callout .callout-content > :first-child > [CH].dse-chrome-anchor, .markdown-source-view.mod-cm6 .cm-callout .callout-content > :first-child > [CH] .dse-chrome-anchor:not([data-dse-element] [data-dse-element] .dse-chrome-anchor, [data-dse-element] [data-dse-element].dse-chrome-anchor)` (not tested live).

## 3. Sidebar view chrome (r1 INFO-2 leftover)
- `$R/head-r2.log.jsonl` SIDEBAR records: pinned by a real click on Pin (Reading view) from a block-first callout and from the top level, sidebar revealed, items `edit, unpin, collapse, expand`; real mouse in the sidebar panel: Collapse hit + collapsed, Expand hit + expanded, Edit hit + only the edit form opened; note unchanged beyond the anchor line. Both sources identical.

## 4. Rebase hazards
- SC-518: `mountChrome.ts` diff vs 9be397e is exactly r1's 11 lines; SC-518's `formOpenerOf` reads `currentTarget` inside the button's own handler (runs before the panel's bubble listener); no `defaultPrevented` reader in `src/` except keydown paths (`managedModal.ts:113`, `StaminaBarPanel.ts:197`); `HANDOFF_FOCUS` and the plain path both use `preventScroll: true`, so a sideways-scrolled callout is never scrolled by the hand-back. G-S50 ok (lc2).
- SC-479: `previewScrollPin.ts` targets `.markdown-preview-view` explicitly (no generic nearest-scroller search). Probe R2-PIN (`$R/head-r2b.log.jsonl` vs `$R/base-r2.log.jsonl`): tall note, Reading view parked at 2211 on a block-first callout with a counter and a wide table, callout scrolled sideways 120px by a real wheel (head: `.callout`; base: `.callout-content`), real click on Increase -> write landed; scrollTop 2211 in every one of 179 (head) / 174 (base) frames; the sideways scroll resets to 0 after the write in both (pre-existing: the callout is redrawn). G-S42 ok (lc2).

## 5. Test validity
- G-S49 discriminates: r1 build FAIL (Collapse edge), F-less build FAIL (wide table), head ok (`$R/gs49-r1.log`, `$R/gs49-noF.log`, `$R/battery-lc2.log`). Shots of the failures were left in the harness's own kept temp dirs.
- jest (`$R/jest-revert.sh`, scratch checkout): head 70/70 (`$R/jest-r2-head.log`); with r1's `styles-source.css` (d5ced02) 4 failed / 66 passed (`$R/jest-r2-on-r1css.log`); restored (`$R/jest-revert-status.txt`: only my untracked probe file).

## Docs
- CHANGELOG bullet (superproject `49367042`): plain and accurate (menu a little further left in LP callouts; wide content scrolls the whole callout, title included).
- DESIGN.md:353 "at most 5/255": measured up to 9/255 (INFO-2) — reword.
- CSS comment `styles-source.css:16915-16952`: accurate (flow-root reason corrected; trade-off stated).

## Battery (branch worktree, dse 32fcace; `$R/battery-*.log`)
- tsc `GATE tsc rc=0`; lint `GATE lint rc=0`.
- jest `Tests: 1 skipped, 6155 passed, 6156 total`, `Test Suites: 1 skipped, 248 passed, 248 of 249 total`.
- lifecycle `battery-lc1.log` `done: 21/21 ok, 0 failed`; `battery-lc2.log` `done: 21/21 ok, 0 failed` (42 ids incl. G-S42, G-S49, G-S50).
- e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots `GATE shots rc=0`: 592 PNGs, 0 FAIL; button host-leak OK (145 kinds, 870), modal button host-leak 228, input 15 kinds / 176, checkbox 7 kinds / 116, prose 106 [212], chrome placement OK, host-copy pin OK, expected `OBSIDIAN APP.CSS PIN DRIFT` warning.
- freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, `GATE parity rc=0`.

## Also checked
- Collapsed one-liner first in a callout (`collapsed: true`, `$R/collapsed-dse-head.log.jsonl`): LP Expand sits below `</>` (Expand top 270.5, `</>` bottom 260.6), `</>` 15/15, a real click on Expand expands with the cursor unmoved; RV same. (Expand's 5x3 grid reads 12-13/15 because its corner points hit the rounded corners; base RV identical, `$R/collapsed-dse-base.log.jsonl`.)

## Cleanup
- Scratch worktrees `$R/dse-head`, `$R/dse-base`, `$R/dse-r1` removed (`git worktree remove --force`, rc=0; none left in `git worktree list`). Branch worktree as found: superproject ` M draw-steel-elements` (pointer not bumped), dse clean at `32fcace`, superproject head `49367042`.
