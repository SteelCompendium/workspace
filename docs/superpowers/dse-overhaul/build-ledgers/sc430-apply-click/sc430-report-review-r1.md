# SC-430 independent review, round 1 (head 7659528, base 0d69ec9)

Executive summary
- VERDICT: FIX-REQUIRED (1 HIGH, 1 MEDIUM, 1 LOW, 4 INFO).
- StaminaEditModal fix works in real Obsidian. STAM-S13 discriminates: with only the modal src reverted, S13 FAILS and with the fix it passes. No double application anywhere: every probe wrote exactly once.
- HIGH-1: the pool modal still swallows the first Apply click when the typed draft is a HEAL. The info text re-renders only at blur and drops from 2 lines to 1, so Apply moves up 13 px. Reproduced at 7659528 in real Obsidian. jest cannot see it because jsdom has no layout.
- MEDIUM-1: [STAM-S13c] (Temp) does not test the fix. It passes with the fix reverted.
- Root cause, measured: the click is lost because Apply MOVES at blur. Its label width changes in the right-aligned footer, and in the pool modal the info text height changes too. Apply being disabled at the press is not the cause. So the load-bearing part of D2 is the label/layout sync; the comments and the ledger wording attribute it to the enabled state (LOW-1).
- D1 holds: the stepper hooks are opt-in, and G-S3 is green. D3 holds for Temp in product code, but its e2e test is vacuous. D4 is done: the marker is removed, and the jest tests fail without the fix (8/11, 7/9, 5/6; every survivor is an unchanged-behaviour pin).
- Gates (measured here): tsc/lint clean · jest 4758 passed / 1 skipped / 227 of 228, RC 0 · lifecycle 25/25 (port 9289) · e2e `61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`, RC 0. Shots/freeze/parity not re-run: there is no first-paint change.

## Findings

### HIGH-1: pool modal, a typed heal draft still swallows the first Apply click
- Where: `src/views/MinionStaminaPoolModal.ts:110-114`. `onDraftInput` calls only `updateActionButton()`. `updateInfoText()` (`:367-379`) reads `this.pendingStaminaChange` and runs only from `refresh()`, i.e. at commit. `.dse-sedit__info` is `white-space: pre-line` (`styles-source.css:1930`).
- Scenario (real Obsidian 1.14.4 / Chrome 150, probe REVP-P1): pool 10/20, 5 goblins. Type `11` in the pool field. Apply shows "Heal 1 stamina" and is enabled. Click Apply's edge. At blur the info text changes from `"0 damage will kill 0 minion(s). \nSelect 0 minion(s) to kill."` (2 lines) to `"Heal 1 stamina; dead minions stay dead."` (1 line). The modal shrinks and Apply moves from y 694.86 to 681.86 (height 24.4), so the press is no longer on it at release. The modal stays open and nothing is written. The same happens at base. The reverse case has the same cause: a typed damage draft after a committed heal goes from 1 line to 2.
- Control probes at 7659528: REVP-P2 (type 9, 1 damage, no kill) ok, and REVP-P3 (type 0, squad wiped) ok. At base REVP-P2 is swallowed, so the branch does fix the damage case.
- The jest test `a typed heal inside the living minions' share … the click persists` (`test/dom/views/minion-stamina-pool-modal.test.ts:584`) passes because jsdom has no layout. That makes it false assurance for this case.
- Fix:
  1. Make `updateInfoText()` draft-aware: use `effectivePending()` in place of `this.pendingStaminaChange`.
  2. Call it from `onDraftInput` together with `updateActionButton()`.
  3. Optional, for consistency: do the same for `updateStaminaBar` (fixed geometry, so it affects only the preview).
  4. Add a jest pin that the info text is unchanged across the blur that commits a draft.
  5. Reconsider F4 (no pool e2e): this class is only visible in real layout. A ready probe exists, see Artifacts; it needs the `zz-squad.md` fixture.

### MEDIUM-1: [STAM-S13c] is vacuous
- Where: `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts:102-112`.
- Measured in a scratch worktree with only `src/views/StaminaEditModal.ts` reverted to 0d69ec9: `STAM-S13 FAIL`, `STAM-S13c ok`, `STAM-S13b ok` (run 20261019-132602-f77b).
- Why: from the no-change state the Temp label "Gain 3 Temp Stamina" is LONGER than "No Stamina Change". The right-aligned button grows to the left, so the inset-3 point stays on it even though Apply is disabled at the press.
- Fix: rebuild it so the label SHRINKS at blur. This is probe REVP-T1, which FAILS at base (swallowed) and passes at 7659528:
  ```ts
  const modal = await openBarModal(NOTE);
  await applyAmount(modal, '7', 'sedit.damage');
  await expectApplyLabel(modal, 'Lose 2 Stamina and Lose 5 Temp Stamina');
  await dse.type(modal.control('sedit.temp.input'), '5', { replace: true });
  // click Apply { inset: 3 } inside waitForWrite; modal closes; count 1
  await dse.expectNoteBlock(NOTE, BAR).toMatchObject({ current_stamina: 13, temp_stamina: 5 });
  ```

### LOW-1: the mechanism is described wrongly in comments and in the ledger
- Where: `src/views/StaminaEditModal.ts:237-241, 579-581`; `src/views/MinionStaminaPoolModal.ts:44-48, 389-393`; `e2e/specs/stamina-bar/stamina-modal-stepper.e2e.ts:88-90`; both jest describe titles; ledger D2 and the brief ("Apply was disabled until blur").
- Evidence:
  - (a) Plain Chromium 149 (Playwright): a disabled button, a disabled checkbox and a disabled "+" are each enabled by the field's blur, and each receives the first click (`probe.cjs`).
  - (b) REVP-R1: Spend Recovery is disabled until blur at 30/30. Type 15 and click its edge: the click lands at base.
  - (c) REVP-P3 at base: pool Apply is disabled at the press, its label grows, and the click lands.
  - (d) REVP-T1 at base: Apply is enabled the whole time, its label shrinks, and the click is swallowed.
- The real cause is a layout change at blur that moves Apply out from under the press.
- Risk: a later refactor that keeps the enabled-state sync but drops the label sync brings the bug back. The real pins are the jest tests named "the label does not change at blur".
- Fix: reword the comments to "label/layout stable across the blur"; owner to note this in the ledger.

### INFO
- INFO-1: label vs persisted value for a below-floor typed draft. Hero, max 20, type `-50`: the label says "Lose 65 Stamina" and Apply persists -10 (REVP-S2: one write, `current_stamina: -10`). The label is identical before and after blur, so this predates the branch. It is the below-floor twin of SC-427 (over-max, F3 dropped). Owner: confirm SC-427's scope covers it, or file a sibling ticket.
- INFO-2: no double application. `commit()` is a no-op when the value is equal, and both `onChange`s assign absolute values, so a draft committed by blur and then by `commitDraft()` in onClick lands once. Measured write count 1 in STAM-S13, S13b, S13c, REVP-T1, REVP-S2 and REVP-S3 (Tab, then click). REVP-E1 (type, then Escape): no write. In real Chromium the press always blurs first, so the onClick `commitDraft()` calls are defensive no-ops on the pointer path.
- INFO-3: the pool kill-checkbox prediction (`MinionStaminaPoolModal.ts:388-394`) matches `updateCheckboxes()` exactly in all three branches. When pool <= 0 every box is checked, which equals `minionsToKill = aliveMinions`. When kills <= 0 no box is checked. Otherwise the checked count is kept, because that branch only toggles `disabled`. A draft that needs kills keeps Apply disabled, as it would after blur.
- INFO-4: test-count bookkeeping. The branch adds 26 jest tests (stepper 6, modal 11, pool 9), and 4732 + 26 = 4758. The impl report says "+10 modal" and "+1 printTwin now runs". The total is right; the breakdown is off.
- Also checked, no finding:
  - D1: every `stepper()` caller other than the 3 modal sites passes no `onDraftInput`, and with the option absent there is no `input` listener. G-S3 measured: "half-typed stepper draft not committed by adoption, committed by Tab".
  - The Apply-amount boxes (`sedit.apply-amount`, pool damage/minion count) gate no disabled control.
  - REVP-T2 (temp "−" after typing) "failed" because of the SC-433 take-higher rule, not a swallow. The "+" variant lands at base and at the fix.

## Gate lines (this review)
- tsc: `tsc --noEmit && tsc --noEmit -p e2e`, RC=0. lint: RC=0.
- jest: `Tests: 1 skipped, 4758 passed, 4759 total`; `Test Suites: 1 skipped, 227 passed, 227 of 228 total`; RC=0.
- lifecycle (DSE_LIFECYCLE_PORT=9289): `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`; RC=0.
- e2e full: `OBSIDIAN-E2E done: 61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`; RC=0. The brief's 60/71 did not count the new S13c.
- Negative controls (scratch worktree, one src file reverted at a time):
  - stamina-edit-modal: 8 failed / 76.
  - pool: 7 failed / 44.
  - stepper: 5 failed / 39.
  - Restored: 159/159.
- Real-Obsidian discrimination:
  - Modal src reverted: S13 FAIL, S13c ok (vacuous), S13b ok.
  - Probes at the fix: T1, S2, S3, R1, E1 ok; P1 FAIL (HIGH-1); P2, P3 ok.
  - Probes at base: T1 FAIL, S2 FAIL, P1 FAIL, P2 FAIL, P3 ok, R1 ok.

## Artifacts (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc430-rev/)
- Logs: jest.log, lifecycle.log, e2e.log, tsc.log, lint.log, neg-*.log, e2e-revert.log, e2e-probe-base.log, e2e-probe-fix.log, e2e-probe-fix2.log, e2e-probe-base2.log, e2e-pool-fix.log, e2e-pool-base.log.
- Probes: probes/zz-review-probe.e2e.ts, probes/zz-pool-probe.e2e.ts, probes/zz-squad.md (fixture), probe.cjs (plain Chromium).
- Failure bundles: probes/REVP-P1-bundle-fix/ (HIGH-1 at 7659528), probes/STAM-S13-bundle-revert/.
- The scratch worktree has been removed. Review worktree: `git status --porcelain` is empty before and after, HEAD 7659528.

---

# R2 scoped re-review (delta 7659528..7644fb3: 963a408, 7644fb3)

Executive summary
- VERDICT: LAND-READY. 0 findings at CRITICAL/HIGH/MEDIUM/LOW; 1 INFO.
- HIGH-1 is fixed. `updateInfoText()` now uses `effectivePending()` (MinionStaminaPoolModal.ts:372-385) and runs from `onDraftInput` (:117). Real Obsidian: REVP-P1/P2/P3 ok at 7644fb3. With the pool file reverted to 7659528, REVP-P1 FAILS and P2/P3 stay ok.
- MEDIUM-1 is fixed. [STAM-S13c] now has the REVP-T1 shape (stamina-modal-stepper.e2e.ts:103-118). With StaminaEditModal reverted to 0d69ec9 it FAILS (S13 FAIL, T1 FAIL, S13b ok); at head it passes.
- LOW-1 is fixed. The comments at StaminaEditModal.ts:237-245, 582-585, MinionStaminaPoolModal.ts:44-52, 395-398 and e2e S13 :88-91 now state the measured cause, and both jest describe titles were reworded. No residual "enabled button" wording remains in SC-430 code.
- The implementer's sweep claim holds, measured. A real-Obsidian probe snapshots every element rect in the modal (excluding the preview-bar internals) before and after the committing blur. Result: 0 moved, 0 added in all 14 scenarios at 7644fb3 (8 stamina modal, 6 pool).
- The sweep is sensitive: with src reverted it reports Apply moving in A1/A5/P2 and 75 elements moving in P1.
- New pool jest pins are non-vacuous: with the pool file at 7659528, 2 of 3 fail (HEAL and DAMAGE-after-heal). The Escape pin passes there, i.e. it pins unchanged behaviour.
- Gates: tsc/lint clean · jest 4761 passed / 1 skipped / 227 of 228, RC 0 · e2e full `61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`, RC 0. Lifecycle was not re-run: the delta touches no stepper or lifecycle path, only the pool info text, comments and tests.

## Detail
- Sweep scenarios, all ok at head:
  - Stamina modal:
    - A1: basic, stamina 12
    - A2: basic, -50 (below floor)
    - A3: basic, 30 (over max)
    - A4: basic, temp 8
    - A5: Damage 7, then temp 5
    - A6: recoveries-full, temp 0 to 4 (gauge `data-temp` off to on)
    - A7: recoveries-full, stamina 15 (Spend Recovery re-enables)
    - A8: dying, stamina 5
  - Pool (pool 10/20, 5 goblins):
    - P1: heal 11
    - P2: 9
    - P3: 0 (all boxes auto-check)
    - P4: 6 (needs kills)
    - P5: 15 (refused heal)
    - P6: 25 (over max, input clamps to 20)
- Before/after content is identical once the draft is synced, so the result does not depend on viewport width. Checkbox state changes are colour only (styles-source.css:1956-1962). The preview cluster has no `.dse-stamina__ctemp`, and `gidx--max` is absolutely positioned.
- INFO-R2-1: the pool Escape pin (`Escape on a heal draft restores the committed info text`) is an unchanged-behaviour pin: it passes at 7659528 too. That is acceptable, since it guards a future regression where the draft text survives Escape.

## Gate lines (R2)
- tsc RC=0, lint RC=0.
- jest: `Tests: 1 skipped, 4761 passed, 4762 total`; `Test Suites: 1 skipped, 227 passed, 227 of 228 total`; RC=0.
- e2e full: `OBSIDIAN-E2E done: 61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`; RC=0 (STAM-S13, S13c, S13b ok).
- Probes at head: REVP-P1, P2, P3, T1, S2, S3, R1, E1 ok; REVS 14/14 ok, 0 moved.
- Controls:
  - StaminaEditModal at 0d69ec9: S13 FAIL, S13c FAIL, T1 FAIL, S13b ok.
  - Pool at 7659528 (modal at head): REVP-P1 FAIL, REVS-P1 FAIL (75 moved), P2 ok, P3 ok.
- jest negative control (pool at 7659528): 2 failed / 47. Restored: 123/123.

## Artifacts (R2)
- Directory: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc430-rev/r2/
- Logs there: jest.log, e2e.log, tsc.log, lint.log, e2e-probes-head.log, e2e-controls.log, e2e-control-pool.log, e2e-sweep-head.log, neg-pool.log, neg-restored.log, neg-summary.log.
- Sweep probe: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc430-rev/probes/zz-sweep-probe.e2e.ts
- The scratch worktree has been removed. Review worktree: `git status --porcelain` is empty, HEAD 7644fb3.
