# SC-595 r3 — independent adversarial review (reviewer R2)

## Executive summary
- **Verdict: FIX.** The form path the ticket names works (G-S83 green on head, red on base), but the click guard has two holes that leave the bug in place for other modals the change and the CHANGELOG say it covers. Both were measured in real Obsidian with a real CDP mouse, and both fixes were prototyped and measured.
- **Findings:** 0 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW, 4 INFO.
- **HIGH-1:** a control that the modal redraws in its own click handler is detached before the click reaches the document. `contains()` misses it, so the preview hides and the modal closes. Measured: "Add condition" in the tracker's Conditions modal from a preview closes modal and preview, RV and LP. Fix: `composedPath()`.
- **HIGH-2:** `close()` removes the guard before the closing click reaches the document. A free-heal Confirm or Cancel therefore closes the preview and the parent Stamina modal, and the staged heal is lost. Cancel, the backdrop and Stamina Apply also close the preview, which contradicts the O4 / r1 table and the CHANGELOG. Fix: remove the guard one task later.
- **Re-push timer (brief item 8): LOW.** The margin is measured, holds at 1-20x CPU, and shrinks with load. A structural ordering (re-push armed from the opening click's window bubble) closes the Escape dead window. It is prototyped and measured.
- **Gates (head `0f5c9c98`):** tsc clean; lint clean; jest **7193 passed / 2 skipped / 261 of 262 suites** (no SC-568 timeout this run); lifecycle part 5 **5/5** (about 376 s at loadavg 13-20); e2e **258/264 ok, 0 failed, 6 known-bug, 164/164 pairs** (about 238 s); G-S83 **red on base** (`eaa8742a`, exit 1, all five trials).
- **Mutants:** the implementer's 4 reproduce exactly (6/6/2/5). Of the reviewer's 6: 3 killed (capture phase 3, 0 ms re-push 1, re-push after close 1) and 3 **survive** (drop the FreeHeal anchor, drop the conditions-panel anchor, drop the montage anchor; full jest, 0 failed). No test covers those openers' anchors.
- **Prototype** (`sc595-r3-proto-managedModal.diff.txt`): the 3 r3 jsdom probes pass, and so do the 16 SC-595 tests except the one that asserts synchronous guard removal. G-S83 is green on the prototype bundle. Every real-Obsidian probe that failed on head passes on it.

## 0. Setup
- The worktree was clean apart from the expected unstaged `draw-steel-elements` pointer. dse HEAD is `0f5c9c98` and `origin/develop` is still `eaa8742a` (fetched).
- Bundles were built from `git archive` exports in scratch, with `node_modules` symlinked: `head/` (0f5c9c98), `base/` (eaa8742a) and `proto/` (0f5c9c98 plus the prescribed fix). The scratch dir is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r3-review-R2/`.
- **Probe harness:** a scratch copy of the head `visual-harness/obsidian-lifecycle.mjs` with one injected scenario (`r3probe.js`, spliced by `make-probe.py`).
  - It reuses `gs83Kit`, so every hover, press and release is the real CDP mouse, exactly as in G-S83.
  - Page instrumentation (logged against a per-trial `t0`): `window.setTimeout` (delays 10 / 150 / 200), `app.keymap.pushScope` / `popScope` (each push or pop tagged modal or other by `scope.tabFocusContainerEl`), window capture and bubble `click` / `keydown`, and a body MutationObserver for `.modal-container`.
  - Listener counts come from `DOMDebugger.getEventListeners`.
  - CPU load comes from `Emulation.setCPUThrottlingRate`.
- Obsidian 1.15.1 (the harness asar). Obsidian code read: zh (click-to-edit helper), `Cf.create` p(), `Keymap` and `Modal` in the r1 app.js extract.

## 1. Findings

### HIGH-1 — a click on a control the modal redraws escapes the guard (Conditions modal from a preview is unusable)
- **Where:** `src/framework/kit/managedModal.ts:206-209` (`if (target && this.containerEl.contains(target)) evt.stopPropagation();`).
- **Mechanism:**
  - Several DSE modals rebuild part of their DOM inside the clicked control's own `click` handler. By the time the click bubbles to the document, `evt.target` is a detached node, so `containerEl.contains(target)` is false and the click is not stopped.
  - Obsidian's popover listener (`m => m.defaultPrevented || h.contains(m.targetNode) || d.hide()`) then hides the preview. That unloads the opener's view, which closes the modal.
  - DSE already documents this exact footgun and its fix in the same family: `ConditionsModal.ts:190-198` uses `composedPath()` because "a SUCCESSFUL pick mutates the DOM … `addWrapEl.contains(detachedNode)` is always false".
- **Affected controls (code):**
  - ConditionsModal "Add condition" (`renderAdd` → `addWrapEl.empty()`, ConditionsModal.ts:540).
  - Every row control: Customize cog, Remove, duration / effect / colour / icon chips (`renderList` → `listEl.empty()`, ConditionsModal.ts:234).
  - MinionStaminaPoolModal's condition icons (`container.empty()`, MinionStaminaPoolModal.ts:643).
  - ConditionsModal is opened from the tracker, from the ds-conditions panel and from the pool.
- **Measured, real Obsidian, real mouse, head bundle** (`sc595-r3-probe-head.log`, trials `cond:rv:cog`, `cond:lp:cog`; repeated in a later run): the tracker in a preview, `.dse-cond--add` opens the Conditions modal, then a real click on "Add condition" gives `{"popover":false,"modal":false}` in RV and in LP. The user cannot add a condition from a preview. G-S83 clicks only the modal's title, so it is blind to this.
- **jsdom repro:** scratch test P2. A button whose click handler empties its parent and redraws it: the window spy is called on head and not called on the prototype.
- **Fix:** `if (evt.composedPath().includes(this.containerEl)) evt.stopPropagation();`. The path is fixed at dispatch time.
  - Prototype measured, RV and LP: Add, then a real pick from the menu, then the real cog, then a real duration chip. The preview and the modal stay after every click, rows 1 and editor open (`sc595-r3-probe-proto.log`).
- **Tests to add:**
  - jsdom: a redrawing control inside a preview-opened DseModal; the window spy is not called.
  - G-S83 conditions trial: a real click on "Add condition" and on a picked row's cog, instead of (or as well as) the title.

### HIGH-2 — the click that closes a preview-opened modal still hides the preview; a nested confirmation closes its parent and loses the staged change
- **Where:** `managedModal.ts:239-241` (`close()` → `this.lifecycle.unload()` removes the guard synchronously) together with `managedModal.ts:206` (guard registered on `lifecycle`).
- **Mechanism:**
  - Obsidian's Modal on desktop is not animated (`isAnimated = canAnimate() = isPhone`), so `close()` detaches synchronously. It runs inside the button's or backdrop's `click` handler at target phase.
  - The guard is removed before the same click reaches the document. Per the DOM spec, removed listeners are not invoked, so the click reaches the window and the popover hides.
  - For a nested DseModal (FreeHealConfirmModal), the child's guard is gone. The parent's guard does not match either, because the child's container is a sibling in `body`, not inside the parent's container.
- **Measured, real Obsidian, real mouse, head** (`sc595-r3-probe-head.log`):
  - `freeheal:rv:confirm`: Stamina modal from a preview, then Free heal, then a real click on Confirm. Before: `modals 2`. After: `{"popover":false,"modal":false,"modals":0}`. The parent Stamina modal is gone, with the heal that Confirm just staged; it is applied only on Apply. **This is the ticket's own failure class (a click inside loses the edit), in a modal the change claims to cover.**
  - `freeheal:rv:cancel`: the same result.
  - `form-close:rv:cancel` (form Cancel) and `form-close:rv:bg` (a real click on `.modal-bg`): the form closes and **the preview closes too** (`{"popover":false}`).
  - `stamapply:rv` and `stamapply:lp` (Damage 8, then a real Apply): the write lands (`current_stamina: 12 temp_stamina: 0`, no Notice) and the preview closes.
  - These contradict the adopted design's "What the user sees" table (r1 §4 A: Cancel, backdrop → "Preview: stays") and the CHANGELOG ("After you save or cancel, the preview stays until you click outside it").
  - Save is unaffected only because `save()` is async and closes after the click.
- **jsdom repro:** scratch tests P1 (Cancel-shaped button) and P3 (nested child Confirm); the window spy is called on head.
- **Fix:** keep the guard until the current task ends. Register it directly and remove it in `win.setTimeout(() => doc.removeEventListener('click', guard), 0)` from the lifecycle teardown (prototype). Equivalent: keep it on `lifecycle` but defer `lifecycle.unload()`. Do not do that: the footer and body listeners must die synchronously.
  - Prototype measured, RV:
    - free-heal Confirm: `{"popover":true,"modal":true,"modals":1}` (the parent stays);
    - form Cancel and backdrop: `{"popover":true,"modal":false}`;
    - Stamina Apply: the preview stays and the write lands.
- **Test impact:** the existing kit test "after close the guard is gone: the same container, attached again, lets a click through" asserts the synchronous removal. It needs one `await settle()` before re-attaching (that is the only SC-595 test that fails on the prototype).
- **Tests to add:**
  - jsdom: a closing button and a nested-confirm Confirm inside a preview-opened modal; the window spy is not called and the parent stays open.
  - G-S83: free-heal Confirm keeps the Stamina modal and the preview; form Cancel keeps the preview.

### MEDIUM-3 — the CHANGELOG bullet and the dse-verify proposal overclaim
- `CHANGELOG.md` (worktree superproject, commit `597f6203`, Unreleased) says the fix "goes for" the Conditions windows, the minion stamina pool and the free-heal confirmation, and that "after you save or cancel, the preview stays". At head all of these are false (HIGH-1, HIGH-2).
- `sc595-dse-verify-proposal.md` §4 and §6 (CURRENT block) list the same modal coverage. §4's "re-pushes its keymap scope 200 ms after open" and "10 ms (150 ms on text)" are accurate (measured below).
- The bullet otherwise reads plainly. It names SC-597 and SC-594 correctly.
- **Fix:** after HIGH-1 and HIGH-2 are fixed, the text is accurate as written. Re-check the "Escape" sentence if the re-push changes (LOW-5). If the fixes are deferred, trim the modal list and the "after you … cancel" sentence.

### MEDIUM-4 — tests do not exercise the shapes that fail; three anchor plumbing lines are unguarded
- None of the 16 jest tests and none of the G-S83 trials click a control that closes the modal (Cancel, Confirm, Apply, Done, the backdrop) or redraws it. The G-S83 Stamina and Conditions trials click only the title.
- The kit "FreeHealConfirmModal" test clicks a textarea in the child, not its Confirm.
- Reviewer mutants that **survive the full jest suite** (`sc595-r3-mutants.log`):
  - M8: drop `this.anchor` in `StaminaEditModal.ts:650`: 0 of 7195 failed.
  - M9: drop the anchor in `conditions/panel.ts:175`: 0 failed.
  - M10: drop the anchor in `montage/view.ts:363`: 0 failed.
  - The implementer's report says these openers are "not driven separately". The mutants show what that leaves open: the FreeHeal inheritance, the only nested case, has no test through its real opener.
- **Fix:**
  - Add the HIGH-1 and HIGH-2 tests above.
  - Add one jsdom test per unguarded opener: ConditionsPanel's add modal in a `.hover-popover`, the montage `openTrackedModal`, and a real StaminaEditModal Free heal → FreeHealConfirm from a preview-anchored stamina modal, where the window spy is not called on Confirm.

### LOW-5 — the 200 ms re-push is a margin, not an ordering; Escape is swallowed between the popover's push and 200 ms (brief item 8)
- **Where:** `managedModal.ts:28` (`HOVER_SCOPE_REPUSH_MS = 200`), `:210-215`. Comment at `:192-196`: "timers run in due-time order, so load cannot reorder them".
- **What the measurements show:**
  - The modal arms its 200 ms timer inside `open()`, during the opener's own click handler. Obsidian's zh helper arms its own 10 ms or 150 ms timer later in the same dispatch: it is a bubble listener on the embed container, which runs after the button handler.
  - The helper's 10 / 150 choice depends on whether the click lands on a text node, and the helper first does a `getClientRects` layout flush, after the modal was just inserted.
  - So the safety margin is `200 − helperDelay − Δ`, where Δ is the gap between the two arms. **Δ grows with load.**
- **Measured** (`sc595-r3-probe-head.log`, timing trials). Δ = the helper's arm time minus the modal's arm time:

| Opener / helper delay | CPU 1x | 4x | 10x | 20x |
|---|---|---|---|---|
| Stamina bar text "15" (150 ms) | Δ 1, margin 49 | Δ 3, margin 47 | Δ 11, margin 39 | Δ 27, margin 23 |
| Form pencil (10 ms) | margin 189 | 186 | 177 | 177 |
| Tracker `.dse-cond--add` (10 ms) | 190 | 188 | — | 173 (Δ 17) |

- In every trial the modal's scope ended on top. Under load both timers fired late but in due order: at 4x, the Conditions helper was due at 907 ms and fired at 1397; the re-push followed at 1398.
- So "load cannot reorder them" holds for firing, not for arming. The 150 ms case would fail at Δ > 50 ms. Extrapolated from the table that is roughly 35-40x CPU slowdown, or a heavier modal or opener (the Conditions modal's Δ was 17 ms at 20x even on the 10 ms path).
- **Dead window, measured:** on head, Escape landed 161 ms after the pencil click (helper pushed at +45 ms, re-push at +232 ms) and the form stayed open (`escearly:x:form`). That is related bug 1 again, for about 190 ms.
- **Structural alternative, prototyped and measured:**
  - In `open()`, when `window.event` is the opening `click`, add a window-bubble listener for that same event. It runs after the helper's container listener has armed its timer. From that listener, arm two re-pushes at **10 ms and 150 ms**, one per helper delay. An equal delay armed later fires later (FIFO), so the order holds by construction, at any load.
  - When `open()` is not inside a click (async or keyboard open), arm them from `open()`: any helper timer was armed earlier.
  - Skip the re-push if a newer preview-opened DseModal is open, so a parent never buries a FreeHeal child (the head code can do that if the child opens within 200 ms).
  - Measured on the prototype:
    - Escape 152 ms after the pencil now closes the form (`escearly:x:form` → `{"modal":false}`, re-push at the same ms as the popover push);
    - at 20x CPU the modal's re-push lands 0-11 ms after the popover's push, and the modal is on top;
    - G-S83 is green on the prototype bundle.
  - Cost: `window.event` is deprecated in lib.dom typings; check the lint config. The stamp could instead be passed by the opener.
- **Why LOW:** at realistic speeds the head margin holds, and the dead window needs Escape within about 200 ms of the click.
- **Fix (optional, recommended with HIGH-2 since it touches the same function):** adopt the prototype's ordering, or at minimum correct the comment, which overstates the guarantee.

### LOW-6 — re-push edge cases
- The head re-push pops and re-pushes the parent's scope at 200 ms even if a child DseModal opened in the meantime. The child's Escape then closes the parent first.
- `Keymap.pushScope` pushes onto `activeWindow`'s stack at timer time. If focus moved to another window within 200 ms, the scope lands on the wrong window's stack. `popScope` uses `scope.win`, so it is not symmetric.
- Neither case is reachable by normal use today. The prototype's newest-modal check fixes the first.

### INFO-7 — what holds (measured)
- **The ticket's path:**
  - G-S83 is green on head (part 5) and red on base, with all five trials failing at the first real click (`sc595-r3-red-on-base-G-S83.log`).
  - With the note also open in a second pane (O7), a real click keeps the form and Save lands with no Notice (`twopane:rv`).
  - Two forms in succession from the same preview, RV and LP: a raw click keeps the second form; Escape closes each; a third Escape is harmless; a real outside click closes the preview (`twice:rv`, `twice:lp`).
- **No leak outside a preview** (`noprev:lp`, the ordinary note, no preview):
  - document click listeners 1 → 1 → 1;
  - window 2 → 2;
  - keymap depth 1 → 2 (the modal's own push) → 1;
  - the window saw the raw-box click.
  - The RV variant could not find its card in the probe harness (a harness issue, not a product one). jest controls (c) cover RV.
- **No leak inside a preview** (`leak:rv`): document listeners 1 → 2 → 1, so the guard is gone after close. The growth in window listeners and keymap depth is Obsidian's `p()` leak, one per non-cancelled click in the preview, as r1 describes; it is not DSE's.
- **What the guard cuts off** (`winlist:rv`): with a preview-opened form open, the window bubble `click` listeners are only the popover's two `Cf` listeners (`app.js 508:193500`). No Obsidian link, menu or tooltip handler sits at window bubble. The document has Obsidian's capture listener plus the guard.
- **Write paths:** `git diff eaa8742a..HEAD` touches no pin, `pinnedTarget`, `lastWrite`, `keepFormOpenOn` or `keepOpenOn` code and no host file. G-S64 is unchanged. G-S77 (SC-584's embed form Save) passes in part 5. Part 3 (G-S64 zk-zn) was not re-run; it carries from r2 (9/9) with no change to G-S64 or the write path.

### INFO-8 — popout windows
The guard and timer use the modal's own document and window, while zh arms on the main `window`. In a popout, the two timers are in different windows' queues, and their relative order is not established. The harness has no popout, so this is not probed.

### INFO-9 — Live Preview focus after Escape
In LP, after Escape closes a preview-opened form, focus is in a `.cm-content` (Obsidian's modal selection restore). This is the same as any Obsidian modal and is not a regression.

### INFO-10 — an Escape before the helper fires can turn the preview into an editor
If the modal closes before the zh helper fires (Escape within the 150 ms text-hit delay), the helper's later callback finds no focused button or input and switches the preview into a source editor (`escearly:x:stamtext`: active `.cm-content`). This is Obsidian behaviour on a text click and exists on base. Not SC-595's.

## 2. Coverage of r1 §5 (brief item 4)

| Modal | Anchored at head | Real-Obsidian result at head |
|---|---|---|
| FormModal | yes (`openFormEditor`) | OK (G-S83). Cancel and backdrop close the preview (HIGH-2) |
| StaminaEditModal | yes (stamina-bar, hero) | title click OK (G-S83). Apply closes the preview, write lands (HIGH-2) |
| FreeHealConfirmModal | inherits `this.anchor` | Confirm / Cancel close the preview **and the parent** (HIGH-2); untested (M8 survives) |
| ConditionsModal (tracker) | yes (`InitiativeView.openModal`) | title OK; **"Add condition" closes everything** (HIGH-1) |
| ConditionsModal (ds-conditions panel) | yes | not driven; the same modal class, so HIGH-1 applies; anchor untested (M9 survives) |
| ResetEncounter / MinionStaminaPool | yes (`openModal`) | not driven; pool condition icons redraw (HIGH-1); Confirm / Apply close the preview (HIGH-2) |
| Montage LogAction / AddHero / SetLimits | yes (`openTrackedModal`) | not driven; anchor untested (M10 survives) |

## 3. Gates (head `0f5c9c98`)

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc 0 | `sc595-r3-gate-tsc.log` |
| lint | clean, rc 0 (pre-existing `.eslintignore` warning) | `sc595-r3-gate-lint.log` |
| jest (fresh: `rm -f main.js styles.css`) | `Tests: 2 skipped, 7193 passed, 7195 total`; `Test Suites: 1 skipped, 261 passed, 261 of 262 total`; rc 0 (7177 + 16; the SC-568 timeout did not occur this run) | `sc595-r3-gate-jest.log` |
| lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` | **5/5 ok**, rc 0, about 376 s including the build (loadavg 13-20) | `sc595-r3-gate-lifecycle-p5.log` |
| G-S83 on base (`eaa8742a` bundle, head harness) | **FAIL**, rc 1: form rv/lp, stamina rv/lp and conditions rv all closed at the first real click | `sc595-r3-red-on-base-G-S83.log` |
| G-S83 on the prototype fix | 1/1 ok, rc 0 | `sc595-r3-proto-G-S83.log` |
| e2e | `OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`, rc 0, about 238 s | `sc595-r3-gate-e2e.log` |
| lifecycle part 3 | not re-run (see INFO-7) | — |

## 4. Mutants (`sc595-r3-mutants.log`)
Each mutant was applied to the worktree file, jest was run, and the file was restored with `git checkout -- <file>`. The tree was clean after each.

| Mutant | Scope | Failed |
|---|---|---|
| M1 drop guard (implementer) | 4 SC-595 files | 6 |
| M2 `preventDefault` (implementer) | same | 6 |
| M3 drop re-push (implementer) | same | 2 |
| M4 drop the `.hover-popover` condition (implementer) | same | 5 |
| M5 guard in the CAPTURE phase (reviewer) | same | 3 (killed) |
| M6 `HOVER_SCOPE_REPUSH_MS = 0` (reviewer) | same | 1 (killed) |
| M7 re-push survives close (drop the `dseOpen` check and `clearTimeout`) (reviewer) | same | 1 (killed) |
| M8 FreeHeal: drop `this.anchor` (reviewer) | full jest | **0, survives** |
| M9 conditions panel: drop the anchor (reviewer) | full jest | **0, survives** |
| M10 montage: drop the anchor (reviewer) | full jest | **1, survives**: the one failure is the SC-568 `twin-reuse` load timeout ("Exceeded timeout of 5000 ms"), unrelated |

## 5. Prescribed fix (one function; the prototype diff is `sc595-r3-proto-managedModal.diff.txt`)
1. **Guard:** `evt.composedPath().includes(this.containerEl)` (HIGH-1).
2. **Guard lifetime:** remove it one task after close (`win.setTimeout(remove, 0)` from the lifecycle teardown) (HIGH-2). Adjust the one kit test that asserts synchronous removal.
3. **Optional, recommended (LOW-5):** order the re-push after the helper by construction: 10 ms and 150 ms re-pushes armed from a window-bubble listener for the opening click, plus the newest-modal check. Otherwise, correct the comment.
4. **Tests:** jsdom tests for redraw, closing button and nested Confirm; one opener test each for FreeHeal, the conditions panel and montage; G-S83 drives "Add condition" + cog, free-heal Confirm and form Cancel with the real mouse (watch part 5's time).
5. **Docs:** the CHANGELOG and the proposal are accurate after 1 and 2. Re-measure the proposal's numbers on the new head.
6. **Prototype note:** the prototype used `Array.prototype.remove` first; that is Obsidian-only and throws in jest. Use `indexOf` / `splice` (the final prototype does).

## 6. Artifacts
All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`:
- `sc595-r3-review-report.md` (this file)
- `sc595-r3-gate-tsc.log`, `sc595-r3-gate-lint.log`, `sc595-r3-gate-jest.log`, `sc595-r3-gate-lifecycle-p5.log`, `sc595-r3-gate-e2e.log`
- `sc595-r3-red-on-base-G-S83.log`, `sc595-r3-proto-G-S83.log`
- `sc595-r3-probe-head.log`, `sc595-r3-probe-proto.log` (real-Obsidian probe records, R3 JSON lines)
- `sc595-r3-mutants.log`
- `sc595-r3-proto-managedModal.diff.txt`
- `sc595-r3-probe-scenario.js.txt` (the injected probe), `sc595-r3-jsdom-probe.test.ts.txt` (P1-P3), `sc595-r3-jsdom-probe.log` (P1-P3: 3/3 red on head; on the prototype the probes pass and only the synchronous-removal kit test fails)

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r3-review-R2/` (bundles `head/`, `base/`, `proto/`, the probe harness copy, scripts and raw probe logs `p1`-`p7`).
