# SC-195 independent review — "With Captain" Stamina bonus vs the minion pool

Reviewer: independent (did not write the code). Date: 2026-08-29.
Under review: `d3ad4ea` + `b0beb40` on `sc195-captain-minion-pool`, base `1619396`.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool/draw-steel-elements`.

## VERDICT: **FIX ROUND NEEDED**

Two HIGH findings. One of them (H-1) produces a wrong number at the table on **day one, with
no hand-editing**, for exactly the population the ticket exists to serve — an already-running
encounter with a captained squad whose minion carries a `+N bonus to Stamina`. It is a direct
consequence of the (correct) no-backfill ruling colliding with two readout sites that were not
made flag-driven. The other (H-2) is a UI-only path — "Reset Encounter State" — that leaves a
squad permanently unable to reach full Stamina.

Everything the brief asked me to verify about the *specified* behaviour checks out: the worked
example is exact, the transitions are edge-triggered and idempotent, reload neither
double-applies nor drops, the clamp holds, the parser is properly anchored, the YAML override
wins, two squads resolve independently, and all four gates reproduce the implementer's numbers
exactly. The defects are all at the seam between the persisted flag and the live gate, and at
paths that never call the transition.

---

## Gate re-run (all run by me, foreground, devbox-wrapped, gate command last)

| Gate | Implementer claimed | I measured | Verdict |
|---|---|---|---|
| `npm run tsc` | clean | clean, no output | ✅ |
| `npm run lint` | clean, exit 0 | clean (only the pre-existing `.eslintignore` deprecation warning) | ✅ |
| `npx jest` (after `rm -f main.js styles.css`) | 3473 passed / 1 skipped / 3474 | **3473 passed / 1 skipped / 3474 total**, 189 passed + 1 skipped of 190 suites, 3 snapshots, 23.4 s | ✅ exact |
| `npm run shots` | 478, 0 FAIL, +4 captain-bonus | **478 PNGs**, 4 × `initiative-captain-bonus--*`, 0 FAIL; `print-twin parity OK (119 ids)`; `host-copy pin OK`; `button host-leak OK (111 × 3 × 2 = 666)` | ✅ |
| `check-freeze.sh` | 210/210, 0 moved | **`freeze OK (210/210 frozen print PNGs byte-identical)`** — 0 FAILED, 0 missing | ✅ |
| `npm run parity` | 0 GAP / 0 undeclared / 16 DECLARED | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** | ✅ |

`/proc/loadavg` was 0.48 at the start — no load-sensitive-timeout noise; no A/B against base was
needed.

**"Zero frozen bytes moved" — CONFIRMED independently.** The four new capture ids are new names,
invisible to `sha256sum -c`; no rebaseline is owed.

---

## Findings

### HIGH

#### H-1 — The effective per-minion Stamina is read from the LIVE gate while the pool max is read from the PERSISTED flag. They disagree, and the disagreement ships wrong numbers.

**Where:**
- `src/elements/initiative/view.ts:1626` — `const effectivePer = creature.max_stamina + captainStaminaBonus(group, creature);`
- `src/views/MinionStaminaPoolModal.ts:262` — `const effectivePerMinion = minionMaxStamina + captainStaminaBonus(this.group, this.creature);`

Every other SC-195 read site is careful to be **persisted-flag**-driven —
`minionPoolMaxOf` (`EncounterData.ts:138-140`) reads `minion_stamina_pool_max`, and
`captainBonusSuffix` (`view.ts:1387-1392`) reads `squad.captain_bonus_active` and its own comment
says why ("so the badge always agrees with the pool numbers it explains"). These two sites break
that invariant by calling `captainStaminaBonus`, which is the **live** gate (captain bound + not
down) that `initMinionPool`/`applyCaptainBonusTransition` use to decide whether to *cross*.

**Failure scenario A — day one, no hand edit, no exotic state.** The owner ruled: no retroactive
backfill on load. So an encounter saved before this ships, holding a captained squad whose minion
statblock carries `+4 bonus to Stamina`, loads with `minion_stamina_pool_max` absent and
`captain_bonus_active` absent (correct — the max stays `4 × 5 = 20`). But the live gate returns 4,
so:

- the row/print readout renders `20/20 (8)` — five minions at 8 Stamina each in a pool of 20;
- the pool modal's kill ladder divides by 8 instead of 4.

Measured (PROBE A, real `MinionStaminaPoolModal` over `test/fixtures/initiative/squad.yaml` with
`with_captain_stamina: 4` and nothing else):

```
minionPoolMaxOf = 20 | live captainStaminaBonus = 4 | flag = undefined
modal max cell = "/ 20"
8 damage -> "8 damage will kill 1 minion(s)."      <-- WRONG
control (no with_captain), 8 damage -> "will kill 2 minion(s)."   <-- correct, and the pre-SC-195 answer
```

**This is a regression against base behaviour**: on the same YAML, base kills 2. Minions survive
damage that should kill them, in the exact upgrade state the owner deliberately chose.

**Failure scenario B — the mirror image.** Reload an encounter whose captain is persisted at 0
Stamina while `captain_bonus_active: true` (the state the no-re-derive-at-render ruling explicitly
permits). Max carries the bonus (40) but the live gate returns 0, so the ladder divides by the
base. Measured (PROBE B): `max cell = "/ 40" | live bonus = 0`; 4 damage reports
`will kill 1 minion(s)` when each minion is worth 8 in that pool — it should kill 0.

**Fix.** One source of truth. Add next to `captainStaminaBonus` in
`src/drawSteelAdmonition/EncounterData.ts`:

```ts
/** The bonus currently FOLDED INTO this squad's pool — the persisted flag, never the live
 *  gate. Every READOUT (row numbers, modal ladder) must use this; only initMinionPool /
 *  applyCaptainBonusTransition may consult the live `captainStaminaBonus`. */
export function foldedCaptainStaminaBonus(minion: Creature): number {
    return minion.captain_bonus_active ? (withCaptainStaminaN(minion) ?? 0) : 0;
}
```

and use it at `view.ts:1626` and `MinionStaminaPoolModal.ts:262`. Both existing SC-195 tests that
cover this (`'the kill-ladder divisor is the CURRENT effective per-minion Stamina'`,
`'the minionsToKill ladder still divides by the ORIGINAL max'`) set `captainBonusActive`
explicitly and keep passing unchanged. Add PROBE A and PROBE B as regression tests.

---

#### H-2 — `resetEncounter` clears the pool but not the two new persisted SC-195 fields, so a reset squad is permanently short of full Stamina.

**Where:** `src/drawSteelAdmonition/EncounterData.ts:527-535` — the squad branch clears
`group.minion_stamina_pool` and each minion's `creature.minion_stamina_pool`, but not
`minion_stamina_pool_max` or `captain_bonus_active`. Both are runtime state in exactly the same
sense as the pool.

**Failure scenario — UI only, no hand edit.** 5×5 goblins, `+2` bonus, captain bound:

1. Load → `35/35` (flag true, persisted max 35). ✅
2. Damage the squad to 21 (2 minions dead). ✅
3. Click the captain badge → relieve. Transition OFF at 3 alive → `15/29`. ✅ (exactly the ruling)
4. Click **"Reset Encounter State"** (`view.ts:207-215`) → reload.
5. Squad reads **`25/29`**.

A brand-new encounter whose squad starts at less than full and can never reach its own max again.
Measured (PROBE 6): `after reset: 25/29 flag=false persisted max=29`.

Cause: after the reset there is no captain, so `initMinionPool` computes `bonus = 0`, writes the
pool as `25`, and — by design, to keep ordinary squads byte-identical — **does not** stamp
`minion_stamina_pool_max`, so the stale `29` from step 3 survives.

**Worse variant (PROBE 6b): the flag survives too, and the design latches.** Any reset that lands
with `bonus == 0` leaves `captain_bonus_active: true` alongside a bonus-free pool:

```
after reset: 25/35 flag=true persisted max=35
after re-promoting a captain: 25/35  moved=false
```

`applyCaptainBonusTransition` is edge-triggered on the flag, so with the flag already `true` every
future promote is a **no-op**: the squad shows a max it can never reach, the badge reads
"Captain +2 Sta", and no UI action can ever repair it.

**Fix.** In `resetEncounter`'s squad branch:

```ts
group.creatures.forEach((creatureType) => {
    if (creatureType.squad_role === "minion") {
        creatureType.minion_stamina_pool = undefined;
        creatureType.minion_stamina_pool_max = undefined;   // SC-195
        creatureType.captain_bonus_active = undefined;      // SC-195
    }
});
```

Add a test: relieve after deaths → reset → reparse → `25/25`, no residual keys.

---

### MEDIUM

#### M-1 — The persisted flag latches: no OFF-transition exists for a captain that leaves the squad by any route other than the badge control.

**Where:** the only two callers of `applyCaptainBonusTransition` are
`src/elements/initiative/view.ts:1031` (promote/relieve click) and `view.ts:1568` (captain stamina
modal). I traced every other mutation path: there is no delete-creature affordance in the tracker,
and `createStaminaControl` (`view.ts:697-712`) routes every stamina edit through the modal — so
those two really are the complete in-app set. What is **not** covered is a YAML edit.

**Failure scenario (PROBE 8, exercised on the real model).** 5×5 `+2` captained squad, 2 minions
dead → `21/35`. The GM hand-edits the block to delete the captain's creature entry (or changes its
`squad_role` / `captain_of`) and reloads:

```
captain deleted: 21/35  flag=true  live bonus=0
after promoting a replacement captain: 21/35  moved=false
```

The +10 is stranded in the max with no captain anywhere in the group, and — because the flag says
`true` — promoting a replacement is a no-op, so the state is unrecoverable from the UI. Note this
is *not* the same as the sanctioned "down captain keeps the bonus folded in" case, which is
correct and self-heals: this is "no captain **exists**", which the model can distinguish
(`captainOfSquad(...) == null` vs `isCaptainDown(captain)`).

**Fix (needs an owner ruling, do not fix silently).** The narrow, ruling-compatible option: in the
phase-3 pool pass (`resolveRefs.ts:187-208`, and the sync twin in `model.ts:189-206`), when
`captain_bonus_active === true` **and there is no bound captain at all**, run the OFF transition
once. That does not violate the no-backfill ruling — that ruling is about not silently *adding* a
bonus on load; this is about not stranding one whose grantor no longer exists. A cheaper stopgap
is to make the promote/relieve handler treat a flag/live disagreement as a crossing, which at
least makes the state recoverable. Recommend putting the choice to Scott.

---

### LOW

#### L-1 — `isCaptainDown` changed semantics for the pre-existing "Captain down" badge, not only for the new gate.

`src/drawSteelAdmonition/EncounterData.ts:90-94`. Base (`view.ts`, now deleted):
`(captain.instances ?? []).every((inst) => (inst.current_stamina ?? 0) <= 0)`. New: returns
`false` for zero instances, and treats `current_stamina === undefined` as **alive**
(`?? Number.POSITIVE_INFINITY`). Measured (PROBE 9): both shapes now yield `captainStaminaBonus =
2` where base would have read the captain as down.

The parse-time-ordering rationale is sound and I verified the ordering hazard is real and handled:
PROBE 10 confirms a captain-declared-first block and a minion-declared-first block both build
`35/35`. But this also silently changes the roster badge for a hand-authored `instances: []`
captain, which is a pre-existing surface. No test pinned the old behaviour, and the new tests pin
the new one. Acceptable — but call it out on the ticket rather than leaving it inside a helper
move.

#### L-2 — Kill-ladder baseline drifts once a residue exists.

`src/views/MinionStaminaPoolModal.ts:263-265`. After a down-at-3-alive then re-promote-at-2-alive
sequence the max is 33 while the effective step is 7, so `initialMinionsKilled = floor(19/7) = 2`
when 3 minions are actually dead. Because `minionsToKill` is a **delta**, applied damage still
kills the right number — I checked the boundaries — so this is cosmetic-internal, not a wrong
number. It is inherent to the sanctioned `N × alive-at-the-crossing` math, not a coding error.
Cheap hardening: derive `initialMinionsKilled` from `this.creature.amount - aliveMinions`, which
`poolNumbers()` already computes.

#### L-3 — Bar ticks are evenly spaced (`i / amount`) but the real death points aren't, once a residue exists.

`view.ts:742-747`, `MinionStaminaPoolModal.ts:73-76`. Documented in-code; the alternative (deriving
the step from a max that is no longer a clean multiple) is worse. Cosmetic; no action needed
beyond the existing comments.

#### L-4 — `minion_stamina_pool_max` freezes the max against later `amount` / `max_stamina` YAML edits.

`EncounterData.ts:138-140`. Once a squad has ever carried an active bonus, editing `amount: 6` or
`max_stamina:` in the block no longer changes the displayed max (the persisted value always wins).
Pre-SC-195 the row max tracked the fields live. Worth one sentence in
`docs/initiative-tracker.md`.

---

### INFO / verified claims

- **I-1 — "legacy async `parseEncounterData` is test-oracle only": CONFIRMED.** No `src/`
  importer: `definition.ts:8-9` wires `parse` + `resolveInitiativeRefs`; every other `src/` hit on
  `@drawSteelAdmonition/EncounterData` is a type or a different helper. The only callers are
  `test/unit/model/{encounter-data,initiative-serialize,initiative-resolve-refs}.test.ts` and
  `test/dom/views/minion-stamina-pool-modal.test.ts`. The asymmetry is now a documented landmine:
  the byte-compat oracle no longer merges `with_captain` and does not call `initMinionPool`, so
  the `'ref fixture deep-equals the legacy parseEncounterData materialization'` test
  (`initiative-resolve-refs.test.ts:88`) would break the day anyone adds `with_captain` to
  `seedStatblockNotes`. The new tests correctly build their own vault and say so in a header
  comment. Acceptable as shipped.
- **I-2 — badge CSS is Steel-scoped and print-inert: CONFIRMED, two ways.** Both new rules carry
  the full `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative']`
  guard (`styles-source.css:10664` and `:10669`), and the subject node is
  `display: none` in the base layer for both print classes (`styles-source.css:1362-1366`, the
  SC-183 round-2 base-hidden list). Empirically: freeze 210/210 with 0 mismatches and in-run
  `print-twin parity OK (119 capture ids)`.
- **I-3 — the two `resolveRefs` merge sites are in lockstep.** `resolveRefs.ts:113` (hero) and
  `:140` (creature) copy `with_captain` only-if-unset in exactly the same shape as
  `name`/`max_stamina`/`image`. The two legacy merge sites in `EncounterData.ts` are deliberately
  not updated (see I-1).
- **I-4 — parser anchoring is correct but the shipped negative corpus has a gap.**
  `WITH_CAPTAIN_STAMINA_RE = /^\+(\d+)\s+bonus to Stamina$/i` over `raw.trim()`. I probed the
  embedded/suffixed shapes the brief asked about and every one is correctly rejected:
  `'gains +2 bonus to Stamina and an edge'`, `'+2 bonus to Stamina and an edge'`,
  `'each minion gains +2 bonus to Stamina'`, `'+2 bonus to Stamina.'`, `'2 bonus to Stamina'`,
  `'-2 bonus to Stamina'`, `'+0 bonus to Stamina'` → all `undefined`. The shipped test corpus
  covers the 19 non-Stamina shapes and `+0`, but **no embedded Stamina shape** — so a future
  loosening from `^…$` to an unanchored `.test()` would pass the suite. Add one line to the
  negative `test.each`.
- **I-5 — `with_captain` now serializes into the user's block** on the first write-back of a
  ref-bearing squad (`serialize` = `stringifyYaml(model).trim()`, `model.ts:274-276`). Same
  accepted Plan-06 divergence class as `name`/`max_stamina`/`image`. The byte-compat test covers
  the ref-free `squad.yaml` only; no test covers a ref-bearing write-back. Noting, not blocking.
- **I-6 — asymmetric homes.** `initMinionPool` writes `minion_stamina_pool_max` on the
  **creature** while `setMinionPool` may write the pool on the **group** (one-squad back-compat).
  Harmless (`minionPoolMaxOf` only ever reads the creature) and byte-neutral for ordinary squads,
  but worth a comment.

---

## Probes I ran (all executed; results verbatim)

Written as throwaway jest files in the worktree, run, then **deleted** (`git status --porcelain`
is empty; no probe residue, no committed test).

| # | Probe | Result |
|---|---|---|
| 1 | Worked example integrity: 5×5 goblins +2 | `35/35` → 2 deaths → `21/35` → captain down at 3 alive → `15/29` → heal/re-promote → `21/35`, flag `true/false/true`. **Exact match to the spec.** ✅ |
| 2 | Reload mid-state at every step (`serialize`→`parse` fixed point) | `35/35`, `21/35`, `15/29`, reparsed twice → still `15/29`; a repeat `applyCaptainBonusTransition` returns `false` and moves nothing. **No double-apply, no drop, idempotent.** ✅ |
| 3 | Pre-upgrade YAML blob (`minion_stamina_pool: 18`, no flag) with a bound captain | loads `18/25` unchanged, flag/max absent; relieve → transition returns `false`, still `18/25` (**no stranded negative**); promote afterwards → `28/35` (+2×5). **Matches the ruling.** ✅ |
| 4 | Two squads, different captains, different N (`+2` on 5×5, `+6` on 3×4) | `35` and `30` independently; Boss B down → archers `12/12`, cutters untouched `35/35`. ✅ |
| 5 | Parser corpus incl. embedded/suffixed negatives | 12 cases, all as specified (see I-4). ✅ |
| 6 | **`resetEncounter`** after a relieve | `25/29 flag=false persisted max=29` — **H-2**. ❌ |
| 6b | `resetEncounter` with a stale active flag | `25/35 flag=true`; re-promote `moved=false` — **H-2 latch**. ❌ |
| 7 | Hand-edited pool (4) below the withdrawal amount, then captain down | `0/25` — current clamped at 0, max never negative. ✅ |
| 8 | Captain creature deleted from the block | `21/35 flag=true live bonus=0`; replacement promote `moved=false` — **M-1**. ❌ |
| 9 | `isCaptainDown` semantics: zero instances / undefined `current_stamina` | both → bonus `2` (base would have read "down") — **L-1**. ⚠️ |
| 10 | Declaration order captain-first vs minion-first | both build `35/35` — the ordering fix works. ✅ |
| A | **Real `MinionStaminaPoolModal`**, pre-upgrade captained squad (`with_captain_stamina: 4`, no flag) | max `/ 20`, 8 damage → "will kill **1** minion(s)"; control without `with_captain` → "**2**" — **H-1**, a regression vs base. ❌ |
| B | Real modal, flag `true` + captain at 0 | max `/ 40`, live bonus 0, 4 damage → "will kill **1** minion(s)" (should be 0) — **H-1** mirror. ❌ |

## Test-quality assessment (scope D)

Real assertions, not vacuous, and genuinely adversarial in places (the stepper-bound test picks
`15` precisely because it sits strictly between the two candidate maxes; the byte-compat test
proves the new keys never appear on an ordinary squad). All three ticket-named triggers are
covered — promote, relieve, captain-death — plus heal-back, promote-then-relieve no-op,
clamp-at-0, idempotent re-read, the multi-squad `data-captain-bonus` summary, YAML round-trip,
the override-wins precedence, and a 19-shape non-Stamina negative corpus.

Gaps, all of which map to findings above:

1. No test for `resetEncounter` × a bonus-bearing squad (**H-2** would have been caught).
2. No test where the persisted flag and the live gate **disagree** — every modal test that
   exercises the bonus sets `captainBonusActive` explicitly, which is exactly the state where the
   two agree (**H-1** hides in the gap).
3. No negative parser case with a Stamina shape **embedded** in a longer string (**I-4**).
4. No test for a captain that has left the group entirely (**M-1**).

---

## Recommended fix round (minimum to land)

1. **H-1** — add `foldedCaptainStaminaBonus(creature)` (persisted-flag-driven) and use it at
   `view.ts:1626` and `MinionStaminaPoolModal.ts:262`; regression tests from PROBE A and PROBE B.
2. **H-2** — clear `minion_stamina_pool_max` and `captain_bonus_active` in `resetEncounter`
   (`EncounterData.ts:527-535`); regression test from PROBE 6.
3. **M-1** — put the ruling question to Scott (strand vs. one-shot OFF-transition when
   `captain_bonus_active` is true and **no captain exists**), then implement his answer. Do not
   pick silently.
4. **I-4** — one line added to the negative parser `test.each`.
5. **L-1** — mention the `isCaptainDown` semantic change explicitly on the ticket.

L-2, L-3, L-4, I-5, I-6 are notes/comments, not blockers.

None of the above should move a frozen byte or a shot: they are model/readout changes with the
badge and CSS untouched. Expect the freeze to stay at 210/210 and the shot count at 478.

---

# Scoped re-review — fix round `778a341` (2026-08-29)

Delta only: `b0beb40..778a341`. Not a fresh full pass. 5 src files, 5 test files,
+442/-10.

## VERDICT: **LAND-READY**

All three blocking findings (H-1, H-2, M-1) are fixed, verified by re-running my original
failing probes. The fix round introduced no regressions I could find, byte-compat for ordinary
squads is intact, and all six gates reproduce the claimed numbers. Two INFO notes below; neither
blocks.

## Gate re-run (all by me, foreground, devbox-wrapped, gate command last)

| Gate | Claimed | I measured | Verdict |
|---|---|---|---|
| `npm run tsc` | clean | clean, no output | ✅ |
| `npm run lint` | clean | clean (only the pre-existing `.eslintignore` deprecation warning) | ✅ |
| `npx jest` | 3491 / 1 skipped | **3491 passed / 1 skipped / 3492 total**, 189 passed + 1 skipped of 190 suites, 3 snapshots, 23.8 s | ✅ exact |
| `npm run shots` | — | **478 PNGs, 0 FAIL**; `print-twin parity OK (119)`; `host-copy pin OK`; `button host-leak OK (666)` | ✅ |
| `check-freeze.sh` | 210/210 | **`freeze OK (210/210 …)`** — 0 FAILED, 0 missing | ✅ |
| `npm run parity` | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** | ✅ |

Load 1.29→3.57 during the run; no `sidebarEncounterHandoff` flake appeared, no A/B needed.
Tree left clean (`git status --porcelain` empty); both probe files deleted.

## Probe results (re-ran my originals against 778a341)

### H-1 — FIXED (RE-PROBE A / B, real `MinionStaminaPoolModal`)

```
RE-PROBE A (pre-upgrade blob, with_captain_stamina: 4, no flag):
  max = 20 | folded = 0 | live gate = 4 | readout = 20/20 (4) | amount = 5
  modal max cell = "/ 20"
  8 damage -> "will kill 2 minion(s)"      [was 1 — now matches base and the control]
RE-PROBE B (flag=true, captain at 0):
  max cell = "/ 40" | folded = 4 | live gate = 0
  4 damage -> "will kill 0 minion(s)"      [was 1]
  8 damage -> "will kill 1 minion(s)"      [correct at the folded step of 8]
RE-PROBE C (hand-authored flag, captain_bonus_n absent):
  folded = 4  — the `?? withCaptainStaminaN` fallback works
```

The readout is now internally consistent in both directions (`20/20 (4)` → 5×4 = 20;
`40/40 (8)` → 5×8 = 40). In both scenarios `folded` and the live gate disagree and the readout
correctly follows `folded`.

### H-2 — FIXED (RE-PROBE 6 / 6b)

```
6  (captained 5x5 +2, damage to 21, relieve -> 15/29, Reset Encounter State, reload):
   25/25  flag=undefined  n=undefined  persistedMax=undefined      [was 25/29]
6b (yaml demote to attached -> 25/25 flag=false; reset -> 25/25 clean;
    then promote): moved=true, 35/35                                [was moved=false, latched]
```

### M-1 — FIXED (RE-PROBE 8), and the un-wind is exact

```
8  captain creature deleted from the block, reload:
     15/29  flag=false  n=undefined       [was 21/35 stranded; 21-2*3 / 35-2*3 is correct]
   second reload (double-un-wind check): 15/29 — unchanged ✅
   add a replacement captain, promote:   21/35  moved=true ✅
12b un-wind uses the PERSISTED n, not a re-parse: GM changes with_captain_stamina
    2 -> 6 and deletes the captain -> 25/25 (35 - 2*5), NOT 5 (35 - 6*5) ✅
```

### No-regression probes on the new machinery

```
1   worked example unchanged: 35/35 -> 21/35 -> 15/29 -> 21/35, with captain_bonus_n
    2 / undefined / 2 tracking the flag exactly ✅
11  pre-upgrade blob (18/25, no flag, no captain): reconcile returns false, nothing moves,
    no keys grow ✅
11b ordinary uncaptained squad, 3 serialize->parse round trips: emits only
    `minion_stamina_pool: 18` — no `captain_bonus*`, no `minion_stamina_pool_max` ✅
    (byte-compat for the ordinary squad is intact — reconcile does NOT fire on every load)
12  captain_bonus_n serialization: ON state emits `captain_bonus_n: 2`; OFF state emits
    `minion_stamina_pool_max` + `captain_bonus_active: false` and **no** `captain_bonus_n`
    key at all — no `null` residue, reparse yields `undefined`, folded = 0 ✅
```

## Delta code review (regressions introduced by the fixes)

**Reconcile ordering — CORRECT in both parse paths, and the pre-merge hazard is unreachable.**

- `model.ts:242` sits *after* the minion-instance materialization block (`:211-234`), so the
  alive-count exists. The worker's self-caught ordering bug is genuinely fixed.
- `resolveRefs.ts:204` runs in phase 3, by which time `parse()` has already materialized minion
  instances unconditionally — ordering is safe there too.
- I hunted the one hazard this ordering could still have: `model.ts`'s reconcile runs **before**
  the statblock merge, so a minion whose `name` is ref-sourced could in principle make
  `captainOfSquad` miss a `captain_of`-named captain and trigger a premature un-wind. **Not
  reachable**: `validateSquad` (`EncounterData.ts:470-475`) runs first (`model.ts:173`) and hard-
  throws on a `captain_of` that names a minion not in the group, so that configuration never
  reaches the reconcile. Measured (RE-PROBE 13): the ref-named + `captain_of` block throws the
  pre-existing validation error; both controls (locally-named minion, and ref-named minion with
  an unnamed captain) parse to **78/78 flag=true** — no premature un-wind. `captainOfSquad` is
  therefore merge-independent in every parseable shape, and the sync-parse placement is sound.

**Double-un-wind — not possible.** Reconcile guards on `if (!minion.captain_bonus_active) return
false` and clears the flag as its last act, so the second call site (and every later reload)
no-ops. Verified empirically above.

**Live-gate call sites — all remaining uses are legitimately live.** `grep` over `src/`: the only
callers of `captainStaminaBonus` are `EncounterData.ts:322` (`initMinionPool`) and `:346`
(`applyCaptainBonusTransition`) — both are *crossing decisions*, exactly where the live gate
belongs. Zero readouts use it. `foldedCaptainStaminaBonus` is used at `view.ts:1632` and
`MinionStaminaPoolModal.ts:275` — the two sites I flagged, and no others exist.

**`captain_bonus_n` lifecycle is airtight.** Written by `initMinionPool` (`:328`, only when
`bonus > 0`) and `applyCaptainBonusTransition` (`:359`, `nowActive ? n : undefined`); cleared by
`reconcileOrphanedCaptainBonus` (`:398`) and by `resetEncounter` (`:614`). Every write is paired
with the flag, so the two can't diverge.

**Test quality of the delta.** 21 new cases, all real assertions, and three of them are my exact
review repros transcribed as regression tests (`'review repro: captained 5x5 +2, damage to 21,
relieve (15/29), reset …'`, `'PROBE A: …'`, `'PROBE B: …'`). Both parse paths get their own
M-1 test (`initiative.test.ts` for the sync path, `initiative-resolve-refs.test.ts:355` for the
ref path). The I-4 parser gap is closed with `'gains +2 bonus to Stamina and an edge'` added to
the negative corpus.

## Remaining notes (non-blocking)

- **INFO-A — `reconcileOrphanedCaptainBonus` does not clamp the max at ≥ 0** (`EncounterData.ts:
  396`), matching `applyCaptainBonusTransition`'s existing behaviour and its own test
  (`'clamps current at 0 …; max is never clamped'`). Only reachable from self-inconsistent
  hand-authored YAML (`captain_bonus_active: true` with an oversized `captain_bonus_n`, or with
  no `minion_stamina_pool_max`). Deliberate and documented; noting only so it isn't re-discovered
  as a finding later.
- **INFO-B — a squad that has *ever* carried a bonus keeps `minion_stamina_pool_max` and
  `captain_bonus_active: false` in its YAML after the bonus is withdrawn.** Correct (the max
  carries the sanctioned residue), and the never-bonused squad still emits nothing new
  (RE-PROBE 11b). Cosmetic only.
- **INFO-C (pre-existing, not SC-195)** — a `captain_of`-named captain plus a minion whose name
  comes only from a `statblock:` ref is a hard parse error via `validateSquad`, because the
  validation runs before the merge. Unrelated to this ticket; worth its own Backlog ticket if
  multi-squad ref-bearing groups are ever wanted.

My original L-1 (`isCaptainDown` semantics), L-2 (kill-ladder baseline offset in the residue
state), L-3 (evenly-spaced ticks), L-4 (`minion_stamina_pool_max` freezes the max against later
`amount`/`max_stamina` edits), I-5 (`with_captain` serializes into ref-bearing blocks) and I-6
(asymmetric field homes) are unchanged by this round and remain as filed — all notes, none
blocking.
