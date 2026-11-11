# SC-595 r1 — diagnosis report (hover preview: a click in the edit form closes form and preview)

## Executive summary
- **Mechanism (Obsidian):** pressing + or the pencil sends a `click` through the preview's embed. Obsidian's page-preview popover (`Cf.create`, app.js:509 col ~193300) reacts with `p()`: `setIsFocused(true)`, a pushed keymap scope, and a **window `click` listener (bubble phase)**: `m => m.defaultPrevented || h.contains(m.targetNode) || d.hide()`. The modal is not inside `h`, so the first `click` in the form calls `hide()` in the same task. The trigger is the `click` on release. mousedown, pointerdown, a held press (680 ms), focus moves and resting the pointer do nothing.
- **Form-close path (DSE):** `hide()` → `unload()` → `ReadingModeBlockHost.onRenderChildUnload` (ReadingModeBlockHost.ts:530-540) → `ViewRegistry.release` (viewRegistry.ts:238-246) → view unload → the `openFormEditor` owner callback (FormModal.ts:570-574). There `keepFormOpenOn()` (ReadingModeBlockHost.ts:564-571) returns null because the note is in no pane, so the form closes. This is SC-552's "kept open only while its note is shown" rule. The rule is applied correctly; its input is the popover's unload.
- **Recommended design: A.** Keep the preview alive while a DSE modal opened from it is open. While open, the modal stops its own `click` events at the document, in the bubble phase (`stopPropagation`, never `preventDefault`), so they never reach the popover's window listener. It also puts the modal's keymap scope back on top. This is done in `DseModal`, so it fixes every DSE modal opened from a preview, not only the form.
- **Scott decision: No.** A is better than B on every point measured: the preview stays, all modals work, and it matches Obsidian's own "focused preview". The one visible effect: after Save or Cancel the preview stays until the next click outside it. That is Obsidian's normal behaviour.
- **Related bugs found:**
  - (1) **Esc does nothing** in a form opened from a preview. The popover's scope sits above the modal's. In Live Preview, Esc also moves focus into the note editor behind the open form.
  - (2) A modal opened **without any click** closes by itself about 300 ms after it opens, with no input. The case measured is the stamina bar opened with Enter or Space. The popover is not focused, so its hover timer hides it.
  - (3) **Today's behaviour is inconsistent.** When the source note is also open in another pane, SC-552's keep-open path already keeps the form open and Save works.

## 0. Setup and evidence
- dse worktree `sc595-hover-form-click-closes` at `eaa8742a`. `origin/develop` is still `eaa8742a` (fetched).
- `npm ci` and `npm run build-no-check` were run in the worktree. `node_modules`, `main.js` and `styles.css` are gitignored. `git status --porcelain` was empty before and after, in dse and in the superproject.
- Obsidian **1.15.1**. The lifecycle harness copies the newest `~/.config/obsidian/obsidian-*.asar` (`obsidian-lifecycle.mjs:7384-7403`); that is `obsidian-1.15.1.asar`. app.js was extracted with `sc595-r1-asar-extract.py.txt`. Excerpts: `sc595-r1-obsidian-excerpts.txt`.
- **Probe harness:** a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with one injected scenario (`sc595-r1-make-probe.py.txt`, `sc595-r1-probe-scenario.mjs.txt`, `sc595-r1-run-probe.sh.txt`). It uses a real CDP mouse (`Input.dispatchMouseEvent`) for hover, +, pencil and every click, and Ctrl-hover on a real link in RV and LP. Nothing was injected into the worktree.
- **Page instrumentation:**
  - `HoverPopover.prototype.hide` is wrapped to record `window.event` (type, phase, currentTarget, defaultPrevented), `isFocused` and the stack.
  - `Node.prototype.detach` / `Element.prototype.remove` are wrapped, for the DSE modal container only, to get the full close stack.
  - Window capture and bubble listeners log every pointer, mouse, click and focus event with the state (popover connected, form open, `isFocused`, `is-editing`, active element).
  - `DOMDebugger.getEventListeners` lists the listeners on `window` and on the embed container.
- **Logs.** Each `-raw.log` has a `.log` summary next to it:
  - `sc595-r1-probe-A-trigger*`: press/hold/release, pencil only, keyboard plus a Save click. RV and LP.
  - `sc595-r1-probe-B-protoA-protoB-other*`: the A and B emulations, plus the stamina and conditions modals.
  - `sc595-r1-probe-C-esc-kbdopen-other*`: Esc, pencil opened by Enter, conditions (RV), stamina (LP).
  - `sc595-r1-probe-D-toggle-protoA2*` and `-D-extras.log`: preventDefault against stopPropagation with a toggle, the A2 emulation, the keymap scope stack, document click listeners.
  - `sc595-r1-probe-E-stamina-keyboard*`: a modal opened with no click.
  - `sc595-r1-probe-F-src-open*`: the source note also open in a second pane.
  - In the D log, the line `protoA installed (... preventDefault ...)` is stale label text: those trials installed `stopPropagation`, as the variant name (`protoA2*`) says.

## 1. What closes the popover (Obsidian 1.15.1, app.js line 509)
Module state: `S3` holds the popovers still showing and `wf` the shown ones. A 500 ms interval (`oke`) tracks the pointer.

| Listener / path | Where | Fires on | Effect in our case |
|---|---|---|---|
| `T3` | `window` **capture** `click` + `contextmenu` (col 105635, from `nne`) | any click | Hides (after 5 ms) every shown popover that is `!isFocused`, does not contain the target, and has no child hover containing it. **Skipped here: `isFocused` is true.** |
| `Cf.create` → `p()` | `u.registerDomEvent(u.containerEl.win, "click", m => m.defaultPrevented \|\| h.contains(m.targetNode) \|\| d.hide())` (**bubble**, col ~193500; hide called from col 193553) | any `click` in the popover's window | **This is the closer.** It is installed by `p()`, which `zh(u.containerEl, …)` runs on every click in the preview that is not cancelled, buttons included. `p()` runs **before** the "is it a button" check that stops the switch to the editor. |
| `transition()` timer | `setTimeout(() => shouldShow() ? transition() : hide(), waitTime)` (col ~107969) | the pointer leaves, or the 500 ms `oke` sees `elementFromPoint` outside `hoverEl` | Inert while `isFocused` (`shouldShowSelf`). Closes the preview when `isFocused` is false (related bug 2). |

**Measured (A logs; RV and LP agree within about 75 ms):**
- `isFocused` turns true and `hoverEl.is-editing` appears:
  - after the + click (about 250 ms after it);
  - after the pencil click when there was no + (`pencil-only`: false while the click is dispatched, true by `form open`);
  - after Enter on the pencil (`kbd-open`). Enter on a `<button>` dispatches a `click` (detail 0), which also runs `p()`.
- `window` click listeners: before the pencil there is one Cf bubble listener (508:193500, 0-based). After the pencil there are **two**: `p()` runs on every such click and leaks a listener and a scope each time. This is Obsidian's leak, and harmless.
- Every RV form trial with a click in the raw box (eight):
  - `mousePressed` on the raw box: no change at +80 ms, no change at +680 ms with the button held.
  - `mouseReleased` → `pointerup`, `mouseup`, `click` → **HIDE, event `click`, phase 3 (bubble), currentTarget window, defaultPrevented false, isFocused true**, from app.js:509:193553 → modal detached 1-3 ms later in the same task.
  - Example (rv/press-hold): press 2819, release 3510, click 3512, hide 3513, modal detached 3516.
  - Example (lp/press-hold): press 2894, release 3585, hide 3587, detached 3588.
- **Keyboard:** Tab ×2 and a scripted `focus()` change nothing. Typed text survives. A real click on **Save** hides the popover in the same `click`. Save's async write still lands (`disk: saved`), but the form is already gone when it resolves. A refused Save could not keep its "the form stays open" promise.

**Is there a supported or structural hook?**
- Public API: `HoverPopover` exposes only `hoverEl`, `state` and its constructor (obsidian.d.ts:3476-3492). `hide`, `setIsFocused`, `isFocused` and `shouldShow` are private.
- `isFocused` / `setIsFocused` (private) only silences `T3` and the timer. **It does not stop the Cf listener**, which ignores `isFocused`.
- `childHovers` is only consulted by `T3` and `shouldShowChild`, never by the Cf listener.
- `h.contains(targetNode)` would need the modal inside the embed's DOM. Not workable: the modal goes to `activeWindow.document.body` (Modal.open, app.js:245).
- `defaultPrevented` is Obsidian's own convention for "an element outside the popover that belongs to it": `Dd.onSuggestionClick` calls `preventDefault()`, which is how suggestion lists survive. But a `preventDefault` on a click inside the modal **cancels label/checkbox activation**. Measured (`toggleA`): an Obsidian-shaped toggle (`label.checkbox-container > input[type=checkbox]`, which `ToggleComponent` builds) stayed `checked:false` with 0 `change` events. **Rejected.**
- **Remaining structural hook:** the event must not reach the window. A `stopPropagation()` on `click` once it has passed every node inside the modal works. Measured (`toggleA2`): toggle `checked:true` with 1 change; preview and form survive.

## 2. What closes the form (DSE, eaa8742a)
Measured close stack (rv/press-hold; the same in LP and in every click trial). Minified frame → source:

1. Obsidian Cf listener (app.js:509:193553)
2. `HoverPopover.hide` (app.js:509:108649) → `this.unload()` → the Component unload chain (embed → renderer → section) → `MarkdownRenderChild` unload
3. `renderChild.register(() => this.onRenderChildUnload(renderChild))` (**ReadingModeBlockHost.ts:521**)
4. `onRenderChildUnload` (**ReadingModeBlockHost.ts:530-540**): `lastWrite = null`, `_renderChildGone = true`, `registry.release(entry, 'render-child-unload')`
5. `ViewRegistry.release` (**viewRegistry.ts:238-246**) → `this.removeChild(entry.view)` → view unload
6. `openFormEditor`'s `owner.register` callback (**FormModal.ts:570-574**)
7. `keepFormOpenOn()` (**ReadingModeBlockHost.ts:564-571**): `_renderChildGone` is true and the registry is loaded, but `getLeavesOfType('markdown').some(file.path === sourcePath)` is **false** (the note is only in the preview) → `null` → `modal.close()` (FormModal.ts:573)
8. `FormModal.close` (FormModal.ts:512) → `DseModal.close` (managedModal.ts:157-162) → Obsidian `Modal.close` (app.js:245) → `containerEl.detach()`

So it is **SC-552's rule** (F1 §4.5, the form closes with its view, plus the SC-552 exception that does not apply here). It is not some other path.

**Corollary, measured (F logs, RV and LP):** with the source note **also open in a second pane**, `keepFormOpenOn` returns the registry:
- the click still closes the preview, but **the form stays**;
- typing and a real Save click land in the note (`disk: saved`, no Notice).

So today's behaviour depends on whether the note is open elsewhere. It also proves B's write path in real Obsidian with no emulation.

## 3. Which input triggers it (real Obsidian, RV and LP)

| Input | Closes? | Evidence |
|---|---|---|
| Pointer moves into the modal and rests (1.2-2 s) | no | every trial, `pointer rested` |
| `pointerdown` / `mousedown` (press, held 680 ms) | no | press-hold, pencil-only, kbd-open: `press +80ms`, `press +680ms` open |
| Keyboard focus (Tab ×2, `focus()`), typing | no | rv/lp keyboard |
| `pointerup` / `mouseup` | no (both logged with the form still open) | press-hold capture log |
| **`click`** (dispatched with the release) | **yes, synchronously, window bubble** | HIDE event `click` phase 3; modal detached in the same task |
| Esc | does not close the preview **and does not close the form** (related bug 1) | rv/lp esc |
| No input at all, modal opened with **no click** (stamina bar Enter) | **yes, after about 300 ms** (hover timer) | E logs: modal open at 406/418 ms, HIDE at 710/722 ms with event null, from app.js:509:107969, modal detached 1-4 ms later |

## 4. Fix designs

### A (recommended): keep the preview alive while a DSE modal opened from it is open
**Mechanism** (all public API):
1. **Know that the modal came from a preview.** The opener passes its element; for a card that is `cx.host.containerEl`. The guard turns on when `anchor.closest('.hover-popover')`. Options:
   - an optional `anchor` on `DseModal`, set by `openFormEditor`, by `openManagedModal(owner, factory, anchor?)` and by `InitiativeView.openModal`;
   - or a `DseModal.fromHoverPreview(el)` setter.

   Keep it conditional: outside a preview, nothing changes.
2. **Click guard while open:** `this.lifecycle.registerDomEvent(this.containerEl.doc, 'click', (e) => { if (this.containerEl.contains(e.target as Node)) e.stopPropagation(); })`.
   - It sits on the **document, bubble phase**, so every document-level listener still sees the click: `RecoveriesStrip`'s click-outside (RecoveriesStrip.ts:308), `ConditionsModal`'s capture listener (ConditionsModal.ts:210), `sccLinkClickHandler`'s capture listener (sccLinkClickHandler.ts:109).
   - Only window-level bubble listeners are cut off: the popover's Cf listener (the target), and Obsidian `Menu`'s `click` outside-handler. Menu also closes on `mousedown`, so it still closes.
   - **Never `preventDefault`** (it breaks toggles, measured).
   - It is removed with `lifecycle` on close.
   - The measured emulation (`protoA2*`) put `stopPropagation` on `.modal-container` (bubble). Moving it to the document is the same for the window listener by DOM dispatch order, but it was **not probed separately**.
3. **Esc (related bug 1):** after the opening event has finished (`win.setTimeout(…, 0)`, where `win` is the modal's window), if the modal is still open, call `app.keymap.popScope(this.scope); app.keymap.pushScope(this.scope)`. These are public `Keymap` methods (obsidian.d.ts:3637-3644). Modal.close's own `popScope` then leaves the popover's scope on top, which is correct.
   - Measured: top scope = the popover's (`topKeys 0`, `topHasEscape false`); the modal's Escape scope sits under it (`belowHasEscape [f,f,f,true]`).
   - RV: Esc ×2 leaves the form open.
   - LP: Esc moves focus to `.cm-content` of the host note behind the open form.

**Files:**
- `src/framework/kit/managedModal.ts`: the guard and the scope re-push in `open()`, the anchor.
- `src/authoring/FormModal.ts:561-576`: pass `cx.host.containerEl`.
- `openManagedModal` callers: `elements/stamina-bar/view.ts:158`, `elements/hero/view.ts:384`, `elements/conditions/panel.ts:168`, `elements/montage/view.ts:361-363`, `views/StaminaEditModal.ts:632`.
- `elements/initiative/view.ts:166-181` (`openModal`).
- The tests.

**What the user sees** (measured, A emulation, RV and LP):

| Action | Form | Preview | Note |
|---|---|---|---|
| Clicks in the raw box (×2) | stays | stays | — |
| Typing, then a real Save click | closes on success | stays and redraws with the new value | **saved**, no Notice |
| Pointer moved away for 1.2 s after Save | — | still shown (`isFocused`) | — |
| A real click outside (view header) | — | closes normally (the Cf listener) | — |
| Cancel | closes | stays | not saved |
| Click on the modal backdrop (Obsidian `onClickOutside`, which checks `defaultPrevented`, so not affected) | closes | stays | not saved |
| Esc, with step 3 | closes | stays | — (not yet emulated; Esc is broken today) |

This is how Obsidian already treats a preview the user has clicked into.

**Risk to SC-552 / SC-556 / SC-584: none on the write path.**
- The preview's section and the host never unload while the form is open.
- The pin, the pin-only Save and the SC-584 `lastWrite` record all work as they do for an embed.
- SC-552's keep-open branch is simply not reached.
- G-S64 (zk)-(zn) `hp.hide = () => {}` can stay as it is. G-S83 covers the real-mouse path; add no G-S64 phases.

**Popout windows:**
- `Modal.open` uses `activeWindow`.
- The Cf listener is on `u.containerEl.win`, the popover's own window.
- `T3` is main-window only, and is skipped anyway because `isFocused` is true.
- The guard uses the modal's own document, so it should behave the same in a popout. Not probed: the harness has no popout.

**Gap: related bug 2** (a modal opened with no click):
- When a preview modal is opened from the keyboard on a non-button (`StaminaBarPanel.ts:193-200`, Enter or Space on the bar, `preventDefault` on keydown), no `click` reaches the embed. `p()` never runs, `isFocused` stays false, and the hover timer hides the preview about 300 ms later. A does not cover this.
- Fixing it needs either:
  - the popover instance (`setIsFocused(true)`, private; the instance is at `leaf.view.previewMode.hoverPopover` for a real RV hover and `leaf.view.hoverPopover` in LP or with `hover-link`), or
  - the keyboard path dispatching a real `click` on the card so Obsidian runs `p()` itself (then step 3 is needed).
- Suggest the owner files it as a Backlog ticket, or folds it in. Owner's call.

**Tests:**
- **jest** (test/dom, jsdom):
  - (a) Host inside `div.popover.hover-popover`; a `window` bubble `click` spy stands in for Obsidian. A click on the form's textarea and on Save: the spy is not called. A document-level bubble listener still is.
  - (b) An Obsidian-shaped `label.checkbox-container > input[type=checkbox]` in the modal still toggles and fires `change`.
  - (c) Control: host outside a preview → the spy is called.
  - (d) After close, the guard is gone.
  - (e) Scope: the jest `Modal` mock (`test/mocks/obsidian-core.ts:665`) pushes no scopes. Add a small keymap stack to the mock, simulate the popover's later `pushScope`, run the timers → the modal's scope is on top; after close, the popover's.
  - (f) Mutants: drop the guard → (a) red; use `preventDefault` → (b) red; drop the re-push → (e) red.
- **Lifecycle G-S83** (part 5, before G-S56), real CDP mouse, RV and LP:
  - Ctrl-hover the link, then + and the pencil.
  - Real press and release in the raw box → preview and form still open.
  - `Input.insertText`, a real click on Save → the note holds the edit, no Notice, the preview is still shown.
  - A real click outside → the preview closes.
  - Esc on a new form → the form closes (step 3).
  - The stamina modal and the conditions modal from a preview: a real click on the modal title leaves them open.
  - **Red on base:** on eaa8742a every one of these clicks closes the preview and the modal (measured here).

### B: let the preview close, keep the form open and savable
**Mechanism:** in `ReadingModeBlockHost.keepFormOpenOn()` (ReadingModeBlockHost.ts:564-571), return the registry also when the host's element was in a hover preview. `this.el.closest('.hover-popover')` still resolves on the detached subtree after `hide()`; or record it at render. Update the docs at BlockHost.ts:132-138 and FormModal.ts:553-559.

**Evidence:**
- An emulation (`protoB`: `host.keepFormOpenOn = () => registry`), RV and LP: the first click closes the preview, the form stays, typing and a real Save click are **saved**, no Notice.
- The F logs show the same behaviour with no emulation when the note is open in another pane.

**What the user sees:**
- The preview disappears on the first click.
- The form stays with no context behind it; nothing redraws on Save.
- Esc works only after the first click: the embed's unload pops the popover's scope (`u.register(() => keymap.popScope(f))`). Before any click it is still broken.

**Risks:**
- It widens SC-552's contract: forms outlive a note that is shown nowhere. Plugin unload, Save and Cancel still close them.
- If a click comes before the open-time `rebasePin` read finishes, the pin stays PARTIAL and Save is refused with a Notice. This is a narrow window (one `cachedRead`).
- **It fixes only the block edit form.** The stamina, conditions, montage, initiative and minion-pool modals still close with their view (list in §5). Extending B to them means decoupling each modal's persistence from an unloaded view, which is risky. Example: `ConditionsPanel` persists in `onClose` through `this.onChange` (conditions/panel.ts:168-182).
- Related bug 2 is not fixed either.

**Popout:** the same as today.

**Tests:**
- jest: a host in `.hover-popover`, render child unloaded, note not shown → `keepFormOpenOn` returns the registry; Save writes through the pin.
- G-S83: real click → preview gone, form open; Save lands.

### C: considered and rejected
- `preventDefault` on modal clicks: breaks Obsidian toggles (measured).
- Overriding the popover instance's `hide()` (the tests' stand-in) or `setIsFocused`:
  - private API;
  - the instance lives at a different place in RV and LP;
  - it has to be found by walking views and modes;
  - a `hide` guard also blocks legitimate dismissals.

  It is only worth considering for related bug 2.

### Recommendation
**A** (steps 1-3). Scott does **not** need to rule. A keeps what the user was looking at, fixes the click for every DSE modal opened from a preview, fixes Esc, and changes no write path. B fixes only the form and loses the preview.

## 5. Other DSE modals opened from a hover preview
All of these close with their view on the first click inside them. Two were measured in real Obsidian; the rest share the same close mechanism (view-unload registration):

| Modal | Opened by | Closes via | Lost state | Measured |
|---|---|---|---|---|
| FormModal (block edit form, hero "Edit definition") | pencil (`pipeline.ts:563`), `hero/view.ts:261` | `openFormEditor` owner callback (FormModal.ts:570) | typed edit | yes, RV and LP |
| StaminaEditModal | stamina-bar click (`stamina-bar/view.ts:158`), hero (`hero/view.ts:384`) | `openManagedModal` `owner.register` (managedModal.ts:172; stack 367:22951) | the draft in the apply/amount inputs (applied only on Apply) | **yes**, RV and LP: a click on the modal title closes it |
| ConditionsModal (initiative tracker) | `.dse-cond--add` (`initiative/view.ts:2184`) | `this.register(() => this.activeModal?.close())` (initiative/view.ts:132; stack 695:3217) | an open add or customize editor. Applied changes were already written live (SC-331) | **yes**, RV: a click on the modal title closes it |
| ConditionsModal (ds-conditions panel) | `conditions/panel.ts:168` | `openManagedModal` | the pending list is persisted in `onClose` while the panel unloads. Whether it lands was not measured | no |
| ResetEncounter / MinionStaminaPool (initiative) | `initiative/view.ts:166` `openModal` | initiative registration (view.ts:132) | the modal's inputs | no |
| Montage LogAction / AddHero / SetLimits | `montage/view.ts:361` `openTrackedModal` | `openManagedModal(modalOwner)` | the sheet entry | no |
| FreeHealConfirmModal | from StaminaEditModal (`StaminaEditModal.ts:632`) | the parent's `lifecycle` | the confirmation; the parent closes first | no |

With no click at all: the stamina modal opened by **Enter** on the bar in a preview closes by itself about 300 ms after it opens (E logs, RV and LP; related bug 2).

## 6. Authoring footguns for G-S83 (measured here)
1. **The pencil is in the chrome panel above the card.** It is click-through (`pointer-events: none`, opacity 0) until the card is `:hover`ed. Move the pointer onto the card's top edge directly under the pencil, then straight up. A diagonal path leaves the card's box first and the panel hides again. Clicking the empty spot where the panel should be lands on the preview body. That runs Obsidian's `f()`, which **turns the preview into a source editor** (`.cm-content` focused).
2. **Pick the popover instance by mode.** On a real RV hover it is `leaf.view.previewMode.hoverPopover`. In LP, or with `hover-link` and `hoverParent: leaf.view` (the G-S64 way), it is `leaf.view.hoverPopover`. To find it, take the one whose `hoverEl` contains the card.
3. **A card taller than the preview** (the initiative tracker): aim at its visible top, not its centre. A centre outside the preview makes the hover timer close it about 300 ms later.
4. **`authoringControls` must be set** (`frameworkV2.services.prefs.set('authoringControls', true)`), or there is no pencil.
5. **Every non-cancelled click in a preview runs `p()`.** It adds one window `click` listener and one keymap scope each time (Obsidian leak). After the pencil, the popover's scope sits **above** the modal's.
6. **Do not set a long `TMPDIR`** for the harness: Obsidian exits during start-up (Electron's socket path is too long). Use `DSE_CAMERA_TMP` for private scratch.
