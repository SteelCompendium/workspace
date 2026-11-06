# SC-526 r2 implementer report

## Executive summary
1. STATUS DONE. dse branch sc526-recoveries-popover-hostleak = d40197c4 on origin/develop 248e202b (rebased from d689b719 mid-task per owner message; full battery re-run after). Superproject head 643185bb on origin/main 1ee7c9af. Nothing pushed, no tags.
2. dse commits: 179389d5 (option A CSS + 5 jest tests, ported from 8266ea0, A30 dropped) and d40197c4 (sweep popover mount + 4 jest tests). Superproject 643185bb = CHANGELOG bullet only (dse pointer bump left unstaged for the dispatcher).
3. Gates on d40197c4: tsc+lint rc 0; jest 6479 passed / 1 skipped / 256 of 257 (6470 + 9: 5 hostRegrounding + 4 fixtures); lifecycle 51/51 (21+16+9+4+1); e2e 128/128, 89/89; shots 592 0 FAIL, button host-leak 163 kinds / 978 comparisons, 34-record boundary identical; 592 PNGs sha256-identical to origin/develop 248e202b; freeze 280/280; parity 0 gap / 0 undeclared / 24 declared.
4. Anti-vacuity: (a) CSS reverted -> rc 1 VIOLATED 164 problems on hero|dse-stamina-rec__pop-btn/-cb; (b) pips click removed -> rc 1, named FAILs for dark and light.
Evidence dir: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r2-impl-k7m2/ (logs listed below).

## Changes
- styles-source.css: option A block G (SC-203 family) re-applied cleanly by rebase, no conflicts.
- visual-harness/shoot.mjs: button sweep prefs 'authoringControls:true,staminaRecoveryPopover:true'; mountClickRevealedForSweep(page,bg,problems,{recoveriesPopover:true}) (button sweep only; input/checkbox sweeps pass nothing, popover has no inputs/checkboxes) ends with openRecoveriesPopoverForSweep: real click on gallery hero .dse-stamina-rec__pips, waits for exactly one .dse-stamina-rec__pop with 3 visible buttons (named problem otherwise); SC526_EXPECT + assertSc526Tagged name 'hero|dse-stamina-rec__pop-btn' / '-cb'. The SC-513 "NOT mounted/open gap" comment rewritten to describe the mount; SC-527 "will add" comment updated to present tense.
- test/dom/visual-harness/fixtures.test.ts: describe 'Recoveries popover mount for the button host-leak sweep (SC-526)', 4 tests (wiring/last-click order; real fixtures: one pips row, click opens 3-button popover only with pref; popover adds exactly the 2 kinds to tagButtons keys; assertSc526Tagged names missing kinds).
- CHANGELOG.md (worktree superproject) bullet under Unreleased.
conditions-modal.test.ts selector-list pin: passes (section-B list order preserved).

## Gates (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r2-impl-k7m2/)
tsc2.log rc0; lint2.log rc0; jest-full2.log rc0; lc1..lc5.log (rc0; 183 s, 330 s, 356 s, 295 s, 180 s); e2e.log rc0 "OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs"; base2.log (develop shots, rc0, 161/966), final2.log (rc0, 163/978), base2-592.sha256 vs final2-592.sha256 identical; freeze2.log "freeze OK (280/280 ...)"; parity.log rc0.
Log diff base2.log vs final2.log: only the button host-leak count line and harness.css size. Boundary: 34 records (32 focus-visible disabled, 2 hover no hit point initiative|dse-btn.dse-init__stamina) identical, no popover kind in it. modal 228, input 15/176, checkbox 7/116, prose 106 [212] unchanged. (The shots dir also holds 28 stale sc526-* r1 camera PNGs, excluded from the 592 comparison.)
Pre-rebase run on d689b719 (superseded, also green): jest 6469, lifecycle 21/16/9/4 (pre-rebase-lc*.log), shots 163/978, PNGs identical (final-shots.log, base-develop.log).
Anti-vacuity logs: av-a.log (rc1, "BUTTON HOST-LEAK VIOLATED ... dark|rest|hero|dse-stamina-rec__pop-btn: ... height 17.98 -> 30", "... and 124 more" = 164), av-b.log (rc1: "dark: clicking the hero Recoveries markers ... opened no popover holding its three visible buttons (SC-526)", "dark|light: the sweep tagged no hero|dse-stamina-rec__pop-btn / -cb button"). Both reverted; trees clean.

Drive-by fixes: none.
Follow-ups: none new. Note the dse-verify SKILL part-4/5 split: G-S59 precedes G-S56 in SCENARIOS, so part 4 = G-S57 G-S62 G-S61 G-S56 (4) and part 5 = G-S59 (1), as in the skill; the brief's "G-S56 last, its own part" wording differs.
