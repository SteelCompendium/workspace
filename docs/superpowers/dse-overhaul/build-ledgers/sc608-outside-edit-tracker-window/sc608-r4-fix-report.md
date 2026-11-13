# SC-608 r4 fix report

**Executive summary**
- DONE. L1-L5 and I7 folded; no NEEDS_CONTEXT. dse HEAD `eb46d58d` on origin/develop `63e00d7e` (rebased; SC-605 merged with one trivial docs conflict in `.repo-docs/architecture.md`, both rows kept; `view.ts` auto-merged). Superproject `3751eef8` on origin/main `bbcd1d41`: ONE CHANGELOG + pointer-bump commit (CHANGELOG text unchanged from r2; the user-visible statement still holds).
- Shas (post-rebase): jest cases `35cf1c53` (red on r2 HEAD: O09 O19 O20 O21 O22 O24 S08; O18 pins L5, O23 a guard), e2e `bf81f685` (INIT-W09..W13, red on r2 HEAD: all 5), `windowHandoff.ts` fix `a2968c5b` (L2, L3, L4 focus part, I7), `view.ts` fix `bfd034e0` (L1, L4 Notice gate, I7 owner), header doc `9adac152`, late tests O25/O26 `e0556918`, bare-context guard `eb46d58d`. (Fix commits are per file, not per finding: the findings share both files. The `windowHandoff.ts` commit alone does not compile against the old `view.ts`.)
- Gates on the rebased HEAD (all run after the rebase): tsc, lint rc 0 · jest 11683 passed / 1 skipped warm (= 11682 / 2 fresh = 11648 + 34 new) · lifecycle 61/61 (21+16+9+4+7+4, all rc 0; G-S91 green first time) · e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (315 + 13) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. `styles.css` sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` before and after shots (not touched).
- L3 source size: the settle logic is about 25 lines inside `windowHandoff.ts` (my own file); SC-505's `focusHandoff.ts` is not touched. Total src delta r4: `windowHandoff.ts` +84/-?, `view.ts` +39 (git diff --stat vs r2 fix: 90 insertions, 33 deletions).
- Mutants (r4, 11 + 2): all 13 killed (R1..R11 plus R9/R11 after adding O25/O26).

## What each fix does
- **L1** (sidebar, pending condition write + outside edit elsewhere): `InitiativeView` keeps `disk` = what it last loaded or wrote (`ser` = serialization at load / at each flush, captured by overriding `setSerializer` so the exact flushed text is recorded; set again when an outside model is adopted). The sidebar early return now tests `serializeModel(incoming) === disk.ser`, not the live model. Jest S08, e2e INIT-W13 (Conditions add, 50 ms, edit BELOW: window stays, Dazed reaches the note, no Notice).
- **L4**: `disk.raw` = the note's own text of the block when the host knows it (`host.lastKnownBody`, Reading view / Live Preview; duck-typed, null for the sidebar), also updated at each flush. `WindowRootRecord.content()` is that (raw when known, else the serialization). The Notice is gated on the successor's content differing from the closing view's; focus is no longer gated at all (it also restores focus in a Live Preview own save, which is why O09 changed: no Notice, focus lands). A YAML comment changes the raw text, so it gets Notice + focus. Jest O19, O25 (own write then redraw: no Notice), e2e INIT-W11. Sidebar keeps the L1 rule.
- **L2**: the slot carries `count` (roots of the element in the pane when the window opened). If the count differs when the successor is found, the Notice shows and focus is not moved; an unpublished error card at the slot with a changed count counts as "found" (no TTL stall). The slot is now only the open-time one: a fresh slot at unload would count the new section too. Roots of unloading views (`record.live()`) are ignored in both the index and the count. Jest O20, O21, e2e INIT-W12 (two-trackers, Newt inserted: focus stays on body; the note is put back afterwards for the driver's integrity check).
- **L3**: after the first success the watch stays armed `HANDOFF_SETTLE_MS` (1500 ms, extended by each success) and re-claims each later successor only while focus is free (on `<body>`); Notice once; a focus the user moves cancels it. Jest O22, O23, O26, e2e INIT-W09 (Reading) and W10 (Live Preview), burst of five edits 30 ms apart.
- **L5**: jest O18 (the `Modal.close` mock focuses an outside input; it keeps focus, Notice still shows). Mutant R3 (check removed) is killed by O18.
- **I7**: `handOffAfterOutsideClose` takes `owner` (`cx.plugin`): it adds a child Component to it whose unload runs `finish`, removes the child on finish, and does not start when the owner is not loaded (plugin unload / disable). Jest O24 (and every other test now loads its plugin).

## Red without the fix (this round's tests against r2 HEAD `9761eceb` src)
- jest: O09, O19, O20, O21, O22, O24, S08 red (7); O18, O23 green by design (they pin existing guards; O18 is killed by mutant R3).
- e2e: INIT-W09, W10 (focus on BODY after the burst), W11 (no Notice), W12 (focus went to the wrong tracker), W13 (condition never reached the note) all red.
- Mutants run through `mutate-r4.py`: R1 O20,O21 · R2 O21 · R3 O18 · R4 O22 · R5 O09 · R6 O19 · R7 O24 · R8 S08 · R9 O25 · R10 O12 · R11 O26.

## Files (dse, vs the r2 fix HEAD)
`src/framework/chrome/windowHandoff.ts`, `src/elements/initiative/view.ts` (hunks: `disk`/`setSerializer`/`diskContent`/`normalizeBlockText`, `windowRecord`, `closeWindowWithView`, `update()` early return and the post-update `disk` line, `onMount` one line; no SC-605 region touched), `test/dom/elements/initiative-outside-edit.test.ts` (+O18..O26), `test/dom/framework/sidebarInitiative.test.ts` (+S08), `e2e/specs/initiative/outside-edit-window.e2e.ts` (+W09..W13). Not touched: `model.ts`, `ConditionsModal.ts`, `src/framework/view.ts`, `pipeline.ts`, `livePreviewFocusCarry.ts`, `focusHandoff.ts`.

Drive-by fixes:
- None. (One bug of my own, caught by the full jest run: `new InitiativeView({} as never)` in an existing test has no host; the new field now tolerates that. Commit `eb46d58d`.)

Follow-ups:
- `lastKnownBody` is read by duck typing (`BlockHost` has no such member); promoting it to an optional `BlockHost` member is a small cleanup.
- A write the host drops (block changed on disk first) is still recorded in `disk` as written; harmless for the checks above, but `disk` is then ahead of the note until the next load.
- I4 / SC-384 (a Live Preview own save closes the Conditions window) is untouched; the window still closes, but focus now returns to the rebuilt control (L4 decoupling), without a Notice.

## Artifacts
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r4-fix-report.md
- Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r4-fix/ (`gate-*.log/.rc` final, `jest-red.log`, `e2e-g.log`, `e2e-red.log`, `mut.log`, `mut2.log`, `mutate-r4.py`)
