# SC-544 r1 diagnosis: quick clicks on identical blocks write the wrong twin (dse dabfb518, Obsidian 1.15.0)

## Executive summary
1. **Reproduced: yes, every time, in real Obsidian.** `fast3-01-120` gave [6,5,6] (5/5 runs) and `fast3-012` gave [6,5,7] (at about 280 ms between clicks). It fails whenever the second click comes before the first write, i.e. when the clicks are 94 to 368 ms apart. It also fails with 4 callouts (all three click pairs), with two counters per callout, and for "+ middle, then a form Save on the upper" ([5,5,6]). **Data loss: no authored text was lost in any case.** The loss is the click itself: the +1 lands on a twin.
2. **Mechanism.** Obsidian gives the clicked block's old element (the view with its edit still pending) to the next identical twin. That happens in the write's rebuild, because the rebuild matches blocks by equal text (app.js @2653395). The 400 ms flush then places the write through that element's position *at flush time*: `ElementView.flushPersist` (`view.ts:341`), `replaceSource` (`ReadingModeBlockHost.ts:683`), `readSection` (`:490`/`:496`), `calloutWindow` with `posAtDOM` (`:290`), `locateInSection` (`:811`), which finds the lower fence. That fence has the same body, so SC-537's check (`:643`) cannot see the move.
3. **SC-540.** Not needed. With a probe bundle where a click does not select the callout (0 selection changes), the result is the same [6,5,6] (also `fast3-01-0`, `fast3-012-250`, `fast4-12`, form). The review's "raw from its own click" note is not the cause: the rebuild hands the element over before Obsidian checks the selection.
4. **Cross-surface: yes, the same bug.** In Live Preview, plain fences gave [6,5,6]. In Reading view, callouts and plain fences both gave [6,5,6]. Two panes (LP+LP, LP+Reading view) also fail. So it is not limited to LP callouts; it is SC-481's surfaces too.
5. **Recommended fix (C1).** Just before a block host writes a note, write every other view of that note whose edit is still in its debounce. Each edit is then placed while its element still sits on its own block: about 20 lines in `ReadingModeBlockHost.replaceSource` and `ViewRegistry`.
   - The prototype (in-page, and a bundle built from source) **fixed the writes and the display in every reproduced case on all surfaces**: frames showing a wrong card went from 7-9 to 0.
   - **0 false positives** in 20 cases that are clean today. The four two-pane cases and `undo3`, which misroute today, are fixed too.
   - Existing lifecycle scenarios still pass: G-S40, G-S45, G-S53, G-S57, G-S44, G-S42, G-S50, G-S54, G-S52 and G-S56 (10/10).
   - Not covered (same as base): a non-DSE edit inside the 400 ms window, i.e. typing in another twin or an external edit. LP-only option B covers the LP part (see §3).
6. **Overlap.** SC-472 (`previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`): **no**. Click shield (`pipeline.ts`): **no**. Gate: a new lifecycle scenario **G-S61** in part 3, before G-S56, plus jest. The worktree is clean and nothing was committed.

## 1. Measurements (real Obsidian 1.15.0, lifecycle harness copy, port 9544, dse dabfb518 bundle sha256 aa4efdf6…)

### Setup
- **Fixtures:** `Lifecycle/twin-callouts-3.md` (3 callouts `> [!note] Camp`, counter `Twin` 5) and `twin-callouts.md` (2).
- **Probe fixtures:** `Probe544/tc4.md` (4 callouts) and `Probe544/xy3.md` (3 callouts × [Twin 5, Other 3]).
- **Plain-fence fixture:** `Lifecycle/twin-triplets.md` (3 plain fences).

### Clicks
- **First click:** `t.realClick` on `+`, with a scroll into view.
- **Later clicks:** a "quick" real click: one eval for the point, then press and release, with no scroll and no sleep. The gap reported is measured between the page click events. The first write always lands 401-409 ms after click 1.

### Reading the cards
- I read them after parking the cursor; any block with no card was scrolled into view and read again.
- I never counted `.cm-embed-block`. A card belongs to the k-th counter fence at or after its widget's line (`posAtDOM`).

### Display recorder
Every frame from the first click until the note settles, it counts any card that either:
- has an edit pending and sits on a block other than the one it was clicked on, or
- has nothing pending and shows a value other than its block's.

Runs: `runs/b01`-`b04` (base), `s01` (SC-540 probe bundle). Every probe log and trace is listed under Artifacts.

### Window (3 callouts, + upper then + middle)
| Wanted gap | Measured gap | Disk after both clicks | Then + lower | Verdict |
|---|---|---|---|---|
| 0 | (2nd click missed `+`) | [6,5,5] | [6,5,6] | harness artifact: the upper callout turned into source (SC-540), the middle moved before the click. With the SC-540 probe bundle, gap 0 gives [6,5,6] (`s01`) |
| 50 | 94 ms | **[6,5,6]** | [6,5,7] | misroute |
| 120 | 159 ms | **[6,5,6]** (5/5 runs: b01, b02, b03, b04, shot-base) | [6,5,7] | misroute |
| 200 | 220 ms | **[6,5,6]** | [6,5,7] | misroute |
| 250 | 282 ms | **[6,5,6]** | [6,5,7] | misroute |
| 300 | 333 ms | **[6,5,6]** | [6,5,7] | misroute |
| 350 | 368 ms | **[6,5,6]** | [6,5,7] | misroute |
| 450 | 469 ms | [6,6,5] | [6,6,6] | clean (the upper write landed before the 2nd click) |
| 700 | 718 ms | [6,6,5] | [6,6,6] | clean |

**Rule (measured):** it misroutes when the second click comes before the first write (gap < ~400 ms), and the pending view's element is handed to an identical twin below it that is drawn when the flush runs.

### Other cases (base)
| Case | Disk | Verdict |
|---|---|---|
| 3 clicks 0,1,2 at 281/278 ms (`fast3-012-250`) | **[6,5,7]** | the middle's click and the lower's click both land in the lower. The lower card showed the middle's view (R133) when it was clicked |
| 3 clicks at 150/150 ms (`fast3-012-120`), and at 37/89 ms | [6,6,6] | clean. The lower callout was source (cursor inside) when the write landed, so the middle's element went to an undrawn slot. Its flush then took the durable path (`locateByBody` nearest the click-time line, `:859`) |
| 2 callouts 0+1 at 146 / 326 ms | [6,6] | clean (the pending view's element is the one discarded, and its unload flush takes the durable path) |
| 3 callouts 1+2, 0+2, 1+0, 2+1, 2+0 (120) | [5,6,6] [6,5,6] [6,6,5] [5,6,6] [6,5,6] | all clean (the pending view's element is discarded, or is not handed below) |
| **4 callouts** 0+1 / 0+2 / 1+2 / 0+1+2 | **[6,5,6,5] / [6,5,5,6] / [5,6,5,6] / [6,6,5,6]** | all misroute |
| **2 counters per callout** (`xy3`): X0+X1 / X0+Y1 / Y0+Y1 | **[6,3,5,3,6,3] / [6,3,5,3,5,4] / [5,4,5,3,5,4]** | all misroute (X and Y alike) |
| form Save on the **upper**, 120 ms after + on the middle (script click while the form is open) | **[5,5,6]**, names [Edited,Twin,Twin] | misroute; the edit survives |
| form Save on the middle 120 ms after + upper; on the lower after + upper; on the lower after + middle | [6,5,5]/[6,5,5]/[5,6,5], names right | clean |
| **LP plain fences** 0+1 (`plain3-01-120`) | **[6,5,6]** | misroute (SC-481 surface) |
| LP plain fences 0,1,2 | [6,6,6] | clean |
| **Reading view callouts** 0+1 (`rv3-01-120`) | **[6,5,6]** | misroute |
| Reading view callouts 0,1,2 | [6,6,6] | clean |
| **Reading view plain fences** 0+1 | **[6,5,6]** | misroute |
| two panes LP+LP (+A0, +B1) / same pane / LP+Reading view (+A0 LP, +B1 RV) / Reading view+LP | **[6,5,6]** in all four | misroute |
| typing "Z" in the upper callout's title 120 ms after + middle | **[5,5,6]** | misroute (not a DSE write) |
| external edit of the upper (vault.modify 5→7) 120 ms after + middle: LP callouts / LP plain / Reading view callouts / Reading view plain | **[7,5,6]** in all four | misroute (not a DSE write) |
| typing a new line above (`TOP\nNEW`) 120 ms after + middle | [5,6,5] | clean. Obsidian's own Notice "modified externally, merging changes automatically" appears, the same on every bundle |
| `seq3-012`, `seq3-210`, `seq2-01` (slow), `type-value-back3` | right | clean |

### Display half (dabfb518)
- **The transient (base recorder `runs/b04`):**
  - From the upper write's rebuild to the middle's flush, the LOWER card shows the middle's pending 6 while the lower block holds 5.
  - Measured: 9 frames in `fast3-01-120`, 8 in `fast3-012-250`, 8 in `fast4-12`, 8 in LP plain, 7 in `undo3`, about 130-150 ms in each.
  - A click in that window goes to the middle's view (`fast3-012-250`: [6,5,7]).
- **After the cursor is parked, cards = disk in every base case.**
  - The bad middle slot (the upper's old element) is redrawn by SC-537's pass, which now also runs on selection updates.
  - The r3 review's "middle card shows R20=6 until the next edit" was measured on 4e3de39c, which checked docChanged only. On the fixed guard it was already gone: `sc537-r3-probes.log:124`, bundle-fixvp, shows no display problem.
- **What the user sees on base:** after + upper and + middle the cards read 6 / 5 / 6. The middle click shows up on the lower card. See `sc544-r1-base-fast3-01-120-clicked-upper-middle-cards-6-5-6-disk-6-5-6.png`.

## 2. Mechanism

### 2.1 Probe trace (`sc544-r1-base-fast3-01-120-trace.log`, base `b02`, widget DOMs tagged W*, views R*)
**Before any click:** `W12@line4{R20}`, `W13@line14{R21}`, `W14@line24{R22}`.

1. **t44361, + upper (R20).** Selection goes to line 4 (SC-540: the upper is shown as source).
2. **t44520, + middle (R21).** Selection goes to line 14 (the middle is shown as source). R21's `persist()` → `notePersistIntent` (`view.ts:269`) → `readSection` → `knownLineStart = 15` (the middle fence).
3. **t44763, the upper write lands:** [5,5,5]→[6,5,5].
4. **t44772, the 'set' transaction.** It is a MINIMAL change (`[55,117,55,117,62]`: only the upper's body), so `changes.mapPos` is valid. The rebuild leaves:
   - `W15@4` (fresh upper);
   - **`W13@24 (mapped 14) {R21=6}`**: the MIDDLE's element, with R21 and its pending +1, now in the LOWER slot;
   - W14 discarded → R22 `render-child-unload` (nothing pending);
   - W12 (the upper's old element, holding R20) handed to the middle, which is source and so not drawn.
5. **t44921, R21's flush.** `flush R21 Twin=5->Twin=6 at W13@L24, knownLine 15`: the click-time line is still known when the flush starts.
   - `canPersist` → `readSection` (`ReadingModeBlockHost.ts:490`): `getSectionInfo` is null for a callout, so `livePreviewCalloutSection` (`:496`/`:536`) → `calloutWindow(cm, widget)` (`:289-290`): `posAtDOM(W13)` = line 24. The section is the LOWER callout.
   - `findOwnFence` (`:500`/`:517`): `locateInSection(…, knownBody = Twin 5)` matches the lower fence (same body). This overwrites `knownLineStart` to 25.
   - `section = readSection()` (`:699`) → `resolveWriteTarget` (`:811`) → lower fence 25 → **[6,5,5]→[6,5,6]**, `lastWrite=25`.
6. **t49096, park.** W12 is attached at the middle (mapped 4→14) holding R20 (known Twin 6). SC-537's pass (`livePreviewReconcile.ts:28` → `remountReused.ts:115` → `reusedBlockBody` `:625`) sees body 5 ≠ 6 and redraws it as R25=5. Cards 6/5/6 = disk.

### 2.2 Why SC-537's check cannot see it
- `reusedBlockBody` (`ReadingModeBlockHost.ts:643`) redraws only when the block under the element has a body other than `knownBody`.
- A view whose edit is still in its debounce still knows the twins' common body, so the moved element looks like it is in place.
- A "moved" test needs position (`mapPos`, measured valid above) or must stop the move from mattering (C1).

### 2.3 Plain fences and Reading view
- **Same move, different section source.**
  - Live Preview plain widgets: `getSectionInfo` answers from the widget's `lineStart`, which is updated on reuse (SC-537 r1 @2640662).
  - Reading view: Obsidian reuses the section element for the next equal section (SC-481 r1).
- **Either way, the moved element's section is the lower block at flush time.** In Reading view, `knownLine` was already 25 when the flush began: section reads between the click and the flush refreshed it.
- Measured on both: [6,5,6].

### 2.4 Why some orders are clean
- **When it misroutes:** the pending view's element must be handed to a twin that is drawn when the flush runs.
- **The element is discarded instead** (2 callouts; pending on the last twin; writer below the pending view) → the view is unloaded and its flush runs at once (`view.ts:110`). With the widget detached, `readSection` returns null, and the durable `locateByBody(knownBody, knownLineStart)` (`:859`) finds the block nearest the click-time line, which is correct.
- **The element goes to a slot shown as source** (`fast3-012-120`: the third click put the cursor in the lower) → it is not in the DOM, and the same durable path applies.

### 2.5 SC-540 interaction (probe bundle `bundle-sc540probe`)
- **The probe:** `pipeline.ts` with one extra bubble-phase `click` listener on the DSE root that calls `stopPropagation()` inside `.cm-embed-block.cm-callout`. PROBE ONLY, not a fix. Source: `src-sc540probe/src/framework/pipeline.ts`.
- **Result:** no selection change from any click (the update log has no `sel` entry between the clicks), and the callouts stay drawn.

| Case | Probe bundle disk |
|---|---|
| `fast3-01-0` | [6,5,6] |
| `fast3-01-120` | [6,5,6] |
| `fast3-01-250` | [6,5,6] |
| `fast3-012-250` | [6,5,7] |
| `fast4-12-120` | [5,6,5,6] |
| form (+mid, Save upper) | [5,5,6] |
| `fast3-012-120` | clean |
| `fast3-12-120` | clean |
| `fast2-01-0` | clean |
| `fast2-01-120` | clean |

- **The middle draws the upper's old element at once:** `W7@14`, redrawn by SC-537 to R15=5. The lower still gets `W8{R12=6}` and R12 flushes into the lower.
- **Answer: SC-544 is reachable without SC-540's symptom, and fixing SC-540 does not fix it.**
- **What the selection does change:**
  - in base, gap-0 clicks miss `+`, because the source view shifts the layout;
  - a slot shown as source keeps the handed element out of the DOM, which sends the flush to the durable path (that is why `fast3-012-120` is clean).

## 3. Fix options

### C1 (recommended): write other pending views of the note before a host writes it
**Where** (patch: `sc544-r1-protoC1.patch`, 61 lines with context):
- `src/framework/host/ReadingModeBlockHost.ts` `replaceSource` (`:683`): after the note/file guard (`:687-694`) and before `const section = this.readSection()` (`:699`), add `this.registry?.flushPendingWrites(this.ctx.sourcePath, this.entry);`.
  - It is synchronous. Every sibling's own `replaceSource` reads its section (`posAtDOM` / `getSectionInfo`) BEFORE any `Vault.process` of this round runs.
  - It covers the view's own debounced flush and the block edit form's Save (the form write goes through the same method).
- `src/framework/host/viewRegistry.ts`: add `flushPendingWrites(sourcePath, except)` after `pendingWrites` (`:91-93`). It loops over the live entries of the same note (not `except`, not released) and calls `view.flushPendingWrite?.()`.
- `src/framework/view.ts`: add a public `flushPendingWrite(): void { this.flushPersist(); }` after `hasPendingWrite` (`:291-293`). It is a no-op when nothing is scheduled, and it needs no `async` (unlike `settlePendingWrite`).
- **Why it works:**
  - The edits land in sequence: `[5,5,5]→[5,6,5]→[6,6,5]`, 1 ms apart. `Vault.process` chains them.
  - By the time the rebuild hands elements to twins, no view of the note has an edit pending.
  - A view whose element is then moved already knows its new body, so the existing SC-481 check (processor-time, Reading view and LP plain) or SC-537's check (editor-driven, LP callouts) redraws it from the twin's block. That fixes the display with no new detection code.
- **Cost:**
  - Per write: one loop over the live registry entries. Nothing per keystroke, scroll or update.
  - The writes are the same writes, only sooner.
- **Prototype results.**

  In-page runs, base bundle + `proto-c1.js`:

  | Run | What | Result |
  |---|---|---|
  | p1 | 18 reproduced cases: gaps 50-350, `fast3-012-250`, 4 callouts ×4, `xy3` ×3, LP plain, Reading view callouts, Reading view plain, form +mid/Save-upper (plus the gap-0 artifact case) | 18/18 clean; recorder 0 bad frames in every case (base: 7-9) |
  | p2 | clean-today controls: 450/700 ms, 2 callouts at 120/300, `fast3-12/02/10/21/20`, `fast3-012-120`, plain and Reading view 0,1,2, three form orderings | 15/15 clean |
  | p3 | `seq3-012`, `seq2-01`, `seq3-210`, panes LP+LP / same pane / LP+Reading view / Reading view+LP, `undo3`, `type-value-back3`, `type-top` | all clean (base: the four panes cases and `undo3` misrouted) |
  | p2 (gap 0) | gap-0 cases | harness artifacts as on base (2nd click misses `+` because SC-540 shifts the layout) |
  | sc1 | gap-0 cases on SC-540 probe bundle + C1 | `fast3-01-0`, `fast3-012-0`, `fast2-01-0` clean |

  Built from source (`src-c1` → `bundle-c1`, sha256 d6278dd2…):
  - tsc clean.
  - Focused jest (twin-reuse, view-registry, reading-mode-host, -durable, element-view, view-adoption): 219/219.
  - Probe battery `c1b1`: 17 cases (11 reproduced + 6 controls) all clean, 0 bad frames.
  - Lifecycle on `bundle-c1`, worktree harness unmodified:
    - G-S53, G-S57, G-S40, G-S45: 4/4 ok, 215 s;
    - G-S44, G-S42, G-S50, G-S54, G-S52, G-S56: 6/6 ok, 192 s.
- **Not covered** (pre-existing, measured the same with C1):
  - (1) A non-DSE edit to another twin inside the debounce. Typing in the upper callout gave [5,5,6]. External edits gave [7,5,6] on every surface.
  - (2) A click that lands between a write's `Vault.process` and its rebuild, a window of about 9-12 ms (write t44763 → 'set' t44772).
- **Risks, checked:**
  - **Twin cross-talk:** none. Each flush is the view's own normal write path, with its normal `knownBody` and section checks.
  - **SC-481 (Reading view, LP plain) and SC-537 (LP callouts, G-S57):** G-S53 and G-S57 pass. Reading view and LP plain reproduced cases are fixed.
  - **SC-480:** no new decision among equal bodies. No body search and no refused write are added; the flush only changes WHEN the section is read.
  - **SC-518 focus:** G-S50 passes.
  - **SC-340 adoption:** two tickets from two quick writes, each claimed by its own rebuild. Reading view cases and LP+Reading view panes are clean, and G-S53 passes.
  - **SC-343:** relocation is unchanged.
  - **Scroll:** no layout change. G-S52 and G-S42 pass.
  - **Typing while a write is pending:** `type-top` and `type-value-back3` are clean. Obsidian's "merging" Notice appears exactly as on base.
  - **Two panes:** clean.
  - **Undo:** `undo3` is clean.
  - **SC-519:** `openAfterPendingWrite` is untouched. G-S45 passes.
  - **Behaviour change to note:**
    - a pending edit in another block of the same note is written up to 400 ms earlier when a sibling writes;
    - a second click on that sibling within its old window becomes a second write (harmless).
- **Optional, same idea:** `SidebarBlockHost.replaceSource` (`:302`) writes the note too and has no registry. A + in the sidebar while a note card of the same note is pending can hand elements over the same way. This was not measured. Wire the same call there if the owner wants every writer covered.

### B (Live Preview only): pin the clicked position and map it until the flush
- **What it does.** At the first `notePersistIntent` of a pending edit, pin `doc.line(knownLineStart+1).from` in the host's editor. The SC-537 update listener (`livePreviewReconcile.ts:22`) maps every pin through `update.changes.mapPos(pos, 1)` on doc-changing updates. In `replaceSource`, `readSection` returns the window at the pinned line (the callout window, or the fence for plain widgets).
- **Prototype** `proto-b.js`, run `pb1`:
  - writes are fixed for `fast3-01-120`, `fast4-12`, LP plain, panes, `undo3`;
  - **also for LP typing ([5,6,5]) and LP external edits** (callout and plain [7,6,5]);
  - controls are clean;
  - **the display is not fixed:** 8 bad frames remain, and `fast3-012-250` gave **[6,7,5]**, because the third click hits the middle's moved view in the lower slot;
  - Reading view is not covered (no editor).
- **Cost:** about 40-60 lines, including a pin per pending LP host and a loop over the pinned hosts per doc-changing update.
- **Risks:** the editor's numbering vs the disk inside `Vault.process`. That risk already exists for LP callouts; with unsaved typing it was measured clean. Pins are per editor (two panes measured clean).
- **C1 + B together** (`proto-c1b.js`, run `pc1b`):
  - every LP case is clean, including typing and external edits;
  - the only case left is the Reading view external edit, [7,5,6].
- **Verdict:** worth it only if the owner wants the non-DSE-edit variant closed in LP now.

### A (the review's idea, LP only): remember each LP widget position, treat a moved widget as reused, release it and redraw it
- **Where:** `livePreviewReconcile.ts` / `remountReused.ts`.
- **What the probe shows:** the `mapPos` detector works on the 'set' transaction. My passive detector flagged `W13@24 (mapped 14) !MV` in the same update.
- **But the release itself flushes the pending edit** (`remountReused.ts:119` → unload → `flushPersist`). At that point the widget sits at the lower slot, so the flush still writes the lower block. A therefore needs B's pin as well.
- **Cost and coverage:**
  - per update it needs a remembered position for every LP widget;
  - it does nothing for Reading view or for LP plain widgets judged at processor time.
- **Status:** not prototyped. It is dominated by C1, and by C1+B if instant LP display is also wanted for non-DSE edits.

### Recommendation
- Adopt **C1** for SC-544. It fixes the ticket's steps and the same bug on SC-481's surfaces with one write-path change.
- File the **non-DSE edit inside the debounce** variant as a Backlog follow-up (typing in another twin, external or sync edits; all surfaces; measured [5,5,6] and [7,5,6]). It needs B in LP plus a text-diff line mapping in Reading view.
- **CHANGELOG:** name the Reading view and plain fences too, not only LP callouts.

## 4. Gate proposal

### Lifecycle G-S61 (new), part 3 before G-S56
- **Why not phases in G-S57:**
  - the fix and the bug span Reading view, LP plain and LP callouts, while G-S57 is SC-537's LP-callout scenario;
  - the quick-click timing helper and the per-frame display recorder are self-contained;
  - G-S57's anti-vacuity (a widget handed to a twin) does not hold on the fix, because the moved element is not pending.
- **Time:** about 12 s per phase, so about 130 s for 10 phases; part 3 grows from about 360 to about 490 s. If part 3 goes past about 540 s, the dispatcher can move G-S53/G-S54 to part 1.
- **Helpers:**
  - First click: `t.realClick` on `+`.
  - Second click: a quick real click (one eval for the point, then press and release; no scroll, no sleep), 120 ms later.
  - Wait until the disk settles plus 1.5 s, park the cursor, read the cards with scroll-into-view per missing block.
- **Anti-vacuity, per phase:** the page log shows click 2 BEFORE the first write (click2.t < write1.t), so the second edit was inside the debounce when the first write landed.
- **Phases.** "Must FAIL on dabfb518" is the measured base result.

| Phase | Steps | Want | Must FAIL on dabfb518 with |
|---|---|---|---|
| (a) | LP 3 callouts: + upper, + middle | [6,6,5]; cards = disk; recorder 0 frames with a pending card on another block | [6,5,6]; 7-9 frames |
| (b) | LP 3 callouts: + upper, middle, lower at about 280 ms | [6,6,6] | [6,5,7] |
| (c) | LP 4 callouts: + block 1, + block 2 | [5,6,6,5] | [5,6,5,6] |
| (d) | LP `xy3`: X upper, Y middle | [6,3,5,4,5,3] | [6,3,5,3,5,4] |
| (e) | LP 3 callouts: upper's form open, script + middle, Save 120 ms later | [5,6,5], names [Edited,Twin,Twin] | [5,5,6] |
| (f) | LP plain triplets: + 0, + 1 | [6,6,5] | [6,5,6] |
| (g) | Reading view 3 callouts | [6,6,5] | [6,5,6] |
| (h) | Reading view plain triplets | [6,6,5] | [6,5,6] |
| (i) | two panes, + upper in LP, + middle in the Reading view pane | [6,6,5] | [6,5,6] |
| (j) | controls that must stay clean: + middle, + lower (120 ms); + upper, + middle 700 ms apart; 2 callouts at 120 ms; slow `seq3-012` | [5,6,6]; [6,6,5]; [6,6]; [6,6,6] | n/a (clean today) |

- **Every phase:** the note outside the quotes and fences is unchanged, with 0 Notices and 0 page errors. Restore `authoringControls` and reset every fixture in a `finally`. Hide the notice container the way G-S57 does.
- **Fixtures:** add `Lifecycle/twin-callouts-4.md` and `Lifecycle/twin-callouts-xy3.md`. Reuse `twin-callouts-3.md` and `twin-triplets.md`.
- **Mutants for G-S61:**
  - M1 (no flush call = base) fails (a)-(i);
  - M2 (flush after `await Vault.process`) fails (a);
  - M3 (`flushPendingWrites` skips form writes, i.e. only `fromView`) fails (e).

### Jest (`test/dom/framework/twin-reuse.test.ts` infra, fake timers + Obsidian reuse simulation; `view-registry.test.ts`)
1. **Reading view plain triplets.** + upper; advance 120 ms; + middle; advance 400 ms with the reuse simulated on the upper's write. Disk [6,6,5]; each card shows its own block; a click on the lower card writes the lower block. Red on dabfb518 ([6,5,6]).
2. **LP callouts (SC-537 fake `cm` infra).** The same with the middle's widget element moved to the lower line in the update. Disk [6,6,5]. Red on dabfb518.
3. **Form Save (non-`fromView` `replaceSource`) on the upper while the middle is pending:** the middle's write lands first and in the middle.
4. **`flushPendingWrites` filters (`view-registry.test.ts`):**
   - another note's pending view is not written;
   - the `except` entry is not flushed again;
   - released entries are skipped;
   - a view with nothing scheduled makes no write.
5. **Ordering:** the sibling's section is read (its `getSectionInfo`/`posAtDOM` spy called) before the writer's `vault.process` callback runs.

- **Mutants that must turn jest red:**
  - (1) remove the call in `replaceSource` → 1, 2, 3;
  - (2) drop the `sourcePath` filter → 4;
  - (3) move the call after `await this.plugin.app.vault.process(…)` → 5 and 1.

## 5. Overlap
- **SC-472: no.** C1 touches only `ReadingModeBlockHost.ts` (`replaceSource`), `viewRegistry.ts` and `view.ts`. Not `previewScrollPin.ts`, not `livePreviewScrollHold.ts`, not `redrawBackstop.ts`.
  - One interaction to name: `replaceSource` still calls `scrollPin.pin()` (`:765`) once per write. Two quick writes now pin twice about 1 ms apart, which today's two-callout case already does about 30 ms apart.
  - G-S42 and G-S52 pass on `bundle-c1`.
- **Click shield (`pipeline.ts`, SC-540): no.** The SC-540 probe edit lives only in the scratch copy `src-sc540probe`.
- **Option B would touch `livePreviewReconcile.ts`** (SC-537's file, not SC-472's).

## 6. Tree
- Plugin and superproject `git status --porcelain` were empty before and after, and nothing was committed.
- `npm ci` (node_modules) and `main.js`/`styles.css` builds are ignored output.
- Every source edit was made in scratch `git archive` copies (`src-sc540probe`, `src-c1`, `src-pristine`).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/sc544-r1-diag-report.md`
- Screenshots (ledger dir):
  - `sc544-r1-base-fast3-01-120-clicked-upper-middle-cards-6-5-6-disk-6-5-6.png` (base: cards 6/5/6 after + upper, + middle)
  - `sc544-r1-protoC1-fast3-01-120-clicked-upper-middle-cards-6-6-5-disk-6-6-5.png` (C1 prototype)
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r1-diag-a89d389c7218bb144/`
  - Probe tooling:
    - `p544-instr.js`: page instrumentation, the update log with a passive `mapPos` detector, and the frame recorder;
    - `p544-scenario.mjs`: the P544 scenario;
    - `mkharness.py` (builds `harness-p544.mjs`);
    - `probe.sh`, `probe-shot.sh`, `lc.sh`, `build.sh`, `mksrc.sh`, `c1-check.sh`, `ci.sh`, `show.py`.
  - Prototypes:
    - `proto-c1.js`, `proto-b.js`, `proto-c1b.js` (in-page);
    - `sc544-r1-protoC1.patch`, `src-c1/` (source), `bundle-c1/`;
    - `bundle-sc540probe/` and `src-sc540probe/` (SC-540 probe);
    - `bundle-base/` (dabfb518).
  - Logs:
    - `sc544-r1-probe-verdicts.log` (every run's verdict lines);
    - `sc544-r1-probe-details.log` (per-step clicks, flushes, writes, releases, recorder);
    - `sc544-r1-base-fast3-01-120-trace.log`, `sc544-r1-sc540probe-fast3-01-120-trace.log` (update log traces);
    - `logs/lc-c1-gs53-gs57-gs40-gs45.log`, `logs/lc-c1-part3-rest.log` (lifecycle on `bundle-c1`), `logs/c1-check.log`, `logs/c1-jest.log`.
  - Runs: `runs/{b01,b02,b03,b04,s01,p1,p2,p3,pb1,pc1b,sc1,c1b1,shot-base,shot-c1}/` (each holds `p544.json`, `lifecycle.log`, `shots/`).
