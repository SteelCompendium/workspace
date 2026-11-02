# SC-537 r4 fix report (r3 review findings + rebase)

## Executive summary
1. Verdict: DONE. HIGH-1, MEDIUM-1, LOW-1, LOW-2 and the INFO count assertion are folded in; MEDIUM-2 (SC-544) and the plugin off/on tangent (SC-545) left alone as ruled.
2. Plugin HEAD `aca83702` on branch `sc537-lp-callout-twins`, rebased onto origin/develop `88cb7db9` (SC-539, e2e harness only). Superproject `4380db57` (CHANGELOG only, no pointer bump), rebased onto origin/main `07710b0f`. Conflicts: only `obsidian-lifecycle.mjs` (kept G-S52, G-S57, G-S56 in that order; G-S57 runs before G-S56).
3. Fix: the editor pass now also runs on `viewportChanged` and `selectionSet` (one guard line); `quoteOrdinal` takes a per-pass block-list cache and a narrowed selector.
4. Red to green: 3 new jest cases red on the r2 source, green now. G-S57 phases (f) far-apart and (g) title click FAIL on a 4e3de39c bundle and PASS on HEAD. G-S57 (a)-(g) all FAIL on an ad018cd-without-fix bundle (develop at that point).
5. Mutants (jest `twin-reuse.test.ts`): r2's 1/2/3 -> 7/8/2 red; new 4 (guard back to docChanged only) -> 2 red; new 5 (no per-pass cache) -> 1 red. Tree clean after each.
6. Gates: tsc/`tsc -p e2e`/lint clean; jest 6255 passed / 1 skipped / 249 of 250 (6245 + 7 + 3); lifecycle 46/46 as 21 + 16 + 9 (188 s, 329 s, 357 s); e2e 124/124, 0 known-bug, 87/87 (with the "pointer parked at 0,0" line); shots 592, 0 FAIL, 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24.
7. Cost (LOW-1, jsdom, fake LP editor, per update): 40-block callout 143.8 ms -> 25.7 ms; 1-block callout 2.13 -> 1.47 ms. Not measured in real Obsidian (see Follow-ups).
8. Run order note: jest, lifecycle and shots ran on `9a5becc6` (before the last rebase); the rebase onto 88cb7db9 changed only `e2e/`, so tsc/lint, e2e and parity were re-run on the final HEAD.

## Changes
- `src/framework/host/livePreviewReconcile.ts`: guard is `if (!update.docChanged && !update.viewportChanged && !update.selectionSet) return;` (HIGH-1 and MEDIUM-1: a twin whose widget is off screen or raw source when the write lands is handed the writer's widget all the same, and CodeMirror attaches it later in a scroll or selection update).
- `src/framework/host/ReadingModeBlockHost.ts`: `quoteOrdinal(el, alias, cache?)` reads a callout's block list with `div.block-language-X, pre > code.language-X` (was every `div, code` in the callout) and memoizes it per pass; `fenceOnElement(..., blocksCache)`; `reusedBlockBody` passes `scope.blocks`. Same filtering as before (not inside a `[data-dse-element]`).
- `src/framework/host/remountReused.ts`: the per-pass scope carries `blocks: new Map()`.
- Tests: `twin-reuse.test.ts` +3 (viewport-only update after the widget is attached; selection-only update; a pass over a 6-block callout reads the block list once). `livePreviewScrollHold.test.ts` wiring test asserts the scroll-hold extension (spy on `LivePreviewScrollHold.prototype.extension`) is among the registrations, no count. SC-522's `expect.any(Function)` argument line kept.
- Lifecycle G-S57: fixture `Lifecycle/twin-callouts-far.md` (callout, 150 paragraphs, callout); phase (f) far-apart: only the first card on screen at open (checked); + upper (cursor stays), scroll to the lower, its card must equal disk, + lower, scroll back, then form Save on the upper, scroll, + lower: names stay [Edited, Twin]; phase (g): real click + on the upper, 100 ms, real click on the lower callout's title; anti-vacuity: the cursor is inside the lower callout afterwards; park; cards = disk; + lower -> [6,6]. `formSave` helper shared with (b). G-S57 does not rely on leaf state (it opens its own notes and sits before G-S56).
- `.repo-docs/architecture.md` row updated; superproject `CHANGELOG.md` bullet now says far-apart callouts and a title click right after the + are covered (the rapid-click case is not mentioned).

## Red to green
- Jest on the r2 source (`sc537-r4-red-jest-on-r2-source.log`): the 3 new cases red (27 total in the file, 24 pass); on HEAD 27/27.
- G-S57 on a 4e3de39c bundle (`sc537-r4-red-lifecycle-gs57-on-4e3de39c.log`): (a)-(e) pass (they are r2's cases); (f) FAIL: the lower card shows 6 with disk [6,5] after the scroll, + lower gives [7,5], form Save case names [Twin, Twin] with [6,5]; (g) FAIL: cards [6,6] with disk [6,5], then [7,5].
- G-S57 on an ad018cd-without-fix bundle (`sc537-r4-red-lifecycle-gs57-on-ad018cd.log`): all of (a)-(g) FAIL with the r1 numbers ([7,5]; names [Twin, Twin]; [7,5,5]; [7,3,5,3]; nested [7,5]) plus (f) and (g) as above.
- G-S57 on HEAD: ok. Cards equal disk in every step; (f) after the scroll the lower card reads 5 with disk [6,5], + lower [6,6]; form Save case [5,5] -> [5,6] with names [Edited, Twin]; (g) [6,5] -> [6,6].

## SC-522's `interactive-child` and SC-540's symptom
- SC-522 puts `interactive-child` on DSE roots only when `root.closest('.cm-content .internal-embed')` (`pipeline.ts:202`): embeds, not callouts. A real click on + in a Live Preview callout still opens the callout as source (SC-540): in G-S57 the cards read right after a click without parking are `[]` ((f) click upper / click lower / form Save then click lower), and the cursor is inside the clicked callout in (g). The park-the-cursor steps still read every card correctly; (f) deliberately does not park (that would scroll back to the top) and reads the cards on screen after the scroll.

## Mutants (jest `twin-reuse.test.ts`; logs `sc537-r4-mut-N-jest.log`)
1. `reusedBlockBody` without the LP section: 7 red.
2. listener without the editor (`reconcile(path)`): 8 red.
3. no `lastWriteLine` skip: 2 red (1 new, 1 SC-481).
4. guard `docChanged` only (drops `viewportChanged`/`selectionSet`): 2 red (the two new update-kind cases).
5. no per-pass block-list cache: 1 red (the block-list case).

## Gates (logs `sc537-r4-gate-*.log` in the ledger dir)
- tsc, `tsc -p e2e`, lint: rc 0 (final HEAD).
- jest (`9a5becc6`): 6255 passed / 1 skipped / 6256 total, 249 of 250 suites.
- lifecycle (`9a5becc6`), three `--only` calls, 46/46:
  - part 1 (21): G-S7a, G-S7b, G-S6a, G-S6b, G-S6u, G-S28, G-S5n, G-S1, G-S2, G-S3, G-S4, G-S5, G-S6c, G-S6d, G-S6e, G-S6f, G-S6g, G-S6h, G-S6i, G-S8, G-S9a: 21/21, 188 s.
  - part 2 (16): G-S9b, G-S9d, G-S9e, G-S9f, G-S9c, G-S10, G-S11, G-S12, G-S13, G-S15, G-S14, G-S18, G-S32, G-S36, G-S33, G-S40: 16/16, 329 s.
  - part 3 (9): G-S45, G-S44, G-S42, G-S50, G-S53, G-S54, G-S52, G-S57, G-S56: 9/9, 357 s (run order is the file's: G-S57 before G-S56).
- e2e (final HEAD `aca83702`): `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; log has `pointer parked at 0,0 on :200`. Run once, no CHR-F02.
- shots (`9a5becc6`, foreground call moved to the background at 600 s, rc line read from its own log): 592 PNGs, rc 0, 0 FAIL, button 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212].
- freeze (`9a5becc6` shots): `freeze OK (280/280 ...)`, no rebaseline. parity (final HEAD): 0 gaps / 0 undeclared / 24 declared.

## Drive-by fixes
- None.

## Follow-ups
- LOW-1 cost in real Obsidian was not re-measured (the r3 reviewer's 40-block figure was 16-18 ms per keystroke before). jsdom shows 143.8 -> 25.7 ms; the remaining cost is per-block `locateInSectionLines` over the callout's lines (O(blocks x window lines)) plus one block-list read. If it matters, narrow that next.
- The pass now runs on every scroll frame for a note with DSE cards: it is one loop over live entries (`dom.contains`), no text read unless a callout widget in that editor is judged; one `doc.toString()` plus one split per pass in that case.
- MEDIUM-2 (SC-544) and the off/on tangent (SC-545): untouched, as ruled.
- SC-540 (click opens the callout as source) is unchanged by SC-522 (it covers embeds only).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/` unless noted)
- This report: `sc537-r4-fix-report.md`
- Screenshot (far-apart, after the fix: lower card reads 5 after + on the upper, disk [6,5]): `sc537-r4-far-apart-lower-card-5-after-upper-click.png`
- Red logs: `sc537-r4-red-jest-on-r2-source.log`, `sc537-r4-red-lifecycle-gs57-on-4e3de39c.log`, `sc537-r4-red-lifecycle-gs57-on-ad018cd.log`
- Mutants: `sc537-r4-mut-1-jest.log` ... `sc537-r4-mut-5-jest.log`
- Gates: `sc537-r4-gate-tsc-lint.log`, `-jest.log`, `-lifecycle-1.log`, `-lifecycle-2.log`, `-lifecycle-3.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`
- Scratch (scripts, 4e3de39c and ad018cd bundles): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r4-impl-b1/`
