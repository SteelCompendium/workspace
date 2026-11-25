# SC-687 r2 independent review — plugin `907d9c85` (base dse develop `aee83dc1`), superproject `9f79effa`

## Executive summary
- **VERDICT: FIX-REQUIRED.** Counts: CRITICAL 0 · HIGH 2 (one root cause) · MEDIUM 2 · LOW 1 · INFO 4.
- HIGH-1/2 (`fenceScan.ts:174`): the "lazy continuation" exception keeps a list item open across a FENCE line, so a top-level fence directly under a list item (no blank line) is never closed by its own closer. Every line below it is refused: the plugin's OWN insert on the empty line under a list item makes that shape, and the next insert anywhere below is refused (real Obsidian, R2V-02). The same mis-scan also misses a real block lower down and the insert corrupts it (real Obsidian, R2V-03 U1).
- MEDIUM-1 (`blockInsert.ts:124`): two cursors, main outside and the other inside a block: head writes into the block exactly like `aee83dc1` (stamina bar becomes an error card, the rest of the note is code). Main inside: head refuses; `aee83dc1` wrote at both.
- MEDIUM-2 (`fenceScan.ts:158`, comment `:119`): a non-quoted line inside a quoted fence is still in the code block in Obsidian (Source + Reading view, callout Live Preview); the scan calls it outside, and an insert there orphans the old closer into a new code block.
- LOW-1 (`suggest.ts:69`): a refused `/ds` pick leaves the list open on the same rows; each Enter shows one more Notice.
- Gates (re-run by me): tsc + `tsc -p e2e` clean, lint clean; jest `Tests: 2 skipped, 14604 passed, 14606 total` (matches); e2e `OBSIDIAN-E2E done: 803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (matches); styles.css sha256 head = clean `aee83dc1` build = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (carry 592 / 280/280 / 0-0-24 holds).
- O8: the implementer's measurement is confirmed (below). I see no reason the revert is wrong.
- Scope (O5): `scanFenceState` gives the same answer on all 57 probe notes at head and at `aee83dc1`. The three SC-676 `test.failing` markers are untouched and still fail as expected. `suggest.ts` / `schemaSuggest.ts` triggers are not in the diff.

## Gates

| Gate | Measured (r2 reviewer) | Implementer claim |
|---|---|---|
| tsc (`npm run tsc` = tsc + `tsc -p e2e`) | rc 0, no output | clean |
| lint | rc 0, no output (only the `.eslintignore` deprecation warning) | clean |
| jest (fresh, `rm -f main.js styles.css` first) | `Test Suites: 1 skipped, 313 passed` · `Tests: 2 skipped, 14604 passed, 14606 total` | 14604 / 2 |
| e2e full (one run, no reds, no re-runs) | `OBSIDIAN-E2E done: 803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` rc 0; AUTH-I27..I35 all ok | `803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` |
| styles.css | head `907d9c85` and clean `aee83dc1` both `18730938…f7f1f9` | same |
| Lifecycle | not re-run (my findings do not touch it) | 64/64 |

## Findings

### HIGH-1 — a fence right under a list item is never closed; every insert below it is refused (the plugin's own insert makes this shape)
`src/authoring/fenceScan.ts:174` (with `:176` and `:189`). `lazy` is true after any non-fence line inside a list item, and while it is true a less-indented line does not pop the item. A fence line is not a lazy continuation line, but the scan does not check for one: the opener gets `listColumn` = the item's text column, so the real closer at column 0 (`indent >= open.listColumn` fails) is read as body, and the fence runs to the end of the note.

Scenario (real Obsidian 1.14.4, R2V-02, Live Preview):
1. Note `- item⏎⏎tail⏎`, cursor on the empty line 1, ch 0. Run "Insert Draw Steel: Counter". It writes `- item⏎```ds-ct⏎name: Health⏎…⏎```⏎tail⏎` (the SC-675 shape for an empty line with no prefix; same bytes as `aee83dc1`).
2. Obsidian draws it as a counter in Live Preview and Reading view, with `tail` a paragraph below it (no code lines).
3. Cursor at the end of `tail` (line 7, ch 4), run Insert Counter again: **refused**, Notice "The cursor is inside another block…", note unchanged. On `aee83dc1` the second counter is written and both draw.

The same false refusal (real Obsidian: block closed, `tail` a paragraph in both views; head refuses at `tail`):
- `- item⏎```ds-ct⏎name: x⏎current_value: 1⏎```⏎tail` (R2V-03 `L11-tail`)
- `- a⏎- b⏎Some paragraph⏎```js⏎x⏎```⏎tail` (R2V-03 `L16-tail`)
- `- a⏎  - b⏎  ```js⏎  x⏎  ```⏎tail` (nested; the fence at the OUTER item's column; scan probe L12)
- `- item⏎ ```js⏎ a⏎ ```⏎tail` (fence indented 1, less than the item's 2; L17)
- `- item⏎# H⏎```js⏎x⏎```⏎after` (L13)
- two blocks after an item: the second block's opener and everything to the end are "body" of the first (L18).

Fix: a line that opens a fence (and, to be CommonMark-correct, any non-paragraph line: ATX heading, thematic break, quote marker, list item) is never a lazy continuation line. Minimum: in `placeOfLine`, compute `FENCE_RUN_LINE.exec(rest)` before the pop and pop when it matches: `if (listItemOf(rest) !== null || !lazy || FENCE_RUN_LINE.test(rest)) while (…) items.pop();`. Add the rows above to `insertPositionScan.test.ts`. Add the R2V-02 chain as a command-level jest test (`insertRefusal.test.ts`, CmEditor) and as an e2e: insert on the empty line under a list item, then insert at `tail`: written, both counters drawn in Reading view.

### HIGH-2 — the same mis-scan misses a real block lower in the note, and the insert corrupts it
`src/authoring/fenceScan.ts:174`, same root cause and fix as HIGH-1. The falsely open fence closes at the first bare ```` ``` ```` at the item's column. If that line is really the OPENER of a bare block under a later list item, the scan reads that block's body as outside.

Scenario (real Obsidian, R2V-03 `U1`, Live Preview): note `- item⏎```js⏎x⏎```⏎- other⏎  ```⏎  a: 1⏎  ```⏎tail⏎`. Live Preview and Source mode draw lines 5–7 as a code block (`HyperMD-codeblock` classes). Cursor at the end of `  a: 1` (line 6, ch 6), Insert Counter: **written inside the block**: `…  ```⏎  a: 1⏎  ```ds-ct⏎  name: Health⏎…⏎  ```⏎  ```⏎tail⏎`. The inserted closer ends the bare block, the old closer opens a new unclosed fence that swallows `tail`, and Reading view draws no counter. No Notice. Jest: `placeOfLine` gives `outside` for line 6 (probe row U1). `aee83dc1` writes the same bytes, so this is an incomplete fix, not a regression; the guard exists to stop exactly this. The HIGH-1 fix closes it (with the pop, line 3 closes the first fence, and lines 5–7 are a fence under `- other`). Add row U1 to the scan tests.

### MEDIUM-1 — multiple cursors: with the main cursor outside and another inside a block, head writes into the block
`src/authoring/blockInsert.ts:124` (`insertRefusalFor` reads only `getCursor('from'/'to')`, the main selection); the write `:151` `replaceSelection` replaces EVERY selection range.

Measured in real Obsidian (R2V-04, Source mode, note `before⏎⏎```ds-stam⏎max_stamina: 20⏎⏎current_stamina: 5⏎```⏎⏎after text⏎`, cursors at (4,0) inside the block and (8,10) at the end of `after text`):

| main cursor | `aee83dc1` | head `907d9c85` |
|---|---|---|
| inside (4,0) (two variants of `setSelections`) | writes at both cursors: `…max_stamina: 20⏎```ds-ct…```⏎current_stamina…` plus `after text```ds-ct…` glued to the text; stamina bar = error card, rest = code | refused, one Notice, note unchanged |
| outside (8,10) (`mainIndex` 1) | writes at both, same damage | **writes at both, same damage as base**: stamina bar error card, `after text` and the new block drawn as code; no Notice |

Fix: when no `range` is passed, refuse if ANY range of `editor.listSelections()` has an end inside (check `anchor` and `head` of each). Teach `test/dom/authoring/_cmEditor.ts` `listSelections` (it already builds a real CM state; `replaceSelection` already writes every range), and add a jest test with two cursors and main outside. Follow-up, out of scope: with several cursors the SC-675 plan is computed from the main cursor's line only and written at every cursor (base glues `after text```ds-ct`); a later ticket may refuse multi-cursor inserts outright.

### MEDIUM-2 — a non-quoted line inside a quoted fence is still in the block in Obsidian; the scan ends the fence there
`src/authoring/fenceScan.ts:158` (`open = null` when `stripBlockPrefix` fails); the comment at `:119` ("the first line without it ends the fence") is not what Obsidian does.

Measured (real Obsidian, R2V-01 Q4 / R2V-06 Q9): `> ```js⏎> a⏎b⏎> ```⏎after`. Source mode marks `b` `HyperMD-quote-lazy … cm-inline-code`. Reading view: `<blockquote><pre><code>a⏎b⏎</code></pre><p>after</p></blockquote>`, so `b` is in the code block and `> ```` closes it. The callout form `> [!note] T⏎> ```js⏎> a⏎b⏎> ```⏎⏎after` is the same in Reading view and Live Preview. The scan says line `b` is `outside`. Cursor at the end of `b`, Insert Counter (no Notice): the counter is written unquoted after `b`, and the old `> ```` closer now OPENS a new code block. Plain quote: `after` (a paragraph before) is now drawn as code. Callout: an empty code block appears. Same bytes on `aee83dc1`, so not a regression. The shape is rare (the editor continues `> ` on Enter; it comes from paste or hand edits), but it is exactly the kind of block damage the guard is for.

Fix: inside an open quoted fence, a non-blank line without the prefix stays a body line (lazy). Only a blank line ends it (the implementer measured that), plus whatever else a fix-round measurement shows ends it in Obsidian (an unquoted ```` ``` ````, a shallower `>` depth). Update the `:119` comment and add rows.

### LOW-1 — a refused `/ds` pick leaves the suggestion list open
`src/authoring/suggest.ts:69` ignores `insertBlock`'s new `false`. Measured (real Obsidian, R2V-05, Source mode, `---⏎tags: a⏎⏎---⏎body`, typed `/dsct` on line 2, Enter): one Notice (properties text), the token stays (`/dsct`), no console error. But the list is still on screen with the same two rows; Enter again shows a second Notice and the list stays. Escape or typing on closes it (typing ` more` went into the editor, list gone), so it is not stuck, but it is not the clean close the brief asks for. Fix: `if (!insertBlock(editor, buildScaffold(def), { start, end })) this.close();` and assert in an e2e that no row is visible after the refused pick.

### INFO-1 — O8 measurement confirmed (unclosed line-0 `---`)
Real Obsidian 1.14.4, R2V-01 `P2-unclosed` (`---⏎a: 1⏎⏎```ds-ct⏎name: x⏎current_value: 1⏎```⏎tail`) and `P2b`:
- Live Preview: every non-blank line below `---` carries `cm-hmd-frontmatter` styling, no counter is drawn, blank lines are unstyled.
- Source mode: the same frontmatter spans on every non-blank line.
- Reading view: `---` is an `<hr>`, `a: 1` is a paragraph, the counter draws, `tail` is a paragraph. An empty Properties panel shows.
Screenshots: `shot-head-P2-unclosed-{lp,src,rv}.png` (paths below). No reason the revert is wrong: below an unclosed `---` an insert damages no structure that exists in any view. The block draws in Reading view and shows as properties-styled text in Live Preview, the same as every block already there. Note for the fix round: after the revert, a mid-marker position on line 0 (`-|--`) is ordinary text and an insert splits the `---`. That is the SC-675 mid-line rule, the same as any `---` rule lower in the note, and not a reason to keep the refusal. `.repo-docs/architecture.md` ("unclosed = to the end of the note") and the `propertiesOf` comment must change with the revert.

### INFO-2 — allowed edge positions write the same bytes as `aee83dc1`, and both blocks draw
Real Obsidian, head vs base byte-identical, Reading view checked: end of a callout closer (`> ```|`, both counters in the callout); end of a list-indented closer; end of the properties' closing line (Source); ch 0 of a top-level opener (new block above, both draw). The quoted-fence lazy case (MEDIUM-2) is also identical to base.

### INFO-3 — refusal side effects are as specified on the paths I drove
Real Obsidian, via the page event log (`__dse.notices`, `errs`): each refusal showed exactly ONE Notice with the O2 text and no console error. The compendium reference (cursor in a block) and snapshot (cursor in the properties) commands both refused at start with no search window (the palette closed and no modal opened). Note, cursor and selection were unchanged. After a refusal, typing goes into the editor (focus back). Both Notice strings match O2 verbatim (`blockInsert.ts:111-114`). `git log aee83dc1..HEAD` has no co-author or AI attribution. B (one write place) holds: the only editor writes under `src/` are `blockInsert.ts:150-151`, `compendiumInsert.ts:38` (Shift inline link, covered by the start check; accepted in O9) and `schemaSuggest.ts:129` (key/value autocomplete, not a block insert). Nothing in the sidebar or elsewhere inserts a fence at the cursor.

### INFO-4 — tests
The new jest files cannot pass on `aee83dc1` (they import `placeOfLine` / `insertRefusal` / `INSERT_REFUSED_NOTICE`, which do not exist there). The three former SC-687 `test.failing` markers are plain tests, and `AUTH-I27` is a plain `it`. No existing assertion was removed: every removed line in `git diff aee83dc1..HEAD -- test e2e` is an import, a comment, the `knownBug(` / `test.failing(` wrapper lines, or the README paragraph that was rewritten with one added sentence. The scan suite has no row with a fence directly under a list item without a blank line, so HIGH-1 went unseen. The implementer's mutation `M15 never-lazy-reset` did not catch it either, because the lazy rule is wrong for fence lines, not missing. Docs: the plugin and workspace CHANGELOG bullets and `docs/writing-blocks.md` are accurate, plain words, and make no claim that `/ds` never offers itself. "This covers any block … under a list item" becomes true once HIGH-1/2 are fixed.

## Probe table (input → scan verdict at head → what Obsidian 1.14.4 draws)
Full per-character tables: `probe-head.txt` (head) and `probe-base.txt` (`scanFenceState` column identical). Real-Obsidian data: `e2e-head-run2.json`, `e2e-head.json` (R2V-06), `e2e-base.json`.

| Input (⏎ = newline) | Scan at head | Obsidian draws | OK? |
|---|---|---|---|
| ```` ```js⏎a⏎```⏎after ```` (also `~~~`, 4-backtick holding 3, shorter or other-marker inside, `` ``` x `` not a closer, closer with trailing spaces, closer indented 3) | open: `.` at ch 0, B after; body B; closer B except end of line `.`; after `.` | block, `after` paragraph | yes |
| ```` ```js `x` ```` (backtick in info) then a real block | line 0 outside; the real block below is a fence | (SC-476) text | yes |
| unclosed ```` ```js ```` at the end; empty note; closer on the last line with no newline | B to the end; `.`; end of closer `.` | — | yes |
| `> ```js` / `>```js` / `> > ```js` with a matching quoted closer | B inside the prefix after the marker start, `.` in front | quote/callout block | yes |
| `> ```js⏎>⏎> a⏎> ```` (bare `>` as the empty line) | B | block | yes |
| `> ```js⏎> a⏎⏎after` (unclosed, blank line) | `after` `.` | fence ends at the blank line (impl. measured) | yes |
| `> ```js⏎> a⏎b⏎> ```⏎after` | `b` **outside**, `> ```` = new opener | `b` INSIDE the code, `> ```` closes it | **no (MEDIUM-2)** |
| `- item⏎  ```js⏎  a⏎  ```` and `*`, `+`, `1.` (3), `10.` (4), nested 4 / 6, tab under `-`, list in a callout, blank line before the fence, `- ```js` on the item line | B inside, closer end `.`, after `.` | block in the item | yes |
| `- item⏎      ```js` (6 spaces: indented code in the item) | outside | indented code (impl. measured) | yes |
| `- item⏎```ds-ct⏎…⏎```⏎tail` (no blank line) | closer and `tail` **B to the end** | counter, `tail` paragraph (LP + RV) | **no (HIGH-1)** |
| `- a⏎- b⏎Some paragraph⏎```js⏎x⏎```⏎tail` | **B to the end** | `pre`, `tail` paragraph | **no (HIGH-1)** |
| `- a⏎  - b⏎  ```js⏎  x⏎  ```⏎tail` | **B to the end** | code lines 2–4 only, `tail` text | **no (HIGH-1)** |
| `- item⏎ ```js⏎ a⏎ ```⏎tail` | **B to the end** | `pre`, `tail` paragraph | **no (HIGH-1)** |
| `- item⏎```js⏎x⏎```⏎- other⏎  ```⏎  a: 1⏎  ```⏎tail` | line `  a: 1` **outside** | lines 5–7 a code block | **no (HIGH-2, corrupts)** |
| `- item⏎  ```js⏎  a⏎after⏎```⏎tail` (unclosed past an unindented line) | B to the end | LP: code to the end (impl. measured) | yes (follows LP) |
| `    ```⏎    text⏎⏎```ds-ct…` and `\t```js` at the top level | indented code = outside; the block below is a fence | indented code; the block below draws (LP + RV) | yes |
| `---⏎a: 1⏎---⏎after`, `---⏎---`, closer `---  ` | P to the closer, end of closer `.` | properties | yes |
| `--- ⏎…`, `⏎---⏎…`, `---` mid-note | outside | rule / setext (impl. measured) | yes |
| `---⏎a: 1⏎⏎```ds-ct…⏎tail` (unclosed) | P to the end (O8: to be reverted) | LP + Source frontmatter-styled, no block in LP; RV `<hr>`, block draws | O8 |
| `---⏎a: |⏎  ```⏎---⏎after` (fence in the properties) | P, then `after` `.` | properties | yes |
| `---⏎a: 1⏎---⏎```js⏎x⏎```⏎after` | fence directly after the properties | block | yes |
| selections on `before⏎```js⏎a⏎```⏎after⏎```js⏎b⏎```⏎tail` | (0,0)→(2,1) B; (2,0)→(4,2) B; (2,0)→(6,1) B; (0,0)→(4,5) null; (0,0)→(8,4) null; (3,3)→(5,0) null | — | yes (reversed: `getCursor('from')` is the lower end) |
| two cursors, main outside, one inside | not seen (main only) | written at both, block broken | **no (MEDIUM-1)** |

## Artifacts
Scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r2/`:
- scan probes: `probe-head.txt`, `probe-base.txt`, `probe-head-self.txt`, `probe-base-self.txt`, logs `probe-head.log`, `probe-base.log`; the scratch jest file `zzR2ReviewProbe.test.ts.keep`
- real Obsidian: `e2e-head-run1.json`, `e2e-head-run2.json` (R2V-01..05), `e2e-head.json` (R2V-06), `e2e-base.json` (R2V-01..05 on `aee83dc1`; R2V-03 timed out on base at the compendium-reference row because base opens the search window, as expected; all rows before it were recorded), logs `e2e-probe-head.log`, `e2e-probe-base.log`; the scratch spec `zz-r2-review.e2e.ts.keep`; screenshots `shot-head-P2-unclosed-{lp,src,rv}.png` and `shot-base-P2-unclosed-{lp,src,rv}.png` (same drawing on base)
- gates: `g-tsc.log`, `g-tsce2e.log`, `g-lint.log`, `g-jest-full.log`, `g-hash.out`, `g-e2e-full-r2.log`
- base checkout `base/` (detached `aee83dc1`, removed at the end with `git worktree remove`)
