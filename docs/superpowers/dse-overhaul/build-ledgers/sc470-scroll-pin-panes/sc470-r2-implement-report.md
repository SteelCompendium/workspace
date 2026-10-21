# SC-470 r2 implement report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (one deviation from the ruling's literal Risk 4 formula, see below; one probe flake).
- dse head: `03e589c` on base `aaa88b7` (origin/develop, rebased twice: c03db7a -> e31e1a0 -> aaa88b7). Superproject head `17064b0` on origin/main (CHANGELOG bullet commit `17064b0` before the last handoff-only rebase; submodule pointer not committed, wt-finish does that).
- Gates (measured on aaa88b7 + 3 dse commits): tsc (incl. e2e) rc=0, lint rc=0; jest 5409 passed / 2 skipped / 231 of 232 (fresh, no shots cache), 5410 / 1 / 231 of 232 after shots; lifecycle 29/29 ok; e2e 88/92 ok, 0 failed, 4 known-bug, 64/64 pairs; shots 572 PNGs, 0 FAIL; freeze OK (276/276); parity 0 gaps / 0 undeclared / 24 declared.
- Discrimination (--only=G-S8,G-S15, 2 runs each): base aaa88b7 G-S15 FAIL 2/2 (G-S8 ok); mine both ok 2/2; mine with the style append disabled both FAIL 2/2. Tree clean after.
- Pin cost (P470-COST, 2415-node preview, set+clear first-layout ms): old custom-property pin 391+382 / 403+374 / 294+188; new stylesheet pin 2+15.9 / 1.9+1.9 / 2+2.6.
- External vault.process: collapse after modify 660-736 ms (D2 with custom property) -> 30-67 ms (D2 with stylesheet pin).

## Commits (dse branch sc470-scroll-pin-panes)
1. fix(SC-470): pin every Reading view of a file on vault modify (D2) -- the r1 prototype as is (reviewed; all fail-safes, ownerDocument/defaultView, PIN_TTL_MS kept), incl. its 5 jest tests and the G-S15 scenario.
2. perf(SC-470): per-pin <style> rule instead of the inherited custom property; re-pin never lowers; header rewritten.
3. test(SC-470): stylesheet rule + re-pin tests (6 new; 11 new tests in total with the D2 ones).

## Files changed (dse)
- src/framework/host/previewScrollPin.ts (header; per-pin style; re-pin), src/framework/registerFrameworkElements.ts (modify listener), styles-source.css (static SC-198 rule deleted), test/dom/framework/previewScrollPin.test.ts, visual-harness/obsidian-lifecycle.mjs (G-S15 only). Superproject: CHANGELOG.md.

## Design
- One <style> per pinned scroller (not shared per document): a pin lives 2.5 s, a handful at most, and a style owned by one pin needs no refcounting; release/TTL/releaseAll just remove it. Created in scroller.ownerDocument.head (popout-safe); attribute value is a module-wide unique id; style carries data-dse-scroll-pin-style=<id>. Rule appended before the attribute is set. No custom property.
- Selector kept DESCENDANT as in the old static rule (`.markdown-preview-view[data-dse-scroll-pin="<id>"] .markdown-preview-sizer`), not the child form shown in the brief/probe.
- G-S8 and G-S15 comments mention no CSS rule, so no wording change was needed (G-S8 lines untouched).

## Deviation from the ruling (Risk 4)
The ruling says re-pin px = max(pinned px, current scrollHeight). Literally that reintroduces the SC-198 ratchet: while pinned, scrollHeight reads pinned + the scroller's padding (64 px on 1.14.4: P470-COST shows 5565 vs 5501), so every autosave re-pin would raise the pin by 64 px, i.e. a long typing session grows phantom space without bound. Implemented max(pinned px, scrollHeight - scroller vertical padding): never lowers, raises on real growth, no ratchet. jest: collapsed re-pins (4883, 2446, 246, 0) keep 4883; growth 5400 raises; padding-inflated reads keep 4883. Not verified in a live Obsidian that autosave re-pin is flat; 64 px comes from the cost probe numbers.

## Probe notes
- P470-REPRO with cases b-process,popout-process on the new build timed out ("Runtime.evaluate: timed out after 30000 ms") 3 times at machine load 8-16, then passed 7/7 later at load ~8 (with and without trace). Same probe on the D2 custom-property build passed once. I could not reproduce it with tracing; the popout-only and b-process-only runs always passed. Treat as a probe/load flake but flagging it. G-S15 and the full lifecycle (which opens a split, not a popout) are unaffected.
- Popout redraw (collapse after modify) is noisy on this loaded machine: new 1306-2214 ms, D2-custom-property 805-2079 ms; no measured improvement there.

## Drive-by fixes:
none.

## Follow-ups:
- The sizer selector is a descendant selector (unchanged from SC-198): any nested .markdown-preview-sizer inside the pinned scroller (e.g. inside an embed) also gets the min-height for the pin's lifetime. Unmeasured; related to SC-479. A child combinator (`>`) matched the sizer in the cost probe.
- The P470-REPRO flake above if anyone reuses the probe.
- dse-verify SKILL.md lifecycle row (29/29, G-S15 entry, G-S8 phrase) is the dispatcher's at landing.

## Artifacts
- Logs/scripts/bundles: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r2-impl/ (jest-full.log, jest-full2.log, tsc.log, lint.log, lifecycle.log, e2e.log, shots.log, freeze.log, parity.log, disc-summary.log, run-disc*-*.log, run-cost-mine.log, run-repro*-*.log, probe-cost2.mjs.txt, build.log)
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r2-implement-report.md
