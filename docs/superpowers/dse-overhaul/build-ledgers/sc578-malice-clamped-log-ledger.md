# SC-578 decisions ledger — Malice log records what the pool actually did

Worktree: `/home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log` (branch
`sc578-malice-clamped-log` in every submodule). Base: dse `develop` @ `93b3a382`, workspace
`main` @ `3f91de37` (worktree superproject pin).

## Ticket text (Scott-visible, 2026-11-10, filed by the SC-437 owner)

> With Malice at 2, quick-adding −5 sets Malice to 0 but the log entry says −5. The log no
> longer adds up to the pool.
>
> Possibly intended (the log records what the Director typed). Whoever fixes it decides: log
> the applied change (−2), or keep the typed amount and show the clamp.

Comment 2026-11-11 (SC-577 owner): "Once SC-577 lands, Advance round has the same logging gap
as the quick-add: when Malice stops at 0, the log records the full round gain. From 0 with
`round_gain: -3`, the log reads "-3 — Round gain" while Malice stays 0. Whichever way this
ticket settles it (log the real change, or mark the entry as capped), it should cover both
paths. They now share one helper, `addToMalicePool` in `src/elements/initiative/model.ts`, so
the fix can go in one place."

No Scott ruling is needed: the ticket delegates the choice to the fixer. No rules ambiguity
(SC-577 already settled "Malice never goes below 0").

## Owner decision D1 (2026-11-11, SC-578 ticket-owner) — BOTH: log the applied change AND show the clamp

1. `amount` in a log entry is the change actually applied to the pool (value after − value
   before, both via `maliceValueOf`). The log always adds up to the pool's movement.
2. When the applied change differs from what was asked (the typed quick-add amount, or the
   configured `round_gain`), the entry also stores the asked-for amount in a NEW optional
   field `requested: number`. Entries that were not capped carry NO `requested` key (byte
   shape of existing and unclamped entries is unchanged).
3. The log line for a capped entry reads `R<round>: <amount> — <label> (<requested>, capped at 0)`,
   e.g. `R2: -2 — Spend (-5, capped at 0)`. Unclamped lines are unchanged
   (`R2: -2 — Spend`).
4. A zero amount renders as `0`, not `+0`.
5. Advance round from 0 with a negative `round_gain` STILL logs its entry (amount 0,
   requested = the gain): `R3: 0 — Round gain (-3, capped at 0)`. Reason: the round gain
   happened; the log should say why the pool did not move. (Quick-add of a non-zero amount
   that applies 0, e.g. −5 from 0, logs the same way.)
6. One code path: both Advance round and the quick-add go through one shared helper
   (adding to the pool, computing the applied change, and building/appending the entry), so
   the two paths cannot drift again.
7. The stale doc comment on `MaliceLogEntry` (`EncounterData.ts`, "`amount` is always the
   event's magnitude (never signed to mean "spend")") is corrected to describe the signed,
   applied amount and `requested`.

## Out of scope (other tickets — do not touch)

- SC-589 (half-typed quick-add lost on Advance round), SC-588 (focus after Advance round /
  Malice quick-add), SC-584, SC-573, SC-580, SC-257, SC-355, SC-384 known bugs.

## Baseline change (2026-11-11, dispatcher)

SC-584 landed: dse `develop` is now `eaa8742a` (was `93b3a382`). New CURRENT: jest 7177
passed / 2 skipped (fresh worktree) · lifecycle 54/54 (part 5 is now `G-S59 G-S49 G-S73 G-S77`,
4 scenarios) · e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` · shots 592,
host-leak 163/978, modal 39/234, clip 147, freeze 280/280, parity 0/0/24 unchanged. The branch
must be rebased onto `eaa8742a` before land-ready. r1 implementer told by SendMessage.

## Rounds

- r1 (implementer, Sonnet): DONE. dse `2747307f` on `eaa8742a`; superproject `f0fd9a65`. Gates: jest 7185/1 skipped · lifecycle 54/54 · e2e 259/264 ok, 0 failed, 5 known-bug, 164/164 · shots 592 · freeze 280/280 · parity 0/0/24. Drive-by: SC-577 CHANGELOG bullets ("shows the configured amount") corrected. Report `sc578-r1-impl-report.md`.
- r2 (reviewer, Opus): dispatched 2026-11-11 against `2747307f`.
- r2 (reviewer, Opus): APPROVE, 0 HIGH / 0 MEDIUM, 2 LOW, 4 INFO. Report `sc578-r2-review-report.md`. Owner rulings (2026-11-11):
  - LOW-1 (capped suffix/`requested` decided by `amount !== requested`; hand-edited `{amount:1, requested:1}` renders "(1, capped at 0)"; fractional values write `requested` on an uncapped gain): FOLD into r3. Store `requested` only when the pool actually stopped at 0 (`before + requested < 0`); render the suffix only when `requested < amount`; add a jsdom row for `requested` equal to `amount` (no suffix).
  - LOW-2 (reworded SC-577 bullet says "see the next entry" but SC-578's sits above, both CHANGELOGs): FOLD into r3 ("see the SC-578 entry above").
  - INFO-1 (superproject `f0fd9a65` CHANGELOG will conflict with main's SC-584 bullet; keep both): landing note for the dispatcher, no code change.
  - INFO-2 ("the log always adds up to the pool" is per logged change; the −/+ stepper is not logged): FOLD a wording tweak into r3 (EncounterData.ts comment + docs/initiative-tracker.md say the stepper is not logged).
  - INFO-3 (dse-verify SKILL.md known-bug list and CURRENT need e2e 259/264, 5 known-bug, SC-578 dropped): landing note for the dispatcher; owners do not edit SKILL.md.
  - INFO-4 (`.nan`/`.inf` in YAML give NaN amounts): DROP — predates SC-578, needs a hand-typed YAML special float, no user report.

## Baseline change 2 (2026-11-11, dispatcher)

SC-573 landed: dse `develop` is now `6c7216e8` (supersedes `eaa8742a`). CURRENT: jest 7191 passed / 1 skipped · lifecycle 54/54 · e2e `259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (our branch should read `260/265 … 5 known-bug`) · shots 592, host-leak 163/978, modal 39/234, clip 147 · freeze 280/280 · parity 0/0/24. r3 implementer told to rebase onto `6c7216e8` and gate on the rebased head.
- r3 (same implementer, fix round): DONE. Rebased onto `6c7216e8`; dse `c3fd8323` (fix `c1e07053`, test `1c9030eb`, docs `c3fd8323`); superproject `98e7cd14`. Gates on `c3fd8323`: tsc/lint clean · jest 7200/1 · lifecycle 54/54 · e2e `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal 39/234, clip 147 · freeze 280/280 · parity 0/0/24. Report `sc578-r3-fix-report.md`.
- r4 (r2 reviewer resumed, scoped re-review of the r3 delta): dispatched.
- r4 (scoped re-review): APPROVE, 0 HIGH/MEDIUM/LOW. LOW-1/LOW-2/INFO-2 fixed; new rows fail with the fix reverted. jest 7200/1 on `c3fd8323`. INFO (hand-edited `{amount:3, requested:1}` would show "(1, capped at 0)"): DROP — the plugin never writes such an entry. Report `sc578-r4-rereview-report.md`.
- LAND-READY 2026-11-11: dse `c3fd8323` on `6c7216e8`, superproject `98e7cd14`. Landing notes: workspace CHANGELOG conflicts with main at the top of `## Unreleased` — keep every bullet, SC-578 above SC-577 (its cross-reference says "above"); dse-verify CURRENT e2e becomes `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, SC-578 off the known-bug list.
