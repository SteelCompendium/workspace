# SC-470 r1: design and measure round (scroll pin for every Reading view)

## Executive summary
- **Reproduced on stock `c03db7a`** (Obsidian 1.14.4), 2/2 each. (a) Second pane, DSE write from pane A: B goes **3020 -> 0** on the one-tracker note and **2779 -> 2001** on `tall.md`. The writer pane A holds. (b) External writes clamp the open view **2416 -> 0** on all four paths: `vault.process`, `vault.modify`, `adapter.write`, and a disk write picked up by the file watcher (the harness can produce the watcher path with Node `fs.writeFileSync`). Sizer inline min-height falls 5276/6484px -> 46px. A popout clamps the same way (2432 -> 0). Live Preview panes also clamp (3018 -> 0); that is out of scope.
- **Timing verdict: `modify` fires BEFORE any view starts its rebuild, on all three paths.** That holds for our own write, an external `vault.process`/`modify`/`adapter.write`, and a watcher pickup. At every handler call (42/42 pane observations that later collapsed, across the stock, prototype and stock-popout runs) the tracker root is still connected, the sizer is still at full height, and `view.data` is still the old text. This is true for a listener registered before the panes opened and for one registered after. The collapse comes 1-3 frames later: 11-90 ms for external writes, about 300-800 ms after `modify` for the second pane.
- **Recommendation: D2.** A vault `modify` listener (`plugin.registerEvent`) pins every open Reading view of the modified file that contains `[data-dse-element]`. D1 (the writer pins every view) fixes (a) but **fails (b) 2/2**. D2 alone also covers the writer: with the writer-side call disabled, G-S8 is ok 3/3. **Keep the writer-side call anyway.** It is redundant on 1.14.4 timing, but harmless: the re-pin keeps the first px (7060 -> 7060, 6251 -> 6251) and only restarts the TTL 1-2 ms later. Removing it would touch `ReadingModeBlockHost.ts`, where SC-457 is in flight.
- **No collapsed capture:** every D2 pin's px equals the pre-write `scrollHeight` (7060 / 6251 / 5852 / 5785 px). The non-DSE control note was never pinned (0 pin frames, 2/2).
- **Gate: `G-S15`.** G-S13 and G-S14 are already taken by in-flight SC-326 and SC-471 (both G-S13) and SC-457 (G-S14). The scenario has three phases: (a) second pane, (b1) external `vault.process`, (b2) disk write through the file watcher. It has G-S8's tripwires: redrawn, collapsed below scrollTop, pin present at the collapse, released at or above scrollTop.
  - Results with the scenario under its measured name G-S13: **stock FAIL 3/3** (all 3 phases: pin absent at the collapse), **prototype ok 3/3**, **CSS rule deleted FAIL 3/3** (all 3 phases: 2779 -> 2001 with the pin present; G-S8 FAILs too), **D1 FAIL 2/2** (b1 and b2), **D2 without the writer call ok 3/3**.
  - After the rename to G-S15: stock FAIL 1/1, prototype ok 1/1.
- **Full lifecycle with the prototype: `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed`, rc=0** (28 plus the new scenario). tsc rc=0, lint rc=0, targeted jest 47/47 (3 suites).
- **Risks (follow-ups):**
  - Taking or releasing a pin costs **about 180-265 ms of main-thread style recalc** on a 2415-node preview, because the custom property on the scroller is inherited by the whole subtree. The pre-existing writer pin already pays this; D2 extends it to every external write and to every pinned view. A per-pin stylesheet rule measured **2-4 ms** instead.
  - The TTL races (SC-472) also show up without throttling: with a Live Preview sibling pane, or in a popout, the redraw lands at about 2.3-3.0 s.

## Environment and method
- dse worktree `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements` at `c03db7a`. `origin/develop` was confirmed still at `c03db7a` after a fetch.
- `npm ci` was run, because `node_modules` was missing (`sc470-r1-npmci.log`).
- Port 9370, Xvfb displays :160-:163, Obsidian 1.14.4, window 1440x1100.
- **Bundles** (`sc470-r1-build.log`, shas are main.js/styles.css):

  | bundle | what it is | sha |
  |---|---|---|
  | `stock` | `c03db7a` | `dc44016c449d/9d88edb642d9` |
  | `proto` | D2 + writer pin | `f5f007d699c7/9d88edb642d9` |
  | `proto-nowriter` | D2, writer call guarded `&& Date.now() < 0` | `fd4ad5693278` |
  | `proto-nocss` | D2, SC-198 CSS rule deleted | CSS `1c1f6eeb0cce` |
  | `d1` | no listener; the writer calls `pinReadingViewsOf` instead | `89e4e54c38e7` |

  The proto bundles were built from the v2 source. The final patch differs from it only in comments and the added jest tests; the full lifecycle used the final source, built in-tree.
- **Probes** were injected temporarily before `main()` and restored from a saved copy after each run:
  - `sc470-r1-probe-block.mjs.txt` (`P470-REPRO`)
  - `sc470-r1-probe-dom.mjs.txt` (`P470-DOM`)
  - `sc470-r1-probe-cost.mjs.txt` (`P470-COST`)
- **Recorder:** per rAF, each pane's scrollTop, scrollHeight, inline min-height and pin attribute. A MutationObserver per scroller records the first collapse below the starting scrollTop (time, frame, pin present), the first disconnect of the tagged DSE root, and the first pin sighting with its px.
- **Two page-side vault `modify` listeners:** `modify-early`, installed before the panes were opened, and `modify-late`, installed after. Each snapshots every view of the file at the moment it is called: mh, scrollTop, scrollHeight, tagged root connected, pin attribute and value, and whether `view.data` already holds the new text.

## 1. Reproduction on stock (`sc470-r1-repro-stock.log`, `sc470-r1-REPRO-stock-repro.json`, `sc470-r1-popout-stock.log`)

| case | observed pane | start -> min/end scrollTop | sizer inline min-height | pin frames |
|---|---|---|---|---|
| a-own: one.md (45-hero tracker), 2 panes, click in A | A (writer) | 3020 -> 3020 (2/2) | 6484px held (adopted) | 55-61 |
| | **B** | **3020 -> 0 (2/2)** | 6484px -> 46px | 0 |
| a-own-tall: tall.md at G-S8's position | A | 2779 held | 6187px held | 97-99 |
| | **B** | **2779 -> 2001 (2/2)** | 6187px -> 2446px | 0 |
| b-process: bare `vault.process`, `value: 1 -> 2` | A (only pane) | **2416 -> 0 (2/2)** | 5276px -> 46px | 0 |
| b-modify: `vault.modify` | A | **2416 -> 0 (2/2)** | 5276 -> 46 | 0 |
| b-adapter: `app.vault.adapter.write` | A | **2416 -> 0 (2/2)** | 5276 -> 46 | 0 |
| b-nodefs: Node `fs.writeFileSync` on the vault file (file-watcher pickup) | A | **2416 -> 0 (2/2)** | 5276 -> 46 | 0 |
| b-tall-process: tall.md | A | **2779 -> 2001 (2/2)** | 5501 -> 2446 | 0 |
| ab-process: external edit, 2 Reading panes | A and B | **3020 -> 0 both (2/2)** | 6484 -> 46 | 0 |
| popout-process: Reading view in a popout window (`ownerDocument` != main) | A | **2432 -> 0 (2/2)** | 5259 -> 45 | 0 |
| lp-process: A Reading, B Live Preview | A | 3020 -> 0 | 6484 -> 46 | 0 |
| | B (`.cm-scroller`) | **3018 -> 0 (2/2)**, info only | n/a | n/a |
| plain-process: non-DSE note (220 paragraphs), 2 panes | A and B | 3929/3945 held (2/2) | 8814 -> 8830 (never below) | 0 |

The file-watcher path can be produced in the harness: a Node-side `fs.writeFileSync` into the scratch vault reaches `modify` about 1 ms after the write and then rebuilds. `adapter.write` fires `modify` synchronously (about 1 ms), so on desktop it does not go through the watcher.

## 2. Timing: `modify` vs the collapse (stock; the same holds on the prototype)

| path | `modify` (ms after the action) | first collapse in the observed pane | state at the handler (early and late listeners) |
|---|---|---|---|
| own DSE write (pane A click) | 406-608 (the debounced write) | B: 900-1230 ms, 2-3 frames after `modify` | B: tagged root connected, mh full (6484/6187px), `view.data` old |
| external `vault.process` | 1-5 (before `process` resolves: actionDone 2-6 ms) | 13-31 ms (1 frame) | connected, mh 5276px, data old |
| `vault.modify` | 1 | 24-27 ms | same |
| `adapter.write` | 1 | 18-21 ms | same |
| watcher pickup (Node fs) | 61-62 (write at about 60) | 83-91 ms (1 frame) | same |
| external, 2 panes | 1-15 | A 30-46 ms, B 68-89 ms | both connected, full |

- `modifyBeforeCollapse` was true in **42/42 pane observations that collapsed** (stock, prototype and stock popout).
- A listener registered after the panes opened (`modify-late`) saw the same pre-collapse state in every row. So the listener's position relative to Obsidian's own handlers does not matter; the views rebuild after the event dispatch, not inside it.

## 3. Design evaluation (probe on `proto`: `sc470-r1-repro-proto.log`, `sc470-r1-REPRO-proto-repro.json`; gate runs: `sc470-r1-disc-summary.log`)

### D2 (recommended): one vault `modify` listener pins every Reading view of the file that shows a DSE block
- Probe on `proto`, 2/2 each:
  - a-own B held 3020; a-own-tall B held 2779.
  - b-process, b-modify, b-adapter and b-nodefs all held 2416/2448.
  - ab-process held A and B at 3020; popout held 2432 (`doc=popout`).
  - plain: no pin taken (0 frames on both panes).
- **Captured heights.** Each pin's px (first MutationObserver sighting) equals that view's pre-write `scrollHeight`: 7060 (B, one.md split), 6251 (B, tall split), 5852 (one.md single pane), 5785 (popout). The handler snapshot shows mh still at full height in every case, so a collapsed height is never captured.
- **The writer's double pin.**
  - The writer's own pin is taken inside the `vault.process` callback. The listener's re-pin 1-2 ms later goes through the existing re-pin branch: `px = existing.px`, measured `pv` 7060px -> 7060px and 6251 -> 6251.
  - It re-arms the TTL from `modify` time, so the TTL is extended by 1-2 ms. That is harmless, and it never re-measures. That branch exists precisely to stop a ratchet, and jest locks it in (the "keeps its FIRST height" test).
- **Can the writer-side call go?** Timing allows it: `proto-nowriter` (call disabled) gives G-S8 ok 3/3 (the adoption-off phase held 2779 under the `modify` pin) and G-S15 ok 3/3.
- **Recommendation: keep it.** It is the writer's own backstop if a future Obsidian ever defers `modify`. Removing it touches `ReadingModeBlockHost.ts:594-600`, where SC-457 is in flight, and the jest wiring test that relies on the host pin.
- **Consequence:** G-S8 alone no longer discriminates the call in `ReadingModeBlockHost`. Only the CSS-rule control still fails it. The prototype's header comment says so.
- **Not touched:** Live Preview and Source panes. The listener only pins `getMode() === 'preview'` views.
- **Popout windows work.** The scroller comes from the leaf's own view (`getLeavesOfType` includes popout leaves) and the timers from `scroller.ownerDocument.defaultView`.

### D1: on our own write, the writer pins every Reading view of the note
- G-S15(a) ok 2/2, but **(b1) and (b2) FAIL 2/2**: `pin frames 0, scrollTop min 2001 of start 2779`.
- It cannot cover Sync, git or another plugin, so D1 alone is rejected. D1 plus D2 adds nothing over D2, because D2 already pins the other panes on our own write.

### Exact code shape (`sc470-r1-prototype.patch`, +226/-4, `git apply --check` clean on `c03db7a`)
- **`src/framework/host/previewScrollPin.ts`**
  - The header (`:44-45` "Not covered (SC-470)" at `c03db7a`) is replaced by an "EVERY READING VIEW…" section with the measurements. The G-S8 sentence at `:41-43` is corrected.
  - `import type { Workspace } from 'obsidian'` is added before `PIN_ATTR`.
  - A duck-typed `ReadingViewLike` is added. The jest mock has no `MarkdownView`, and `ReadingModeBlockHost.ts:416` follows the same precedent.
  - `pin(containerEl)` (`:97`) now does `closest()` and then calls a new `private pinScroller(scroller)`, which is the old body unchanged. Every fail-safe stays: no window, `scrollTop <= 0`, not scrollable, the re-pin keeps px, and the TTL. `PIN_TTL_MS` is unchanged.
  - New `pinReadingViewsOf(workspace, path)` loops over `workspace.getLeavesOfType('markdown')`:
    - It skips a view unless `view.file?.path === path` and `view.getMode?.() === 'preview'`.
    - It takes the scroller as `view.previewMode.containerEl.querySelector(':scope > .markdown-preview-view')`. `previewMode.containerEl` is `.markdown-reading-view`, and the scroller is its child (`sc470-r1-dom-proto.log`). The first prototype used `previewMode.containerEl` directly and never pinned.
    - It skips a view unless `scroller.querySelector('[data-dse-element]')`.
    - It calls `pinScroller` inside a try/catch with a warn.
- **`src/framework/registerFrameworkElements.ts:54`**, after `plugin.register(() => scrollPin.releaseAll())`:
  `plugin.registerEvent(plugin.app.vault.on('modify', (file) => scrollPin.pinReadingViewsOf(plugin.app.workspace, file.path)));`
- **`test/dom/framework/previewScrollPin.test.ts`**: a new `describe('SC-470: PreviewScrollPin.pinReadingViewsOf')` with 5 tests:
  - pins every Reading view of the note, at its own height;
  - skips another path, a source-mode view, a view with no DSE block, and a deferred view with no `getMode`;
  - keeps the not-scrolled and not-scrollable fail-safes;
  - an already-pinned writer keeps its first px, and the TTL still releases;
  - the wiring registers on `vault.on('modify')` and calls with `(app.workspace, path)`.
- **`visual-harness/obsidian-lifecycle.mjs`**: one header line after the SC-460 paragraph (`:41`), and the new scenario object appended after G-S12 as the last element of `SCENARIOS`. Neither G-S8 nor FIXTURES is touched: it reuses `Lifecycle/tall.md`.

## 4. Gate: `G-S15`
- **Phases.** Every phase runs even when an earlier one fails, and a FAIL lists every phase that clamped.
  - **(a)** `tall.md` in A plus a vertical split B (Reading). Both are parked at tracker top + 1500 (2779), B's tracker is tagged, the recorder runs on B, and a visible portrait toggle in A is clicked. It also asserts that writer A did not move.
  - **(b1)** Single pane, `t.edit(rel, value: 1 -> 2)`, an in-app `vault.process` from outside the plugin.
  - **(b2)** Single pane, `fs.writeFileSync` of the edited fixture into the scratch vault: the file watcher, which is the Sync/git path.
- **Per-phase assertions** use G-S8's recorder copied verbatim: a MutationObserver plus rAF sampling until the release + 10 frames, capped at the pin's first sighting + 4500 ms (12 s hard cap, 5 s without a pin). They run in this order:
  1. the write landed;
  2. a tracker is rendered;
  3. the observed tracker was redrawn (anti-vacuity);
  4. the sizer's inline min-height fell below the starting scrollTop (tripwire);
  5. `data-dse-scroll-pin` was present at the collapse;
  6. scrollTop min == max == start;
  7. the pin was seen released;
  8. `mhAtRelease >= st0`.
- **Discrimination** (logs `sc470-r1-disc{1,2,3}-<variant>.log`, one line per run in `sc470-r1-disc-summary.log`; the 3x runs used the id G-S13, which was renamed to G-S15 afterwards):

| variant | runs | G-S15 (a) | (b1) | (b2) | G-S8 |
|---|---|---|---|---|---|
| stock `c03db7a` | 3/3 FAIL (+1/1 as G-S15) | pin absent at the collapse, 2779 -> 2001 | same | same | ok |
| prototype (D2 + writer pin) | **3/3 ok** (+1/1 as G-S15) | held 2779; 6187-6248px at release | held; 5501px | held; 5501px | ok |
| CSS rule deleted | 3/3 FAIL | `scrollTop moved: start 2779 min 2001 … pin present true` | same | same | **FAIL** |
| D1 | 2/2 FAIL | ok | pin absent | pin absent | ok |
| D2 without the writer call | 3/3 ok | ok | ok | ok | ok |

- FAIL screenshots: `sc470-r1-disc-stock-G-S15-FAIL.png`, `sc470-r1-disc-proto-nocss-G-S13-FAIL.png`, `sc470-r1-disc-d1-G-S13-FAIL.png`.
- The 3x `disc1-stock.log` and `disc1-proto.log` files were overwritten by the 1/1 G-S15 rename-confirm runs. Their 3x lines survive in `sc470-r1-disc-summary.log`.
- G-S15 adds about 25 s: two `tall.md` writes and one split.
- `visual-harness/` is eslint-ignored. `eslint --no-ignore` crashes on this file at base too (SC-459 r4), so I did not use it.

## 5. Full lifecycle with the prototype applied
- `npm run obsidian-lifecycle` (in-tree build, port 9370) gives **`OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed`, rc=0** (`sc470-r1-full-lifecycle.log`). The new scenario ran under its pre-rename id G-S13.
- tsc rc=0, `npm run lint` rc=0, jest `previewScrollPin` + `register-framework-elements` + `view-adoption`: **47/47**.
- Not run in this round: full jest, e2e, shots, freeze, parity (measure round). They are the implementer's job.

## Risks
1. **The pin's main-thread cost** (P470-COST, `sc470-r1-cost-stock.log`, `tall.md`, 2415 descendants of the scroller, 3 reps). First forced layout after a change, set+clear:
   - attribute only: 1-4 ms;
   - `--dse-scroll-pin` custom property only: **182-222 ms set, 181-216 ms clear**;
   - any other custom property: 177-200 ms;
   - the full pin as shipped: **221-265 ms set, 236-239 ms clear**;
   - a per-pin `<style>` rule keyed on the attribute's value, with no custom property: **2-4 ms set, 2-32 ms clear**, and it holds (computed min-height 5565px).

   The cost comes from the inherited custom property on the scroller, which restyles the whole preview subtree.
   - **Today:** the writer pin already pays this on every content-changing DSE write.
   - **With D2:** every external write to a DSE note, and every other Reading view of it, pays it too. That includes Sync or autosave of an edit that does not touch a block (D2 cannot tell, because `modify` carries no diff).
   - **Delays it causes on the probe machine:** the external-write collapse moved from 13-31 ms to 310-400 ms after `modify`. The popout redraw moved from about 1.5 s to about 2.5 s, right at the TTL.
   - **Not a correctness bug:** every held case held. It is a jank and TTL-margin cost. **Follow-up** (or the owner folds it in): switch to the stylesheet-rule pin. The CSS-deleted control then becomes "the injected rule never inserted".
2. **TTL race without throttling (SC-472 data point).**
   - lp-process on `proto`: Reading pane A clamped in 1 of 2 runs. The main thread was blocked from 575 to 3366 ms (4 frames). The collapse came at 3006 ms with the pin still present. The overdue TTL timer then released it while the sizer was at 93px, and scrollTop went to 0.
   - Popout redraws landed at 2479 and 2597 ms after `modify`, which is the TTL edge (they held).
   - Out of scope (SC-472; the TTL is unchanged here).
3. **Embeds are not covered.** A tracker in note B embedded in a tall note A: a write to B pins only views whose file is B. A's scroller (the embed's host) is not pinned. Today's writer pin uses `closest('.markdown-preview-view')`, which inside an embed is the embed's own inner preview, not A's scroller. Not measured.
4. **Phantom space.** A `modify` that does not touch a DSE block still pins DSE Reading views for 2.5 s. The worst case is the documented bottom phantom space. Rapid successive modifies (autosave while typing in a source pane of the same note) keep refreshing the TTL with the first height, so the phantom space can last as long as the typing does.

## Follow-ups
- **Scenario-id collision:** in-flight `sc326-montage-scroll` and `sc471-sidebar-hotkey-fence` both add `G-S13`, and `sc457-fence-space-lang` adds `G-S14`. All three say "(29 total)". The dispatcher should serialize the ids. SC-470 uses `G-S15`, and its header line deliberately has no total.
- **Perf:** the SC-198 pin's inherited custom property costs about 200 ms + 200 ms of style recalc per pinned view on a 2.4k-node preview (measured above). A per-pin stylesheet rule costs 2-4 ms. D2 widens how often this cost is paid.
- **SC-472 data point:** an LP sibling pane or a popout pushes the Reading-view redraw to 2.3-3.0 s after `modify` with no CPU throttle. One clamp in 2 runs (lp-process, proto).
- **Live Preview panes clamp too** on an external or other-pane write (`.cm-scroller` 3018 -> 0, 2/2 stock). Out of scope (the brief); a separate ticket if wanted.
- **Embeds:** a DSE block inside an embed of a tall note is not pinned by either the writer pin or D2. Unmeasured; a Backlog candidate.
- **Docs for the implementer:**
  - `dse-verify/SKILL.md` lifecycle row: `28/28` -> `29/29` (or whatever the landing order makes it), plus a G-S15 entry.
  - The G-S8 phrase "FAILs with the pin disabled" should become "FAILs with the CSS rule deleted": with D2, disabling only the host call no longer fails G-S8.
  - CHANGELOG `## Unreleased` bullet.

## Tree hygiene
- Before: dse `git status --porcelain` was empty, HEAD `c03db7a`.
- After: **empty**, HEAD `c03db7a`. The superproject worktree porcelain is empty.
- Every temporary source change was restored with `git -C … checkout -- <file>` (4 files).
- I deleted the build outputs I created: `main.js`, `styles.css` and `main.css` (exact paths). `node_modules/` from `npm ci` remains (ignored).
- 14 `/tmp/dse-obsidian-lifecycle-*` dirs came from my FAIL runs. They were identified by their `G-S13-FAIL`/`G-S15-FAIL` shots and timestamps matching my runs, and deleted by exact path after copying 3 screenshots. The other efforts' dirs (`JBk3rD`, `s7JOrN`) were not touched.
- No commits. No processes left (`pgrep -af worktrees/sc470-scroll-pin-panes/` is empty).
