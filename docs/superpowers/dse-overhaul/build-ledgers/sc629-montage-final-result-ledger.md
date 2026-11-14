# SC-629 decisions ledger — montage: rounds ran out with nothing logged

Owner: ticket-owner (Opus 5.5). Worktree `/home/scott/code/steelCompendium/worktrees/sc629-montage-final-result`
(branch `sc629-montage-final-result` in every submodule), cut from dse `develop` `10c271fe`, superproject
workspace main `20004425`.

## Ticket (as filed by SC-438, 2026-11-14)

"A montage with `rounds: 2`, `current_round: 3` and no logged actions (the Director pressed End round twice)
shows, in its result band: the heading "Final result", the verdict word "Not started", the rule line "Total
Failure — no Victories awarded." and "2 rounds used". The verdict and the rule line contradict each other.

Expected: one verdict. Which one is a rules call (a montage that ran out of time with no successes is a failure
in the book, so probably "Total Failure"), so the fixer should check the rules text."

Agent notes: the word comes from `model.ts` `montageOutcome` (`pending` at 0 successes / 0 failures); the rule
line from `src/elements/montage/OutcomeBandView.ts` `buildRule`'s complete branch; `buildTop` picks the heading.
SC-438 left e2e marker `knownBug('SC-629', '[MONT-W03] …')` in `e2e/specs/montage/wrong-values.e2e.ts:118`.

## Rules text (owner, 2026-11-14) — settles the "rules call"; no Scott ruling needed

`steel-etl/input/heroes/Draw Steel Heroes.md`:

- :21309 "If the heroes don't end the montage test by achieving the success limit or failure limit, the montage
  test ends when the second montage test round is over."
- :21335 "If the heroes hit the failure limit or time runs out, and if they've achieved at least two more
  successes than failures, they achieve a partial success."
- :21336 "If the heroes hit the failure limit or time runs out, and if they don't have at least two more
  successes than failures, they suffer total failure."

So a montage that ran out of rounds at 0 successes / 0 failures is **Total Failure**. "Not started" is correct
only while the montage is still live (not complete).

## Owner decisions

- 2026-11-14 D1: fix in the model — `pending` only while the montage is NOT complete; a complete montage at 0/0
  is `failure` (verdict word "Total Failure", heading "Final result", skull crest, matching the rule line). The
  SC-629 e2e marker MONT-W03 becomes a plain test. User-facing: one CHANGELOG bullet under `## Unreleased`.
- Lifecycle id G-S135 reserved if a scenario is needed (not expected).

## Scott's rulings

(none — none needed)

## Out of scope (other tickets)

SC-631, SC-650 (other montage bugs), SC-655 (wrong-type logged action deleted on save), SC-630 / SC-632 (montage
design questions for Scott). Do not touch.

## Round log

- 2026-11-14 r1 (implementer): dse `b68d6a0a`, superproject `17c6930e` (CHANGELOG `9ac501c5` + pointer bump).
  jest 13315/2, lifecycle 64/64, e2e 586/604 ok 0 failed 18 known-bug 416/416, shots 592, freeze 280/280,
  parity 0/0/24. Report `sc629-r1-implementer-report.md`.
- r1 follow-up rulings (owner):
  - F1 dse-verify still lists 585/604 and SC-629 as known bug → drop: the dispatcher updates CURRENT at landing;
    named in the land-ready report.
  - F2 head crest stays an hourglass for every complete non-total montage → drop: unchanged, pre-existing, the
    same for every complete failure. It is not a contradicting verdict, which is what this ticket is about.
  - F3 a hand-typed `rounds: 0` now reads Total Failure at 0/0 → drop: correct by the book (time ran out
    before any success).
- r2 (reviewer, independent of r1's author): dispatched on `b68d6a0a`.
- 2026-11-14 dispatcher: SC-642 landed. New base: dse develop `09c879f2`, workspace main `b5cddd45`. Numbers at
  `09c879f2`: jest 13317 passed / 2 skipped fresh (13318 / 1 with shots cache) · lifecycle 64/64 · e2e
  `591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak
  40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. Expected after SC-629 on top: jest 13325 / 2,
  e2e `592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`. Plan: let r2 finish on `b68d6a0a`, then a
  rebase round (r1 implementer resumed, with any r2 fixes), then a scoped re-review of the delta.
- 2026-11-14 r2 (reviewer) on `b68d6a0a`: LAND. HIGH 0, MEDIUM 0, LOW 2, INFO 5. jest 13316/1 (with the shots
  cache), e2e 586/604 ok 0 failed 18 known-bug 416/416, shots 592, freeze 280/280, parity 0/0/24. Mutant: 5 of 8
  new jest tests go red, and MONT-W03 too. Report `sc629-r2-reviewer-report.md`.
- r2 rulings (owner):
  - LOW-1 (model.ts:448 doc comment "(or whose limits were hit)" — unreachable at 0/0) → fold into r3: drop
    the parenthetical.
  - LOW-2 (montage.test.ts:728-738 Reopen test passes with the fix reverted) → fold into r3: assert
    `data-band` is `failure` before the click.
  - INFO-1 (CHANGELOG "2 rounds used") → drop: accurate.
  - INFO-2 + INFO-3 (hand-typed `current_round: 99` Reopen does nothing visible; "-1 / 2.5 rounds used";
    "Round 0 / 0") → filed **SC-658** (Backlog, Low, related to SC-629). Out of scope for r3.
  - INFO-4 = F2, INFO-5 = F1 → already ruled.
  - The reviewer's scratch worktrees `…/scratchpad/sc629-r2-rev/mut` and `/probe` are registered in the dse repo,
    detached at `b68d6a0a`, so they hold no branch. Left in place (no-rm rule); named in the land-ready report.
- r3 (r1 implementer resumed): LOW-1 + LOW-2, rebase onto dse `09c879f2` + workspace main `b5cddd45`, full battery.
- 2026-11-14 dispatcher: workspace main moved to `7219b96d` (docs-only); dse develop still `09c879f2`. Relayed to r3: the superproject goes onto `7219b96d`.
- 2026-11-14 r3 (implementer): dse `3e88b3f5` (`74e2a649` fix rebased + `3e88b3f5` nits) on `09c879f2`;
  superproject `fe42d4f8` (CHANGELOG `ff5ad298` + one bump) on `7219b96d`. jest 13326/1 with the shots cache (fresh
  13325/2), lifecycle 64/64, e2e 592/608 ok 0 failed 16 known-bug 416/416, shots 592 / 163/978 / 40/240 / 147,
  freeze 280/280, parity 0/0/24.
- r4 (r2 reviewer resumed, scoped delta re-review): dispatched.
- 2026-11-14 r4 (reviewer, scoped): LAND, 0/0/0. range-diff `b68d6a0a = 74e2a649`; LOW-2 mutant now red at
  montage.test.ts:731; superproject 2 commits on `7219b96d`; r3 logs confirmed. Land-ready comment posted;
  land-ready reported to dispatcher.
- 2026-11-14 LANDED (dispatcher): dse develop `3e88b3f5`, workspace main `20b3a772` (bookkeeping `dc16b57d`); ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc629-montage-final-result/. Owner set SC-629 Done via linear-post.py `--state Done`; verified with get_issue (status Done). Effort closed.
