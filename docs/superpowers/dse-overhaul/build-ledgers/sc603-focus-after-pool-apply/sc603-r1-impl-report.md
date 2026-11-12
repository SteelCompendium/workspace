# SC-603 r1 implementer report

**Executive summary**
- Verdict: DONE. Branch `sc603-focus-after-pool-apply`, nothing pushed. dse `7813b333` (base `b5d18f79`, unmoved on origin), superproject `9d1568ec` (CHANGELOG only; the dse pointer bump is left unstaged for `wt-finish`).
- Fix: `openModal` in `src/elements/initiative/view.ts` captures the focus token before any modal opens and hands it to the rebuilt successor one microtask after the modal closes. Reuses `controlFocus.ts`. Reset encounter opts out (it has its own, async hand-back).
- Fixes more than the ask: the Conditions window (partial row rebuild) dropped focus to body too, and a captain-bonus Stamina edit (full rebuild) would; both are covered by the same hook.
- Tests: jest +11 (7339 passed / 2 skipped; 4 red on base: F08 F09 F13 F16), e2e +6 (INIT-F07..F12; 3 red on base: F07 F08 F11).
- Gates: tsc clean, lint clean, jest 7339/2, lifecycle 56/56 (21+16+9+4+6), e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (169 -> 171: two new manifest pairs).
- `styles.css` sha256 identical to a clean `b5d18f79` build (`5e5ff488...2b27`), so shots 592 / host-leak / capture clip / freeze 280/280 / parity 0/0/24 carry; not re-run.
- Roster double-click keyboard reachability: CONFIRMED reachable (INIT-F12, green on base too). No ticket needed.
- `managedModal.ts` not touched.

## 1. What Obsidian's Modal does with focus on close (measured, 1.14.4, e2e probe with a `HTMLElement.prototype.focus` wrapper + focusin/out log)

- `Modal.open()` focuses the first control (stack `BE <- e.open`), then DseModal re-focuses its own first control (the pool modal: damage box).
- `Modal.close()` calls `opener.focus()` **synchronously inside `close()`** (stack `app.js ... e.close`), where the opener is whatever held focus when the modal opened: the opener control, or `.markdown-preview-view` when focus was on the note's container (a mouse-opened modal).
- If the opener is no longer in the document, Obsidian makes **no focus call at all**; the browser drops focus to `<body>`. That is the bug.
- Escape from the pool modal: `focusout damage-amount`, `focus() init.detail.stamina`, ACTIVE = the opener (so Cancel/Escape land on the opener today).
- The modal's `onClose` runs inside `close()`; the pool modal calls `this.persist(); this.close();` so its save callback (which rebuilds the whole tracker synchronously: `update()` empties the root and `onMount` runs before `rebuildAndPersist` first yields) runs **before** the modal closes, while the modal still holds focus. `rebuildAndPersist`'s own capture therefore sees focus outside the tracker and returns null: that is why SC-588's mechanism did nothing here.
- After the save write (~400 ms later) the existing adoption refocus (`n` in the plugin's MutationObserver) runs; harmless, it refocuses the same control.

Probe output: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r1-impl/probe-out-base.txt` (probe spec text: `.../zzprobe603.e2e.ts.txt`, never committed).

## 2. Survey: every modal the tracker opens, per close route (base vs after)

`openModal(` sites in `view.ts` (base line numbers): ResetEncounterModal ~365, hero StaminaEditModal ~1615, pool modal grid dblclick ~1843, creature Stamina modal via `openCreatureStaminaModal` (grid dblclick ~1849, detail row ~1971; modal at ~2060), pool modal detail row ~1964, ConditionsModal ~2257. Measured = real Obsidian probe (P-numbers) or e2e; "jest" = jest only.

| Site (opener) | Save route | Base | After |
|---|---|---|---|
| Pool modal, detail row Stamina control (keyboard-focused) | Apply (Enter or click), full rebuild | `<body>` (P1; INIT-F07 red) | rebuilt `init.detail.stamina`, ring kept (INIT-F07) |
| Pool modal, detail row bar (mouse) | Apply | focus was not in the tracker at open: lands where it was (note container); nothing to restore | same, by design (jest F11) |
| Pool modal, grid cell dblclick, cell keyboard-focused | Apply | `<body>` (P3; INIT-F08 red) | rebuilt cell of the same minion (`0-3`) (INIT-F08) |
| Pool modal, grid cell dblclick, nothing focused (pure mouse) | Apply | note container (`.markdown-preview-view`) (P2) | same (not a bug: focus was not in the tracker) |
| Pool modal, either opener | Cancel (X) / Escape / backdrop | opener (P4) | opener, unchanged (INIT-F10, jest F10 x2) |
| Creature Stamina modal, grid cell dblclick (keyboard-focused cell) | Apply (Enter, click) | cell (P6), partial repaint, opener survives | unchanged (INIT-F09, jest F15) |
| Creature Stamina modal, detail row Stamina control | Apply | opener (P7) | unchanged (jest F14) |
| Creature Stamina modal, captain whose Stamina flips the squad bonus | Apply, full `rebuildAndPersist` | opener replaced: `<body>` (jest F16 red on base); real Obsidian not probed for this branch (the e2e captain fixture has no bonus) | rebuilt detail row Stamina control (jest F16) |
| Hero Stamina modal (numeric control / bar) | Apply | opener (P8), partial repaint | unchanged (jest F14) |
| Any Stamina modal | Escape / Cancel | opener (P9) | unchanged |
| ConditionsModal, Add Condition button (keyboard) | each edit rebuilds the conditions row behind the window; then Escape / X / Done | `<body>` (P10; INIT-F11 red) | rebuilt `init.cond.add` (INIT-F11, jest F13) |
| ConditionsModal, closed without any edit | Escape / X | opener (row not rebuilt) | unchanged (the hook is a no-op while focus is on the live opener) |
| ResetEncounterModal | Yes, Reset | already fixed by SC-588 (own token, after the inert re-parse) | unchanged; `openModal(..., false)` skips the generic hook so the two never overlap |
| ResetEncounterModal | Cancel / Escape | opener | unchanged |

Scope note: the ledger scoped "modals whose save rebuilds the whole tracker". The Conditions window is a PARTIAL rebuild (the conditions row) but drops focus identically, so it is fixed by the same hook (surveyed per the instruction "fix every site where it drops to the page body"); say so if the owner wants it carved out. The hero/creature Stamina modals needed no code (opener survives), only tests.

## 3. Design

- **Capture** (`view.ts` `openModal`, ~line 232): `captureControlFocus(this.rootEl, FOCUS_FAMILIES)` before the modal opens, for every modal, same call the Reset item already makes. `null` when focus was not inside the tracker (a mouse open: Reading view's click shield never focuses the button), so nothing is restored then.
- **Restore** (`giveFocusBack`, ~line 252): called from the wrapped `onClose` (after the modal's own `onClose` and the `activeModal` null-out). It defers ONE microtask (`Promise.resolve().then`, not `queueMicrotask`, which jest's fake timers fake) and calls `restoreControlFocus(this.rootEl, focus, FOCUS_FAMILIES)`.
- **Why it wins over the modal's close handling:** Obsidian's focus return is synchronous inside `close()`; the microtask runs after `close()` has returned. By then focus is either on the live opener (Cancel, Escape, in-place repaints: `focusIsFree` false, so `restoreControlFocus` is a no-op and Obsidian's landing stands) or on `<body>` because the opener was replaced (restore lands on the successor: same family, same nth, else the last of the family, else the tracker root with `tabindex=-1`, never body). The rebuild itself is synchronous inside the modal's save callback, so the successor already exists at that point.
- **Stays out of the way:** `restoreControlFocus` refuses when anything already holds focus (the user moved it, another pane): jest F12. A view that is unloading sets `this.unloading` in the constructor's existing close-on-unload registration, so the close that causes does not hand focus into a dying tracker. Disconnected root: skipped.
- Ring: `captureControlFocus` records `:focus-visible` at open, so a keyboard open gets the keyboard ring back (INIT-F07 asserts `ring: true`), a pointer open gets plain focus.
- No second mechanism: `controlFocus.ts` and `focusHandoff.ts` unchanged. `managedModal.ts` not touched.

## 4. Roster double-click keyboard reachability (ledger ruling)

Confirmed in real Obsidian by INIT-F12 (green on base, so reachable today): Tab to the roster cell (a `<button>`), Enter selects it (`click`, one write), the detail row's `init.detail.stamina` then reads `Edit Stamina: Ogre #2`, Tab to it, Enter opens the Stamina modal for that creature, Apply writes 55/60 to cell `0-2` and leaves the other Ogre alone. For a squad minion the same route opens the pool modal (INIT-F07's route). No gap, nothing to file.

## 5. Files changed (dse, vs `b5d18f79`)

- `src/elements/initiative/view.ts`: constructor close-on-unload registration also sets `unloading` (~153) and the `unloading` field (~158); `openModal` doc + capture + `restoreFocus` param (~224-245); `giveFocusBack` (~252-259); Reset item passes `false` (~397).
- `test/dom/elements/initiative-matrix.test.ts`: new `describe('after a modal whose save replaces its opener (SC-603)')` inside group [F] (~823-1020), with a local stand-in for Obsidian's focus return on `Modal.open/close` (the shared mock does none; changing it broke 12 `formSaveFocus` tests that rely on the mock not returning focus, so it stays local).
- `e2e/specs/initiative/focus-after-modal.e2e.ts` (new, INIT-F07..F12).
- `e2e/manifest/initiative.ts` (`init.cell.stamina` + `press:Enter`), `e2e/manifest/stamina-edit-modal.ts` (`sedit.apply` + `press:Enter`): coverage 169 -> 171 pairs.
- `CHANGELOG.md` (dse) and `CHANGELOG.md` (worktree superproject): `[FIX]` bullet / bullet under `## Unreleased`, SC-588/SC-589 style, "Reading view and the pinned sidebar tracker", Live Preview points at SC-602.

Commits (dse): `a1fbd847` fix + jest, `1cc9eaf2` e2e, `b703ffa9` CHANGELOG, `7813b333` e2e coverage-id fix. Superproject: `9d1568ec` CHANGELOG. No Co-Authored-By trailer (Scott's global rule).

## 6. Tests (red on base)

jest, `initiative-matrix.test.ts` (run `-t SC-603`; base = `git checkout b5d18f79 -- src/elements/initiative/view.ts`): base `4 failed, 7 passed`; fixed `11 passed`. Log `.../jest-red3.log` (base) and `.../jest-green4.log`.
- RED on base: F08 pool from detail row control; F09 pool from keyboard-focused cell dblclick; F13 Conditions window; F16 captain bonus crossing.
- Green guards: F10 (X and Escape x2, opener keeps focus, no rebuild), F11 (focus not in tracker at open: untouched), F12 (focus moved by the user before the hand-back: untouched), F14 (hero and Ogre detail Stamina modals x2), F15 (Stamina modal from a cell).
e2e `INIT-F07..F12`: base `3 failed, 3 passed` (F07, F08, F11 red; F09, F10, F12 green); fixed `6/6`. Logs `.../e2e-new-RED-base.log`, `.../e2e-new-GREEN-fixed.log`. F09 (Stamina modal from a cell, Enter) is a green guard: that route already worked on base, it is the ledger's second named e2e.
No known-bug marker for SC-603 existed. No lifecycle scenario added. Titles carry no bracketed ticket id.

## 7. Gate summary lines (all against dse `7813b333`)

- tsc (incl. `tsc -p e2e`): `tsc rc=0`, clean. Lint (incl. `e2e/`): `lint rc=0`, clean.
- jest: `Tests: 2 skipped, 7339 passed, 7341 total`, `Test Suites: 1 skipped, 263 passed`, rc 0 (base 7328; +11).
- Lifecycle (five foreground parts): `21/21 ok, 0 failed`; `16/16`; `9/9`; `4/4` (G-S56 last); `6/6` = 56/56.
- e2e: `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0 (base 272/276, 169/169; +6 tests, +2 pairs). Known bugs unchanged: SC-257, SC-355, SC-384, SC-580. First full run printed `coverage gate FAILED: pool.apply x press:Enter in no manifest`: my spec returned a control handle through an `async` helper, which loses the id the gate reads; fixed in `7813b333`, log kept `.../e2e-full-attempt1-coverage-fail.log`.
- Shots / freeze / parity: not re-run. `styles.css` built at HEAD and at a `b5d18f79` view.ts are byte-identical (sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`), no CSS source touched, so 592 shots, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280 and parity 0/0/24 carry.

Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r1-impl/` (jest-full2.log, lc1..lc5.log, e2e-full.log, gate-tsc.log, gate-lint.log, css-sha.txt, probe-out-base.txt).

## Drive-by fixes:
None.

## Follow-ups:
- dse-verify "Current expected numbers" needs the new CURRENT: jest 7339/2 (fresh worktree), e2e `278/282 ok, 4 known-bug, coverage 171/171`; dse-verify's e2e/coverage prose too.
- The captain-bonus branch (F16) was proven in jest only; the e2e captain fixture (`Initiative/captain.md`) has no `with_captain_stamina`, so a real-Obsidian case would need a new fixture note. Not worth one on its own.
- The hover-preview path (SC-595: tracker opened inside a `.hover-popover`) was not exercised; the hook is view-local and independent of it, but unverified there.
- The shared jest `Modal` mock does not return focus to the opener (real Obsidian does, synchronously in `close()`); tests that care stand it in locally. Making the mock faithful needs the SC-518 `formSaveFocus` tests reworked (12 depend on the old behaviour).
