# SC-349 independent review, round 1

## Executive summary
- Verdict: **FIX-REQUIRED**, for one finding: the gallery is still clipped and the new gate reports it as fine. Head `d34b0fe` on `origin/develop` `0ce76dd`.
- Findings: HIGH 1, MED 1, LOW 1, INFO 6.
- Hashes: my head run equals the implementer's `rebaseline.txt` (40/40) and all 572 of the implementer's proof-run hashes. I ran the head three times in all (branch worktree, an instrumented scratch clone and the implementer's run), and all 572 PNGs were byte-identical across them.
- Freeze on head: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`. The failing set is exactly the `rebaseline.txt` set. A copy of the baseline with `rebaseline.txt` applied gives `sha256sum -c` rc 0 (276/276).
- Base `0ce76dd` (my own clone) vs head: 437 PNGs identical, 135 differ, and all 135 are in `sc349-clipped-list.txt`. 0 differ outside the list and 0 listed files stay the same. Every capture that moved had `#mount` taller than 1200 CSS px, so the hard constraint holds. My base hashes equal the implementer's `base.sha256` (572/572).
- HIGH-1: `gallery--steel-{dark,light}` (unfrozen) show 1200 of 24,968 CSS px. The fullPage measurement reads the 100%-tall cascade wrapper, not `#mount`, so the capture never grows, and `capture clip OK` still claims every capture was whole. Fixing it moves no frozen line, so the sanction ask can go ahead in parallel.
- The other checks pass. The gate fails loudly with the fix disabled (rc 1, 20 problems on `--element=skills`). The viewport goes back to 900x1200 before all 572 captures. Hover state survives the growth in every hover shot. The click and hover scroll effect is real and fixed. tsc and lint are clean. jest: 5416 passed / 1 skipped, 232 of 233 suites. Parity: 0 gaps / 0 undeclared / 24 declared.

## Gate results (head `d34b0fe`, run by me)
| Gate | Result |
|---|---|
| tsc (`npm run tsc`, incl. e2e) | clean |
| lint (`npm run lint`) | clean (only the existing `.eslintignore` warning) |
| jest (`rm -f main.js styles.css` first) | `Tests: 1 skipped, 5416 passed, 5417 total`; `Test Suites: 1 skipped, 232 passed, 232 of 233 total` (5408 + 8 new) |
| shots (branch worktree) | rc 0, 572 PNGs, 0 FAIL; `capture clip OK (180 capture(s) …)`; `montage board scroll OK (14 rounds x 900px pane …)`; host-copy pin OK; button host-leak 112 kinds / 672 |
| freeze | `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`. The failing set equals `rebaseline.txt` exactly, and applying it to a scratch copy gives rc 0 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` |
| lifecycle / e2e | not run: the diff touches only `visual-harness/` and `test/unit/build/` (the brief allows skipping) |

## Probes, numbered as in the brief
1. **Shots and determinism.** My head run gives 572 PNGs, the new gate line, and hashes equal to the implementer's proof run (572/572). Its 40 frozen lines equal `rebaseline.txt`. The freeze failures are exactly that set.
2. **Unclipped captures stay byte-identical.** I built a separate clone of the plugin at `0ce76dd` in scratch and shot it there: 572 PNGs, rc 0. Compared with head, 437 are identical and 135 differ, all in the clipped list. The instrumented run adds that every differing capture had `#mount` taller than 1200 CSS px (none of 1200 or under). 180 captures grew. The 45 that grew but stayed byte-identical are 41 realprint, `chrome-hover-hero--steel-light`, `chrome-initiative-menu--steel-light` and `feature-spend--steel-{dark,light}`.
3. **Captures the classifier missed.** I instrumented a scratch clone to record, at the moment of each shot, `#mount`'s position in the viewport, the scroll offset of each ancestor, `:hover` on the hover target, and every body child. Across 572 captures, no top edge is above 0 and only the gallery has its bottom below the viewport. See HIGH-1. The modal fullPage shots (`montage-sheet-log`, `#mount` bottom at 1069) fit. The narrow captures have horizontal overflow inside `#mount` (INFO-4). I looked at the after-PNGs of the tallest captures (statblock-narrow 11556, chrome-placement-trio 10142, chrome-hover-statblock 8060): their content runs to the last row.
4. **Layout effect of the growth.** Per file, the top 2400 device rows of base and head are pixel-identical for 127 of the 135 moved captures. The 8 exceptions:
   - 7 are explained by the click/hover scroll: `chrome-hover-card--{dark,light}`, `chrome-hover-statblock--{dark,light,print}`, `chrome-skills-menu--print` and `montage-guide-open--print`. Their base PNGs have a blank top, which head fills.
   - `negotiation-checked--steel-dark` differs at rows 282–959: the badge numerals sit 1 CSS px lower (2,789 px differ). The DOM rects are identical. A page loaded straight into a 900x1295 viewport, never resized, is byte-identical to head. So head is the true tall-viewport rendering, not an effect of resizing after load. Unfrozen; see INFO-2.
   - Viewport-sized CSS: no `@media` query on height in app.css or styles-source.css, and no `innerHeight` reads in `src/`. `.dse-modal__body { max-height: 70vh }` only reaches modal shots, which never grow.
5. **The gate can fail.** In the scratch clone I disabled the fix (`grownTo = null` behind an env var) and ran `--element=skills`: rc 1, `CAPTURE CLIPPED — 20 capture(s) …`, naming `skills--steel-print reaches 2110px but the viewport is 1200px` and others.
6. **Viewport restore.** Before every one of the 572 snaps the viewport was 900x1200, so no growth leaked into a later capture. The later gates all run after a restored snap.
7. **tsc, lint, jest and parity.** Results are in the table above.
8. **The click/hover scroll effect.** Confirmed:
   - `montage-guide-open--steel-print`: the click scrolls the cascade wrapper by 761 px and `#mount`'s top sits at −729 at shot time. Base content starts at device row 1369; head starts at row 12 and runs to the last row. (The implementer's "top 900 rows blank" understates it: about 1,369 rows are blank.)
   - Hover shots: the wrapper is scrolled 77–96 px before growth. After growth the residual scroll is 31 and `#mount`'s top is at 1.0, fully in view.
   - `:hover` is true both before and after growth for all 13 hover ids across every combo, so growing does not lose the hover menu. `chrome-hover-statblock--steel-dark` now shows the menu panel, which base had in its blank top band.
   - Measuring in page coordinates (bottom plus the ancestors' scrollTop) is the right fix.
9. **Audit of the other scripts (no fix, as the brief asks).**
   - `docs-shots.mjs`, browser half: **no clip.** It never sends `sheet=1`, so body is not `overflow: clip`. The committed `docs/Media/statblock.png` is 760x3740 with content to the last row; the same holds for skills, montage, negotiation, initiative-tracker and featureblocks, and `sample.png` has an 18-row tail.
   - `docs-gif.mjs`: **no clip.** No sheet, and `unionCrop` throws if the element goes past the frame.
   - `shoot-url.mjs`: arbitrary URL, fullPage at 1440x1000. It would clip only if the target page clips its own body. It does not load the harness.
   - `sc379/shoot-sc379.mjs`: uses `sheet=1` but has a 3400 px-tall viewport, and negotiation (about 1255 px) fits, so **not clipped today**. It would clip any element taller than about 3400 px.
   - `sc191/shoot-sc191-*.mjs`: no sheet, so **no clip**.
   - `obsidian-camera.mjs` and `sc184-evidence.mjs` already grow the viewport (`Emulation.setDeviceMetricsOverride` when the rect overflows). `settings-evidence.mjs` and `obsidian-lifecycle.mjs` are Obsidian camera and out of scope.

## Findings

### HIGH-1: the gallery is still clipped, and the gate passes it
- **Where:** `visual-harness/shoot.mjs:504` (fullPage branch of `measureCaptureBottoms`) and `:531` (the OK message).
- **Cause:** with `sheet=1`, the only non-script body child is the screen-cascade wrapper `.markdown-preview-view` (`height: 1200px`, `overflow-y: auto`, `scrollHeight` 25064). `#mount` lives inside that wrapper and is 24,968 CSS px tall. The measured bottom is 1200, so the capture never grows.
- **Effect:** `gallery--steel-{dark,light}.png` come out 1800x2400 and show only the first element (ancestry). The gate re-measures the same body children, so it passes and prints "every capture was taken with its whole element inside the viewport".
- **Evidence:** `rv-gallery-probe.json` and `rv-probe-probe1.jsonl` (gallery: `bottom 24999.9 > 1200`, `grownTo null`).
- **Feasibility:** a grown capture works. Viewport 25000, fullPage, 17.7 s, 1800x50000, 19.8 MB, and `#mount`'s size and markup do not change (`rv-gallery-grown.png`).
- **Prescribed fix:** in `measureCaptureBottoms(fullPage)`, add `#mount` (and any scroller's `scrollHeight`) to the nodes that are measured, not only the body children. If the owner would rather not have a 20 MB × 2 gallery, the alternative is an explicit, named gallery exemption that the OK line prints. The gate must not claim the gallery either way.
- **Frozen impact:** none. The gallery has no print combo, so `rebaseline.txt` does not change.

### MED-1: the gate can only catch a bypassed growth, not a wrong measurement
- **Where:** `shoot.mjs:620–627` and `capture-viewport.mjs:39`.
- **Cause:** `bottomsAtShot` comes from the same `measureCaptureBottoms` that decided the growth, so its verdict repeats that measurement. It catches a skipped growth (probe 5 shows this) or layout drift. It is blind to HIGH-1, to a top-edge clip, and to a clip inside a nested scroller.
- **Prescribed fix:** check at shot time with an independent measurement. For an element shot, `#mount`'s viewport rect must satisfy `top ≥ 0` and `bottom ≤ innerHeight`. For a fullPage shot, `#mount`'s bottom plus its ancestors' scrollTop must be ≤ `innerHeight`, and no scrolling ancestor of `#mount` may have `scrollHeight > clientHeight + scrollTop`. My instrumentation already uses this shape; with the fix in place it flags only the gallery.

### LOW-1: the gate's wording and count overstate what was clipped
- **Where:** `capture-viewport.mjs:46` and `shoot.mjs:531`.
- **Problem:** "everything below Npx paints blank" is false for print-media (`realprint`) captures. With the fix disabled the gate names `skills--steel-realprint` that way, although realprint captures are never clipped. "180 capture(s) taller than the viewport" also includes `feature-spend--steel-{dark,light}`, which is 1165 px tall: page bottom 1221 only because `#mount` starts at 56.
- **Harm:** none to bytes (all 45 of these are byte-identical), but the line misleads.
- **Prescribed fix:** reword to "reach below the viewport" and say that realprint grows only as a precaution, or count separately.

### INFO
1. **Sanction-ask crops.** 3 of the 40 frozen lines also change above row 2400, because their base top was blank from the scroll: `chrome-hover-statblock`, `chrome-skills-menu` and `montage-guide-open` (`--steel-print`). The before/after crops should show the top as well as the tail.
2. **`negotiation-checked--steel-dark`** (unfrozen): the numerals move 1 CSS px. A page loaded straight into the taller viewport renders it the same way, so this is rendering that depends on viewport height, not a defect of the resize. The layout fingerprint (`#mount` size plus innerHTML, `shoot.mjs:512–519`) could never catch glyph-level differences; that is acceptable as long as it is documented.
3. **Fonts in the harness.** Source Code Pro, Inter and Flow Circular report `unloaded` in the harness page, so numerals render in a fallback font. This is pre-existing and outside SC-349; raise a ticket only if it matters.
4. **Horizontal overflow inside `#mount`** in narrow captures: `perk-narrow` (scrollWidth 478 > 300), `montage-narrow` print/realprint (389 and 350), `statblock-narrow` and `statblock-sticky-narrow` dark/light (338). This is overflow of the 300 px column, not the camera's viewport. It is pre-existing; the owner decides whether it counts as "clipped" under the ruling.
5. **Stale doc on landing:** dse-verify `SKILL.md:367` ("`negotiation-ended`/`-narrow` captures are cut by the harness's 1200 px viewport"), and the CURRENT block needs jest 5416 and the `capture clip OK` line. The implementer already noted both.
6. **Lint scope:** lint covers `src main.ts e2e`, so the new `visual-harness/capture-viewport.mjs` and the `shoot.mjs` changes are never linted. This is pre-existing.

## Working-tree hygiene
- Before and after, `git status --porcelain`: the superproject worktree shows ` M draw-steel-elements` both times, and the plugin is clean at `d34b0fe` both times. The shared main checkout `draw-steel-elements` keeps only its expected `demo-vault/` changes and `compendium-manifest.json`.
- The branch worktree's `visual-harness/shots/` is byte-identical to its state before the review (572/572). `main.js`, `styles.css` and `main.css` were restored byte-for-byte from my backup after jest and parity.
- `freeze-baseline.sha256` is unchanged (`f0dc00e4…`), and `check-freeze.sh` was not touched.
- The base and probe runs used scratch clones (`git clone` of the plugin plus a symlinked `node_modules`), never the branch tree.

## Evidence (scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-review-r1/`)
- `rv-shots-head1.{log,rc,sha256}`, `rv-freeze-head1.{log,rc}`, `rv-head1-rebaseline-lines.txt`, `rv-baseline-applied.sha256`, `rv-applied-check.log`.
- `base/` (clone at `0ce76dd`, with shots), `rv-shots-base1.{log,rc,sha256}`, `rv-compare.py`, `rv-compare-base-vs-head.json`.
- `probe/` (instrumented clone at `d34b0fe`), `rv-instrument.py`, `rv-shots-probe1.{log,rc,sha256}`, `rv-probe-probe1.jsonl` (per-capture geometry and hover).
- `rv-nofix.sh`, `rv-nofix-skills.{log,rc}`, `rv-probe-nofix-skills.jsonl` (the gate failing with the fix disabled).
- `rv-gallery-probe.{mjs,json,log}`, `rv-gallery-grow-probe.{mjs,log}`, `rv-gallery-grown.png` (gallery feasibility).
- `rv-negchk-probe.{mjs,log}`, `negchk/` (loaded at 1295 vs grown).
- `crops/` (hover tops before/after, the gallery head capture, negotiation-checked zooms, the grown gallery's tail).
- `rv-tsc.log`, `rv-lint.log`, `rv-jest.log`, `rv-parity.log`.
