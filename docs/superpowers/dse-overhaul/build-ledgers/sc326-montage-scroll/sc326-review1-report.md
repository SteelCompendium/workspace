# SC-326 review 1 — independent adversarial review (dse `44186fe`, base `188755b`)

## Executive summary
- **Verdict: FIX-ROUND** (2 MED, both small and local; nothing HIGH). The core fix is real: in real Chromium at 12 and 20 rounds, at every pane width from just above the 420px breakpoint to 1600px, fine AND coarse, a horizontal wheel, Shift+wheel and a raw touch drag all reach the far end, and no ancestor clips the frame. Round 2 holds in real Obsidian, including mid-scroll (not only far-end), two blocks in one note, close and reopen, with no observer leak.
- **MED-1, the owner's eyeball concern, confirmed:** whenever the grid overflows, the Tally track collapses to its `4.4em` floor (70.4px) but its chips need 94.8px. The chips overflow their own cell by 0.7 to 4.2px, and at max `scrollLeft` the "× n" chip sits **0.45px** from the frame (at coarse `mid` near the overflow edge it is **0.25px past** it). When the board fits, base and head both leave 11.53px. Fix: Tally track `minmax(max-content, auto)` (BoardView.ts:101 and the gate's copy). Measured: 11.1 to 11.7px in every case, and the layout is the same at every width where the board fits.
- **MED-2: keyboard Tab leaves the focused cell almost entirely hidden.** Chromium does not scroll a focused element that is already partly visible. 12 rounds at 900px: 5 of 75 focus stops (fine) and 15 of 75 (coarse) are partly clipped, worst case **2px visible of a 147px cell**. Fix: a `focusin` listener on the board that calls `scrollIntoView({inline:'nearest', block:'nearest'})`. Measured: 0 of 75 clipped, fine and coarse.
- LOW: a 15px desktop scrollbar for 1px of overflow in a ~1.5px pane-width band just above the narrow breakpoint (fine `mid`/`done`/`failed`, mount 488.5–490px). The gate copies BoardView's track list by hand and checks neither the content inside a cell nor Tab visibility. G-S12 drives only the far-end path. The CHANGELOG says "mouse wheel", but a plain vertical wheel does not scroll the board sideways.
- Gate is real: it fails loudly on 8 of 8 regressions I injected, including a clip that applies only to the coarse pointer (caught only in the coarse context, which proves the coarse emulation is real). MED-1 of SC-299 is handled.
- Battery at `44186fe` (my runs): tsc/lint clean; jest **5262 passed / 1 skipped / 229 of 230**; lifecycle **28/28**; e2e **83/87 ok, 0 failed, 4 known-bug, 57/57**; shots 572, 0 FAIL, `montage board scroll OK`; freeze **276/276**; parity **0 / 0 / 24 declared**. `origin/develop` is still `188755b` (no rebase needed).
- Scott evidence from a GENUINE 12-round source: `sc326-rv1-scott-before.png` and `sc326-rv1-scott-after-right.png`; the MED-1 zoom and fix preview: `sc326-rv1-tally-flush-zoom.png` and `sc326-rv1-tally-fix-preview-zoom.png`.

## Findings

### MED-1 — Tally chips flush against (and at coarse 0.25px past) the frame whenever the board overflows
- **Where:** `src/elements/montage/BoardView.ts:101` (`cols.push('minmax(4.4em, auto)')`); the same line is copied into the gate at `visual-harness/shoot.mjs:1045`, and the containment gate has its own copy at `:956`.
- **Mechanism:** when the sum of the round-column floors exceeds the frame, free space is negative, so the `auto` max tracks never grow. The Tally track stays at its `4.4em` floor (70.39px measured), and `.dse-mt__board > * { min-width: 0 }` lets the chips (max-content 94.84px) overflow the cell. The overflow extends `scrollWidth`, so at max `scrollLeft` the last chip lands on the frame edge.
- **Measured (real Chromium, real element):** head, fine and coarse, 12 and 20 rounds, 500 to 1600px: last chip 0.45px from the frame; the chip overflows its own cell border by 0.72px (12 rounds) or 4.22px (20 rounds). Coarse `mid`/`default`/`done` at the overflow edge: chip **−0.20 to −0.25px**, i.e. clipped by the frame. When the board fits (`mid` at 900/1200px, base == head): 11.53px, equal to the cell's 0.72em padding. Zoom: `sc326-rv1-tally-flush-zoom.png`.
- **Failure scenario:** a Director with 6+ rounds on a tablet scrolls fully right. The Tally, the column they scroll right to see, has its "× n" chip glued to the border with no padding, and its right-hand border is clipped by a fraction of a pixel at some widths.
- **Fix:** change the Tally track to `minmax(max-content, auto)` in BoardView.ts:101 and in both shoot.mjs copies (or make the gate read BoardView's list; see LOW-2). I swept the change in-page from 480 to 1300px in 7px steps over `mid`/`default`/`done`/`r12`/`r20`, fine and coarse: the smallest gap between chip and frame becomes 11.11 to 11.73px everywhere (preview: `sc326-rv1-tally-fix-preview-zoom.png`). `getComputedStyle(board).gridTemplateColumns` and `scrollWidth` are identical to today at every width where the board fits (first difference only at an overflowing width), so frozen shots should not move. Confirm with freeze. Side effect: the overflow threshold moves about 24px wider, since the Tally no longer gives up its content width. Optionally apply the same treatment to the name column (`minmax(6.2em, auto)` → names truncate to "K.." when overflowing). That one is pre-existing and touches decision 4, so leave it to Scott.
- **Gate gap that let it through:** `assertMontageBoardScroll` (`shoot.mjs:1149` loop) checks that each board CHILD lies inside the frame, not that the child's content lies inside the child. Add: for each child, every descendant's rect lies inside the child's border box, or simply `child.scrollWidth <= child.clientWidth + 0.5`.

### MED-2 — Tab focus lands on a cell that is up to 98% hidden
- **Where:** board construction `src/elements/montage/BoardView.ts:79-102` (or `view.ts:483` `restoreBoardScroll`, which already owns per-mount board listeners).
- **Mechanism:** Chromium's focus-induced scroll does nothing when the focused element already intersects the scrollport. A cell sitting at the right edge with a few pixels showing stays where it is. The next Tab, to a fully hidden cell, centres that one, so the scroll jumps past.
- **Measured** (`sc326-rv1-probes.log` → `tabtouch-head`, `tabfix`; 150ms settle wait after each Tab; `scroll-behavior: auto`): 12 rounds at 900px. Fine: 5 of 75 stops partly clipped; `Kira r8` 9px visible of 83. Coarse: 15 of 75; `Kira r5` **2px visible of 147**. The same pattern appears at 500/560/700/1200/1600px and at 20 rounds (`reach-head*`). r1's keyboard claim checked only the last cell.
- **Failure scenario:** a keyboard user Tabs across a round. At the column on the frame's right edge, focus goes to a cell they cannot see (2px sliver, focus ring clipped) and the next Tab jumps the board by half a frame.
- **Fix:** `owner.registerDomEvent(board, 'focusin', (e) => ((e.target as HTMLElement).closest('.dse-mt__board > *') ?? e.target).scrollIntoView({ inline: 'nearest', block: 'nearest' }))`. Measured in-page: **0 of 75 partly clipped**, fine and coarse. CSS `scroll-padding-inline: 2em` alone fixes fine but leaves coarse at 10 of 75, so it is not enough. Interaction check for the fixer: a mouse click on a fully visible quick-trio button must not move the board (G-S12 still asserts this). `nearest` does not scroll when the element is already fully visible. **Gate:** add a real-Tab walk to `assertMontageBoardScroll` that asserts every focused board descendant is fully inside the frame. It fails at HEAD today, which gives you the can-fail for free.

### LOW-1 — 15px scrollbar for ≤1px of overflow, in a ~1.5px band just above the narrow breakpoint
- **Where:** `styles-source.css:4601` (`overflow-x: auto` on a grid whose floors land within 0.1px of the frame).
- **Measured** (scrollbars visible, 0.5px sweep, `band.log`): fine `mid`/`done`/`failed` at mount 488.5–490px (card ≈455px, the first wide-layout widths): `scrollWidth 420 / clientWidth 419`, `gridRight 419.1`, horizontal scrollbar 15px. Coarse `default`/`old-shape` at 533.5–534px and `mid` at 680.5–682px show the same 1px tail where real overflow ends (overlay scrollbar, 0px gutter). No other fixture or width from 240 to 1600px produced a scrollbar without real overflow. On desktop Obsidian, scrollbars are not overlay.
- **Fix (owner's call):** accept and note it in the CHANGELOG, or nudge the narrow container breakpoint up a few px (`@container dse-mt (max-width: 420px)` → ~424px) so the wide layout never starts with its floors flush against the frame. Re-check `montage-narrow` (300px, unaffected) and freeze.

### LOW-2 — the gate hand-copies BoardView's track formula
- **Where:** `visual-harness/shoot.mjs:1043-1046` overwrites `--dse-mt-cols` with a literal copy of `BoardView.ts:99-101`.
- **Failure scenario:** a regression in BoardView's track list, such as a Tally track that clips, or the MED-1 fix itself, is invisible to the gate, because the gate tests its own copy and not the shipped formula.
- **Fix:** export the track-list builder from BoardView, or a `MONTAGE_TRACKS` constant, and have the in-probe build read it from the bundle (e.g. via a `window.__dse…` hook the harness already exposes), or derive the 14-round list from the rendered board's own value by repeating its round track.

### LOW-3 — G-S12 drives only the far-end (`atEnd`) path
- **Where:** `visual-harness/obsidian-lifecycle.mjs:1557` (`b.scrollLeft = b.scrollWidth` before every click).
- **Why it matters:** the `saved.left` branch and the adoption re-apply of a mid offset are proven only in jsdom. I proved them in real Obsidian with a scratch scenario (below), but nothing in the landed gate does.
- **Fix:** add a mid-scroll tap (start strictly between 0 and max) and a second montage block in the same note to G-S12, asserting the other block's offset holds. My scratch scenario `G-RV1` does exactly this and is reproduced below for the fixer.

### LOW-4 — CHANGELOG wording
- **Where:** `CHANGELOG.md:28` ("mouse wheel, trackpad, touch, or Tab to a control").
- **Measured:** a plain vertical wheel over the board scrolls 0px sideways (`plainWheelSideways 0`). Shift+wheel and horizontal wheel/trackpad reach the far end. "Tab to a control" overstates the result until MED-2 is fixed.
- **Fix:** "Shift + mouse wheel, trackpad, touch, or Tab". "A board that fits looks exactly as before" is accurate apart from LOW-1.

### INFO
- **Observer accumulation in the harness and jest only.** In the visual harness, each write adds one live `data-dse-moving` MutationObserver (3 → 4 → 5 → 6; base stays at 1). The cause is that the harness and jest hosts' `addChild` is a stub, so the view and its `cycleOwner` are never `load()`ed and the mock `Component.unload()` no-ops (`test/mocks/obsidian-core.ts:395`). In **real Obsidian** the count stays flat at 1 across 3 writes, drops to 0 after navigating away, goes 2 → 4 with a split leaf and back to 2 after detaching it (`sc326-rv1-lifecycle-GRV1-scratch.log`). Not a product leak. Worth knowing before trusting a harness-side leak probe.
- **Composited-scroller AA.** An overflowing board (allowed to change) differs from base in 83 strongly-different pixels (light theme, 12 rounds, coarse, scrollLeft 0): glyph antialiasing on the scroll layer, invisible side by side. Boards that fit: byte-identical (below).
- **Detach without the moving mark.** A detach without `data-dse-moving` (e.g. Obsidian virtualising an off-screen section of a long note and re-attaching it) will still reset the board to 0. This is the same class of issue as SC-467 (filed); not a regression, since base had no scroll at all.
- `synthesizeScrollGesture` (CDP, touch) scrolls nothing in this headless build, not even a plain `overflow-x:auto` div used as a control. Raw `Input.dispatchTouchEvent` drags work: the control div moved 335px and the board 447px. My `touchDrag 0` rows in `reach-head-coarse` are this tool limitation, not a product defect.

## 1. Real chain — reachability (head, real element via genuine 12/20-round fixtures, `sc326-rv1-probes.log` → `reach-head*`)
Panes at mount widths 470/500/560/700/900/1200/1600px. The card caps at 726px, giving a 690px frame. Width 470 gives a card of 436px, which is the narrow stacked layout (`scrollWidth == clientWidth`, no overflow, correct). Width 500 gives a card of 466px, the first wide layout. For both pointers and both round counts, at every wide width:
- `overflow-x: auto`, `overflow-y: hidden`; `scrollHeight == clientHeight`, so the scrollbar never clips the last row (fine: 15px classic bar added to the box; coarse: overlay, 0px).
- Horizontal wheel and Shift+wheel both reach exactly `scrollWidth − clientWidth`. Examples: fine r12 at 900 reaches 479 of 479; coarse r20 at 900 reaches 2428 of 2428. A plain vertical wheel moves the board 0px.
- Raw touch drag scrolls the board (447px for 20 touchMove steps).
- Tab reaches every control (75 at 12 rounds, 115 at 20 rounds; the last one is Talin's last-round trio) — but see MED-2.
- Clipping ancestors: only the harness's `.markdown-preview-view` (overflow auto) and `body` (clip). The frame lies inside both; `frameRightOverCard −17` (inside the card). Nothing between the board and the card clips.

## 2. Regressions (base `188755b` vs head, byte comparison of `#mount` screenshots, `regress` rows)
Byte-identical: print 12 rounds fine and coarse (computed `overflow visible`, no border, unchanged; the print selector is untouched); light `mid` fine; dark `mid` coarse with focus-visible on Add-a-hero (top-left edge); dark `mid` fine with focus on Talin's round-3 trio (bottom-right region); dark `mid` coarse with focus on a left-edge cell; narrow 300px coarse `mid`; narrow 300px fine 12 rounds. Border `1px solid` and radius `6.4px` are kept on the frame. Light 12-round coarse (overflowing) differs only by AA (INFO). No popover or menu is anchored inside the board: the only absolutely positioned descendants are `.dse-mt__cell-notemark`/`-editmark`, inside `position: relative` cells, and the spurious-scrollbar sweep shows they never extend the scroll area. The quick-trio containment gate is still OK. The spurious-scrollbar sweep (5 fixtures × 2 pointers × 240–1600px step 3) found only the LOW-1 band.

## 3. The new gate — is it real? (`sc326-rv1-gate-mutations.log`)
I ran the gate's own code (extracted from shoot.mjs, as r1's `rungate` does) against a scratch head harness rebuilt per mutation. styles-source.css was restored with `cmp` byte-identical.

| mutation | result |
|---|---|
| M0 none | `montage board scroll OK` (fine 1335/690, coarse 2231/690, 96 cells) |
| M1 `overflow: hidden` restored | FAIL both pointers: NOT A HORIZONTAL SCROLL CONTAINER + wheel `0px of 645.0px` / `0px of 1541.0px` |
| M2 clip moved to `.dse-mt__board-wrap`, board `overflow: visible` | FAIL: computed `visible` + wheel + 9 CELL UNREACHABLE lines |
| M2b board `min-width: max-content` + wrap clips | FAIL: fixture does not overflow + "frame pokes 730.9px out of its card" |
| M3 Tally header + cells `display: none` | FAIL: CELL UNREACHABLE × 6 per pointer |
| M3b Tally cells `visibility: hidden` | FAIL: WRONG HIT × 5 per pointer |
| M5 clip ONLY under `(pointer: coarse)` | FAIL **coarse context only** (fine passes), which proves the coarse emulation is real; the gate also `process.exit(1)`s if `matchMedia` disagrees |
| M6 card `overflow: hidden` + board max-content | FAIL: frame overhang + not a scroll container |
| M7 round-14 column `visibility: hidden` | FAIL: WRONG HIT × 6 per pointer |

SC-299 MED-1 trap: `elementFromPoint` is called after `scrollIntoView` scrolls the cell and the page into the 2400px viewport, and a `null` hit is pushed to its own `PROBE POINT OFF-SCREEN — not a wrong hit` line (`shoot.mjs` offscreen branch). That is correct. The real `npm run shots` can-fail exit 1 is r1's `sc326-r1-shots-canfail-fullrun.log`; my M1 reproduction runs the identical function body. Gaps: MED-1 and MED-2 are not detected, and LOW-2 applies.

## 4. Battery (my runs at `44186fe`; logs in the ledger dir)
| gate | line |
|---|---|
| tsc | clean (`sc326-rv1-tsc.log`) |
| lint | clean, exit 0 (only the pre-existing `.eslintignore` warning) |
| jest | `Tests: 1 skipped, 5262 passed, 5263 total` / `Test Suites: 1 skipped, 229 passed, 229 of 230 total` (`rm -f main.js styles.css` first; shots had already run in this worktree) |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed`; `G-S12 ok (… held at 1184/1184 over 133 frames …; End round … 1184/1184 over 137 frames …)` |
| e2e | `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` |
| shots | 572 PNGs; `montage track widths OK`, `montage quick-trio containment OK (6 configurations …)`, `montage board scroll OK (14 rounds x 900px pane … fine: 1335px grid in a 690px frame, 96 cells reachable; coarse: 2231px grid in a 690px frame, 96 cells reachable …)`, host-copy pin OK, button host-leak 112 × 3 × 2 = 672; no FAIL |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |

Shots took >10 min wall time because 3 other agents were running shots concurrently (load ~7). Not a code issue.

## 5. Owner eyeball concern (`sc326-r1-after-coarse-scrolled-right-tally.png`)
Confirmed and explained: see MED-1. At max `scrollLeft` the Tally CELL's border edge is 1.17px (12 rounds) or 4.67px (20 rounds) inside the frame, but its chips overflow the cell, so the "× n" chip is 0.45px from the frame. When nothing overflows (base and head identical) the chip sits 11.53px in. So the flushness is not a scroll-reach problem: max `scrollLeft` does reach the end of the scrollable overflow. It is the Tally track collapsing under negative free space.

## 6. Round 2 — scroll preservation
Code (`src/elements/montage/view.ts:92-103`, `:483-516`): it captures `{left, atEnd}` before `super.update` empties the root and consumes the value in `onMount` right after the board is built. `pendingBoardScroll` is cleared in `finally`, so it cannot leak into a later mount. The adoption repair watches `data-dse-moving` on `this.rootEl` (the `.dse-chrome-anchor` root, the same node `adoptView` marks), then a body MutationObserver (5s cap) re-applies before paint. Observers and timer are owned by `cycleOwner`. The strip toggle's `this.update(this.model)` also goes through the override, which is good.

Real Chromium (harness, `r2-head`/`r2-base`), two stacked blocks (A: 12 rounds, current round 6; B: 20 rounds, current round 20):
- **Mid-scroll real mouse tap in A** (216 of 479): head holds 216 on every sampled frame and the write landed (`kiraR6Kind success`). Base drops to 0.
- **Tap in B at its far end** (1148 of 1148): head B holds 1148 and **A keeps 216** (no shared state). Base drops B to 0.

Real Obsidian 1.14.4, scratch scenario `G-RV1` (two 20-round blocks in one note; A at mid 699 of 884, B at its far end 884; 3 quick-trio taps on A; `sc326-rv1-lifecycle-GRV1-scratch.log`):
- **Every tap, A and B:** `badFrames 0` over ~110 frames per tap (rebuild + adoption).
- **Observer count:** live `data-dse-moving` observers stay at **1**. Navigate away: **0**. Reopen: both boards start at **0** (fresh mounts, nothing carried). Split leaf on the same note: 4. Detach it: 2.
- **Note integrity:** OK.

Clamp: the far-end rule puts "Add a round" at the new far end (jest #2). A narrower board clamps through the browser. No in-element action reduces `rounds` (only external edits, which are fresh mounts per G-S5). Note: "Reset progress" from the far end keeps the board at the far end while the current round returns to 1. Defensible, flag only.

The Live Preview and SC-467 generic adoption reset are out of scope per the ledger.

## 7. Scott-facing evidence (genuine 12-round source)
Fixture: `rounds: 12`, 5 heroes, 55 entries over rounds 1–11, `successes: 31`, `failures: 16`, `current_round: 12`. It was mounted through the real element in scratch `git worktree add --detach` clones of `188755b` and `44186fe` (removed afterwards), with coarse pointer (`hasTouch+isMobile`, `matchMedia` true), 900px pane, steel dark, the real Obsidian sheet, native scrollbars on, and the shot cropped to the card. The header reads "ROUND 12 / 12", consistent with the board.
- `sc326-rv1-scott-before.png`: base. `overflow-x hidden`; rounds 1–4 visible, rounds 5–12 and the Tally cut off with no way to reach them (grid 1937px in a 690px frame).
- `sc326-rv1-scott-after-right.png`: head. Scrolled fully right (`scrollLeft 1247/1247`): rounds 9–12 (round 12 in play with its quick trios) and the Tally are visible. The MED-1 flush chip is visible at the right edge.

## 8. Scope
CSS: exactly one rule changed (`.dse-mt__board` frame, `styles-source.css:4588-4603`), inside the montage decoration tier. No overlap with SC-422. TS: `view.ts` only. Framework untouched. CHANGELOG: one `[FIX]` bullet; accurate apart from LOW-4.

## Hygiene
`git -C …/draw-steel-elements status --porcelain` was empty before and after; HEAD is still `44186fe`. Scratch worktrees `sc326-rv1-ad908/{base,head}` were removed (`git worktree list` shows none). The superproject worktree shows ` M draw-steel-elements` (the submodule is ahead of its pin: the implementer's branch state before `wt-finish`, not mine). I killed no processes.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/`)
Gate logs: `sc326-rv1-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`. Probes: `sc326-rv1-probes.log`, `sc326-rv1-gate-mutations.log`, `sc326-rv1-lifecycle-GRV1-scratch.log`. Screenshots: `sc326-rv1-scott-before.png`, `sc326-rv1-scott-after-right.png`, `sc326-rv1-tally-flush-zoom.png`, `sc326-rv1-tally-fix-preview-zoom.png`. Reproduction scripts: `sc326-rv1-scratch-*.{mjs,py,sh}` (the probes take `<node_modules root> <plugin root>`; `genfix.py` makes the 12/20-round fixtures; they need a scratch clone with those fixtures registered in `visual-harness/entry.ts`'s `FIXTURES.montage`).

### Scratch scenario G-RV1 (for LOW-3; was appended to a scratch copy of obsidian-lifecycle.mjs)
Fixture `Lifecycle/montage2.md`: two `ds-montage` fences. Block A: 20 rounds, 3 heroes, `current_round: 10`, limits 40/30. Block B: 20 rounds, 2 heroes, `current_round: 20`. The scenario does the following:
1. Scroll A so its round-10 column is in view, strictly mid (`scrollLeft = cell.offsetLeft − 150`), and scroll B to `scrollWidth`.
2. For each of Kira, Bram and Osric: `.click()` A's round-10 success quick button, then sample both boards' `scrollLeft` every rAF for 2.5s. Assert every frame equals the start for A and for B.
3. Wait for the writes on disk and check note integrity.
4. Leak check: patch `window.MutationObserver` to count observers whose `attributeFilter` includes `data-dse-moving`. The count should stay at 1 across writes and drop to 0 after navigating away.
