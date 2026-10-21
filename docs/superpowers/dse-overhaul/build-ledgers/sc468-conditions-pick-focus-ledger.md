# SC-468 decisions ledger — Conditions modal: keyboard pick keeps focus on the chosen option

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus (dse branch `sc468-conditions-pick-focus`, cut from develop ba20072)

## Scope (from the ticket description, 2026-10-21 — no Scott comments yet)

Ticket text (verbatim): "pressing Enter/Space on a color swatch, a duration chip, or an effect chip saves the
choice, re-renders the list, and then sends keyboard focus to that row's cog button (`focusRowCog` in
`src/views/ConditionsModal.ts`, called from `setColor` ~L401 and the duration/effect setters ~L372/L430)."
"Likely fix: after the re-render, focus the newly pressed option in the same group instead of the cog (fall back
to the cog if it's gone). Check the e2e/lifecycle scenarios that assert focus after a pick."

## Dispatcher constraints (2026-10-21)

- "SC-361 (swatch focus ring, same modal) is parked on Scott with no code yet; SC-356 (parked) restyles
  .dse-optchip — keep SC-468 to focus management, no swatch/chip CSS."

## Owner rulings

- 2026-10-21: Out of scope — any CSS on `.dse-swatch` / `.dse-optchip` (SC-361 / SC-356). Other focusRowCog
  callers (add L257, remove L273) keep their current behaviour unless the implementer shows they hit the same bug.

## Scott rulings

(none yet)

## Base moves

- 2026-10-21: dispatcher — dse develop moved ba20072 -> 84636a9 (SC-460 landed). "Land-ready must be on 84636a9."
  New baselines: jest 5329 / 1 skipped / 230 of 231 suites, lifecycle 28/28; e2e 83/87, 4 known-bug, 57/57;
  freeze 276/276; parity 0/0/24. ~~base ba20072 numbers (jest 5260, lifecycle 27/27)~~ superseded.

## Rounds

- impl-r1 (Sonnet implementer) DONE @ 3fdbe2e on 84636a9: focus re-found by aria-label within role=group; cog fallback;
  data-dse-control ids cond.edit/duration/swatch/effect; e2e COND-E02/E03. Gates: jest 5335/1/230of231, lifecycle 28/28,
  e2e 85/89 0 failed 4 known-bug 63/63, shots 572, freeze 276/276, parity 0/0/24.
- Owner rulings on impl-r1 follow-ups (2026-10-21):
  - "rest of ConditionsModal lacks data-dse-control ids" — drop: SC-431 deliberately kept coverage narrow; not a bug.
  - "custom-colour focus after native change covered by jsdom only" — drop: native colour dialog is not drivable in e2e; jsdom pin suffices.
- review-r1 (Opus reviewer) dispatched on 3fdbe2e.
- 2026-10-21: dispatcher — dse develop moved 84636a9 -> 0267b8a (SC-459: lifecycle G-S8 + a header comment; build
  byte-identical). Baselines unchanged. "Land-ready must be on 0267b8a." ~~Land-ready on 84636a9~~ superseded.
  Owner ruling: do NOT rebase under the running review-r1 (it is running the battery in the shared worktree). After
  review-r1 returns, the rebase onto 0267b8a goes into the fix round (or a standalone rebase round if no fixes), then
  re-run tsc, lint, jest, lifecycle and e2e at the rebased head. Shots, freeze and parity can be skipped only if the
  rebased built main.js is byte-identical to 3fdbe2e's.
- review-r1 (Opus reviewer) LAND-READY @ 3fdbe2e: 0 BLOCKER/HIGH/MED, 2 LOW, 5 INFO; full battery re-run matched; vacuity confirmed.
- Owner rulings on review-r1 (2026-10-21):
  - LOW-1 (ConditionsModal.ts:206 comment says "arrow on"; no arrow handling) — FOLD: change to "Tab on".
  - LOW-2 (no custom-colour cog-fallback test) — FOLD: add it.
  - INFO-1 (custom colour input invisible focus; CSS) — TICKET SC-473 (Backlog, related SC-361/SC-468). Out of scope for SC-468.
  - INFO-2 (dead else branch in setDuration ~L393-395) — DROP: harmless defensive fallback.
  - INFO-3 (option lookup uses first open editor, not editor for `index`) — FOLD: scope the lookup to row `index`.
  - INFO-4 ("own group" test title overclaims) — FOLD: retitle to what it actually pins.
  - INFO-5a (workspace CHANGELOG Unreleased bullet) — FOLD into fix round, in the WORKTREE superproject CHANGELOG.md.
  - INFO-5b (dse-verify CURRENT block) — dispatcher's at landing; numbers go in the land-ready report.
  - INFO-5c (add-dropdown mouse click misses) — TICKET SC-474 (Backlog, related SC-468). Out of scope.
- fix-r1 dispatched to the impl-r1 implementer (SendMessage resume), incl. the rebase onto 0267b8a.
- fix-r1 DONE: dse 3480231 on 0267b8a (9369c06, 6f28b73, 3480231); superproject b475659 (CHANGELOG only). Gates: jest 5336/1/230of231,
  lifecycle 28/28, e2e 85/89 0 failed 4 known-bug 63/63, shots 572, freeze 276/276, parity 0/0/24.
- rereview-r1 (same Opus reviewer, delta only — not the fixer) dispatched.
- rereview-r1 LAND-READY at dse 3480231 on 0267b8a, superproject b475659; 0 findings; tsc/lint/jest 5336 re-run; vacuity re-confirmed.
- LAND-READY reported to dispatcher 2026-10-21.
