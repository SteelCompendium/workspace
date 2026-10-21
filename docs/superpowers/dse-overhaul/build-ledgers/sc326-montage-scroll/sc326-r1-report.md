# SC-326 r1 report — montage board scrolls horizontally instead of clipping

## Executive summary
- STATUS: DONE. dse branch `sc326-montage-scroll`, head `6f9affd` (3 commits on base `188755b`, which is still `origin/develop`; no rebase needed).
- Fix: `.dse-mt__board` frame `overflow: hidden` -> `overflow-x: auto; overflow-y: hidden` (border + radius kept), styles-source.css decoration tier (screen-only, non-print selector).
- New in-run shots gate `assertMontageBoardScroll` (14-round montage built in-probe by cloning the `mid` DOM; 900px pane; fine AND real coarse pointer). No new fixture: shots stay 572.
- Can-fail proven twice: real `npm run shots` with `overflow: hidden` restored -> loud failure, devbox exit 1; both pointers shown; CSS restored byte-clean (`cmp` identical).
- Battery: tsc/lint clean; jest 5258 passed / 1 skipped / 229 of 230 (base 5257 + 1 new); lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572, 0 FAIL; freeze 276/276; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Stronger than freeze: all 572 shot PNGs (incl. non-frozen screen dark/light) sha256-identical to a base `188755b` shots run.
- FOLLOW-UP worth the owner's attention: the whole element rebuilds on every write, so the board's `scrollLeft` resets to 0 after a quick-trio tap or sheet save in a far column (see Follow-ups).

## Files changed (`git diff 188755b --stat`)
- `draw-steel-elements/styles-source.css` (+13/-1: the frame rule + explanatory comment)
- `draw-steel-elements/visual-harness/shoot.mjs` (+~245: `assertMontageBoardScroll` + one call after `assertMontageCoarseContainment`)
- `draw-steel-elements/test/dom/elements/montage.test.ts` (+22: one CSS-contract pin)
- `draw-steel-elements/CHANGELOG.md` (+5: one `[FIX]` bullet at the top of the unreleased 7.0.0 list; the file has no literal `## Unreleased` header — the unreleased section is `## 7.0.0 (unreleased; …)`). Workspace CHANGELOG untouched.

Commits: `2a620f7` (CSS + gate + jest pin), `bd99a4d` (gate also asserts the frame stays inside its `.dse-mt` card), `6f9affd` (changelog).

## The chain (what else could clip the board)
Measured, not just read. In the harness at 14 rounds, 900px pane, after the fix: the board frame is 690px and lies fully inside its `.dse-mt` card (gate asserts `frameOverhang <= 0.5px`); nothing between `.dse-mt__board` and the card clips it. `.dse-mt__board-wrap` is `position: relative` only; `.dse-mt` is `container-type: inline-size` with no overflow; the coarse block (~:4187) sets only `--dse-mt-colmin`. The only clip was the one rule. The narrow stacked layout (`@container dse-mt (max-width: 420px)`, `grid-template-columns: minmax(0,1fr)`) never overflows, so it is unchanged.
**Print:** the `overflow` lived in the steel decoration tier selector `[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"]) .dse-mt`, i.e. screen only. Print never had any `overflow` on the board, so printing is unchanged (not worse); 276/276 frozen prints and all 572 shots byte-identical to base.
**Interactive descendants:** row action buttons, addhero, round cells and the coarse quick trio are in-flow children of the same grid; `overflow-y: hidden` keeps vertical behaviour identical. No popover/menu is anchored inside the board (hover tooltips are Obsidian's body-level `aria-label` renderer; the chrome menu and the Log-an-action sheet are outside the board). Focus-visible outlines at the board's edges are clipped by the frame exactly as before (the clip rectangle did not change); scrolling now lets a user bring any control to the middle.
**Keyboard (real Tab presses, coarse, 12 rounds):** Tab from the Add-a-hero button reached Talin's round-12 cell after 114 presses; Chromium scrolled the board to `scrollLeft` 1247 of 1247, cell 471px from the left frame edge / 71.6px from the right, i.e. fully in view. Shift+Tab back to the start returned `scrollLeft` to 0. Screenshot below.

## Gate design (`assertMontageBoardScroll`, shoot.mjs, next to `assertMontageTrackWidths` / `assertMontageCoarseContainment`)
For each of fine and coarse (own browser context each; the coarse one reuses the containment gate's `hasTouch+isMobile` emulation, 1000x2400 viewport; both prove the pointer match with `matchMedia`), at a 900px pane with a 14-round montage (the `mid` fixture's real DOM cloned out to 14 round columns, rounds 4+ alternately cloning the round-2 recorded cell and the round-3 open-socket cell with its quick trio, track list rewritten with BoardView's own formula):
1. `overflow-x` computed `auto|scroll` AND `scrollWidth > clientWidth` (fixture is not vacuous). Measured at fix: fine 1335px grid in a 690px frame; coarse 2231px grid in a 690px frame.
2. A real `page.mouse.wheel` over the board scrolls it to the far end (`scrollLeft == scrollWidth - clientWidth`). Needed because `scrollIntoView`/`scrollLeft=` are programmatic and DO work on an `overflow: hidden` box — so on the old CSS the per-cell check alone passes; the computed-overflow assertion and the wheel check are what discriminate.
3. Every direct child of the board (corner, every round header, Tally header; per hero: name cell, every round cell, tally cell = 96 children at 5 heroes x 14 rounds) is scrolled into view (`inline/block: nearest`, which also scrolls the page) and must lie fully inside the board's `clientLeft..+clientWidth` / `clientTop..+clientHeight` frame (0.5px tolerance), and `elementFromPoint` at its centre must resolve to that child. A `null` hit prints its own loud `PROBE POINT OFF-SCREEN — not a wrong hit` line (MED-1), never a wrong hit. Also asserts the board frame does not poke out of its card and that the child count equals `(2+rounds)*(1+heroes)` (guards DOM-build drift).
Caveat: the clones carry no listeners; the gate reads layout and hit-tests only, never clicks.
Success line: `montage board scroll OK (14 rounds x 900px pane, mid fixture cloned in-probe — fine: 1335px grid in a 690px frame, 96 cells reachable; coarse: 2231px grid in a 690px frame, 96 cells reachable; overflow-x auto, real wheel reaches the far end, …)`.

## Can-fail proofs (both reverted byte-clean)
Shots gate, real `npm run shots` (devbox exit 1, 5m08s) with `overflow: hidden` restored (log `sc326-r1-shots-canfail-fullrun.log`; that run predates the two-pointer-reporting tweak, so it stops at fine):
```
MONTAGE BOARD CLIPS INSTEAD OF SCROLLING — fine pointer, 14 rounds, 900px pane:
  NOT A HORIZONTAL SCROLL CONTAINER — .dse-mt__board computed overflow-x is 'hidden' (need 'auto' or 'scroll'); the grid is 1335px wide in a 690px frame, so 645px of round columns and tally are clipped with no way to reach them
  A MOUSE WHEEL OVER THE BOARD DID NOT SCROLL IT TO ITS FAR END — scrollLeft 0px of 645.0px reachable (a user cannot scroll the clipped columns into view)
See styles-source.css → .dse-mt__board (board frame + banding, decoration tier) — overflow-x must be auto.
Error: error running script "bash" in Devbox: exit status 1
```
Final gate code, extracted and run against the same `overflow: hidden` CSS (`sc326-r1-canfail-both-pointers.log`): both contexts reported — fine 645px clipped; coarse "the grid is 2231px wide in a 690px frame, so 1541px of round columns and tally are clipped"; wheel `scrollLeft 0px of 1541.0px reachable`.
Restored: `cmp styles-source.css <saved fixed copy>` identical; `git diff` shows only the intended hunk; gate green again.
Jest pin can-fail (`sc326-r1-jest-canfail.log`): with `overflow: hidden` restored, 1 failed / 100 passed: `● … CSS contract: the board frame scrolls sideways instead of clipping — overflow-x auto, overflow-y hidden, border + radius kept (SC-326)  Expected pattern: /overflow-x:\s*auto;/`. Restored -> 101/101.

## Gates (all at head `6f9affd`)
| gate | result |
|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | clean |
| lint | clean |
| jest | `Tests: 1 skipped, 5258 passed, 5259 total`; `Test Suites: 1 skipped, 229 passed, 229 of 230 total` (rm main.js/styles.css first; shots had run once in this worktree) |
| lifecycle (port 9286) | `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` |
| shots | 572 PNGs, 0 FAIL; `montage track widths OK`, `montage quick-trio containment OK (6 configurations …)`, NEW `montage board scroll OK (14 rounds x 900px pane …)`, host-copy pin OK, button host-leak 112 kinds x 3 states x dark/light = 672 |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` — no rebaseline |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |
Extra: ran `npm run shots` on a scratch `git worktree add --detach` of base `188755b` (removed afterwards) and diffed `sha256sum *.png`: 572 vs 572, 0 differences.

## Evidence (Playwright, real Chromium, steel dark, coarse pointer via `hasTouch+isMobile`, 12-round montage built in-probe, 900px pane; native scrollbars shown via `ignoreDefaultArgs: --hide-scrollbars` — the shots harness hides them)
- Before (base `188755b`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/sc326-r1-before-coarse-clipped-base-188755b.png` — clipped at round 4, no scrollbar; round 5-12 and the Tally unreachable (grid 1937px in a 690px frame, `overflow-x: hidden`).
- After, scrollLeft 0: `.../sc326-r1-after-coarse-scrollLeft0.png` — same view plus a scrollbar along the frame's bottom edge.
- After, scrolled fully right (rounds 9-12 and the Tally visible): `.../sc326-r1-after-coarse-scrolled-right-tally.png`
- After, keyboard focus on the last hero's last round cell: `.../sc326-r1-after-coarse-keyboard-focus-last-round.png`
(Scratch scripts, for reproduction only: `sc326-r1-evidence-scratch.mjs`, `sc326-r1-rungate-scratch.mjs` in the ledger dir; they take the plugin root as argv[2].)

## Drive-by fixes
None.

## Follow-ups
1. **Board scroll position is lost on every write.** `view.ts` rebuilds the whole element (including a fresh `BoardView`) on every logged entry, sheet save, end-round and strip toggle (`this.update(...)`/commit), and nothing saves or restores `.dse-mt__board` `scrollLeft`. A Director who scrolls right to round 12 and taps the quick trio or saves the sheet gets the board snapped back to `scrollLeft` 0 (read from source; not measured end-to-end, the harness has no write loop). Likely fix: capture `scrollLeft` before rebuild and restore after (TS in `BoardView`/`view.ts`; or scroll the current-round column into view on build). Out of scope here (CSS-only brief); worth a ticket, and arguably should land with or soon after SC-326.
2. Pinned (sticky) hero-name column while scrolling: not done, per ledger decision 4 (needs opaque cell backgrounds). Observation: in the coarse 900px pane the name column is already truncated to "K..", "B..", etc. because the 44px row action + minimum track leave little for the name — pre-existing at base, visible in the "before" shot.
3. Gate limitation (documented in the code): per-cell reachability uses programmatic `scrollIntoView`; the real-input guarantee comes from the wheel check + computed `overflow-x`. A cheaper-than-100-wheel-scrolls design; say if the owner wants per-cell real-input scrolling.
4. The harness's `mount` at "900px" renders the card at ~760px / board frame 690px (mobile emulation + mount padding); same as the existing containment gate, unchanged.
