# SC-326 r2 report — the montage board keeps its horizontal scroll across a write

## Executive summary
- STATUS: DONE. dse branch `sc326-montage-scroll`, head `44186fe` (one commit on r1's `6f9affd`). Base `188755b` unchanged.
- MEASURED in real Obsidian 1.14.4 (new lifecycle scenario G-S12, 20-round board scrolled to its far end, fine pointer): a quick-trio tap snapped `scrollLeft` 884 -> 0 on the first frame (137 of 138 frames off). Hypothesis confirmed.
- There are TWO resets, not one: (1) the view's own rebuild (`update()` empties the root and rebuilds a fresh board), (2) ~0.55 s later the host's adoption move (`adoptView`: `appendChild` of the live root into the re-drawn section, detached until Obsidian inserts it), which zeroes a scroll container's offset with no `scroll` event and no ResizeObserver callback.
- Fix is view-local in `src/elements/montage/view.ts`; framework untouched (the adoption reset is a shared-framework behaviour, undone locally; see Follow-ups for the generic option). Round-count change: a board at its far end stays at its far end ("Add a round" shows the new round); otherwise the offset is kept and the browser clamps.
- Tests: 4 new jest tests (all fail on `6f9affd`: 3 of them there, the adoption one alone when the observer is removed) + lifecycle G-S12 (fails on the pre-fix code, fails on the rebuild-only fix, passes on the final fix).
- Battery at `44186fe`: tsc/lint clean; jest 5262 passed / 1 skipped / 229 of 230; lifecycle **28/28** (was 27); e2e 83/87 ok, 0 failed, 4 known-bug, 57/57; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24; all 572 PNGs still byte-identical to base.

## 1. Measurement (before)
Scenario `G-S12` (`visual-harness/obsidian-lifecycle.mjs`, fixture `Lifecycle/montage.md`: `rounds: 20`, `current_round: 20`, heroes Kira + Bram). Reading view; board scrolled to the far end; `.click()` on Kira's round-20 quick-trio success button; `scrollLeft` of whatever board is in the DOM sampled every animation frame for 2.5 s (covers the 400 ms persist debounce, the write, and the host re-draw).
- At `6f9affd` (r1 head): `G-S12 FAIL: quick-trio tap: scrollLeft moved after the write — start 884, 137/138 frames off (min 0, saw 1 board element(s))` — log `sc326-r2-lifecycle-G-S12-before.log`, shot `sc326-r2-before-G-S12-FAIL.png`.
- With only the in-view fix (carry across `update()`): still `FAIL … start 884, 112/136 frames off (min 0)`: 884 held for ~23 frames, then 0. A MutationObserver probe (`sc326-r2-lifecycle-probe-rebuild-fixed-adoption-not.log`) timeline: t=3 ms old `.dse-mt` removed/added (the rebuild); t=63 ms new board added with `scrollLeft` 884 (the in-view fix works); t=612 ms the montage ROOT removed and re-added under a fresh `el-pre` section (the adoption), `scrollLeft` 0.
- A second probe (`sc326-r2-lifecycle-probe-no-RO-no-scroll-event.log`) showed that the adoption fires neither a `scroll` event nor a ResizeObserver callback (the root leaves and re-enters within one frame), so neither can be used to repair it.
Both probes were temporary edits to the scenario, reverted (the committed scenario has no probe code).

## 2. Fix (`src/elements/montage/view.ts`, local to the montage view)
- `update(model)` override: captures `{scrollLeft, atEnd}` of the existing `.dse-mt__board` just before `super.update()` empties the root; `onMount` consumes it right after `BoardView.build` (`restoreBoardScroll`), when the new board is attached and measurable. The captured value is cleared in a `finally` so it never leaks into a later mount.
- Round-count rule (chosen): if the board was scrolled to its far end (within 1px) it is put at the NEW far end (so "Add a round" shows the added round instead of leaving it hidden just past the old edge); any other position is restored as is and the browser clamps it if the board got narrower. No special case on the round count itself.
- Adoption: `restoreBoardScroll` tracks the offset from the board's own `scroll` events, watches the `data-dse-moving` attribute `adoptView` puts on the root for the `appendChild` (same marker `stepper.ts` / initiative's `view.ts` already import), and once the mark is removed waits (body MutationObserver, <= 5 s, same shape as `restoreFocusWhenConnected`) until the board is connected again and re-applies the offset before paint. Observers are owned by the per-mount `cycleOwner`, so they are torn down on every rebuild.
- Nothing under `src/framework/` changed.

## 3. Tests
jest (`test/dom/elements/montage.test.ts`, new `describe('SC-326 r2 …')`, 4 tests; jsdom has no layout, so the test gives elements a per-element `scrollLeft` like the browser (a rebuilt board starts at 0) and controllable `scrollWidth`/`clientWidth`, restoring the real descriptors afterwards):
1. a quick-trio tap from mid-scroll (640 of max 1300) leaves the rebuilt (new element) board at 640 and the write did land;
2. a board scrolled to its far end stays at its far end when "Add a round" widens it (1600, not 1300);
3. the board survives the host adopting its root into a new section (root moved while detached with `data-dse-moving`, board zeroed as a browser does, then inserted) -> 640;
4. a board never scrolled stays at 0.
Can-fail, against the `6f9affd` `view.ts` (`sc326-r2-jest-canfail.log`): `Tests: 3 failed, 102 passed` — #1 `Expected: 640 Received: 0`, #2 `Expected: 1600 Received: 0`, #3 `Expected: 640 Received: 0` (#4 is a guard that should pass either way). Adoption half alone (observer wiring removed, `sc326-r2-jest-canfail-adoption-half.log`): `Tests: 1 failed, 104 passed` — #3 `Expected: 640 Received: 0`. Restored byte-identical (`cmp`), 105/105 green.
Real environment: lifecycle `G-S12` (appended, 28 total; header comment updated). Taps the quick trio, then End round, each from the far end; asserts every sampled frame equals the start offset and that the write landed on disk with note integrity. Result after the fix: `G-S12 ok (quick-trio tap: scrollLeft held at 884/884 over 129 frames (1 board element(s) seen); End round: scrollLeft held at 884/884 over 133 frames …)`; in the full run `… held at 1184/1184 over 136 / 142 frames`. (The start differs between runs only because the Xvfb pane width differs.)
The sheet-save path is the same `commit()` -> `update()` + persist as both scenarios, so it takes the same two repairs; not driven separately.

## 4. Battery at `44186fe`
| gate | result |
|---|---|
| tsc (incl. `-p e2e`) / lint | clean / clean |
| jest | `Tests: 1 skipped, 5262 passed, 5263 total`; `Test Suites: 1 skipped, 229 passed, 229 of 230 total` (5257 base + 1 r1 + 4 r2) |
| lifecycle (port 9286) | `OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed` (**new expected count 28**, was 27; includes G-S12) |
| e2e | `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` |
| shots | 572 PNGs, 0 FAIL; `montage board scroll OK` and the other montage lines unchanged; host-leak 112 kinds / 672 |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |
All 572 shot PNGs are sha256-identical to the base `188755b` run taken in r1 (0 differences).
CHANGELOG bullet updated (the SC-326 `[FIX]`): it now also says the board stays where you scrolled it when you log a result or end a round.

## Files changed in r2
`draw-steel-elements/src/elements/montage/view.ts`, `…/test/dom/elements/montage.test.ts`, `…/visual-harness/obsidian-lifecycle.mjs` (fixture + G-S12 + header comment), `…/CHANGELOG.md`.

## Drive-by fixes
None.

## Follow-ups
1. The adoption reset is generic: `adoptView`'s `appendChild` of the root drops the scroll offset of EVERY scroll container under every adopted element (e.g. encounter's roster, any `.dse-md-table` wrap, a hero/statblock inner scroller) — only the montage board is repaired here. The generic repair belongs in `src/framework/host/adoptView.ts` (capture `scrollLeft/Top` of scrolled descendants before the move and restore when the section is inserted, mirroring `restoreFocusWhenConnected`); it was not done because the r2 brief keeps the shared write path out of scope. Worth a ticket if other scrollers are in the field.
2. `.claude/skills/dse-verify/SKILL.md` (workspace, not touched by me) lists lifecycle as `27/27` in several places; the new expected value is `28/28`.
3. Live Preview was not driven for G-S12 (Reading view only, like G-S8). In Live Preview the block is a CodeMirror widget re-created by the editor, i.e. a fresh mount; nothing carries over there by design, with or without this change.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/`)
`sc326-r2-report.md`; gate logs `sc326-r2-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`; measurement `sc326-r2-lifecycle-G-S12-before.log`, `sc326-r2-before-G-S12-FAIL.png`, `sc326-r2-lifecycle-probe-rebuild-fixed-adoption-not.log`, `sc326-r2-lifecycle-probe-no-RO-no-scroll-event.log`; can-fail `sc326-r2-jest-canfail.log`, `sc326-r2-jest-canfail-adoption-half.log`.
