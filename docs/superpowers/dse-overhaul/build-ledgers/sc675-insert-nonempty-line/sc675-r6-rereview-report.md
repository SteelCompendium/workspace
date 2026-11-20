# SC-675 r6 scoped re-review — r5 delta `f94be393..3b47e55b` (superproject `7df5aae8`)

**Executive summary**
- **VERDICT: APPROVE.** No blocking finding. One LOW: a residual case where the result is worse than r3, needing a ruling to record or chase. One INFO: the accepted whitespace-only residual, measured.
- MEDIUM-2 is fixed in real Obsidian, driven through the actual insert command and `/ds`. Bullets nested with 1, 2 and 3 tabs, `*`, task items and a tab-nested list in a callout all draw inside the right item in Live Preview AND Reading view (Reading `<li>` depth 2 / 3 / 4 as expected), with no error card. A + press gives only the SC-461 Notice and the file is byte-identical.
  - The callout case (`> [!note] T⏎> - a⏎> ⇥- b|`) does NOT save. The brief expected it to. It is a list-indented fence (`>` + 5 spaces is beyond `FENCE_MARKER`'s 3), so the result is the SC-461 Notice with the file intact. That is not a regression: r3 and r4 gave the same Notice.
- Ordered with tabs is unchanged and correct: `1. a⏎⇥1. b|` gives 7 spaces, depth 2; `…⏎⇥⇥1. c|` gives 11, depth 3.
- **LOW-4:** `1. a⏎⇥- b|` (bullet nested under an ORDERED parent with a tab). r5 writes 4 spaces and Reading draws the block in the parent item `a` (depth 1). r3's 6 spaces drew it in `b` (depth 2). Measured data fits one rule: the tab width follows the PARENT item's type (2 under a bullet parent, 4 under an ordered parent), not the item's own.
- **INFO:** whitespace-only lines `- a⏎⇥- b⏎⇥⇥|` and `…⏎⇥⇥⇥|` draw fine in Live Preview but show a parse-error card in Reading (the 8 / 12-space closer does not close the opener that sits behind the user's tabs). The output is identical to r3: the accepted residual.
- jsdom: re-run against my r4 results, 4 + 20 rows differ, every one a tab-led bullet row. Integrity holds on all 375 rows. The empty-line case is unchanged. New tests are not vacuous: 28 of 153 fail on r3's `blockInsert.ts`.
- Gates (scratch worktree): tsc 0, lint 0, jest `13853 passed / 4 skipped`, total 13857 (sc675 worktree equivalent: 13855 / 2). `styles.css` `18730938…f1f9`.
- SC-443 merge `f36e2636`: no conflicts. jest 899/904, with the same 5 expected failures as r4. e2e authoring `64/70 ok, 3 failed, 3 known-bug`, the same set (AUTH-I21, AUTH-S09 flips; AUTH-S04). Scratch worktrees removed; nothing put in the sc675 worktree.

## Findings

### LOW-4 — a bullet nested under an ORDERED parent with a tab lands one level up in Reading view (worse than r3)
`src/authoring/blockInsert.ts:77`: `leadColumns = /^\d/.test(marker) ? columnAfter(lead) : lead.replace(/\t/g, '  ').length`. The tab width is chosen by the cursor line's own marker.

Failure (Obsidian 1.14.4, Insert Counter, Live Preview; ZR6-M1):
- before `1. a⏎⇥- b|`
- after `1. a⏎⇥- b⏎····```ds-ct⏎····name: Health⏎…⏎····``` ` (4 spaces)
- Live Preview: draws. Reading: draws, but at `<li>` depth 1, inside item `a`, not `b`. A + press gives the SC-461 Notice; the file is byte-identical.
- r3's spelling for the same note (6 spaces, seeded as ZR6-M1-r3) draws at depth 2, in `b`.

Every measured case fits "a leading tab counts as the PARENT item's continuation step: 2 under a bullet parent, 4 under an ordered parent" (r4 + r6, Reading depth):

| note | measured | parent rule | r5 rule |
|---|---|---|---|
| `- a⏎⇥- b` | 4–7 in b | 4 | 4 ✓ |
| `- a⏎⇥- b⏎⇥⇥- c` (r4: 4–9 draw, 10 not) | 6 in c (r6) | 6 | 6 ✓ |
| 3 tabs, bullets | 8–11 in d | 8 | 8 ✓ |
| `1. a⏎⇥1. b` | 7–10 in b, 6 in a | 7 | 7 ✓ |
| `1. a⏎⇥1. b⏎⇥⇥1. c` | 11, 13 in c; 7–10 in b | 11 | 11 ✓ |
| `- a⏎⇥1. b` | 7 in b | 5 (2 + `1. `); range 5–8 holds 7 | 7 ✓ |
| `1. a⏎⇥- b` | 6 in b, 4 in a | 6 | 4 ✗ |

**Fix (ruling), one of:**
- (a) Record it as a residual. Bullet-under-numbered nesting with tabs is uncommon; the block still draws (one level up) and cannot save anyway (SC-461).
- (b) Make the step follow the parent. `insertBlock` has the editor: walk up from the cursor line to the nearest line with a list marker and less indentation, and use that item's type (and, for deeper nesting, each ancestor's) for each leading tab. That brings the mixed case back to r3's width without touching any measured bullet/bullet or ordered/ordered result. Add exact-text rows `1. a⏎⇥- b|` → 6 and `- a⏎⇥1. b|` → unchanged.

### INFO — whitespace-only cursor lines under 2+ tabs (accepted residual O8, measured)
`blockInsert.ts:84-85` (unchanged since r3).
- `- a⏎⇥- b⏎⇥⇥|` writes `⇥⇥```ds-ct` (the user's tabs kept) and an 8-space body/closer. Live Preview draws. Reading view draws a parse-error card: "Plain value cannot start with reserved character ` at line 5": the closer is not seen as closing, so ```` ``` ```` becomes YAML. The block stays inside item b (depth 2), and nothing outside it is swallowed.
- `…⏎⇥⇥- c⏎⇥⇥⇥|`: the same with 12 spaces, depth 3.
- Identical output to r3 (probe3: `ws 2 tabs` / `ws 3 tabs` r3 = same), so not worse than r3.
- Seeded alternatives with the body at 6 / 8 spaces fix Reading but then Live Preview draws nothing. No single width works with the opener behind the tabs. Recorded, not chased (O8).

## 1. Bullets with tabs — real Obsidian, driven insert (scratch merge 3b47e55b + SC-443 ae9025ea = `f36e2636`)
`capture-r6.jsonl`. Live Preview roots / errors, Reading roots / errors and `<li>` depth with the owning item's text, then + press in LP and in Reading:

| id | via / mode | before | inserted width | LP | Reading | + press |
|---|---|---|---|---|---|---|
| B1 | cmd / LP | `- a⏎⇥- b\|` | 4 | counter, no error | counter, depth 2, item "b" | Notice ×2, file byte-identical |
| B2 | cmd / LP | `- a⏎⇥- \|` | 4 | counter | counter, depth 2, empty item | Notice ×2, byte-identical |
| B2d | `/ds` / Source | `- a⏎⇥- \|` | 4 | counter | depth 2, empty item | Notice ×2, byte-identical |
| B3 | cmd / Source | `- a⏎⇥- b⏎⇥⇥- c\|` | 6 | counter | depth 3, item "c" | Notice ×2, byte-identical |
| B4 | cmd / LP | 3-tab bullet `…⏎⇥⇥⇥- d\|` | 8 | counter | depth 4, item "d" | Notice ×2, byte-identical |
| B5 | cmd / LP | `* a⏎⇥* b\|` | 4 | counter | depth 2, item "b" | Notice ×2, byte-identical |
| B6 | cmd / LP | `- [ ] a⏎⇥- [ ] b\|` | 4 | counter | depth 2, item "b" | Notice ×2, byte-identical |
| B7 | cmd / LP | `> [!note] T⏎> - a⏎> ⇥- b\|` | `>` + 5 | counter | depth 2, item "b" (in the callout) | **Notice ×2, byte-identical: does not save** (list-indented fence, SC-461; same as r3/r4 T07c) |
| S1 (control) | cmd / LP | `- a⏎␣␣- b⏎␣␣␣␣- c\|` | 6 | counter | depth 3, item "c" | Notice, byte-identical |

## 2. Ordered with tabs (unchanged)

| id | before | width | LP | Reading | + press |
|---|---|---|---|---|---|
| O1 | `1. a⏎⇥1. b\|` | 7 | counter | depth 2, item "b" | Notice ×2, byte-identical |
| O2 | `1. a⏎⇥1. b⏎⇥⇥1. c\|` | 11 | counter | depth 3, item "c" | Notice ×2, byte-identical |

## 3. Mixed and whitespace-only (measured)

| id | before | width | LP | Reading | vs r3 |
|---|---|---|---|---|---|
| M1 | `1. a⏎⇥- b\|` | 4 | counter | depth 1, item "a" (one level up) | **worse**: r3's 6 → depth 2 "b" (LOW-4) |
| M2 | `- a⏎⇥1. b\|` | 7 | counter | depth 2, item "b" | same as r3 |
| W1 | `- a⏎⇥- b⏎⇥⇥\|` | opener `⇥⇥`, body 8 | counter | **parse-error card**, depth 2 | identical output to r3 (INFO) |
| W2 | `- a⏎⇥- b⏎⇥⇥- c⏎⇥⇥⇥\|` | opener `⇥⇥⇥`, body 12 | counter | parse-error card, depth 3 | identical to r3 (INFO) |

In every mixed and whitespace case a + press gives the SC-461 Notice and the file is byte-identical.

## 4. jsdom — no change beyond tab-led bullets
- r2/r4 probe set (241 rows) on 3b47e55b vs my r4 `probe-r4.json`: 4 rows differ, all `tab list` (`⇥- item|`): 6 → 4 spaces. Everything else is identical.
- Probe2 (89 rows) vs r4 `probe2-r4.json`: 20 rows differ, all tab-led bullet rows (`tab nested`, `tab nested empty`, `tab nested 3`, `callout list tab`, `callout in tab nested item`, ×4 paths): widths 6 → 4, 10 → 6, `>`+6 → `>`+4.
  - `marked` now places these one level up (it follows CommonMark's 4-per-tab). That is expected under O8.
  - No space-indented, ordered, callout or plain row changed.
- Probe3 (45 rows, new cases) vs r3's helper: only tab-led bullets changed (star, task, 3 tabs, bullet under ordered, callout tab bullet, tab tail). Ordered, ordered-under-bullet, whitespace-only and the mixed `␣␣⇥` lead are identical to r3.
- Integrity on all 375 rows: one editor change, the inverse restores the note, above/below byte-identical, cursor on the first body character. The empty-line cases are unchanged (part of the 241-row set, identical to r4 and so to base).
- New tests: `insertOwnLines.test.ts` has 153 tests. With f94be393's `blockInsert.ts` swapped in, **28 fail**: 7 new rows × 4 paths (1 / 2 / 3-tab bullet, empty bullet, star, task, tab in a callout list).

## 5. Gates on 3b47e55b (scratch worktree, fresh `npm ci`)
- tsc rc 0, lint rc 0, build rc 0.
- jest rc 0: `Tests: 4 skipped, 13853 passed, 13857 total`; `Test Suites: 1 skipped, 300 passed`. The 2 extra skips are `token-coverage.test.ts` outside a superproject, so the sc675 worktree equivalent is 13855 / 2.
- `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.

## 6. SC-443 merge
- `git merge --no-edit` ae9025ea → `f36e2636`. No conflicts (`suggest.ts` auto-merged).
- jest authoring + census: 21 suites, 904 tests (751 + 153), **899 passed, 5 failed**. Same set as r4: the 3 SC-675 / SC-462 marker flips plus `dsSuggestMatrix:133/:143`. No other test differs from r4's merge.
- e2e `--element=authoring`: **`64/70 ok, 3 failed, 3 known-bug`**. AUTH-I21 and AUTH-S09 "appears fixed", AUTH-S04 (INFO-1). The SC-679 known-bugs are unchanged. Same as r4.

## 7. CHANGELOG (`7df5aae8`)
"Inside a callout every inserted line keeps the `>`. Inside a list item every line is indented under the item. A block inside a list item still can't save its changes yet." This is accurate. Two harmless gaps, no change needed: a block in a callout inside a list item does save, and LOW-4 / INFO put the block one level up or show an error card in rare tab shapes.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r6-rev/`)
- gates: `setup-gates.sh`, `setup-gates.out`, `tsc-r6.log`, `lint-r6.log`, `jest-r6.log`, `build-r6.log`, `styles-r6.sha`
- jsdom: `zzSc675R6Probe.test.ts`, `zzSc675R6Probe2.test.ts`, `zzSc675R6Probe3.test.ts`, `probe-r6.sh`, `probe-r6.out`, `probe-r6.json`, `probe2-r6.json`, `probe3-r6.json`, `probe3-r3src.json`, `jest-ownlines-on-r3src.json` (and `.log`)
- SC-443: `merge-runs.sh`, `merge-runs-r1.out`, `jest-merge-auth.json` (and `.log`), `e2e-merge-r1.log`
- Obsidian:
  - spec and logs: `zzSc675R6.e2e.ts`, `e2e-zr6.sh`, `e2e-zr6-b.log`; `e2e-zr6-a.log` is the first try, a spec syntax error, 0 tests
  - captures: `obsidian-capture/capture-r6.jsonl`
  - screenshots: `obsidian-capture/*.png`
- r4 comparison base: `../sc675-r4-rev/probe-r4.json`, `../sc675-r4-rev/probe2-r4.json`, `../sc675-r4-rev/jest-merge-auth.json`
