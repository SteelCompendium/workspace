# SC-431 r1 independent review (reviewer B, Opus) — dse `56c83b8`, superproject `a7f5d96`

## Executive summary
- **Verdict: LAND-READY for the SC-431 scope, with 3 LOW fixes recommended for the fix round** (no BLOCKER, HIGH or MEDIUM in the diff).
- Gates re-run at `56c83b8`: tsc rc=0, lint rc=0, jest 4967 passed / 1 skipped / 229 of 230 suites rc=0, lifecycle 26/26 rc=0, e2e `73/77 ok, 0 failed, 4 known-bug, coverage: 52/52 pairs` rc=0. STAM-S06 is now a plain `it` and passes. STAM-T12 exists and passes. STAM-S07 and F07a/b/c pass.
- Mutation probe: reverting the `onEscapeKey` override turns STAM-S06 and STAM-T12 red in real Obsidian, along with my PRB-01/02/04, and turns 9 jest tests red. Reverting the stepper registration as well turns 10 jest tests red. The new tests are not vacuous.
- `onEscapeKey` is sound. The Modal constructor binds `this.onEscapeKey.bind(this)`, a dynamic lookup, so a subclass override is the function that gets bound. The binding is the same in 1.13.7, 1.14.4 and 1.1.16, and Obsidian's own modals override the same method. I found no sturdier public-API alternative.
- Follow-up F1 is confirmed in real Obsidian. Escape in the ConditionsModal add-condition combobox closes the **whole** Conditions modal, not just the dropdown (PRB-06: modals=0). The note was not written.
- LOW-1: the CHANGELOG claims "the number fields" in the minion window. Only the pool Stamina field is draft-first; the Damage and minion-count boxes still close the window.
- LOW-2: in the tests, the stand-in keymap's `detach()` runs at the end of each test body. One failing test therefore cascades into others: 4 of the 9 failures under the mutation are cascades.
- LOW-3: the managedModal "canceler is torn down" test stays green even with the teardown deleted, so it does not test what its name says.
- The +17 jest delta is explained: the implementer's 15 tests, plus 2 kit-hygiene tests that `kit-index.test.ts` adds automatically for the new `draftCancel.ts`.

## Gates (measured by me, in the foreground, rc read by a script wrapper)
| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc=0 | sc431-r1-review-tsc.log |
| lint | clean (only the old .eslintignore warning), rc=0 | sc431-r1-review-lint.log |
| jest (`main.js`/`styles.css` removed first) | `Test Suites: 1 skipped, 229 passed, 229 of 230` / `Tests: 1 skipped, 4967 passed, 4968 total`, rc=0 | sc431-r1-review-jest.log |
| lifecycle (port 9531) | `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`, rc=0 | sc431-r1-review-lifecycle.log |
| e2e full | `OBSIDIAN-E2E done: 73/77 ok, 0 failed, 4 known-bug, coverage: 52/52 pairs`, rc=0 | sc431-r1-review-e2e-head.log |

I did not re-run shots, freeze or parity: the diff touches no CSS and no rendered DOM.

**The +17 jest delta.** I ran full jest with `--json` at `d58cf6a` and at `56c83b8` in the same throwaway tree and diffed the counts suite by suite:
- managedModal +7
- stepper +3
- stamina-edit-modal +4
- minion-stamina-pool-modal +1
- **kit-index +2** (`draftCancel.ts: never imports from src/elements/` and `draftCancel.ts: zero color literals`)

The kit-index suite adds two hygiene tests for every kit file automatically. The throwaway tree had no `visual-harness/dist`, which gives 3 more skips there (4964/4 vs 4967/1). That is environmental and the same at both commits.

## Mutation probes (throwaway `git worktree` at an absolute scratch path, now removed)
- **M1: revert `managedModal.ts` to `d58cf6a` (the `onEscapeKey` override).**
  - e2e: STAM-S06 and STAM-T12 FAIL ("the first Escape should revert only the half-typed draft…"). PRB-01, PRB-02 and PRB-04 FAIL. STAM-S07, F07a and PRB-05 stay ok, as they should.
  - jest: 9 failed. 4 of those are cascades (see LOW-2). In isolation the clean-Escape tests pass under M1, as they should.
  - Logs: sc431-r1-review-mut1-e2e.log, sc431-r1-review-mut1-jest.log, sc431-r1-review-mut1-jest-isolated2.log.
- **M2: also revert `stepper.ts`** (no registration; `draftCancel.ts` left orphaned). jest: 10 failed, including the stepper `cancelDraftAt` test. Log: sc431-r1-review-mut2-jest.log.
- **M3: delete the `owner.register` teardown in `draftCancel.ts`.** jest: only 1 test fails (the stepper "canceler is dropped when the owner unloads" test). The managedModal teardown test stays green (LOW-3). Log: sc431-r1-review-mut3-jest.log.

## Edge cases in real Obsidian 1.14.4
Spec: sc431-r1-review-probe.e2e.ts. Fixture: sc431-r1-review-probe-counter.md. Log: sc431-r1-review-e2e-probe-head.log.
- PRB-01 (ok): in one modal session, Esc on a dirty Stamina draft reverts it to 15 and the modal stays open. Esc on a dirty Temp draft then reverts it to 1 and the modal stays open, with Apply still reading "Lose 4 Temp Stamina". The third Esc closes the modal with no write.
- PRB-02 (ok): three Escapes (draft revert, close, then one with nothing open). No page error, 0 modals, no write.
- PRB-03 (ok): Esc with focus on a non-stepper control closes the modal and discards the pending Damage, with no write. Tried with a dirty Apply box and with the focused `sedit.stamina.inc` button. Matches F07a.
- PRB-04 (ok): after 5 open / draft-Esc / close cycles, a draft Esc is still draft-first. Exactly one `.modal-container` is open, and 0 after the close. No stale or leaked handler.
- PRB-05 (ok): an in-note `ds-counter` stepper (no modal). A dirty Esc reverts 8 to 5 with no write. The later blur does not write. Typing 7 then Enter still writes 7. No regression. It behaves the same with M1 applied, i.e. as before the fix.
- **PRB-06 (FAIL, records actual behaviour): ConditionsModal.** In the add-condition combobox, typing "daz" (2 menu items) then pressing Escape closes the whole modal: `modals=0 comboboxStillOpen=false`, focus back on the reading view. The note diff is `(identical)`, so nothing was written. Bundle: sc431-r1-review-prb06-bundle/.
- PRB-07 (ok): Esc with the combobox closed closes the Conditions modal (the intended baseline).

## `onEscapeKey` soundness (Addendum)
- `manifest.json` `minAppVersion` is `1.13.0`. I extracted `app.js` from the asars available locally:
  - Pinned e2e 1.14.4: the Modal constructor runs `this.scope=new vS,this.scope.register([],"Escape",this.onEscapeKey.bind(this))`, and the default is `onEscapeKey=function(e){e.defaultPrevented||(e.preventDefault(),this.close())}`.
  - visual-harness 1.13.7: identical.
  - `/opt/Obsidian` 1.1.16: same binding; the default there takes no event.
  - `this.onEscapeKey` is looked up on the instance when the constructor runs, so the subclass prototype method is what gets bound.
  - Obsidian's own Modal subclasses override it the same way: the theme picker, community plugins and settings modals call `e.prototype.onEscapeKey.call(this,t)`.
  - I could not inspect 1.13.0 itself. 1.13.7 brackets it.
- The Keymap is `window.addEventListener("keydown",this.onKeyEvent.bind(this),!0)`. It is registered at app init and runs the top Scope; a `false` result means preventDefault plus stopPropagation.
  - `Scope.handleKey` returns at the first matching *keyed* handler, even when that handler returns `undefined`.
- Why there is no sturdier public alternative:
  - A later `this.scope.register([], 'Escape', …)` is unreachable: the constructor's Escape handler is first and ends the walk.
  - Replacing `this.scope` with a fresh `Scope` would drop `setTabFocusContainerEl(containerEl)`, which is undocumented, and with it the focus trap.
  - A child Scope pushed on focus (`keymap.pushScope`) has the same keyed-handler problem, and push/pop on focus/blur adds a leak surface.
  - A DOM capture listener cannot run before a `window` capture listener that was registered earlier.
- Conclusion: keep the override. If a future host renames the method, the fix silently stops running; nothing crashes, the bug just returns. STAM-S06/T12 catch that only when the e2e pin is bumped (INFO-1).

## Findings

### LOW-1 — CHANGELOG overclaims the minion window
- Where: `CHANGELOG.md:17` (superproject worktree, `a7f5d96`).
- Claim: "The same applies to the number fields in the initiative minion Stamina window."
- Actual: `MinionStaminaPoolModal` has one kit stepper, the pool (`src/views/MinionStaminaPoolModal.ts:118`). The damage box (`:144`) and minion-count box (`:156`) are plain inputs. Those, like the Apply box (PRB-03), still close the window on Escape. That is intended per ledger ruling F3.
- Failure scenario: a user types in the minion damage box, presses Escape expecting the documented behaviour, and loses the pending edits.
- Fix: "The same applies to the pool Stamina field in the initiative minion Stamina window."
- The bullet is otherwise user-facing, plain, and correctly placed under `## Unreleased`.

### LOW-2 — the test keymap listener leaks when an assertion fails, so failures cascade
- Where: `test/dom/kit/managedModal.test.ts:490` (`openWithStepper` attaches the listener; each test calls `detach()` last, e.g. `:520`, `:534`, `:545`, `:555`). `test/dom/views/stamina-edit-modal.test.ts:1015`/`:1039`/`:1044` follow the same pattern.
- Failure scenario: when a draft-first assertion fails, `detach()` never runs, and the window-capture stand-in for the dead modal stays attached. On the next test's Escape, that stale modal's `onEscapeKey` runs first and `preventDefault`s, so the live modal sees `defaultPrevented` and does not close. Under M1, 4 clean-Escape tests failed this way, and all of them pass in isolation. A real regression would show inflated, misleading failures.
- Fix: track detachers in the describe and call them in `afterEach`, or use `try/finally`. Apply the same to the stamina-edit-modal and pool-modal SC-431 blocks.

### LOW-3 — the "torn down on close" jsdom test is vacuous
- Where: `test/dom/kit/managedModal.test.ts:572`.
- Problem: after `modal.close()` the input is detached from the document. An event dispatched on a detached node never reaches the `window` capture listener, so the test passes whether or not the teardown exists (M3 proved it).
- Fix: either assert it through the registry, with `cancelDraftAt(inputEl) === false` after close plus a dirty value still in place (like the stepper test), or retitle it to what it does test: "a closed modal's detached field is inert". The stepper test is the real guard; keep that one.

### MEDIUM (pre-existing, out of SC-431's diff; owner is folding it in) — ConditionsModal combobox Escape closes the whole modal
- Where: `src/views/ConditionsModal.ts:570`. Confirmed in real Obsidian (PRB-06).
- Effect: no data loss, because conditions apply live and the note was not written. But the user's dropdown Escape dismisses the whole editor, contrary to the code comment and to the jsdom test "does not bubble past this modal".
- Prescribed fix: in `renderCombobox`, register the combobox input with the same registry, owned by `this.lifecycle`:

  ```ts
  registerDraftCancel(input, () => { if (!this.addOpen) return false; this.closeAdd(); return true; }, this.lifecycle)
  ```

  Notes for the fix round:
  - The combobox is rebuilt on each `renderAdd`, so each new input registers its own canceler. Old entries sit on detached nodes and are harmless.
  - Consider renaming the registry to `registerEscapeConsumer` / `consumeEscapeAt`, since it would no longer only cancel drafts.
  - Flip the jsdom test to use `attachObsidianKeymap`.
  - Add an e2e scenario like PRB-06: dropdown Escape keeps the modal open, then a second Escape closes it. That needs control ids plus manifest rows (`cond.*`) and a MODAL_KINDS entry, or a scenario under a new surface.

### INFO
- INFO-1: e2e pins Obsidian 1.14.4, so a host rename of `onEscapeKey` would only show at the next pin bump, or with `--obsidian=installed`. Optional: a jest test asserting the mock and the code agree is pointless, so I would just keep the comment.
- INFO-2: `cancelDraftAt(evt.target)` does not check that the target is inside `this.modalEl`. That is harmless: the modal Scope's `tabFocusContainerEl` focus trap keeps focus inside the container, and a closed modal's inputs are detached. A `this.containerEl.contains(target)` guard would be optional hardening.
- INFO-3: Stepper consumers.
  - Editable steppers inside a DseModal: only StaminaEditModal (Stamina `:437`, Temp `:467`) and MinionStaminaPoolModal (pool `:118`). Draft-first is correct for all three.
  - Every other `stepper(` call site is in-note: counter, party, tokens, surges, resource, initiative, rollBar. These have no modal Scope. Their keydown path changed only by refactor (`cancelDraft()` does the same work), and PRB-05 confirms no regression.
  - Shift+Escape does not match the modal's `[]` Escape handler, so it falls through to the stepper's own handler as before.
  - The pool draft-first behaviour is covered by jest only; the e2e vault has no minion fixture.
- INFO-4: The follow-up survey is accurate. `grep 'Escape'` in `src/` finds exactly the 4 handlers the implementer listed: stepper, ConditionsModal, RecoveriesStrip, initiative title. The other DseModals rely on the host close, as intended. `CompendiumSearchModal` is a SuggestModal, which has its own Obsidian Escape handling. Follow-up 4, the dse-verify expected numbers (now 73/77, 4 known-bug, 52/52; jest 4967/1), stands.
- INFO-5: dse `origin/develop` has moved to `7817133` (SC-360, unrelated). The fix round rebases.

## Hygiene
- Before and after `git status --porcelain` (superproject worktree, and dse with `--ignored`) are identical: the pre-existing unstaged ` M draw-steel-elements` pointer, and the usual ignored build output.
- `main.js`/`styles.css` were removed before jest per protocol, then rebuilt by lifecycle/e2e.
- Throwaway worktree `…/scratchpad/wt-probe` was removed with `worktree remove --force`, after its `node_modules` symlink was unlinked. No processes left running. No commits, no stashes on `sc431-escape-field`.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/)
- Report and probe inputs: sc431-r1-review-report.md, sc431-r1-review-probe.e2e.ts, sc431-r1-review-probe-counter.md, sc431-r1-review-prb06-bundle/
- Head gates: sc431-r1-review-tsc.log, sc431-r1-review-lint.log, sc431-r1-review-jest.log, sc431-r1-review-lifecycle.log, sc431-r1-review-e2e-head.log, sc431-r1-review-e2e-probe-head.log
- Mutation runs: sc431-r1-review-mut1-jest.log, sc431-r1-review-mut1-jest-isolated.log, sc431-r1-review-mut1-jest-isolated2.log, sc431-r1-review-mut1-e2e.log, sc431-r1-review-mut2-jest.log, sc431-r1-review-mut3-jest.log
- Jest-count comparison: sc431-r1-review-base-jest4.log, sc431-r1-review-base-jest-full.log, sc431-r1-review-head-jest-full-probe.log
