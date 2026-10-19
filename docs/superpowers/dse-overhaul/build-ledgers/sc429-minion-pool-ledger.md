# SC-429 decisions ledger — minion pool modal: four small defects

Ticket: SC-429 (Backlog -> Awaiting 2026-10-19). Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc429-minion-pool (every submodule on branch `sc429-minion-pool`).
Repo touched: draw-steel-elements (tracked branch `develop`, base a89ffd9).
Related: SC-435 (e2e rollout for this modal, Backlog — not in scope here; it will build on these fixes).

## Ticket body (the spec — no Scott comments on the thread as of 2026-10-19)

> 1. **Stuck all-checked.** Lower the pool to 0 (every minion auto-checked and disabled), then press + to raise it to 1. All 5 stay checked while 4 are needed, and Apply is disabled with "Select 4 minion(s)". ~lines 430-437 never un-check the excess.
> 2. **Initial focus is "Decrease Stamina pool".** Space or Enter right after opening decrements the pool. The stamina edit modal focuses its Apply box instead.
> 3. **The minion-count box's max counts dead minions** (~line 130 uses `instances.length`). Over-counted damage is clamped at 0, so no corruption.
> 4. **At rest the info text reads "0 damage will kill 0 minion(s). Select 0 minion(s) to kill."** (~lines 354-357). Hide or reword it when nothing is pending.

## Owner rulings (2026-10-19, ticket-owner — not Scott's; Scott may override)

- O1 (item 1): Checks the modal set AUTOMATICALLY (the "every remaining minion must die" auto-check) are reverted when that rule stops applying: those boxes un-check and re-enable; boxes the USER checked by hand keep their state. No state where more boxes are checked than the rule forced and the user chose.
- O2 (item 2): On open, focus goes where the stamina edit modal puts it (mirror its behaviour — implementer verifies what that is and reports it). Never a stepper button.
- O3 (item 3): The minion-count box's max is the number of LIVING minions in the squad.
- O4 (item 4): When nothing is pending (no damage, no kills to select) the kill/select info line is hidden, not reworded. Any heal/refused-heal text is unaffected.
- O5: Product fixes + jsdom tests only. No new e2e manifest pairs (that is SC-435). Full dse-verify battery must stay green with no rebaseline.

## Authorship
- Round 1 implementer: orchestration:implementer (agent add55a7c), brief sc429-brief-r1-implement.md
- Round 1 reviewer: must be a different identity (orchestration:reviewer)

## Round 1 result (2026-10-19)
- Implementer DONE: dse branch sc429-minion-pool head c1cc4fe on base a89ffd9. jest 4783/1 skipped/227 of 228 (+14), lifecycle 25/25, e2e 62/72 ok 0 failed 10 known-bug 47/47, shots 572 0 FAIL, freeze 276/276, parity 0/0/24.
- Item 2 finding: stamina modal relies on DseModal default first-focusable (its Apply amount box); pool modal now focuses its "Damage per minion" Apply box explicitly.
- Follow-up rulings (owner): (a) Apply Damage handler doesn't clamp minion count to living -> asked reviewer; fold into fix round if trivial/reachable, else drop. (b) extra user ticks persist when fewer kills owed -> DROP: consistent with O1 (user choices are kept; Apply shows the select-N gate).

## Base moved (2026-10-19, dispatcher)
- dse origin/develop a89ffd9 -> c78a06b (SC-290: fenceLine.ts write-back). Land-ready MUST be on c78a06b.
- New CURRENT baselines: jest 4787 passed / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 pairs · shots 572 · freeze 276/276 · parity 0/0/24 DECLARED.
- Expected for this branch after rebase: jest 4801 (4787 + 14) unless the fix round adds tests.
- Plan: review continues on c1cc4fe (modal-only diff; SC-290 does not touch it); the fix/rebase round rebases onto c78a06b and re-runs the full battery.

## Round 1 review (2026-10-19) — APPROVE-WITH-NITS, 0 HIGH / 0 MED / 2 LOW / 4 INFO (sc429-r1-review-report.md)
Owner rulings on findings:
- LOW-1 (typed-draft prediction counts auto-ticks, :422-430) -> FOLD into fix round 1.
- LOW-2 (typed minion count not clamped to living, :177-187; reachable) -> FOLD (supersedes follow-up (a) above: ~~ask reviewer~~ now folded).
- INFO-1 (hand ticks cleared when no kills owed, :498-502; predates) -> DROP: pre-existing, and with zero kills owed the ticks have no effect on Apply.
- INFO-2 ("Select 0 minion(s) to kill." with damage crossing no death tick) -> FOLD: omit the "Select N minion(s) to kill." sentence when N is 0 (keep the "X damage will kill 0 minion(s)." sentence). Same line the ticket complained about.
- INFO-3 -> no action (confirms ruling (b)).
- INFO-4 (workspace CHANGELOG) -> DROP for the branch: dse CHANGELOG carries the bullet; workspace changelog is dispatcher bookkeeping at landing/deploy.
- Reviewer noted main checkout draw-steel-elements dirt (demo-vault/Welcome.md modified; new demo-vault/montage 1.md, compendium-manifest.json, 13:18:05) — not ours; reported to dispatcher, untouched.
- Fix round 1: implementer (author) resumed; also rebases onto c78a06b. Scoped re-review: the round-1 reviewer (not an author of any code).

## Fix round 1 result (2026-10-19)
- Rebased onto c78a06b clean. Commits: 7b3d6f0 (round 1, was c1cc4fe), 8ab5e91 (fix 1: LOW-1, LOW-2, INFO-2). Head 8ab5e91.
- Gates on 8ab5e91: tsc/lint clean · jest 4806 passed / 1 skipped / 227 of 228 (+19 over 4787) · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 · shots 572 0 FAIL · freeze 276/276 · parity 0/0/24.
- Scoped re-review of 7b3d6f0..8ab5e91: round-1 reviewer (not an author).

## Scoped re-review (2026-10-19) — APPROVE, 0 HIGH/MED/LOW, 2 INFO (sc429-fix1-rereview-report.md)
- range-diff confirms 7b3d6f0 == c1cc4fe. 4 of 5 new tests fail without the fix (5th is a control).
- INFO-a (typed 1e3 visibly becomes 1; old parseInt truncation) -> DROP: pre-existing parse rule, now merely visible.
- INFO-b (all-dead squad: count box opens at 1 with max 0; Apply corrects to 0, nothing written) -> DROP: cosmetic, an all-dead squad has nothing to damage, no note write possible; not worth a battery round.
- LAND-READY: dse sc429-minion-pool @ 8ab5e91 on develop c78a06b. Reported to dispatcher.
