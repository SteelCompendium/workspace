# SC-598 r1: design and real-Obsidian probe (identity D1)

## Executive summary
- **Recommended design (b), public API only, one change in `DseModal`.** Diff: `sc598-r1-proto-b.diff.txt` (`managedModal.ts`, one method plus a 3-line change in the opening-click branch). The method runs when a modal opens by a click from a preview that is not focused yet (`.is-editing` absent), in the opening click's window-bubble phase and before the 10/150 ms re-pushes are armed. It (1) `preventDefault()`s the opening click, so Obsidian's helper timer for that click does nothing. (2) It sends ONE synthetic bubbling `click` from the anchor, which carries Obsidian's `interactive-child` class for 10 ms. The helper then focuses the preview 10 ms later instead of 150, and never switches the preview into a source editor.
- **Red on e5b6f9f2, measured:** the stamina modal is opened by a real press on the "15". A second real press 35-198 ms later (title, Apply input, backdrop, CDP double-click, queued double-click, Apply write) closes the modal and the preview. That is 25 of 25 trials, RV and LP: 21 on the base bundle and 4 with the switch `off`. `T3` hides the preview 5 ms after the press.
- **Green with (b), measured:** 10 of 10 on the clean bundle (title, input, backdrop, queued double-click, Healing+Apply 15→18, RV and LP). With the variant switch, every human-shaped trial was green as well, including 4x CPU. The only reds were the residual cases in Q1 and zero-length scripted presses. In every trial there was no editor switch, Escape closed only the modal, the preview stayed with the pointer away, and an outside click closed it. G-S83 and G-S87 pass on the clean bundle (`2/2 ok`). tsc and eslint are clean.
- **Jest:** 488 of 494 pass in the 7 hover-preview suites. The 6 reds are SC-597 tests that assert "exactly one click reaches the popover container". There are now two: the key's click to the opener, then the synthetic click to the anchor. Each needs its assertion updated (the owner's call under O4). No behaviour regresses.
- **Scott decision: none needed for (b).** There are two optional questions (§5):
  - Q1: the private `setIsFocused` add-on ("bp"). It closes the one residual: a double-click whose second press is queued in full while the modal opens on a slow renderer. Measured red with (b) at 4x and 8x CPU, green with bp. O2's "stuck preview" cost does not occur with bp: measured, the outside click still closes the preview.
  - Q2: whether a double-click on an opener should keep the window open. Today the second press hits the backdrop and closes the window, in a pane as well. With (b) the preview survives but the window still closes.
- **Rejected:**
  - (a0) a synthetic click only: the preview turns into a source editor when the second click comes within 150 ms.
  - (a) the same with a focus gate and `preventDefault`: an editor switch on a queued double-click.
  - (ap)/(b1) private API alone: an editor switch, plus the SC-597 costs.
  - CSS `pointer-events:none` on the number text: per opener, and it changes styles.
- **New coverage:** G-S91 in part 5, 5 trials, about 36-40 s. Part 5 goes from about 347 s to about 390 s. Jest: 8 new cases plus the 6 SC-597 assertion updates.

## 0. Setup
- Worktree `sc598-hover-modal-fast-second-click`, dse at `e5b6f9f2`.
  - `git fetch origin`: `origin/develop` is still `e5b6f9f2`.
  - `npm ci` was run in the worktree (node_modules is gitignored). The worktree had no node_modules before.
  - `git status --porcelain` was empty in dse and in the worktree superproject, before and after. Nothing was edited or committed there.
- Scratch is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc598-r1-D1/`. Each copy is `git archive e5b6f9f2 | tar -x`, with node_modules symlinked, built with `node esbuild.config.mjs production`:
  - `dse-base`: unchanged.
  - `dse-proto`: variants behind `window.__sc598`. Diff: `sc598-r1-proto-variants.diff.txt`. The variants:
    - `off`: base;
    - `a0`: a synthetic click on the embed container, non-bubbling, gated on focus being on a button or input;
    - `a`: a0 plus `preventDefault` on the opening click;
    - `ap`: a plus private `setIsFocused(true)` at open;
    - `b`: the design;
    - `bp`: b plus private `setIsFocused(true)` at open;
    - `a2`: a, and also for an open outside a click.
  - `dse-clean`: (b) in its final form, with no switch. Diff: `sc598-r1-proto-b.diff.txt`.
- Obsidian 1.15.1, app.js extracted from `~/.config/obsidian/obsidian-1.15.1.asar` (SC-595's extractor). Excerpts: `sc598-r1-obsidian-excerpts.txt`.
- **Probe harness:** a scratch copy of the worktree's `visual-harness/obsidian-lifecycle.mjs` with one scenario injected, `SC598-PROBE`.
  - Files: `sc598-r1-make-probe.py.txt`, `sc598-r1-probe-scenario.js.txt`, `sc598-r1-run-probe.sh.txt`, `sc598-r1-summarize.py.txt`. It runs with `DSE_LIFECYCLE_BUNDLE=<copy>` and reuses `gs83Kit`: a real CDP mouse, a real Ctrl-hover, real keys.
  - Instrumentation: the popover instance's `hide()` and `setIsFocused()` are wrapped (each instance gets an id, plus the event and the caller frame). A MutationObserver records the modal container. A window-capture log records `mousedown`/`click`/`dblclick`/`keydown` with `isTrusted`, `detail`, `bubbles` and the target.
  - Trial spec: `variant:mode:opener:target:delayMs[:cpuRate]`. In-page gaps are the ones reported: `gap(click2-click1)`.
  - Targets:
    - `dbl`: CDP `clickCount:2` with presses of zero length.
    - `dblh`: a human-shaped double-click, each press held 70 ms.
    - `dblq`: the second press is sent while the first click is still being handled, so it queues behind the modal's opening.
    - `dblqq`: the whole second press (down, 70 ms, up) queues.
- Load average was 0.6-3 throughout.

## 1. Mechanism (pinned)
**`T3`** (app.js:509, char 105632, verbatim):
```js
T3=o=>{for(let i of S3)i.hide();let{targetNode:t}=o,e=[];for(let i of wf)!i.isFocused&&!i.hoverEl.contains(t)&&!i.childHovers.some(r=>r.hoverEl.contains(t))&&e.push(i);window.setTimeout(()=>{e.forEach(i=>i.hide())},5)}
```
- It hides every showing popover (`S3`) at once. It hides every shown popover (`wf`) that meets three conditions:
  - it is not `isFocused`;
  - its `hoverEl` does not contain the click's `targetNode` (= `event.target`, an Obsidian getter on `UIEvent.prototype`);
  - none of its `childHovers` (shown popovers whose `targetEl` lies inside it) contains the target.

  It collects them synchronously and hides them **5 ms later**, even if `isFocused` turns true in between (measured: `HIDE … foc=True from 105839`).
- **No** `defaultPrevented` check. No modal-container check. The only public-DOM way to pass is containment in `hoverEl`, and the modal is in `body`.
- **Registration:** `window` **capture** `click` and `contextmenu`, by `nne()`. `nne()` runs when a popover is constructed or shown and nothing is registered yet. It is removed by the 500 ms `oke()` interval once `wf` is empty. So T3 is re-registered for each new hover session, after the plugin loaded. A DSE window-capture listener installed at plugin load would run before it, but nothing public it could do there makes T3 skip the popover. `stopPropagation` there would also kill the click for its real target.
- **`isFocused`** is set only by `p()` in `Cf.create`. `p()` runs from the click-to-edit helper `zh` (app.js:241), a `click` listener on the embed container (`hoverEl > .markdown-embed`).
  - **One timer variable, never cleared by a new click.** `e=window.setTimeout(()=>{i.defaultPrevented||(i.preventDefault(),t(i))}, s?150:10)`. Here `s` = the click's `clientX/Y` fall in a rect of a direct text child of `targetNode`.
  - Early returns: `defaultPrevented`, `detail>1`, `shiftKey`, a selection in the container, focus inside the container. A `mousedown` with `detail>1` clears the timer.
- **The editor switch.** The `Cf` callback runs `p()` and then `f()` (`showEditor`: the preview turns into a source editor), unless one of these holds:
  - `doc.activeElement.closest('button, input')`;
  - `Sn(target)`;
  - `target.closest('button, input, .collapse-indicator, .interactive-child')`.

  It reads focus when the timer fires, not when the click happens.

**Race confirmed on e5b6f9f2** (`sc598-r1-probe-base.log`, `sc598-r1-probe-base2.log`). Opened by a real press on the "15" (`elementFromPoint` = `.dse-stamina__ccur`, which holds the text node), then:

| Second press | RV | LP |
|---|---|---|
| title, gap 70-139 ms | both closed (×4) | both closed (×2) |
| Apply input, gap 35-124 ms | both closed (×2) | both closed (×2) |
| backdrop, gap 39-77 ms | both closed (×2) | both closed (×2) |
| CDP `clickCount:2` (lands on `.modal-bg`, `detail 2`), gap 38-111 ms | both closed (×2) | both closed (×1) |
| queued double-click (`dblq`), 1x and 4x, gap 111-236 ms | both closed (×3) | both closed (×1) |
| fully queued (`dblqq`), 1x and 4x | both closed | — |
| Apply write (input then Healing+Apply) | never reached: both closed at the first click | same |

- Every one: `HIDE[… ev=None foc=False app.js:509:105839]` 5-8 ms after the second click, the modal removed 40-60 ms later (the preview's unload closes it, SC-552), and `setIsFocused` from the 150 ms timer fires **after** the hide.
- Controls on base:
  - Opened by a press on the bar but not on its text (`.dse-stamina__cnums`, the 10 ms path), then the title 68 ms later: fine.
  - Keyboard (G-S87 path): fine.
  - In a pane, no preview (`panetext`), title 58 ms later: the modal stays.
- **What a double-click's second press hits:** `.modal-bg` (the backdrop) in every trial, RV and LP. The modal is centred and the bar is in the preview. So even with no preview, a double-click on the numbers **opens the window and closes it at once** (`panetext:dbl`, RV and LP: `modal=n`).
- **Side effect seen on base:** when T3 hides a popover before the helper fires, `p()` still runs on the hidden popover. It leaks a window click listener and a keymap scope on an unloaded embed. Every later click then calls `hide()` on the dead instance (the stream of `HIDE[idN ev=click foc=True 193553]` in later trials). This is Obsidian's leak; the fix avoids it for DSE modals.

## 2. Survey: openers whose click takes the helper's 150 ms path
The rule (from `zh`): the press lands on a **text node that is a direct child of the element under the pointer**. That is any visible text: number readouts, labelled buttons (`iconButton` text sits in `.dse-btn__text`, which holds the node), cell text. Icon-only buttons and the bar's empty areas take 10 ms. The fix is in `DseModal`, so it covers every row below regardless of opener.

| Opener | file:line | Usually hit | Modal | In a preview |
|---|---|---|---|---|
| Stamina bar numbers ("15", "/20") | `framework/kit/StaminaBarPanel.ts:150` (click), text `:314` `.dse-stamina__ccur` | **text: 150 ms** (measured) | StaminaEditModal (`stamina-bar/view.ts:159`) | yes (the ticket) |
| Stamina bar, elsewhere on the bar | same | not text: 10 ms (measured, `.dse-stamina__cnums`) | same | yes, no bug |
| Hero sheet stamina bar | `hero/view.ts:331-335` → `openStaminaModal` `:369`/`:384` | numbers: 150 ms | StaminaEditModal | yes |
| Initiative hero / detail numeric stamina control and row bar | `initiative/view.ts:1547-1558`, `:1903-1914` | number text: 150 ms | StaminaEditModal / MinionStaminaPoolModal (`:1532`, `:1875`) | yes |
| Initiative grid cell (**dblclick**) | `initiative/view.ts:1757` | text or not | StaminaEditModal / pool | yes. **Not affected (measured):** the first click's helper focuses the preview (+37 to +71 ms) before the `dblclick` opens the modal |
| Montage board cell (recorded / past-empty) | `montage/BoardView.ts:376-377`, `:398` | skill text `.dse-mt__cell-skill` `:423`: 150 ms; glyph or empty: 10 ms | LogActionModal (`montage/view.ts:336` → `:363`, anchored) | yes |
| Montage "Log an action…" (labelled button) | `montage/view.ts:255` | `.dse-btn__text`: 150 ms | LogActionModal | yes |
| Initiative "+" condition, the pencil, conditions-panel "+" | `initiative/view.ts:2176-2186`, `pipeline.ts:561-563`, `conditions/panel.ts:168` | icon only: 10 ms | ConditionsModal / FormModal | yes, no bug at human speed |
| Keyboard openers (SC-597 `el.click()`) | `StaminaBarPanel.ts:199`, `BoardView.ts:392` | no coordinates: 10 ms | — | yes, no bug |

## 3. Candidates (real Obsidian 1.15.1, RV and LP)
In every trial: hover, rest on the card, open with a real press, a second press after the given gap, then state at +700 ms. Then Escape, or Healing 3 + Apply. Then the pointer away for 1.2 s, then a real click on the view header. "editor" means a visible `.cm-editor` / `.markdown-source-view` inside the popover: the preview turned into a source editor.

### (a0) a synthetic click on the embed container (non-bubbling, focus gate), nothing else (`sc598-r1-probe-a0.log`; at that time the switch value was named `a`)
- T3 is beaten: the modal and preview stay after a title or input click at gaps of 35-158 ms, RV and LP. `setIsFocused` comes about 10 ms after the synthetic click.
- **Regression: the preview turns into a source editor** (`editor=Y` at 700 ms) after a second click on the **title** or the **backdrop**, or a double-click, RV and LP. The opening click's own 150 ms timer still runs `p()`, and its editor check reads the focus. By then the second click has moved the focus off the Apply input to `body`. Input clicks keep the focus on an input, so they were fine.
- The base never shows this only because T3 closes everything first. **Rejected.**

### (a) a0 plus `preventDefault()` on the opening click (`sc598-r1-probe-a-ap.log`; the `a:` rows of `sc598-r1-probe-b.log`)
- Title, input, backdrop, `dblh` and Apply are green, RV and LP, including 4x CPU.
- `dbl:0` (zero-length CDP presses, mousedown 9 ms after the synthetic click): RV both closed; LP `editor=Y`.
- **`dblq` (the second press queued during the opening): `editor=Y`, RV, 1x and 4x** (`sc598-r1-probe-b.log`, rows `a:`). The queued mousedown is handled before the 10 ms timer and moves the focus. The gate's focus test, read 10 ms later, then fails.
- **Rejected:** a realistic fast double-click (the second press arrives while the modal is still opening) ends with the preview in source mode.

### (b) RECOMMENDED: `preventDefault` plus ONE bubbling synthetic click from the anchor, the anchor marked `interactive-child` for 10 ms, no focus gate (`sc598-r1-probe-b.log`, `sc598-r1-probe-b-bp-queued.log`, clean `sc598-r1-probe-clean.log`)
- `interactive-child` is Obsidian's own marker for "an interactive widget inside an embed or editor". The click-to-edit check, the Live Preview widget click and Canvas double-click all test for it. On the synthetic click's target it makes the editor check say no whatever has the focus. The class comes off from a timer armed after the helper's, so it is never seen by any real click.

| Second press (in-page gap) | RV | LP |
|---|---|---|
| title, 51-97 ms (+4x CPU: 201 ms) | modal and preview open; Escape closed only the modal; rest: shown; outside: closed | same |
| Apply input, 66-128 ms | same | same |
| backdrop, 33-97 ms | modal closed (backdrop), **preview stays** | same |
| `dbl:40` (CDP, 81 ms) | modal closed, preview stays | — |
| `dblq` queued, 1x / 4x (101-284 ms) | preview stays, no editor | same |
| `dblqq` fully queued, 1x (72-110 ms) | preview stays | — |
| Apply write (input at 66-128 ms, then Healing 3 + Apply) | **15→18 saved, no Notice**, preview shown | same |
| bar (10 ms opener), keyboard (G-S87 path), pane control (no preview) | unchanged: green, one modal, LP cursor 0:0 | same |
| **`dbl:0`** (zero-length CDP presses; down+up 9-16 ms after the synthetic click) | **both closed** (T3 before the 10 ms timer) | green |
| **`dblqq` at 4x / 8x CPU** (render 100-180 ms, the second down+up queued in full; RV ×3, one of them sent 40 ms later) | **both closed** | **both closed** (4x) |

- `editor=n` in every (b) trial. The class is gone after 10 ms (removed by a timer armed after the helper's; seen `cls … interactive-child` only in the dispatch log).
- **What's left:** a second press whose release is handled before the helper's 10 ms timer. A human press takes about 60+ ms from down to up. So that needs the modal's opening to take longer than the double-click itself: measured only with 4x/8x CPU slow-down, or with zero-length scripted presses. It leaves exactly today's behaviour (both close). Nothing gets worse.

### (bp) (b) plus private `setIsFocused(true)` on the popover at open (`sc598-r1-probe-b-bp-queued.log`)
- Green where (b) is red: `dblqq` at 4x (RV, LP) and 8x (RV). Also green on title and input, RV and LP.
- **O2's costs, answered with evidence:**
  - "Stuck after close": **does not occur.** The synthetic click still runs Obsidian's own `p()`, so the popover's window click listener is installed, `.is-editing` and the scope are set, and `afterOutside` = closed in every bp trial.
  - "Instance hunt across modes" and "nested previews not covered": still true. bp hunts `view` / `previewMode` / `editMode` / `currentMode` `.hoverPopover` matched on `hoverEl` (found in 11/11 ap/bp trials). When the hunt fails, bp degrades to (b), not to a bug.
  - "Private, fragile across versions": still true. Use an optional call (`hp?.setIsFocused?.(true)`).
- **Not recommended by default.** It is an optional hardening for slow machines (§5 Q1).

### (ap) (a) plus private `setIsFocused` (the shape SC-597 rejected, made safe)
- T3 is beaten, but there is an **editor switch on title:0 and `dblq`**: the private flag does nothing for the editor check. Rejected.

### Not built
- CSS `pointer-events:none` on the number text (the 10 ms path for the bar only): per opener (montage cells, initiative numbers and labelled buttons all hit text), and it changes `styles.css`, which re-runs shots, freeze and parity.
- A DSE window-capture listener before T3: there is no public action that makes T3 skip the popover. `stopImmediatePropagation` would swallow the click for its real target.
- A "shield" `HoverPopover` (public class) whose `childHovers` contains the modal: the shield's `hoverEl` would have to contain the modal container, and `hide()` detaches `hoverEl`.

## 4. Recommendation
**(b)**, `src/framework/kit/managedModal.ts` only (text in `sc598-r1-proto-b.diff.txt`):
- `:250-252` (`onWindowBubble`): `if (evt !== opening) return; this.focusHoverPreviewNow(opening, win); arm();`. The call must stay **before** `arm()`: the helper's 10 ms timer, armed inside the dispatch, must precede the 10 ms re-push.
- A new private method after `keepHoverPreviewAlive`, with these guards:
  - an anchor exists, and `anchor.closest('.hover-popover')` lacks `.is-editing` (an already-focused preview: no change at all);
  - then `opening.preventDefault()`;
  - add `interactive-child` to the anchor only if it was absent;
  - dispatch `new MouseEvent('click', { bubbles: true, cancelable: true, view: win })` on the anchor (for popout safety, build it with the anchor's window's `MouseEvent`);
  - then `win.setTimeout(() => anchor.classList.remove('interactive-child'), 10)`, only if it was added.
- The non-click branch (`else arm()`) is unchanged. Variant a2 found no failing case there, and SC-597 (c) showed the risk of synthetic clicks outside a click.
- No change to the opener files, `HOVER_HELPER_DELAYS_MS`, the document guard or SC-597's `el.click()`.
- Extend the `keepHoverPreviewAlive` doc comment with a point 3, or add a pointer to the new method.
- Docs (implementer):
  - dse-verify "Hover preview modals": a new authoring footgun (12). A preview only becomes focused through the helper's timer, so a modal opened by a click from an unfocused preview default-prevents the opening click and sends one synthetic click from the anchor marked `interactive-child`. A test counting clicks through the preview sees two.
  - Add G-S91 to the part-5 list: 57 scenarios.
  - CHANGELOG `## Unreleased`: "A second click in a window opened from a hover preview, however soon after the first (a quick double-click on the stamina bar's numbers), no longer closes the preview."
- **What the user sees:** in every measured human-shaped case, a window opened from a preview survives a second click inside it at any delay. A click on the backdrop closes only the window, as SC-595 landed. The preview never switches to source. After the window closes the preview stays until the next outside click. Escape and Apply work as before. A double-click on the numbers opens the window and the backdrop closes it again, as in a pane; the preview now stays.

## 5. Questions for the owner / Scott (optional; (b) needs neither)
- **Q1 (residual, slow machines):** add bp's private `setIsFocused(true)` on top of (b)?
  - Benefit: a fast double-click survives even when the modal takes more than about 100 ms to open (measured at 4x and 8x CPU slow-down).
  - Cost: private API plus an instance hunt, degrading to (b) when the hunt fails.
  - Not "stuck": measured.
- **Q2 (double-click UX, all DseModals, panes too):** should the second press of a double-click on an opener (it lands on the backdrop, `detail 2`) leave the window open? Today it closes the window in a pane as well; with (b) the preview survives but the window closes.
  - A guard would ignore a backdrop click with `detail > 1` within about 500 ms of a click-open.
  - Obsidian wires the backdrop as `bgEl click → onClickOutside(evt)`, which honours `defaultPrevented`, on Windows and Linux. **On macOS desktop a click with less than 5 px of movement calls `close()` directly** (app.js:245; excerpt in `sc598-r1-obsidian-excerpts.txt`). So it would need a `close()` / `canDismiss()` override.
  - Not designed here. Suggest a Backlog ticket if wanted.

## 6. Test plan
### jest (jsdom)
**Popover stand-in** (a helper in `test/dom/kit/managedModal.test.ts`, reusable from `stamina-bar.test.ts`). The DOM is `div.popover.hover-popover > div.markdown-embed > anchor > opener > span(text)`, plus `FakeKeymap`. Write Obsidian's delays as **literals 10 / 150**, never from `HOVER_HELPER_DELAYS_MS`. Use fake timers.
- **T3:** `window.addEventListener('click', e => { if (!pop.isFocused && !pop.contains(e.target)) setTimeout(() => pop.hidden = true, 5); }, { capture: true })`, registered before the open, as Obsidian registers it at hover time.
- **Helper:** `embed.addEventListener('click', e => { if (e.defaultPrevented || e.detail > 1) return; setTimeout(() => { if (e.defaultPrevented) return; e.preventDefault(); pop.isFocused = true; pop.classList.add('is-editing'); keymap.pushScope(popScope); if (!(document.activeElement?.closest('button, input') || e.target.closest('button, input, .interactive-child'))) pop.editor = true; }, e.clientX || e.clientY ? 150 : 10); })`. Non-zero coordinates stand for "on text".
- Open by dispatching `new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 })` on the text span. The opener's click listener calls `openManagedModal(…, anchor)`.

Cases (title text must not contain a bracketed ticket id):
1. A click on the modal title 20 ms after the open, then advance to 200: `pop.hidden` false, modal open.
2. The same at 100 ms (between the two helper delays).
3. Editor guard: 20 ms after the open, `document.body.focus()` (what a title or backdrop press does) and a title click, advance to 200: `pop.editor` false.
4. Scope order: 20 ms after the open, the keymap top is the modal's scope; after `modal.close()` it is `popScope`. A 200 ms-only check would miss this; see SC-597 K6.
5. Clicks reaching `embed`: exactly two. `[0]` is the opening click (target the span, `defaultPrevented` true); `[1]` targets the anchor, `bubbles` true, `clientX` 0, and the anchor has `interactive-child` during it. One `.modal-container`.
6. Preview already `.is-editing`: exactly one click reaches `embed`, and the opening click is not default-prevented.
7. Outside a preview (no `.hover-popover`): no synthetic click, the opening click not default-prevented, one modal.
8. 20 ms after the open the anchor has no `interactive-child`. An anchor that had the class before the open still has it after 20 ms.
9. Driven opener, `stamina-bar.test.ts`: a click with coordinates on `.dse-stamina__ccur` in a preview, then case 1 and case 3.

**Update the 6 SC-597 tests** that now see two clicks (`stamina-bar.test.ts:786` "Enter"/" ", and the four `montage.test.ts` "sends one click through the preview to the cell" cases). Assert one click whose target is the opener, plus the synthetic one whose target is the anchor. Measured on the clean bundle: those 6 fail, the other 488 pass (`sc598-r1-jest-clean.log`).

| Mutant | Killed by |
|---|---|
| M1: no change (base) | 1, 2, 9 |
| M2: no `preventDefault` (variant a0) | 3, 5 (`defaultPrevented`) |
| M3: synthetic click not bubbling, or dispatched on the anchor's descendant opener | 1 (never reaches `embed`) / 5 (a second modal) |
| M4: no `interactive-child`, or its removal timer armed BEFORE the dispatch | 3 |
| M5: `focusHoverPreviewNow` called after `arm()` | 4 |
| M6: no `.is-editing` check | 6 |
| M7: `preventDefault` outside a preview | 7 |
| M8: class never removed | 8 |
| M9: synthetic click carries the opening click's coordinates | 1 (the stand-in waits 150) |
| M10: `HOVER_HELPER_DELAYS_MS = [10]` (SC-595's M16) | still killed by SC-595's literal tests (unchanged) |

### Lifecycle: new G-S91 (part 5, after G-S87, before G-S56)
- Reuse `gs83Kit`, fixtures `gs83-stam*`, and `stamtext`'s press point and its `onText` assertion (G-S83 footgun 8).
- Trials:
  - RV `title` (second press at once after the opening release: in-page gap 50-100 ms);
  - RV `dblq` (the second press sent 10 ms after the release without awaiting it, held 70 ms);
  - RV `apply` (the input at once, then Healing 3 + Apply → `current_stamina: 18`, no Notice);
  - LP `title`;
  - LP `dblq`.
- Assert at +700 ms:
  - `title`: popover and modal open;
  - `dblq`: popover shown;
  - in every trial: **no visible `.cm-editor` in the popover**.
  Then:
  - Escape closes only the modal (title trials);
  - the pointer away for 1.2 s: preview shown;
  - a real outside click: preview closed;
  - no page error.
- Record `gap` and the hit (`"15" on dse-stamina__ccur`) in the outcome line.
- **Red on e5b6f9f2: measured** with the same probe trials, all 10 red (`sc598-r1-probe-base2.log`). (a0) is killed by the editor assertion on `title` (measured `editor=Y`). (a) is killed by it on `dblq`, RV and LP (measured).
- **Green: measured** on the clean bundle, 10/10 (`sc598-r1-probe-clean.log`).
- **Time:** trials measured at 6.5-7.9 s each (title about 7.1 s, dblq about 6.7 s, apply about 7.9 s). 5 trials plus set-up come to **about 36-40 s**. Part 5 goes from about 347-351 s to **about 390 s** (target 420 s or less). No G-S64 phases.
- Do not assert the `dblqq` 4x residual: it is red by design with (b).

## 7. Regression evidence on the clean (b) bundle
- G-S83 + G-S87, the worktree's own harness with `DSE_LIFECYCLE_BUNDLE=dse-clean`: **`done: 2/2 ok, 0 failed`**, 108 s (`sc598-r1-lifecycle-clean-GS83-GS87.log`). This covers:
  - SC-595's form (textarea focus, pencil): no editor switch, Save lands;
  - Escape;
  - the stamtext 150 ms Escape;
  - free-heal Confirm;
  - Conditions;
  - SC-597's keyboard trials.
- tsc rc 0, eslint `managedModal.ts` rc 0. jest, 7 hover-preview suites: 488/494, with the 6 SC-597 one-click assertions above (`sc598-r1-jest-clean.log`).
- Not run (design round): full jest, full lifecycle, e2e, shots. `styles.css` is untouched by (b), so shots, freeze and parity carry.

## 8. Not probed
- Popout windows (as SC-595 and SC-597).
- Nested previews: a preview inside a preview. By construction (b) acts on the innermost `.hover-popover` around the anchor. The outer one survives through `childHovers`.
- Montage, initiative and hero openers in a preview: they share the `DseModal` path. Only the stamina bar was driven.

Follow-ups:
- (Q2 above) A double-click on any DseModal opener opens and immediately closes the window: the second press lands on the backdrop. This happens in panes too (measured `panetext:dbl`, RV and LP). It is a UX decision, and the macOS backdrop path calls `close()` directly.
- (Q1 above) Residual of (b): a double-click queued in full while the modal is still opening on a slow renderer (measured at 4x/8x CPU) still closes both. Only private `setIsFocused` closes it (bp).
- (info, Obsidian) When T3 hides a preview before its helper timer fires, `p()` still runs on the hidden popover. It leaks a window click listener and a keymap scope pushed onto the main window's stack. The leaked listener then calls `hide()` on the dead instance on every later click (seen on base). (b) avoids this for DSE modals; other paths may still trigger it.
- (low, theoretical, not reproduced) Initiative grid cells open on `dblclick`. If the first click lands on text (150 ms) and the second mousedown (`detail 2`) comes within 150 ms, the helper's timer is cleared, `p()` never runs, and the preview stays unfocused while the modal is open. The `dblclick` open goes through `arm()` at once, not (b). Measured cases took the 10 ms path and were fine.
