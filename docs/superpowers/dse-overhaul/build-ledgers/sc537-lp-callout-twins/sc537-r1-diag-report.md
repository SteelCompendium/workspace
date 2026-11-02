# SC-537 r1 diagnosis: identical callouts in Live Preview (dse 458abe3, Obsidian 1.15.0)

## Executive summary
1. **Reproduced: yes**, in real Obsidian 1.15.0 Live Preview on dse `458abe3`. Every callout case fails: 2 callouts, 3 callouts, 2 blocks per callout, nested callouts. **Form Save data loss: yes.** Save upper (Twin -> Edited), then click lower: names become [Twin, Twin] and disk [6,5]. Correct cases: clicking the lower callout first, a callout twin next to a plain-fence twin (both orders), and plain LP twins (SC-481).
2. **Mechanism.** Obsidian redraws the callouts after the write. It gives the next identical callout the OLD widget object of the written one (app.js 1.15.0 @2653395, `R1(H,kt=>kt.text===Ae)`). That widget's cached DOM still holds the writer's live view, and no processor runs for it (@1764929). DSE cannot see this because a callout widget's `getSectionInfo` is `()=>null` (@2642437). So `fenceOnElement` (`ReadingModeBlockHost.ts:313-317`), `reusedBlockBody` (`:586-592`) and `reconcile` (`remountReused.ts:95`) all return null. A click on that stale card reads the lower callout through the editor (`:502-522`), does not find its own body there, and relocates by body to the upper block (`:806-811`).
3. **Recommended fix (Option A).** Register a CM6 `EditorView.updateListener` with `registerEditorExtension`. On each doc-changing update it runs `reconcile` for the views inside that editor, with an LP-aware section (the editor's callout lookup when `getSectionInfo` is null).
   - The in-page prototype in real Obsidian **fixed both the display and the writes in all 9 callout cases**.
   - 0 false positives in the cases that should not change (lower-first, cross-surface, plain twins).
   - Scroll was unchanged: scrollTop 1850 and card top 349 in every frame.
   - Focus after form Save is unchanged.
4. **Overlap.**
   - SC-522: **no**. `livePreviewScrollHold.ts` is not touched; there is only a one-line registration near its `lpHold` lines in `registerFrameworkElements.ts`.
   - SC-520: **no**.
   - A separate defect was found: any click in an LP callout opens it as source. See §2.5. It is a tangent for the owner, possibly SC-520's area.
5. **Gate:** a new lifecycle scenario **G-S57**, plus jest cases in `test/dom/framework/twin-reuse.test.ts`.
6. **Tree:** the worktree is clean (plugin and superproject `git status --porcelain` empty before and after), and nothing was committed.

## 1. Measurements (real Obsidian 1.15.0, lifecycle harness copy, dse 458abe3, no prototype)
Setup:
- Fixture counters are `Twin` at 5, inside a `> [!note] Camp` callout.
- Clicks are real CDP mouse clicks on `+`.
- "Park" = `editor.setCursor(0,0)`. Parking draws every callout, which shows what the user sees once the cursor leaves.

Notation:
- `Rn` is a DSE root id.
- `@wL` is the line of the widget that draws it.
- "raw" means the callout is shown as source, because the editor selection is inside it.

Source: `run02/p537.json`, `run03/p537.json`.

| Case | Step | Cards after the step | Cards after park | Disk | Verdict |
|---|---|---|---|---|---|
| 2 callouts | click + upper | upper raw; lower `R1=6` @w14 (R1 = the UPPER's original view) | [6,6] (case pairPark: upper fresh `R8=6`, lower stale `R6=6`) | [6,5] | lower shows 6, disk 5 |
| 2 callouts | then click + lower | lower raw; upper `R4=7` | upper 7, lower `R1=7` | **[7,5]** | **lower click wrote the UPPER block** |
| 2 callouts | then click + lower again | — | upper 8, lower `R1=8` | **[8,5]** | every lower click writes the upper |
| 2 callouts (park first) | upper, park, lower, park, upper, park | — | [6,6] → [7,7] → upper 8, lower `R6=7` | [6,5] → [7,5] → [8,5] | the stale view stays in the lower callout indefinitely |
| lower first | click lower, then upper | — | [5,6] → [6,6] | [5,6] → [6,6] | correct |
| form Save | Save on upper (name Twin -> Edited) | upper `R3:Edited=5` (fresh), lower `R1:Twin=5` (stale, value looks right) | same | names [Edited, Twin], [5,5] | display looks right |
| form Save | then click + lower | — | upper `Twin=6`, lower `R1:Twin=6` | **names [Twin, Twin], [6,5]** | **the form edit is erased; the lower is not written** |
| 2 blocks per callout (X=Twin 5, Y=Other 3) | click upper X | — | [6,3,6,3] (lower X `R21` stale) | [6,3,5,3] | lower X shows 6 |
| same | click lower X | — | [7,3,7,3] | **[7,3,5,3]** | wrote the upper X |
| same | click lower Y | — | [7,3,5,4] (lower callout redrawn fresh) | [7,3,5,4] | Y correct (its stale view knew Y's body); writing Y redraws the callout and heals it |
| 3 callouts | click upper | — | [6,6,5] (middle `R31` stale; lower = old middle view, correct) | [6,5,5] | middle shows 6 |
| same | click middle | — | [7,7,5] | **[7,5,5]** | wrote the upper |
| same | click lower | — | [7,7,6] | [7,5,6] | lower correct |
| nested (`> > [!tip]` in `> [!note]`) | upper, then lower | — | [6,6] → [7,7] | [6,5] → **[7,5]** | same bug |
| callout + plain fence, same body | click callout, then plain | — | [6,5] → [6,6] | [6,5] → [6,6] | correct (callouts and code widgets are matched separately) |
| plain fence + callout | click plain, then callout | — | [6,5] → [6,6] | same | correct |
| plain LP twins (SC-481) | upper, then lower | — | [6,5] → [6,6] | same | correct |
| synthetic `.click()` | upper, then lower | — | same as the real-click case | [6,5] → [7,5] | same bug |
| tall note, click with propagation stopped (callout stays drawn) | upper, then lower | upper fresh `R3=6`, lower `R1=6` | — | [6,5] → **[7,5]** | same bug without the raw-source effect: the bug does not depend on the selection |

Every run had 0 Notices and 0 page errors.

## 2. Mechanism

### 2.1 Obsidian (1.15.0 app.js, the extracted copy at `…/sc481-r1-diag-a69a8a02591085ed8/obsidian-1.15.0-app.js`)
- **Live Preview draws a callout as one block widget, class `Gz` (@2642751).** It extends `Uz`, whose `initDOM` renders the callout markdown and runs `postProcess` with `docId: St(16)` (random) and `getSectionInfo: () => null` (@2642437). So a DSE block inside it has no section info, and its docId is never shared.
- **Rebuild (`kAe`, the `ht` closure @2653395).** For each callout range it takes `Pe = R1(H, kt => kt.text === Ae)`. `R1` (@2663876) removes and returns the FIRST unused widget from the previous build whose text is equal.
  - It runs before the "selection inside → draw as source" check, so a raw callout still consumes a match.
  - For [A,A] → [A',A] (a write to the upper): the upper (A') matches nothing. The lower (A) takes the old UPPER widget object.
  - Widgets left unused are cleaned up by `u(B),u(V),u(H),u(z)` (@2657500): their children (DSE's `MarkdownRenderChild`) are removed, which unloads the lower's own view (`release R2 render-child-unload`, measured).
- **No processor runs for the reused widget.** `toDOM` returns the cached `containerEl` when it exists (`$p.toDOM` @1764929), so `initDOM` and its post-processors do not run again. CodeMirror moves that DOM node to the lower slot.
- **Plain code-block widgets (`lP`) use the same first-match rule (@2656843).** They differ in one respect: their `getSectionInfo` answers from `this.lineStart`, which is updated on reuse (@2640662). That is why SC-481's processor-time `reconcile` sees plain twins and is blind to callouts.

### 2.2 Probe evidence (`run02` case `pair`, DOM-tagged)
- **Before:** widget DOM `D1` @line 4 holds `R1`; `D2` @line 14 holds `R2`.
- **After the upper click:** `D1` is at **line 14**, holding `R1`, which shows 6. The upper is raw. `D2` is gone.
- **Events, in order:**
  1. `tx sel [0,0]->[10,4]` (the click selected the upper callout);
  2. `release R2 render-child-unload`;
  3. `tx doc ue=set` (the write arriving through `setViewData`).
- **Zero processor calls** between the click and the next user action.
- **Host R1 after the write:**
  - `known=Twin=6`, `lastWrite=5`;
  - `ctx.getSectionInfo -> null`;
  - `reusedBlockBody() -> null`;
  - editor lookup `livePreviewCalloutSection() -> [14,20]`;
  - fence on that window = `Twin=5`.

  So the editor CAN see the mismatch; `reusedBlockBody` cannot.
- **ViewRegistry:** `claims 0` in every LP run. Each processor call misses because LP docIds are random per widget, so `viewRegistry.ts:145` never matches. There is no adoption in LP.

### 2.3 DSE side (file:line at 458abe3)
- **LP uses `ReadingModeBlockHost`, not `LivePreviewBlockHost.ts`.** That file is an unimplemented stub whose constructor throws.
- **The lower card's clicks go to R1.** R1 is the writer's own view, still bound to the old upper widget's ctx. Its write path:
  1. `readSection` (`ReadingModeBlockHost.ts:456-462`): `getSectionInfo` is null, so it uses `livePreviewCalloutSection()` (`:502-522`). The editor reports the widget at the LOWER callout `[14,20]`.
  2. `findOwnFence` (`:477-486`): `locateInSection(knownBody = A')` finds no match in the lower window, so `ownFence = null`.
  3. `resolveWriteTarget` (`:752-765`): the window's first line is `> [!note]`. `locateInSection` returns null and the in-place path fails (`openOk` false).
  4. The durable path `locateByBody(A', …)` (`:806-811`) finds the ONLY block with body A', which is the upper. The write lands there, so disk goes [6,5] → [7,5].
- **Form Save erase.**
  - The form Save goes through the same host (`:631-735`) and sets `knownBody = Edited body` (`:699`).
  - The view's model is still the old body (Twin 5), which happens to equal the lower twin, so the display looks right.
  - The next lower click serializes `Twin 6` and relocates by the Edited body to the upper block, overwriting the edit.
- **Why SC-481's `reconcile` does not reach it.**
  - It runs only from the processor (`registerFrameworkElements.ts:97-108`).
  - There is often no processor call (the raw-upper case: 0 calls).
  - Even when there is one, the detection is blind. In the tall-note case the fresh upper widget's processor ran in the same update (`PROC Twin=6`), but `fenceOnElement` reads `ctx.getSectionInfo` (`ReadingModeBlockHost.ts:313`), which is null for every view in a callout widget, so `:317` returns null.
- **Why r4's 150 ms timer "never ran" usefully.**
  - It was started from the processor. After the upper click nothing calls the processor.
  - The next processor call comes from the upper callout's own redraw when the selection leaves it, at the start of the NEXT click on the stale card. That click's model change is already made, and its write follows the 400 ms persist debounce (`view.ts:23`).
  - A release at that point flushes the click through the stale host.
  - The detection must run in the update that moves the widget, before the user can click it. The prototype does exactly that.

### 2.4 Which code runs after the write
| Component | Runs? |
|---|---|
| DSE processor | no, for the reused widget |
| `MarkdownRenderChild.onunload` | yes, for the discarded lower widget only (`release render-child-unload`) |
| `ViewRegistry.claim` | only on later processor calls; always misses in LP |
| `reconcile` | only on those later calls; finds nothing |
| `remountVacated` | never (LP never adopts) |

### 2.5 Separate defect: a click on a DSE control inside an LP callout opens the callout as source
- **Measured:** after every click in a callout (real, synthetic, and the Enter that opens the form from the pencil), the selection covers the callout (`tx sel [0,0]->[10,4]`). The card is replaced by raw source. Plain fences keep `sel [0,0]`.
- **Cause:**
  - `armClickShield` (`src/framework/pipeline.ts:195-214`) stops `mousedown`/`pointerdown` only.
  - The callout widget's `hookClickHandler` (app.js @1764204) listens for `click` through `Ah` (@820778). Unless the target is inside `.cm-editor, .interactive-child` or the click was `defaultPrevented`, it calls `selectElement` (@1765049) with `scrollIntoView: true`.
- **Independent of SC-537:** with click propagation stopped, the twin bug still reproduces (tall-note row above).
- **Fix candidates (not SC-537):** put `interactive-child` on the DSE root, or stop `click` propagation at the root.
- **For the owner:** a Backlog tangent, or SC-520's area if its "chrome click handler" is this. It changes how G-S57 is written: assert after parking the cursor, not right after the click.

## 3. Fix options

### Option A (recommended): editor-driven LP reconcile, public API
**Where it changes**
- `ReadingModeBlockHost.ts`:
  - `fenceOnElement` takes the section to judge (default `ctx.getSectionInfo(el)`).
  - `reusedBlockBody` (`:586-592`) passes the editor's callout section when `getSectionInfo` is null and the host is in an LP callout widget (`livePreviewCalloutWidget()` / `livePreviewCalloutSection()`, already there).
  - Read-only; the `lastWriteLine` skip and the ordinal rule stay. Better: read the lines from the update's `state.doc` rather than `editor.getValue()` per host.
- `remountReused.ts`: `reconcile(sourcePath, within?: HTMLElement)`. When called from the editor, it is scoped to entries whose root is inside that editor's DOM. Reading-view and other-pane entries stay judged only at processor time, as today.
- New `src/framework/host/livePreviewReconcile.ts`:
  - `EditorView.updateListener.of(u => { if (!u.docChanged) return; const path = u.state.field(editorInfoField, false)?.file?.path; if (path) void remounter.reconcile(path, u.view.dom); })`.
  - `editorInfoField` is public in obsidian.d.ts:2603.
  - A ViewPlugin with `docViewUpdate` is equivalent.
- `registerFrameworkElements.ts`: one `plugin.registerEditorExtension(...)` line after `:72`.

**Prototype (in-page, real Obsidian; `p537-instr.js` `installProto`/`protoPass`, registered through the plugin's own `registerEditorExtension`)**

Source: `run05/p537.json`, `run07-p1`, `run08-p1`.

| Case | Prototype result (disk / cards after park) | Base |
|---|---|---|
| 2 callouts: upper, lower, lower | [6,5] cards [6,5] → [6,6] → [6,7] | [6,5] cards [6,6] → [7,5] → [8,5] |
| upper, park, lower, park, upper | [6,5] → [6,6] → [7,6], cards = disk | [8,5], lower stale |
| lower first | [5,6] → [6,6] | same |
| form Save upper, then lower | names **[Edited, Twin]**, [5,6] | [Twin, Twin], [6,5] |
| X/Y per callout | [6,3,5,3] → [6,3,6,3] → [6,3,6,4] | [7,3,5,3] |
| 3 callouts: upper, middle, lower | [6,5,5] → [6,6,5] → [6,6,6]; detected twice (the middle element moves to the lower slot after the middle write) | [7,5,5] |
| nested | [6,5] → [6,6] | [7,5] |
| cross, cross2, plain LP twins | unchanged, 0 detections | correct |
| tall note, scroll | scrollTop 1850 in all 167 frames; lower card top 349, height 127; never missing; the swapped card shows the right value (5) on its first frame | same scroll; card shows 6 |
| form Save focus | focus on the upper card's new Edit pencil | same |

Further results:
- Detection happened in the synchronous pass inside the doc-changing update every time. The +50 ms pass never found anything.
- 0 Notices, 0 page errors.

**Cost**
- About 40-70 lines of source.
- Jest: about 6-8 cases.
- One lifecycle scenario.

**Risks**
- *Twin cross-talk:* closed, as in SC-481. The twin's element gets a fresh view bound to its own window and ordinal. A pending edit on the released stale view flushes through `locateByBody(knownBody)`, whose body is the writer's latest, so it lands in the writer's real block.
- *SC-481 Reading view / LP plain:*
  - Reading-view roots are never inside an editor DOM.
  - LP plain widgets are already reconciled at processor time; the listener found nothing in the plain case.
  - `remountVacated` is unchanged.
- *SC-518 focus:* measured unchanged.
- *SC-340 adoption:* LP never adopts (claims 0); unaffected.
- *Scroll (SC-478/SC-522):* measured flat. No `min-height` hold is needed, because the swapped card is drawn before CodeMirror measures.
- *False positives:*
  - The `lastWriteLine` skip covers the window between the writer's splice and the editor's `set` transaction.
  - Typing does not advance `knownBody`.
  - Several blocks with no ordinal are never judged.
- *Per-keystroke cost:* one pass per doc-changing update over the DSE entries inside that editor. Read lines from `u.state.doc` rather than `getValue()`, and return early when the editor holds no DSE callout entry.

**Gate**
- **G-S57**, a new scenario.
  - Recommended over new phases in G-S53. G-S53 sits in the second lifecycle half, which already ran 541 s in r4 (close to the 600 s rule). A new id can go in the first half (halves 22 + 21).
  - Use real mouse clicks. Read the cards after parking the cursor (§2.5).
  - Phases:
    - (a) 2 callouts: upper then lower → [6,5] then [6,6]. Cards equal disk per position. Anti-vacuity: the upper widget's DOM, tagged before the click, sits in the lower slot afterwards, and a `reused-by-twin` release is recorded.
    - (b) form Save upper (keyboard open as in G-S53), then lower click → names [Edited, Twin], [5,6].
    - (c) 3 callouts: upper, middle → [6,6,5].
    - (d) X/Y: upper X, lower X → [6,3,6,3].
    - (e) nested → [6,6].
    - (f) note text outside the quotes equals the fixture.
  - The base 458abe3 bundle must FAIL with the numbers in §1: [7,5], names [Twin, Twin], [7,5,5], [7,3,5,3].
- **Jest** (`twin-reuse.test.ts` infra):
  - Fixture: a fake `cm` (`dom`, `posAtDOM`, `state.doc`) and a markdown leaf; two hosts whose element sits in `.cm-embed-block.cm-callout` with `getSectionInfo` null. Move the upper host's widget element to the lower line and set the text to [A',A].
  - The listener `update({docChanged:true, view})` must: release that host as `reused-by-twin`; mount a fresh host with body A in the same element; and make its write land on the lower fence.
  - Negatives: element still on `lastWriteLine`; `docChanged: false`; entry outside `view.dom`; plain LP widget; two blocks per callout chosen by ordinal.
  - Mutants that must go red:
    - (1) `reusedBlockBody` without the LP section;
    - (2) the listener scoped to all paths, not to the editor;
    - (3) no `lastWriteLine` skip.

### Option B: MutationObserver on the editor's `contentDOM` (childList)
- **What it does:** it catches the moved widget DOM. It still needs Option A's LP-aware `reusedBlockBody`.
- **Costs:**
  - A per-editor observer lifecycle, set up from the processor (WeakMap keyed on `cm`) and torn down on editor destroy.
  - CodeMirror changes `contentDOM`'s children on every viewport change, so the observer fires often and needs filtering.
- **Watching the card root sees nothing:** the root never moves relative to its widget.
- **Conclusion:** no advantage over A's updateListener, which is the hook CodeMirror offers. Not recommended.

### Option C: write-time guard (defense in depth only)
- **Where:** in `resolveWriteTarget` (`ReadingModeBlockHost.ts:752-811`), for an LP callout host whose editor window holds a fence at its ordinal with a body other than `knownBody`. Do not relocate by body across the note: abort with a Notice, or remount and drop the click.
- **What it fixes:** the wrong-block write and the form-edit erase. About 15 lines.
- **What it leaves:**
  - The wrong value on screen (lower shows 6).
  - Clicks on the stale card turn into a "not saved" Notice.
  - A change to SC-343's durable relocation for LP callouts. It is also SC-480-adjacent: it decides between equal bodies by refusing.
- **Recommendation:** use it only together with A, if the owner wants a belt-and-braces guard. Not needed for the prototype's results.

### Option D: Obsidian private API (last resort)
- **What it does:** invalidate the old callout widget's `text` after a DSE write, so `R1(H, kt => kt.text === Ae)` (@2653395) cannot match it. Obsidian then builds a fresh `Gz` for the twin and runs the processor.
- **Why last resort:**
  - It needs CodeMirror's private `docView` tree, or Obsidian's unexported `widgetOwner` WeakMap. `dom.cmView` was not reachable in 1.15.0 (the probe's widget object tag is null for every widget).
  - Minified field names break silently on an Obsidian update.
  - It still needs detection for the form-Save path.

## 4. Overlap
- **SC-522** (`src/framework/host/livePreviewScrollHold.ts`): Option A does **not** touch it.
  - The only shared file is `registerFrameworkElements.ts`. SC-522's `lpHold` wiring is at `:63-68`; A adds one `registerEditorExtension` line after `:72`, a trivial textual merge.
  - Scroll was measured unchanged with the prototype.
  - Note for SC-522: its hold only covers `cm-lang-*` widgets, not callouts. That has nothing to do with this fix.
- **SC-520** (chrome-in-callout CSS + a chrome click handler): Option A does **not** need it.
  - §2.5's click-opens-source defect lives next to it (`pipeline.ts:195-214`, the click shield).
  - If SC-520 or a follow-up stops the click bubbling, G-S57 still holds, because it asserts after parking the cursor. The bug reproduces with bubbling stopped.

## 5. Notes
- Plain blockquotes: not checked again. SC-481 r4 measured that a fence in a plain quote is not drawn as a DSE card in LP.
- The working tree was not modified, apart from the ignored `main.js`/`styles.css` build output and `node_modules` (`npm ci`).
  - Every probe ran from a scratch harness copy (port 9537); its temp vault was deleted by the harness.
  - Plugin and superproject `git status --porcelain` were empty before and after.

## Artifacts
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r1-diag-report.md`
- **Screenshots:**
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r1-lp-callout-twins-base-lower-click-wrote-upper-disk-7-5.png` (base, after upper then lower click: upper card 7, lower source still `current_value: 5`)
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r1-lp-callout-twins-prototype-lower-click-wrote-lower-disk-6-6.png` (prototype, same steps: upper 6, lower source `current_value: 6`)
- **Scratch folder:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r1-diag-w537a/`
  - Probe scripts:
    - `p537-instr.js` (page instrumentation + prototype)
    - `p537-scenario.mjs` (P537 scenario)
    - `mkharness.py` (builds `harness-p537.mjs`)
    - `run.sh`, `ci-build.sh`, `show.py`
  - Base runs:
    - `run02/` (all cases)
    - `run03/` (form Save)
    - `run07-p0/` (tall-note scroll)
    - `run08-p0/` (form focus)
  - Prototype runs: `run05/`, `run07-p1/`, `run08-p1/`.
  - Each run holds `p537.json`, `summary.txt`, `lifecycle.log` and `shots/`.
