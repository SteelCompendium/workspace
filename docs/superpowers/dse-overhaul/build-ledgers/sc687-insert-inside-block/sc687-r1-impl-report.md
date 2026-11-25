# SC-687 r1 implementer report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (one measured fact contradicts ledger O4: an unclosed `---` IS properties in the editor, see "Properties").
- Plugin branch `sc687-insert-inside-block`, head `907d9c85` (base dse develop `aee83dc1`, unmoved on fetch). Superproject branch same name, head `9f79effa` (base `6e2ff5de`); pointer bump NOT committed.
- Gates: tsc incl. `tsc -p e2e` clean, lint clean; jest 14604 passed / 2 skipped (baseline 14438 / 2, +166 new); lifecycle 64/64 (7 parts: 21+16+9+4+7+4+3);
  e2e `OBSIDIAN-E2E done: 803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (baseline 794/805, 11 known-bug; +9 ok = AUTH-I27 plain + AUTH-I28..I35, +8 total).
- styles.css sha256 on head and on a clean `aee83dc1` build both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; no CSS / rendering file touched: carry shots 592, freeze 280/280, parity 0/0/24.
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/evidence/sc687-before.png` (error card, `after text` as code) and `.../evidence/sc687-after.png` (stamina bar drawn, `after text` a paragraph, Notice on screen with its full text).
- The three SC-676 `test.failing` markers still fail-as-expected (the whole `test/dom/authoring` dir ran green); `scanFenceState` results are unchanged (pinned by a test).
- New coverage pairs: none (the refusal specs drive `authoring.cmd.insert-counter / insert-compendium-reference / insert-compendium-block x palette`, all already in the manifest).

## What changed (plugin repo `draw-steel-elements`)
Commits: `5161282e` refactor (list-item text column to `src/authoring/listItem.ts`, byte-identical behaviour) · `471e2c0f` fix (guard + scan + notices + 3 markers to plain tests + new jest files) · `8e36a757` fix (lazy continuation in the scan) · `2b7f02b8` e2e · `f086463a` docs · `907d9c85` e2e README.
Superproject: `9f79effa` (workspace `CHANGELOG.md` under `## Unreleased`).

Files: `src/authoring/{listItem.ts (new),fenceScan.ts,blockInsert.ts,compendiumInsert.ts,insert.ts}`; tests `test/dom/authoring/{insertPositionScan.test.ts (new),insertRefusal.test.ts (new),authoringKnownBugs.test.ts,compendiumInsertScenarios.test.ts}`; e2e `e2e/specs/authoring/insert-commands.e2e.ts`, `e2e/driver/authoring.ts` (Notice helpers), `e2e/README.md`; docs `docs/writing-blocks.md`, `.repo-docs/architecture.md`, `AGENTS.md`, `CHANGELOG.md`; workspace `CHANGELOG.md`.

Behaviour:
- `insertBlock` (the one write place) calls `refuseInsert(editor, range?)`; refused = nothing written, cursor and selection untouched (the CM state object is not even replaced), no undo entry, ONE Notice (O2 texts verbatim, exported as `INSERT_REFUSED_NOTICE`), returns `false` (was `void`; `insertScaffold`, `insertReferenceBlock`, `insertFullBlock` pass it up, so no follow-up work / second Notice).
- The two compendium commands call `refuseInsert(editor)` first in `editorCallback`, before the search opens. At choose time only `insertBlock` checks, so a refusal is always one Notice (mirrors the SC-601 backstop: the early check returns, the later one is never reached). Side effect to note: the reference command's Shift-click inline link is refused too (the whole command is refused at start).
- `/ds` pick goes through `insertBlock`: refused at write, the typed `/dsct` token stays as typed (tests for SC-676's three blind spots).

## The scan (`src/authoring/fenceScan.ts`)
Public: `placeOfLine(lines, target) -> LinePlace` (`outside` | `properties{role,markerStart,markerEnd}` | `fence{role open/body/close, lang, markerStart, markerEnd}`), `insertRefusalAt(lines, pos)`, `insertRefusal(lines, from, to)`. Text only, pure, one top-down pass (O(lines)). `scanFenceState` now uses the shared `openFenceOf` / `closesFence` (SC-476 backtick-info rule, `fenceLanguage`, closer rule) and is otherwise unchanged; SC-676 can switch the suggesters to `placeOfLine`.
Rules:
1. Properties first (see below), then fences from the line after them.
2. A fence opens on a line `[quote markers][indent][``` or ~~~ run][info]` when the indent is at most 3 columns past the container (the innermost open list item's text column, else 0). A fence can also open on a list item's own line (`- ```js`). SC-476: a backtick opener whose info string has a backtick is text.
3. List items: a stack of the open items' text columns (shared `listItemOf`, the exact column `planBlockInsert` writes under `- `, `1. `, `10. `, nested bullets, items in callouts, `- > [!note]`). An item ends at a less-indented line, except a paragraph line directly under the item's paragraph (lazy continuation). The stack resets when the quote depth changes. A line 4+ columns past the container (or at the top level) is an indented code block: no fence.
4. Closer: same marker char, at least as long, nothing after it but whitespace, same quote depth, indent in [item column, item column + 3]. Anything else is body.
5. Unclosed: runs to the end of the note. For a fence in a quote it ends where the quote ends (a line without the `>` prefix, e.g. a blank line). For a fence under a list item it does NOT end at an unindented line (measured below).
6. Verdict at a position: body line = inside. Opening line: inside when `ch > markerStart`. Closing line: inside unless `ch >= line length`. Properties: line 0 and body always inside; closing line as the closing fence line. A selection / `/ds` token: first end that is inside decides.

## Verdict table (spec 2.2 case, answer, jest test)
All in `test/dom/authoring/insertPositionScan.test.ts` unless noted (describe name quoted); `insertRefusal.test.ts` = command level.
| Case | Answer | Where |
|---|---|---|
| 1 body line: backtick, tilde, 4-backtick holding 3-backtick line, ```js, no language, info string after language, fake closers | refuse (`block`) | "the body of a fence is inside (verdict 1)" (all rows); command: `insertRefusal.test.ts` "the insert command with the cursor inside an existing block or the properties" |
| 2 callout / quote (nested too, `>` alone as empty line) | refuse | "a fence in a callout / quote is inside (verdict 2)" |
| 3 list item: `- ` 2, `1. ` 3, `10. ` 4, nested 4 / 6, item in callout, `- > [!note]`, tab-indented, blank line between, item-line fence, unclosed past an unindented line | refuse | "a fence under a list item is inside ... (verdict 3)"; the "run twice in a row" for all 8 shapes: `insertRefusal.test.ts` "running an insert twice in a row under a list item or in a callout" |
| 3b top level `    ```\n    text` (4+ spaces, no list) | `outside` (indented code block; the block below it is not "inside") | "4+ spaces at the top level, no list" |
| 4 properties: any line 0 .. closing `---` | refuse (`properties`), end of closing line allowed, mid-closing refused; `---` lower in the note, `--- ` opener, `----` opener, leading blank line: not properties | "the properties (verdict 4)" (28 rows) |
| 5 opening line: after marker start | refuse; ch 0 / inside the quote or indent prefix / at the marker: allowed. Verified: top-level, quoted (ch 0,1,2) and list-indented (ch 0,1,2) all keep the old block intact, jest (`insertRefusal.test.ts` "where an insert IS allowed next to a block") AND real Obsidian (every case, both blocks drawn in Reading view, no error card) | "an opening fence line (verdict 5)" |
| 6 closing line: end of line allowed (block lands below, both intact: e2e AUTH-I34, jest), anywhere else refuse | | "a closing fence line (verdict 6)" |
| 7 unclosed fence | refuse to end of note | "an unclosed fence runs to the end of the note (verdict 7)" |
| 8 selection | either end inside = refuse; both outside = replaced as today (whole block selected and replaced still works) | "a selection (verdict 8)"; command: "a selection with one end inside is refused ..." |
| 9 SC-675 shapes | unchanged | the existing SC-675 tests (`insertOwnLines`, `compendiumInsertMatrix`, `authoringKnownBugs` SC-675 block, e2e AUTH-I14..I26) all still green |
| two blocks, no cross-talk | | "two blocks in one note do not cross-talk" + "integrity around a refusal" |

Mutation check (sed mutations of the product, test files run, each restored): no guard in `insertBlock` 28 red; indent bound removed 2; opener `>=` 11; closer always allowed 11; unclosed properties 3; quote end removed 2; closer any indent 2; no list stack 8; properties opener allowed 3; no pop 2; always pop 2; closer ignoring info/whitespace 3; only first selection end 3; compendium start check removed 4. All red. (Logs in the scratchpad.)

## What real Obsidian 1.14.4 does (measured)
Scratch e2e specs, not committed; data in `.../scratchpad/sc687-impl-r1/measure-*.json`.
Properties (editor lexer = what Live Preview and Source mode use; the metadata cache disagrees in several cases and lags, so it is not used):
- Line 0 must be exactly `---`. `--- ` (trailing space or tab), ` ---`, `----` and a leading blank line: NOT properties (rule / setext heading).
- Closed by the first later line matching `---` + whitespace only: `--- ` closes. `----`, ` ---`, `---x` and YAML `...` do NOT close in the editor (the cache wrongly closes on `----` and `---x`).
- Empty pair `---\n---` and `---\n\n---` ARE properties (cache says none). Invalid YAML (`a: [`) is still properties.
- **Unclosed `---` is properties to the end of the note in the editor** (every line below styled as properties; Live Preview draws no block there; Reading view draws it normally). Ledger O4 assumed "not properties". I followed the measurement (refuse everywhere in such a note), because an inserted block there would not render in Live Preview. If the owner prefers the O4 reading, it is one line (`propertiesOf` returning null when unclosed) and one test row.
- A fence marker inside a YAML block scalar in the properties is text; a block after the properties draws.
Fences:
- List-indented fence at the item's text column .. +3: drawn as a block (Live Preview and Reading view). 4+ columns past it (`- item` then 6 spaces): indented code, not drawn. Top-level `    ```ds-ct` (4 spaces): indented code, not drawn; `    ```\n    text` then a real block below: the block below still draws (so the scan must not treat it as a fence, and does not).
- Unclosed fence under a list item: Live Preview keeps drawing everything below as code to the end of the note, even past an unindented line and an unindented ``` ; Reading view ends it at the unindented line. The scan follows Live Preview (refuses more). Unclosed fence in a callout ends at the blank line in both views.
- `- item⏎text⏎⏎    ```ds-stam` (4 spaces after a lazy continuation line) and `- ```ds-stam` (fence on the item's own line): both drawn as stamina bars in Reading view (Live Preview not probed).
- Insert in front of an opening fence (ch 0): quoted fence: the new block lands unquoted above, the old block stays `> ```ds-stam` and both draw (the callout is split in two); list-indented: the new block lands at column 0, the old block stays indented 2 and both draw (the list ends there). ch 1 in a quote prefix writes `>```ds-ct` (no space) and still draws.

## e2e (new ids)
`AUTH-I27` plain it (was knownBug; known-bug count 11 -> 10). New: `AUTH-I28` Live Preview repro (note identical, exactly one Notice on screen with the text, cursor unchanged, stamina bar drawn, `after text` a paragraph line), `AUTH-I29` Source mode (same + Reading view), `AUTH-I30` compendium reference command, `AUTH-I31` compendium snapshot command (Notice, no search window, note unchanged), `AUTH-I32` properties in Source mode, `AUTH-I33` run twice under a list item (second refused, first block intact, Reading view draws one counter), `AUTH-I34` end of closing fence line (block lands below, both draw in Reading view), `AUTH-I35` undo (Ctrl+Z after a refusal changes nothing; after typing a character then a refusal, one Ctrl+Z takes back the typed character, so the refusal added no undo entry).
Existing tests rewritten: the three SC-687 `test.failing` markers became plain tests (header comment updated); `compendiumInsertScenarios.test.ts` fake editor gained `lineCount` (the guard reads the whole note). No existing test was weakened or deleted.

## Integrity self-check (spec section 5), with tests
- Text above and below a refused position byte-identical: `insertRefusal.test.ts` (value, cursor, selection, `writes`, and `editor.state` object identity unchanged; CRLF-written note with odd spacing and tabs: recognised, refused, unchanged).
- Two same-kind blocks do not cross-talk: scan rows + "a refusal in one block, then a valid insert between two same-kind blocks".
- Hand-edited block (3 leading spaces, trailing spaces after the fences, tabs in the body, CRLF): recognised.
- Refusal followed by a valid insert elsewhere in the same note works (jest; and AUTH-I35 in real Obsidian for the undo history).

## Blind spots left
- Not measured in real Obsidian: a quoted fence ended by a non-blank line without `>` (scan follows CommonMark: the fence ends); closing properties line with a tab (`\s` used); `- item⏎text⏎⏎    ```` and `- ```` shapes in Live Preview (Reading view only).
- Tab-indented / ordered-list tab columns are approximated (tab = 4 for the line's own indent, Obsidian's 2-per-tab under bullets only for marker lines): errs toward seeing a fence.
- Not structure to the scan: HTML blocks, `$$` math, `%%` comments, a fence inside an indented code block under an item.
- Multiple cursors: only Obsidian's main selection is read.
- Cursor between a closing marker and its trailing whitespace is refused (spec: only the end of the line is allowed).
- An insert at ch 0 / in the prefix of a quoted or list-indented opening line is allowed and splits the callout / ends the list as described above (existing block intact and drawn).
- The reference command's Shift inline-link is refused with the rest of the command when the cursor is in a block (a plain-text link in a code block is not a corruption, but the command is not offered there per O3).
- Shots / freeze / parity were not run: carried on identical styles.css hash (no CSS or DOM-rendering file in the diff).

## Drive-by fixes
None.

## Follow-ups
- SC-676: switch `suggest.ts` onTrigger and `schemaSuggest.ts` onto `placeOfLine` (answers in-fence / language / opening and closing line with marker start and end / properties). The `/ds` list still offers itself in the three blind spots until then.
- The e2e `skill` CURRENT numbers (dse-verify SKILL.md) should become jest 14604 / 2 skipped fresh (14605 / 1 after shots), e2e `803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` once landed (owner's call).
- Live Preview probes for the two lazy-continuation / item-line fence shapes if SC-676 wants them.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r1-impl-report.md`
- Evidence PNGs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/evidence/sc687-before.png`, `.../evidence/sc687-after.png` (before = clean `aee83dc1` checkout, same repro and cursor; after = head)
- Logs (scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r1/`): `jfull.log` (jest), `lc-part1.log`..`lc-part7.log` (lifecycle), `e2e-full-r1.log` (e2e), `hash.out` (styles.css hashes), `a-tsc.log` / `b-tsc.log`, `b-tsce2e.log`, `b-lint.log`, `mutate-result.txt`, `measure-props2.json`, `measure-render.json`, `measure-open.json`, scratch specs `zz*.keep` (not committed).
