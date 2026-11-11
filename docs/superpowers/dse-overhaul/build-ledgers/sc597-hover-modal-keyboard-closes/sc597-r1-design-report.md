# SC-597 r1 — design + real-Obsidian probe (identity D1)

## Executive summary
- **Recommended design: (a), per-opener synthetic click.** Enter/Space on a non-`<button>` opener calls `el.click()` on the element the mouse clicks, instead of calling the opener directly. Two call sites: `StaminaBarPanel.ts:199` (`open()` → `bar.click()`) and `montage/BoardView.ts:381` (`openThisCell()` → `cell.click()`). The diff is `sc597-r1-proto-A.diff.txt`. No `DseModal` change, and no private Obsidian API.
- **Scott decision: no.** Nothing is visible to the user except the fix. In every measured step the keyboard path now does exactly what the mouse path does (O1).
- **Red on 94133a5a (measured, Obsidian 1.15.1):** Enter on the stamina bar (RV and LP), Space (RV) and Enter on a montage cell (RV): the modal opens 24-79 ms after the key. The popover's `hide()` follows about 300 ms later from the hover timer (app.js:509:107969, event null, `isFocused` false), and the modal is detached 54-66 ms after that. At 1.5 s neither is shown. Mouse controls on the same bundle stay open.
- **Green with the prototype (the clean (a) bundle):** all 5 keyboard trials (stamina Enter RV/LP, Space RV, montage Enter RV/LP) pass every step:
  - at 1.5 s: preview and modal open, `isFocused` true, `.is-editing` set;
  - a real click on the title keeps both;
  - Healing 3 + Apply writes 15→18, with no Notice and the preview still shown;
  - Escape 450 ms after a keyboard reopen closes only the modal;
  - with the pointer away for 1.2 s the preview stays;
  - a real click outside closes it through the popover's own click listener (app.js:509:193553).

  The mouse control, the pending-write pencil, and Enter on the bar in a note open in the pane (not a preview, RV and LP) are unchanged.
- **Rejected:**
  - (c) DseModal-level synthetic click on the anchor. Measured: when the block edit form opens outside a click, the preview turns into a **source editor** and takes the focus from the form.
  - (b1) private `setIsFocused(true)`. Measured: after the modal closes, a real click outside **no longer closes the preview** (it stays stuck).
  - (b1r) the same, with a reset on close. It works, but it is private API, needs an instance hunt, and closes through a different Obsidian path.
- **Test cost:** a new lifecycle scenario **G-S87** in part 5, before G-S56: 4 trials, about 40 s (part 5 goes from about 304 s to about 345 s). G-S64 is untouched. jest: 3 + 3 tests in `stamina-bar.test.ts` / `montage.test.ts`, plus 1 Escape-order test. The existing 366 tests in the 8 touched suites stay green on the prototype.

## 0. Setup
- Worktree `sc597-hover-modal-keyboard-closes`, dse at `94133a5a`. `git fetch origin`: `origin/develop` is still `94133a5a`.
- `npm ci` was run in the worktree (node_modules is gitignored). `git status --porcelain` was empty before and after, in the worktree's dse and in its superproject. Nothing was committed or edited in the worktree.
- **Scratch copies** (all made with `git archive 94133a5a | tar -x`, with node_modules symlinked):
  - `dse-base`: the base, unchanged.
  - `dse-proto`: candidates a / b1 / b1r / c behind a runtime switch, `window.__sc597`. Unset, it behaves as the base. Diff: `sc597-r1-proto-variants.diff.txt`. This copy also moves the initial focus above `keepHoverPreviewAlive` in `open()`, which (c) needs.
  - `dse-protoA`: the recommended (a) in its final form, with no switch. Diff: `sc597-r1-proto-A.diff.txt`.
  - Each was built with `node esbuild.config.mjs production`.
- **Probe harness:** a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with one scenario, `SC597-PROBE`, injected (`sc597-r1-make-probe.py.txt`, `sc597-r1-probe-scenario.js.txt`, `sc597-r1-run-probe.sh.txt`, run with `DSE_LIFECYCLE_BUNDLE=<copy>`).
  - It reuses G-S83's `gs83Kit`: a real CDP mouse for hover and every click, and CDP `Input.dispatchKeyEvent` for keys. The opener is focused with a script `.focus()`, which SC-595 r1 measured as inert.
  - The pointer rests on the card in the preview before the key is pressed.
  - Instrumentation: the popover instance's `hide()` is wrapped (event, caller frames), a MutationObserver records modal add/remove, and a window-capture key/click log records `isTrusted` and `detail`.
- **Logs** (each `-raw.log` has a summary `.log` next to it):
  - `sc597-r1-probe-base*`: base bundle, keyboard and mouse controls.
  - `sc597-r1-probe-variants*`: a / c / b1 / b1r on stamina Enter RV and LP and montage Enter RV, plus Space and mouse controls (19 trials).
  - `sc597-r1-probe-formpend-fast*`: the block edit form opened from the pencil **during a pending keyboard write**, so the form opens after the write, outside the click. This is the (c) discriminator.
  - `sc597-r1-probe-formpend-main*`: Enter on the bar in a note open in the pane (RV and LP), base against (a).
    - Its `form-pend-enter` trials are **inconclusive, ignore them**: a CDP `keyDown` with no `text` does not activate a real `<button>` (no keypress), so the form never opened.
    - `form-pend-mouse` flushed before the click.
  - `sc597-r1-probe-protoA*`: the clean (a) bundle, 9 trials.
  - `sc597-r1-jest-protoA.log`: tsc 0, eslint 0 on the two files, jest 8 suites, 366/366.
- Load was 1-8 throughout.

## 1. Survey: openers that can open a DSE modal from a hover preview with no native click reaching the embed

Mechanism (Obsidian 1.15.1, app.js; excerpt in `sc595-r1-obsidian-excerpts.txt`):
- The popover's focus step `p()` (`setIsFocused(true)`, `.is-editing`, the pushed scope, the window click listener) runs only from the click-to-edit helper `zh`, which is a `click` listener on the embed container.
- `zh` returns early in four cases:
  - `defaultPrevented`;
  - `detail > 1`;
  - a non-collapsed selection in the preview;
  - **`document.activeElement` is inside the container**.
- Otherwise it arms a timer of 10 ms, or 150 ms when `clientX/clientY` fall on a direct text child of the target, and runs `p()` from it.
- In the markdown-embed branch, the same callback switches the preview into a source editor (`f()`). It does not when `activeElement.closest('button, input')`, when the target is inside `button, input, .collapse-indicator, .interactive-child`, or for `Sn(target)`.

| Opener | file:line | Element | Opens | In a preview | No native click? |
|---|---|---|---|---|---|
| Stamina bar, Enter/Space | `framework/kit/StaminaBarPanel.ts:193-200` (calls `open()` at :199; wired at :159) | `div.dse-stamina`, `role=group`, `tabindex=0` | StaminaEditModal (`stamina-bar/view.ts:153-166`; hero sheet bar `hero/view.ts:332-335` → `openStaminaModal` :369-404) | yes | **yes: the bug** (measured: Enter RV/LP, Space RV) |
| Montage board cell, Enter/Space | `elements/montage/BoardView.ts:378-382` (`openThisCell()` at :381) | `div.dse-mt__cell`, `role=button`, `tabindex=0` | LogActionModal (`montage/view.ts:335` → `openTrackedModal` :361-363, anchored) | yes | **yes: the same bug** (measured: Enter RV, sheet gone at 482 ms) |
| Initiative row stamina bar | `initiative/view.ts:1205-1214` | bar with `keyboard: false` | — (the row's real numeric `<button>` is the keyboard route) | yes | no keyboard handler |
| Initiative title, Enter/Space | `initiative/view.ts:458-463` | `role=button` span | inline title input, **not a modal** | yes | n/a |
| Undo toast, Enter/Space | `framework/kit/undoNotice.ts:77-79` | `role=button` in an Obsidian Notice (body) | no modal (runs `onUndo`) | not in a preview | n/a |
| Recoveries pips, value keys | `framework/kit/RecoveriesStrip.ts:269-285` | `tabindex=0` div | the Recoveries popover, built **inside the card** (`rootEl.createDiv`, :200), so inside `hoverEl` | yes | not a modal; stays inside the preview |
| Track / tabs / power-roll rows / stepper / Conditions add input / initiative Malice inputs | `track.ts:134`, `tabs.ts:118`, `powerRollPanel.ts:199`, `stepper.ts:251`, `ConditionsModal.ts:680`, `initiative/view.ts:436,689` | — | no modal (selection, commit, submit) | — | n/a |
| Real `<button>` openers: pencil (`pipeline.ts:561-563`), hero "Edit definition" (`hero/view.ts:260`), montage config, conditions +, initiative buttons, free-heal | — | `<button>` | the various DseModals | yes | Enter/Space dispatch a native `click` (detail 0). Every DseModal moves focus out of the preview synchronously in `open()` (`managedModal.ts:180`), so `zh` runs `p()`. Confirmed in SC-595 r1 (`kbd-open`); not re-measured. |
| Pencil while a write is pending (`view.openAfterPendingWrite`, `framework/view.ts:327-338`): the form opens after the write, outside the click | `pipeline.ts:563`, `hero/view.ts:260` | `<button>` | FormModal | yes | **Not affected (measured):** the pencil's own click still reaches `zh` and runs `p()` (`formpend-fast` base: `isFocused` true, form open at 1.5 s, Escape closes it) |
| Commands / hotkeys | `main.ts:547,587,599`, `sidebar/registration.ts:92,105`, `authoring/insert.ts:32`, `compendiumInsert.ts:355,368` | — | `CompendiumSearchModal` (a SuggestModal, not a DseModal) on the **active editor**; the others open no modal | only once the preview has become an editor, so `p()` has already run | not the SC-597 shape; see Follow-ups |
| `focusin` handlers | `chrome/focusHandoff.ts:149`, `montage/BoardView.ts:181` | — | no modal (focus guard, scroll into view) | — | n/a |

**There are exactly two SC-597 openers: the stamina bar (standalone and in the hero sheet) and the montage cell.**

## 2. Candidates, measured (Obsidian 1.15.1, RV and LP)

Each trial runs these steps:
1. Hover the link.
2. Rest the pointer on the card.
3. Focus the opener with a script.
4. Press the key.
5. Wait 1.5 s.
6. Make a real click on the modal title.
7. Stamina only: Healing 3, then a real click on Apply, then reopen the same way and press Escape 450 ms later. Montage only: press Escape.
8. Move the pointer away and wait 1.2 s.
9. Make a real click on the view header.

### Base 94133a5a (red) — `sc597-r1-probe-base*`
| Trial | modal+ | HIDE (timer 509:107969, event null, isFocused false) | modal− | at 1.5 s |
|---|---|---|---|---|
| stamina Enter RV (times from the probe's t0; key at 38 ms) | 76 ms | 377 | 443 | preview gone, modal gone |
| stamina Enter LP | 77 | 377 | 439 | gone, gone |
| stamina Space RV | 35 | 336 | 394 | gone, gone |
| montage Enter RV | 104 | 428 | 482 | gone, gone |
| control: stamina mouse RV | 503 | (only on the final outside click, 193553) | — | open, open; Apply 15→18; Escape OK; after rest the preview stays; outside click closes it |
| control: montage mouse RV | 441 | same | — | same |

The hover timer was the only thing that closed the preview on the keyboard path. No `T3` and no click listener were involved.

### (a) per-opener `el.click()` — `sc597-r1-probe-variants*` (switch) and `sc597-r1-probe-protoA*` (final form)
- **Does `p()` run for an untrusted click? Yes.** The log shows `click trusted=False detail=0 target=dse-stamina` / `dse-mt__cell` at the key's own millisecond, the modal at +27-75 ms, and at 120 ms `isFocused` true and `.is-editing` set.
  - The final outside click hides the preview from `p()`'s window click listener (509:193553, `isFocused` true), so that listener was installed.
  - Escape closes the modal, so the scope order is right (see the next point).
- **Scope order.** The opening event is the synthetic click, so `DseModal`'s existing "opening click" branch (`managedModal.ts:247-253`) arms the 10 and 150 ms re-pushes from that click's window bubble phase. That is after `zh` armed its own timer at the container: the same order as a mouse click.
  - `el.click()` has `clientX/clientY` 0, so `zh`'s text test never matches and it always takes the 10 ms path (read from `zh`; it does not matter, because SC-595 arms both delays).
  - Measured: Escape 450 ms after a keyboard reopen closed the modal and left the preview, in every stamina trial of (a): 3 with the switch, 3 with the final bundle. In every montage trial, Escape closed the sheet and left the preview: 2 with the switch, 2 with the final bundle.
- **Source-editor switch:** never (`editor=false` in every trial). The modal focuses an `input` (stamina) or a `button` (the montage option chip) before `zh`'s timer fires, so `f()` is skipped. This is the same reason the mouse path is safe.
- **Opens exactly once:** `modals=1` in every trial. In a note open in the pane, one window click per key and one modal (`main-stam-enter`, RV and LP).
- **After close:**
  - focus returns to the opener, which is inside the preview (mouse path: `.markdown-preview-view`);
  - the preview stays with the pointer away (`isFocused` true);
  - a real click outside closes it through 193553, exactly as for the mouse.
- **What the user sees:** the same as a mouse click, in RV and LP, for Enter and Space, for the stamina bar and the montage cell:

  | Step | Result |
  |---|---|
  | Modal at 1.5 s | open, preview behind it |
  | Click inside | stays |
  | Healing 3 + Apply | 15→18 saved, no Notice |
  | Escape | closes the modal |
  | After close | the preview stays until the next outside click |

- **Outside a preview** (note open in the pane):
  - RV and LP each open one modal from one window click.
  - Escape closes it.
  - LP cursor still at 0:0; the block's source is not shown.
- **The mouse path on the same bundle is unchanged** (`a:rv:stam-mouse`).

### (c) DseModal: when opened outside a click, dispatch `new MouseEvent('click', {bubbles:true})` on the anchor and arm the re-pushes from its window bubble
- Stamina Enter RV/LP, Space LP and montage Enter RV/LP are all green, the same as (a).
- **Regression (measured, `sc597-r1-probe-formpend-fast*`):**
  - What happens: the block edit form opens through `openAfterPendingWrite`'s async branch, which is outside the click, so (c) fires.
  - What the user sees, RV and LP: the preview switched into a **source editor** (`editor=true`) and **took the focus from the form**. `activeElement` is the preview's `.cm-content`, not the form's textarea, at 120 ms and 1.5 s, and after Escape.
  - Cause: the form focuses a `textarea` (not `button, input`), and the synthetic target is the block host, so Obsidian's `f()` runs.
  - Base and (a) on the same trial: no switch; the form keeps the focus.
- Further costs:
  - (c) fires a click the user never made on an element they did not target, from inside every `DseModal.open()`;
  - it runs `p()` a second time where the opening click already ran it;
  - it needs the initial focus moved above the guard.
- **Rejected.** A (c) that skips a popover that already has `.is-editing` would avoid this exact trial. The textarea hazard stays, though, for any future modal that focuses a textarea, select or `[tabindex]` first. And the survey found no opener (c) would catch that (a) does not.

### (b1) DseModal: find the private `HoverPopover` (`iterateAllLeaves`, `view` / `previewMode` / `editMode` / `currentMode` `.hoverPopover`, matched on `hoverEl`) and call `setIsFocused(true)`
- The instance was found in every RV, LP and montage trial (`found: true`).
- Modal and preview stay, the title click is kept, Apply lands, and Escape closes the modal: the popover pushed no scope, so the modal's scope is on top.
- **Regression (measured):** after the modal closes, **a real click outside does not close the preview.** `afterOutside`: popover still shown, `isFocused` true, in RV, LP and montage.
  - Cause: `p()` never ran, so there is no popover window click listener, and `T3` skips a focused popover.
  - The preview stays until another hover replaces it.
- Further costs: private API (`setIsFocused`, the `hoverPopover` fields; obsidian.d.ts exposes neither) and an instance hunt across modes. Nested previews (where the `hoverParent` is an embed) are not covered by that hunt. **Rejected.**

### (b1r) as (b1), plus `setIsFocused(false)` on close
- Green from the user's view. The preview stays after close only because focus came back to the bar inside it. The outside click closes it through `T3` (509:105839), not through the click listener.
- It has the same private-API and instance-hunt costs as (b1). `.is-editing` is never set, and the popover scope is never pushed, so it is not "exactly like the mouse". It is fragile across Obsidian versions. **Rejected:** (a) gets the real Obsidian path with public DOM only.

## 3. Recommendation
**(a), on its own.** Files:
- `src/framework/kit/StaminaBarPanel.ts`:
  - :159: `makeKeyboardOperable(bar, s, opts.owner)` (drop the `onBarClick` argument);
  - :183-188: drop the `open` parameter;
  - :199: `bar.click()` instead of `open()`;
  - extend the doc comment at :170-182. The text is in `sc597-r1-proto-A.diff.txt`.
- `src/elements/montage/BoardView.ts:381`: `cell.click()` instead of `openThisCell()`, with a short comment. `openThisCell` stays as the click listener (:377).
- No change to `managedModal.ts`. SC-595's guard, the 10/150 ms re-push ordering and `HOVER_HELPER_DELAYS_MS` are used exactly as they stand.
- **Do it everywhere, not only in previews.** It is one code path, and keyboard activation is a click, as for a native button. Measured outside previews: one modal, one click, no source reveal in LP.
- Docs (implementer):
  - dse-verify "Hover preview modals": replace footgun (7) with "a keyboard opener on a non-`<button>` activates with `el.click()` on the element the mouse clicks (SC-597); calling the opener directly closes the modal and preview about 300 ms later";
  - add G-S87 to the part-5 list and the count (55 → 56 scenarios);
  - CHANGELOG `## Unreleased` bullet.

**No Scott decision**: (a) has no user-visible trade-off.

Pre-flight on the prototype (`sc597-r1-jest-protoA.log`): `tsc --noEmit` rc 0, eslint on the two files rc 0. jest `stamina-bar`, `montage`, `hero/*`, `managedModal`, `stamina-edit-modal`: 8 suites, 366/366. This includes SC-498 "Enter on it opens the Stamina modal like a click" and the montage keyboard test.

## 4. Test plan
### jest (jsdom)
The stand-in for Obsidian's popover is a `click` listener on the `.hover-popover` container (bubble), standing for `zh`. Record the event (target, `bubbles`) and, as `zh` does, arm `setTimeout(() => app.keymap.pushScope(popoverScope), 10)`. Write 10 as a literal, never `HOVER_HELPER_DELAYS_MS` (r5 MEDIUM-1). Use the existing `openFrom(inPreview)` shape in `stamina-bar.test.ts:712` (a host whose `containerEl` sits in `div.popover.hover-popover`) and `FakeKeymap`.

`test/dom/elements/stamina-bar.test.ts`, new `describe('SC-597: keyboard open from a hover preview')`:
1. Enter, and also Space, on the bar in a preview: exactly one `click` reaches the popover container, its target is the bar, and the modal is open **synchronously** after the keydown, with exactly one `.modal-container`.
2. Escape order: with fake timers, Enter on the bar, then advance 200 ms. `app.keymap.top === modal.scope`; after `modal.close()` it is `popoverScope`.
3. Control, outside a preview: Enter opens exactly one modal and one window click.

`test/dom/elements/montage.test.ts`: tests 1 and 3 for a recorded / past-round cell (Enter and Space).

| Mutant | Killed by |
|---|---|
| K1: revert to `open()` / `openThisCell()` (the base) | 1 (zero container clicks) |
| K2: `bar.dispatchEvent(new MouseEvent('click'))` with no `bubbles` | 1 (never reaches the container) |
| K3: the click dispatched on `cx.host.containerEl` or the card root instead of the opener (the opener's listener never runs) | 1 (no modal) |
| K4: both `open()` and `bar.click()` | 1 (two `.modal-container`) |
| K5: `setTimeout(() => bar.click())` (deferred) | 1 ("open synchronously") |
| K6: the click is dispatched but `DseModal` arms its re-pushes at once instead of from the opening click (a regression of `managedModal.ts:247-253`) | 2, if the stand-in arms its push AFTER the modal's arm, i.e. from the container listener as in Obsidian. Already covered by SC-595's `opened from a click` test; 2 is its keyboard twin. |

Each mutant must be run and recorded in `sc597-r2-mutants.log`.

### Lifecycle: new G-S87 (part 5, after G-S83, before G-S56 in SCENARIOS)
- Reuse `gs83Kit` and the G-S83 fixtures `gs83-stam*`. Add a montage note and its host; the probe's fixture is `ds-montage`, `title: Probe`, `rounds: 3`, participant Kira, `current_round: 2`, with the opener `.dse-mt__cell[role="button"][tabindex="0"]`.
- Trials: stamina Enter RV, stamina Enter LP, stamina Space RV, montage Enter RV.
- Steps per trial (the probe's `sc597Trial` is a ready template):
  1. Real Ctrl-hover.
  2. Pointer rests on the card.
  3. Script `focus()` on the opener, then a CDP key.
  4. At 1.5 s, assert preview and modal open (this is the red-on-base assertion).
  5. A real click on the title: both still open.
  6. Stamina: Healing 3 plus a real click on Apply puts `current_stamina: 18` in the note, with no Notice, the modal closed and the preview shown. Then reopen by the same key and press Escape 450 ms later: modal closed, preview shown.
  7. Montage: Escape closes the sheet, preview shown.
  8. Pointer away for 1.2 s: preview shown.
  9. A real click outside: preview closed.
- Measured cost: about 10.0 s per stamina trial and about 8.5 s per montage trial, so about 39 s for 4 trials, plus setup. **Part 5 goes from about 304 s to about 345 s.**
  - Optional: a montage LP trial adds about 8.5 s.
  - G-S64 is untouched; part 3 is unaffected.
- **Red on 94133a5a:** measured. With the new harness and the old bundle (`DSE_LIFECYCLE_BUNDLE=<archive of 94133a5a>`), all 4 trials fail at step 4.
- **Green:** measured with the (a) bundle.
- Authoring footgun (new, measured): CDP `Input.dispatchKeyEvent` `keyDown` with no `text` does **not** activate a real `<button>` (no keypress), so the form never opened in `formpend-main`'s `form-pend-enter`. That is fine for G-S87, whose openers are `div`s with keydown handlers. A trial that needs Enter on a real button must send `text: '\r'`.

## 5. Not probed
- Nested previews (a hover inside a hover). By construction `el.click()` bubbles through the innermost popover's embed container only, since popovers are children of `body`, and the outer popover stays through `shouldShowChild`.
- Popout windows (no popout in the harness, the same as SC-595).

Follow-ups:
- (low, pre-existing, not keyboard-specific) `CompendiumSearchModal` (a SuggestModal, not a DseModal) can be opened by an editor command while a hover preview is in source-editor mode (`activeEditor` = the popover's embed). A click in its input or background is neither in the popover nor default-prevented, so it would hide the preview, and the insert would target an unloaded editor. Suggestion clicks call `preventDefault` and survive. Not measured; the SC-595 family.
- (low, pre-existing) `montage/BoardView.ts:378-382` lacks the stamina bar's guards (`evt.target !== cell`, modifier keys, `evt.repeat`, `defaultPrevented`; `StaminaBarPanel.ts:194-197`). Ctrl+Enter on a cell opens the sheet, and a held key re-fires. With (a) a re-fire dispatches another click. In practice focus is in the sheet after the first open, so repeats stop reaching the cell. This is SC-498 parity.
- (info) After a keyboard-opened modal closes, Obsidian returns the focus to the opener inside the preview (`DIV.dse-stamina` / `.dse-mt__cell`); after a mouse open it is on `.markdown-preview-view`. No user-visible difference was measured: the preview stays and the outside click closes it either way.
