# SC-566 decisions ledger — minion pool modal overkill label

Worktree: `/home/scott/code/steelCompendium/worktrees/sc566-pool-modal-overkill` (branch
`sc566-pool-modal-overkill` in every submodule). Cut 2026-11-11 from dse develop `a339e7b3`.

## Ticket spec (Scott-activated Backlog, 2026-11-10; no Scott comments yet)

Verbatim from the ticket:

> **Repro:** a squad of 5 minions with a pool of 20 (4 each). Enter damage 99 and tick all 5
> minions. The pool stepper shows 0, but the Apply button reads "Deal 495 damage, kill 5
> minion(s)" and the info line reads "495 damage will kill 5…". Apply writes pool 0, which is
> correct.
>
> **Expected:** the button and info line state the change that will actually happen (20
> damage), the way the stamina edit modal has since SC-427. The preview bar showing the full
> damage is intentional and stays.

> `src/views/MinionStaminaPoolModal.ts:199` keeps the pending damage unclamped; the label is
> built at `:458` and the info line at `:427` (dse develop 6270e84a). SC-435 carries a
> `test.failing` marker citing this ticket in its jsdom matrix; when fixing, flip it to a
> plain test.

## Owner rulings

- 2026-11-11 (owner): No Scott decision needed — the ticket states the expected text (the
  clamped amount, following the SC-427 stamina-modal precedent). Wording follows whatever
  shape the SC-427 stamina modal uses; the preview bar stays unclamped.
- 2026-11-11 (owner): Out of scope — SC-567 (surplus ticks), SC-573 (pool 0 with a living
  minion), SC-574, SC-591, SC-592. Their `test.failing` markers must stay failing.
- 2026-11-11 (owner): If the heal direction of the same label/info builders has the same
  unclamped defect (healing past the pool max), fold the fix in with its own test — same
  principle, same code. If it is a different code path, report it as a Follow-up.

## Rounds

- r1 implementer — dispatched 2026-11-11.
- r1 implementer — DONE 2026-11-11, dse head `a918c78c` (one commit on a339e7b3). Label now
  "Deal 20 damage, kill 5 minion(s)"; info "20 damage will kill 5 minion(s)." Heal: no defect
  (stepper clamps), guard test added. All gates at baseline (jest 7083/2 skipped pre-shots after
  SC-568 timeout reruns).
- 2026-11-11 (owner) follow-up rulings:
  - "At pool 0 with a living minion, staged damage reads 'Deal 0 damage, kill N minion(s)'" —
    belongs to SC-573 (that state's whole fix). Not folded; note it on SC-573 for its owner.
  - "Hand-edited pool above max (25/20) keeps staged direction in label, Apply clamps" — drop:
    unreachable through the UI, and Apply's write is already correct.
- r2 reviewer — dispatched 2026-11-11 (independent of r1 author).
- 2026-11-11 (dispatcher): new baseline — SC-575 landed, dse develop `734d7745` (was a339e7b3).
  CURRENT: jest 7085/1 (shots cache) · lifecycle 53/53 · e2e `255/262 ok, 0 failed, 7 known-bug,
  coverage: 163/163 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, clip 147 ·
  freeze 280/280 · parity 0/0/24. "Rebase onto 734d7745 before you report land-ready."
  Owner plan: let r2 finish reviewing a918c78c (delta is disjoint from SC-575's initiative
  Reset change), then a rebase round with the full battery. Expected after rebase:
  jest 7087 passed / 1 skipped (7085 + 2 new), e2e 255/262 · 7 known-bug · 163/163.
- r2 reviewer — DONE 2026-11-11: LAND-READY on a918c78c, 0 B / 0 H / 0 M / 1 LOW / 4 INFO.
  jest 7084/1 (twin-reuse SC-568 timeout rerun alone 53/53), e2e 254/262 · 8 kb · 163/163.
  Note bytes identical to a339e7b3 in 37 probes; vacuity check: 3 tests fail with src reverted.
- 2026-11-11 (owner) rulings on r2 findings:
  - LOW-1 (hand-edited negative pool flips the label's sign, `:390`): FOLD — reviewer's one-line
    fix `if (raw < 0) return Math.max(raw, -Math.max(0, poolCurrentStamina));` plus a jsdom test.
    It makes the helper's "the sign never flips" docstring true.
  - INFO-1 (docstring "ONE copy of this math" overstates): FOLD — reword to "the one copy the
    label and info line share; Apply and the stepper keep their own [0, max] clamp".
  - INFO-2 (SC-591/592 have no markers): drop — nothing to check.
  - INFO-3 (no workspace CHANGELOG bullet): drop — the dse CHANGELOG `[FIX]` bullet carries it,
    as with SC-572.
  - INFO-4 (heal guard test is a guard): drop — informational.
- r3 implementer (resume r1 author) — rebase onto 734d7745 + fold LOW-1/INFO-1 + full battery.
  Then r4 scoped re-review of the delta by the r2 reviewer (not the author).
- r3 implementer — DONE 2026-11-11: rebased clean onto 734d7745; head `b4e7b4f4` (r1 = `8ca64cb9`).
  -5 pool: "Deal 0 damage, kill 5 minion(s)". Gates: jest 7088/1 (twin-reuse SC-568 timeout,
  alone 53/53) · lifecycle 53/53 · e2e 255/262 · 0 failed · 7 kb · 163/163 (third run; runs 1-2
  at loadavg 28-30 failed only RECOV-R07, the documented load flake, 1/1 alone) · shots 592,
  163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24.
- r4 scoped re-review (r2 reviewer, delta b4e7b4f4 + rebase sanity) — dispatched 2026-11-11.
- r4 scoped re-review — DONE 2026-11-11: LAND-READY on b4e7b4f4 (on 734d7745). 0/0/0/0/1 INFO.
  range-diff r1 unchanged; -5 test non-vacuous; note bytes identical 734d7745 vs head (39 probes).
- 2026-11-11 (owner) ruling on r4 INFO-1 (hand-edited -5 pool, stepper + refusal names a negative
  ceiling): drop — identical on 734d7745, pre-existing, unreachable through the UI.
- LAND-READY reported to dispatcher 2026-11-11: dse `sc566-pool-modal-overkill` @ b4e7b4f4.
- DONE 2026-11-11: landed by dispatcher — dse develop `b4e7b4f4` (2 commits), workspace main
  `349cb6e5` (pointer bump `2cda0c8d`, bookkeeping `6ee927e0`). Ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc566-pool-modal-overkill/`; worktree removed.
  SC-566 moved to Done.
