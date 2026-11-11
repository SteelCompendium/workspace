# SC-576 — decisions ledger

Ticket: SC-576 "Initiative: after Reset encounter, enemy rows vanish and heroes show 0 Stamina / Dying"
(DSE 7.0.0, High, Bug). Owner: opus-5.5 ticket-owner, session be71a0a9-199f-4e14-967b-191935312b05.

Worktree: /home/scott/code/steelCompendium/worktrees/sc576-reset-encounter-display
(branch sc576-reset-encounter-display in every submodule), cut 2026-11-10 from workspace main
2484d9a1, dse develop 32441332.

## Scott rulings (verbatim, dated)

None yet. The ticket is a plain bug with no open design question. Scott's only words on the
thread are the SC-437 owner's filing comment (2026-11-10, posted under Scott's account):
"Confirmed in real Obsidian, and worse than first filed: after Reset encounter → Yes, both enemy
groups are empty and both heroes show 0 Stamina with a red DYING chip. Raised to High. ... The
note file on disk is correct; only the rebuilt tracker is wrong."

## Owner decisions

- 2026-11-10 — Scope: fix the screen after Reset encounter → Yes so the rebuilt tracker paints
  what the written note says (enemy roster cells + detail rows back, heroes at full Stamina, no
  Dying chip). The note bytes Reset writes must NOT change (INIT-X01 pins them; the ticket says
  the note is already correct).
- 2026-11-10 — Remove the three SC-576 markers with the fix: jsdom `test.failing` `[X05]`
  (test/dom/elements/initiative-matrix.test.ts:699) becomes a plain test; e2e `knownBug('SC-576')`
  on `[INIT-X05]` and `[INIT-X06]` (e2e/specs/initiative/reset-encounter.e2e.ts:84, :98) become
  plain assertions. Expected e2e: 201/206 ok, 0 failed, 5 known-bug, coverage 142/142.
- 2026-11-10 — Out of scope (other tickets): SC-575 (reset leaves a minion squad's pips pressed),
  SC-588 (focus drops after a whole-tracker rebuild), SC-590 (design question to Scott). If the
  fix flips one of their markers as a side effect, the worker reports it; the owner rules.
- 2026-11-10 — Not a visual change: no freeze/parity movement expected. Full dse-verify battery
  still runs (lifecycle + e2e required to land).

- 2026-11-10 — BASELINE MOVED (dispatcher): SC-436 landed; dse develop is now `97a9c93b`
  (workspace main `eb0de7ab`). Test-only plus `data-dse-control` ids on ConditionsModal (e2e
  `[CENSUS-09]`, fixtures `Initiative/conditions.md`, `Initiative/two-trackers.md`). Baseline at
  97a9c93b: jest 7050 passed / 1 skipped (cached CSS) · lifecycle 52/52 · e2e `249/260 ok,
  0 failed, 11 known-bug, coverage: 161/161 pairs` (both SC-576 markers among the 11) · shots 592,
  host-leak 163/978, capture clip 147 · freeze 280/280 · parity 0/0/24. The branch must rebase
  onto 97a9c93b before land-ready. ~~Expected e2e 201/206 ok, 5 known-bug, 142/142~~ superseded
  by: expected e2e at our head `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`;
  jest 7050 + N passed / 1 skipped.

## Rounds

- r1 implementer (Sonnet) — brief sc576-brief-r1-implementer.md, report sc576-r1-implementer-report.md.
  DONE 2026-11-10: plugin `2b1525ba` (fix `61a7918e`, test `2b1525ba`) on 97a9c93b. Fix: Reset
  confirm → new `InitiativeView.rebuildFromWrittenReset()` (write reset model, rebuild from
  parse(parseYaml(bytes)) + resolveInitiativeRefs; on throw log + keep reset model). Written bytes
  byte-identical (scratch diff). Gates: tsc/lint clean · jest 7050/1 skipped + 1 SC-568 timeout
  (twin-reuse; green alone → effective 7051) · lifecycle 52/52 · e2e 251/260, 0 failed, 9 known-bug,
  161/161 · shots 592/163/147 · freeze 280/280 · parity 0/0/24.
  Owner rulings on r1 extras: Follow-up "Reset keeps a squad's `actions`" → DROP, already SC-575.
  Deviation "lifecycle parts 2–5 from one driver script" → accepted (all green); r2 re-runs parts
  3–5 as separate calls.
- r2 reviewer (Opus) — brief sc576-brief-r2-reviewer.md, report sc576-r2-review-report.md.
  DONE 2026-11-10: verdict LAND, 0 HIGH / 2 MEDIUM / 2 LOW / 3 INFO. Gates re-measured on
  2b1525ba: jest 7051/1 · e2e 251/260, 0 failed, 9 known-bug, 161/161 · lifecycle 3–5 9/9 4/4 2/2.
  Owner rulings (all folded into r3 fix round, implementer resumed):
  - MEDIUM-1 (throw fallback repaints the SC-576 screen silently) → FOLD, option (b): on a
    re-parse/resolve throw, render what a reload would render for that note (the pipeline's
    error card with the thrown error), never the un-normalised model. Option (a) rejected: the
    clone path treats merged `name`/`max_stamina` as authored (SC-485 absent-key records) and
    could leak them into the note on a later write. jsdom test shaped like reviewer probe P4.
  - MEDIUM-2 (e2e X05/X06 can't tell a rebuild happened) → FOLD: also assert on screen
    `Round 1`, `Malice: 0`, Bruno's `init.hero.turn` `aria-pressed="false"`.
  - LOW-1 (click during the resolve await is silently lost) → FOLD: root inert/busy during the
    await, cleared in `finally`; skip the await entirely when the model has no `statblock` refs
    if that is a small local change. jsdom test shaped like P5.
  - LOW-2 (stale `rebuildAndPersist` doc comment, view.ts:162) → FOLD.
  - INFO-1 (fix also stops Reset-then-damage writing `current_stamina: -5`) → FOLD as a bullet in
    the plugin `draw-steel-elements/CHANGELOG.md` under `## 7.0.0 (unreleased…)`, naming both
    the screen fix and the note-corruption path it closes.
  - INFO-2, INFO-3 → no action (confirmations).
- r3 implementer fix round (same Sonnet implementer, resumed) → report sc576-r3-fix-report.md.
  Scoped re-review r4 → the r2 reviewer (did not author), delta only.
  r3 DONE 2026-11-10: plugin `8645685a` (fix `fddfb7b3`, e2e `8645685a`) on 2b1525ba / 97a9c93b.
  MEDIUM-1 → throw wrapped as ElementStageError in private `loadError`, onMount draws
  renderErrorCard, chromeItems() [] while set. LOW-1 → root inert + aria-busy, cleared in finally;
  "skip await when no refs" NOT done (would skip resolveInitiativeRefs validation/fills) — owner:
  accepted, the ruling made it conditional on being small and safe. Gates: jest 7053/1 + twin-reuse
  SC-568 timeout (green alone; effective 7054) · lifecycle 52/52 in five separate calls · e2e
  251/260, 0 failed, 9 known-bug, 161/161 · shots 592/163/147 · freeze 280/280 · parity 0/0/24.
- r4 scoped re-review (r2 reviewer, resumed), delta 2b1525ba..8645685a → sc576-r4-rereview-report.md.
  DONE 2026-11-10: FIX-FIRST, 0 HIGH / 1 MEDIUM / 1 LOW / 3 INFO. jest 7054/1 effective, e2e
  251/260, 0 failed, 9 known-bug, 161/161. Owner rulings:
  - MEDIUM-A (`loadError` sticky: a pinned sidebar tracker stays on the error card after the
    statblock is restored + note edited; SidebarPanel.ts:315-321 re-uses the view via update())
    → FOLD with the reviewer's tested fix (clear `loadError` when update() gets a different
    model; remove stale `data-dse-error-stage` when the tracker draws) + a jsdom recovery test.
  - LOW-A (nothing tests the chromeItems() `|| this.loadError` guard) → FOLD: broken-statblock
    `[X05]` asserts neither `init.reset-encounter` nor `init.reset-turns` is offered.
  - INFO-C (CHANGELOG "instead of 25" assumes a 30-Stamina hero) → FOLD, say so.
  - INFO-A (card after Reset keeps the chrome panel; reload's card does not) → DROP: harmless,
    collapse is session-only, note bytes unchanged.
  - INFO-B (failure path console.error trips the e2e page-error invariant) → DROP: no e2e test
    of that path is planned; a future one allows it.
- r5 implementer fix round (resumed) → sc576-r5-fix-report.md. r6 scoped re-review → r2 reviewer.
  r5 DONE 2026-11-10: plugin `fbaba3da` (1 commit on 8645685a; base still 97a9c93b). Gates:
  tsc/lint clean · jest 7056/1, exit 0 · lifecycle 52/52 (five calls) · e2e 251/260, 0 failed,
  9 known-bug, 161/161 · shots 592/163/147 · freeze 280/280 · parity 0/0/24. Mutations: no
  chromeItems guard → 2 fail; no update() clear → recovery test fails.
- r6 scoped re-review (r2 reviewer, resumed), delta 8645685a..fbaba3da → sc576-r6-rereview-report.md.
  DONE 2026-11-10: verdict LAND, 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO. Real-Obsidian sidebar
  probe recovers on fbaba3da. Initiative jsdom 306/306. e2e run 1 250/260, 1 failed (RECOV-R07,
  stamina-bar, outside delta; green alone); run 2 251/260, 0 failed, 9 known-bug, 161/161.
  Owner rulings: INFO-1 (an outside edit landing during the inert wait is painted over by
  Reset's update; predates delta, next file-change refresh corrects it) → DROP. INFO-2
  (RECOV-R07 double-write flake under load) → DROP here: already filed as SC-517 and SC-570.
- 2026-11-10 — LAND-READY: plugin branch `sc576-reset-encounter-display` @ `fbaba3da` on dse
  develop `97a9c93b`. Reported to the dispatcher; owner does not land.
