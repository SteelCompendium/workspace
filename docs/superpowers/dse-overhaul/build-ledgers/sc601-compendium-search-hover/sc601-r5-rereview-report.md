# SC-601 r5: scoped re-review of the r4 delta (dse `10f8aaf0..ee113341`, base `c6077860`), reviewer R3

## Executive summary

- **Verdict: FIX REQUIRED, for two LOW findings only.** There is no product defect. MEDIUM-1 is fixed correctly, and every refusal path shows exactly one Notice. Both fixes are tiny: revert one line and add one test.
- **Counts:** HIGH 0 · MEDIUM 0 · LOW 2 · INFO 4.
- **LOW-1:** the rebase did change G-S96, against the r4 report's claim. `visual-harness/obsidian-lifecycle.mjs:8346`: G-S96 now returns `` `${outcomes.join('; ')}; no page error` `` where base `c6077860` has `outcomes.join('; ')`. The diff is "additions only" as a line sequence, but that hides the change. Measured: G-S96's ok line now ends "; no page error".
- **LOW-2:** the block command's half of mutant R2 survives. In R2c, `dispatchBlockChoice` writes into `activeEditor` at choose time. The ported R2 test drives the reference command only. A probe block twin passes on HEAD and kills R2c.
- **Mutants (my own runner, scratch worktree, 206 tests):** 14 of 15 killed. Killed: R2 (both commands), R2b, R4a, R4a2, R4c, R4c2, R5, R5b, L1 (late re-check dropped), X1 to X5. Survived: R2c (LOW-2).
- **Gates I ran:**
  - jest full at HEAD in a fresh scratch tree: **10656 passed / 4 skipped / 10660 total** (= 10658 / 2 in a real worktree, INFO-3).
  - tsc 0, lint 0.
  - Lifecycle part 6 `G-S92,G-S96,G-S97`: **3/3, 230 s** with the build. G-S97 passes 9 of 9 trials.
  - G-S97 on the `10f8aaf0` bundle: **0/1, 61 s**. Only trial 9 is red (`not exactly one "closed" Notice []`, hook fired 1, nothing on disk).
- **Rebase:** clean. merge-base = `c6077860` = origin/develop. `c6077860..HEAD` holds only the 5 SC-601 commits. range-diff gives `ddee8074 = 6d1b56e9` and `0e1154f2 = 10f8aaf0`. The r1 probe commit was dropped.
- **r4 numbers checked against its logs, all at CURRENT:** e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; shots 592; host-leak 163/978; modal host-leak 39/234; capture clip 147; freeze 280/280; parity 0/0/24; lifecycle 60/60 (21/16/9/4/7/3). All of those logs postdate the HEAD commit.
- **Working tree:** the branch worktree is identical before and after (`git status --porcelain`, including ignored files). My scratch worktree has been removed.

## 1. Findings

### LOW-1: the G-S96/G-S97 rebase resolution changed G-S96's return line

- **Where:** `draw-steel-elements/visual-harness/obsidian-lifecycle.mjs:8346`, the last line of G-S96's `run`.
  - Base `c6077860` has `return outcomes.join('; ');`. HEAD has `` return `${outcomes.join('; ')}; no page error`; ``.
  - G-S97's own return at `:8390` is `return outcomes.join('; ');`, which is the line G-S96 used to have.
  - The 3-way apply took the G-S56 tail as context (G-S56 returns `"...; no page error"`, base `:8321`), so the two return lines swapped owners.
- **Why `git diff` hides it:** the diff against `c6077860` has 0 removed lines. It shows the change as an added `return \`...no page error\`` before the G-S97 block, and it pairs base G-S96's original return with G-S97's. Diffing the G-S96 block alone shows the change (`gs96-base.txt` vs `gs96-head.txt`, line 54).
- **Failure scenario:** nothing breaks at runtime. G-S96 does assert `errorsSince(m)` is empty, so the suffix is true. But:
  - The r4 report and the ledger say "G-S96 untouched", and that is wrong.
  - G-S96's ok line now differs from the SC-596 landing (measured: `lc-p6.log` ends "...; no page error)").
  - The next edit to G-S96 or G-S97 will conflict, or will copy the wrong return.
- **Fix:** restore `:8346` to `return outcomes.join('; ');`. Then check with `awk "/id: 'G-S96'/,/id: 'G-S97'/"` that G-S96 matches `c6077860` byte for byte, and run `--only=G-S96,G-S97` (or part 6).

### LOW-2: the block command's re-target of `activeEditor` is not pinned (half of R2 survives)

- **Where:**
  - `src/authoring/compendiumInsert.ts:426` (the block command's `onChoose`: `dispatchBlockChoice(editor, index, entry, target.isOpen)`).
  - `test/dom/authoring/compendiumSearchHoverPreview.test.ts:372`. The ported R2 test runs `insert-compendium-reference` only.
- **Mutant R2c:** `dispatchBlockChoice(((plugin.app as any).workspace.activeEditor?.editor ?? editor), index, entry, target.isOpen)`, with the checks kept. **It survives all 206 tests** in the 4 relevant suites.
  - R2 as r4 defined it (both commands) and R2b (reference only) are each killed by the `:372` test.
- **Failure scenario:** someone re-targets the snapshot write to the active editor in a refactor, which is what Obsidian's Insert template does. The checks are kept, so a preview editor that has been closed is still refused. But if the captured editor is live while another editor is active, the snapshot lands in the wrong note, and jest stays green.
  - G-S97 would not catch it either: in every hover trial the active editor is the preview's own editor.
  - The ruling "never re-target `activeEditor`" covers both commands.
- **Fix:** add the block-command twin of the `:372` test.
  - It runs `runCommand('insert-compendium-block', { containerEl: p.embed })`, makes a live host editor with its own `cm.dom` the `activeEditor`, and clicks `addRow(modal, entryOf(index, GOBLIN))`.
  - It then lets the awaits settle and expects `editor.writes` to have length 1, `host.writes` length 0, and `Notice.notices` to equal `[]`.
  - Validated in scratch: **passes on HEAD and is killed by R2c** (`Expected length: 1, Received length: 0`). Source: `r5-probe-block-retarget.py`. Or use `describe.each(COMMANDS)` over the existing test.

### INFO

1. **MEDIUM-1 is fixed.** I traced every await between the pick and every write.
   - **Reference** (`dispatchReferenceChoice`, `:311-324`) is synchronous from the check at `:321` to `insertReferenceBlock` / `insertInlineLink`. Both are synchronous.
   - **Ctrl copy** (`:317-320`) awaits only the clipboard and never touches the editor.
   - `CompendiumSearchModal.onChooseSuggestion` (`:171-176`) calls `onChoose` synchronously.
   - **Block:**
     - the early check at `:376` comes before `await index.getEntity` at `:377`;
     - `insertFullBlock` (`:264-282`) then awaits `entity.model()` at `:276` and, when there is no DTO, `entity.body()` at `:278`;
     - the late check `refuseClosedEditor(isOpen)` at `:279` is followed directly by `editor.replaceSelection` at `:280`, with no await between them.
   - **Notice count.** An early refusal returns before the late check. A late refusal follows an early pass, which showed no Notice. A non-snapshottable type shows its own "No snapshot" Notice before any closed check. A null entity is a silent no-op, as before. So there is never more than one Notice.
   - The `isOpen` default (`() => true`) keeps the 4 existing `insertFullBlock` callers in `compendiumSearchModal.test.ts` / `compendiumInsertScenarios.test.ts` unchanged.
2. **`a46b9617` is not a behaviour change.** It is a test-only commit (+2 lines). It spies `index.getEntity` in the existing block refusal test and asserts the spy was not called. The early check already existed in r2, and the owner's MEDIUM-1 ruling says to keep it. This commit pins that ruling. It kills r4's L3 and my X4 (early check made silent). Keep it.
3. **The jest count is location-dependent in a scratch tree.** `test/dom/framework/token-coverage.test.ts:54-56` skips its 2-test block when the workspace map is not beside the repo. So my fresh `/tmp` tree read 10656 / 4 rather than 10658 / 2, with the same 10660 total. In a `just wt-new` worktree it is 10658 / 2 fresh, or 10659 / 1 with cached harness CSS (r4's number). That equals 10624 + 34, and 34 = r2's 27 + r4's 7.
4. **One small window has no test.** The `entity.body()` await (`:278`) is only taken when `trimSnapshotDTO` returns undefined, and every SC-601 test uses the goblin statblock, which has a DTO. A check placed between `dto` and `body` would survive. The current code checks after both awaits, so this is not a defect. No action.

## 2. Mutants (my runner `mutate5.py`, written independently of r4's; scratch worktree `git worktree add --detach … HEAD`, `node_modules` symlinked; suites: `compendiumSearchHoverPreview`, `compendiumSearchModal`, `compendiumInsertScenarios`, `managedModal`; baseline 206/206)

| # | Mutant | Result | Killed by |
|---|---|---|---|
| R2 | both commands write to `activeEditor` at choose (checks kept) | KILLED 1 | "a live preview editor and a different live active editor…" |
| R2b | reference command only | KILLED 1 | same |
| R2c | block command only | **SURVIVED** | (LOW-2; the probe twin kills it) |
| R4a | `els.length === 0 \|\| els.some(...)` | KILLED 1 | "the container is still there but the CodeMirror element is gone…" |
| R4a2 | `els.some(...) \|\| els.length === 0` | KILLED 1 | same |
| R4c | only an editor inside `.hover-popover` is checked (at choose) | KILLED 1 | "a closed pane editor (no preview involved) is refused too…" |
| R4c2 | preview-ness captured at command time | KILLED 1 | same |
| R5 | `const doc = document` | KILLED 1 | "the guard binds to the modal's own document: … popout…" |
| R5b | listener added on `window.document`, removed from `ownerDocument` | KILLED 1 | same |
| L1 | late re-check dropped | KILLED 3 | the two getEntity / model tests, plus the direct `insertFullBlock(..., () => false)` test |
| X1 | late check moved before `await entity.model()` | KILLED 1 | "the preview closes while the model is being read…" |
| X2 | late check uses the value captured at entry | KILLED 1 | same |
| X3 | `dispatchBlockChoice` adds a second Notice on a late refusal | KILLED 2 | the getEntity and model tests (`toEqual([CLOSED_EDITOR_NOTICE])`) |
| X4 | early check refuses silently | KILLED 2 | "block command: the same, for the snapshot choice", "dispatchBlockChoice on its own…" |
| X5 | late refusal returns `true` | KILLED 1 | the direct `insertFullBlock` test |

- Every kill is an assertion failure. No log has a `TS` error.
- The runner restored the tree after each mutant; the scratch worktree status was `''` after the run.

## 3. G-S97 trial 9 (read and run)

- **What it does:**
  - It uses the block command and a real press in the input.
  - It then installs a one-shot page-side wrapper on `app.plugins.plugins['draw-steel-elements'].compendiumIndex.getEntity`. The wrapper restores the real method, hides `previewMode?.hoverPopover ?? hoverPopover` and calls through.
  - Then a real press on a suggestion.
- **What it asserts:**
  - nothing written in either note (`t.read`);
  - exactly one `/was closed, so nothing was inserted/` Notice since the mark;
  - `hook.fired === 1 && hook.hid`.
- **Why it is not vacuous:**
  - `fired === 1` proves `getEntity` was reached, so the early check passed and the Notice comes from the late check.
  - The `finally` block deletes the own-property hook.
- **Branch (part 6):** green.
  - REC: `afterPress {shown, editing, search: true}`, `landed {src: false, host: false}`, `notices ["The note you were editing was closed, so nothing was inserted."]`, `hook {fired: 1, hid: true}`.
- **`10f8aaf0` bundle** (`git archive 10f8aaf0`, symlinked `node_modules`, `node esbuild.config.mjs production`, `DSE_LIFECYCLE_BUNDLE=…`):
  - `FAIL: 1 broken expectations: block preview hidden while the snapshot resolves: not exactly one "closed" Notice []`, rc 1, 61 s.
  - The other 8 trials are green.
  - Same hook result (`fired 1, hid true`), nothing on disk. This is the silent loss MEDIUM-1 named.
  - The kept temp dir `/tmp/dse-obsidian-lifecycle-HzhYz2` was deleted by its literal path after I copied its FAIL shot.

## 4. Rebase and lifecycle order

- `git merge-base HEAD origin/develop` = `c6077860` = `origin/develop`.
- `c6077860..HEAD` = `6d1b56e9 10f8aaf0 dd838596 a46b9617 ee113341`, all SC-601.
- `range-diff 5f7c5336..0e1154f2 c6077860..10f8aaf0`: `0da7e1d3 < -` (probe dropped), `ddee8074 = 6d1b56e9`, `0e1154f2 = 10f8aaf0`.
- `5f7c5336..c6077860` touches none of the 5 SC-601 src/test files.
- SCENARIOS order at HEAD: G-S92 `:8237`, G-S96 `:8293`, G-S97 `:8360`, G-S56 `:8401` (last).
- `gs96Cell` is byte-identical to the base. G-S96's `run` differs in one line (LOW-1).

## 5. Evidence (absolute paths)

`R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r5-R3q7`

- **jest:** `R/jest-full.log`, `R/jest-full.rc`, `R/jest-full.load` (script `R/jest-full.sh`)
- **tsc / lint:** `R/tsc.log`, `R/lint.log`, `R/tsc-lint.rc`
- **mutants:**
  - runner `R/mutate5.py` (+ `R/mutate5.sh`)
  - summary `R/mutate5-run.log`
  - per mutant `R/mut5-<id>.log`, baseline `R/mut5-BASELINE.log`
- **LOW-2 probe:** `R/r5-probe-block-retarget.py`, `R/probe-run.log`, `R/probe-head.log`, `R/probe-r2c.log`
- **lifecycle:**
  - part 6 on the branch: `R/lc-p6.log`, `R/lc-p6.rc`, `R/lc-p6.load`
  - G-S97 on the `10f8aaf0` bundle: `R/lc-base.log`, `R/lc-base.rc`, `R/lc-base-G-S97-FAIL.png`
  - base bundle `R/base-10f8aaf0/` (build log `R/build-base.log`)
- **rebase / lifecycle diff:**
  - `R/range-diff.txt`
  - `R/lc-vs-base.diff` (0 removed, 251 added)
  - `R/lc-base.mjs`, `R/gs96-base.txt`, `R/gs96-head.txt`
  - r2 / r4 lifecycle deltas `R/r2-lc.diff`, `R/r4-lc.diff`
- **status before / after:** `R/status-before-*.txt`, `R/status-after-*.txt` (identical)
