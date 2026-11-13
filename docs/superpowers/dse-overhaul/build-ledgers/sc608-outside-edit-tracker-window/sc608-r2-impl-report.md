# SC-608 r2 implementer report

**Executive summary**
- DONE. Option 1 implemented: a tracker window (pool, hero/creature Stamina, Conditions, Reset confirm) closes on an outside edit with the Notice "The note changed outside, so this window closed without saving", and focus goes to the reloaded tracker's replacement control. Reading view, Live Preview, pinned sidebar (sidebar silent write loss fixed).
- dse HEAD `9761eceb` on `d984b115` (rebased from c329ff35 after the owner's message). Commits: `5056a92e` red jest test, `6f9b74fd` fix (Reading/LP unload hand-off + sidebar), `c936179a` sidebar jest, `b9ed239c` e2e INIT-W01..W08 + O15, `7eeed359` more jest cases, `9761eceb` docs. Superproject `21aa20e4` on origin/main `298a4ef9` (CHANGELOG bullet + pointer bump; one CHANGELOG conflict with SC-600's bullet, both kept).
- Final battery numbers: tsc/lint clean (rc 0) · jest 11642 passed / 1 skipped (warm; fresh = 11641 / 2 = 11617 + 24 new) · e2e `314/317 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (306 + 8 new) at d984b115 · lifecycle 61/61 (21+16+9+4+7+4, all rc 0) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24 (declared 24).
- Lifecycle, shots, freeze, parity ran on the pre-rebase HEAD (c329ff35 + my commits); the rebase onto d984b115 only added model.ts / e2e amount-edit files, so per your instruction jest + e2e (and tsc, lint) were re-run after it. `styles.css` unchanged by this work (sha256 5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27 before and after shots).
- Red on base: jest `initiative-outside-edit` 11 of 14 red on c329ff35 (the 3 green are "unchanged behaviour" guards O09/O10/O14); sidebar 5 of 7 red (S06/S07 are guards); e2e INIT-W01,02,03,06,07,08 red on c329ff35, W04/W05 guards.
- Mutants: 15 tried, 13 killed, 2 survive as equivalent (M11, M13; see below).
- Judgment call to confirm: the hand-off uses SC-588/SC-602's token and lookup (`controlFocus.ts`, `focusControl`, `focusIsFree`) but NOT the `armSuccessorFocus` request map, whose key is the block key (moves with an edit above) and which only claims at the new view's chrome mount (Reading view's new section exists BEFORE the old view unloads, so a mount-time claim would miss). New file `src/framework/chrome/windowHandoff.ts` does the slot lookup itself.

## Per-window before/after

| Surface / edit | Before (c329ff35) | After |
|---|---|---|
| Reading view, edit inside the block | window closes, no word, focus on `<body>` | closes, one Notice, focus on rebuilt control (pool: `init.detail.stamina`; Conditions: `init.cond.add`; hero: `init.hero.stamina`; cell: same cell; Reset confirm: `init.reset-encounter`), ring kept |
| Reading view, mouse-opened | closes, focus on the pane | closes, Notice, nothing focused |
| Reading view, edit above/below (no redraw) | window stays, Apply works | unchanged (INIT-W04) |
| Live Preview, edit inside the block | closes, focus `<body>` | closes, one Notice, focus on rebuilt control (INIT-W06, held 500 ms) |
| Pinned sidebar, edit inside the block | window STAYS open, Apply/Add writes nothing, no Notice | closes, one Notice, focus on the sidebar's rebuilt control (INIT-W07, S01, S03) |
| Pinned sidebar, edit elsewhere in note (block bytes unchanged) | window stays, Apply SILENTLY LOST | window stays, Apply writes `minion_stamina_pool: 17`, outside edit kept (INIT-W08, S02, S04) |
| Tracker's own Apply/Enter/Done/Cancel/Escape | SC-603 focus restore | unchanged, no Notice (INIT-W05, O14, S06) |

Rules implemented: Notice only when the redrawn block's serialized content differs from what the closing view held (own save, re-render, mode switch = same bytes = as before); no successor (note closed, block deleted) = nothing; successor keyed by `sourcePath` + pane/embed scope (`.internal-embed, .markdown-embed, .markdown-reading-view, .markdown-source-view, .workspace-leaf`) + position among that pane's roots; restore only while focus is free in the root's own document or on the dying view's own control; a focusin elsewhere cancels the focus part (Notice still shows); TTL 3 s; one macrotask wait for the pipeline's chrome panel. Sidebar: `InitiativeView.update` with a window open returns early when `serialize(newModel) === serialize(this.model)` (window and model stay), else closes the window first (flag `outsideClose` suppresses SC-603's own giveFocusBack), rebuilds, restores the open-time token, shows the Notice.

## Files (dse, vs d984b115)
- `src/framework/chrome/windowHandoff.ts` +151 (new)
- `src/elements/initiative/view.ts` +75/-5: imports; constructor unload hook calls `closeWindowWithView()`; new fields `activeWindow`, `outsideClose`, `windowRecord`; `closeWindowWithView`, `closeForOutsideEdit`; `update()` sidebar branch (~8 lines); `onMount` one line `publishWindowRoot`; `openModal` records `activeWindow` + optional `resetFocus` param; Reset encounter passes its token. Hunks are in the constructor, `update()`, `onMount`'s last line, `openModal` and `chromeItems`' Reset call only. SC-605's regions (QuickAddDraft type guard, carryState/receiveCarriedState) untouched.
- NOT touched: `model.ts`, `ConditionsModal.ts`, `src/framework/view.ts`, `pipeline.ts`, `livePreviewFocusCarry.ts`, `focusHandoff.ts`, `SidebarPanel.ts`, `SidebarBlockHost.ts` (the sidebar fix lives entirely in `InitiativeView.update`).
- `test/dom/elements/initiative-outside-edit.test.ts` +380 (17 tests O01..O17), `test/dom/framework/sidebarInitiative.test.ts` +152 (S01..S07), `e2e/specs/initiative/outside-edit-window.e2e.ts` +209 (INIT-W01..W08; no bracketed ticket ids in titles; only existing coverage pairs driven), `.repo-docs/architecture.md` +1 row, dse `CHANGELOG.md` +10, superproject `CHANGELOG.md` +9.

## Mutation results (jest, targeted run; `mutate-sc608.py`)
Killed: M1 sidebar early return dropped (S02, S04) · M2 sidebar never closes (S01, S03, S05) · M3 sidebar no Notice (S01, S03, S05) · M4 unload no Notice (O01 O02 O03 O06 O07 O11 O15) · M5 unload no focus (10 tests) · M6 act on same content (O09) · M7 dying view's control not free (O12) · M8 no scope (O13) · M9 user-moved focus not respected (O11) · M10 Reset confirm hands no token (O06) · M12 slot index ignored (O15) · M14 sourcePath not compared (O17) · M15 no settle task, chrome not yet mounted (O16).
Survived (equivalent): M11 (`outsideClose` guard removed: the SC-603 microtask runs after the synchronous rebuild and lands on the same successor), M13 (open-time token ignored, capture after close: Obsidian's focus return to the opener yields the same token in every tested route). Both guards are kept as explicit contract.

## Drive-by fixes:
None.

## Follow-ups:
- Notice is not shown when the outside edit deletes the tracker or the new block fails to render (no successor to compare): the window closes silently as before. A closing-side Notice would need the note's new text; not worth it unless Scott wants it.
- A tracker written by an unflushed mutation at the instant of an outside edit still compares as "changed" (Notice) — correct, but ElementView's flush-on-unload then writes the old model; pre-existing behaviour (not touched).
- Two panels of different notes in one sidebar leaf share one scope; the slot check adds `sourcePath`, so a mismatch is rejected (O17), but a sidebar remount fallback (prepareModel throws) shows no Notice because the successor is an error card.

## Artifacts
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r2-impl-report.md
- Logs/scripts: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r2-impl/ (gate-*.log/.rc final, `jest-oe-red.log`, `jest-sb-red.log`, `e2e-w-red.log`, `e2e-w-2.log`, `mutate-sc608.py`, `mut-a.log`, `mut-b.log`, `mut-c.log`)
