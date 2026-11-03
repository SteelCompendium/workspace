# SC-545 r1: diagnosis report (real Obsidian 1.15.0, dse f7c9c7ce)

## Executive summary
- **Reproduced: yes, every time.** After plugin off/on, a `+` on a counter in an LP callout writes nothing (disk 6 -> 6, card shows 6, 0 page errors, 0 console.error). The same happens to a counter in a note embedded in LP (`![[note]]`), a stamina bar in a callout (no modal opens) and an initiative tracker in a callout (Advance round writes nothing). These still work: a plain LP fence, Reading view (plain and callout), and a second off/on of a plain fence. The callout stays dead after a second off/on, after typing outside it, after scrolling it away and back, after moving the cursor in and out, and after LP -> Reading -> LP. It recovers only when the callout's own text changes or the note is reopened.
- **Mechanism:** the plugin toggle makes Obsidian fire `post-processor-change`. Live Preview then rebuilds only its code-block widgets: the `zue` effect clears the code-block cache (app.js 1.15.0 @2651889 `Eh(k,zue)&&(u(V),V=[])`). Callout widgets are reused whenever their text is unchanged (@2653371 `R1(H,kt=>kt.text===Ae)`), and they keep their cached DOM (@1764915 `toDOM`). So no processor runs and the old card stays on screen. Its view was unloaded, and its `registerDomEvent` listeners went with it (`iconButton.ts:129`; the `+` button's listeners were `[click]` before and `[]` after). No live registry owns the card, so nobody handles the click. Only the old click shield is left: its raw `addEventListener` listeners (`pipeline.ts:221-247`) were never removed, and they swallow the press. The result is no write, no source-open, no error.
- **Recommended fix:** the old instance's `ViewRegistry.onunload` (`viewRegistry.ts:220`) stores each LP callout or embed card's own widget context on its element. The new instance remounts a fresh card there on layout-ready, through `ReusedElementRemounter.mount` (`remountReused.ts:91`). Where no card is drawn (a raw DSE fence in an LP callout or embed, or a card nobody owns), it falls back to `setViewData(getViewData(), true)` plus the view's ephemeral state, for that view only. **The prototype bundle fixed every case:** the click saves and the card shows the new value, including twins, scroll held exactly (2559 -> 2559), a pending write at disable, and a first enable. Lifecycle G-S6e, G-S6i, G-S57 and G-S62 passed 4/4 on the stash-only prototype A (the AB bundle got only the R545 probe).
- **G-S63:** 7 phases, about 60-90 s (each phase measured 12.5-17 s with fixed sleeps). It would join **part 2** (`G-S9b … G-S40`, about 5 min), not part 3.
- **SC-535 overlap: no.** I could not reproduce the hang: three off/on cycles with an LP initiative tracker on screen (in a callout on head and on the prototype, and as a plain fence on head) caused no hang. It does not share this cause. The fallback (B) re-renders a note's trackers, so it could in principle reach whatever triggers SC-535.

## 1. Measurements (head f7c9c7ce, Obsidian 1.15.0, port 9545)
Each case: open the note in the given mode, real CDP `+` click (it wrote, a sanity check), `disablePlugin`, 1.5 s, `enablePlugin`, 2.5 s, real CDP click, up to 3 s wait for disk. "gen" is a tag put on every DSE root before disable: `pre` = the pre-disable DOM is still there, `new` = redrawn. "owned" = in the live `viewRegistry`.

| Case | After off/on, click | Card after enable | Source run |
|---|---|---|---|
| (a) `ds-counter` in callout, LP (ticket case) | **no write**: disk [6] -> [6], card shows 6 | pre / orphan; `+` listeners `[]` (start `[click]`); root keeps `click,click,mousedown,pointerdown` (stale shield) | run2, run3, run10 |
| (b) plain fence, LP | writes [6] -> [7] | new / live (Obsidian redrew the code-block widget, processor called) | run2 |
| (c) plain, Reading view | writes [6] -> [7] | new / live | run2 |
| (c) callout, Reading view | writes [6] -> [7] | new / live. The hidden LP editor's callout card stays pre / orphan. | run2 |
| (d) stamina bar in callout, LP | click opens **no modal** (it did before off/on) | pre / orphan | run3 |
| (d) initiative in callout, LP (Advance round) | **no write**; no hang | pre / orphan | run6 |
| (d) initiative plain fence, LP | writes; **no hang** (SC-535 check) | new / live | run7 |
| (x) counter in a note embedded in LP host | **no write** | pre / orphan | run3 |
| twin callouts (`Lifecycle/twin-callouts.md`), clicks 1, 0, 1 | no write, all three | pre / orphan x2 | run10 |
| callout mid-way down a tall note | no write | pre / orphan | run10 |
| (e) DOM after enable | the old DOM stays (same tagged root, connected). 0 `proc` calls for it after enable. 42 `post-processor-change` events on disable, 42 on enable (one per registered alias) | — | run3 fullLog |
| (f) type `Z` outside the callout | still dead (values unchanged) | pre / orphan | run3 |
| (f) type `Z` in the callout's title line | **heals**: writes [6] -> [7] | new / live (text changed -> new widget) | run3 |
| (f) scroll to note end and back (150 paragraphs) | still dead | pre / orphan | run3 |
| (f) cursor into the callout, then out | still dead | pre / orphan | run3 |
| (f) LP -> Reading -> LP | still dead in LP | pre / orphan | run3 |
| (f) open another note, back | **heals** | new / live | run3 |
| (g) second off/on cycle | callout dead after both; plain fence writes after both | — | run3 |
| `+` then disable within 30 ms (write pending at unload) | the write lands (disk 7), but after enable the callout is **raw YAML code**, no card | none | run12 |
| plugin off while the note is opened, then on (first enable / install) | the callout stays **raw code** | none (raw `pre>code.language-ds-counter` = 1 before, 1 after) | run5, run10 |

No page errors, rejections or `console.error` in any case.

## 2. Mechanism, with probe evidence
1. `plugin.registerMarkdownCodeBlockProcessor` triggers `post-processor-change` on register and on unregister (app.js @2574320). Listeners: the Reading view does `rerender(true)` (@1846796), so Reading view is always redrawn (cases c). The LP editor dispatches `rf` and `zue` 10 ms later (@2662928).
2. In LP's decoration builder, `zue` clears only `V`, the code-block widget cache (@2651889). Plain fences therefore get new `lP` widgets and new processor calls, both on disable (shown as code) and on enable (a new card). Probe: in case (b) the root is `new / live` after enable.
3. Callout widgets (`Gz extends Uz`, @2642727/@2641773) live in cache `H` and are reused whenever the callout's text is unchanged (@2653371). `toDOM` returns the cached `containerEl` (@1764915). `Uz.initDOM` renders the callout's markdown once, with a synthetic context (`getSectionInfo:()=>null`, @2642413). Nothing in a plugin toggle changes the text, so the widget keeps its first-render DOM forever. Scrolling (cached DOM), cursor in/out (the cached widget is kept while the callout is shown as source) and a mode switch all leave it as it is. Only a text change (new widget) or reopening the note (editor `cleanup()` clears every cache) produce a fresh render. That matches every (f) row. Embeds (`O1`, cache `B` matched by href) behave the same (case x).
4. DSE side at disable: `ViewRegistry` is a plugin child. Obsidian's `Component.unload` unloads children (LIFO), then runs `_events`, then `onunload` (app.js @833575). So each view unloads first: its flush runs (G-S6e still holds) and its `registerDomEvent` listeners are removed. The `+` is `stepper.ts:161` -> `iconButton.ts:129` `owner.registerDomEvent(buttonEl,'click',…)`. Probe: CDP `DOMDebugger.getEventListeners` on `+` gave `[click]` at start, `[]` after disable, `[]` after enable. Then `ViewRegistry.onunload` (`viewRegistry.ts:220-227`) clears its entries, and `main.ts:649/653` drop `frameworkV2` / `viewRegistry`.
5. DSE side at enable: a new instance and a new registry. Nothing tells it about the old card, and no processor call arrives for the callout. Probe: `owned: orphan`, 0 `proc` events.
6. The click: the capture probe sees pointerdown/click land on the old root (`gen: pre, owned: orphan`). No DSE code runs: the button has no listener, and the old view is unloaded anyway, so **no stale instance writes and no `isUnloaded` guard is involved**. The old click shield's raw listeners (`pipeline.ts:221`/`222`/`246`/`247`, not owner-bound) still run. They add `interactive-child` (probe: `interactiveChild: true` on the dead click) and stop mousedown/pointerdown propagation, so Obsidian's widget click handler (`hookClickHandler`, which skips `.interactive-child`) does not open the callout's source either. The click is completely dead, so there is nothing to throw.
7. Plain fence vs callout: the only difference is point 2 vs point 3, which is Obsidian's cache policy. f81a277 behaving the same (ticket) fits: SC-537 / SC-540 do not cause it.
8. Should `onunload` neutralise its cards? Today it leaves LP callout and embed cards looking alive but dead. Their stale shield even blocks clicking into the callout while the plugin stays off (the callout title, text and `</>` still work). Options in §3 handle this.

## 3. Fix options
**A. Stash at unload, remount at load (prototype A).** New `src/framework/host/replugRemount.ts`:
- `stashForReplug(entries)`: for each live entry whose root is connected, inside `.markdown-source-view`, and inside `.cm-embed-block.cm-callout` or `.internal-embed`, take `host.remountTarget()` (`ReadingModeBlockHost.ts:610`: el, the widget's real ctx, alias) and `host.lastKnownBody` (`:592`). Put them on `el` as a DOM expando plus a `data-dse-replug` attribute.
- `remountReplugged(app, mount)`: for every `[data-dse-replug]` in the markdown leaves that is still connected, clear the mark, `el.replaceChildren()`, and call `mount(el, ctx, alias, body)`.
- Wiring: `viewRegistry.ts:220` `onunload` calls `stashForReplug(this.entries)` before clearing. `remountReused.ts:91` `mount` goes from private to public. `registerFrameworkElements.ts:76` adds `plugin.app.workspace.onLayoutReady(() => remountReplugged(...))`.

The real widget context means `ctx.addChild` binds the new render child to the widget's lifecycle. The old render child's later unload hits an already-released entry, so it does nothing.
- Cost: about 60 lines of source, small.
- Measured (run9, run11): every orphan case writes and shows the right value. That covers a, x, the stamina modal, init Advance round, 2 cycles, mixed note, twins ([6,5] -> [6,6] -> [7,6] -> [7,7]) and the mid-note callout (scrollTop 2559 -> 2559, card top 482 -> 482). Lifecycle G-S6e, G-S6i, G-S57 and G-S62 passed 4/4 on this bundle (logs/lc-protoA-a.log, 200 s).
- Not fixed: the raw-code variants (write pending at unload, first enable), and an upgrade from a build that never stashed.
- Risks: a cross-instance contract (an old build writes, a new build reads; pin the key and document it). SC-537 and SC-481 use the same mount path, and G-S57 passed. SC-540: the stale shield goes away with `replaceChildren`, and G-S62 passed. Scroll (SC-472/478): measured no shift. Reading view is untouched. Hover popovers and canvas LP cards are not covered (they are not markdown leaves).

**B. `setViewData(getViewData(), true)` + ephemeral state for every view with undrawn LP callout or embed blocks (prototype B, in-page, run5/run8).** This is public API, and Obsidian redraws everything with its own processors. It fixes a, mixed, embed, first enable and the hidden LP editor.
- Cost: about 30 lines, small.
- Measured costs: **the undo history is lost** (undo after the rebuild changed nothing; a `U` typed before stayed). **Scroll shifts:** scrollTop 2571 -> 2083 and the card moved 488 px on screen in the mid-note case, because the ephemeral `scroll` is line-based and heights get re-estimated. The whole note re-renders (19-38 ms per view), including other plugins' widgets. Touches SC-472/478 territory.

**AB (recommended) = A, plus B only as a fallback** (prototype AB, run14). B runs after A's remounts settle, and only for a view that still has a raw DSE fence or a card nobody owns in an LP callout or embed. `rebuildViewsWithUndrawnBlocks` in the same module; it checks `MarkdownView` and uses `framework.registry.get(alias)`.
- Measured: all 7 cases write and show the right value, including the write pending at disable (raw -> card, then [7] -> [8]) and the first enable ([5] -> [6]). Normal off/on did not trigger the fallback (`rebuilt: []` in a, mid, twins, mixed, embed), so A's zero scroll shift holds there.
- The fallback also covers the plugin update that ships the fix: the old build did not stash, its orphans are detected as unowned, and the view is rebuilt.
- Cost: A plus about 35 lines.

**C. Route the stale card's click to the live instance: rejected.** The listeners are gone (`registerDomEvent`). Keeping them would leave old-instance closures over torn-down services, against `main.ts:651-654`'s rule.

**D. Neutralise at unload (optional add-on).** Replace LP callout and embed cards with an inert placeholder or plain code while the plugin is off, keeping `el` for A. It does not meet "Expected" by itself.

**G-S63 (proposed).** Phases, each: real `+` (anti-vacuity: it writes), tag the root, off/on, real `+`.
- Assert in every phase: the tagged root is disconnected, a new root is owned by the live registry, disk +1, the card shows the disk value, no page error, no Notice.
- (a) counter in a callout; (b) counter in an LP embed; (c) twin callouts, clicks 1, 0, 1 (per-block values); (d) stamina bar in a callout: the real click opens the Stamina modal; (e) tall note with the callout mid-pane: scrollTop and card top unchanged (±1 px); (f) `+` then off within 30 ms: the write lands, the callout is a card after enable, the next `+` writes; (g) control: a mixed note's plain fence, plus Reading view.
- Runtime: about 90 s with the probe's fixed sleeps, about 60 s with `waitFor`. Put it in **part 2** (about 5 min today, from the SC-540/SC-546 gate log mtimes). It is independent of G-S56.

**Jest (`test/dom/framework/replugRemount.test.ts`, ~12 tests).**
- Stash: marks only roots in LP callouts and embeds (skips Reading view, LP code blocks, detached roots, a null body).
- Remount: mounts once per mark, clears the mark, skips detached elements.
- Fallback: detects raw DSE code and unowned roots only inside LP callouts and embeds, ignores non-DSE code and Reading view, calls `setViewData` once per view with the ephemeral state restored.
- `ViewRegistry.onunload` stashes before clearing.
- `registerFrameworkElements` remounts on layout-ready.

## 4. Overlaps
- **SC-544** (pending-write flush) adds `flushPendingWrites` to `viewRegistry.ts` (beside `pendingWrites`) plus `view.ts`. A edits `ViewRegistry.onunload` in the same file, nearby, so the textual conflict risk is low. Semantics: the unload flush is unchanged. A write pending at unload rebuilds the callout raw, which is only covered by the AB fallback.
- **SC-472** (scroll pin) adds one line at `registerFrameworkElements.ts:63`. A adds lines near `:76`. A causes no scroll shift (measured). The B fallback does shift scroll, which is SC-472/478's domain, but only in the fallback cases.
- **SC-551** (CDP ports) touches the harness only.
- **G-S63** edits `visual-harness/obsidian-lifecycle.mjs`, which SC-544 (+312), SC-472 (+322) and SC-551 (+41) all touch. Expect a rebase conflict in the header comments and the SCENARIOS list, so land after them.
- **SC-535: not reproduced, no shared cause found.** LP tracker off/on: callout on head 15.1 s, callout on prototype A 12.7 s, plain on head 13.2 s. No hang.

## Evidence
All evidence is under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r1-diag-k3p9/`.
- Probe scripts: `r545-scenario.mjs`, `r545-instr.js`, `mkharness.py`, `probe.sh`.
- Prototype B: `protoB-setviewdata.js`.
- Prototype diffs vs the worktree's `src`: `protoA.diff`, `protoAB.diff`. Source copies: `protoA-src/`, `protoAB-src/`. Bundles: `bundle-head/`, `bundle-protoA/`, `bundle-protoAB/`.
- Runs `runs/run{2,3,5,6,7,8,9,10,11,12,13,14}*/`, each with `r545.json`, `lifecycle.log` and `shots/`.
- Lifecycle logs: `logs/lc-protoA-a.log`.
- Obsidian source: `app-1.15.0.js`.

Screenshots in this directory:
- `sc545-r1-head-f7c9c7ce-lp-callout-after-off-on-plus-click-stays-6-nothing-written.png`
- `sc545-r1-prototypeA-lp-callout-after-off-on-plus-click-writes-7.png`
