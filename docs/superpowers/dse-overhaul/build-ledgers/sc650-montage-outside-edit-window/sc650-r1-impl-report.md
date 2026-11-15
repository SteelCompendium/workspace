# SC-650 r1 implementation report

## Executive summary
- STATUS DONE. dse branch `sc650-montage-outside-edit-window` head `69ffe410`, rebased onto origin/develop `5f962390` (SC-649, negotiation only; base moved from `2777484c` mid-task). Superproject untouched. Nothing pushed.
- A montage window (Log an action from bar/row/cell, edit sheet of a recorded cell, Add a hero from the corner or chrome, Set limits) closed by an outside edit now shows the SC-608 Notice and hands focus to the rebuilt opener (SC-626 `focusRules` fallbacks). Reading view and Live Preview. Own write: no Notice, SC-626 focus unchanged.
- Montage CAN be pinned in the sidebar (experimental switch). Same silent write loss as SC-608 found and fixed (jest OW24 was red on base: the window stayed open after a refresh and its Log wrote nothing).
- Reused `windowHandoff.ts` (no second mechanism); added optional `fallbacks` and exported `normalizeBlockText` (initiative imports it now).
- Tests: 29 jest (22 red on base) + 9 e2e `MONT-OW01..OW09` (8 red on base). Mutants: 10 of 12 killed, 2 equivalent/declared.
- Gates: tsc/lint clean, jest 13374/1 post-rebase, e2e `607/622 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` post-rebase, lifecycle 64/64, shots/freeze/parity as expected (pre-rebase).

## Commits (dse, on 5f962390)
- `64b0c558` fix: montage publishes a window root, hand-off on unload, sidebar in-place refresh closes only on a changed block; windowHandoff fallbacks + normalizeBlockText.
- `b0e2c543` jest `montage-outside-edit.test.ts`.
- `3a7e354f` e2e `e2e/specs/montage/outside-edit-window.e2e.ts`.
- `5dd28ffc` fix: a write's rebuild with a window open is not an unload (found by me after first design; OW08 slow-brief, OW28, OW29 added in the same series).
- `d8eb3a99`, `69ffe410` docs: `.repo-docs/architecture.md` windowHandoff row (shared by montage; two-stage closing note), OW29 test.

## Design
- `windowHandoff.ts`: `OutsideCloseHandoff.fallbacks?: ControlFallbacks` passed to `controlSuccessor`; `normalizeBlockText` exported (was private in initiative). No behaviour change for initiative (jest initiative-outside-edit O01..O28 green).
- `MontageView`: `windowOpener` now `{focus, slot, modal}` (slot = `slotOf(rootEl,'montage')` at open); `disk {raw,ser}` record via `setSerializer` override (+ `lastKnownBody`), `windowRecord` published at END of `onMount` (async onMount: a card still rendering its brief is not a successor; M6 mutant shows it matters).
- Why two-stage: the window sits in a child component (`openTrackedModal`). Children unload BEFORE the view's own registrations, and `update()` (`unloadOwnedChildren`) also unloads that child on the montage's own write. My first design started the hand-off and marked the view `unloading` on every own write (stuck `live()=false`, mis-slotting later windows; caught by OW28 red). Now the child's registration (registered after `openManagedModal`'s, so runs first) records `closingWindow {opener, ownContent}` and closes the window; the view's constructor registration starts the hand-off from it at real unload; the end of `update()` clears it.
- Sidebar (`update(model)`): `outside = model !== this.model`; with a window open and `serializeModel(model) === disk.ser` (disk, not live model: an unwritten Log is ahead) return and leave window + model; else close the window first (token read before), rebuild, `disk` reset, restore focus with fallbacks, Notice. `correctMontageEntry`/`removeMontageEntry` can therefore no longer apply deltas to stale entries (window closed before model replaced).
- Opener mapping (token = `captureControlFocus` at open, MONTAGE families/fallbacks): bar Log -> `montage.bar.log` (disabled -> End round, Undo, Back); row button -> same nth row-act (gone -> Undo, Reopen); recorded/empty past cell -> same `at` hero:round (gone -> Log, End round, Undo); Add hero corner -> `montage.board.add-hero`; Add hero / Set limits chrome -> same chrome item. Mouse-opened (no token): Notice only. Slot count changed (montage inserted/removed): Notice, no focus move (OW18). No successor: nothing.

## Red on base (2777484c src, tests kept)
- jest: 22 of 27 (at that time) failed: OW01-08, 10-15, 17-19, 21, 23-26. Green guards: OW09 (own write), OW16, OW20, OW22, OW27. OW28/OW29 later written for the second design (OW28 red on the first design). Log: `jest-red-on-base.log`.
- e2e: 8 of 9 failed (OW01-05, 07-09 time out waiting for the Notice); OW06 (own write) green guard. Log: `e2e-ow-red.log`.

## Mutants (jest `montage-outside-edit` + `initiative-outside-edit`)
Killed: M1 drop Notice (16 red), M2 skip hand-off (19), M3 sidebar never keeps window (3), M4 sidebar compares live model not disk (1), M5 no fallbacks (2), M6 publish root early (1, OW08), M8 sidebar no Notice (1), M9 no slot (19), M10 token always present (19), M11 never clear closingWindow after rebuild (1, OW29, after adding it). M7 (sidebar `closeForOutsideEdit` skips explicit `modal.close()`): equivalent, `update()` unloads the window's component, which closes it; kept for ordering/clarity.

## Gates (pre = at 2777484c-based tree; post = after rebase to 5f962390)
- tsc (incl. e2e) rc0, lint rc0: pre and post.
- jest: pre 13363 passed / 2 skipped (= 13334 + 29); post 13374 passed / 1 skipped (shots cache present; 13344 + 29 fresh equivalent).
- lifecycle (pre): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64 (no G-S140 added; behaviour shown in e2e).
- e2e: pre `606/621 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`; post `607/622 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`. No new manifest pair (only existing pairs driven).
- shots (pre): rc0, host-leak 163/978, modal host-leak 40/240, capture clip 147, 592 PNGs. freeze (pre): 280/280. parity (pre, last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. SC-649 changed no css/montage files, so these were not re-run post-rebase.

## Drive-by fixes
None (the `normalizeBlockText` move is part of the generalisation, not a drive-by).

## Follow-ups
- SC-626 P14 (carry focus inside the card across an outside rebuild with no window open): not built, as ruled. Sidebar path still restores focus held inside the card (existing behaviour).
- The `unloadOwnedChildren` property (every `addChild` is torn down by `update()`, so a modal's component dies on any rebuild) is a trap for any element that holds a window in a child component; consider a framework note.
- Board corner Add a hero and row buttons are only covered in jest (e2e would add new manifest pairs `press:Enter`); mouse click on a button does not move focus in e2e (OW05: focus lands on the note's scroller).

## Logs (all in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r1-impl/)
npmci.log, tsc.log/lint.log (early), final-tsc/lint/jest.log (pre), post-tsc/lint/jest.log (post), jest-red-on-base.log, e2e-ow.log, e2e-ow-red.log, e2e-full.log (pre), e2e-post.log (post), life-part1..7.log/.rc, shots.log, freeze.log, parity.log, mut-M*.log.
