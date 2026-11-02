# SC-522 r1: reproduce, measure, prototype (a Live Preview host note embeds a tracker note)

## Executive summary
- **Verdict: MOVES on 71437da.** Obsidian 1.15.0, Xvfb, CDP. 2 reps per case. Adoption on and off give identical results except for the own click.
- **Stock moves (2/2 each):**
  - (a) embed near A's end, parked at end: `.cm-scroller` **6800 -> 3745**. This happens with `vault.process`, the file watcher, a second pane (Reading or LP: 7486 -> 3745), add/remove hero, `#heading`, and popout (6830 -> 3792).
  - (b) parked below the embed: **7510 -> 7441, text +69 px**. Second pane: 8196 -> 7441, +755 px.
  - Host that is mostly the embed: **2912 -> 26**. A form Save gives 2938 -> 26.
  - **A click in the embedded card** (synthetic or real mouse, adoption on or off): **5420 -> 3916, text +1528 px**; mostly-embed host 2912 -> 150 (adoption on) / 0 (off).
- **Stock holds:** embed top on screen, parked in the tracker (outside writes only), parked inside a tall embed, above or near the embed, and the nested A->N->B embed.
- **Mechanism 1, the redraw, is a passive clamp.** The embed (`.internal-embed` IS the CM widget) is empty for part of one task, 26-108 ms after `modify`. It goes 3190 -> 135 px, so scrollHeight drops 3055 px and Chrome clamps scrollTop to the new max.
  - It is not CM's height map (unchanged), not CM's anchor restore (no `measure` or scrollTop write), and not Chrome anchoring (`.cm-scroller` has `overflow-anchor: none`).
- **Mechanism 2, the own click, is Obsidian's embed widget click handler.** It calls `selectElement`, which dispatches `{selection, scrollIntoView: true}`. The handler skips any target inside `.interactive-child`.
- **Prototype** (`sc522-r1-prototype.patch`, +479/-12; jest ~184 lines, G-S52 + fixtures 173 lines):
  - Part 1 holds the host's embed widget at its height from `modify` until our view is back in it (MutationObserver), with `PIN_TTL_MS` as the backstop.
  - Part 2 marks the DSE root `interactive-child`, only inside an LP embed.
  - Result: **every stock-moving case holds at 0 px**, and no geometry is worse at the settled position. One-frame transients, not settled moves, are Risk 1.
- **G-S52** (5 phases). Stock FAIL 3/3. Proto ok 3/3 (+3 on the earlier harness). ctl-nohold FAIL (a)-(d) 3/3. ctl-norelease FAIL (a)-(d) 3/3. ctl-noclick FAIL (e) only 3/3.
- **Gates:** `--only=G-S8,G-S15,G-S18,G-S42,G-S52` 5/5 ×3. Full lifecycle **41/41** (20 + 21). tsc, lint and `node --check` rc 0. Targeted jest 134/134. The 9 new positive jest tests FAIL on stock source.
- **Cost:** the embed scan is 0.1 ms median (0.5 max) per LP view per `modify`; a hold costs 1.3-3.4 ms to set; the release reads no layout. dse HEAD 71437da, porcelain clean.

## Environment and method
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements` at **71437da**. `origin/develop` was 71437da at start and at resume.
- `npm ci` was run once. Port 9522, Xvfb `:160-:163`, window 1440x1100, `obsidian 1.15.0` (printed by the harness).
- The round was paused on Scott's request after stock batch 1, then resumed. Nothing moved in between.
- **Bundles** (main.js / styles.css):
  - stock `e487253342d0`;
  - proto `cb9aaa28bc6d`;
  - ctl-nohold `084832b7e197` (`holdEmbedsOf` returns at once);
  - ctl-norelease `2e84ff9e9046` (no MutationObserver: TTL only);
  - ctl-noclick `10c8226d8a5d` (the `interactive-child` mark disabled);
  - cost `f178205f55c6`.
  - `styles.css` is `ae45354b6369` in every bundle (byte-identical).
  - The final patch differs from the built proto only by one header-comment line (the cost numbers).
- **Probes ran from a scratch copy of the harness** (`sc522-r1-mkharness.cjs.txt`, `sc522-r1-run.sh`), never from the tree. Blocks: `sc522-r1-probe-{common,lp,dom,cost,src}.mjs.txt`.
- **Recorder `P522-REPRO`.** Each rAF samples:
  - A's scrollTop, scrollHeight and CM `contentHeight`;
  - the top visible line + offset;
  - the `.internal-embed` box height, the embed's inner sizer height and inline min-height, and CM's height-map block for the embed line;
  - the screen y of one text line below the embed (a `.cm-line`, tracked by text) and one inside it (a hero name or an embed paragraph, tracked by text);
  - the hold attribute.
- The recorder also takes:
  - a **post-paint sample** per frame (`setTimeout(0)` from the rAF; see Risk 1);
  - a MutationObserver for root, embed and sizer disconnects;
  - optionally: a forced layout per mutation batch (`MOLAYOUT`); instance hooks on `scrollTop` / `scrollTo` / `cm.measure` / `cm.update` with stacks (`TRACE`); a CPU profile; page-side emulated holds (`EMU`).
- **Prep write:** each case first gives B a fresh malice value and waits until A's embed shows it. Obsidian skips an embed re-render when the content is unchanged.
- **Fixtures** (`SC522/*`):
  - B = `EmbS` (25-hero tracker) or `EmbL` (20-hero tracker + 25 paragraphs, 3602 px).
  - Hosts:
    - `EmbAS` (80 paragraphs, embed, 80 paragraphs);
    - `EmbAE` (80 paragraphs, embed, 3 end lines);
    - `EmbAC` (`C-TOP`, embed, `C-BOTTOM`);
    - `EmbAL` (30 paragraphs, `![[EmbL]]`, 80 paragraphs);
    - `EmbAH` / `EmbAEH` (`![[EmbS#EmbS]]`);
    - `EmbAN` / `EmbAEN` (A -> `EmbN` -> `EmbS`).
- **Parks** (computed from the embed's top and height):
  - `end` = max scrollTop;
  - `below` = embed bottom + 400;
  - `view` = embed top − 200 (embed top on screen);
  - `in` = embed top + 1500;
  - `inside` = tracker bottom + 150 (inside `EmbL`);
  - `above` = embed top − viewport − 600;
  - `near` = embed top 100 px under the viewport bottom (drawn).
- **Writers:**
  - `process` (`vault.process`); `nodefs` (Node write, file watcher);
  - `paneR` / `paneLP` (B in a second Reading / Live Preview pane makes the click);
  - `own` (synthetic click on a visible toggle in A's embed); `ownreal` (CDP mouse press/release);
  - `form` (pencil -> edit form -> raw box -> Save);
  - `addhero` / `delhero` (`vault.process` adding or removing a hero row, ±110 px);
  - `@pop` (A in a popout).

## DOM facts (`sc522-r1-DOM-stock.json`)
- In Live Preview, `![[B]]` renders as **`div.internal-embed.markdown-embed.inline-embed[src][contenteditable=false]`**, a direct child of `.cm-content`. It is CM's block widget, and the height-map block for the `![[B]]` line equals its height (3190).
  - Inside it: `.markdown-embed-content` (max-height 4000 px, overflow auto) > `.markdown-preview-view` > `.markdown-preview-sizer` (inline min-height) > `.el-pre` > the DSE root.
  - Nested embeds are `span.internal-embed` inside.
- `.cm-scroller` computes **`overflow-anchor: none`**; `.cm-content` and `.cm-sizer` compute `auto`.
- **On every B write that changes the embedded block, Obsidian re-renders the embed's content.**
  - The DSE root is replaced: disconnect at 15-170 ms for an outside write, about 430-470 ms for an own click with adoption off, about 300 ms for a form Save, about 700-1900 ms for a second pane.
  - The `.internal-embed` element and its inner sizer **stay connected** (`emb`/`isz` disconnect null in every row).
  - An adopted own click re-adds the same root (no disconnect).
  - Writes to an unchanged value are skipped by Obsidian (prep write).

## Stock per-case results (scrollTop start -> end, text shift on screen; 2/2 reps; adoption on = off unless shown)
Full rows: `sc522-r1-frame-summary.tsv` (354 rows). Logs: `sc522-r1-run-{first,mx1on,mx1off,mx2on,mx2off,mx3on,mx3off,mx4on,mx4off,ownreal,fpost}-stock.log`.

| geometry | process / nodefs | paneR / paneLP (A narrower) | own click (synthetic + real mouse) | form Save | add / remove hero |
|---|---|---|---|---|---|
| (a) embed near A's end, parked at end (EmbAE) | **6800 -> 3745**, "A-END 1." leaves the screen, top line 163 -> 155 | **7486 -> 3745** | no toggle on screen (n/a) | form not openable in the probe (Follow-up 1) | **6800 -> 3745** |
| (b) tall host, parked below (EmbAS) | **7510 -> 7441, text +69** | **8196 -> 7441, text +755** | toggle not on screen (n/a) | not openable | add 7510 -> 7550, **text +69** (post sample +178 for one frame); remove 7510 -> 7331, **text +69** |
| (c) embed top on screen (`view`) / `near` | held 3720 / 2999, 0 px | held, 0 px | st held 3720, **in-embed text +24** (S-TOP 271 -> 295: the selected-embed outline) | – | add held, 0 px |
| (c') parked in the tracker (`in`) | held 5420, 0 px | – | **5420 -> 3916, text +1528** (on and off; real mouse too) | – | – |
| (d) inside a tall embed below its tracker (EmbAL) | held 4272, 0 px | held 4828, 0 px | – | – | add **text +110**, remove **−109**, st held (the reader is inside the growing embed; CM keeps the embed's top) |
| (e) above the embed (not drawn) | held 2299, nothing redrawn | – | – | – | – |
| mostly-embed host (EmbAC) at end | **2912 -> 26** | – | **2912 -> 150** (adoption on) / **2912 -> 0** (off) | **2938 -> 26** (on and off) | – |
| (g) `#heading` below / at end | **7486 -> 7417, +69** / **6776 -> 3721** | – | – | – | – |
| (g) nested A->N->B below / at end | held 7661 / 6951 -> 6950 (1 px) | – | – | – | – |
| popout, end / below | **6830 -> 3792** / 7491 -> 7488 (+3) | – | – | – | – |

- **Adoption** changes only the own click: no redraw with adoption on, a redraw with it off. Both move through Mechanism 2, and adoption off adds the clamp on EmbAC.
- **Nested A->N->B holds on stock.** The outer embed keeps its height because N's inner sizer min-height holds while the inner `span.internal-embed` collapses.

## Mechanism (measured)
- **1. The redraw clamp.**
  - Forced layout per mutation (`sc522-r1-run-molayout-stock.log`):
    - At +34 ms the embed is **135 px** (was 3190), its inner sizer **111 px** (was 3166), and scrollHeight is **4766** (was 7821; below: 8462 vs 11517). scrollTop is already **3745 = 4766 − 1021** (below: **7441 = 8462 − 1021**).
    - At +71 ms the embed is back to 3190 after one batch of 2529 mutations (our mount).
    - CM `contentHeight` stays 7757 / 11453 throughout.
  - Trace (`sc522-r1-run-trace-stock.log`): zero `scrollTop` setter / `scrollTo` calls, zero CM transactions on A, and no CM `measure` that changed scrollTop.
  - No rAF frame sees the collapse. A 0.8-3 s stretch without frames follows the write; the profile is in Follow-up 2.
  - So the browser clamps passively inside the re-render task, and nothing scrolls back. Anchoring is off on `.cm-scroller`, so nothing compensates either.
  - That is why it only bites when scrollTop is above the shrunken max: end, below, and EmbAC.
- **2. The own click** (`sc522-r1-run-owntrace3-stock.log`, `sc522-r1-SRC-obsidian-embed-click-handler.txt`).
  - Obsidian's `hookClickHandler` on the embed widget runs `selectElement` on a click. It dispatches `{selection: {head, anchor}, scrollIntoView: true}`.
  - CM's next `measure` scrolls the selection (the embed's top) into view: setter stack `kme <- scrollIntoView <- measure`, 5420 -> 3916.
  - The handler skips a target with an ancestor matching `.cm-editor, .interactive-child`. Bases embeds use `interactive-child` themselves.
  - DSE's click shield stops `mousedown`/`pointerdown` but not `click`, so the click reaches the handler.
  - Emulation (`sc522-r1-run-ownstop-stock.log`): stopping click propagation at the root held 5420 / 2912 and the write still landed.
- **Emulated holds** (`sc522-r1-run-emu{widget,sizer}-stock.log`):
  - An inline `min-height` on the `.internal-embed` held E end, S below (0 px), C end and S in.
  - The same hold on the inner sizer did **not** hold (3745 / 7441 / 26), because Obsidian rewrites the sizer's inline min-height.

## Prototype (`sc522-r1-prototype.patch`, generated on 71437da; `git apply --check` clean there)
- **`src/framework/host/livePreviewScrollHold.ts`**
  - New header section "EMBEDS: A LIVE PREVIEW HOST NOTE (SC-522)" with the mechanism and cost numbers above.
  - `captureViewsOf(workspace, path, resolveLink?)`: the note's own LP views keep SC-478's capture, unchanged. With a resolver, LP views of **another** note call `holdEmbedsOf`.
  - `holdEmbedsOf(view, path, hostPath, resolveLink)`:
    - skips a view at the top;
    - for each direct `.cm-content` child that is an `.internal-embed` holding a DSE root and `embedsBlockOf(el, path, hostPath, resolveLink)`, sets an inline `min-height` = its current content-box height plus `data-dse-lp-embed-hold="<px>"`.
  - Release (MutationObserver on the widget, the widget's own window):
    - when a DSE root that was not there at hold time is present, or a held root is re-added (an adopted write);
    - **and** every root in the embed has children.
    - On release: restore any prior inline min-height, remove the attribute, `view.requestMeasure()`.
  - `PIN_TTL_MS` timer as the backstop. A re-hold never lowers the floor. `releaseAll` and the ViewPlugin's `destroy` drop the holds (they share the `holds` map).
  - `PIN_TTL_MS` is unchanged.
- **`src/framework/host/previewScrollPin.ts`**: `embedsBlockOf` is exported (SC-479's resolver: nested chains, `#` subpaths) and also checks the container itself when it is an `.internal-embed[src]`. A Reading scroller never matches, so SC-479's behaviour is unchanged. The "NOT COVERED" header line is updated.
- **`src/framework/pipeline.ts` `armClickShield`**: `markInEditorEmbed()` adds `interactive-child` to the root on a capture `click` and inside the existing pointerdown/mousedown stop. It does this only when `root.closest('.cm-content .internal-embed')` matches, so Reading view and the DSE LP code-block widgets are untouched.
- **`src/framework/registerFrameworkElements.ts`**: passes the existing `resolveLink` to `captureViewsOf`.
- **Jest:**
  - `livePreviewScrollHold.test.ts`: the wiring test now expects `(workspace, 'Note.md', Function)`. New `describe('SC-522 …')` with 6 tests: only matching DSE embeds held at their px; no resolver / top / Reading = nothing; nested (inner link resolved from N) and `#heading`; release on a fresh mount but not while it is empty, with `requestMeasure`; release on an adopted re-add; TTL backstop + floor never lowered + prior inline restored + `releaseAll`.
  - `pipeline.test.ts`: click / pointerdown / mousedown inside an LP embed mark the root (3); a Reading-view embed and an LP code-block widget do not (1).
- **`visual-harness/obsidian-lifecycle.mjs`**: fixtures `Lifecycle/lpembtracker.md`, `lpembhostend.md`, `lpembhosttall.md`, a header line, and **G-S52** appended after G-S42.

### G-S52 phases
| phase | what |
|---|---|
| (a) | `vault.process`, host parked at its end |
| (b) | disk write (watcher), same geometry |
| (c) | a second Reading pane showing B clicks; A parked at end |
| (d) | tall host parked below the embed, a hero added |
| (e) | a **real** mouse click on a toggle in the embedded card, adoption on, host parked in the tracker |

- **Per-phase assertions:**
  - write landed; tagged root tagged;
  - (a)-(d) tagged root replaced (anti-vacuity);
  - (a)-(c) parked at max;
  - reference text on screen;
  - (a)-(d) `data-dse-lp-embed-hold` on the embed when the tagged root left the document;
  - scrollTop identical in every frame and at the end. For (d), scrollTop must instead move by exactly the growth (the text's settled position must equal its start, and the embed must grow ≥ 50 px);
  - text identical every frame ((d): settled);
  - hold released;
  - **no frame shows a mounted new tracker while the hold is still on** (release by the remount, not the timer);
  - host selection unmoved.
- (e) skips the hold assertions: an adopted click redraws nothing, and the phase tests the click alone.
- Every phase runs even after one fails. No timed delay decides an outcome. The parking `sleep`s settle the scroll before the write, as in G-S42, and the (e) disk poll only waits for the debounced write to land.
- (e) first makes a write the embed has not shown yet. Without it, an embed left from (d) held the old body and its click was refused with "changed on disk first" (Follow-up 4).

### G-S52 discrimination (`sc522-r1-disc-summary.log`, `sc522-r1-disc{1,2,3,11,12,13}-*.log`)
| bundle | runs | result |
|---|---|---|
| stock | 3 (+3 on the earlier harness) | **FAIL 3/3**, every phase. (a)/(b) 6800 -> 3745, (c) 7486 -> 3745, no hold; (d) "scrollTop did not take the growth: 7509 -> 7550" (text +69); (e) 5420 -> 3916, text 65 -> 1593 |
| proto | 3 (+3 on the earlier harness) | **ok 3/3**: held 6800 / 6800 / 7486; (d) text settled at 9 px, scrollTop 7509 -> 7618 with the embed 3190 -> 3299; (e) held 5420; hold 1-2 frames |
| ctl-nohold | 3 | **FAIL 3/3** (a)-(d) (no hold; same numbers as stock); (e) ok |
| ctl-norelease | 3 | **FAIL 3/3** (a)-(d): "the hold outlived the remount by 86-114 frames"; (e) ok |
| ctl-noclick | 3 | **FAIL 3/3** (e) only: 5420 -> 3916, text 65 -> 1593 |

- After the first 3 proto runs, (e)'s hold assertions were dropped so ctl-nohold isolates part 1. Stock and proto were re-run 3x on the final harness.
- The FAIL screenshots: `sc522-r1-disc-{stock-final,ctl-nohold,ctl-norelease,ctl-noclick}-G-S52-FAIL.png`.

### Gates with the prototype (in-tree harness, in-tree build `cb9aaa28bc6d`)
- `--only=G-S8,G-S15,G-S18,G-S42,G-S52`: **5/5 ok, 3 of 3 runs**, rc 0 (`sc522-r1-lc-only5-run{1,2,3}-proto.log`).
- Full lifecycle as two `--only` halves:
  - first half (G-S7a … G-S8): **20/20 ok**;
  - second half (G-S9a … G-S52): **21/21 ok**;
  - union **41/41** (= 40 + G-S52), rc 0 both (`sc522-r1-lc-half{1,2}-proto.log`).
- `npm run tsc`, `npm run lint`, and `node --check` of the harness all rc 0. Targeted jest (livePreviewScrollHold, previewScrollPin, pipeline, register-framework-elements): **134/134**, 4 suites (`sc522-r1-checks-final.log`, `sc522-r1-jest-final.log`).
- **New tests on stock source** (source reverted, tests kept; `sc522-r1-jest-tests-on-stock-src.log`): **9 FAIL** (the updated wiring test, 5 hold tests, 3 click tests). The 2 negative tests pass by design.

## Base vs prototype, every geometry (2/2 reps each; text = settled screen shift of the tracked line, rAF / [post-paint min, max])
Proto logs: `sc522-r1-run-{px1on,px2on,px3on,px3off,px4on,pxoff,fpost}-proto.log`.

| geometry / writer | stock | proto |
|---|---|---|
| (a) end:E process / nodefs / popout | 6800 -> 3745, text lost (popout 6830 -> 3792) | **held 6800, 0 px** (popout 6830, 0) |
| (a) end:E paneR / paneLP | 7486 -> 3745 | **held 7486, 0** |
| (a) end:E add / remove hero | 6800 -> 3745 | add: held 6800, line under the embed **+109** (it sits below the growth; reader's viewport top is inside the embed); remove: 6800 -> 6690, **0** |
| (b) below:S process / nodefs / panes / heading | +69 (panes +755) | **0** |
| (b/f) below:S add hero | 7510 -> 7550, **+69** [post 8..186] | 7510 -> 7619, **0** [post 8..117] |
| (b/f) below:S remove hero | 7510 -> 7331, **+69** [post −33..77] | 7510 -> 7400, **0** [post −102..8] |
| (c) view:S / near:S, all writers | held, 0 (own click: in-embed +24) | held, **0** (own click: 0) |
| (c') in:S outside writers / own click | held / **5420 -> 3916, +1528** | held / **held 5420, 0** |
| (d) inside:L outside writers / panes | held, 0 | held, 0 |
| (d/f) inside:L add / remove hero | +110 / −109 (st held) | **+110 / −109** (identical to stock) |
| (e) above:S | held (not drawn) | held (not drawn, no hold) |
| EmbAC end: process, nodefs, own, form | 2912 -> 26 / 150 / 0; form 2938 -> 26 | **held 2912, 0** (own on/off, form on/off) |
| (g) heading end / below | 6776 -> 3721 / +69 | **held, 0** |
| (g) nested below / end | held / 1 px | held / **0** |

- The adoption-off proto rows (`pxoff`, `px3off`) equal the adoption-on rows.
- **Not worse than stock at the settled position in any geometry.** (a) add-hero at end is +109 px where stock loses 3055 px. (d) inside the growing embed is identical to stock. For the one-frame transients, see Risk 1.

## Cost (`sc522-r1-run-cost.log`, `sc522-r1-COST-proto.json`; timing-instrumented copy of proto)
- **Setting a hold** (inline min-height + attribute, then the first forced layout): **1.3-3.4 ms**, median 1.7 (n=9). The DOM is clean at `modify`.
- **Scan per LP host view that holds:** median 1.7, max 4.2 ms (n=18, includes the set).
- **Scan per LP view per `modify` when nothing is held** (3 LP views, 20 writes to a note none embeds): **median 0.1, max 0.5 ms** (n=60).
- **Release:** no layout read in the code (the attribute and style are removed, then `requestMeasure`). The instrumented copy forced a layout read there and measured 0-465 ms. That read is the freshly mounted tracker's own first layout, which the next frame pays anyway, so it is not a cost of the hold.

## Risks
1. **One-frame compensation lag on a height change above the viewport (geometry b/f).** CodeMirror compensates a widget that grew or shrank above the viewport at its next `measure`, a frame later.
   - With the hold released at the remount, the post-paint sampler saw one sample at **+109 (add) / −110 (remove)** before compensation. The rAF sampler saw 0, and the settled shift is 0.
   - Stock shows the same lag on top of its clamp: post-paint **+178 (add) / −41..+69 (remove)**, settled +69.
   - By max |shift| over all samples, the proto's remove-hero case (110 px, one sample) exceeds stock's (69 px, permanent). Owner's call.
   - There is no cheap fix: a synchronous CM measure is internal API, and replicating CM's anchor correction ourselves is a second mechanism.
   - G-S52 (d) asserts the settled position for this reason. The post-paint sampler may also catch states that were never painted: it runs after a frame but possibly after a later task.
2. **Part 2 changes Obsidian behaviour for clicks inside DSE cards in LP embeds.** A click no longer selects the embed: no cursor jump, no selected-embed outline, which removes the +24 px in-embed shift.
   - Obsidian also checks `interactive-child` in an embed `dblclick` handler and in Mod+A handling.
   - Measured: the write lands (adoption on/off, synthetic and real mouse).
   - Unmeasured: double-click on a DSE card in an LP embed, and keyboard select-all inside a card.
   - Part 2 is separable: dropping it leaves (e) failing as on stock, and parts are independently controlled.
3. **Dependence on Obsidian internals.** Part 1 depends on the `.internal-embed` being the CM widget as a direct `.cm-content` child. Part 2 depends on the `.interactive-child` check in `hookClickHandler`. If either changes, G-S52 (a)-(e) catch it.
4. **TTL-bounded floor.** A B write that Obsidian does not re-render in the embed leaves the floor for `PIN_TTL_MS`. The floor equals the height the embed already has, so it is invisible unless the embed would shrink within those 2.5 s.
5. **Not measured:**
   - a B with two DSE blocks (the release waits for all roots to mount);
   - a host with two embeds of B (each widget is held and released independently);
   - a theme with `box-sizing: border-box` on `.internal-embed` (handled in code, untested live).
6. **Own click with adoption off on EmbAC** combines both mechanisms (2912 -> 0 on stock); proto holds 2912. G-S52 drives the click only with adoption on (e) and the redraw only from outside writers.

## Follow-ups:
1. **Form Save from inside an LP embed in a tall host could not be driven.** The pencil hover-and-click did not open the form in EmbAE/EmbAS (it did in EmbAC, where stock moves 2938 -> 26 and proto holds). Not investigated. It may be Mechanism 2 moving the card under the pointer between press and release. r3 should retry with the patch.
2. **Perf (outside this ticket).** DSE chrome `$R` -> `Yq` (`getComputedStyle(...).border*Width`) costs about 450-520 ms of forced style recalc per tracker mount in this vault (CPU profile, `sc522-r1-run-prof-stock.log`). Separately, the redraw shows a 0.8-3 s stretch with no frames under Xvfb.
3. **Reading-view analogue of Mechanism 2: none** (no CodeMirror). SC-479's Reading host pin is unchanged by the patch (G-S42 ok ×4: three `--only` runs + the second half).
4. **Observed:** an LP embed left over from an earlier write held the old body, and its click was refused with "a change to a block in lpembtracker was not saved — the block changed on disk first". This came from the G-S52 (e) draft after B was reset and the host reopened. It may be correct (stale view) or a missed re-render of the embed; not investigated.
5. **dse-verify text for landing:**
   - lifecycle row 4 -> `41/41` (two halves: 20 + 21);
   - a G-S52 entry: fixtures `Lifecycle/lpembtracker.md` / `lpembhostend.md` / `lpembhosttall.md`; phases (a)-(e) as above; controls "host embed hold disabled" (FAILs (a)-(d)), "hold released only by its timer" (FAILs (a)-(d), hold outlived the remount), "no `interactive-child` mark" (FAILs (e) only); base FAILs every phase.

## Evidence (all in this dir)
- Patch: `sc522-r1-prototype.patch`.
- Stock and proto matrix logs: `sc522-r1-run-*-{stock,proto}.log`.
- Frame summary: `sc522-r1-frame-summary.tsv`, with its script `sc522-r1-summ.py.txt`.
- G-S52 discrimination: `sc522-r1-disc-summary.log` and `sc522-r1-disc*.log`.
- Lifecycle with the prototype: `sc522-r1-lc-*-proto.log`.
- Checks and jest: `sc522-r1-checks-final.log`, `sc522-r1-jest-final.log`, `sc522-r1-jest-tests-on-stock-src.log`.
- Cost: `sc522-r1-run-cost.log`, `sc522-r1-COST-proto.json`.
- DOM facts and Obsidian's click handler source: `sc522-r1-DOM-stock.json`, `sc522-r1-SRC-obsidian-embed-click-handler.txt`.
- Screenshots:
  - deciding stock pair: `sc522-r1-shot-stock-process-end-E-{before,after}.png` (after = the embed's top instead of A's end);
  - the same with the prototype: `sc522-r1-shot-proto-process-end-E-{before,after}.png` (identical);
  - also `sc522-r1-shot-{stock,proto}-process-end-C-{before,after}.png`;
  - the G-S52 FAIL shots.
- Probes and scripts: `sc522-r1-probe-*.txt`, `sc522-r1-mkharness.cjs.txt`, `sc522-r1-{run,build,variant,buildall,disc,lc}.sh`, `sc522-r1-build-summary.log`.

## Tree hygiene
- dse HEAD **71437da** (= `origin/develop`), `git status --porcelain` **empty**. The superproject worktree porcelain is empty too.
- How the tree was restored:
  - The prototype was edited in the tree, and each control variant was built by a temporary one-line edit restored from a saved copy.
  - All 7 files were then restored with `git checkout --`.
  - `main.js`, `styles.css` and `main.css` were deleted by literal path.
  - Ignored leftovers: `node_modules/` and `.devbox/`.
- Every `/tmp/dse-obsidian-lifecycle-*` dir from my FAIL runs was deleted by literal path. The others in `/tmp` belong to other sessions.
- No process of mine is running.
