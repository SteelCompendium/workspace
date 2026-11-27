# SC-692 r2 independent review — several-cursor insert layout

**Executive summary**
- Verdict: **FIX-REQUIRED (tests only, no product change)**. Head plugin `6b290e01` on `develop` @ `17187e4c`; superproject `634cee2c`. Worktree left as found (plugin clean at `6b290e01`; superproject only ` M draw-steel-elements`, as given).
- Gates I measured match the implementer's numbers exactly: tsc (incl. `-p e2e`) rc 0 · lint rc 0 · jest fresh `15041 passed / 2 skipped` · e2e full `944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` · `styles.css` sha256 `50436d6b…0e37e98` on clean `git archive` builds of both `17187e4c` and `6b290e01` → carry shots 636 / freeze 280/280 / parity 0/0/24. Lifecycle not re-run (no finding touches it).
- O2 holds. jsdom: 270 several-cursor cases (42 note shapes × 3 block kinds × main first/middle/last where distinct) are byte-identical to an independent oracle (the BASE `17187e4c` single-cursor `insertBlock` run bottom-up): text, every cursor, main cursor, one write. Real Obsidian 1.14.4: 22 of 22 non-merged cases byte-identical (editor and saved file, cursors, main), including CRLF, tabs, 12 cursors, reversed selections, containers.
- O3 holds in real Obsidian: one Ctrl+Z restores the note and the cursors; Ctrl+Shift+Z re-applies it; a second Ctrl+Z changes nothing. Typing after the insert lands in every block's first body line. A real Alt-click adds the second cursor as the main one, and it stays the main one after the insert.
- O4 holds in real Obsidian (4 shapes: one Notice, nothing written, cursors unchanged). O5 holds: 156 single-range cases (selection and `/ds` range path) are byte-identical between head and base (text, selections, writes). Compendium reference and Shift inline link with two cursors through the real search window equal the single inserts run bottom-up.
- Findings: HIGH 0 · MEDIUM 1 (the committed tests do not pin the same-line "residue" rule: removing it leaves all 74 SC-692 + SC-687 jest tests and all e2e green, and it writes a fence onto a closing fence) · LOW 2 · INFO 4.

## How I probed (artifacts are in the scratch folder, none committed, all removed from the worktree)

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-review-r2/`

- Gates: `rv2-g1-tsclint.log`, `rv2-j1-jest.log`, `rv2-e1-e2e.log`, `rv2-hash.out` (+ `rv2-hash-build-*.log`).
- jsdom probe `zz-rv2-probe.test.ts` (copied into `test/dom/authoring/` with a base copy of `blockInsert.ts` as `src/authoring/zzBaseBlockInsert.ts` for one run each, then deleted): 426 tests green on head (`rv2-mp-head.log`), results `rv2-jsdom-probe-head.json`.
- Mutation runs: `rv2-mutants.py` (mutant copies `mut-*.ts`), `rv2-mutants.log` (committed tests), `rv2-mutprobe.log` (my probe); `blockInsert.ts` restored and diffed to 0 lines after each run.
- Real Obsidian probe `zz-rv2-probe.e2e.ts` (copied into `e2e/specs/authoring/` only AFTER the full e2e run, run with `--only=ZZR-…`, then deleted): logs `rv2-z1..z4-e2eonly.log`, results `rv2-e2e-probe.json` (+ `rv2-e2e-probe-run1..3.json`), screenshots `rv2-draw-*.png`, `rv2-single-quote-list-{lp,rv}.png`.

## Findings

### MEDIUM-1 — the same-line residue rule (`nextResidue`) is not pinned by any committed test

`src/authoring/blockInsert.ts:158` (`const after = sameLineAsNext ? rest + nextResidue : rest;`), and the branch at `:156` (`ranges[i + 1].from.line === to.line`).

What `nextResidue` is for: when the next cursor on the same line has only a prefix before it (`> `, indentation, nothing), its single insert puts the opening fence ON that line. The earlier cursor must then see that fence as "text after it" and end its own block with a line break. This is the core of O2's "two cursors on one line" rule.

Measured (mutation): replace line 158 with `const after = rest;`. Result: `insertSeveralCursors.test.ts` + `insertRefusal.test.ts` are **74 passed / 74**, and the full e2e has no such shape (AUTH-I48 uses `ab|cd|ef`, where the residue is empty). My probe kills it (20 failures). What a regression would write, note `> [!note] T` + `> | |` (cursors at ch 2 and ch 3 of line 1):

```
> ```ds-x
> foo: 1
> ``` ```ds-x        <- closing fence with an opening fence glued on: the ticket's bug class again
>  foo: 1
>  ```
```

Head writes it correctly (`> ``` ` / `>  ```ds-x` on separate lines), and real Obsidian draws both counters in Live Preview and Reading view (`rv2-draw-prefixOnlySameLine.png`).

Second unpinned branch (same mutation run): `sameLineAsNext` keyed on `ranges[i + 1].to.line` instead of `.from.line` (M9) also leaves all 74 green. It is wrong for a cursor right before a multi-line selection that starts on the cursor's line, `a|«cd\nef»g`: it would add a blank line between the two blocks.

Two more mutants survive but cannot change output (equivalent): see INFO-1.

Prescribed fix (test-only): add to `test/dom/authoring/insertSeveralCursors.test.ts` (next to the same-line tests at ~line 139) `insertAll` cases for
1. `'> [!note] T\n> | |'` (prefix-only line in a callout) and `' | |  '` or `'|  |'` (whitespace-only line), with the exact text written out by hand, plus the oracle comparison the file already does;
2. `'a|«cd\nef»g'` with the cursor as the first range (CodeMirror keeps a cursor and a selection that starts at the same spot as two ranges when the cursor comes first).
Then show both are red with the residue removed (M1) and with `to.line` (M9). Optional: one e2e twin of case 1 in `insert-several-cursors.e2e.ts` (my probe drew it fine in 1.14.4).

### LOW-1 — one comment still says the several-cursor write is a `replaceSelection`

`src/authoring/blockInsert.ts:211`: "Without a range the write goes over EVERY selection range (`replaceSelection` writes at each cursor), so any range with an end inside refuses." Since SC-692 the several-cursor write is `insertAtEveryCursor`'s one `editor.transaction`. Fix: "(one block per range in one `editor.transaction`, SC-692)". The SC-675 paragraph of the header (`:20`, "ONE replaceSelection / replaceRange") is qualified by the SC-692 paragraph below it; acceptable, but "(one cursor)" after "ONE replaceSelection" would make it true on its own.

### LOW-2 — the jsdom stand-in honours `setSelections(ranges, main)`; Obsidian 1.14.4 does not

`test/dom/authoring/_cmEditor.ts` `setSelections` passes `main` to `EditorSelection.create`. Measured in real Obsidian (ZZR-07): `editor.setSelections([A, B], 1)` leaves A (the first) as the main cursor; `transaction({ selections: [X, Y] })` makes X main. The product never calls `setSelections`, so nothing is wrong today, and the e2e README already records the fact. But a jsdom test that sets `main` describes a state a test cannot make the same way in Obsidian. Fix (optional): a one-line comment on `CmEditor.setSelections` saying Obsidian ignores `main` (the e2e helpers put the main range first).

### INFO

- **INFO-1 — two equivalent mutants, by design.** `mapThrough`'s same-line branch (`blockInsert.ts:139`, the column shift) is unreachable while a block has at least two lines (a cursor always ends on a later line than the earlier change's end); dropping the column shift survives both suites. `insertRangesOf`'s `picked.sort` and the overlap join (`:187`) are dead with CodeMirror's already-sorted, already-merged ranges (the implementer listed the join as a blind spot). Fine as defence; no action.
- **INFO-2 — closing fence with two trailing spaces (`ab|  |cd`).** This was the implementer's blind spot. Real Obsidian draws both counters in Live Preview and Reading view. The write path works per block: `+` on the first counter writes only block 1 (11 / 10), then `+` on the second writes only block 2 (11 / 11) (ZZR-09). The plugin's own re-serialise rewrites that closing line to a plain fence, which is harmless.
- **INFO-3 — CodeMirror merges touching ranges, depending on order.** A cursor and a selection starting at the same spot stay as two ranges if the cursor comes first and merge into one if the selection comes first. A cursor at a selection's end always merges. A merged pair is one range, so it takes the unchanged single path. My first real-Obsidian run flagged `cursorThenMultilineSelNoGap/main1` and `selEndingWhereCursorStarts/main0` because my oracle used the unmerged ranges. That was an oracle artefact, not a product difference.
- **INFO-4 — the docs are true and plain.** I checked the plugin CHANGELOG, the workspace CHANGELOG (`634cee2c`), `docs/writing-blocks.md`, AGENTS.md and the e2e README sentence against the measurements above. The commits have no AI trailers. The renamed SC-687 test (`insertRefusal.test.ts:406`) keeps its assertions and is not weakened. No test was deleted. The diff touches no CSS or rendering file.

## Case coverage I ran (beyond the committed suites)

| Area | Where | Result |
|---|---|---|
| O2 jsdom, 42 shapes × scaffold / reference (`endLine`) / plain × main first/mid/last | `rv2-jsdom-probe-head.json` | 270/270 equal to the base single bottom-up (text, cursors, main, 1 write) |
| O5 jsdom, 26 single shapes × 3 blocks × selection / `/ds` range | same run | 156/156 byte-identical to base (text, selections, `writes`) |
| O2 real Obsidian: ticket (main 0, 1), same line with spaces or text, line start+end, adjacent empty, selection then cursor, containers (callout, `- `, `1. `, `10. `, nested, `> - `; main 0/3/6), prefix-only callout line, whitespace-only line, reversed selections, 12 cursors (main 0/5/11), CRLF, existing block between, tabs, text after all cursors | ZZR-01 | 22/22 non-merged cases byte-identical (editor + saved file + cursors + main) |
| Undo / redo (ticket, 12 cursors, same line) | ZZR-02 | one Ctrl+Z → note and original cursors; Ctrl+Shift+Z → result; extra Ctrl+Z is a no-op |
| Typing right after the insert (callout, list, empty, text line; Live Preview) | ZZR-03 | `QZ` lands at the start of every block's first body line |
| Real Alt-click | ZZR-04 | 2 cursors, the clicked one main; after insert main = second block's body line |
| O4 (selection end in block, reversed selection starting in block, cursor in properties, cursor after the fence marker), each + a cursor outside | ZZR-05 | 4/4: one Notice, note and file unchanged, cursors unchanged |
| Draws: same line with spaces, prefix-only callout line, whitespace line, 12 cursors | ZZR-06 | Live Preview and Reading view draw every counter, 0 error cards |
| Compendium reference (Enter) and Shift inline link, two cursors, real search window | ZZR-10 | both equal the single inserts bottom-up; both cursors survive the window |

## Follow-ups (out of scope, pre-existing, left alone)

- A block inserted under a list item inside a plain quote (`> - in callout|`) is not drawn in **Live Preview**: Obsidian shows the fence as text. Reading view draws it. The single-cursor base path does the same (ZZR-08, `rv2-single-quote-list-lp.png` / `-rv.png`), so this is SC-675 / Obsidian territory, not SC-692. It may be Obsidian's own limit for fences in a list inside a quote. Worth a Backlog note if nobody has filed it.
- `/ds` typed at several cursors: the pick replaces only the main cursor's token (`range` path, `setCursor` collapses the cursors), and the other `/ds…` tokens stay as typed text. This is unchanged from base and out of scope per O5. I reasoned it from the code and did not drive it.
