# SC-687 r4 scoped re-review — plugin `fe0b5bab` (delta from `907d9c85`), superproject `754d46b0` (delta from `9f79effa`)

## Executive summary
- **VERDICT: FIX-REQUIRED** (one new HIGH; every r2 finding is closed).
- r2 findings: HIGH-1 **closed**, HIGH-2 **closed**, MEDIUM-1 **closed**, MEDIUM-2 **closed**, LOW-1 **closed**, O8 revert **done**. All re-driven in real Obsidian 1.14.4 on the head.
- NEW-HIGH-1 `fenceScan.ts:192`: Obsidian's default list indentation is tabs, and the scan misses a fence indented with tabs under a NESTED item (`- a⏎\t- b⏎\t\t```ds-ct`). The insert writes into the block, and Reading view's counter becomes an error card. This hole was already in r1, but its shape is the default one.
- NEW-LOW-1 (the implementer's blind spot 2) `fenceScan.ts:175`: a shallower-quoted fence line (`> ```` inside a `> > ```js` fence) DOES corrupt, not only over-refuse. Reading view opens a depth-1 code block there, and an insert lower in that quote is written into it.
- Blind spot 1 (an indented `  # H` keeps `lazy`): no corruption in its plain form, because Obsidian also continues lazily there. One contrived variant writes where Live Preview, but not Reading view, draws code (INFO-1).
- Gates: tsc incl. `tsc -p e2e` rc 0; lint rc 0; jest `Tests: 2 skipped, 14643 passed, 14645 total` (matches); e2e second full run `OBSIDIAN-E2E done: 809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` rc 0 (matches); first full run `807/819 ok, 2 failed, 10 known-bug, coverage: 474/476 pairs`: SET-X03 / SET-X04 (README-documented flake SC-657, settings, outside the delta), both ok re-run alone; styles.css `18730938…f7a7f1f9` (matches; carry holds). Lifecycle carried: the delta touches only `src/authoring/`, tests and docs.
- O5 holds: `scanFenceState` gives the same answer as `aee83dc1` on all 70 probe notes, `onTrigger` and `schemaSuggest.ts` are not in `git diff aee83dc1..HEAD`, and the SC-676 markers are untouched (jest green). SC-692 stayed out: with every cursor outside, the bytes written are identical to `aee83dc1` in real Obsidian.
- Mutation spot-check (my own, 3 mutants plus a control): the r1 lazy rule turns 15 tests red, a main-selection-only guard 2, no `close()` 1, the control 0. No test was weakened; the only removed rows are the O8 unclosed-properties rows, rewritten. No attribution in any commit.

## Gates

| Gate | Measured (r4 reviewer) | Fix report |
|---|---|---|
| tsc (`npm run tsc` = tsc + `tsc -p e2e`) | rc 0 | clean |
| lint | rc 0 | clean |
| jest (after `rm -f main.js styles.css`) | `Test Suites: 1 skipped, 313 passed` · `Tests: 2 skipped, 14643 passed, 14645 total` | 14643 / 2 |
| e2e full | second full run `OBSIDIAN-E2E done: 809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` rc 0 (matches); first full run `807/819 ok, 2 failed, 10 known-bug, coverage: 474/476 pairs`: SET-X03 / SET-X04 (README-documented flake SC-657, settings, outside the delta), both ok re-run alone | `809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` |
| styles.css (`build-no-check` at `fe0b5bab`) | `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` | same |
| Lifecycle | carried (`git diff --stat 907d9c85..HEAD`: `src/authoring/{blockInsert,fenceScan,suggest}.ts`, `test/`, `e2e/specs/authoring/insert-commands.e2e.ts`, docs only) | 64/64 carried |

## r2 findings, re-driven on the head (real Obsidian unless marked jsdom)

| r2 finding | Scenario | Head result | Status |
|---|---|---|---|
| HIGH-1 | `- item⏎⏎tail`, Insert Counter on line 1, then at `tail` | both written, no Notice, Reading view 2 counters (R4V-02). The other shapes L11, L16, L12, L17 and L13 (heading) are each written at `tail`, and Reading view draws the old block plus the new counter | closed |
| HIGH-2 | U1 `- item⏎```js⏎x⏎```⏎- other⏎  ```⏎  a: 1⏎  ```⏎tail`, cursor (6,6) | refused, one Notice, note unchanged | closed |
| MEDIUM-1 | ds-stam note, cursors (4,0) inside + (8,10) outside, either one main | refused, one Notice, note unchanged, both selections kept, stamina bar intact (R4V-03, clean run) | closed |
| MEDIUM-2 | `> ```js⏎> a⏎b⏎> ```⏎after` at `b` (Source); callout form at `b` | refused, note unchanged; at the end of `after` it is written and Reading view draws the old block plus the counter | closed |
| LOW-1 | `/dsct` + Enter in the properties (Source) | one Notice, no visible list row after the pick, token stays; the second Enter only adds a line break | closed |
| O8 | unclosed `---⏎a: 1⏎⏎```ds-ct…```⏎tail`: insert at `tail` and at the end of line 0 | both written, no Notice, Reading view draws the counters. A CLOSED `---`: line 0 ch 0 refused, closer mid refused, closer end written | done |

Rows the scan's MEDIUM-2 rule depends on, checked against the implementer's measurement table (real Obsidian, R4V-01):

| Row | Measured |
|---|---|
| a blank line ends a quoted fence (X2) | Reading view: the fence ends, `after` is a paragraph, and a later `> ```` opens a new quoted fence holding `tail`. Matches. |
| an unquoted fence line ends the quoted fence and opens its own (X7) | Reading view: new top-level `<pre>after</pre>`, `tail` a paragraph. Live Preview and Source: lines 2–4 CODE with begin and end. Matches. |
| unquoted text stays (Q4, Q9) | `<pre>a⏎b</pre>`. Matches. |
| a shallower `>` TEXT line stays in a deeper fence (X3, `> b` in `> > ```js`) | Reading view `<pre>a⏎b</pre>`. Matches. |

Re-run of the r2 probe table (57 notes) on the head against the r2 run: 45 notes unchanged and 12 changed, every change intended.
- Q4 and Q8: MEDIUM-2. The unquoted or shallower line is now body and the quoted closer closes, which matches Obsidian.
- L11, L12, L13, L16, L17, L18, U1, U2: HIGH-1/2. Each fence closes at its own closer and the line after it is outside, which matches Obsidian.
- P2 and P10: O8. An unclosed `---` is outside, and a fence below it is a fence.

13 new notes were added. X4 and B2 are wrong (findings below). The other 11 (X1 callout-list fence, X2, X3, X5, X6 `- ```js`, X7, X8, X9 lazy text then a 2-space fence, B1, B1b, B2b) agree with Reading view, or refuse more.

## New findings

### NEW-HIGH-1 — a fence indented with tabs under a nested list item is not seen; the insert writes into it
`src/authoring/fenceScan.ts:192` (`const indent = columnAfter(...)`, a tab = 4 columns), against `src/authoring/listItem.ts` `listItemOf` (a leading tab under a BULLET = 2 columns). For `- a⏎\t- b`, item b's text column is 4. A line `\t\t```ds-ct` measures 8, so `8 - 4 = 4 > 3` reads it as indented code, and the scan says `outside` for every line of the block (jsdom probe X4 / X4ds).

Obsidian 1.14.4 (R4V-01, R4V-09) draws `\t\t```js` as a fenced block: Source and Live Preview mark the lines `HyperMD-codeblock` with begin and end, and Reading view puts `<pre>` inside item b. With `- a⏎\t- b⏎\t\t```ds-ct⏎\t\tname: x⏎\t\t```⏎tail`, Reading view draws a counter. Cursor at the end of `\t\tname: x` (line 3, ch 9), Insert Counter: no Notice, and the block is written inside (`        ```ds-ct⏎        name: Health⏎…⏎        ```` before the old `\t\t````). Reading view now shows that counter as an error card ("Nested mappings are not allowed…"). Same for a `js` block: the new block becomes code text inside it.

Severity HIGH: Obsidian indents nested list items with tabs by default, so this is the shape a user gets. The hole existed in `907d9c85` too (the tab rules were not touched in r3); r1 and r2 both missed it (r2 probed one tab level only, L8, which the scan gets right).

Fix: measure a line's leading tabs by the same rule `listItemOf` uses for an item's lead when the containing item is a bullet (2 columns per tab; ordered items 4), so the fence line and the item column use one unit. Add rows X4 / X4ds (and three levels: `- a⏎\t- b⏎\t\t- c⏎\t\t\t```js`) to `insertPositionScan.test.ts`, and an e2e with a tab-indented ds block under a nested item: refused, note unchanged. Re-check the SC-675 writes under tab items do not change (`blockContextOf` uses the same helper).

### NEW-LOW-1 — the implementer's blind spot 2 corrupts: a shallower-quoted fence line inside a deeper quoted fence
`src/authoring/fenceScan.ts:175` (`endsQuotedFence` is only consulted for a line WITHOUT the fence's prefix; a line with fewer `>` than the prefix and a fence marker after them is body). The fix report says this "refuses more". Measured, it can also write inside a block.

Obsidian (R4V-01 B2, Reading view): `> > ```js⏎> > a⏎> ```⏎> > b⏎> > ```⏎> c⏎⏎after` renders as `<blockquote><blockquote><pre>a</pre></blockquote><pre>&gt; b⏎&gt; ```⏎c</pre></blockquote>`. The shallower `> ```` ends the depth-2 fence and opens a depth-1 fence that runs to the blank line. The scan says `> > ```` closes and `> c` is outside. Cursor at the end of `> c` (5,3), Insert Counter: no Notice, `> ```ds-ct…> ```` written inside that depth-1 block (Reading view: no counter, the ds-ct text inside the `<pre>`, the old code block's content grown). Live Preview draws no code for plain quotes. The shape is contrived (a fence line with fewer `>` inside a nested-quote fence). B2b (`> > ```js⏎> > a⏎> ```⏎> x⏎> ```⏎after`) only over-refuses (`after` is a lazy quote paragraph in Reading view, the scan says body).

Fix: treat a line that carries FEWER quote markers than the open fence's prefix like the unquoted case. After its own markers, a blank or fence-marker line ends the fence, and the line is then read fresh, which opens the depth-1 fence. Add rows B2 / B2b. A shallower TEXT line keeps the current rule (stays: X3 measured).

### INFO-1 — blind spot 1 (an indented heading keeps `lazy` true): no corruption in the plain form
In `- item⏎  # H⏎text⏎  ```js⏎  a⏎```⏎tail` (B1), Obsidian's Reading view keeps `text` inside the item (lazy, as the scan does) and puts the fence in the item. Reading view opens a new fence at the column-0 `` ``` `` with `tail` in it, and Live Preview / Source draw lines 3–6 as code. The scan refuses at `tail`, which is right in both views.

The contrived variant B1b (`- item⏎  # H⏎text⏎  ```⏎  a⏎    ```⏎  b⏎  ```⏎tail`) splits the views:
- Reading view closes the fence at the 4-space `    ```` (the scan agrees).
- Live Preview and Source keep `    ```` and `  b` as code and close at line 7.

The scan allows an insert at `  b`, and Live Preview's code block then holds the new block, while Reading view draws the counter. LP-only, four unusual lines in a row: INFO. No action proposed.

### INFO-2 — Live Preview draws a tab-indented ds block under a nested item as an error card before any insert
`- a⏎\t- b⏎\t\t```ds-ct⏎\t\tname: x⏎\t\t```` — Live Preview: "Counter: failed to render (parse) Tabs are not allowed…", while Reading view draws the counter. This is a rendering bug, not part of this ticket (Follow-ups).

## Tests are real
- Mutation spot-check in a scratch checkout of `fe0b5bab`, running `insertPositionScan.test.ts` and `insertRefusal.test.ts`, each mutant reverted with `git checkout -- src`:

  | Mutant | Result |
  |---|---|
  | control | 205 passed |
  | M1, the r1 lazy pop condition | 15 failed |
  | M2, guard reads only the main selection | 2 failed |
  | M3, no `close()` after a refused pick | 1 failed |

- Removed test lines in `git diff 907d9c85..HEAD -- test e2e`:
  - the three unclosed-properties rows, replaced by O8 rows that assert the reverse;
  - `EditorState.create` in `_cmEditor.ts`, rewritten with `allowMultipleSelections`;
  - the `pick` helper signature, extended to count `close` calls.

  Nothing was weakened.
- `git log` of both deltas: no co-author or AI attribution.

## Probe artifacts
Scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r4/`:
- scan: `probe-head.txt` (70 notes, head), `probe-base.txt` (`aee83dc1`), `probe-head-self.txt`, `probe-head.log`, `probe-base.log`; source `zzR4Probe.test.ts`
- real Obsidian (spec source `zz-r4-review.e2e.ts`):

  | File | What it holds |
  |---|---|
  | `e2e-head-run1.json` | R4V-01 measurements. The R4V-03 / R4V-04 entries in it are contaminated by a timed-out R4V-02 whose writes kept running; ignore them. |
  | `e2e-head-run2.json` | R4V-02 and R4V-05..09 |
  | `e2e-head-run3-multi.json` | R4V-03, clean run |
  | `e2e-base.json` | R4V-03 on `aee83dc1` |
  | `e2e-head-run4.json` | R4V-04, R4V-08, R4V-09, clean re-run |
  | `e2e-probe-head-*.log`, `e2e-probe-base-*.log` | the probe runs' own logs |

- mutation: `mutate.sh`, `mutate-result.txt`, `mut-M0-control.log`, `mut-M1-lazy-r1.log`, `mut-M2-main-only.log`, `mut-M3-no-close.log`
- gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-hash.out`, `g-build.log`, `g-e2e-full-a.log`, `g-e2e-full-b.log`, `g-e2e-only-setx.log`
- scratch checkouts `base/` (`aee83dc1`) and `mut/` (`fe0b5bab`), removed at the end with `git worktree remove`
