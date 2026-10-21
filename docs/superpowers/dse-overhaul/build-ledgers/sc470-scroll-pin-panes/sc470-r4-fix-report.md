# SC-470 r4 fix report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (one: the floor can overshoot Obsidian's final height, bounded by the TTL; see Concerns).
- dse head `1c271b5` on base origin/develop `0ce76dd`; superproject `bb1addf` on origin/main (CHANGELOG bullet kept at the top of Unreleased; submodule pointer not committed).
- Fixed: HIGH-1 child combinator; MEDIUM-1 pin is a floor (MutationObserver) and re-pin applies the same max; MEDIUM-2 sweep + window-close; LOW-1 comment; LOW-2 tests drive inline min-height writes.
- Gates: tsc/lint rc=0; jest 5428 passed / 1 skipped / 231 of 232; lifecycle 30/30; e2e 88/92 ok, 0 failed, 4 known-bug, 64/64 pairs; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24.
- Discrimination (G-S8,G-S15, 2 runs each): base 0ce76dd G-S15 FAIL 2/2 (G-S8 ok); mine both ok 2/2; style append disabled both FAIL 2/2.
- Live proof: embed 535/535 and marker 150..150 over 149/150 pinned frames; floor px sequence [5565..5901] tracking Obsidian; popout closed while pinned releases the pin.
- Cost: listener 0.3 ms, set 1.8-2.4, one floor update (observer 0.2-0.3 + layout 2.3-2.7; one 17.1 outlier), clear 2.2-4.

## Per finding
- HIGH-1: previewScrollPin.ts `pinRule` uses `> .markdown-preview-sizer` (exported for the test); header updated. Test: nested embed sizer does not match, the direct sizer does, document-wide query finds only it.
- MEDIUM-1: `HeldPin.observer` (scroller window's MutationObserver; subtree, childList, attributes with attributeFilter ['style']) raises the rule to Obsidian's inline sizer min-height via `raise()` (rewrites the existing <style> text, never lowers); disconnected in `release()` (so TTL and releaseAll). `pinScroller` re-pin: max(held, inline min-height, scrollHeight - padding). Own writes cannot re-enter: the <style> is in head, the pin attribute is outside the style filter.
- MEDIUM-2: `sweep()` at the top of every `pinScroller` (disconnected scroller or `win.closed`); `releaseWindow(win)`; registerFrameworkElements.ts registers `workspace.on('window-close', (_w, window) => scrollPin.releaseWindow(window))` via plugin.registerEvent.
- LOW-1: id comment now says unique within one plugin load, restarts on reload, safe because releaseAll removes every rule.
- LOW-2: the old padding test now uses Obsidian's inline value (4819) plus padding-inflated scrollHeight; new describe 'the pin is a floor' drives inline min-height writes (larger raises, collapsed never lowers, replaced sizer followed, observer disconnected at TTL/releaseAll, no re-entry, TTL restart).
- 9 new/rewritten tests; mutation checks: descendant selector, no sweep, no observe, can-lower each fail 2-3 tests.

## Live proof (r3 probe, port 9371; logs copied to the ledger dir as sc470-r4-run-*.log)
- R3-EMBED: embed 535 -> max 535 (both reps); marker top 150, range 150..150; inner sizer computed min-height 510px (its own); pin frames 149 / 150. (03e589c: 535 -> 4024, marker 150 -> 3639.)
- R3-REPIN: grow (+1 paragraph per write): px sequence [5565, 5581, 5621, 5661, 5701, 5741, 5781, 5821, 5861, 5901], scrollHeight after release 5965; growbig (+40 paragraphs): [5565, 7838.07] (Obsidian's final 7101, see Concerns); toggle and shrink stay [5565]; headroom min 1829 px and scrollTop 2779..2779 in all four; released 2502-2515 ms after the last write; one <style> at a time.
- R3-POPOUT (d): popout leaf closed while pinned: scroller no longer pinned, main doc 0 styles, no errors, scroller disconnected; (a)-(c) unchanged (rule in the popout's own head). The probe cannot see the Map; the Map/timer state is covered by jest (releaseAll leaves size 0, sweep and window-close tests). Which of window-close or the sweep fired live was not distinguished.

## Concerns
- The floor only goes up, and Obsidian's inline min-height can pass through estimates above its final value: growbig reached 7838px against a final 7101px, so up to ~740 px of bottom phantom space until the TTL release (2.5 s after the last write). Same class as the documented worst case; no clamp. Not changed because the ruling says never lower.
- Leftover in a closed popout's dead document: Obsidian's mirrored copy of a main-window pin style (not ours); dies with the window.

## Drive-by fixes:
none.

## Follow-ups:
- If the overshoot above matters, cap the floor at scrollHeight-derived content once the rebuild settles (needs a design call).
- dse-verify SKILL.md lifecycle row (30/30, G-S13 + G-S15, G-S8 phrase) is the dispatcher's at landing.

## Rebase notes
Conflicts only in visual-harness/obsidian-lifecycle.mjs (header line + end of SCENARIOS): kept SC-326's G-S13 whole and re-applied G-S15; header wording for G-S13/G-S14 adjusted. Superproject rebased cleanly.

## Artifacts
- Scratch (logs, scripts, bundles, probes, screenshot): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r4-impl/
- Copied to ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r4-run-R3-EMBED-mine.log etc. (prefix sc470-r4-)
- This report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r4-fix-report.md
