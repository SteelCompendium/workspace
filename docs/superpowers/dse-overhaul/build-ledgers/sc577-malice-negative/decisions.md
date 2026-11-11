# SC-577 decisions ledger — Malice can go negative

Effort: sc577-malice-negative · worktree /home/scott/code/steelCompendium/worktrees/sc577-malice-negative
Base: dse develop 734d7745 · workspace main 6a0c3cec · opened 2026-11-11

## Ticket (as filed 2026-11-10 by the SC-437 owner)

> Pressing − on Malice at 0 writes `value: -1`. A negative `round_gain` also drives Malice below 0,
> and labels the round button "Advance round (+-3 Malice)". The quick-add box already clamps at 0,
> so the stepper and the round gain disagree with it.

## Scott rulings

(none yet)

## Owner rulings (2026-11-11, ticket-owner)

- O1. The Malice pool never goes below 0 on any write path. Basis: the quick-add already floors at 0
  (`view.ts` `Math.max(0, …)`), and the rules (monsters book, "Malice": gained at combat/round start,
  spent on abilities) describe a pool you spend from, never a debt. Not a rules ambiguity: this makes
  the stepper and round gain match the behavior the quick-add already ships.
- O2. Stepper: pass the kit stepper `min: 0` (the − button disables at 0; typed entry clamps).
  Keep the kit's default seed clamp (a hand-edited `value: -2` displays as 0; the file is not rewritten
  until the user changes Malice). Do not coerce in `parse`.
- O3. `advanceRound`: a negative `round_gain` is still applied, floored at 0
  (`value = Math.max(0, value + gain)`). The log entry keeps the configured amount, the same convention
  the quick-add uses today. Whether a clamped change should log the actual delta or say "capped" is
  SC-578's question, for both paths — out of scope here.
- O4. Advance round label uses the Malice log's sign rule (`+` for ≥0, bare `-` otherwise):
  `Advance round (+3 Malice)` / `Advance round (-3 Malice)`. Never `+-`.
- O5. Remove the SC-577 known-bug markers: jest `initiative-matrix.test.ts` [M07] and [R01]
  (`test.failing` → `test`), e2e `malice.e2e.ts` [INIT-M07] (`knownBug` → `it`). Add one e2e for the
  negative round gain if the spec's fixture shape makes it cheap.
- Out of scope: SC-578 (quick-add logs the typed amount when clamped), SC-589 (half-typed quick-add
  lost on Advance round), SC-588 (focus after Advance round / quick-add).

## Rounds

- 2026-11-11 dispatcher: SC-566 landed; dse develop now b4e7b4f4 (was 734d7745; minion pool modal Apply label + info line text only). New CURRENT: jest 7088/1 · lifecycle 53/53 · e2e `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto b4e7b4f4 before land-ready.
- R1 implementer (Sonnet): DONE, rebased on b4e7b4f4, dse head 56e79252 (4edfc0be fix, 4238f430 e2e INIT-R03, 56e79252 manifest click-disabled pair for init.malice.dec), superproject dddf8cfe (CHANGELOG). Gates: tsc/lint 0 · jest 7089/1 · lifecycle 53/53 · e2e 257/263 ok, 0 failed, 6 known-bug, coverage 164/164 · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24. (Owner's 256/262 expectation was wrong: ok excludes known-bug; 257+6=263 is right.)
- O6 (owner, 2026-11-11, on R1 follow-up 1). A stored negative value counts as 0 in every Malice computation: advanceRound and the quick-add both compute from max(0, stored) (hand-edited `value: -2`, gain 3 must write 3, not 1). One shared model helper for "add an amount to the pool, floored" used by both paths. Still no coercion in parse (O2 stands). Log-entry semantics stay SC-578's. FOLD into the R2 fix round.
- O7 (owner, R1 follow-up 2). Rename/split the jest "known bugs: Malice below 0 and the quick-add clamp" describe so [M07]/[R01] no longer sit under a "known bugs" title; [M09] SC-578 keeps its marker. FOLD.
- R2 reviewer (Opus): dispatched on 56e79252
- 2026-11-11 dispatcher: SC-567 landed; dse develop now f2889351 (was b4e7b4f4; minion pool modal surplus kill ticks + e2e POOL-K06 only). New CURRENT: jest 7098 passed · lifecycle 53/53 · e2e `256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto f2889351 before land-ready. The R2 review stays on 56e79252 (SC-567 touches no Malice code); the fix round rebases onto f2889351 and gates there. Expected after our change on f2889351: jest 7099 + fix-round tests · e2e 258/264 ok, 0 failed, 6 known-bug, 164/164.
- R2 review (Opus) on 56e79252: LAND-READY pending folds. 0 HIGH / 1 MEDIUM / 2 LOW / 7 INFO. e2e 257/263 ok, 6 known-bug, 164/164; mutation checks show every converted test goes red without its hunk. Report: sc577-r2-review-report.md.
- Owner rulings on R2 findings (2026-11-11):
  - MEDIUM-1 (no dse CHANGELOG.md [FIX] bullet): FOLD.
  - LOW-1 (read-only view shows stored -2 as "Malice: -2"): FOLD — read-only display goes through the O6 floored value; add a jsdom row.
  - LOW-2 (jest label/advance tables lack negative rows): FOLD as prescribed.
  - INFO-1 (stepper not editable, typed-entry probes n/a): DROP — nothing to test.
  - INFO-2 (negative gain at 0 logs -3 while pool stays 0): per O3, SC-578's question; owner notes it on SC-578 at land-ready.
  - INFO-3 (round_gain 2.5 labels "+2.5", adds 2.5): DROP — pre-existing, needs a hand-typed fractional config, unrelated to the floor.
  - INFO-4 (writers list; pre-O6 -2 behaviour): covered by O6 fold.
  - INFO-5 (click-disabled entry required): no action.
  - INFO-6 (docs/initiative-tracker.md never says the pool stops at 0): FOLD, one sentence each place.
  - INFO-7 (dse-verify CURRENT e2e line at landing): dispatcher's at landing; in the land-ready report.
- R3 fix round: implementer resumed with O6, O7, MEDIUM-1, LOW-1, LOW-2, INFO-6 + rebase onto f2889351.
- R3 fix (Sonnet, same implementer) DONE on f2889351: dse head 93b3a382 (R1 rebased 4648603d f9491da3 49271a6b; cf6535c2 O6/LOW-1/LOW-2/O7; 93b3a382 dse CHANGELOG + docs), superproject cb5d5691. Gates: tsc/lint 0 · jest 7107/1 · lifecycle 53/53 · e2e 258/264 ok, 0 failed, 6 known-bug, 164/164 · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24. Report sc577-r3-fix-report.md.
- R4 scoped re-review (Opus, the R2 reviewer) of 49271a6b..93b3a382: dispatched.
- R4 re-review (Opus) on 93b3a382: LAND-READY, 0 HIGH/MEDIUM/LOW, 4 INFO. jest 7107/1, e2e 258/264 ok, 0 failed, 6 known-bug, 164/164. R1 commits range-diff "=". Report sc577-r4-rereview-report.md.
- Owner rulings on R4 INFO (2026-11-11): all DROP — INFO-1 ([M05] tag should be [M03]) test-id naming nit; INFO-2 (stepper seeded with raw value, floored by kit clampInitial) same behaviour, already pinned by tests; INFO-3 (superproject CHANGELOG line width) style nit; INFO-4 (NaN through maliceValueOf) pre-existing, YAML `.nan` only, out of scope.
- LAND-READY 2026-11-11: dse 93b3a382 on f2889351, superproject cb5d5691 (dse pointer uncommitted for wt-finish).
- DONE 2026-11-11: landed by the dispatcher — dse develop 93b3a382 (5 commits), workspace main 251c75be (pointer bump d7a82197, bookkeeping ed3a6166). dse-verify CURRENT updated to 93b3a382. Ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc577-malice-negative/. Worktree removed. SC-577 → Done.
