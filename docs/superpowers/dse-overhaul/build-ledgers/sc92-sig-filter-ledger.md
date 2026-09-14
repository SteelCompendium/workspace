# SC-92 — Feature filter: signature abilities — decisions ledger

Effort: `sc92-sig-filter`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc92-sig-filter`
(superproject `728f514`, steel-etl `f90da5f`, v2 `55dc19639f`; every submodule on branch `sc92-sig-filter`).
Ticket-owner: Fable · session 7694ddcf-550f-41a1-b639-c563d81974ca.

## Ticket text (verbatim)

> **Feature filter: signature abilities** — Add ability to filter for signature abilities

Labels: Feature, ETL. Related: SC-90 (Ability search: filter by conditions — Done 2026-08-26;
the Condition chip row on the feature Search & Filter page is the precedent to mirror).

## Scott rulings (verbatim, dated)

_(none yet — Scott asleep 2026-09-13; ticket-owner decides design where the SC-90 precedent
makes the right answer clear, and posts a self-contained ask for anything that is genuinely his.)_

## Ticket-owner decisions

- 2026-09-13: Round 1 is a scoped survey (reviewer tier) — how SC-90 wired a facet end to end
  (steel-etl → v2 browser core → tests → docs), how "signature" is represented in the data,
  and a recommended shape (Signature-only chip vs a general Cost facet). Decision on shape
  follows the survey.

- 2026-09-13 (after r1 survey, `sc92-r1-survey-report.md`): **Shape = a `Cost` chip row on the
  feature Search & Filter page: `Signature` · `No cost` · `1` `3` `5` `7` `9` `11`** (only values
  present in the data), placed between the Action and Keyword rows, derived client-side from the
  island's existing `cost` field. No steel-etl change (the island already carries
  `cost: "Signature"`, synthesised from `@subtype: signature`; 100 of 621 abilities). No card/CSS
  change (cards already show the cost in the head). Rationale: a lone Signature toggle fights the
  `values.length > 1` facet guard and under-delivers on "do the right thing, consistency"; a raw
  cost facet is 49 chips; resource-name chips duplicate the Source facet (resource ↔ class is
  1:1 except Ferocity). Scott gets the trim option (`Signature` · `No cost` · `Resource`) in the
  review ask — his taste call, cheap to change.
- 2026-09-13: Round 2 = implementer (Sonnet): core helper + facet descriptor + node tests + a
  feature-browser e2e (SC-90 shipped no e2e for facets; this closes that gap) + screenshots +
  CHANGELOG bullet. Round 3 = independent Opus review; then scoped re-review.
- 2026-09-13: The steel-etl duplicated Signature synthesis (`feature_index.go:355-357` ≡
  `ability_cards.go:174-176`) is **dropped** as out of scope — cosmetic, no behaviour, not worth
  a ticket.

## Rebase targets (dispatcher relay, 2026-09-13/14)

- SC-315 landed + deployed after this worktree was cut. New tips: **v2 origin/main
  `e1b3a9610851418e04bb1e3038a29991b7493926`** (one commit, `docs/stylesheets/custom_font.css`
  only); **workspace origin/main `2caf81b`** (touches `CHANGELOG.md` Unreleased, `DESIGN.md`, and
  the v2 pointer). steel-etl untouched. Before land-ready: rebase the v2 branch onto `e1b3a961`
  (fetch inside the worktree clone) and rebase the superproject branch onto `2caf81b` — expect a
  `CHANGELOG.md` conflict; resolve by keeping both bullets. Do this after the implementer round
  returns (never rebase under a live worker).

- 2026-09-14: Round 2 DONE — v2 `b673df5cc5` + `54a3c18a11`, superproject `f6a916faab`
  (CHANGELOG bullet). node tests 114/0 (baseline 105 + 9), new e2e
  `tests/e2e/feature-browser-cost.e2e.cjs` green, counts: Signature 100, Signature+No cost 216,
  Signature+Conduit 8. Implementer judgment call accepted: `costTierValues`/`costTierDisplay`
  live in the UMD core module (mount script is not `require()`-able under node:test).
  Round 3 = independent Opus review (`sc92-brief-r3-review.md`).

- 2026-09-14 (session 31166e59-d60f-47c0-a149-b0b68ca3be8d, resumed): Round 3 review DONE — APPROVE, 0 HIGH · 1 MEDIUM ·
  3 LOW · 6 INFO (`sc92-r3-review-report.md`). Rulings:
  - M1 (dirty `v2/devbox.lock`, unrelated devbox churn) → **not a branch change**; the fix
    round discards it with `git -C v2 checkout -- devbox.lock` and the land-ready note tells the
    dispatcher it was discarded, never committed.
  - L1 (`costTierValues` hard-codes 1,3,5,7,9,11; a future `2` sorts after 11) → **fold** into
    round 4: partition present tiers into numerics (numeric sort) and others (localeCompare),
    head = Signature, none. Same output today.
  - L2 (JSDoc points at the wrong file for the fallback) → **fold**, reword to "see
    `costTierValues` below".
  - L3 (CHANGELOG bullet: card-face claim wrong for No cost; bare numerals unexplained; Type/Track
    omitted from composability) → **fold**, reword per the reviewer's prescription.
  - I1–I6 → no action (I1: keep the defensive `{value,unit}` branch; it is cheap and the
    reviewer did not prescribe removal).
- 2026-09-14: Round 4 = fresh implementer (Sonnet): the three LOW folds + the rebases from the
  "Rebase targets" section (v2 → `e1b3a961`, superproject → `2caf81b`), full gate re-run.
  Round 5 = scoped re-review of the round-4 delta by a fresh reviewer identity (the round-3
  reviewer's transcript is from a prior session and is not reusable). The Scott ask (8-chip vs
  trimmed row) posts once with land-ready after round 5.
- 2026-09-14: Rebase targets **superseded** — ~~v2 `e1b3a961`, workspace `2caf81b`~~ → main moved
  again overnight (SC-115, SC-196, SC-323, Steel Forum add+revert, deploy c4e0526). Current tips
  at dispatch of round 4: **v2 origin/main `110849217e`**, **workspace origin/main `9bc4ddf`**
  (steel-etl pin now `c4e0526`; steel-etl still untouched by this branch). Round-4 brief
  carries these.
- 2026-09-14: Round 4 DONE — v2 `fab54d976b` (L1+L2+2 tests, rebased on `110849217e`),
  superproject `3cfdfa4` (rebased on `9bc4ddf`; `9aa3ec0` = L3 CHANGELOG reword). node tests
  116/0, build exit 0, e2e green (100 / 216 / 8), chip row unchanged. `devbox.lock` churn
  discarded, not committed. Round 5 = scoped re-review (`sc92-brief-r5-rereview.md`).
- 2026-09-14: Round 5 re-review DONE — APPROVE, 0 HIGH · 0 MEDIUM · 2 LOW · 2 INFO
  (`sc92-r5-rereview-report.md`). Rulings:
  - LOW-1 (two test names in `steel-feature-browser-core.test.js:110,121` still describe the
    deleted enumerated-list contract) → **fold** into round 6: rename only.
  - LOW-2 (SC-92 CHANGELOG bullet sits under `### Internal` at :113; the whole Unreleased section
    has drifted that way on main since SC-90) → **fold the SC-92 bullet only**: move it above
    `### Internal` into the user-facing run of Unreleased. The pre-existing drift (SC-90 and the
    DSE bullets under Internal, an unpromoted SC-90 that deployed 2026-08-26) is **dropped** for
    this ticket — it is deploy-time promotion work in the main checkout, not a branch change.
  - INFO-1 (`isNaN` edge on `""`/`"Infinity"`, unreachable) → drop. INFO-2 (`c88829c` superseded
    by `3cfdfa4`) → drop; harmless.
- 2026-09-14: Round 6 = resume the round-4 implementer for the two folds; round 7 = resume the
  round-5 reviewer for a two-item scoped check. Then post the ask + land-ready.
- 2026-09-14: Landing note for the dispatcher — the shared MAIN checkout is currently dirty
  (` M docs/handoffs/HANDOFF.md`, ` m draw-steel-elements` demo-vault), not from this effort;
  `just wt-finish` will refuse until it is committed/stashed.
- 2026-09-14: Round 6 DONE — v2 `b9a37c0bc4` (test renames), superproject `fa58205`
  (`c7860d2` = CHANGELOG bullet moved above `### Internal`). node 116/0. Round 7 = reviewer
  recheck of exactly those two commits.
- 2026-09-14: Round 7 recheck DONE — APPROVE, 0/0/0, 1 INFO (`c7860d2` also dropped one blank
  line between two pre-existing bullets; no rendering change) → **dropped**, not worth a round.
  **LAND-READY:** v2 `b9a37c0bc4` (4 commits on `110849217e`), superproject `fa58205`
  (on `9bc4ddf`), steel-etl untouched (`c4e0526`). Posting the shape ask + land-ready to SC-92,
  In Progress + Needs Review.

## Scott rulings (verbatim, dated)

- 2026-09-14 (terminal, to the ticket-owner): "keep the 8 chips, land it" — the 8-chip `Cost`
  row is final; the `Signature · No cost · Resource` trim option is closed. Landing performed by
  this owner on Scott's direct instruction.
