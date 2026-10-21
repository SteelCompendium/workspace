# SC-474 decisions ledger — Conditions modal: with the Add dropdown open, a mouse click on a row's cog or swatch can miss

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click (superproject 7d75896; dse branch
`sc474-conditions-dropdown-click`, cut from develop 3480231)

## Scope (ticket description, 2026-10-21 — filed by the SC-468 owner; no Scott comments)

Verbatim: "With the \"Add condition\" dropdown open, clicking a row's cog or a colour swatch sometimes does nothing: the
dropdown collapses on mousedown, the modal shrinks and re-centres, and the mouseup lands somewhere else, so the click
misses its target."
"Seen in real Obsidian 1.14.4 while writing `e2e/specs/initiative/conditions-pick-focus.e2e.ts` (the spec works around
it; see the note at L25-26). Likely fix: collapse the dropdown on click rather than mousedown, or keep the modal's
height/position fixed while it collapses."

## Dispatcher constraints (2026-10-21)

- "SC-361 (swatch focus CSS) and SC-356 (option-chip CSS) are parked on Scott on the same modal — no swatch/chip CSS here."
- Land-ready on dse develop 3480231 (baselines = dse-verify CURRENT block at 3480231).

## Owner rulings

- 2026-10-21: Prefer a behaviour-only fix (defer the outside-close until the click/mouseup completes) over a layout/CSS
  fix (overlaying the menu or pinning the modal height). Reason: no freeze/visual delta, no taste call for Scott, and it
  keeps SC-186 HIGH-2's guarantees (mouse pick on a menu item still works; click-away still closes; no focusout
  dependency). A CSS/layout route only if the implementer shows the behaviour route cannot work — then STOP and report
  (it would need Scott's eye). No CSS on `.dse-swatch` / `.dse-optchip` under any route.
- 2026-10-21: The e2e workaround at `conditions-pick-focus.e2e.ts` L25-26 should go once the fix lands (or a new e2e
  scenario must pin the mouse-click-with-dropdown-open path for both cog and swatch, failing before the fix).

## Scott rulings

(none yet)

## Base moves

- 2026-10-21: base dse develop 3480231. Baselines: tsc/lint clean; jest 5336 / 1 skipped / 230 of 231; lifecycle 28/28;
  e2e 85/89 ok, 0 failed, 4 known-bug, 63/63 pairs; shots 572 0 FAIL; freeze 276/276; parity 0/0/24 DECLARED.

## Rounds

- impl-r1 (Sonnet implementer) dispatched 2026-10-21 — brief sc474-brief-impl-r1.md.
- impl-r1 DONE: dse 8af4f9a on 3480231 (cedd6b6, ab701ff, 8af4f9a); superproject da932cd (CHANGELOG). Mechanism: outside
  primary mousedown arms the close; collapse on document capture-phase click; 0 ms timer on mouseup for drag-without-click;
  right/middle close at once. New e2e COND-E04 (cog) / COND-E05 (swatch) fail 2/2 on unfixed code; SC-468 spec Escape
  workaround removed. Gates: jest 5343/1/230of231, lifecycle 28/28, e2e 87/91 0 failed 4 known-bug 63/63, shots 572,
  freeze 276/276, parity 0/0/24.
- Owner ruling on impl-r1 observation (2026-10-21): "drag that begins inside the add control and ends outside never
  closes the dropdown" — DROP: pre-existing, unchanged, and a later click-away closes it.
- review-r1 (Opus reviewer) dispatched on 8af4f9a / da932cd.
- 2026-10-21 ~06:44Z: review-r1 and owner killed by session-limit 429; review-r1 resumed via SendMessage after reset (state-consistency check first). dse develop still 3480231.
## Base moves (cont.)
- 2026-10-21: dispatcher — dse develop moved 3480231 -> c03db7a (SC-456, test-only: e2e note-integrity check compares
  every fence's full opening/closing lines byte for byte; e2e/driver/noteFences.ts, invariants.ts, dse.ts,
  test/mocks/obsidian-core.ts). New baselines: jest 5374 / 1 skipped / 231 of 232 (fresh 5373/2), lifecycle 28/28,
  e2e 85/89 4 known-bug 63/63, freeze 276/276, parity 0/0/24. "Land-ready must be on c03db7a." ~~Land-ready on 3480231~~ superseded.
  Owner ruling: do NOT rebase under the running review-r1. After it returns, the rebase onto c03db7a goes into the fix
  round (or a standalone rebase round if no fixes); re-run tsc, lint, jest, lifecycle and e2e at the rebased head
  (expected jest 5381 / 1 / 231 of 232, e2e 87/91 0 failed 4 known-bug 63/63 — COND-E04/E05 must pass SC-456's stricter
  integrity check). Shots, freeze and parity may be skipped only if the rebased built main.js/styles.css are
  byte-identical to 8af4f9a's.
- review-r1 (Opus reviewer) FIX-REQUIRED @ 8af4f9a: 1 HIGH, 0 MED, 1 LOW, 3 INFO; battery matched; vacuity 4/7 jsdom + COND-E04/E05 fail on revert.
- Owner rulings on review-r1 (2026-10-21):
  - HIGH-1 (click-time close steals focus from a focusable target, e.g. icon search / custom colour input) — FOLD, prescribed fix.
  - LOW-1 (mouseup timer reads activeDocument at event time) — FOLD: capture doc once in onOpen.
  - INFO-1 (armed close survives a keyboard click while a press is held) — DROP: end state no worse than pre-fix; no arm outlives its gesture.
  - INFO-2 (click-away now focuses "+ Add" instead of body) — KEEP as is (improvement); HIGH-1 fix must preserve it.
  - INFO-3 (3 of 7 jsdom tests are non-regression pins) — DROP: fine as shipped.
- fix-r1 dispatched to the impl-r1 implementer (SendMessage resume), incl. the rebase onto c03db7a. Brief sc474-brief-fix-r1.md.
- fix-r1 DONE: dse e31e1a0 on c03db7a (rebased 1d39689, 4cf7e6c, 349d115; ec53f17 HIGH-1/LOW-1 + cond.icon-search id/manifest row;
  e31e1a0 COND-E06); superproject da932cd unchanged. Pre-fix rebased build byte-identical to 8af4f9a. Gates: jest 5384/1/231of232,
  lifecycle 28/28, e2e 88/92 0 failed 4 known-bug 64/64, shots 572, freeze 276/276, parity 0/0/24.
- rereview-r1 (review-r1 reviewer, delta only — not the fixer) dispatched.
- rereview-r1 LAND-READY at dse e31e1a0 on c03db7a, superproject da932cd; 0 findings; tsc/lint/jest 5384/e2e 88/92 64/64 re-run; HIGH-1 vacuity confirmed.
- LAND-READY reported to dispatcher 2026-10-21.
