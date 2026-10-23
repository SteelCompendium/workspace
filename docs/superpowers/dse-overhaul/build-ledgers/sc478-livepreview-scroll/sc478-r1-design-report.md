# SC-478 r1: design and measure round (Live Preview panes jump when a DSE block is redrawn)

## Executive summary
- **Reproduced on stock `1c271b5`** (Obsidian 1.14.4, 2/2 each, observed pane in Live Preview). (a) Another pane's DSE write: one-tracker note **3032 -> 0** (A Reading or A LP); tracker with text below, viewport on the tracker: scrollTop holds 3500 but the content under it jumps **line 83+1500 -> line 324**; viewport below the tracker **5925 -> 4956, line 147 -> 385**. (b) External `vault.process` / `vault.modify` / disk write via the file watcher: **2428 -> 0** on all three; `Lifecycle/tall.md` 3020 -> 2556 (line 63 -> 160). (c) The writer itself in LP jumps too (2428 -> 0; 3500 held but line 83 -> 324): in scope. (d) Plain note: holds 5081 (2/2, process and disk). (e) Viewport ABOVE the tracker: holds; ON: jumps; BELOW: jumps; tracker undrawn far above the viewport: holds. Popout LP: 2445 -> 0.
- **Mechanism (H2, refined; H1 and H3 rejected):** `modify` fires 1-13 ms before the view's single `setViewData` transaction (`userEvent: "set"`, a minimal diff: a 1-char edit is one 1-char change). The changed fence gets a NEW Obsidian code-block widget (`eq()` always false, `estimatedHeight` a constant **50 px**). Inside that same `EditorView.update`, CodeMirror's height map drops the block from 3039-6438 px to 50 px and recomputes the viewport from the unchanged scrollTop: at `docViewUpdate` the viewport is `[1872,1872]` (end of note) or `[2016,2745]` (POST filler) and the block is **not drawn at all**. Then a forced measure clamps scrollTop. No scrollIntoView, no focus or selection move, and no DSE code is involved.
- **Recommended design: "capture + restore + hold" (L23).** Capture `scrollSnapshot()` and the DSE widgets' {pos, height} at vault `modify`. On the view's next `set` transaction, dispatch the mapped snapshot (effects only) in a microtask. In `docViewUpdate`, give the redrawn, still-empty widget an inline `min-height` of its old height until our view mounts. **Why:** it restores the content (top line + offset), not a pixel offset, and both halves are required. L1 sizer floor failed 3/5; L2 snapshot-after-mount gave up 4/5; restore without the hold failed 3/5; the hold alone never engages because the widget is not drawn.
- **Prototype** (new `livePreviewScrollHold.ts`, +7 lines in `registerFrameworkElements.ts`, `PIN_TTL_MS` exported unchanged, no edit to ReadingModeBlockHost/fenceLine/sidebar): **all 21 cases x 2 held**: scrollTop min == max == start and same top line + offset. Exception: growth cases keep content (rows above shift by the row height). Popout held 2/2; plain notes untouched. Cost: about 0.1-0.6 ms per capture and about 1 ms per restore.
- **Gate `G-S18`** (phases a, b1, b2, c): **stock FAIL 3/3**, every phase failing ("lost its place: 3020 -> 2556, line 63+1500 -> 160+2 / 285+2"). **Prototype ok 3/3** (with G-S8 and G-S15 ok 3/3). **Control "restore never dispatched" FAIL 3/3**, every phase. Second control "no hold" FAIL 3/3, every phase.
- **Full lifecycle with the prototype: `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`, rc=0.** tsc (+e2e) rc=0, lint rc=0, targeted jest 71/71 (4 suites; 9 new tests). Tree clean at `1c271b5`.

## Environment and method
- dse worktree `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements` at `1c271b5`.
  - `origin/develop` was `1c271b5` at dispatch. The owner later reported develop moved to `08206e3` (SC-466) and then `772c3cd` (SC-457, adds G-S14). This round stayed on `1c271b5`.
  - `npm ci` was run, because `node_modules` was missing.
- Port 9378, Xvfb `:160-:163`, Obsidian 1.14.4 (Electron 21.4.1, **Chrome 106**: no `:nth-child(of S)`).
- **Bundles** (`sc478-r1-build.log`; shas are main.js/styles.css):
  - `stock` = `1c271b5` (`3deeda2ac897/a51ea2cc7529`);
  - `stockdbg` = stock plus a temporary processor-timing log (`805806aedbcd`), reverted;
  - `proto` (`5e5b445a900d`);
  - `proto-norestore` (`d4785a77ff2d`): `view.dispatch({ effects: restore })` replaced by a no-op;
  - `proto-nohold` (`182dac50af63`): `applyHolds` returns at once.

  After those builds, the patch differs from the built source only in one header comment (the "Needs nothing" paragraph). The full lifecycle was built in-tree from the patch source minus that comment.
- **Probes** were injected before `main()` and restored from a saved copy after each run:
  - `sc478-r1-probe-repro.mjs.txt` (`P478-REPRO`/`P478-DOM`): per-rAF scrollTop/scrollHeight/widget height, top line, selection and focus. It also logs every `EditorView.update` (changes, userEvent, scrollIntoView, effects), every `cm.measure` with its stack, every write to the scroller's `scrollTop` (instance setter, with stack), widget add/remove, `setViewData`, `focus()`/`scrollIntoView()` calls inside the panes, and a page-side `modify` snapshot. `P478_QUIET=1` removes the probe's own forced layout reads inside the update.
  - `sc478-r1-probe-candidates.mjs.txt` holds the page-side L1/L2/L3/L23 candidates, compared on the stock bundle.
  - `sc478-r1-probe-widget.mjs.txt` reads Obsidian's widget from the decoration set.
  - `sc478-r1-probe-cost.mjs.txt` (`P478-COST`).
- Fixtures (probe-only): `SC478/one.md` (45-hero tracker, SC-470's lp-process note); `SC478/mid.md` (40 PRE paragraphs, a 25-hero tracker, 70 POST); `SC478/long.md` (260 POST); `SC478/plain.md` (220 paragraphs). G-S18 uses the existing `Lifecycle/tall.md`.

## 1. Reproduction on stock (`sc478-r1-repro-stock.log`, `sc478-r1-REPRO-stock-repro.json`; scrollTop start -> min/end, top visible line+offset, DSE widget height)

| case | observed LP pane | rep 1 | rep 2 |
|---|---|---|---|
| (a) one.md, A Reading writes, B LP | B | 3032 -> 0, L3+2952 -> L1 | same |
| (a) one.md, A LP writes, B LP | A (writer) | 3032 -> 0 | 3032 -> 0 |
| | B | 3032 -> 0 (B's transaction came 2.47 s after `modify`, the main thread being busy with A's remount) | not updated within the 3.5 s window |
| (a) mid.md, viewport ON tracker (+1500) | B | 3500 held, **L83+1500 -> L324+10**, tracker no longer drawn | same |
| (a) mid.md, viewport ABOVE | B | 679 held, L27+23 held | same |
| (a) mid.md, viewport BELOW | B | **5925 -> 4956, L147 -> L385** | same |
| (c) one.md, LP pane's own write | writer | **2428 -> 0** | same |
| (c) mid.md ON, own write | writer | 3500 held, **L83 -> L324** | same |
| (b) `vault.process` one.md | A | **2428 -> 0** | same |
| (b) `vault.modify` one.md | A | **2428 -> 0** | same |
| (b) Node `fs.writeFileSync` (watcher) one.md | A | **2428 -> 0** | same |
| (e) process mid.md ON | A | 3500 held, **L83+1500 -> L199+10** | same |
| (e) process mid.md ABOVE | A | 679 held, L27+23 held | same |
| (e) process mid.md BELOW | A | **5238 -> 4956, L147 -> L260** | same |
| (e) process `Lifecycle/tall.md` ON | A | **3020 -> 2556, L63+1500 -> L160** | same |
| (e) tracker measured, then the viewport at the end of the note / far below it (undrawn) | A | 7945 -> 4956 but the same last screen (L260+2 held; bottom-anchored); long.md 7038 held | same (prototype identical: nothing captured) |
| growth (a hero added at the top of the tracker; from the first page-side L3 run, which never engaged = stock; its log/json were overwritten by later L3 debug runs, numbers from that run's console line) | A | ON: L83 -> L201; BELOW: 5238 -> 4956, L147 -> L262; one.md 2428 -> 0 | — |
| (d) plain note, process / disk write | A | 5081 held, L211+9 held | same |
| popout LP, process one.md (`ownerDocument` != main) | A | **2445 -> 0** | same |

- In every jumping case the scrollHeight seen at the next frame is either back to full (one.md: the block is still in the viewport and remounts) or permanently short (8966 -> 5977: the block stays at its 50 px estimate until scrolled back to).
- **Answer to (d):** plain notes hold. The scope is DSE notes only, and the mechanism needs a redrawn block widget.

## 2. Mechanism (measured; `sc478-r1-REPRO-stockdbg-tl.json`, `sc478-r1-tl-stockdbg.log`, `sc478-r1-WIDGET-stock-widget.json`, `sc478-r1-REPRO-stock-cand-L3.json` = the L3 debug run that dumped the contentDOM at docViewUpdate)
- **Order of events, one LP pane, external process** (ms after recording start; one frame throughout):
  1. `modify` @124.5, while the old widget is still at full height;
  2. `setViewData(data, clear=false)` @126.2;
  3. a single `EditorView.update` @126.8 with one transaction: `changes [[1866,1867,1866,1867,1]]`, `userEvent "set"`, `scrollIntoView false`, no effects, selection unchanged;
  4. `setViewData` returns @141.6 with scrollTop already 0 and scrollHeight 1021;
  5. a forced `measure` @143.9 (stack `updateDom -> coordsAtPos -> readMeasured -> measure`, Obsidian's) sets `scrollTop` 0 -> -24, clamped to 0;
  6. our processor runs @146.7 (`connected:false`, `getSectionInfo` lineStart 2), the old widget DOM is removed and the new one added @159;
  7. our view mounts @1131.9;
  8. the next frame shows the widget at full height but scrollTop 0.

  The DSE write path is the same (`changes [[32,1831,32,6510,6478]]`, `set`). Nothing called `scrollIntoView` or `focus()` in any run (`focusSiv` empty), and the selection never moved.
- **H1 rejected:** the diff is minimal, and a plain note under the same write holds.
- **H3 rejected:** there are no scroll effects, focus or selection moves, or scrollTop writes before the clamp. The only setter call is CodeMirror's anchor correction after the clamp. CodeMirror's anchoring cannot help: `measure()` drops the anchor when `scrollTop` differs from `viewState.scrollTop` by more than 1 px, which a clamp guarantees.
- **H2 confirmed, refined:** the empty-widget-measures-0 story is secondary. At `docViewUpdate` inside the transaction, the contentDOM has **no embed widget at all**: `[0 cm-line, 6 cm-gap, 1872 cm-line]`, viewport `[1872,1872]` (one.md) and `[2016,2745]` (mid.md ON). Obsidian's code-block widget (decoration class `t`, `block: true`) has `eq(){return!1}`, `updateDOM(){return!1}` and `get estimatedHeight(){return 50}`. A changed fence therefore gets a fresh widget, and CodeMirror's height map replaces the block's measured height with 50 px before anything is drawn. The viewport computed from the unchanged scrollTop then lands below the block, so the block is not drawn. The scroller then shrinks (clamp), or the content under the viewport is ~110-240 lines further down.
- **ABOVE holds** because heights above the viewport are unchanged. **An undrawn block far above holds** (measured on long.md) because CodeMirror keeps the height map of undrawn regions.
- **`modify` precedes the transaction on every path** (every stock-repro row with a transaction, 33 pane observations: process/modify 0.5-2 ms, watcher 1 ms, DSE write 1-2 ms for the writer and 3-13 ms for the other pane). Exception: the second LP pane in a-LL, whose transaction came 2.47 s later because the main thread was busy remounting A. The capture is consumed by the transaction, not by a timer, so the delay does not matter.

## 3. Candidates (page-side on the stock bundle, then the plugin prototype)

| candidate | one.md process | mid ON | mid BELOW | mid far | grow BELOW | verdict |
|---|---|---|---|---|---|---|
| L1 sizer floor (per-pin `<style>` on `.cm-sizer` at `modify`, TTL) (`sc478-r1-cand-L1-stock.log`) | 2428 -> 0 | L83 -> L199 | 5238 -> 2199 but L147 held | L83 -> L219 | held | fails 3/5: the floor stops the clamp, but the block is not drawn and the height map keeps 50 px |
| L2 `scrollSnapshot` at `modify`, dispatched after the widgets remount (`...L2...`) | 0 for ~1.8 s, then 2454 (off by 26) | gave up (never redrawn) | gave up | gave up | gave up | fails: the block is never redrawn |
| L3 hold only (min-height on the redrawn widget) (`...L3...`) | never engages (no widget drawn) | — | — | — | — | fails |
| L23 without the hold (restore only) (`...L23nohold...`) | 2428 -> 0 | L83 -> L201 | 5237, L147+6 | L83 -> L221 | held | fails 3/5: the restore draws the block empty (0 px), and CodeMirror lands past the end |
| **L23** restore + hold (`...L23...`) | **held** | **held** | **held** | **held** | **held (+109 px = one row; same line)** | **all held** |

- **Plugin prototype** (`sc478-r1-repro1-proto.log`, `sc478-r1-repro2-proto.log`, `sc478-r1-REPRO-proto-repro{1,2}.json`): **every row of §1 held, 2/2 each (42 rows).**
  - Examples: a-RL-one B 3032 held; a-LL A and B 3032 held; mid ON/ABOVE/BELOW/far held (scrollTop min == max == start, same line + offset, the tracker drawn at its old height 3039/3725); every (b) path 2428 held; (c) held; tall.md 3020 held.
  - Growth: ON keeps the pixel offset into the tracker (L83+1500); BELOW keeps the content (5238 -> 5347, line 147 -> 149, which is the same text after 2 inserted lines); one.md keeps the offset.
  - a-RL-mid-below: line 147 -> 272 with scrollTop, scrollHeight and widget height identical. Our serializer rewrote the block's YAML (more source lines), so this is the same content under a new line number.
  - Popout (`sc478-r1-popout-proto.log`): 2445 held 2/2 (`doc popout`).
  - Plain notes held (nothing captured).
- **Content vs pixels when the tracker's height changes** (a row added above the viewport):
  - Viewport inside the tracker: the snapshot anchor is the tracker's start line, so the pixel offset into the tracker is kept and its content shifts by one row. This is the same as the Reading pin.
  - Viewport below the tracker: the anchor is the line being read, so it stays put; CodeMirror's own remeasure moves scrollTop by the row height.
  - Viewport above: nothing moves.

## 4. Recommended design: exact code shape (`sc478-r1-prototype.patch`, 5 files, `git apply --check` clean on a `git archive 1c271b5` tree)
- **New `src/framework/host/livePreviewScrollHold.ts`** (245 lines; the header carries the measurements). `class LivePreviewScrollHold`:
  - `captureViewsOf(workspace, path)` (`:112`): LP/Source views of `path` (`getMode() === 'source'`, `view.editor.cm`), each through `capture`.
  - `capture(view)` (`:127`): skip at `scrollTop <= 0`, and skip when no `.cm-content > .cm-embed-block` contains `[data-dse-element]` (raw Source and plain notes never capture). Store `{scrollTop, scrollSnapshot(), widgets: [{posAtDOM, rect height}]}` in a WeakMap.
  - `extension()` (`:141`): `ViewPlugin.define` with `update` -> `onUpdate`, `docViewUpdate` -> `applyHolds`, `destroy` -> `forget`.
  - `onUpdate(u)` (`:152`):
    - on a doc change it consumes the capture;
    - it engages only if every doc-changing transaction `isUserEvent('set')` and scrollTop is within 1 px of the captured value;
    - it maps the snapshot and widget positions through `u.changes` and dispatches the snapshot in a microtask (`Promise.resolve().then`, never inside the update);
    - positions are re-mapped through any later change while pending; the pending entry expires after `PIN_TTL_MS`.
  - `applyHolds(view)` (`:192`): for each embed widget without a mounted DSE root whose `posAtDOM` matches a captured position: inline `min-height: <old px>` (via `style.setProperty`; the obsidianmd lint rule rejects direct `style.minHeight` assignment) plus `data-dse-lp-hold="<px>"`.
  - A MutationObserver from the widget's own window releases the hold when the root gains children; `PIN_TTL_MS` is the backstop. The release calls `view.requestMeasure()`.
  - `releaseAll()` (`:242`) for unload; `forget` releases a destroyed view's holds.
- **`src/framework/registerFrameworkElements.ts:60-65`** (after the SC-470 `window-close` line):
  ```ts
  const lpHold = new LivePreviewScrollHold();
  plugin.register(() => lpHold.releaseAll());
  plugin.registerEvent(plugin.app.vault.on('modify', (file) => lpHold.captureViewsOf(plugin.app.workspace, file.path)));
  plugin.registerEditorExtension(lpHold.extension());
  ```
  The import goes at `:25`.
- **`src/framework/host/previewScrollPin.ts`:**
  - `:140` `export const PIN_TTL_MS = 2500;` (value unchanged).
  - `:62-64`: the "Not covered (SC-478)" sentence becomes a pointer to `livePreviewScrollHold.ts`.
- **`visual-harness/obsidian-lifecycle.mjs`:**
  - one header line pair at `:47`;
  - G-S18 appended after G-S15 as the last element of `SCENARIOS` (its own block, about 115 lines);
  - no FIXTURES change (reuses `Lifecycle/tall.md`).
- **`test/dom/framework/livePreviewScrollHold.test.ts`** (9 tests, duck-typed EditorView):
  - captures and restores the mapped snapshot only after the update;
  - no capture at top or without a DSE widget;
  - never on a user edit (`input.type`), which consumes the capture;
  - the user wins on a scroll;
  - `captureViewsOf` path and mode filter;
  - hold at the mapped position, released on mount;
  - no hold for a mounted widget, a non-captured embed, or with nothing pending;
  - TTL release and `releaseAll`;
  - wiring (`registerEditorExtension` and the `modify` listener).

  The tests were not mutation-checked; the lifecycle controls discriminate the mechanism.
- **Constraints check:**
  - Only views that showed a DSE widget are touched.
  - Popouts work: the window comes from the widget or scroller, and this was measured.
  - Listeners use `registerEvent`, `registerEditorExtension` and `register`.
  - The restore is an effects-only `scrollIntoView` snapshot, so it never focuses and never moves the selection: selection head 0 -> 0 and focus unchanged in every row.
  - **The user wins:**
    - a capture is dropped if scrollTop moved before the transaction;
    - a non-`set` doc change (the user typing) consumes the capture without restoring;
    - nothing touches scrollTop after the single restore;
    - the hold changes only a widget's height, never the scroll.

    The window for fighting the user is one frame: from our microtask to the next measure, before paint. These guards are jest-only; a live user scroll was not driven.
  - The Reading pin is unchanged: G-S8 and G-S15 ok 3/3, full lifecycle 31/31.
  - The patch does not touch ReadingModeBlockHost.ts, fenceLine.ts or sidebar/registration.ts. The design needs neither of the files SC-457 freed.

## 5. Cost (`sc478-r1-cost-proto.log`, `sc478-r1-cost-stock.log`; 5 reps per note)

| step | one.md (4280 content nodes) | mid.md (2418 nodes) |
|---|---|---|
| capture per view (`scrollSnapshot` + `posAtDOM` + 1 rect) | 0.1-0.6 ms | 0.0-0.3 ms |
| restore (effects dispatch + its measure) | 0.8-1.8 ms | 0.9-1.2 ms |
| a no-op `measure()` | 0.2-0.4 ms | 0.2-0.3 ms |

The hold itself is one style property, one attribute and one MutationObserver.

- **The real cost is the redraw it causes.** Long tasks in the 3 s after an external write:
  - one.md: stock 2252 ms vs proto 1720 ms (both remount the tracker; stock also redraws once more after the clamp);
  - mid.md ON: **stock 53 ms vs proto 950 ms**.

  On stock the tracker is never redrawn: it is left undrawn at a 50 px estimate, and the user is looking at the wrong text. The prototype mounts the 25-hero tracker that the user is actually reading. That work moves from "when the user scrolls back" to "now". On this Xvfb software-rendered machine a 25-45-hero initiative mount is 0.5-1 s of main thread; that is an existing DSE render cost (see Follow-ups), not the mechanism's.

## 6. Gate `G-S18` (`sc478-r1-disc-summary.log`, `sc478-r1-disc{1,2,3}-<variant>.log`)
- **Phases.** Every phase runs even after one fails:
  - (a) `tall.md` in Reading pane A plus a Live Preview split B parked at tracker top + 1500, with a portrait toggle in A clicked;
  - (b1) `t.edit` (in-app `vault.process`), one LP pane;
  - (b2) `fs.writeFileSync` (file watcher), one LP pane;
  - (c) the LP pane's own toggle click.
- **Per-phase assertions, in this order:**
  1. the write landed;
  2. **anti-vacuity:** the parked tracker root left the document (it was redrawn);
  3. scrollTop min == max == start over every frame, and the top line + offset is unchanged (CodeMirror height map, read at rest);
  4. the tracker is drawn again at its old height (±2 px);
  5. `data-dse-lp-hold` was seen on it (the mechanism engaged inside the transaction that would have lost the position), and it was released;
  6. the selection head did not move.
- The recorder samples per rAF plus a MutationObserver for the hold attribute. It runs until release + 10 frames, capped at the first sighting + 4500 ms (12 s), or 5 s with no hold.

| variant | runs | (a) | (b1) | (b2) | (c) | G-S8 / G-S15 |
|---|---|---|---|---|---|---|
| stock `1c271b5` | **FAIL 3/3** | 3020 -> 2556, L63+1500 -> L285+2, tracker undrawn, hold false | 3020 -> 2556, -> L160+2 | same | -> L285+2 | — |
| **prototype** | **ok 3/3** | held 3020, L63+1500, 3725 px | held | held | held | **ok 3/3** |
| control: restore never dispatched (`proto-norestore`), **the named control point** | **FAIL 3/3** | same as stock, hold false | same | same | same | — |
| control: no hold (`proto-nohold`) | **FAIL 3/3** | 3020 -> **6231**, L285+2, hold false | 3020 -> 5544, L160+1 | same | same | — |

- FAIL screenshots: `sc478-r1-disc-stock-G-S18-FAIL.png`, `sc478-r1-disc-proto-norestore-G-S18-FAIL.png`, `sc478-r1-disc-proto-nohold-G-S18-FAIL.png`.
- G-S18 adds about 40 s.
- The prototype's hold is seen and released before the next rAF ("held for 0 frames"): our view mounts inside the same task. The engagement tripwire is therefore the MutationObserver sighting, not a frame count.

## 7. Full lifecycle with the prototype
`npm run obsidian-lifecycle` (in-tree build, port 9378): **`OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`, rc=0** (`sc478-r1-full-lifecycle.log`, `.rc`). Also: tsc + `tsc -p e2e` rc=0, `npm run lint` rc=0, targeted jest (livePreviewScrollHold, previewScrollPin, register-framework-elements, view-adoption) **71/71**. Not run in this round: full jest, e2e, shots, freeze and parity. They are the implementer's job.

## Risks
1. **Dependence on Obsidian internals' behaviour (not their API).** The design reads only public CM6 API (`scrollSnapshot`, `posAtDOM`, `ViewPlugin.docViewUpdate`) and the DOM class `.cm-embed-block`. It relies on Obsidian's `setViewData` transaction carrying `userEvent "set"` (measured on every path). If a future Obsidian drops that annotation, the hold silently stops engaging, and G-S18 catches it.
2. **The restore redraws the block now.** The extra main-thread time is the tracker's own mount (§5), which stock defers by leaving the pane on the wrong text.
3. **Viewport inside a block whose height changed above the viewport:** the pixel offset is kept, so the content inside the block shifts by the delta. This is the same as the Reading pin.
4. **A pending restore lives until the next doc change.** It never fires without a `set` transaction, and any other doc change consumes it. A `setViewData` without a preceding `modify` (unknown) would still be guarded by the 1 px scrollTop check.

## Follow-ups
- **Implementer (r2):**
  - rebase onto `772c3cd` (SC-457 added G-S14, so the lifecycle total becomes 32 with G-S18 if nothing else lands);
  - `dse-verify/SKILL.md` lifecycle row plus a G-S18 entry (control: "restore never dispatched");
  - CHANGELOG `## Unreleased` bullet;
  - full battery.
- **DSE render cost:** a 25-45-hero initiative takes 0.5-1+ s of main thread to mount under Xvfb (`run-resolved` about 1 s after the processor). This affects every redraw, not only this path. Candidate Backlog ticket, unmeasured on real hardware.
- **Second LP pane latency:** in a-LL the other LP pane's transaction came 2.47 s after `modify` (the main thread was busy remounting the writer's tracker). The prototype is unaffected (it is transaction-bound), but the same latency hits the Reading pin's TTL. This is an SC-472 data point.
- **Embeds (SC-479):** not measured in Live Preview.

## Tree hygiene
- Before: dse porcelain empty, HEAD `1c271b5`; superproject worktree porcelain empty.
- After: **dse `git status --porcelain` empty, HEAD `1c271b5`; superproject porcelain empty.** The prototype was removed with `git checkout --` (3 files) and `rm -f` of the 2 new files, by exact path. The debug build's source change was reverted with `git checkout --` right after its build. The build outputs I created (`main.js`, `styles.css`, `main.css`) were deleted by exact path. `node_modules/` (`npm ci`) and `.devbox/` remain; both are ignored.
- 12 `/tmp/dse-obsidian-lifecycle-*` dirs came from my FAIL runs. Their exact paths were recorded at creation (`kept-tmpdirs.txt` in my scratch dir) and deleted by exact path after copying 3 screenshots. No glob rm was used.
- No commits. No processes left (`pgrep -af worktrees/sc478-livepreview-scroll/` is empty).
