# SC-454 review r1: delete dead src/utils/CodeBlocks.ts

**Verdict: LAND-READY.** Head `68e3f1e` (1 commit on develop `ab34293`, which is still origin/develop). No HIGH or MED findings. One LOW: a comment rewording is factually wrong. There are 2 optional NITs and 3 INFO notes.

1. Unused at base: confirmed. No import or call in src/, main.ts, e2e/, visual-harness/, scripts or configs. The only real caller was the test callback the ledger already names. The base main.js has 0 CodeBlocks symbols, and the last src import was removed in afedb2a (2026-07-03).
2. The diff contains only the deletion, its tests, the test-callback rewrite and comment/doc rewording. main.js sha256 is identical at base and head (`6ae775ca…cdc08b`), and so are styles.css and the harness bundle. No behavior change, so lifecycle, e2e and shots were not re-run.
3. The new persistBlock callback writes byte-identical notes to the old `CodeBlocks.updateInitiativeTracker`. I compared all 3 persist:true tests side by side and all 3 were equal. Assertions are unchanged, and 6 of 6 mutations of the write turn CB-2 and/or DC-6 red.
4. Gates at head: tsc (incl. `-p e2e`) clean, lint clean, jest **5257 passed / 1 skipped / 229 of 230 suites**. In a matched environment base vs head is 5259/4/230-of-231 vs 5254/4/229-of-230, so exactly −5 tests and −1 suite.
5. The LOW is ReadingModeBlockHost.ts:18-19, which says CodeBlocks "stayed live for unmigrated elements until then". That is false: it had had no src caller since 2026-07-03.

## Findings

### LOW-1: the new comment misstates CodeBlocks' history
- `src/framework/host/ReadingModeBlockHost.ts:18-19`: `// Correctness fixes over the former legacy src/utils/CodeBlocks.ts (deleted in SC-454;` / `// it stayed live for unmigrated elements until then):`
- Scenario: a reader concludes that some unmigrated element wrote through CodeBlocks right up to SC-454. In fact nothing in src/ imported it after afedb2a (2026-07-03, `feat(counter): migrate onto Framework v2`). `git log -S "utils/CodeBlocks'" ab34293 -- src main.ts` gives afedb2a as the last removal, and the base main.js contains 0 matches for `updateMarkdownCodeBlock|findCanvasNodeAndUpdate|updateCanvasCard`. This is the same stale claim the ticket deleted from `.repo-docs/architecture.md:524` ("stays live for legacy elements").
- Fix: replace the parenthetical with `(deleted in SC-454; it had no caller in src/ after the Plan 07 counter migration, afedb2a)`, or simply `(deleted in SC-454)`.

### NIT-1: stale line citations into the deleted file
- `src/elements/counter/model.ts:12`, `src/elements/initiative/model.ts:38`, `src/elements/negotiation/model.ts:13`, `test/unit/model/initiative-serialize.test.ts:5`, `test/unit/model/negotiation-serialize.test.ts:3` keep `src/utils/CodeBlocks.ts:102; canvas :79`.
- These were already wrong at ab34293. Line 102 falls inside `updateCanvasCard` and line 79 inside `findCanvasNodeAndUpdate`. The real definitions are `updateMarkdownCodeBlock` at :109 and `updateCanvasCard` at :95. They now point into a file that no longer exists.
- They are marked "deleted in SC-454", so they don't read as current and the ledger ruling is met. Optional fix: drop the `:102`/`:79` suffixes, or cite `git show ab34293:src/utils/CodeBlocks.ts` lines 109/95.

### NIT-2: one parenthetical still in present tense
- `src/elements/stamina-bar/model.ts:14`: `(CodeBlocks.updateStaminaBar(app, data: StaminaBar, ctx))`. The surrounding sentence now says "the former … did", so it reads acceptably. Optional: add "the former" for consistency.

### INFO-1 (pre-existing, not introduced): CB-2 has a vacuous assertion
- `test/dom/views/minion-stamina-pool-modal.test.ts` CB-2 (~line 170): `updated.slice(updated.indexOf('enemy_groups:'))`. When `enemy_groups:` is missing, `indexOf` returns −1 and `slice(-1)` keeps only the last character, so `not.toContain('grabbed')` passes vacuously.
- In my "bogus body" mutation only DC-6 went red; CB-2 stayed green. The same holds at base with the old writer.
- Assertions were frozen by the owner ruling, so this is not for this ticket. It is a possible Backlog item: assert `indexOf('enemy_groups:') >= 0` first.

### INFO-2: dse-verify numbers need updating at land
- `.claude/skills/dse-verify/SKILL.md` "Current expected numbers" needs the new jest line at land: 5257 / 1 / 229 of 230. That is the owner's landing step.

### INFO-3: historical workspace docs still name the file
- Workspace docs `docs/handoffs/HANDOFF.md`, `docs/superpowers/dse-overhaul/**` (F1/F3 specs, sc290/sc453/sc455 ledgers) mention `utils/CodeBlocks`. These are historical records and need no change. No other repo has a code reference.

## Check 1: is CodeBlocks unused at ab34293?
- `git grep -i "codeblocks|code-blocks" ab34293` over the whole plugin, all tracked files, found these real code references:
  - `src/utils/CodeBlocks.ts` itself
  - `test/unit/utils/code-blocks.test.ts`
  - `test/dom/views/minion-stamina-pool-modal.test.ts:18` (import) and `:71` (`CodeBlocks.updateInitiativeTracker` in the persist:true callback)
- Every other hit is a comment or doc. The rest of the search came up empty:
  - The method names (`updateInitiativeTracker|updateCodeBlock|updateCounter|updateStaminaBar|updateNegotiationTracker|updateStatblock|findCanvasNodeAndUpdate|updateCanvasCard|updateMarkdownCodeBlock`) only match the unrelated kit `updateStaminaBar` and the modal's private `updateStaminaBar`.
  - The `@utils` alias appears only in `jest.config.ts:22` and `tsconfig.json:7` (generic).
  - No dynamic or string-built import.
  - Nothing in e2e/, visual-harness/ or scripts.
- Production bundle: the base main.js has 0 CodeBlocks method symbols. It was tree-shaken dead code.
- The only real caller is the test caller the ledger names. Per the ruling, it is rewritten, not a HIGH.

## Check 2: diff ab34293..68e3f1e
- 17 files, +55 / −276. Deletions: `src/utils/CodeBlocks.ts` (−132) and `test/unit/utils/code-blocks.test.ts` (−103).
- Non-comment code changes:
  - In `minion-stamina-pool-modal.test.ts`: the import swap (CodeBlocks → `replaceFenceBody`, plus `stringifyYaml` from the mocks), the new `persistBlock` helper and the one-line callback.
  - In `.repo-docs/architecture.md`: row 524 removed.
- Everything else is comment rewording. The byte-compat reasoning ("did exactly `stringifyYaml(data).trim()`", same class instance, insertion order) is intact in all four model.ts files and both serialize tests.
- Behavior: main.js identical (see Check 4). The harness bundle (`visual-harness/esbuild.mjs`) is also identical: base and head `dist/harness.{js,css}` sha256 match.
- Commit message: no attribution trailers; author Scott.
- Leftover `CodeBlocks` references at head are all comments, all marked former or deleted. The list is in `git grep -n -i codeblocks HEAD`: architecture.md:117,151; counter/model.ts:11-12; initiative/model.ts:37-38; negotiation/model.ts:12-13; stamina-bar/model.ts:11-14; ReadingModeBlockHost.ts:18,35; MinionStaminaPoolModal.ts:14-15,40,567; counter.test.ts:16; initiative.test.ts:11; negotiation.test.ts:51; reading-mode-host.test.ts:5-6,244; minion-stamina-pool-modal.test.ts:8-9,38,154; obsidian-core.ts:1384; initiative-serialize.test.ts:4-5; negotiation-serialize.test.ts:2-3.

## Check 3: no live coverage lost
- The deleted test file exports nothing, and nothing imports it (`git grep code-blocks` gives comments only).
- Its 5 tests covered only CodeBlocks: 3 pass tests plus the `test.failing` CB-5 (alias) and CB-3 (lost update) oracles.
- The fixed behavior is covered positively and independently in `test/dom/framework/reading-mode-host.test.ts`: CB-5 `ds-it` stays `ds-it` at :43, and `describe('CB-3 fix: atomic concurrent writes')` at :166. That file only referenced the deleted file in a comment, and has no import from it.

## Check 3b: the rewritten caller
- All three persist:true tests keep their assertions: CB-2 (~:158), DC-6 (~:179) and SC-340 "closing with no condition edit" (~:526). In those tests the diff touches only comment lines.
- **Byte equivalence**, probed in a scratch base worktree. I ran HEAD's test file with each persist callback driving both writers: the new `persistBlock` on `Encounter.md`, and the old `CodeBlocks.updateInitiativeTracker` on an identical `Encounter-old.md` twin. After each test I compared full note contents.
- Result: 3 of 3 equal and 70 of 70 green.
  - CB-2 and DC-6: equal at 995 bytes, changed from source.
  - SC-340: equal at 425 bytes, no write, as expected.
- The fixture fence is plain LF ```` ```ds-initiative ````, so the old canonical re-emit and the new preserved info string coincide. The new callback additionally preserves any extra info string.
- **Mutations** (run in a scratch HEAD worktree; restored file gives 70/70 green):

| mutation | result |
|---|---|
| no-op | red: CB-2, DC-6 |
| bogus body | red: DC-6 |
| stale (original yaml) body | red: DC-6 |
| empty-language fence rewrite | red: CB-2, DC-6 |
| no `vault.modify` | red: CB-2, DC-6 |
| wrong lineStart (throws) | red: CB-2, DC-6 |

## Check 4: gates (run by me)

| gate | result |
|---|---|
| `npm run tsc` (tsc + `tsc -p e2e`), head | clean, RC=0 |
| `npm run lint` (src main.ts e2e), head | clean, RC=0 (only the known .eslintignore warning) |
| jest, reviewed worktree, head (after `rm -f main.js styles.css`) | **5257 passed / 1 skipped / 5258; 229 of 230 suites**, RC=0 |
| jest, scratch base `ab34293` | 5259 / 4 skipped / 5263; 230 of 231 |
| jest, scratch head `68e3f1e` (same env as base) | 5254 / 4 skipped / 5258; 229 of 230 |

- The scratch trees lack `visual-harness/dist/obsidian-app.css` and friends, which accounts for the 3 extra env skips. They are identical on both sides, so the matched comparison is exactly −5 tests and −1 suite. The 5258 total = 5263 − 5, which matches 5262/1/230-of-231 minus 5.
- main.js sha256: base `6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b`, head `6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b`. `cmp` reports them identical.
- styles.css: both `698d2d07cf15752cce53d838f6c8a228a141448256032899c295da4b717a6727`.
- main.js is byte-identical, so lifecycle, e2e, shots, freeze and parity were not re-run by me, per the brief. The implementer reported 27/27, 83/87 0 failed 4 known-bug 57/57, 572 0 FAIL, 276/276, and 0/0/24.

## Hygiene
- The reviewed worktree was clean before and after. `git status --porcelain --ignored` is unchanged, and HEAD is still 68e3f1e.
- Ignored main.js, styles.css and main.css were restored from a backup, and their hashes match the originals.
- Both scratch worktrees were removed with `git worktree remove`, and `git worktree list` shows only the reviewed worktree. node_modules is intact; only my symlinks were removed.
- I made no edits and no commits, and did not touch the tracker.

## Artifacts
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc454-review-r1/`:
- `sc454r1-tsc.log`, `sc454r1-lint.log`, `sc454r1-jest-head.log`, `sc454r1-jest-base.log`, `sc454r1-jest-headwt.log`, `sc454r1-jest-base-twin.log`
- `sc454r1-build-base.log`, `sc454r1-build-head.log`, `sc454r1-mainjs-sha.txt`, `sc454r1-harness-base.log`, `sc454r1-harness-head.log`, `sc454r1-harness-base.sha`, `sc454r1-harness-head.sha`
- `sc454r1-probe-bytes.log`, `tools/sc454r1-probe.test.ts.saved`, `tools/sc454r1_mkprobe.py`
- `sc454r1-mutation-summary.txt`, `sc454r1-mut-{noop,bogus,stale,emptylang,nomodify,wrongline,restored}.log`, `tools/sc454r1_mutate.py`, `sc454r1-mutrun.sh`, `sc454r1-gate.sh`
- `sc454r1-status-before.txt`, `sc454r1-status-after.txt`, `orig-artifacts/`

---

# r2: scoped re-review of 68e3f1e..71ac43a

**Verdict: LAND-READY.** No findings.

1. The delta (8 files, +9/−7) matches the newest Owner rulings entry exactly. LOW-1 was applied as ruled, and so were NIT-1 (all five locations) and NIT-2. INFO-1 added the guard to CB-2, and the guard the owner accepted was added to DC-6. Nothing else changed.
2. Both guards fail when `enemy_groups:` is missing. With the key renamed in the written body, CB-2 goes red at :172 and DC-6 at :193, the new guard lines. The same mutation on r1 head 68e3f1e stays 70/70 green, which shows the guards are what catch it.
3. At 71ac43a, tsc (including `-p e2e`) and lint are clean, and the minion-modal suite is 70/70.
4. The main.js sha256 at 71ac43a is `6ae775ca1a3b72b291cc61eef1de93bd57f91e7643415e00d6a0aa53c4dcb08b`, unchanged from base and r1.

## Details
- **Delta vs ruling.**
  - ReadingModeBlockHost.ts:19 now reads "it had no caller in src/ after the Plan 07 counter migration, afedb2a". This matches the ruling text.
  - The `:102`/`canvas :79` suffixes are removed in counter/model.ts:12, initiative/model.ts:38, negotiation/model.ts:13, initiative-serialize.test.ts:5 and negotiation-serialize.test.ts:3.
  - stamina-bar/model.ts:14 now has "the former".
  - minion-stamina-pool-modal.test.ts:172 (CB-2) and :193 (DC-6) now have `expect(updated.indexOf('enemy_groups:')).toBeGreaterThanOrEqual(0)`.
  - `git grep -E "CodeBlocks\.ts:[0-9]|canvas (path )?:79|stayed live"` at HEAD finds only two unrelated montage comments (BoardView.ts:169, montage.test.ts:1705).
  - The commit has no attribution trailer.
- **Guard mutation.** In persistBlock, `stringifyYaml(data).trim()` was changed to `.replace('enemy_groups:', 'enemy_groupz:')`. The fence, the pool value and the condition removal are all still written, so the guard is the first assertion to fail.
  - At 71ac43a: 2 failed / 68 passed. The failures are CB-2 at line 172 and DC-6 at line 193.
  - Control at 68e3f1e: 70/70 passed, so the old slice was vacuous.
  - Restored: 70/70.
- **Gates at 71ac43a** (scratch worktree):
  - tsc RC=0, clean.
  - lint RC=0, clean apart from the known `.eslintignore` warning.
  - Modal suite 70/70.
  - I did not re-run the full jest suite. The delta is comments plus two added assertions in one suite, and that suite was run.
  - main.js and styles.css hashes are unchanged (`6ae775ca…cdc08b`, `698d2d07…6727`). Lifecycle and e2e were not re-run, because main.js is byte-identical.
- **Hygiene.**
  - The reviewed worktree's `git status --porcelain --ignored` is identical before and after, and HEAD is 71ac43a.
  - Both scratch worktrees were removed with `git worktree remove`.
  - No edits, no commits, no tracker contact.

## r2 artifacts
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc454-review-r2/`:
- `sc454r2-summary.txt`
- `sc454r2-tsc.log`, `sc454r2-lint.log`
- `sc454r2-modal-green.log`, `sc454r2-mut-head.log`, `sc454r2-modal-restored.log`, `sc454r2-mut-r1control.log`
- `sc454r2-build.log`
- `sc454r2-status-before.txt`, `sc454r2-status-after.txt`
- `sc454r2-run.sh`, `tools/sc454r2_mutate.py`
