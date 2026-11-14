# SC-638 r1 implementer report

**Executive summary**
- Verdict: DONE. R1-R4 implemented exactly as ruled; all five ticket inputs plus the three SC-637-comment inputs fixed.
- dse branch `sc638-negotiation-wrong-type-values` head `4b21de21` (5 commits on `620d5774`; origin/develop still `620d5774`, no rebase).
- Superproject CHANGELOG commit `de702d1e` (one bullet under `## Unreleased`; no pointer bump).
- Gates: tsc clean, lint clean, jest 13002 passed / 2 skipped (12913 + 89 new), lifecycle 64/64 (7 parts), e2e `572/594 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs`.
- `styles.css` byte-identical to a clean `620d5774` build (sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` both), so shots/freeze/parity carry (not run).
- Four existing tests encoded the old behaviour and were updated (listed below); one e2e driver change (`openNote` accepts an error card).
- No new lifecycle scenario (G-S131 untouched).

## Ticket inputs: what the card now shows / writes

| Input | Now |
|---|---|
| `name: 2024` | card draws "2024" (heading); a write keeps `name: 2024` as the number |
| motivation/pitfall `name: 5`, `reason: 42` | drawn as text "5" / "42"; written back `name: 5`, `reason: 42` |
| `i0..i5: <number/bool>`, `motivationsUsed: [5]` | read as text; written back as typed; `[5]` matches a motivation named 5 (pressed chip, spent/reuse logic) |
| `motivations: "foo"` / `pitfalls: "foo"` / `pitfalls: {a: 1}` / number | error card `Invalid data: 'motivations' field must be a list.` (or `'pitfalls'`) |
| blank `-` / `- Legacy` / number / list item | error card `Invalid data: 'motivations' item N must be an object.` (N 1-based; same for pitfalls); note never written (no control exists) |
| `currentArgument: hello` (also number, list, `false`) | error card `Invalid data: 'currentArgument' field must be an object.`; note never written |
| `currentArgument: { motivationsUsed: "Peace" }` / `pitfallsUsed` map | error card `Invalid data: 'currentArgument.motivationsUsed' field must be a list.` |
| map/list in a text field | `Invalid data: 'name' must be text.` / `'i3' must be text.` / `'motivations' item 2 'reason' must be text.` / `'currentArgument.motivationsUsed' item 1 must be text.` |
| `null` / absent in any of the above | unchanged (defaults, no error) |
| `current_interest: 0.4` | seal 0 and hostile (ended) |
| `current_interest: 4.5` | seal 5 and a deal |
| `current_patience: banana` | Patience 0 and final offer; `current_interest: banana` is seal 0 and hostile (R4 "non-number -> 0") |
| YAML syntax error | unchanged (pipeline's own `parse` stage message) |

Error-card stage: the throw is in `def.parse`, so the card is `Negotiation tracker: failed to render (render)` with `data-dse-error-stage="render"`, the same stage as encounter / party / conditions. Sidebar: `SidebarBlockHost` goes through the same pipeline parse, so same card (jsdom test).

## Design

**R1/R2 (typed values).** `src/model/NegotiationData.ts`. `readText(owner, slot, raw, where)` is the one text reader: number/boolean -> `String(raw)` and the raw value is remembered in a module-private `WeakMap<object, Map<slot, Map<text, raw>>>` (`typedText`); map/list throws `Invalid data: <where> must be text.`; null/undefined/string pass through. Shape checks (`readList`, `readItems`, argument is a map) run first in the `NegotiationData` constructor, so `parseNegotiationData` and the pipeline `parse` both refuse. On write, `restoreTypedText(out, owner, slots)` (called from `serialize` in `src/elements/negotiation/model.ts`, on the fresh copy `withUnknownKeys` already builds) replaces a text slot, or each entry of `motivationsUsed`/`pitfallsUsed`, with the typed raw value only if the current text still equals the text read from it. A value the negotiation changed is therefore written as what it now is.
Why it cannot leak into the YAML: the typed values live beside the instance exactly like SC-637's unknown keys (WeakMap, no own property on the model, motivation, pitfall or argument; unit test pins `Object.keys`), and only `restoreTypedText` ever reads them, into the DTO. `CurrentArgument.resetData()` deletes its entry (as it does for SC-637 keys), so an argument that ends takes its typed entries with it. SC-637's unknown keys and SC-482's omitted defaults are applied in the same `serialize`, untouched (their tests are green; a combined test covers `note_to_self` + `name: 2024`).
Known consequence, by design (text matching): in `motivationsUsed`, un-pressing then re-pressing the chip of a motivation named `5` writes `5` (number) again while the argument is the same one, because the entry's text equals the remembered typed text; after Complete/Reset the same press writes `"5"` (string, new value). A quoted `"5"` the user typed stays quoted.

**R4 (one reading).** `NegotiationData.standingOf(n) = Math.round(clampStanding(n))`, i.e. exactly what the seal drew (`clampStanding` then the track's own round / non-finite -> 0). Used by `ending()` (replaces its `Number()` comparison), `offerFor`, `PatienceInterestView` (both `refresh` and the two `track()` initial values) and `EndBandView` ("Interest n"). The seal drawn is unchanged for every input (the track already applied the same round); `advanceStanding` untouched; the chrome summary line still prints the raw typed value (not a decision).

## Tests added (89 = 54 unit + 35 jsdom; e2e +3)

fails-on-base measured by running the new files with `src` restored to `620d5774` (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/fails-on-base.txt`, raw `base.json`): unit 42 of 54 fail on base, jsdom 28 of 35 fail on base, K03/K04 fail on base, e2e W02/W03/W08/W09/W10 all fail on base (`e2e-wbase.log`).
- `test/unit/model/negotiation-wrong-types.test.ts` (54): R1 read (3; the null/absent guard passes on base: no), R2 round trip (6, all yes), R2 name matching (1, yes), R3 messages (25 table rows + legacy entry + built-by-hand; all rows yes, "built by hand" no = guard), R4 `standingOf` table (yes), ending table 13 rows (yes for 0.4, 4.5, banana, patience banana, patience 0.4; no for rows that already agreed: 0.5, 4.4, -2, 7, "5", patience 0.5, "0", 2), spent-Patience precedence (yes), `offerFor` (no, guard), `advanceStanding` banana (no, guard).
- `test/dom/elements/negotiation-wrong-types.test.ts` (35): R1 draw (2, yes); R2 seal-click bytes with content above/below (yes), quoted stays text (yes), chip press / Complete on a typed motivation (yes), SC-637 key + typed value together (yes), two blocks one malformed one typed + malformed-alone untouched (yes); R3 13 table rows (yes) each asserting exact message, title, stage `render`, zero `[data-dse-control]`, note byte-identical after the debounce; YAML syntax error unchanged (no, guard); `motivations:` null still empty (no, guard); R4 10 rows (yes for 0.4, 4.5, banana, patience banana/0.4; no for already-agreeing rows) + 0.4 disables Complete (yes); sidebar typed write (yes) and sidebar malformed card writes nothing (yes).
- Flipped to plain tests (assertions unchanged): jsdom K03, K04 (`test/dom/elements/negotiation-bugs.test.ts`); e2e NEGO-W02, NEGO-W03.
- e2e added in `e2e/specs/negotiation/wrong-values.e2e.ts` (all fail on base): NEGO-W08 (`- Legacy`: exact message, 0 controls, stage render, note byte-identical after a real click on the card), NEGO-W09 (`currentArgument: hello`, same), NEGO-W10 (`name: 2024` drawn as text, a Patience click keeps `name: 2024` as a number, bytes `^name: 2024$`).
- Integrity probes: content above/below the fence survives an R2 write (jsdom `outside()` comparison; e2e driver check); two blocks in one note, one malformed one valid (jsdom): the valid one writes typed, the malformed block's text unchanged and its own mount writes nothing.

## Existing tests changed (they encoded the old behaviour)
- `test/dom/elements/negotiation.test.ts`: clamp test uses authored 4.4 instead of 4.5 (4.5 is now a deal, Complete is off); junk Interest `lots` now ends `'hostile'` (was `toBeNull()`), per R4.
- `test/unit/model/negotiation-serialize.test.ts` (SC-637 tests): the "item that is not a mapping" and "argument that is not a mapping" cases now assert the parse refuses with the R3 message and keep the "no unknown keys" guard on hand-built instances; the no-argument case asserts `currentArgument` is not written (SC-482) and a built model writes its five keys.

## Gate logs and numbers (dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/`)
- tsc: clean, exit 0 (`gate-tsc.log`); lint clean, exit 0 (`gate-lint.log`).
- jest fresh: `Tests: 2 skipped, 13002 passed, 13004 total`, 289 suites passed + 1 skipped (`gate-jest.log`).
- lifecycle 7 parts, union checked against the runner's SCENARIOS (64 ids): 21 + 16 + 9 + 4 + 7 + 4 + 3 = 64/64 ok, 0 failed (`lc-part1.log` ... `lc-part7.log`). No flakes, no re-runs.
- e2e full: `OBSIDIAN-E2E done: 572/594 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs`, exit 0 (`gate-e2e2.log`). Run 1 (`gate-e2e-run1-coverage-gate-fail.log`) was the same 572/594 but the coverage gate failed on `selector:[object Promise] x click (NEGO-W08,NEGO-W09)` (a `dse.click` of a non-control records a pair in no manifest); fixed by clicking the card with the raw wdio click and re-run clean. Known-bug 24 -> 22 as expected; ok 567 -> 572 (+2 flipped, +3 new), total 591 -> 594.
- `styles.css`: worktree build and a clean `git archive 620d5774` build (`base-export/`, `base-build.log`) both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`. Shots, freeze, parity carry (not run).

## Commits
dse: `7c41438d` fix + unit + existing-test updates + K03/K04 flip; `72e846f9` jsdom tests; `d5adf4eb` e2e flips + W08..W10 + fixtures `wrong-item.md`, `wrong-argument.md` + README rows (`wrong-name.md`, `fraction.md` rows rewritten); `9a8d6177` e2e `openNote` driver; `4b21de21` e2e click fix. Superproject: `de702d1e` CHANGELOG.

Drive-by fixes: none.

Follow-ups:
- `e2e/driver/dse.ts` `openNote` waited for a registry entry per `[data-dse-element]` root; a block refused at parse is never mounted (no entry) and timed out. Changed (in scope: needed to test the new error cards at e2e): error-card roots (`data-dse-error-stage`) count as drawn. Montage's twin (SC-628, `title: 2024`) will hit the same wait if it moves to a parse-time refusal; it now has the driver support.
- A top-level block that is not a map at all (`hello`, a list) is not in the ledger's list and was not touched; worth checking what negotiation does with it (a possible data-loss twin).
- Wrong types in the non-text fields (`initial_patience: [1]`, `hasBeenAppealedTo: maybe`, `lieUsed: 3`) are untouched (out of the ticket).
- `null` entries inside `motivationsUsed` / `pitfallsUsed` pass through as today (R1: null keeps today's behaviour).

## Proposed `.claude/skills/dse-verify/SKILL.md` text (not applied)
- Step 3 jest: `13002 passed / 2 skipped` fresh after SC-638 (+89: `negotiation-wrong-types` unit 54, jsdom 35).
- Step 4b e2e CURRENT: `572/594 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs`, since SC-638 (+5 ok, +3 total: NEGO-W08..W10 new; NEGO-W02 and NEGO-W03 are plain tests; no new pair); drop SC-638 from the known-bug list (SC-639, SC-640, SC-641, SC-642, SC-648, SC-649 remain from the negotiation set).
- e2e authoring footguns (SC-638): (1) a block refused at parse is an error card with no registry entry; `openNote` accepts it (error cards carry `data-dse-error-stage`), but nothing else about it is a mounted view. (2) `dse.click(el)` records a coverage pair even for a non-control; a click on a node with no manifest id (an error card root) must use the raw wdio `el.click()`, or the coverage gate fails with `selector:[object Promise] x click`; not going through `dse.click` also leaves the block undeclared, so the driver checks its fence is byte-identical.

---

# r1b (fold round: a block that is not a map; rebase onto afd1436c)

**Summary**
- Verdict: DONE_WITH_CONCERNS (one ruling premise was wrong, see Concern). dse head `daf75fc5`, rebased cleanly onto origin/develop `afd1436c` (SC-627, montage; no conflicts, package.json unchanged, no npm ci). Superproject untouched in r1b (CHANGELOG bullet from r1 still covers it: "a block of the wrong shape").
- Fix: `NegotiationData` constructor throws `Invalid data: the block must be a map of keys.` for a block that is text (`hello`), a list, a number or `true`; `parseNegotiationData` and the pipeline parse both go through it; the sidebar host does not parse separately (same pipeline), so no sidebar change.
- Tests (+11 jest, +1 e2e): unit 4 (`hello`, list, `42`, `true`, each also via `parseNegotiationData`) + 1 empty-block guard; jsdom 3 (`hello`, list, `42`: exact message, title, stage render, 0 controls, note byte-identical after the debounce) + 3 empty-block guards (nothing / whitespace / comment); e2e NEGO-W11 (`hello`, byte-identical after a real click). All non-guard tests fail on `620d5774` (measured: `r1b-base.json`, `r1b-base-e2e.log`).
- Gates on `afd1436c` + r1 + r1b: tsc clean, lint clean, jest 13022 passed / 2 skipped (12922 + 89 + 11), lifecycle 64/64 (21+16+9+4+7+4+3), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`, `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` identical to a clean `afd1436c` build (shots/freeze/parity carry, not run). Lifecycle was re-run in full because the base moved.

**Concern (ruling premise).** The ruling says an empty block "keeps today's behaviour (a fresh default negotiation)". Measured on base and on r1: an empty / whitespace / comment-only block is NOT a default negotiation today; the pipeline hands the element `null` and the card shows the raw `Cannot read properties of null (reading 'motivations')`. It is also a tested contract: SC-493 (`test/dom/authoring/formModalEmptyYaml.test.ts`) says negotiation "cannot re-parse an empty body" and the form refuses to Save one ("This block can't be empty..."). I first made an empty block a default negotiation; that broke 3 of those SC-493 tests (first run `r1b-jest-first-run-3-failed.log`), so I reverted it (commit `f9d63d51` before the rebase). Final behaviour: empty block unchanged (still an error card with the raw TypeError text, form still refuses it); my tests for it are guards that assert only "refused as before, not reported as the new map-of-keys message, note untouched" and pass on base. Owner decision needed if the raw text for a blank block should become a plain message (that would also change the SC-493 contract's message, not its refusal); not done here.

Commits on `afd1436c` (r1b ones): `56655bd2` (fix + unit + jsdom; its message still says "empty block is a fresh default", superseded), `39c31a6a` (e2e W11, fixture `wrong-block.md`, README row), `daf75fc5` (empty block back to failing as before; guards).

Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/`): `r1c-tsc.log`, `r1c-lint.log`, `r1c-jest.log`, `r1c-lc-part1.log` ... `r1c-lc-part7.log`, `r1c-e2e.log`, `base2-build.log`, `r1b-base.json`, `r1b-base-e2e.log`, `r1b-jest-first-run-3-failed.log`.
Superseded runs: the earlier r1 gate logs (`gate-*.log`, `lc-part*.log`) were on base `620d5774`.
Drive-by fixes: none. Follow-ups: the blank-block raw TypeError text (above).

---

# r3 (fix round: five folds from the r2 review)

**Summary**
- Verdict: DONE. dse head `ef1c9f07` on origin/develop `afd1436c` (unchanged, no rebase). Superproject: one new commit `4df72822` (CHANGELOG wording) on top of `de702d1e`; nothing else moved.
- LOW-1: used lists are remembered by position (`usedSnapshot`: entries as read, typed ones with their value) and matched from the end on a write: `[5, "5"]` stays `[5, "5"]`; after a chip removes the first of two equal entries (`indexOf`) the survivor keeps its own type; a pushed entry is plain text. `resetData` drops the snapshot.
- LOW-2: `openNote(rel, { errorCard: true })` is opt-in (W08, W09, W11 pass it; everyone else times out on an error card as before SC-638); NEGO-W02 also asserts no `.dse-error-card` and that the head shows `2024`.
- LOW-3: CHANGELOG now says "the same number or true/false you typed (not as quoted text)".
- Empty block: still refused (SC-493 unchanged), now `Invalid data: the block is empty.` instead of the raw TypeError. SC-493 tests (`formModalEmptyYaml`) stay green unchanged; none pinned the raw text. My own r1b guard tests for it were updated to pin the new message (unit + 3 jsdom).
- INFO-4: chrome summary uses `NegotiationData.standingOf` (`0.4` -> `Interest 0`, `banana` -> `Patience 0`).
- Tests (+7 jest): unit LOW-1 x2, chrome summary x4 rows (3 fail pre-fix), empty-block unit (changed); jsdom LOW-1 x1, empty x3 (changed). All new/changed fail on the pre-r3 src `daf75fc5` (measured, `r3-base.json`: 11 failures, only the guard row `Interest 3 / Patience 2` passes).
- Gates: tsc clean, lint clean, jest 13029 passed / 2 skipped fresh (13022 + 7), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` (no new e2e), `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` = clean `afd1436c` build. Lifecycle not re-run: only the negotiation model, `negotiation/definition.ts` and the e2e driver/spec changed, and no lifecycle scenario drives negotiation.

Notes: (1) first r3 gate run hit a TS parse error from backticks in a comment inside the page-side template literal in `e2e/driver/dse.ts` (fixed in `ef1c9f07`; that run's jest was already green, e2e aborted by me, own pids only). (2) The duplicate-equal-entry ambiguity is resolved by matching from the end because a chip removes the FIRST equal entry; the only degenerate case still ambiguous is adding a text equal to an existing entry, which the chips cannot do (toggle).
Commits: `c03c7eec` fix + tests, `cc2109c1` e2e opt-in + W02, `ef1c9f07` comment fix; superproject `4df72822`.
Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/`): `r3-tsc.log`, `r3-lint.log`, `r3-jest.log`, `r3-e2e.log`, `r3-base.json`, `r3-jest-first.log` (the run beside the parse error).
Drive-by fixes: none. Follow-ups: none.

---

# r3b (MEDIUM-r4-1: chip toggle broke typed entries)

**Summary**
- Verdict: DONE. dse head `12aaf5b5` on origin/develop `afd1436c` (unchanged). One commit; superproject untouched.
- Fix: `restoreUsed` (`src/model/NegotiationData.ts`) matches per text instead of one cursor: a text `c` times in the list and `n` times in the snapshot takes the last `c` snapshot entries of that text in order when `c <= n`; when `c > n` the first `n` occurrences take the snapshot entries and the rest are plain text. The r3 `[5, "5"]` tests are kept and pass.
- Tests (+3 jest, all fail on `ef1c9f07`, measured `r3b-base.json`): unit toggle off/on `[5,7]` -> `[7,5]`, pitfalls `[7,8]` -> `[8,7]`, `[A,5]` -> `[5,"A"]`; unit "more of a text than read" `[5]` + `5` -> `[5,"5"]`; jsdom real chip clicks on `[5,7]`, toggle 5 off then on writes `[7]` then `[7,5]`, both numbers.
- Gates: tsc clean, lint clean, jest 13032 passed / 2 skipped fresh (13029 + 3), e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`. No CSS touched. Lifecycle not run (model-only change).
Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r1-impl/`): `r3b-tsc.log`, `r3b-lint.log`, `r3b-jest.log`, `r3b-e2e.log`, `r3b-base.json`.
Drive-by fixes: none. Follow-ups: none.
