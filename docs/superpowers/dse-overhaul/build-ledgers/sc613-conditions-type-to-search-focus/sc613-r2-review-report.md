# SC-613 r2 independent review report

**Executive summary**
- Verdict: **LAND.** Plugin `8978b6f0` on `14521bf0` meets the ruling: document listener on `containerEl.ownerDocument`, registered through `lifecycle`, body / html targets only, top-most `.modal-container` only, not `defaultPrevented`, the existing `typeToSearch` reused (not forked), no double firing. Superproject `e534de69`: CHANGELOG bullet only, accurate.
- Findings: 0 HIGH · 0 MEDIUM · 2 LOW (test gaps, no product defect) · 4 INFO.
- Gates (re-run by me on `8978b6f0`): tsc + tsc -p e2e + lint clean · jest **11853 passed / 1 skipped** (shots cache present in this worktree: equals the implementer's fresh 11852 / 2) · e2e **`337/340 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · lifecycle part 1 **21/21** (holds G-S1), part 5 **7/7** (holds G-S83, the hover-opened Conditions window). `styles.css` built from `14521bf0` and from `8978b6f0` is byte-identical (`18730938…f1f9`); the diff touches no CSS and adds no element or attribute, so shots / freeze / parity carry (not re-run).
- Owner folds: (1) `.suggestion-container` guard: measured **dead but harmless** in real Obsidian (a link suggest open in the editor is closed by the real click that opens the window; none present in any state). (2) Stacked modals: DOM order **is** the top-most (palette and stamina window over the Conditions window, and the reverse), a body key with another modal on top does nothing for the Conditions window, a closed modal's container leaves synchronously. (3) The stacked-modal jest test **alone** (`-t`) kills M3 (1 failed / 366 skipped).
- Real-Obsidian probes: 13 e2e probes (1.14.4) + 1 lifecycle hover probe (1.15.1, real mouse and keys), all as the ruling expects. Mutants: 13 (6 of r1 re-run + 7 new); every non-equivalent one is killed by jest except M10 (popout document), which only my popout probe kills (LOW-1).

## Findings

### LOW-1: the popout half of the ruling has no committed test (mutant M10 survives jest and committed e2e)
- Where: `src/views/ConditionsModal.ts:223` (`const keyDoc = this.containerEl.ownerDocument;`).
- Scenario: a later refactor writes `const keyDoc = document;` (M10). jest: 367/367 green; committed e2e COND-N12 green. In a popout window the bug comes back: measured with my probe P10 under M10, a body key in the popout opens nothing (`popInput: null`, `dp: false`); on the head the same key opens the search (`popInput: "d"`), and a body key in the main window does nothing. The ruling names popout safety explicitly ("Listener on the modal's own document (popout windows)").
- Fix: add one jest test in `test/dom/views/conditions-modal-matrix.test.ts` using the iframe pattern of `test/dom/authoring/compendiumSearchHoverPreview.test.ts:221-241` (spy `document.body.appendChild` so the `.modal-container` lands in `frame.contentDocument.body`), then: a body key of the iframe document opens the search with that letter; a body key of the main document does not; after close neither does. Kill check: M10 must fail it.

### LOW-2: jest matrix file never closes the windows it opens (owner fold, confirmed)
- Where: `test/dom/views/conditions-modal-matrix.test.ts:76-78` (`afterEach` only empties `document.body`) and `open()` at `:21-28`.
- Measured: under M3 (top-most check removed) the full file fails 8 tests, 6 of which have nothing stacked (title click, blank click, `<html>`, search-open, Escape, menu); they fail because stale windows from earlier tests still hold their document listeners and take the key first. Not a product issue (P07: in Obsidian each close removes its listener), but it couples tests and inflates the kill count.
- Fix (already folded by the owner): record each modal `open()` returns and close it in the file-level `afterEach` before emptying the body. After that M3 should be killed by the stacked-modal test only (and by any test that leaves a `.modal-container` above), which is the honest count.

### INFO-1 (fold 1): `.suggestion-container` guard is dead in every reachable state, harmless; keep or drop at the owner's call
- `src/views/ConditionsModal.ts:616`.
- P12 (Live Preview, real keys): `[[` in the editor opened Obsidian's link suggest (`suggests: 1`); a real click on the tracker's Add Condition opened the window and the suggest was gone at once (`suggests: 0`). A title click and `d` then routed normally. A user cannot reach the editor behind the window (backdrop), so a suggest cannot open while the window is top and focus is on `<body>`; a suggest owned by a modal stacked above is already excluded by the top-most check.
- No persistent `.suggestion-container` or `.menu` in any state logged (Reading view, Live Preview, sidebar, popout, hover preview, palette over the window): count 0 everywhere, so the guard never blocks a legitimate key. Harmless; recommend keep (cheap, matches the CHANGELOG wording).
- Same for `.menu`: a REAL right-click on the window's title opens no `.menu` (P13: focus on body, `d` then routes). The only way found to have a `.menu` over the window is the synthetic `contextmenu` dispatch COND-N14 uses. Defensive, measured necessary only under that synthetic setup.

### INFO-2 (fold 2): real Obsidian stacking measured
- Command palette over the window (P03): `.modal-container` order `[conditions, prompt]`, both `z-index: 50`, `elementFromPoint` at the viewport centre hits index 1 (the last). Focus blurred to body, real `d`: Conditions window opened nothing, `defaultPrevented: false` (the palette keeps the key's default). Palette closed through its backdrop: container count 2 -> 1 in the same task (no closing animation lingers). Title click + `d` then routes.
- DSE stamina window over the window (P04, opened by script from the tracker behind): order `[conditions, stamina]`, hit index 1. Real click on the STAMINA title (focus to body), real `d`: nothing for Conditions. Escape (body focus) closed only the stamina window (count 1 synchronously); then `d` routes to Conditions.
- Reverse (P05): stamina first, Conditions over it: order `[stamina, conditions]`, hit index 1; title click + `d` routes to Conditions.
- Under M3 in real Obsidian (P03): with the palette on top, `d` was typed into the Conditions search BEHIND the palette (`input: "d"`, `defaultPrevented: true`): the guard is load-bearing. Committed e2e does not cover this (COND-N12 green under M3); jest does (fold 3). Optional: promote P03 to a committed e2e scenario.

### INFO-3 (fold 3): M3 isolation
- `npx jest test/dom/views/conditions-modal-matrix.test.ts -t 'a modal stacked above this one keeps its keys'`: base `8978b6f0` 1 passed / 366 skipped; M3 **1 failed / 366 skipped**; M11 (first `.modal-container` instead of last) also 1 failed alone. The test kills M3 on its own.

### INFO-4: equivalent mutant and an unreachable throw
- M7 (`evt.defaultPrevented ||` removed from `:615`) survives all 367 tests: equivalent, `typeToSearch` re-checks `defaultPrevented` on its first line (`:627`). The ruling's letter is met; no action.
- `:634` `target?.ownerDocument.body` would throw for a `Document` target (`ownerDocument` is null), but no path reaches it: the page filter (`:615`) returns for any target other than body / html, and the in-window listener never sees a document-targeted event. No action.

## Probes (real Obsidian; spec `sc613-r2-probe-spec.e2e.ts.txt`, ids `RVW613-P01..P13`, never committed; hover scenario `sc613-r2-probe-lifecycle-hover-scenario.mjs.txt`, temporarily spliced into the lifecycle harness and restored)
| Probe | What | Result on the head |
|---|---|---|
| P01 | no Conditions window, focus on body, real `d`; and again after a window was closed | nothing opens, `defaultPrevented: false` both times: the plugin does not route keys globally |
| P02 | real pointer clicks on 4 blank spots (modal padding top-left / bottom-left, body centre, header right of the title), each then `d`, then Escape | every click left focus on body; every `d` opened the search with `d` (`dp: true`); every Escape put focus on `cond.add`, window stayed |
| P03 / P04 / P05 | stacked: palette over, stamina over, stamina under | see INFO-2 |
| P06 | (Reading view split + `editor.focus()`) | `editor.focus()` did not take focus from the window there; the keys went to the window's own route. Superseded by P11 / P12 |
| P07 | 5 open / Done cycles, `document.add/removeEventListener('keydown')` counted in the page | live keydown listeners 0 -> 1 -> 0 on every cycle (adds 6 / removes 6 at the end); title click + `d` types exactly `d` |
| P08 | synthetic body keys: `isComposing` `d`, `Dead`, `Process`, `Unidentified`; `Shift+D` | the four non-typing keys: nothing, not cancelled; `D` opens the search with `D` (same as in-window) |
| P09 | sidebar-pinned tracker opener (experimental), real title click, real `daz`, Escape | search `daz`; Escape -> `cond.add`, window stays |
| P10 | tracker in a popout window, Conditions window opened there (its container is in the popout document) | popout body `d` -> search `d`; main-document body key -> nothing; after close, popout body key -> nothing |
| P11 | Live Preview, synthetic key targeted at `.cm-content` behind the window | not routed, not cancelled |
| P12 | Live Preview link suggest, then real click on Add Condition | suggest closed by that click; route works (INFO-1). (Its FAIL line is the driver's "content outside the block changed" invariant, because the probe typed `[[` into the note; the measurement is complete.) |
| P13 | real right-click on the title | no `.menu`; focus body; `d` routes |
| RVW613-H1 (lifecycle, 1.15.1) | Conditions window opened from a HOVER PREVIEW by a real mouse click, real click on its title, real `d a z`, Escape, Escape; Reading view and Live Preview | both modes: focus on body after the title click, search `daz` (first key `dp: true` from body, `a`/`z` the input's own), Escape 1 -> `cond.add`, Escape 2 closes the window, the preview stays |

Probe logs: `sc613-r2-probe-e2e-run1.log` (P01-P10 + COND-N12..N14; P10 had no expectations yet in that run), `sc613-r2-probe-e2e-run2.log` (P11-P13), `sc613-r2-probe-lifecycle-hover.log`.

## Mutants (`sc613-r2-mutate.py.txt`; jest = the matrix file, 367 tests; log `sc613-r2-mutants-jest.log`)
| Id | Mutant | jest (matrix file) | real Obsidian |
|---|---|---|---|
| M1 | `ConditionsModal.ts` reverted to `14521bf0` | 8 failed | P09 FAIL (search never opens; P02 logs show focus on body and nothing typed) |
| M2 | menu / suggest guard removed | 1 failed (menu test) | (COND-N14 per r1) |
| M3 | top-most check removed (`void modals`) | 8 failed (pollution, LOW-2); **alone `-t`: 1 failed** | P03 FAIL (`d` typed into the window behind the palette); COND-N12 ok |
| M4 | body / html target filter removed | 1 failed (control outside the window) | not run |
| M5 | `returnFocusEl` set for body | 1 failed (Escape test) | (COND-N12 per r1) |
| M6 | raw `addEventListener`, no lifecycle | 1 failed (listener test) | not run |
| M7 | `defaultPrevented` dropped from the page filter | 0 failed: **equivalent** (INFO-4) | n/a |
| M8 | `.suggestion-container` half dropped | 1 failed (menu test) | dead in Obsidian (INFO-1) |
| M9 | `<html>` half dropped | 1 failed (`<html>` test) | not run |
| M10 | listener on global `document`, not the window's own | **0 failed: survives** (LOW-1) | P10 FAIL (popout body key opens nothing) |
| M11 | first `.modal-container` instead of last | 1 failed (stacked test; alone too) | not run |
| M12 | page listener calls `typeToSearch` with no page filter | 9 failed | not run |
| M13 | page filter also passes in-window targets | 16 failed | not run |
Source restored after every mutant (`git status --porcelain` empty).

## Gates (re-run on `8978b6f0`)
- tsc `--noEmit`, tsc `-p e2e`, lint: rc 0 / 0 / 0 (`sc613-r2-gate-tsc-lint.log`).
- jest full (`rm -f main.js styles.css` first): `Tests: 1 skipped, 11853 passed, 11854 total`, rc 0 (`sc613-r2-gate-jest.log`). The worktree has `visual-harness/dist/obsidian-app.css` (the implementer's shots run), so this is the 11834 / 1 shape + 19.
- e2e full: `OBSIDIAN-E2E done: 337/340 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0 (`sc613-r2-gate-e2e.log`).
- lifecycle part 1 (`G-S7a … G-S9a`, holds G-S1): 21/21 (`sc613-r2-gate-lifecycle-part1.log`); part 5 (`G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`, holds G-S83's hover-opened Conditions window): 7/7 (`sc613-r2-gate-lifecycle-part5.log`). Parts 2, 3, 4, 6, 7 not re-run (no Conditions scenario in them per `command grep -a` of the harness; the implementer's 63/63 stands).
- shots / freeze / parity: not re-run. Evidence: `git diff --name-only 14521bf0..HEAD` = the e2e spec, `src/views/ConditionsModal.ts`, the matrix test; no CSS, no new element or attribute (a listener and a focus-return rule). `styles.css` from clean `git archive` builds of `14521bf0` and `8978b6f0`: both `18730938512d88df…f1f9`, `cmp` identical (`sc613-r2-styles-css-compare.log`).

## Tree state
Plugin `git status --porcelain` empty at start and end. The superproject worktree shows ` M draw-steel-elements` (the unbumped pointer) at start and end, untouched.
