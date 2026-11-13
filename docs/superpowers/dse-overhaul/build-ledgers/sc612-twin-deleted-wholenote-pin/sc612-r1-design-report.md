# SC-612 r1 design / survey report (designer-r1), dse 63e00d7e (= origin/develop after `fetch`; it did not move)

**Executive summary**
- **A, base, real Obsidian 1.15.1: reproduced in Reading view and Live Preview.** The form on the UPPER twin with the upper deleted: Save writes the survivor (`name: Edited`), no Notice. The card + on the upper with the upper deleted inside the round: the survivor gets 6, no Notice. The mirror (lower/lower) is refused with one Notice at base. A third red shape is new: **the lower deleted AND the TOP line edited in the same outside write writes the survivor too** (form and card, RV and LP).
- **The ticket's idea (S: every whole-note pin strict, `mapLineFromTail` must agree) fixes A1/A2 but not that third shape.** When an unrelated edit next to the run of twins stops one trim, both maps trim the same way and agree on the head-first guess. On 5771 sweep cells S leaves **640 writes in cells an independent oracle calls ambiguous**. It is also identical to the narrow variant N (gated on `twinned`) on every cell and in full jest, so S buys nothing over N.
- **Recommended rule R:** N (the tail-first check for whole-note pins whose known body occurs twice, in `pin.text` or now) plus two GREEDY maps (`mapLineGreedy`: one side trimmed only, the diff over the rest). A greedy map dissents when it says deleted or lands on another block with the known body. It does not dissent when it pairs the fence with a block of another body, or when it gave up. Diff: `sc612-r1-probe-rule-R.diff.txt` (+41/-4, tsc and lint clean).
- **R vs base on the sweep:** saved->refused **644**, wrote-other->refused **596**, refused->saved **0**, wrote X->wrote Y **0**. Oracle: R makes **0 writes in ambiguous cells** (base 1240, S/N 640) and **0 refusals in unambiguous cells** where base wrote the block. Every new refusal involves an identical counter added or removed next to the pinned one by an outside edit inside the round. There are no new refusals with no outside edit (own rounds 59/59 save). None persists: the next round saves 1918/1918. The note-without-twins path is unchanged.
- **Full jest on R: 11648 passed / 0 failed / 2 skipped** (= base, 0 flips; S, N, N3 the same). Real Obsidian on the R bundle: **all 8 red cells write nothing**, each with one "changed on disk first" Notice, and the form stays open. The cost cell (an identical block added beside the form's block) is refused too; controls and own rounds save. **G-S64, G-S73, G-S92, G-S96, G-S99 on the probe bundle: 5/5 ok, 380 s.**
- **Cost inside `vault.process`** (2000 lines, 400 edits): base `mapLine` 1.31 ms. R adds, on a twin note only, the tail-first map 1.76 ms + two greedy maps ~2.7 ms; on every pinned write, the twin count is 0.84 ms.
- **No Scott decision found to be needed:** no new refusal falls outside "an identical block involved + an outside edit inside the form / click round". Owner questions are in E. The main one is Q1 (R vs N).

## 0. Setup
- Worktree dse `sc612-twin-deleted-wholenote-pin` at `63e00d7e`, `git fetch origin`: origin/develop `63e00d7e27d6…` (did not move). `npm ci` was run (the fresh worktree had no node_modules).
- Probes ran in the worktree:
  - The rules were applied by `sc612-r1-patch.py.txt` (variants S, N, Snofb, Ntwin1, Nnow, N2, S2, N2all, N3, N3b, R) and the mutants by `sc612-r1-mutate.py.txt`.
  - After every run the two files were restored with `git checkout -- src/framework/host/ReadingModeBlockHost.ts src/framework/host/lineMap.ts`, and the probe test was deleted by its literal path (`sc612-r1-run-sweep.sh.txt`, `sc612-r1-run-jest-full.sh.txt`, `sc612-r1-run-mutants.sh.txt`).
- Real Obsidian ran only in `git archive 63e00d7e` exports in my scratch folder (node_modules symlinked, `node esbuild.config.mjs production`):
  - base-tree `a68d3b6d…`;
  - probe-tree (N3) `cb3efbc8…`;
  - n-tree (N) `7d09b13d…`;
  - r-tree (R) `9933ce2f…`.
  - styles.css is `5e5ff488…2b27` in all four (= CURRENT, no CSS change).
- Harness copy: `sc612-r1-make-scratch.py.txt` splices the fixtures and the scenario P612 (`sc612-r1-p612-scenario.mjs.txt`) in front of SCENARIOS. Run script: `sc612-r1-run-obsidian.sh.txt`. One note per cell.

## A. Reproduction, real Obsidian 1.15.1, a note in its own pane
Fixture: `# p612 …\n\nTOP\n\n${COUNTER(5,'Twin')}\n\n${COUNTER(5,'Twin')}\n\nBOTTOM\n`, so the twins are separated by one blank line.
- Form cells: Enter on the pencil, rename in the raw box, the outside `vault.process`, 1.5 s, then Save.
- Card cells: a scripted `.click()` on +, the outside `vault.process` at once (inside the 400 ms round), then 2.5 s.

Logs: `sc612-r1-obsidian-{base,probe-N3,probe-N,probe-R}.log`, with tables `…-table.txt`.

| cell | edit | base 63e00d7e (RV and LP alike) | N bundle | **R bundle** (RV and LP) |
|---|---|---|---|---|
| **A1** form on upper | upper deleted | **survivor renamed `Edited`, no Notice**, form closed | refused, 1 Notice | **refused, 1 Notice, form stays open, note = outside text** |
| **A2** card + on upper | upper deleted in the round | **survivor 6, no Notice** | refused, 1 Notice | **refused, 1 Notice** |
| mirror form on lower | lower deleted | refused, 1 Notice, form open | – | refused, 1 Notice |
| mirror card on lower | lower deleted | refused, 1 Notice | – | refused, 1 Notice |
| **A3** form on lower | lower deleted + `TOP` -> `TOP edited` | **survivor renamed, no Notice** | **survivor renamed, no Notice** (RV, LP) | **refused, 1 Notice** |
| **A4** card on lower | the same | **survivor 6, no Notice** | **survivor 6, no Notice** (RV, LP) | **refused, 1 Notice** |
| cost: form on upper | an identical block added right beside it | saved into the upper | refused, 1 Notice | refused, 1 Notice (accepted cost) |
| control: form, no edit | – | saved | – | saved |
| control: card, no edit | – | `[6,5]` | – | `[6,5]` |
| own: + twice on upper (2nd right after the 1st write) | – | `[7,5]` | – | `[7,5]` |
| own: + on lower, + on upper inside its round | – | `[6,6]` | – | `[6,6]` |

- The form was still open at Save in every form cell (`keepFormOpenOn`, the note is shown).
- **Red on 63e00d7e: A1, A2, A3, A4 × RV/LP = 8 cells.** They must be green (nothing written, one Notice, form open, the outside text kept) on the fix.
- A3/A4 are also red on the ticket's own idea (N bundle, measured).

## B. The rule

### B1. The ticket's idea, and why it is not enough
- **S** (`sc612-r1-probe-rule-S.diff.txt`): `pinnedTarget` refuses every non-partial pin whose `mapLineFromTail` does not equal `mapLine`.
- **N** (`sc612-r1-probe-rule-N.diff.txt`, the narrower variant asked for): the same check only when `strictPins.has(pin) || this.twinned(content, pin)`.
- **S and N give the same outcome in all 5771 sweep cells**, and the same full jest (11648/0/2). A disagreement of the two maps whose head-first answer also passes the body check needs a tie between identical blocks, and that is exactly what `twinned` sees. N never pays the second diff on a note without twins, and it can never refuse there.
- **What both miss.** `mapLine` and `mapLineFromTail` both trim the common head AND the common tail before the Myers middle. They differ only when the two trims compete for the same lines (the pure ticket shape). With an unrelated change next to the run (the `TOP` line edited in the same write, or `END`), one trim stops at that change in both maps. The other trim then runs through the survivor in both, so both read "the twin on that side was deleted" and agree.
- The sweep has **640 such writes** in cells the oracle calls ambiguous. Real Obsidian A3/A4 write the survivor on the N bundle.

### B2. Recommended: R = N + two greedy maps (`sc612-r1-probe-rule-R.diff.txt`)
- `lineMap.ts`:
  - `mapLineOf(a, b, line, trimTail = true)`.
  - New `mapLineGreedy(before, after, line, from: 'head' | 'tail'): number | null | 'gave up'`. `'head'` trims only the common head and runs the forward diff over everything after it, so a run of identical lines is paired as EARLY as possible. `'tail'` is the mirror. `mapLine`, `mapLineFromTail` and `mapLineStrict` are unchanged.
- `ReadingModeBlockHost.pinnedTarget`, after `line = mapLine(...)` is non-null:
  ```ts
  const twin = this.twinned(content, pin);
  if ((strictPins.has(pin) || twin) && mapLineFromTail(pin.text, content, pin.lineStart) !== line) return null;
  if (twin && (this.greedyDissents(content, pin, line, 'head') || this.greedyDissents(content, pin, line, 'tail'))) return null;
  ```
  `greedyDissents` is true when the greedy line is `null` (deleted), or a line other than `line` whose fence holds the known body. It is false for `'gave up'`, and false for a line whose fence holds ANOTHER body. A block of another kind pasted right above reads that way, because every fence line reads the same (mutant M3 shows this exemption matters).
- A miss is handled as today:
  - a form (`pinOnly`) -> `'miss'` (the "changed on disk first" Notice);
  - a card -> `twinned` is necessarily true for an R-only miss, so `'miss'` again.
- **Does a whole-note strict miss also have to skip the `resolveWriteTarget` fallback for cards? No.**
  - Under R a strict miss can only happen when `twinned` is true, and `twinned` already sends a card to `'miss'` (`replaceSource`, ~1271). The fallback is unreachable after an R miss.
  - Under S (no twin gate) a strict miss with a unique body does reach the fallback. There it can only find the one block holding the known body, which is the block the head-first map found, so it is the same write as base.
  - Measured: Snofb (S + skip the fallback) is **+18 refusals, 0 different-block writes removed**. All 18 are a card in a note without twins, with a different counter pasted right above (`sc612-r1-sweep-table-S-vs-Snofb.txt`).
  - Not one sweep shape has the fallback write a different identical block after a strict miss.
- Scope: R also adds the greedy check to `strictPins` (SC-607 part pins) at write time when the body is twinned. `rebaseCardPin` (drawn -> now, `mapLineStrict`) is untouched (Q5). Whole-note embed / hover pins and own-write pins go through `pinnedTarget` and get R as well.

### B3. Variants measured (sweep, 5771 cells; the oracle is in C2)

| variant | A | wrote other | refused | ambiguous writes | needless refusals | full jest |
|---|---|---|---|---|---|---|
| base 63e00d7e | 3621 | 1064 | 1086 | 1240 | – | 11648/0/2 |
| S (ticket idea, every whole-note pin) | 3313 | 772 | 1686 | 640 | 0 | 11648/0/2 |
| N (S gated on `twinned`) | 3313 | 772 | 1686 | 640 | 0 | 11648/0/2 |
| Snofb (S, a strict miss also skips the card fallback) | 3295 | 772 | 1704 | 640 | +18 vs S | – |
| N2 (N + greedy maps, every dissent counts) | 2901 | 468 | 2402 | 0 | **76** | – |
| N3 (R, plus the greedy check for every strict pin too) | 2977 | 468 | 2326 | 0 | 0 | 11648/0/2 |
| **R (recommended)** | **2977** | **468** | **2326** | **0** | **0** | **11648/0/2** |

- **The 468 "wrote other" cells left in every variant** are cells the text cannot tell from another edit:
  - a counter cut and pasted within or next to a run of identical counters (the note text is unchanged, or reads as "the other one moved");
  - N6 (the pinned counter deleted and an identical one pasted elsewhere = a move);
  - N5 (deleted and another edited to read like it = "the other deleted").
  - The oracle calls all 468 unambiguous. Base writes the same block; no line-map rule can see them.
- The N2 needless refusals are the different-counter-pasted-above shape (+ an edit higher up) in a note with twins. They are the reason for R's exemption.

### B4. Mutants of R (`sc612-r1-mutants.txt`; each vs R on the sweep)

| mutant | result | example killer cell (form) |
|---|---|---|
| M1 no greedy checks (= N) | killed: 640 cells -> saved / wrote other | `twin-blank/b/del-pinned+top` (A3), `twin-blank/a/del-other-b+end` |
| M2 no tail-first check for whole-note twins (greedy only) | **survived (0 cells)** | equivalent on the sweep (Q7) |
| M3 every greedy dissent counts (no another-body exemption) | killed: 76 -> refused | `twin-blank/a/ins-diff-above-adj+top` |
| M4 a greedy map that gave up dissents | killed: 68 -> refused | `twin-blank/a/big-above` (500 lines added above) |
| M5 head greedy map only | killed: 280 | `twin-blank/a/ins-twin-below-adj+end` |
| M6 tail greedy map only | killed: 360 | `twin-blank/b/ins-twin-above-adj+top` |
| M7 greedy maps trim both ends | killed: 640 (= M1) | as M1 |
| M8 no twin gate (greedy for every whole-note pin) | killed: 2 -> refused, **a refusal without twins** | `uniq-blank/b/del-other-a+top/form` |

## C. The cost

### C1. Method
- Jest sweep `sc612-r1-sweep.test.ts.txt`: a host on a counter of a note in a pane (detached element, no embed). Records are in `sc612-r1-sweep-{base,S,N,R}.jsonl`, tables in `sc612-r1-sweep-table-{S,N,R}.txt`, and the summary in `sc612-r1-flips-R-summary.txt`.
- Layouts (10):
  - `single`;
  - twins separated by one blank line, by two, by none (`tight`), by prose, at the end of the note (`blank-eof`);
  - `triple-blank`;
  - `uniq-blank` (5 and 9);
  - `twin-headed` (identical `## T` sections);
  - `twin-headed-diff`.
- Pinned: each counter.
- Edits (35 base edits, each alone and with `+top`, `+end`, `+both`):
  - none; unrelated above / below / between; a blank line added or removed between;
  - delete pinned / other;
  - an identical counter added above-adjacent / below-adjacent / at the top / at the bottom;
  - a different counter added above / below;
  - another counter's value bumped (a sibling write) or re-serialized with more lines; another counter edited to read like the pinned one;
  - the pinned one edited / moved to the end;
  - deleted + identical pasted at the end (N6), deleted + another edited to match (N5);
  - >400 lines on both sides (+ deletes), 500 lines above only.
- Constructs:
  - form (`pinPosition` + `pinOnly`);
  - card (`notePersistIntent` + `fromView`), with the element's section after the edit at its identity / at the same ordinal (Obsidian's hand-over) / null;
  - own rounds with no outside edit: two + rounds with a stale section, + then the form with a stale section, a sibling's + then this card's + inside the sibling's round (the SC-544 flush).
- **Next round:** for every refused cell whose block still exists, the form is reopened (or clicked again) on the note as it is now (re-mounted body) and must save.
- RV vs LP is not a jest dimension: a whole-note host gets the whole note in both. Real Obsidian covers both (A).

### C2. Oracle (independent of lineMap, `sc612-r1-ambiguity.py.txt`, `sc612-r1-ambiguity-oracle.txt`)
- A cell is AMBIGUOUS when more than one placement of the pinned block has the minimal line-edit cost. A placement is the block paired with an identical block of the note now, or the block left unpaired (deleted).
- 1376 of the 5384 cells with texts are ambiguous (>400-line cells were left out).

### C3. Every flip, base -> R
- **refused -> saved: 0.**
- **wrote X -> wrote Y: 0** (A->other 0, other->A 0, other->another other 0).
- **saved -> refused: 644** (form 161, each card section mode 161). By edit:
  - **an identical counter added next to the pinned one** (above-adjacent 88, below-adjacent 224, at the top or the bottom where that is next to the run 228). This includes anywhere inside a run of identical counters separated only by blank lines (a triple's middle, etc.). **The expected one.**
  - **a twin next to the pinned one deleted** (`del-other`, 100): **the ticket's mirror.** A form on the upper with the LOWER deleted was saved at base only because the head-first guess happened to be right. The note text is byte-identical to the ticket's shape, so it must be refused too.
  - each of these combined with an unrelated edit in the same outside write (`+top`, `+end`, `+both`). R refuses these; N writes the guess.
- **wrote other -> refused: 596.** The same classes plus `del-pinned` (68, the ticket itself: the pinned one deleted next to its twin).
- **New refusals outside "an identical counter added / removed next to the pinned one, by an outside edit inside the form / click round": none.**
  - No-edit and unrelated-edit cells (unrelated above / below / between, blank line added / removed between, a sibling's value bumped, a sibling re-serialized, 500 lines above): no new refusal.
  - Own rounds with no outside edit: 59/59 save (jest). Real Obsidian: + twice on one card and a sibling's + then this card's +, RV and LP: saved.
  - The user's own typing in Live Preview is modelled as unrelated / blank-line edits: no new refusal.
  - Only pasting a copy of the counter right next to the clicked one inside the card's 400 ms round would be refused. That is still the "identical block added" class. A form is a modal, so I assume no typing while it is open; not measured.
- **Persistence: none.** The next round (form reopened, next click) saves in 1918/1918 refused cells whose block still exists (408 have no block). In real Obsidian a new pin is taken from the redrawn note at the next open / round.
- Every refusal shows exactly one "changed on disk first" Notice (2326/2326). No save shows a Notice.
- **Notes without identical counters: no new refusal and no new work.** The twin gate holds this (M8 is the counter-example without it).
- **Existing jest:** no test flips under R, N3, N or S (11648 passed / 0 failed / 2 skipped, `sc612-r1-jest-full-R.log`, 87 s). There is nothing to re-model. The existing whole-note twin tests use prose between twins (SC-480 `build` puts `P<i>` lines between blocks; G-S64 and G-S73 use M1/M2/GAP), on purpose to avoid this tie.

### C4. Cost of the extra maps (`sc612-r1-timing.jsonl`, jest/jsdom on this host, load ~4, median of 15)

| note | edits | mapLine | mapLineFromTail | mapLineStrict | greedy head | greedy tail | countByBody ×2 |
|---|---|---|---|---|---|---|---|
| 2000 lines | 20 | 0.51 ms | 0.50 | 0.59 | 0.19 | 0.19 | 0.92 |
| 2000 lines | **400** | **1.31** | 1.76 | 3.48 | 1.35 | 1.36 | 0.84 |
| 2000 lines | >400 (gave up) | 1.33-2.25 | 1.32-1.39 | 2.42-2.76 | 1.24-1.41 | 1.26-1.41 | 0.83-0.85 |
| 5000 lines | >400 (gave up) | 1.63 | 1.71 | 3.00 | 1.58 | 1.69 | 2.10 |

- R per pinned write, all inside `vault.process`:
  - a note with twins: `mapLine` + tail + 2 greedy + count ≈ 1.3 + 1.8 + 2.7 + 0.8 = ~6.6 ms (base 1.3 ms) at 2000 lines / 400 edits, and ~1.5 ms for small edits;
  - a note without twins: + 0.85 ms (the twin count, which R runs on every pinned write instead of only on a miss).
- Memory: the greedy Myers trace is at most 400 × 803 Int32 per map (~1.3 MB) at the cap, freed at once.

### C5. Lifecycle on the probe (N3) bundle
- `sc612-r1-lifecycle-gs64-gs73-gs92-gs96-gs99-probe-N3.log`: **G-S64, G-S73, G-S92, G-S96, G-S99: 5/5 ok, wall 380 s.**
- Why these: they cover forms and twins in panes (G-S64, including (v) (w)), card pins and twins (G-S73), and part / whole-note hover pins (G-S92, including (i): a whole-note hover with an identical block added above, not adjacent; G-S96, G-S99).
- N3 refuses a superset of R's refusals and R refuses a superset of base's, so these passes carry to R.
- The P612 cells were also re-run on the R bundle itself (A).

## D. Test plan for r2
- **Jest, new (suggested home: a new `describe('SC-612: whole-note pins of identical blocks')` in `reading-mode-host-pin.test.ts`, or a new `reading-mode-host-whole-pin.test.ts`).** Fixture: `TOP / C5 / '' / C5 / BOTTOM` (blank-line twins), each for the form (`pinOnly`) and the card (`notePersistIntent` + `fromView`). Assert the outcome, `Notice.notices == [droppedWriteMessage('Note')]` for a refusal and `[]` for a save, and the note text.
  1. T1 (A1) form on the upper, the upper deleted -> nothing written, one Notice. **Red at base.**
  2. T2 (A2) card + on the upper, the upper deleted -> the same. **Red at base.**
  3. T3 (A3/A4) form and card on the lower, the lower deleted + `TOP` edited -> refused. **Red at base and on N** (kills M1 / M7, and M6).
  4. T4 form on the upper, the upper deleted + `BOTTOM` edited -> refused (kills M5).
  5. T5 the mirrors (lower/lower, no extra edit) -> refused (green at base: a control that the fix keeps).
  6. T6 cost, accepted: an identical counter added right below the form's block -> refused + Notice. Then the form reopened on the note as it is now (a new `pinPosition`, `setMountedBody`) -> saves into that block. Pins "not persistent".
  7. T7 a twin added with prose between it and the pinned block -> saves (no over-refusal).
  8. T8 unrelated edits with twins: `TOP` edited; a prose line typed between the twins; a blank line added between them; the other twin's value bumped (a sibling write) -> each saves.
  9. T9 a different counter pasted right above the pinned block + `TOP` edited, in a note with twins -> saves (kills M3).
  10. T10 500 lines inserted above (only) in a note with twins -> saves (kills M4).
  11. T11 a note without twins: a different counter deleted above + `TOP` edited, form -> saves (kills M8: the twin gate is load-bearing).
  12. T12 own rounds, no outside edit: + twice with a stale section; + then the form with a stale section; a sibling's + then this card's + inside the sibling's round (real flush) -> all land.
  13. T13 a triple run, the middle pinned, the upper deleted -> refused. **Red at base: base writes the LOWEST counter** (`triple-blank/b/del-other-a`).
- **Jest, sweep:** port `sc612-r1-sweep.test.ts.txt` as one `test` (1.7 s for 5771 cells), together with the oracle (an LCS placement check, ~40 lines of TS). Assert per cell:
  - no write in an ambiguous cell;
  - no OTHER in an ambiguous cell;
  - every refusal = exactly one "changed on disk first" Notice;
  - every refused cell's next round saves;
  - no-edit / unrelated-edit / own-round cells save.

  Optionally pin the totals (A 2977 / other 468 / refused 2326) as a regression fence. The 468 "other" cells are the text-identical move / paste / N5 cells, which the oracle calls unambiguous: do not assert "A" there.
- **lineMap unit tests (`test/unit/framework/lineMap.test.ts`), `mapLineGreedy`:**
  - the run-of-twins deletion with `TOP` edited: `mapLine` / `mapLineFromTail` agree, the greedy maps disagree;
  - equal texts -> `line`;
  - out of range -> null;
  - a one-sided >400-line insertion -> `'gave up'` while `mapLine` maps it;
  - `mapLine` / `mapLineFromTail` / `mapLineStrict` byte-identical results on the existing cases.
- **Existing tests to re-model: none** (0 flips in 11648).
- **Lifecycle: a G-S108 scenario is warranted, part 7, before G-S56.**
  - Nothing in e2e or lifecycle covers blank-line twins in a pane: G-S64 and G-S73 use prose between twins on purpose (dse-verify "Two identical blocks separated only by blank lines").
  - Cells (one note each): (a) form upper / upper deleted RV, (b) LP; (c) card upper / upper deleted inside the round RV, (d) LP; (e) form lower / lower deleted + `TOP` edited RV, (f) card the same LP. Each: nothing written, exactly one "changed on disk first" Notice, the outside text kept, the form open.
  - Plus (g) the cost cell (identical block added beside the form's block, refused, then Cancel, reopen, Save lands); (h) a no-edit form control RV; (i) a no-edit card control LP; (j) + twice on one card (own rounds) RV; (k) a sibling's + then this card's + LP.
  - Red at 63e00d7e: (a)-(f), plus (g) (base saves it).
  - Estimate: my P612 run did 22 cells in **69-72 s wall including the build-free start-up**, so 11 cells give part 7 about **45-60 s** alone. The P612 scenario code is a direct template (it uses `gs64Page`, `formKit`, the pencil by Enter; LP brings each block into view).
- **dse-verify SKILL:** the bullet "Two identical blocks separated only by blank lines" and residual 6 change (r2 writes a `sc612-dse-verify-proposal.md`). The doc comments of `mapLine` (lineMap.ts) and `pinnedTarget` ("Known limit (SC-556)") change too.

## E. Open questions (owner), each with a recommendation
- **Q1: R or N?**
  - N is the ticket's own idea, narrowed: a one-line change. It fixes A1/A2, but the same tie with an unrelated edit beside the run still writes the survivor with no Notice (real Obsidian A3/A4; 640 sweep cells).
  - R adds `mapLineGreedy` (~20 lines) and `greedyDissents` (~8 lines). It writes nothing in any ambiguous cell, refuses nothing the oracle calls unambiguous, and changes no existing test.
  - **Recommendation: R.** Owner decision; it needs no Scott decision (the cost class is the same as N's, only wider within it).
- **Q2: gate on `twinned` (narrow) or every whole-note pin (S)?**
  - S = N on every cell, and adds a second diff on every write.
  - R without the gate (M8) creates a refusal in a note WITHOUT twins (a different counter deleted + `TOP` edited, form). That is a new class Scott would need to rule on.
  - **Recommendation: keep the twin gate.** It guarantees "a note without identical counters never sees a new refusal".
- **Q3: a whole-note strict miss and the `resolveWriteTarget` fallback for cards. Recommendation: leave the fallback as is (no new skip).** Under R the fallback is unreachable after an R miss (`twinned` sends it to `'miss'`). Skipping it anyway (Snofb) costs 18 refusals and removes no different-block write.
- **Q4: the accepted cost.** An identical counter added or removed next to the pinned one by an outside edit inside the form / click round is refused with the Notice:
  - including the ticket's exact mirror (the lower deleted while the form is on the upper), which base saved by luck;
  - including any member of a run of identical counters separated only by blank lines;
  - including the same with an unrelated edit in the same write.

  It is never without an outside edit, never persistent, never in a note without twins. **Recommendation: covered by Scott's 2026-11-10 "Save nothing with a notice is fine."** No Scott decision needed.
- **Q5: SC-607 part pins.**
  - R also runs the greedy check for `strictPins` when twinned, at write time. Full jest shows 0 flips, and G-S92 / G-S96 / G-S99 pass on the N3 bundle (a superset).
  - `rebaseCardPin` places a part pin with `mapLineStrict` (drawn -> now), which has the same one-sided-edit residual. Not measured for part pins; R does not touch it.
  - **Recommendation:** keep R's write-time check for strict pins (same tie, same safe outcome). File the `rebaseCardPin` residual as a follow-up (apply `mapLineGreedy` inside `mapLineStrict` and re-run the SC-607 drawn-pin sweep). An alternative is to restrict R to `!strictPins.has(pin)`, if the owner wants SC-607 behaviour byte-identical.
- **Q6: G-S108. Recommendation: add it** (D). Part 7 is ~45-60 s alone.
- **Q7: M2 survives** (the tail-first check is redundant for whole-note twins once the greedy maps run; 0 of 5771 cells differ). **Recommendation: keep it**, as defence in depth and the same rule SC-607 applies to strict pins (~1.8 ms on twin notes only). Dropping it is the owner's call.
- **Q8: residuals of R** (base writes the same; documented, not fixed):
  1. The text-identical cases: a move or paste within identical counters; N5 / N6.
  2. An ambiguous twin add or remove combined with a one-sided edit of more than 400 lines in the same round: the greedy maps give up, and the head-first guess is written as at base.
  3. The `rebaseCardPin` residual (Q5).

  **Recommendation:** accept, and record them in the dse-verify residual list.

## Drive-by fixes
None.

## Follow-ups (left alone)
- **A pre-existing false refusal (base, unchanged by R):** a counter (any block of the same language) pasted directly above the pinned block, with only blank lines between, by an outside edit inside the form / click round. The form is refused. A card is written only through the fallback when the body is unique, and refused with twins. The head trim pairs the pinned fence line with the pasted block's fence (every fence line reads the same), whose body then fails the check. Sweep: `ins-diff-above-adj` with no other edit (base refused, all variants refused). A refusal, not a wrong write. Candidate ticket.
- The `rebaseCardPin` / `mapLineStrict` one-sided residual for part-of-note pins (Q5).
- dse-verify SKILL updates at landing (D).

## Working tree
- `git -C …/draw-steel-elements status --porcelain`: empty at the start and at the end; HEAD `63e00d7e`; branch `sc612-twin-deleted-wholenote-pin`.
- The probe tests (`test/dom/framework/sc612-r1-sweep.test.ts`, `sc612-r1-timing.test.ts`) were deleted by their literal paths after each run. `ReadingModeBlockHost.ts` and `lineMap.ts` were restored with `git checkout --` after every probe, mutant and diff run. The fresh worktree had no `main.js` / `styles.css`, and none are left.
- Real Obsidian ran only in scratch exports. Every harness run passed, so the harness deleted its own temp vault. No process of mine is left (checked by `/proc/*/cwd`).
