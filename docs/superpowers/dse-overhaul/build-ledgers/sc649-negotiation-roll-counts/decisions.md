# SC-649 decisions ledger — negotiation power roll counts what the card does not show

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc649-negotiation-roll-counts
(branch `sc649-negotiation-roll-counts` in every submodule), cut from dse develop `09c879f2`,
superproject at workspace origin/main `7219b96d`.

## Ticket contract (from the ticket description, 2026-11-14)

> **Expected:** the tiers and Complete Argument use exactly what the card shows as chosen.

Case 1: a `motivationsUsed` / `pitfallsUsed` entry naming a motivation / pitfall the block no
longer has. Case 2: `reusedMotivation: true` with no spent motivation appealed to (the Reuse box
is drawn unchecked and greyed out).

Markers to flip: `test/dom/elements/negotiation-bugs.test.ts` K11, K12, K13 (`test.failing`,
`[known bug SC-649]`). No e2e knownBug markers exist for SC-649.

## Scott's rulings

(none yet — the ticket states the expected behaviour; no decision needed from Scott)

## Owner rulings (2026-11-14)

1. **Drop the hidden entry from the roll; do not invent UI for it.** "What the card shows as
   chosen" = the pressed motivation chips (entries of `motivationsUsed` that name a motivation the
   block has), the pressed pitfall chips (same for pitfalls), and the Reuse box as drawn
   (`argumentReusesMotivation() && reusedMotivation`). The roll tiers, the Same Argument box's
   disabled state ("not while a Motivation is appealed to"), and Complete Argument all derive from
   that, from ONE model-level source (NegotiationData / CurrentArgument), not from the raw lists.
2. **Do not rewrite the user's YAML on render.** The stray entry / raw flag stays in the file
   until the user's own action (a chip toggle, Complete, Reset) writes the argument, consistent
   with SC-637/SC-638 (keep what the user typed). If the user later restores the motivation's
   name, the chip shows pressed again and the roll counts it — consistent with the contract.
3. Scope fence: SC-640 (duplicate / nameless motivation chips), SC-641 (defaults, Reset), SC-639
   (Reset focus) and SC-648 (options menu position) are NOT this ticket. If the fix touches
   name-based matching of chosen motivations, note the SC-640 interaction in the report.
4. Evidence: jsdom K11–K13 flip to plain tests; add jsdom tests for Complete Argument's Interest /
   Patience and the Same Argument disabled state under Case 1, and Complete under Case 2; add ONE
   e2e scenario (new global id, e.g. `NEGO-A14` after grep) driving Case 1 in real Obsidian.

## Rounds

- R1 implementer — brief `sc649-r1-brief.md`, report `sc649-r1-report.md`.

## Baseline moves

- 2026-11-14 (dispatcher): SC-629 landed. dse develop is now `3e88b3f5`, workspace main `dc16b57d`.
  Rebase onto `3e88b3f5`. New baseline: jest 13325 passed / 2 skipped fresh (13326 / 1 with shots cache) ·
  lifecycle 64/64 · e2e `592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs` · shots 592,
  host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Expected after SC-649 (+1 e2e scenario): e2e `593/609 ok, 0 failed, 16 known-bug, coverage: Y/Y`.
  Land-ready requires: superproject branch on current workspace main, a CHANGELOG commit (bullet under
  `## Unreleased`) and ONE pointer bump, no interim pointer commits.

## R1 result (2026-11-14)

Implementer DONE at plugin `8df960e3` (on `3e88b3f5`): `8507ac71` fix, `8df960e3` e2e NEGO-A14. Gates on the
rebased head: jest 13331 / 1 (shots cache), lifecycle 64/64, e2e `593/609 ok, 0 failed, 16 known-bug,
coverage: 416/416 pairs`, shots 592 / 163/978 / 40/240 / 147, freeze 280/280, parity 0/0/24. SC-640
interaction: none (name matching unchanged).

Follow-up rulings:
- "negotiation-bugs.test.ts header still says 'filed bugs as test.failing'" — DROP: the file still holds 7
  `test.failing` markers for other tickets, so the header is still accurate.
- "a stale `sameArgumentUsed: true` stays checked but disabled while a motivation is appealed" — HELD for the
  R2 review (the brief already probes ghost motivation + `sameArgumentUsed: true`); rule after review.

- R2 reviewer (Opus) — brief `sc649-r2-review-brief.md`, report `sc649-r2-review.md`.

## Baseline moves (2)

- 2026-11-14 (dispatcher): SC-648 landed. dse develop is now `e1be1775`, workspace main `004a6394`.
  New baseline at `e1be1775`: jest 13327 passed / 2 skipped fresh · lifecycle 64/64 · e2e `596/611 ok, 0 failed,
  15 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
  freeze 280/280 · parity 0/0/24.
  Owner plan: the R2 review continues on `8df960e3`/`3e88b3f5` (not interrupted). The fix/landing round rebases the
  plugin branch onto `e1be1775` (SC-648 touched negotiation code: check conflicts in ArgumentView / NegotiationData),
  re-runs the FULL battery on the rebased head, then puts the superproject branch on `004a6394` (or newer main) with
  one CHANGELOG commit and ONE pointer bump.
  Expected after SC-649 on `e1be1775`: jest 13332 / 2 fresh (13333 / 1 with shots cache) · e2e `597/612 ok, 0 failed,
  15 known-bug, coverage: 417/417 pairs` · rest unchanged.

## R2 review result and rulings (2026-11-14)

Reviewer (Opus) LAND-READY on `8df960e3`: 0 HIGH, 0 MEDIUM, 2 LOW, 4 INFO. Gates matched (e2e SET-X03/X04 SC-657
flake, green on re-run). Report `sc649-r2-review.md`.

Owner rulings:
- LOW-1 (no test pins the Reuse box as drawn; mutant `checked: arg.reusedMotivation` survives) — FOLD into R3: assert
  `{checked: false, disabled: true}` on `negotiation.mod.reuse` in K13 and/or the Case 2 Complete test.
- LOW-2 (stale `sameArgumentUsed: true` drawn checked+disabled while a motivation is appealed; the roll ignores it,
  the mirror of Case 2; reachable by normal clicks: check Same, then press a motivation) — FOLD into R3, as the
  reviewer prescribed: `checked: arg.sameArgumentUsed && !this.data.argumentUsesMotivation()` at `ArgumentView.ts:~305`
  plus a jsdom test (and the NEGO-A12-style click path if cheap). Display only; writes nothing on render; the stored
  flag is untouched. Supersedes the R1 follow-up hold above.
- INFO-1 ("writes nothing" checks compare the parsed entry, not bytes) — FOLD if the jsdom harness exposes the raw
  note text (compare bytes); otherwise DROP (reviewer probe P8 showed byte-identical in all 4 cases).
- INFO-2 (the 3 new NegotiationData methods have no unit tests) — FOLD: small unit tests in the existing model test file.
- INFO-3 (name-matching corners behave like the chips) — no action.
- INFO-4 (superproject worktree stale, unstaged pointer) — handled by R3's superproject step.

- R3 implementer (resume of R1 author) — fixes + rebase onto `e1be1775` + full battery + superproject CHANGELOG + ONE
  pointer bump. Report `sc649-r3-report.md`. Then R4 scoped re-review of the delta (R2 reviewer identity).

## Baseline moves (3)

- 2026-11-14 (dispatcher): SC-631 landed. dse develop `2777484c`, workspace main `0a6aaebf`. Baseline at `2777484c`:
  jest 13334 passed / 2 skipped fresh · lifecycle 64/64 · e2e `597/612 ok, 0 failed, 15 known-bug, coverage: 417/417
  pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  R3 now rebases onto `2777484c` (supersedes `e1be1775`). Expected after SC-649: jest 13334 + 5 (R1) + R3 tests fresh;
  e2e `598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`; rest unchanged.

## R3 result (2026-11-14/15)

Implementer DONE. Plugin `5f962390` on dse develop `2777484c` (31c0ddcf, 742a7b4d = R1 rebased; d83ad953 LOW-1/LOW-2/
INFO-1; 5f962390 INFO-2). Superproject `a7532b61` on workspace origin/main `fded411f`: e4cb35e3 CHANGELOG + a7532b61
single pointer bump (owner-verified). Gates on that head: jest 13345 / 1 (shots cache), lifecycle 64/64, e2e full run 2
`598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` (run 1 had the SC-657 SET-X03/X04 flake, green on
re-run), shots 592 / 163/978 / 40/240 / 147, freeze 280/280, parity 0/0/24.

- R4 scoped re-review (R2 reviewer identity) of the delta — report `sc649-r4-rereview.md`.

## R4 re-review result (2026-11-15)

LAND-READY on plugin `5f962390` / superproject `a7532b61`: 0 HIGH/MEDIUM/LOW, 1 INFO. Mutants m1–m6 all killed;
range-diff R1 commits identical. Report `sc649-r4-rereview.md`.
- INFO-1 (CHANGELOG implies a ghost Pitfall also greyed out Same Argument) — FOLD: chore round R5 rewrites the
  CHANGELOG commit with "…used the Motivation (or Pitfall) table, a missing Motivation still greyed out Same Argument,
  and Complete…" (bullet file updated); the pointer bump stays a single commit to `5f962390`. Docs-only; owner verifies
  the diff itself (no further review: plugin code unchanged).

## R5 result + land-ready (2026-11-15)

Chore rewrote the CHANGELOG commit: superproject `e9e8634e` (pointer bump to `5f962390`) over `12909271` (CHANGELOG),
on workspace origin/main `fded411f`; owner verified the diff (only CHANGELOG.md + draw-steel-elements; 2 commits; no
trailer). Plugin `5f962390` on dse origin/develop `2777484c`. Land-ready comment posted on SC-649; reported land-ready
to the dispatcher. Ticket stays Awaiting until landed; the dispatcher (or owner on request) sets Done via
linear-post.py `--state Done` and verifies.
