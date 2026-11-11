# SC-575 decisions ledger — Reset encounter leaves a minion squad's action pips pressed

Worktree: /home/scott/code/steelCompendium/worktrees/sc575-reset-squad-pips (branch `sc575-reset-squad-pips` in every submodule)
Cut from: dse develop `fbaba3da`, workspace main `9bb80e4b` (2026-11-10)

## Scott rulings (verbatim, dated)

- 2026-11-10 (via dispatcher): Scott activated the DSE 7.0.0 project's Backlog for work. No ticket-specific rulings yet. The ticket thread has no comments.

## Owner scope decisions (not Scott rulings)

- 2026-11-10: Pure data bug, no user-visible design choice, so no Scott ask is needed before the fix. The squad's shared `creatureType.actions` (type `SquadActions`, EncounterData.ts:112) must be cleared by `resetEncounter` (EncounterData.ts:622). The two known-bug markers citing SC-575 are flipped to normal passing tests: `e2e/specs/initiative/reset-encounter.e2e.ts:102` (`knownBug('SC-575', '[INIT-X07] …')`) and `test/dom/elements/initiative-matrix.test.ts:858` (`test.failing('[X07] …')`). The e2e known-bug count drops 9 → 8.
- 2026-11-10: In scope: any OTHER persisted per-encounter runtime field that `resetEncounter` misses on the same squad/creature path, if the implementer finds one (report it; fold if it is one line in the same function). `resetRound` / `advanceRound` (src/elements/initiative/model.ts:421-490): check that they clear squad shared actions too; if they do not, report it — the owner rules fold vs ticket.
- Out of scope: SC-577, SC-578, SC-588, SC-589 (other initiative tickets), SC-480, SC-572 (running alongside).

## Owner rulings on r1 extras (2026-11-11)

- r1 follow-up 1 (reset does not undo runtime captain promotion; EncounterData.ts:443-456): **already ticketed as SC-590** ("should Reset encounter undo a captain promoted mid-fight?", Backlog). Out of scope here.
- r1 follow-up 2 (resetRound/advanceRound): no gap. They clear squad actions via clearTurnState (model.ts:421-445). Reviewer verifies.
- r1 drive-bys (renamed a jest describe, removed an unused helper and an unused import): accepted.
- r1 CHANGELOG `[FIX]` bullet under 7.0.0 in the plugin CHANGELOG: accepted, pending reviewer check.
- r1 commit has no co-author trailer: correct, because Scott's global CLAUDE.md overrides the harness reminder.
- G-S59 red ×2 under loadavg 14-28, then green alone: the reviewer re-runs it.
- dse-verify number proposal: sc575-skill-proposal.md (for the dispatcher at landing).

## Base move (2026-11-11, via dispatcher)

- SC-480 landed: dse develop is now `eeed5182` (was `fbaba3da`). It changes the card-write fallback path (a click whose block was deleted is never saved into an identical twin) and adds lifecycle G-S73.
- New CURRENT at eeed5182: jest 7076 non-skipped (7074/2 in a fresh worktree, plus 2 SC-568 timeouts that pass alone); lifecycle 53/53; e2e 251/260 ok, 0 failed, 9 known-bug, 161/161. Shots 592, host-leak 163/978, capture clip 147, freeze 280/280 and parity 0/0/24 carry over.
- Lifecycle part 5 is now `G-S59 G-S49 G-S73` (3 scenarios; 266 s). G-S56 stays last in part 4.
- Dispatcher: "Rebase onto eeed5182 before you report land-ready."
- Plan: r2 reviews bcb015de against the old base, unchanged (told so, and told not to rebase). After r2 and any fix round, a rebase round onto eeed5182 re-runs the full battery. Expected after it: jest ≥7079 non-skipped, lifecycle 53/53, e2e 252/260 0 failed 8 known-bug 161/161. The rest carries over.

## Base move 2 (2026-11-11, via dispatcher)

- SC-572 landed: dse develop is now `a339e7b3` (was `eeed5182`). It changes the minion pool modal (condition icons become "Remove <condition>" buttons; keyboard focus handling) and adds e2e POOL-C05/C06.
- New CURRENT at a339e7b3: jest 7082/1 (a worktree with the shots CSS cache); lifecycle 53/53; e2e `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`. Shots 592, host-leak 163/978, modal host-leak 39 kinds / 234 comparisons, capture clip 147, freeze 280/280, parity 0/0/24.
- Dispatcher: "Rebase onto a339e7b3 before you report land-ready."
- Expected after rebasing this branch: jest 7085/1 (+3), lifecycle 53/53, e2e `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`. The rest is unchanged.
- Plan: r4 re-review continues on the eeed5182 heads (told not to rebase). Then r5 rebases onto a339e7b3 and runs the full battery. If r5 rebases with no conflict outside the CHANGELOG, the owner checks `git range-diff` itself, which is a mechanical identity check, not a code review. Any other conflict goes to a reviewer.

## Owner rulings on r2 findings (2026-11-11) — r2 verdict LAND-READY, 0 HIGH / 0 MED / 2 LOW / 4 INFO

- LOW-1 (model.ts:27-28 header comment says enemy-side `actions` "dies with the instances it lives on" — false for squad pips): **fold** into r3.
- LOW-2 (plugin CHANGELOG.md:30-31 "second Move" → "Second move", the button label at view.ts:978): **fold** into r3.
- INFO-1 (hand-written `actions` on a non-minion creature survives Reset encounter; nothing writes or shows it): **drop** — no writer, no display, no user-visible effect.
- INFO-2 (e2e INIT-X07 asserts the note only): **fold** — also assert no pressed `init.detail.squad-action` on screen after Reset.
- INFO-3 (workspace CHANGELOG `## Unreleased` lacks an SC-575 bullet): **fold** — user-facing fix, the routing table requires it. Goes in the WORKTREE superproject's CHANGELOG.md.
- INFO-4 (base moved): handled by the r3 rebase.
- G-S59: green twice under load in r2, so r1's reds were load.

## Owner rulings on r4 (2026-11-11) — r4 verdict LAND-READY, 0 HIGH / 0 MED / 1 LOW / 1 INFO

- LOW-1 (the worktree superproject branch is cut from 9bb80e4b; origin/main has since added SC-480's bullet at the top of `## Unreleased`, so `776f7fad` conflicts in CHANGELOG.md at landing): **fold into r5**. Rebase the worktree superproject branch onto origin/main, keep both bullets, and leave the dse pointer unstaged.
- INFO-1 (base moved to a339e7b3; SC-572's known-bug marker goes away): handled by r5. Expected numbers are in "Base move 2".

## Rounds

| Round | Role | Agent | Report |
|---|---|---|---|
| r1 | implementer (Sonnet) | a04a8b544a54e9c4c | sc575-r1-implementer-report.md (brief: sc575-brief-r1-implementer.md) — DONE `bcb015de`, e2e 252/260 0 failed 8 known-bug 161/161 |
| r2 | reviewer (Opus) — different identity from r1 | a86fb519d4d8f1584 | sc575-r2-review-report.md (brief: sc575-brief-r2-reviewer.md) — LAND-READY, 2 LOW / 4 INFO |
| r3 | implementer (Sonnet, r1 identity resumed) — folds + rebase onto eeed5182 + full battery | a04a8b544a54e9c4c | sc575-r3-rebase-report.md — DONE plugin `3609e3e9`, superproject `776f7fad`; jest 7080/1, lifecycle 53/53, e2e 252/260 0F 8KB 161/161, shots 592 163/978 147, freeze 280/280, parity 0/0/24 |
| r4 | scoped re-review of the r3 delta (reviewer, not an author) | a86fb519d4d8f1584 | sc575-r4-rereview-report.md — LAND-READY, range-diff clean, 1 LOW (superproject CHANGELOG conflict) |
| r5 | implementer (r1 identity) — rebase onto a339e7b3 + superproject rebase + full battery | a04a8b544a54e9c4c | sc575-r5-rebase-report.md — DONE plugin `734d7745` (af86ec28 fix + 734d7745 folds) on a339e7b3, no conflict; superproject `ed94416f` on origin/main `b25d1a17`; jest 7085/1, lifecycle 53/53, e2e 255/262 0F 7KB 163/163, shots 592 163/978 modal 39/234 147, freeze 280/280, parity 0/0/24. Owner range-diff: both commits `=`. **LAND-READY 2026-11-11.** |
