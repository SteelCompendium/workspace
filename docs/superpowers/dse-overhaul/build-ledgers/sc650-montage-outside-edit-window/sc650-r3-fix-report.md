# SC-650 r3 fix report

## Summary
- STATUS DONE. dse head `108d32c4`, rebased onto origin/develop `a9f0af1d` (SC-639). Not pushed; superproject untouched.
- LOW-1 `764565ae`: windowHandoff `HANDOFF_FALLBACK_MS` (400 ms). If no root sits at the slot after that and the pane's root count changed, any live root of the same note whose content differs from the closing view's gets the Notice; focus is not moved. Jest OW18b, OW18c (a Live Preview redraw is not claimed early by the fallback), initiative O20b (twin).
- LOW-3 `4084881c`: row-act fallbacks gain `montage.bar.log`, `montage.bar.end-round`. Jest OW12b.
- LOW-2 `189a9a49`: jest OW30. X4 (delete the sidebar disk reset) is red against it: 1 failed (OW30); it was green before.
- Docs `108d32c4` architecture.md. Other mutants: X5 (old row-act) red on OW12b; X6 (fallback Notice removed) red on OW18b and O20b.
- Gates post-rebase: tsc/lint rc0; jest 13388 passed / 1 skipped (13354 base + 34 new, shots cache present); e2e `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; lifecycle part 4 4/4, part 7 3/3. Shots/freeze/parity not re-run (no CSS or DOM change).

## Design note
The fallback is timed, not immediate: a Live Preview redraw closes first and its widget arrives 10-45 ms later, so for that moment the root count is one low and the slot index points past the end exactly as in the deletion case. Claiming at once would give the Notice from the wrong comparison and would have switched focus off. After 400 ms with no root at the slot the position cannot be a transient. A root that lands at the slot later is still claimed normally (no duplicate Notice: `noticed`).
Side effect accepted by the owner: the Notice also shows when the edit deleted the window's own block while another montage remains.

## Follow-ups
- On a very loaded host (> 400 ms before the Live Preview widget arrives) a two-montage note can get the Notice from the fallback; focus still follows the real claim.

## Logs (scratchpad/sc650-r1-impl/)
r3-tsc.log, r3-lint.log, r3-jest.log, e2e-r3.log, life-r3-part4.log, life-r3-part7.log, jest1.log, mut-X4-drop-disk-reset.log, mut-X5-old-rowact.log, mut-X6-no-fallback-notice.log
