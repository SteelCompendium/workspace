# SC-518 r2 review: independent adversarial review (reviewer C1)

## Executive summary
- Verdict: **NOT LAND-READY** (1 MEDIUM). Reviewed dse `6386a8f` (red `958932e`, fix `88ced3f`, G-S50 `6386a8f`) against base `ed368f6`. Superproject CHANGELOG `76d68d5`. Pre-SC-509 reference bundle: `a0365a4`.
- Counts: HIGH 0 · MEDIUM 1 · LOW 3 · INFO 4.
- MEDIUM-1: two identical blocks of the same kind, and the user edits the upper one. In real Obsidian, focus ends on the **twin's** pencil, with the focus ring. Obsidian moves the edited block's old section element down to the twin's position, so the opener is still in the document and the modal hands focus back to it. Base does the same thing; the jest twin test does not model this. A 3-line fix was checked in scratch and works (see below).
- LOW-1: mouse opens differ from pre-SC-509. A pointer press never focuses the pencil. On HEAD, if focus was on `<body>` before the open, a mouse Save now forces focus onto the pencil, so the hover panel stays revealed (`:focus-within`). Pre-SC-509 and base both leave `<body>`. G-S50 phase 2 pins the new behaviour.
- LOW-2: the SC-519 path (a form opened while an in-card write is pending) has no test. Mutation M9 (read the opener after the flush) survives jest and G-S50. Under M9, real Obsidian leaves focus on `<body>` (FU2 broken). The shipped code is correct.
- LOW-3: a failed write's disarm (`FormModal.ts:494`) has no test. Mutation M6 survives.
- Everything else holds in real Obsidian 1.15.0:
  - Reading view, sidebar and Live Preview keyboard Saves.
  - Hero "Edit definition": Reading keyboard and mouse, Live Preview keyboard.
  - FU2 keyboard (the click is kept); Escape, Cancel, a no-change Save, an invalid-YAML Save.
  - One-shot behaviour: tabbing away, clicking text, a late outside edit, switching notes, and closing before the redraw never steal focus.
  - Scroll stays put (1594 → 1594). Note bytes equal base.
- Battery on HEAD (clean scratch worktree), all green:
  - tsc/lint clean;
  - jest 6128 passed / 3 skipped (the 2 extra skips depend on where the worktree sits; equals 6130/1);
  - lifecycle 40/40; e2e 124/124, 87/87;
  - shots 592, 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212];
  - freeze 280/280; parity 0/0/24.

## 0. Method
- Scratch worktrees (detached) under `.../scratchpad/sc518-r2-review-C1/`: `base` (ed368f6 plus HEAD's two test files, for red), `head` (6386a8f), `pre509` (a0365a4, the last commit before SC-509), `mut` (6386a8f, mutations). I never edited the review tree; every write went to my own scratch worktrees, which are now removed.
  - At the start: plugin clean at `6386a8f`; superproject ` M draw-steel-elements` (pointer not bumped, expected).
  - At the end: the plugin HEAD had moved to `4d5e27d` ("fix(SC-518 r3): MEDIUM-1 … LOW-1 …"), and the plugin had an uncommitted ` M visual-harness/obsidian-lifecycle.mjs`. Another agent did this during my review.
  - **This review covers `6386a8f` only; it says nothing about `4d5e27d`.**
- Real-Obsidian probes: I added six probe scenarios (`R2-READ`, `R2-TWIN`, `R2-MOUSE`, `R2-PEND`, `R2-HERO`, `R2-MCLICK`) to a scratch copy of `visual-harness/obsidian-lifecycle.mjs` (saved as `sc518-r2-probe-harness-spliced.mjs.txt`). They use real CDP keys and the real mouse. They run against any bundle through `DSE_LIFECYCLE_BUNDLE`, and they record outcomes rather than assert them, so the same probe compares HEAD, base and pre-SC-509. I restored the scratch `head` harness to HEAD before running the battery.

## 1. Red / green
- Jest, HEAD's `formSaveFocus.test.ts` + `heroSheet.test.ts` on base source: `Tests: 12 failed, 26 passed, 38 total` (11 SC-518 cases + the hero opener case fail; the 6 pin tests pass). On HEAD: `38 passed`. (`sc518-r2-jest-red-base.log`, `sc518-r2-jest-green-head.log`.) Note: 6 of the 17 cases were added in the fix commit `88ced3f`, not the red commit. They are red on base anyway (INFO-1).
- G-S50, HEAD harness on the ed368f6 bundle: FAIL, `<body>` on 5 of 6 phases (Reading montage and stamina keyboard, Reading mouse, sidebar, Live Preview; Cancel ok). On HEAD: `G-S50 ok`. (`sc518-r2-gs50-base-ed368f6.log`, `sc518-r2-gs50-head.log`.)

## 2. Real-Obsidian probes (HEAD vs base ed368f6; `pre509` where it matters)
| Probe | HEAD | base |
|---|---|---|
| Reading montage: keyboard, Escape after a change | same pencil, ring, note unchanged | same |
| keyboard Cancel | same pencil, ring | same |
| keyboard Save with no change | same pencil, ring, 0 modify events | same |
| invalid YAML (`title: [unclosed`) | Save disabled, Enter does not submit, Escape → pencil, ring | same |
| keyboard Save, Tab away (to "Add a round" in the card), outside edit | `<body>` (the card it was in was rebuilt), not pulled to the pencil | `<body>` |
| keyboard Save, click on text 200 ms after the claim, outside edit | stays on `.markdown-preview-view` (the click's focusin cancels the request) | same |
| keyboard Save, outside edit 3.2 s later | stays on `.markdown-preview-view` | same |
| keyboard Save, switch notes at once, come back | `.markdown-preview-view`, not the pencil | same |
| keyboard Save, open another note in the same tick (before the redraw), reopen after 0.5 s and after 4 s | `.markdown-preview-view` both times (no leak) | same |
| tall note, card at 60 % of the pane, keyboard Save | scrollTop 1594 → 1594, card top 163.7 → 163.7, pencil + ring | scroll same, `<body>` |
| **twins** (2 identical counters), edit the lower one | lower card's new pencil, ring | `<body>` |
| **twins**, edit the upper one | **lower twin's pencil, ring** (MEDIUM-1) | same (twin) |
| FU1 sidebar, real mouse (user had clicked in the note) | note's `.markdown-preview-view` (the modal's own return) | same |
| FU1 Live Preview, real mouse | `.cm-content`, cursor unmoved (line 9), scroll 0 → 0 | same |
| Live Preview keyboard, montage (2nd element kind) | new pencil, ring, scroll 0 → 0 | `<body>` |
| FU2 Reading, keyboard: Increase (write held), pencil, edit name, Save | new pencil, ring; card 4; note has `current_value: 4` + `name: Vigor` | `<body>`; same bytes |
| FU2 Reading, mouse | `.markdown-preview-view` (modal's own return; the Increase click put focus there) | same |
| FU2 sidebar, keyboard | panel's new pencil, ring; the click is kept | `<body>` |
| FU3 hero "Edit definition": Reading keyboard / Reading mouse / Live Preview keyboard | new "Edit definition", ring / no ring / ring | `<body>` ×3 |
| Reading mouse, focus on `<body>` before the open | **pencil (no ring); panel stays revealed after the mouse leaves (`auto/1`)** | `<body>`, panel hidden; **pre509: `<body>`, panel hidden** (LOW-1) |
| Reading mouse, user had clicked in the note first | `.markdown-preview-view`, panel hidden | same; pre509 same |
| Reading mouse Cancel | `<body>`, panel hidden | same |
No Notice and no page error in any probe. Evidence: `sc518-r2-probe-*-{head,base,pre509}.log`.

**Integrity:** in every phase, the note on disk after Save is byte-identical between HEAD and base:
- montage/stamina: the fixture with only the edited value changed;
- counter: the form's own reserialization (`max_value, current_value, min_value, name`);
- hero: the form's own reflow (flow maps become block style, `resource: 0` added), identical on both (INFO-3).

SC-518 writes nothing.

## 3. Findings

### MEDIUM-1: identical twins, upper one edited: focus lands on the twin
- Where: `src/framework/chrome/focusHandoff.ts:236` (`if (!focusIsFree(doc)) return;`), together with `armFormFocus` at `:110-121`.
- Scenario: a note holds two identical `ds-counter` blocks (`Lifecycle/twins.md` shape). Tab to the **upper** card's pencil, press Enter, change `current_value: 5` to `9`, press Save.
  - Obsidian re-renders by section text. The old upper section (text `…5`) now matches the lower block, so its element is reused at index 1 (measured `oldRootIndexNow: 1`, values `["9","5"]`). The upper block gets a fresh section.
  - The opener pencil is therefore still in the document, now inside the lower card. The modal close focuses it, and since it is in `ours`, the guard keeps the request.
  - The fresh upper card's claim then sees focus "held" and backs off, so focus and the ring stay on the **unedited twin's** pencil. The next Enter edits the wrong block.
- This contradicts the owner's spec ("Two same-kind blocks in one note: focus goes to the edited one, never its twin"). It is not a regression: base ends on the twin too. The jest twin test rebuilds both sections fresh, so it cannot see it.
- Evidence: `sc518-r2-probe-twin-head.log`, `sc518-r2-probe-twin-base.log` (`edit0.onTwin: true, focusInRootIndex: 1`).
- Prescribed fix (checked in scratch, see `sc518-r2-probe-candfix-mutFIX.log`; formSaveFocus jest 17/17 still green):
  - Record the opener in the request: `opener?: Element` in `Request`, and `opener: opener.pressed` in `armFormFocus`.
  - In the claim, a form request may take focus from its own opener when that opener is not part of the card now claiming:
    ```ts
    const staleOpener = req.label !== null && !!req.opener && doc.activeElement === req.opener && !root.contains(req.opener);
    if (!focusIsFree(doc) && !staleOpener) return;
    ```
  - With it, editing the upper twin puts focus on the upper card's new pencil with the ring (`edit0.onOpener: true, focusInRootIndex: 0`).
  - Add a G-S50 twin phase (identical twins, edit the upper one) and a jest case that keeps the old upper root connected in place of the twin.

### LOW-1: mouse path does not match pre-SC-509
- Where: `src/framework/chrome/focusHandoff.ts:99-102` (`formOpenerOf`) and `src/authoring/FormModal.ts:491-492` (arms for every opener).
- The r1 premise was "focus returned to the pencil via Obsidian's modal close". In real Obsidian a pointer press on the chrome pencil never focuses it: the trace across the click shows no focusin on the pencil, and the modal's return goes to whatever held focus before.
  - If focus was on `<body>`: HEAD's claim (ring off) puts focus on the pencil. Pre-SC-509 (`a0365a4`) and base leave `<body>`.
  - Visible effect on HEAD: the chrome panel stays revealed after the mouse leaves (`[data-dse-chrome]:focus-within .dse-chrome`; measured `auto/1` vs `none/0`).
  - A later Space or Enter (for example, a mouse user pressing Space to scroll) re-opens the form.
  - The same user pressing Cancel gets `<body>` and a hidden panel, so Save and Cancel now disagree.
- When focus was anywhere else (the usual mouse case, e.g. the preview after clicking in the note), HEAD matches base, because the modal's focusin cancels the request.
- G-S50 phase 2 blurs to `<body>` first, so it pins exactly the divergent case.
- Evidence: `sc518-r2-probe-mclick2-head.log`, `-base.log`, `sc518-r2-probe-mclick3-pre509.log`.
- Prescribed fix:
  - `formOpenerOf` records `hadFocus = pressed.ownerDocument.activeElement === pressed` at click time.
  - `armFormFocus` arms only when `hadFocus` is true (a keyboard open always has it).
  - G-S50 phase 2 then asserts that focus is where it was before the open and that the panel hides when the mouse leaves.
  - Alternative: keep the behaviour and document it as an owner ruling.

### LOW-2: the SC-519 pending-write path has no test
- Where: `src/framework/pipeline.ts:527-530`.
- Mutation M9 moves `formOpenerOf(evt)` into the `openAfterPendingWrite` callback, where `currentTarget` is gone after the flush. jest (38/38) and G-S50 stay green.
- In real Obsidian on the M9 bundle, R2-PEND gives `<body>` for Reading keyboard and sidebar keyboard (`sc518-r2-probe-m9-mutM9.log`). HEAD gives the pencil with the ring.
- Prescribed fix: add a jest case (an in-card Increase still in its debounce, a keyboard pencil press, a field edit, Save, then the new pencil is focused). Optionally add a G-S50 phase using G-S45's held-timer hook.

### LOW-3: a failed write's disarm has no test
- Where: `src/authoring/FormModal.ts:494`.
- Mutation M6 (`settleChromeFocus(key, null, true)` always) passes all 38 tests.
- Impact if it regressed: after a failed Save the request lives 3 s more, and a rebuild of that block in the window could pull focus while focus is on `<body>`. This is small.
- Prescribed fix: the failed-Save test should rebuild the block afterwards (with focus on `<body>`) and assert that focus does not move.

### INFO
- INFO-1: the claim-by-name, mouse, roll and section-in-document cases were first committed in the fix commit `88ced3f`, not the red commit. All are red on base source (12 failed), so the red proof holds.
- INFO-2: in Obsidian 1.15.0's Chromium, the `focusVisible` option does not decide the ring; the engine's own heuristics do. Mutation M3 (always `focusVisible: true`) still shows no ring on G-S50's mouse phase, so G-S50's "no ring for mouse" check cannot catch M3. Only the jest mouse case does, through `focus` options.
- INFO-3: the form re-serializes the counter (key order) and the hero (block style, `resource: 0`) on Save. Base does exactly the same; this is Save semantics, outside SC-518.
- INFO-4: code quality is good.
  - One mechanism (the SC-505 table), about 100 source lines, no per-element code, and every changed site has an SC-518 comment.
  - Unrelated mounts cost one `requests.size` check.
  - No new listeners or timers: it reuses the SC-505 guard, observer and 10 s cap, and the guard is removed once nothing is live.
  - `root.tabIndex = -1` is set only on the card fallback.

## 4. Mutation results (jest: formSaveFocus + heroSheet, 38 tests)
| # | Mutation | Caught by |
|---|---|---|
| M1 | Save never arms | jest 8 failed; G-S50 = base FAIL |
| M2 | claim ignores the opener's name | jest 2 failed |
| M3 | ring always forced | jest 1 failed (mouse); G-S50 **passes** (INFO-2) |
| M4 | no claim for non-chrome elements | jest 1 failed (roll) |
| M5 | a no-op Save arms | jest 1 failed |
| M6 | failed write not disarmed | **survives** (LOW-3) |
| M7 | claim takes any block's request | jest 3 failed |
| M8 | nested same-named button may be taken | jest 1 failed |
| M9 | opener read after the pending-write flush | **survives** jest and G-S50; real Obsidian `<body>` (LOW-2) |
| M10 | hero passes no opener | jest 1 failed |
Evidence: `sc518-r2-mutation-jest.log`, `sc518-r2-probe-m9-mutM9.log`, `sc518-r2-probe-m3-mutM3.log`.

## 5. Battery on HEAD 6386a8f (clean scratch worktree)
All match the implementer's numbers and the ed368f6 CURRENT plus the new tests.
- tsc (incl. `tsc -p e2e`): rc 0, clean. lint (incl. `e2e/`): rc 0 (only the known `.eslintignore` deprecation warning).
- jest after shots: `Tests: 3 skipped, 6128 passed, 6131 total`, `248 passed, 248 of 249`.
  - The 2 extra skips are location-dependent: `token-coverage.test.ts:56` and `migrationCensus.test.ts:45` look for workspace files above the repo, and the scratch worktree sits outside the workspace tree. 6128 + 2 = the implementer's 6130 passed / 1 skipped.
  - The first post-shots run had 1 failure: a 5 s timeout in `initiative-default-keys.test.ts` (SC-485) at 1-min load 39, which is unrelated. A clean re-run followed (`sc518-r2-gate-jest2-loadflake.log`).
  - Pre-shots: 6127 passed / 4 skipped.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed` (G-S50 included).
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 PNGs, rc 0, no FAIL line. `button host-leak OK (145 … 870 comparisons)`, modal 228, input 15 kinds / 176, checkbox 7 kinds / 116, prose `106 bare <p> [212]`. The run went past 600 s under load, and the harness moved it to the background; it finished with exit 0.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Follow-ups
- MEDIUM-1 and LOW-1 to LOW-3 as prescribed above (owner's call to fold or ticket).
- FU4 (unchanged): the dse-verify CURRENT block needs lifecycle 40 and a G-S50 line at landing.
