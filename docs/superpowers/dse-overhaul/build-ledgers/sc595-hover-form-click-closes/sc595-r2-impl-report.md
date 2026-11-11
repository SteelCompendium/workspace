# SC-595 r2 — implementation report (design A, steps 1-3)

## Executive summary
- STATUS DONE. dse branch `sc595-hover-form-click-closes` head `0f5c9c98` (base `eaa8742a`, `origin/develop` still `eaa8742a`, no rebase); superproject branch head `597f6203` (CHANGELOG only; the dse pointer bump is left unstaged for `wt-finish`). Nothing pushed, no tags.
- One mechanism in `DseModal` (`anchorTo(el)`, `openManagedModal(owner, factory, anchor?)`): opener inside `.hover-popover` -> click guard on the modal's own document (bubble, `stopPropagation`, only for targets inside the modal) + keymap scope re-push. Outside a preview nothing changes. The document placement works in real Obsidian (no fallback to `.modal-container` needed).
- Correction to r1 step 3: a re-push at 0 ms does NOT work (G-S83's first run: Escape dead in all 5 trials). Obsidian's click-to-edit helper pushes the popover's scope 10 ms / 150 ms after the click. The re-push is at `HOVER_SCOPE_REPUSH_MS = 200` ms after open.
- Gates: tsc + lint clean; jest 7193 non-skipped (7192 passed + 1 SC-568 load timeout, green alone 78/78) / 2 skipped, +16 tests; lifecycle 55/55 (21+16+9+4+5); e2e 258/264 ok, 0 failed, 6 known-bug, 164/164 pairs; `styles.css` sha256 `5e5ff488…` byte-identical to a clean `eaa8742a` build, so shots/freeze/parity carry (not run).
- Red on base: G-S83 against the `eaa8742a` bundle fails (exit 1): every trial dies at the first real click. Green on head, 50 s alone.
- Mutants: 4/4 killed (guard 6 tests, preventDefault 6, re-push 2, `.hover-popover` condition 5).
- Drive-by fixes: none. Follow-ups: see the end.

## 1. What changed (dse `eaa8742a..0f5c9c98`)
| Commit | What |
|---|---|
| `fa4c68d4` | `src/framework/kit/managedModal.ts` (guard, scope re-push, `anchorTo`, `anchor` getter, `openManagedModal` 3rd arg); anchors passed from every opener; jest mock `FakeKeymap` |
| `c084a929` | jest tests (16) |
| `fd512b0d` | lifecycle G-S83, and the 200 ms re-push fix found by it |
| `0f5c9c98` | G-S83 judge stops at the click that closed the form (clear failure text on base) |

Openers anchored (all `cx.host.containerEl`; every modal in r1 §5 extends `DseModal`, none skipped):
- `src/authoring/FormModal.ts` `openFormEditor` (pencil via `pipeline.ts`, hero "Edit definition")
- `elements/stamina-bar/view.ts`, `elements/hero/view.ts` (stamina modal; Edit definition goes through `openFormEditor`), `elements/conditions/panel.ts`, `elements/montage/view.ts` `openTrackedModal` (LogAction / AddHero / SetLimits)
- `elements/initiative/view.ts` `openModal` (ConditionsModal, ResetEncounter, MinionStaminaPool, StaminaEdit; its parameter and `activeModal` are now typed `DseModal`)
- `views/StaminaEditModal.ts` -> `FreeHealConfirmModal` inherits the parent's anchor (`this.anchor`).

Design notes:
- The guard uses `this.containerEl.ownerDocument` (and `ownerDocument.defaultView` for the timer), not `.doc` / `.win`: same node in Obsidian, and it exists in jsdom without a polyfill.
- `stopPropagation` only, registered on `this.lifecycle` (gone after close). Same-node document listeners (RecoveriesStrip click-outside, bubble) still run: `stopPropagation` does not stop other listeners on the same node.
- The re-push is `app.keymap.popScope(scope); pushScope(scope)` after `HOVER_SCOPE_REPUSH_MS`, only if still open; cleared on close. Modal.close's own `popScope` then leaves the popover's scope on top. A modal opened later than ~150 ms after the click is already on top (Modal.open pushes), so the re-push is a no-op there.
- Inline comments explain why `stopPropagation` and not `preventDefault`, why the re-push is deferred and by how much, why only inside `.hover-popover`.
- No write path touched (pin, `pinnedTarget`, `lastWrite`, `keepFormOpenOn`, G-S64 phases unchanged; no G-S64 phase added).

## 2. Requirement 3 findings (grep of `src/`)
- DSE `window`-level `click` listeners: **none**. `window.addEventListener` appears nowhere in `src/`; the only `win`-level `registerDomEvent` is `printMedia.ts` (`beforeprint` / `afterprint`). Nothing a click inside a preview-opened modal must still reach is cut off.
- Document-level DSE click listeners (all still see the click, the guard is on the document in the bubble phase): `RecoveriesStrip.ts:308` (`activeDocument` click-outside, bubble), `ConditionsModal.ts` capture listener, `sccLinkClickHandler.ts` capture listener.
- Obsidian `Menu`: the only `new Menu()` in `src/` is `elements/negotiation/view.ts:137`, a card menu, never opened from inside a DseModal. No dropdown inside the modals is an Obsidian popup: `FormModal` `addDropdown` builds a native `<select>`, and the Conditions modal's add-condition combobox is DSE's own DOM inside the modal. `CompendiumSearchModal` (SuggestModal) is opened only from commands, never from a card. So no Menu / suggest opens from inside these modals today. If one is added, its click-outside (window bubble) would not see clicks inside the modal, and the Menu also closes on mousedown (r1), so it would still close.
- Checked in real Obsidian: a real press and release on a raw box, on Save, and on the modal titles; toggles are covered in jsdom (Obsidian-shaped `label.checkbox-container > input` toggles and fires `change`, not default-prevented).

## 3. Tests
**jest, +16** (suite 261 of 262 now; was 260 of 261):
- `test/dom/kit/managedModal.test.ts` +9 (describe "SC-595: a modal opened from a hover preview"): window-bubble spy not called while a document listener is; Obsidian-shaped toggle still toggles + `change` + not default-prevented; a click outside the modal (on the popover) still reaches the window; control outside a preview (also: no scope re-push); control with no anchor; guard gone after close (container re-attached); anchor inherited by a modal opened from a modal (FreeHeal shape); keymap: popover scope pushed later, modal's not on top before the deadline, on top after, popover's on top again after close, scope stack restored; closed before the deadline -> nothing pushed back.
- `test/dom/authoring/formModalHoverPreview.test.ts` (new, 3): the real pencil on a block in a `.popover.hover-popover`: click in raw box and on Save never reach the window, form stays for the first, Save lands the edit and closes; control outside a preview; Escape closes the form after the popover's scope is pushed later (Obsidian-shaped keymap routing to the top scope).
- `test/dom/elements/stamina-bar.test.ts` +2 (real bar click -> StaminaEditModal; control); `test/dom/elements/initiative.test.ts` +2 (real `.dse-cond--add` -> ConditionsModal via `InitiativeView.openModal`; control).
- Mock: `FakeKeymap` (scope stack) on the mock `App`, `Modal.open` / `close` push / pop on it when `app.keymap` exists.
- Not driven separately in jest or lifecycle (they share the same `DseModal` path, one line of anchor each): hero's two modals, conditions-panel modal, montage sheets, ResetEncounter, MinionStaminaPool, FreeHealConfirm's real opener (its anchor inheritance is tested at the DseModal level).

**Mutants** (`sc595-r2-mutants.log`; each run over the 16 SC-595 tests, file restored by `git checkout`, tree clean after):
| Mutant | Red | Specific tests |
|---|---|---|
| M1 drop the guard | 6 | click-inside (a), toggle, anchor-inherit, stamina, conditions, form |
| M2 `preventDefault` instead of `stopPropagation` | 6 | same set, incl. the toggle test (b) |
| M3 drop the re-push | 2 | kit keymap test, form Escape test (e) |
| M4 drop the `.hover-popover` condition | 5 | the controls (c): kit x2, form, stamina, initiative |

**Lifecycle G-S83** (`visual-harness/obsidian-lifecycle.mjs`, after G-S77, before G-S56; real CDP mouse, derived from the r1 probe; no `.click()`):
- form, RV and LP: hover (real hover both times), + then pencil, press+release in the raw box -> preview and form open; `Input.insertText`, a second click, a real click on Save -> note holds the edit, no Notice, form closed, preview shown; a new form via the pencil, Escape -> form closed, preview shown; a real click outside -> preview closed.
- stamina modal RV and LP, Conditions modal RV: a real click on the modal title leaves preview and modal open; Escape closes the modal and leaves the preview.
- Head: `done: 1/1 ok` alone, 50 s including build and start-up. In part 5: 312 s (part 5 was 272 s with four scenarios).
- **Red on base** (`sc595-r2-red-on-base-G-S83.log`): bundle built from `git archive eaa8742a` in a scratch dir (never touching develop), `DSE_LIFECYCLE_BUNDLE=<that dir>` with the new harness: `FAIL: form rv/lp: a real click in the raw box closed {"popover":false,"modal":false}`; stamina rv/lp and conditions rv: the title click closed both. Exit 1.
- Authoring footguns found are in the proposal file.

## 4. Gates (dse head `0f5c9c98`, host loadavg 5-24; logs next to this report)
| Gate | Result | Log |
|---|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | clean, rc 0 | `sc595-r2-gate-tsc.log` |
| lint (`eslint src main.ts e2e`) | clean, rc 0 (the `.eslintignore` warning is pre-existing) | `sc595-r2-gate-lint.log` |
| jest (fresh worktree, `rm -f main.js styles.css` first) | Tests: 1 failed, 2 skipped, **7192 passed**, 7195 total; suites 1 failed, 1 skipped, 260 passed, 262 total. The 1 failure is `twin-reuse` SC-547 "Exceeded timeout of 5000 ms" (SC-568); `twin-reuse` + `initiative-default-keys` alone with `-w 2`: **78/78**. 7192 + 1 = **7193** = 7177 + 16 | `sc595-r2-gate-jest.log`, `sc595-r2-gate-jest-sc568-alone.log` |
| lifecycle p1 `G-S7a … G-S9a` | **21/21** | `sc595-r2-gate-lifecycle-p1.log` |
| lifecycle p2 `G-S9b … G-S40` | **16/16** | `…-p2.log` |
| lifecycle p3 `G-S45 … G-S64` | **9/9**, 504 s (loadavg 5-24, on the ~480 s line, no phase added) | `…-p3.log` |
| lifecycle p4 `G-S57 G-S62 G-S61 G-S56` | **4/4**, 322 s | `…-p4.log` |
| lifecycle p5 `G-S59 G-S49 G-S73 G-S77 G-S83` | **5/5**, 312 s | `…-p5.log` |
| e2e | `OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`, 220 s, rc 0 | `sc595-r2-gate-e2e.log` |
| styles.css | sha256 `5e5ff4884e05fb2a…` head build == clean `eaa8742a` build, `cmp` identical; `git diff eaa8742a..HEAD -- styles-source.css main.css` empty. shots 592 / freeze 280/280 / parity 0-0-24 carry (not run) | `sc595-r2-gate-styles-sha.log` |

Lifecycle total: 21 + 16 + 9 + 4 + 5 = **55/55**.

## 5. Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-r2-impl-report.md` (this file)
- `.../sc595-r2-mutants.log`, `.../sc595-r2-red-on-base-G-S83.log`, `.../sc595-dse-verify-proposal.md`
- `.../sc595-r2-gate-tsc.log`, `-lint.log`, `-jest.log`, `-jest-sc568-alone.log`, `-lifecycle-p1.log` … `-p5.log`, `-e2e.log`, `-styles-sha.log` (all in the same dir)
- Scratch (private): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r2-impl-a/` (gate scripts, base build `base/`, mutant json).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes` (dse `0f5c9c98`; superproject `597f6203`, `draw-steel-elements` pointer modified and unstaged).

Drive-by fixes: none.

Follow-ups:
1. SC-597 (modal opened from a preview by keyboard alone closes ~300 ms later) is unchanged and out of scope. The new guard does not help it (no click, so the popover never becomes focused).
2. The re-push is timing-based (200 ms vs the popover's 150 ms click-to-edit delay in Obsidian 1.15.1). Escape pressed in the first 200 ms after a preview-opened modal appears goes to the popover's scope (nothing happens, as before SC-595). If a future Obsidian lengthens that delay, G-S83's Escape steps go red. A nested modal opened by code within 200 ms of its parent would be buried by the parent's re-push (nothing does that today; FreeHealConfirm opens on a user click).
3. A preview-opened modal that opens an Obsidian `Menu` or suggest from inside it would not see its own clicks at window level: no such case exists in `src/` today (section 2).
4. After Save / Cancel the preview stays until a click outside it (Obsidian's behaviour for a preview you have clicked into). Design B (preview closes, form survives) remains the alternative only; offer it in the land-ready comment per O4.
5. Not exercised in real Obsidian: popout windows (the guard and the timer use the modal's own document / window; the harness has no popout), hero / montage / conditions-panel / pool / reset modals from a preview (same code path, jsdom-covered at the DseModal level).
6. Merging note for the owner: the superproject checkout keeps `draw-steel-elements` modified (new pointer, unstaged); `wt-finish` bumps it.
