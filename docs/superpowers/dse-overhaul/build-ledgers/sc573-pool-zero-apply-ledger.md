# SC-573 decisions ledger — pool modal: pool at 0 with living minions, Apply stays disabled

Worktree: /home/scott/code/steelCompendium/worktrees/sc573-pool-zero-apply
(branch `sc573-pool-zero-apply` in every submodule). Cut from dse develop `f2889351`,
workspace main `ff94c481`.

## Ticket (filed 2026-11-10 by the SC-435 owner, Low, DSE 7.0.0)

"If a squad's pool is 0 while one of its minions is still alive, the pool modal's Apply
button stays disabled. There is no way to mark the remaining minions dead from the modal. One
way to reach this state is to relieve the squad's captain (SC-421 describes the pool dropping
below what the living minions need)."

"**Expected:** at pool 0 the modal lets you record the remaining deaths. Alternatively, the
tracker never lets the pool reach 0 with a minion still alive."

Agent notes: `src/views/MinionStaminaPoolModal.ts:470` and `:499-506`; captain path
`EncounterData.ts:385`. SC-435 left a `test.failing` marker citing this ticket in
`test/dom/views/minion-stamina-pool-modal-matrix.test.ts` ("SC-573: a pool at 0 with living
minions leaves Apply reachable so they can be killed"). It forces pool 0 after parsing, so it
assumes the fix lands in the modal.

SC-566 owner's comment on this ticket (2026-11-11): with the pool at 0 and staged damage, the
Apply label reads "Deal 0 damage, kill N minion(s)". "When this ticket enables Apply in that
state, consider whether the label should drop the damage part and read "Kill N minion(s)"
instead." (Landed SC-566 commits: `8ca64cb9`, `b4e7b4f4`; the comment cites pre-rebase
`a918c78c`.)

## Scott rulings

(none yet)

## Owner decisions

- 2026-11-11 (owner): **Fix in the modal, not at captain relief.** Reasons: the Draw Steel
  rule is plain (a pool at 0 means every minion in the squad is dead), so recording the
  deaths is rules-correct; a pool can reach 0 with minions alive by more than one path (the
  captain relief in SC-421, a hand-edited pool), so a modal fix covers all of them; changing
  the captain transition is SC-421's open decision for Scott and stays out of scope here.
  The SC-435 `test.failing` marker already assumes the modal fix.
- 2026-11-11 (owner): **Behaviour at pool <= 0 with N living minions:**
  - Apply is enabled with nothing staged. The living minions are already auto-ticked and
    locked (existing `updateCheckboxes` rule for new pool <= 0); Apply marks them dead and
    writes the pool as 0 (the existing clamp).
  - Label: **"Kill N minion(s)"** whenever the applied damage is 0 and kills are owed (nothing
    staged, or damage staged on an empty pool). This takes the SC-566 owner's suggestion. All
    other labels unchanged.
  - Info line (currently hidden when nothing is staged): shows **"The pool is at 0, so N
    minion(s) die."** when the current pool is <= 0 and N > 0 living minions, nothing staged.
    With damage staged on an empty pool it reads the same sentence (not "0 damage will kill N
    minion(s)").
  - A heal at pool 0 is unchanged (still refused by the existing heal-ceiling rule).
  - Not escalated to Scott: the strings follow the modal's existing "Kill"/"minion(s)"
    wording; the closing comment quotes them with a screenshot so he can overrule.

## Rounds

- 2026-11-11: impl r1 dispatched (orchestration:implementer), brief `sc573-brief-impl-r1.md`. Ticket -> Awaiting.
- 2026-11-11: dispatcher: SC-577 landed, dse develop now `93b3a382`. New CURRENT: jest 7107/1 · lifecycle 53/53 · e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Implementer told to rebase and gate on 93b3a382; review brief updated.
- 2026-11-11: dispatcher: SC-584 landed, dse develop now `eaa8742a` (supersedes 93b3a382). New CURRENT: jest 7177 passed / 2 skipped (fresh worktree) · lifecycle 54/54, part 5 now `G-S59 G-S49 G-S73 G-S77` (4), part 3 ~480 s under load · e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` · shots 592 / 163/978 / 39/234 / clip 147 · freeze 280/280 · parity 0/0/24. Implementer told to rebase and gate on eaa8742a; review brief updated.
- 2026-11-11: impl r1 DONE, head `75cd1acb` on `eaa8742a` (commits 64ca2310 fix+13 tests, ca4dfdaf e2e POOL-K07 + fixture squad-empty.md, 75cd1acb CHANGELOG). Gates: tsc/lint clean · jest 7190/1 · lifecycle 54/54 · e2e 259/265 ok, 0 failed, 6 known-bug, 164/164 · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24. Measured: with damage staged at pool 0 Apply was already enabled ("Deal 0 damage, kill 5"); only the nothing-staged state was broken. Owner eyeballed sc573-pool0-nothing-staged.png: info "The pool is at 0, so 5 minion(s) die.", all five ticked, Apply enabled "Kill 5 minion(s)" — matches decisions.
- 2026-11-11: follow-up rulings: (1) fresh worktree needs `npm ci` — drop, known worktree setup step. (2) dse-verify SKILL.md ~290 KB, too large for one Read — not a ticket from this owner (owners do not edit dse-verify); relayed to the dispatcher in the land-ready report.
- 2026-11-11: review r1 dispatched (orchestration:reviewer), brief `sc573-brief-review-r1.md`, head 75cd1acb.
- 2026-11-11: review r1 verdict LAND (0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO), report `sc573-review-r1-report.md`. Grid 1908 states, 0 changed on pool > 0; real captain-relief path verified; POOL-K07 fails on develop src, passes on head. e2e full 258/265 + RECOV-R07 1/1 alone (load flake).
- 2026-11-11 (owner) finding rulings — all FOLDED into fix round 1 (small, same function, and LOW-1 is the case our own decision promises: "a negative hand-edited pool behaves as pool 0"):
  - LOW-1 (negative hand-edited pool, + then − leaves the modal reading "Heal 3 stamina", Apply disabled, no reason; pre-existing): fold — normalise the current pool to >= 0 where the modal reads it (`:102`, `:354`), plus a test.
  - INFO-1 (CHANGELOG "A heal at pool 0 is still refused" only true for consistent squads; underfunded captained squads are SC-421's class): fold — reword the CHANGELOG so it claims nothing about heals beyond "unchanged".
  - INFO-2 (matrix test `:859` passes on develop but is not labelled a pin): fold — label it as a regression pin.
  - INFO-3 (redundant `pending <= 0` at `:371`): fold — simplify.
  - INFO-4 (negative-pool branch of `appliedPoolChange` unreachable): fold — after LOW-1 remove it if provably dead, else leave with a comment saying why it stays.
- 2026-11-11: fix r1 dispatched to the implementer (resume); scoped re-review goes to the r1 reviewer (not the author).
- 2026-11-11: fix r1 DONE, head `6c7216e8` (on 75cd1acb; develop still eaa8742a). currentPool() floors pool at 0 (stepper base, poolNumbers, Apply); CHANGELOG 'Heals are unchanged'; (pin) label; redundant cond removed; dead appliedPoolChange branch removed. Gates: jest 7191/1 · lifecycle 54/54 · e2e 259/265 ok, 0 failed, 6 known-bug, 164/164 · shots 592/163/978/39/234/147 · freeze 280/280 · parity 0/0/24. Scoped re-review r2 dispatched to the r1 reviewer.
- 2026-11-11: re-review r2 LAND on `6c7216e8` (0 H/M/L, 2 INFO). Rulings: INFO-A (pool -3 with nobody alive: + then − does nothing, -3 stays on disk) — drop: no living minion, nothing to record, display already shows 0. INFO-B (bar draws a negative pool as empty) — drop: intended improvement. jest rerun 7191/1 (two SC-568 load timeouts green alone); POOL-K07 1/1.
- 2026-11-11: LAND-READY: dse `sc573-pool-zero-apply` @ `6c7216e8` on develop `eaa8742a`. Comment `sc573-comment-landready.md` posted; reported to dispatcher.
- 2026-11-11: LANDED by dispatcher: dse develop `6c7216e8` (eaa8742a..6c7216e8, 4 commits), workspace main `19fe3c15` (pointer bump a3e0254b). Worktree removed; ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc573-pool-zero-apply/. Landed comment `sc573-comment-landed.md` posted; SC-573 -> Done (verified, completedAt 2026-11-11T15:26:50Z).
