# SC-543 r1: why two identical tall reference blocks show one card in Live Preview (real Obsidian 1.15.0, dse fb24f8a2)

## Executive summary
1. **Reproduced: the count, yes. A missing card, no.** With the note at rest (scrollTop 0), the editor DOM holds 1 `.cm-embed-block` for two `@Outer.md` blocks, with 4 lookups. The SC-536 r3 count was right. **What the user sees at the second block's position is the full Outer card, nested Ref card included.** Scroll to "Middle." and both widgets are in the DOM, with the second one on screen (`sc543-r1-shot-a-block2.png`). There is no gap, no raw source, no collapsed line, and no moved card.
2. **Mechanism: CodeMirror 6 viewport virtualization (Obsidian core / CM6). DSE plays no part.** CM keeps in the DOM only the blocks that overlap its viewport: the visible area plus 500 px above and below at rest (`getViewport` @421594: `r.lineAt(s+(1-i)*1e3)` with `i=.5`). Block 2 starts at 1723 px, past 1021 + 500. On the first draw both widgets have Obsidian's `estimatedHeight` of 50 (@2641739), so both are built: `initDOM` runs for each and 4 lookups happen. About 200 ms later block 1 measures 1529 px, the viewport shrinks, and CM destroys block 2's widget view (event log: `748 initDOM #3`, then `962 destroy #3`). When the user scrolls there, CM calls `toDOM` again and gets the cached DOM (`$p.toDOM` @1764915). There is no re-render and the lookups stay at 4. The SC-536 probe also counted "after scrolling to the end": there block 1 is the one outside the viewport, so the count is 1 again.
3. **The count depends only on height and position. Identity, references and nesting make no difference.**
   - Non-identical Outer blocks (c1, c2), inline nested cards (d1) and flat tall cards (d2) give the same 1/2/1/1 widget pattern as (a).
   - Twin `@Ref.md` (b) shows 2 only because block 2 starts at 1456 px, inside the margin. At the bottom it also shows 1.
4. **Plugin-free control: same behaviour.** A throwaway probe plugin draws an 1800 px div from `registerMarkdownCodeBlockProcessor`. Sync, async and non-identical bodies all give the 1/2/1/1 pattern. A 300 px async twin gives 2/2/2/2. This is Obsidian/CM core behaviour.
5. **Fixable: not applicable, because there is no defect.** Forcing off-screen widgets into the DOM would fight CM's virtualization. SC-537 and SC-522 are not needed. No prototype was built: there is nothing to fix.
6. **Gate: no G-S58 is needed.** An optional regression check, "each LP fence draws its card when scrolled into view", PASSes on fb24f8a2 (measured here). It cannot be made to FAIL there, because there is no bug. The real lesson is for probes: counting `.cm-embed-block` in an LP editor measures the viewport, not the blocks.
7. **Side observation (Obsidian, already known from SC-481/SC-537).** With the cursor inside block 1 (f-in1), Obsidian hands block 1's original widget, with its live DSE view, to block 2. This is the `R1(V, lang&&code)` match @2656822. Block 2's own widget is discarded. The display is correct (same body, 4 lookups, no re-render). Writes from such a reused view are SC-481/SC-537 territory.

## 1. Setup
- dse `fb24f8a2`, exported with `git archive` into the private scratch folder (`…/scratchpad/sc543-r1-a2b4a54291fac85c8/plugin`). The bundle was built there with `npm ci` and `node esbuild.config.mjs production`.
- Real Obsidian 1.15.0 came from a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with my kit and scenarios spliced in. It ran on its own Xvfb display (:161 and :162) and CDP port 9611. The window is 1440×1100 and the scroller's `clientHeight` is 1021.
- Instrumentation, all page-side:
  - `refs.resolve` is hooked to count lookups.
  - Obsidian's LP code-block widget class `lP` is patched (`initDOM`, `toDOM`, `destroy`, each with a per-widget-object id), taking the prototype from a live decoration.
  - Each phase records the decorations (`EditorView.decorations` facet: widget id, from, whether the widget's cached DOM is connected), `view.viewport`, `lineBlockAt(fence)` top and height, and every `.cm-embed-block` (its widget id, `posAtDOM`, top, height, whether it is on screen, and its DSE roots).
- Phases per case:
  - **settle**: the note just opened in a fresh tab leaf, scrollTop 0.
  - **block2**: CM `scrollIntoView(fence2.from, y:start)`, with no selection change.
  - **bottom**: scrollTop = scrollHeight.
  - **top**: scrollTop = 0.
- Every case ran in a fresh LP leaf, which was closed afterwards. Both runs: 2/2 ok, 0 page errors, no temp dir kept.

## 2. Measurements
Fixtures: `Outer.md` is a trait whose effect nests a `@Ref.md` card, 1529 px tall. `Ref.md` is a 1262 px ability card. Notation: `w#N@pos` is the widget object id and the doc position of the fence it is drawn at.

| Case | settle | block2 in view | bottom | top | lookups |
|---|---|---|---|---|---|
| a: twin `@Outer.md` | 1 (`w#2@29`; `#3@67` built then detached) | **2** (`w#2@29`, `w#3@67` on screen) | 1 (`w#3@67`) | 1 (`w#2@29`) | 4 at every phase |
| a1: one `@Outer.md` | 1 | — | — | — | 2 |
| b: twin `@Ref.md` | 2 (block 2 top 1456, inside the margin) | 2 | **1** (`w#5@63`) | 2 | 2 |
| c1: Outer + `@Outer.md ` (trailing space) | 1 | 2 | 1 | 1 | 4 |
| c2: `@Outer.md` + `[[Outer]]` | 1 | 2 | 1 | 1 | 4 |
| d1: twin inline nested card (no reference), h1529 | 1 | 2 | 1 | 1 | 0 |
| d2: twin flat tall card (no nesting, no reference), h2199 | 1 | 2 | 1 | 1 | 0 |
| e: twin Outer with 70 filler paragraphs between | 1 (block 2 never built: `dom:none`, height still the 50 estimate) | 1 (only block 2; built lazily on scroll) | 1 | 1 | 2, then 4 |
| g-sync: probe plugin, 1800 px div, sync | 1 | 2 | 1 | 1 | — |
| g-async: probe plugin, 1800 px div after `await` | 1 | 2 | 1 | 1 | — |
| g-async-diff: as g-async, bodies differ | 1 | 2 | 1 | 1 | — |
| g-short: probe plugin, 300 px async | 2 | 2 | 2 | 2 | — |
| f-top: (a), cursor at 0, focused | 1 | 2 | 1 | 1 | 4 |
| f-mid: (a), cursor on "Middle.", focused | 1 | 2 | 1 | 1 | 4 |
| f-after: (a), cursor on "After." + scrollIntoView | 1 (block 2 on screen, scrollTop 2315) | 2 | 1 | 1 | 4 |
| f-in1: (a), cursor inside block 1 | 1: block 1 shown as source; **block 2 drawn by `w#31`**, block 1's original widget | 1 | 1 | 1 | 4 |
| f-in2: (a), cursor inside block 2 + scroll | 1: block 1 drawn; block 2 shown as source | 1 | 1 | 1 | 4 |

The probe plugin's processor ran twice per twin note (`g` log: 2 calls with the same body), so both widgets were built.

### Detail for (a), at settle
- Fences: block 1 is `29-56`, `lineBlockAt` top 122, h 1529, in the viewport. Block 2 is `67-94`, top 1723, **h 1529**, outside the viewport.
- `view.viewport` = [0,56]. scrollHeight 3899.
- CM's height map holds block 2 at its real measured height, not 0 and not the 50 estimate. The space is reserved, and only the DOM is virtualized.
- Decorations: two **different** widget objects, `#2@29` and `#3@67`, with different DOM. `#3`'s cached `containerEl` exists, is detached, and holds 2 DSE roots (outer and nested).
- Event log: `toDOM #2 new`, `initDOM #2`, `toDOM #3 new`, `initDOM #3` (all at about 731-748 ms), then `destroy #3` (962 ms) and `toDOM #3 cached` on scroll (2320). After that, `destroy #2` / `toDOM #2 cached` / `destroy #3` as the view moves. No `initDOM` happens after the first pass, so no view is rebuilt.

### DSE's part
- Each DSE view mounted once, into its own widget's element. The widget id stamped on the element at `initDOM` always matched the decoration at that position.
- Lookups never moved after settle.
- No DSE code moved a subtree: `ReadingModeBlockHost.ts`, `remountReused.ts` and view adoption were not involved. The 0-lookup cases (d1, d2) and the plugin-free cases behave the same.
- The only DOM that changed places is Obsidian's: the f-in1 widget hand-off.

Screenshots (ledger dir):
- `sc543-r1-shot-a-block1.png`: block 1's card at the top.
- `sc543-r1-shot-a-block2.png`: "Middle." with the full Outer card under it.
- `sc543-r1-shot-b-block{1,2}.png`
- `sc543-r1-shot-f-mid.png`
- `sc543-r1-shot-f-in1.png`: block 1 as fence source, block 2 as the card.
- `sc543-r1-shot-g-async-block{1,2}.png`: the plugin-free tall div at both positions.

## 3. Mechanism (app.js 1.15.0, extracted copy `…/scratchpad/sc481-r1-diag-a69a8a02591085ed8/obsidian-1.15.0-app.js`)
**CM6 (bundled in app.js):**
- `getViewport` @421594: `i=.5-max(-.5,min(.5,bias/1e3/2))`, so the viewport runs from `visibleTop - i*1000` to `visibleBottom + (1-i)*1000`. That is ±500 px at rest, and it is biased toward the scroll direction while scrolling.
- `viewportIsAppropriate` @422381 keeps the current viewport while it covers at least 10-250 px and stays within 2000 px.
- Blocks outside the viewport are height-map gaps. Their widget views are destroyed: `BlockWidgetView.destroy → widget.destroy(dom)` @343831.

**Obsidian LP code-block widget `lP`** (@2639967; base `$p` @1764051):
- `estimatedHeight` is 50 (@2641739). That is why the first draw includes block 2.
- `toDOM` caches `containerEl` (@1764915): a widget re-entering the viewport gets its old DOM back, with no processor call.
- `$p.destroy` only disconnects the ResizeObserver (@1764871).
- Decoration rebuild (`kAe` @2650925): for each fence, `R1(V, eh=>eh.lang===si&&eh.code===Vc)` @2656822 takes the first unused previous widget with equal code. A fence under a focused selection returns early (`if(wt=-1,P(li,Pe))return` @2656557) and does not consume one. That is why f-in1 hands block 1's widget to block 2. Unused widgets have their children removed (`u(V)` @2657476).

**DSE:** none.

**Why the earlier probe concluded "one card":**
- SC-536 r3 `R3-LP` counted `.cm-embed-block` in the LP editor at scrollTop 0 and again at the bottom. Each time exactly one tall block overlaps the viewport.
- For `@Ref.md` twins at the top, block 2 happened to start within the 500 px margin.
- Its own data fits this: `els 2, top 1` with 4 lookups. Both views exist, and one is detached.

## 4. Fixability
- There is no defect to fix. Each card is drawn whenever its position is on screen, or within 500 px of it.
- A plugin cannot keep a CM block widget in the DOM outside the viewport, and should not. That is CM's virtualization, and it also applies to plain Obsidian code blocks (the g cases).
- SC-537's listener and `livePreviewScrollHold.ts` (SC-522) are not needed.
- No prototype was built.

## 5. Gate proposal
- **No G-S58 is required.**
- Optional regression check, if the owner wants the "both cards draw" claim pinned. A lifecycle scenario placed before G-S56:
  1. Open the twin `@Outer.md` note in LP.
  2. For each fence, dispatch `EditorView.scrollIntoView(fence.from,{y:'start'})` and wait for lookups to settle and two frames.
  3. Assert that an on-screen `.cm-embed-block` whose `posAtDOM` equals that fence's start contains a top-level `[data-dse-element="feature"]` with "Outer Strike".
  4. Assert that lookups stay at 4.
- That check PASSes on fb24f8a2 (this run's `block2` phase, and the top phase for block 1). It cannot be shown to FAIL there, because the behaviour is correct.
- **Methodology note for future probes:** never compare `.cm-embed-block` counts to block counts in LP. Scroll each fence into view, or read the decorations.

## 6. Tangents (for the owner; none is SC-543)
- **INFO-1 (Obsidian, read in app.js, not measured):** `$p.destroy` disconnects the widget's ResizeObserver, and `resizeWidget` runs only in `initDOM`. A cached widget that scrolls back into view therefore no longer calls `requestMeasure` when its own height changes. CM still re-measures on its normal measure cycles. Not investigated.
- **INFO-2 (Obsidian, SC-481/SC-537 class):** a focused cursor inside block 1 hands block 1's live view to block 2 (f-in1). The display is correct. Whether a write from that view targets block 2 or block 1 is the SC-481 reconcile path. `lP`'s `getSectionInfo` reads `this.lineStart`, which the rebuild updates (@2656948), so it should resolve to block 2. Not probed here.

## 7. Artifacts and tree state
- Report: this file.
- Logs:
  - `sc543-r1-obsidian-run1.log` (a, b).
  - `sc543-r1-obsidian-run2.log` (all 17 cases). Its `S43-CASE`, `S43-EVENTS` and `S43-FULL` lines hold the full JSON.
- Scripts: `sc543-r1-obsidian-kit.js.txt`, `sc543-r1-obsidian-scenarios.js.txt`, `sc543-r1-obsidian-run.sh.txt`, `sc543-r1-setup.sh.txt`.
- Screenshots: the 8 `sc543-r1-shot-*.png` files.
- Scratch copy: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc543-r1-a2b4a54291fac85c8/`.
- Tree: plugin and superproject `git status --porcelain` were empty before and after. Plugin at `fb24f8a2`. Nothing was committed.
