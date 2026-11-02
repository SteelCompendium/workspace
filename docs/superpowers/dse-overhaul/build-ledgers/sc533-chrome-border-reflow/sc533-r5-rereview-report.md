# SC-533 r5: scoped re-review of the r4 delta (dse 74a8e27..9c8cad5, superproject 3af32d97)

## Summary
- **Verdict: APPROVE.** Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 3 INFO. Neither LOW blocks landing.
- **HIGH-1 and MEDIUM-1 are fixed.** I re-ran the r3 probes on a 9c8cad5 build:
  - Reading view and Live Preview: all 10 blocks read inset 10 / gap 0.
  - Hovered panels in Live Preview: 10 / 0.
  - Popout scroll: 11 of 11 blocks correct, 0 bad.
  - `moveLeafToPopout` with blocks parked in the main window's observer: SB Five, C2 and SB Six are correct in the popout.
- **G-S54** (port 9561, 9c8cad5 harness):
  - Passes on the final bundle.
  - FAILs both Live Preview and Reading view on the 74a8e27 bundle.
  - FAILs Reading view only on stock 458abe3.
- **The observer neither leaks nor keeps stale entries.** The parked count stays constant across 5 external remounts. Adoption leaves no stale entry. Anchors that never intersect are cleared when the user navigates away. The popout observer is gone once the popout closes. The probe saw no stale entries at any point.
- **Tests:** 49 of 49 pass on final. 3 fail on 74a8e27 and 8 fail on stock. All 8 `--randomize` seeds pass.
- **LOW-1:** `src/framework/chrome/mountChrome.ts`, the comment on `rootMargin: '200px 0px'` in `parkFrameBorders`. The margin does not fire early inside Obsidian's scrollers. In Live Preview, 3 of 3 cards below the fold had their fallback painted for 1–2 frames while on screen. The geometry is still correct afterwards; only the comment's claim is wrong.
- **LOW-2:** a collapsed block below the fold, once expanded by a click, shows the fallback (inset 11 / gap -1) for 3 rAF samples while hovered. Stock is permanently wrong in this case, so this is still an improvement.

## (1) HIGH-1 / MEDIUM-1: fixed
Bundles were built from my own `git archive 9c8cad5` export: final, finalx (adds `globalThis.__sc533q` and `__sc533p`), old74 (74a8e27's `mountChrome.ts`) and stock (458abe3's). In 74a8e27..9c8cad5 the only `src` change is `mountChrome.ts`. Obsidian 1.15.0.

- **r3y on final** (`sc533-r5-probe-r3y.json`):
  - Reading view slow scroll: all 10 blocks have `firstVisOk: true` and 0 bad samples.
  - Live Preview: the same.
  - `moveLeafToPopout` straight after a rerender: 7 of 7 correct.
- **r3w on final** (`sc533-r5-probe-r3w.json`): hovered Live Preview panels "SB Four", "Heroes" and "SB One" all read `1px`, inset 10, gap 0. On 98ca88e, SB Four and Heroes read inset 11 / gap -1.
- **Popout, r5v V5** (`sc533-r5-probe-r5v.json`):
  - 6 entries were parked in the popout window's own observer (`main: false`).
  - Scrolling through the popout: 11 blocks seen, 0 bad.
  - After the popout closes, the parked set is `[]`.
- **Popout after a move, r5v6** (`sc533-r5-probe-r5v6.json`):
  - 4 entries were parked in the MAIN window's observer, then the leaf was moved to a popout.
  - Scrolled in the popout: SB Five, C2 and SB Six all read `1px`, 10 / 0, with `doc: pop`.
  - Only the collapsed "SB Folded" stays parked (expected: its anchor is `display: none`).
  - It is cleared when the popout closes.

## (2) Observer lifetime, and the choice of anchor + `rootMargin`
Evidence is from r5v on the finalx bundle (`sc533-r5-probe-r5v.json`).

| check | result |
|---|---|
| V1: open the note in Reading view | 4 entries parked on 4 anchors (C2, SB Five, SB Folded, SB Six), all detached; the rAF queue is empty |
| V4: anchors that never intersect, then navigate away | parked `[]`, queue 0: owner unload clears them |
| V2: 5 external remounts of the parked C2 | the parked set stays at 4 entries / 4 anchors after every edit; stale entries 0 (`panelEl.parentElement === anchor` for every entry); after scrolling to C2: `1px`, 10 / 0 |
| V3: adoption while parked (pane B writes C2; pane A has it parked below the fold) | registry claims 0 → 1; parked count unchanged (only the 2 collapsed "SB Folded" entries, one per pane); in pane A after scrolling, C2 and SB Five read 10 / 0; when pane B closes its entry is dropped |
| V7 Live Preview end / away | parked `[]` once everything has been scrolled through, and after leaving |
| V5/V6 popout close | parked `[]` |

**Anchor rather than panel: sound.** The anchor is the framed card and has a real box. The panel hangs outside the anchor's box and has no box in print. When the anchor is `display: none` (V8: a collapsed statblock, `anchorDisplay: none`, anchor is not the root), it stays parked until it is expanded, then publishes. That is the right moment.

**`rootMargin: '200px 0px'`: harmless, but it does not do what the comment says.** See LOW-1.

**Stale-entry case, judged acceptable.** If an anchor is intersecting while its panel is detached, the entry stays parked until the owner unloads. IntersectionObserver only notifies on transitions, so this entry is never re-tried. The case needs a panel detached from a still-connected anchor, which only happens when the pipeline is replacing it, and the old owner is unloaded first. I did not observe it.

## (3) G-S54
I ran it myself with `--only=G-S54`, port 9561, and the harness from the 9c8cad5 export.

- **final:** `G-S54 ok`.
  - Live Preview: 10/10 blocks, 8 measurements of panels out of the document at their first frame (15/20, Init Ida, SB Four), all 10 / 0.
  - Reading view: 10/10 blocks, 11 such measurements (SB Five, Init Two, SB Six, 7/24), all 10 / 0.
  - rc 0.
- **old74** (74a8e27): `G-S54 FAIL`.
  - Live Preview: 15/20, Init Ida and SB Four each read `inset 11 (want 10), gap -1 (want 0), no frame-border var on the panel`.
  - Reading view: SB Five, Init Two, SB Six and 7/24 fail the same way.
  - rc 1.
- **stock** (458abe3): `G-S54 FAIL`, Reading view only (the same 4 blocks). Live Preview is all 10 / 0. rc 1.

## (4) Tests
- `chromeRound2.test.ts` on final: `Tests: 49 passed, 49 total`.
- On 74a8e27's `mountChrome.ts`: 3 failed (the three hand-off tests).
- On stock 458abe3: 8 failed.
- `--randomize` seeds 1, 2, 5, 8, 13, 21, 34 and 99: 49 of 49 each. Seeds 1, 2, 5 and 8 are the ones that failed at r3.
- The tests are not vacuous:
  - The fake IntersectionObserver asserts what is observed and checks the init (`root` null).
  - The intersecting report forces reads before writes (RRRRWWWW).
  - Stale reports after unload do nothing.

## (5) Text accuracy
- **`mountChrome.ts`, the `FRAME_BORDER_VARS` comment block:**
  - "opacity: 0 … always visible on mobile … at most a 1px offset for one frame" is true for the rAF path. No flush was ever queued from inside rAF (r3 probe).
  - The parked-path description is true.
- **Inline comment in `parkFrameBorders` on `rootMargin`:** not true in Obsidian. See LOW-1.
- **`docs/superpowers/sc169-element-menu-panel-spec.md:168-177`:** accurate.
- **CHANGELOG bullet (3af32d97):** accurate. "About 40% faster" and "about 340 ms of an 850–900 ms redraw" match r1, r2b, r3 and r4. The Reading-view below-the-fold fix is real: G-S54 fails on stock and passes on final. Nit: the menu was also 1 px too far left, not only "1 px too low".
- **SKILL.md G-S54 text** (`sc533-dse-verify-SKILL-proposal.patch`): matches the scenario and my control results.

## Findings
- **LOW-1: `src/framework/chrome/mountChrome.ts`, `parkFrameBorders`, the comment above `new IO(..., { rootMargin: '200px 0px' })`.**
  - The comment claims: "The vertical margin measures a little before the card scrolls into view, so the panel is right by the time it can be hovered."
  - `rootMargin` only grows the root (viewport) rectangle. The scroller's overflow clip still applies, so nothing fires before the card enters the scroller. The IntersectionObserver callback also runs as a task after that frame's paint.
  - Measured with r5v V7 (40 px per frame scroll, sampled each rAF):
    - Live Preview: stamina bar 1 frame, tracker 2 frames, SB Four 1 frame painted on screen with the fallback (inset 11 / gap -1).
    - Reading view: C2 1 frame.
  - These frames are only visible when the panel is hovered or on mobile.
  - Fix: either drop the claim (say "at most a frame or two of the 1 px fallback as a panel scrolls in"), or make it true by using the anchor's scroll container as `root`. The anchor is detached when parked, so that would mean resolving the container lazily. I recommend the wording fix. The cost is cosmetic, it lasts 1–2 frames, and stock was permanently wrong in Reading view.
- **LOW-2: collapsed below-the-fold block, expanded by a click.**
  - r5v V8: the panel stays at fallback (inset 11 / gap -1) for the click task plus 2 rAF samples, then reads `1px` 10 / 0 from the 3rd rAF.
  - The pointer is over the element, so the panel is revealed during those frames.
  - Same cause as LOW-1 (the callback is a post-paint task). Stock is permanently wrong for this block.
  - No code change needed. Fold it into the LOW-1 wording.
- **INFO-1:** G-S54 waits up to 40 frames for the var before it measures. It proves eventual correctness, not first-frame correctness, which is enough for HIGH-1 and MEDIUM-1. Its failure message "no frame-border var on the panel" is also printed on stock, where the var sits on the anchor. That is harmless.
- **INFO-2:** after a panel is reconnected, an entry whose anchor is already intersecting gets no new notification. The pipeline always unloads the old owner before it remounts, so this was not observed.
- **INFO-3:** the parked map is keyed by the window at queue time. After `moveLeafToPopout`, the main window's observer still published the popout-document anchors correctly (r5v6), and the entries were released when the popout closed.

## Housekeeping
- The dse worktree's `git status --porcelain` is empty before and after; HEAD is `9c8cad5`.
- The superproject worktree was not touched (` M draw-steel-elements` as found).
- The two G-S54 control runs left FAIL temp dirs (`/tmp/dse-obsidian-lifecycle-rSsLdg`, `-m9BxQH`); I deleted them by their literal paths.
- I did not re-run jest; no finding depends on it.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r5-db8b2294/`

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`)
- **This report:** `sc533-r5-rereview-report.md`.
- **Probes:**
  - Results: `sc533-r5-probe-r3y.json`, `sc533-r5-probe-r3w.json`, `sc533-r5-probe-r5v.json`, `sc533-r5-probe-r5v6.json`.
  - Scripts: `sc533-r5-probe-r5v.mjs.txt`, `sc533-r5-probe-r5v6.mjs.txt`. The r3 probes are reused from `sc533-r3-probe-*.mjs.txt`.
- **Build and run scripts:** `sc533-r5-setup.sh.txt`, `sc533-r5-gs54.sh.txt`, `sc533-r5-t-red.sh.txt`.
- **G-S54 logs:** `sc533-r5-gs54-final.log`, `sc533-r5-gs54-old74.log`, `sc533-r5-gs54-stock.log`.
- **Test logs:** `sc533-r5-test-final.log`, `sc533-r5-test-old74.log`, `sc533-r5-test-stock.log`, `sc533-r5-test-randomize.txt`.

Drive-by fixes: none.

Follow-ups: none beyond LOW-1's wording.
