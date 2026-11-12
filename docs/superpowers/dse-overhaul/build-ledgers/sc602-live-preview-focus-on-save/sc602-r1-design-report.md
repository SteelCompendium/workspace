# SC-602 r1: design and probe report (reviewer R1)

**Executive summary**
- **Root cause:** a Live Preview (LP) own save is redrawn as a **fresh mount**, never an adoption. `ViewRegistry.claim` requires `entry.host.docId === ctx.docId` (`src/framework/host/viewRegistry.ts:173`), and every LP code-block widget gets a new random docId (`remountReused.ts:306-307, 317-318`). So `registerFrameworkElements.ts:104` misses, and `:127-132` builds a new host, view and root. Obsidian's LP StateField unloads the old render child (`ReadingModeBlockHost.ts:539-548` → `viewRegistry.ts:238 release`), CodeMirror then removes the old DOM, and focus falls to `<body>`. Reading view keeps focus because the claim hits and `adoptView.ts:220/227` captures and restores it.
- **Mechanism (prototype, measured):** capture the focused control (`captureControlFocus`: control id + nth + ring) **inside `ViewRegistry.release`**, through a new `beforeRelease` hook. It fires during Obsidian's StateField update, while the old DOM still holds focus. A CodeMirror ViewPlugin `update` covers the identical-twin hand-off, where no release happens before the DOM update. Capture only when the root is in `.cm-content`, focus is inside it, and its view has an unconsumed own-write claim ticket. Then arm a one-shot SC-518-style request keyed by the block the write landed in (`lastWriteLineStart`). The existing mount-time `claimChromeFocus` (`pipeline.ts:598`, `mountChrome.ts:428`) gives focus to the successor.
- **Base 622b0904 → prototype, end state at settle + 1 s, Obsidian 1.14.4:**
  - (a) counter + by Enter: `<body>` → `counter.inc` + ring
  - (b) Advance round by Enter: `<body>` → `init.round.advance` + ring
  - (c) Catch Breath by Enter: `<body>` → `recov.catch-breath` + ring, also inside a callout
  - The same holds on 1.15.1 for (a), (b) and Reset encounter.
  - All five LP INIT-F variants also go from `<body>` to the successor.
- **Guards, prototype = base:**
  - mouse press (focus in the editor, or on body)
  - focus moved away before the write
  - external edit
  - Conditions modal / SC-384: still closes, focus to the editor
  - Reading view: full e2e 280/284, 0 failed, 171/171 pairs; INIT-F01..F14 and CTR-F01/F02 green
- **Guards, fixed with no cross-talk:** two trackers, identical twins (first or second), two panes.
- **SC-605: NO (not cheap).** The SC-605 press is a mouse click, so focus is not in the block and nothing is armed (measured). The draft is view state (`InitiativeView.quickAddDraft`), so carrying it needs a new view-to-view hand-off: about 50-70 lines across 4-5 files (see §5).
- **Footprint:**
  - New `src/framework/host/livePreviewFocusCarry.ts`, plus `viewRegistry.ts`, `chrome/focusHandoff.ts`, `kit/controlFocus.ts`, `registerFrameworkElements.ts`, jest, e2e and a fixture.
  - **No SC-607 or SC-580 file is touched.** `ReadingModeBlockHost.ts` is read only (public `blockKey()` and `lastWriteLineStart`).
  - The e2e driver supports LP: **yes** (`openNote(rel, { mode: 'live-preview' })`).
- Worktree at the end: dse porcelain empty, HEAD `622b0904` (= origin/develop, fetched; it has not moved). Prototype: `sc602-r1-prototype.diff` (226 lines; it applies cleanly with `git apply` on 622b0904).

## 1. Trace (all line numbers at 622b0904)

**The write.** An element calls `persist()` (`src/framework/view.ts:264-283`). It is debounced by 400 ms (`PERSIST_DEBOUNCE_MS`, `view.ts:23`), then `flushPersist` (`view.ts:350-406`) calls `host.replaceSource(yaml, { fromView: true })` (`view.ts:383`).
- The initiative tracker's whole-tracker actions go through `rebuildAndPersist` (`src/elements/initiative/view.ts:275-284`). It captures focus, runs `update()`, restores focus (SC-588), and then calls `persist()`.
- The host is a `ReadingModeBlockHost` in both Reading view and LP. `LivePreviewBlockHost.ts` is an unused throwing stub, and the host's `mode` is `'reading'` even in LP.
- `replaceSource` (`ReadingModeBlockHost.ts:1061`) records a claim ticket, for the view's own write only (`:1114-1115` `registry.noteWrite`), and then calls `vault.process`.

**The redraw.**
- `vault.process` fires `modify`. Obsidian calls `setViewData`, which dispatches one `userEvent: "set"` transaction (documented in `livePreviewScrollHold.ts:6-10`; measured 1-13 ms after `modify`).
- While CodeMirror computes the new state, Obsidian's LP StateField unloads the old widget's render child. Measured stack (`sc602-r1-probe-release-trace.txt`):

  ```
  computeSlot → field update → removeChild → MarkdownRenderChild.unload
    → ReadingModeBlockHost.onRenderChildUnload (:539-548)
    → registry.release(entry, 'render-child-unload') (viewRegistry.ts:238)
  ```

- This happens **before** any ViewPlugin `update` and before `docView.update` (CodeMirror runs `updatePlugins` before `docView.update`: `@codemirror/view` `EditorView.update`). At that moment the old root is still connected and `document.activeElement` is still the pressed control. Measured: release at 2201 ms with `activeElement = counter.inc`.
- CodeMirror's DOM update then removes the old widget: `focusout`, then `<body>`.
- The new widget's processor runs `registerFrameworkElements.ts:102-133`. `registry.claim(ctx.docId, …)` misses because the docId differs (`viewRegistry.ts:173`). Probe X01 counts in LP: `claims 0, misses +1, releases +1`, a new docId per save. Reading view: `claims +1`.
- A fresh `ReadingModeBlockHost` + `pipeline.run` follows, with a new root and a new view.

**Reading view.** The claim hits, and `adoptView` (`adoptView.ts:212-231`) moves the same root and restores focus (`captureFocus` at `:220`, `restoreFocusWhenConnected` at `:227`).

**Answer to the brief's question:** in LP the redraw is a fresh mount, not an adoption that skips focus.

**Why SC-518 (form Save) already survives the LP redraw.** `armFormFocus` keys a request by `host.blockKey()` (sourcePath + language + line), not by docId. The NEW mount claims it: `claimChromeFocus` is called after every mount, from `mountChrome.ts:428` (chrome elements) and `pipeline.ts:598` (elements without chrome). A mount-time claim does not care whether the view was adopted. G-S50 shows it: "Live Preview stamina bar by keyboard -> Edit pencil +ring". SC-602 reuses that claim side unchanged, apart from adding a successor lookup.

**Where the capture belongs, and why the obvious places fail (measured):**

| Capture point | Result | Why |
|---|---|---|
| `view.ts flushPersist` (at the debounce) | rejected | Reset encounter → Yes flushes while focus is in the confirm modal (`initiative/view.ts:313-314`) and gives focus back only at `:337`, after the flush. L05 base: focus back on the item at 254 ms, write at 265 ms. A press between the flush and the redraw (~5-60 ms) would also be missed, and Reading view would need gating. |
| CodeMirror ViewPlugin `update` alone | **failed** (proto1: 0 of 21 carried) | The registry entry is already released when plugin updates run (it happens in the StateField, see above). `liveEntries()` was empty in every case except twins. |
| **`ViewRegistry.release` (`beforeRelease` hook)** | **works** | It is the one choke point every LP teardown passes through, and it runs while the old DOM still holds focus. The writer is identified by its unconsumed own-write ticket. |
| + ViewPlugin `update` | **needed for twins** | The written upper twin's widget is handed to the identical twin below (SC-481/SC-537). Its render child is not unloaded and its entry is still live at plugin-update time. `remountReused.reconcile` releases it AFTER the DOM update, when focus is already gone. |

The **key** must be the block the write landed in (`host.lastWriteLineStart`, public getter `ReadingModeBlockHost.ts:730`). At capture time a live `blockKey()` of the written twin reports the twin's line. Prototype v1 measured `…::13` for a press on the first twin, and focus landed in the **second** twin (G03b, cross-talk).

## 2. Measurements (real Obsidian, Live Preview, keyboard; e2e driver `--only`, scratch spec)

**Timeline columns.** Times are ms from the sampler start, which is just before the key press. The sampler checks every 5 ms what holds focus and also logs `focusout` events and vault `modify`.
- "write" is the `modify` event.
- "out" is the old control's `focusout` at the redraw.
- "end" is `document.activeElement` at settle + 1 s.
- `@new` means the control is in the redrawn root; `+ring` means `:focus-visible`.

The pinned Obsidian is 1.14.4. Rows marked 1.15.1 ran with `--obsidian=installed` (1.15.1 asar).

### 2.1 Probes (a)-(c) and the LP INIT-F set

| Probe | Base 622b0904 (write / out / end) | Prototype (write / out / focus lands / end) |
|---|---|---|
| A01 (a) counter + by Enter | 446 / 452 / **body** (462) | 456 / 470 / 492 / **counter.inc @new +ring** |
| A01 (a) on 1.15.1 | 438 / 443 / **body** (464) | 439 / 445 / 469 / **counter.inc @new +ring** |
| A02 (b) Advance round by Enter | 463 / 468 / **body** (498) | 464 / 469 / 516 / **init.round.advance @new +ring** |
| A02 (b) on 1.15.1 | 593 / 601 / **body** (718) | 610 / 616 / 837 / **init.round.advance @new +ring** |
| A03 (c) stamina Catch Breath by Enter | 435 / 445 / **body** (476) | 432 / 435 / 451 / **recov.catch-breath @new +ring** |
| A04 (c) the same, block inside a `> [!note]` callout | 432 / 438 / **body** | 432 / 437 / 451 / **recov.catch-breath @new +ring** |
| A05 counter "-" to min (focus handed to the number field) | 435 / 444 / **body** | 446 / 449 / 456 / **counter.input @new +ring** |
| L01 quick-add Enter in label (INIT-F01 LP) | 450 / 460 / **body** | 452 / 456 / 494 / **quickadd.label @new +ring** |
| L03 Reset turns (INIT-F03 LP) | 463 / 469 / **body** | 462 / 465 / 516 / **init.reset-turns @new +ring** |
| L04 Relieve → Make → Relieve captain (INIT-F04 LP) | **body**, then body | **make @new +ring**, then **relieve @new +ring** |
| L05 Reset encounter → Yes (INIT-F05 LP) | 265 / 271 / **body** | 242 / 244 / 305 / **init.reset-encounter @new +ring** |
| L05 on 1.15.1 | 494 / 498 / **body** (705) | 510 / 514 / 774 / **init.reset-encounter @new +ring** |

### 2.2 Guards

| Guard | Base | Prototype | Verdict |
|---|---|---|---|
| G01 mouse click on + (focus in editor text) | `cm-content` | `cm-content` | unchanged, never pulled in |
| G01b mouse click on + (focus on body) | body | body | unchanged |
| L06 mouse click on Advance round (INIT-F06 LP) | `cm-content` | `cm-content` | unchanged |
| G02 Enter on +, then a real click into the note text (125-145 ms, inside the debounce) | `cm-content` | `cm-content` | no steal-back |
| G02b Enter on Advance round, then focus to the editor 100 ms later | `cm-content` | `cm-content` | no steal-back |
| G03 two trackers: Enter on the 2nd tracker's Advance round | body | **2nd tracker** (idx 1) Advance round | fixed, no cross-talk |
| G03b identical twin counters: Enter on the 1st + | body | **1st** (idx 0) + | fixed, never the twin |
| G03c identical twins: Enter on the 2nd + | body | **2nd** (idx 1) + | fixed |
| G06 same note in two LP panes: Enter on + in the active pane | body (no pane focused) | the **same pane** (leaf 4), + `@new`; both panes show 2 | fixed, no cross-pane |
| G04 external edit (`vault.process`) with focus on + | body | body | unchanged (no claim) |
| G04b own save, then an external edit 1.2 s later | body, body | own save **carried**; external edit → **body** | external never claims |
| G05 Conditions window open, a condition added by keyboard (SC-384 family) | window closes; focus → `cm-content` | identical | unchanged (SC-384 not touched) |
| COND-N04 (SC-384 knownBug) in the full e2e on the prototype | known-bug | known-bug (failsWith still matches) | unchanged |
| D01 SC-605: draft typed, mouse click on Advance round | draft `"" / ""`, body | draft `"" / ""`, body | not covered (see §5) |
| D02 draft typed, keyboard Enter on Advance round | draft lost, body | focus **carried**, draft **still lost** | focus only |

### 2.3 Prototype gates (evidence; nothing committed)

- **Full e2e on the prototype** (probe files parked): `OBSIDIAN-E2E done: 280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0. This equals the baseline. INIT-F01..F14, CTR-F01/F02 and CHR-F01..F09 are ok. Known bugs: SC-257, SC-384, SC-580, SC-355.
- **Lifecycle on the prototype**, run because it touches LP and the claim machinery: `G-S6c G-S18 G-S44 G-S50` 4/4 ok, wall 129 s, on Obsidian 1.15.1. G-S50 still shows "Live Preview stamina bar by keyboard -> Edit pencil +ring".
- **jest on the prototype** (`test/dom/framework test/dom/kit test/dom/elements/initiative-matrix.test.ts`): 74 suites, 5322 tests passed.
- tsc, including `tsc -p e2e`, is clean; eslint on `src/framework` is clean.

**Iteration history (design input):**
- v1 (ViewPlugin only) carried nothing, and in the twin case keyed `::13`, which put focus in the wrong twin.
- v2 (release hook + live key) worked, but its request stayed armed for SC-518's `SETTLE_MS` (1.5 s). Two problems:
  - G04b: an external edit 1.2 s later claimed focus.
  - L04: the second Enter's in-place rebuild claimed the **root** (`tabindex=-1`) before SC-588's own hand-back could run, so focus ended on the root instead of Relieve captain.
- v3 = the saved diff. The successor request is **one-shot** (disarmed on its first successful focus) and keyed by `lastWriteLineStart`. Every row above is v3.

## 3. Prototype (the design the implementer builds)

Saved as `sc602-r1-prototype.diff`, 5 files, about +110 lines including comments.

1. **`src/framework/host/viewRegistry.ts`:** add `beforeRelease: ((entry, reason) => void) | null`. `release()` calls it first, in try/catch, while `entry.released` is still false and the root is still in place.

2. **NEW `src/framework/host/livePreviewFocusCarry.ts`:**
   - `carryOwnSaveFocus(entry, now)` arms only when all of these hold:
     - `root.isConnected` and `root.closest('.cm-content')`. This is LP only; Reading view and the sidebar are never armed.
     - `activeElement` is inside the root.
     - The entry has a ticket younger than `CLAIM_WINDOW_MS` that has not been used. A module `WeakSet<ClaimTicket>` marks every ticket of the entry as used, so one write arms at most once.
   - It then calls `armSuccessorFocus(writtenBlockKey(entry), root => controlSuccessor(root, token), token.ring, active)`.
   - `writtenBlockKey` is `host.blockKey()` with its trailing `::<line>` replaced by `host.lastWriteLineStart`.
   - `livePreviewFocusCarryExtension(registry)` is a `ViewPlugin` whose `update` (only when `docChanged`) runs `carryOwnSaveFocus` for every live entry whose root contains `activeElement`. This covers the twin hand-off.

3. **`src/framework/chrome/focusHandoff.ts`:**
   - `Request.find: ((root) => HTMLElement) | null`; `null` for Pin and the edit form.
   - New export `armSuccessorFocus(blockKey, find, ring, focused)`. Its scope is `scopeOf(focused)` (the pane or embed) and `ours = {focused}`; it uses the same guard and TTL as the existing requests.
   - In `claimChromeFocus`, when `req.find` is set, `btn = find(root)`. The root fallback is used only once `root.isConnected`.
   - After a successful focus, a `find` request is **disarmed** (one-shot), where other requests extend by `SETTLE_MS`.

4. **`src/framework/kit/controlFocus.ts`:** export `controlSuccessor(root, focus, families)`, a pure lookup: the nth control of the family, else the family's last, else the root. `restoreControlFocus` uses it, with no behaviour change.

5. **`src/framework/registerFrameworkElements.ts`:** `plugin.registerEditorExtension(livePreviewFocusCarryExtension(registry))` and `registry.beforeRelease = (e) => { carryOwnSaveFocus(e); }`.

**Implementer adjustments to the prototype** (decided here, so no judgment call is left):
- **Drop the "nested element" line** in `carryOwnSaveFocus` (diff line ~203, `if (active.closest('[data-dse-element]') !== root && …) return false;`). It only checks the first nested element. It is also unnecessary: only an entry with its own fresh ticket arms, and each block has its own key.
- **Disabled successor:** in the `find` branch of `claimChromeFocus`, if `find(root)` returns a control that is `:disabled`, use `root` instead (the existing `tabindex=-1` fallback). Otherwise `focusControl` refuses, and the request lingers until its TTL. (A counter at max may do this; the prototype did not hit it.)
- Rename `armSuccessorFocus`'s `item: ''` to a named constant or comment. Keep `find` mutually exclusive with `label`.
- **Pin `blockKey()`'s format in jest:** a resolving host's key ends in `::<lineStart>`, because `writtenBlockKey` depends on it. See the risks for why this is not a `ReadingModeBlockHost` method.
- Add a top-of-file comment that cross-references `focusHandoff.ts` (SC-518 for SC-602) and an entry in the dse docs or ARCHITECTURE note, per the "funky logic" rule: the render child is released inside Obsidian's StateField, before the DOM update.

## 4. File footprint and conflict flags

| File | Change | Conflict? |
|---|---|---|
| `src/framework/host/livePreviewFocusCarry.ts` | NEW (~70 lines) | — |
| `src/framework/host/viewRegistry.ts` | `beforeRelease` hook (+8) | no |
| `src/framework/chrome/focusHandoff.ts` | `find` request + `armSuccessorFocus` + one-shot (+35) | no |
| `src/framework/kit/controlFocus.ts` | `controlSuccessor` (+8) | no (an existing kit file, so no +2 kit-index tests) |
| `src/framework/registerFrameworkElements.ts` | register extension + hook (+6) | no |
| jest: `test/dom/framework/livePreviewFocusCarry.test.ts` (new); additions to `chromeFocusHandoff.test.ts`, `view-registry.test.ts`, `register-framework-elements.test.ts`, `test/dom/kit/controlFocus.test.ts` | tests | no |
| e2e: `e2e/specs/initiative/focus-live-preview.e2e.ts` (new), `e2e/specs/counter/counter-focus-live-preview.e2e.ts` (new), `e2e/manifest/counter.ts` (+`counter.inc`), `e2e/vaults/shipped/Counter/twins.md` (new fixture) + `e2e/README.md` fixture-table row; optional `e2e/driver/dse.ts` helper | tests | no |
| `CHANGELOG.md` (dse) + worktree superproject `CHANGELOG.md` | entries | no |

**Flags:**
- `ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `visual-harness/obsidian-lifecycle.mjs` (SC-607) and `src/views/ConditionsModal.ts` (SC-580): **none touched.**
- `ReadingModeBlockHost.ts` is only *read* through its existing public API: `blockKey()`, `lastWriteLineStart`, and the registry's `tickets`.
- The cleaner `writtenBlockKey()` would be a 3-line method on `ReadingModeBlockHost`. It was avoided on purpose. The cost is a regex coupling to `blockKey()`'s `path::lang::line` format, pinned by one jest test. It can move into the host after SC-607 lands.
- No CSS change, so `styles.css` stays byte-identical and shots, freeze and parity carry.
- No lifecycle scenario is needed: e2e expresses every case, so G-S104 stays unused.

## 5. SC-605 verdict: NO (not cheap with this mechanism)

- **Measured (D01):** in the SC-605 scenario (type a draft, then a **mouse** click on Advance round), the click shield blurs the box (`pipeline.ts:229-241`), so focus is `<body>` before the write. Nothing is armed, and the draft is lost on base and prototype alike (`"" / ""`).
- **Measured (D02):** a keyboard Enter on Advance round with a draft typed carries focus, but the draft is still lost.
- **Why:** the draft is per-view state (`InitiativeView.quickAddDraft`, captured in `update()` at `initiative/view.ts:169` and restored in `buildMaliceQuickAdd`), and LP builds a new view. Carrying it needs:
  1. a capture that does not depend on focus: the same `beforeRelease` and ViewPlugin hooks, armed by ticket alone;
  2. a view-to-view hand-off seam: `ElementView.carryState?(): unknown` / `receiveCarriedState?(s)` (view.ts ~12 lines);
  3. a take-before-mount (or claim-after-mount plus a partial update) in `pipeline.ts`, keyed by the written block key and scoped to the pane. At processor time the LP widget is detached, so the pane scope is unknown until it is connected. That forces either a key-only hand-off (two-pane cross-talk risk) or a post-mount `update()`.
  4. the initiative view implementing the two hooks (~10 lines), plus jest and e2e.
- **Estimate:** about 50-70 product lines over 4-5 files (`view.ts`, `pipeline.ts`, `livePreviewFocusCarry.ts`, `initiative/view.ts`, and possibly `focusHandoff.ts`), with its own two-pane and twin guards.
- **A rejected shortcut:** copy every `input[data-dse-control]` whose `value !== defaultValue` into the new root. It is generic, but it would also resurrect half-typed values in model-bound fields (counter and stepper inputs) after an outside-of-focus save. It needs per-element opt-in, so it is not cheap either.
- **Recommendation:** keep SC-605 separate. It can reuse this ticket's capture point (`beforeRelease` + `writtenBlockKey`) once it lands.

## 6. Test plan for the implementer

### jest (jsdom)

**New file `test/dom/framework/livePreviewFocusCarry.test.ts`.** Build a fake entry: `{ root, host: { blockKey(), lastWriteLineStart }, tickets }`, with the root inside a `div.cm-content` inside a `div.workspace-leaf`, and a new root mounted later with the same key.

| # | Case | Expect |
|---|---|---|
| J1 | Root in `.cm-content`, focus on `[data-dse-control=x]` (2nd of 3), fresh ticket → `carryOwnSaveFocus` → old root removed → `claimChromeFocus(() => key, newRoot)` | focus on the 2nd `x` of the new root; returns true; ring follows `:focus-visible` (jsdom: assert the `focusVisible` option passed, or spy `focusControl`) |
| J2 | Root NOT in `.cm-content` (Reading view) | false; nothing armed; the new mount does not move focus |
| J3 | Focus on body / on `.cm-content` / in another DSE root | false |
| J4 | No ticket (external edit); ticket older than `CLAIM_WINDOW_MS` | false |
| J5 | Same ticket twice (the release hook, then the ViewPlugin) | 2nd call false (one write arms once) |
| J6 | Twin: `blockKey()` → `…::13`, `lastWriteLineStart` = 4 | a mount with key `::13` does NOT take focus; a mount with `::4` does |
| J7 | One-shot: after a successful claim, a second mount with the same key while focus is on body | focus not moved (G04b / L04 regression) |
| J8 | Guard: any focusin elsewhere between arm and claim | request cancelled; the mount does not take focus |
| J9 | Scope: a mount in another `.workspace-leaf` with the same key | no claim; the mount in the pressed leaf claims |
| J10 | Focus not free at claim time (the user is on some input) | no claim |
| J11 | Successor missing | root gets `tabindex=-1` and focus. Successor `:disabled` → root (adjustment §3) |
| J12 | Root built detached, connected later (MutationObserver path) | claim happens once connected |

Additions to existing files:
- `view-registry.test.ts`: `beforeRelease` is called once, before `released` flips, with `(entry, reason)`. A throwing hook does not stop the release, and the view is still unloaded. It is not called for an already-released entry.
- `controlFocus.test.ts`: `controlSuccessor` returns the nth control, the last when the list shrank, the root when there is none, and follows the family map. `restoreControlFocus` behaviour is unchanged (the existing tests stay green).
- `register-framework-elements.test.ts`: the new extension is registered and `registry.beforeRelease` is set.
- Pin the format: a resolving `ReadingModeBlockHost.blockKey()` matches `/::\d+$/` and equals `${path}::${lang}::${lineStart}`.
- ViewPlugin `update`: export the update handler, or call `carryOwnSaveFocus` through a thin exported `onEditorUpdate(dom, registry)` so jest can call it with a fake `{ docChanged, view: { dom } }`.
- **Vacuity:** J1/J6/J7/J11 must fail when the matching line is neutralised. Remove the `beforeRelease` call → J1 red. Use `blockKey()` instead of `writtenBlockKey` → J6 red. Replace the one-shot `disarmChromeFocus` with the `SETTLE_MS` extension → J7 red. Report each mutation's red count.

### e2e (real Obsidian)

**New spec `e2e/specs/initiative/focus-live-preview.e2e.ts`.** All ids are verified free across `e2e/` (no `INIT-L*` or `CTR-L*` exist; `CALL-L01..03` and `CHR-L01` exist, so avoid `CALL-L01..03`).

| Id | Note | Steps | Expect | Base (measured) |
|---|---|---|---|---|
| INIT-L01 | `Initiative/tracker.md` | type 2 + "Kbd", Enter in label | focus `init.malice.quickadd.label`, in `.markdown-source-view` tracker, ring | red (body) |
| INIT-L02 | `Initiative/rich.md` | Enter on Advance round | `init.round.advance` + ring; Round 3 | red |
| INIT-L03 | `rich.md` | Enter on Reset turns | `init.reset-turns` + ring | red |
| INIT-L04 | `captain.md` | Enter on Relieve, then Enter on Make | `init.captain.make`, then `init.captain.relieve`, ring | red |
| INIT-L05 | `rich.md` | Enter on Reset encounter, Tab to Yes, Enter | modal gone; `init.reset-encounter` + ring; Round 1 | red |
| INIT-L06 | `rich.md` | mouse click on Advance round (focus in the editor) | focus not in the tracker (guard) | green (guard) |
| INIT-L07 | `two-trackers.md` | Enter on the 2nd tracker's Advance round | focus in the 2nd tracker (index 1) | red |
| INIT-L08 | `rich.md` | Enter on Advance round, then focus the editor `.cm-content` before the write | focus stays in the editor (guard) | green (guard) |

**New spec `e2e/specs/counter/counter-focus-live-preview.e2e.ts`:**

| Id | Note | Steps | Expect | Base |
|---|---|---|---|---|
| CTR-L01 | `Counter/counter.md` | Enter on + | one write, `current_value: 2`, focus `counter.inc` + ring in LP | red |
| CTR-L02 | `counter.md` | mouse click on + with focus in the editor | focus not in the block (guard) | green |
| CTR-L03 | `Counter/twins.md` (new fixture, two identical counters) | Enter on the 1st + | focus in the 1st counter, the 2nd untouched (note: 2nd fence still `current_value: 1`) | red |
| CTR-L04 | `counter.md` | focus + by script, then `dse.externalEdit` changing the value | focus NOT carried (body) (guard; same as today) | green |
| CTR-L05 | `counter.md` | Enter on "-" at 1 → 0 | `counter.input` + ring after the redraw (SC-495 in LP) | red |

**Optional, recommended:** a callout case, `CALL-L04` in `e2e/specs/callout/callout-writes.e2e.ts`: `Callout/callout.md` in LP, Enter on `recov.catch-breath` → focus on `recov.catch-breath` + ring (A04: red on base). `recov.catch-breath` `press:Enter` is already in the stamina-bar manifest.

**Manifests.**
- `e2e/manifest/counter.ts` gets `'counter.inc': c(['press:Enter', 'click'], ['SC-602'])`. Without it, the full-run gate fails with "driven pair in no manifest", because CTR-L01/L02 drive `counter.inc`.
- `counter.input` is only asserted, never driven, so it needs no manifest row.
- The initiative and stamina pairs are already in their manifests.
- Add the `Counter/twins.md` row to the README fixture table.

**How a test opens LP and gets keyboard focus.**
- `await dse.openNote(NOTE, { mode: 'live-preview' })`. This is already supported: `block()` scopes to `.markdown-source-view`, and `openNote` parks the cursor on line 0.
- Do **not** `dse.tabTo` from the editor: Tab in the CodeMirror editor indents the note, which is a write. Focus the control by script, the way the SC-588 r2 and SC-602 r1 probes did: `el.focus({ focusVisible: true })` via `dse.page`. Better, add a driver helper `dse.focusByScript(el)` that records no coverage; then `dse.press('Enter', ctl)` still checks real focus.
- The focus assertion helper must look in `.markdown-source-view [data-dse-element=…]`, not `.markdown-reading-view`.
- `waitForWrite` + `settle` as in INIT-F; the probes add `browser.pause(1000)` after settle to show the end state holds.

**Vacuity.** Every "red" row above was measured ending on `<body>` at base `622b0904`, and on the successor with the prototype (§2). The implementer re-proves it by running the new ids on a build with `livePreviewFocusCarry` unregistered (comment out the two `registerFrameworkElements.ts` lines): the expected base result is 10 red (L01-L05, L07, CTR-L01/L03/L05, CALL-L04) and the guards green.

**Re-running the probes.** Copy the probe spec and fixture, run it, then remove both:
1. `cp sc602-r1-probe.e2e.ts.txt <dse>/e2e/specs/zz602/probe.e2e.ts`
2. `cp sc602-r1-fixture-zz602-twins.md.txt <dse>/e2e/vaults/shipped/Counter/zz602-twins.md`
3. `ZZ_PROBE_OUT=<scratch>/x.jsonl devbox run -c <dse> -- npm run e2e -- --only=ZZ602-A01,…` (`sc602-r1-run-probe.sh.txt` wraps this; `--obsidian=installed` for 1.15.1)
4. `python3 sc602-r1-summarize.py.txt x.jsonl`
5. Remove both files. Never run a full e2e with them in place: the coverage gate would fail.

## 7. Risks

1. **Obsidian-internal ordering.** The capture relies on Obsidian unloading the old widget's render child inside the StateField update, before the DOM update. Measured on 1.14.4 and 1.15.1. If a future Obsidian unloads after the DOM removal, the release-time capture finds focus on `<body>` and arms nothing. That degrades to today's behaviour (no wrong focus), and INIT-L/CTR-L go red.
2. **Regex coupling** in `writtenBlockKey` to `blockKey()`'s format. It is pinned by jest, and can move into `ReadingModeBlockHost` after SC-607.
3. **Successor disabled:** use the root fallback (adjustment in §3). Root fallback sets `tabindex=-1` on the new LP root (SC-588 precedent). It is not a Tab stop and no capture reaches it.
4. **Not measured:** an LP **embed** of another note (`.cm-content .internal-embed`; its redraw is not a host-editor transaction); the sidebar (not LP; its root is not in `.cm-content`, so never armed); popout windows (the code is document-relative, like `focusHandoff`).
5. **The ticket `WeakSet`:** a second own write inside 3 s with focus elsewhere marks nothing. A write whose redraw never comes (note scrolled out of the viewport, widget not drawn) leaves a request armed for ≤ 5 s. It claims only on the same block's mount, in the same pane, with focus on `<body>`. This is the same residual window as SC-518.
6. **SC-384 behaviour is unchanged.** The Conditions window still closes when its write lands in LP; focus goes to the editor.

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc602-live-preview-focus-on-save/`)
- `sc602-r1-prototype.diff`: the v3 prototype (git diff + new file).
- `sc602-r1-probe.e2e.ts.txt`, `sc602-r1-probe-registry.e2e.ts.txt`, `sc602-r1-fixture-zz602-twins.md.txt`, `sc602-r1-run-probe.sh.txt`, `sc602-r1-summarize.py.txt`: the probe harness.
- Probe results:
  - `sc602-r1-probe-results-base1.txt` (base, 22 probes; G02 there errored on a selector and was re-run in base2)
  - `…-base2.txt` (G02, G02b, G04b)
  - `…-base-g06.txt`
  - `…-base-inst.txt` (1.15.1)
  - `…-proto3.txt` (v3, 22 probes)
  - `…-proto-g06.txt`
  - `…-proto-inst.txt` (1.15.1)
- `sc602-r1-probe-release-trace.txt`: the release stack (StateField `computeSlot` → `onRenderChildUnload` → `release`, focus still on `counter.inc`).
- Scratch logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r1-reviewer/`
  - `e2e-full-proto.log`: full e2e on the prototype
  - `life-proto-lp.log`: lifecycle G-S6c/G-S18/G-S44/G-S50
  - `jest-proto-subset.log`
  - `probe-*.log` / `probe-*.jsonl`
