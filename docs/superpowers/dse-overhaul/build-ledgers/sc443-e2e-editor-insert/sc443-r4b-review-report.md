# SC-443 r4 review, scope B (jsdom matrix, markers + fixed-bug tests, bug hunt)

**Executive summary**
- Verdict (scope B): **NOT LAND-READY**. Branch `sc443-e2e-editor-insert` @ `6c5a073c` on `d582e7ff`. 0 CRITICAL, 0 HIGH, 1 MEDIUM, 2 LOW, 5 INFO. New product bugs: 2 (1 Medium, 1 Low), both reproduced in real Obsidian 1.14.4. Plus 1 sibling of SC-678 (cite).
- What blocks: two new product bugs need tickets and markers (ticket "Done" bar). One plain jsdom test pins one of them as correct output (`schemaSuggestMatrix.test.ts:158`, MEDIUM).
- The r3 round weakened nothing. The 6 un-marked tests and the 3 rewritten ones pin exact bytes. Reverting the SC-675 `src/` diff (`c9b03a90^..804224ad`) turns 6 SC-443 jsdom tests red and 7/7 targeted e2e drives red (AUTH-I21, S04, S09, I23..I26). Every one of 6 hand mutants of `blockInsert.ts` is caught by at least one SC-443 e2e drive.
- Open markers: SC-676 x3, SC-677, SC-678 and SC-679 (jsdom) each fail for the reason they state. Each bug reproduces (SC-676 x3 and SC-678 also in real Obsidian). The SC-679 fix from its worktree flips all 4 SC-679 markers: jsdom 902 passed + 1 flipped; e2e authoring `71/74 ok, 3 failed` = exactly G13 / G14 / K09 "appears fixed". The SC-676 simulated fix flips all 3 markers with 900 others green. **But the SC-678 and SC-677 markers do not flip under one reasonable fix each** (LOW-1, LOW-2).
- Gates (scratch worktree at `6c5a073c`): jest full `Tests: 4 skipped, 14185 passed, 14189 total` rc 0, 143 s, loadavg about 22. The 2 skips beyond the expected 2 are `token-coverage.test.ts`, which needs a workspace superproject beside the worktree. Authoring jest `903 passed`. e2e `--element=authoring` `OBSIDIAN-E2E done: 71/74 ok, 0 failed, 3 known-bug, coverage: 46/464 pairs (partial run: gate skipped)` at loadavg 22.4.
- Process slip: I ran one `rm -f` on my own probe file in the scratch worktree (inside the scratchpad). The brief forbids this. No hang and no other harm.

## Findings

### MEDIUM-1: a plain matrix test pins broken output as correct (`mode:` + enum accept writes `mode:flat`)
- `test/dom/authoring/schemaSuggestMatrix.test.ts:158`: `['an enum value right after the colon', '```ds-roll\nmode:', 'flat', '```ds-roll\nmode:flat']`.
- **What goes wrong:** `mode:flat` is not a YAML mapping. Next to any other key, the block is a parse error card: `Implicit map keys need to be followed by map values`. Measured in jsdom through `ElementPipeline` (P1). Measured in real Obsidian, AUTH-ZR2: typing `mode:` opens the 4-value list at once with `power-roll` selected. Enter saves `mode:power-roll`, and Reading view draws an error card (see product bug PB-2).
- **Effect:** the test says the defect is intended. Whoever fixes it turns this test red and is told they broke something. The bug also skipped the bug flow.
- **Fix:** file PB-2. Replace the row with a `test.failing` citing the new ticket. It should assert that the accepted line parses (`mode: flat`, or no list offered until a space is typed). Do not assert a specific fix shape. Optionally add a gate-ON e2e `knownBug` next to AUTH-G10.

### LOW-1: the SC-678 marker cannot flip under a "no key list mid-word" fix
- `test/dom/authoring/authoringKnownBugs.test.ts:103-110`. The marker does `const info = s.onTrigger(...)!`, then `s.context = {..., ...info}`, then `selectSuggestion`.
- **What goes wrong:** one reasonable fix is to suppress the list when word characters follow the cursor (as `/ds` never fires mid-word). With that fix `onTrigger` returns null and `context.start` is undefined. `CmEditor.offset(undefined)` then throws `TypeError: Cannot read properties of undefined (reading 'line')`. The test still fails, so `test.failing` stays green and the marker never flips.
- **How I probed it:** sim `sc678-no-midword` gave jest 903 passed with the marker still "failing". Un-marked, it fails with the TypeError (`jest-sim-sc678-nomid-unmark.log`). The whole-word fix (`sc678-whole-word`) does flip it.
- **Fix:** `if (info === null) return; // no list mid-word is a fix too` before setting the context. Or assert `info === null || !value.includes('max_stamina_stamina')`.

### LOW-2: the SC-677 marker is tied to where the fix goes
- `test/dom/authoring/authoringKnownBugs.test.ts:89-99` asserts that `copyCode()` itself resolves.
- **What goes wrong:** the bug the user sees is "no Notice + unhandled rejection" from `void copyCode(entry)` at `src/authoring/compendiumInsert.ts:319`. Fixing it at the call site (`copyCode(entry).catch(() => new Notice(...))`) is reasonable. It removes the unhandled rejection and tells the user, but `copyCode` still rejects, so the marker stays green.
- **How I probed it:** sim `sc677-at-callsite` gave jest 903 passed with the marker unflipped (`jest-sim-sc677-cs-unmark.log` still shows `Received promise rejected`). Sim `sc677-in-copycode` flips it.
- **Fix:** drive the marker through `dispatchReferenceChoice(editor, entry, { ctrlKey: true })` with a rejecting clipboard. Assert that a Notice was shown and that no rejection escapes. For example, register a temporary `unhandledRejection` listener, or `await flushAsync()` and check that `Notice.notices` gained an entry.

### INFO
- **INFO-1, the jsdom list-item test misses the list-marker branch.** `authoringKnownBugs.test.ts:31` puts the cursor on `'  '`, the continuation line, not on `- item`. It therefore takes `blockContextOf`'s whitespace branch, not its `LIST_MARKER` branch. Mutant `m675-listindent-quote-only` (list items lose their indentation) passes every SC-443 jsdom test. It is caught by e2e AUTH-I25 / I26 and by develop's `insertOwnLines.test.ts` (87 failures), so coverage holds overall. Optional: add `- item|` to the jsdom file.
- **INFO-2, the empty-line-in-quote rule is not exercised.** `underPrefix` (e2e) writes `>`, not `> `, on an empty quoted line, but no SC-443 test exercises it: the counter scaffold and the KIT reference have no empty lines. Mutant `m675-empty-quote-line` survives every SC-443 test. Only develop's `insertOwnLines` catches it (1 test).
- **INFO-3, the snapshot test has no cursor assertion.** `authoringKnownBugs.test.ts:58-72` builds its expected block from the same insert in an empty note (a relative oracle) and asserts no cursor. Snapshot bytes are pinned independently by the e2e goldens, so this is acceptable.
- **INFO-4, an expectation comes from the code under test.** `insertMatrix.test.ts:110-119` uses `buildScaffold(def).text`. The test's job is command / `/ds` parity and the cursor, and e2e `scaffoldOf` reads `example.yaml` independently, so this is acceptable. Otherwise the matrices use literal tables: key lists, enum lists, trigger cases, query x filter results, family x fence.
- **INFO-5, the SC-676 markers pass `file = null`.** A fix that finds frontmatter through `app.metadataCache` (using the `file` that `onTrigger` receives) would not flip `authoringKnownBugs.test.ts:81`. A fix that scans the text does flip it (sim `sc676-guard`: 3 markers flip, 900 green).
- **CM6 helper fidelity (item 8): good.** jsdom and real Obsidian agree byte for byte and on the cursor in every pair I matched:
  - `abc|` insert: `abc\n<block>`, cursor {2,0} (jsdom and AUTH-I21);
  - the empty-range cursor-in-front behaviour (jsdom SC-679 marker and AUTH-G13);
  - the mid-word doubling (jsdom SC-678 marker and real `max_stamina_stamina`, ZR6);
  - the indent carry (dsSuggestMatrix and AUTH-S04).
  `CmEditor` implements every Editor method `src/authoring` calls: getLine, lineCount, getCursor(from/to/head), setCursor, getValue, replaceSelection, replaceRange.
- **Item 9b sweep.** No `knownBug('SC-675' | 'SC-462')` and no matching `test.failing` is left (grep of test/ and e2e/). No neutral-outcome helper is left. No other SC-443 test pins pre-fix output: the other non-empty-line inserts (`compendiumInsertMatrix` at the start of `first`, the CRLF snapshot) give identical bytes before and after the fix. In the r3 diff (`894f492f..6c5a073c`) every `toBeNull()` neutral check became an exact `toBe(<bytes>)`, plus cursor and drawn-root assertions. Nothing was loosened.

## Product bugs

### PB-1 (Medium, NEW): an insert command or a compendium insert run with the cursor inside an existing fenced block (or the frontmatter) breaks that block and turns the rest of the note into a code block
- **Repro, real Obsidian, AUTH-ZR1:**
  1. Note `` ```ds-stam⏎max_stamina: 20⏎⏎current_stamina: 5⏎```⏎⏎after text⏎ ``, cursor on the empty body line {2,0}, Live Preview.
  2. Run "Insert Draw Steel: Counter" from the palette.
  3. Saved file: `` ```ds-stam⏎max_stamina: 20⏎```ds-ct⏎name: Health⏎…⏎```⏎current_stamina: 5⏎```⏎⏎after text⏎ ``.
  4. Reading view: the stamina bar is an error card (`errors: ['stamina-bar']`), no counter is drawn, and `after text` renders inside a `<pre>`. The old closing fence now opens an unclosed fence.
- **Other paths, jsdom:** the compendium reference insert does the same (P5). In frontmatter, the insert puts a fence into the properties (P6).
- **Undo:** one undo restores the note (one change).
- **Where:** `src/authoring/blockInsert.ts:124-131` (`insertBlock` has no fence or frontmatter guard), called from `insert.ts:151-153` and `compendiumInsert.ts:32`, `:281`. Compare `suggest.ts:207`: the `/ds` path refuses inside any fence, and its header comment says inserting inside a fence corrupts it "just as real[ly]" for any language.
- **Known-ticket match:** none. SC-676 covers the `/ds` guard's blind spots, and this path has no guard at all. Related: SC-676, SC-675.
- **Suggested marker:** a jsdom `test.failing` (`insertScaffold` with the cursor inside an open fence leaves the existing block's fences intact: `scanFences` count and the block's text unchanged, or the note unchanged), plus an e2e `knownBug` like AUTH-ZR1.

### PB-2 (Low, NEW): accepting an enum value right after `key:` (no space typed) writes `key:value`, a YAML parse error
- **Repro, real Obsidian, gate ON, AUTH-ZR2:** in a ds-roll block, type `mode:`. The list opens at once with 4 rows. Press Enter. Saved `mode:power-roll`. Reading view: `Roll: failed to render (parse) Implicit map keys need to be followed by map values`.
- **Where:** `src/authoring/schemaSuggest.ts:81` (`enumCtx` allows `\s*`, zero spaces, after the colon) and `:126-129` (`selectSuggestion` writes the bare value).
- **Exposure:** gate ON only. ds-roll's `mode` and `difficulty` are the only top-level enums, and ds-roll is deferred.
- **Known-ticket match:** none (related SC-678 / SC-679, same `selectSuggestion`). Pinned as correct by MEDIUM-1.

### Cite, not new: enum value accepted mid-value doubles the tail
`mode: te|st` + `test` writes `mode: testst` (jsdom P2). This is the value-list twin of **SC-678**, whose ticket and marker name only the key path. Suggest the owner adds a note to SC-678 so a key-only fix does not leave the value path broken.

### Not bugs / already known
- No autocomplete in a callout-quoted block (`schemaSuggestMatrix.test.ts:122` pins it as a deliberate silence): a gap the implementer already reported.
- A `/ds` pick after text (`see /dsct`) leaves `see ` with its trailing space: harmless, SC-675 INFO-3 class.
- An indented `/ds` token block draws but cannot save: SC-461, SC-675 INFO-2.

## Probes run

- **Markers un-marked at 6c5a073c** (`jest-unmark.log`). Each fails for its stated reason:
  - SC-676 x3: `Expected: false / Received: true`;
  - SC-677: `Received promise rejected … NotAllowedError`;
  - SC-678: `Received string … max_stamina_stamina`;
  - SC-679: cursor diff only.
- **Real-Obsidian confirmation of open bugs** (`e2e-probe2-results.json`):
  - SC-676: `/ds` offered all 13 rows in the frontmatter (ZR3), on a fence opening line (ZR4) and inside a list-indented block (ZR5);
  - SC-678: `ax` typed into `m|_stamina`, then Enter, saved `max_stamina_stamina: 5` (ZR6);
  - SC-679: AUTH-G13 / G14 / K09 known-bug in the base authoring run.
- **Fix simulations** (jsdom, all authoring files):

  | Sim | Result | Plain tests |
  |---|---|---|
  | sc679 (the worktree's `src` + mock diff) | marker flips | 902 green |
  | sc678-whole-word | flips | 902 green |
  | sc678-no-midword | **does not flip** (LOW-1) | |
  | sc676-guard (frontmatter, fence line, list-aware fence scan) | 3 flip | 900 green |
  | sc677-in-copycode | flips | |
  | sc677-at-callsite | **does not flip** (LOW-2) | |

  e2e with the SC-679 fix, `--element=authoring`: `71/74 ok, 3 failed, 0 known-bug`, the 3 = AUTH-G13, G14, K09 "known bug SC-679 appears fixed".
- **SC-675 mutants:**

  | Mutant | SC-443 jsdom red | e2e `--only=I21,S04,S09,I23..I26` |
  |---|---|---|
  | revert675 (reverse of `c9b03a90^..804224ad -- src`) | 6 | 0/7 ok |
  | nobreak-before | 2 | 2/7 ok (I21, I23..I26 red) |
  | noprefix | 4 | 2/7 ok (S04, I23..I26 red) |
  | notail | 0 | 6/7 ok (S09 red) |
  | tail-noprefix | 1 | not run |
  | blankline | 2 | 2/7 ok (I21, I23..I26 red) |
  | listindent-quote-only | 0 | 5/7 ok (I25, I26 red) |
  | cursor-noprefix | 2 | 2/7 ok (S04, I23..I26 red on the cursor) |
  | empty-quote-line | 0 | not run (INFO-2) |

## Gate logs and evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-rev-r4b/`.

- **Jest:**
  - full: `jest-full.log` / `.rc` (rc 0; `Tests: 4 skipped, 14185 passed, 14189 total`, `Test Suites: 1 skipped, 308 passed`; loadavg `jest-full.load-start` 21.8, `jest-full.load-end` 21.7). A `main.js` built from the same `6c5a073c` source by the e2e runs sat in the scratch worktree; no shadow symptoms.
  - authoring baseline: `jest-base.log` (903 passed).
  - un-marked markers: `jest-unmark.log`.
  - fix simulations: `jest-sim-*.log` / `.rc`, `sim-*.out`.
  - SC-675 mutants: `jest-mut-*.log` / `.rc`.
  - bug probes: `jest-probe.log` (P1..P11).
- **e2e:**
  - baseline: `e2e-base-auth.log` / `.rc` / `.load` (`71/74 ok, 0 failed, 3 known-bug`, rc 0).
  - SC-679 fix: `e2e-sc679-auth.log` (`71/74 ok, 3 failed`).
  - SC-675 mutants: `e2e-mut-*.log` / `.rc`.
  - new-bug probes: `e2e-probe.log` and `e2e-probe-results.json` (ZR1, ZR2).
  - open-bug probes: `e2e-probe2.log` and `e2e-probe2-results.json` (ZR3..ZR6).
  - The `.out` bundle paths printed in those logs are gone: they were inside the scratch worktree.
- **Scripts and patches:** `sim.py`, `sim-jest.sh`, `sim-jest2.sh`, `mut-jest.sh`, `e2e-batch.sh`, `e2e-run.sh`, `jest-auth.sh`, `jest-full.sh`, `probe.sh`, `probe.test.ts`, `zz-r4b-probe.used.e2e.ts`, `zz-r4b-probe2.used.e2e.ts`, `sc679-fix.patch`, `sc675-src.patch`.
- **Cleanup:**
  - The scratch worktree was removed with `git worktree remove` and is no longer in the worktree list. Its `node_modules` symlink was moved out first to `node_modules.link`.
  - Branch worktree: `git status --porcelain` empty before and after, HEAD `6c5a073c`.
