# SC-195 fix round report — HIGH-1 / HIGH-2 / MEDIUM-1 / INFO

Worktree: `/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool/draw-steel-elements`
Branch: `sc195-captain-minion-pool`. Base for this round: `b0beb40` (implementation round,
itself on `d3ad4ea` / base `1619396`). New commit: **`778a341`**. Not pushed. No tags.
Superproject pointer untouched. Fresh identity (no prior context beyond the ledger/reports).

## Per-fix status

### FIX 1 — HIGH-1 (live gate vs persisted flag disagree): CONFIRMED, fixed

- New `foldedCaptainStaminaBonus(minion: Creature): number` —
  `src/drawSteelAdmonition/EncounterData.ts:293-305` (declared right after
  `minionPoolMaxOf`). Reads the PERSISTED `captain_bonus_active` flag only; when true,
  prefers the new persisted `captain_bonus_n` field over a fresh `withCaptainStaminaN`
  parse (defensive fallback for a hand-authored flag with no persisted N).
- `src/elements/initiative/view.ts:1616-1634` (`updateStaminaDisplay`) — the row/print
  parenthetical (`effectivePer`) now calls `foldedCaptainStaminaBonus(creature)` instead of
  the live `captainStaminaBonus(group, creature)`. The now-unused `captainStaminaBonus`
  import was removed from this file.
- `src/views/MinionStaminaPoolModal.ts:257-276` (`poolNumbers`, the kill-ladder divisor
  `effectivePerMinion`) — same swap; import line updated (`captainStaminaBonus` →
  `foldedCaptainStaminaBonus`).
- Regression tests for both review-report failure scenarios:
  - PROBE A (pre-upgrade blob, no flag, parseable N, bound alive captain): unit
    (`test/unit/model/encounter-data.test.ts` — `foldedCaptainStaminaBonus` describe,
    "flag absent…: 0…"), DOM row readout (`test/dom/elements/initiative.test.ts` —
    "HIGH-1 regression: a pre-upgrade captained squad…"), and the real modal
    (`test/dom/views/minion-stamina-pool-modal.test.ts` — "PROBE A: pre-upgrade blob…").
  - PROBE B (flag true, captain currently down): same three files, "flag true + captain
    currently DOWN…" / "HIGH-1 regression: a bound-but-DOWN captain…" / "PROBE B: flag=true
    + captain at 0…".
- All pre-existing SC-195 tests that set `captainBonusActive`/`captain_bonus_active`
  explicitly (the states where live and persisted already agreed) pass unchanged.

### FIX 2 — HIGH-2 (resetEncounter leaves stale pool max/flag): CONFIRMED, fixed

- `src/drawSteelAdmonition/EncounterData.ts:527-541` (`resetEncounter`'s squad branch) —
  now also clears `creatureType.minion_stamina_pool_max`, `captain_bonus_active`, and the
  new `captain_bonus_n` for every `squad_role === 'minion'` creature, alongside the
  existing `minion_stamina_pool` clear.
- Regression test (the exact review repro — captained 5×5 +2, damage to 21, relieve
  → 15/29, reset → fresh full pool, later promote is NOT a no-op):
  `test/unit/model/encounter-data.test.ts` — `resetEncounter` describe, "review repro:
  captained 5x5 +2, damage to 21, relieve (15/29), reset -> fresh full pool…". (Rebuilds
  `minion.instances` after `resetEncounter` to stand in for the reparse a real reload does —
  `resetEncounter` also drops instances, which the pure-helper level doesn't rematerialize.)

### FIX 3 — MEDIUM-1, owner ruling (orphaned captain bonus un-wind): CONFIRMED, fixed

- New persisted field `captain_bonus_n?: number` —
  `src/drawSteelAdmonition/EncounterData.ts` (Creature interface, after
  `captain_bonus_active`) — the per-minion N actually folded in, stamped by
  `initMinionPool` (when bonus > 0) and `applyCaptainBonusTransition` (set on ON, cleared
  on OFF), so the un-wind never depends on the minion's own `with_captain*` data still
  being intact/unchanged.
- New `reconcileOrphanedCaptainBonus(group, minion): boolean` —
  `src/drawSteelAdmonition/EncounterData.ts:337-368` (declared right after
  `applyCaptainBonusTransition`). Fires ONLY when `captain_bonus_active` is true AND
  `captainOfSquad(group, minion) == null` (no captain bound at all — distinct from a
  present-but-down captain, which is untouched here). Uses the persisted `captain_bonus_n`
  (falling back to a live parse only if absent), `N × alive`, clamped ≥ 0, clears both
  `captain_bonus_active` and `captain_bonus_n`.
- Wired into both parse paths' phase-3 pool pass, called for EVERY squad (not only
  freshly-initialized ones):
  - `src/elements/initiative/model.ts:216-224` — **must run AFTER instance
    materialization** in this function (self-caught bug during this round: the call was
    originally placed before the minion-instances block, so `minion.instances` was still
    `undefined`/empty at call time and the alive-count computed as 0, making every
    transition a silent no-op on the numbers while still clearing the flag — see "Bug
    found and fixed" below).
  - `src/elements/initiative/resolveRefs.ts:199-203` — placed after `initMinionPool`,
    consistent with the sync split; safe as-is because `resolveInitiativeRefs` always runs
    on a model `parse()` already materialized instances for.
- Regression tests:
  - Pure helper (`reconcileOrphanedCaptainBonus` describe,
    `test/unit/model/encounter-data.test.ts`): orphan un-wind uses the persisted N (not the
    live, deliberately-wrong `with_captain_stamina`), no-op when a captain is bound (down or
    not), no-op on a pre-upgrade blob (flag absent), clamp-at-0.
  - Sync parse path, full YAML, captain entry entirely absent:
    `test/dom/elements/initiative.test.ts` — "M-1 regression: the captain creature deleted
    entirely…" (single un-wind at render, persisted N wins over a wrong live value), "…flag
    absent (pre-upgrade blob) with no captain is untouched…", and "…captain_bonus_n
    round-trips through YAML…".
  - Async parse path (`resolveInitiativeRefs`), same shape:
    `test/unit/model/initiative-resolve-refs.test.ts` — "M-1: a squad with the persisted
    flag true but NO bound captain at all un-winds through resolveInitiativeRefs too".
  - Serializer round-trip for the new field:
    `test/unit/model/initiative-serialize.test.ts` — added `captain_bonus_n` assertions to
    the existing byte-compat test (absent on an ordinary squad) and the existing
    captained-squad fixed-point test (`captain_bonus_n: 4` present and stable).

**Bug found and fixed during this round (self-caught, pre-commit):** the first pass at
FIX 3 called `reconcileOrphanedCaptainBonus` in `model.ts`'s `parse()` *before* the
squad-minion instance-materialization block. On a fresh parse of an orphaned-bonus squad,
`minion.instances` is still unset at that point, so `(minion.instances ?? [])` evaluates to
an empty array and the computed `alive` count is 0 — the flag/`captain_bonus_n` still
cleared (making the bug look "half-fixed"), but the pool numbers never moved. Caught via a
scratch debug jest test comparing `captainOfSquad`/`minionPoolOf` before and after; fixed by
moving the `reconcileOrphanedCaptainBonus` call to after the instances block in
`model.ts` only (`resolveRefs.ts` was never affected — it always runs after `parse()` has
already materialized instances). Full jest re-run after the reorder is 100% green;
`resolveRefs.ts`'s own call becomes a normal no-op for a model that already went through the
now-fixed `parse()` first, and stays load-bearing on its own for any caller that reaches
`resolveInitiativeRefs` on a model `parse()` didn't just build.

### FIX 4 — INFO (embedded-Stamina negative corpus gap): CONFIRMED, fixed

- `test/unit/model/encounter-data.test.ts` — added
  `'gains +2 bonus to Stamina and an edge'` to the `parseWithCaptainStamina` negative
  `test.each` corpus (asserts `undefined`). Anchoring (`^\+(\d+)\s+bonus to Stamina$/i`) in
  `src/drawSteelAdmonition/EncounterData.ts` (`WITH_CAPTAIN_STAMINA_RE`) was already correct
  and unchanged — this only closes the coverage gap the review flagged (a future
  unanchoring would now fail the suite).

## Out of scope (untouched, as directed)

- stale-max-on-YAML-edit (SC-291, deferred)
- `isCaptainDown` edge semantics (L-1) — no behavior change this round
- ladder-residue cosmetics (L-2), tick spacing (L-3) — no behavior change
- `with_captain` serialization class (I-5/I-6) — no behavior change

## Gate results (all run foreground, devbox-wrapped, gate command last, per-run log files)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, no output |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation warning) |
| `rm -f main.js styles.css && npx jest` | **3491 passed / 1 skipped / 3492 total** (net **+18** over the implementation round's 3473), 189 passed + 1 skipped of 190 suites, 3 snapshots, ~23 s |
| `npm run shots` | **478 PNGs**, 0 FAIL (unchanged — no new fixtures, no CSS touched this round); print-twin parity OK (119 ids); host-copy pin OK; button host-leak OK (111×3×2=666) |
| `check-freeze.sh` | **`freeze OK (210/210 frozen print PNGs byte-identical)`** |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** |

One transient jest red on the FIRST full run only, in a file unrelated to this ticket
(`test/dom/framework/sidebarEncounterHandoff.test.ts`, SC-153's "durable across a reload"
test) — re-ran green in isolation immediately, and the very next full clean run (after the
FIX 3 reorder above) was 100% green including that file, confirming it was a pre-existing
flake unrelated to SC-195, not a regression from this round. `/proc/loadavg` at the time was
~1.9-2.4, not the 45-57 range the skill's load-timeout note describes, so this reads as an
unrelated, order/timing-sensitive pre-existing flake rather than the documented
settings-tab/settings-preview class — noted here rather than silently ignored, per the
skill's instruction to A/B/verify rather than assume.

## Commit

- `778a341` — "SC-195 fix round: HIGH-1/HIGH-2/MEDIUM-1 + INFO parser gap" (10 files,
  +442/-10), on top of `b0beb40`. Not pushed. No tags. Superproject pointer untouched.

## Evidence paths

No new visual fixtures/screenshots this round (readout/logic fixes only — the ticket's own
shots/freeze counts are unchanged, confirmed above). Gate logs (this session, not committed):
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/sc195-fr-*.log`.

## Open questions for the ticket owner

None. All four assigned fixes are implemented, tested, and gated green; scope held to
exactly the four fixes named in the brief.
