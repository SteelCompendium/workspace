# SC-687 r6 scoped re-review — plugin `bb3a3d10` (delta from `fe0b5bab`); superproject `754d46b0` unchanged

## Executive summary
- **VERDICT: LAND-READY**, with one new LOW for the owner to rule on: Reading view only, an unusual indent (a tab, then spaces); not a blocker in my judgment.
- NEW-HIGH-1 **closed**: the tab-indented note, cursor (3,9), is refused in real Obsidian with one Notice and the note unchanged; at `tail` the insert is written and both counters draw. NEW-LOW-1 **closed**: B2 at `> c` refused; B2 after the blank line and B2b at `after` written, Reading view draws the counter with the old code intact. r3 MEDIUM-2 rows (unquoted / shallower-quoted text) still refused.
- The implementer's tab measurement holds: 23 tab notes in Reading view and Live Preview / Source mode, 1–4 levels, bullets, ordered, mixed bullet / ordered, callout and quote lists, spaces then tab. CommonMark tab stops explain every row but two. NEW-LOW-1 (r6) `src/authoring/listItem.ts` `readColumn` / `fenceScan.ts:193`: `- a⏎\t  ```ds-ct` (tab, then two spaces) is a counter in Reading view (Live Preview draws none); the scan says outside, and an insert inside turns the counter into an error card. INFO: `  \t```` under a top-level bullet is refused while neither view draws a fence (narrow false refusal).
- No new holes in the 77 r4 notes: only X4, B2 and B2b changed, each the intended fix. `scanFenceState` is identical to `aee83dc1` on all 91 notes. `planBlockInsert` is byte-identical to `aee83dc1` on 29 SC-675 prefixes × 2 shapes (the `contentColumn` split moves nothing written).
- Mutation spot-check: the scan back on `contentColumn` gives 8 red; the r3 quoted-fence rule gives 3 red; the control 236 green. No test line was removed in the delta. No attribution in the 4 commits.
- Gates: tsc incl. `tsc -p e2e` rc 0; lint rc 0; jest `Tests: 2 skipped, 14674 passed, 14676 total` (matches); e2e `OBSIDIAN-E2E done: 810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (matches, one full run, no red); styles.css `18730938…f7a7f1f9` (matches). Lifecycle carried (delta = `src/authoring/{fenceScan,listItem}.ts`, 2 jest files, 1 e2e spec, architecture doc).

## Gates

| Gate | Measured (r6 reviewer) | Fix report |
|---|---|---|
| tsc (`npm run tsc` = tsc + `tsc -p e2e`) | rc 0 | clean |
| lint | rc 0 | clean |
| jest (after `rm -f main.js styles.css`) | `Test Suites: 1 skipped, 313 passed` · `Tests: 2 skipped, 14674 passed, 14676 total` | 14674 / 2 |
| e2e full | `OBSIDIAN-E2E done: 810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` rc 0, one run, no red | `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` |
| styles.css (`build-no-check` at `bb3a3d10`) | `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` | same |
| Lifecycle | carried: `git diff --stat fe0b5bab..HEAD` = `.repo-docs/architecture.md`, `e2e/specs/authoring/insert-commands.e2e.ts`, `src/authoring/fenceScan.ts`, `src/authoring/listItem.ts`, `test/dom/authoring/insertPositionScan.test.ts`, `test/dom/authoring/insertRefusal.test.ts` | carried |

## r4 findings on the head (real Obsidian 1.14.4, Source mode)

| Finding | Scenario | Result | Status |
|---|---|---|---|
| NEW-HIGH-1 | `- a⏎\t- b⏎\t\t```ds-ct⏎\t\tname: x⏎\t\t```⏎tail`, cursor (3,9) | refused, one Notice, note unchanged, Reading view still a counter; at `tail` (5,4): written, two counters | closed |
| NEW-LOW-1 | B2 `> > ```js⏎> > a⏎> ```⏎> > b⏎> > ```⏎> c⏎⏎after` at (5,3) | refused, one Notice; at the end of `after` (7,5): written, counter drawn, the old code blocks unchanged | closed |
| NEW-LOW-1 | B2b `> > ```js⏎> > a⏎> ```⏎> x⏎> ```⏎after` at (5,5) | written (it was a false refusal in r4), counter drawn, `<pre>x</pre>` intact | closed |
| r3 MEDIUM-2 rows | `> ```js⏎> a⏎b⏎> ```⏎after` at `b`; `> > ```js⏎> > a⏎> b⏎> > ```⏎after` at `> b` | both refused, note unchanged | still hold |

## The tab measurement, re-measured
Notes with a `js` fence. "Code" = lines carrying `HyperMD-codeblock` in Source mode / Live Preview; Reading view = whether the body sits in a `<pre>` (a fenced block) or shows as inline `<code>js x</code>`.

| # | Note (`\t` = tab) | Reading view | Live Preview / Source | Scan | OK? |
|---|---|---|---|---|---|
| T1 | `- a⏎\t```js` | fence in a | code | fence | yes |
| T2 | `- a⏎\t\t```js` | inline code | none | outside | yes |
| T3 | `- a⏎\t- b⏎\t\t```js` | fence in b | code | fence | yes |
| T4 | `- a⏎\t- b⏎\t```js` | fence in a | code | fence | yes |
| T5 | `- a⏎\t- b⏎\t\t- c⏎\t\t\t```js` | fence in c | code | fence | yes |
| T6 | `- a⏎\t- b⏎\t\t\t```js` | inline code | none | outside | yes |
| T22 | `…\t\t- c⏎\t\t\t\t```js` | inline code | none | (outside by the same arithmetic) | yes |
| T7 / T18 | `1. a⏎\t```js` / `10. a⏎\t```js` | fence | code | fence | yes |
| T8 | `1. a⏎\t\t```js` | inline code | none | outside | yes |
| T9 / T10 / T11 | ordered-in-ordered, ordered-in-bullet, bullet-in-ordered, `\t\t```js` | fence | code | fence | yes |
| T17 | `- a⏎    - b⏎\t\t```js` | fence in b | code | fence | yes |
| T20 | `-\ta⏎\t```js` | fence | code | fence | yes |
| T21 | `* a⏎\t* b⏎\t\t```js` | fence in b | code | fence | yes |
| T15 / T16 / T15c | `> - a⏎> \t- b⏎> \t\t```js`, the same with `>` and no space, the same in a callout | fence in b | (quote / callout: no code classes) | fence | yes |
| T12 | `- a⏎\t- b⏎  \t```js` | fence in b | none | fence | refuses (views disagree), yes |
| T13 | `- a⏎  \t```js` | inline code | none | **fence** | false refusal (INFO-1) |
| T14 | `- a⏎\t  ```js` | **fence in a** | none | **outside** | **no (NEW-LOW-1)** |
| T19 | `- a⏎\t- b⏎\t\t```js⏎\t\tx⏎\t```⏎\t\ty⏎\t\t```⏎tail` | `<pre>x</pre>` in b, then `\t```` opens a fence in a holding `y`, ```` ``` ```` and `tail` | lines 2–6 code, `tail` text | lines 2–6 refused (end of line 6 allowed), `tail` outside | views disagree; the scan matches Live Preview (INFO-2) |

So the implementer's premise is right: Obsidian does not read a fence line's tabs with the bullet's 2-per-tab rule (T2, T6 and T8 would then be fences; neither view draws one). The prescription in my r4 report was wrong on that point.

## New findings

### NEW-LOW-1 (r6) — a tab, then spaces, under a bullet: Reading view draws a fence the scan does not see
`src/authoring/listItem.ts` (`readColumn`) and `src/authoring/fenceScan.ts:193` (`columnAfter`, CommonMark tab stops). For `- a⏎\t  ```ds-ct⏎\t  name: x⏎\t  ```⏎tail` the scan reads the fence line at column 6, which is 4 past the item's text column 2, so it is indented code and every line is outside.

Measured (R6V-06):
- Reading view draws a counter inside item a.
- Live Preview and Source draw only list lines and no block.

Cursor at the end of `\t  name: x` (2,10), Insert Counter: no Notice, the block is written inside (`      ```ds-ct⏎…⏎      ```` before the old `\t  ````). Reading view's counter becomes an error card ("Nested mappings are not allowed…"). With a `js` fence, the new block shows as code text inside the old one.

Neither tab rule explains Reading view here. CommonMark stops make `\t  ` column 6 (indented code), and 2-per-tab makes T2 `\t\t` a fence (not drawn). Reading view seems to measure a tab that is followed by spaces differently. Mixed tab-then-space indentation is unusual, and Live Preview does not draw this block. Severity LOW.

Fix (owner's call): either (a) treat a fence-looking line as a fence when EITHER reading (CommonMark stops, or 2 columns per tab) puts it within 0–3 columns of the item's text column. That refuses more: T2, T6 and T8 become refusals of blocks that are not drawn (narrow; each closes at its own `\t\t```` line). Or (b) accept and document it as a known gap (Reading-view-only, mixed indentation).

### INFO-1 — `- a⏎  \t```js` (two spaces, then a tab) is refused, though neither view draws a fence (T13)
The false refusal is narrow: the lines up to its own closer. No action needed.

### INFO-2 — a dedented fake closer inside a tab-indented nested block: the views disagree; the scan follows Live Preview
T19 above. The scan allows an insert at the end of `\t\t```` (line 6) and at `tail`. Live Preview: both outside. Reading view: both inside the fence that `\t```` opened in item a, and the inserted block shows as code there (R6V-04). Reading view already shows `y`, ```` ``` ```` and `tail` as code before any insert, so the note is broken in that view to begin with. Contrived; no action.

### INFO-3 (pre-existing, same on `aee83dc1`) — the block the insert writes on a tab-indented line under a top-level bullet is indented code
Cursor on `\t\tx` in T2 (no fence there): SC-675's prefix is 8 spaces (`columnAfter('\t\t')`), and the written block is drawn as text in Reading view. Same bytes on base (`planBlockInsert` is byte-identical). An SC-675 matter, not this ticket (Follow-up).

## No new holes
- r4 probe table on the head, diffed against the r4 run: 77 notes compared, 74 identical. 3 changed: X4 (now a fence: NEW-HIGH-1), B2 (the shallower `> ```` now opens a depth-1 fence, and `> c` is inside: NEW-LOW-1), B2b (`> ```` closes the depth-1 fence and `after` is outside: NEW-LOW-1). All intended and confirmed in Obsidian above.
- `scanFenceState` gives the same answer at head and `aee83dc1` on all 91 notes (77 + 14 new tab notes in jest).
- `planBlockInsert(before, '' / 'tail', block)` gives the same output at head and `aee83dc1` for 29 prefixes. Covered: empty, text, `- `, `* `, `+ `, `1. `, `10. `, `1) `, nested 2 / 4 spaces, 1–2 tabs before bullets and ordered items, a tab gap, a five-space gap, `> `, `> - `, `> \t- `, `>\t- `, `> > - `, `- > [!note]`, a task item, mixed spaces and a tab.

## Tests are real
Mutation spot-check, in a scratch checkout of `bb3a3d10`, running `insertPositionScan.test.ts` and `insertRefusal.test.ts`; each mutant was reverted with `git checkout -- src`.

| Mutant | Result |
|---|---|
| control | 236 passed |
| M1: the scan reads `contentColumn` again (the r4 behaviour) | 8 failed |
| M2: a shallower-quoted line no longer ends a quoted fence (the r3 rule) | 3 failed |

`git diff fe0b5bab..HEAD -- test e2e` removes no line. `git log fe0b5bab..HEAD` carries no co-author or AI attribution.

## Artifacts
Scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r6/`:
- scan: `probe-head.txt`, `probe-base.txt`, `probe-head-plan.txt`, `probe-base-plan.txt`, `probe-head-self.txt`, `probe-head.log`, `probe-base.log`, source `zzR6Probe.test.ts`
- real Obsidian: `e2e-head-run1.json` (R6V-01..05), `e2e-head-run2.json` (R6V-06), `e2e-probe-head-*.log`, spec source `zz-r6-review.e2e.ts`
- mutation: `mutate.sh`, `mutate-result.txt`, `mut-M0-control.log`, `mut-M1-contentColumn.log`, `mut-M2-quote-r3.log`
- gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-hash.out`, `g-build.log`, `g-e2e-full-a.log`
- scratch checkouts `base/` (`aee83dc1`) and `mut/` (`bb3a3d10`), removed with `git worktree remove`
