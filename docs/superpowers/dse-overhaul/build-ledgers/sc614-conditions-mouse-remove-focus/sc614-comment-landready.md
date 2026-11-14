Fixed, waiting to land: removing a condition in the initiative tracker no longer drops keyboard focus to the page. Focus stays on Add condition, or on whichever condition button had it.

No decision needed from you.

What changed:

- Mouse: if focus is on Add condition and you click another condition's remove button, focus goes to the new Add condition button once the row redraws. If focus was on a different condition's remove button, it goes back to that button.
- Keyboard: removing a condition with Enter or Space had the same bug. The same change fixes it. Focus goes to the next condition, or to Add condition if none is left.
- A click still never pulls focus into the tracker. If focus was on the page, it stays there.
- This works for hero rows, creature rows and squad minions, in Reading view and in the pinned sidebar tracker.

How it was checked:

- New tests that fail on the old code and pass on the fix: 5 jest tests and 1 real-Obsidian test (Tab to Add condition, click a remove button, check where focus lands).
- 2 jest tests and 1 real-Obsidian test confirm that focus is not pulled in from the page.
- An independent reviewer broke each part of the fix on purpose. A test failed every time.
- The reviewer also checked where focus lands by hand, in real Obsidian.

+++ Agent notes

- dse `sc614-conditions-mouse-remove-focus` @ `506786cb` on develop `27120710`; superproject @ `c909b081` on workspace origin/main `4c1a884a` (CHANGELOG `932ac9f1` + one pointer bump `c909b081`).
- Fix: `src/elements/initiative/view.ts` — the conditions row's remove + Add buttons form one `controlFocus` family; the remove handler captures focus (scoped to the row) before the redraw and restores it after, shifting past the removed chip. `src/framework/kit/conditionIcons.ts` `onRemove` also receives the pressed button (the only other kit consumer, `conditions/panel.ts`, is read-only and unaffected).
- Tests: jest F23–F29 (`test/dom/elements/initiative-matrix.test.ts`), e2e INIT-F15 / INIT-F16 (`e2e/specs/initiative/focus-after-condition-remove.e2e.ts`).
- Gates (reviewer, on `283cb2f5`; `506786cb` changes one test title only, initiative-matrix 207/207): tsc/lint clean · jest 11900 passed / 1 skipped (shots cache present) · lifecycle 64/64 · e2e `340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
- Review: LAND, 0 HIGH / 0 MEDIUM / 1 LOW (F29 test title, fixed) / 4 INFO (dropped: unreachable script-only path, keyboard path jest-only, Live Preview also works, base move folded).
- Ledger: `.superpowers/sdd/sc614-conditions-mouse-remove-focus/`.

+++
