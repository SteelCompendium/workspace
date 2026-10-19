# SC-290 implementer report

**Executive summary (R3, current)**
- Verdict: DONE. Branch `sc290-info-string`, base `a89ffd9` (origin/develop tip, re-fetched, unmoved), head `c78a06b` (3 commits: `437489c` fix + unit tests, `1c3b57a` e2e + changelog, `c78a06b` R3 LOW-1 rows). Not pushed.
- tsc (incl. `tsc -p e2e`) clean; lint clean. jest: `Tests: 1 skipped, 4787 passed, 4788 total`, `Test Suites: 1 skipped, 227 passed, 227 of 228 total` (4769 + 14 + 4).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`. e2e: `OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`.
- shots 572 PNGs, 0 FAIL; `freeze OK (276/276 frozen print PNGs byte-identical ...)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- The R1 summary (head 013063a on base 0d69ec9) is superseded; its body is kept below. See `## R3` at the end.

## Root cause
`SidebarBlockHost.replaceSource` and `ReadingModeBlockHost.replaceSource` rebuilt the opening fence as
`${fence}${language}` where `language` is the `\S*` first token of `OPEN_FENCE`, so everything past the
first token (the rest of the info string) was dropped on every interactive write.

## Fix / files changed
- NEW `src/framework/host/fenceLine.ts`: exports `OPEN_FENCE`, `parseOpenFenceLine(line)` -> `{fence, language, info}`
  (`info` = everything after the fence run, `trimEnd()`ed) and `emitOpenFenceLine(open)` = `${fence}${info}`.
- `SidebarBlockHost.ts`: drops its re-declared `OPEN_FENCE` + local `parseOpenFence`; uses the helper.
- `ReadingModeBlockHost.ts`: imports `OPEN_FENCE` (still used by `locateUnterminatedTrailingFence`) and wraps
  `parseOpenFenceLine` in its existing `parseOpenFence(text, lineStart)`; re-emit uses `emitOpenFenceLine`.
- Tests: `test/dom/framework/sidebarBlockHost.test.ts`, `test/dom/framework/reading-mode-host.test.ts`.
- e2e: `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` (+`[RECOV-I01]`), NEW fixture
  `e2e/vaults/shipped/Stamina/info-string.md`, `e2e/README.md` fixture table row.
- `CHANGELOG.md` (DSE): one `[FIX]` bullet at the top of the `7.0.0 (unreleased ...)` section (the file has no literal
  "Unreleased" heading; that is the open section). Workspace CHANGELOG untouched.

## Judgment calls
- Trailing whitespace of the fence line (incl. a CRLF `\r`) is still dropped, as today: `info` is `trimEnd()`ed. This keeps
  every language-only fence byte-identical to before (including ones with trailing spaces). Interior spacing and extra
  tokens are preserved exactly. Pinned by a test in each host.
- Side effect (improvement): a fence with a space before the language (`` ``` ds-counter ``, which `anchor.ts` locates because
  it trims) used to be re-emitted as a bare `` ``` `` (language lost); it now round-trips unchanged.
- No code path lengthens the fence (both reuse the live `openFence.fence`), so there is no "lengthened" case to test; the
  4-backtick-with-info-string case is covered. Closing fence emission is untouched.

## Writers checked
- `SidebarBlockHost.replaceSource`: fixed.  `ReadingModeBlockHost.replaceSource`: fixed.
- `LivePreviewBlockHost`: stub (`replaceSource` throws NOT_IMPLEMENTED), no fence re-emit. Nothing to fix.
- `FormModal`, `prefOverrides`, `collapsedKey`, element models/views: only call `host.replaceSource`; no fence-line building.
- `src/authoring/scaffold.ts` (`'```' + alias`): builds NEW blocks for insertion, not a write-back. Not applicable.
- `src/utils/CodeBlocks.ts` (legacy `updateMarkdownCodeBlock` / `updateCanvasCard`): re-emits `` '```' + language `` and would
  drop the info string, but see Follow-ups: no `src/` caller remains (only comments and `test/unit/utils/code-blocks.test.ts`).
  Left untouched.

## Tests and FAIL-on-base counts
Jest (14 new): per host, `test.each` x6 (`ds-counter extra`; `ds-counter  foo bar`; tilde + info string; 4-backtick +
info string; language-only backtick; language-only tilde) + 1 trailing-whitespace guard.
- Run on 0d69ec9 host sources (src stashed, new tests kept): `Tests: 8 failed, 27 passed, 35 total` across the two files.
  The 8 failures = the 4 info-string cases per host. The 6 language-only / trailing-whitespace guards pass on base by
  design (they pin "byte-identical to today"; they cannot fail on the unfixed code). Log:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc290-new-base.log`
- With the fix: 35/35 pass.
e2e (1 new): `[RECOV-I01]` on `Stamina/info-string.md` (fence `` ```ds-stamina-bar  extra words ``, double space): clicks
Catch Breath in Reading view, asserts one write and that the note still contains the exact fence line plus the new body.
Used the existing `recov.catch-breath` click pair, so coverage stays 47/47 and no manifest change was needed. It reads raw
note lines because `dse.expectNoteBlock`'s reader only matches bare-language fences (not changed). On base host sources:
FAIL (`Expected "```ds-stamina-bar  extra words"`, received `"```ds-stamina-bar"`).
Log: `.../scratchpad/sc290-e2e-only-base.log`.

## Environment note
First jest run in the fresh worktree read `2 skipped` / 4745 passed because `visual-harness/dist/obsidian-app.css` did not
exist yet (an `it.skip` in `printTwinDeltaAllowedSet.test.ts`); after `npm run shots` populated it, the rerun is the 1-skipped
figure above (4746 passed).

## Drive-by fixes:
none.

## Follow-ups:
- `src/utils/CodeBlocks.ts` is effectively dead (only referenced by comments and its own unit test) and still carries the
  same `` '```' + language `` re-emit in `updateMarkdownCodeBlock` and `updateCanvasCard`. Suggest a ticket to delete it (and
  its tests) rather than patch it.
- `dse.expectNoteBlock` / `readBlock` (`e2e/driver/dse.ts`) and the `mocks/obsidian-core.ts` `makeFakeContext` section scan
  only recognise bare-language fences, so they cannot express info-string fences; left as-is (out of scope).
- `SidebarBlockHost` does not locate blocks in CRLF notes (anchor lookup fails on a trailing `\r`), observed while writing the
  trailing-whitespace test; pre-existing, unrelated.

## Evidence artifacts
Scratchpad root: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`
- Gate logs: `sc290-run1/{tsc,lint,jest,jest2,lifecycle,e2e,shots,freeze,parity}.log`
- Base-failure proofs: `sc290-new-base.log` (jest), `sc290-e2e-only-base.log` (e2e); fixed: `sc290-new-fixed.log`, `sc290-e2e-only-fixed.log`

## R3

Fix round from the independent review (APPROVED 013063a, one LOW).
- **Rebases.** origin/develop moved 0d69ec9 -> 7644fb3 -> f8e050f -> a89ffd9 during the round; final base `a89ffd9`
  (`git fetch` re-run before and after the battery; unmoved). One conflict: `CHANGELOG.md` when rebasing onto f8e050f
  (SC-324's bullet vs my SC-290 bullet, both at the top of the 7.0.0 list). Resolved by keeping both, SC-324 first.
  The a89ffd9 rebase was clean. No package.json / lockfile change on any of the new bases, so no `npm ci`.
  e2e `[RECOV-I01]` still drives `recov.catch-breath` and passes on the final base.
- **LOW-1.** Added two rows to both `test.each` tables (`sidebarBlockHost.test.ts`, `reading-mode-host.test.ts`):
  `a space before the language` (`` ``` ds-counter extra ``) and `tabs between tokens` (`ds-counter<TAB>extra<TAB>more`).
  4 new tests. Result on the 0d69ec9 host sources (measured when the branch sat on 7644fb3; the two host files are unchanged
  by every later base): `Tests: 12 failed, 27 passed, 39 total`, i.e. the 8 R1 failures plus all 4 new rows FAIL on base.
  With the fix: 39/39 pass. Log: `.../scratchpad/sc290-r3/new-base.log` (fixed: `new-fixed.log`).
- **Final battery on c78a06b** (logs in `.../scratchpad/sc290-r3c/`): tsc, lint, jest, lifecycle (port 9291), e2e, shots, freeze,
  parity in that order, one uninterrupted pass, tree clean, summary lines as in the executive summary. Note: the shots+freeze
  step ran as a background job whose completion marker I waited on; it finished (572 PNGs, 0 FAIL, freeze 276/276) before the
  session-limit interruption was reported. Parity was then run last in the foreground.
- Out of scope per owner, untouched: SC-453 (CRLF), SC-454 (dead CodeBlocks.ts), SC-455 (callout/blockquote writes),
  SC-456 (e2e integrity first-token), SC-457 (space-before-language empty language / relocate).
