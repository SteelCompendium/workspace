# SC-679 r5 fix report (LOW-A, comment only)

## Executive summary

- STATUS: DONE.
- New land head `8c08bce201ef23c32fa1bec7a28fea219c3151cb` (one new commit on `1412820d`; no amend, no push). `origin/develop` still `d582e7ff5aa4aeb179558bb990b654ef381dbae0`; HEAD was `1412820d` before the commit.
- Commit: `docs(SC-679): the close() comment says what happens without it (the list stays up as one row)`. `git diff 1412820d..HEAD --stat`: `src/authoring/schemaSuggest.ts | 6 +++---` (3 insertions, 3 deletions), comment lines only.
- `main.js` sha256 at `1412820d` build: `e66078e8e476774a77ad6fbe7041c5601ead11292cb87568bcfbc034e262e1d1`; at `8c08bce2` build: `e66078e8e476774a77ad6fbe7041c5601ead11292cb87568bcfbc034e262e1d1` (identical). `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` at both.
- Gates at `8c08bce2`: `npm run tsc` rc 0 clean; `npm run lint` rc 0 clean; `npx jest test/dom/authoring`: `Test Suites: 15 passed, 15 total`, `Tests: 578 passed, 578 total`, 0 failed.
- Full jest, lifecycle, e2e not re-run (main.js byte-identical). Scratch branch, patch and superproject untouched. Working tree clean.

## Full diff (`git diff 1412820d..HEAD`)

```
--- a/src/authoring/schemaSuggest.ts
+++ b/src/authoring/schemaSuggest.ts
@@ -127,9 +127,9 @@ export class DsSchemaSuggest extends EditorSuggest<string> {
 		// SC-679, two steps (measured in Obsidian 1.14.4):
 		//  - With nothing typed (start == end) the write lands AT the cursor and a cursor at an insert point stays in front of it, so the next
 		//    Enter wrote a second word ahead of the accepted one: put it behind the word, as the /ds suggester does.
-		//  - Obsidian leaves the old rows on screen after an accept until its next editor update (about 100 ms), and an Enter in that window
-		//    accepts the stale row again (`heightheight`). close() takes them down at once. Obsidian does run onTrigger again at the new cursor,
-		//    but it only opens a CLOSED list on typed input, so nothing else is needed to keep a list off the accepted word.
+		//  - Without close() the list stays up after an accept: Obsidian runs onTrigger again at the new cursor and refreshes the still-OPEN list
+		//    (a one-row list repeating the accepted word), so the next Enter accepts it again (`heightheight`, `recoveriesoveries`). close() takes
+		//    it down at once; Obsidian opens a CLOSED list again only on typed input, so nothing else is needed.
 		editor.setCursor({ line: start.line, ch: start.ch + value.length });
 		this.close();
 	}
```

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r5-fix-report.md`
- Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc679-r3b-impl/`: `r5-build-before.log`, `r5-build-after.log`, `r5-tsc.log`, `r5-lint.log`, `r5-jest-authoring.log`, `r5-diff.txt`
- Script: `.../sc679-r3b-impl/l-gate.sh` (added a `jest-authoring` case)
- Land worktree: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`

Drive-by fixes: none. Follow-ups: none.
