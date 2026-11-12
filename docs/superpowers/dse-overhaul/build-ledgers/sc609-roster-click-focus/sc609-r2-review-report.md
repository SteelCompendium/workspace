# SC-609 r2 independent review — roster-cell press keeps keyboard focus in the tracker

## Executive summary
- VERDICT: **LAND after one small test fix** (FIX-FIRST on M-1 only; the product change is correct and safe).
- Counts: HIGH 0 · MEDIUM 1 · LOW 2 · INFO 5.
- Reviewed dse `e2537b21` (3 commits on `231f2a3b`; `origin/develop` still `231f2a3b`, no rebase needed); superproject `1152d1ec` on `bd10dc98` (`origin/main` still `bd10dc98`; dse pointer unbumped, ` M draw-steel-elements`, which `wt-finish` handles).
- The fix meets both owner rulings in jsdom and in real Obsidian: focus inside the tracker, then a mouse press on a cell, puts focus on the pressed cell; focus outside the tracker is left alone. It also holds on the already-selected cell, in two panes, through the double-click Stamina modal, and through the double-click pool Apply (SC-603's restore now has something to restore).
- M-1: the e2e negative INIT-F14 is vacuous against the mutation it exists to catch. Its "before" focus is Obsidian's `.markdown-preview-view` div, not `<body>`, so `focusIsFree` blocks the pull-in either way. Drop `focusWasInside &&` and INIT-F14 stays green; a `<body>` variant goes red. Only jest F21 catches that mutation.
- Gates I measured: tsc rc 0 · lint rc 0 · jest **10716 passed / 1 skipped** (post-shots cache; = base 10712/1 + 4) · e2e **280/284 ok, 0 failed, 4 known-bug, coverage 171/171** · lifecycle **60/60** (21+16+9+4+7+3, all rc 0). Not re-run: shots/freeze/parity (no CSS or DOM-shape change; the implementer reported 592 / 280/280 / 0/0/24).
- Survey: no missed rebuild path inside the tracker body. The survey skipped the chrome items (mouse Collapse / Pin with focus inside drops it to body), but SC-505 already rules those (INFO-2).

## Scope and method
- Diff: `src/elements/initiative/view.ts` (+12/-1: import, `focusWasInside` capture at :1836, hand-off at :1863), `test/dom/elements/initiative-matrix.test.ts` F19-F22 (:820-872), `e2e/specs/initiative/focus-after-cell-press.e2e.ts` (INIT-F13/F14), `CHANGELOG.md`; workspace `CHANGELOG.md` Unreleased bullet.
- Read: ledger, r1 brief and report, `controlFocus.ts`, `focusHandoff.ts`, `pipeline.ts` `armClickShield` (:195-248), the initiative view's rebuild and modal paths, and every `.empty()` / `rebuildAndPersist` / `remove()` site in `view.ts`.
- Executed: the full gates above; 8 jsdom probes; 9 real-Obsidian e2e probes; 4 jest mutants and 2 e2e mutants. Every probe file and mutation was temporary: the probe specs were removed and `view.ts` was restored with `git checkout -- <file>` after each mutant. The branch is byte-identical to `e2537b21` at the end (`git status --porcelain` empty in dse, ` M draw-steel-elements` only in the superproject, the same as before).

## Findings

### MEDIUM

**M-1 — INIT-F14 (the ruling's e2e negative) does not catch focus being pulled in by this fix.**
`e2e/specs/initiative/focus-after-cell-press.e2e.ts:40-50`.
- Scenario: after `dse.openNote`, `document.activeElement` is `DIV.markdown-preview-view` (probe ZZ-R08), not `<body>`. The fix's second guard `focusIsFree` (`view.ts:1863`) refuses to move focus whenever anything holds it, so INIT-F14 passes whether or not `focusWasInside` exists. Mutant B (`if (focusIsFree(...)) focusControl(...)`, `focusWasInside` dropped) leaves INIT-F13 and INIT-F14 both green (`mute2e-B-noinside.log`, `done: 2/2 ok`). With focus really on `<body>` (blurred first, probe ZZ-R09), the same mutant pulls focus onto cell 0-3 and the probe goes red (`mute2e-B2-noinside.log`: `ZZ-R09 FAIL`, after = `{ctl:"init.cell.stamina", cell:"0-3", inTracker:true}`). On the real fix ZZ-R09 passes (`e2e-probe3.log`).
- Why it matters: `focusWasInside` is the SC-588 "a click never pulls focus in" half of the ruling. Today only jest F21's second half (`other.blur()`, then a press) guards it. The ruling asked for the real-Obsidian negative to catch it.
- Fix: in INIT-F14, blur before the press and assert the start state, e.g. `await dse.page('(() => { document.activeElement?.blur(); return true; })()')` and `expect(await dse.page<boolean>('document.activeElement === document.body')).toBe(true)`. Then assert that `document.activeElement === document.body` after the press. Alternatively, keep INIT-F14 as is and add INIT-F15 for the `<body>` start (the preview-div start is also worth keeping: it is what a user who just opened the note has). Keep the SC-458 comment on whichever case SC-458 would flip (both would flip).

### LOW

**L-1 — In real Obsidian a mouse press draws the keyboard ring on the cell, despite the comment, the changelog and F20.**
`src/elements/initiative/view.ts:1861-1862` (comment: "a mouse press gets plain focus with no ring (the engine's own rule after a pointer)"); `test/dom/elements/initiative-matrix.test.ts:828` (F20 title).
- Scenario: Tab to the detail Stamina control, then a mouse press on cell 0-3. The cell holds focus with `:focus-visible` true (probes ZZ-R04 and ZZ-R06: `ring:true`). The code does call `focus({preventScroll:true})` without `focusVisible`, so F20 is right about the call. But Chromium matches `:focus-visible` on a script focus when the element that had focus was showing the ring, and the shield's `preventDefault` on pointerdown/mousedown means no pointer focus ever reset that modality.
- Impact: cosmetic, and arguably right for a keyboard user (it matches SC-588's "the ring follows what the old node showed"). But it is not "where the browser would have put it" (a real pointer focus draws no ring), and the comment states something false about the shipped behaviour.
- Fix (owner's call): either (a) reword the comment and F20's title to "no ring is forced; Chromium keeps the ring the keyboard-focused control was showing", or (b) if no ring is wanted, assert `ring:false` in INIT-F13 and find a mechanism (not a one-liner; it would need `focusVisible:false`, which Chromium 124+ honours). I recommend (a).

**L-2 — F22 pins a behaviour the owner ruled SC-458's to change, but nothing in it says so.**
`test/dom/elements/initiative-matrix.test.ts:864-872`.
- Scenario: SC-458 lands "a click moves focus to its target". F22 (focus on Advance round, then a press on a cell, and focus stays on Advance round) goes red with no pointer to the ruling. The same applies to F21's second half (body, then a press, and nothing focused), which is exactly INIT-F14's case.
- Fix: one comment line on F22 (and on F21's body half) naming SC-458 as the ticket that flips it, matching INIT-F14's comment. The ledger's test ruling asks for this wording on the negative.

### INFO

**I-1 — Live Preview: the fix works, then the tracker's own write takes focus away (SC-602 / SC-605, out of scope).**
Probe ZZ-R01 (`e2e-probe2.log`): focus by script on the LP detail Stamina control, then a mouse press on cell 0-3. Immediately after the click, focus is on cell 0-3 (the fix ran). About 435 ms later (the persist debounce), `focusout` fires on the cell and focus ends on `<body>`. Trace: `focusout:init.detail.stamina@1361, focusin:init.cell.stamina@1375, focusout:init.cell.stamina@1810`. This is the LP own-save loss the ledger assigns to SC-602 / SC-605. INIT-F13 is Reading-view only, which is right. Worth a line on SC-602 that the roster press is another reproduction.

**I-2 — Survey gap: chrome items inside the element were not surveyed (ruled already by SC-505).**
Probe ZZ-R05: Tab to the detail Stamina control, then a mouse press on `chrome.collapse`. Focus ends on `<body>` (the block collapses). Pin to sidebar with the mouse is the same family: `pipeline.ts:677-678` arms the hand-off only for a keyboard press, and the block is rebuilt from scratch. SC-505 ruled "a MOUSE press keeps the base behaviour" for these, so they are not regressions and not this ticket. Under SC-609's rule ("focus inside, a mouse press, a rebuild: focus on the pressed control's replacement"), a mouse Collapse or Pin with focus already inside is the same family. Owner's call whether to note it on SC-458 or file it. The survey's other claims check out: rebuildAndPersist paths (`view.ts:349, 361, 796, 1510, 1883, 2004, 2121`) restore via SC-588; condition remove (`:2225` / `:2246` → SC-614); the quick-add shield blur (SC-615). Hero turn, squad actions, action checklist, Malice stepper and title edit repaint in place or are editable (no loss). I found no other `.empty()` rebuild reachable by a mouse press.

**I-3 — Two panes, focus in the OTHER pane: lost to `<body>` at the press, before any DSE handler runs (Obsidian leaf activation; not this fix).**
Probe ZZ-R07 v2: focus by script on pane A's detail Stamina control, then a real click on pane B's cell 0-3. Right after the click (before the write), focus is on `<body>`. The fix did not run `focusControl` (pane B's `focusWasInside` was false, and pane A's cell never got focus). Outside the ruling's "focus inside the tracker". The same-pane, two-pane case is correct: probe ZZ-R06 (Tab in pane B, press in pane B) puts focus on pane B's cell 0-3 and keeps it 1.5 s after the write, and pane A never takes it. (The first ZZ-R07 run was a probe artefact: script focus in pane A made A the active leaf, so `dse.block` resolved pane A.)

**I-4 — Edge cases probed and correct.**
- Press on the already-selected cell (the detail row rebuilds anyway): focus on that cell (jsdom P3; e2e ZZ-R04 `cell:"0-1"`).
- A double-click from a focused detail Stamina control: the Stamina modal, then Escape, puts focus on cell 0-3 (ZZ-R02). The squad pool modal, then Apply with Enter, puts focus on the rebuilt cell 0-3 (ZZ-R03). Before SC-609, focus was on `<body>` when the modal opened, so SC-603 restored nothing. Now SC-603's restore gets the cell. INIT-F07..F12 are all green in the full run.
- Focus on another group's detail row (survives): unchanged (P5). Focus on the tracker root (`tabindex=-1`, SC-588 fallback): unchanged (P7). A keyboard Enter on a focused cell: no `focus()` call at all (P8). An assistive-tech click (`detail 0`) with focus on the detail row: the cell gets focus with the ring forced (P6).
- Two trackers in one document (jsdom P1/P2): focus never crosses to the other tracker.
- Hover preview: not driven (the e2e driver has no hover-preview helper). The path is identical: `this.rootEl` is the preview copy's root, and `handle.buttonEl.ownerDocument` is the right document. Lifecycle part 5 (G-S83, hover-preview modals) is green.

**I-5 — Mutation results (the tests are otherwise sharp).**
- jest, `initiative-matrix` + probes (`mut-*.log`): A (no hand-off) turns F19 and F20 red. B (no `focusWasInside`) turns F21 red. C (no `focusIsFree`) turns F22 red. D (ring forced) turns F20 red. Each guard of the fix line is pinned by exactly one F-test.
- e2e (`mute2e-*.log`): A turns INIT-F13 red (received `{cell:null, ctl:null, inTracker:false}`). B leaves INIT-F14 green (M-1).

## Gate numbers (this review, dse `e2537b21`)
| Gate | Result | Log |
|---|---|---|
| tsc | rc 0, no output | `tsc.log` |
| lint | rc 0 | `lint.log` |
| jest (full, `rm -f main.js styles.css` first) | `Tests: 1 skipped, 10716 passed, 10717 total`, `Test Suites: 1 skipped, 266 passed`, rc 0 (load 9.7 → 20.8) | `jest-full.log` |
| e2e full | `OBSIDIAN-E2E done: 280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, rc 0 (INIT-F13 / F14 ok) | `e2e-full.log` |
| lifecycle part 1 (G-S7a..G-S9a) | `done: 21/21 ok, 0 failed`, rc 0 | `lc1.log` |
| lifecycle part 2 (G-S9b..G-S40) | `done: 16/16 ok, 0 failed`, rc 0 | `lc2.log` |
| lifecycle part 3 (G-S45..G-S64) | `done: 9/9 ok, 0 failed`, rc 0 | `lc3.log` |
| lifecycle part 4 (G-S57,G-S62,G-S61,G-S56) | `done: 4/4 ok, 0 failed`, rc 0 | `lc4.log` |
| lifecycle part 5 (G-S59..G-S91, incl. G-S83 hover-preview modals) | `done: 7/7 ok, 0 failed`, rc 0 | `lc5.log` |
| lifecycle part 6 (G-S92,G-S96,G-S97) | `done: 3/3 ok, 0 failed`, rc 0 | `lc6.log` |
| shots / freeze / parity | not re-run (focus-only change, no CSS/DOM shape); implementer reported 592 / 280/280 / 0/0/24 | - |

Jest reads 10716 / 1 because this worktree already has the shots cache (base after shots is 10712 / 1, plus 4). It is the same count as the implementer's fresh 10715 / 2.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc609-r2-review/`: gate logs above; `jest-probe.log` + `zz-sc609r2-probe.test.ts.saved` (jsdom probes P1-P8); `e2e-probe1.log`, `e2e-probe2.log`, `e2e-probe3.log` + `zz-sc609r2-probe.e2e.ts.saved` (real-Obsidian probes ZZ-R01..R09); `mut-{A-nofix,B-noinside,C-nofree,D-ring}.log`, `mute2e-{A-nofix,B-noinside,B2-noinside}.log`; scripts `run.sh`, `jest.sh`, `mutate-jest.sh`, `mutate-e2e.sh`, `battery.sh`.
