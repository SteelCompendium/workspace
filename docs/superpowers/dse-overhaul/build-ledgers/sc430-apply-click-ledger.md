# SC-430 decisions ledger — Stamina modal: first Apply click after typing is swallowed

Worktree: /home/scott/code/steelCompendium/worktrees/sc430-apply-click (branch `sc430-apply-click` in every submodule)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at 0d69ec9)

## Scott rulings (verbatim, dated)

(none yet — ticket created by Scott 2026-10-17 from the SC-408 e2e pilot; no comments on the thread as of 2026-10-19)

Standing rule that applies (Scott, SC-408, 2026-10-18): e2e "make it required to land future changes".

## Ticket text (not a ruling — the SC-408 finding as filed)

> **Fix direction:** keep Apply enabled while a draft is dirty (listen to `input`), or commit the draft on `input`/`change` rather than only on blur.
> When fixed, the e2e scenario `[STAM-S13]` (currently marked as a known bug) will start failing with "known bug appears fixed — remove the marker".

## Owner design calls (2026-10-19)

- D1. Fix is LOCAL to StaminaEditModal; do NOT change the shared kit stepper's commit-on-blur semantics (lifecycle G-S3 pins "a half-typed EDITABLE stepper draft survives the adoption blur — committed only by a later real blur").
- D2. (rationale corrected by R1 review — see CAUSE CORRECTION below; mechanism stands) While the Stamina field holds a dirty, parseable draft, Apply's enabled state and label reflect the draft (recomputed on `input`), so the first press lands on an enabled button. Apply's click commits any pending draft through the same path blur uses, then applies (clampStamina still owns the persisted value).
- D3. Same bug class on other typed fields in this modal that gate Apply (e.g. Temp Stamina) — fold in, same mechanism.
- D4. Remove the `knownBug('SC-430', '[STAM-S13] …')` marker; the scenario becomes a plain passing test. Add jest coverage.

## Authorship log
- R1 implementation: orchestration:implementer (agent a24a6bb57c68c706b), dispatched 2026-10-19. Must NOT review its own work.
- R1 result: e3d4158 (one commit on 0d69ec9). Gates per sc430-report-impl-r1.md; e2e 61/72 ok, 0 failed, 11 known-bug, 47/47.

## Follow-up rulings (owner, 2026-10-19)
- F1. MinionStaminaPoolModal same swallowed-first-click bug (shared staminaStepperRow, Apply gated via updateActionButton/setDisabled ~l.385) → FOLD into R1b (same mechanism, same bug, user-visible). jest coverage required; e2e optional (no pilot coverage there).
- F2. jest skipped=2 vs expected 1 → FOLD: implementer confirms against a base (0d69ec9) jest run that the extra skip is environment-conditional and not introduced by this branch.
- F3. Over-max typed draft shows unclamped label → DROP here: already SC-427 ([STAM-S08] marker); out of scope.
- R1b result: 7659528 (pool modal fix + 9 jest). jest 4758 passed / 1 skipped / 227 of 228 (extra base skips are env-conditional — confirmed). lifecycle 25/25. e2e 61/72 ok, 0 failed, 11 known-bug, 47/47. Shots/freeze/parity from R1 (pool change adds no first-paint DOM).
- F4. Pool modal has no e2e coverage → DROP here: not an SC-408 pilot surface; jest covers it with a negative control.
- R1 review: orchestration:reviewer (fresh identity), head 7659528.

## R1 review (reviewer a4ef1e805ac79b66c @ 7659528): FIX-REQUIRED — rulings (owner, 2026-10-19)
- CAUSE CORRECTION (supersedes the ticket's "Cause" text and D2's rationale, not D2's mechanism): measured in real Obsidian, the click is lost because Apply MOVES at blur (label width change in StaminaEditModal; info-text height 2→1 lines in the pool modal shifts Apply up 13 px) between mousedown and mouseup — not because it is disabled. Syncing Apply's label/state (and anything above Apply that changes size) on `input` is what fixes it: nothing may re-layout at blur.
- HIGH-1 (pool heal draft still swallowed; info text re-renders only at blur) → FOLD into R2: updateInfoText uses effectivePending() and runs from onDraftInput; jest pin that info text (and Apply label) is unchanged across the blur.
- MEDIUM-1 ([STAM-S13c] vacuous) → FOLD into R2: rewrite in the REVP-T1 shape (Damage 7 → type Temp 5 → click Apply's edge → expect current_stamina 13, temp_stamina 5); must FAIL with the src fix reverted.
- LOW-1 (comments say "disabled until blur") → FOLD into R2: correct comments to the measured cause.
- INFO-1 (hero typed −50 label "Lose 65" vs persisted −10) → DROP: covered by SC-427 item 1 (out-of-range typed Stamina label lies; its −5 creature example is the same below-floor case).
- INFO-4 (impl report test breakdown wrong) → DROP: total is right.
- R2 fix round: implementer a24a6bb57c68c706b. Scoped re-review of the R2 delta: reviewer a4ef1e805ac79b66c (did not author).
- R2 result: 7644fb3 (963a408 pool info text follows draft; 7644fb3 S13c rewrite + comments). jest 4761/1 skipped/227 of 228; lifecycle 25/25; e2e 61/72 ok, 0 failed, 11 known-bug, 47/47. Controls: S13c and P1 FAIL with src reverted.
- R2 scoped re-review dispatched to a4ef1e805ac79b66c.
- R2 re-review: LAND-READY at 7644fb3 (2026-10-19). Land-ready reported to dispatcher.
