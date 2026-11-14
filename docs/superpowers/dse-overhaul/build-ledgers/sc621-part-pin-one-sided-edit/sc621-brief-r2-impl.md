# SC-621 r2 — implementation (orchestration:implementer, implementer B)

## 1. Context loading (read first)
1. Binding gates + footguns (baseline 14521bf0 numbers): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-brief-common-gates-footguns.md
2. Ledger (rulings — "owner rulings on r1" is your spec): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/decisions.md
3. r1 design report (read the executive summary, §C prototype, §D G-S115, §F residuals): sc621-r1-design-report.md in the same dir,
   and the artifacts it names: `sc621-r1-proto-ruleP-rebase.diff.txt`, `sc621-r1-gs115-proposal.mjs.txt`, `sc621-r1-part-sweep.test.ts.txt`,
   `sc621-r1-M2-sweep-vs-proto.txt`, `sc621-r1-persist-proto.log`.
4. Worktree /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit; dse branch `sc621-part-pin-one-sided-edit` is at
   `4ba95740` = one commit of r1 failing tests (`test/dom/framework/reading-mode-host-part-pin-twin.test.ts`, 27 tests, 18 red by design)
   on df92a3f6. Workers never call the tracker.

## 2. Task
Standing ruling (Scott, 2026-11-10, verbatim): "Save nothing with a notice is fine."
Ticket Expected (verbatim): "nothing is written, and the "changed on disk first" Notice shows. It must never go into a different counter."

1. **Rebase** the dse branch onto origin/develop `14521bf0` (`git -C <dse> fetch origin`; SC-586 landed: Conditions window only, no host/pin
   code — expect no conflict). Run the r1 test file at 14521bf0 + r1 commit only: confirm the same 18 red / 9 green (log it).
2. **Fix**: apply r1's prototype exactly as ruled ("ADOPT r1's prototype as is": in `rebaseCardPin`, after `mapLineStrict` agrees with
   `linkLine`, a block twinned in the drawn note or now is placed only when `placedUniquely(whole, {text: from.text, lineStart: from.line}, at.line)`
   holds; tail-first check kept; no lineMap change). Extend the comment at that spot with the two accepted properties, plain words:
   (a) the refusal repeats in a preview/embed that is not redrawn until it is reopened (as SC-607 F1/F3); (b) residuals R1 (text-identical
   move among identical blocks) and R2 (drawn-from section deleted + a neighbour renamed to its name; base writes the same). Commit.
   r1 test file must then be 27/27 green.
3. **Tests (fold)**:
   - The M2-killing named test: an identical counter pasted above a unique one + TOP edited, in a preview (see `sc621-r1-M2-sweep-vs-proto.txt`
     for the cells); it must fail with the mutant "twin gate on the drawn note only" (`sc621-r1-mutant-M2-twin-drawn-only.diff.txt`) — prove it.
   - A persistence pin: refused, nothing written, one Notice; refused again on a second click of the same un-redrawn card; a reopened/redrawn
     preview saves (r1 measured this; `sc621-r1-persist-proto.log`).
   - Port r1's part sweep (`sc621-r1-part-sweep.test.ts.txt`) as a permanent suite (e.g. `reading-mode-host-part-pin-sweep.test.ts`) with
     oracle assertions: 0 writes in oracle-ambiguous twinned cells, 0 refusals in oracle-unambiguous cells whose drawn-from block is neither
     gone nor edited, 0 writes into a counter other than the drawn-from one outside the documented residual classes R1/R2 (pin
     the R1/R2 cell count); pin the totals. Plus a seeded fuzz (fewer seeds is fine). Budget ~20 s jest wall for the two together; if over, cut cells/seeds and say so with
     numbers. Model on SC-612's `reading-mode-host-whole-pin-sweep.test.ts` / `-fuzz.test.ts`.
   - Red-on-base: run the new tests against 14521bf0's source (stash-free: a scratch `git worktree add` of 14521bf0 with your test files
     copied in, or revert the fix commit in a scratch branch) and log which are red.
   - No bracketed ticket id in any title.
4. **Lifecycle G-S115** from `sc621-r1-gs115-proposal.mjs.txt` (9 cells, one note each): in `visual-harness/obsidian-lifecycle.mjs`, after
   G-S112, before G-S56 in SCENARIOS order (G-S56 stays last). Lifecycle becomes 64/64; part 7 = `G-S108,G-S112,G-S115`. Prove (a)-(f)
   red and (g)-(i) green on a 14521bf0 bundle (scratch export), all green on yours. Commit.
5. **CHANGELOG**: one bullet under `## Unreleased` in YOUR worktree's superproject
   (/home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit/CHANGELOG.md). Plain words, user-visible: in a hover preview or
   embed of part of a note with two identical counters, an outside change that removes the counter it shows and also edits a nearby line no
   longer saves into the other counter; it is refused with the "changed on disk first" Notice, and the preview keeps refusing until it is
   reopened. Rebase the superproject branch onto current workspace `origin/main` (`git -C <worktree> fetch origin`). One commit. NO pointer
   commits — the owner arranges the single pointer bump.
6. **Skill proposal** file `sc621-skill-proposal.md` in the ledger dir (do not edit SKILL.md): lifecycle 64/64, part 7 `G-S108,G-S112,G-S115`
   with measured wall time, the G-S115 scenario summary, the rule ("rule P at the rebase for twinned part pins"), residuals R1/R2 and the
   repeat-until-reopen property, and a CURRENT block draft with your measured numbers.
7. **Full battery** per the common brief on your final head. Expected: tsc/lint clean; jest 11833 + your new tests passed / 2 skipped
   (fresh, no shots cache; report the delta per file); lifecycle 64/64 in seven parts (part 7 = 3 scenarios, report wall time; if part 7
   goes over ~300 s, say so); e2e `334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; styles.css byte-identical to a clean 14521bf0
   build -> shots/freeze/parity carry (592 / 163/978 / 40/240 / clip 147, freeze 280/280, parity 0/0/24).

Commit after every coherent step (rebase result, fix, tests, sweep/fuzz, G-S115, CHANGELOG). No pushes, no tags, no attribution lines.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-r2-impl-report.md (<=10-line executive
summary first: dse head sha + commit list, superproject sha + base, every gate number, red-on-base counts, sweep/fuzz totals and wall time).
Logs as `sc621-r2-gate-*.log` etc. in the same dir.

## 4. Return contract
Per the common brief: raw facts, shas, numbers, absolute paths of every artifact; `Drive-by fixes:` and `Follow-ups:` sections.
If you need input, end with STATUS: NEEDS_CONTEXT and the question.
