# SC-707 round 1 — implementer report

**Executive summary**
- Verdict: DONE. Head `aa06a043` on branch `sc707-initiative-schema-suggest`, rebased onto dse `origin/develop` `e38f7838` (clean, no conflicts, package.json unchanged, no re-`npm ci`).
- New slot `authoring.suggestSchema` (registry.ts), read only by `DsSchemaSuggest` (`def.schema` wins). Verified by grep: pipeline validation, `formModel.ts`, `FormModal.ts`, `scaffold.ts` never read it. A jest test pins that.
- `ds-initiative` gets `src/elements/initiative/suggest-schema.yaml` (author-facing keys only); `definition.ts` comment updated. Drift test measures keys actually READ (recording Proxy over parse + resolveRefs + advanceRound).
- Nested completion: new pure walker `src/authoring/schemaPath.ts` (indentation + `- ` entries, one resolver in `schemaShape.ts`). Unresolvable -> nothing. Top-level behaviour unchanged.
- Gates at head: tsc + lint clean; jest 15090 passed / 2 skipped (base 15044, +46); lifecycle 64/64; e2e `948/968 ok, 0 failed, 20 known-bug, coverage 540/540 pairs`; styles.css byte-identical to clean `e38f7838` (sha256 `50436d6b...e37e98`) so shots 636 / freeze 280/280 / parity 0/0/24 carry.
- Docs page `docs/writing-blocks.md` lines 57-58 now say nested fields are not suggested: needs an update (relay; I did not touch docs).

## Commits (on top of `e38f7838`)
- `004d2e0e` feat(authoring): suggestions-only schema slot (authoring.suggestSchema) read by the in-block autocomplete (SC-707)
- `5ca17c5e` feat(initiative): suggestions-only schema for the in-block autocomplete + drift test (SC-707)
- `a4361fb2` feat(authoring): nested key and enum completion by YAML path in the in-block autocomplete (SC-707)
- `094ffedc` test(e2e): AUTH-K17..K20 nested and initiative key lists; CHANGELOG (SC-707)
- `aa06a043` chore(authoring): drop two redundant type assertions (SC-707)  (lint fix of my own code)

Rebase: origin/develop had moved 17187e4c -> e38f7838 (SC-692); rebased once, before the gates.

## What changed
- `src/framework/registry.ts`: `AuthoringHint.suggestSchema?: string` (doc-commented: autocomplete only, never validates).
- `src/authoring/schemaSuggest.ts`: `schemaYamlOf(def)` = `def.schema || def.authoring?.suggestSchema`; the SC-406 deferred-off check uses it, so both sources are covered. Header comment rewritten (the "Finding 2" rationale now describes the scope walk). Top-level enum and key branches are the same code paths as before (an indentation-free `key:` / bare word), only re-ordered; nested branch is new. `selectSuggestion` (SC-688 accept/replace, SC-679 cursor/close) untouched and works for nested lines.
- `src/authoring/schemaPath.ts` (new): `resolveKeyScope(above, indent, dash, root)`. Reads the lines between the opening fence and the cursor as block structure (frames for mappings/lists + a "pending" `key:` with empty value). Null on: tab in indentation, flow `{ [` (incl. multi-line), block scalar `| >` text, multi-line quote, odd indentation, unknown key, key that has a value, list whose entries are not one described object (strings, `oneOf`), `- -`, comment/flow on the cursor line.
- `src/authoring/schemaShape.ts`: `RawSchemaNode.items`, `shapeOfNode`, `itemsOfNode`, `nodeFromSchemaYaml` (reuse `mergeShape`; no second resolver).
- `src/authoring/fenceScan.ts`: `scanOpenFence` (same top-down scan, also returns the opener line); `scanFenceState` now delegates and returns exactly what it did (its `toEqual` pin test untouched).
- Callout (`> `) behaviour: unchanged (regexes do not match a `> ` prefix; a jsdom test pins nothing is offered).
- CHANGELOG: one `[FIX]` bullet (SC-707) under the top "7.0.0 (unreleased)" section (this repo's file has no literal `## Unreleased` heading; the SC-692/706/688 bullets live there), placed above the SC-692 one.

## O3 key lists (initiative suggestions schema)
Descriptions are short plain-word sentences, but `DsSchemaSuggest.renderSuggestion` only does `el.setText(value)`: descriptions are NOT rendered anywhere today.

| Level | Included | Excluded (reason) |
|---|---|---|
| top | `name`, `round`, `heroes`, `enemy_groups`, `malice` | none (these are all of them; `round` is also advanced by the tracker but an author can set a start round) |
| hero | `name`, `max_stamina`, `statblock`, `current_stamina`, `temp_stamina`, `image`, `conditions` | `has_taken_turn` (tracker turn flag), `actions` (tracker checklist), `isHero` (parser sets it), `with_captain` (merged from the statblock; "never read back for a hero") |
| enemy group | `name`, `creatures`, `is_squad` | `has_taken_turn` (turn flag), `minion_stamina_pool` (tracker pool), `selectedInstanceKey` (UI selection) |
| creature | `name`, `max_stamina`, `amount`, `statblock`, `image`, `squad_role` (enum minion/captain/attached), `captain_of`, `with_captain_stamina` | `instances` (docs: managed), `actions` (squad checklist), `minion_stamina_pool`, `minion_stamina_pool_max`, `captain_bonus_active`, `captain_bonus_n` (pool/captain-bonus bookkeeping), `isHero` (parser), `with_captain` (documented author route is `with_captain_stamina`; `with_captain` is merged from the statblock) |
| malice | `value`, `round_gain` | `log` (tracker-written spend/gain log) |
| instance entries (`instances[]`) | none (list not described at all) | all (managed) |
| `conditions[]` entries | none (no `items`) | a condition entry is a bare word OR an object, so a bare word typed there must never be offered as a key; `key`/`duration`/etc. are not suggested |

Judgment calls for the owner to check: `round` included; `with_captain` excluded; `conditions` offered as a key but its entries not described; `statblock` typed `string` (parser only resolves strings; docs also say "or inline object").
Enums: only `squad_role` (the parser's `validateSquad` accepts exactly minion/captain/attached). `duration`/`effect` enums not included (condition entries not described).

## Drift test (O3)
`test/dom/authoring/initiativeSuggestSchema.test.ts` (5 tests): (1) the schema lists keys at exactly five levels (a new nested level must be added to the test); (2) a full sample block writes every schema key at every level; (3) the sample goes through `parse`, `resolveInitiativeRefs` (stubbed refs) and `advanceRound` with every object wrapped in a recording Proxy, and every schema key at every level must have been READ; (4) tracker-written keys are not in the schema; (5) definition has no `def.schema` and carries `suggestSchema`. I mutation-checked (3): adding a `bogus_key` to schema + sample makes it fail, then reverted.

## Elements gaining nested suggestions
Elements whose schema (after allOf/$ref merge) has nested object properties or a list of objects:
- `ds-initiative` (+ aliases `ds-it`, `ds-init`, `ds-initiative-tracker`): `heroes[]`, `enemy_groups[]`, `enemy_groups[].creatures[]`, `malice` (and nested enum `squad_role`).
- `ds-skills`: `custom_skills[]` entries (`name`, `has_skill`, `skill_group`, `description`). Not deferred, so live without the gate.
- `ds-roll` / `ds-power-roll` (deferred: gate on only): `tiers` -> `t1`, `t2`, `t3`.
- `ds-hero` (hidden + deferred: gate on only): `characteristics` (might, agility, reason, intuition, presence), `resource` (type, min), `state` (stamina, resource, surges, recoveries, victories, conditions, tokens_ref), `state.stamina` (current, temp).
No nested suggestions: `ds-stamina*` / `ds-stam`, `ds-resource`, `ds-surges`, `ds-tokens` (no nested objects); `ds-conditions` (`conditions[]` entries are `oneOf` string/object: nothing offered, by design).

## Tests added
- `test/dom/authoring/schemaPath.test.ts` (new, 31 tests): initiative hero first key on `- `, key aligned under a `- ` item, second entry not leaking, creature two lists deep, group level, malice, nested enum (`squad_role:` on `- ` line and under it), unknown enum key, top-level keys never offered in nested objects, bare word in `conditions:` list, top level untouched after nested content; ds-roll `tiers`, ds-skills `custom_skills`, ds-conditions; synthetic: two-level objects, list in list, key with a value, unknown/quoted key, list of strings / oneOf, odd indentation, tabs, flow (single/multi-line), block scalars, multi-line quote, comments/blank lines, wrapped scalar, callout, comment/`- -`/`{` on cursor line, SC-406 deferred-off for nested, accept writes key / enum value.
- `initiativeSuggestSchema.test.ts` (5, above); `schemaSuggest.test.ts` (+4 SC-707 suggestSchema tests: suggest-only element, schema wins, deferred-off, form/scaffold do not see it; one old Finding-2 test rewritten to the new nested answer `t1..t3`); `schemaSuggestMatrix.test.ts` (+4 initiative alias rows, ds-it removed from the "no schema" list, 3 rows replaced/added for indented lines).
- e2e `e2e/specs/authoring/schema-suggest.e2e.ts`: AUTH-K17 (initiative top level, Enter writes `heroes`), AUTH-K18 (hero `max_stamina`; `hero` offers nothing), AUTH-K19 (creature two lists deep `max_stamina`, and `- ` line `amount`), AUTH-K20 (ds-skills `custom_skills` entry `has_skill`; bare word under `skills:` offers nothing). Existing AUTH-K07 comment updated (its indented case is under `max_stamina: 20`, still silent). Next free ids: K21, G23. No new coverage pair (controls `authoring.schema.key` x `click/press:*` and `authoring.schema.trigger` x `type` already exist); manifest got a comment-only edit.
- Updated expectations of existing tests (behaviour intentionally changed): schemaSuggest "indented key under nested object" and two matrix rows.

## Gates (at head `aa06a043`; logs in the scratch dir below)
- tsc (`npm run tsc`, incl. `tsc -p e2e`): clean, exit 0. lint: clean, exit 0 (first run found 2 redundant type assertions in my new code; fixed in `aa06a043`).
- jest fresh (no shots cache): `Tests: 2 skipped, 15090 passed, 15092 total`; `Test Suites: 1 skipped, 324 passed`. Base e38f7838 = 15044 passed / 2 skipped, so +46 tests.
- lifecycle (seven `--only` parts, `G-S` ids from SCENARIOS order): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = **64/64 ok, 0 failed**.
- e2e (`npm run e2e`, full): **`OBSIDIAN-E2E done: 948/968 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`** (base 944/964; +4 = AUTH-K17..K20; known-bug unchanged at 20).
- styles.css: sha256 at head `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` == clean detached `e38f7838` build (same hash). Diff touches no CSS file. So shots **636**, freeze **280/280**, parity **0 / 0 / 24** carry (not re-run).

## Drive-by fixes:
None.

## Follow-ups:
1. `docs/writing-blocks.md` lines 57-58 ("Field-name suggestions are offered for top-level fields; deeper, indented fields are not suggested yet.") are now wrong. Suggested replacement: nested fields are suggested inside an object or a list entry (a hero's `max_stamina`, Roll `tiers`, Skills `custom_skills`); nothing is offered inside `{ }` / `[ ]`, in `|` or `>` text, after a Tab, on an oddly indented line, or where a list holds plain words. `docs/initiative-tracker.md` (SC-419, not touched) could mention that the tracker's fields are suggested. I changed no `docs/` page.
2. Descriptions in suggestion schemas are not rendered by `renderSuggestion` (value only). If Scott wants them shown, that is a separate change; the new YAML already carries them.
3. `ds-hero`'s existing schema lists `state` (tracker-written play state) and now its nested keys (`state.stamina.current`...) become suggestible with the gate on. ds-hero is hidden + deferred, so low impact; an owner call whether to trim.
4. Pre-existing, not changed: the key list does not filter keys already present in the block (top-level and now nested alike); a key accept still writes no `: ` (SC-678).
5. `statblock` in the initiative schema is `string`; the docs also allow an inline statblock object, which the parser does not resolve (only strings are). Not touched.

## Evidence artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r1-impl/`)
- `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log` .. `gate-lc7.log`, `gate-e2e.log`, `styles-head.sha`, `styles-base.sha`, `nested.out` (schema nested-object scan).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest/draw-steel-elements` (HEAD `aa06a043`; no pushes, tags or tracker calls).

---

## Round 3 (fix round, rulings O11-O15)

**Summary**
- Verdict: DONE. Head `3a09fc95` (base still `e38f7838`; origin/develop unmoved, no rebase).
- MEDIUM-1 fixed (`110c54ca`): `schemaPath.ts` now strips a trailing comment quote-aware (`stripComment`: a `#` inside a quoted piece is text; a quote only opens at a token start, so `Bob's # c` opens none). `valueOf` and `flowBalance` both use it (the `{`/`[` lines in `feed` go through `flowBalance`). 4 new jest cases (a: group after `"Bob #1"` hero, double and single quotes; b: directly under it; c: flow list with `"x #y"` then a group, and a `- { name: "a #b" }` item; d: a real trailing comment and an apostrophe). Verified the first three fail on the old code and pass on the new.
- O11 + O13 (`1ff0e132`): Roll `tiers` example dropped from `docs/writing-blocks.md` and the CHANGELOG bullet (Skills `custom_skills` kept). O14 (`3a09fc95`): e2e AUTH-K21, nested `squad_role: ca` -> `captain`, asserts saved bytes and cursor.
- Gates at head: tsc + lint clean; jest 15094 passed / 2 skipped (15090 + 4); lifecycle 64/64 (21+16+9+4+7+4+3); e2e `949/969 ok, 0 failed, 20 known-bug, coverage 540/540 pairs`; styles.css sha256 `50436d6b...e37e98` unchanged.

New text of the changed prose lines:
- `docs/writing-blocks.md` (lines 57-59): "Fields inside another field are suggested too. Inside a hero in an initiative block, for example, you get / `max_stamina`; inside a Skills block's `custom_skills` entry, `name` and `has_skill`."
- CHANGELOG sentence now ends: "Other blocks do the same inside their nested fields, for example a Skills block's `custom_skills` entries."

Commits: `110c54ca` fix(authoring): a quoted value containing ' #' ... ; `1ff0e132` docs(SC-707): drop the Roll tiers example ...; `3a09fc95` test(e2e): AUTH-K21 nested enum accept (squad_role).
Artifacts: logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r1-impl/r3/` (`gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log`..`gate-lc7.log`, `gate-e2e.log`, `styles-head.sha`). Drive-by fixes: none. Follow-ups: none new.

---

## Round 5 (small fix round, ruling O16)

**Summary**
- Verdict: DONE. Head `b8eb0aaa` (one commit on `3a09fc95`; base still `e38f7838`, origin/develop unmoved, no rebase). Only `src/authoring/schemaPath.ts` and `test/dom/authoring/schemaPath.test.ts` changed.
- LOW-1: `scanComment` (was `stripComment`) opens a quote only at the text start or after `[ { , :` (previous non-space char), as YAML does; `Bob 'x` and `it's` no longer open one.
- LOW-2: `flowBalance` returns null when the text ends inside a string; every flow line routes through `startFlow`/the continuation branch, which sets `giveUp`, and `resolveKeyScope` returns null. (Chosen over carrying quote state: simpler and safe.)
- LOW-3: `feed` checks `st.quote` before the blank/comment test, so a `#`-leading line inside a multi-line quote is text.
- LOW-4 + new shapes: 5 jest tests added (+5 total). LOW-1/2/3 shapes (incl. the stray `}` / stray `]` variants) fail on the old code (3 tests failed before, verified by stashing the source). The M1-M4 killing cases are in (M1 `it's`, M2 `{name: "a #b"} # c {`, M3 `"Bob \" #1"`, M4 `'Bob''s #1'`); I mutated each of M1-M4 in the source and each makes exactly 1 test fail.
- Gates at head: tsc + lint clean; jest 15099 passed / 2 skipped (15094 + 5); lifecycle 64/64 (21+16+9+4+7+4+3); e2e `949/969 ok, 0 failed, 20 known-bug, coverage 540/540 pairs`; styles.css sha256 `50436d6b...e37e98` unchanged.

Artifacts: logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r1-impl/r5/` (`gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log`..`gate-lc7.log`, `gate-e2e.log`, `styles-head.sha`, `mut-summary.txt`, `mut-M1..M4.log`). Drive-by fixes: none. Follow-ups: none new.

---

## Round 7 (test-only, ruling O19)

**Summary**
- Verdict: DONE. Head `545a4804` (one commit on `b8eb0aaa`). `git diff b8eb0aaa..HEAD --stat`: only `test/dom/authoring/schemaPath.test.ts`, 8 insertions. No source change.
- Two new tests: `conditions: [a,` + a string that starts on the next line (`"b` / `c # d", e]`), followed by a group, expects nothing; and the same with a stray `]` (`- name: G]`), expects nothing (never the hero keys).
- Mutation M10 (a null balance on the flow continuation line, `schemaPath.ts:167`, treated as 0): control 42/42 pass; with M10 exactly 1 test fails (the stray-`]` case). Source restored byte-for-byte (`cmp` against the saved copy).
- Gates: tsc (incl. `-p e2e`) clean; lint clean; jest fresh `15101 passed / 2 skipped` (15099 + 2). Lifecycle and e2e carry from `b8eb0aaa` (identical `src/`).

Artifacts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r1-impl/r7/` (`gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `mut-summary.txt`, `mut-M10.log`, `ctl.log`). Drive-by fixes: none. Follow-ups: none new.
