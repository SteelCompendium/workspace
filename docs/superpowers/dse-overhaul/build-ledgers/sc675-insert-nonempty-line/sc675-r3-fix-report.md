# SC-675 r3 fix report

## r3

**Executive summary**
- STATUS: DONE. MEDIUM-1 (spaces, never tabs, on inserted list indentation) and LOW-1 (`- > [!note] T|` stays in the callout) fixed; test nit replaced; CHANGELOG bullet replaced with the exact brief text.
- dse `f77ee1a0` (fix), `08e253c1` (tests), `f94be393` (docs); superproject `dfadecd9` (CHANGELOG). `origin/develop` still `129beb18`.
- jest 13836 passed / 2 skipped, 300 suites + 1 skipped. r2 was 13816, delta +20 = tests added (16 matrix: 4 paths x (6 rows replacing 2); +2 round-trip rows; +2 Markdown-oracle cases), none removed.
- tsc rc 0, lint rc 0, build rc 0. `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (unchanged).

## Changes
- MEDIUM-1, `src/authoring/blockInsert.ts` `blockContextOf` (about :66-78): list prefix is `quote + ' '.repeat(contentColumn)` (columns via `columnAfter`, tab to next multiple of 4); non-list / whitespace-only prefix is `quote + ' '.repeat(columnAfter(indent))`. The first fence line still goes right behind the user's own whitespace (`hasTextBefore` false), so no user character is rewritten. Header and function comments updated.
- LOW-1, same function: after a list marker, `quoteMarkersOf(rest.slice(list[0].length))` is appended to the prefix.
- Tests, `test/dom/authoring/insertOwnLines.test.ts`: the `'\t- item'` and old tab-continuation rows are replaced by six rows run on all four paths (exact text); two LOW-1 rows added to the framework round-trip table; three `marked` cases added.
- Docs: `.repo-docs/architecture.md` (spaces only, quote after the marker). `docs/writing-blocks.md` needed no change. CHANGELOG: bullet replaced (superproject).

## Before -> after (Insert command, scaffold `a: 1 / b: / "  c: 2"`; `⇥` = tab)
| spec | after |
|---|---|
| `- a⏎⇥- b\|` | `- a⏎⇥- b⏎······```ds-ct⏎······\|a: 1⏎······b:⏎········c: 2⏎······``` ` (6 spaces; was `⇥␣␣`) |
| `- a⏎⇥- \|` | `- a⏎⇥- ⏎······```ds-ct⏎······\|a: 1 …` (6 spaces) |
| `- item⏎⇥\|` | `- item⏎⇥```ds-ct⏎····\|a: 1⏎····b:⏎······c: 2⏎····``` ` (user's tab kept before the fence, body in 4 spaces; was `⇥` on every line) |
| `> - a⏎> ⇥- b\|` | `> ` + 6 spaces on every inserted line |
| `- > [!note] T\|` | `- > [!note] T⏎␣␣> ```ds-ct⏎␣␣> \|a: 1⏎␣␣> b:⏎␣␣>   c: 2⏎␣␣> ``` ` (was `␣␣```ds-ct`, outside the callout) |
| `- > quote\|` | same, prefix `␣␣> ` |

The framework read-back (`listFences` / `matchFenceMarker` / `blockBodyLines` / `replaceFenceBlock`) finds both LOW-1 blocks with prefix `␣␣> ` and rewrites them in place.

## Notes
- `marked` reads `- a⏎⇥- ` (an EMPTY item right under a paragraph line) as a setext heading underline, as CommonMark does; that is the note's own text, so `- a⏎⇥- |` is covered by the exact-text matrix but not by the `marked` oracle (comment in the test). `- a⏎⇥- b|` and `- item⏎⇥|` are in the oracle and pass.
- Not re-measured in real Obsidian (no e2e this round).

## Gates and logs (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r3-fix/`)
`tsc.log` / `tsc.rc`, `lint.log` / `lint.rc`, `build.log` / `build.rc`, `styles.sha`, `jest-full.log` / `jest-full.rc`; focused runs `jest-auth-a1.log` (one failing marked case before the oracle-list change), `jest-auth-a2.log` (green); `marked-probe.log`.
