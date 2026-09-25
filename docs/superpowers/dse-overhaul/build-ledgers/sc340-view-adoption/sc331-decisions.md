# SC-331 — decisions ledger

Ticket: SC-331 "Initiative: condition edit behavior is odd" (DSE Plugin).
Worktree: /home/scott/code/steelCompendium/worktrees/sc331-condition-modal (dse branch `sc331-condition-modal`, base origin/develop `d124cc3`).
Owner: top-level session 524e7562-85b1-4f85-bfbc-08f716269258 (Opus 5.5).

## Scott's rulings (verbatim, dated)

- 2026-09-20 (ticket body): "editing/adding the condition seems to close the modal.  Verify this and figure out why"

## Owner decisions (2026-09-23)

- Root-cause hypothesis from code reading (to be VERIFIED by a real repro before any fix is trusted):
  `src/elements/initiative/view.ts` add-condition onClick (~L1760) opens `ConditionsModal` whose
  onChange fires on EVERY add/delete/customize and calls `void this.persist()`. ~400ms later
  (PERSIST_DEBOUNCE_MS) `host.replaceSource()` rewrites the note; Obsidian re-renders the code
  block, the OLD InitiativeView unloads, and its constructor registration
  `this.register(() => this.activeModal?.close())` closes the still-open modal.
  `src/elements/conditions/panel.ts` (ds-conditions) already hit and fixed exactly this as
  SC-186 fix-round HIGH-4 (defer persist to modal close) — but its comment wrongly claims the
  initiative path "needs no equivalent fix".
- Fix shape: mirror the HIGH-4 precedent in the initiative view — keep the tracker row visually
  live on every change (`character.conditions = updated; rerender()`), but defer `persist()` to
  modal close, and only if something changed. Correct the stale panel.ts comment.
- Evidence bar: a real-Obsidian before/after probe (modal present/absent ~1.5s after adding a
  condition) + jsdom regression tests. jsdom alone cannot reproduce the echo re-render.

## Round log

- 2026-09-23 impl r1 (orchestration:implementer): hypothesis CONFIRMED in real Obsidian (headless probe
  `sc331-probe.mjs`; base d124cc3 → modal gone by 1500 ms after add AND after a customize edit; note
  already rewritten). Fix `9fe97d6` (+ tests `d00769e`): defer persist to modal close, live rerender.
  Post-fix probe: modal survives 1500 ms in both scenarios, note untouched until Done, then written.
  Gates: tsc/lint clean; jest 3906/1 skipped/202 of 203 suites/3 snapshots (+4); shots 524, 0 FAIL;
  freeze 260/260; parity 0/0/16. Owner eyeballed pre-add-at1500ms / post-add-at1500ms: agrees.
- 2026-09-23 review r1 (orchestration:reviewer) dispatched against 9fe97d6.
- 2026-09-23 owner: NO dse CHANGELOG bullet — the defect never shipped. Released dse `main` (6.0.2, e38d4de)
  has neither `src/views/ConditionsModal.ts` nor the framework `src/elements/initiative/view.ts`; the bug
  exists only in unreleased 7.0 work (SC-186's modal on the v2 initiative view).
- 2026-09-23 review r1 verdict FIX-ROUND (report `sc331-review-r1-report.md`). Diagnosis confirmed by stack
  trace in real Obsidian 1.14.2. Owner rulings on findings:
  - MED-1 (Done → "+" on next combatant within ~450 ms: second modal closed by the echo re-render; r1
    WIDENED this from ~0–72 ms to ~23–423 ms): **FOLD, generalized.** Add a protected
    `flushPendingPersist()` to `src/framework/view.ts` (delegates to the private `flushPersist()`), and call
    it in `InitiativeView.openModal`'s onClose wrapper AFTER `inheritedOnClose()` — so EVERY initiative modal
    close (conditions, stamina, minion pool, reset) writes immediately instead of 400 ms later. Same symptom
    class ("a modal closes by itself"), same view, one call in one wrapper. Stamina modals persist on submit
    and then close, so they had the same ~450 ms race on base; this closes it too.
  - LOW-1 (view unload while modal open drops the pending edit — navigate-away / external same-block edit):
    **ACCEPT for SC-331** (same trade as ds-conditions SC-186 HIGH-4; hotkeys are blocked while the modal is
    open). FOLD the comment correction at `src/framework/view.ts` ~:246-247 ("so closing the note never
    drops the last edit" is false for navigate-away). Real gap filed: **SC-336** (Backlog) — OUT OF SCOPE.
  - LOW-2 (test 4 comment misstates unload order; mock order ≠ Obsidian): FOLD the test-comment fix. Mock
    fidelity filed: **SC-337** (Backlog) — OUT OF SCOPE, do not touch `test/mocks/obsidian-core.ts`.
  - INFO-1 (only test 1 discriminates base vs fix): DROP — tests 2–4 are fix-behavior pins by design.
  - INFO-2 (combobox lists already-active conditions): DROP — deliberate SC-186 MED-2 design.
  - "Consider the same flush in panel.ts": DROP — ds-conditions is one holder per block (no multi-target
    Done→+ workflow), and its persist runs through the container callback, so it would need new plumbing.
- 2026-09-23 impl r2 `93705b9` (on 9fe97d6): flushPendingPersist + openModal onClose flush; LOW-1/LOW-2 comments.
  Test (a) fails on 9fe97d6 ("Expected 1, Received 0"). Reopen probe: only ~9 ms-after-Done still closes;
  164/310/320 ms+ stay open (r1 closed 23–423 ms). Gates: tsc/lint clean; jest 3909/1/202 of 203/3 (+3);
  shots 524 0 FAIL; freeze 260/260; parity 0/0/16. Scoped re-review (reviewer, delta 9fe97d6..93705b9) dispatched.
- 2026-09-23 re-review r2 verdict LAND-READY for 93705b9 (report section "Re-review r2"). Owner rulings:
  - LOW-R2-1 (`openModal` comment, initiative/view.ts:145-149, wrongly says every modal persists before close;
    Reset / grid pool-kill / captain-bonus go through async `rebuildAndPersist` and still write ~400 ms after
    close): FOLD the comment correction. The OPTIONAL `rebuildAndPersist` flush: DECLINE — it also serves
    rapid-click non-modal controls (Advance round / Reset turns) where the debounce coalesces writes; that
    residual is unchanged from base.
  - INFO-R2-1 (framework/view.ts:246-256 wording — Reading→Source doesn't unload; an already-scheduled write
    at navigate-away is lost too): FOLD (comment only).
  - INFO-R2-2 (`src/views/MinionStaminaPoolModal.ts:431-438` — clicking a minion's condition icon removes it
    and calls the injected persist WHILE the modal is open → same echo-rebuild → the pool modal likely closes
    itself): **FOLD** — this is the ticket's exact symptom ("editing … the condition seems to close the
    modal") in another initiative modal. Reproduce in real Obsidian first. Fix shape: the icon handler marks
    conditions dirty instead of persisting; the modal persists ONCE on close if dirty (any close path —
    removal is an immediate action, not a staged draft, so Cancel/Escape must still keep it, as today); Apply
    keeps its single `persist(); close()` and must not double-write (DC-6: removal AND damage in one session
    both persist).
- 2026-09-23 impl r3 `ec3540e` (on 93705b9): pool-modal close CONFIRMED on 93705b9 from both call sites (grid,
  detail); fixed (conditionsDirty → persist once on close; Apply clears flag). 2 pre-existing pool-modal tests
  updated (they pinned the old immediate / double write). Gates: tsc/lint clean; jest 3915/1/202 of 203/3 (+6);
  shots 524 0 FAIL; freeze 260/260; parity 0/0/16.
  - Implementer follow-up (probe confound): selecting a cell persists `selectedInstanceKey`; a modal opened
    within ~400 ms is closed by that write's echo. Owner ruling: FILE — **SC-339** (Backlog; framework-level:
    echo suppression in the reading-mode host or carrying the modal across the re-render). OUT OF SCOPE.
- 2026-09-23 scoped re-review r3 (reviewer, delta 93705b9..ec3540e) dispatched.
- 2026-09-23 re-review r3 verdict LAND-READY for ec3540e. SC-339 premise confirmed on base d124cc3 (cell select →
  stamina modal at ~165 ms: closed 3/3; at 712 ms: open). Owner rulings:
  - INFO-R3-1 (MinionStaminaPoolModal.ts:25 and :277 claim a removal survives "the owning view's unload"; false
    for navigate-away, SC-336): FOLD — comment-only chore commit; owner reviews the comment-only diff itself
    (not runtime code); gates tsc + lint + the two touched test files.
  - INFO-R3-2 (two r3 tests also pass on 93705b9 under fake timers): DROP — the DC-6 and "no persist while open"
    tests do discriminate.
  - Comment draft fix: the pool modal has NO Cancel button — say Apply / Escape / X / click-outside.
- 2026-09-23 chore `2cd5275` (comment-only, owner-reviewed diff): tsc/lint clean, touched suites 137/137.
  LAND-READY: dse branch `sc331-condition-modal` @ 2cd5275. origin/develop moved to e4bcd0f (SC-334, montage,
  unrelated) → rebase + full battery before merge. Approval ask posted to SC-331 (5 inline images);
  state In Progress + Needs Review. Awaiting Scott: "Land the fix on develop?"

## Scott's rulings — 2026-09-23 (terminal, after the landing ask)

- "Before going forward, this seems really fragile in general.  Is there any way to carry out the save in a more reliable way?  The 400ms window is small, but can be error prone (as evident from the backlog tickets you made).  What alternatives do we have?"
- "I think I choose B.  It seems like the "most correct" long-term decision, even if its a bit heavier of a task. Do you agree with that?"
- "The plugin isnt live, so im not super rushed to get sc-331 landed.  Id say kick off your refined version of B"
- Consequence: SC-331 is NOT landed. It waits on **SC-340** (view adoption, "B′"), whose outcome decides whether
  SC-331's per-modal deferral code lands as-is or is replaced by the framework behaviour. SC-331 → Todo,
  blocked by SC-340, `Needs Review` removed. Branch `sc331-condition-modal` @ 2cd5275 kept (worktree kept).
