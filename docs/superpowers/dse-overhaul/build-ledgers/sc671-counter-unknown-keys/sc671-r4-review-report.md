# SC-671 r4 independent review: counter writes keep the YAML keys the counter does not read

## Executive summary

- **Verdict: LAND-READY.** dse `16cbd05f` on `bdf0255e` (`git fetch origin`: origin/develop is still `bdf0255e`). Superproject `cfd52772` on `cd79d841` on `8e7a7bbe`.
- **Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 3 LOW, 5 INFO.** None of them blocks landing.
- **Gates (I re-ran them on `16cbd05f` in the worktree):** tsc exit 0 · lint exit 0 · jest `2 skipped, 13890 passed, 13892 total` (fresh) · lifecycle part 4 `4/4 ok, 0 failed` (G-S61 green, no torn read) · e2e `OBSIDIAN-E2E done: 664/671 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` · styles.css `18730938…f1f9`, the same as the clean `bdf0255e` build, so shots, freeze and parity carry.
- **Integrity probes (items 1-8):** 109/109 jsdom probes green. Real-Obsidian probes R4A, R4C and R4D are green. R4B's data is correct, but it trips the view-registry collision invariant, and a no-unknown-keys control trips it the same way on `bdf0255e`, so that problem predates this branch (INFO-5).
- **Mutation testing:** of the 29 new jest tests, 25 fail on `bdf0255e` (unit 12/15, jsdom 13/14). The 4 that pass there are no-change guards. Mutants M1-M6 each turn at least one new test red. M7 cannot be caught: no write can tell it from the fix.
- **SC-442 cross-check:** one conflict, a two-sided table-row add in `e2e/README.md`. Only CTR-U01 changes outcome ("known bug SC-671 appears fixed"). Turned into a plain test, it passes. No SC-442 test turns red. No duplicate ids.
- **Item 12:** stamina-bar and project drop an unknown key, and their blocks render with one. conditions, heroic-resource, surges and hero-tokens also drop it at model level, but their closed schemas already refuse such a key. Table under Follow-ups.

## Owner rulings checked

| Ruling | Result |
|---|---|
| Not SC-599 | Holds. The fix stays inside the existing `parse` -> `stringifyOmittingUntouched` -> `stringifyYaml` path. No Document API, no source-text editing. |
| Placement | Holds. Known keys stay in their fixed order, `_dse_anchor` is last of them, and unknown keys follow in their original order (O09, O17, probes). A key that looks like an integer goes first and is pinned by a unit test. The CHANGELOG does not say so (LOW-3). |
| "Known" | Holds. The seven keys. The view reads only the model, and so does the chrome summary (`definition.ts:16-22`). The reserved keys are removed by the pipeline before `parse` (`collapsedKey.ts:102-127`, `prefOverrides.ts:61-79`). A known key with a wrong type or a falsy value is never carried as unknown: probe items 4/7 compare against base byte for byte. |
| SC-482 intact | Holds. 51 press cases on 17 sources with no unknown key, plus a delete-and-recreate case, write exactly what `bdf0255e` writes (same note, same error card, same Notices). |
| Every write path | Holds. +, −, typed value with Enter, typed value with blur, a clamped typed value, the pinned card, a write after an outside edit, the raw-YAML edit form (Save writes the box as typed, and a + after it keeps the keys) and Live Preview typed + Enter (R4D). The counter has no reset, no undo toast and no schema form. The stepper's only write is `onChange`, which goes through `persist()` (`stepper.ts:207-216`, `view.ts:62-65`). |
| No shadowing | Holds. Extras live in a module-private WeakMap and the DTO is built with `Object.fromEntries`. I tested 12 member and prototype names, in jsdom and in real Obsidian: no pollution, no crash, every key once. Mutant M5 (assignment instead of `fromEntries`) is caught. |
| Scope | Holds. `src/` changes only `src/elements/counter/model.ts`. |
| SC-442 overlap | Holds, apart from one mechanical README conflict (INFO-1). |

## Findings

### LOW-1: the edited wrapperDefaultKeys tests no longer cover "a block of only unknown keys returns to itself"

- **Where:** `test/dom/elements/wrapperDefaultKeys.test.ts:392-397`, `:456-458`, `:495-498` (commit `16cbd05f`).
- **What changed:** r1 changed the three sources from `title: Deaths` to `{}` / `PREFS`, and left the expectations alone. What those three tests pinned for SC-482 and SC-652 is still pinned: a mapping source goes back to `{}` and not to `''`, and a block with only a `prefs:` map goes back to that map.
- **What is lost:** the case the ticket creates. Nothing in the suite now runs this: a block that holds only keys the counter does not read, + then −, on the same live view, comes back byte-identical, with and without reserved keys. For example `title: Deaths` -> `current_value: 1\ntitle: Deaths` -> `title: Deaths`, and the same with `prefs:` in front.
- **Probe:** `r4-integrity.test.ts`, "only-unknown", 4/4 green. So the behaviour is right today; it is just not guarded.
- **Fix:** keep the `{}` cases and add the three `title: Deaths` cases back with the new expectations (`title: Deaths`, `prefs:\n  sbDensity: compact\ntitle: Deaths`, `collapsed: false\ntitle: Deaths`). Adding one O-test in `counter-own-keys.test.ts` would also do.

### LOW-2: `KNOWN_KEYS` is a hand copy of the `Counter` fields

- **Where:** `src/elements/counter/model.ts:57-59`, and `:87` (`Object.fromEntries([...Object.entries(model), ...extras])`).
- **Failure scenario:** someone later adds a field to `Counter.parse`, say `step`, and forgets `KNOWN_KEYS`. The source value of `step` is then carried as an unknown pair. Because `fromEntries` keeps the last value for a duplicate key, the stale source value overwrites the model's live value on every write. Mutant M3 shows the effect with `current_value`: a + is written as the old value, so the press never lands.
- **Why it is LOW:** today the list is correct, and the unit test "the model has exactly the seven fields" pins the instance keys. But no test ties `KNOWN_KEYS` to those keys.
- **Fix (any one):**
  - In `serialize`, drop extras whose key the model owns: `extras.filter(([k]) => !Object.prototype.hasOwnProperty.call(model, k))`.
  - Derive the set: `new Set(Object.keys(Counter.parse({})))`.
  - Add a unit test that asserts `KNOWN_KEYS` equals the instance keys.

### LOW-3: the CHANGELOG bullet says "your extra keys follow the counter's own keys"; an integer-looking key goes first

- **Where:** worktree `CHANGELOG.md:11-15`.
- **Failure scenario:** a block with `2024: year` comes back with `"2024": year` on the first line, above `max_value`, now quoted. Owner ruling: "document it". It is documented only in the code comment (`model.ts:53-55`) and in a unit test, not in anything a user reads.
- **The rest of the bullet is accurate.** It is plain words, under `## Unreleased`, in the worktree superproject only. It says the values are kept, and it does not claim that formatting, comments or flow style are kept.
- **Fix:** add "(a key that is a number, like `2024:`, moves to the top)" to the parenthesis. Or the owner accepts the gap, as the SC-625 and SC-637 bullets did.

### INFO

1. **SC-442 merge: one conflict.** `e2e/README.md:135-147`. Both branches add fixture-table rows right after the `Counter/kept-keys.md` row. Keeping both sides resolves it. Whichever branch lands second does this.
2. **The YAML reader changes some number values on write.** It applies to unknown keys exactly as it already applies to known keys, and to montage and negotiation. Base deleted these keys outright, so this is strictly better. SC-599-adjacent; owner may file it:
   - `id: 12345678901234567890` -> `12345678901234567000` (precision is lost)
   - `1.0` -> `1`, `0x1F` -> `31`, `0o17` -> `15`, `1e3` -> `1000`
   - Evidence: `r4-yaml-values.cjs`.
3. **r1's jsdom harness skips a step production takes.** `test/dom/elements/counter-own-keys.test.ts:56-63` never calls `host.setMountedBody(body)`; production does at `src/framework/registerFrameworkElements.ts:149`.
   - Without it, writes go out without the SC-552 pin. An outside edit that lands inside the debounce is then overwritten: the branch writes the stale unknown value back (`changed: before`), base drops every unknown key.
   - With it, as in production, both builds refuse the write with the dropped-write Notice, and the outside edit stays. Real Obsidian shows the same (R4C, branch and base).
   - Not a product bug. Suggest seeding the harness.
4. **The jest `stringifyYaml` mock differs from real Obsidian 1.14.4 in two ways.** Seen in R4A's written block:
   - A null is written `nul: null` by the mock and `nul:` by Obsidian.
   - An aliased map is written `anch: &a1` / `ali: *a1` by the mock; Obsidian writes the map out twice.
   - Separately, the e2e driver's `expectNoteBlock` parses with js-yaml, which treats `<<` as a merge key, while the product's parse keeps `<<` as a plain key. No test on this branch depends on any of these bytes.
5. **Two identical counters that become identical again after a write count a view-registry collision.** This is not caused by SC-671. The e2e invariant `collisions=1 (expected 0/0)` fails on `bdf0255e` too (R4E: base and branch both fail).
   - Sequence: + on the lower twin, then + on the upper twin, which makes the two blocks identical again.
   - The note is correct on disk in both builds.
   - Follow-up candidate (see Follow-ups).

## Probe results (items 1-11)

All jsdom probes are in `test/dom/probe/r4-integrity.test.ts` (final run `r4-probe5.log`: 109/109). They run through the real `ElementPipeline` and the real `ReadingModeBlockHost`, with `setMountedBody` seeded the way production does it. Each case runs on the branch definition and on the same definition with `bdf0255e`'s `parse`/`serialize`.

| # | Probe | Result |
|---|---|---|
| 1 | Front matter, prose, a ```js fence, a quote, a `ds-stamina-bar` block and a list around the counter. Four write paths. | Every byte outside the counter body is unchanged (4/4). R4A in real Obsidian: the same with a js and a stamina block. |
| 2 | Two live counters with different unknown keys, pressed A, B, A. Identical twins, each one pressed. | The block not pressed stays byte-identical every time, and no key moves across (3/3). Real Obsidian R4B: data correct, collision invariant red as on base (INFO-5). |
| 3 | An outside edit adds, removes and changes unknown keys, then a press. An outside edit that removes every unknown key. An outside edit inside the debounce. | The outside edit's key set is written (3/3). Inside the debounce, the write is dropped with the Notice "…not saved — the block changed on disk first" and the outside edit stays, identical on base (jsdom, and real Obsidian R4C on branch and base). |
| 4 | 17 sources with no unknown key: falsy values, wrong types, out of range, `{}`, a comment, `prefs` map and scalar, collapse keys incl. the SC-652 unusable forms, quoted reserved keys, an anchor. Each with + / − / typed. Plus delete and re-create. | 52/52 byte-identical to base: note, error card and Notices. |
| 5 | Write paths: grep of `view.ts`, `stepper.ts`, `SidebarPanel.handleExternalChange`, the FormModal raw mode and the hosts. | No path is missed. Edit form: a no-edit Save is byte-identical, an edited Save is written verbatim, and a + after it keeps the keys (`r4-form.test.ts` 1/1). Nothing builds a new `Counter` from another one. |
| 6 | Hostile keys: `__proto__` map, `constructor`, `toString`, `hasOwnProperty`, `toJSON`, `valueOf`, `isPrototypeOf`, `propertyIsEnumerable`, `__defineGetter__`, `Current_Value`, `MAX_VALUE`, `2024`, `0`, `""`, null, `~`, nested list and map, deep map, `&a`/`*a`, `<<`, a block scalar holding `_dse_anchor:` and `prefs:` lines, a 200 kB string, a 3000-item list. Two presses with a redraw between. Duplicates of a known key and of an unknown key. | No pollution, no crash. Every key appears once, values are deep-equal, integer keys come first. Duplicates: the same "Map keys must be unique" card as base. Real Obsidian R4A agrees, and the block-scalar `_dse_anchor:` line does not confuse the anchor finder. |
| 7 | Pinned card: `prefs: compact` + `collapsed: yes` with no anchor (the pin stamps one); `prefs` map + `collapsible: false` + an existing anchor. Three presses each. With-unknown jsdom cases: reserved keys plus unknown keys, compared with base. | One `_dse_anchor`, one line per reserved key, in today's place. Extras come after `_dse_anchor`. No "Backing block not found". No Notice. The branch body is exactly the base body plus `\n` plus the extras (27/27). |
| 8 | Non-map bodies: `hello`, `- a\n- b`, `[1, 2]`, empty, `~`, `null`, `5`, `collapsed: true\nhello there`, `"just a string"`, a duplicate key. | Identical to base in all 10. `hello` -> `current_value: 1`; empty, `~` and `null` -> the raw TypeError card (SC-672, unchanged). |
| 9 | Mutation testing. | See below. |
| 10 | SC-442. | See below. |
| 11 | CHANGELOG. | Accurate, apart from LOW-3. |

## Mutation results

Each mutant was run against the 3 new or edited jest files plus the probe file (`mutant-*.json` / `mutant-*.txt`).

| Mutant | counter-serialize (15) | counter-own-keys (14) | wrapperDefaultKeys (56) | r4 probes (105) |
|---|---|---|---|---|
| M0 = `bdf0255e` model | 12 red | 13 red | 0 | 37 red |
| M1 drop the carry | 12 | 13 | 0 | 37 |
| M2 extras before the known keys | 10 | 11 | 0 | 29 |
| M3 `current_value` carried as unknown | 3 | 13 | 6 | 77 |
| M4 `value_height` carried as unknown | 1 | 0 | 1 | 4 |
| M5 assignment instead of `fromEntries` (`__proto__` goes into the prototype) | 1 | 1 | 0 | 1 |
| M6 no array guard | 1 | 0 | 0 | 2 |
| M7 `_dse_anchor` carried as unknown | 0 | 0 | 0 | 0 |

- **M7 cannot be detected.** The model's `_dse_anchor` always equals the source value, and `fromEntries` keeps the first position and the last value, so the output is the same.
- **e2e on base:** CTR-O01 FAILs (`r4-probe-e2e2c-base.log`). r1 reported O01..O04 0/4 on base.
- **Tests that pass on base**, all no-change guards, none of them hollow:
  - unit: no-unknown-keys byte identity
  - unit: the instance has exactly seven fields
  - unit: non-map body
  - jsdom: O16
- No new test was found that passes without reaching the write.

## SC-442 cross-check

The fetched sha is `ed7130d9`, as expected. It was merged onto `16cbd05f` in the probe only, as probe commit `dc92e735`.

- **(a) Merge:** one conflict, in `e2e/README.md`: fixture rows on both sides at the same spot (INFO-1). Everything else merged automatically, including `e2e/manifest/counter.ts`, `_census.e2e.ts` and `e2eCensus.test.ts`. No conflict came from the SC-675, SC-434 or SC-641 landings.
- **(b) Runs:**
  - jsdom: `counter-matrix`, `e2eCensus`, `counter-own-keys`, `counter-serialize`, `wrapperDefaultKeys`: 321/321 green (`r4-sc442-jest.log`).
  - e2e `--element=counter` (`r4-probe-e2e1.log`, 40 tests: 36 from SC-442 and this branch, 4 r4 probes): every SC-442 test and CTR-O01..O04 is ok. CTR-U01 is the only one that changes outcome: "known bug SC-671 appears fixed - remove the marker". The 6 other known-bug markers (SC-672 ×2, SC-673 ×2, SC-674, SC-680) still pass as known bugs.
  - CTR-U01 turned into a plain `it` (marker and `failsWith` removed): ok (`r4-probe-e2e2a.log`, `4/4 ok`).
- **(c)** No plain SC-442 test turns red.
- **(d)** No duplicate scenario ids: 36 unique CTR ids, and the runner's duplicate check passed. No fixture or census clash (`own-keys.md` and `unknown-keys.md` are different files; `e2eCensus` is green).

## Follow-ups (for the owner to file or rule)

1. **Other persisted elements drop an unknown top-level key** (item 12, model level: `serialize(parse(example + "note_to_self: keep me"))`):

   | element | alias | result |
   |---|---|---|
   | stamina-bar | ds-stam | **DROPPED** (open schema: a real loss on write) |
   | project | ds-project | **DROPPED** (no schema: a real loss on write) |
   | conditions | ds-conditions | DROPPED (schema `additionalProperties: false`: the block is already refused at validation) |
   | heroic-resource | ds-resource | DROPPED (closed schema, as above) |
   | surges | ds-surges | DROPPED (closed schema, as above) |
   | hero-tokens | ds-tokens | DROPPED (closed schema, as above) |
   | negotiation | ds-nt | kept |
   | initiative | ds-it | kept |
   | counter | ds-ct | kept |
   | encounter | ds-encounter | kept |
   | montage | ds-montage | kept |
   | party | ds-party | kept |
   | hero | ds-hero | kept |

2. **The identical-twins collision (INFO-5),** reproduced on `bdf0255e`. In Reading view, two identical `ds-counter` blocks: + on the lower, then + on the upper, so they read the same again. The e2e invariant then reports `view registry collisions=1`. The data is correct. Is this an adoption miss the gate should allow, or a bug?
3. **The YAML number round trip (INFO-2):** `12345678901234567890` loses digits on any write, for any element.
4. **Test infrastructure (INFO-3, INFO-4):** the jest `stringifyYaml` mock differs from Obsidian on null and on aliases; the e2e driver parses with js-yaml (it merges `<<`); the counter-own-keys harness does not seed `setMountedBody`.

## Gate logs

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r4-review/`:

- **tsc** `r4-tsc.log`: exit 0
- **lint** `r4-lint.log`: exit 0 (only the existing `.eslintignore` warning)
- **jest** `r4-jest.log`: `Test Suites: 1 skipped, 302 passed, 302 of 303 total` · `Tests: 2 skipped, 13890 passed, 13892 total` · exit 0. Load: `r4-pre.load`.
- **lifecycle part 4** `r4-lc4.log`: G-S57, G-S62, G-S61, G-S56 ok, `4/4 ok, 0 failed`, exit 0. Load at start 2.26 (`r4-lc4.load`). `demo-vault/.obsidian/appearance.json` clean (`r4-lc4.pre`).
- **e2e** `r4-e2e.log`: `OBSIDIAN-E2E done: 664/671 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` · exit 0 · pointer parked. Load at start 5.85 (`r4-e2e.load`).
- **styles.css** `r4-styles.sha`: `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` before and after the e2e run, the same as `…/sc671-r3-rebase/base-bdf0/styles.css`.
- **Lifecycle parts 1-3 and 5-7** carry from r3: no finding touches them.
- After the runs, the worktree (plugin and superproject) shows `git status --porcelain` empty. HEADs are unchanged: dse `16cbd05f`, superproject `cfd52772`.

## Proposed SKILL.md text (dse-verify)

- "A jsdom write test built on `ReadingModeBlockHost` must call `host.setMountedBody(body)` before `pipeline.run`, as `registerFrameworkElements.ts` does. Without it the host takes no SC-552 pin. An outside edit inside the debounce is then overwritten instead of refused, so a test of that race passes or fails for the wrong reason."
- "The e2e driver's `expectNoteBlock` parses with js-yaml (it merges `<<:` keys), not with Obsidian's `yaml`, and the jest `stringifyYaml` mock writes `key: null` and `&a1`/`*a1` where Obsidian 1.14.4 writes `key:` and the map twice. Assert merge keys, nulls and aliases on the note TEXT."
- "The Bash tool on this host backgrounds a call after about 120 s. Poll your own pid with `timeout 100 tail --pid=<pid> -f /dev/null`." (r1's line; confirmed again.)

## Evidence artifacts

- **Probe worktree** (left registered, not removed): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r4-review/dse-probe`. HEAD is `dc92e735`, the probe-only merge of SC-442 onto `16cbd05f`. Probe files in it:
  - `test/dom/probe/r4-integrity.test.ts`
  - `test/dom/probe/r4-side-unknown-keys.test.ts`
  - `test/dom/authoring/r4-form.test.ts`
  - `src/elements/counter/model.base.ts`
  - `e2e/specs/counter/r4-probe.e2e.ts`
  - `e2e/vaults/shipped/Counter/r4-*.md`
  - CTR-U01 turned into a plain test in `e2e/specs/counter/counter-bugs.e2e.ts`
- **Logs:**
  - probes: `r4-probe1..5.log`, `r4-probe-form.log`, `r4-side.log`
  - mutation: `r4-mutants.log`, `mutant-M*.json`, `mutant-M*.txt`, `mutants/M*.ts`
  - SC-442: `r4-sc442-jest.log`, `r4-probe-e2e1.log`, `r4-probe-e2e2a.log`, `r4-probe-e2e2b.log`, `r4-probe-e2e2c-base.log`, `r4-probe-e2e3a.log`, `r4-probe-e2e3b-base.log`
  - YAML values: `r4-yaml-values.cjs`
  - e2e failure bundles: `dse-probe/e2e/.out/`
