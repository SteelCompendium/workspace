# SC-432 r2 fix report

## Executive summary
- Verdict: DONE. LOW-1 and LOW-2 folded; SC-465 / SC-466 untouched. origin/develop still `ab34293` (no rebase).
- dse head `21a0244` (on top of r1 `1ddef76`); superproject `8511748` (unchanged; CHANGELOG does not quote the copy).
- LOW-1: `scopeOf(root, isModal)` in `e2e/driver/dse.ts` resolves `modal.close` / `modal.backdrop` inside the modal's own `.modal-container` (via `root.parentElement()`); block/toast scopes and `dse.control()` stay page-wide. New `[STAM-Q13X]`: confirmation X and click-outside each close only the confirmation; nothing staged; pending edit survives; Apply writes it. Existing callers (F07b/F07c/Q09/etc., single modal open) re-run green.
- LOW-2 final dialog copy: "This hero has no Recoveries tracked, so there is no Recovery to spend. Heal Recovery Value heals one Recovery's worth of Stamina (N), stopping at maximum Stamina, and does not track or spend a Recovery. You won't be asked again while this window is open."
- Gates: tsc rc 0 · lint rc 0 · jest 5292 passed / 1 skipped / 230 of 231 · lifecycle 27/27 · e2e `OBSIDIAN-E2E done: 89/92 ok, 0 failed, 3 known-bug, coverage: 59/59 pairs` · shots 572, 0 FAIL, pressed toggle parity OK · freeze 276/276 · parity 0 gap(s) / 0 undeclared / 24 declared.
- e2e attribution: full run id `20261020-173659-29e6` (start 13:36:59 EDT, finished 13:37:59), worktree sc432-free-recovery.
- Evidence (c) regenerated from real Obsidian: evidence/sc432-c-confirmation-over-stamina-modal.png (scratch spec deleted).
- Scripts in `sc432-r2-impl-scripts/` (shots/freeze/parity + evidence); the jest/lifecycle/e2e wrapper `r2a.sh` was written before the addendum, to the session scratchpad, uniquely named.

## Tests
- jest: dialog copy assertion adds `stopping at maximum Stamina`. e2e: +`STAM-Q13X`. No manifest change (modal.close click / modal.backdrop click already declared).
- Drive-by fixes: none. Follow-ups: none new.
