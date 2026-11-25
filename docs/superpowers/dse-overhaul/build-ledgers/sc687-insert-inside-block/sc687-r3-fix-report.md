# SC-687 r3 fix report

## Executive summary
- STATUS: DONE. All six items fixed. Plugin head `fe0b5bab`, superproject head `754d46b0` (no pointer bump). `origin/develop` still `aee83dc1` (no rebase).
- Gates: tsc incl. `tsc -p e2e` clean, lint clean; jest `Tests: 2 skipped, 14643 passed` (r1 14604, +39); e2e `OBSIDIAN-E2E done: 809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (r1 803/813, +6 ok = AUTH-I36..I41, no new pair).
- Lifecycle 64/64 carried from `907d9c85`: `git diff --stat 907d9c85..HEAD` touches only `src/authoring/` (blockInsert, fenceScan, suggest), `test/`, `e2e/specs/authoring/insert-commands.e2e.ts`, docs (12 files, 285 insertions, 27 deletions).
- styles.css sha256 on head `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (unchanged: carry shots 592 / freeze 280/280 / parity 0/0/24).
- Every new rule has a failing-first test; the real-Obsidian tests AUTH-I36, I37, I38, I40, I41 were run against the r1 source (`git checkout 907d9c85 -- src/authoring`) and went red, I39 red on r1 after I fixed its own setup (see MEDIUM-1); jest mutation check below.
- MEDIUM-2 measured in Obsidian 1.14.4 (table below): only a blank line or an unquoted fence line ends a quoted fence.

## Per finding
| Finding | Commit | Change | Red first |
|---|---|---|---|
| HIGH-1 + HIGH-2 | `d3a9619f` | `fenceScan.ts` (`placeOfLine`, the pop condition near line 190, new `NOT_PARAGRAPH` at line 99): a fence line, an ATX heading, a thematic break and a list item are never lazy continuation lines, so they pop the item. A fence directly under `- item` is a top-level fence its own closer closes | 13 scan rows + 2 chain tests failed before the fix (`insertPositionScan.test.ts`, `insertRefusal.test.ts` "r3: the plugin's own insert under a list item"). Rows: every list shape (`- `, `* `, `+ `, `1. `, `10. `) with no blank line, the reviewer's L11/L12/L16/L17/L13/L18 shapes, and U1 (body of a bare block under a later item is `block`, the line after it is `outside`). Later added (`fe0b5bab`): heading and thematic break rows, which survived the mutation "heading not special" until then |
| MEDIUM-2 | `6866cbcc` | `fenceScan.ts`: new `endsQuotedFence(text)`; in `placeOfLine` a line without the quote prefix ends a quoted fence only when blank (or whitespace) or an unquoted fence marker line (indent <= 3, no quote markers); otherwise it is body. Comment on `placeOfLine` rewritten | 7 scan rows failed before |
| MEDIUM-1 | `67e86de5` | `blockInsert.ts` `insertRefusalFor`: with no `range`, loops `editor.listSelections()` and refuses when any range has an end inside. `_cmEditor.ts` gained `listSelections`, `setSelections` and `EditorState.allowMultipleSelections` (without it CodeMirror collapses to one cursor). The shared mock `Editor` (`test/mocks/obsidian-core.ts`) and the `compendiumInsertScenarios` fake editor gained `listSelections` (65 tests failed on the missing method otherwise) | jest "r3: several cursors" (3 tests: main inside, main outside, anchor inside / head outside, and both outside written as before, one `replaceSelection`). Real Obsidian AUTH-I39 red on `907d9c85` for the main-outside variant, green on head |
| LOW-1 | `67e86de5` | `suggest.ts` `selectSuggestion`: `if (!insertBlock(...)) this.close();`. `onTrigger` and the three SC-676 `test.failing` markers untouched (the whole `test/dom/authoring` dir passes, markers still fail as expected) | jest "a refused pick closes the suggestion list"; real Obsidian AUTH-I40 red on `907d9c85` |
| O8 revert | `136d6615` (+ docs `d06ae333`) | `propertiesOf` returns null unless a closing `---` exists (`{ end }` only; `closed` field removed); comment rewritten; `.repo-docs/architecture.md` rewritten; scan rows rewritten (unclosed: null, its first line null, a block below it still `block`, `...` unclosed null, `...` then a later `---` closes). No r1 e2e pinned the unclosed refusal | rows failed before (3); real Obsidian AUTH-I41 red on `907d9c85` |
| Docs truth pass | `d06ae333` (plugin), `754d46b0` (superproject) | `docs/writing-blocks.md`, plugin `CHANGELOG.md`, workspace `CHANGELOG.md`: "With several cursors, one of them inside is enough to refuse"; plugin changelog: an unclosed line-0 `---` has no properties. The "covers ... under a list item" claim is true now. architecture.md: quoted-fence ends, several cursors, closed `/ds` list | n/a |

Commit note: the brief asked for one commit per fix; MEDIUM-1 and LOW-1 share `67e86de5`.

## New e2e ids (all in `e2e/specs/authoring/insert-commands.e2e.ts`; no new coverage pair)
- `AUTH-I36` chain: insert on the empty line under `- item`, then at `tail`: both written (second one below), no Notice, Reading view draws two counters, `tail` a paragraph (HIGH-1, LP editor).
- `AUTH-I37` `- item⏎```js⏎x⏎```⏎- other⏎  ```⏎  a: 1⏎  ```⏎tail`, cursor (6,6), Source mode: refused, note unchanged (HIGH-2).
- `AUTH-I38` `> ```js⏎> a⏎b⏎> ```⏎after` in Source mode and the callout form in Live Preview: refused, note unchanged (MEDIUM-2).
- `AUTH-I39` two cursors via `setSelections`, main inside and main outside: refused, one Notice, note unchanged, two selections still there (MEDIUM-1). Probe: Obsidian's main selection is the range at index 0 of the array handed to `setSelections`; the main-index argument did not move it (`mainIndex` stayed 0 for argument 1), and `getCursor()` answers for it. So the order of the array makes a cursor main. My first version of the test passed on r1 for the wrong reason (both variants had the inside cursor as main); fixed before commit.
- `AUTH-I40` a `/ds` pick refused in the properties (Source mode, `/dscounter`, Enter): one Notice, no list row left, token stays in the note.
- `AUTH-I41` unclosed line-0 `---`: insert below it is written, no Notice, Reading view draws the counter (O8).

## MEDIUM-2 measurement (Obsidian 1.14.4, real, Live Preview / Source mode / Reading view)
Scratch e2e specs (not committed), data in `.../scratchpad/sc687-impl-r3/measure-quote.json` and `measure-quote2.json`. "stays" = the line is still in the code block.
| Line without the quote prefix, inside `> ```js⏎> a` | Reading view | Live Preview / Source mode | Scan |
|---|---|---|---|
| blank line (plain quote and callout) | fence ends (`after` is a paragraph; a later `> ```` opens a new quoted block) | ends | ends (r1, unchanged) |
| unquoted fence line ```` ``` ```` or `~~~` (plain, callout) | quoted fence ends, a NEW top-level fence opens there and runs to the end (`> ```` after it is its body) | same (lines CODE-styled) | ends and opens a fence (`endsQuotedFence`) |
| unquoted text (`b`), plain and callout | stays (`<pre>a⏎b`) | stays (inline-code / widget "T a b") | stays |
| shallower `>` depth (`> b` in a `> > ```js` fence), plain and callout | stays | stays | stays |
| `>` alone | stays | stays | stays (prefix still present) |
| unquoted heading `# H`, list item `- item`, thematic rule `---` | fence ENDS there | does not end for `# H` (stays), ends for `- item` and `---` (inconsistent) | stays (the views disagree: the scan takes the reading that refuses) |
| unclosed, unquoted text to the end of the note | stays to the end | stays | stays |

## Mutation check (sed mutations of the product, the two scan / refusal test files run, each restored)
- R1 fence line counted as lazy again: 12 red. R2 heading / thematic break not special: 2 red (needed the two added rows; was 0 before them). R3 quoted fence ends at any unquoted line again: 7 red. R4 only blank ends it: 2 red. R5 multi-cursor reads the main selection only: 2 red. R6 no `close()` after a refused pick: 1 red. R7 unclosed properties again: 4 red.
- Logs: `mut-R*.log`, `mutate-result.txt` (holds only the last re-run, R2); the full R1..R7 numbers above are from `mutate.sh`, its first run.

## Real-Obsidian verification of the two HIGH scenarios
AUTH-I36 (HIGH-1 chain) and AUTH-I37 (HIGH-2) pass on head and fail on `907d9c85` source (r1 behaviour restored with `git checkout 907d9c85 -- src/authoring`, run `--only=AUTH-I36..I41`: 1/6 ok there, the one green being the I39 as first written).

## Blind spots / notes
- The lazy rule after a heading indented inside an item is still approximate (a line `  # H` leaves `lazy` true); a rare shape, not probed.
- An unquoted fence line ends a quoted fence only at the left margin (indent <= 3, no `>`); a quoted shallower fence line (`> ```` inside a `> > ```js`) is treated as body (refuses more).
- Reading view and Live Preview disagree on heading / list / rule lines inside a quoted fence; the scan refuses (stated above).
- SC-692 (multi-cursor plan computed for the main cursor's line) untouched: a multi-cursor insert with every cursor outside is written exactly as on `aee83dc1` (a jest test pins one `replaceSelection` and the same bytes).

## Drive-by fixes
None.

## Follow-ups
- None new beyond SC-692 and SC-676 (already filed).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r3-fix-report.md`
- Logs (folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r3/`): `jfull.log` (jest), `e2e-full-r3.log` (e2e), `g-tsc.log`, `g-tsce2e.log`, `g-lint.log`, `hash.out` + `hash-build.log`, `e1.log` (AUTH-I36..I41 on head), `e1red.log` (same on r1 source), `i39red.log`, `i39.log`, `measure-quote.json`, `measure-quote2.json`, `probe-cursors.json`, `mut-R*.log`, `mutate-result.txt`, scratch specs `zz-r3-measure*.e2e.ts.keep` (not committed).
