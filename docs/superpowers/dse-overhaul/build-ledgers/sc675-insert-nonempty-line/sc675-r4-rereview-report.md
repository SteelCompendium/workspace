# SC-675 r4 scoped re-review — r3 delta `bb608f5b..f94be393` (superproject `dfadecd9`)

**Executive summary**
- **VERDICT: APPROVE_WITH_FIXES.** The fix still needs one owner ruling (MEDIUM-2). Two LOW / INFO notes. LOW-1 is fixed. MEDIUM-1 is fixed at one tab level (the common nested case) and for ordered lists.
- **MEDIUM-2 (new, found by measuring in real Obsidian):** in a BULLET list nested with 2 or more tabs (`- a⏎⇥- b⏎⇥⇥- c|`, a third level), Reading view does not draw the block. It shows the YAML as one line of inline code. Live Preview draws it.
  - Cause: Obsidian's Reading view does not count a tab in a bullet list as 4 columns, and the r3 width is 4 per tab.
  - Measured: Reading draws at 8–11 spaces under `⇥⇥⇥- d`, but not at 12 or 14 (r3 writes 14). Under `⇥⇥- c` it draws at 4–9 spaces, but not at 10 (r3 writes 10).
  - No spelling satisfies both CommonMark and Obsidian Reading at 2+ tabs. This needs a ruling: change the width rule, or accept the limit and file a follow-up.
- Requested Obsidian cases all draw inside the item in Live Preview and Reading view, with no error card: `- a⏎⇥- b|`, `- a⏎⇥- |`, `- item⏎⇥|`, `> [!note] T⏎> - a⏎> ⇥- b|` and `1. a⏎⇥1. b|`. A + press gives only the SC-461 Notice; the file stays byte-identical.
  - `- a⏎⇥- |`: Obsidian draws a nested EMPTY bullet holding the counter, not a setext heading.
  - The same starting note under base drew in Reading only. Under r2 it drew in Reading but showed an error card in LP.
- LOW-1 is fixed. `- > [!note] T|`, `- > quote|` and `1. > [!tip] T|` put the block inside the callout (prefix `␣␣> ` / `␣␣␣> `). Reading view draws it, and a real + press now SAVES with the prefix kept. Live Preview shows the callout as raw source: Obsidian does not draw a callout nested in a list item in Live Preview at all, even with plain text in it (INFO-A).
- The jsdom probe set (241 rows) shows 12 differences from r2. All 12 come from the two fixes. The empty-line case is byte-identical to base. The user's own tab is kept (`- item⏎⇥|` gives `⇥```ds-ct`, body in spaces). Integrity holds on all 330 rows.
- New tests are not vacuous: run on bb608f5b's `blockInsert.ts`, 26 of 134 fail (exactly the 24 new matrix rows + 2 new round-trip rows). The `'\t- item'` case is gone.
- Gates (scratch worktree at f94be393): tsc 0, lint 0, jest `13834 passed / 4 skipped, 300 suites + 1 skipped` = expected 13836/2. The +2 skipped are `token-coverage.test.ts`, which skips outside a superproject checkout; the total is 13838 in both. `styles.css` `18730938…f1f9` unchanged.
- SC-443 merge: clean, no conflicts. jest 880/885 with 5 failed: the same 5 as r2. e2e authoring `64/70 ok, 3 failed, 3 known-bug` ×2 runs, same as r2. Scratch worktrees removed; nothing was put in the sc675 worktree.

## Findings

### MEDIUM-2 — 3rd-level (2+ tab) bullet nesting: Reading view does not draw the inserted block
`src/authoring/blockInsert.ts:72-76` (`blockContextOf`, the list branch: `' '.repeat(contentColumn)` with `columnAfter` counting a tab as 4).

Failure (Obsidian 1.14.4, Insert Counter, Source mode):
- before `- a⏎⇥- b⏎⇥⇥- c|`
- after `- a⏎⇥- b⏎⇥⇥- c⏎` + 10 spaces + ```` ```ds-ct ```` ⏎ 10 spaces + `name: Health` … (ZR4-T08)
- Live Preview: the counter draws. Reading view: no element and no error card; the block shows as inline code text `ds-ct name: Health current_value: 10 …` under `c` (screenshot `obsidian-capture/T08-reading.png`).

Seeded widths, the same block (`capture-r4b.jsonl`, `capture-r4c.jsonl`; "depth" = the number of `<li>` around the drawn element in Reading):

| list | spaces → Reading | LP |
|---|---|---|
| `- a⏎⇥- b` (1 tab) | 2–3: depth 1 (item a); 4–5: depth 2 (b); **6 (r3): depth 2, ok** | draws at every width |
| `- a⏎⇥- b⏎⇥⇥- c` (2 tabs) | 4–9 draw; **10 (r3): nothing** | draws at every width |
| `- a⏎⇥- b⏎⇥⇥- c⏎⇥⇥⇥- d` (3 tabs) | 8–11: depth 4 (item d); **12, 14 (r3 = 14): nothing** | draws |
| `1. a⏎⇥1. b⏎⇥⇥1. c` (ordered, 2 tabs) | 7–10: depth 2; **11 (r3) and 13: depth 3 (item c), ok** | draws |
| r2 spelling `⇥⇥␣␣` (2 tabs, bullets) | draws | parse-error card |

So for bullets, Obsidian Reading puts a nested item's content at 2 + 2 per leading tab, not 2 + 4 per tab. Ordered items in the same test follow 4 per tab. Strict CommonMark (`marked`) wants 4 per tab. At 2+ tabs no width satisfies both.

This is not a regression against base, where the block was glued and broken. Against r2 (unlanded) it trades an LP error card for a Reading miss at 3+ levels. The 2-level case, the common one, works in both modes.

**Fix (owner ruling), one of:**
- (a) Measure the way Obsidian reads it. In a BULLET item, count each leading tab as 2 columns. Measured to work in both modes at 1, 2 and 3 tabs: 1 tab → 4–7 (r3's 6 is in range), 2 → 6–9, 3 → 8–11. Keep 4 per tab for ordered items. This gives up strict CommonMark nesting for bullet lists at 2+ tabs; other renderers do not draw DSE blocks anyway.
- (b) Accept the limit: list blocks cannot save anyway (SC-461). File a follow-up "3rd-level tab-nested bullet: inserted block shows as text in Reading view", and say so in `docs/writing-blocks.md`.

If (a), add a jsdom row for `- a⏎⇥- b⏎⇥⇥- c|` with the chosen width. It cannot be oracle-checked with `marked`, so it is exact text only.

### LOW-3 — CHANGELOG bullet (`dfadecd9`): "draws" overclaims twice, and "(as before)" is ambiguous
`CHANGELOG.md` `## Unreleased`, SC-675 bullet, line 2: "Inside a list item every line is indented under the item (a block inside a list item draws but can't save yet, as before)."
- It does not draw in Reading view for 3+-level tab-nested bullets (MEDIUM-2). It does not draw in Live Preview for a callout inside a list item (INFO-A, Obsidian).
- "as before" reads as if the block drew before. Before the fix it was glued and drew nothing.
- It under-claims one improvement: a block in a callout inside a list item (`- > [!note] T`) now SAVES.

**Fix:** after the MEDIUM-2 ruling, something like: "Inside a list item every line is indented under the item; such a block draws but can't save yet. In a callout inside a list item, it saves."

### INFO-A — a callout inside a list item: Live Preview shows the inserted block as source
ZR4-Q01, Q02, Q03b and Q04. Reading view draws the counter inside the callout and a + press saves (`  > current_value: 11`, every line keeps `␣␣> `). Live Preview shows the callout as raw `> [!note] T` lines with the YAML as code (screenshot `obsidian-capture/Q01-lp.png`).

Obsidian's own limit: a seeded `- > [!note] T⏎  > plain text line` is not drawn as a callout in Live Preview either (F-quote-list-plain). r2's spelling (block outside the callout) drew in LP but could not save. The r3 placement is the correct one; no action. A one-line mention could go under "What doesn't work yet".

### INFO-B — `- > - x|` (a list inside a quote inside a list item)
The block goes inside the quote (`␣␣> `) but not under the inner `- x` (marked: `list>item>blockquote>code`). Same family as LOW-1, one level deeper; it saves. Rare; no action.

## 1. MEDIUM-1 in real Obsidian (scratch merge f94be393 + SC-443 ae9025ea = `6cf07824`)
Note text after the insert (`Intro line above⏎⏎` before and `⏎⏎Outro line below⏎` after are byte-identical in every case); `capture-r4.jsonl`, `capture-r4b.jsonl`.

| id | via / mode | before | after (inserted part) | LP | Reading | + press |
|---|---|---|---|---|---|---|
| T02 | cmd / LP | `- a⏎⇥- b\|` | `- a⏎⇥- b⏎` 6sp ```` ```ds-ct ```` … | counter, no error | counter in nested item (UL LI UL LI) | SC-461 Notice ×2 (LP, Reading), file byte-identical |
| T01 | cmd / LP | `- a⏎⇥- \|` | `- a⏎⇥- ⏎` 6sp block | counter | counter in nested item | Notice, byte-identical |
| T05 | /ds / Source | `- a⏎⇥- \|` | same as T01 | counter | counter in nested item | Notice, byte-identical |
| T06 | cmd / LP | `- item⏎⇥\|` | `- item⏎⇥```ds-ct⏎` 4sp body (user's tab kept) | counter | counter in item | Notice, byte-identical |
| T07c | cmd / LP | `> [!note] T⏎> - a⏎> ⇥- b\|` | `>` + 7sp on every line | counter | counter (callout > UL LI UL LI) | Notice, byte-identical |
| T07 | cmd / LP | `> - a⏎> ⇥- b\|` (plain quote) | same spelling | nothing (Obsidian LP draws no block in a plain blockquote, CALL-R03 doc) | counter | Notice, byte-identical |
| T09 | cmd / LP | `1. a⏎⇥1. b\|` | 7sp block | counter | counter (OL LI OL LI) | Notice, byte-identical |
| T08 | cmd / Source | `- a⏎⇥- b⏎⇥⇥- c\|` | 10sp block | counter | **nothing: inline code text** | LP Notice, byte-identical (MEDIUM-2) |

**`- a⏎⇥- |` across rounds**, seeded with each round's exact output text (B-base / B-r2 / B-r3):

| round | LP | Reading |
|---|---|---|
| base | nothing | counter |
| r2 | parse-error card | counter |
| r3 | counter | counter |

The starting note alone (`- a⏎⇥- `, B-start) draws in Reading as two nested bullets, the second empty. No heading. Obsidian does not apply the setext rule that `marked` applies here.

## 2. LOW-1 in real Obsidian

| id | via / mode | before | after | LP | Reading | + press (Reading) |
|---|---|---|---|---|---|---|
| Q01 | cmd / LP | `- > [!note] T\|` | `␣␣> ` on every block line | source (INFO-A) | counter in callout in item | **saved** `␣␣> current_value: 11`, prefix kept |
| Q02 | cmd / Source | `- > quote\|` | `␣␣> ` | source | counter in quote in item | saved, prefix kept |
| Q03b | /ds / Source | `- > [!note] T \|` | `- > [!note] T ⏎␣␣> ```ds-ct…` | source | counter | saved, prefix kept |
| Q04 | cmd / LP | `1. > [!tip] T\|` | `␣␣␣> ` | source | counter in callout in OL item | saved, prefix kept |

ZR4-Q03 (`/dscounter` typed straight after `T`, no space) failed in my spec: the suggestion list never opened. That is the `/ds` word-boundary trigger working as designed, not the fix. Q03b with a space is the real case.

## 3. No regression from the delta (jsdom, 4 paths, real CodeMirror 6 state)
- r2 probe set re-run on f94be393 (`probe-r4.json`) and diffed with r2's `probe-fix.json`: 12 of 241 rows differ.
  - `tab list` ×4 paths: `⇥␣␣` → 6 spaces. (`⇥- item` at column 0 is still indented code; same render result.)
  - `tab continuation` ×4: the body goes from `⇥` to 4 spaces; the user's `⇥` before the fence is kept.
  - `callout inside list item` (`- > quote|`) ×4: the block moves into the quote, prefix `␣␣> `. DSE now locates it (dse 0 → 1) and `replaceFenceBlock` writes it.
  - Nothing else changed.
- All 241 rows: one editor change, the inverse restores the note, lines above and below byte-identical, cursor on the first body character.
- Empty-line cases (empty note, `|⏎next`, `above⏎|⏎below`) on all 4 paths: byte-identical (text + cursor) to r2's real base build (`probe-base.json`).
- 22 extra cases (`probe2-r4.json`, ×4 paths = 88 rows + 1): r3 vs bb608f5b's helper (`probe2-r2src.json`); integrity holds on every row. User characters on the cursor line are never rewritten:
  - `- item⏎⇥|` → `⇥```ds-ct`
  - `- item⏎⇥|tail` → `⇥```ds-ct⏎…⏎····tail`: the tail keeps its text but gets the 4-space prefix instead of a tab. That is the moved-tail rule (prefix + tail), not a rewrite of the tail.
  - `para⏎⇥␣␣|` → `⇥␣␣```ds-ct` + 6-space body.

## 4. New tests
- `insertOwnLines.test.ts` on f94be393: 134 tests. With bb608f5b's `src/authoring/blockInsert.ts` swapped in (scratch worktree only): **26 failed / 108 passed**. The 26 are the 6 new matrix rows (lines 182-187) × 4 paths, plus the 2 new round-trip rows (lines 287-288).
- `'\t- item'` is replaced by `'- a\n\t- b'` and `'- a\n\t- '`; `'- item\n\t'` now expects a 4-space body.

## 5. Gates on f94be393 (scratch worktree, fresh `npm ci`)
- tsc rc 0 (`tsc-r4.log`); lint rc 0 (`lint-r4.log`); build rc 0.
- jest rc 0: `Tests: 4 skipped, 13834 passed, 13838 total`; `Test Suites: 1 skipped, 300 passed` (`jest-r4.log`). The 2 extra skips are `test/dom/framework/token-coverage.test.ts:56`, which skips when the workspace token map is not found (a scratch worktree has no superproject). In the sc675 worktree the expected count is 13836 / 2; the total of 13838 matches.
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (`styles-r4.sha`).

## 6. SC-443 merge facts on the new sha
- `git merge --no-edit FETCH_HEAD` (ae9025ea) into f94be393 → `6cf07824`. No conflicts; `suggest.ts` auto-merged.
- jest `test/dom/authoring` + `e2eCensus`: 21 suites, **885 tests (751 + 134), 880 passed, 5 failed**. The 5 are the same set as r2:
  - 3 markers flip: `authoringKnownBugs` reference mid-line, snapshot after text, and `compendiumInsertMatrix:280` SC-462.
  - 2 are `dsSuggestMatrix:133/:143` (INFO-1, already in the ledger).
  - The list marker still does not flip. No other test changed against r2's merge.
- e2e `--element=authoring`, run 1 and run 2: **`64/70 ok, 3 failed, 3 known-bug`** both times. Failures: AUTH-I21 and AUTH-S09 ("appears fixed - remove the marker") and AUTH-S04 (INFO-1). The SC-679 known-bugs (G13, G14, K09) are unchanged. Identical to r2.

## 7. CHANGELOG
Shorter and plain. Accurate except the list sentence (LOW-3).

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r4-rev/`)
- gates: `setup-gates.sh`, `tsc-r4.log`, `lint-r4.log`, `jest-r4.log`, `build-r4.log`, `styles-r4.sha`, `npmci-fix.log`, `npmci-merge.log`
- jsdom: `zzSc675R4Probe.test.ts`, `zzSc675R4Probe2.test.ts`, `probe-r4.sh`, `probe-r4.json`, `probe2-r4.json`, `probe2-r2src.json`, `jest-ownlines-on-r2src.json` (and `.log`)
- r2 comparison base: `../sc675-r2-rev/probe-fix.json`, `../sc675-r2-rev/probe-base.json`, `../sc675-r2-rev/jest-443-auth.json`
- SC-443: `merge-runs.sh`, `jest-merge-auth.json` (and `.log`), `e2e-merge-r1.log`, `e2e-merge-r2.log`
- Obsidian:
  - specs: `zzSc675R4.e2e.ts`, `zzSc675R4b.e2e.ts`, `zzSc675R4c.e2e.ts`
  - logs: `e2e-zr4-a.log`, `e2e-zr4b-a.log`, `e2e-zr4c-a.log`
  - captures: `obsidian-capture/capture-r4.jsonl`, `capture-r4b.jsonl`, `capture-r4c.jsonl`
  - screenshots: `obsidian-capture/*.png` (e.g. `T08-reading.png`, `Q01-lp.png`, `B-*-lp.png`)
