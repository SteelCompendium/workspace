# SC-612 r3 independent review (reviewer-r3): dse 1a8f624c on c0995beb, superproject 0097225a on a1d359f3

**Executive summary**
- **Verdict: FIX.** The gates are green and the named shapes are refused. But the fix still writes a different block in the ticket's own shape when a counter of another value sits next to the run of twins. The same mechanism also makes new refusals outside the ruled cost class.
- **HIGH-1 (different-block write; real Obsidian, RV and LP, form and card):** `TOP / C5 / '' / C5 / '' / C9 / BOTTOM`. The form or + is on the LOWER C5, and the outside write deletes it and edits TOP (T3/A3 with one more counter below). Result: the survivor is written (`name: Edited` / 6), no Notice, form closed. Cause: `greedyDissents`' another-body exemption (`ReadingModeBlockHost.ts:1196`). The head greedy map pairs the pinned fence line with C9's fence line, which reads "another body", so it is not counted as a dissent.
- **HIGH-2 (new refusals outside the ruled class; safe: Notice, nothing written, the next round saves):** each of these is unambiguous, and base saved it:
  - the other twin bumped (a sibling +) plus a different counter added below the pinned one;
  - a different counter directly against the pinned one (no blank line) deleted;
  - three identical counters, a blank line removed plus a different counter added.

  Cause: line-level fence pairing again. The tail-first check (`:1178`) has no another-body exemption, and a greedy null (`:1194`) is taken from a split-block alignment. The ledger statement that "every new refusal involves an identical counter added or removed" does not hold.
- **Fuzz (234,064 cells; notes with 2-4 counters, callouts, CRLF, an unterminated trailing fence, other languages; 1-3 random outside edits with a tracked truth; LCS placement oracle):**
  - tip writes in 212 oracle-ambiguous cells whose body is twinned (148 into ANOTHER block: form 37, card 111);
  - tip has 508 new refusals in unambiguous cells (140 with no identical counter added or removed).
  - Every other claim holds: 0 corrupt writes (every byte outside the written block is kept, CRLF too), 0 refusals with no outside edit, 0 refusals that persist, 0 behaviour changes in 38,616 cells of notes without twins (outcome and Notices identical to base).
- **The prescribed fix is validated by a prototype.** A twinned whole-note pin is placed only when the pinned block's UNIQUE minimal-edit placement (the sweep's own oracle) is the head-map line.
  - The prototype passes all 878 SC-612 jest tests (the sweep totals are pinned and unchanged).
  - Fuzz: 0 / 0 on both counts above. The T6b family is identical to the tip.
  - Production needs a capped Myers distance: the prototype uses an O(n·m) DP, 1.1 s on 2000 lines.
- **Gates (tip):**
  - jest 11744 passed / 2 skipped (87 s);
  - lifecycle part 7 G-S108 1/1 (51 s) and part 6 4/4 (296 s);
  - e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (176 s);
  - styles.css `5e5ff488…2b27` = CURRENT.
  - Red on base: 22 of 878 (the tests are not vacuous).
  - Mutants: 12 of 13 killed; MH (= r1 M2, the tail-first check for twins) survives.
- **T6b confirmed as a genuine tie:** an enumerated family of 3,264 cells: 1,422 refusals, all oracle-ambiguous; 0 writes in ambiguous cells.

## 1. Gates (all on the dse worktree at 1a8f624c; logs in the ledger dir)
| gate | result | log |
|---|---|---|
| jest full | **11744 passed / 2 skipped**, 273 suites + 1 skipped, 87 s, rc 0 (one run, load 7.5 at end) | sc612-r3-gate-jest-1.log |
| lifecycle part 7 `G-S108` | **1/1 ok**, 51 s | sc612-r3-gate-lifecycle-part7.log |
| lifecycle part 6 `G-S92,G-S96,G-S97,G-S99` | **4/4 ok**, 296 s | sc612-r3-gate-lifecycle-part6.log |
| e2e | **`328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`**, 176 s | sc612-r3-gate-e2e.log |
| styles.css | `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` (= CURRENT; shots / freeze / parity carry, not run) | end of the e2e log |
| superproject | `0097225a` on `a1d359f3` = workspace origin/main after `fetch` (no rebase needed); CHANGELOG only, no pointer commit | – |
Lifecycle parts 1-5 and tsc / lint were not re-run (r2's are on the same sha; my probes did not touch those paths).

## 2. Findings

### HIGH-1: the ticket's own shape still writes the other counter when a different counter sits next to the run
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:1196` (`greedyDissents`: `return !(fence && normalizeBody(fence.body) !== normalizeBody(this.knownBody))`, the "block of ANOTHER body is not a dissent" exemption), reached from `:1179`.
- **Scenario (real Obsidian 1.15.1, the tip bundle, `sc612-r3-obsidian-h1-probe-tip.log`).** The note is `# … / TOP / C5 'Twin' / '' / C5 'Twin' / '' / C9 'Other' / BOTTOM`.
  - The Edit form is open on the LOWER C5 (or + is clicked on it). The outside write deletes the lower C5 and edits `TOP` -> `TOP edited` (exactly T3 / A3 / G-S108 (e)(f), plus one counter of another value below).
  - Save writes `name: Edited` into the surviving UPPER counter; + writes 6 into it. No Notice. The form closes.
  - All four cells fail: form RV, form LP, card RV, card LP. Control H1d in the same run (form on the upper, the upper deleted, no other edit) is refused correctly.
- **Mechanism (jest, `sc612-r3-repro-named.log`, case H1).** The maps give head 3 = tail 3 = greedy-tail 3, and greedy-head = the fence line of C9.
  - Head-first greedy pairs `C5a` with the survivor and then the pinned fence line with C9's fence line: every opening fence reads ```` ```ds-counter ````.
  - `greedyDissents` then sees a block of another body and does not dissent. "Deleted" was an equally cheap alignment (the oracle: `[survivor, deleted]`).
  - Variants also written on the tip: the blank line under TOP deleted instead of TOP edited (H1b); `# N` edited; a sibling bumped; a callout, CRLF or unterminated layout.
- **Fuzz:** 37 form + 111 card cells in 234,064 write ANOTHER block in an oracle-ambiguous cell. Mostly "pinned deleted + one unrelated edit" with a different counter adjacent (29 form cells), plus move/paste combinations (8). Another 16 form + 48 card cells write the right block in an ambiguous cell, by luck.
- **Why the tests miss it:** the sweep's ten layouts never put a counter of another value next to a twin run. Its "no write in an ambiguous cell" assertion is true on those layouts only, and the pinned totals fence that.
- **Fix (prescribed, prototype-validated).** For a twinned pin (`twin` true), replace the tail-first and greedy heuristics with the placement-cost check the sweep's oracle already defines:
  - Take the pinned block's lines in `pin.text` (`[s, e]`).
  - Compute the minimal line-edit cost of the note restricted to each placement: for each block of `content` whose lines are identical, `dist(A[0,s), B[0,q)) + dist(A(e,∞), B(qe,∞))`, and for "deleted", `dist(A without the block, B) + block length`.
  - Place only when the minimum is UNIQUE and equals `line` (the head map's answer); otherwise null.
  - Keep `strictPins`' SC-607 tail-first check as is. The another-body exemption disappears: a block can only pair with an identical block.
  - Prototype: `sc612-r3-prototype-oracle-rule.diff.txt`. The production version computes `dist` with the existing Myers loop, capped at `LINE_MAP_MAX_EDITS` (factor a `editDistance(a, b, cap)` out of `mapLineOf`, after trimming the common head and tail). A capped "gave up" keeps today's behaviour (head map + body check).
  - Cost: 2k+1 capped distances for k identical blocks, on twinned notes only.
- **Tests to add:** the named cases H1, H1b and H1c of `sc612-r3-repro.test.ts.txt` (form and card). Add sweep layouts `twin-blank+diff-below`, `twin-blank+diff-above`, `tight-diff-neighbour`, `triple+diff`. Add a G-S108 cell for H1 (the patch `sc612-r3-lc-h1-patch.py.txt` is the template; one note, three cards).

### HIGH-2: new refusals in unambiguous cells, outside the ruled cost class
Graded HIGH because the brief makes any new refusal outside the class HIGH. Each one is safe (a Notice, nothing written, the next round saves) and needs an outside edit plus a note with identical counters. The owner may also choose to re-rule them under "Save nothing with a notice is fine." rather than fix them, but the prescribed HIGH-1 fix removes them anyway.
- **Where:** `ReadingModeBlockHost.ts:1178` (`(strictPins.has(pin) || twin) && mapLineFromTail(...) !== line`: no another-body exemption) and `:1194` (a greedy `null` counted as "deleted" when the greedy alignment split a block, i.e. paired one block's fence line with another block's body).
- **Scenarios (jest, `sc612-r3-repro-named.log`; base saves each into the pinned counter; tip refuses form and card, with one Notice):**
  - **M6:** `C5 '' C5(pinned) END`; the outside write bumps the upper (a sibling's + from another device, through Sync) and adds `C9` below the pinned one. tail-first = C9's fence.
  - **M2:** the same with C7 twins.
  - **M1:** `C7 C5(pinned)` with no blank line between them, `P2`, and another `C5` further down; the outside write deletes C7. Greedy-head null: it pairs C7's fence with the pinned fence and deletes the pinned body.
  - **M3:** three C5 counters; the blank line between the first and the pinned one removed and a `C9` added below the pinned one.
- **Fuzz:** 140 cells (form 35, card 105) are unambiguous new refusals with NO identical counter added or removed. Another 368 unambiguous new refusals do involve one. Those are inside the ruled class but not ties: mostly a closed copy of an unterminated trailing fence, and moves.
- **Fix:** the HIGH-1 fix (the prototype refuses none of them: 0 of 508). Add M1, M2, M3 and M6 as "saves" tests. Also extend the sweep: every refusal must be in an oracle-ambiguous cell, or in a cell whose pinned block is gone or edited. Today it only asserts "unrelated edit saves", which `bump-other` + a different counter does not hit.

### MEDIUM-1: the sweep's guarantee is narrower than its claims
- **Where:** `test/dom/framework/reading-mode-host-whole-pin-sweep.test.ts:44` (LAYOUTS) and `:379` / `:392`. Also the doc comments `ReadingModeBlockHost.ts:1158-1167`, `sc612-dse-verify-proposal.md` §4 and §7 ("0 writes in 1376 oracle-ambiguous cells", "never in a note without identical blocks… Not refused: … the other twin's value bumped").
- **Scenario:** the pinned totals and "0 ambiguous writes" read as a general property of R. HIGH-1 and HIGH-2 show they hold only for the ten layouts, none of which has a counter of another value next to a twin run.
- **Fix:** add the layouts and the refusal-must-be-ambiguous assertion above. Re-pin the totals after the fix, and restate the proposal's guarantee as "on the sweep's layouts" plus the fuzz numbers. Consider porting `sc612-r3-fuzz.test.ts.txt` (seeded, about 10 s for 20,000 notes x 4 constructs) as a second sweep, with the TS oracle.

### LOW-1: CHANGELOG wording
- **Where:** `CHANGELOG.md:11-18` (superproject `0097225a`).
- **Problems:**
  - "The same refusal applies when an identical counter was added right next to yours, or when the same outside change also touched the line above or below the counters" can be read as "an edit to the line above or below is refused". It is not: T8 saves. It also leaves out the twin added anywhere among interchangeable twins (T6b) and the mirror.
- **Fix:** after the HIGH fix, reword in plain terms, for example: "…It is also refused when, in the same outside change, an identical counter was added or removed beside yours, because then the note cannot tell which counter was yours. An edit elsewhere in the note does not cause a refusal."

### LOW-2: doc comment overstates "pays nothing"
- **Where:** `ReadingModeBlockHost.ts:1164`: "A note without identical blocks pays nothing".
- **Problem:** `twinned` (two `countByBody` scans) now runs on EVERY pinned write where `mapLine` succeeds, not only on a card miss. Measured (`sc612-r3-timing.log`, jsdom, median of 21): a non-twin 5000-line note with 198 changes per side is 5.12 ms on the tip vs 3.45 on base; 2000 lines is within noise.
- **Fix:** "pays one count of the body (two scans of the note) and is never refused by this rule".

### LOW-3: refusals that are in the ruled class but not ties
- **Scenario:** an unterminated trailing fence (the last block, no closing ```` ``` ````) is pinned, and an identical but closed copy is pasted anywhere above it. The fence-line greedy pairing refuses the Save, although the line-identical oracle is unique. It also covers moves combined with a pasted copy.
- **Status:** inside Q4's accepted class ("an identical counter added"), so it is not graded higher. The HIGH-1 fix removes it.

### INFO
- **T6b is a genuine tie, every time.** An enumerated family: runs of 2-3 identical counters (blank lines, prose, tight, a different counter below); an identical counter inserted at every token position with 4 separator styles, alone or with TOP / END edited; form and card. Result: 3,264 cells, 1,422 refusals, **all oracle-ambiguous**, 0 writes in ambiguous cells, next round saves (`sc612-r3-t6b-class-tip.txt`).
- **Two forms open at once, and sibling writes inside the round** (`sc612-r3-twoforms.log`): tip is correct in F1-F7 (two forms on twins saving in either order; a sibling card's + then the form; three twins with both neighbours bumped; both forms with the upper deleted: both refused). Base wrote form A into the survivor in F5.
- **Integrity:** 0 corrupt writes in 234,064 fuzz cells. The check: exactly one block's body changed and every byte outside it is identical, including CRLF terminators and a closing fence added to an unterminated trailing block. "User-deleted block regenerates" does not apply to this host (no generated regions).
- **Cost** (`sc612-r3-timing.log`, a form Save on a twin note, median of 21, jsdom):
  - 2000 lines, 20 / 100 / 198 changes per side: 2.97 / 4.32 / 7.80 ms on the tip vs 1.45 / 1.39 / 2.65 ms on base;
  - 5000 lines, 198 changes per side: 9.53 vs 3.53 ms.

  All of it is inside `vault.process`; acceptable.
- **Pre-existing, unchanged by R, no twins** (Q3 / Q8 residuals; base-identical): card writes where the pinned block was deleted and another was edited or pasted to read like it (N5 / N6) through the `resolveWriteTarget` fallback. 105 + 393 card cells in the fuzz.
- **Vacuity:**
  - Red on base: the tip's 4 SC-612 test files on the c0995beb source give 22 failed / 856 passed of 878. The lineMap greedy tests fail as "not a function"; the rest are behavioural reds (T1/T2, T3, T4, T5b, T6, T6b, T13, the sweep, the drawn-pin strict test). Log: `sc612-r3-red-on-base.log`.
  - Mutants (`sc612-r3-mutants.log`), 13 run on the 4 files (878 tests):
    - killed: drop the greedy check; no twin gate; flip `at === line`; no exemption; greedy trims both ends; gave up dissents; twin gate on `pin.text` only; twin gate on `content` only; head greedy only; tail greedy only; tail-greedy index not un-reversed; greedy null ignored;
    - **survived: MH, no tail-first check for twins** (= r1 M2, accepted as equivalent; note that the tail-first check is the cause of M2 / M6 in HIGH-2).
- **SC-621** (`rebaseCardPin` / `mapLineStrict`): out of scope, not graded.

## 3. What the prototype is and is not
- `sc612-r3-prototype-oracle-rule.diff.txt` against 1a8f624c:
  - `pinnedTarget` keeps `strictPins`' tail-first check;
  - for `twin`, it calls `blockMapsAgree` = the unique-minimum placement check, with an O(n·m) DP LCS.
- **Measured on the prototype:**
  - SC-612 jest: 878/878 (the sweep's pinned totals unchanged: 2977 / 2326 / 468);
  - fuzz: 0 twinned ambiguous writes, 0 unambiguous new refusals;
  - T6b family identical to the tip;
  - named repro: H1, H1b, H1c refused; M1-M6 saved.
- **Not measured on the prototype:** full jest, lifecycle, e2e.
- **NOT production:** a twin note with small edits takes 1.1 s at 2000 lines. The production version must use a capped Myers distance (see HIGH-1).

## 4. Method (reproducible)
Scratch exports (`git archive`) of 1a8f624c (tip), c0995beb (base), base source + tip tests (red-on-base), a mutant copy, a prototype copy and a lifecycle probe copy, each with the worktree's node_modules symlinked. The dse worktree was only used for the gates.
- **Fuzz** (`sc612-r3-fuzz.test.ts.txt`, seeds 1-3, 20,000 notes each, 4 constructs: form, card at identity / ordinal / null section):
  - notes with 2-4 counters (70% value 5), separators blank / two blanks / none / prose, 20% callouts, 12% an unterminated trailing fence, 15% CRLF, 8% another language;
  - 0-3 ops from: delete any, delete the pinned one, paste an identical copy (60% of the pinned one), paste a different counter, edit a prose line, type prose, delete a blank line, bump a sibling, make a sibling a twin, move the pinned one, edit the pinned one.
  - Ground truth: block ids. Next round: a refused cell is reopened on the note as it is now.
  - Classifier: `sc612-r3-classify.py.txt` (bit-parallel LCS placement oracle = the sweep's). Per-seed tables: `sc612-r3-fuzz-class-{tip,proto}-s{1,2,3}.txt`. Totals: `sc612-r3-fuzz-summary.txt`.
- **Named repro:** `sc612-r3-repro.test.ts.txt` → `sc612-r3-repro-named.log` (base / tip / prototype).
- **Real Obsidian:** G-S108 in a scratch export patched by `sc612-r3-lc-h1-patch.py.txt` (fixture + C9, cells H1d, H1 x form / card x RV / LP) → `sc612-r3-obsidian-h1-probe-tip.log` (25 s).

## 5. Working tree
- dse `git status --porcelain`: empty, HEAD 1a8f624c (before and after).
- superproject `git status --porcelain`: ` M draw-steel-elements` (before and after; the expected unbumped pointer), HEAD 0097225a.
- Nothing committed. No PIDs killed. Nothing deleted outside my scratch folder.
