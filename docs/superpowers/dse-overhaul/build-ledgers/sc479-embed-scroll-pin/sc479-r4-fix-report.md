# SC-479 r4 fix report

## Executive summary
- **DONE.** dse head **e6b02ca** on base **origin/develop c558759** (rebased 3 times as develop moved 253aa5f -> f89f69f -> 08c086c -> c558759; the final battery ran on e6b02ca). Superproject head **f6661ad** on **origin/main 5902c18**; dse pointer left unstaged.
- HIGH-1 fixed: the anchoring stop is `.markdown-preview-view[data-dse-scroll-pin="id"] .internal-embed { overflow-anchor: none !important; }` (host pins only); the scroller keeps anchoring. LOW-1 (header rewritten) and LOW-2 (`waitFor` for the tracker in the second pane) folded.
- HIGH-1 shift numbers on this head, phase (e) (tall host parked 100 px below the embed, a hero added, embed 3190 -> 3299 px): text held at **36 px, 0 px shift**, scrollTop 4569 -> 4679 (Chrome compensates, as on stock). The 84ba65a rule (control): text 36 -> **146 (+110 px)**, scrollTop 4569 -> 4569.
- Gates on e6b02ca: tsc rc 0 / lint rc 0 · jest **6115 passed / 1 skipped / 247 of 248** (6105 + 10 SC-479 tests) · lifecycle **40/40 ok** (rc 0) · e2e **124/124 ok, 0 failed, 0 known-bug, coverage 87/87 pairs** · shots **592, 0 FAIL**, `button host-leak OK (114 button kinds ... = 684 comparisons)` · freeze **280/280** · parity **0 gap(s), 0 undeclared, 24 declared**.
- `styles.css`: byte-identical between head and a c558759 base build (sha `ae45354b6369`, also both controls).
- Discrimination on c558759 (2 runs each, `--only=G-S8,G-S15,G-S18,G-S42`): head ok 2/2 · base FAIL 2/2 · "host pins without the anchoring rule" FAIL 2/2 · "host pin disabled" FAIL 2/2 · "anchoring stop on the scroller" FAIL 2/2 (phase (e) only) · G-S8/G-S15/G-S18 ok in all 10 runs.
- Mutation check on the changed guard: 19 mutations, 19 killed (M19 = anchoring stop back on the scroller, killed by 5 tests).
- Rebase conflicts: only `visual-harness/obsidian-lifecycle.mjs`, header comment and SCENARIOS array (pure adds next to SC-519/SC-502 blocks): kept every other scenario whole, re-applied G-S42 after them, header count "40 scenarios ... with SC-502's G-S44 and SC-519's G-S45". CHANGELOG `## Unreleased` conflicted with SC-519/SC-510 bullets: kept both, mine on top. No `npm ci` (package.json unchanged).

## Commits (dse, base c558759)
- `88d200a` host pins + outermost writer pin + anchoring stop (r2, rebased)
- `c3de06c` nested embed link resolution (r2)
- `b73c454` header (r2)
- `ca01a96` G-S42 header count (r2)
- `5b3b778` **r4**: anchoring stop on the host's embeds; `anchorRule` exported text changed; header section "WHY THE EMBEDS AND NOT THE SCROLLER" + rewritten RISK paragraph (LOW-1); jest exact-text tests updated, `scrollerAnchorOff` helper asserts the scroller itself is never targeted (first host test and the floor-raise test)
- `e6b02ca` **r4**: G-S42 phase (e) + fixture `Lifecycle/embhosttall.md` + LOW-2 `waitFor`
Superproject: `f6661ad` CHANGELOG. Patches: `.../sc479-r4-evidence/patches/`.

## Phase (e) design
Fixture `Lifecycle/embhosttall.md`: 30 paragraphs, `![[embtracker]]`, 150 paragraphs. Phase: `t.reset(embtracker)`; open the host; scroll down until the embed is drawn; park at the embed's bottom + 100 px (viewport top just under the embed; at +400 the embed's tracker is virtualised out and a write would redraw nothing; with an 80/80 fixture the position clamped at the page end); tag the embedded root; start a per-frame recorder (first fully visible paragraph's top relative to the scroller, scrollTop, pin attribute, embed height) BEFORE the write; write = `vault.process` adding a hero. Assertions: write landed; tracker drawn; anti-vacuity (tagged root replaced, embed bottom above the viewport, embed grew by >= 50 px); `data-dse-scroll-pin` on the host when the root left the document; paragraph top identical in every frame (min == max == start, never null) until the pin is released + 10 frames; pin released. No timed delay decides an outcome. The second-pane `t.sleep(1500)` is now `t.waitFor` for the tracker in pane B (the parking sleeps of 450 ms remain settle waits, as dropped by r3).
Head: held at 36 px over ~104 frames, embed 3190 -> 3299, scrollTop 4569 -> 4679, pinned 95 frames. Phases (a)-(d) unchanged: 2887 / 2887 / 2887 / 3634 held.

## Discrimination, per phase (logs in evidence dir)
| bundle | runs | (a) | (b) | (c) | (d) | (e) |
|---|---|---|---|---|---|---|
| head | ok 2/2 | held | held | held | held | held (36 px) |
| base (c558759 src) | FAIL 2/2 | no pin at redraw, 2887 -> 0 | same | same | same, 3574 -> 0 | no pin at redraw |
| host pins, no anchoring rule | FAIL 2/2 | moved 2887 -> 0 (pin present) | same | same | 3574 -> 0 | text 36 -> 146, min 36 max 146 |
| host pin disabled | FAIL 2/2 | no pin at redraw | no pin | no pin | no pin | no pin |
| anchoring stop on the scroller (84ba65a rule) | FAIL 2/2 | held | held | held | held | **FAIL**: text 36 -> 146 (+110 px), scrollTop 4569 -> 4569 |
(Phases (a)-(d) rows for the controls read from the failure messages; the "disabled" row shows the first assertion that fails per phase.) G-S8, G-S15, G-S18 ok in every run (incl. G-S18's Live Preview hold, after SC-502's CSS).

## Mutation checks (`mutations.txt`, `mut.py`; run on the r4 source/test files, which the last rebase did not change)
All 19 KILLED: M01 views of other notes never pinned (5) · M02 every view pinned (4) · M03 subpath not stripped (1) · M04 nested embeds not reached (3) · M05 nested link from host path (1) · M06 innermost scroller (3) · M07 writer pin not a host pin (3) · M08 anchoring stop on every pin (3) · M09 anchoring stop never (5) · M10 own->host upgrade drops it (1) · M11 floor raise drops it (1) · M12 child combinator (2) · M13 no host-path fallback (1) · M14 non-DSE embed counts (1) · M15 resolver not wired (1) · M16 `release()` leaves the style (11) · M17 `releaseAll()` no-op (6) · M18 TTL no release (4) · **M19 anchoring stop back on the scroller (5)**.

## Proposed dse-verify SKILL.md text (for the dispatcher; not applied)
1. Battery row 4: `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed`; append `SC-479 G-S42 - a Reading-view note that embeds a tracker keeps its scroll position (end geometry) and its on-screen text (below the embed) when the tracker's note is written`. (SC-502 G-S44 and SC-519 G-S45 are listed by their own rows.)
2. Entry after G-S15:
   > `G-S42` (SC-479: a Reading-view HOST note keeps its scroll position when a tracker in a note it embeds is written. `Lifecycle/embhost.md` = `C-TOP`, `![[embtracker]]`, `C-BOTTOM`; `embtracker.md` = the 25-hero tracker; `embhosttall.md` = 30 paragraphs, the embed, 150 paragraphs. Phases (a) in-app `vault.process` of B, (b) a write on disk via the watcher, (c) the embed's own click with view adoption OFF, (d) a second Reading pane showing B makes the click, all with the host parked at its END (the geometry that jumps 2887 -> 0 on stock), and (e) the tall host parked 100 px BELOW the embed with a `vault.process` that adds a hero (the embed grows 3190 -> 3299 px): the first visible paragraph's on-screen top must stay put in every frame. Per phase: write landed; tracker drawn; anti-vacuity (the tagged embedded root was replaced; park position as stated; for (e) the embed grew); `data-dse-scroll-pin` on the host when the root left the document; scrollTop ((a)-(d)) / paragraph top ((e)) identical in every frame until the pin is released + 10 frames; pin released. Every phase runs even after one fails. Controls, built as temporary bundle variants run with `DSE_LIFECYCLE_BUNDLE`: **"host pins without the anchoring rule"** (`ruleText` returns the sizer rule alone) FAILs every phase ((a)-(d) 2887 -> 0 with the pin present, (e) text +110 px); **"host pin disabled"** (`pinReadingViewsOf` skips other notes' views, `pin` takes the innermost scroller) FAILs every phase (no pin at the redraw); **"anchoring stop on the scroller"** (the first version's rule `.markdown-preview-view[...] { overflow-anchor: none }`) holds (a)-(d) and FAILs (e) only (text 36 -> 146 px). Base bundle FAILs every phase. The pin needs the sizer floor AND `overflow-anchor: none` on the host's `.internal-embed` elements, and must NOT switch anchoring off on the scroller.)
3. Numbers once landed on c558759+: jest 6115 passed / 1 skipped / 247 of 248 (fresh worktree without a shots cache: one fewer / 2 skipped); e2e 124/124, 87/87; lifecycle 40/40.

## Drive-by fixes
None.

## Follow-ups
- RISK paragraph (header): with anchoring off for the host's embeds during the pin, a reader inside a tall embed is not compensated for content resizing above their viewport inside that embed. Not measured; the header says so. Candidate probe for r5 if wanted.
- ctl-noanchor also shifts text in (e) by 110 px (scrollTop unchanged): with only the sizer pinned, the host never lets anchoring compensate the growing embed. Not a product concern (the control is not shipped); noted for the SKILL text above.
- G-S42's parking `t.sleep` settle waits remain (dropped per r3).

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r4-evidence/`)
`tsc.log lint.log jest-final.log lifecycle-final.log e2e-final.log shots-final.log freeze.log parity-final.log` (all on e6b02ca) · `disc-{head,base,ctl-noanchor,ctl-nohost,ctl-scroller}-run{1,2}.log`, `disc-summary.log`, `bundles.sums` (head main.js `ecefec922aad`, base `b5a41fccfff5`, ctl-noanchor `c7c2c1aed6fb`, ctl-nohost `7fd835a36d72`, ctl-scroller `e98674a6eb29`; styles.css `ae45354b6369` for all), `build-variants.sh`, `disc.sh` · `mutations.txt`, `mut.py` · `lc-only-fourth.log` (first green G-S42 incl. (e)) · `interim-08c086c/` (earlier full battery + head/base discrimination on 08c086c) · `patches/`.
