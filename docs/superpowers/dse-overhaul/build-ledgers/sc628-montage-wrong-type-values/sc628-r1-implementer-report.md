# SC-628 r1 implementer report

**Executive summary**
- Verdict: DONE. M1-M4 implemented as ruled; MONT-W01 / W02 are plain tests; one open question to rule (see Follow-ups: `null`, Reset / Set limits).
- dse branch `sc628-montage-wrong-type-values` head `2181a008` on base `afd1436c` (origin/develop still `afd1436c`, no rebase). Superproject CHANGELOG commit `e0f87b4b` (on `c1825403`; origin/main is now `51b3b6e5`, a HANDOFF-only change, no CHANGELOG conflict). No pointer bump made.
- Gates: tsc clean (incl. `tsc -p e2e`), lint clean, jest `13136 passed / 2 skipped` fresh (12922 + 210 new + 4 `e2eCensus` rows the new e2e fixtures add), lifecycle 21+16+9+4+7+4+3 = 64/64 ok (no flake, no re-run), e2e `OBSIDIAN-E2E done: 577/598 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`.
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` in the worktree and in a clean `afd1436c` export build: identical, so shots / freeze / parity carry (not run).
- New tests: unit 180, jsdom 30, e2e 5 (MONT-W04..W08); e2e W01 / W02 flipped to plain. On base (model.ts restored to `afd1436c`): unit+jsdom 136 of 210 fail, e2e 7 of 7 (W01, W02, W04..W08) fail.
- Entry-level / participant-level survey: DATA LOSS found (entry `round: "2"` and others are dropped from the note on the next write; `description: 5` and a non-map block likewise). No raw JavaScript error anywhere. Details in Follow-ups.

## Commits
dse (`/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values/draw-steel-elements`):
- `30eb7aec` fix(SC-628): a montage reads a number or boolean title as text and a quoted number as a number, and writes untouched values back as typed; a map or list title is a plain error (`src/elements/montage/model.ts`, unit + jsdom tests)
- `2181a008` test(SC-628): MONT-W01 and MONT-W02 are plain tests; MONT-W04..W08 ...; fixtures and README rows; openNote accepts an error card as drawn (`e2e/`)

Superproject (`/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values`): `e0f87b4b` docs(changelog): SC-628 ... (one bullet under `## Unreleased`).

## Design
Only `src/elements/montage/model.ts` changed in `src/`. No view code changed: every reader gets the corrected model.
- **Read.** `parseModel` goes through `readTitle` and `readNumber` (one `NUMBER_DEFAULTS` table, which also gives `PARSER_DEFAULT_KEYS` for SC-482). Title: number / boolean -> `String(raw)`; map / list -> `throw new Error("Invalid data: 'title' must be text.")` (the throw is in `def.parse`, so the card is `Montage Test tracker: failed to render (render)`, stage `render`, no control, same as encounter / SC-638); string, `null` (a bare `title:`) and absent as before. Number key: native number as is; absent / `null` default; a string that matches `^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$` after trim -> that number (so `"0x10"`, `"Infinity"`, `""`, `"3 rounds"` are NOT numbers); anything else (`banana`, `""`, boolean, map, list) -> the key's default.
- **Where the typed value is remembered.** A module-private `WeakMap<object, TypedValues>` (`typedValues`) keyed by the parsed model: `title?: {text, raw}` and `numbers: Map<key, {value, raw}>` (`value` = the number the key was read as, `raw` = what the user typed). Nothing is an own property of the model or an entry (unit test pins `Object.keys` / `getOwnPropertyNames` / symbols). SC-482's `recordingDefaults` record is untouched (a typed key is declared, so it is never "absent").
- **Write.** `serialize` calls `typedTitle` / `typedNumber` for the six keys + title: the raw value is written only while the model still holds exactly what the parse read (`title === text`, `Object.is(model[key], value)`). In addition every post-parse assignment of a number key goes through one `setNumber(m, key, value)` that forgets the typed value, so a key the montage assigned is always written as a plain number even when it lands on the same number (Set limits saved over `failure_limit: banana` writes `0`; Undo clamped at 0 over `successes: banana` writes `0`; Reset progress writes `0, 0, 1`). A hand-built model (no record) is written as before.
- Key order, SC-625 unknown keys and SC-482 omitted defaults are unchanged (tests cover title+rounds+unknown key combined).
- e2e driver: `e2e/driver/dse.ts` `openNote` now counts an error card (`data-dse-error-stage`) as drawn. Written byte-identical to the SC-638 branch's version (blob `0f1b7d96`), so the two branches merge cleanly on that file.

## Inputs and results
| Input | Card | A write (e.g. Add a round / Add a hero / End round) |
|---|---|---|
| `title: 2024` / `true` / `false` / `3.5` | montage drawn, name "2024" / "true" / "false" / "3.5", eyebrow "Montage Test"; folded summary names it | `title: 2024` (number) / `true` (boolean) / `3.5` (float), never `"2024"` |
| `title: "2024"` | text "2024" | stays a quoted string |
| `title:` / `title: ''` / absent | as before ("Montage Test") | as before |
| `title:` map / list / `[]` / `{}` | plain error card `Invalid data: 'title' must be text.`, title line `Montage Test tracker: failed to render (render)`, 0 controls | nothing written (jsdom: 0 writes, no Notice; e2e: note byte-identical after a click) |
| number key `"3"` / `" 3 "` / `"0"` / `"3.5"` / `"-1"` | read as 3 / 3 / 0 / 3.5 / -1 | changed by the montage -> plain number (`rounds: "3"` + Add a round -> `rounds: 4`; `current_round: "1"` + End round -> `2`; `successes: "2"` + quick success -> `3`); untouched -> as typed (`"3"`, `" 3 "`) |
| number key `banana`, `''`, `"  "`, `"3 rounds"`, `"0x10"`, `"Infinity"` | the default (rounds 2, limits 0, counters 0, current_round 1) | untouched -> as typed; changed -> number |
| number key `true` / `false` / `{a: 1}` / `[1, 2]` / `[]` | the default | untouched -> back as the boolean / map / list; changed -> number |
| number key `null` / absent | the default (as before) | as before (`null` is written as the default number, see Follow-ups) |
| Set limits / Reset progress / Undo | assign keys | the keys they assign are numbers, whatever was typed |

## Tests
- `test/unit/model/montage-wrong-types.test.ts` (180): title read table, refusal (4 shapes, message, no raw JS text), title round trip as typed, quoted-number read table (6 keys x 5), default table (6 keys x 11), null / absent, native numbers, readers (tallies, outcome, band copy, previous round, pending), the write paths (Add a round, End / Back, quick log, Undo, Set limits, Reset progress), untouched-as-typed table (6 keys x 8), SC-482 / SC-625 interaction, no extra own property, two blocks, re-parse.
- `test/dom/elements/montage-wrong-types.test.ts` (30), through the real pipeline: title drawn as text (4), folded summary (2), write keeps the typed title (4 controls + bool / float + quoted), error card (3 shapes) + null / empty title, quoted rounds / current_round / successes / failures drawn and written, Set limits pre-fill and save, non-number tallies, untouched typed values after Add a hero (5), map / list in number keys, mixed changed + untouched write.
- e2e `e2e/specs/montage/wrong-values.e2e.ts`: W01, W02 plain (assertions unchanged, header comment rewritten); W04 `title: true` shown and kept after Add a round; W05 `current_round: "1"` + End round -> `current_round: 2`; W06 `successes: "2"` + quick success -> 3; W07 `title: 2024` stays a number and `rounds: "3"` stays `"3"` after writes that leave them alone; W08 map title: plain error naming `title`, 0 controls, stage render, note byte-identical after a real click. Fixtures `Montage/wrong-title-bool.md`, `wrong-title-map.md`, `quoted-current-round.md`, `quoted-successes.md` + README rows (existing `wrong-title` / `quoted-rounds` rows rewritten). No new manifest row (fixtures are not controls); coverage 416/416.
- jest +4 beyond my 210: `test/dom/e2eCensus.test.ts` 74 -> 78 (measured with a per-file json diff base vs new).
- Existing tests changed: none.

## Drive-by fixes
None.

## Follow-ups (for the owner to rule; nothing below was fixed)
Entry-level / participant-level / other wrong types, measured today through the real pipeline (draw, then Add a round; input and output in `survey.txt`). No raw JavaScript error and no throw in any of them; every block draws.
1. **Entry `round: "2"` (quoted), entry `hero: 5`, entry `result: 5`, entry `result: {a: 1}`, `entries:` as a map: the entry (or the whole `entries` value) is DROPPED on the next write: LOST FROM THE NOTE.** `sanitizeEntry` requires string hero, finite-number round, non-empty-string result; it only `console.warn`s. Tally `successes: 1` stays, the entry that explains it is gone. (Entry `round: 2.5` survives and is written back.)
2. **Entry `skill: 5` / `note: 7` (non-string): the two keys are dropped from the entry on the next write** (the entry itself survives): LOST.
3. **`description: 5` and `description:` map: dropped on the next write: LOST** (documented in model.ts as "stays dropped as before"; `description` is "handled" only in the sense that the card draws).
4. **A block whose body is not a map (`hello`, `- a\n- b`, `5`): the card draws as a default montage and the next write REPLACES the whole body with `rounds: 3`** (the typed text / list is lost). Negotiation's twin ledger flagged the same question for its element.
5. Participants: hero `name: 5` / `name: true` is kept in place and written back as typed (SC-610; the hero is not on the board); `skills_used: 5` kept as typed; `skills_used: [5, Climb]` kept (the 5 stays); `participants:` a map kept as typed. No loss.
6. `_dse_anchor: 5` kept, written last.
- Open points in my own work: (a) **`null` in a number key** (`rounds:` with nothing after it) keeps today's behaviour: read as the default and written as the default number (M2/M3 do not mention null). If you want `null` written back as typed, it is one line in `readNumber`. (b) **Reset progress, Set limits, Undo write the keys they assign as numbers even when the typed value read as the same number** (`successes: "0"` + Reset -> `0`), a judgement I made so that a user action never leaves `banana` in the note; the alternative is value-equality only (`"0"` would come back). (c) A native non-finite number (`rounds: .inf`) is still read as typed (today's behaviour; the board would loop): not in the ticket. (d) A number key typed as a native float (`rounds: 2.5`) is unchanged.
- `e2e` authoring footgun (same as SC-638's note): `dse.click` on a non-control records a coverage pair `selector:[object Promise]`; W08 uses the raw `block().root.click()` inside `dse.expectNoWrite`. Also in e2e, wdio `toHaveText` / visible text reads CSS-uppercased card text ("TRUE", "round 1 / 3" is lowercased by CSS): W04 / W05 / W06 read `getProperty('textContent')` instead.
- Proposed dse-verify text (not applied): step 3 jest `13136 passed / 2 skipped` fresh since SC-628 (+210 new, +4 `e2eCensus`); step 4b e2e CURRENT `577/598 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` since SC-628 (+5 ok and +5 total from MONT-W04..W08, W01 / W02 plain, no new pair; drop SC-628 from the known-bug list).

## Gate logs and artifacts (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r1-impl/`)
- tsc / tsc -p e2e / lint: `gate-tsc.log`, `gate-tsc-e2e.log`, `gate-lint.log` (all rc=0)
- jest fresh: `gate-jest.log` (`Tests: 2 skipped, 13136 passed, 13138 total`; 289 suites passed, 1 skipped)
- fails on base: `unit-base.log` (first cut, 115 of 178), `final-base.log` (final files on base model.ts: 136 failed / 74 passed of 210), `final-fix.log` (210 passed), `e2e-w-base.log` (0/7 ok on base), `e2e-w-only2.log` (7 ok + W03 known-bug on the fix)
- per-file base vs new jest counts: `json-base.json`, `json-new.json` (base run is the `afd1436c` export in `base-export/`, which skips 2 more tests than a worktree: 12920 / 4 vs 12922 / 2)
- e2e full: `gate-e2e.log` (`OBSIDIAN-E2E done: 577/598 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`, rc=0)
- lifecycle: `lc-part1.log` (21/21) `lc-part2.log` (16/16) `lc-part3.log` (9/9) `lc-part4.log` (4/4) `lc-part5.log` (7/7) `lc-part6.log` (4/4) `lc-part7.log` (3/3); ids per part from `lc-part.sh`, union 64/64
- styles.css: `base-build.log` (both sha256 `18730938...f1f9`)
- entry / participant survey: `survey.txt` (the scratch test that produced it was deleted, not committed)
- failure bundles: none kept (the first targeted e2e run `e2e-w-only.log` had W04 / W05 test-assertion failures from CSS-uppercased text, fixed in the spec)

---

# r1b fold round (description + block that is not a map)

**Executive summary (r1b)**
- Verdict: DONE. Both folds implemented as ruled; entry-level wrong types untouched (SC-655); null number key and Reset / Set limits / Undo unchanged (accepted).
- dse head `ff266522` on base `afd1436c` (origin/develop re-fetched: still `afd1436c`, no rebase). Superproject rebased onto origin/main `51b3b6e5` (clean, no conflicts): CHANGELOG commits `581f1675` (r1 bullet, rebased) and `f86fc621` (r1b amendment, new commit). No pointer bump.
- Gates on the final head: tsc + `tsc -p e2e` clean, lint clean (one `no-unnecessary-type-assertion` in my own W09 fixed in `ff266522`), jest fresh `13188 passed / 2 skipped` (13136 + 28 unit + 22 jsdom + 2 `e2eCensus` rows for the 2 new fixtures), lifecycle 21+16+9+4+7+4+3 = 64/64 (no flake, no re-run), e2e `OBSIDIAN-E2E done: 579/600 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`.
- `styles.css` sha256 `18730938...f1f9`, identical to the clean `afd1436c` build: shots / freeze / parity carry.
- New tests: unit 28, jsdom 22, e2e 2 (MONT-W09, MONT-W10). On the previous model.ts (`30eb7aec`) 38 of the 50 new unit/jsdom tests fail (the rest are guards: text description, empty block, null / empty description) and W09 / W10 both fail (on base W10 draws a montage with 12 controls over the text body).

## Commits (r1b)
dse: `a029ff25` fix (model.ts + unit + jsdom), `59a96902` e2e W09 / W10 + fixtures + README rows, `ff266522` lint cast. Superproject: `f86fc621` CHANGELOG (new commit after rebase; the earlier bullet is `581f1675`).

## Design (r1b)
- `readText(key, raw, typed)` replaces `readTitle` and serves `title` and `description`: number / boolean -> `String(raw)` with `{text, raw}` kept in the same module-private WeakMap (`typed.texts`); map / list -> `Invalid data: '<key>' must be text.`; string / null / absent unchanged. The description's existing rule (non-empty string only) is applied after the read, so `description: ''` and a bare `description:` are still dropped as before.
- `serialize` writes `description` through `typedText` (same match-the-text rule as the title), in its schema place after the title.
- A block body that is not a map: `parseModel` first checks `data !== undefined && data !== null && (typeof data !== 'object' || Array.isArray(data))` and throws `Invalid data: the block must be a map of keys.` (stage `render`, plain error card, no control, nothing written). Nothing / blank lines / only comments / a bare `null` / `~` parse to null or undefined and still give a default montage; a map with only unknown keys is still a map.
- Entry code (`sanitizeEntry` / `sanitizeEntries`) not touched.

## Inputs (r1b)
| Input | Card | Write |
|---|---|---|
| `description: 5` / `true` / `3.5` | brief shows "5" / "true" / "3.5" | `description: 5` etc. as typed, after the title |
| `description: "5"` | "5" | stays a quoted string |
| `description:` / `''` / absent | no brief, as before | not written, as before |
| `description:` map / list / `[]` / `{}` | plain error card `Invalid data: 'description' must be text.`, 0 controls | nothing written |
| block body `hello`, `"hello"`, `5`, `true`, `- a\n- b`, `[1, 2]` | plain error card `Invalid data: the block must be a map of keys.`, title `Montage Test tracker: failed to render (render)`, 0 controls | nothing written (jsdom 0 writes, no Notice; e2e note byte-identical after a click) |
| empty body (nothing, blanks, comments only, `null`) | default montage, "Round 1 / 2" (jsdom + unit) | Add a round writes `rounds: 3` |

## Tests (r1b)
- Unit (`test/unit/model/montage-wrong-types.test.ts`, now 208): description read table, text / quoted / empty / absent as before, refusal of 4 shapes with no raw JS text, written-back-as-typed in schema place, survives other writes, no own key; non-map table (7 shapes), empty-block table (5 shapes, including a serialize-to-empty and Add a round -> `{rounds: 3}`), unknown-keys-only map.
- jsdom (`test/dom/elements/montage-wrong-types.test.ts`, now 52): description drawn (3), four controls keep `description: 5`, bool / quoted / title+description together; map / list / `[]` error card + null / empty not an error; six non-map bodies as error cards with 0 controls and no write; four empty bodies draw a default montage and write `{rounds: 3}`.
- e2e: MONT-W09 (`Montage/wrong-description.md`: brief shown, Add a round, `description: 5` and `title` / `description` / `rounds: 4` lines in order), MONT-W10 (`Montage/wrong-block.md`: error card message / 0 controls / stage render, note byte-identical after a real click, fence still `hello`). README rows added.
- An empty block had no test before; the unit and jsdom tables above now cover it.

## Drive-by fixes
None.

## Follow-ups
- None new. Still open from r1 and ruled: entry-level types are SC-655.

## Artifacts (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r1-impl/`)
- red on previous model: `r1b-unit-base.log` (unit file alone: 21 failed), `r1b-base.log` (both files: 38 failed / 222 passed), `r1b-e2e-wbase.log` (W09 / W10 fail), green: `r1b-fix.log` (260 passed), `r1b-e2e-w.log` (W04 / W08 / W09 / W10 ok)
- final gates: `gate-tsc.log`, `gate-tsc-e2e.log`, `gate-lint.log` (rc=0), `gate-jest.log` (`Tests: 2 skipped, 13188 passed, 13190 total`), `r1b-gate-e2e.log` (`579/600 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`), `lc-part1-r1b.log` .. `lc-part7-r1b.log` (21, 16, 9, 4, 7, 4, 3 ok = 64/64), `base-build.log` (styles.css sha vs `afd1436c`)
- r1 logs from the first round are kept under their own names (`gate-jest-r1.log` is the r1 jest log).

---

# r3 fix round (rebase onto 12aaf5b5, LOW-1, CHANGELOG, pointer bump)

**Executive summary (r3)**
- Verdict: DONE. dse head `10c271fe` on develop `12aaf5b5` (SC-638 landed). Superproject on origin/main `ea6b4582`: CHANGELOG `cb58849f`, pointer bump `afe583b0`.
- Rebase: only conflict was `e2e/driver/dse.ts` openNote; took develop's file (branch diff vs develop has no driver change); `{ errorCard: true }` in W08 and W10 only, W01 unchanged; clicks on the card were already raw wdio `el.click()`.
- LOW-1 folded: `correctMontageEntry` skips both tally deltas when `tallyKeyFor(existing.result) === tallyKeyFor(next.result)`; 7 unit + 2 jsdom tests (6 red before the fix).
- Gates: tsc + `tsc -p e2e` clean, lint clean, jest fresh `13307 passed / 2 skipped`, lifecycle 21+16+9+4+7+4+3 = 64/64 (no flake), e2e `585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`, styles.css sha256 identical to a clean `12aaf5b5` build (shots / freeze / parity carry).
- jest vs expected: 13298 + 9 LOW-1 tests = 13307, exact. e2e exactly as expected.

## Details
- dse commits on `12aaf5b5` (shas changed by the rebase): `1df4ec46` fix title/number, `c1410c5d` e2e W01..W08 (message reworded to drop "openNote accepts an error card as drawn", which is no longer true), `b5f5d26d` fix description + non-map block, `25994830` e2e W09/W10, `924230e6` lint cast, `58da5e0c` LOW-1 fix + tests, `10c271fe` errorCard option on W08 / W10.
- LOW-1 note: a hand-edited tally of 0 over a success entry used to rise to 1 when only the note was corrected (undo clamped at 0, then +1); it now stays 0. [L06] (success -> success at 3 / 3) still passes. Tests: unit `correcting a logged action keeps a typed tally ...` (only note / round / skill / skill+note, assist -> typo, result move writes two numbers and leaves a third typed, the 0 case); jsdom through the sheet (Save with a new note keeps `successes: "1"`, `failures: "2"`; result -> failure writes 0 / 3).
- CHANGELOG: one commit `cb58849f` squashed from the two (`reset --soft` onto origin/main after a rebase), "brief" replaced by "The same goes for `description:`".
- Pointer bump `afe583b0` is the only pointer commit. No attribution trailers.
- Not touched: the registered scratch worktree `sc628-r2-rev/probe`.

## Artifacts (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r1-impl/`)
`r3-low1-red.log` (6 failed), `r3-low1-green.log` (822 passed in the montage files), `gate-tsc.log`, `gate-tsc-e2e.log`, `gate-lint.log`, `gate-jest.log`, `r3-gate-e2e.log`, `lc-part1-r3.log` .. `lc-part7-r3.log`, `base3-build.log` (styles.css sha vs `12aaf5b5`).
