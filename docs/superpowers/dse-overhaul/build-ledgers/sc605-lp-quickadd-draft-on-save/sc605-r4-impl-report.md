# SC-605 r4 implementation report (I1)

## Executive summary
- STATUS DONE. dse branch rebased onto origin/develop `d984b115` (SC-600; base moved twice: `dcc53f0f` -> `c329ff35` -> `d984b115`). dse HEAD `17a1c047`.
- dse commits (d984b115..HEAD): feat `0d8f4fc0` · jest `e13bc454` · e2e `3c699229` · docs `0679d277` · jest pipeline/wiring `dd4f2aa9` · r4 fold src+jest `0b8769c8` (LOW-3, INFO-1, INFO-3) · r4 fold e2e `17a1c047` (LOW-2). `git range-diff` of the r2 commits: feat, jest, docs, pipeline/wiring identical (`=`); e2e commit differs only by the e2e/README.md row now sitting beside SC-600's `Initiative/amount-edit.md` row. Folds 6-7 are the old r4 commits, unchanged content.
- Superproject `723f4170` (two CHANGELOG commits: `f92d2f1a` SC-605 bullet + stale sentences, `723f4170` LOW-1 dangling "In" removed) on workspace origin/main `298a4ef9`; dse pointer UNSTAGED (` M draw-steel-elements`).
- Gates on `d984b115` + branch: tsc (incl. -p e2e) and lint clean · jest 11647 passed / 2 skipped (270 suites passed, 1 skipped; 11617 + 27 + 3 new r4 cases) · e2e `315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (165 s) · lifecycle 61/61 (21+16+9+4+7+4; walls 185/325/417/298/392/296 s) · styles.css sha256 `5e5ff488...2b27` (same as every earlier build; no `*.css` diff vs `d984b115`) -> shots/freeze/parity carry, skipped.
- On `c329ff35` (before the SC-600 rebase): tsc/lint clean, jest 11625/2, e2e 313/316 174/174 (151 s), lifecycle parts 1-5 all ok (21/21 184 s, 16/16 322 s, 9/9 402 s, 4/4 301 s, 7/7 391 s); part 6 not run there.
- No `view.ts`/`model.ts`/`SidebarPanel.ts`/off-limits edits; no CSS.

## Folds (ledger "Owner rulings on r3")
- LOW-1: workspace CHANGELOG, the dangling "In" before "Since SC-605 this holds in Live Preview too." removed.
- LOW-2: INIT-L17 retitled "the same note in two panes: the saving pane gets the draft back and the other pane starts empty" (id kept, no bracketed id) with a comment that it proves mount order and the scope guard is pinned by jest S09.
- LOW-3: `carryOwnSaveState` sweeps expired carries before each capture; `clearCarriedState()` (renamed from `resetCarriedStateForTests`) is registered with `plugin.register` in `registerFrameworkElements`, so unload clears the map. Jest S16 (capture sweeps; asked as of a moment before the old carry's expiry so only the sweep can have removed it) and a wiring case "plugin unload forgets every armed carry".
- INFO-1: module-header paragraph on the navigate-away window (ZZR3-11).
- INFO-3: `beforeRelease` wraps `carryOwnSaveFocus` and `carryOwnSaveState` in separate try/catch (warns); jest case: each throwing does not skip the other.

## Vacuity of the new cases (jest, on d984b115-equivalent src)
- Remove the sweep -> S16 red (1). Remove `plugin.register(clear)` -> unload case red (1). Remove the focus try/catch -> wiring case red (1). Remove the state try/catch -> wiring case red (1). Logs `jm-M-*.log` in the scratch folder. (e2e vacuity from r2 unchanged: only the L17 title/comment changed.)

## Deviations
- Conflict resolutions at the rebases: e2e/README.md kept both the `amount-edit.md` and `twins.md` rows; workspace CHANGELOG kept both SC-600 and SC-605 bullets (SC-605 on top).
- One process slip: while preparing the mutation harness I staged, stashed and re-applied with `stash apply` (no `--index`), which let the harness's `git checkout` restore the src files to HEAD and drop my uncommitted src folds. I re-applied the same edits, re-staged, re-ran all four mutations (red, tree restored), then committed. Nothing was lost or committed wrong; the stash was dropped.

## Drive-by fixes:
None.

## Follow-ups:
- SC-620 (filed). R1 risk 5 (popouts) was not part of this round.

## Artifacts
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r4-impl/` (c329ff35 logs at top level: `jest-full.log`, `e2e-full.log`, `lifecycle-part1..5.log`; final-base logs in `rb2/`: `tsc.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, `lifecycle-part1..6.log`; mutation logs `jm-M-*.log`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save`
