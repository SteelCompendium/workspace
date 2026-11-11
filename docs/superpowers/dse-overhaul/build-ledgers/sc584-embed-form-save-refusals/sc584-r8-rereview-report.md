# SC-584 r8 scoped re-review (reviewer-r2), dse f2889351..0c7eb1ed (r7 = b375580e, a76469a6, 0c7eb1ed), superproject 2e571b09

**Executive summary**
- Verdict: **SHIP**. Counts: CRITICAL 0, HIGH 0, MEDIUM 0, LOW 0, INFO 3.
- r6 CRITICAL-1 is closed. The header-less quote whose first line is the upper fence (block embed and heading embed, RV and LP) writes the LOWER counter in real Obsidian (4/4 cells) and in jest (R1, R1h, heading-hover S2).
- The guard is structural: a form takes the record unless the section's first line is an un-prefixed fence. No window shape I tried writes a twin:
  - the r7 sweep, plus my cells: callout inside a list item (S1), nested callout (R3), whole-note hover (R2);
  - the r4 shapes Q9 and Q9h;
  - the record attacks Q1-Q10, which give the same results as in r4/r6.
- The plain-window path is unchanged: plain `^id` with an identical block above after the + still lands in the + block (S3), and the "1000 lines changed" test is green in the gate.
- G-S77 is real: the HEAD harness against my 796f5a87 bundle FAILs (e)-(h), the header-less quote trials, and passes (a)-(d).
- List-item counter: the + is refused with the explicit list Notice in the note itself (LP) and in a heading embed (RV and LP). Nothing is written. This is the designed refusal, not silent.
- Gates on HEAD: tsc/lint clean · jest 7169 passed / 2 skipped · p3 9/9 (503 s) · p5 4/4 (270 s) · e2e 256/263 ok, 0 failed, 7 known-bug, 163/163 · styles.css 5e5ff488 = my clean f2889351 build · range-diff r1-r5: 11/11 `=`.

## Checks
- Range-diff `b4e7b4f4..796f5a87` vs `f2889351..17403e20`: 11/11 `=`. The r7 source delta is `takePin`'s guard only (`ReadingModeBlockHost.ts`, the `forForm && embedded` block above `const pin = …`). `MinionStaminaPoolModal.ts` and the pool tests come from the base (SC-567).
- Jest probes on HEAD (`sc584-r8-probe-jest-head.log`, source `sc584-r8-probe.test.ts.txt`): 18/18.
  - Q1-Q10: as in r4.
  - Q9, Q9h, R1, R1h, R2, R3: lower counter.
  - S1 (heading embed, callout inside a list item, two counters): lower.
  - S2 (heading hover of the header-less quote): lower.
  - S3 (plain `^id`, twin above after the +): lands in the + block.
- Real Obsidian, r8 HEAD bundle 68d7970b (`sc584-r8-probe-obsidian-r8head-quote-listitem.log`):
  - R1 RV and LP, R1h RV and LP: "wrote the lower (+) counter", no Notice.
  - List item, the note itself, LP: + not written. Notice "a change to a block in r8-li was not saved — the plugin can't tell where this block sits in the note (blocks inside lists can't be edited yet)."
  - List item, heading embed, RV and LP: the same Notice, nothing written.
  - (The note-itself RV cell errored in my harness, "no visible element to click"; not re-run.)
- G-S77 red: `sc584-r8-red-G-S77-on-796f5a87.log`. `done: 0/1 ok, 1 failed`; FAIL (e)(f)(g)(h) "names [\"Edited\",\"Twin\"] (the LOWER counter must be the edited one)"; (a)-(d) pass.
- MEDIUM-1 (CHANGELOGs and proposal), now accurate:
  - Both CHANGELOGs describe the two paths (a block on its own: link → text → + spot; a container: always the + spot).
  - "a heading embed used to write the upper one": true. The block embed was refused on develop, as the owner noted, and is not claimed otherwise.
  - "list item or footnote: the + is not written (a Notice says so)": matches my cells.
  - Proposal §1 describes the structural guard.

## INFO
- INFO-1: a form in a multi-block window with an OLD record and a current part can refuse after hundreds of lines changed (accepted cost, documented).
- INFO-2: list-item and footnote counters stay unwritable (SC-455 Notice), on base and HEAD. Owner to file or drop.
- INFO-3: I did not test a fence inside a table cell or an HTML block. Obsidian does not render fenced code there as a DSE block.

## Gates (HEAD 0c7eb1ed)
- tsc `GATE=tsc RC=0`; lint `GATE=lint RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7169 passed, 7171 total`.
- lifecycle part 3: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`, 503 s (loadavg 13-21).
- lifecycle part 5: `OBSIDIAN-LIFECYCLE done: 4/4 ok, 0 failed` (G-S59, G-S49, G-S73, G-S77), 270 s.
- e2e: `OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (321 s).
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`: HEAD = `git archive f2889351` build.

## Working tree
`git status --porcelain` of the dse worktree: empty.
