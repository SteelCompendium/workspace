# SC-629 r2 reviewer report

## Executive summary
- Verdict: **LAND**. Reviewed dse `10c271fe..b68d6a0a` and superproject `20004425..17c6930e`.
- Findings: HIGH 0, MEDIUM 0, LOW 2 (a doc comment, one jsdom test that does not check the starting state), INFO 5 (all from before this change, or already ruled on).
- Measured: tsc clean (incl. `tsc -p e2e`), lint rc 0. jest **13316 passed / 1 skipped / 13317 total**, rc 0. The total equals r1's 13315/2: `obsidian-app.css` is cached, so the `printTwinDeltaAllowedSet` test runs instead of skipping.
- e2e `OBSIDIAN-E2E done: 586/604 ok, 0 failed, 18 known-bug, coverage: 416/416 pairs`, rc 0. MONT-W03 passed.
- shots 592 (host-leak 163/978, modal host-leak 40/240, capture clip 147). freeze 280/280. parity 0 gaps / 0 undeclared / 24 declared.
- Mutant (model line reverted): 5 of the 8 new jest tests fail. The other 3 are guards of cases the mutant does not change. MONT-W03 fails with `Expected: "Total Failure" / Received: "Not started"`. The tests are not vacuous.
- Probes: 14/14 jsdom scenarios on the real pipeline. Every reader agrees on a complete-0/0 board. The live 0/0 board is unchanged.
- Lifecycle: not run. No lifecycle scenario draws a complete-0/0 montage, and none asserts the verdict word or `data-band` (details below). r1 measured 64/64 at the same sha.
- Superproject: exactly 2 commits on top of `20004425`: CHANGELOG `9ac501c5`, then pointer `17c6930e` → `b68d6a0a` (the dse head, a fast-forward from `10c271fe`). No interim pointer commits and no AI trailers.

## Readers of montageOutcome / BAND_WORD / BAND_ICON / data-band on a complete-0/0 board (probe P12: End round on the last round, nothing logged)
- OutcomeBandView: `data-band="failure"`, eyebrow "Final result", word "Total Failure", crest `skull`, rule "Total Failure — no Victories awarded.", "2 rounds used".
- montageBandCopy (BAND_WORD): word "Total Failure". Tails "3 short of the success limit" / "2 under the failure limit", or "no … limit set" when the limits are unset. These are the same tensed complete-state tails as any other complete failure.
- HeadView.bandCrestIcon: `hourglass`, right eyebrow "Complete". This is the same as every complete failure or partial. Owner ruling F2 (dropped).
- CSS: `[data-band='failure']` → `--dse-danger` is the only rule that applies. `[data-band='pending']` is now reached only by a live 0/0 board. No other CSS rule is keyed on the montage band. The encounter's `data-band` is a different attribute family.
- No other montage reader exists: StripView, GuideView, definition, the sidebar host (it renders the same view) and the chrome panel never call montageOutcome. Nothing still says "Not started", shows the hourglass in the band, or uses the pending style for a complete-0/0 board.
- Live 0/0 is unchanged (P9a: round 2 of 2 with limits set; P9b: default block): `pending`, "This montage" / "Not started", hourglass.

## Edge-case probes (all on b68d6a0a)
- P1, quoted values (`rounds: "2"`, `current_round: "3"`, `successes: "0"`, `failures: "0"`, limits quoted): failure / Total Failure / skull. The SC-628 `readNumber` gives numbers, so there is no string comparison.
- P2, `current_round: 99` of 2: failure, "2 rounds used". Back to round 2 writes `current_round: 2` and the board goes live: pending, "Not started", "Round 2 / 2".
- P3, Reopen from 99 of 2: the board stays complete (Total Failure, "3 rounds used"). This was already so before SC-629 (INFO-2).
- P4, Clear all, and P5, Reset progress (⋯), from complete 0/0: pending, "Round 1 / 2".
- P6, Add a round (⋯), from complete 0/0: pending, "Round 3 / 3".
- P7, `rounds: 0` at round 1: failure, "0 rounds used", "Complete". Reopen goes to pending, "Round 1 / 1" (owner ruling F3).
- P8, unset limits, out of rounds: failure, "no success limit set" / "no failure limit set".
- P10, assists only, out of rounds (tallies 0/0): failure. Correct, because an assist is not a success.
- P11, hand-typed odd values: `rounds: -1` gives failure with "-1 rounds used". `rounds: 2.5` gives failure with "2.5 rounds used". `successes: banana` reads as 0 and gives failure. `rounds: 0, current_round: 0` is live, pending, "Round 0 / 0" (INFO-3).
- P13 (read-only host) and P14 (no participants): failure, consistent with the others.
- A montage that reaches a limit at 0/0 cannot exist. A positive limit needs at least 1 tally to be reached, and a limit of 0 means "unset" (`> 0` guard). Only running out of rounds completes a 0/0 montage.

## Findings

### HIGH
(none)

### MEDIUM
(none)

### LOW
- **LOW-1 — `draw-steel-elements/src/elements/montage/model.ts:448`.** The doc comment says "A montage whose rounds ran out (or whose limits were hit) with nothing recorded is over". The parenthetical describes a case that cannot happen: at 0/0 no positive limit is reached, and a 0 limit is unset. The implementer's own test, `test/unit/model/montage-serialize.test.ts` (last SC-629 test, "only the rounds can complete a 0/0 montage"), says so.
  - Failure scenario: a future reader expects a limit-completed 0/0 branch and adds handling or tests for it.
  - Fix: drop "(or whose limits were hit)".
- **LOW-2 — `draw-steel-elements/test/dom/elements/montage.test.ts:728-738`.** The Reopen test never asserts the starting state (`failure`) before the click, so it passes unchanged under the mutant (measured). The test at :718 checks the starting state on the same fixture, so the pair still pins the behaviour. Alone, though, the Reopen test does not prove a failure → pending transition.
  - Fix (optional): add `expect(outcomeBand(root).getAttribute('data-band')).toBe('failure');` before the click.

### INFO
- **INFO-1 — `CHANGELOG.md:12-13`.** The bullet says "the result band showed "Final result" and "2 rounds used"". The number comes from the ticket's 2-round example. It reads as an example, so this is acceptable. The bullet is accurate, in plain words, under `## Unreleased`, and in the same style as SC-628.
- **INFO-2 (pre-existing, not SC-629).** On a hand-typed `current_round` far past `rounds` (99 of 2), Reopen is offered but only adds a round, so the board stays complete. Back to round N does reopen it. The CHANGELOG sentence "adding a round to a finished one brings it back" holds for every board that End round produces (`current_round = rounds + 1`). Candidate Backlog ticket: Reopen could also clamp `current_round` to `rounds`.
- **INFO-3 (pre-existing, not SC-629).** Hand-typed `rounds: -1` gives "-1 rounds used", `rounds: 2.5` gives "2.5 rounds used", and `rounds: 0, current_round: 0` gives the live "Round 0 / 0" / "End round 0". The first two now also say Total Failure, which is consistent with F3. Out of scope.
- **INFO-4.** The head crest stays an hourglass on a complete Total Failure. Confirmed, and already ruled on (F2). Not raised again.
- **INFO-5.** The dse-verify CURRENT numbers still say 585/604 and 19 known-bug and list SC-629 (owner ruling F1, handled at landing). The new numbers are 586/604, 18 known-bug, and jest 13315/2 fresh (13316/1 when the CSS is cached).

## Lifecycle decision
Not run. The diff changes only `montageOutcome`'s 0/0 branch when the montage is complete, plus comments. The lifecycle montage scenarios never reach that branch:
- G-S13: success taps are logged before End round.
- G-S53: the twins go from round 1 to round 2 of 3.
- G-S87: round 2 of 3, live.
- form-save, G-S64 and G-S77: default live blocks.

`obsidian-lifecycle.mjs` has no assertion on `verdict-word` or `data-band`.

## Working-tree state
- `git status --porcelain` is empty before and after in the worktree superproject and in `draw-steel-elements`.
- Two scratch `git worktree add --detach` checkouts (mutant and probe) are registered in the dse repo's worktree list, at `…/scratchpad/sc629-r2-rev/mut` and `…/scratchpad/sc629-r2-rev/probe`. They are left in place under the no-rm rule. The owner may run `git -C <plugin> worktree remove --force <path>` on each.

## Evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r2-rev/`:
- Gates: `tsc.log`, `tsc-e2e.log`, `lint.log`, `jest.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`
- Probes: `probe-jest.log` (the SC629-PROBE JSON dump); probe source `probe/test/dom/elements/zz-sc629-probe.test.ts`
- Mutant: `mut-jest.log` (5 failed of 321), `mut-e2e.log` (MONT-W03 FAIL); mutant diff in `mut/src/elements/montage/model.ts`

## r4 — scoped re-review of the rebase and the nits commit

### Summary
- Verdict: **LAND**. HIGH 0, MEDIUM 0, LOW 0. Both r2 LOW findings are fixed as prescribed.
- Heads: dse `3e88b3f5` on develop `09c879f2` (= origin/develop). Superproject `fe42d4f8` on `7219b96d` (= workspace origin/main).
- Rebase: `git range-diff 10c271fe..b68d6a0a 09c879f2..74e2a649` prints `1: b68d6a0a = 1: 74e2a649`, so the fix commit was carried over unchanged with no conflict resolution. As the brief says, I ran nothing heavier than one jest file.
- LOW-1 fixed: `model.ts` now reads "(a limit cannot end a 0/0 montage: a positive limit needs a tally, 0 means unset)". The comment changed, no code did.
- LOW-2 fixed: `montage.test.ts:731` asserts `data-band` is `failure` before the click. With the mutant at `3e88b3f5`, `montage.test.ts` gives 2 failed / 152 passed / 154 total. The Reopen test now fails at :731 (`Expected: "failure" / Received: "pending"`).
- Superproject: exactly 2 commits on `7219b96d`: CHANGELOG `ff5ad298`, then pointer bump `fe42d4f8`. The bump moves the pointer from `09c879f2` to `3e88b3f5`. The SC-629 bullet is first under `## Unreleased` and has the same text as r2; the SC-642 bullet is kept below it. A grep for AI trailers finds none (rc 1).
- r3 logs, summary lines confirmed:
  - jest `Tests: 1 skipped, 13326 passed, 13327 total`, rc 0
  - lifecycle parts 21+16+9+4+7+4+3 = 64/64, each rc 0
  - e2e `592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`, rc 0
  - shots rc 0 (host-leak 163/978, modal 40/240, capture clip 147); 592 PNGs on disk
  - freeze 280/280
  - parity 0 / 0 / 24, rc 0
- Every r3 log is newer than the `3e88b3f5` commit (17:15:28; logs 17:16-18:15). `git status --porcelain` is empty in the superproject and in dse.

### Evidence (r4)
In `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r2-rev/`:
- `r4-range-diff.log`
- `r4-nits.diff` (`git show 3e88b3f5`)
- `r4-mut-jest.log`

The scratch `mut` checkout is now detached at `3e88b3f5`, with the mutant line applied (scratch only). `probe` is still detached at `b68d6a0a`.
