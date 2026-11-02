# SC-537 r3: independent review of the r2 implementation (plugin 4e3de39c on dse f81a277, superproject 97636536)

## Executive summary
1. **Verdict: NOT LAND-READY.** The fix works for every case G-S57 covers, but in one ordinary layout the original bug and its data loss are still there. If the second identical callout is off screen when the first is written, scrolling down to it shows the wrong number, and its + writes the upper block. A form edit is erased the same way.
2. **Findings:** 1 HIGH, 2 MEDIUM, 2 LOW, 7 INFO. HIGH-1 and MEDIUM-1 have a one-line fix, measured to work (§3).
3. **Gates on 4e3de39c:**
   - tsc, `tsc -p e2e` and lint are clean.
   - jest: **6215 passed / 1 skipped / 249 of 250** (6208 + 7).
   - lifecycle: **44/44**, run as 16 + 17 + 11 (205 s, 338 s, 249 s).
   - e2e: **124/124, 0 failed, 0 known-bug, 87/87** (CHR-F02 did not appear).
4. **Red/green, measured myself:**
   - G-S57 **FAILs** on the 458abe3 and f81a277 bundles with the §1 numbers: [7,5]; names [Twin,Twin]; [7,5,5]; [7,3,5,3]; nested [7,5].
   - G-S57 **passes** on HEAD.
   - Reported mutants: 1 gives 4 red, 2 gives 5 red, 3 gives 2 red. G-S57 also FAILs on mutants 1 and 2.
   - My own mutants: 5 and 6 are each caught by 1 jest test. 4 and 10 each survive alone (each is covered by the other's guard); 4+10 together give 1 red.
5. **Probes that pass on HEAD (real Obsidian 1.15.0 Live Preview):**
   - every click order for 2 and 3 callouts (5 + 6 orders);
   - two blocks per callout, and nested callouts, in other orders;
   - a callout twin next to a plain-fence twin;
   - form Save upper then lower, form Save lower then a click on the upper, form Save then an immediate click;
   - two panes (LP+LP and LP+Reading): every remount happened only in the pane that wrote;
   - undo and redo after a write;
   - typing in a callout's source, including typing a value back so the two callouts are identical again;
   - typing and Enter while a write is pending;
   - a non-DSE callout twin pair;
   - plugin off and on (listener count 1, then 0, then 1);
   - scroll in a tall note: scrollTop 1850 in all 176 frames.
6. **HIGH-1 (open):** far-apart twins.
   - The listener runs only on `docChanged`, and only for views inside the editor DOM.
   - A twin widget outside the drawn area is attached later by a viewport update, with no processor call and no listener pass.
7. **MEDIUM-1:** the same gap through a selection-only update. Clicking the lower callout's title within 100 ms of + on the upper leaves the lower showing 6, and its + writes the upper.
8. **MEDIUM-2:** with 3 callouts, + on the upper then + on the middle within about 270 ms writes the LOWER block ([6,5,6]). The same happens on f81a277. A pending edit moves with the widget, and the body check cannot see it.
9. **Per-keystroke cost:**
   - Large note (125 KB, 14 callout cards on screen): about +1.1 ms per keystroke.
   - One callout holding 40 blocks: about +16 to 18 ms per keystroke. This is LOW-1; `quoteOrdinal` grows with the square of the number of blocks in the callout.
10. **Tree:** I made no commits. Plugin `git status --porcelain` was empty before and after. The superproject showed ` M draw-steel-elements` before and after, as I found it (the pointer is unbumped on purpose).

## 1. Gates I ran (HEAD 4e3de39c; logs in the ledger dir)
| Gate | Result | Log |
|---|---|---|
| `npm run tsc` (incl. `-p e2e`), `npx tsc -p e2e`, `npm run lint` | rc 0 / 0 / 0, no diagnostics | `sc537-r3-gate-tsc-lint.log` |
| jest (main.js removed first; load 4.5) | `Tests: 1 skipped, 6215 passed, 6216 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250` | `sc537-r3-gate-jest.log` |
| lifecycle part 1: G-S7a…G-S6e + G-S57 | 16/16 ok, 205 s | `sc537-r3-gate-lifecycle-1.log` |
| lifecycle part 2: G-S6f…G-S15 + G-S53 | 17/17 ok, 338 s | `sc537-r3-gate-lifecycle-2.log` |
| lifecycle part 3: G-S14, G-S18, G-S32, G-S36, G-S33, G-S40, G-S45, G-S44, G-S42, G-S50, G-S54 | 11/11 ok, 249 s | `sc537-r3-gate-lifecycle-3.log` |
| e2e | `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, 69 s | `sc537-r3-gate-e2e.log` |

- **Bundle check:** each lifecycle part built `main.js` with sha256 `402aedb1…`. That is the same bundle every HEAD probe used.
- **Shots, freeze and parity: I trust the implementer's runs and did not rerun them.**
  - The diff `f81a277..HEAD` touches no CSS and no part of the shots harness. It changes only:
    - `src/framework/host/{ReadingModeBlockHost,livePreviewReconcile,remountReused}.ts` and `registerFrameworkElements.ts`;
    - two test files and one mock;
    - `visual-harness/obsidian-lifecycle.mjs`, which shots does not use;
    - `.repo-docs/architecture.md`.
  - Their numbers: 592 shots, 0 FAIL, freeze 280/280, parity 0/0/24.

## 2. Red/green and mutants
- **G-S57 on the 458abe3 bundle** (my own `git archive` build, HEAD harness): **FAIL**. `sc537-r3-red-gs57-on-458abe3.log`:
  - (a) cards [6,6], disk [6,5]; no `reused-by-twin` release; the lower click gives [7,5];
  - (b) names [Twin,Twin], disk [6,5];
  - (c) [7,5,5], then [7,5,6];
  - (d) [7,3,5,3], then [7,3,5,4];
  - (e) [7,5].
- **G-S57 on the f81a277 bundle** (the real parent): FAIL, same numbers (`sc537-r3-red-gs57-on-f81a277.log`).
- **G-S57 on HEAD:** ok. Cards equal disk at every step (`sc537-r3-green-gs57-on-head.log`).
- **Mutants:** jest ran on `twin-reuse.test.ts` + `livePreviewScrollHold.test.ts` (52 tests); lifecycle ran on bundles built from each mutant (`sc537-r3-mutants.log`).

| # | Mutation | jest | lifecycle |
|---|---|---|---|
| 1 | `reusedBlockBody` without the LP section | 4 red | G-S57 FAIL ([6,6]/[6,5], no reused-by-twin, [7,5]) |
| 2 | listener calls `reconcile(path)` without the editor | 5 red | G-S57 FAIL (same) |
| 3 | no `lastWriteLine` skip | 2 red (SC-537 lastWriteLine case + SC-481 r4 pane-B case) | not run |
| 4 | drop `within.dom.contains(entry.root)` (`remountReused.ts:113`) | **0 red** | not run |
| 10 | drop `scope.view.dom.contains(widget)` (`ReadingModeBlockHost.ts:537`) | **0 red** | not run |
| 4+10 | both | 1 red (the "another editor" case) | not run |
| 5 | drop the `docChanged` guard (`livePreviewReconcile.ts:23`) | 1 red | G-S57 ok |
| 6 | drop the callout-only early return (`ReadingModeBlockHost.ts:627`) | 1 red (plain LP widget case) | G-S53 ok, G-S57 ok |

After every mutant the source was restored with `git checkout` of the three files, and `git status --porcelain` was empty.

## 3. Findings

### HIGH-1: identical callouts more than about a screen apart still get the stale card, the wrong-block write and the erased form edit
- **Where:**
  - `src/framework/host/livePreviewReconcile.ts:23`: `if (!update.docChanged) return;`
  - `src/framework/host/remountReused.ts:113`: `if (within && !within.dom.contains(entry.root)) continue;`
- **Fixture (scratch probe):** `Probe537/far.md` is TOP, then `> [!note] Camp` holding counter Twin 5, then 150 paragraphs, then the same callout, then BOTTOM.
- **Measured on the HEAD bundle** (Live Preview, real clicks; the stale card is shown in `sc537-r3-head-far-callouts-lower-shows-6-disk-6-5.png`):
  - **`far`:** click + on the upper callout, so disk is [6,5]. Park the cursor and scroll to the lower callout. Its card is **R8 = 6**: the upper callout's original view. Click + on it: disk becomes **[7,5]**, so the upper block was written.
  - **`far-nopark`:** the same without parking the cursor: [6,5], lower shows 6, then [7,5].
  - **`far-up-from-low`:** scroll to the lower callout first, scroll back up, click + on the upper, then scroll down. The lower shows 6, and its + gives [7,5].
  - **`far-form`** (data loss)**:** form Save on the upper changes Twin to Edited (names [Edited,Twin]). Scroll down and click + on the lower: **names [Twin,Twin], disk [6,5].** The edit is erased and the lower block is not written.
  - **Compared with the base and the plain-fence case:**
    - f81a277 gives the same result (`far` on the b06 run). The fix simply does not reach this case.
    - Plain-fence twins in the same layout are correct (`far-plain`), because SC-481's processor path covers them.
- **Mechanism:**
  1. At the `set` transaction the lower slot is outside CodeMirror's drawn area.
  2. Obsidian still hands it the upper's old widget object (it matches on text over the whole document).
  3. The widget's root is not in `cm.dom`, so the pass skips it.
  4. When the user scrolls, CodeMirror attaches the cached `containerEl` in a viewport update. There is no `docChanged`, so the pass does not run, and no processor runs either.
  5. The stale view stays until some later edit to the document. Its own click is that edit, and it writes the upper block.
- **Why this layout matters:** a note with the same callout repeated per session or per encounter section hits it. It is the exact ticket defect, data loss included.
- **Prescribed fix:** also run the pass when CodeMirror may have attached a cached widget:
  ```ts
  if (!update.docChanged && !update.viewportChanged && !update.selectionSet) return;
  ```
  (`selectionSet` also closes MEDIUM-1.) The pass's text read is already lazy, so an update with no callout card in this editor costs one loop over the live entries.
- **Evidence for the fix:** I built a probe bundle with exactly that guard (`bundle-fixvp`, not committed):
  - `far`, `far-nopark`, `far-up-from-low`, `far-form`, `raw-lower-100`, `seq2-01` and `type-value-back` are all clean;
  - G-S57 is ok;
  - jest `twin-reuse` + `livePreviewScrollHold` is 52/52.
- **Gate to add:**
  - G-S57 phase **(f) far-apart**: a far fixture, a click upper / scroll / read / click lower step, and a form Save variant. It must FAIL on 4e3de39c with lower 6 then [7,5] (form: names [Twin,Twin]).
  - jest: an update with `docChanged: false, viewportChanged: true` after the widget is attached must release the view as `reused-by-twin`.
  - Narrow the CHANGELOG (LOW-2) only if this is deferred instead.

### MEDIUM-1: a twin that is source (cursor inside) when the write lands gets the stale widget when the cursor leaves
- **Where:** `livePreviewReconcile.ts:23`, the same guard as HIGH-1.
- **Measured on HEAD (`raw-lower-100`):**
  1. Click + on the upper callout, then within 100 ms click the lower callout's title. Obsidian now shows the lower callout as source.
  2. The write lands with the lower callout raw. Obsidian's rebuild gives the raw lower callout the writer's old widget, which is not in the DOM, so the pass skips it.
  3. The cursor leaves the lower callout. That update only changes the selection, so the pass does not run, and the widget is drawn stale: **lower R1 = 6, disk [6,5]**.
  4. + on the lower writes **[7,5]**.
- **Controls:**
  - With 1500 ms between the two clicks (`raw-lower-1500`) the result is clean.
  - f81a277 behaves the same as HEAD here.
- **Fix:** the `selectionSet` part of HEAD-1's guard; it is clean in `bundle-fixvp`.
- **Gate:** G-S57 phase (g), with the title click 100 ms after +.

### MEDIUM-2: three identical callouts and two quick clicks: the middle's click is written into the lower block
- **Where:** a gap in the design, not in one line.
  - `reusedBlockBody` (`ReadingModeBlockHost.ts:621-640`) can only see a moved view whose `knownBody` differs from the block it now sits on.
  - A view whose write is still inside the 400 ms debounce still knows the twin's body.
- **Measured (`fast3-01-120`, run twice):**
  - Steps: + on the upper, then 120 ms later + on the middle; the next click starts about 270 ms after the first.
  - Writes: [5,5,5]→[6,5,5], then **[6,5,5]→[6,5,6]**. The middle's click (R21, logged at block 1) landed in the LOWER block.
  - What happens: the upper's write rebuilds the callouts. The middle callout is raw from its own click, so it consumes the upper's old widget. The lower slot gets the middle's widget and R21 with its pending +1. R21's flush then resolves through the editor to the lower window.
  - Display on HEAD: afterwards the middle card shows R20 = 6 while the middle block holds 5, until the next document change.
- **Same on f81a277:** [6,5,6] (b04 run). This is pre-existing, and SC-537 does not make it worse.
- **Variants:**
  - `fast3-012-120` (three quick clicks): [6,5,7].
  - Two callouts (`fast-01-100`, `fast-10-100`, `fast-01-450`, `fast-01-700`, `fast-010-150`, `fast2-01-0`): clean.
  - `fast3-12-120`: clean.
- **Fix (owner's call, or a follow-up ticket):** in the editor pass, remember each Live Preview callout host's widget position (`posAtDOM`) per editor. On the next update, compare `update.changes.mapPos(prev)` with the current `posAtDOM(widget)`.
  - If they differ, the widget was handed to another callout. Release and redraw it even if the bodies are equal.
  - Flush that view's pending edit to the block it was clicked on (its mapped previous line), not by body: a body search is ambiguous between twins (SC-480).
- **Not closed by the HIGH-1 guard** (`fast3-01-120` still gives [6,5,6] in `bundle-fixvp`).

### LOW-1: the cost per keystroke grows with the square of the number of DSE blocks in one callout
- **Where:**
  - `ReadingModeBlockHost.ts:300-313`, `quoteOrdinal`: `top.querySelectorAll('div, code')` walks every `div` inside every card of the callout, plus a `closest()` call for each.
  - It runs once per judged entry, from `fenceOnElement` (`:355`).
- **Measured** (in-page; each listener call uses a fresh document text, so the line-split cache misses as it does while typing):

| Note | Entries judged | Listener per update | Real keystroke at the end of the note, HEAD vs f81a277 |
|---|---|---|---|
| `large.md`: 125,619 chars, 3003 lines, 150 small callouts, 14 cards in the editor DOM | 14 | mean 1.06–1.17 ms, p95 2.4–2.6, max 5.8 | 2.8–3.6 ms vs 1.56 ms |
| `bigcallout.md`: one callout with 40 counters | 40 | mean 16.4–18.4 ms, p95 19.6–26.7, max 49–61 | 17.3–21.3 ms vs 1.1 ms |

- **Profile of one pass** (40 entries): ordinal 11.7 ms of 18.4 ms. The section lookup is 0.48 ms, the widget lookup 0.12 ms, the split 0.02 ms.
- **Extrapolation, not measured:** with the cost growing as the square of the block count, 10 blocks in one callout would cost about 1 ms.
- **Fix:**
  - Narrow the query to `div.block-language-${alias}, pre > code.language-${alias}`, keeping the `[data-dse-element]` exclusion. Or compute each widget's ordered block list once per `reconcile` call.
  - This matters more once `selectionSet` is in the guard, because the pass would then also run on cursor moves.
  - In `bundle-fixvp` the large-note listener measured mean 2.2 ms, under a different machine load.

### LOW-2: the CHANGELOG bullet claims more than the fix does
- **Where:** superproject `CHANGELOG.md:18-24`. It says "Each callout now keeps its own card and value, and its clicks and saves go to its own block."
- **Problem:** that is false for HIGH-1, MEDIUM-1 and MEDIUM-2.
- **Fix:**
  - After HIGH-1 and MEDIUM-1 are fixed, the bullet holds except for MEDIUM-2's rapid-click case, which is fine to leave unsaid if it gets a ticket.
  - If HIGH-1 is deferred instead, qualify the bullet, for example "when both callouts are on screen".
- **What is correct:** removing the SC-481 parenthetical (`CHANGELOG.md` old line 25) matches the ruling.

### INFO
1. **Redundant guards.**
   - The editor scoping is checked twice: `remountReused.ts:113` (the entry root is in the editor) and `ReadingModeBlockHost.ts:537` (the widget is in the editor).
   - Mutants 4 and 10 each survive jest and are equivalent on their own; only both together are caught.
   - This is fine. If the owner wants each guard pinned, the one jest case would need an entry whose root is outside `view.dom` while its widget is inside, which cannot happen in practice. No action.
2. **Mutants that only jest catches.** Mutant 5 (no `docChanged` guard) and mutant 6 (plain Live Preview widgets judged by the editor pass) pass G-S53 and G-S57; one jest case kills each. That is acceptable: both mutants only widen the pass.
3. **`test/dom/framework/livePreviewScrollHold.test.ts:545`** now expects `registerEditorExtension` to be called 2 times.
   - It is correct for HEAD, but it is a count. Any later extension, including SC-522's rebase, has to change it again.
   - Optional fix: assert that the scroll-hold extension is among the calls, not the total.
4. **Listener lifecycle:**
   - In the same open editor, the DSE listener count was 1, then 0 after `disablePlugin`, then 1 after `enablePlugin`, with 0 page errors (`unload` probe).
   - The listener keeps no state, so nothing needs cleaning up when an editor is destroyed. Obsidian removes `registerEditorExtension` extensions on unload.
   - **Tangent, cause not investigated:** in that probe, after re-enabling the plugin, + on the still-open Live Preview callout cards wrote nothing. f81a277 does the same, so it is not SC-537. Report it to the owner as a possible Backlog tangent.
5. **Typing while a write is pending.** Obsidian shows its own Notice: "“…twin-callouts.md” has been modified externally, merging changes automatically." f81a277 shows it too. On HEAD the typed text survives (`TOPZ`, `NEWLINE`) and the values are right: [6,5], then [6,6], then [7,6]. On f81a277 the same probe also shows the SC-537 bug.
6. **Scroll (SC-478/SC-522 territory), measured on HEAD and f81a277 with the same numbers:**
   - Tall note, upper callout parked 150 px below the top, real click: scrollTop 1850 in all 176 frames, and no frame was missing the lower card.
   - The lower card's top moves 349 → 390 px. That is the upper callout turning into source (SC-540), and base does the same.
   - With click propagation stopped: the lower card's top stays at 349.
7. **Scope:**
   - No change to `livePreviewScrollHold.ts`, to the click shield (`pipeline.ts`), or to any CSS.
   - `registerFrameworkElements.ts` gains one import and one line (`:75`), next to the `lpHold` wiring as the r1 report described.
   - The r2 deviations are sound:
     - (1) `reconcile` takes the editor view because it needs `posAtDOM` and the update's document.
     - (2) Judging callouts only is right. Plain far-apart twins are correct through the processor path (`far-plain`).
     - (3) The processor-time calls are unchanged.

## 4. Probe coverage (HEAD bundle unless stated; `sc537-r3-probes.log`, full JSON per run in scratch)
- **What every case checks:**
  - Real CDP clicks; the cards are read after the cursor is parked.
  - Each card is mapped to its block through the editor and compared with that block on disk.
  - Text outside the quotes must stay unchanged, or the hand-typed lines must survive.
  - Every release is logged with its pane, and every click with the block it hit.
- **Clean:**
  - `seq2-01/10/0011/0101/1100`, `seq3-*` (all 6 orders);
  - `xy-1320`, `xy-002`, `nested-10`, `nested-001`;
  - `cross-01/001`, `cross2-01/10`: the only change was the written plain fence;
  - `fast-01-100`, `fast-10-100`, `fast-01-450`, `fast-01-700`, `fast-010-150`, `fast2-01-0`, `fast3-12-120`;
  - `form-up-form-low` ([Edited,Second]), `form-low-click-up`, `form-up-click-up`, `form-up-nopark-click-low`;
  - `panes-lplp`, `panes-lprv`, `panes-lplp-fast`: every `reused-by-twin` happened in the pane that wrote;
  - `undo` (undo back to [5,5], then [5,6], [6,6], redo, [6,7]);
  - `type-header`, `type-value-back`, `type-during-write`, `newline-during-write`, `newline-after-write` (the only problem flagged is Obsidian's own merge Notice, INFO-5);
  - `nondse`, `far-plain`, `unload` (listener counts), `scroll-real`, `scroll-stop`.
- **Not clean:**
  - HIGH-1: `far`, `far-nopark`, `far-up-from-low`, `far-form`.
  - MEDIUM-1: `raw-lower-100`.
  - MEDIUM-2: `fast3-01-120(b)`, `fast3-012-120(b)`.
  - f81a277 fails all of these too, plus `type-during-write`.
- **Not run:** a nested callout or a two-block callout in the far layout. The mechanism is the same.

## 5. Artifacts
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r3-review-report.md`
- **Gate logs** (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/`):
  - `sc537-r3-gate-tsc-lint.log`
  - `sc537-r3-gate-jest.log`
  - `sc537-r3-gate-lifecycle-1.log`, `-2.log`, `-3.log`
  - `sc537-r3-gate-e2e.log`
- **Red/green:** `sc537-r3-red-gs57-on-458abe3.log`, `sc537-r3-red-gs57-on-f81a277.log`, `sc537-r3-green-gs57-on-head.log`
- **Mutants:** `sc537-r3-mutants.log`
- **Probes:** `sc537-r3-probes.log`
- **Screenshot:** `sc537-r3-head-far-callouts-lower-shows-6-disk-6-5.png` (HEAD, far-apart callouts, after + on the upper: the lower card shows 6 while disk is [6,5])
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r3-review-rv3/`
  - Probe sources: `r3-instr.js`, `r3-scenario.mjs`, `mkharness.py`, `harness-r537.mjs`.
  - Runner scripts: `probe.sh`, `lc.sh`, `gate-*.sh`, `mut.py`, `mut-jest.sh`.
  - Bundles: `bundle-head`, `bundle-458abe3`, `bundle-f81a277`, `bundle-mut{1,2,3,5,6}`, `bundle-fixvp`.
  - Probe output: `runs/<run>/r537.json`.
