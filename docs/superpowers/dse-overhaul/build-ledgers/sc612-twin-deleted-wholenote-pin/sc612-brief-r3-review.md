# SC-612 r3 — independent adversarial review

## Context loading (read first)
1. Ledger (rulings, verbatim; binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/decisions.md
2. Common brief (gates, expected numbers, footguns, return contract; binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-brief-common-gates-footguns.md
3. The r2 implementation brief (what was asked): sc612-brief-r2-impl.md, and the r2 report: sc612-r2-impl-report.md (same dir). The r1 design report sc612-r1-design-report.md §B2, §C, §D for the rule's intent. Read the code itself, not only the reports.

Worktree: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin; dse branch sc612-twin-deleted-wholenote-pin at 1a8f624c on base c0995beb. Review the diff `git -C <dse> diff c0995beb..1a8f624c` and the superproject's CHANGELOG commit 0097225a (on workspace origin/main a1d359f3). Do NOT commit to the branch; probes go in scratch exports or are restored by literal path (`git status --porcelain` empty at the end). Workers never call the tracker.

## The task
Ticket Expected (verbatim): "Save writes nothing and shows the "changed on disk first" Notice. It must never go into a different block."
Standing ruling (Scott, 2026-11-10): "Save nothing with a notice is fine."

Execute and probe, do not just read. Hunt for:
- Any shape where a form Save or card + / - in a note in its own pane (Reading view, Live Preview) writes a DIFFERENT block than the one pinned — on the branch, including shapes r1's sweep did not generate (three or more twins, twins in callouts / quotes, CRLF notes (SC-619 is a separate hover issue, not yours), an unterminated trailing fence, twins with different languages, sibling writes of other DSE blocks inside the round, two forms open at once).
- Any NEW refusal outside the ruled cost class: refusal with no outside edit, a refusal that persists past the round / form reopen, a refusal in a note without identical counters. Any of these is HIGH.
- Integrity probes (writes into user files): content above / below the written region survives; two same-kind blocks do not cross-talk; hand-edited content survives a re-trigger; a user-deleted block regenerates cleanly.
- Vacuous tests: run the new jest tests and G-S108 against the base source / a base bundle and confirm the claimed reds; mutate the rule (drop the greedy check, drop the twin gate, flip a comparison) and confirm tests die.
- Cost: the twin gate keeps non-twin notes byte-identical in behaviour; time inside `vault.process` on a large note.
- r2's T6b (a twin added among interchangeable twins with prose between: refused). Confirm with the oracle that this is a genuine tie in every such shape; a refusal where the block is unambiguous is a finding.
- Docs: CHANGELOG bullet accurate and plain; doc comments; the dse-verify proposal file matches the code.
Re-run: jest full, lifecycle part 7 (G-S108) and part 6, e2e. Other parts only if your probes suggest it.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-r3-review-report.md (<=10-line executive summary first; verdict LAND / FIX). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Logs `sc612-r3-*` in that dir.

## Return contract
Final text: verdict, finding list (severity, file:line, one line each), measured gate numbers, `git status --porcelain` at end, absolute path of every artifact. Raw facts, no prose. SC-621 (`rebaseCardPin` / `mapLineStrict` residual for part-of-note pins) is out of scope: note but do not grade it.
