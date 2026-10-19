# SC-429 round 1 implement report

**Executive summary**
- STATUS: DONE. Branch `sc429-minion-pool` (draw-steel-elements), head `c1cc4fe`, base `a89ffd9` (= origin/develop, did not move).
- All four defects fixed per O1-O4; jsdom tests only (O5), no e2e manifest changes, no rebaseline.
- Gates: tsc (incl. e2e) clean; lint clean; jest 4783 passed / 1 skipped / 227 of 228 suites (delta +14 vs 4769); lifecycle 25/25;
  e2e `62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`; shots 572 PNGs, 0 FAIL; freeze OK (276/276); parity 0 gaps / 0 undeclared / 24 declared.
- Item-2 focus finding: StaminaEditModal relies on DseModal's default (first focusable in DOM order = its Apply amount box). Pool modal now focuses its Apply damage box.
- No existing test asserted the old behaviour (one comment adjusted). No at-rest shot of this modal exists, so no PNG crops.

## Per item (src/views/MinionStaminaPoolModal.ts)
1. Stuck all-checked (O1). `minionCheckboxes` entries gain `auto` (field ~L53-58). `updateCheckboxes` (~L460-490): at pool<=0 a box not already checked becomes `auto=true`+checked+disabled;
   otherwise every `auto` box is un-checked and cleared before the existing enable/disable logic runs. Hand toggles (change handler, name-click) and Reset clear `auto`.
   Tests (SC-429 item 1, 6): 0->1 reverts+re-enables and Apply says "Deal 19 damage, kill 4 minion(s)" / title "Select 4 minion(s) to kill"; picking 4 by hand locks the 5th, Apply enables and persists;
   a user tick made before the pool hit 0 survives 0->1; 0->1->0->1 cycles; hand tick after revert survives 0 and back up; Reset then 0->1.
2. Initial focus (O2). New `open()` override (~L74-85) calls `super.open()` then focuses `this.damageInput` (the "Damage per minion" box). Tests (2): focus is that input and not "Decrease Stamina pool";
   same control class (`dse-sedit__apply-input`) that StaminaEditModal focuses.
3. Minion-count max (O3). ~L158: `instances.filter(!isDead).length` (the same `isDead` rule the row list and `poolNumbers().aliveMinions` use). Tests (2): full squad '5'; 2 dead -> '3', min '0'.
4. Idle info line (O4). `updateInfoText` (~L395): `hidden = (pending === 0)` and textContent '' (hidden attribute, no inline display). Heal / refused-heal branches untouched (they run first). Tests (4):
   at rest hidden+empty; appears with damage, hidden again after Reset; typed draft shows it, draft equal to pool hides it; heal text still shows and un-hides.
- Tests are in test/dom/views/minion-stamina-pool-modal.test.ts, new `describe('SC-429: ...')` (14 tests). CHANGELOG: one [FIX] bullet at the top of the unreleased `## 7.0.0 (unreleased...)` block (the file has no `## Unreleased` header; that block is its unreleased section).

## Item-2 focus finding
StaminaEditModal has no explicit focus call. DseModal.open() (managedModal.ts ~L127) focuses the first non-disabled focusable in contentEl after onOpen; StaminaEditModal's Apply amount input (`aria-label="Amount to apply"`) is first in DOM order. The pool modal's stepper row precedes its Apply row, so the same default hit "Decrease Stamina pool".
Fix is local (override open()), no DOM reorder, no kit change. Analogous element exists (Apply damage box), so no NEEDS_CONTEXT. Note the brief of reorder-vs-override: reorder would have changed layout; override was chosen.

## Old-behaviour tests changed
None. One comment in the SC-430 heal-draft test ("the 2-line idle text is already gone") reworded; its assertions are unchanged and still pass (idle is now '').

## Gate notes
- jest first full run: 4782 passed / 2 skipped because `printTwinDeltaAllowedSet` skips when `visual-harness/dist/obsidian-app.css` is not cached (fresh worktree); after `npm run shots` produced it the final full run was 4783 / 1 skipped, 227 of 228 suites.
- One intermediate full run had a load-shaped timeout in test/dom/framework/sidebarInitiative.test.ts (5.45 s, load 7.5); rerun alone 11/11 pass; the final clean full run had no failures.
- Logs: sc429-gate-<name>.log in this directory (tsc, tsce2e, lint, jest, jest2, jest3, jest4, lifecycle, e2e, shots, freeze, parity).

Drive-by fixes: none.
Follow-ups:
- The minions-hit box's `max` is only advisory: the Apply Damage handler does not clamp `minions` to the living count (over-count only reduces the pool toward 0, no corruption). Could clamp at the handler if wanted.
- After a user-checked set larger than a later (smaller) `minionsToKill` (e.g. user ticks 3 then raises the pool so only 1 kill is owed), the extra user ticks stay checked/enabled with Apply disabled until the user unticks them. Pre-existing and consistent with O1 (user ticks keep state); not touched.
- jsdom mock leaves `visual-harness/dist/obsidian-app.css` uncached on a fresh worktree so one jest test skips until `npm run shots`/`host-css` has run; baseline numbers assume it ran.
