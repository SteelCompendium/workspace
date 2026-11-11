# SC-584 r7 fix report

**Executive summary**
- STATUS DONE. Rebased onto dse develop **f2889351** (SC-567; clean; first onto b4e7b4f4). dse HEAD `0c7eb1ed` (14 commits over f2889351), superproject `2e571b09` (CHANGELOG only).
- CRITICAL-1 fixed STRUCTURALLY, not by shape: in `takePin`, a FORM in an embed takes the host's own-write record whenever the card's section window is NOT exactly its own plain fenced block (`parseOpenFence(section.text, section.lineStart)` is not an un-prefixed fence). The r5 line comparison is gone.
- Sweep: 9 containers x block/heading embed x RV/LP = 36 jest cells (table below). The header-less quote and nested quote whose FIRST line is the upper fence wrote the UPPER counter on r5 (8 cells fail on r5); now all land in the lower. List items and footnotes refuse everywhere (the + itself is not written there). No cell writes the upper counter now.
- Real Obsidian (G-S77, 10 trials): callout, header-less quote (first line = upper fence), block and heading embed, RV and LP land in the lower counter; list item (block and heading embed) writes nothing, upper untouched. G-S77 fails (e)-(h) on the r5 bundle and (a)-(h) on the f2889351 base bundle.
- Gates on f2889351: tsc/lint clean; jest 7169 passed / 2 skipped; lifecycle 54/54 (part 5 passed on its second run: first run G-S59 failed with its own "environment" message, scroll 2579 ms > 2400 ms); e2e 256/263 ok, 0 failed, 7 known-bug, 163/163; styles.css `5e5ff488…` = clean f2889351 build, so shots/freeze/parity carry.
- Mutants: every mutant of existing code killed (1-38 tests); mF, mL, mN equivalent. MEDIUM-1 reworded in both CHANGELOGs and the proposal (block-embed claim dropped; the heading embed is what used to write the upper counter).

## Sweep: construct x embed x base / r5 / now (jest, `reading-mode-host-pin.test.ts` 'every container'; host source identical on f2889351)
Verdict = which counter Save wrote after + on the lower one, the form on the lower one. RV and LP hosts gave the same verdict in every row.

| construct | embed | base (b4e7b4f4) | r5 (796f5a87) | now |
|---|---|---|---|---|
| callout | block embed | refused | lower | lower |
| callout | heading embed | UPPER | lower | lower |
| header-less quote, first line is the upper fence | block embed | refused | UPPER | lower |
| header-less quote, first line is the upper fence | heading embed | UPPER | UPPER | lower |
| header-less quote, text first | block embed | refused | lower | lower |
| header-less quote, text first | heading embed | UPPER | lower | lower |
| nested callout | block embed | refused | lower | lower |
| nested callout | heading embed | UPPER | lower | lower |
| nested quote, first line is the upper fence | block embed | refused | UPPER | lower |
| nested quote, first line is the upper fence | heading embed | UPPER | UPPER | lower |
| list item, two fences | block embed | refused | refused | refused |
| list item, two fences | heading embed | refused | refused | refused |
| ordered list item, two fences | block embed | refused | refused | refused |
| ordered list item, two fences | heading embed | refused | refused | refused |
| quote inside a list item | block embed | refused | lower | lower |
| quote inside a list item | heading embed | UPPER | lower | lower |
| footnote, two fences | block embed | refused | refused | refused |
| footnote, two fences | heading embed | refused | refused | refused |

Real Obsidian (G-S77, Reading view and Live Preview unless noted): callout, block and heading embed: lower (base: block embed refused, heading embed UPPER); header-less quote whose first line is the upper fence, block and heading embed: lower (r5: UPPER; base: block refused, heading UPPER); list item, block and heading embed (RV): nothing written, upper untouched, 1 Notice (the + was refused). Constructs not run in Obsidian (jest only): header-less quote with text first, nested callout, nested quote, quote in a list item, ordered list, footnote. Probe from r5 (two identical counters, no + first): lower on base and head.

## Rulings
- **CRITICAL-1: FIXED** (structural guard, see above). The comment in `takePin` states the structural reason and the "record-first for every form was tried" cost. The intended test "embed redrawn after the +, 1000 lines changed" is a plain block, so it is unaffected and still lands; a form in a multi-block window with an old record refuses after hundreds of lines changed on both sides (a Notice, never a twin; stated in the CHANGELOGs and the proposal).
- **MEDIUM-1: FIXED.** Both CHANGELOGs now say: a card that is a block on its own is found by the embed's link or the block's text and, failing that, the + spot; a card that is a callout/quote/other container holding several blocks always by the + spot (the shown container is still the one from before the +); two counters that read the same save the lower one (a heading embed used to write the upper one; the block-embed claim is dropped); list items and footnotes unchanged (the + is not written there, a Notice says so, Save writes nothing); the old-record refusal after hundreds of changed lines. Proposal §1 describes the final guard and the sweep; CURRENT block rewritten.

## Commits (dse; the first eight are r1/r3/r5 rebased)
- `b375580e` fix: structural guard + sweep tests (36 cells)
- `a76469a6` test: G-S77 adds header-less quote and list item trials (a)-(j)
- `0c7eb1ed` docs: dse CHANGELOG
Superproject `2e571b09` CHANGELOG. No pointer bump. `git status --porcelain`: dse empty; superproject ` M draw-steel-elements` (pointer only).

## Gate lines (f2889351)
- tsc `TSC_RC=0`; lint `LINT_RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7169 passed, 7171 total` (fresh worktree, no SC-568 timeout).
- lifecycle: p1 `21/21 ok` 200 s · p2 `16/16 ok` 367 s · p3 `9/9 ok` 444 s · p4 `4/4 ok` 303 s · p5 `4/4 ok` 264 s (G-S77 alone 61 s) = 54/54. Part 5 run 1: 3/4, G-S59 failed with its own environment message (the scroll took 2579 ms, past 2400 ms; loadavg 4-7); log `sc584-r7-gate-lifecycle-p5-run1-G-S59-env.log`; run 2 4/4.
- e2e: `OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (368 s).
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = clean f2889351 build; shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24 carry, not re-run.

## Red
- jest, current tests on the r5 host source: 8 failed / 145 (header-less quote and nested quote with a first-line fence x block/heading x RV/LP); on the f2889351 source: 38 failed / 145 (`sc584-r7-red-on-r5-jest.log`, `sc584-r7-red-on-base-jest.log`).
- G-S77 on the r5 bundle: fails (e) (f) (g) (h), upper counter written, no Notice; on the f2889351 base bundle: fails (a)-(h) (`sc584-r7-red-on-r5-lifecycle-G-S77.log`, `sc584-r7-red-on-base-lifecycle-G-S77.log`).

## Mutants (`sc584-r7-mutants.log`, `sc584-r7-mutate.py.txt`; run on b4e7b4f4, host source byte-identical on f2889351)
Killed: mS (guard dropped; 29), mS5 (the r5 guard restored; 8), mS2 (record-first for every form; 1), mS6 (only a prefixed first line counts; 21), mT (unload; 1), mK (remount; 1), mC (4), mM (1), mG (2), mG2 (1), mO (2), mQ (38), mR (1), m-card (1), m-sibling (1). Equivalent: mF, mL, mN (as in r5).

## Drive-by fixes:
None.

## Follow-ups:
1. List items and footnotes: the + itself is not written there (existing behaviour); if that is ever lifted, the sweep rows for them must flip to "lower" (the structural guard already covers them).
2. G-S59 "(c) scroll to the second tracker" hit its own environment limit once at loadavg 4-7 (2579 ms vs 2400 ms); not related to this ticket.
3. Constructs run only in jest (see above) have no real-Obsidian cell.

## Evidence artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/)
sc584-r7-fix-report.md, sc584-dse-verify-proposal.md (r7), sc584-r7-sweep-table.txt, sc584-r7-gate-{tsc,lint,jest,e2e,styles-sha}.log, sc584-r7-gate-lifecycle-p1..p5.log, sc584-r7-gate-lifecycle-p5-run1-G-S59-env.log, sc584-r7-red-on-r5-jest.log, sc584-r7-red-on-base-jest.log, sc584-r7-red-on-r5-lifecycle-G-S77.log, sc584-r7-red-on-base-lifecycle-G-S77.log, sc584-r7-mutants.log, sc584-r7-mutate.py.txt.
