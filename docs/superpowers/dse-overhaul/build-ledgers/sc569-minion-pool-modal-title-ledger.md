# SC-569 — decisions ledger

Effort: `sc569-minion-pool-modal-title`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`.
DSE branch `sc569-minion-pool-modal-title`, cut from dse `origin/develop` @ `b1e4f027` (2026-11-13). Superproject cut from
workspace `origin/main` @ `e7e34279`.
Owner: ticket-owner (Opus 5.5, session be71a0a9-199f-4e14-967b-191935312b05). Workers read THIS file, never the tracker.

## Ticket (verbatim, filed by the SC-435 owner as a follow-up; Backlog, labels DSE Plugin + Feature)

Title: "Minion pool modal: when a group holds two squads, both modals have the same title"

> With two squads in one initiative group (for example two squads in "Wolves"), each squad's pool modal is titled
> "Wolves - Minion Stamina Pool". Only the minion row names tell you which squad you opened. Proposal: add the squad's
> name (or its first minion's name) to the title when the group holds more than one squad.
>
> Agent notes: `src/views/MinionStaminaPoolModal.ts:94` (`setDseTitle`), dse develop 6270e84a. Found during SC-435.

## Rulings (Scott)

(none — no comments on the ticket at start, 2026-11-13)

## Owner decisions (not Scott rulings; Scott can overturn on the ticket)

- 2026-11-13 OD-1 (title rule). Facts that drove it: the squad's creature has a `name`; minion instance ids are
  per-creature 1..N (`EncounterData.ts:840/886`), so two squads of the SAME creature (the real Delian Tomb W1 group 3
  case: two squads of "flows of the river" in one group, `EncounterData.ts:100`) have identical minion rows
  ("Flow of the River #1".."#4") in both modals — the creature name alone, or "first minion's name", does not tell them
  apart. Rule:
  - Group with ONE minion squad (`squad_role === 'minion'`): title unchanged, `"<group> - Minion Stamina Pool"`.
  - Group with TWO OR MORE minion squads: `"<group> - <creature name> - Minion Stamina Pool"`.
  - If another minion squad in the same group has the same creature name: `"<group> - <creature name> (squad N) - Minion
    Stamina Pool"`, N = 1-based position of this squad among the same-named minion squads, in the order the tracker
    lists them (top to bottom).
  This is not a decision Scott must make before work starts; the wording goes in the land-ready comment so he can
  object.

## Rounds

- r1 (implementer): implement OD-1 + jest + e2e. Report `sc569-r1-impl-report.md`.

## Baseline moves

- 2026-11-13 (dispatcher): SC-621 landed. New base dse develop `27120710`, workspace main `f05d3192`. Numbers at
  `27120710`: jest 11892 passed / 2 skipped (fresh, no shots cache) · lifecycle 64/64, part 7 is now
  `G-S108,G-S112,G-S115` (~200 s, over the 180 s tool limit: one part per call, log to a file, poll the pid) · e2e
  `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240,
  capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase dse branch onto `27120710` and the superproject branch onto
  current workspace main (one pointer bump) before land-ready. Lifecycle id reserved for us if needed: G-S119.
- r1 DONE (2026-11-13): dse `f956e306` (code+jest), `8dbd9698` (e2e POOL-E06/E07 + fixture `e2e/vaults/shipped/Initiative/two-squads.md`),
  on `27120710`. jest 11899/2 · lifecycle 64/64 (part 7 G-S115 FAIL once at load 17, 3/3 on re-run) · e2e 340/343, 0 failed,
  coverage 176/176 · shots 592 · freeze 280/280 · parity 0/0/24.
  Follow-up rulings: (a) other modals with the same ambiguity → reviewer surveys in r2 (§7), rule after; (b) G-S115
  one-off FAIL → reported to dispatcher, Backlog ticket if it recurs in r2/r3; (c) CHANGELOG `## Unreleased` bullet →
  fold into the fix round (superproject worktree, not a pointer commit).
- r2 (reviewer): `sc569-r2-review-brief.md` → `sc569-r2-review-report.md`.
- 2026-11-13 (dispatcher relay from SC-621 owner, verbatim): "filed SC-633 (Backlog, related SC-621/SC-607) for the G-S115 (g) signal. Suspected harness timing, not a product fault: the cell waits a fixed 700 ms after opening the hover before the outside write, and on a loaded host the preview may still be reading the note, which gives SC-607's already-accepted F3 refusal (writes nothing). Running owners: a G-S115 (g) red that shows the "changed on disk first" Notice on a loaded host is a suspected flake; re-run part 7 once. A red on the re-run, on a quiet host, or in any other G-S115 cell (a)-(f), (h), (i) is a real signal."
  ~~follow-up (b): Backlog ticket if it recurs~~ superseded by: no own ticket; comment on SC-633 if it recurs.
- r2 review (2026-11-13): FIX-REQUIRED, LOW only (0 HIGH / 0 MEDIUM / 3 LOW / 4 INFO). Report `sc569-r2-review-report.md`.
  Owner rulings:
  - LOW-1 (amount-0 squad still counted → "(squad 2)" on the only visible squad) → FOLD: count only the minion squads the
    tracker actually draws (verify what it draws for `amount: 0` / no instances; match it), add jest case.
  - LOW-2 (names differing only by case / surrounding spaces look identical, Steel uppercases) → FOLD: compare
    `name.replace(/\s+/g,' ').trim().toLocaleLowerCase()`, display the raw name; jest case.
  - LOW-3 + ruling (c) → FOLD: a `[FEATURE]` bullet in dse `CHANGELOG.md` (follow SC-566/573 precedent) AND a bullet under
    `## Unreleased` in the workspace `CHANGELOG.md` (precedent SC-613 / SC-581 bullets).
  - INFO-1 (captain_of by name; two same-named squads) → filed SC-634 (Backlog). Out of scope.
  - INFO-2 (no detail-row-route test; `[Flow, Boss(captain), Flow]` sweep) → FOLD: adopt the reviewer's probe as jest tests.
  - INFO-3 (420 px Apply row overflow) → filed SC-635 (Backlog). Out of scope.
  - INFO-4 → nothing to do.
  - §7 survey (StaminaEditModal "Ogre Stamina" without #id; ConditionsModal "Conditions") → filed SC-636 (Backlog). Out of
    scope (SC-614 is concurrently in ConditionsModal; do not touch it).
- r3 (implementer, resume of r1 author): fix round, brief `sc569-r3-fix-brief.md` → `sc569-r3-fix-report.md`.

- 2026-11-13 (dispatcher): SC-614 landed (`src/elements/initiative/view.ts`, `src/framework/kit/conditionIcons.ts`; jest
  F23-F29; e2e INIT-F15/F16). New base dse develop `506786cb`, workspace main `1e1dea98`. Numbers at `506786cb`: jest 11900
  passed / 1 skipped WITH shots cache (measure own fresh figure) · lifecycle 64/64 · e2e `340/343 ok, 0 failed, 3 known-bug,
  coverage: 176/176 pairs` (so with SC-569's POOL-E06/E07: 342/345) · shots 592, host-leak 163/978, modal host-leak
  40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. Possible conflicts in initiative view code / tests.
- r3 DONE (2026-11-13): dse `42bc5757` / `e4e9acb2` (r1, rebased) + `c663a137` (r3) on `506786cb`, no conflicts. Superproject
  `66f2f2c3` (CHANGELOG) + `e490a9ae` (one pointer bump) on workspace origin/main `075b61e3`. jest 11916/1 warm ·
  lifecycle 64/64 (G-S115 green, load 3.5) · e2e 342/345, 0 failed, 176/176 · shots 592 · freeze 280/280 · parity 0/0/24.
  Follow-up `docs/initiative-tracker.md:309` (pool modal section doesn't mention the squad-named title) → FOLD into the
  final round (one sentence), together with any r4 findings; pointer bump amended to stay ONE.
- r4 (scoped re-review, r2 reviewer resumed): delta `e4e9acb2..c663a137` + superproject shape → `sc569-r4-rereview-report.md`.
- r4 re-review (2026-11-13): FIX-REQUIRED — MEDIUM-1 (new in r3): `squadNameKey` calls `.replace` on a creature name that
  YAML parsed as a number (`name: 300`) → every pool-modal open in that group throws, no title. Regression vs r1/develop.
  INFO-1 (equivalent mutant) → drop, equivalent after parse. INFO-2 → nothing. Report `sc569-r4-rereview-report.md`.
  Owner ruling: FOLD MEDIUM-1 exactly as prescribed (`String(name)` in `squadNameKey`, tracker jest case
  `[{name: 300}, {name: "Flow"}]` → `River - 300 - Minion Stamina Pool`), plus the `docs/initiative-tracker.md` sentence.
- r5 (implementer resumed): `sc569-r5-fix-brief.md` → `sc569-r5-fix-report.md`; then r6 scoped re-review of r5's delta.
- r5 DONE (2026-11-13): dse `6785fa06` (on `c663a137`, develop `506786cb`); superproject `66f2f2c3` + `03049d62` (one pointer
  bump) on workspace main `075b61e3`. jest 11918/1 warm (+2 cases) · e2e 342/345, 0 failed, 176/176 · lifecycle 64/64 ·
  styles.css sha256 `18730938…f1f9` unchanged → shots 592 / freeze 280/280 / parity 0/0/24 carry.
  Follow-up "coerce creature names to string at parse time" → DROP: no failure observed beyond this helper, which is fixed
  and tested; a parse-time change is broader than this ticket.
- r6 scoped re-review (reviewer resumed) of `c663a137..6785fa06` + superproject shape → `sc569-r6-rereview-report.md`.
- r6 re-review (2026-11-13): LAND-READY, no findings. jest 11918/1 warm re-measured; styles.css hash unchanged.
- LAND-READY (2026-11-13): dse `6785fa06` on develop `506786cb`; superproject `03049d62` (`66f2f2c3` CHANGELOG + one pointer
  bump) on workspace main `075b61e3`. Result comment posted on SC-569; reported to dispatcher.
- DONE (2026-11-13): landed by dispatcher on dse develop `6785fa06` and workspace main `a478566d` (ledger preserved +
  dse-verify updated in `85eb44de`; worktree removed). SC-569 set Done via linear-post.py, state verified Done.
