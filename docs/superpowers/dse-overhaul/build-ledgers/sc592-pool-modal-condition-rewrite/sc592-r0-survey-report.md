# SC-592 r0 survey: how the pool modal's condition removal rewrites the block, and the fix options

**Executive summary**
1. **Root cause.** The problem is in the model layer, not the modal. `initiative/model.ts:109-133` `normalizeConditions` turns every condition string into a fresh `{key}` object at parse time, for every hero (`:229`) and every authored instance (`:318` for minions, `:357` for regular creatures). `serialize` (`model.ts:406-419`) then runs `stringifyYaml` over the whole model, and nothing remembers how each condition was written.
2. **Blast radius.** It happens on every write, not just removals. A write that changes nothing (probe 01) already rewrites every string condition in every holder in the block. So do turn toggles, damage, Malice, the Conditions modal, the pool modal's Apply, and the form's Save. A fix only in the modal cannot work: the next unrelated write rewrites everything again.
3. **Recommended fix: option A, keyed by holder.** At parse, record for each holder (hero or instance object) the multiset of keys the user wrote as plain strings. At serialize, write a key-only entry whose key is in that multiset as a plain string. The change is about 30-40 lines in `model.ts` and covers all writers. Keying by entry identity (the brief's literal A) is NOT enough: the tracker's Conditions modal clones every entry when it opens (`ConditionsModal.ts:130-131`, `view.ts:2177`).
4. **Quotes are not cheap to keep.** `parseYaml` throws quote style away, so learning it needs the `yaml` Document/CST API. That means bundling `yaml` (measured: 97 KB minified, 30 KB gzip, about 7% of `main.js`), because Obsidian exposes only `parseYaml`/`stringifyYaml`. Every write also already drops quotes on names, comments and flow style everywhere in the block. Keeping quotes on conditions alone would be an island. I recommend fixing the shape only and ruling quotes out of scope (general re-emit); a whole-block format-preservation ticket can follow if Scott wants one.
5. **Extra finding (data loss, pre-existing).** `normalizeConditions` also drops unknown keys on condition objects (`source: trap` is deleted, probe 01) and reorders object keys to key/icon/color/effect/duration.

Probe: real worktree `src` at `ec26b709`, run under jest with the main checkout's node_modules (the worktree has none). Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r0-survey-R0/`. Jest rc 0.

---

## 1. Write path (ec26b709)

| Step | Where |
|---|---|
| Click on a condition icon. The handler filters by position (SC-574), so the surviving entries keep their **object identity**. | `src/views/MinionStaminaPoolModal.ts:671-674` (`character.conditions = conditions.filter((_, i) => i !== entryIndex)`) |
| `this.persist()`: the callback injected into the modal | `MinionStaminaPoolModal.ts:684`; constructed at `src/elements/initiative/view.ts:1762` (grid dblclick) and `:1883` (detail row) with `() => void this.rebuildAndPersist()` |
| `rebuildAndPersist` runs `update(this.model)` and then `persist()` | `view.ts:188-195` |
| Framework `persist()` runs the injected `serialize(model)` and then `host.replaceSource(body)`, with a 400 ms debounce, writing the **whole fenced block body** | `src/framework/view.ts:255-270`, `src/framework/host/BlockHost.ts:124` |
| Block written: the **whole `ds-initiative` block** (heroes and every enemy group), not just the squad | `src/elements/initiative/definition.ts:38-39` (`parse`, `serialize`) |
| Parser that normalises: `normalizeConditions`. A string becomes `{key, color:undefined, effect:undefined, duration:undefined}`; an object is **rebuilt** as `{key, icon, color, effect, duration}`, which drops unknown keys and reorders the rest | `src/elements/initiative/model.ts:109-133`; called at `:229` (hero), `:318` (authored squad-minion instance), `:357` (authored regular instance) |
| Serializer: Obsidian's `stringifyYaml`, which is eemeli `yaml` v2 at its defaults (the mock replicates it byte-for-byte: `test/mocks/obsidian-core.ts:9-33`), over a DTO filtered only for **keys** (SC-485 `omitUntouchedDefaults`) and never for entry shape | `model.ts:385-419` (`groupDto`, `serialize`) |
| "Both parsers" (SC-574 ledger) = the sync split above plus the async legacy oracle `parseEncounterData`, which has three inline copies. That oracle is now **test-only** (no `src` caller) | `src/drawSteelAdmonition/EncounterData.ts:679`, copies at `:737-750`, `:858-870`, `:906-918` |
| Sibling condition parsers (other blocks, other serializers): `ds-conditions` already **down-converts key-only to a plain string** on write (deterministic, not format-preserving); ds-hero `parseCondition`, whose `state:` splice re-emits only `state:` | `src/elements/conditions/model.ts:1-14, 70-77`; `src/elements/hero/model.ts:184-208, 1-25` |

The pool modal handles string entries itself (`MinionStaminaPoolModal.ts:631-640`), but in production it never sees one, because parse has already normalised them. Only the matrix test's fake model passes raw strings (`test/dom/views/minion-stamina-pool-modal-matrix.test.ts:1016-1178`).

## 2. Blast radius: it affects every write, not just removals

Every writer below serialises the whole model through `model.ts:serialize`, so each one rewrites **every** string condition in **every** holder in the block:

- Every `void this.persist()` in `initiative/view.ts`: `:192` (rebuildAndPersist), `:221` (Reset Encounter), `:413`, `:439`/`:450` (commit), `:500`, `:804`, `:868`, `:955`, `:1033`, `:1542`, `:1746` (selecting a cell persists `selectedInstanceKey`), `:2009`, `:2162`, and `:2179` (the tracker's own Conditions modal add, remove and edit).
- The pool modal: damage/Apply at `MinionStaminaPoolModal.ts:309` and removal at `:684`.
- The block edit form's Save: `src/authoring/FormModal.ts:311-314` (`serialize(def.parse(data, stringifyYaml(data)))`).

Probe evidence: `01-noop-write.yaml` (serialize with no change at all) and `01b-unrelated-write.yaml` (a group turn toggle) both show every string turned into a `{key}`. The removal (`02`) adds exactly one line of difference on top of the no-op write. **Conclusion: the bug lives in the serializer, and removal is just where the SC-572 reviewer saw it.** `test/dom/elements/initiative-default-keys.test.ts:502-504` already pins this for a group-turn write ("`prone` is normalised to {key: prone} (pre-existing)").

## 3. What changes, byte by byte (probe)

Fixture: `out/00-source.yaml`. Diffs: `sc592-diffs-today.txt` (source → no-op → removal) and `sc592-diffs-options.txt`.

**General `stringifyYaml` re-emit.** Every write does this today, to every persisted element except ds-hero's definition region:
- **Comments dropped**: the full-line `# Ambush at the ford` and the trailing `# the fury` / `# removed by the probe`.
- **Quotes dropped** on plain-safe scalars: `name: "Ambush"` → `Ambush`, `- name: 'Goblins'` → `Goblins`, `"Ash"` → `Ash`. Quote style changes where quotes are needed: `max_stamina: '24'` → `"24"`.
- **Flow style becomes block style**: `conditions: [frightened, "weakened"]` turns into a block list, and `{key: bleeding, color: red}` turns into a block map. Option A still shows this (probe 03), so it is general, not caused by normalisation.
- Whitespace and alignment are normalised. Keys the plugin adds (e.g. `has_taken_turn`) land last.

**Caused by condition normalisation** (`normalizeConditions`):
- **Shape**: every plain string becomes `- key: x`, in every holder in the block (heroes, every authored instance, every group). This is the ticket's symptom.
- **Object key order** is made canonical: `color: blue / key: taunted / effect / source` → `key, color, effect`.
- **Unknown keys on condition objects are deleted**: `source: trap` is gone after any write. This is data loss, pre-existing, and not in the ticket.
- Quotes on condition strings disappear too (`"prone"` → `key: prone`). Part of that is normalisation and part is general re-emit: with option A the quotes are still gone (probe 03: `"prone"` → `prone`).

**Removal-specific**: only the removed entry's line (`02` vs `01`). Removing the last condition writes `conditions: []` (`09`).

## 4. Options

| Option | Layer | Size | Risk | Keeps shape? | Keeps quotes? | Covers every writer? |
|---|---|---|---|---|---|---|
| **A-holder (recommended)**: at parse, before normalising, record for each **holder** (hero or authored-instance object) `WeakMap<holder, Map<key, count>>` of the keys written as plain strings. In serialize's DTO walk, write a key-only entry (no icon/color/effect/duration) whose key still has a count left as the plain string. | `initiative/model.ts` only | ~30-40 lines + tests | Low | **Yes** | No | **Yes**: the holder survives the pool modal's filter, the Conditions modal's clones, reorders and every other writer; FormModal re-parses `data` and records afresh |
| A-identity (brief's A): `WeakMap<entry, wasString>` | model | ~25 lines | Med | Pool modal only | No | **No**: `ConditionsModal.ts:130-131` clones every entry when it opens and `view.ts:2177` assigns the clones, so after any tracker Conditions-modal change that holder's strings turn into objects |
| A+ (raw-item memory): A-holder, plus write an unchanged authored object back verbatim (keeps key order and unknown keys) | model | ~50-60 lines | Med | Yes + object key order + unknown keys | No | Yes |
| B (the modal keeps the raw array) | modal | small | — | **No effect**: the modal only ever holds normalised objects, and serialize re-emits the whole model on every write | No | No. **Reject** |
| C (format-preserving `yaml` Document edit) | new runtime dependency + serialize redesign | **L** | High | Yes | **Yes** (and comments) | Only if *every* write becomes a model→Document diff applier. Removal-only C gets undone by the next unrelated write |
| D (ds-conditions-style deterministic down-convert: any key-only entry becomes a plain string) | model | ~5 lines | Low | Strings yes, but **turns authored `{key: x}` objects into strings** | No | Yes |

Notes:
- **A-holder pitfall.** `omitUntouchedDefaults` compares `JSON.stringify(dto value)` with the parse-time snapshot (`src/elements/shared/undeclaredDefaults.ts`). A holder that never wrote `conditions` has an empty string-memory, so its DTO stays `[]` and still matches its `[]` snapshot. The down-convert must apply only to holders whose `conditions` was authored (or run after the omit decision). For heroes, serialize currently passes the hero itself as the DTO (`model.ts:409`), so a `{...hero, conditions}` DTO is needed. Probe 10: the A output re-parses to the same keys. Probe 11: a second write keeps the strings.
- **C facts.** Obsidian's API exposes only `parseYaml`/`stringifyYaml` (`obsidian.d.ts:4817, 6815`). `yaml` is a **devDependency** here, and bundling `parseDocument` costs 97,463 B minified / 30,390 B gzip against a 1,347,461 B `main.js`. `serialize(model)` has no access to the source text: parse's `_raw` is unused (`model.ts:197`), and FormModal passes `stringifyYaml(data)` as raw. So C needs a `WeakMap<model, raw>` plus a structural diff applier. Even `Document.toString()` is not byte-exact (probe 06/07: `[a, b]` → `[ a, b ]`, `{k: v}` → `{ k: v }`, comment spacing collapsed). Byte-exact output needs CST range splicing; item ranges are available (`sc592-scalar-probe.out`). The ds-hero regional splice is the codebase's only format-preserving precedent (`hero/model.ts:1-25`); there is no fence-level YAML editor in `src/framework/host/` (those files locate fences and splice whole bodies).
- **Which options make "a removal changes only the removed condition" true.** For shape: A-holder, A+ and C. For shape AND quotes: **only C**, and only if every writer goes through it. Even then, today's re-emit of names, comments and flow lists would have to go too, because a removal also triggers the general re-emit. Strictly, the ticket's literal rule ("only the condition that was removed") is achievable **only** with C. A-holder makes it true for the condition list's *shape* and leaves the block-wide re-emit that every write already performs.
- **Quotes without C?** Emitting is possible: `yaml.stringify` honours a node object carrying `Symbol.for('yaml.node.type')` (a globally registered symbol), even one made by a different copy of `yaml` (probe: `- "dazed"` from a duck-typed scalar). Knowing *which* strings were quoted is the hard part, because `parseYaml` discards it, so it needs a Document/CST parse (bundled `yaml`) or a hand-written raw scanner. It would also rely on Obsidian's internal `yaml` honouring the node symbol, which is undocumented. Not cheap and fragile. Not recommended.
- **Unknown-key loss** (`source: trap`) is fixed by A+, or more cheaply by making `normalizeConditions` keep the authored object's keys (spread). Either changes the legacy-oracle parse equality only for fixtures with unknown keys; I know of none. I suggest filing it separately (LOW, data loss) or folding it in if the owner widens the scope.

## 5. Existing tests that pin the normalised output (would change under A-holder)

- `test/unit/model/initiative-serialize.test.ts:46-51`: the `withNormalizedConditions` helper. `:69` is `expectOracle`'s third assertion (`parseYaml(serialize(model))` equals the source with strings turned into `{key}`). This is the primary pin, and it would compare against raw `parseYaml(source)` instead.
- `initiative-serialize.test.ts:172-175`: the `squadOut` regex `- key: grabbed`.
- `test/dom/elements/initiative-default-keys.test.ts:502-504`: `src.replace('- prone', '- key: prone')`.
- e2e, plain-string fixtures asserted as `{key}` objects through `expectNoteBlock(...).toMatchObject` (an array element `'dazed'` does not match `{key:'dazed'}`):
  - `e2e/specs/minion-pool/pool-conditions.e2e.ts:20, 33, 68, 78, 82, 119` (squad-hurt / squad-custom, all plain strings)
  - `e2e/specs/conditions-modal/cond-rows.e2e.ts:53-54` (`bleeding`, `grabbed` are plain strings in `Initiative/conditions.md`)
  - `cond-add.e2e.ts:74, 117`
  - `cond-editor.e2e.ts:138`
  
  Check each fixture's authored form. Entries written as `- key: hexed` (`cond-editor :77/110/169/205`, `cond-integrity :45`, `cond-add :148`) are unaffected under A-holder but **would flip under D**.
- Docs: `e2e/README.md:116` ("`- grabbed` is rewritten as `{ key: grabbed }` on the first write; SC-435").
- Unaffected (they check the parse-level model shape, which A leaves alone): `initiative-serialize.test.ts:116-118, 210-214`, `test/unit/model/encounter-data.test.ts:44, 63`, and the pool-modal matrix fakes (`:1016-1178`, raw strings already).

## 6. Related tickets (from repo docs; tracker not read)

- **SC-466** (landed): ds-stamina-bar default *keys*. Rule: "a write changes only the fields the action touched".
- **SC-482** (landed `3973b56`): the same mechanism (`undeclaredDefaults.ts`) for counter, project, montage, party, encounter, negotiation and stamina-bar. **Not initiative.**
- **SC-485** (landed): applied the SC-482 contract to **initiative** (`model.ts:37-52` header), but for default *keys only*. It explicitly left condition *entry shape* as pre-existing (`initiative-default-keys.test.ts:503`). **No landed ticket covers condition-entry shape.**
- **SC-483** (landed `54f8f88`): FormModal Save writes no untouched defaults. Same rule, and FormModal is one of the writers above.
- ds-conditions' deterministic down-convert (`conditions/model.ts:6-14`) is a precedent of "plain string = key-only" on write. It is not format-preserving.

## Other observations (not in scope)

- INFO: a squad-minion `instances` list whose length differs from `amount` is regenerated with empty `conditions`, discarding authored conditions (`model.ts:299-307`; the regular-creature twin is at `:337-347`). Pre-existing data loss on a malformed block.

## Artifacts

- Probe test: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r0-survey-R0/sc592-probe.test.ts`
- Probe jest config / runner: `…/sc592-r0-survey-R0/sc592-probe.jest.config.js`, `…/sc592-r0-survey-R0/sc592-run-probe.sh`; log `…/sc592-r0-survey-R0/sc592-probe-jest.log`
- Probe outputs: `…/sc592-r0-survey-R0/out/00-source.yaml` … `11-optA-second-write.yaml`, `10-optA-reparse-keys.txt`
- Diffs: `…/sc592-r0-survey-R0/sc592-diffs-today.txt`, `…/sc592-r0-survey-R0/sc592-diffs-options.txt`
- Scalar / range / bundle-size probe: `…/sc592-r0-survey-R0/sc592-scalar-probe.cjs`, `.out`; `sc592-yaml-size-entry.mjs`, `sc592-yaml-size.min.js`
