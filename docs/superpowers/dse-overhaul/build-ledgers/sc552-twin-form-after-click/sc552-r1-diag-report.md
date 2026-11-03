# SC-552 r1: reproduce, diagnose, design (dse 711f740d, Obsidian 1.15.0, no commits)

## Executive summary
1. **Reproduced on every surface.** LP callouts, LP plain fences, Reading-view callouts and Reading-view plain fences each misroute 9 of 9 times when the pencil is pressed 59-313 ms after the +. The Save lands in the block below: disk [6,5,5], names [Twin,Twin,Edited]. Two panes misroute 9/9 (LP+LP, RV+RV, LP+RV). With 4 twins the edit goes one block down every time (18/18).
2. **The window is "pencil before the + write lands."** That write lands 402-409 ms after the click. Every misroute had the pencil first (36/36), and every clean run had the write first (36/36: 459-497, 709-716 and 1810-1816 ms; the 1800 ms control was 12/12 clean).
3. **Where the clicked view sits after the settle (measured on every run):** with 3+ twins it is on the block BELOW. With 2 twins, or with the form on the last twin, its element is thrown away and the view unloads. The form closes by itself and nothing is saved: 24/24 (20 after a click, 4 after an outside edit). This is a new variant: it happens in LP and Reading view, and SC-523's trigger is different.
4. **Option A (the ticket's idea) is measured wrong.** In an in-page prototype the form opened on the view one block down and saved there (12/12). With 2 twins it never opened (4/4).
5. **Recommend B+K.** B pins the block when the form opens (note text + fence line) and at Save maps that line through a line diff to the disk text and writes there; K keeps a pinned form open when the rebuild throws away its view's element. Measured: B clean on 25/25 cases wrong today + 14/14 controls; B+K clean on 20/20 self-close cases; the residual (outside edit, in-app or on disk, while the form is open) 20/20 wrong on base, 10/10 clean on the prototypes; lifecycle 48/48 and jest +7, no regressions.
6. **The r5 script-only case is NOT fixed** by any option ([6,6,5], form edit erased, same as base). SC-523's own LP self-close (the form's own click still pending) is unchanged.
7. **SC-549.** Narrow B+K does not fix it (measured). Wide B+K, which also pins each card's first click, fixes every SC-549 case measured: outside edits in-app and on disk, LP and Reading view, callouts and plain, 16/16 (base [7,5,6]), plus 8/8 controls. LP typing: 3/3 (base [5,5,6]). The wide part costs about 12 more lines.
8. **Size.** The narrow fix is about 120 lines, mostly a 75-line line-diff helper; K adds about 20; wide adds about 12. Files: new `host/lineMap.ts`, `ReadingModeBlockHost.ts`, `BlockHost.ts`, `FormModal.ts`. Nothing in `pipeline.ts`, SC-472's files or the click shield. New lifecycle gate G-S64: about 100-120 s, in part 3.
9. **dse origin/develop moved:** 711f740d → 367a2f1d (SC-551, 5 commits, incl. 41 lines of `visual-harness/obsidian-lifecycle.mjs` port handling). G-S64 must be written on 367a2f1d. Worktree clean, no commits.

## 1. Measurements (real Obsidian 1.15.0, worktree harness copy + injected scenario `PR552`, port 9652, base bundle sha256 1bb51153…)

### Method
- **Fixtures (harness map):**
  - `twin-callouts-3.md` (c3), `twin-callouts.md` (c2), `twin-callouts-4.md` (c4), `twin-triplets.md` (p3) and `twin-pair.md` (p2);
  - `Probe552/twin-plain-4.md` (p4, scratch).
  - Counters are `Twin` with value 5.
- **Steps:** `t.realClick` on + of block p, then sleep g ms. The pencil of block f is opened by keyboard (focus, then Enter; the SC-544 r3 rule, since the LP pencil cannot be clicked by mouse, SC-523). Then wait for the + write, plus 800 ms, then rename Twin→Edited in the raw box, Save, let the note settle and park the cursor.
- **Gap and write times:** the gap is measured from the page `click` event to the page `keydown`; the write time from the click to `modify`.
- **Reading the cards:** cards are read by block (G-S61's rule, posAtDOM in LP). LP blocks are scrolled into view first, and `.cm-embed-block` is never counted.
- **`where`:**
  - The registry entry of the card whose pencil was pressed (`formEntry`) is captured at the keypress.
  - "Where" = the block of the card list whose root IS that entry's root, plus `isConnected`, `released`, `_loaded` and `lastKnownLineStart`.
  - It is read with no host call, at three moments: at the pencil, after the settle, and at Save.
- **Logged around the form's own write:** each `replaceSource` call (value, name, whether it came from the view or the form) and the line where it landed (`lastWriteLineStart`).
- **Logs:** every verdict line is in `sc552-r1-probes.log`, grouped by run. Full per-case JSON (write sequence, timings, cards) is in the scratch `runs/<run>/pr552.json`.

### 1.1 The ticket's steps (+ upper, pencil middle, 3 twins), base 711f740d
| Surface | 50 ms | 150 ms | 300 ms | 450 ms | 700 ms | 1800 ms (control) |
|---|---|---|---|---|---|---|
| LP callouts | 3/3 misroute (62-63) | 3/3 + 1 smoke (160-163) | 3/3 (311-312) | 0/3 (460-466) | 0/3 (710-712) | 0/3 (1811-1816) |
| LP plain | 3/3 (60-61) | 3/3 (160-161) | 3/3 (310-311) | 0/3 (459-460) | 0/3 (710-716) | 0/3 |
| RV callouts | 3/3 (60-61) | 3/3 + 1 smoke | 3/3 (310-311) | 0/3 (460-462) | 0/3 (709-714) | 0/3 |
| RV plain | 3/3 (59-60) | 3/3 (159-160) | 3/3 (309-313) | 0/3 (460-480) | 0/3 (709-710) | 0/3 |

- **What a misroute looks like:** disk [6,5,5], names [Twin,Twin,Edited], and the write sequence `rs(view,v6) … save rs(FORM,v5,Edited) done(true,FORM L25)` (L22 for plain fences).
- **What a clean run looks like:** names [Twin,Edited,Twin], the form landing at L15 (L13 for plain).
- **The cards** equal the disk after the settle in every run; only the place of the edit is wrong.
- **Where the clicked view sits** in every misroute: `pencil:b1 → settled:b2 → save:b2`. In every clean run: `b1 → b1 → b1`.

### 1.2 Other orderings and shapes (base)
| Case | Result |
|---|---|
| Two panes, + in pane A upper, pencil in pane B middle: LP+LP, RV+RV, LP(A)+RV(B) | 9/9 misroute [Twin,Twin,Edited]; the form's view went from b1 to b2 in pane B |
| 4 callouts, + 0, form on 1 / form on 2 | 3/3 Edited at 2 / 3/3 Edited at 3 (LP and RV, 12/12); view b1→b2 / b2→b3 |
| 4 plain fences, + 0, form on 1 | 6/6 Edited at 2 |
| **2 twins (c2, p2), + upper, form on lower** | **12/12: the form closes by itself** 240-270 ms after the + (20-30 ms after the write lands), with no Save. The view is detached, released and unloaded. Names stay [Twin,Twin]; the user's form is gone |
| 3 twins, + upper, form on LOWER; + middle, form on lower | 8/8 the form closes by itself (LP and RV), the same way |
| + middle, form upper; + lower, form middle; no click | 12/12 clean (the writer is below the form, or there is no write) |
| SC-523 trigger: + middle, pencil middle (the form's OWN write pending) | LP 2/2: the form opens, then closes 40-50 ms later. RV 2/2 clean |
| **Residual: the form open on the middle, then an outside edit of the UPPER's value (in-app `vault.process`, or written on disk through the watcher), then Save. No click at all** | 20/20 wrong: 3 twins [7,5,5] with names [Twin,Twin,Edited] (c3 and p3, LP and RV, in-app and on disk); 2 twins: the form closes by itself |
| Outside edit of the form's OWN block (value 7) while it is open | [5,7,5], names [Twin,Twin,Edited]: the edit goes into the twin below (LP and RV) |
| Outside edit deletes the UPPER block while the form is open on the middle | [5,5] with names [Twin,Edited]: wrong, it should be [Edited,Twin] (LP and RV) |
| Outside edit deletes the form's OWN block | [5,5] with names [Twin,Edited]: written into the remaining lower twin (LP and RV) |
| SC-549, + middle, then 120 ms later an outside edit of the upper (in-app or on disk) | 16/16 [7,5,6]. Controls: 2 twins, or a writer below the edit: 4/4 clean |
| SC-549 typing, + middle, then 120 ms later 'Z' typed into the upper callout's title (LP editor) | 3/3 [5,5,6]; Obsidian's own "merging changes" Notice appears every time (also on the fixes) |
| r5 script-only case: the middle's form open and renamed, script + on the middle then on the upper, Save | [6,6,5], names all Twin: the form's edit is erased by the middle card's own later write (LP callouts, RV callouts, LP plain) |

### 1.3 SC-523 interaction (recorded, not ours)
- In the ticket's steps (3 or 4 twins) the LP form never closed by itself: 0 of 30 LP runs.
- SC-523's own case (the form's own click still pending, LP) reproduces 2/2 on base. Every prototype leaves it as it is (LP closes: 2/2 on B+K, 1/1 on the wide fix; RV is clean).
- The new self-close in §1.2 (2 twins, or the last twin) is a different trigger: a SIBLING's write throws away the form's view element. It happens in LP and Reading view alike.

## 2. Mechanism (file:line on 711f740d)
1. **The pencil opens at once.** `pipeline.ts:561-563`: `openForm` → `view.openAfterPendingWrite(() => openFormEditor(view, cx, def, currentBody(), …))`. The clicked view has nothing pending, so `view.ts:327-331` opens it at once. The hero's "Edit definition" takes the same path: `elements/hero/view.ts:260`.
2. **The form is bound to that view and its host.** `FormModal.ts:508-516`: `openManagedModal(owner=view, …)` registers `modal.close()` on the view's unload (`kit/managedModal.ts:170-174`). The form keeps `cx` and so `cx.host`, the clicked view's `ReadingModeBlockHost`.
3. **The upper's debounced write lands about 400 ms after the click** (`view.ts:281` → `flushPersist` → `replaceSource` fromView). Obsidian's rebuild then matches blocks by equal text (SC-544 r1 §2.1). It hands the middle's element (the form's view) to the lower slot, and it throws away the lower's element, which releases its view (`ReadingModeBlockHost.ts:438-447` → `viewRegistry.ts:237-245`).
   - **Measured:** the form's view goes from b1 to b2 in every 3+ twin run.
   - With 2 twins (or the form on the last twin) the thrown-away element is the form's own. Its view unloads, and the managed-modal hook closes the form (`managedModal.ts:172`): form-close 20-30 ms after the write.
4. **Save writes through the moved element.**
   - `FormModal.ts:494`: `this.cx.host.replaceSource(body)` (no `fromView`).
   - `ReadingModeBlockHost.ts:702`: `flushPendingWrites` has nothing to flush.
   - `:707` `readSection()` asks for the section of the host's element NOW:
     - LP callouts: `livePreviewCalloutSection` → `calloutWindow` → `posAtDOM(widget)`, `:290` and `:536-559`;
     - LP plain and Reading view: `getSectionInfo(el)`, `:490`.
     - Both report the LOWER block.
   - `resolveWriteTarget` (`:812-864`) then checks the body there against `knownBody`. It is equal (twins), so it writes the lower fence: `done(true, FORM L25)`.
   - For callouts, `locateInSection` (`:819`) picks by DOM ordinal; the ordinal and the window are both the lower's.
5. **Why SC-544's fix does not help:** the form is not a pending write, so `flushPendingWrites` (`viewRegistry.ts:109-120`) does not touch it. An outside edit or Sync makes the same rebuild with no DSE write at all, which is the residual in §1.2.

## 3. Options

### A: `openAfterPendingWrite` widened to "this note" (the ticket's idea), measured in-page (`proto-a.js`)
- **What it does:** flush every pending view of the note, wait until the note has nothing pending or in flight and a rebuild has painted, then open the form on the clicked view.
- **Measured:**
  - 3/4 twins: 12/12 misroute. The form opened on the view now one block down (`protoA-open block 2/3`) and saved there.
  - 2 twins: 4/4 the form never opened (the view was already unloaded, `view.ts:336`).
- **The form binds to the view whose element was moved:** after the settle that element is on the lower block, or it has been thrown away.
- **Fixing A** would need "open on the view now drawn at the pressed position", which needs B's position mapping anyway. It also needs a reliable "rebuild finished" signal, which neither surface exposes. And it still leaves the residual. **Rejected.**

### B: pin the block's position when the form opens; map it through every edit; Save writes there (prototype `pb`, built from source)
- **How it works (`sc552-r1-proto-pbk.patch`):**
  1. `BlockHost.pinPosition?(): BlockPin | null` and a `replaceSource` option `{ pin }`.
  2. `ReadingModeBlockHost.pinPosition()` reads the section now and returns `{ text: section.text, lineStart: ownFence?.lineStart ?? section.lineStart }`. The text is the note text the line refers to: the editor text for LP callouts, the section text otherwise.
  3. `FormModal`'s constructor pins. The constructor runs synchronously in the pencil handler, before any rebuild. Save passes `{ pin }`.
  4. Inside `Vault.process`, `pinnedTarget(content, pin)` runs `mapLine(pin.text, content, pin.lineStart)` (new `host/lineMap.ts`). It trims the common head and tail lines, then runs a Myers diff over the middle (the diff gives up past 400 edits).
  5. It accepts the mapped line only if a `language` fence starts there (`listFences`) whose body equals `knownBody`. Otherwise it falls back to today's `resolveWriteTarget` unchanged, so there is no new refusal and no body search (SC-480 is untouched).
- **Mapping by text, not by editor transaction**, so one mechanism covers both surfaces:
  - It needs no editor, so Reading view is covered (SC-549's LP-only `mapPos` is not needed).
  - It covers DSE writes and outside writes alike, in-app and on disk.
  - It covers unsaved LP editor text against the disk.
- **Measured (`pb`):**
  - 25/25 clean on the cases that misroute today: §1.1 at 50/150/300 ms on all 4 surfaces (12), 4 twins (6), panes (3), and the residual R (in-app and on disk, c3 and p3: 4). Also 14/14 controls (450 and 1800 ms, other orderings, no click), and the "upper deleted" case 2/2.
  - Cards equal the disk after Save. The moved view knows the written body, so SC-481/SC-537 redraw it.
  - Not fixed: the self-close (2 twins or the last twin, 6/6), and the edit or delete of the form's OWN block (falls back to today's twin write).
- **Residual from the ticket ("a write that lands while the form is open can still move it"): covered.** 20/20 wrong on base; 4/4 clean on `pb`, plus 2/2 on `pbw` and 4/4 2-twin cases on `pbk`.
- **r5 script-only case: not covered** ([6,6,5], names all Twin, exactly as base). It is two writers to ONE block: the form's Save, then the card's own stale debounced write. A fix would be "the form's Save cancels or supersedes its owner view's pending debounce", about 5 lines. Not prototyped, and a user cannot reach it (the form is modal).

### K: keep a pinned form open when Obsidian throws away its view's element (prototype `pbk` = B + K)
- **What it does:** `openFormEditor` registers its own close hook instead of `openManagedModal`. On the owner's unload it keeps the form open when all three hold:
  - the form has a pin,
  - `host.renderChildGone`, and
  - the registry is still loaded.

  It then registers `close` on the registry, so plugin unload still closes the form.
- **Measured: 20/20 clean.** c2, p2, form on the last twin with + upper and + middle, and R with 2 twins; LP and RV. The Save lands through the pin on the released host (its durable identity still holds). §1.1 regression 4/4.
- **SC-523's own LP self-close is unchanged** (0/2). That release does not come from a render-child unload. So K does not take over SC-523's fix, but it narrows the same contract (F1 §4.5 "the form closes when its view unloads", `FormModal.ts:17` Important 3) for one case. The owner should know.
- **Risk:**
  - **A block deleted while its form is open, where the view is released:** the form now stays open. Save then falls back to today's durable path, which with a twin left writes the twin. Mitigation: make a kept-open form's Save strict (a pin that cannot be placed → dropped with the "changed on disk first" Notice).
  - **The registry close callbacks build up** until plugin unload. A real implementation uses a child `Component` of the registry, removed when the form closes.

### Wide (B+K plus a pin on every card click; prototype `pbw`): SC-549
- **What it adds:** the first `notePersistIntent` of a pending round also pins (`pendingPin`). The view's own `fromView` write uses that pin and clears it. About 12 lines in `ReadingModeBlockHost.ts`.
- **Measured:**
  - SC-549 outside edits: 16/16 clean ([7,6,5]) for in-app and on-disk edits, c3/p3, LP and RV, where base gives [7,5,6]. Plus 8/8 controls (c2, and a writer below the edit) that are clean on base too.
  - LP typing: 3/3 [5,6,5] (base [5,5,6]).
  - Form cases are still clean.
- **Lifecycle on `pbw`: 48/48** in the four `--only` parts:
  - part 1: 21/21, 186 s;
  - part 2: 16/16, 333 s;
  - part 3: 7/7, 256 s;
  - part 4: 4/4, 297 s (G-S61 and G-S57 included).
- **jest full on `pbw`:** 6311 passed / 4 skipped / 252 of 253 suites. The base archive copy gives 6304 / 4 / 251 of 252 in the same environment; the +7 are the new `lineMap` tests. `tsc` is clean on every prototype.

### Strict (optional ruling; prototype `pbs` = wide + "a pinned write goes to its pin or nowhere")
- **What it changes:**
  - An outside edit or deletion of the form's OWN block → dropped with the "changed on disk first" Notice, and the form stays open. Today that edit is written into the twin.
  - "Upper deleted" stays correct.
- **What breaks:** **G-S6u and G-S28 FAIL** (unterminated trailing fence: expected 11, got 10). `listFences` skips an unterminated fence, so the pinned lookup misses and strict drops the write.
- **Verdict:** strict needs the `locateUnterminatedTrailingFence` case in `pinnedTarget` and a ruling, since it changes what happens when your block was edited from outside. Not recommended in this ticket. Applying it only to K's kept-open forms is the narrower version.

### Comparison
| | A | B (narrow) | B+K | B+K wide |
|---|---|---|---|---|
| Ticket steps, 3+ twins (all 4 surfaces, panes) | no (12/12 wrong) | yes 25/25 (+14 controls) | yes | yes |
| Self-close, 2 twins / last twin | no (form never opens) | no | yes 20/20 | yes |
| Residual: outside or Sync edit while the form is open | no | yes (3+ twins) | yes (incl. 2 twins) | yes |
| SC-549 (card + outside edit / typing within 400 ms) | no | no (measured) | no (measured 3/3) | yes 16/16 + typing 3/3 |
| r5 script-only | no | no | no | no |
| Lines (prototype; real code with docs a bit more) | n/a | ~120 (lineMap 75) | ~140 | ~152 |
| Files | view.ts | new lineMap.ts, ReadingModeBlockHost.ts, BlockHost.ts, FormModal.ts | + FormModal.ts close hook | + ReadingModeBlockHost.ts notePersistIntent |

### Recommendation
- **B+K** for SC-552: the ticket's steps, its self-closing twin variant and its stated residual. It does NOT fix SC-549.
- **If the owner widens scope**, the wide pin is about 12 more lines and closes SC-549 as measured: outside edits in-app and on disk, LP typing, both surfaces, callouts and plain. My lean is to take it, because it is the same mechanism and the same gate. That is a scope ruling for the owner.
- **Leave out:** strict (needs a ruling and the unterminated-fence work), and the r5 fix (unreachable).

## 4. Overlap
- **SC-545 (LP callout click path after plugin off/on): none.** No click path and no `pipeline.ts`. If SC-545 edits `ReadingModeBlockHost.ts`, the contact is textual only (`notePersistIntent`, `replaceSource`).
- **SC-472 (`previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`): none.** The `scrollPin.pin()` call in `replaceSource` is untouched; G-S42, G-S52 and G-S18 pass on `pbw`.
- **SC-551: landed** on dse develop 367a2f1d during this round (CDP port ownership, `scripts/cdp-owned.mjs`, 41 lines in `obsidian-lifecycle.mjs`). G-S64 is new scenario code in that same file, so rebase onto 367a2f1d. My probes ran on 711f740d's harness with `DSE_LIFECYCLE_PORT=9652`; the implementer should re-read how the port is taken after SC-551.
- **SC-540 click shield (`pipeline.ts`): untouched.** The pin is taken in `FormModal`'s constructor, not in the pencil handler.
- **SC-523:** see K above. Its LP self-close is measured unchanged.
- **SC-480: no body search, no new refusal.** The pin is a position, its fallback is today's code, and strict is not recommended.
- **Sidebar forms:** `SidebarBlockHost` has no `pinPosition`, so its behaviour is unchanged (G-S45's sidebar phase passes).
- **ds-hero "Edit definition":** goes through `FormModal`, so it is covered (not measured; the element is hidden).

## 5. Test design (for the implementer)

### Jest (red on base, green on the fix)
1. **`test/unit/framework/lineMap.test.ts`** (the prototype's 7 cases are in the patch):
   - identity;
   - an upper twin changed: every fence line keeps its place;
   - upper AND lower changed: the middle keeps its place, the changed line → null;
   - lines inserted above shift the block;
   - a line inserted inside the upper plus a line removed at the end;
   - a deleted line → null;
   - CRLF/CR numbering;
   - add: more than `LINE_MAP_MAX_EDITS` → null.
2. **`ReadingModeBlockHost` (dom, the `twin-reuse` / `reading-mode-host` infra):**
   - `pinPosition()` for a plain section, and for a callout window with an ordinal.
   - `replaceSource(body, { pin })` after the host's element has been moved to the lower twin (the mocked `getSectionInfo` returns the lower section) → the write lands at the pinned middle fence. Red on base: there is no pin option, so it lands lower.
   - Two lines inserted above → it lands at the mapped line.
   - A pin that cannot be placed (block body changed, or block deleted) → today's path (assert the same target as base).
3. **`FormModal` (dom):**
   - `pinPosition` is called once, at construction;
   - Save passes `{ pin }`;
   - a host with no `pinPosition` (sidebar) → `replaceSource(body)` as today.
4. **K:**
   - owner unload with `renderChildGone` and a loaded registry → the form stays open;
   - registry unload → it closes;
   - owner unload without a pin, or with the render child still loaded → it closes (keep the existing Important-3 test green).
5. **Wide (if taken):**
   - the first persist intent of a round pins, a second intent does not re-pin, the `fromView` write consumes the pin, and a new round re-pins;
   - a card write after a twin hand-over lands at the pin.
- **jest mutants:**
  - (j1) Save without the pin → 3 red;
  - (j2) pin taken in `save()` → 3 red;
  - (j3) `mapLine` returns `line` unchanged → 1 and 2 red;
  - (j4) no body check in `pinnedTarget` → 2 red (add a case where the mapped line holds a different-body block);
  - (j5) K always keeps → 4 red; (j6) K never keeps → 4 red;
  - (j7) the wide pin taken at the LAST intent → 5 red.

### Lifecycle G-S64 (new), part 3 after G-S52
- **Model:** G-S45's hold of the plugin's 400 ms debounce timer, plus G-S61's twin fixtures and by-block card rule. There is no timed delay anywhere.
- **One phase:**
  1. `holdOn()`; real click on + of the writer block.
  2. Expect `heldCount() === 1` and the disk still all 5. The pencil is pressed inside the window, by construction.
  3. Press Enter on the form block's pencil; wait for the form to open.
  4. Fire the held timer (`h.held[0].fn()`).
  5. Wait (condition) until the disk has the writer's 6 and the form's registry entry is on the block below or is released. **Anti-vacuity:** this proves the hand-over happened before Save, and it is true on base and on the fix.
  6. Rename to Edited and Save; wait for the form to close and the disk to have Edited.
  7. Assert values and names per block. Cards = disk by block (scroll into view; never count `.cm-embed-block`). The note outside the blocks is unchanged; 0 DSE Notices; 0 page errors.
  8. `finally`: `holdOff()` (drop, never fire), `authoringControls` off, fixtures reset, and the Notice container hidden as G-S45 does.
- **Phases.** "Base result" is measured on 711f740d.

| Phase | Steps | Want | Base result |
|---|---|---|---|
| (a) | LP callouts c3: + 0, form 1 | [6,5,5] [T,E,T] | [T,T,E] |
| (b) | LP plain p3: + 0, form 1 | same | [T,T,E] |
| (c) | RV callouts c3 | same | [T,T,E] |
| (d) | RV plain p3 | same | [T,T,E] |
| (e) | panes: + in LP pane A, form in RV pane B (same note) | same | [T,T,E] |
| (f) | LP callouts c4: + 0, form 2 | [6,5,5,5] [T,T,E,T] | Edited at 3 |
| (g) (K) | RV c2: + 0, form 1; the form must STAY open through the write | [6,5] [T,E] | the form closes itself, nothing saved |
| (h) | residual, no click: form open on c3 middle (LP), in-app `vault.process` sets the upper's value to 7; condition: the form's entry moved; Save | [7,5,5] [T,E,T] | [T,T,E] |
| (i) | residual on disk: the same in RV p3 with an fs write (watcher path) | [7,5,5] [T,E,T] | [T,T,E] |
| (k) | line shift: form open on c3 middle (LP); one outside edit inserts `NEW\n\n` under TOP AND sets the upper to 7; Save | middle Edited | [T,T,E] (and catches M3) |
| (l) | control (K): form open on the middle, the plugin disabled → the form closes; re-enable | closes | closes |
| (m) | control: + 0 held, fire, wait for the write AND the card at block 1 to be a fresh view (condition), THEN pencil 1, Save | [T,E,T] | clean today |
| (n), (o) (wide only) | + middle held; fire after an in-app edit of the upper (n) / after typing 'Z' in the upper callout title (o, LP) | [7,6,5] / [5,6,5] | [7,5,6] / [5,5,6] |

- **Time:** about 8-10 s per phase (the probe runs about 7.5 s per case including open, reset and park). (a)-(m) take about 100-120 s; with (n), (o) about 120-140 s. Part 3 goes from 254 s to about 360-395 s (under 540). Part 4 would go to about 420-435 s, so part 3 is preferred.
- **Mutants G-S64 must catch:**
  - M1 (no pin = base): (a)-(f), (h), (i), (k);
  - M2 (pin taken at Save): (a)-(f), (h), (i), (k);
  - M3 (`mapLine` = identity): (k);
  - M4 (K removed): (g);
  - M5 (K never closes): (l);
  - M6 (wide pin removed, if wide): (n), (o).
  - The base bundle must FAIL (a)-(k).

## 6. Tree and cleanup
- **Worktree:** `draw-steel-elements` HEAD 711f740d. `git status --short` is empty before and after, for the plugin and the superproject. The only change is ignored output: `node_modules` (npm ci). Nothing was committed.
- **Main checkout:** shows ` m draw-steel-elements`, Scott's expected live-vault dirt. Untouched.
- **Prototypes:** every source edit was made in scratch `git archive` copies: `src-base`, `src-pb`, `src-pbk`, `src-pbw`, `src-pbs`.
- **Lifecycle temp dirs:** my one kept dir (`/tmp/dse-obsidian-lifecycle-RLgkrV`, from the strict part-1 FAILs) was deleted by literal path, and none are left. The probe harness copies delete their own temp dir.
- **Processes:** no process listens on 9652 or 9653.

## Artifacts
- **Ledger dir** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/`:
  - Report: `sc552-r1-diag-report.md`.
  - Probe verdicts, every run: `sc552-r1-probes.log`.
  - Prototype patches against 711f740d:
    - `sc552-r1-proto-pbk.patch` (B+K, plus the lineMap jest test);
    - `sc552-r1-proto-pbw.patch` (B+K wide).
  - Lifecycle on the wide prototype: `sc552-r1-lc-protoW-part1.log`, `-part2.log`, `-part3.log`, `-part4.log`; strict: `sc552-r1-lc-protoStrict-part1.log`.
  - Jest: `sc552-r1-jest-protoW-full.log`, `sc552-r1-jest-base-full.log`, `sc552-r1-jest-linemap.log`.
  - Screenshots:
    - base: `sc552-r1-base-F-c3-lp-p0-f1-g150-x0-names-Twin-Twin-Edited.png`, `sc552-r1-base-F-c3-rv-p0-f1-g150-x0-names-Twin-Twin-Edited.png`;
    - B+K: `sc552-r1-proto-pbk-F-c3-lp-p0-f1-g150-x0-names-Twin-Edited-Twin.png`, `sc552-r1-proto-pbk-F-c3-rv-p0-f1-g150-x0-names-Twin-Edited-Twin.png`.
  - Probe scripts (copies): `sc552-r1-probe-p552-page.js`, `-p552-scenario.mjs`, `-p552-fixtures.js`, `-proto-a.js`, `-mkharness.py`, `-pr-run.sh`, `-lc.sh`.
- **Scratch** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r1-diag-q4n8/`:
  - per-run JSON: `runs/<run>/pr552.json`, `runs/<run>/lifecycle.log`;
  - sources: `src-{base,pb,pbk,pbw,pbs}`;
  - bundles: `bundle-{base,pb,pbk,pbw,pbs}`;
  - logs: `logs/`.
