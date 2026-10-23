# SC-492 r2 fix report

## Summary
- STATUS: DONE. All three review items fixed; full battery green on the rebased head.
- dse `04ab9dc` on origin/develop `2c61511` (fetched again at the end: develop still `2c61511`). Rebase hit one conflict in `visual-harness/obsidian-lifecycle.mjs` (G-S18 vs G-S32); resolved keeping G-S18, G-S28 and G-S32.
- Superproject `76d22fa` on origin/main `2ba04a6` (fetched at the end), only the two CHANGELOG commits on top. Pointer not bumped, nothing pushed.
- LOW-1: lifecycle header now says "34 scenarios in all" (34 `id: 'G-…'` entries counted; gate prints 34/34).
- INFO-1: new jest test "the Pin to sidebar button (experimental) pins and does not open the Stamina modal".
- INFO-4: guard is now `const chrome = target.closest('.dse-chrome'); if (chrome && bar.contains(chrome)) return;`, with a jest case for a `.dse-chrome` ancestor above the bar.
- Gates: tsc/lint clean; jest 5804 passed / 1 skipped / 240 of 241 (base 5797, +7); lifecycle 34/34; e2e 104/104, 69/69; shots 592, 0 FAIL, plain run; freeze 280/280; parity 0 / 0 / 24.

## Commits (dse, on 2c61511)
`f62b813` test, `980aae3` fix r1, `39a8082` G-S32, `f85a238` G-S32 collapse step, `1327d83` LOW-1 (33), `2d45d7d` INFO-1 + INFO-4, `04ab9dc` header 34 after rebase.

## Base-failure evidence against 2c61511 (StaminaBarPanel.ts reverted to 2c61511, restored after)
- jest (`chromeInsideStaminaBar` + `staminaBarPanel` files): `Tests: 5 failed, 19 passed`. Failing: pencil, keyboard-activated click, collapse, **Pin to sidebar (new)**, kit chrome-click. Log `jest-base-2c61511.log`.
- The ancestor-above-the-bar test passes on base (no guard there) and fails on the round-1 guard (proved earlier: `jest-fix-r1src.log`, 1 failed), so it pins INFO-4 specifically.
- lifecycle: `G-S32 FAIL: mouse click on the Edit pencil: expected only the edit form, got ["form","stamina"]` (`lc-gs32-base-2c61511.log`, `G-S32-base-2c61511-FAIL.png`).

## Gate lines (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-impl-r2/`)
- tsc rc 0, lint rc 0.
- jest: `Test Suites: 1 skipped, 240 passed, 240 of 241 total`; `Tests: 1 skipped, 5804 passed, 5805 total` (`jest-full-r2c.log`).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed` (`lc-full.log`).
- e2e: `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (`e2e.log`).
- shots (`shots.log`, rc 0): 592 PNGs, 0 FAIL; `OBSIDIAN APP.CSS PIN DRIFT` warning (expected); `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules …)`; `button host-leak OK (113 … 678 …)`; `modal button host-leak OK (10 … 228 …)`; `text scale OK (1626 …)`; `text scale once OK (107256 comparisons over 214 loads …)`.
- freeze: `freeze OK (280/280 …)` (`freeze.log`). parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` (`parity.log`).

Note: an earlier shots run on 907f55c was killed by PID (cwd inside the worktree) when develop moved to 2c61511; its result is not used.

Drive-by fixes: none.
Follow-ups: none new (SC-498 and SC-502 untouched, as instructed).
