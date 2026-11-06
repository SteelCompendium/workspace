# SC-349 implementer report, round 1

## Executive summary
- Verdict: DONE. Branch `sc349-skills-print-clip` in the dse worktree, head `d34b0fe`, rebased onto `origin/develop` `0ce76dd` (SC-326) as the owner instructed. Not pushed.
- CLIPPED captures (bytes change once the viewport covers the element): 135 of 572 (all `steel-dark`/`steel-light`/`steel-print`; zero `steel-realprint`).
- Frozen lines that move: 40 (all `*--steel-print.png`), of which skills-only: 8. Non-skills: 32.
- Every non-clipped capture is byte-identical to the base run (437/437 of 572; compared all 572 sha256s). Two proof runs on `d34b0fe` are byte-identical to each other (572/572).
- Freeze on the fixed shots: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`, exactly the 40 frozen clipped lines. A copy of the baseline with `rebaseline.txt` applied passes `sha256sum -c` (rc 0, 276/276).
- New in-run gate `capture clip OK (180 capture(s) taller than the viewport …)` passes; `montage board scroll OK` (SC-326) intact.
- Gates: tsc/lint clean; jest 5416 passed / 1 skipped / 232 of 233 suites; lifecycle 29/29; e2e 88/92 ok, 64/64 pairs; shots 572, 0 FAIL; parity 0 GAPs / 0 undeclared / 24 declared.

## Root cause
The sweep context is 900x1200 CSS px, dsf 2. Screen-media captures (dark, light, and the print-preview twin `steel-print`) load Obsidian's real pinned `app.css` (`sheet=1`), whose rules make `html, body { height: 100% }` and `body { overflow: clip }`: the document is exactly one viewport tall and paints nothing below it. `#mount` is taller than that for many captures, so `page.locator('#mount').screenshot()` returns the element's full height, with everything beyond the viewport painted blank white. Print-media captures (`steel-realprint`) are immune: the sheet's `@media print` block frees body, so the document scrolls and paints in full (confirmed: 41 realprint captures are taller than 2400 and complete; they stay byte-identical).
Reproduced with a probe (scratch `probe.mjs`): `skills` print twin at viewport 1200 reproduced the base PNG sha byte-for-byte; at viewport 5000 it is complete.
Second effect found (not in the ticket): interaction/hover shots (click or hover scrolls the page) leave `#mount` scrolled partly ABOVE the viewport top, so the TOP of the element paints blank. `montage-guide-open--steel-print` (base: top 900 device rows blank, content from the scroll offset on) is that case; also `chrome-hover-*`, `chrome-skills-menu`, `chrome-initiative-menu`. The fix covers both.

## The fix (harness only, `visual-harness/`)
- `capture-viewport.mjs` (new, pure): `enlargedViewportHeight(viewportHeight, bottoms)` and `captureClipProblems(...)`.
- `shoot.mjs` `snap()`: before the screenshot, measure the capture's bottom in PAGE coordinates (rect.bottom plus every ancestor `scrollTop`, since a click scrolls the page; `fullPage` shots measure every body child). If it exceeds the viewport, `setViewportSize` to `ceil(bottom)`, wait two frames, shoot, restore the original size (in `finally`) and wait two frames again so the downstream probes and print-delta snapshots see the normal viewport. A capture that fits takes the old path untouched.
- In-run gate `assertNoClippedCapture()` (next to `assertNestedCornerRadius()`): for every capture, after the shot, the element's bottom must be inside the viewport the shot was taken at; for grown captures `#mount`'s size, scrollHeight and an innerHTML hash must equal their pre-grow values (the top edge is deliberately not compared: it is scroll state). Prints `capture clip OK (N capture(s) …)`, or `CAPTURE CLIPPED — …` and exit 1.
- Other `screenshot(` call sites: only `snap()` writes PNGs; the other is a viewport pixel read inside the chrome-placement gate (no clip issue). `docs-shots.mjs`/`obsidian-camera.mjs` are other cameras, not touched.
- Tests: `test/unit/build/captureViewport.test.ts`, 8 tests (node-subprocess convention of `obsidianLightIslandCompare.test.ts`).
- Commits: `bfcfd99` (grow viewport), `4d15991` (measure in page coordinates), `d34b0fe` (fingerprint ignores scroll-dependent top).
- Iterations that failed first (kept for the record): (1) viewport-coordinate bottoms missed the scrolled twin and broke `assertPrintTwinDelta` (665 px drift between twin and realprint) — fixed by `4d15991`; (2) fingerprint including `top` false-positived the gate on hover/click shots — fixed by `d34b0fe`.

## Layout effect of growing the viewport
Gate-proven for all 180 grown captures: `#mount` width/height/scrollHeight and markup identical before and after growth. Only things sized off the viewport: `html/body { height: 100% }` (body just gets taller; nothing inside depends on it) and `.dse-sb__sticky-inner::before { height: 100vh }` (an absolutely positioned band extending upward; paints outside `#mount`, not in the capture). The page scroll offset resets to 0 on growth (that is what un-clips the scrolled-out top). `steel-realprint` captures also grow (they exceed 1200) but come out byte-identical.

## Clipped list summary
`sc349-clipped-list.txt`: 135 captures (filename, base PNG height, device row where base content stopped, FROZEN/unfrozen). 122 stop at device row 2400; 13 stop elsewhere (hover/click shots at 2490-2544 etc., and light/print captures whose blank tail starts at white content). Frozen 40, unfrozen 95. Two tall light shots (`chrome-hover-hero--steel-light`, `chrome-initiative-menu--steel-light`) are unchanged: their real content below the old edge is white, so they were not effectively clipped. Skills frozen lines (8): `skills`, `skills-narrow`, `skills-chips`, `skills-chips-narrow`, `skills-ledger`, `skills-ledger-narrow`, `skills-hero-picks`, `chrome-skills-menu` (`--steel-print`). Non-skills frozen (32): `ancestry`, `class`, `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-statblock`, `chrome-placement-trio`, 13 `montage*` (montage, -done, -failed, -guide-open, -mid, -narrow, -old-shape, -strip-pinned), 17 `statblock*`, `negotiation-ended`, `negotiation-narrow`. PNG dimensions never change (the base PNGs were already full height).

## Evidence
Base run (aaa88b7): shots 572, 0 FAIL, `freeze OK (276/276 …)`. SC-326 (0ce76dd) left all 572 PNGs byte-identical per the owner, and the 437 unchanged PNGs of the fixed runs match the base hash for hash, which confirms it.
Visual: `skills--steel-print` after shows the Intrigue group (and the rest) where base is blank from row 2400; `montage-narrow--steel-dark` after shows the full board and notes where base is white below row 2400; `montage-guide-open--steel-print` after shows the top (header, test tiers) that base lacks.

## Gate outputs (literal; at head `d34b0fe` over `0ce76dd`)
- tsc (`npm run tsc`, incl. e2e) clean, rc 0; lint (`npm run lint`) clean, rc 0.
- jest: `Test Suites: 1 skipped, 232 passed, 232 of 233 total` / `Tests: 1 skipped, 5416 passed, 5417 total` (5408 + my 8).
- `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed` (DSE_LIFECYCLE_PORT=9349).
- `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
- shots (2 runs, rc 0 both, 0 FAIL, 572 PNGs): `capture clip OK (180 capture(s) taller than the viewport were shot with it grown to cover them, then restored; every capture was taken with its whole element inside the viewport, and growing it moved no layout)`; `montage board scroll OK (14 rounds x 900px pane …)`.
- freeze (fixed shots, shared baseline): `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`; with `rebaseline.txt` applied to a scratch copy of the baseline: `sha256sum -c` rc 0 (276 lines OK).
- parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0.

## Artifacts
- Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`: `rebaseline.txt` (40), `rebaseline-skills-only.txt` (8), `sc349-clipped-list.txt` (135), crops `sc349-r1-skills-steel-print-{before,after}.png`, `sc349-r1-statblock-steel-print-{before,after}.png`, `sc349-r1-montage-guide-open-steel-print-{before,after}.png`.
- Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r1/`: `base-shots/`, `proofA-run1-shots/`, `proofA-run2-shots/`, `*.sha256`, `proofA-run{1,2}.log`, `jest.log`, `lifecycle.log`, `e2e.log`, `parity.log`, `tsc.log`, `lint.log`, `freeze-fixed.txt`, `baseline-with-rebaseline.sha256`, `measure.py`, `probe*.mjs`.
- Shared baseline and `check-freeze.sh` untouched.

Drive-by fixes: none.
Follow-ups: (1) `docs/` and the dse-verify note "negotiation-ended/-narrow captures are cut by the harness's 1200 px viewport" become stale on landing; dse-verify expected numbers (shots line `capture clip OK`, jest 5416) need the usual update. (2) `docs-shots.mjs` and other evidence scripts use their own contexts; not audited for the same clip.
