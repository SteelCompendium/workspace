# SC-692 r1 implementer report

**Executive summary**
- Verdict: DONE. An insert with several cursors lays one block out per cursor, in ONE `editor.transaction` (one undo); one cursor is untouched (old replaceSelection path).
- Plugin branch `sc692-insert-several-cursors`, head `6b290e01` (base `17187e4c`, still `origin/develop`). Superproject head `634cee2c` (CHANGELOG only; no pointer bump committed).
- Gates at head: tsc (incl. `-p e2e`) clean, lint clean; jest 15041 passed / 2 skipped (baseline 15018 / 2: +23); lifecycle 64/64 (21+16+9+4+7+4+3, each log checked for its own ids); e2e `944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` (baseline 936/956: +8 ok, +8 total, no new pair).
- `styles.css` sha256 identical on head and a clean `17187e4c` build (`50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98`), no CSS or rendering file touched: carry shots 636, freeze 280/280, parity 0/0/24 (not re-run).
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/evidence/sc692-before.png` (old build: second copy glued onto `after text`, code lines below) and `.../evidence/sc692-after.png` (two counters drawn, `after text` a paragraph).
- Red first: the new jest file is 20 red / 3 green on the `17187e4c` `blockInsert.ts`; e2e AUTH-I43, I44, I45, I46 are red on it (I47 not run there; I48, I49 are regression pins, green on both).
- Undo measured in real Obsidian 1.14.4: one Ctrl+Z after a two-cursor transaction restores the note byte-for-byte and both cursors (AUTH-I45).
- Existing tests: none weakened or deleted. One title renamed (`insertRefusal.test.ts`, the SC-687 two-cursor test said "one replaceSelection"; its assertions are unchanged and still pass: still one write).

## The implementation

`src/authoring/blockInsert.ts` (all of it; `insert.ts` / `compendiumInsert.ts` only got a comment):

- `planBlockInserts(getLine, ranges, block)` is the pure part: sorted, non-overlapping ranges + a line reader in; `changes` (every one in the note's coordinates BEFORE any change) and `cursors` (in the note AFTER every change) out. It calls the existing `planBlockInsert` per range, last range first, so O2 holds by construction. The only thing a later write changes for an earlier range is the text after it on a shared line: when the next range starts on this range's end line, `after` is the text between them plus what the next range's write left on its first line (its first line up to the first `\n`, or its whole text plus ITS `after` when the write has no line break). Cursor of range i = `advancePosition(from, text, plan.cursor ?? text.length)` (the same position a single insert gives), then mapped through every change above it (`mapThrough`: columns shift on a shared line, lines shift below).
- `insertRangesOf(editor)` reads `listSelections()`, orders each range from/to, sorts, joins overlapping ones (defensive; CodeMirror already does), finds the main one by comparing `getCursor('head'/'anchor')`.
- `insertBlock` (no `range`, more than one range) goes to `insertAtEveryCursor`: ONE `editor.transaction({ changes, selections })`, main cursor first in `selections`. One range, or a `/ds` `range`, keeps the old `replaceSelection` / `replaceRange` + `setCursor` path byte for byte (existing SC-675 / SC-687 tests are the pin and were not edited).
- SC-687's guard (`refuseInsert` at the top of `insertBlock`, `insertRefusalFor` over every range) is untouched: any range with an end inside a block / the properties refuses everything, one Notice.
- Compendium reference / snapshot: same `insertBlock`, `endLine: true`; cursor after each block (`cursor` undefined, so the end of that range's text).
- Shift inline link and the `/ds` pick: unchanged (O5).

## Measurements in real Obsidian 1.14.4 (scratch probe, not committed; kept at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-impl-r1/zz-sc692-probe.e2e.ts.keep`, output `.../probe-transaction.json`)

- `listSelections()` returns the ranges sorted by position. `setSelections(ranges, main)` ignores `main`: the FIRST range of the array is the main one (`getCursor()` follows it). Same for `transaction({ selections })`: the first is main.
- `transaction({ changes, selections })`: `changes` are read in the note's coordinates before the transaction (two inserts, one at line 1 and one at line 3, both land where written), `selections` in the coordinates AFTER it (a cursor given at line 6 of a 5-line note lands at line 6 of the new one).
- ONE undo step: two changes in one transaction, one Ctrl+Z gives the original note back; Ctrl+Y gives the result again. (Selections after undo in the probe: the single cursor the editor had; in AUTH-I45 both starting cursors are back.)
- Fallback not needed: `transaction` with several changes is already one undo.

## Case table (2.2)

Jest file `test/dom/authoring/insertSeveralCursors.test.ts`; every `insertAll` case checks (a) exact text by hand, (b) equality with an ORACLE that runs the real single-cursor path last-range-first on fresh CodeMirror editors, (c) every cursor's offset equals the oracle's (tracked as offsets, independent of `mapThrough`), (d) main kept, (e) all ranges collapsed to carets, (f) `editor.writes` has length 1 (one change). E2E file `e2e/specs/authoring/insert-several-cursors.e2e.ts`.

| # | Case | Result | Jest test (title starts) | E2E |
|---|---|---|---|---|
| 1 | ticket case, main on empty line, second at end of `after text` | `intro / B / after text / B` , cursors on both first body lines, nothing glued | "the ticket case: the main cursor on an empty line..." (red on base) | AUTH-I43 (also: both counters draw, `after text` paragraph, editing block 1 leaves block 2 at 10) |
| 2 | main at the end of `after text` (main index 1) | same note, main cursor = second block's | "the same note with the main cursor at the end..." | AUTH-I44 (Live Preview + Reading view) |
| 3 | three cursors: empty line, end of line, middle of line | text after the middle cursor moves below its block | "three cursors: an empty line, the end of a text line..." | (jest only) |
| 4 | callout line, list item, top level | `> `, two spaces, none; write path finds callout + top-level block with their prefixes | "a callout line, a list item and a top-level line..." | AUTH-I46 (Live Preview, 3 draw), AUTH-I47 (Source -> Reading, 3 draw) |
| 5 | same line `ab\|  \|cd` and `ab\|cd\|ef` | `ab / B(opening..body) / "```  " / B / cd` (closing fence keeps the two spaces, CommonMark-legal, no blank or whitespace-only line); `ab / B / cd / B / ef` | "two cursors on the SAME line, whitespace between them", "...text between them", "...at the start of one line..." (also two cursors in a list item) | AUTH-I48 (`abcdef`, Reading view) |
| 6 | adjacent empty lines | two blocks in a row, nothing between | "cursors on two adjacent empty lines" (+ "adjacent text lines") | AUTH-I49 (Reading view draws both) |
| 7 | selection + cursor | selected text replaced (also across lines), cursor gets its block | "a selection and a cursor...", "two selections, the second inside a list item" | (jest only) |
| 8 | compendium reference and snapshot, two+ cursors | each laid out with `endLine`, cursor on the line after its block behind its prefix | "SC-692: the compendium ... %s" (reference, snapshot), "reference: two cursors on one line" | (jest only; the search window is out of scope) |
| 9 | one undo | one `writes` entry in jest; real undo in Obsidian | (`writes` length 1 in every `insertAll`) | AUTH-I45 |
| 10 | cursors after the write | first body char of each block; same-line earlier block shifts later cursor's line and column | "each cursor is where a single insert leaves it...", "an earlier block on the same line moves the cursor...", "the main cursor is the same range before and after" | AUTH-I43 / I44 / I46 / I47 (positions + main) |
| 11 | O4 refusal | nothing written at either cursor, one Notice | existing "SC-687 r3: several cursors" tests kept; plus "a cursor inside an existing block refuses the whole insert" | existing AUTH-I39; new AUTH-I50 |
| 12 | single cursor byte-identical | old path | all existing SC-675 / SC-687 tests, untouched; "a single cursor still goes through the one replaceSelection"; "one range is the single-cursor plan" | existing AUTH-I* |
| 13 | integrity | exact full note with text above / between / below, existing `ds-stam` block between two cursors, `existingBlocksIntactProblem` null; two same-kind blocks found separately by the write path | "text above, between and below the cursors is untouched...", "two same-kind blocks written at once..." | AUTH-I43 (no cross-talk: edit block 1 in the note, only counter 1 shows 12) |

Jest also has "the pure plan" (2 tests): one range equals the single plan; changes keep note coordinates, cursors are in the new note.

## Test numbers

- New jest: 23 (`insertSeveralCursors.test.ts`); `_cmEditor.ts` gained `transaction` (a real CodeMirror transaction; `writes` gets one `via: 'transaction'` entry; jsdom has no history extension, so the undo itself is e2e).
- New e2e: AUTH-I43..AUTH-I50 (8). No new coverage pair (none of them drives a manifest control: the palette pair `authoring.cmd.insert-counter x palette` already exists). Known-bug markers: still 20; no SC-692 marker existed (grep before and after).
- Gate logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-impl-r1/` — `gate-r1-jest.log`, `gate-r1b-life1.log` .. `gate-r1b-life7.log`, `gate-r1-e2e.log`, `hash.out` (+ `hash-base-build.log`, `hash-head-build.log`), `g3-tsc.log`, `g3-lint.log`, `j3-base.log` (new jest file on the old `blockInsert.ts`: 20 failed / 3 passed), `probe-e1base.log` (e2e on the old file: I43, I44, I45, I46 FAIL; I48, I49 ok). (`gate-r1-life1.log` is a first life1 attempt killed by my own `timeout` wrapper; the real run is `gate-r1b-life1.log`.)

## Docs

`blockInsert.ts` header and `insertBlock` doc comment, `insert.ts` header, plugin `docs/writing-blocks.md` (one sentence + the undo), plugin `AGENTS.md` authoring paragraph, plugin `CHANGELOG.md` (`## 7.0.0 (unreleased…)`, top bullet, [FIX] style), workspace `CHANGELOG.md` `## Unreleased` (top bullet), `e2e/README.md` (several-cursor driving facts).

## Blind spots left

- The closing fence of the left block in `ab|  |cd` keeps its two trailing spaces (the whitespace that sat between the cursors); jest pins the exact text, no real-Obsidian draw of that exact note (AUTH-I48 uses no whitespace).
- `insertRangesOf` joins overlapping ranges, which CodeMirror never hands over; that branch has no test.
- Selection direction: every range collapses to a caret after the write (as a single insert does).
- Compendium inserts with several cursors are jest-only (no e2e through the search window).
- Block inside a list item still cannot save (known, unchanged); the drawn-but-unsaveable status holds for every per-cursor list block.
- Not run: shots / freeze / parity (carried on the identical `styles.css` hash, no rendering file touched).

Drive-by fixes: none.

Follow-ups: none beyond the above. (An `insertBlock` caller that passes `range` with several cursors set still writes at that range only, as before; out of scope per O5.)
