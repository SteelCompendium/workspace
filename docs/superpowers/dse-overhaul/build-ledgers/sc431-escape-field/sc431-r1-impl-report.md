# SC-431 r1 implementation report

## Executive summary
- STATUS: DONE. dse branch `sc431-escape-field` head `56c83b8` (cut at origin/develop `d58cf6a`, unmoved); superproject CHANGELOG commit `a7f5d96`. Not pushed, no tags.
- Root cause (read from Obsidian 1.14.4 app.js, proven in real Obsidian): the Keymap listens for keydown on `window` in the CAPTURE phase and runs the modal Scope from there, before the field's own handler, so the stepper's stopPropagation could never stop the close.
- Fix: `DseModal.onEscapeKey` override (the method Obsidian's Modal constructor binds as the Scope's Escape handler) asks the focused field to cancel a dirty draft (new `kit/draftCancel.ts` registry, filled by the editable stepper); otherwise falls through to the host close.
- Covers Stamina + Temp Stamina fields and every editable stepper inside a DseModal (also the minion pool modal) for free.
- e2e: STAM-S06 flipped from known-bug to plain `it`; added STAM-T12 (Temp field). Both fail with the fix neutralised, pass with it.
- Gates all green: tsc/lint clean, jest 4967 passed/1 skipped/229 of 230, lifecycle 26/26, e2e 73/77 ok 0 failed 4 known-bug 52/52 pairs, shots 572 0 FAIL, freeze 276/276, parity 0/0/24.

## Mechanism (<=5 lines)
Scope registration order makes a later `scope.register([], 'Escape')` unreachable (Obsidian's handleKey returns on the first keyed match, and the Modal constructor's own Escape handler is first), and a DOM capture listener cannot beat a `window` capture listener registered at app start. So the override of `onEscapeKey` (bound in the Modal constructor via `this.onEscapeKey.bind(this)`, so a subclass override is what gets registered) is the one place that runs first using the public Scope path; it keeps the host close for the non-draft case by calling `Modal.prototype.onEscapeKey`. Not in obsidian.d.ts, hence a cast; STAM-S06/T12 fail loudly if a host version stops calling it. Lifecycle: the registry is a WeakMap entry dropped via `owner.register` on unload; no window/document listener is added, so nothing leaks on close/reopen.

## Files changed (dse)
- `src/framework/kit/draftCancel.ts` (new): `registerDraftCancel`, `cancelDraftAt`.
- `src/framework/kit/stepper.ts`: factor `cancelDraft()`, register it; own keydown handler kept for stepper-in-a-note.
- `src/framework/kit/managedModal.ts`: `onEscapeKey` override.
- `test/mocks/obsidian-core.ts`: mock `Scope` (real handleKey semantics) + mock `Modal.scope`/`onEscapeKey`.
- `test/dom/_obsidianKeymap.ts` (new helper: window-capture Keymap stand-in), tests in `test/dom/kit/{managedModal,stepper}.test.ts`, `test/dom/views/{stamina-edit-modal,minion-stamina-pool-modal}.test.ts`.
- `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts` (S06 flipped, T12 added), `e2e/manifest/stamina-edit-modal.ts` (`sedit.temp.input` + `press:Escape`, row T12).
- Superproject: `CHANGELOG.md` (Unreleased bullet).

## Commits
- dse `cb613d8` fix(modal): SC-431 ... ; dse `56c83b8` test(e2e): SC-431 ...
- superproject `a7f5d96` docs(changelog): SC-431 ... (the `draw-steel-elements` pointer bump is left unstaged for wt-finish)
- No co-author trailer (global CLAUDE.md rule).

## Gates (final head 56c83b8)
- tsc: clean, rc=0 (`sc431-r1-tsc-final.log`); lint: clean, rc=0 (only the pre-existing .eslintignore warning).
- jest: `Test Suites: 1 skipped, 229 passed, 229 of 230 total` / `Tests: 1 skipped, 4967 passed, 4968 total`, rc=0. My 15 new tests; the dispatch baseline said 4950, the net is +17, i.e. 2 more than I added. Not chased, no failures. Note: a fresh worktree lacks `visual-harness/dist/obsidian-app.css`, which makes `printTwinDeltaAllowedSet` skip one more test (4966/2 skipped) until `npm run host-css` is run; I ran it (gitignored output). token-coverage ran (DSE_TOKEN_MAP_PATH not needed).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`, rc=0 (DSE_LIFECYCLE_PORT=9431).
- e2e: `OBSIDIAN-E2E done: 73/77 ok, 0 failed, 4 known-bug, coverage: 52/52 pairs`, rc=0 (baseline 71/76, 5 kb, 51/51).
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (... 96 comparisons ...)`, `host-copy pin OK`, `button host-leak OK (112 button kinds x 3 states x dark/light = 672 comparisons ...)`, rc=0.
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`, rc=0.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc=0.
- Negative controls: jest with the draft check neutralised -> 8 failures in managedModal + stamina-edit-modal tests; e2e with it neutralised -> STAM-S06 and STAM-T12 both FAIL "the first Escape should revert only the half-typed draft and keep the modal open".

## Observations
- T12: after Damage 4 the Temp field already reads 1 (Damage absorbs 4 of the 5 temp), so the reverted value is `1`, not 5; the note stays 15/5 (no write).

## Drive-by fixes
None.

## Follow-ups
1. ConditionsModal combobox (`src/views/ConditionsModal.ts:570`): Escape in the add-condition combobox does `preventDefault` + `stopPropagation` + `closeAdd()` ("so closing the DROPDOWN doesn't ALSO close the whole MODAL"). Same bug by the same mechanism (the Scope runs first in window capture), so it presumably closes the whole modal. By analysis only, not probed in real Obsidian; its jest test (`conditions-modal.test.ts` "does not bubble past this modal") is jsdom-blind exactly like SC-431. Fix is a few lines using this change's registry (register a canceler that returns true when the dropdown is open) - NOT free.
2. Not affected (not inside an Obsidian modal Scope): RecoveriesStrip pips/popover Escape (`RecoveriesStrip.ts:270`) and initiative inline title edit Escape (`initiative/view.ts:362`) - in-note widgets; no other `Escape` handler exists in `src/`. Other DseModals (Reset, Migration, Legacy, Form, Montage config/log) rely on the host default close, which is intended.
3. Plain (non-stepper) inputs in DseModals, e.g. the Apply box, still close the modal on Escape with typed text; no draft-revert was ever intended there.
4. Docs outside this worktree not touched (brief: never write under workspace/): the `dse-verify` skill's "today 71/76 ... 51/51" and "26/26" lines should become `73/77 ... 4 known-bug ... 52/52`; `e2e/README.md` has no counts to change.
5. `onEscapeKey` is an undocumented Obsidian method; if Obsidian renames it the e2e gate (S06/T12) catches it.

## Evidence artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/)
sc431-r1-impl-report.md, sc431-r1-run.sh (gate wrapper), sc431-r1-npmci.log, sc431-r1-tsc.log, sc431-r1-tsc-final.log, sc431-r1-lint.log, sc431-r1-lint-final.log, sc431-r1-jest-focus.log, sc431-r1-jest-negcheck.log, sc431-r1-jest-pool.log, sc431-r1-jest.log, sc431-r1-jest2.log, sc431-r1-jest3.log (final jest), sc431-r1-hostcss.log, sc431-r1-e2e-focus.log, sc431-r1-e2e-focus2.log, sc431-r1-e2e-negcontrol.log, sc431-r1-e2e-full.log, sc431-r1-lifecycle.log, sc431-r1-shots.log, sc431-r1-freeze.log, sc431-r1-parity.log.
