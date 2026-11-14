# SC-625 decisions ledger — montage: any write deletes unknown YAML keys

Owner: ticket-owner (Opus 5.5). Worktree `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys`
(branch `sc625-montage-unknown-yaml-keys` in every submodule), cut from dse `develop` `11fbded6`, superproject `b45a5f24`.

## Ticket (as filed by SC-438, 2026-11-14)

Any click that writes a `ds-montage` block (quick-log, End round, Add a hero, Set limits) deletes every key the
montage does not know. Two places: (1) top level (`table_notes: keep me` lost); (2) inside a logged action
(`{hero: Kira, round: 1, result: success, skill: Nature, dc: 12}` loses `dc` when any other action is logged).
Hero entries (`participants:`) DO keep extra keys. Expected: "keys the montage does not use are written back as
they were." Agent notes: `serialize` reassembles a fixed key order on purpose (fix round 3, review-2 M-2); "A fix
must keep that order for known keys and put unknown keys back (e.g. after the known ones)."

## Scott's rulings

(none yet)

## Owner rulings

- 2026-11-14 — **Not dependent on SC-599.** SC-599 (parked on Scott) is about comments / quote style / flow-list
  formatting of the whole-block rewrite. SC-625 is about key/value data the parser throws away; it is fixed inside
  the existing parse -> model -> `stringifyYaml` path. Do NOT introduce source-text-preserving editing, the `yaml`
  Document API, or anything that decides SC-599's question. Unknown values are preserved by VALUE; their formatting
  follows whatever the existing serializer does today.
- ~~2026-11-14 — **Placement:** known keys keep the existing fixed order; unknown keys go after the known ones, in
  their original relative order — at top level and inside each logged action. (Follows the ticket's agent notes;
  if `participants:` entries already do something different, make actions match participants and report it.)~~
  superseded by the 2026-11-14 (after r2) placement ruling below.
- 2026-11-14 (after r2) — **Placement:** Actions follow the top-level rule (known keys in §B.5 order, then unknown
  keys in original order). `participants:` items keep SC-610's as-typed contract. The difference is deliberate.
  (Reason: sc191 review-2 M-2 covers the top level only; the fixed entry order is spec §B.5 and predates SC-625;
  aligning would let a correction append `skill`/`note` after the extras.) Exception, documented not fixed: a key
  that looks like an integer is written first (JS object key order).
- 2026-11-14 (after r2) — r2 findings: **L-1 FOLD** (doc comment at `model.ts:132-140` + a unit test pinning the
  integer-key order; no `Map` restructure). **L-2 FOLD** (CHANGELOG bullet: say the keys are kept with the same
  values; do not claim "as you typed them"). **L-3 FOLD** (jsdom rows for Undo, sheet edit, sheet Remove, Back to
  round, Clear all, Reopen; hostile-key test adds `constructor`, `toString`, `hasOwnProperty` at both levels).
  **I-3 FOLD** (promote r2's R2P-01 / R2P-02 real-Obsidian probes into `integrity.e2e.ts` with new, free MONT ids).
  **I-4 FILED** as SC-652 (framework drops an unusable `prefs:` map and a non-boolean `collapsed:`) — out of scope
  here. **I-5 FOLD** (one-line warning in the `model.ts` comment: never put a non-schema own property on the model,
  `serialize` writes it). **I-6:** the `[K] filed bugs (test.failing)` header — DROP (cosmetic, SC-626 precedent);
  SKILL.md text — the fix round writes `sc625-skill-proposal.md` in this dir (owners don't edit SKILL.md).
  r1's stray `/tmp/claude-1000/-home-scott/code-placeholder` — leave in place, tell the dispatcher.
- 2026-11-14 — **"Known" means every key the montage READS**, including any legacy alias / old spelling the parser
  accepts and rewrites under a canonical name. Such a key must not be carried as "unknown" (that would duplicate or
  resurrect stale data).
- 2026-11-14 — Scope is montage only. SC-637 (the same bug on `ds-negotiation`) is a separate ticket; do not fix it
  here. A shared helper is fine only if it lives with the montage code or in an obviously generic spot and does not
  touch negotiation.

## Baseline moves

- 2026-11-14 (dispatcher) — SC-439 landed: dse `develop` now `8a81c5a7`, workspace main `8dd3c4a4`. Negotiation
  e2e + jsdom tests; src adds data-dse-control ids in kit tabs.ts, track.ts and the negotiation; no montage code.
  Rebase onto `8a81c5a7` (superproject onto current workspace main, ONE pointer bump) before land-ready; expect
  conflicts in the shared e2e manifest. Numbers at `8a81c5a7`: jest 12552 passed / 1 skipped with the shots cache
  (fresh: expect 12551 / 2) · lifecycle 64/64 · e2e `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs` ·
  shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  r2 reviews `78d8658f` on the old base; the rebase goes in the fix round.

## Notes for SC-637's owner (same bug on ds-negotiation)

- SC-625's fix lives entirely in `src/elements/montage/model.ts` (47 lines at r1): the parser keeps each unknown key
  as an own property (copied with `Object.defineProperty`, so a hand-written `__proto__:` cannot set a prototype);
  `serialize` writes the known keys in the fixed order, then the unknown ones in their original order, at the top
  level and per list item. "Known" = every key the parser reads, including keys it reads and then drops as empty
  (`skill: ""`, `note: ~` stay dropped, not resurrected). Tests to copy the shape of:
  `test/unit/model/montage-serialize.test.ts` (unit) and the X09 `test.each` over every write path / X10 two-blocks
  in `test/dom/elements/montage-matrix.test.ts`. (Final shape may change after r2; check the landed ledger.)

## Rounds

- r1 implementer (orchestration:implementer, agent a6bf2a0f…) — brief `sc625-r1-implementer-brief.md`, report `sc625-r1-implementer-report.md`. Dispatched 2026-11-14.
  r1 result: dse `78d8658f` (fix `8b7dc083`, e2e `78d8658f`), superproject CHANGELOG `36dae9e2`. jest 12184/2 fresh
  (+18), lifecycle 64/64 (one whole-suite run, not seven parts), e2e 441/448 ok, 0 failed, 7 known-bug, 235/235;
  styles.css byte-identical (`18730938…f1f9`) so shots/freeze/parity carry. Deviation: actions use fixed-then-unknown
  order while participants keep typed position — the placement ruling said align with participants. Owner: hold the
  ruling open pending r2's recommendation on the M-2 rationale.
- r2 independent review (orchestration:reviewer, agent ac051717…) — brief `sc625-r2-reviewer-brief.md`, report
  `sc625-r2-review-report.md`. LAND-READY, 0 HIGH / 0 MEDIUM / 3 LOW / 6 INFO. Gates on `78d8658f`: jest 12184/2,
  lifecycle 64/64 (seven proper parts), e2e 441/448, 0 failed, 7 known-bug, 235/235; styles.css identical.
- r3 fix round (resume r1 implementer) — brief `sc625-r3-fix-brief.md`: folds above + rebase onto dse `8a81c5a7` and
  superproject onto workspace main `8dd3c4a4`, ONE pointer bump.
  r3 result: dse `76520b1f` on `8a81c5a7` (commits c272d209, 31b58f94, 52889820, 020d92b4, 76520b1f); superproject
  CHANGELOG `ce606935` + bump `d0ff29a4` on workspace main `c3f9b129` (one docs commit past 8dd3c4a4, same dse pin).
  jest 12575/2 fresh, lifecycle 64/64 (seven parts), e2e 484/504, 0 failed, 20 known-bug, 287/287; styles.css
  identical. Not pushed.
- r4 scoped re-review (r2 reviewer resumed, not an author) — brief `sc625-r4-rereview-brief.md`, report
  `sc625-r4-rereview-report.md`. LAND-READY, 0 HIGH / 0 MEDIUM / 1 LOW / 2 INFO; jest 12575/2, e2e 484/504, 0 failed,
  20 known-bug, 287/287 re-measured. Rulings: **L-1 FOLD** (CHANGELOG says a comment is "rewritten"; it is removed —
  chore rewords and rebuilds the two superproject commits, owner checks the docs-only diff). **I-1 DROP** (jsdom
  `[X11]`/`[X12]` vs e2e `MONT-X11`/`X12` share numbers but different id spaces; no collision). **I-2 DROP** (MONT-X14
  green on base is by design, a guard).
- r5 chore — CHANGELOG wording; superproject rebuilt as CHANGELOG `746b9efd` + bump `4850f82a` (gitlink `76520b1f`)
  on workspace main `c3f9b129`. Owner checked the diff vs `d0ff29a4`: one CHANGELOG line only.
- 2026-11-14 — **LAND-READY** reported to the dispatcher: dse `76520b1f` on `develop` `8a81c5a7`; superproject
  `4850f82a`. SKILL proposal: `sc625-skill-proposal.md`.
- 2026-11-14 — **DONE.** Dispatcher landed: dse `develop` `76520b1f`, workspace main `c231c8b0` (ledger preserved and
  SKILL proposal applied in `f9ebe6e8`; worktree removed; stray /tmp placeholder deleted). Landed comment posted;
  ticket set Done via linear-post.py `--state Done` and verified (status Done).
