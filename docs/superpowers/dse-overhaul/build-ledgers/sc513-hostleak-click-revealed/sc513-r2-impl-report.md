# SC-513 r2 implementation report

## Executive summary
- Verdict DONE. Head `324a68d` (single commit) on `sc513-hostleak-click-revealed`, rebased onto origin/develop `c558759` (base moved f89f69f -> 08c086c -> c558759 during the task; superproject worktree ff'd to origin/main `5902c18`).
- Gates on the rebased head: tsc + tsc -p e2e clean; lint clean; jest 6112 passed / 1 skipped / 247 of 248 suites (base 6105, +7 new tests); lifecycle 39/39; e2e 124/124, 0 failed, 0 known-bug, 87/87 pairs; shots 592, 0 FAIL; freeze OK (280/280); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Host-leak: button 145 kinds / 870 comparisons, 28-record boundary; modal 228; input 15 / 176; checkbox 7 / 116; prose 106 <p> [212] + 9 <img> [18] + 7 root props [476] (base 99 [198] / 9 [18] / [462]), green.
- All 592 PNG sha256 identical to r1's f89f69f list (diff empty).
- Anti-vacuity: both breaks rc 1 with named lines (below). Both reverted (tree clean).
- Lifecycle flaked once (G-S14 spaced-crlf, 37/38) on the 08c086c head; re-run 38/38; on c558759 39/39 first run.

## Commits
- 324a68d SC-513: host-leak sweeps mount click-created controls by real click (on c558759; 1fce912/faee4f4 stay on sc513-r1-proto, untouched)

## Files changed (draw-steel-elements)
- visual-harness/shoot.mjs: SC513_EXTRA / SC513_PREFS (rollingEnabled only) / SC513_EXPECT, withSc513Mounts, assertSc513Tagged, sc513WaitFor, expandHeroAbilityBodiesForSweep, mountClickRevealedForSweep; wired into the button, input, checkbox sweeps; prose sweep gallery visit gets the probe hero + body expansion. D deliberately absent, with a comment (SC-526 / SC-527) at the helper.
- visual-harness/entry.ts: gate-only probeSource('hero','probe-inline-abilities') + heroInlineAbilities() (throws if the abilities block is not found).
- test/dom/visual-harness/fixtures.test.ts: +7 tests (describe "click-mount seams for the host-leak sweeps (SC-513)").
- No workspace-level file, no CHANGELOG, no dse-verify edit.

## Boundary (28 records, all legitimate)
26x focus-visible: disabled: {feature, featureblock, statblock, hero} x {rollbar__reset, stepper__btn} (16 new, x2 schemes) + montage|dse-btn, negotiation|dse-btn, party stepper, roll reset, roll stepper (10 base). 2x hover no-hit: initiative|dse-btn.dse-init__stamina. No other new record.

## Prose line
Before (base log): prose host-leak OK (99 bare <p> [198] + 9 <img> [18] + 7 root props [462]). After: 106 [212] + 9 [18] + [476]. Green. The prose visit asserts the expanded probe-hero bodies hold >=1 bare <p>.

## Dice pinning
Folded: mountClickRevealedForSweep runs `Math.random = () => 0.5` after load in the sweep's own page only (same technique the captures' fixedDice use after load). No capture change; PNGs identical; kind counts unchanged vs r1.

## Anti-vacuity (one shots run carrying both breaks; log /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/av.log)
rc 1, "BUTTON HOST-LEAK VIOLATED". (1) SC513_PREFS = [] (no rollingEnabled): per scheme "no ability Roll button (.dse-roll-btn) in the extra feature / featureblock / statblock section — rollingEnabled did not reach it" (6 lines) + 32 "the sweep tagged no <key> button" lines (29 dark / 3 light shown after dedupe). (2) probe hero abilities: []: per scheme "the probe hero (galleryExtra hero:probe-inline-abilities) has no ability expand toggle". Reverted with git checkout.

## Other runs
- Interim 08c086c shots run (before the second rebase): same 145/870, 28 boundary, modal 228, 592 PNG: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/shots-08c086c.log
- Gate-ordered evidence: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/{tsc,lint,jest1,lifecycle,e2e,freeze,parity}.{log,rc}, final shots /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/shots-final-c558759.log, sha list /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/shots-final.sha256. Pre-rebase lifecycle failure: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/lifecycle-run1-fail.log.

## Drive-by fixes:
none

## Follow-ups:
- SC-526 (popover D mount + staminaRecoveryPopover pref) and SC-527 (state-only kinds) remain open, as ruled.
- Lifecycle G-S14 (spaced-crlf) flaked once under load (load avg ~6.5), passed on re-run; unrelated to harness code.
- dse-verify text for the owner to draft: button 145/870 + 28-record boundary, input 15/176, checkbox 7/116, prose 106/9, new SC-513 mount helper, D named open gap SC-526.

---

# r4 fix round (LOW-1, LOW-2 of the r3 review)

## r4 summary
- New dse head `ed368f6` on top of 324a68d (origin/develop unchanged at c558759, no rebase). One commit, no trailer.
- LOW-1: `entry.ts` galleryExtra comment now names the four sweeps (button, input, checkbox, prose) and both the SC-512 and SC-513 sections. LOW-2: test renamed to "absent galleryExtra and prefs keys stay undefined" (kept).
- Build proof (`npm run build`): main.js and styles.css sha256 are equal on 324a68d and the new head (main.js b5a41fccfff5d5fe4ea891d807f9d5be3ba475e1acf6089ca00be179b20e240d, styles.css ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0), so lifecycle 39/39 and e2e 124/124 from 324a68d carry.
- tsc and lint clean; jest 6112 passed / 1 skipped / 247 of 248; shots 592, 0 FAIL, rc 0, button 145/870 + 28-record boundary, modal 228 (6-record boundary), input 15/176, checkbox 7/116, prose 106 [212]; PNG sha256 diff vs r1 f89f69f list empty; freeze 280/280; parity 0/0/24.
- Superproject worktree ff'd to origin/main `b35d9eb`, only dirt ` M draw-steel-elements`.
- LOW-3 untouched (shoot.mjs not edited).
- Evidence: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/r4-*.{log,rc,sha,sha256}, build pair r4-build-old.sha / r4-build-new.sha.
