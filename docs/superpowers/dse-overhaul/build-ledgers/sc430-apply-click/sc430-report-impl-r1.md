# SC-430 impl report, round 1

Executive summary
- STATUS: DONE. Branch `sc430-apply-click` (draw-steel-elements), head e3d4158, one commit on 0d69ec9 (develop unmoved).
- Fix is local to StaminaEditModal (D1). Apply's enabled state and label follow a dirty parseable Stamina/Temp draft (recomputed on `input`); Apply click commits any pending draft via the blur path, then applies (clampStamina still owns the persisted value).
- Kit stepper additions, opt-in only: option `onDraftInput(draft: number|null)` and handle method `commitDraft()`. Without the option no listener is added; blur/Enter/Escape semantics unchanged (G-S3 intact).
- e2e: [STAM-S13] knownBug marker removed (plain `it`); added [STAM-S13c] (Temp Stamina, edge click). CHANGELOG `[FIX]` bullet added under 7.0.0 (unreleased).
- Gates: tsc/lint clean; jest 4748 passed / 2 skipped / 227 of 228 suites; lifecycle 25/25; e2e 61/72 ok, 0 failed, 11 known-bug, 47/47; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24.

## What changed
- `src/framework/kit/stepper.ts`: `StepperOptions.onDraftInput` (fires on `input` with the value a commit would land, trunc+clamp, or null if empty/unparseable; fires null when the draft resolves: commit/Enter/blur, Escape revert, invalid discard, BEFORE onChange). `StepperHandle.commitDraft()` (no-op if clean or not editable). Parse logic factored into `parseDraft()` shared by commit and the input listener (byte-identical commit behaviour).
- `src/views/StaminaEditModal.ts`: `staminaStepperRow` forwards `onDraftInput`; modal keeps `draftStaminaChange` / `draftTempStaminaChange` (null = none), read only by `updateActionButton`; `stagedStamina` / `stagedTemp` helpers shared by onChange and the draft preview (temp keeps RC-5 take-higher); draft equal to the stepper's current value = null (Apply as after blur); `refresh()` clears drafts; Apply onClick calls `staminaStepper.commitDraft(); tempStepper.commitDraft()` first.
- Tests: `test/dom/kit/stepper.test.ts` +6; `test/dom/views/stamina-edit-modal.test.ts` +10 (draft enables/labels without commit; Apply with uncommitted draft persists; blur-then-click unchanged; equal-to-current stays disabled; empty draft unchanged; draft replaces stamina part of a pending edit and matches the post-blur label; Escape; over-max persists clamped; Temp grant + persist; Temp take-higher; combined label). Negative control: with src stashed, 8 of the 10 modal tests fail (the other 2 pin unchanged behaviour).
- e2e `stamina-modal-stepper.e2e.ts`: marker removed; `[STAM-S13c]`. No other e2e marker pins this.

## Gates (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc430/)
- tsc.log: clean (incl. e2e). lint.log: clean, rc 0.
- jest.log: `Tests: 2 skipped, 4748 passed, 4750 total`; `Test Suites: 1 skipped, 227 passed, 227 of 228` (baseline 4732 + 16 new = 4748; skipped 2 vs brief's 1, see Follow-ups).
- lifecycle.log: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (port 9287).
- e2e.log: `OBSIDIAN-E2E done: 61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`.
- run2/shots.log: 572 PNGs, 0 FAIL, text scale OK, text scale once OK, portrait mark parity OK, turn mark parity OK. (First shots attempt hit my own 595 s timeout wrapper, rc 124, browser killed; rerun in the background to completion, rc 0.)
- freeze.log: `freeze OK (276/276 frozen print PNGs byte-identical ...)`.
- run3/parity.log: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Judgement calls
- Draft label mirrors the post-blur label exactly (typed 30 at max 20, cur 15 shows "Gain 15 Stamina" before and after blur); the over-max label mismatch stays SC-427's; Apply persists the clamped 20. [STAM-S08] knownBug unaffected (e2e still 11 known-bug).
- Preview bar/gauge is not updated on draft (D2 scoped to Apply's state/label).

Drive-by fixes: none.

Follow-ups:
- `MinionStaminaPoolModal` uses the same `staminaStepperRow` + blur-gated Apply (`updateActionButton`, setDisabled at ~line 385) and very likely has the identical swallowed-first-click bug; not touched (out of D1-D3 scope; the new `onDraftInput` option is already forwarded by the shared row). No e2e coverage of the pool modal.
- Jest skipped count is 2 vs the brief's 1; skips are environment-conditional (e.g. `printTwinDeltaAllowedSet.test.ts` it.skip when no cached visual-harness/dist/obsidian-app.css); not investigated against a base run.

---

# R1b (F1 pool modal, F2 skip count, F3 untouched)

Executive summary
- STATUS: DONE. Head 7659528 (new commit on e3d4158; R1 commit unchanged). F3 not touched.
- F1: MinionStaminaPoolModal now has the same fix: `onDraftInput` via the shared `staminaStepperRow`, `draftStaminaChange` read through `effectivePending()` (poolNumbers + updateActionButton), `refresh()` clears the draft, Apply click calls `poolStepper.commitDraft()` first.
- Pool-specific wrinkle: the kill checkboxes are only re-derived on commit, so with a draft `updateActionButton` predicts them (pool<=0 -> all auto-checked; kills<=0 -> none). A pool-emptying draft therefore enables Apply now; a draft needing kills stays disabled (labelled "Deal N damage, kill M minion(s)") exactly as after blur.
- Tests: +9 in `minion-stamina-pool-modal.test.ts`; negative control (src stashed) fails 7 of 9 (the other 2, equal-draft and empty-draft, pin unchanged behaviour). CHANGELOG bullet now covers both modals. No e2e added (optional).
- F2: the extra skip is environment-conditional, not from this branch (details below). Rerun with the cached sheet present: 1 skipped.
- Gates: tsc/lint clean; jest 4758 passed / 1 skipped / 227 of 228 suites; lifecycle 25/25; e2e 61/72 ok, 0 failed, 11 known-bug, 47/47. Shots/freeze/parity not re-run: the minion change adds no DOM and no CSS (first paint unchanged, Apply still renders disabled; only a stepper `input` listener is added).

F2 detail
- R1 run skipped 2: `migrationCensus.test.ts` (describe.skip when env `TREE` is unset, always) and `printTwinDeltaAllowedSet.test.ts` (it.skip when gitignored `visual-harness/dist/obsidian-app.css` is absent; a fresh worktree has none until `npm run shots`/host-css builds it, which my shots run later did).
- Base 0d69ec9 in a scratch `git worktree add` (now removed; list shows only the sc430 worktree): 4 skipped / 4729 passed (jest-base.json): migrationCensus, printTwin, and 2 tests in `token-coverage.test.ts` (skip when the workspace map is not locatable, true for a scratchpad path; they run in the real worktree). All skip conditions are environment, none from this diff.
- Branch rerun now that the sheet is cached: `Tests: 1 skipped, 4758 passed`, the only skip being migrationCensus (jest-b.json). The 4758 = 4732 + 16 (R1) + 9 (R1b) + 1 (printTwin test now runs).

Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc430/ (jest-pool.log, jest-pool-neg.log, jest-base.json/.log, jest-b.json/.log, b/tsc.log, b/lint.log, b/lifecycle.log, b/e2e.log).

Drive-by fixes: none.
Follow-ups: none new (pool modal has no e2e pilot coverage; unchanged).

---

# R2 (review fixes: HIGH-1, MEDIUM-1, LOW-1)

Executive summary
- STATUS: DONE. Head 7644fb3 (two new commits on 7659528: 963a408 code+jest, 7644fb3 e2e).
- HIGH-1: `updateInfoText` now reads `effectivePending()` and runs from the pool's `onDraftInput`, so the info text (2 lines -> 1), the Apply label and the heal-warning icon all show their post-commit value while typing; nothing re-lays-out at blur. Real Obsidian: REVP-P1 now passes (fails with MinionStaminaPoolModal reverted to 7659528).
- MEDIUM-1: [STAM-S13c] rewritten in the REVP-T1 shape (Damage 7, type Temp 5, click Apply edge, expect current 13 / temp 5). With StaminaEditModal reverted to base: S13 FAIL, S13c FAIL, REVP-T1 FAIL, S13b ok. With the fix all pass.
- LOW-1: comments corrected (StaminaEditModal x2, MinionStaminaPoolModal x2, e2e S13) to the measured cause (Apply moves at blur; label/layout sync is the fix); jest describe titles reworded. CHANGELOG states only the symptom, left as is.
- Sweep for other things that change at blur: StaminaEditModal: only Apply's label (the gauge/bar is fixed geometry, no text); steppers' input text is normalized in place at a fixed width; Spend Recovery changes disabled/tooltip only (same size). Pool modal: info text (fixed), heal-warning icon (already follows via updateActionButton), checkboxes (state only, predicted), preview bar (fixed geometry, may lag; left untouched).
- Jest +3 (pool: heal-draft identical-across-blur, damage-after-heal identical-across-blur, Escape restores). With the info-text change reverted 2 of 3 fail (Escape pin is unchanged-behaviour).
- Gates: tsc/lint clean; jest 4761 passed / 1 skipped / 227 of 228; lifecycle 25/25; e2e 61/72 ok, 0 failed, 11 known-bug, 47/47. Shots/freeze/parity not re-run: no first-paint DOM change (info text/label unchanged at open; only post-input updates).

Probes (reviewer's zz-review-probe + zz-pool-probe copied in uncommitted, removed after; `--only`, 12/12 ok at head): REVP-P1, P2, P3, T1, S2, S3, R1, T2, E1 + STAM-S13/S13b/S13c all ok. Controls: StaminaEditModal reverted -> S13/S13c/T1 FAIL; MinionStaminaPoolModal reverted to 7659528 -> P1 FAIL (P2, P3 ok).
Logs: .../scratchpad/sc430/r2/{probes-fix,revert,revert-pool,tsc,lint,jest,lifecycle,e2e}.log, jest-pool-neg-all.log.

Drive-by fixes: none.
Follow-ups: none new. SC-427 (out-of-range labels, incl. below-floor) untouched.
