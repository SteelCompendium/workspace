# SC-615 r2 independent review report

## Executive summary
- VERDICT: **LAND**. dse `8be8ec1d` (base `506786cb`), superproject `c44158f8` (base `075b61e3`). Findings: 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO.
- Gates I measured on `8be8ec1d` in the worktree: tsc and lint clean · jest **11908 passed / 1 skipped** (shots cache present; = 11900 + 8) · lifecycle **64/64** (21 + 16 + 9 + 4 + 7 + 4 + 3, no re-runs; G-S91, G-S97 and G-S115 ok first time) · e2e **`OBSIDIAN-E2E done: 347/350 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+7: INIT-F17..F23) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.
- Revert the fix, keep the tests: jest 4 red (F30 x2, F31, F32). E2E red: INIT-F17, F18, F20, F22, F23. The negatives F19 and F21 pass on both, as they should. Jest mutants: 8 of 11 killed. The 3 that survive are equivalent (INFO-2).
- Owner's questions: each tracker keeps its own record (two trackers in one note; Reading view plus the sidebar on the same block). The listener does not grow across rebuilds, in jsdom and in real Obsidian. It is removed on unload. In a popout window it is on the popout's document. It runs before the shield, and it never prevents, stops, focuses or blurs anything.
- CHANGELOG: removing the SC-609 "Not covered … (SC-615)" line is correct. The bullets say the label works in Live Preview and the sidebar. The implementer never measured that. I measured it and it is true (LOW-1).
- origin/develop moved during the review: `506786cb..6785fa06` (SC-569). The merge has no conflicts: CHANGELOG changed on both sides in different hunks. Workspace origin/main moved to `f219c18c` (it pins dse `6785fa06`). See INFO-4.

## Scope checked against the owner rulings (quoted)

- "When keyboard focus is in a text box inside the tracker … and a mouse press on a roster cell selects that creature, focus lands on the REBUILT pressed roster cell … Focus does NOT go back into the text box. If focus was NOT inside the tracker before the press, nothing changes": **met.** Reading view: INIT-F17/F18/F23 and my INIT-Z02. Sidebar: INIT-F20 and my INIT-Z05. Live Preview: INIT-F22 and my INIT-Z06/Z07. Negatives: INIT-F19/F21, my INIT-Z01, and Z02/Z03 (focus in another tracker is never pulled into the pressed one).
- "The shield's blur on pointerdown … must keep happening exactly as today. What is typed in the Malice quick-add boxes must survive the press … a half-typed editable stepper value must still be committed by that blur as today": **met.** `src/framework/pipeline.ts` is not in the diff (only `view.ts` changed under `src/`). F32 and my P6 show that the shield's single blur still happens on pointerdown. Lifecycle G-S3 (half-typed EDITABLE stepper committed only by a real blur) is ok. The tracker has no editable stepper (see INFO-1).
- "Any framework touch must be a no-op for every element other than the initiative tracker's roster cell path, and must not move focus anywhere new … SC-458 … OUT OF SCOPE": **met.** No framework file is touched. The listener only reads. The only new `focus()` is the existing SC-609 `focusControl(handle.buttonEl, …)` in the cell's click.
- "Tests. jest case(s) shown RED on the base … (the press path must simulate the shield's pointerdown blur) … e2e … Negative: start with focus on `<body>` (assert that start state first) … No bracketed ticket id in test titles. Fresh scenario ids": **met.** I reproduced the red-on-base. F19 and F21 assert body first (`blurToBody`). Titles carry only `[INIT-Fnn]`. INIT-F17..F23 do not collide on origin/develop `6785fa06`, on any remote branch, or in any other worktree's specs.
- "CHANGELOG … qualified to the views measured": **met with a caveat** (LOW-1).

## Findings

### LOW-1 — the CHANGELOG's label claim for Live Preview and the sidebar has no committed test
- Where: `draw-steel-elements/CHANGELOG.md:60-64` ("With the cursor in the Malice quick-add amount or label … in Reading view, Live Preview and the pinned sidebar tracker"). Workspace `CHANGELOG.md:117-120` (same claim).
- Problem: the committed suite tests the label only in Reading view (INIT-F18) and in jsdom (F30). Live Preview (INIT-F22) and the sidebar (INIT-F20) test only the amount. The implementer's report says so itself ("the quick-add label/title were not separately measured in Live Preview or the sidebar"). The ruling asks for wording "qualified to the views measured". Scenario: a later Live Preview or sidebar change breaks only the label path. No test goes red, and the CHANGELOG still claims it works.
- Measured now: my scratch probes INIT-Z05 (sidebar, label) and INIT-Z06 (Live Preview, label) pass on the fix and fail on the base (focus on `body`). So today the wording is TRUE.
- Fix (pick one, not blocking): (a) keep the wording and cite this review as the measurement; or (b) copy Z05 and Z06 into `focus-after-cell-press-textbox.e2e.ts` / `focus-live-preview.e2e.ts` as INIT-F24/F25 and add them to the `init.malice.quickadd.label` manifest row. The probe source is in the scratch spec listed under Artifacts.

### INFO-1 — the doc comment names a text box the tracker does not have
- `src/elements/initiative/view.ts:341`: "The note's click shield blurs a focused text box (the Malice quick-add amount or label, a half-typed stepper)". The tracker has no editable stepper. The implementer's own survey says the Malice stepper value is a read-only node. The comment also leaves out the encounter-title textarea, which the shield really does blur (INIT-F23).
- Fix: change the list to "the Malice quick-add amount or label, the encounter title while it is being edited".

### INFO-2 — three surviving mutants, all equivalent
- M8: remove the consume step `this.cellPress = null` (`view.ts:1986`).
- M9: a press off a cell keeps the old record instead of clearing it (`view.ts:351`, `: null` changed to `: this.cellPress`).
- M10: drop `root.contains(cell)` (`view.ts:351`).
- All three pass 215/215. They are equivalent mutants. Every mouse click on a cell is preceded by a pointerdown on that same cell, and that pointerdown overwrites the record. The `press.cell === handle.buttonEl` check (`view.ts:1989`) already rejects a record that names another root's cell. No test can kill them. They are cheap defence in depth, so no action is needed.
- Killed: M1 (no `!isKeyboardClick` guard) by F35. M2 (no same-cell check) by F36. M3 (ignore `focusInside`) by F33/F34. M4 (bubble instead of capture), M5 (listener on the root instead of the document), M6 (`mousedown` instead of `pointerdown`) and M11 (no listener) each by F30 x2, F31 and F32. M7 (`focusInside` always true) by F33/F34.

### INFO-3 — Reading view mounts the tracker twice, so it has two listeners per tracker
- In real Obsidian, one tracker note open in Reading view has 2 live listeners. The second root sits in the hidden source view (`c:source:hidden` next to `c:reading:visible`, probe INIT-Z09). Each mount registers its own listener, as designed.
- Measured counts (INIT-Z04):

  | State | Live listeners |
  |---|---|
  | Reading view, at open | 2 |
  | Reading view, after 6 Advance round rebuilds | 2 |
  | Reading view, after 4 selections | 2 |
  | Another note open | 0 |
  | Two-tracker note | 4 |
  | Live Preview, at open | 1 |
  | Live Preview, after 3 saves (each redraws the widget with a NEW view) | 1 |
  | Sidebar pinned | 1 |
  | Sidebar, after 3 rebuilds | 1 |
  | Sidebar closed | 0 |

- Popout (INIT-Z08): 2 listeners on the popout's document and 0 on the main document. 0 after `leaf.detach()`.
- jsdom (P1, with the view really loaded): 13 added and 13 removed over a mount and 12 rebuilds. Always 1 live. 0 after unload.
- Note: the jsdom test host's `addChild` is an identity function, so it never loads the view. In that harness `Component.unload()` returns early and nothing would be removed. This does not affect real Obsidian, where every host loads the view (ReadingModeBlockHost via `ctx.addChild`, SidebarBlockHost via its owner). It only matters if someone writes a jsdom leak test without loading the view.

### INFO-4 — develop and main moved during the review; plan the landing for it
- dse origin/develop is now `6785fa06` (SC-569, 4 commits: `MinionStaminaPoolModal.ts`, its tests, an e2e spec, the `two-squads.md` fixture, `docs/initiative-tracker.md`, CHANGELOG).
- `git merge-tree 506786cb origin/develop 8be8ec1d`: CHANGELOG changed on both sides, no conflict markers. Nothing touches `view.ts` or the initiative e2e manifest.
- Workspace origin/main is now `f219c18c`, and its CHANGELOG also merges with no conflicts. Main pins dse `6785fa06`, and this worktree's superproject still pins `506786cb` (not bumped, as briefed). The pointer bump must go to the merged dse sha (land-stack skill: "a stale worktree pin about to revert submodules main has since moved on").
- Expected e2e after the merge: 342/345 (CURRENT at `6785fa06`) + 7 = 349/352. I did not run the merged state.

## Owner's specific questions

1. **Separate records, no shared state.**
   - Two trackers in one Reading-view note (INIT-Z02):
     - focus in B's amount, press A's cell: A selects, focus on `body`, and B's "5" is kept;
     - focus in A's amount, press A's cell: A's cell `0-2`, tracker 0;
     - focus in A's amount, press B's cell: B selects Ogre #3, focus on `body`.
   - The same block in Reading view and the pinned sidebar at once (INIT-Z03):
     - sidebar box, press the Reading view cell: `body`;
     - Reading view box, press the Reading view cell: the Reading view cell;
     - Reading view box, press the sidebar cell: `body`;
     - sidebar box, press the sidebar cell: the sidebar cell.
   - jsdom gives the same result (P2-P4, P8: focus in a box of ANOTHER DSE root is never pulled in).
   - On the base, every "lands on the cell" case is `body`.
2. **Removed on unmount and rebuild, no growth over N rebuilds, right document in a popout:** yes. See INFO-3 for the numbers. The popout test (INIT-Z08) dispatches synthetic pointer/mouse events in the popout document: focus goes to cell `0-3`, the amount "7" is kept, and the press blurs to `body` before the click. On the base it ends on `body`.
3. **Runs before the shield, never prevents, stops or focuses:**
   - Order: DOM dispatch runs document capture before root capture (window → document → … → root). The shield is a root capture listener (`pipeline.ts:250-251`). Moving the recorder to the root (M5) or to the bubble phase (M4) turns F30-F32 red, so the order is load-bearing and correct.
   - Pure read: the handler (`view.ts:349-352`) only calls `closest` and `captureControlFocus`, which reads `activeElement` and `matches(':focus-visible')`. P5 (pointerdown outside every root): `defaultPrevented` false, a window bubble listener still receives it, no `focus` or `blur` call, and the box keeps focus. P6 (pointerdown on a cell): exactly one `blur` (the shield's) and no `focus` call.
4. **CHANGELOG:**
   - The SC-609 line "Not covered: a click while the cursor is in a Malice quick-add box (SC-615)." is removed correctly: that case is now covered in all three views.
   - The new dse bullet limits the title to "in Reading view". That is accurate and conservative: my INIT-Z07 shows the title also lands on the cell in Live Preview and the sidebar (red on the base), but nothing committed tests it.
   - For the label wording, see LOW-1.

## Other probes
- Per-press record in real Obsidian (INIT-Z01, Reading view): type 7, real CDP mousePressed on cell 3, drag to the "ABOVE" paragraph and release there. Nothing is selected (still Ogre #1) and focus is on `body`. A later real press on cell 2 from `body` selects Ogre #2 and focus stays on `body`. The amount is still 7.
- Keyboard selection: a cell focused and clicked with detail 0 selects and keeps focus (P7). The full e2e suite, including the SC-609 keyboard scenarios, is green.
- Fresh jest, run in a git-archive copy outside the workspace: 11905 passed / 4 skipped. The 2 extra skips are `token-coverage.test.ts`, which needs the workspace token map that a copy outside the workspace tree cannot reach. That makes it the same as the implementer's fresh 11907 / 2. Cached in the worktree: 11908 / 1.

## Working tree
- Before and after: dse HEAD `8be8ec1d` on branch `sc615-initiative-quickadd-focus`, `git status --porcelain` empty, no stash. Superproject HEAD `c44158f8`, status ` M draw-steel-elements` both before and after (the pointer is deliberately not bumped). My only change in the worktree was the allowed `rm -f main.js styles.css` before jest (ignored files that the battery rebuilt). All mutation and probe work ran in scratch copies.

## Artifacts (scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc615-r2-review/`)
- Gate logs: `wt-tsc.log`, `wt-lint.log`, `wt-jest-cached.log`, `lc-part1-232123.log`, `lc-part2-232444.log`, `lc-part3-233032.log`, `lc-part4-233723.log`, `lc-part5-234227.log`, `lc-part6-234902.log`, `lc-part7-235408.log`, `wt-e2e.log`, `wt-shots.log`, `wt-freeze.log`, `wt-parity.log`, `copyB-jest-fresh.log`.
- Revert and mutants: `probe-revert-matrix.log`, `mutate-all.out`, `mut-M*.diff` / `mut-M*.log`, `view.base.ts`, `view.fix.ts`.
- jsdom probes: `zz-sc615-probe.test.ts.parked` (P1-P8), `probe-jest-fix.log`.
- E2E probes: `copyA/e2e/specs/initiative/zz-sc615-probe.e2e.ts` (INIT-Z01..Z09), fixture `copyA/e2e/vaults/shipped/Initiative/zz-two-ogres.md`, logs `e2e-copy-fix-*.log`, `e2e-copy-fix2-*.log`, `e2e-copy-fix3-*.log`, `e2e-copy-fix4-*.log`, `e2e-copy-base-*.log`, results `e2e-probe-<run>-Z0n.json`.
