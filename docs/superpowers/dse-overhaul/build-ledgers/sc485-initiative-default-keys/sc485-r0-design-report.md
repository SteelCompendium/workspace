# SC-485 r0 design survey: ds-initiative writes default keys the user never wrote

Worker: orchestration:reviewer (Opus), read-only. Plugin `sc485-initiative-default-keys` @ `e8f6a14` (not rebased; origin/develop has moved to d152ea4, which does not affect this design). At the end, `git -C …/draw-steel-elements status --porcelain` printed nothing (the probe was copied to scratch, then deleted).
Scratch folder (S): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r0-design-q7k2m9/`

## Executive summary

1. **Design.** Use SC-482's helper per nested object. In `parse` (`model.ts`), read which keys each object (top, hero, group, creature, authored instance) left absent, BEFORE the fill runs. `parse` mutates `data` in place. Snapshot the values at the end of `parse`, then snapshot again at the end of `resolveRefs` (statblock merges and stamina fills land there; M04). `serialize` walks a nested DTO: instances → creatures → groups → heroes → top.
2. **The contract alone is not enough: one co-derived unit.** A squad's pool (`minion_stamina_pool`, which lives on the group or the creature) and the captain-bonus trio (`minion_stamina_pool_max`, `captain_bonus_active`, `captain_bonus_n`) must be written all-or-nothing. Under the plain per-key rule, a born-captained squad whose pool is written loses its bonus on re-parse: the readout goes from `12/18 (6)` to `12/12 (4)` (C22, C23). **No existing test catches this** (proto-nocouple: the same 9 failures). With the unit rule the readout is correct (C22/C23 under the coupled prototype).
3. Treat `isHero` as an ordinary filled default and omit it. Parse always re-derives it, and nothing reads it from YAML. Write an absent `instances` whole once it changes (SC-482 FU1). That keeps every e2e `toMatchObject` instance assertion valid.
4. Measured by a prototype: the ticket repro writes only `has_taken_turn: true` (C01). For a fully-authored block the output is byte-identical to today in all 21 controls. Heal back to full drops `instances` again (C24). Reset writes back the source's own shape (C09).
5. **Scott decisions: none required.** One product-flavoured owner ruling (D1, §11): statblock-merged `name`/`max_stamina`/`image` are no longer frozen into the block on first write, so the tracker stays live to statblock edits.
6. **Size:** 2 src files plus an optional additive export in the helper. The prototype breaks **9 existing tests in 3 files**, all of which pass on stock (stock3.log). Add about 20 new jest cases, 1 new e2e spec plus 1 fixture note, and a CHANGELOG bullet. No lifecycle scenario. **The lifecycle G-S8/G-S15 runs on `tall.md` are a risk to watch (UNMEASURED).**

## Evidence files (all in S)

| File | What it holds |
|---|---|
| `zzSc485Probe.test.ts.txt` | The probe (copied from `test/dom/zzSc485Probe.test.ts`, then deleted). Cases C01–C25 and M01–M04. Each C case runs the real `ElementPipeline.run` with a real DOM action and captures the `replaceSource` argument, for both **today's** `initiativeElement` and a **probe-local prototype** def. Each case also runs a fully-authored control (today's output fed back in) and re-parses the prototype output. |
| `probe-out.json`, `probe-jest.log` | Stock code plus the probe-local prototype (no pool coupling). `Tests: 29 passed, 29 total`, rc=0. |
| `proto/` (`model.ts`, `resolveRefs.ts`, `proto-resolver.js`, `jest.proto.config.js`, `jest.proto.probe.config.js`) | **Measurement prototype, scratch only.** A jest `resolver` swaps `src/elements/initiative/model.ts` and `resolveRefs.ts` for the scratch versions, so the existing suites run against the proposed design. No tracked file is touched. Includes the pool-unit coupling. |
| `proto-full.log`, `proto-full.json` | The full jest suite against the coupled prototype: `Test Suites: 3 failed, 1 skipped, 235 passed, 238 of 239 total` / `Tests: 9 failed, 2 skipped, 5733 passed, 5744 total`. The 2 skipped / 1 suite skipped are the expected fresh-worktree shots-cache skips. |
| `proto-nocouple.log`, `proto-nocouple.json` | The same run with `SC485_NO_COUPLING=1`, which disables the pool-unit coupling (plain per-key rule): `Test Suites: 3 failed, 1 skipped, 235 passed, 238 of 239 total` / `Tests: 9 failed, 2 skipped, 5733 passed, 5744 total`. The same 9 tests fail, so **the suite cannot tell coupled from uncoupled.** |
| `probe-under-proto-out.json`, `probe-under-proto.log` | The probe run with initiative swapped for the coupled prototype. `Tests: 29 passed, 29 total`, rc=0. Its "today" column is therefore the coupled prototype. It matches the probe-local prototype on every C01–C25 case except C22/C23, where the coupling fixes the readout. (A first coupled run differed on C14: it wrote `minion_stamina_pool: 20` because of a prototype bug, where an `undefined`-valued trio key counted as "touched". That bug was fixed and rerun, and C14 now matches. Implementation note in §2.) |
| `stock3.log` | The 3 failing files on stock code: `Tests: 179 passed, 179 total`, rc=0. |
| `npm-ci.log` | `npm ci` in the worktree (rc=0; `node_modules` is ignored). |

## 1. Inventory of filled defaults

`parse` mutates the incoming `data` in place and returns it (`model.ts:133`, `:297`). M01 confirms `model === data` and that heroes and creatures keep their identity (probe-out.json "M01"). So presence MUST be read before each fill.

| Level | Key | Default | Derived? | Where |
|---|---|---|---|---|
| top | `malice` | `{value: 0}` | no | `model.ts:292` |
| top | `name` | not filled. `null` is deleted and a number/boolean is coerced to a string | — | `model.ts:140-141` |
| top | `round` | **not filled**: read as `?? 1` (`view.ts:447`, `:596`, `definition.ts:269`), written only by `advanceRound` (`model.ts:360`) | — | — |
| top | (no `turn`/current-turn key exists; `hero_tokens` belongs to ds-party, not initiative) | — | — | grep of `src/elements/initiative/*.ts` and `EncounterData.ts`: no hits |
| hero | `conditions` | `[]` (authored entries are normalised: string → `{key}`) | no | `model.ts:158-161`, `:124` |
| hero | `isHero` | `true`, **set unconditionally** (overwrites an authored value) | no | `model.ts:163` |
| hero | `has_taken_turn` | `false` | no | `model.ts:164` |
| hero | `current_stamina` | `max_stamina`. The key is INSERTED holding `undefined` when max comes from a statblock (M01 `hasKey: true`) | yes | `model.ts:165`, refilled at `resolveRefs.ts:211` |
| hero | `temp_stamina` | `0` | no | `model.ts:166`, `resolveRefs.ts:212` |
| hero | `name`, `max_stamina`, `image`, `with_captain` | copied from the statblock, only if unset | yes (statblock) | `resolveRefs.ts:121-124` |
| group | `has_taken_turn` | `false` | no | `model.ts:178` |
| group | `is_squad` | `false` | no | `model.ts:179` |
| group | `minion_stamina_pool` (one-squad home) | `(max + bonus) × amount` | yes | `initMinionPool` `EncounterData.ts:349-357` via `setMinionPool` `:213-219`; called at `model.ts:219-224`, `resolveRefs.ts:221-226` |
| creature | `isHero` | `false`, unconditional | no | `model.ts:204` |
| creature | `instances` | generated when absent or `length !== amount`; ids `i + 1` (deterministic) | yes (amount, max) | minion `model.ts:226-234`; regular `:262-271` |
| creature | `minion_stamina_pool` (multi-squad home) | as for the group | yes | `EncounterData.ts:213-219` |
| creature | `minion_stamina_pool_max`, `captain_bonus_active`, `captain_bonus_n` | set only when the squad is born captained with a nonzero bonus | yes | `EncounterData.ts:353-357` |
| creature | `name`, `max_stamina`, `image`, `with_captain` | copied from the statblock, only if unset | yes | `resolveRefs.ts:157-160` |
| authored instance | `current_stamina` | creature `max_stamina` | yes | `model.ts:280`, `resolveRefs.ts:235` |
| authored instance | `temp_stamina` | `0` | no | `model.ts:281`, `resolveRefs.ts:236` |
| authored instance | `conditions` | `[]` / normalised | no | `model.ts:282-285`, `:244-247` |
| generated instance | `id, current_stamina, temp_stamina, conditions` (regular); `id, conditions` (minion) | plugin-built inside parse | — | `model.ts:229-233`, `:265-270` |

`reconcileOrphanedCaptainBonus` (`model.ts:257`, `resolveRefs.ts:231`) changes the pool and trio only when `captain_bonus_active` was authored as true (`EncounterData.ts:413-428`). Those keys are authored, so they are written anyway.

Measured today (C01, ticket repro, probe-out.json): one write adds 19 lines the source never had: hero `conditions: [] / isHero / current_stamina / temp_stamina`; creature `isHero: false` plus 2 full instances; group `has_taken_turn: false / is_squad: false`; `malice: {value: 0}`. This matches the ticket verbatim. Statblock-only source (C12): today additionally writes the merged `name`, `max_stamina`, `image`, `with_captain` and the captain trio.

## 2. Where to record, and the proposed API

**The snapshot must be taken after `resolveRefs`.** M04 (probe-out.json): with a parse-only snapshot, a `statblock:`-only hero writes `current_stamina: 80 / name / max_stamina / image`. With a re-snapshot after `resolveRefs`, it writes only `statblock: Frodo Baggins`.

Every path that produces a view model runs `parse` and then `resolveRefs`: the pipeline (`pipeline.ts:465-468`) and the sidebar via `prepareModel` (`SidebarPanel.ts:250-265`). FormModal does not matter here. Initiative has no schema, so it uses raw mode, where Save writes the textarea verbatim (`FormModal.ts:204`). The encounter "Create tracker block" path builds an object that was never parsed (§7).

Proposal (minimal change; the SC-482 helper is used as is):

- `model.ts`: a module-private `WeakMap<object, string[]>` holding the absent keys. Fill it inside `parse`, in the same loops and before each fill: top at function entry; each hero before `:158`; each group before `:178`; each creature before `:198`; each authored instance at the top of the validate branch (`:237` / `:274`). Use the key lists from §1. A key counts as absent when `obj[key] === undefined` (SC-466 r2). At the end of `parse`, call an exported `snapshotFilledDefaults(model)`. It runs the existing `recordAbsentDefaults(obj, absentKeys)` on every recorded object (`undeclaredDefaults.ts:62-69`, which overwrites, so it can be called twice).
- `resolveRefs.ts`: call `snapshotFilledDefaults(model)` before `return model` (`:242`). Ref-free models are byte-identical: the fills there are guarded no-ops.
- `serialize`: a nested DTO walk using `omitUntouchedDefaults(owner, dto)` (`undeclaredDefaults.ts:74-80`) on instances, then creatures (with the filtered instances), then groups, then heroes, then top. Keep SC-377's name-first rule (`model.ts:303-306`). Do NOT use `stringifyOmittingUntouched`'s blank-body branch: initiative cannot parse a non-mapping (`model.ts:130`). Invariant that makes "compare the DTO value" safe: a key with recorded nested children (`heroes`, `enemy_groups`, `creatures`, authored `instances`) is never itself recorded absent. The first three are required, and authored `instances` are present.
- **Pool unit:** for each minion creature of a squad group, if any of {the pool on its live home (creature field first, else group, mirroring `minionPoolOf` `EncounterData.ts:206-208`), `minion_stamina_pool_max`, `captain_bonus_active`, `captain_bonus_n`} would be written, write all of them. This needs a per-key "untouched?" query the helper does not export. Options: (a) an additive `isUntouchedDefault(owner, key)` export, or (b) an optional `keep: ReadonlySet<string>` parameter on `omitUntouchedDefaults`. Either is additive, and every SC-482/SC-466 test runs unchanged (the prototype used only the existing exports, via a one-key DTO trick: `proto/model.ts:57-62`). **Implementation pitfall, measured:** a key whose value is `undefined` must count as untouched, or every ordinary squad writes its pool (first coupled C14 run, fixed at `proto/model.ts:57-58`).

Why the coupling is needed (C22/C23, probe-out.json vs probe-under-proto-out.json): when the pool is written, `initMinionPool` is skipped on re-parse because the pool is no longer `== null` (`model.ts:219`, `resolveRefs.ts:221`). So an omitted trio is never re-derived, and `foldedCaptainStaminaBonus` reads 0 (`EncounterData.ts:333-336`). Measured: re-parsed readout `12/12 (4)` under the uncoupled rule, against `12/18 (6)` today, live after the write, and under the coupled rule.

I checked other derived keys for the same hazard. `current_stamina` derives from `max_stamina`, but no plugin writer changes max: `StaminaBar.max_stamina` is set only in its constructor (`StaminaBar.ts:118`), and `updateHero` writes back the same value (`:135`). Instances derive from `amount`, which no writer changes. No other coupling was found.

## 3. Object identity across writers

Every writer mutates the parsed objects in place. **No writer rebuilds, sorts or splices** `heroes`, `enemy_groups`, `creatures` or `instances`. A grep of `view.ts`, `views/*.ts`, `EncounterData.ts` and `sidebar/*.ts` for array reassignment finds only `model.ts:227,263` (parse) and `EncounterData.ts:656` (reset) plus `:825,871` (the legacy oracle).

| Writer | file:line | Identity |
|---|---|---|
| hero / group turn toggle | `view.ts:1408`, `:1531`, persisted at `:711-715`, `:774-778` | property on the same object |
| per-actor actions | `view.ts:853-863` (hero/instance), `:928-940` (squad) | `actor.actions` assigned on the same actor |
| hero stamina modal | `view.ts:1435-1445` → `StaminaBar.updateHero` `StaminaBar.ts:134-138` | in place |
| creature stamina modal | `view.ts:1879`, `:1911` → `updateCreature` `StaminaBar.ts:140-143` | in place on the instance |
| captain bonus transition | `view.ts:1899-1903` → `EncounterData.ts:372-391` | in place |
| roster cell select | `view.ts:1646-1648` (`group.selectedInstanceKey`) | in place (not a default) |
| MinionStaminaPoolModal | `MinionStaminaPoolModal.ts:279` (`setMinionPool`), `:282-285` (`instance.isDead = true`), `:569` (conditions filter) | in place; the instances array is kept |
| conditions add / remove | `view.ts:2076-2080`, `:2059` | `owner.conditions` reassigned on the same owner; compared by value |
| malice stepper / quick-add | `view.ts:415-420`, `:596` | `malice.value` / log in place; `malice` compared whole |
| title | `view.ts:333-336` | `data.name` set or deleted |
| Advance round / Reset turns | `model.ts:359-368`, `:317-339` | in place |
| Reset encounter | `EncounterData.ts:622-665` | props set to `undefined`; `instances = undefined` (`:656`) |
| promote / relieve captain | `EncounterData.ts:438-458` | in place |
| rebuild | `view.ts:162-168` → `framework/view.ts:208-218` `update(this.model)` | same instance |

There is no add/remove-combatant, reorder or drag writer in the initiative view. Re-parse paths build a new model, which records afresh from its new source: sidebar `prepareModel`, the pipeline when adoption is off. Adoption keeps the instance.

**(a) Rebuilt instance ids.** No writer rebuilds instances. Only parse generates them, with ids `i + 1` (`model.ts:228-233`, `:264-270`), so they are deterministic. Reset does not rebuild: it drops the array (`EncounterData.ts:656`). On the same adopted view, `instances` stays `undefined` and is not emitted at all. C25 (damage, Reset, then turn toggle): the final write has no `instances` and is only source + `has_taken_turn: true`. The next re-parse regenerates the same ids, and its new snapshot equals. Back to full without a reset (C24: damage 3, then heal 3 on the same view): the creature's `instances` JSON-equals its parse snapshot again, and **the prototype's final write is exactly the source**. "Squad toggle": no writer toggles `is_squad`. The squad writers (pool modal, captain promote/relieve) mutate in place, as listed above.

## 4. `isHero`

- **Readers:** only `view.ts:2089-2091` (`'isHero' in character ? character.isHero : false`, on the in-memory model). Parse sets it unconditionally on every parse (`model.ts:163`, `:204`), so omitting it from YAML cannot change what the reader sees. `StaminaEditModal`'s `isHero` is a constructor argument from the caller (`StaminaEditModal.ts:312-319`; the caller passes `true` at `view.ts:1437`). It is not read from YAML. No `.md` / `.yaml` / `.json` file in the plugin mentions `isHero` (grep, 0 hits). The types declare it required (`EncounterData.ts:64`, `:96`).
- **Writers:** parse, and the encounter builder (`encounter/view.ts:369`, `:395`, `:407`), which writes `isHero: false` into generated blocks.
- An authored `isHero: false` under `heroes:` is written back as `true` today and in the prototype (C19). Authored key, value changed by parse. This predates the ticket.
- **Recommendation:** treat it as an ordinary filled default (omit when absent). No visible effect. Measured in every prototype case: the re-parsed prototype output rendered with no error card (probe-out.json `protoReparseErrorCard: false`, C01–C21).

## 5. `instances`

Generated from `amount` when absent or when `length !== amount` (§1). A partially authored list is regenerated wholesale. C18 (1 entry for amount 2, with authored `current_stamina: 4`): today and the prototype both write the regenerated list, and the authored `4` is lost (it becomes 10). That predates the ticket; the key is authored, so it is written. A partial list is not a documented shape, so it is out of scope.

Whole-value (SC-482 FU1): damaging one goblin of two writes the full `instances` list with every generated key (C04). Measured: `- id: 1 / current_stamina: 7 / temp_stamina: 0 / conditions: []` and `- id: 2 …10…`. The alternative, recording each generated instance's keys, would write `- id: 2` with nothing else. That breaks the e2e assertions INIT-STAM-E09/E10/E20/B2 (`e2e/specs/initiative/stamina-entry.e2e.ts:69-71`, `:83-85`, `:126-128`, `:177-179`), which require `{id: 2, current_stamina: 60}` for the untouched instance. **Recommend whole-value.**

Authored ids-only instances (C16/C17): the per-instance record works. A hero toggle writes no instance keys, and damage writes only `current_stamina: 7` on instance 1.

Squads: minion instances carry only `id` and `conditions`. A pool-modal kill sets `isDead`, so `instances` is written whole (C15). Pool damage without a kill leaves `instances` untouched and omitted. The pool and trio are coupled (§2).

## 6. Top level

`malice` is the only top-level fill (`model.ts:292`). It is written whole once changed (C06 writes `malice:\n  value: 1`) and dropped again at 0 on the same view (C07). `round` is never filled; Advance round writes `round: 2` (C08). `name` is not filled. `_dse_from` and unknown keys pass through (C20).

## 7. Plugin-built entries

The only plugin-built initiative data is the encounter builder's "Create tracker block" (`encounter/view.ts:358-416`, written at `:453` as `_dse_from: … + serializeInitiative(data)`). It is never parsed, so it has no record and serializes whole (M03: `equal: true`, including `isHero: false` and `malice: {value: 0}`). Its generated output is unchanged.

Once that text is in the note it is a source like any other. On first interaction, its present keys (`is_squad`, `isHero`, `max_stamina`, `malice`) are written as authored, and only the changed key is added (C20: `has_taken_turn: true`, plus the pre-existing `_dse_from` quote stripping).

The initiative view has no add-combatant feature, so "plugin-added hero next to a user-authored one" cannot occur. A hand-added hero is authored. Coherent. Optional follow-up (report only): the builder could stop emitting `isHero: false`.

## 8. Fully-authored control

For each of C01–C21, today's output was fed back as the source and the same action rerun (probe-out.json `controlToday`). The only lines that changed were the touched ones, for example C04 `current_stamina: 7→4` and C08 `round: 2→3`. `controlProtoEqualsToday: true` for **all 21**. M02: `protoFullyAuthoredEqualsLegacy: true`.

`isHero` is written on a fully-authored block because it is present there, which the rule requires. Today it is also written on a minimal block, which is the leak.

## 9. Tests pinning bytes (MEASURED against the coupled prototype: proto-full.log)

The 9 failures, all of which pass on stock (stock3.log, 179/179):

- `test/unit/model/initiative-serialize.test.ts`, 7 tests. T-1 quick-start, squad, mid-encounter, SC-186 duration, "serialized shape pins" (`:132` expects `has_taken_turn: false`), and SC-195 "squad.yaml never grows…" (`:374`) / "captained squad round-trips" (`:401` expects `minion_stamina_pool_max: 78` on an untouched serialize).
  - **What the oracle should become.** Keep `parse` deep-equals legacy `parseEncounterData`; the model is unchanged. Replace the byte-equality with two pins:
    - Fully-authored: `serialize(parse(L)) === L` where `L = legacyWriterBytes(src)` (M02: true).
    - Minimal untouched: `parseYaml(serialize(parse(src)))` deep-equals `parseYaml(src)` (M02: true for the repro and quick-start; false for squad.yaml only because of the pre-existing condition normalisation `grabbed` → `{key: grabbed}`).
  - SC-195 cases: assert the pool unit after a pool write, not on an untouched serialize.
- `test/dom/elements/initiative.test.ts`, 1 test: "M-1 regression: captain_bonus_n round-trips" (`:2913-2919`) expects `captain_bonus_n: 4` on an untouched born-captained serialize. Rewrite it as a pool write followed by the fixed point. That is exactly the C22/C23 scenario, and this test should become the coupling pin.
- `test/dom/elements/initiative-sc417-minion-squad.test.ts`, 1 test: HIGH-1 (`:355`). Its `written()` helper (`:102`, fails at `:108`) reads `instances` from the written YAML after a heal that does not touch them. Read it from `parse(written)` instead.

Every other initiative DOM test self-adjusts, because its oracle `legacyBytes` is `serialize(parse(src) + mutation)` (`initiative.test.ts:52-56`; also `turnEconomy.test.ts:72`, `malicePanel.test.ts:88`). **New tests are needed for the pool unit: the existing suite does not detect its absence** (proto-nocouple.log, identical 9).

UNMEASURED (not run against the prototype):

- **e2e.** All initiative e2e assertions are `toMatchObject` subsets (`e2e/specs/initiative/*.ts`; `expectNoteBlock` `e2e/driver/dse.ts:512-524`). By the analysis in §5 they should stay green.
- **Lifecycle.** The scenarios assert `/has_taken_turn: true/` (`visual-harness/obsidian-lifecycle.mjs:871`, `:1095`, `:1250`, `:1864`) and the title position (`:1335`…). Both are still written. **Risk:** G-S8 (`:1228`) and G-S15 (`:1815`) run on `Lifecycle/tall.md`, a block of 25 heroes (`:174`). Today the first write grows that block by about 4 lines per hero; with the fix it grows by about 1. G-S15's anti-vacuity checks ("never collapsed the sizer below the scroll position", G-S8 adoption-off `:1269`, G-S15 `:1831`) may depend on that growth. The full lifecycle run is mandatory. If it goes vacuous, the fixture needs re-measuring (SC-459/SC-470 precedent).
- **Fixtures.** `test/fixtures/initiative/*.yaml` and `e2e/vaults/shipped/Initiative/*.md` are sources and need no change.

## 10. Evidence plan

- **jest, new (about 20 cases).** Port the probe's C01–C25 and M02/M04 into `test/dom/elements/initiative.test.ts`, or a new `initiative-default-keys.test.ts`, through the real pipeline and DOM write. Include:
  - the ticket repro exact bytes (C01);
  - a fully-authored control byte-identical to today (C01–C21 controls);
  - the statblock-only hero writes no merged keys (C12, C13);
  - instances written whole and then dropped at full (C04, C24);
  - Reset (C09, C25);
  - malice round trip (C07);
  - the **pool unit**: C22 refs and C23 ref-free, re-parsed readout `12/18 (6)`;
  - "an undefined trio key is untouched" (squad.yaml group toggle writes no `minion_stamina_pool`, C14);
  - M04 snapshot timing;
  - plugin-built whole output (M03).
  - Mutants to prove red: drop the `resolveRefs` re-snapshot; drop the pool unit; record generated instances per key.
- **e2e, new spec `e2e/specs/initiative/default-keys.e2e.ts`.** It writes the real note in real Obsidian, using `dse.expectNoteBlock(...).toEqual` (exact, not a subset).
  - INIT-DEF-E01: on `Initiative/tracker.md`, a hero turn toggle → the block equals the source plus `has_taken_turn: true`. No `isHero`, `conditions`, `instances`, `is_squad` or `has_taken_turn: false`.
  - INIT-DEF-E02: damaging Ogre #1 → the source plus the whole `instances` list.
  - INIT-DEF-E03: a new fixture `Initiative/full.md` (today's materialized output for tracker.md) → only the touched line changes (raw-text line diff via `.value()` or a note read).
  - INIT-DEF-E04: Reset encounter on tracker.md → the source with `malice: {value: 0}`.
  - A statblock or squad e2e is not proposed: the shipped e2e vault has no statblock notes, and jest covers C12/C13/C21–C23.
- **Lifecycle:** no new scenario. There is no adoption, focus or timing behaviour specific to this change; the write path, host and adoption are unchanged. So **no G-S31**. The full lifecycle run must be in the gate, for the G-S8/G-S15 risk in §9.

## 11. Decisions

**Scott: none required.** The contract decides every case except D1, which the owner can rule on. If the owner would rather Scott decide, it is phrased for him.

- **D1: statblock-merged fields.** A combatant written as just `statblock: X` (hand-authored; the encounter builder also writes `max_stamina`) has its `name`, `max_stamina`, `image` and `with_captain` resolved from the statblock.
  - (a) **Omit them, per the contract (recommended).** The block stays as written, and the tracker follows later edits to that statblock even after combat starts. Edge case: an already-damaged `current_stamina: 75`, written, could exceed a lowered statblock max (75/60). A missing statblock errors either way: resolution throws whether or not the fields are present (`resolveRefs.ts:110-146`).
  - (b) **Keep today's behaviour.** The first write freezes them into the block, so the tracker stops following the statblock after the first click. It also keeps writing keys the user never wrote, which contradicts the ticket's Expected.
- **Owner-level, not product decisions:** pool-unit coupling (§2, required for correctness); whole-value `instances` (§5); `isHero` omitted (§4).

## 12. Size

- **src:**
  - `src/elements/initiative/model.ts`: presence capture in the parse loops, `snapshotFilledDefaults`, the DTO-walk serialize, the pool unit, and a header comment rewrite of the "BYTE-COMPAT boundary".
  - `src/elements/initiative/resolveRefs.ts`: one call before the return.
  - Optional: one additive export (or optional parameter) in `src/elements/shared/undeclaredDefaults.ts`.
- **Tests:** update 9 tests in 3 files (§9). Add about 20 jest cases. Add 1 e2e spec and 1 vault fixture (`e2e/vaults/shipped/Initiative/full.md`); the e2e census/manifest may need the new ids (`test/dom/e2eCensus.test.ts` exists; impact UNMEASURED).
- **Docs:** a CHANGELOG `## Unreleased` bullet.
- **Risks:**
  1. The pool-unit coupling, which is invisible to the existing suite.
  2. Snapshot timing: it must be re-taken after `resolveRefs` (M04).
  3. An `undefined`-valued key must count as untouched in the unit check.
  4. Lifecycle G-S8/G-S15 anti-vacuity on `tall.md` (UNMEASURED).
  5. D1 changes behaviour for statblock-only entries.
  6. Two pre-existing behaviours that this change does not alter: condition normalisation, and quote stripping (`_dse_from: "abc123"` → `abc123`, `statblock: "X"` → `X`).
