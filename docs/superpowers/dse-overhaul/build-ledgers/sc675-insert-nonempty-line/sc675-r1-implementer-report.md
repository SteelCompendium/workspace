# SC-675 r1 implementer report

**Executive summary**
- STATUS: DONE_WITH_CONCERNS. All four block-insert paths (Insert command, /ds pick, compendium reference, compendium snapshot) go through ONE helper, `src/authoring/blockInsert.ts`; SC-462 (callout `> ` prefix) is folded in.
- dse branch `sc675-insert-nonempty-line`: `68c800ed` (test helper), `c9b03a90` (fix + tests), `bb608f5b` (docs). Superproject `edb841fc` (CHANGELOG only; the submodule pointer is left unstaged for wt-finish).
- jest 13816 passed / 2 skipped / 300 suites passed + 1 skipped (fresh worktree). Base fresh 13702 / 2, so delta +114 = exactly the 114 tests of the new `insertOwnLines.test.ts`. Existing tests: none removed; 3 edited (see below).
- tsc clean (includes `-p e2e`), lint clean exit 0. styles.css sha256 identical on my sha and a clean 129beb18 build: `18730938...f1f9`.
- CONCERN (needs owner decision): a list-indented inserted block draws, but the SC-455 write path (and SC-443's e2e scanner `scanFences`, which is built on `matchFenceMarker`) cannot address a fence indented inside a list item. That is the documented existing limit ("blocks inside lists can't be edited yet", docs/writing-blocks.md). So the SC-443 jsdom marker for the list case ("insert command inside a list item", `insertOutcomeProblem(..., {indented:true})`) will NOT flip with a correctly indented block: `scanFences` finds 0 fences. I verified this on a scratch copy of the SC-443 files (untracked, deleted afterwards). The other three SC-443 markers (compendium reference mid-line, snapshot after text, SC-462 callout) flip green.
- Chosen shape for `- item|` and `- |`: the marker line is kept as is; the block goes on the next lines at the item's continuation indentation (`- item⏎  ```ds-ct …`, `- ⏎  ```ds-ct …`). Verified with `marked` as the CommonMark oracle: the fenced code sits inside the item.

## Helper rules as built (`|` = cursor)

Prefix P = quote markers of the line (`quoteMarkersOf`, new, in blockPrefix.ts) + (list item: its leading whitespace kept character for character, then spaces up to where the item text starts; CommonMark: marker + 1-4 spaces, 5+ spaces count as 1) or (otherwise: the line's own leading whitespace). Text before cursor = anything after P on the line before the cursor.

| Cursor context | Result |
|---|---|
| `|` (empty line, no prefix) | block exactly as before; scaffold cursor on first body char; compendium: block + `\n`, cursor after it |
| `abc|` | `abc⏎```ds-ct⏎…⏎``` ` (fence on its own line) |
| `abc|def` | `abc⏎block⏎def` |
| `|tail` | `block⏎tail` |
| `ab«XY»cd` (selection, also across lines) | `ab⏎block⏎cd`, only the selection removed |
| `/dsct| tail` (suggest) | `block⏎ tail` (token removed only; the space after it is kept) |
| `abc /dsct| tail` | `abc ⏎block⏎ tail` |
| `- item⏎␣␣|` (ticket case) | `- item⏎␣␣```ds-ct⏎␣␣body…⏎␣␣```` (first fence line goes on the cursor line behind the indent already there) |
| `- item|` / `- |` | marker line kept, block on the next lines at 2 spaces |
| `1. item|` / `10. item|` / `- [ ] t|` / `* i|` | indent 3 / 4 / 2 / 2 spaces |
| `- a⏎␣␣- b|` | indent 4 |
| `⇥- item|` / `- item⏎⇥|` | tab kept: `⇥␣␣` / `⇥` |
| `- item|tail` | `- item⏎␣␣block⏎␣␣tail` |
| `> [!note]⏎> |` | `> ```ds-ct⏎> body⏎> ```` |
| `> abc|` / `> abc|def` | block on `> ` lines; `def` on its own `> ` line |
| `> > |` | `> > ` on every line |
| `> - item|` | `>   ` (list indent inside the callout) on every line |
| blank line inside a scaffold body | `>` in a callout (`addBlockPrefix` rule), the indentation alone in a list item |
| text after the cursor is whitespace only | no line break added (CommonMark allows trailing spaces after a closing fence) |

Compendium inserts keep their trailing line break (`endLine`): the cursor is left on a new line carrying P. The scaffold paths add a line break after the closing fence only when text follows. No blank line is ever added. One `replaceSelection` (or one `replaceRange` for the /ds token): one change, one undo step (asserted via `writes.length === 1` and exact from/to).

## Design choices ("your call")
- List shape (above). Why: CommonMark spec has `-⏎  foo` as an item containing foo (blank-start item); the fence-on-the-marker-line shape (`- ```ds-ct`) would also work, but the single rule "text before cursor stays, block starts on the next line" is the same for `- item|` and `- |`.
- Pure-indentation prefix is written verbatim, also on empty body lines (a whitespace-only line in a list item); `addBlockPrefix` is only used for prefixes that contain `>`, because its marker-space rule would add a space after a tab prefix.
- `blockPrefix.ts` extended by ONE small export, `quoteMarkersOf(line)` (the leading `(?:[ ]{0,3}>[ ]?)+`), so the quote pattern is not parsed a second way in authoring. `FENCE_MARKER` itself is untouched.
- Whitespace-only text before the cursor is taken as the prefix, whatever its width (a 4+ space whitespace-only line outside a list stays an indented-code shape, as before; a nested list continuation line at 4 spaces is legitimate).

## Files changed
- new `src/authoring/blockInsert.ts`; edited `src/authoring/insert.ts`, `suggest.ts`, `compendiumInsert.ts` (`insertInlineLink` / `copyCode` untouched), `src/framework/host/blockPrefix.ts`.
- tests: new `test/dom/authoring/insertOwnLines.test.ts` (114 tests), new `test/dom/authoring/_cmEditor.ts` (byte-identical copy of SC-443 `ae9025ea:test/dom/authoring/_cmEditor.ts`, not edited).
- edited existing tests: `insert.test.ts` (2 expectations: cursor after text now writes a leading `\n`; cursor mid-line lands on line 7), `suggest.test.ts` (1: `  /dsroll` indentation is now carried, cursor col 2), `compendiumInsertScenarios.test.ts` (the fake editor gained `getCursor` / `getLine`, no expectation changed). The unchanged working-case tests (empty line) pass unmodified.
- docs: `docs/writing-blocks.md`, `.repo-docs/architecture.md`; `CHANGELOG.md` (superproject, `## Unreleased` bullet).

## Gates (logs in scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r1-impl/`)
- tsc: rc 0 (`tsc-r1.log`, `tsce2e-r1.log`). lint: rc 0 (`lint-r1.log`). jest: rc 0, `Tests: 2 skipped, 13816 passed, 13818 total`, `Test Suites: 1 skipped, 300 passed` (`jest-full-f1.log`, `jest-full-f1.rc`). Delta vs 13702 / 2: +114 passed, +0 skipped.
- styles.css: mine `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (`styles-mine.sha`, `build-mine.log`), clean 129beb18 (git archive built in `base129/`) the same (`styles-base.sha`, `build-base.log`). So shots / freeze / parity carry. Lifecycle / e2e / shots / freeze / parity not run (per brief).
- Earlier runs: `jest-own-red1.log` / `jest-own-red2.log` (red before the fix: 104 of 114 failed), `jest-own-g1.log`, `jest-auth-a1.log` (before test edits), `jest-auth-a2.log` (with the SC-443 scratch markers).

## Markdown oracle
The list round-trip test uses `marked` (a devDependency) loaded by path (`jest.requireActual('../../../node_modules/marked/lib/marked.umd.js')`) because its `main` is ESM and jest does not transform it. For `- item|`, `- |`, `- item⏎␣␣|`, `1. item|`, `- [ ] task|`, `- a⏎␣␣- b|` the fenced code (lang `ds-ct`, exact body) sits inside the item; with `- item|tail` the tail is text of the same item after the code. Callout cases are read back by the product's own `listFences` / `matchFenceMarker` / `blockBodyLines` / `replaceFenceBlock` with the expected prefix (`> `, `> > `, `>   `), and the rewrite keeps every line under the prefix.

Not verified in a real Obsidian (no e2e this round): that Live Preview / Reading view draw the block under a blank-start item (`- ` then the indented fence). CommonMark and `marked` say yes.

## Drive-by fixes
- none beyond the stale header comment in `insert.ts` / `suggest.ts` (updated as far as it became inaccurate).

## Follow-ups
1. SC-443 marker for the list case cannot flip as written (concern above). Options for the owner: a new ticket "write path / `matchFenceMarker` addresses a fence indented inside a list item" (SC-455 left it unsupported; docs/writing-blocks.md "What doesn't work yet"), and at SC-443's rebase turn that one marker into a plain test that asserts the block is indented and closed by a scanner that knows list indentation (or assert it with `marked`, as here). The brief's "a later + on an inserted counter inside a list must write correctly" is therefore only true for callouts and list-in-callout (`>   `), not for a plain list item.
2. A whitespace-only line indented 4+ spaces outside any list (`    |`) still yields an indented-code shape; the helper does not look at previous lines to find out whether a list item is open. Same as before the fix.
3. `/ds` trigger can still fire where it should not (SC-676) and `schemaSuggest.ts` is untouched (SC-678 / SC-679), as scoped.
4. The SC-443 e2e specs (AUTH-I21, AUTH-S09) assert real-Obsidian outcomes; the owner's e2e run on the final sha should show them flipping from known-bug.
