# SC-687 r5 fix report

## Executive summary
- STATUS: DONE. NEW-HIGH-1 and NEW-LOW-1 fixed. Plugin head is the docs commit after `af63569d` (see the final text), superproject head `754d46b0` (unchanged, no pointer bump). `origin/develop` still `aee83dc1`.
- Gates: tsc incl. `tsc -p e2e` clean, lint clean; jest `Tests: 2 skipped, 14674 passed` (r3 14643, +31); e2e `OBSIDIAN-E2E done: 810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (+1 = AUTH-I42, no red anywhere, no flake).
- Lifecycle 64/64 carried: `git diff --stat fe0b5bab..af63569d` touches only `src/authoring/fenceScan.ts`, `src/authoring/listItem.ts`, two jest files and `insert-commands.e2e.ts` (110 insertions, 24 deletions); styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` unchanged.
- The brief's premise for NEW-HIGH-1 (measure the fence line with the same 2-per-tab rule as a bullet's lead) is NOT what Obsidian does for fences: measured data says the fence line and the item's text column must both use CommonMark tab stops. The 2-per-tab rule stays only for what the insert WRITES. Details below.
- AUTH-I42 and the 8 tab scan rows are red on `fe0b5bab`, green on head; mutation check below.

## NEW-HIGH-1 (commit `1aaa8e70`)
- Cause: `placeOfLine` measured the fence line with `columnAfter` (tab stop 4) against `listItemOf`'s text column, which counts a leading tab under a bullet as 2 (a rule measured for WHERE TO WRITE a block under a bullet, SC-675 r4). `- a⏎⇥- b⏎⇥⇥```` read 8 - 4 = 4 and fell out as indented code.
- Fix: `src/authoring/listItem.ts` `listItemOf` now returns two columns from one function: `contentColumn` (unchanged, for writing, 2 per tab under a bullet) and new `readColumn` (CommonMark tab stops, for comparing an existing line). `fenceScan.ts` pushes `item.readColumn` (and uses it for a fence opened on an item's line). The fence line, closer lines, the pop test and the opener test all measure with `columnAfter`, so every place now uses one unit (re-checked: closer indent, pop, lazy test, opener bound; body lines measure nothing). `blockContextOf` / SC-675 writes are untouched and pass byte for byte (the whole SC-675 suite is green).
- Real-Obsidian measurements (1.14.4; Reading view `<pre>` vs inline code; Live Preview / Source `HyperMD-codeblock` lines; scratch spec `zz-r5-tabs.e2e.ts.keep`, data `.../sc687-impl-r3/measure-tabs.json`):

| Note (tabs as \t) | Reading view | Live Preview / Source | Scan now |
|---|---|---|---|
| `- a` `\t- b` `\t\t```js` | fence in b | code lines | fence |
| three levels `\t\t- c` then `\t\t\t```js` | fence in c | code | fence |
| `- a` `\t- b` `\t```js` | fence in a | code | fence |
| `1. a` `\t```js` | fence | code | fence |
| `1. a` `\t\t```js` | inline code (not a fence) | none | not a fence |
| `1. a` `\t1. b` `\t\t```js`; `1. a` `\t- b` `\t\t```js`; `- a` `\t1. b` `\t\t```js` | fence | code | fence |
| `- a` `\t\t```js` (2 tabs under a top-level bullet) | inline code | none | not a fence |
| `- a` `\t\t\t```js`; `- a` `\t- b` `\t\t\t```js` | inline code | none | not a fence |
| callout list `> - a` `> \t- b` `> \t\t```js` | fence in b | (widget) | fence |
| `- a` `\t- b` `  \t```js` (spaces then tab) | fence in b | NO code | fence (the views disagree; the scan refuses) |
The 2-per-tab rule would call `- a` `\t\t```js` and `- a` `\t- b` `\t\t\t```js` fences, which neither view draws; CommonMark stops explain every row except the last.
- Tests red first (8 failed on `fe0b5bab`): `insertPositionScan.test.ts` rows "`- a` / `\t- b` / `\t\t```ds-ct` (the reviewer's X4)" and 19 more tab rows (three levels, one tab under a nested item, ordered, mixed ordered / bullet, spaces then a tab, callout with a space or a tab after `>`, spaces blocks under tab-indented items as the insert writes them, the not-a-fence rows); `insertRefusal.test.ts` "r5: a hand-written tab-indented block" (cursor (3,9) refused, nothing written, one Notice; `tail` below is written) and three tab shapes added to "running an insert twice in a row". E2E `AUTH-I42` (Source mode, the reviewer's note, cursor (3,9): refused, note unchanged, Reading view still draws the counter) red on `fe0b5bab`, green on head.

## NEW-LOW-1 (commit `0b2b967e`)
- `fenceScan.ts` `endsQuotedFence`: a line with fewer `>` than the open fence's prefix is read after the markers it has; blank (a blank line or a bare shallower `>`) or a fence marker line (indent <= 3) ends the fence, and the line is then read fresh, so a shallower fence line opens its own fence at that depth. Shallower quoted TEXT still stays in (r3 MEDIUM-2 rows unchanged and green). Comments updated.
- Rows red first (3): B2 (`> > ```js⏎> > a⏎> ```⏎> > b⏎> > ```⏎> c⏎⏎after`: `> c` is `block`, the blank line's next line outside), B2b (`after` outside, its body `block`), a bare shallower `>` ends the fence, plus the shallower fence line's own marker and a shallower-text control.

## Mutation check (jest `insertPositionScan` + `insertRefusal`)
- scan reads `contentColumn` again: 8 red. `readColumn` with the 2-per-tab rule: 8 red. `endsQuotedFence` ignoring shallower markers: 3 red. Logs `mut-*.log`, `mutate-result.txt`.

## Docs
- `.repo-docs/architecture.md` (quoted-fence ends, the tab rule) and the `fenceScan.ts` / `listItem.ts` comments. User docs and both changelogs need no change (no user-visible claim changed).

## Blind spots
- Live Preview and Reading view disagree for `  \t```js` under a nested bullet (spaces then a tab); the scan refuses. Not measured: tab shapes inside a quoted fence's own container other than the callout list row; `\t` directly after `>` in a nested quote.

## Drive-by fixes
None.

## Follow-ups
- INFO-2 (Live Preview draws a hand-written tab-indented ds block under a nested item as an error card) is dropped by the owner; nothing new.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r5-fix-report.md`
- Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r5/`: `jfull.log`, `e2e-full-r5.log`, `g-tsc.log`, `g-tsce2e.log`, `g-lint.log`, `hash.out`, `i42red.log`, `i42.log`, `a1.log`..`a5.log`, `mut-*.log`, `mutate-result.txt`, `zz-r5-tabs.e2e.ts.keep`; tab measurement data `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r3/measure-tabs.json`.
