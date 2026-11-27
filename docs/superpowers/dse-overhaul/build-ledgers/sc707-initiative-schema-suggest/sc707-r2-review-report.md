# SC-707 round 2: independent review report

**Executive summary**
- Verdict: **FIX-ROUND** (one MEDIUM: a wrong suggestion, which O2 rules out). Head reviewed `4da5ef69` (merge-base with `origin/develop` = `e38f7838`).
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 1 · INFO 3.
- MEDIUM-1: a quoted value holding ` #` (`name: "Goblin #1"`) makes the path walk read an unclosed quote. It skips lines until the next quote, so the wrong level's keys are offered (hero keys inside an enemy group). Fix: strip `# comment` only outside quotes.
- O1 isolation holds. No reader outside `schemaSuggest.ts`. Four initiative blocks the suggestions schema would reject (wrong types, extra keys, runtime keys, parse error) render byte-identical DOM at base and head, with identical form fields (`[]`) and scaffold.
- O2: top-level lists are unchanged against base for every element and alias, gate off and on (3133 probe points; the only differences are the 4 initiative aliases plus id `initiative`, which had nothing before). Callout blocks equal base. The nested keys offered for ds-skills, ds-roll and ds-hero are all read by those parsers.
- O3: the key lists match model.ts / resolveRefs.ts / EncounterData.ts. The drift test fails on a bogus key at each of the 5 levels, on a schema-only key, and on a new nested level. Reverting `schemaSuggest.ts` fails 32 of the 170 tests in the 4 SC-707 jest files.
- Gates at `4da5ef69`: tsc + lint clean · jest 15090 passed / 2 skipped (fresh, no shots cache) · lifecycle 64/64 · e2e (see Gates) · styles.css sha256 identical to a clean `e38f7838` build.

## Findings

### MEDIUM-1: a quoted value that contains ` #` freezes the path walk, so the wrong object's keys are offered

- **Where:** `src/authoring/schemaPath.ts:53-55` (`valueOf` strips `(^|[ \t])#.*$` from the raw value), used by `afterKey` at `:105-115`. That function then sees `"Bob` (the quote is not closed) and sets `st.quote`. From then on, `feed` (`:123-125`) skips every line until one holds that quote character.
- **Failure scenario (measured, jsdom + the real `DsSchemaSuggest`, gate on and off):**
  ```
  ```ds-initiative
  heroes:
    - name: "Bob #1"
      max_stamina: 3
  enemy_groups:
    - name: "Orcs"
      |            <- cursor, indent 4
  ```
  The list offered is `name, max_stamina, statblock, current_stamina, temp_stamina, image, conditions`: the **hero** keys, inside an enemy group. The right list is `name, creatures, is_squad`. The control with `"Bob 1"` gives exactly that. Single quotes (`'Bob #1'`) fail the same way. The frames freeze at the hero, because `enemy_groups:` is skipped and the closing line `- name: "Orcs"` is consumed as the end of the quote.
  The bug also hides lists that should open. Directly under the `"Bob #1"` hero nothing is offered. `conditions: [grabbed, "x #y"]` (flow plus a quoted `#`) blanks the rest of the block.
  Names like "Goblin #1" or "Minion #2" are plausible in a tracker, and the shipped `example.yaml` quotes every name.
- **Why MEDIUM:** O2 / "Finding 2" says a wrong suggestion is worse than none. This is a wrong suggestion. It causes no data loss: the parser ignores unknown group keys.
- **Fix:** strip a trailing comment quote-aware. When the value starts with `"` or `'`, find its closing quote on the RAW text first (honouring `\"` and `''`), and treat only a ` #` after that point as a comment. Equivalently, run `flowBalance`'s quoted-piece removal before the comment strip, and use the same quote-aware strip before `flowBalance` on `- {` / `{` lines (`:163-164`, `:172-173` in `feed`). Add jest cases to `schemaPath.test.ts`:
  - (a) the block above gives the group keys;
  - (b) `heroes:\n  - name: "Bob #1"\n    ` gives the hero keys;
  - (c) the single-quote twin;
  - (d) `conditions: [grabbed, "x #y"]` followed by a group gives the group keys.

### LOW-1: the CHANGELOG bullet still names the Roll block as an example

- **Where:** `CHANGELOG.md:27` ("…for example the Roll block's `tiers` and a Skills block's `custom_skills` entries").
- **Scenario:** the reasoning behind O11 (Roll sits behind the Experimental setting, so most readers can't see it work) applies to the CHANGELOG too. O11 only names `docs/writing-blocks.md`.
- **Fix (owner call):** in the same fix round, cut the example to the Skills block: "…for example a Skills block's `custom_skills` entries." Everything else in the bullet matches what I measured: the initiative top-level and nested lists, `squad_role` values, the tracker-written keys not offered, nothing inside `{ }`/`[ ]`/`|`/`>`/after a Tab/odd indentation/plain-word lists, and parse and error cards unchanged.

### INFO-1: for tracker-written keys, the drift test's read check is not what guards the list

- **Where:** `test/dom/authoring/initiativeSuggestSchema.test.ts` test 3 together with `src/elements/initiative/model.ts:228-254`. `noteAbsent` reads every key in `HERO_KEYS` / `CREATURE_KEYS` / `GROUP_KEYS`, which include `has_taken_turn`, `isHero`, `with_captain`, `instances` and the pool keys.
- **Measured:** adding `has_taken_turn` to the hero schema and the sample is caught only by test 4's hand-written exclusion list. Test 3 passes, because noteAbsent "reads" it. A bogus key at every level is caught by test 3 (5/5), so the O3 guard ("every key is a key the parser reads") holds as specified. The exclusion of tracker-written keys rests on the hand list.
- **Fix:** none required. Optionally say so in test 4's comment.

### INFO-2: no real-Obsidian test of a nested enum accept

- AUTH-K17..K20 assert the exact list (`toEqual([[KEY, 'max_stamina']])`, `waitNoList()` for the negative cases) and the saved note bytes, so they are not "a list appeared" tests. No e2e covers `squad_role:` values on an indented line; jsdom covers it (`schemaPath.test.ts`, "a nested enum value is written after the colon…").
- **Fix:** optional, an AUTH-K21 for a nested `squad_role: ` accept.

### INFO-3: other probe results (all as intended, no action)

All of these behaved as intended:
- **Indentation and list styles:**
  - A non-indented list (`heroes:\n- name: A\n  `) gives hero keys, and a col-0 key after it gives top-level keys.
  - 3-space list indentation and `-   name:` resolve correctly.
  - A bare `-` line followed by keys resolves.
  - Blank lines and comments between the parent and the cursor are skipped.
- **YAML features:**
  - Anchors (`heroes: &h`) and merge keys (`<<: *base`) resolve; an alias (`heroes: *h`) gives nothing.
  - CRLF, `---`, and a tilde fence behave like plain lines.
  - A second block after a closed one uses its own schema.
- **Places where nothing opens:**
  - Text inside a block scalar, a `- |` list entry, and an unbalanced `[[link]`.
  - `instances:`, `malice.log`, hero `actions:`, and an unknown key's children.
  - A callout-quoted block at any depth, and an indented fence inside a markdown list item (same as base).
- **Mid-word:**
  - An enum `ca|pt` gives a trigger range ending at the cursor; SC-688's accept extends it to the word end (unchanged code path).
  - The key side is SC-678's (out of scope).

## What I checked and how

- **O1:** grep of every reader. `suggestSchema` appears only in `registry.ts:47` (the type), `schemaSuggest.ts:56` and `initiative/definition.ts:48`. `def.schema` readers are `pipeline.ts:407`, `formModel.ts:47-48`, `FormModal.ts:175/362/371/421` and `scaffold.ts:119`; none reads `authoring.suggestSchema`. Nothing iterates over the `authoring` object generically.
  Runtime probe `zzO1Sc707r2.test.ts`, run through the real `ElementPipeline` at head and in a clean `e38f7838` worktree:
  - four sources: wrongTypes (renders an error card at both), extraKeys, runtimeKeys, parseError (error card at both);
  - recorded: DOM, writes, `fieldsFromSchema` (`[]`), `buildScaffold` (the example) and `def.schema` (undefined);
  - result: the JSON dumps are byte-identical (`cmp` exit 0).
- **O2:**
  - Probe `zzProbeSc707r2.test.ts`, at head and base, gate off and on: every registered element id and alias at the top level with 13 prefixes; every top-level key's enum values, child, `- ` child, col-0 `- ` child and an indented enum line; and callout lines. 3133 points.
  - Head versus base: 214 differences. 140 are top-level differences, all on the initiative id or aliases. The rest are nested cases, which offered nothing at base.
  - Nested lists that now open are listed below; all of these keys are read by their parsers:

    | Element | Nested key | Keys offered | Parser that reads them |
    |---|---|---|---|
    | ds-skills | `custom_skills[]` | name, has_skill, skill_group, description | `CustomSkill.parse` (`src/model/Skills.ts:88`) |
    | ds-roll, gate on | `tiers` | t1, t2, t3 | `roll/view.ts:44-46` |
    | ds-hero, gate on | `characteristics` | might, agility, reason, intuition, presence | `hero/model.ts:119` |
    | ds-hero, gate on | `resource` | type, min | `hero/model.ts:129-132` |
    | ds-hero, gate on | `state` | (O9) | |
  - ds-conditions entries give nothing. ds-skills `skills:` entries give nothing.
  - Probe 2 (`zzProbe2Sc707r2.test.ts`) adds 40 edge cases; results are in `probe2-head.txt`.
- **O3:** the lists checked against `model.ts:228-254`, `parse`, `resolveRefs.ts:110-200`, `EncounterData.ts` interfaces, `example.yaml` and `docs/initiative-tracker.md` field lists. None is missing or extra beyond the ones O5 rules on.
  Mutations (private worktree, restored after each run):

  | Mutation | Tests failed | Which test |
  |---|---|---|
  | bogus key at hero, creature, group, malice or top | 1/5 each | test 3 |
  | schema-only key | 2/5 | tests 2 and 3 |
  | new nested level | 1/5 | test 1 |
  | `has_taken_turn` | 1/5 | test 4 |
  | `instances` | 1/5 | |
  | group `minion_stamina_pool` | 2/5 | |
- **Tests not vacuous:**
  - `schemaSuggest.ts` reverted to `e38f7838` in the private worktree: 32 failed / 138 passed of 170 in `schemaPath`, `schemaSuggest`, `schemaSuggestMatrix` and `initiativeSuggestSchema`.
  - Control at head: 170/170.
  - The passing ones are the negative "offers nothing" cases and pre-SC-707 tests.

## Gates (measured at `4da5ef69`, in the ticket worktree)

| Gate | Result | Notes |
|---|---|---|
| tsc (`npm run tsc`, incl. `tsc -p e2e`) | clean, exit 0 | |
| lint | clean, exit 0 | only the usual `.eslintignore` deprecation warning |
| jest (fresh, no `visual-harness/dist/obsidian-app.css`) | `Tests: 2 skipped, 15090 passed, 15092 total`; `Test Suites: 1 skipped, 324 passed` | base 15044 → +46, matching the implementer |
| lifecycle, part 1 | 21/21 | 183 s |
| lifecycle, part 2 | 16/16 | 319 s |
| lifecycle, part 3 | 9/9 | 400 s |
| lifecycle, part 4 | 4/4 | 293 s |
| lifecycle, part 5 | 7/7 | 389 s |
| lifecycle, part 6 | 4/4 | 292 s |
| lifecycle, part 7 | 3/3 | 194 s |
| lifecycle total | **64/64 ok, 0 failed** | |
| e2e (`npm run e2e`, full, 433 s, loadavg about 4) | **`OBSIDIAN-E2E done: 948/968 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`** | base 944/964 → +4 = AUTH-K17..K20, all ok; known-bug unchanged at 20 |
| styles.css | sha256 `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` at head | identical to a clean `e38f7838` build in a separate worktree; the diff touches no `.css` or `visual-harness` file |

Because styles.css is identical, shots **636**, freeze **280/280** and parity **0 / 0 / 24** carry. I did not re-run them.

MEDIUM-1 was measured in jsdom over a real CodeMirror `EditorState` (`_cmEditor.ts`). `onTrigger` only reads lines, so a real-Obsidian run would not differ.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r2-review/`)

- `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log` .. `gate-lc7.log`, `gate-e2e.log`, `styles-base.sha`, `styles-head.sha`, `css-base-build.log`, `gate-head.sha`
- `zzProbeSc707r2.test.ts`, `probe1-head.json`, `probe1-base.json`, `cmp1.py` (O2 top-level / nested diff)
- `zzProbe2Sc707r2.test.ts`, `probe2-head.json`, `probe2-head.txt` (edge cases incl. MEDIUM-1)
- `zzO1Sc707r2.test.ts`, `o1-probe-wt.json`, `o1-base-wt.json`, `o1-cmp.txt` (O1 render isolation)
- `mutate.py`, `mutate-run.log`, `mutate-results.json`, `mut-*.log` (drift-test mutations, the revert run)
- Private worktrees `probe-wt` (detached `4da5ef69`) and `base-wt` (detached `e38f7838`), removed at the end (see final status)
