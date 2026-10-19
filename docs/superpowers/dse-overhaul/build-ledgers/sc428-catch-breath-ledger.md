# SC-428 decisions ledger — Catch Breath at full Stamina / popover never disabled

Ticket: https://linear.app/tski-home/issue/SC-428
Worktree: /home/scott/code/steelCompendium/worktrees/sc428-catch-breath (every submodule on branch `sc428-catch-breath`)
DSE tracked branch: `develop` — base `7644fb3` at dispatch (2026-10-19)

## Scott rulings (verbatim, dated)

_None yet._ The ticket description (filed from the SC-408 survey) is the spec. Thread had 0 comments at 2026-10-19.

## Spec (ticket description, verbatim)

1. **Catch Breath at full Stamina spends a Recovery for +0 (medium; a wrong number is persisted, softened by the undo toast).** 48/48 with 6 Recoveries: the button is enabled, a click writes `recoveries: 5`, Stamina stays 48. The stamina modal's Spend Recovery button is correctly disabled in exactly this state ("Already at maximum Stamina", SC-133 I3). Cause: `src/elements/stamina-bar/view.ts:196` and `src/elements/hero/view.ts:426` gate only on `dying || remaining <= 0`. Fix: also disable when `recoveryHealAmount(...) <= 0`, with a reason tooltip.
2. **The Recoveries popover's "Catch breath" button is never disabled (low).** At 0 Recoveries or while dying it is a silent no-op (the view's defensive return protects the data). `src/framework/kit/RecoveriesStrip.ts:196-201`. Fix: disable with a reason, matching the house rule that a control never silently does nothing.
3. **Recovery value 0 (max Stamina ≤ 2) shows the wrong reason (low).** Spend Recovery says "Already at maximum Stamina" regardless of current Stamina. Acknowledged in a doc note in `StaminaEditModal.ts` (~640-643); the reason text should say the recovery value is 0.
4. **Clicking a Recoveries marker leaves keyboard focus off the marker row (low, accessibility).** Found in real Obsidian by the SC-408 e2e pilot. After a click on a marker, Tab/arrow navigation does not continue from that marker.

## Owner rulings (2026-10-19)

- All four items are in scope for this ticket (one effort, one branch).
- Existing known-bug markers for SC-428 must be flipped to passing tests (jest `test.failing` in stamina-entry-points-matrix, stamina-recoveries-matrix, stamina-edit-modal-matrix; e2e `knownBug('SC-428')` x2 in e2e/specs/stamina-bar/stamina-recoveries.e2e.ts). Expected e2e after fix: 0 failed, known-bug count 11 -> 9.
- Disabled-reason wording: one shared source of truth for each reason across strip button, popover button and modal Spend Recovery (no divergent strings).

## Rounds / authorship
- 2026-10-19 r1 implementation: orchestration:implementer agent a700745d2d93ac63a (brief sc428-brief-impl.md, report sc428-impl-r1-report.md). This identity never reviews.
- 2026-10-19 base moved: dse origin/develop 7644fb3 -> f8e050f (SC-324: iconButton label is the hover tooltip; disabled Spend Recovery / read-only Catch Breath keep the button name before the reason; touches StaminaEditModal.ts + RecoveriesStrip.ts; SC-428 Q16 known-bug assertion now `.not.toContain`). Workspace main ada7173. New baselines: jest 4767 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 61/72 ok, 0 failed, 11 known-bug, coverage 47/47 · shots 572 · freeze 276/276 · parity 0/0/24 DECLARED. Implementer told to rebase onto f8e050f and follow SC-324's name-then-reason pattern.
- 2026-10-19 base moved again: dse origin/develop f8e050f -> a89ffd9 (SC-426, initiative view.ts only). Workspace main f7902f9. Baselines: jest 4769 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 62/72 ok, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Expected after SC-428: e2e 64/72 ok, 0 failed, 8 known-bug. Land-ready must be on a89ffd9.
- 2026-10-19 base moved again: a89ffd9 -> c78a06b (SC-290, fenceLine.ts). Workspace main 9b8fcb0. Baselines: jest 4787 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Expected after SC-428: e2e 65/73 ok, 0 failed, 8 known-bug. Land-ready must be on c78a06b.
- 2026-10-19 implementer hit API session limit mid-round; resumed via SendMessage (same identity).
- 2026-10-19 r1 DONE: dse head 138f23a on c78a06b; superproject CHANGELOG 0147822. Gates: jest 4804/1/227 of 228 · lifecycle 25/25 · e2e 66/74 ok, 0 failed, 8 known-bug, 49/49 · shots 572 0 FAIL · freeze 276/276 · parity 0/0/24. No shot changed, no rebaseline.
- Follow-up rulings (owner, 2026-10-19): (a) click-shield blocks click-focus on other roving-tabindex widgets (track slots, powerRollPanel rows, tabs) -> file Backlog ticket. (b) unresolved-max-Stamina hero shows "Already at maximum Stamina" -> reviewer to assess; fold into fix round if small.
- 2026-10-19 r1 review: orchestration:reviewer (brief sc428-brief-review.md).
- 2026-10-19 filed SC-458 (Backlog, related SC-428) for follow-up (a): click shield blocks click-focus on other roving-tabindex widgets. OUT OF SCOPE for SC-428 fix rounds.
- 2026-10-19 base moved again: c78a06b -> 8ab5e91 (SC-429, MinionStaminaPoolModal; no SC-428 files expected). Workspace main af33778. Baselines: jest 4806 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Fix round rebases onto it; expected after SC-428: jest >= 4823 (4806 + 17 SC-428 tests), e2e 66/74 ok, 0 failed, 8 known-bug, 49/49. Land-ready must be on 8ab5e91 (or later).
- 2026-10-19 r1 review verdict FIX-FIRST (0 BLOCKER/0 HIGH, 2 MEDIUM, 2 LOW). Report sc428-review-r1-report.md; validated diff evidence/review-r1/validated-fix.diff.
- Owner rulings on r1 findings (2026-10-19):
  - MEDIUM-1 (keyboard Catch Breath heals to full -> button disables while focused -> focus drops to body): FOLD. Move focus to the marker row (preventScroll) when the focused button becomes disabled.
  - MEDIUM-2 (mouse click on a marker now shows the focus ring, persisting through the write): FOLD option (b) — click focus uses focusVisible:false and adoptView remembers/restores whether the ring was showing. Rationale: standard :focus-visible semantics (mouse clicks don't draw a ring); not a taste call for Scott. Lifecycle is mandatory (it is anyway).
  - LOW-1 (unresolved recovery value shows "Recovery value is 0"): FOLD. Shared REASON_RECOVERY_VALUE_UNKNOWN, used by hero catch-breath AND the modal (consistency), + tests.
  - LOW-2 (overclaiming tests): FOLD. stamina-recoveries-matrix :84 asserts no write at all; :194 retitled to what jsdom proves (e2e RECOV-R10 is the re-render proof).
  - INFO Respite inline `Respite: ${READ_ONLY_TOOLTIP}` (hero/view.ts:210): FOLD via labelWithReason.
  - INFO pre-existing: keyboard-pressing the popover's "Catch breath" closes the popover and loses focus (RecoveriesStrip.ts:220): FOLD — return focus to the popover trigger (or row) on close; same widget, same a11y item.
  - Rebase dse onto 8ab5e91; rebase superproject worktree branch onto origin/main af33778 keeping BOTH Unreleased bullets.
- 2026-10-19 r2 fix round: implementer a700745d2d93ac63a (resumed). Scoped re-review: reviewer a3598313d6627a3cb (delta only).
- 2026-10-19 base moved again: 8ab5e91 -> f818002 (SC-260, ReadingModeBlockHost scroll pin). Workspace main 0b1ec6f. Baselines: jest 4810 / 1 / 227 of 228 · lifecycle 25/25 · e2e 63/73, 0 failed, 10 known-bug, 47/47 · shots 572 · freeze 276/276 · parity 0/0/24. Land-ready must be on f818002. r2 implementer told.
- 2026-10-19 r2 DONE: dse e7d869c on f818002 (r2 delta = 8e7e404..e7d869c); superproject b4243d4 on 0b1ec6f. Gates: jest 4840/1/227 of 228 · lifecycle 25/25 · e2e 68/76 ok, 0 failed, 8 known-bug, 51/51 · shots 572 · freeze 276/276 · parity 0/0/24. LOW-1 wording: 'Max Stamina unknown'. Scoped re-review dispatched to reviewer a3598313d6627a3cb.
- 2026-10-19 relay: SC-453 worker rm -rf'd /tmp/dse-obsidian-lifecycle-* ~14:35-14:45. Our r2 final lifecycle finished 14:40 with rc 0, 25/25 — unaffected. Reviewer warned to treat a missing-vault failure as environmental.
- 2026-10-19 r2 re-review verdict LAND (0 B/H/M/L, 3 INFO). Rulings: INFO-1 (inactive-window adoption ring) DROP — untestable headless, worst case the ring returns on next Tab. INFO-2 (stamina-recoveries-matrix test title claims keyboard path not suppressed, unasserted) FOLD — retitle. INFO-3 (superproject CHANGELOG "keyboard Catch Breath ... keep focus on the row" only true when the press disables the button) FOLD — reword. Text-only round r3 by implementer; owner checks the diff is text-only + jest.
- 2026-10-19 r3 text-only: dse 9ed8dc6 (test retitle), superproject 30de11b (CHANGELOG reword); owner verified diffs text-only; jest file 35/35. LAND-READY: dse sc428-catch-breath @ 9ed8dc6 on f818002; superproject @ 30de11b on 0b1ec6f (origin/main now a3e0721, no CHANGELOG changes in between). Land-ready comment posted to SC-428. Reported to dispatcher.
