# SC-482 r0 survey report: which persisted blocks write default keys the user never wrote

Worker: S (agent aee9b5ca57305ad17), read-only. Plugin `sc482-wrapper-default-keys` @ `08206e3` (= origin/develop after fetch, unchanged). Final `git status --short`: empty (plugin and superproject worktree).

## Executive summary

1. **The ticket's suspected repro is false for `ds-skills`.** Only two models extend `ComponentWrapper` (StaminaBar, Skills). Skills is `shape: 'interactive'` with no `serialize`, so nothing writes it back except FormModal Save (that is SC-483). No measured write from any element added `collapsible` / `collapse_default`. The pipeline's collapse and prefs wrappers only re-emit keys they removed earlier.
2. **The leak is real elsewhere: each element's own parser fills defaults (not ComponentWrapper).** Measured leaks: **counter** (`current_value`, `min_value: 0`, `value_height: 3`, `name_height: 1`); **project** (`current_respite: 1`, plus `accrued`/`rolls` when untouched); **montage** (`successes: 0`, `failures: 0`, `current_round: 1`, `rounds`, limits); **party** (`members: []`); **encounter** (`party: {}` / `monsters: []`, and this happens **on render, with no user action**, through the `_computed` write); **negotiation** (`current_patience`, `current_interest`, `currentArgument:{5 keys}`, `i5..i0`, plus nested `motivations[].hasBeenAppealedTo`); **initiative** (nested per hero/group/creature: `isHero`, `has_taken_turn`, `current_stamina`, `temp_stamina`, `conditions: []`, `is_squad`, `instances[...]`, plus top-level `malice: {value: 0}`); **hero** (the whole `state:` block on first write, including a partial `state:`).
3. **No leak:** tokens, surges, resource, conditions (each serializer copies only the keys that are present), and stamina-bar (fixed by SC-466).
4. **Fully-authored control:** for every leaking element, today's write changes only the lines the action touched. The fix must keep that.
5. **Helper verdict: YES for 6 elements, using one shared helper at `src/elements/shared/undeclaredDefaults.ts`** (proposed). It generalises SC-466 in three ways. It records the value parse filled in (a JSON snapshot) rather than a constant table, which handles negotiation's derived defaults and object/array defaults. It reads presence BEFORE parse, because party, encounter and initiative mutate `data` in place. It applies to a DTO, which handles montage's ordered DTO and negotiation's nested Motivation. No `src/framework/host/` file is needed, and no framework file is needed either.
6. **Does not fit cleanly, so it needs an owner ruling:** **initiative** (defaults nested in arrays, a `resolveRefs` fill after parse, and a legacy-oracle byte-compat contract) and **hero** (the spec intends the seeded `state:` to be written at first interaction; hidden, experimental). I recommend deferring both to a follow-up.
7. **Size:** 6 elements in the recommended scope (counter, project, montage, party, encounter, negotiation), plus an optional stamina-bar migration onto the helper. An estimated 6 to 9 test files pin bytes. **No e2e spec covers the write surface of any of the 6** (e2e only has stamina-bar, initiative and callout specs).

## 1. Inventory (every element that writes a block back)

Write funnel: every element write goes through `ElementView.persist()` (`src/framework/view.ts:251`), which flushes `this.serialize(this.model)` at `view.ts:303` and calls `host.replaceSource()` at `:323`. The only hosts that write are `ReadingModeBlockHost.replaceSource` (`src/framework/host/ReadingModeBlockHost.ts:523`) and `SidebarBlockHost.replaceSource` (`SidebarBlockHost.ts:302`). The serializer is wrapped at `src/framework/pipeline.ts:608-623`: `withCollapseKeys` (`chrome/collapsedKey.ts:254`, re-emits only popped keys) and `withPrefOverrides` (`prefOverrides.ts:139`). The only other `replaceSource` caller is FormModal Save (`src/authoring/FormModal.ts:265`), which is SC-483. Two other raw writes do not serialize a parsed model: sidebar anchor stamping (`framework/sidebar/registration.ts:237`, text-level `ensureAnchor`) and encounter "Create tracker block" (`elements/encounter/view.ts:458`, appends a NEW plugin-built `ds-initiative`, out of scope per the ledger). No migration write path exists.

| Element (aliases) | parse | serialize | writer entry points (persist sites) | ComponentWrapper / collapseKeysOwnedByModel |
|---|---|---|---|---|
| stamina-bar (`ds-stam`, `ds-stamina`, `ds-stamina-bar`) | `stamina-bar/model.ts:56` | `stamina-bar/model.ts:66` (SC-466 filter) | `stamina-bar/view.ts:161` (modal Apply), `:226/:230` (Catch Breath + undo), `:251/:256` (recoveries + undo) | yes / yes (`definition.ts:42`) |
| counter (`ds-ct`, `ds-counter`) | `counter/model.ts:25` -> `model/Counter.ts:41` | `counter/model.ts:29` `stringifyYaml(model)` | `counter/view.ts:63` (stepper) | no / no |
| negotiation (`ds-nt`, `ds-negotiation`, `ds-negotiation-tracker`) | `negotiation/model.ts:28` -> `model/NegotiationData.ts:28` | `negotiation/model.ts:32` `stringifyYaml(model)` | `negotiation/view.ts:56`, `:163`; sub-views `drawSteelAdmonition/negotiation/PatienceInterestView.ts:105,144`, `ArgumentView.ts:219,228,275,451`, `MotivationsPitfallsView.ts:89` | no / no |
| initiative (`ds-it`, `ds-init`, `ds-initiative`, `ds-initiative-tracker`) | `initiative/model.ts:128` (mutates `data` in place) + `resolveRefs.ts` | `initiative/model.ts:300` | `initiative/view.ts:165,336,420,715,778,863,940,1445,1648,1911,2063,2080`; `views/MinionStaminaPoolModal.ts:288,569` | no / no |
| encounter (`ds-encounter`) | `encounter/model.ts:72` (mutates in place) | `encounter/model.ts:118` | `encounter/view.ts:337` (`syncComputed`, **on every mount when `_computed` differs**), `:552` (`ensureEncounterAnchor`) | no / no |
| montage (`ds-montage`) | `montage/model.ts:141` (fresh object) | `montage/model.ts:176` (ordered DTO) | `montage/view.ts:525` (`commit`, every board/chrome action; chrome items `:411-432`) | no / no |
| project (`ds-project`) | `project/model.ts:43` (fresh object) | `project/model.ts:57` `stringifyYaml(model)` | `project/view.ts:282`, `:288` | no / no |
| party (`ds-party`) | `party/model.ts:56` (mutates in place) | `party/model.ts:85` `stringifyYaml(model)` | `party/view.ts:148,187,241,263` | no / no |
| hero (`ds-hero`, hidden + experimental) | `hero/model.ts:552` -> `HeroModel.parse` `:545` (`parseState` `:254`) | `hero/model.ts:556` -> `serializeStateSplice` `:536` (raw definition splice + `stringifyYaml(state)`) | `hero/view.ts:289,390,456,489,494,519,538,561` | no / no |
| conditions (`ds-conditions`, `ds-cond`) | `conditions/model.ts:48` | `conditions/model.ts:75` | `conditions/view.ts:30` | no / no |
| tokens (`ds-tokens`) | `tokens/model.ts:27` | `tokens/model.ts:44` (DTO, only keys that are present) | `tokens/view.ts:37` | no / no |
| surges (`ds-surges`) | `surges/model.ts:23` | `surges/model.ts:42` (DTO) | `surges/view.ts:30` | no / no |
| resource (`ds-resource`) | `resource/model.ts:33` | `resource/model.ts:53` (DTO) | `resource/view.ts:32` | no / no |
| skills (`ds-skills`): **not a writer** | `skills/model.ts:10` | none (`shape: 'interactive'`, `skills/definition.ts:31`) | none; only FormModal Save (SC-483) | yes / yes (`definition.ts:46`) |

There are no element-view model clones: the only `this.model =` assignments are `ElementView.mount` and `update` (`view.ts:186,209`), and every view calls `update(this.model)` on the same instance. resolveRefs returns the same instance (`initiative/resolveRefs.ts:242`).

## 2. Leak per element (MEASURED)

Method: a temporary jsdom jest file `test/dom/zzSc482Probe.test.ts` (now deleted; a copy is at `.../scratchpad/sc482-r0-survey-aee9b5ca57305ad17/zzSc482Probe.test.ts.txt`). Each case ran the real `ElementPipeline.run` with real services (`_staminaHarness.makeDeps`, or `_refHarness.makeCompendiumDeps` with the goblin/fury/mountain/dwarf fixtures), then performed one real DOM write action, waited out the debounce, and captured the `replaceSource` argument. Raw output: `.../sc482-r0-survey-aee9b5ca57305ad17/probe-out.json`; jest log: `probe-jest.log` (18/18 ran).

| Case: source -> action | Written body (observed) | Keys the source did not have |
|---|---|---|
| stamina-bar (control) `max_stamina: 20 / current_stamina: 15` -> Damage 3 | `max_stamina: 20\ncurrent_stamina: 12` | none |
| counter `name: Health / current_value: 10 / max_value: 20` -> + | `max_value: 20\ncurrent_value: 11\nmin_value: 0\nname: Health\nvalue_height: 3\nname_height: 1` | `min_value: 0`, `value_height: 3`, `name_height: 1` |
| counter `name / max_value` (no current) -> + | `...current_value: 1\nmin_value: 0...value_height: 3\nname_height: 1` | the same plus `current_value` (changed, so it is legitimately written) |
| tokens `tokens: 3` -> + | `tokens: 4` | none |
| surges `surges: 2` -> + | `surges: 3` | none |
| resource `class: fury / current: 4` -> + | `class: fury\ncurrent: 5` | none |
| conditions `[Restrained, Bleeding]` -> remove | `conditions:\n  - Bleeding` | none |
| party `members: [{name: Doran, victories: 1}]` -> Victories + | `members:\n  - name: Doran\n    victories: 2` | none |
| party `party: {hero_tokens: 2}` -> Hero tokens + | `party:\n  hero_tokens: 3\nmembers: []` | `members: []` |
| project `goal_name / goal_points: 100` -> add roll 14/14 | `...accrued: 14\nrolls: [one]\ncurrent_respite: 1` | `current_respite: 1` (`accrued`/`rolls` changed, so they are written) |
| montage `title / success_limit: 5 / failure_limit: 3 / participants:[Ash]` -> Add round | `title...\nrounds: 3\n...successes: 0\nfailures: 0\n...current_round: 1` | `successes: 0`, `failures: 0`, `current_round: 1` (`rounds` changed) |
| negotiation `name / initial_patience: 5 / initial_interest: 2 / motivations:[Power] / pitfalls:[Greed]` -> patience slot 3 | adds `current_interest: 2`, `    hasBeenAppealedTo: false`, `currentArgument: {motivationsUsed: [], pitfallsUsed: [], lieUsed: false, sameArgumentUsed: false, reusedMotivation: false}`, `i5..i0: Interest N result` | `current_interest` (derived from `initial_interest`), `currentArgument` (object), `i5`..`i0`, nested `hasBeenAppealedTo` (`current_patience` changed) |
| initiative heroes `[Ash max 20]`, group Goblins `[Goblin max 10 amount 2]` -> hero turn toggle | hero adds `conditions: [] / isHero: true / current_stamina: 20 / temp_stamina: 0`; creature adds `isHero: false / instances: [2 x {id, current_stamina: 10, temp_stamina: 0, conditions: []}]`; group adds `has_taken_turn: false / is_squad: false`; top adds `malice: {value: 0}` | all of those (`has_taken_turn: true` changed) |
| encounter `monsters: [{code: goblin, count: 6}]`, **no action (render)** | `monsters: [...]\nparty: {}\n_computed: {spent_ev: 18, budget: null, ratio: null, band: null, victories: 1}` | `party: {}` (leak), `_computed` (plugin display cache, spec §2.5) |
| encounter `party: {hero_count: 4, hero_level: 3}`, **no action (render)** | `party...\nmonsters: []\n_computed: {...}` | `monsters: []` (leak), `_computed` |
| hero `name / level / characteristics` (no `state:`) -> surge + | `+ state:\n  stamina: {current: 0, temp: 0}\n  resource: 0\n  surges: 1\n  recoveries: 0\n  victories: 0\n  conditions: []` | everything except `surges` (by spec §3.4, the seeded state is written at first interaction) |
| hero, the same plus `state:\n  surges: 1` -> surge + | `state:` grows `stamina`, `resource`, `recoveries`, `victories`, `conditions: []` | 5 `state` sub-keys |
| skills `skills: [Alchemy]` -> group collapse | (no write) | n/a |

Not covered here (side notes):
- Writes reorder keys into class or insertion order. For example, counter `name` moves after `max_value`, and encounter `party` moves after `monsters`. This happened before this change and is unchanged, as in SC-466.
- `stringifyYaml` drops quotes, for example `code: "scc.v1:..."` loses its quotes on the encounter write.
- Counter's truthy defaults turn an authored `value_height: 0` into 3.

## 3. Fully-authored control (MEASURED)

For each leaking element, the probe fed its own leaked output back in as a fully-authored source (every default spelled out, in class order) and repeated the same action:

| Element | Lines that changed | Everything else |
|---|---|---|
| counter (both cases) | only `current_value` | byte-identical |
| party (no members) | only `  hero_tokens` | byte-identical |
| project | `accrued`, plus the appended roll lines | byte-identical |
| montage | only `rounds` | byte-identical |
| negotiation (slot 1) | only `current_patience: 1` | byte-identical |
| initiative | only `has_taken_turn` | byte-identical |
| hero | only `surges` | byte-identical |
| encounter | no write at all (`computedEqual`); the note stays byte-identical | n/a |

So "a fully-authored block serializes byte-identically" holds today for all of them, and the fix must preserve it. Because the helper drops only keys that were absent AND still unchanged, it cannot affect a fully-authored block.

## 4. Shared helper

**Verdict: yes.** Put it at **`src/elements/shared/undeclaredDefaults.ts`**, next to `withReference.ts`. Elements call it themselves. No framework change is needed, and **no `src/framework/host/` file is needed**. A framework-level auto-wrap, such as an `ElementDefinition.parserDefaults` field applied in `pipeline.ts`, does not work: the pipeline only sees the serialized string, and the serializers come in different shapes (montage builds an ordered DTO, negotiation needs nested projection, hero splices raw text).

SC-466's version needs three changes:

1. **Snapshot the value parse filled in, instead of using a constant default table.** Negotiation `current_patience`/`current_interest` default to `initial_*`, and initiative `current_stamina` defaults to `max_stamina`. Object and array defaults (`currentArgument`, `party: {}`, `rolls: []`, `members: []`) are mutated in place (`rolls.push`), so the snapshot must be a deep copy: compare `JSON.stringify(current) === snapshot`. For stamina this is equivalent to the current constant table.
2. **Read presence BEFORE the inner parse runs.** party (`model.ts:67`), encounter (`:83,:89`) and initiative (`:128`) mutate the incoming `data`, so a check after parse would see the filled value as "declared".
3. **Apply to a DTO, not only to `stringifyYaml(model)`.** Montage serializes an ordered DTO, and negotiation's Motivation is a nested instance.

Proposed API:

```ts
// module-private: per parsed instance -> (key -> JSON snapshot of the value parse filled in)
const filled = new WeakMap<object, ReadonlyMap<string, string>>();

/** Wrap a parse: reads which of `keys` the source left absent (value `undefined`, SC-466 r2;
 *  null/blank body = nothing declared) BEFORE `parse` runs, then snapshots the model's values. */
export function recordingDefaults<M extends object>(
	parse: (data: unknown, raw: string) => M,
	keys: readonly string[],
): (data: unknown, raw: string) => M;

/** Lower level, for nested instances built during parse (e.g. each negotiation Motivation). */
export function recordAbsentDefaults(owner: object, absentKeys: readonly string[]): void;

/** `dto` (default: `owner` itself) as a new object in the SAME key order, minus every key recorded
 *  absent for `owner` whose value still JSON-equals its parse-time snapshot. No record -> returned
 *  unchanged (plugin-constructed models keep today's whole output). */
export function omitUntouchedDefaults<T extends object>(owner: object, dto?: T): Partial<T>;
```

How each element would call it:

| Element | Keys | parse | serialize |
|---|---|---|---|
| counter | `current_value`, `min_value`, `value_height`, `name_height` | `recordingDefaults(...)` in `counter/model.ts:25` | `stringifyYaml(omitUntouchedDefaults(model)).trim()` |
| project | `accrued`, `rolls`, `current_respite` | wrap | `stringifyYaml(omitUntouchedDefaults(model))` |
| montage | `rounds`, `success_limit`, `failure_limit`, `successes`, `failures`, `current_round` | wrap | `stringifyYaml(omitUntouchedDefaults(model, ordered))` |
| party | `members` | wrap (presence read before the in-place mutation) | `omitUntouchedDefaults(model)` |
| encounter | `party`, `monsters` | wrap (in-place) | `omitUntouchedDefaults(model)`; `_computed` and `_dse_anchor` untouched (never parser-filled) |
| negotiation | top: `current_patience`, `current_interest`, `currentArgument`, `i5`..`i0`; nested: `hasBeenAppealedTo` (and `name`/`reason` `?? ''`) per Motivation | wrap; `recordAbsentDefaults(mot, ...)` per Motivation, built from raw `data.motivations[i]` | build a DTO: `{...omitUntouchedDefaults(model), motivations: model.motivations.map(m => omitUntouchedDefaults(m))}`, keeping the key position. Today's serializer is `stringifyYaml(model)`, so this changes its shape. |
| stamina-bar (optional) | its 6 keys | replace the local WeakMap | same; its 14 SC-466 tests guard the move |

Where it does not fit:
- **initiative.** Defaults are nested in user-authored arrays (heroes, groups, creatures, instances), so the helper would need to record each object and serialize would need a full DTO walk. `resolveRefs` fills `max_stamina`/`current_stamina` after parse, so the snapshot would have to be taken after resolveRefs or statblock-sourced values would leak. `isHero` is a runtime flag written even on fully-authored blocks. `test/unit/model/initiative-serialize.test.ts` pins byte equality against the legacy `parseEncounterData` oracle, so that contract would be re-based. Combatants added mid-fight are plugin-built and would stay whole. **I recommend a separate follow-up ticket.**
- **hero.** The serializer splices raw text and is not `stringifyYaml(model)`. Defaults live under `state:`, which `parseState` (`hero/model.ts:254`) builds fresh. The helper could fit as `recordAbsentDefaults(state, ...)` plus `omitUntouchedDefaults(state)` inside `serializeStateSplice`. But spec §3.4 ("seeded in memory only, not written until first interaction") implies the full seeded state is meant to be written. Hidden and experimental. **Owner/Scott call**; I recommend deferring.
- **encounter `_computed`.** This is a plugin display cache, not a parser default. Under the rule (absent but changed), it is still written. **It is written on render**, so merely viewing the note mutates it (the fix makes that write drop `party: {}` and `monsters: []`). Whether render-time writes should exist at all is outside this rule.
- **Interaction with SC-483.** FormModal Save calls `def.parse(data, stringifyYaml(data))` and then `serialize` (`FormModal.ts:183`). Once `def.parse` records absence, Save will also omit untouched defaults for keys the form data left `undefined`. Coordinate with SC-483's seeding fix. (One line, as the brief asks; I did not analyse FormModal.)
- **The WeakMap keyed on the instance survives every writer.** All 6 in-scope views mutate the parsed instance in place. Nested reassignments such as `this.model.party = {...}` (`party/view.ts:186`) or negotiation `resetData` are compared by value. Re-parse paths (sidebar external change, the pipeline echo, FormModal) recompute the record from the new source.

## 5. Size

- **Elements to change (recommended scope):** 6 (counter, project, montage, party, encounter, negotiation), plus 1 optional (stamina-bar onto the helper), plus 1 new helper file and a unit test for it. Deferred: initiative and hero. Unchanged: tokens, surges, resource, conditions, skills.
- **Tests likely to pin bytes for minimal sources (estimate from grep, not run against a fix):**
  - `test/dom/elements/counter.test.ts`: `healthSerialized()` at :47 pins `value_height: 3` / `name_height: 1` for a source without them; asserted at :259 and in the ReadingModeBlockHost block at :575-605.
  - `test/unit/model/negotiation-serialize.test.ts`: legacy-bytes oracle.
  - `test/dom/elements/negotiation.test.ts`: T-7 `legacyBytes(frodoYaml, ...)` at ~:917, and other serialized-body asserts.
  - `test/unit/model/negotiation.test.ts`: maybe.
  - `test/unit/model/montage-serialize.test.ts`: cases where minimal sources pin the output.
  - `test/unit/model/project-serialize.test.ts`: the round-trip and minimal-block tests (:33, :59, :107).
  - `test/unit/model/party-serialize.test.ts`: the blank block at :41, if serialize is asserted.
  - `test/unit/model/encounter-serialize.test.ts`.
  - Possibly `test/dom/framework/view-adoption.test.ts` / `view-registry.test.ts`, which use counter sources without heights; their asserts look count-based.

  That makes about 6 to 9 files. `test/dom/framework/sidebarEncounterHandoff.test.ts` and `experimentalGate.test.ts` use the fully-authored `party: {}\nmonsters: []`, so they are unaffected. In `visual-harness/obsidian-lifecycle.mjs:1109`, a comment says counter writes `value_height`/`name_height` "by design"; that comment needs updating, but no assertion pins it.
- **Doc comments that state the old contract:** the headers of `counter/model.ts`, `negotiation/model.ts`, `project/model.ts`, `montage/model.ts`, `party/model.ts` and `encounter/model.ts`, plus `.repo-docs/architecture.md` (rows for those elements).
- **e2e:** no e2e spec or manifest covers the counter, project, montage, party, encounter or negotiation write surfaces. `e2e/manifest/*.ts` has only `stamina-bar`, `stamina-edit-modal` and `conditions-modal` (initiative); `e2e/specs/` has only `stamina-bar/`, `initiative/` and `callout/` (stamina-bar writes). An e2e proof per element would need new specs and new `e2e/vaults/shipped/` fixture notes. The e2e gate itself still has to run before landing (SC-408).

## Artifacts

- Probe copy (deleted from the tree): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/zzSc482Probe.test.ts.txt`
- Probe output: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/probe-out.json`
- jest log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/probe-jest.log`
- npm ci log (I ran `npm ci` in the worktree plugin repo; `node_modules` is git-ignored and is left in place for r1): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/npm-ci.log`
