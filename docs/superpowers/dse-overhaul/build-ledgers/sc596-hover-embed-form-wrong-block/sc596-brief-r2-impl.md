# SC-596 r2 — implementation (orchestration:implementer)

## Context loading (read first)
1. Ledger (rulings are BINDING, quoted there verbatim):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/decisions.md
   — read "Owner rulings on r1" in full.
2. Common gates/footguns (binding): …/sc596-hover-embed-form-wrong-block/sc596-brief-common-gates-footguns.md
3. The r1 design report (your spec): …/sc596-hover-embed-form-wrong-block/sc596-r1-design-report.md — §C (rule items 1-3), the
   probe diff sc596-r1-probe-rule.diff.txt (a starting point, written against da2bdbc6), the jest probe sc596-r1-probe.test.ts.txt
   (cells P4 x5, P13 x2, N1, N3, N3b, N4, W1, X1, X2, Y1-Y6, V1-V10, r5a/r5b, and the 2880-cell sweep generator), the "Full jest
   under the probe" list of 16 flipped tests and how each is re-modelled, the test plan, and the real-Obsidian probe scenario
   sc596-r1-probe-lifecycle-scenario.mjs.txt + sc596-r1-make-scratch.py.txt (G-S96's starting point).
4. dse-verify SKILL (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md; ~320 KB, read in parts):
   "Block edit form Save and embeds (SC-556)" (~line 336) incl. the SC-584 and "Hover card writes (SC-594)" bullets, "Hover preview
   modals (SC-595)" (~line 405), the lifecycle authoring sections, and the CURRENT block (~line 1407).
Workers never call the tracker.

## Setup
Worktree /home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block, dse branch sc596-hover-embed-form-wrong-block
(at da2bdbc6, no commits yet). FIRST: `git -C <dse> fetch origin` and rebase the branch onto origin/develop — expected 5f7c5336 (SC-603
landed: initiative tracker focus; does not touch the host write path) or later; report the sha. `npm ci` if the obsidian version moved.

## Task
Implement the adopted rule (ledger "Owner rulings on r1", quoted):
- "a form's pin in an embed / hover preview of PART of a note is placed exactly like a card's (`rebaseCardPin`: the link checked by
  `cardLinkLine`, else this host's own last write when it is of the known body, else refused); never `verifiedPinLine` /
  `searchedPinLine`. A form there that cannot be pinned gets a REFUSING pin (nothing written, forced Notice), never a null pin; list
  items / footnotes keep their "inside lists" wording. Cards and non-embedded hosts unchanged. Delete `rebasePin`, `verifiedPinLine`,
  `embedStartLine`, `searchedPinLine` once callerless."
- Q2 CONDITION: "the implementer lists every shape whose close-on-redraw behaviour changes (incl. list items / footnotes)" — put that
  list in your report, with the evidence (test or measurement) for each.
- Q4 FOLD-IF-SAME: "r2 measures it in jest first (stale non-plain window, no own-write record, card + / -, block/heading embed and
  hover, RV/LP). If any cell writes the twin, apply the same refusing pin to card writes there, with tests; if none does, report the
  numbers and leave the code alone." Do this measurement BEFORE you touch card code; report the cell table either way.
- Tests (jest, in the host pin suite or a new sibling file): the sweep as a `test.each` asserting the rule's result per cell (never
  TWIN; outcome AND Notice kind); P4 x5, P13 x2, N1, N3, N3b, N4, W1 (assert exactly `['Twin','Edited']`), X1, X2, Y1-Y6; re-model the
  16 flipped tests per the r1 list (V1-V10 for the 7 model flips; rewrite the 3 not-produced shapes and the 6 by-design refusals so
  they assert the refusal and Notice, with the reason in the test comment); r5a/r5b controls. Rewrite comments that say "the text
  search places the pin". Show red on the pre-fix code: run the new tests against the rebased base before the fix commit and save
  the log (sc596-r2-jest-red-on-base.log).
- Lifecycle G-S96 (part 6 with G-S92: `G-S92 G-S96`): the second-pane cells from r1 (block embed RV, heading embed RV with two
  `## Tracker`… use the shapes that wrote the twin on base: block embed RV, heading embed RV, block hover RV, heading hover RV and LP;
  add block embed / block hover LP if cheap). Each cell: the pencil pressed between the outside write landing and the redraw, the form
  kept open by the second pane, Save. Green = nothing written, exactly one Notice, the form still open, the outside edit kept. RED ON
  BASE required: run G-S96 against the rebased base bundle and save the log (sc596-r2-lifecycle-gs96-on-base.log) showing the twin
  writes. Fixtures follow the tracker section with another heading (r1: a last-section part carries trailing text). Keep part 6 well
  under 420 s; report its wall time. Test titles: never a bracketed ticket id.
- Docs in YOUR worktree only: a CHANGELOG.md bullet under `## Unreleased` in
  /home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block/CHANGELOG.md (user-facing, plain words: an edit
  form opened from an embed or hover preview no longer saves into an identical counter elsewhere in the note; one rare shape now
  refuses with a Notice). A dse-verify proposal file (NOT the SKILL itself):
  …/sc596-hover-embed-form-wrong-block/sc596-dse-verify-proposal.md — replacement text for the "Embeds of part of a note" bullet,
  the SC-584 "Still refused" / SC-596 references, the "Hover card writes (SC-594)" bullet (forms now share it), the lifecycle part
  list (part 6 `G-S92 G-S96`, 59 scenarios) and a CURRENT block draft with your measured numbers.
- Mutation-check your guards (at least the r1 set m1-m16 re-targeted at your code; report killed / survived and why).
- Commit after every coherent step (tests-red, fix, re-modelled tests, G-S96, docs). No pushes.

## Gates
Full battery per the common file, on the rebased branch: tsc + lint clean; jest 7685 passed / 2 skipped + your delta; lifecycle 59/59
in six parts (part 6 `G-S92 G-S96`); e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; styles.css sha256 equal to a
clean 5f7c5336 (or rebased-base) build, else STOP NEEDS_CONTEXT.

## Report
…/sc596-hover-embed-form-wrong-block/sc596-r2-impl-report.md (<=10-line executive summary first: branch sha + base sha; jest numbers;
lifecycle per part + wall; e2e line; styles sha verdict; Q4 verdict; Q2 shape list summary; mutants). Gate logs `sc596-r2-gate-*.log`.
Final text: raw facts + every artifact path + `Drive-by fixes:` / `Follow-ups:`.
