# SC-601 r7: scoped re-review of the r6 delta (dse `231f2a3b` on `3ad68185`, superproject `598579d7` on `d0ca9bf0`), reviewer R3

## Executive summary

- **Verdict: LAND-READY.** Counts: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 1.
- **r5 LOW-1 is fixed.**
  - My own extraction compares each SCENARIOS entry as bytes. G-S92 (5610 B), G-S96 (4780 B) and G-S56 (11719 B) are byte-identical to `3ad68185`.
  - All 59 base entries are identical, and G-S97 is the only new one. Every top-level helper function is identical too; `gs97Trial` is the only new one.
  - The same script run against `ee113341` reports `differ: ['G-S96']`, so it detects the defect it checks for.
- **r5 LOW-2 is fixed.**
  - The new block-command test asserts captured editor writes 1, host 0, and Notices `[]`.
  - It kills R2c: `Expected length: 1, Received length: 0`.
  - My full r5 mutant set re-run on HEAD gives **15/15 killed** (baseline 207/207).
- **Rebase:** `merge-base HEAD origin/develop` is `3ad68185`. `3ad68185..HEAD` holds exactly the 7 SC-601 commits.
  - range-diff shows r4's 5 commits unchanged (`=`), plus the 2 new r6 commits.
  - None of the SC-601 source files changed between `ee113341` and HEAD.
- **Superproject:** `origin/main..598579d7` is 1 commit, `CHANGELOG.md` +9/−0. That is one SC-601 bullet under `## Unreleased`, identical to the r2 bullet `7199f0e6`, with no other line removed or altered.
  - The `draw-steel-elements` pointer is not committed: the tree's pin is `3ad68185`, the same as origin/main. Nothing is staged.
- **Gates I ran:**
  - jest full in a fresh scratch tree: **10709 passed / 4 skipped / 10713 total**. In a real worktree that is 10711 / 2, as expected; the 2 extra skips are location-dependent `token-coverage` tests (INFO-1).
  - Lifecycle part 6 `G-S92,G-S96,G-S97`: **3/3, 230 s** with the build. G-S97 passes 9 of 9 trials. G-S96's ok line now ends "outside edit kept)", with no "; no page error".
- **r6 logs checked:** every one was written after the HEAD commit (02:43:24), and all match CURRENT.
  - e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
  - shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147.
  - freeze 280/280; parity 0/0/24.
  - lifecycle 60/60 as 21/16/9/4/7/3; the union of ok ids equals the 60 SCENARIOS ids exactly.
- **Working tree:** the branch worktree status is identical before and after, ignored files included. My scratch worktree has been removed.

## 1. Checks

### LOW-1 (G-S96 return), fixed in `40a96851`

- The commit changes one line: G-S96's return goes back to `return outcomes.join('; ');`.
- **Method** (`scen-bytes.py`, written independently of r6's `scen-compare-3ad.py`):
  - Each entry runs from the `\t{` line before an `\t\tid: '…'` line to the next `\t},` line. Each top-level function runs from `async function`/`function` at column 0 to the next `}` line.
  - Both are compared as exact strings, with sha1 shown.
- **Results:**
  - `3ad68185` vs HEAD: 59 vs 60 scenarios. Only in head: `G-S97`. Differ: none. Base order is preserved, and the tail is `G-S87, G-S91, G-S92, G-S96, G-S97, G-S56`. Functions: only `gs97Trial` is new, and none differ.
  - `c6077860` vs `ee113341` (control): `differ: ['G-S96']` (4780 vs 4800 B).
  - `git diff --numstat 3ad68185 HEAD -- visual-harness` = `253 0`.

### LOW-2 (block-command re-target), fixed in `231f2a3b`

- **The test:** `test/dom/authoring/compendiumSearchHoverPreview.test.ts:387-402`.
  - It runs `insert-compendium-block` and makes a live host editor with its own `cm.dom` the `activeEditor`.
  - It clicks the GOBLIN row, then `flush` + `until(captured editor written)`, which is bounded at 100 × 5 ms.
  - It expects `editor.writes` length 1, `host.writes` 0, and `Notice.notices` `[]`. That is the prescription.
- **Mutant runs** (r5 runner re-pointed at a fresh `git worktree add --detach … HEAD` with `node_modules` symlinked; 4 suites, 207 tests):
  - R2 is killed by 2 tests (reference and block).
  - R2b is killed by 1 (reference).
  - R2c is killed by 1 (the new block test).
  - R4a, R4a2, R4c, R4c2, R5, R5b, L1 (3), X1, X2, X3 (2), X4 (2) and X5 are all killed.
  - Every kill is an assertion failure. The tree was clean after the run.

### Superproject

- `merge-base HEAD origin/main` = `d0ca9bf0` = origin/main. `origin/main..sc601-compendium-search-hover` = `598579d7` only.
- The diff is 9 added lines in `CHANGELOG.md`, placed directly under `## Unreleased` and above SC-610's bullet. Nothing was removed.
- `git diff --cached` is empty. `ls-tree HEAD draw-steel-elements` = `3ad68185` = `ls-tree origin/main`.
- The worktree shows ` M draw-steel-elements` (the unstaged checkout at `231f2a3b`). This is expected; the dispatcher bumps the pointer when it lands.

## 2. INFO

1. **Scratch-tree jest count.** Outside the workspace layout, `test/dom/framework/token-coverage.test.ts` skips its 2-test block, so the scratch tree reads 10709 / 4. That is the same 10713 total. In a real worktree the count is 10711 / 2 fresh, or 10712 / 1 with cached harness CSS (r6's number). 10711 = 10676 + 35. No action.

## 3. Evidence (absolute paths)

`R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r7-R3q7`

- **scenario bytes:** `R/scen-bytes.py`, `R/scen-bytes-head.txt`, `R/scen-bytes-ee113341.txt` (control)
- **range-diff:** `R/range-diff.txt`
- **superproject diff:** `R/super.diff`
- **jest:** `R/jest-full.log`, `R/jest-full.rc`, `R/jest-full.load`
- **mutants:** `R/mutate7.py`, `R/mutate7-run.log`, `R/mut7-*.log` (R2c kill: `R/mut7-R2c.log`)
- **lifecycle part 6:** `R/lc-p6.log`, `R/lc-p6.rc`, `R/lc-p6.load`
- **r6 lifecycle ok-id union:** `R/lc-r6b-ok-ids.txt`
- **status before / after:** `R/status-before-*.txt`, `R/status-after-*.txt` (identical)
