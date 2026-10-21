# SC-470 r5: scoped re-review of the r4 delta (737a099 + 1c271b5 on 0ce76dd)

## Executive summary
- **Verdict: APPROVE.** All five r3 findings are fixed as the owner ruled, and each fix is proved live with my r3 probe. The new MutationObserver adds no leak, no feedback loop, and negligible cost. No new findings; 4 INFO notes.
- **HIGH-1 fixed:** embed 535/535 px and on-screen text unmoved, on 150/150 pinned frames in each of 2 reps (was 535 -> 4024 and moved 3489 px).
- **MEDIUM-1 fixed:** the floor now follows Obsidian's growth, px `[5565, 5581 … 5901]`. It never lowers on a collapse, and it is never below scrollTop + clientHeight (headroom at least 1829 px in all variants).
- **MEDIUM-2 fixed:** closing a popout while pinned leaves no pin (scroller unpinned, popout observer disconnected).
- **LOW-1 / LOW-2 fixed:** the id comment is corrected, and 13 new or rewritten tests drive the floor through inline min-height writes.
- **Observer:** about 2-10 callbacks per pin; 6.8 ms of callback time in total across 45 pins. An idle pin (a `modify` with no rebuild) got 0 callbacks and px stayed flat, so the floor does not feed itself. 0 live observers after every release, TTL and disable.
- **Gates measured:**
  - tsc rc=0, lint rc=0;
  - jest 5428 passed / 1 skipped / 231 of 232;
  - G-S8 + G-S15 ok 2/2; with the style append disabled, G-S15 FAILs 2/2 and G-S8 FAILs 2 of 3 (the third run tripped G-S8's own rebuild guard);
  - lifecycle `30/30 ok, 0 failed`;
  - e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
  - r4 changed no CSS, so freeze 276/276 and parity 0/0/24 are r4's numbers.
- **Rebase:** the `obsidian-lifecycle.mjs` diff from 0ce76dd to 1c271b5 adds only SC-470 lines (header + G-S15, byte-identical to the G-S15 reviewed in r3). SC-326's G-S13 is untouched. **Tree:** dse porcelain is empty at 1c271b5; superproject ` M draw-steel-elements` (unstaged pointer), HEAD bb1addf.

## Per finding (evidence: `sc470-r5-probe1-mine.log` and the `sc470-r5-*-mine-probe1.json` files)
- **HIGH-1** `previewScrollPin.ts:150` `pinRule` uses `> .markdown-preview-sizer`; the header matches.
  - R3-EMBED, rep0 and rep1: pin frames 150/150, embed height 535..535, marker top 150..150. The nested sizer kept its own computed min-height of 510px.
  - jest: `the pin rule targets the scroller's own sizer only`.
- **MEDIUM-1** `previewScrollPin.ts:261-281` (observer + `raise`), re-pin at `:236-243`. R3-REPIN, 10 writes 300 ms apart, st0 2779:

  | variant | px sequence | released after last write | scrollHeight after release |
  |---|---|---|---|
  | grow | `[5565,5581,…,5901]` (tracks Obsidian) | 2511 ms | 5965 (natural) |
  | toggle | `[5565]` (no ratchet) | 2513 ms | natural |
  | shrink | `[5565]` (collapse to 1686 never lowers it) | 2512 ms | 5317 (natural) |
  | growbig | `[5565, 8360.17]`, then a fresh pin at 7165 (one write took 4.7 s, past the TTL) | 2502 ms | 7165 (natural) |

  - All four: headroom min 1829 px, scrollTop 2779..2779, computed min-height == px at every collapsed frame, at most one `<style>`.
  - R5-OBS (synthetic sizer replacement mid-pin): a replacement with inline 6565 raised the rule to 6565 and it matched the new node (computed 6565). A replacement with inline 100px kept 6565. After restore and the TTL: no pin, computed back to Obsidian's 5501px.
- **MEDIUM-2** `previewScrollPin.ts:233` (sweep), `:284-295` (sweep, `releaseWindow`); `registerFrameworkElements.ts:58` (`window-close`).
  - R3-POPOUT (d): popout pin 29, popout leaf detached 150 ms later.
  - 4 s later the scroller is unpinned (was "25" still pinned at 03e589c) and the popout window's pin observer reads `disconnected 1, live 0`.
  - Disable and enable afterwards: no errors.
- **LOW-1** `previewScrollPin.ts:141-147`: the comment now says ids are unique within one plugin load. Measured: ids restart at "1" after re-enable, with 0 styles surviving the disable.
- **LOW-2:** the new describe `the pin is a floor (re-pin and observer)` (6 tests) drives inline min-height writes, collapse, a replaced sizer, disconnect at TTL and `releaseAll`, and no re-entry. The old padding test now uses Obsidian's inline value. The test count matches jest 5410 -> 5428.

## New-risk probes (the observer)
- **Leaks:** pin observers are disconnected 1:1 with pins (R5-OBS: 45 created, 45 disconnected, live 0).
  - Disable 0 ms into a pin: live goes 1 -> 0, with 0 styles and 0 attributes left.
  - R3-LEAK as in r3: 6 spaced pins and a burst of 20 writes leave 0 styles; modify listeners go 11 -> 9 -> 11 across disable/enable.
- **No self-feeding:** an idle pin (`vault.trigger('modify')`, no rebuild) got 0 callbacks over 151 pinned frames, px stayed `[5565]`, and it released at the TTL. Our `<style>` rewrite lives in `<head>`, outside the observed subtree.
- **Cost (R3-COST at load about 12; every kind is about 2x r3's figures):**
  - shipped rule: set 4.2-4.4 ms, clear 4.2-8.3 ms;
  - for comparison, the old custom property: 305-433 ms set, 388-402 ms clear;
  - listener 0.4 ms;
  - observer callbacks 6.8 ms in total across 45 pins and 10,341 mutation records.
- **Blast radius (R3-BLAST) is unchanged from r3:** 0 pin events for a non-DSE note, a view at the top, Live Preview, Source, another file, or a rename/delete. The renamed note pins under its new path.

## INFO
- **I-1:** growbig's floor reached 8360 px against Obsidian's final 7101 px (about 1259 px over, more than r4's about 740 px). It was bounded by the TTL: scrollHeight after release was natural, and nothing clamped. That is inside the owner's ACCEPT ruling, so I am not re-raising it.
- **I-2:** if the leaf navigates to another note while pinned, the floor follows that note's inline min-height (the scroller is reused). The effect is bounded by the TTL, and the pin carrying across navigation predates SC-470. No action.
- **I-3:** in one of the 3 style-append-disabled G-S8 runs, G-S8 stopped at its own anti-vacuity guard ("the write did not rebuild the tracker", load about 13) instead of the scroll assertion. The other 2 runs FAILed on the scroll assertion (2779 -> 2001), and G-S15 FAILed 2/2 on all 3 phases. The guard worked as designed; this is not a product issue.
- **I-4:** R3-POPOUT (c) this time saw no mirrored copy in a popout opened during a main pin (r3 saw one, later removed). That is Obsidian's mirroring timing; in both cases 0 copies remain after the release.

## Gates (1c271b5, all in the foreground)
| gate | result | log |
|---|---|---|
| tsc / lint | rc=0 / rc=0 | `sc470-r5-tsc.log`, `sc470-r5-lint.log` |
| jest | 5428 passed / 1 skipped, 231 of 232 suites | `sc470-r5-jest.log` |
| G-S8,G-S15 (mine) | 2/2 ok | `sc470-r5-summary.log` |
| style append disabled | G-S15 FAIL 2/2; G-S8 FAIL 2/3 (scroll), 1/3 (rebuild guard) | `sc470-r5-summary.log`, `sc470-r5-disc-norule-G-S15-FAIL.png` |
| lifecycle (port 9372) | `OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed` | `sc470-r5-lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` | `sc470-r5-e2e.log` |
| shots / freeze / parity | not re-run: r4 changed no CSS (737a099/1c271b5 touch only `src/` and `test/`). r4: 572/0, 276/276, 0/0/24 | `sc470-r4-fix-report.md` |

## Hygiene
- **Bundles** (`sc470-r5-build.log`): `mine` 3deeda2ac897, `norule` 79f8d0332427. The temporary source mutation was reverted by `git checkout`.
- **Probe** injected and restored by `sc470-r5-run.sh`. The probe file is `sc470-r5-probe.mjs.txt`: the r3 probe plus a counting MutationObserver wrapper and R5-OBS.
- **Cleanup:** I deleted 3 lifecycle temp dirs from my no-rule FAIL runs and the `main.js`/`styles.css` my builds left, all by exact path. No processes are left.
