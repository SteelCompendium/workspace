# SC-675 r2 independent review — dse `bb608f5b` (base `129beb18`)

**Executive summary**
- **VERDICT: APPROVE_WITH_FIXES.** One MEDIUM, two LOW, four INFO. No CRITICAL/HIGH. No regression vs base in any of 241 jsdom probes or 20 real-Obsidian drives.
- **MEDIUM-1:** in a list nested with TABS (Obsidian's default list indentation), the inserted block is written with tab indentation on every line, and Obsidian **Live Preview draws a parse-error card** ("Tabs are not allowed as indentation"). Reading view draws it. Spaces fix it (measured in Obsidian). The cause is the r1 brief's "keep the exact whitespace characters" rule, which conflicts with its own "a working block in Obsidian" condition. Fix: write the list indentation as spaces.
- Everything else holds. Own lines, nothing lost or reordered, one change and one Ctrl+Z (also in Obsidian), cursor on the first body character with the prefix counted, empty-line case byte-identical to a real base build. Callout / nested-callout / list-in-callout inserts save through the real + press (LP and Reading). A plain list item gives exactly the SC-461 "not saved" Notice, with the note byte-identical.
- SC-443 scratch merge: **clean, no conflicts.** 5 of 6 markers flip (AUTH-I21, AUTH-S09, 2 jsdom SC-675, SC-462). The list marker does not flip, as expected. **3 non-marker SC-443 tests now fail**, all pinning the old splice for an indented `/ds` token: `dsSuggestMatrix.test.ts:133/:143` and e2e AUTH-S04. The test expectations are what is wrong, not the fix. SC-443's rebase must rewrite them too (INFO-1).
- Gates on `bb608f5b`: tsc rc 0, lint rc 0, jest `13816 passed / 2 skipped, 300 suites + 1 skipped` (rc 0). `styles.css` sha256 `18730938…f1f9` is the same on a fresh base build.
- Implementer tests are not vacuous: `insertOwnLines.test.ts` on base src gives 104 failed / 10 passed. The 10 that pass are the 8 unchanged-case tests and the 2 compendium `|tail` cases, which base already got right.
- Worktree clean. Both scratch worktrees removed.

## Findings

### MEDIUM-1 — tab-indented list prefix: the block draws as a parse error in Live Preview
`src/authoring/blockInsert.ts:70` (`prefix: quote + lead + ' '.repeat(...)`, the item's own leading tab is kept). `:72-73` does the same for a whitespace-only continuation line. `:78` writes the prefix verbatim on every line.

Failure (real Obsidian 1.14.4, Live Preview, Insert Draw Steel: Counter):
- before `- a⏎⇥- b|`. After: `- a⏎⇥- b⏎⇥␣␣```ds-ct⏎⇥␣␣name: Health⏎…⏎⇥␣␣``` `. LP shows `Counter: failed to render (parse) Tabs are not allowed as indentation at line 1, column 1`. Reading view draws the counter. (ZREV-T02, screenshot `obsidian-capture/T02-lp.png`.)
- the same for `- a⏎⇥- |` (T01, T05 via `/ds`) and for the brief's own "tab-indented continuation line" `- item⏎⇥|` (seeded shape S4).

Seeded spellings in Obsidian (`capture3.jsonl`, `capture4.jsonl`):

| spelling | LP | Reading |
|---|---|---|
| `⇥␣␣` (fix today), `⇥⇥`, `⇥` on the body lines | error card | ok |
| 6 spaces under `- a⏎⇥- b` (S2) | ok | ok |
| opener behind the user's own `⇥`, body in 4 spaces (S9) | ok | ok |
| opener behind `⇥␣␣`, body in 6 spaces (S10) | ok | ok |

Not a regression: base glued the block and broke it in both modes. But this is the nested-list shape the ticket names, in Obsidian's default indentation ("Use tabs" on), so the fix does not deliver it in LP.

Note: the implementer's case `'\t- item'` (insertOwnLines.test.ts:181), with a tab at column 0 and no parent item, is not a list. CommonMark reads it as indented code, `marked` finds no list, and Obsidian draws nothing for it (S8). The case that matters is `- a⏎⇥- b`.

**Fix:** in `blockContextOf`, build the list continuation indentation as spaces only: `quote + ' '.repeat(contentColumn)`, with columns from `columnAfter` (tab = next multiple of 4). Do the same for the whitespace-only line, `' '.repeat(columnAfter(indent))` (`:72-73`). The first line still goes behind the user's own whitespace when the cursor line holds only its prefix, so no user character changes; S9/S10 prove that mixed shape draws. Update `insertOwnLines.test.ts:181-182` (expect spaces; replace `'\t- item'` with `'- a\n\t- b'`) and the docs/report wording. This is an owner call because it overrides the r1 brief's "keep the exact whitespace characters". Recommend overriding it: the inserted lines are new text, not the user's.

### LOW-1 — a callout inside a list item, cursor on the callout's marker line: the block leaves the callout
`blockInsert.ts:62-70`: quote markers are read only at the start of the line, not after a list marker.
- before `- > [!note] T|`. After: `- > [!note] T⏎␣␣```ds-ct⏎␣␣name: Health⏎…⏎␣␣``` ` (ZREV-T04). The block draws inside the item, below and outside the callout. The callout stays empty.
- On the callout's continuation line (`- > [!note] T⏎␣␣> |`) it is right: prefix `␣␣> `, and the DSE write path even saves it (jsdom probe `callout in list continuation`: dse=1, pfx `"  > "`, write ok).

**Fix (optional):** after a list marker, also take `quoteMarkersOf(rest after the marker)` into the prefix, giving `␣␣> `. Or accept it: rare shape, and the result still draws.

### LOW-2 — a tail that starts with a tab or 4+ spaces becomes an indented code block below the block
`blockInsert.ts:104`: the tail keeps its leading whitespace on its new line.
- before `abc|⇥tail` (or `abc|␣␣␣␣tail`). After: `abc⏎```ds-ct⏎…⏎```⏎⇥tail`. `⇥tail` now renders as code (it was paragraph text). No byte is lost. The same happens in a list item (`- item|␣␣␣␣tail` gives a 6-space line).

**Fix (optional):** leave the tail's leading whitespace behind the closing fence (```` ```⇥ ````, then the line break, then prefix + `tail`). CommonMark allows spaces and tabs after a closing fence, and DSE's `matchFenceMarker` reads ```` ```␣␣␣ ```` as a closer (probe `ws-only tail`). Obsidian's LP closer regex with a trailing tab is not verified. Or accept as rare.

### INFO-1 — SC-443 rebase: three plain tests pin the old indented-token splice (not only the markers)
Ledger O3 / the cross-effort note list only the markers. On the scratch merge these also fail, all for a whitespace-only line `␣␣/ds…` outside any list. That shape is ruled by brief §3 item 8, so the fix is right and the tests must change:
- `test/dom/authoring/dsSuggestMatrix.test.ts:133` (the `an indented token` row of the `test.each` at :135). It expects `above⏎␣␣```ds-ct⏎name: Health…⏎```⏎below`; the fix writes every body line and the closer with `␣␣`.
- `dsSuggestMatrix.test.ts:143`. It expects cursor `{line 3, ch 0}`; the fix gives `{line 3, ch 2}`.
- e2e `[AUTH-S04]` `e2e/specs/authoring/ds-suggest.e2e.ts:77`, the same shape in real Obsidian (`spliced(...)` expectation, then cursor `{2,0}`). Failed in both merge runs. Note diff: `evidence-auth-s04/`.

Neither shape (old or new) is addressable by the write path, since `FENCE_MARKER` needs column 0 outside a quote. No saving is lost.

### INFO-2 — indentation that is not a list is carried, so the block draws but cannot save
`  abc|` (2-space paragraph), `␣␣|` / `␣␣␣|` (whitespace-only), and `para⏎2. item|` (`2.` cannot interrupt a paragraph, so it is not a list). The block is written with the indentation: it renders, but DSE cannot address it (dse=0), the SC-461 class. Base was broken for all of these (glued, dse=0), so this is not a regression. The helper cannot tell `- item⏎␣␣abc|` from `␣␣abc|` without reading earlier lines. No action proposed.

### INFO-3 — whitespace-only tail
`abc|␣␣␣` leaves ```` ```␣␣␣ ```` as the closer (valid). A later DSE write rewrites the closer to ```` ``` ````: two lines change instead of one, and the trailing spaces drop. That is the existing `replaceFenceBlock` behaviour. Harmless.

### INFO-4 — lazy paragraph continuation indented 5+ spaces
`para⏎␣␣␣␣␣more|` gives a block indented 5. It is not a fence (no code token for `marked`), so the block does not render. Base was broken too. This is the same family as the ledger's dropped "4+ space whitespace-only line" follow-up.

## Scope check (A)
`git diff 129beb18..bb608f5b`: `schemaSuggest.ts` untouched. The `/ds` trigger (`TRIGGER`, `onTrigger`) is untouched. `insertInlineLink` and `copyCode` are untouched. `suggest.ts` changes only `selectSuggestion` and its header comment. `compendiumInsert.ts` changes only the two block `replaceSelection` lines. `blockPrefix.ts` gains `quoteMarkersOf` only (`FENCE_MARKER` is unchanged). The edited existing tests are sound: `insert.test.ts` (2 expectations: the cursor is after text / mid-line), `suggest.test.ts` (`␣␣/dsroll` cursor column 2), `compendiumInsertScenarios.test.ts` (the fake editor gained `getCursor`/`getLine` only).

## Probe table (B) — jsdom, real CodeMirror 6 state, all 4 paths × 61 cases (+1 two-insert case)
Full machine output: `probe-fix.json`, `probe-base.json`; one row per path × case: `probe-table.md`. Probe source: `zzSc675RevProbe.test.ts` and `zzSc675RevProbe2.test.ts` (8 more tab / thematic-break / callout-in-list cases). Every row checks: single change, inverse-of-change restores the note, lines above the cursor and below the selection end byte-identical, the `marked` code token and its container path, DSE `listFences` + `matchFenceMarker` prefix, a `replaceFenceBlock` write (+1), and the cursor on the first body character.

All 241 rows: changes=1, undo restores, above/below identical, cursor on body (scaffold paths). No row regresses vs base (DSE-found 1 → 0 or `marked` ok → not ok: none).

Selected rows, Insert command (`|` = cursor; the other paths are the same apart from their own tails):

| case | before | after | ok? |
|---|---|---|---|
| empty note / `|⏎next` / `above⏎|⏎below` | | byte-identical to base build (all 4 paths, text + cursor) | yes |
| end of text | `abc|` | `abc⏎```ds-ct⏎|a: 1⏎b:⏎  c: 2⏎``` ` | yes, saves |
| mid-line | `abc|def` | `abc⏎block⏎def` | yes, saves |
| start of line | `|tail` | `block⏎tail` | yes |
| selection over 2 lines | `ab«X⏎Y»cd⏎next` | `ab⏎block⏎cd⏎next` | yes |
| last line, no newline | `first⏎last|` | `first⏎last⏎block` | yes |
| `/ds` both sides | `abc /dsct| tail` | `abc ⏎block⏎ tail` | yes |
| list continuation (ticket) | `- item⏎␣␣|` | `- item⏎␣␣```ds-ct⏎␣␣|a: 1…⏎␣␣``` ` | in item (marked), cannot save (SC-461) |
| `- item|`, `- |`, `1.`, `10.`, `1)`, `- [ ]`, `- [x]`, `*`, `+`, nested 2/3 | | indented 2/2/3/4/3/2/2/2/2/4/6 under the item | in item |
| tab nested | `- a⏎⇥- b|` | `…⏎⇥␣␣```ds-ct⏎⇥␣␣…` | in item for marked; **LP error card** (MEDIUM-1) |
| list in callout | `> - item|` | `>   ` on every line | saves, pfx `>   ` |
| callout | `> text|`, `> |`, `>|`, `> > |`, `> [!note] Title|`, `>| text`, `  > text|` | prefix `> ` / `>` / `> > ` / `  > ` on every line | all save |
| callout, tail | `> [!note] T⏎> abc|def` | `…⏎> abc⏎> block⏎> def` | saves |
| callout in list item | `- > quote|` | block in item, outside quote | LOW-1 |
| tail tab / 4 spaces | `abc|⇥tail` | `abc⏎block⏎⇥tail` | tail becomes code (LOW-2) |
| backtick run | `abc ```|` | `abc ```⏎block` | yes |
| two inserts, real counter | callout line, then `mid|` | 2 blocks, prefixes `> ` and `''` | yes |

## Real Obsidian (C) — scratch merge `bb608f5b` + SC-443 `ae9025ea` (merge commit `13d7191a`, now removed)
- **Merge:** `git merge --no-edit FETCH_HEAD` was clean, with no conflicts. `suggest.ts` auto-merged (SC-443's `stampControl` line plus SC-675's `insertBlock`). `_cmEditor.ts` is a byte-identical add.
- **SC-443 jest, own branch `ae9025ea`:** `test/dom/authoring` + `e2eCensus`, 20 suites, **751 passed / 751**.
- **On the merge:** 21 suites, 865 tests (751 + 114 `insertOwnLines`), **5 failed, 860 passed**. Diff by test name vs `ae9025ea`:
  - flipped ("Failing test passed even though it was supposed to fail"): `authoringKnownBugs` "compendium reference inserted mid-line", "compendium snapshot … end of a line of text"; `compendiumInsertMatrix:280` SC-462 callout.
  - not flipped, as expected: `authoringKnownBugs:38` "insert command inside a list item" (still a passing `test.failing`).
  - other failures: `dsSuggestMatrix` ×2 (INFO-1).
  - no other change.
- **SC-443 e2e `--element=authoring`, own branch `ae9025ea`:** `65/70 ok, 0 failed, 5 known-bug` (AUTH-I21, AUTH-S09 SC-675; AUTH-G13, G14, K09 SC-679). This is the branch's own number. The ledger's `65/67` is from `64d2d8fd`.
- **Merge, run 1:** `64/70 ok, 3 failed, 3 known-bug`. **Run 2:** identical. Failures: AUTH-I21 and AUTH-S09, "known bug SC-675 appears fixed - remove the marker" (the intended flips), and AUTH-S04 (INFO-1). The SC-679 known-bugs are unchanged.
- **Reviewer drives** (scratch specs `zzSc675Rev*.e2e.ts`, never committed; capture `obsidian-capture/capture.jsonl` and `capture2.jsonl`): 20 cases, all ok except MEDIUM-1 and LOW-1 as described.
  - Callout `C01`–`C06` (Insert command and `/ds`, Source and LP): the block draws in LP and Reading. A real + press writes `current_value: 11` then `12`, every line keeps `> ` / `>   `, and the text around is byte-identical.
  - Plain list `L01`–`L07` (`- item|`, `- |`, `- item⏎␣␣|`, `1. item|`, `- [ ] task|`, `- a⏎␣␣- b|`, `/ds` in `- |`): the block draws inside the item in LP and Reading (screenshots). A + press gives exactly the SC-461 Notice ("… blocks inside lists can't be edited yet") and the file is byte-identical.
  - `P01`/`P02` plain mid-line: saves.
  - One Ctrl+Z restored the note exactly (L01 Source, C01 LP, P01 LP), and Ctrl+Shift+Z brought it back.
  - Cursor after the insert is on the first body character behind the prefix (e.g. `{line 4, ch 2}` `> name: Health`; `{5,4}` for `>   `).
  - **List shape question:** Obsidian draws `- item|`, `- |`, ordered, task and nested (space-indented) inside the item in both Reading and LP. Tab-nested lists: Reading yes, LP error card (MEDIUM-1).

## Gates (D) on `bb608f5b`, sc675 worktree
- `npm run tsc`: rc 0, no output (`tsc-r2.log`).
- `npm run lint`: rc 0 (only the known `.eslintignore` warning; `lint-r2.log`).
- `npx jest`: rc 0, `Tests: 2 skipped, 13816 passed, 13818 total`, `Test Suites: 1 skipped, 300 passed` (`jest-r2.log`). This is base 13702 + 114.
- `styles.css` sha256 is `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on `bb608f5b` (`styles-r2.sha`) and on a fresh `129beb18` build (`styles-base.sha`). Shots / freeze / parity carry.
- Not run (per brief): lifecycle, full e2e, shots, freeze, parity.

## Docs (E)
- `CHANGELOG.md` (`edb841fc`): plain words, accurate, mentions the callout. One overclaim: "A block inserted inside a list item still draws". It does not draw in Live Preview for a tab-nested list (MEDIUM-1), and becomes true once that is fixed. A nit: 7 lines is long for a bullet.
- `docs/writing-blocks.md` and `.repo-docs/architecture.md` are accurate (the same tab caveat applies to "every line is indented under the item").

## Follow-ups (outside this ticket)
1. SC-443 rebase: besides the 6 markers, rewrite `dsSuggestMatrix.test.ts:133`, `:143` and e2e AUTH-S04 to the new indented-token shape (INFO-1). The list marker needs a list-aware assertion (already in the ledger).
2. Observation, pre-existing and not this diff: a counter + press rewrites the body with keys reordered (`name` moves last: `max_value, current_value, min_value, name`). It happens identically for a column-0 block (P01). Possibly known or intended; it is the counter serializer.
3. Obsidian LP does not draw a block inside a tab-nested list inside a callout in any spelling (S11/S12; Reading does). No DSE action.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r2-rev/`)
gates: `gates.sh`, `gates-r2.rc`, `tsc-r2.log`, `lint-r2.log`, `jest-r2.log`, `build-r2.log`, `styles-r2.sha`, `build-base.log`, `styles-base.sha` ·
jsdom probes: `zzSc675RevProbe.test.ts`, `zzSc675RevProbe2.test.ts`, `probe-base.json`, `probe-fix.json`, `probe2-fix.json`, `probe-table.md`, `analyze.js`, `probe-base.log`, `probe-fix.log` ·
implementer tests on base: `jest-ownlines-on-base.log`, `.json` ·
SC-443: `jest-443-auth.log`, `.json`, `jest-merge-auth.log`, `.json`, `e2e-443-own.log`, `e2e-merge-r1.log`, `e2e-merge-r2.log`, `evidence-auth-s04/` ·
real Obsidian: `zzSc675Rev.e2e.ts`, `zzSc675Rev2.e2e.ts`, `zzSc675Rev3.e2e.ts`, `zzSc675Rev4.e2e.ts`, `e2e-zrev-b.log` … `e2e-zrev-e.log`, `obsidian-capture/capture.jsonl`, `capture2.jsonl`, `capture3.jsonl`, `capture4.jsonl`, `obsidian-capture/*.png`.
