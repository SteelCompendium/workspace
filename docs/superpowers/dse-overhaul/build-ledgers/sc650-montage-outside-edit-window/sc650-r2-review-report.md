# SC-650 r2: independent adversarial review

## Executive summary
- **Verdict: LAND.** Reviewed dse `69ffe410` (range `5f962390..69ffe410`, 6 commits). Counts against the SC-650 diff: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 3 LOW, 6 INFO.
- Real Obsidian, 54 reviewer probes. Every window and opener (bar, row, cell, board corner, chrome Add a hero, Set limits), Reading view and Live Preview: the window closes, one Notice, and the rebuilt opener holds focus with the ring. This includes the board corner and the row buttons, which were jest-only before (MPRB-01..04). Own write: no Notice, focus back on the opener. Escape: opener, no Notice. Edits above or below the block: the window stays open and its Log writes. Twins slot correctly. Sync burst: one Notice. A YAML-comment edit: Notice plus focus. Popout window: works. Focus the user moved elsewhere is never pulled back. Plugin unload: no error. Sidebar: closes, keeps, and Remove hits the right entry.
- (c) Mouse rule as in SC-608: Notice shown, focus left exactly where it was before the click (MPRB-30, MPRB-31, OW05).
- LOW-1: one ruled case is not met. One edit that removes a montage ABOVE the open one and also changes the open one gives no Notice and leaves focus on `<body>` (RV MPRB-21, LP MPRC-04). The bug is in shared `windowHandoff.ts` `find()`, so the initiative tracker has the same gap since SC-608 (MPRC-05). It was there before this change.
- LOW-2: test gap. Mutant X4 (drop the disk reset after a sidebar refresh) survives jest and e2e, but in real Obsidian it closes a window that should stay open (MPRD-01).
- LOW-3: an opener whose row the outside edit removed lands on the card root, not on a control (MPRB-08).
- (b) The own-write `unloadOwnedChildren` trap hits no other element today. But the same teardown runs on the pinned sidebar's in-place refresh, and there **three live bugs exist at `5f962390` (experimental, not caused by SC-650)**: a pinned `ds-conditions` window overwrites the outside edit (OOS-1); a pinned stamina bar's Apply is silently lost (OOS-2); a montage Log written within 400 ms of an outside edit is lost (OOS-3). The owner should file them.
- Battery at `69ffe410`: tsc 0, lint 0, jest 13374/1 (warm), e2e `607/622 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`, lifecycle 64/64 (7 parts), shots 592 / host-leak 163/978 / modal 40/240 / clip 147, freeze 280/280, parity 0/0/24. Vacuity: the base src turns 23/29 jest red and 8/9 e2e red. Mutants: 2 of 5 killed by the suite, X4 shown live, X7 and X10 equivalent.

## Findings (SC-650 diff)

### LOW-1: a montage removed above the open one, in the same edit that changes it, gives no Notice (shared mechanism, pre-existing)
- **Where:** `src/framework/chrome/windowHandoff.ts:138-143` (`find()` takes `roots[o.slot.index]`). With the count lower, that index can point past the end. `:164` (the count check) never runs because no root is ever found.
- **Scenario:** a note holds two montages. The window is open on the second (slot index 1, count 2). One outside edit (a Sync merge) deletes the first block and changes the second. The second card is redrawn and now sits at index 0, count 1. `roots[1]` is undefined, so the watch lapses at its 3 s TTL. The window closes silently and focus is on `<body>`. This is the original bug, for this sub-case.
- **Evidence:** MPRB-21 (RV) gave `noticeSeen false, notices 0, focus BODY`. MPRC-04 (LP) gave `notices 0, focus BODY`. Base `5f962390` gives the same, and so does the initiative at head (MPRC-05, two trackers: `notices 0, focus BODY`). Control cases: an insertion (MPRB-20) gives Notice 1 and focus not moved, as ruled. Three montages with the first deleted (MPRC-06, the index stays in range) gives Notice 1 and focus not moved. Jest covers only the insertion (OW18).
- **Why LOW, not MEDIUM:** nothing is lost, it is rare (two or more blocks, a deletion above, and a change to the open block in one modify), and it predates this change (the shared code since SC-608). It does contradict the owner ruling of 2026-11-14 ("slot can't be matched (montage count in scope changed), Notice + no focus move").
- **Prescribed fix (in shared code; covers both elements):** in `find()`, when `roots.length !== o.slot.count` and `roots[o.slot.index]` is missing, claim any live root of the same `sourcePath` in the scope for the Notice only. Focus is already off when the count changed. Add jest OW18b (deletion above) and an initiative twin. Owner call: this also shows the Notice when the edit deleted the window's own block while another montage remains. That is arguably right, because the window did close because of an outside edit. It changes OW16 only in the multi-block case. Splitting this into a follow-up ticket for `windowHandoff.ts` is reasonable, since initiative needs the same fix.

### LOW-2: test gap. The sidebar's disk reset after an outside refresh is untested
- **Where:** `src/elements/montage/view.ts:209` (`if (outside) this.disk = { raw: null, ser: serializeModel(model) }`).
- **Scenario if it regresses:** a pinned montage gets an outside change to its block while no window is open, so `disk.ser` stays stale. The user then opens a window, and an outside edit elsewhere in the note arrives. The incoming block no longer equals the stale `disk.ser`, so the window closes with a false Notice, and what the user typed is lost.
- **Evidence:** mutant X4 (line deleted) passes jest `montage-outside-edit` + `initiative-outside-edit` (57/57). In real Obsidian it turns MPRD-01 red (`windowStayedOpen false, notices 1`); head gives `windowStayedOpen true, notices 0`.
- **Prescribed fix:** add jest OW30: sidebar mount, then `refresh(EDITED)` with no window, then press Log, then `refresh(EDITED)` again (an edit elsewhere). Assert the window stays and there is no Notice.

### LOW-3: an opener whose hero row the outside edit removed: focus lands on the card root, not on a control
- **Where:** `src/elements/montage/focusRules.ts:43` (`'montage.board.row-act': ['montage.bar.undo', 'montage.bar.reopen']`).
- **Scenario:** a live montage with nothing logged. Log an action for Bram is opened from the row by keyboard, and the outside edit deletes Bram. Undo is disabled and Reopen is absent, so `controlSuccessor` falls back to the root: focus goes to `div.dse-chrome-anchor` with the ring and no control id.
- **Evidence:** MPRB-08 (LP) gave `ctl null, inMontage true, ring true`. It is not `<body>`, so it meets SC-608's floor, but not the ruled "nearest equivalent".
- **Prescribed fix:** append `'montage.bar.log'` (and `'montage.bar.end-round'`) to the row-act fallbacks. A completed montage has no Log, so the SC-626 own-write order (Undo, Reopen) is unchanged.

### INFO
- **I-1 (mutant X7, equivalent in the measured paths):** with `this.unloading = true` removed (`view.ts:143`), jest is 57/57 and real Obsidian is 14/14 (MONT-OW01..09, MPRB-20, 23-26). The old root is already detached when the hand-off runs, so `live()` is never consulted for it. It is worth keeping as a defence, since it mirrors the initiative.
- **I-2 (mutant X10, equivalent):** in the sidebar, taking the opener from the DOM instead of `closed.focus` passes. Closing the modal restores focus to the opener, which still exists, before the rebuild.
- **I-3 (pre-existing, improved):** in Live Preview, a second window opened within the 400 ms write of a Log is closed by the montage's own save (the widget is rebuilt). MPRB-18: at head, closed, no Notice, focus on its opener (`montage.chrome.add-hero`). At base, closed and focus on `<body>`. Reading view keeps it open (MPRB-17). No Notice is per the ruling (own write); the typed text is still lost silently. Possible follow-up.
- **I-4:** in the pinned sidebar, the board-corner Add a hero has 0 px width and cannot take focus, even by script (MPRD-05: `display inline-flex, w 0, focused false`). So the keyboard path for that opener does not exist in the sidebar; opened with the mouse it closes correctly (MPRC-09: Notice 1, typed `Osric` not written, the outside hero kept).
- **I-5:** the jest file waits on product constants (`later(PERSIST_DEBOUNCE_MS + 50)`, `later(HANDOFF_SETTLE_MS + 100)`) only for "the write has flushed" and for cleanup. The burst test uses a literal 1400 ms gap, as the skill requires. This is fine.
- **I-6 (Component order verified):** Obsidian 1.14.4 `Component.unload` pops its children (LIFO), then its registrations (LIFO), then calls `onunload` (extracted from `obsidian-1.14.4.asar` app.js). So the implementer's two-stage design rests on real behaviour.

## (b) The `unloadOwnedChildren` trap in other elements. Answer: own-write variant none; sidebar-refresh variant live

- **Own write:** no other element is affected today. Only the montage rebuilds through the default `update()` on its own write while a window lives in a child component. ConditionsPanel defers its persist to modal close and never calls `update()`. The hero sheet, the stamina bar and the conditions container never call `this.update()`. Initiative overrides the open path (no `openManagedModal`).
- **But `SidebarPanel.handleExternalChange` (`src/framework/sidebar/SidebarPanel.ts:321`) calls `previous.update(model)` on every outside change to the pinned note**, and that is the same teardown. Three live bugs at `5f962390`, all experimental-only (pinning needs the switch; conditions and hero are `deferred`). They are unchanged at head and outside SC-650's scope; the owner should file them:
  - **OOS-1 (data loss of the OUTSIDE edit), pinned `ds-conditions`:** `src/elements/conditions/panel.ts:165-185`. The window is owned by the ConditionsPanel child. A refresh unloads it, the window closes, and `onClose` persists the staged list into the replaced model. MPRB-52: `dazed` staged, outside edit adds `prone`. The note ends `bleeding, dazed`: `prone` is gone and so is the `_dse_anchor` key. Base is identical. With nothing staged, the window still closes on any refresh, with no Notice and focus on `<body>` (MPRC-12). The hero sheet's ConditionsPanel has the same shape (`hero/view.ts:561`, code-read, not probed).
  - **OOS-2 (silent loss of the user's Apply), pinned `ds-stamina-bar`:** `src/elements/stamina-bar/view.ts:159-167`. The window is owned by the view itself, so it stays open across the refresh, but it holds the OLD model and the Apply mutates an object nobody serializes. MPRB-50: 3 damage staged, an outside edit elsewhere, then Apply. The note still says `temp_stamina: 5` and the sidebar shows `15/20 +5`. Control MPRB-51 (no outside edit) writes `temp_stamina: 2`. Base is identical. The hero sheet's stamina window has the same shape (`hero/view.ts:384`, the closure captures `model`; code-read).
  - **OOS-3 (silent loss of the element's own write), pinned montage and likely every pinned element:** a Log submitted (the window closes, the 400 ms write is pending), then an outside edit elsewhere 50 ms later. `update()` replaces the model before the flush, and the Log never reaches the note. MPRD-03 and MPRC-10 give `entries false`; MPRD-04 with a 700 ms gap gives `entries true`; control MPRD-02 gives `entries true`. Base is identical. SC-650's sidebar guard covers this only while a window is open (OW25).
  - **Prescribed direction (follow-up, not this ticket):** in `SidebarPanel.handleExternalChange`, call `previous.flushPendingWrite()` before preparing the model. Skip the refresh when the incoming body equals what the view last loaded or wrote. Make every element that holds a window adopt the SC-608/SC-650 sidebar rule (keep the window when the block is unchanged; otherwise close it with the Notice before replacing the model).

## Probe table (real Obsidian 1.14.4, e2e harness, scratch specs; head = `69ffe410` unless noted)

| Probe | Case | Measured | Verdict |
|---|---|---|---|
| MONT-OW01..09 | implementer's e2e | 9/9 ok in the full run | ok |
| MPRB-01 / 02 | board-corner Add a hero, RV / LP, keyboard, typed name | Notice 1; focus `montage.board.add-hero` ring; 2 participants (typed hero dropped) | ok (was jest-only) |
| MPRB-03 / 04 | row "Log an action for Bram" RV / "for Kira" LP | Notice 1; focus on the same hero's row button, ring | ok (was jest-only) |
| MPRB-05 | LP Set limits, `9` typed | Notice 1; focus Set limits; limit 6 (outside) | ok |
| MPRB-06 / 07 | YAML comment only: RV cell sheet / LP Log | Notice 1; focus `1:Kira` cell / Log | ok |
| MPRB-08 | LP row-act, the edit removes Bram | Notice 1; focus card root `div.dse-chrome-anchor` | LOW-3 |
| MPRB-10..13 | edit ABOVE / BELOW, RV and LP | window stays, no Notice, Log writes 1 entry, outside paragraph kept | ok |
| MPRB-14 / 15 | Escape, RV / LP | no write, no Notice, focus Set limits | ok |
| MPRB-16 | LP own Log | no Notice, focus Log | ok |
| MPRB-17 / 18 | own Log, then a second window inside 400 ms, RV / LP | RV stays open; LP closed by the own save, no Notice, focus on its opener (base: `<body>`) | I-3 |
| MPRB-20 | two montages, insert between + change the second | Notice 1, focus `<body>` (not moved) | ok |
| MPRB-21 / MPRC-04 | two montages, delete the first + change the second, RV / LP | **no Notice**, focus `<body>` (base same) | LOW-1 |
| MPRC-05 | initiative, same edit | no Notice (SC-608 shares the gap) | LOW-1 |
| MPRC-06 | three montages, delete the first + change the second | Notice 1, focus not moved to the third | ok |
| MPRB-22 | window on the first, edit changes only the second | window stays, no Notice | ok |
| MPRB-23 / 24 | identical twins, window on the second, RV / LP | Notice 1, focus on the SECOND card's Log (rootIndex 1) | ok |
| MPRB-25 / 26 | Sync burst of 5 edits 30 ms apart, RV / LP | Notice 1, focus Log ring after settle, limit 8 | ok |
| MPRC-01 | RV, user moves focus to another pane, second edit in the settle window | focus stays in pane B | ok |
| MPRC-02 | LP, focus moved to the editor right after close (31 ms), before the redraw | stays in `cm-content` | ok |
| MPRB-30 / 31 | mouse open, LP Log / RV corner | Notice 1; activeElement before == after (`cm-content` / `markdown-preview-view`), not in the card | ok (c) |
| MPRB-32 / MPRC-03 | popout window | Notice in the popout document; popout focus `montage.bar.log` ring (base: `<body>`, no Notice) | ok |
| MPRB-33 / 34 | plugin disabled right after the edit, RV / LP | no page error, no Notice, no window, focus `<body>` | ok |
| MPRB-40 | sidebar Log, edit inside the block | closed, Notice 1, focus sidebar Log, nothing written | ok |
| MPRB-41 | sidebar edit sheet Kira r1, edit elsewhere, then Remove | window stayed; entries 3 -> 2 (Kira r1 removed); outside edit kept | ok (no stale-entry delta) |
| MPRC-09 | sidebar corner Add a hero (mouse), edit adds Yenna | closed, Notice 1, `Osric` not written, Yenna kept | ok |
| MPRD-01 | sidebar refresh with no window, then window + edit elsewhere | window stays (X4 mutant: closes + false Notice) | LOW-2 |
| MPRD-02..04 | sidebar Log then edit elsewhere at 50 / 700 ms | 50 ms: Log LOST; 700 ms and control: written | OOS-3 |
| MPRB-50 / 51 | sidebar stamina bar Apply after edit elsewhere / control | lost / written | OOS-2 |
| MPRB-52, MPRC-12 | sidebar ds-conditions | outside `prone` overwritten / window closes on any refresh | OOS-1 |
| MPRC-08 | RV stamina bar, edit elsewhere, Apply | written | ok (RV not affected) |

Failures in the probe logs that are probe artefacts, re-done correctly: MPRB-27 (folder missing; re-done as MPRC-01), MPRB-28 (my microtask loop starved the event loop; re-done as MPRC-02), MPRB-32 (an undeclared in-page edit tripped the driver integrity check; the measurement itself was fine; re-done as MPRC-03), MPRB-42 (the sidebar corner cannot take focus, I-4; re-done with the mouse as MPRC-09), MPRC-07 (`ds-conditions` draws only with the experimental switch), MPRC-11 (Escape did not reach the Conditions window; not a product claim).

## Battery (dse `69ffe410`, worktree `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window/draw-steel-elements`)

| Gate | Measured | Expected |
|---|---|---|
| tsc | rc 0 | clean |
| lint | rc 0 | clean |
| jest | 13374 passed / 1 skipped, 292 suites (shots cache present) | 13344 + 29 = 13373/2 fresh, 13374/1 warm |
| e2e full | `607/622 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`, rc 0 | 598+9 / 613+9 |
| INIT-W01..W13 | 13/13 ok (in the full run) | green |
| lifecycle (7 `--only=` parts) | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc 0 | 64/64 |
| shots / freeze / parity | rc 0: 592 PNGs, host-leak 163/978, modal 40/240, capture clip 147 / `freeze OK (280/280)` / `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 592, 163/978, 40/240, 147 / 280/280 / 0/0/24 |

## Vacuity and mutants
- The base src (`git checkout 5f962390 -- src`) with the new tests kept: jest `montage-outside-edit` + `initiative-outside-edit` gives 23 failed / 34 passed. The guards that stay green are OW09, OW16, OW20, OW22, OW27, OW29. e2e MONT-OW01..09 gives 8/9 red (all "timed out waiting for the Notice"), OW06 (own write) green. Reviewer probes on the base: MPRB-01/03 no Notice and focus `<body>`; MPRC-03 popout focus `<body>`.
- Reviewer mutants (jest, 57 tests): X5 (slot taken at unload, not at open) killed, 3 red. X12 (the count check in `windowHandoff` off) killed, 3 red. X4 (no disk reset after a sidebar refresh) survived; it is a real behaviour change, red in real Obsidian MPRD-01 (LOW-2). X7 (`unloading` never set) survived jest and 14/14 e2e: equivalent (I-1). X10 (sidebar focus taken from the DOM) survived: equivalent (I-2).

## SC-656 carry-over (negotiation: an outside edit drops focus from a button, no window involved)
The `windowHandoff.ts` machinery carries over almost entirely: finding the successor by slot (not block key), the immediate look plus a 3 s watch (Reading view draws first, Live Preview closes first), the focus-is-free and user-moved-focus cancels, the count-changed guard, the settle re-claim for Sync bursts, and plugin-owned cancellation. All of it is independent of a window. Two pieces are new. First, a trigger without a window: the view must know, at unload, which of its controls held focus. In Reading view, though, the old root is already out of the document when the view unloads (mutant X7 shows the dying root is never consulted), so `document.activeElement` is `<body>` by then. The token therefore has to be recorded while focus is still inside the card (a `focusin`/`focusout` tracker on the root that keeps `captureControlFocus` of the last control, cleared when focus leaves to something still connected). Second, the Notice: no window closed and nothing was dropped, so `notice` must become optional (none for SC-656). The negotiation also needs `families` / `fallbacks` for its controls that come back disabled or changed (the SC-649 Reuse box, the tab-session state SC-648 noted). One consistency point for the owner: SC-626's rule (and SC-650's P14 ruling) says an outside edit never pulls focus into a montage when no window was open. If SC-656 makes the negotiation carry focus across an outside rebuild, the montage and the initiative will differ from it unless the same no-window hand-off is applied to them.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/`)
- Gates: `g1-tsc.log`, `g1-lint.log`, `g1-jest.log` (+ `.rc`), `g1-head.txt`; `e2e-full.log` / `.rc`; `life-part1..7.log` / `.rc`; `shots.log`, `freeze.log`, `parity.log` (+ `.rc`).
- Probes: specs `zz-r2-probes.e2e.ts`, `zz-r2-probes2.e2e.ts`, `zz-r2-probes3.e2e.ts`; results `probe-results-head1.jsonl`, `probe-results-head2.jsonl`, `probe-results-head3.jsonl`, `probe-results-base1.jsonl`, `probe-results-mut-X4.jsonl`; runs `probe-run-head1.log`, `probe-run-head2.log`, `probe-run-head3.log`, `probe-run-base1.log`.
- Vacuity and mutants: `jest-red-on-base.log`, `mutants.py`, `mutants.out`, `mut-X4-*.log` .. `mut-X12-*.log`, `mut-e2e.py`, `mut-e2e.out`, `mut-e2e-X4.log`, `mut-e2e-X7.log`.
- Obsidian `Component.unload` source: `asar/app.js`.
- Scratch git worktrees of the dse branch (detached at `69ffe410`, registered in the dse git dir; `git worktree prune` after the scratchpad goes): `dseP` (probes), `dseR` (src reverted to `5f962390`), `dseM` (mutants, restored). The review worktree itself was left as found.
