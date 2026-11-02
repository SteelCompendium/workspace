# SC-534 r4 fix report

**Executive summary**
- HEAD `eaf64ba6` on top of `fe44be1d` (on `dabfb518`; origin/develop still `dabfb518`). One new commit, not pushed. 2 files, +15/-17.
- LOW-1: spec root-cause comment replaced with r3's wording (first sentence kept). LOW-2: click comment replaced with r3's wording.
- LOW-3: deleted `ClickOptions.cdp`, its `if (opts.cdp)` branch (try block un-nested) and its doc line in `e2e/driver/dse.ts`. `cdpClick` and the not-interactable fallback stay. `git grep -n cdp -- e2e` now shows only `census.ts` (its own unrelated `cdp` helper), `cdpClick` (:301 def, :332 fallback call).
- tsc (incl. -p e2e) rc 0; lint rc 0.
- jest: `Test Suites: 1 skipped, 249 passed, 249 of 250 total`, `Tests: 2 skipped, 6261 passed, 6263 total`.
- e2e full x2: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` both, each after `pointer parked at 0,0 on :200 (outside every window)`; CHR-L01 ok 1033 ms / 1252 ms.
- sha256 of HEAD build equals the recorded dabfb518 pair: yes (main.js `aa4efdf6…662fda`, styles.css `ae45354b…a5b0`). Lifecycle 46/46, shots, freeze, parity carry (e2e/ not in the bundle).
- Delta: `sc534-r4-delta.diff.txt`. Drive-by fixes: none. Follow-ups: none.
