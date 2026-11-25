# SC-682 r2 independent review: the `/ds` list closes after a pick

**Executive summary**
- VERDICT: **LAND-READY** for SC-682 as ruled (R1 / O1-O7). Head plugin `8b32ac9b` (base `bb3a3d10`), superproject `f67003ad`. No regression found; the fix does what it says on every path R1 describes.
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 2 (both pre-existing, the same on `bb3a3d10`, outside what `close()` can fix; owner judgment: MEDIUM-1 is an O1 gap under fast typing) · LOW 1 · INFO 4.
- Gates (measured by me): tsc + `tsc -p e2e` clean · lint clean · jest `Tests: 2 skipped, 14682 passed, 14684 total` · e2e full `OBSIDIAN-E2E done: 818/828 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` · styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on head and on the `bb3a3d10` src build (carry shots 592 / freeze 280/280 / parity 0/0/24 holds).
- Vacuity: all 12 changed/new e2e tests (AUTH-S10..S17 plus S02, S04, S09, G09) are red on the `bb3a3d10` src (`0/12 ok, 12 failed`). jsdom: 5 "pick that writes" cases and the rewritten insertRefusal line are red on base. The 2 "refused" cases and the "no context" case pass on base; they pin SC-687 behaviour and are not vacuous for that purpose.
- Implementer claims: (1) list-item double-Enter damage on base: **confirmed**, and worse with a held Enter (6 Enters wrote 6 copies). The branch writes exactly one block and N-1 new lines, no Notice, at top level, under a list item and in a callout, in LP and Source, for 2 Enters in one call, 5 in one call, and a CDP auto-repeat hold. (2) A click on Stamina bar leaves the row up on base: **confirmed** (Skills too). The branch closes it. (3) No key list over a fresh block after a pick: **confirmed** for all 13 elements in LP and Source, sampled every 4 ms for 2 s, on both builds. One exception: fast typing (MEDIUM-1).
- Stale-range follow-up: **yes, a stale range can still be written in real Obsidian.** Obsidian refreshes the open list's context 50-70 ms after an edit, not synchronously. An Enter inside that window writes at the old `[start, end)`. Driven: (a) fast typing: a stray letter line is left, sometimes the wrong block is inserted, and a key list then opens over the new block (MEDIUM-1). (b) An edit from another pane, a file change on disk or a plugin script, then Enter: 7 characters of user text deleted, or an uncaught `RangeError` with the list left open (MEDIUM-2). Same on base.
- Cleanup: plugin `git status --short` empty; worktree superproject ` M draw-steel-elements` (the unstaged pointer, as I found it); scratch `git worktree` removed and pruned.

## Findings

### MEDIUM-1: fast typing picks with the old token range; a stray letter is left and a key list opens over the new block (pre-existing, same on `bb3a3d10`)
- `src/authoring/suggest.ts:65-77` (`selectSuggestion` writes at `this.context`'s `start`/`end` without checking them against the editor as it is now).
- Scenario (real Obsidian 1.14.4, Live Preview and Source, branch and base identical). Note `Intro line above\n\n\nOutro line below\n`, cursor at line 2 ch 0. Type `/dssta`, wait for the list (Stamina bar, Statblock). Then send `m` and Enter as one W3C action with a gap under 50 ms (0, 20 and 40 ms red; 50 ms and up correct).
  - Written: `Intro line above\n\n```ds-stam\nmax_stamina: 20\ncurrent_stamina: 15\ntemp_stamina: 5\n```\nm\nOutro line below\n`. The `m` is left as a stray line below the block.
  - Then, 1.2-1.5 s later, a **key list with 9 rows** (`authoring.schema.key`: collapsible, collapse_default, max_stamina, ...) is open over the new block. The next Enter accepts `collapsible` and adds no new line. This breaks O1 ("no list of any kind ... the next Enter is a new line") for this timing.
  - `/ds`, then `stam` + Enter in one burst: the **Horizontal rule** block is inserted (the row selected for the old query `""`) and `stam` is left as a stray line. Same for `/ds` + `hr` + Enter in Source.
- Cause, measured: the context is refreshed about 56-69 ms after an edit (page-side poll every 2 ms; `editorSuggest.currentSuggest.context.start` moves only at 56 / 60 / 69 ms). The Enter's pick runs on the context for the shorter query. The deferred re-trigger for the typed `m` then runs at the new cursor (first body line, empty prefix), and the key suggester's `keyCtx` matches there.
- Why it is not a regression: `bb3a3d10` gives byte-identical text and the same 9-row key list (`probe-tailbase-*.jsonl`, `TYPE:*`).
- Prescribed fix (owner decides whether it belongs in SC-682 under O1 "any pick" or in a follow-up). At the top of `selectSuggestion`, re-run `this.onTrigger(editor.getCursor(), editor, this.context.file)`. If the fresh trigger's `start`/`end`/`query` differ from the stored context, close the list and write nothing; Obsidian's pending re-trigger then re-opens the list on the full token and the user presses Enter again. Alternatively, re-filter with the fresh query and pick the fresh first row. Test it in e2e with `performActions([keyDown m, keyUp m, keyDown Enter, keyUp Enter])` with no pause, then assert the note text and `expectNoList()`.

### MEDIUM-2: an edit from another pane, a file change on disk or a plugin script, then Enter within about 60 ms, writes at the old range: user text deleted, or an uncaught RangeError (pre-existing, same on base)
- `src/authoring/suggest.ts:75-76` (same write; `close()` comes after `insertBlock`, so a throw skips it).
- Scenarios (real Obsidian, Live Preview, both builds identical):
  - Note `Intro line above\n\n/dsstam` + `\nOutro line below\n` with the list open (context line 2 ch 0-7). A page-side `editor.replaceRange('SYNC LINE\n', {0,0})`, then deleting lines 0-1, nets the token one line UP. Enter right after: the note becomes `\n/dsstam\n```ds-stam\n...\n```\nine below\n`. **`Outro l` (7 characters of the user's text) is deleted**, the scaffold lands on the wrong line and the token stays. Context before, synchronously after, after a microtask and after a `setTimeout(0)`: all still `[2,0,2,7]`.
  - The same token shift, made by `app.vault.process` (a change on disk, merged by Obsidian) or by the same note's editor in a second pane, then Enter at once: `Uncaught RangeError: Invalid change range 25 to 32 (in doc of length 25)` (page error caught by the e2e invariants, `ZR2-087` / `ZR2-088`). Nothing is written, but the exception skips `close()` and the list stays on screen.
  - With a 1.5 s pause between the edit and Enter (all six STALE probes, and the second pane above / same line), the context was refreshed and the pick was correct, or the list was closed. So the window is the 56-69 ms refresh delay, not a permanent stale range. Undo while the list is open closes the list (no stale write).
- How reachable: an edit coming in from elsewhere (sync, a git plugin, a second pane, another plugin) in the ~60 ms before an Enter on an open `/ds` list. Rare; data loss when it happens.
- Prescribed fix: the same guard as MEDIUM-1, plus `editor.getRange(start, end) === '/ds' + query` (and `end` inside the document) before writing. Put `this.close()` in a `finally`, so a throw cannot leave the list up.

### LOW-1: the CHANGELOG bullets and the code comment name "Stamina bar and Skills" as the blocks whose row stayed up; the base build left the list up in more cases
- `CHANGELOG.md:26` (plugin), `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/CHANGELOG.md:12` (workspace), `src/authoring/suggest.ts:72` (comment).
- Measured on `bb3a3d10`:
  - Featureblock in Source with text after the cursor (AUTH-S09 red on base: `[["authoring.ds.item","Featureblockds-fb"]]`).
  - Roll with the gate on (AUTH-G09 red).
  - All 13 rows after `/ds` + ArrowUp + Enter (AUTH-S04 red).
  - Stamina bar with text before the token (`B3:text-before`).
  - On base, an Enter sent right after the pick failed for **every** element and shape (a Notice, nothing, or under a list item a second block), not only for the blocks that stuck (72/72 `enter-sep` cases differ from the oracle on base).
- Fix: drop the parenthetical, or say "for some blocks (Stamina bar, Skills and others, depending on where the token was)". Comment line 73 "in the first few milliseconds" is about 40-80 ms measured; "just after the pick" is enough.

### INFO
- INFO-1: AUTH-S03 (`ds-suggest.e2e.ts:69-70`, click pick in Source) and AUTH-I40 (`insert-commands.e2e.ts:375-377`, refused pick) still use `waitNoList()` after a `/ds` pick. It tolerates a list that goes away late. Not in O5's scope (they were never `closeList()`). Both now could use `expectNoList()`. The implementer already listed I40.
- INFO-2: jsdom `dsSuggestMatrix.test.ts` new describe: the 2 refused cases and the no-context case pass on base by design (SC-687 already closed on refusal). The 5 written cases are the SC-682 red ones.
- INFO-3: undo after a pick: one Ctrl+Z takes back the block AND the typed `/dsstam` together, since CodeMirror groups the typing and the pick into one undo step. The note returns to `Intro line above\n\n\nOutro line below\n`. Identical on base (C3). The undo steps did not change.
- INFO-4: `D:` probes with a block indented 2 spaces under a list item got no `/ds` list at all: the fence scan sees a 2-space fence. The SC-676 blind spot is the 4-space form. My D2 probes used that form and the properties instead.

## Brief sections, checked

- **A (tests real).** e2e on the `bb3a3d10` src with the branch's tests: `OBSIDIAN-E2E done: 0/12 ok, 12 failed` (`r2-e2e-base-newids.log`), with the same failure lines as the implementer's red run. I read every new test: in S10, S11, S16 and S17 the second `browser.keys('Enter')` is the very next command after `pressList('Enter')`, which sends the key and records coverage with no wait. No `waitList` / `waitNoList` / `closeList` / pause comes between the two keys. S12 pauses 1.5 s on purpose (the settled case) and is red on base. jsdom on base: `Tests: 6 failed, 110 passed` (`r2-jest-base-sub.log`), the 5 written cases plus `insertRefusal.test.ts:160`.
- **B (O1 matrix, my own probes).** In each of LP and Source, for all 13 elements, "pick, Enter at once" on the branch is byte-identical to the base build's "pick, Escape, Enter" (26/26). For 5 elements by click, "click, Enter at once" matches the base oracle (10/10). Stamina and Counter in 9 shapes (empty line, text before, text after, `- `, `1. `, callout, first line, last line, note with properties) match too (36/36). On the branch, in every case: no list at 1.5 s, no list in any 4 ms sample after the pick, no Notice, no page error. Scaffold bytes are identical on the two builds for all 13 elements (36/36 "pick only" cases; `git diff bb3a3d10..HEAD -- src` only moves `this.close()`).
- **C.**
  - (1) After a pick, typing `r` on a body line of the Stamina block opens `recoveries` / `recoveries_max`. Enter writes `recoveries`, the cursor goes to ch 10 and the list closes (both builds; also AUTH-S14).
  - (2) A second `/ds` pick: AUTH-S15 green on head and red on base. Two-pane picks in quick succession leave both notes correct, with no Notice (base: 3 Notices).
  - (3) Undo: see INFO-3.
  - (4) Typing at once after a pick (`Enter,x,y,z` in one call) gives the same result on both builds. Arrows at once (`Enter,ArrowDown,ArrowDown,q`): on the branch the arrows reach the editor (equals the base Escape oracle); on base the stuck list swallowed them.
  - (5) Escape right after a pick does nothing to the note.
  - (6) With a list open in pane 1, switching to pane 2 closes it; a pick in pane 2 is correct and pane 1 keeps its token.
  - (7) No page error or `console.error` in any case, click picks included.
- **D (SC-687 intact).** Branch, refused pick (4-space block under a list item; properties in Source): exactly one Notice, the token stays as typed, the list is gone within 16-29 ms. A second Enter, sent at once or in the same call, is a plain new line, with no second Notice. Identical to base.
- **E (integrity).** Note `Para above\n\n\n\n```ds-stam\n<30/30/0>\n```\n\nPara below\n`, pick, then Enter x3 (three separate calls, or one call) on the branch: identical to base "pick, Escape, Enter x3". The second block is untouched and the text above and below is byte-identical. No stray token and no doubled word. Base: one Enter eaten with a Notice.
- **F (O5 edits).** All four replaced `closeList()` now call `expectNoList()`, which sends no key, reads at once and then every 100 ms for 500 ms, and fails on any row. No assertion removed or weakened; `insertRefusal.test.ts:160` is strengthened from 0 to 1. The remaining `closeList()` calls (census 30/31/34, schema-suggest K01-K03, insert-commands I35, gate-on G10-G12) do not follow a `/ds` pick. New ids follow `[AREA-Xnn]`; no manifest pair added; coverage 476/476.
- **G (scope).** `git diff bb3a3d10..HEAD --stat -- src/authoring/blockInsert.ts src/authoring/fenceScan.ts src/authoring/schemaSuggest.ts` is empty. The three SC-676 `test.failing` (`authoringKnownBugs.test.ts:120,123,126`) are untouched and jest is green with them. Nothing from SC-676 / SC-688 / SC-692 is pulled in.
- **H (docs).** Both CHANGELOG bullets follow their file's convention (`[FIX] **...** (SC-682).` / `- **DSE plugin: ... (SC-682).**`), in plain words. They are true apart from LOW-1. The `closeList()` / `expectNoList()` doc comments and the e2e README sentence are true. No co-author or AI attribution in `git log bb3a3d10..HEAD` (plugin, 4 commits) or `git log origin/main..HEAD` (superproject, 1 commit).

## Probe table (real Obsidian 1.14.4; base = `bb3a3d10` src, branch = `8b32ac9b`)

| Case | Base build | Branch |
|---|---|---|
| `/dsstam` + Enter, wait 1.5 s (LP, Source) | row "Stamina bar ds-stam" stays; ctx null | no list |
| `/dsskills` + Enter, wait | row stays | no list |
| other 11 elements + Enter, wait | list closes by itself at 59-82 ms | no list |
| Stamina / Skills by click, wait (LP, Source) | row stays (claim 2 confirmed) | no list |
| Counter / Horizontal rule / Montage by click | closes at 128-142 ms | no list |
| any of the 13 + Enter, Enter at once (LP, Source) | Notice, no new line (26/26 differ from the oracle) | = oracle, no Notice (26/26) |
| click + Enter at once (5 elements x 2 modes) | Notice, no new line | = oracle (10/10) |
| 9 shapes x stam/ct x 2 modes, Enter at once | Notice, or nothing (list item / ordered / text before: row stuck) | = oracle (36/36) |
| `- /dsstam` + 2 Enters in one call | second scaffold written into the first (claim 1 confirmed) | one block, one new line |
| `- /dsstam` + 5 Enters in one call / held Enter (CDP auto-repeat, 5) | 5 / 6 copies of the scaffold | one block, 4 / 5 new lines, no Notice |
| top level, callout + 2 / 5 Enters in one call, held | Notice and one Enter eaten | one block, N-1 new lines, no Notice |
| key list sampled for 2 s after a pick, 13 elements | never (only `authoring.ds.item` rows) | never (claim 3 confirmed) |
| `/dssta`, then `m` + Enter, gap 0-40 ms | stray `m` line, key list with 9 rows open | same (MEDIUM-1) |
| `/dssta`, then `m` + Enter, gap 50 ms and more | correct | correct |
| `/ds`, then `stam` + Enter in one burst | Horizontal rule inserted, stray `stam` | same (MEDIUM-1) |
| list open, script edit shifts the token up a line, Enter at once | 7 characters of user text deleted, scaffold on the wrong line | same (MEDIUM-2) |
| list open, change on disk / second pane shifts the token, Enter at once | uncaught RangeError, list stays up | same (MEDIUM-2) |
| list open, any of those edits, Enter 1.5 s later | correct (context refreshed) | correct, list closed |
| undo while the list is open, then Enter | list closed, plain new line | same |
| pick, Ctrl+Z | block and token both undone in one step | same |
| pick, Escape at once | nothing changes | same |
| refused pick (4-space list block; properties), Enter / 2 Enters at once | 1 Notice, token stays, plain new lines | same |
| pane 1 list open, switch to pane 2, pick | pane 2: Notice, no new line | correct, no Notice |

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r2-review-report.md`
- Logs and data, all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-review-r2/logs/`: `r2-tsc.log`, `r2-lint.log`, `r2-jest-head.log`, `r2-jest-base-sub.log`, `r2-e2e-full-head.log`, `r2-e2e-base-newids.log`, `r2-probe-*.log`, `probe-base-1795575075.jsonl`, `probe-head-1795575666.jsonl`, `probe-d2head-1795576241.jsonl`, `probe-tailbase-1795576497.jsonl`, `probe-synchead-*.jsonl`, `probe-lathead-*.jsonl`, `probe-typehead-*.jsonl`, `probe-winhead-*.jsonl`, `analysis-main.txt`, `zr2-087-rangeerror-head.txt`, `zr2-087-rangeerror-head.png`
- Probe spec (never in the tree): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-review-r2/zz-r2probe.e2e.ts`. Analysis script: `.../sc682-review-r2/analyze.py`.

## Follow-ups (out of scope)
- MEDIUM-1 and MEDIUM-2 together: a "stale context" guard in `DsElementSuggest.selectSuggestion`, and `close()` in a `finally`. `DsSchemaSuggest.selectSuggestion` writes the same way (SC-679) and likely has the same ~60 ms window; not probed.
- AUTH-S03 / AUTH-I40: switch `waitNoList()` to `expectNoList()` (INFO-1).
