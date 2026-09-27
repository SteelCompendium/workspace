# SC-236 decisions ledger — feature/example.yaml false villain action

Effort: sc236-feature-example · worktree /home/scott/code/steelCompendium/worktrees/sc236-feature-example
DSE branch `sc236-feature-example`, cut at origin/develop 6c4f6aa (2026-09-24).

## Scott's rulings (verbatim, dated)

- 2026-09-25 18:41 UTC, SC-236 comment `b4241ded-df6c-450d-8de9-2d56d923f8e5`, Scott, verbatim:
  "Option A is good."
  Replying to the owner ask (comment 88b8f1e9, 2026-09-25 03:41 UTC): "pick option A or B … and
  if A, reply "sanctioned" for its 8-line print-freeze rebaseline." Owner reading: Scott chose A;
  A cannot exist without its 8 moved print lines (the ask stated every option moves them), so his
  affirmative choice of A is the written sanction for exactly that 8-line set
  (feature, feature-collapsed, feature-spend, chrome-collapsed-rollout × steel-print/realprint).
  It covers that set only: if the rebase changes WHICH lines move, that is a new ask.

## Operating constraints (dispatcher session rules, 2026-09-24 — not Scott rulings)

- Scott away. Anything needing his eye (visual change, pixel/taste call, freeze-rebaseline
  sanction) goes in ONE consolidated Needs Review ask.
- No tags/releases/RCs on draw-steel-elements. Never touch DSE `main` (tracks `develop`).
  No `just deploy*`. No freeze-baseline change without Scott's written sanction on the ticket.
- Freeze baseline 260 lines. Kill processes only by PID whose cmdline contains this
  worktree's path (adapter footgun 8.9).
- Owner does not land; reports LAND-READY or PARKED-NEEDS-REVIEW to the dispatcher.

## Owner notes

- 2026-09-24: ticket text predates SC-144 (legacy theme retired). The `feature--legacy-*`
  shots it names no longer exist; the frozen class is now `*--steel-print.png` +
  `*--steel-realprint.png` only (includes `feature--steel-print.png`,
  `feature--steel-realprint.png`). Freeze cost of each option must be re-measured.
- Round 1 = evidence/survey round (implementer): measure every candidate edit's freeze + visual
  impact before any call is made.
- 2026-09-24 (r1 partial, V1 measured): `ability_type` is RENDERED — a header chip reading
  "VILLAIN ACTION 1" under the Malice cost chip. So every candidate edit changes visible
  content and moves frozen print bytes (V1 = 6 lines: feature, feature-collapsed,
  chrome-collapsed-rollout × print/realprint). The ticket's "option (b) has no freeze impact"
  no longer holds (the chip text would change). => any fix needs Scott's rebaseline sanction;
  this effort ends PARKED-NEEDS-REVIEW with an option set.
- r1 worker was killed by a session 429 at ~19:15, resumed via SendMessage.

## Owner decisions after r1 (2026-09-24) — pending Scott's pick + sanction

r1 result (sc236-r1-report.md): V1 (delete ability_type), V2 (`Main Action 1`), V3 (genuine
villain: `usage: '-'`, trigger removed) ALL move the same 6 frozen lines
(feature, feature-collapsed, chrome-collapsed-rollout × steel-print/realprint) and all fail the
content pin test/dom/elements/feature.test.ts:536-550 (which pins the contradiction literally).
Corpus: real Malice-cost monster main actions carry NO ability_type; `Main Action 1` and
`Villain Action N` never occur as ability_type values (villain actions carry
`cost: Villain Action N` + `usage: '-'`, which actionTypeOf already handles via isVillainCost).

- OWNER RECOMMENDATION: V1 (delete the `ability_type: Villain Action 1` line). The scaffold
  becomes exactly the corpus shape of a Malice-cost monster main action; visible change = the
  "VILLAIN ACTION 1" header chip disappears, crest/spine unchanged. V2 rejected as recommendation
  (invented value). V3 offered as the alternative (visibly different card: skull crest,
  villain accent, no Main-action row, no Trigger row).
- Build V1 now on the branch (fully gated + reviewed) so Scott's pick+sanction lands it directly.
- r1 follow-up 1 (featureSpend is a hand-copied duplicate of example.yaml, entry.ts:237-260):
  FOLD into r2 — derive featureSpend from featureDefault (like featureCollapsed) so it tracks the
  fix; its extra frozen lines (feature-spend × print/realprint) join the rebaseline ask.
- r1 follow-up 2 (chrome-collapsed-rollout is an indirect consumer): DROP — informational, now
  recorded here; r2 re-measures freeze rather than assuming.
- r1 follow-up 3 (V3's leftover `cost: 5 Malice`): DROP for now — only relevant if Scott picks V3;
  that round would use `cost: Villain Action 1` per corpus shape.

## r3 review (2026-09-24): CHANGES-REQUIRED, 0 CRIT/0 HIGH/3 MED/2 LOW/6 INFO — owner rulings
Review: sc236-r3-review.md. Battery re-measured identical; rebaseline.txt (8 lines) verified.
- MED-1 renderFeature.ts:126-128 false corpus claim: FOLD (r4).
- MED-2 entry.ts:267-273 false "no fixture exercises ability_type rung" + wrong pointer: FOLD (r4).
- MED-3 docs/Media/feature.png still shows the chip: FOLD (r4) — regenerate via docs-shots --only;
  if regeneration drags in unrelated changes, stop and report instead of committing them.
- LOW entry.ts:238-240 describes a drift that never happened: FOLD.
- LOW entry.ts:294, :779 still call featureSpend a hand-written literal: FOLD.
- INFO CRLF: guard throws on a CRLF checkout: FOLD (make guard line-ending agnostic; tiny).
- INFO realprint crop reads better than print twin: FOLD (evidence only).
- Other INFO: drop (informational).
Fix round → r2 implementer (author); scoped re-review → r3 reviewer (not the author).

## r5 scoped re-review (2026-09-24): APPROVE at DSE 5cd09e1
All 6 r3 items fixed and re-proven. Freeze: same 8 mismatches, == rebaseline.txt, applied-to-copy → 260/260.
- Nit entry.ts:270 "same shape MINUS usage" referent unclear: DROP (optional comment reword, non-blocking).
- Docs image grows ~260px from develop design drift since SC-152, not this change: disclosed in the ask.
Branch ready; parked on Scott: pick A vs B + sanction the 8-line rebaseline (A).

## 2026-09-27 resume
Dispatcher: origin/develop now 1adfe29 (SC-282/340/243/230 landed; SC-272 landing on top — fetch
right before rebase). Freeze baseline 260 lines, unchanged since SC-328. obsidian-lifecycle now 19
scenarios. Owner model is Opus 5.5 → post with `--model opus-5.5`.
r6 = rebase onto latest origin/develop + full battery + recompute/verify rebaseline.txt.
- 2026-09-27 r6 DONE: rebased onto origin/develop 36635e9 (re-fetched, unmoved). DSE HEAD ade5064
  (2614023, 282e02d, 8ed6be0, ade5064). Only conflict CHANGELOG (bullet placed top of Unreleased) —
  mechanical, no re-review needed. Battery: jest 4100 passed/1 skipped, lifecycle 19/19, shots
  524/0 FAIL, freeze exactly the 8 sanctioned mismatches with hashes == rebaseline.txt (unchanged,
  8 lines), parity 0/0/16. Docs image regenerated byte-identical. → LAND-READY.
