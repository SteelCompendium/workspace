# SC-479 r3 review report (agent a49fb648658e70991)

## Executive summary
- **Verdict: REQUEST_CHANGES.** Counts: **1 HIGH, 0 MEDIUM, 2 LOW**. Reviewed dse `84ba65a` on develop `253aa5f`, superproject `d53782a`. Obsidian 1.15.0, Xvfb, port 9493.
- **HIGH-1:** the anchoring stop sits on the whole host scroller, so any height change above the viewport during the 2.5 s pin moves the text on screen. That includes the embed itself when the write adds or removes a tracker row while the reader is below the embed. Measured: head moves the text by **110 px** (16 -> -94, and 16 -> 126 for an added row). Base moves it **0 px** (anchoring changes scrollTop 6869 -> 6759 instead). This is a regression from stock, and the header's "only if a future Obsidian…" premise is wrong.
- **Fix measured:** put `overflow-anchor: none` on the embeds inside the pinned host instead of on the host scroller (variant `alt-embanchor`). G-S42 is ok in all 4 phases. Every end/in case held. Every shift case moved 0 px.
- **Gates:** tsc 0, lint 0, jest **6084 / 1 skipped / 245 of 246**, full lifecycle **39/39** rc 0. Discrimination on 253aa5f, 2 runs each: **head ok 2/2, base FAIL 2/2, ctl-noanchor FAIL 2/2, ctl-nohost FAIL 2/2**, with G-S8/G-S15/G-S18 ok in all 8 runs. Bundle sums are byte-identical to r2's.
- **Owner probes:**
  - (a) Form Save from inside the embed, end geometry: head held 2887 (4/4) and 1619 when parked in the embed (2/2); base drops **2887 -> 0** (4/4).
  - (b) Risk 2: see HIGH-1.
  - (c) Nested resolution is correct for an ambiguous basename, `./Rel` and `../Y/Trk`.
- **Integrity:** all clean. Embed heights never grew (SC-470 HIGH-1 did not regress). Two embeds of one B make 1 style. Host and B's own view both pin, and only the host rule stops anchoring. A popout closed while pinned leaks nothing. TTL, `releaseAll` and unload all clear the rule. A view that embeds another note is not pinned. Cost: median 0.2 ms per `modify` with 13 Reading views.
- **Jest:** 3/3 spot mutations killed. **G-S42 sleeps:** none decides an outcome, so DROP. One LOW nit (a `waitFor` would read better).
- dse tree clean at `84ba65a` at exit. Superproject ` M draw-steel-elements` as found (r2's unstaged pointer). develop has since moved to f89f69f; not rebased, per the owner.

## Findings

### HIGH-1: anchoring off on the whole host scroller moves on-screen text when anything above the viewport changes height during the pin
- **Where:** `src/framework/host/previewScrollPin.ts:193` (`anchorRule` targets the host scroller), `:199-200` (`ruleText`), `:306` (every host pin takes it). Header `:95-100` states the risk as hypothetical.
- **Failure scenario (measured, R3-SHIFT, Obsidian 1.15.0).** The reference is the first fully visible paragraph's top relative to the scroller, read per frame.
  - **Remove a hero.** Tall host (80 paragraphs, `![[r3trk]]`, 80 paragraphs) parked with the embed fully above the viewport (embed bottom + 400); the embed goes 3190 -> 3080 px.
    - base (`probe-p7-base.log`): scrollTop 6869 -> **6759**, text 16 -> **16**. Chrome anchoring compensates, so nothing moves on screen.
    - head (`probe-p6-head.log`): scrollTop **6869 held**, text 16 -> **-94**. The visible text jumps up 110 px.
  - **Add a hero** (`r3call`, embed above the viewport, 3190 -> 3299):
    - base: 4010 -> 4120, text 16 -> 16.
    - head: 4010 held, text 16 -> **126**.
  - **Unrelated content above the viewport grows 200 px during the pin** (owner's Risk-2 probe; the callout variant was vacuous because the callout was not rendered at either park):
    - head pinned: text 16 -> **216**.
    - Same mutation without a write (anchoring on): text 176 -> 176, scrollTop +200.
  - This is today's behaviour on any write that changes the embedded tracker's height (add or remove a hero or enemy, chips that wrap, collapse) while the reader is below the embed. The write can come from another pane, the sidebar panel, Sync or the form. That geometry is likely more common than the end geometry the fix targets.
- **Prescribed fix (measured, bundle `alt-embanchor` `34efd1b1432f`, built from a scratch copy):** `anchorRule(id)` becomes `.markdown-preview-view[data-dse-scroll-pin="id"] .internal-embed { overflow-anchor: none !important; }`. Only the collapsing embed is excluded from anchor selection, and anchoring outside it stays on. Results:
  - **G-S42** (`disc-alt-embanchor-run1.log`): ok, 2887 / 2887 / 2887 / 3574 held.
  - **R3-END** (`probe-p11-alt-embanchor.log`): every case held. That is r3host end and r3hostP end x {process, nodefs, own-off, own-on, pane}, plus r3tall `in` (viewport fully inside the embed) x 5.
  - **R3-SHIFT** (`probe-p8-alt-embanchor.log`): every reference shift is 0 (remove 6869 -> 6759 / 16 -> 16; add 4010 -> 4120 / 16 -> 16; pad 6869 -> 7069 / 16 -> 16).
  - Optional: scope the rule to the matched embeds only (an attribute set by `embedsBlockOf`) rather than every embed in the host.
- **What the fix also needs:**
  - Update the jest exact-text tests (`anchorStopped`, the exact `textContent` assert) and the header (`:80-100`, the risk paragraph).
  - Add a G-S42 phase (e): a write that changes the embed's height while A is parked below the embed must leave the visible text's on-screen top unchanged. Base passes it, current head FAILs it, alt passes it. Its control is "anchoring stop on the host scroller" (= 84ba65a).
  - Re-run the two existing controls.

### LOW-1: the header's Risk paragraph is inaccurate
`previewScrollPin.ts:98-100` says text would shift only "if a future Obsidian spread the embed's remount across frames". It shifts today on any height change above the viewport (see HIGH-1). This is resolved by the HIGH-1 fix and its header rewrite.

### LOW-2 (nit): a G-S42 settle wait could be a `waitFor`
- `visual-harness/obsidian-lifecycle.mjs:2847`: `t.sleep(1500)` after opening the second pane, before `t.root(TRACKER, B)` is read in the parking expression. If it falls short, the failure is a raw "page eval failed", not a clear message. Suggested: `t.waitFor` the tracker in pane B.
- **Sleep judgment (owner's item 7)** against the dse-verify rule, for all G-S42 sleeps: `:2775` 450 ms x3 parking A, `:2847` 1500 ms, `:2850` 450 ms x3 parking B. None decides an outcome. A short settle can only fail loudly: the anti-vacuity check `st0 >= max0-1`, the `pinAtRedraw === true` requirement, and a page-eval throw. It can never pass vacuously.
- The recorder's caps (pin + 4500 ms, 12 s; 5 s with no pin) also cannot pass vacuously. A redraw outside the window leaves `pinAtRedraw` null, which FAILs.
- **DROP** (G-S15 pattern).

## Evidence by brief item
1. **Design as ruled.**
   - The diff matches the ruling. Host pins come from `modify` (`pinReadingViewsOf` + `embedsBlockOf`). The writer pin walks to the outermost `.markdown-preview-view`. Host pins get the anchoring rule, and own pins get the unchanged SC-470 rule text (verified live: B's own view rule = the sizer rule only).
   - `PIN_TTL_MS` (2500) and the child-combinator `pinRule` text are unchanged.
   - HIGH-1 is a defect of the ruled design itself: the anchoring stop's scope.
2. **G-S42 discrimination** (`disc-summary.log`, `disc-*-run{1,2}.log`; `--only=G-S8,G-S15,G-S18,G-S42`, in-tree harness, `DSE_LIFECYCLE_BUNDLE`):

   | bundle | result | detail |
   |---|---|---|
   | head | ok 2/2 | 2887/2887/2887/3574 |
   | base | FAIL 2/2 | all 4 phases "no pin at the redraw, 2887 -> 0", (d) 3574 -> 0 |
   | ctl-noanchor | FAIL 2/2 | "start 2887 min 0 … pin present at the redraw true" |
   | ctl-nohost | FAIL 2/2 | no pin |

   - G-S8/G-S15/G-S18 were ok in all 8 runs.
   - Sums: head `caf8110d54ee`, base `fb4e562d7b93`, ctl-noanchor `55b19b6cb1e6`, ctl-nohost `b1aa5fa43b32`, styles `ad50afa51918` (identical to r2).
   - **r1 "end" geometry, per frame** (R3-END, `probe-p9-head.log`, `probe-p10-head.log`; head):
     - r3host end: process / nodefs / own-off / own-on / pane all held (2887 x4, pane 3574). Pin at the redraw in every redrawn case; own-on adopted (no redraw), pinned 137 frames.
     - r3hostP (plain embed + tracker embed) end: held 3781 / 4445.
     - r3host2x: held 6133 / 7507.
     - r3tall `in`: held 4779 x5.
     - r3tall `below` rows were partly vacuous (the embed was virtualised during parking); the `below` geometry is covered in R3-SHIFT.
3. **Owner probes.**
   - **(a) Form Save** (R3-FORM; real hover + click on the pencil, edit the raw box, real click on Save):
     - head (`probe-p5-head.log`): end 2887 held 4/4 (incl. the SC-519 variant, a portrait click pending when the pencil opens), pin at the redraw, redrawn, 106-114 pin frames. `in` 1619 held 2/2.
     - base (`probe-p7-base.log`): end **2887 -> 0** 4/4 (text 438 -> 3325); `in` held.
     - Note: the pencil's `realClick` `scrollIntoView` hides the chrome when it scrolls under the hover. The form was therefore opened at scrollTop 0, and A was re-parked with the form open.
   - **(b) Risk 2:** HIGH-1.
   - **(c) Nested** (R3-NEST, `probe-p1-head.log`): the inner embed's `src` is the link as written and is nested inside the outer embed element. Writes to every candidate:
     - Host -> X/Mid `![[Trk]]` (ambiguous): Obsidian shows X/Trk. Resolve from the middle note = R3N/X/Trk.md; resolve from the host would be R3N/Trk.md. Pinned only on a write to X/Trk.
     - `./Rel`: X/Rel shown, pinned on X/Rel only.
     - `../Y/Trk`: Y/Trk shown, pinned on Y/Trk only.
4. **Integrity** (`probe-p2-head.log`, `probe-p1-head.log`, `probe-p9-head.log`).
   - **Embeds keep their own height:** across every END case, the embed's height maximum during the pin = its height before (3190 / 3876).
   - **Two embeds of B:** 1 `<style>`, held (only one of the two was rendered at the end park).
   - **Host + B's own view:** the host rule = sizer + `overflow-anchor: none`, the B view rule = sizer only, 2 styles, host held 3574.
   - **Popout:** the pin lands in the popout document (computed `overflow-anchor` = none). Obsidian mirrors the main window's pin `<style>` into the popout (ids `["7","6"]`) and removes the mirror when the original is released (0 after TTL).
     - Closed while pinned: the `pins` Map goes 2 -> 1 within 1 s (the 1 left is the main window's own host pin) -> 0 at its TTL. No style is left in the main document.
   - **Release:** TTL releases after ~2561-2575 ms; `overflow-anchor` is back to auto, 0 styles, Map 0. Plugin disable while pinned (`releaseAll`): attribute gone, auto, 0 styles.
   - **A view embedding a different note:** a write to B pinned it 0 times. A write to its own embedded note pinned it 1 time (with the anchor rule).
   - **Cost** (R3-COST): 13 Reading views (6 embeds rendered, 6145 nodes). The `modify` handler on an unrelated path takes median 0.2 ms, p95 0.6, max 5.4 (300 reps). One call for B's path (pins 2 hosts) takes 11 ms.
5. **Jest mutations** (`mut-summary.log`; each in a scratch copy, `previewScrollPin.test.ts`, 46 tests, unmutated 46/46). All killed:
   - MA: drop the preview-mode guard.
   - ME: the outermost walk stops after one level.
   - MK: drop the DSE-content check inside `embedsBlockOf`.
6. **No timed delay inside a step:** see LOW-2. No sleep decides an outcome.

## Gates on 84ba65a (in the worktree)
- tsc (incl. e2e) rc 0 (`gate-tsc.log`); lint rc 0 (`gate-lint.log`).
- jest: Tests 6084 passed / 1 skipped, Suites 245 of 246, rc 0 (`gate-jest.log`).
- `npm run obsidian-lifecycle` (port 9493): `OBSIDIAN-LIFECYCLE done: 39/39 ok, 0 failed`, rc 0 (`gate-lifecycle.log`).
  - G-S42 there: 2887 / 2887 / 2887 / 3634 held. Under load (d) showed only 4 pin frames, but the assertions held.
  - This run exceeded the 600 s tool cap and was moved to the background by the harness; it completed on its own.
- e2e was not re-run (no reason found: `src` changes are confined to the scroll pin and are covered by lifecycle).

## Method and hygiene
- **Bundles** were built from `git archive` copies in scratch, with `node_modules` symlinked; the worktree was never edited.
- **Probes** ran from a scratch harness copy with the probe block injected (`r3-probe.mjs.txt`).
- `/tmp/dse-obsidian-lifecycle-*` dirs from my FAIL runs were deleted by literal path after copying the shots. No process of mine remains (the running Obsidian is Scott's own app, `--user-data-dir=~/.config/obsidian`).
- dse `git status --porcelain` is empty at `84ba65a`, before and after.

## Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r3-evidence/`:
  - **Logs:** `disc-*.log`, `disc-summary.log`, `bundles.sums`, `gate-{tsc,lint,jest,lifecycle}.log`, `probe-p{1,2,5,6,9,10}-head.log`, `probe-p7-base.log`, `probe-p{8,11}-alt-embanchor.log`, `mut-summary.log`, `jest-mut-{MA,ME,MK}.log`, `jest-copy-head.log`.
  - **Per-frame JSON:** `out/*.json`.
  - **Scripts:** `*.sh.txt`, `r3-probe.mjs.txt.txt`, `r3-mkharness.cjs.txt`.
- **FAIL screenshots:** `sc479-r3-disc-{base,ctl-noanchor,ctl-nohost}-G-S42-FAIL.png` (ledger dir).
