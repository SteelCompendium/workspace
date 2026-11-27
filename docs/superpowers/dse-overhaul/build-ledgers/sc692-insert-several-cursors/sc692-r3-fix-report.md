# SC-692 r3 fix report

**Executive summary**
- Verdict: DONE. Tests and comments only; `git diff 6b290e01 -- src/` is two comment lines in `blockInsert.ts`.
- Plugin head `e38f7838` (one commit on `6b290e01`); origin/develop still `17187e4c`. Superproject unchanged (`634cee2c`).
- MEDIUM-1: three new jest cases with hand-written expected text, in `test/dom/authoring/insertSeveralCursors.test.ts`: `'> [!note] T\n> | |'`, `'|  |'`, `'a|«cd\nef»g'` (cursor first, main 0; asserts two ranges and no blank line). Each also goes through the existing oracle comparison.
- Mutants (applied in the worktree file, then `git checkout`; `git diff` empty afterwards), run on `insertSeveralCursors.test.ts` + `insertRefusal.test.ts` (77 tests):
  - `const after = rest;` (:158): 2 failed / 75 passed (callout prefix-only line, whitespace-only line). Was 74/74 green at r2.
  - `sameLineAsNext` keyed on `ranges[i + 1].to.line` (:156): 1 failed / 76 passed (cursor before a multi-line selection).
- LOW-1: `blockInsert.ts` `insertRefusalFor` comment now says one block per range in one `editor.transaction`; header line says "(with one cursor)".
- LOW-2: existing tests depend on `setSelections` `main` (`insertRefusal.test.ts` :387, :408; my file), so `_cmEditor.ts` keeps honouring it and carries a comment stating Obsidian 1.14.4 ignores it (first range is main).
- Gates: tsc (incl. `-p e2e`) clean, lint clean, fresh jest `15044 passed / 2 skipped` (15041 + 3). e2e 944/964, lifecycle 64/64, shots/freeze/parity carry (no runtime line changed; `styles.css` untouched).
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-impl-r3/` (`m1.log`, `m9.log`, `gate-r3-jest.log`, `g1-tsc.log`, `g1-lint.log`).

Drive-by fixes: none. Follow-ups: none (SC-711, `/ds` at several cursors, INFO-1..4 untouched as ruled). The optional e2e twin of the prefix-only case was not added.
