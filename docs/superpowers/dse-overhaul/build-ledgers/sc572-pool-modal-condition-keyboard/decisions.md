# SC-572 decisions ledger — minion pool modal condition icons: keyboard + screen reader

Ticket: SC-572 (DSE 7.0.0, Medium, Bug). Owner: ticket-owner (Opus 5.5).
Worktree: /home/scott/code/steelCompendium/worktrees/sc572-pool-modal-condition-keyboard
(branch sc572-pool-modal-condition-keyboard; dse base develop 97a9c93b; superproject ed591e32).

## Spec (from the ticket, 2026-11-10, filed by the SC-435 owner — not a Scott ruling)

> In the minion pool modal, each condition icon is a plain clickable element with no keyboard
> focus, no button role and no accessible name. Keyboard and screen-reader users cannot remove a
> condition from the modal. The initiative tracker's own condition icons are real buttons, so the
> modal is the odd one out.
>
> **Expected:** each condition icon is a focusable button named for its condition ("Remove
> Bleeding"), activated by Enter and Space.
>
> Agent notes: `src/views/MinionStaminaPoolModal.ts:556-579`, dse develop 6270e84a. SC-435 carries
> a `test.failing` marker citing this ticket; flip it to a plain test when fixing.

## Owner rulings

- 2026-11-10 (owner): Match the initiative tracker's existing condition-icon button model
  (element, classes, focus ring, naming) rather than inventing a new look; that keeps this a bug
  fix with no new user-visible design choice, so no Scott ask is needed unless the freeze moves or
  the tracker's model cannot be reused.
- 2026-11-10 (owner): Out of scope — SC-566, SC-567, SC-573, SC-574 (other Low tickets in the same
  modal), SC-480, SC-576 (concurrent efforts).

## Scott rulings

(none yet)

## Rounds

- r1 (2026-11-10): implementer (orchestration:implementer, id a917bb127a70492b5) dispatched on
  `sc572-brief-r1-implementer.md`. Author of the code change — must not review it.
- r1 DONE (2026-11-10): head `1305e0b4` (cf34f3bd fix+tests, 1305e0b4 CHANGELOG) on 97a9c93b. e2e
  `251/261 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs` (POOL-C04 Enter flipped, new POOL-C05
  Space); jest 7050/1 (twin-reuse SC-568 timeout, green alone); lifecycle 52/52; shots 592 (run 1
  montage-wheel flake, run 2 green); host-leak 163/978; clip 147; freeze 280/280; parity 0/0/24.
  Choices: bare `<button type=button class=condition-icon>` (not kit iconButton — sheen/min-size/hover
  plate), name "Remove <name>" (tracker uses "Remove condition: <name>"), `title` dropped (hover text
  becomes "Remove Bleeding").
  Owner rulings on r1 follow-ups:
  - dse-verify CURRENT numbers update → dispatcher at landing (owners don't edit SKILL.md); in land-ready report.
  - montage-wheel shots flake → drop, already tracked as SC-521.
  - pool-modal shot fixture has no conditions, so host-leak sweep never mounts `.condition-icon` → FOLD
    into the fix round (same area, small) unless the reviewer finds it moves frozen bytes.
- r2 (2026-11-10): independent reviewer dispatched on `sc572-brief-r2-reviewer.md` (head 1305e0b4).
- r2 review (2026-11-10, reviewer a647fc68915a5260e, head 1305e0b4): FIX-NEEDED — 0C/0H/1M/3L/5I; all
  gates green, same numbers as r1. Owner rulings:
  - MEDIUM-1 (focus drops to <body> after keyboard removal) → FOLD (fix round r3).
  - LOW-1 (no other-key-does-nothing test; mutant M5 survives) → FOLD.
  - LOW-2 (focus ring deletion uncaught; assert outline solid 2px in POOL-C04) → FOLD.
  - LOW-3 + owner Q(d) (CSS reset unguarded; add condition to the shots fixture) → FOLD, exactly as
    prescribed: Goblin #4 (NOT #1 — #1 would move frozen initiative-fight* print PNGs).
    Expected after: 592 PNGs hash-identical, freeze 280/280, shots 592, 163/978 and clip 147 unchanged,
    modal host-leak line moves 38 kinds/228 → 39 kinds/234.
  - INFO-1 (SC-574(b) setup line could keep its marker silently green) → DROP: pre-existing and that marker
    belongs to SC-574's fixer.
  - INFO-2 (stale helper name `conditionTitles`, e2e/driver/pool.ts:65) → FOLD (rename, nit in a touched file).
  - INFO-3 (20px icons, no 44px hit area, 0.38 alpha) → FILED SC-591 (Backlog, Low; look-and-feel, may need Scott).
  - INFO-4 (removal re-serialises the whole block: strings → {key}, quotes dropped) → FILED SC-592 (Backlog, Low).
  - INFO-5 (CHANGELOG accurate) → no action.
  - Q(b) naming "Remove X" vs tracker "Remove condition: X" → DROP: pool wording matches ticket + ConditionsModal;
    not worth a ticket.
- r3 (2026-11-10): fix round → resume r1 implementer (a917bb127a70492b5) on `sc572-brief-r3-fix.md`.
  Scoped re-review r4 must go to a fresh reviewer identity (not the implementer).
- r3 DONE (2026-11-10): head `f62e1f5e` (2581768f fixes, f62e1f5e CHANGELOG). e2e `252/262 ok, 0 failed,
  10 known-bug, coverage: 163/163 pairs` (new POOL-C06; manifest pool.condition gains press:Enter/Space);
  jest 7055/1 (2 load timeouts green alone); lifecycle 52/52; shots 592, all 592 hashes identical to clean
  head, host-leak 163/978, modal 39/234, clip 147; freeze 280/280; parity 0/0/24. Mutants M5, M8, M9,
  no-hand-off all caught.
  Ruling: RECOV-R07 load flake seen in one e2e run → DROP, already tracked as SC-517 / SC-570.
- r4 (2026-11-10): scoped re-review of 1305e0b4..f62e1f5e → resume r2 reviewer (a647fc68915a5260e; not the author).
- 2026-11-10 dispatcher: SC-576 landed; dse develop now `fbaba3da`. CURRENT there: jest 7056/1 · lifecycle 52/52 ·
  e2e 251/260 ok, 0 failed, 9 known-bug, coverage 161/161 · shots 592, 163/978, clip 147 · freeze 280/280 · parity 0/0/24.
  "Rebase onto fbaba3da before you report land-ready."
  Owner: expected after rebase = e2e **254/262 ok, 0 failed, 8 known-bug, coverage 163/163** (dispatcher's 252/260
  assumed only the marker flip; SC-572 also adds POOL-C05 + POOL-C06). jest ≈ 7056 + 5 new = ~7061/1.
  Plan: let r4 re-review finish on f62e1f5e (rebasing under its running gates would corrupt them), then r5 =
  implementer rebase + full battery; owner checks `git range-diff` (all `=` → no re-review; conflicts → reviewer
  looks at the resolution only).
- r4 DONE (2026-11-10, reviewer a647fc68915a5260e): LAND-READY for f62e1f5e, 0C/0H/0M/0L/2I; gates match r3.
  Owner rulings:
  - INFO-1 (only condition removed by keyboard → focus lands on footer Reset; a second Enter clears staged
    damage/kill ticks, no note write) → FOLD into r5: prefer `pool.damage-amount` over the footer. Reason: a
    double Enter silently throws away the user's staged input.
  - INFO-2 (CENSUS-07 45 s timeout at loadavg ~27, green alone) → FILED SC-593 (Backlog, Low). RECOV-R07 part → SC-517/SC-570.
- r5 (2026-11-10): implementer (a917bb127a70492b5) — rebase onto fbaba3da FIRST, then the INFO-1 fold as its own
  commit, then full battery. Then r6 = r2/r4 reviewer scoped re-review of the INFO-1 commit + rebase resolution.
- 2026-11-11 dispatcher: SC-480 landed; dse develop now `eeed5182` (was fbaba3da). Changes the card-write fallback
  path; adds lifecycle G-S73. CURRENT: jest 7076 non-skipped (7074/2 fresh + 2 SC-568 timeouts green alone) ·
  lifecycle **53/53** · e2e 251/260 ok, 0 failed, 9 known-bug, 161/161 · shots 592 / 163/978 / clip 147 · freeze
  280/280 · parity 0/0/24. "Lifecycle part 5 is now `G-S59 G-S49 G-S73` (3; 266 s); G-S56 stays last in part 4."
  "Rebase onto eeed5182 before you report land-ready."
  Owner: r5 retargeted mid-round to eeed5182 (SendMessage to implementer). Expected with SC-572: e2e still
  254/262 ok, 8 known-bug, 163/163; lifecycle 53/53; jest ≈ 7076 + SC-572's new tests non-skipped.
- r5 DONE (2026-11-11): head `a339e7b3` on `eeed5182` (no conflicts; owner-verified range-diff 4/4 `=`); INFO-1 fold
  = a339e7b3 (focus → pool.damage-amount, fallback skips `.dse-sedit__footer`). Gates: jest 7082/1 (2 load timeouts
  green alone) · lifecycle 53/53 · e2e 254/262 ok, 0 failed, 8 known-bug, 163/163 · shots 592, 163/978, modal 39/234,
  clip 147, PNGs identical to r3 render · freeze 280/280 · parity 0/0/24.
- r6 (2026-11-11): scoped re-review of a339e7b3 → resume reviewer a647fc68915a5260e.
- r6 DONE (2026-11-11, reviewer a647fc68915a5260e): LAND-READY for `a339e7b3` on `eeed5182`; 0C/0H/0M/0L/1I.
  e2e 254/262 ok, 0 failed, 8 known-bug, 163/163; jest 7082/1; lifecycle parts 1 + 5 green (21/21, 3/3).
  Ruling: new INFO-1 (fallback if the damage field were disabled/missing lands on pool.stamina.dec — never footer,
  never body; unreachable today) → DROP: path cannot occur and the fallback is already safe.
- LAND-READY (2026-11-11): dse branch sc572-pool-modal-condition-keyboard @ a339e7b3 on develop eeed5182. Reported
  to dispatcher. dse-verify CURRENT numbers to record at landing: e2e 254/262 ok, 0 failed, 8 known-bug, 163/163;
  modal host-leak 39 kinds / 234 comparisons; known-bug list loses SC-572; jest 7082/1 (worktree with shots CSS cache).
