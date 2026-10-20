# SC-431 decisions ledger

Ticket: SC-431 — "Stamina modal: pressing Escape while typing in a field closes the whole modal and discards every pending change"
Worktree: /home/scott/code/steelCompendium/worktrees/sc431-escape-field (all submodules on branch `sc431-escape-field`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `d58cf6a`)

## Spec (ticket description, verbatim, 2026-10-19)

> **Repro:** open the stamina modal. Press Damage with an amount (so a change is pending). Click into the Stamina or Temporary Stamina field and type a digit. Press Escape to back out of the typing.
>
> **Expected (what the code intends):** the stepper swallows Escape and reverts only the half-typed draft; the modal stays open with the Damage still pending.
>
> **Actual:** Obsidian's modal closes anyway, discarding the draft and every other pending change. The stepper's `stopPropagation` does not stop Obsidian's modal Scope from handling Escape. jsdom tests pass because they cannot see Obsidian's Scope.
>
> **Fix direction:** register the draft-cancel on the modal's Obsidian `Scope` (or intercept Escape in the capture phase) so the first Escape cancels the draft and a second Escape closes the modal. The e2e scenario that records the current behaviour should then flip to asserting the intended one.

## Scott rulings

(none yet — thread empty at 2026-10-19 start)

## Owner decisions

- 2026-10-19: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready. No design round: behaviour is fully specified by the ticket.
- 2026-10-19: Scope = both the Stamina and the Temporary Stamina steppers in the Stamina modal (the ticket names both). Clean-draft Escape must still close the modal (STAM-S07 stays green). Other Escape-swallowing controls inside Obsidian modals are surveyed and reported as Follow-ups, not fixed here.

## Round log

- 2026-10-19 r1: implementer (Sonnet) dispatched on `sc431-brief-r1-impl.md`. Author identity A = r1 implementer. Review must go to a different identity (reviewer, Opus).
- 2026-10-20 r1 DONE: dse `56c83b8` (cb613d8 fix + 56c83b8 e2e), superproject CHANGELOG `a7f5d96`. Mechanism: `DseModal.onEscapeKey` override + `kit/draftCancel.ts` registry. Gates green: jest 4967/1/229 of 230, lifecycle 26/26, e2e 73/77 ok 0 failed 4 known-bug 52/52, shots 572, freeze 276/276, parity 0/0/24.
- Follow-up rulings (r1):
  - F1 ConditionsModal combobox Escape (`ConditionsModal.ts:570`) closes the whole modal, same bug -> FOLD into the fix round (same mechanism, few lines); reviewer probes it in real Obsidian first.
  - F3 plain inputs in DseModals (Apply box) close on Escape -> DROP: no draft revert was intended there.
  - F4 dse-verify expected numbers 71/76 -> 73/77 etc. -> not a ticket; reported to dispatcher in land-ready (dispatcher updates the skill at landing).
- 2026-10-20 r1 review: reviewer (Opus) dispatched on `sc431-brief-r1-review.md`. Identity B.
- 2026-10-20 dispatcher: dse origin/develop moved d58cf6a -> 7817133 (SC-360 landed, dse-only; workspace main b874ac0). New baselines at 7817133: jest 5013 passed / 1 skipped / 229 of 230 suites; lifecycle 26/26; e2e 71/76 ok, 0 failed, 5 known-bug, coverage 51/51; shots 572 + pressed-toggle parity line; freeze 276/276; parity 0/0/24. **Land-ready must be on 7817133.** Fix round rebases onto it; expected after: jest ~5030 (5013 + this branch's +17), e2e 73/77 ok, 0 failed, 4 known-bug, 52/52.
- 2026-10-20 r1 review (B) DONE: LAND-READY for stamina scope; 0 BLOCKER/HIGH/MEDIUM. onEscapeKey sound (bound at construction in 1.1.16 / 1.13.7 / 1.14.4; Obsidian's own modals override it; no sturdier public path). ConditionsModal Escape CONFIRMED in real Obsidian: closes the whole Conditions modal (PRB-06). +17 jest = 15 + 2 auto kit-index hygiene tests.
- Review rulings (owner, 2026-10-20):
  - ConditionsModal combobox (F1): FOLD into r2 per the reviewer's prescription, + e2e scenario + manifest rows.
  - Registry rename to `registerEscapeConsumer` (or similar): FOLD (it no longer only cancels drafts).
  - LOW-1 CHANGELOG overclaim: FOLD.
  - LOW-2 detach() not in afterEach/finally: FOLD.
  - LOW-3 vacuous teardown test: FOLD.
  - INFO e2e pin hides an onEscapeKey rename until the next pin bump: DROP — S06/T12 go red at that bump, which is the right detector.
  - INFO no Escape-target-inside-modal check: DROP — focus trap makes it moot.
  - INFO pool modal draft-first is jest-only (no minion e2e fixture): DROP — jest covers it with the stand-in keymap; adding a minion e2e fixture is out of proportion for this ticket.
- 2026-10-20 r2: fix round = resume implementer A, rebase onto 7817133. Scoped re-review -> reviewer B (did not author fixes).
- 2026-10-20 r2 DONE (A): dse `73e6a80` on 7817133 (9741e41, 1df0aa6 rebased r1; 8bd55e5 Conditions + rename `escapeConsumer.ts` + LOW-2/3; 1121bc6 COND-E01 e2e; 73e6a80 census ids), superproject CHANGELOG `b67a07c`. Gates: jest 5033/1/229 of 230; lifecycle 26/26; e2e 74/78 ok 0 failed 4 known-bug 57/57; shots 572; freeze 276/276; parity 0/0/24. LOW-3 mutation: 3 red.
- 2026-10-20 r2 scoped re-review -> reviewer B (`sc431-brief-r2-rereview.md`).
- 2026-10-20 r2 re-review (B): LAND-READY at dse 73e6a80 / superproject b67a07c. 0 BLOCKER..LOW. INFO-1 stale "draft-first" wording at managedModal.ts:7 / managedModal.test.ts:581 -> DROP (cosmetic; still describes the stepper semantics). INFO-2 superproject worktree based on 2b9b29d vs main b874ac0 -> dispatcher's land-stack handles it.
- 2026-10-20: reported LAND-READY to dispatcher.
- 2026-10-20 dispatcher: NOT landable — SC-455 landed; dse origin/develop 7817133 -> b6b08f3 (src/framework/host/* sidebar write path, lifecycle G-S11, e2e scenarios, both e2e censuses changed); workspace main 8969a34 (CHANGELOG bullet at top of ## Unreleased). New CURRENT at b6b08f3: jest 5242/1/230 of 231; lifecycle 27/27; e2e 80/85 ok 0 failed 5 known-bug 51/51; shots 572 + pressed-toggle parity; freeze 276/276; parity 0/0/24. Land-ready must be on b6b08f3.
- 2026-10-20 r3 (rebase round): resume implementer A — rebase dse onto b6b08f3 and the superproject branch onto origin/main 8969a34, full re-gate. If any conflict in src/ or test/ needed hand resolution, a scoped range-diff check goes to reviewer B.
- 2026-10-20 r3 DONE (A): dse ab34293 on b6b08f3 (5 commits), superproject 7afd315 on origin/main 8969a34 (2 commits); zero conflicts -> no re-review needed (owner ruling). Gates: jest 5262/1/230 of 231; lifecycle 27/27; e2e 83/87 ok 0 failed 4 known-bug 57/57 (51 + our 6); shots 572; freeze 276/276; parity 0/0/24. Reported LAND-READY.
