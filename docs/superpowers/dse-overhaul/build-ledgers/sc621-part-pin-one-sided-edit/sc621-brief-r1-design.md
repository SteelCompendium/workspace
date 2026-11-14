# SC-621 r1 — diagnosis, measurement and fix design (orchestration:reviewer)

You are reviewer A for SC-621. You measure, diagnose and design; you do not land the fix.

## 1. Context loading (read first, in this order)
1. Binding gates + footguns: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-brief-common-gates-footguns.md
2. The SC-621 ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/decisions.md (ticket statement verbatim, rulings, scope).
3. Prior art (landed; read ledgers, dip into reports only where needed):
   - SC-612 (rule P for whole-note pins, `editDistance`, sweep + fuzz suites, the oracle):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc612-twin-deleted-wholenote-pin/decisions.md
     and its r1 design report §B-§E (sc612-r1-design-report.md, same dir; §E Q5 is where SC-621 was filed), the r3 review report's
     rule-P prescription (sc612-r3-review-report.md) and r3 fuzz/oracle (sc612-r3-fuzz.test.ts.txt, sc612-r3-classify.py.txt).
   - SC-607 (drawn-from rule, `mapLineStrict`, `rebaseCardPin`, the drawn-pin sweep):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc607-open-preview-stale-card-write-ledger.md (+ dir).
   - SC-619 (CRLF heading hover in `cardLinkLine`, just landed):
     /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc619-crlf-hover-refusal/decisions.md
4. Code at dse df92a3f6 (worktree above): `src/framework/host/lineMap.ts` (`mapLineStrict` ~58, `editDistance` ~75),
   `src/framework/host/ReadingModeBlockHost.ts` (`strictPins` ~416, pin creation ~930-950, `rebaseCardPin` ~988-1070,
   `cardLinkLine`, `pinnedTarget` ~1184 incl. SC-612's rule P), tests `test/dom/framework/reading-mode-host-drawn-pin.test.ts`,
   `reading-mode-host-whole-pin-sweep.test.ts`, `reading-mode-host-whole-pin-fuzz.test.ts`, `reading-mode-host-form-pin.test.ts`.
   Lifecycle G-S92 / G-S96 / G-S99 / G-S108 / G-S112 in `visual-harness/obsidian-lifecycle.mjs`.
Note: the ticket's agent notes name `mapLineGreedy` / `greedyDissents`; SC-612 r4 REMOVED those in favour of rule P. Work from the code.

## 2. Task
Ticket statement (verbatim from the ledger):
> A hover preview or an embed shows part of a note that has two identical counters, separated only by blank lines. One outside write (Sync, another app) deletes the counter the preview was drawn from and, in the same write, edits a line just above or below the pair. A + / - or a form Save in that preview may then be written into the other counter, with no Notice.
>
> Expected: nothing is written, and the "changed on disk first" Notice shows. It must never go into a different counter.

Standing ruling (Scott, 2026-11-10, verbatim): "Save nothing with a notice is fine."

A. **Measure the gap at df92a3f6** — it was never measured for previews.
   - jest: extend the SC-607 drawn-pin harness with SC-612's layouts (twin-blank, twin-blank+diff-below, twin-blank+diff-above,
     tight-diff-neighbour, triple+diff, and the ticket's shape: drawn-from twin deleted + a line just above / just below the pair edited
     in the same write; also the mirror: the OTHER twin deleted + nearby edit, which must still save into the drawn-from one).
     Cover the link kinds a part pin can come from (heading hover `[[Note#H]]`, block-id hover `[[Note#^id]]`, section embed `![[Note#H]]`)
     where the harness can model them; + / - (card) and form Save. Note whether the outside write lands before the preview's card is
     rebased or between rebase and write (two timings).
   - Real Obsidian: a scratch-export probe (as SC-612 r1 did; never edit the worktree's harness for the probe, or restore it by literal
     path after) of the ticket's shape in Reading view and Live Preview, hover preview and section embed, + and form Save. Report each cell:
     saved into drawn-from / refused with Notice / WROTE OTHER COUNTER.
   - If the shape does NOT write the wrong counter anywhere at df92a3f6 (e.g. SC-612's write-time rule P on `strictPins` already
     catches it), say so with the cells, find whether ANY one-sided-edit shape through `rebaseCardPin` writes another counter, and stop
     there with the evidence (no fix design needed).
B. **Root cause** with file:line at df92a3f6.
C. **Fix design.** Preferred direction: reuse SC-612's rule P (placement cost via `editDistance`, place only when the minimum is UNIQUE
   and equals the head map's answer) at the drawn -> now step in `rebaseCardPin` / `mapLineStrict` for twinned part pins, rather than a
   new heuristic. Prototype it (a diff file in the ledger dir; restore the source after each probe). Measure with an oracle (SC-612's
   definition) over the extended sweep and a seeded fuzz: base vs prototype counts of saved / refused / wrote-other; required: 0 writes in
   oracle-ambiguous cells, 0 new refusals in oracle-unambiguous cells (or list every one), 0 X->Y different-counter writes. Mutants of
   the prototype (which cells kill each). Full jest once on the prototype (expect 11817 passed / 2 skipped + 0 flips in existing tests).
   Lifecycle G-S92, G-S96, G-S99, G-S108, G-S112 on a prototype bundle (scratch export), each part its own call.
D. **Failing tests**: commit, on the worktree's dse branch, a test file (e.g. `test/dom/framework/reading-mode-host-part-pin-twin.test.ts`)
   whose ticket-shape tests are RED at df92a3f6 and green on your prototype, plus controls green on both. This one commit is
   intentionally red; say which tests. No source change committed. No bracketed ticket id in any title.
E. **G-S115 proposal**: the lifecycle cells (one note each; red on base for the ticket shapes, controls green), part 7 placement,
   estimated time. A text/patch template in the ledger dir is enough; do not add it to the harness.
F. **Questions for the owner**: every refusal the prototype adds, classified: inside the ruled class ("an identical counter added/removed
   next to the drawn-from one by an outside edit inside the round, in a twin note, not persistent") or OUTSIDE it (flag loudly). Residuals
   (what base and prototype both still write wrongly, if anything), each with a cell.

Bound your work: targeted jest suites while iterating; full jest once; lifecycle only the five scenarios above; no shots/freeze/parity/e2e.

## 3. Gates for this round
r1 stays on df92a3f6 (jest 11817 / 2 skipped there) even though the common brief now names 14521bf0 (SC-586 landed, no host/pin code); do NOT rebase in r1 — r2 does.
Not the full battery (design round). Expected numbers in the common brief; report what you ran.

## 4. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-r1-design-report.md
(<=10-line executive summary first: gap measured yes/no + cell counts, root cause one line, proposed rule one line, sweep/fuzz numbers,
new-refusal classification, failing-test commit sha.) Supporting artifacts (diffs, sweep tables, logs, probe scripts as `.txt`) in the
same dir, all prefixed `sc621-r1-`.

## 5. Return contract
Per the common brief. Also state the dse HEAD sha and `git status --porcelain` at the end (only your test commit on top of df92a3f6,
working tree clean).
