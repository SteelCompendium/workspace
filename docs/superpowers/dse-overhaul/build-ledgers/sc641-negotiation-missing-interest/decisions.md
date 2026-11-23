# SC-641 decisions ledger — negotiation: missing Interest opens ended; Reset of a current-only block ends it

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest
(superproject 93d78f06; dse branch sc641-negotiation-missing-interest @ 12aaf5b5 = origin/develop).

## Facts (owner survey, 2026-11-14, at dse 12aaf5b5)

- `src/model/NegotiationData.ts:197-198` defaults: Patience 5, Interest 0. Constructor
  (`:214-217`) reads `current_* ?? initial_* ?? default`. `resetData()` (`:326-328`) sets
  `current_* = initial_* ?? default`. `ending()` (`:284-288`): Interest <= 0 is "hostile".
- Writes do not add `initial_*` keys (undeclared defaults are omitted while unchanged,
  `src/elements/shared/undeclaredDefaults.ts`).
- `docs/negotiation-tracker.md:85-86` calls `initial_interest` / `initial_patience` "required".
  Docs examples: I3/P3 (line 18-19), I2/P4 (line 101-102).
- Rulebook (reference/draw-steel-agent-reference.md:856): starting stats by NPC attitude —
  Hostile I1/P2, Suspicious I1/P3, Neutral I2/P3, Friendly I2/P4, Trusting I3/P5.
- Markers to flip: jsdom `test.failing` `[K08]`, `[K09]` in
  `test/dom/elements/negotiation-bugs.test.ts:106,111`; e2e `knownBug('SC-641')` `[NEGO-W06]`,
  `[NEGO-W07]` in `e2e/specs/negotiation/wrong-values.e2e.ts:104,109`. Fixtures
  `e2e/vaults/shipped/Negotiation/minimal.md`, `current-only.md`; `e2e/README.md:154,164`.

## Rulings

- 2026-11-14 — owner: the ticket itself says "Which starting Interest to use is a product
  choice". Asked Scott on the ticket (Q1 default Interest, Q2 Reset target); parked.
- 2026-11-14 — owner: ask posted (body: scratchpad sc641-owner/comment-ask1.md); ticket
  In Progress + Needs Review (verified). Owner picks offered: Q1 a (default Interest 2,
  Patience-less stays 5), Q2 a (Reset falls back to defaults; nothing new written). No
  worker dispatched; awaiting Scott's verbatim ruling.

- 2026-11-22 — **Scott (verbatim, reply to the Q1/Q2 ask; he set `Ready for Agent`):**

  > * interest default: 2
  > * Reset to the defaults

  Owner reading (Fable 5.2 owner, dispatcher session e255a3cd-5cdb-4dc4-83be-b58e80eb1057):
  this is Q1 a + Q2 a as offered in the ask. Q1 a as offered: "Interest 2 ... Patience left
  out stays at 5, as today." Q2 a as offered: "Reset to the defaults from Q1 ... With Q1 a,
  that is Interest 2 / Patience 5, so Reset always lands on a live negotiation. Nothing new
  is written into the note." Also promised in the ask: "the docs page will say what a block
  that leaves these out starts at, and the 4 tests that currently mark this bug become
  ordinary passing tests (2 jsdom, 2 real-Obsidian e2e)."
- 2026-11-22 — owner: dse origin/develop moved 12aaf5b5 -> 3b47e55b (99 commits) since the
  survey; the Facts line numbers above are STALE — workers re-locate by symbol, not line.
- 2026-11-22 — owner: ticket flipped to Awaiting, `Ready for Agent` removed (labels now
  DSE Plugin, Bug; verified in the save response).
- 2026-11-22 — owner ruling: an AUTHORED `initial_interest: 0` / `current_interest: 0` stays
  honoured as written (Reset to an authored `initial_interest: 0` still ends the negotiation).
  The ticket and Scott's ruling cover blocks that LEAVE Interest out; out of scope, not a ticket.
- 2026-11-22 — owner: gate plan (SC-675 precedent): r1 implementer runs tsc, lint, jest, targeted
  negotiation e2e, `styles.css` identity; full lifecycle + full e2e once on the final sha after
  review. Shots / freeze / parity carry only if `styles.css` is byte-identical AND no visual
  fixture leaves Interest out (implementer reports the list; non-empty = stop and return).
  Base numbers at dse `3b47e55b`: jest 13855 / 2 fresh, lifecycle 64/64 (G-S61 = SC-668 flake),
  e2e 658/667 ok, 0 failed, 9 known-bug, 418/418 pairs; shots 592; freeze 280/280; parity 0/0/24.
  Target after the fix: e2e 660/667 ok, 7 known-bug (+ any added tests).

## Rounds

- r1 implementer (orchestration:implementer, agent a195aee038eafa367) dispatched 2026-11-22.
  Brief `sc641-brief-r1-implementer.md`; report `sc641-r1-implementer-report.md`.
- r1 DONE 2026-11-22: dse `227dfc3d` (fix `d7d184e2` + docs), superproject `35983b18` (CHANGELOG).
  jest 13861 / 2 (+6), tsc + lint clean, negotiation e2e 96/96 ok 0 known-bug, `styles.css`
  `18730938…f1f9` (= base prefix; no separate base build). No visual fixture leaves Interest out
  -> shots / freeze / parity carry. Follow-up rulings (owner): (1) plugin `CHANGELOG.md` has no
  Unreleased section -> DROP (the workspace CHANGELOG is the routed home). (2) pre-existing
  mis-indented Dragon example in `docs/negotiation-tracker.md` -> FOLD into the fix round if one
  runs, else DROP (cosmetic, pre-existing).
- r2 reviewer (orchestration:reviewer) dispatched 2026-11-22 on `227dfc3d`. Brief
  `sc641-brief-r2-reviewer.md`; report `sc641-r2-reviewer-report.md`.
- r2 review DONE 2026-11-22 on `227dfc3d`: APPROVE_WITH_FIXES, 0 CRIT / 0 HIGH / 0 MED / 2 LOW /
  5 INFO. Reviewer re-measured: tsc + lint rc 0, jest 13861 / 2, negotiation e2e 96/96,
  `styles.css` `18730938…f1f9` identical base vs head (both built), no visual fixture leaves
  Interest out. Base-fail: K08, K09, K09b, K09c + 5 unit tests fail on base src; NEGO-W06/W07
  fail on base (`ended: "hostile"`). Report `sc641-r2-reviewer-report.md`.
  Owner rulings on findings:
  - LOW-1 (`e2e/README.md:163` says minimal.md has chips; it has none) -> FOLD.
  - LOW-2 (a note saved on base with no interest key, incl. a name-only block played down to
    Interest 0, now reads Interest 2 and is live; follows from the ruling, code cannot tell the
    two apart) -> FOLD as one CHANGELOG sentence (owner wording); stated to Scott in the
    land-ready comment.
  - INFO-1 (CHANGELOG: "no `initial_interest`" too broad; "(SC-641)" twice) -> FOLD.
  - INFO-2 (stale `knownBug` twins pointer in `negotiation-bugs.test.ts:2-3`) -> FOLD.
  - INFO-3 (Reset on quoted `name: "…"` rewrites it unquoted; on base) -> DROP: tracked by SC-599.
  - INFO-4 (`docs/negotiation-tracker.md:133-135` "Reset … clears the banner" untrue when the
    block's own `initial_*` values are an ended state) -> FOLD (one docs sentence).
  - INFO-5 (any write drops YAML comments, reorders keys, empty key -> `null`; on base) -> DROP:
    comments/quotes are SC-599 (Backlog); reorder / null are the same serializer family, no new ticket.
  - r1 follow-up (mis-indented Dragon example in the docs page) -> FOLD if it is an indentation-only fix.
- r3 fix round: implementer a195aee038eafa367 resumed 2026-11-22 with the findings verbatim.
- r3 fix DONE 2026-11-22: dse `7ca7c140`, superproject `38eb1759`. All five folded items done +
  the Dragon example (indentation only). Delta = `docs/negotiation-tracker.md`, `e2e/README.md`,
  `negotiation-bugs.test.ts` header. jest 13861 / 2, tsc + lint clean, `main.js` `93bc0a94…1c9d`
  identical to a `227dfc3d` build, `styles.css` unchanged. Report `sc641-r3-fix-report.md`.
- r4 (fresh orchestration:implementer; not the author): scoped re-review of `227dfc3d..7ca7c140`
  + CHANGELOG, then lifecycle (7 parts) + full e2e on `7ca7c140`. Brief
  `sc641-brief-r4-rereview-final-gates.md`; report `sc641-r4-rereview-final-gates-report.md`.
- 2026-11-22 — dispatcher: SC-434 landed; dse `origin/develop` is now `f42546b8` (was `3b47e55b`;
  CI-only: `.github/workflows/plugin-ci.yml` + `e2e/README.md` +23 lines, no TS/CSS), workspace
  `origin/main` `fab96290`, no new battery baselines. "Rebase onto f42546b8 before reporting
  land-ready." Owner plan: do NOT rebase under the running r4 gates; after r4 returns, r5 =
  rebase `7ca7c140` onto `f42546b8` (both sides touch `e2e/README.md`: possible conflict), then
  tsc / lint / jest + `main.js` (`93bc0a94…1c9d`) and `styles.css` identity, so the r4 lifecycle
  and e2e results carry (SC-675 precedent).
- r4 DONE 2026-11-22 on `7ca7c140` (worktree clean before and after): scoped re-review PASS on
  every line (delta = docs + README + one test header; nothing in `src/`). tsc + lint rc 0, jest
  13861 / 2. Lifecycle **64/64** across all seven parts (21, 16, 9, 4, 7, 4, 3; G-S61 ok, no
  re-run). e2e **`OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`**
  (rc 0, one run; summary lines checked by the owner in the logs; NEGO-W06 / W07 ok). Remaining
  known-bug: SET-G06, SET-L01, SET-L02, SET-L03, COND-C04, COND-N04, COND-N05. Report
  `sc641-r4-rereview-final-gates-report.md`; logs in scratchpad `sc641-r4-gates/`.
- r5 rebase round: implementer a195aee038eafa367 resumed 2026-11-22 — rebase `7ca7c140` onto
  `f42546b8`, range-diff, tsc / lint / jest, `main.js` + `styles.css` identity. Report
  `sc641-r5-rebase-report.md`.
- r5 rebase DONE 2026-11-22: dse `bdf0255e630ead9aedfb2776dfa9dec9469e0cf5` on `f42546b8`
  (fast-forward of origin/develop, verified by the owner). No conflict (`e2e/README.md`
  auto-merged). range-diff: all three commits `=` (`8150d362`, `9ddd7b61`, `bdf0255e`). SC-434's
  README/CI text states no count or known-bug list -> nothing stale. tsc + lint rc 0, jest
  13861 / 2, `main.js` `93bc0a94…1c9d` and `styles.css` `18730938…f1f9` identical -> r4 lifecycle
  64/64 and e2e 660/667 (7 known-bug, 418/418) carry. Superproject worktree `38eb1759`
  (2 CHANGELOG commits on `93d78f06`; pointer unstaged for `wt-finish`; landing rebases it).
  Report `sc641-r5-rebase-report.md`.
- **LAND-READY 2026-11-22.** Comment posted on SC-641 (body `sc641-comment-landready.md`), state
  Awaiting, labels DSE Plugin + Bug. No freeze delta, no rebaseline, no new lifecycle id, no new
  e2e test or pair; e2e known-bug 9 -> 7. For `dse-verify` CURRENT at landing: jest 13861 / 2
  fresh, lifecycle 64/64, e2e 660/667 ok / 0 failed / 7 known-bug / 418/418 pairs, shots 592,
  freeze 280/280, parity 0/0/24. No tickets filed (INFO-3 / INFO-5 covered by SC-599).
- **LANDED 2026-11-22 by the dispatcher:** dse `develop` `bdf0255e` (fast-forward from
  `f42546b8`); workspace `main` merge `d91ea21e`, bookkeeping `8e7a7bbe`. Superproject branch
  rebased onto `origin/main` at landing; `CHANGELOG.md` conflicted only on the Unreleased header
  (SC-675 bullets), both kept. Worktree removed. Ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc641-negotiation-missing-interest/`; `dse-verify`
  CURRENT @ `bdf0255e` added. Owner verified on origin (develop tip, workspace pointer, CHANGELOG).
- **DONE 2026-11-22:** closing comment posted (body `sc641-comment-done.md`), SC-641 -> Done
  (verified). Effort closed.
