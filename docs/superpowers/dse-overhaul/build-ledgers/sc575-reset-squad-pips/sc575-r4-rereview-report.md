# SC-575 r4 scoped re-review of the r3 delta

**Executive summary**
- Verdict: **LAND-READY**. Reviewed plugin `3609e3e9` (fold commit) on `8f7e1c91` (rebased fix) on `eeed5182`, and superproject `776f7fad`. Findings: 0 HIGH, 0 MEDIUM, 1 LOW (a predictable CHANGELOG conflict at landing), 1 INFO.
- Range-diff: the rebased fix `8f7e1c91` matches `bcb015de` except for the plugin CHANGELOG context lines. That is the one resolved conflict: the SC-575 bullet now sits after SC-480's. `src`, `test` and `e2e` have no drift.
- The fold commit does exactly the four folds, in 3 files (+5/-2): LOW-1 (model.ts header), LOW-2 ("Second move"), INFO-2 (the on-screen INIT-X07 assert) and INFO-3 (the workspace CHANGELOG, in `776f7fad`). Nothing else changed.
- The new on-screen assert is not vacuous. With the `src` fix reverted and the note-level assert removed, INIT-X07 fails on the new line: `to have attribute aria-pressed | Expected: "false" | Received: "true"`. With the fix reverted and the note assert kept, it fails at the note assert (`Expected: false | Received: true`).
- Superproject `776f7fad` touches only `CHANGELOG.md`: a bullet at the top of `## Unreleased`, plainly worded, with no `draw-steel-elements` pointer in the commit.
- Full e2e at `3609e3e9`: `OBSIDIAN-E2E done: 252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs` (loadavg 2.2 -> 10.6).
- r3's gate logs check out: jest `1 skipped, 7080 passed, 7081 total`; lifecycle 21+16+9+4+3 = 53/53 (part 5 is G-S59 G-S49 G-S73, all ok); shots 592 files, host-leak 163/978, capture clip 147; freeze 280/280; parity 0/0/24.

## 1. Range-diff `fbaba3da..bcb015de` vs `eeed5182..3609e3e9`

- `bcb015de ! 8f7e1c91`: the only `!` hunk is `CHANGELOG.md` context. The SC-576 tail lines are replaced by the SC-480 tail lines above the SC-575 bullet, and the bullet text is unchanged.
- No hunk in `src/`, `test/` or `e2e/` differs.
- The SC-576 bullet is still present in the 7.0.0 section, and SC-480 now sits between the 7.0.0 header area and SC-575. The order is sensible.
- `3609e3e9` is new (the folds). Saved as `rd.txt`.

## 2. The folds (commit 3609e3e9)

- **LOW-1**, `src/elements/initiative/model.ts:28-29`: "dies with the instances it lives on — except a minion squad's shared `Creature.actions` (SC-278), cleared explicitly (SC-575))". As prescribed.
- **LOW-2**, `CHANGELOG.md:44`: "Second move". As prescribed.
- **INFO-2**, `e2e/specs/initiative/reset-encounter.e2e.ts:112-113` (comment at 112, assert loop at 113): a loop over nth 0-4, each asserting `toHaveAttribute('aria-pressed', 'false')` on `init.detail.squad-action`.
  - The wdio scope re-queries lazily. The failure message shows the selector chain `$$(.workspace-leaf.mod-active … [data-dse-element="initiative"])[0].$$(…)`, so the assert reads the rebuilt tracker, not a detached node.
  - If a pip were missing, the assert would fail, not pass silently.
  - Non-vacuity runs:
    - `revA`: fix reverted, spec as committed. FAIL at the note assert (`e2e-revA.log`).
    - `revB`: fix reverted, note assert replaced by `void data`. FAIL at the new on-screen assert (`Expected: "false" | Received: "true"`; `e2e-revB.log`, bundle `revB/e2e/.out/20261111-064900-6ee9/INIT-X07`).
    - At HEAD the assert passes (INIT-X07 ok in the full run).
- **INFO-3**: see section 3.
- Nothing else in the commit. The author is Scott, with no trailer, which matches the r1 ruling.

## 3. Superproject commit 776f7fad

- `git show --stat`: `CHANGELOG.md | 3 +++` only. `ls-tree 776f7fad draw-steel-elements` = `fbaba3da`, the same as its parent `9bb80e4b`, so the pointer is not in the commit. The worktree superproject still shows ` M draw-steel-elements` (unstaged), as expected.
- The bullet is the first one under `## Unreleased`. It uses the same bold "DSE plugin: …" headline shape as its neighbours, names all five pips with their UI labels, and reads plainly.

## Findings

### LOW-1: the superproject CHANGELOG commit will conflict with origin/main at landing
- The worktree superproject branch is cut from `9bb80e4b`. origin/main is now `847d8215`, where SC-480 added its own bullet at the top of `## Unreleased` (commits 274ebd3f..2ee92236).
- A trial `git merge-tree 9bb80e4b origin/main 776f7fad` gives "changed in both" `CHANGELOG.md`, with conflict markers around the two top-of-Unreleased insertions (`merge-tree.txt`).
- Scenario: `just wt-finish` or the merge stops on a CHANGELOG conflict.
- Fix, at landing: rebase the superproject branch onto origin/main and keep both bullets (SC-480 first, then SC-575, or newest first per the file's habit).
- Nothing else in `9bb80e4b..origin/main` collides. The only other change is the dse pointer bump to `eeed5182`, and the `3609e3e9` bump descends from it, so no other submodule pin goes stale.

### INFO-1 (for the next rebase round, not a finding against this sha)
- dse develop has moved on to `a339e7b3` (SC-572). As instructed, no rebase was done.
- SC-572 is one of the 8 known bugs in this e2e run, so the next round should expect the e2e counts to move and check them against the skill's CURRENT line.

## Gate lines

| Gate | Source | Result |
|---|---|---|
| e2e full @3609e3e9 | measured here (`e2e-full.log`, rc 0, loadavg 2.16 -> 10.57) | `OBSIDIAN-E2E done: 252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs`; known bugs SC-257, SC-355, SC-384, SC-572, SC-577, SC-578, SC-580, SC-588 |
| INIT-X07, fix reverted (revA) | measured | `0/1 ok, 1 failed`, note assert |
| INIT-X07, fix reverted, note assert removed (revB) | measured | `0/1 ok, 1 failed`, on-screen assert `Received: "true"` |
| tsc / lint | r3 logs | rc 0 / rc 0 |
| jest | r3 `jest1.log` | `Tests: 1 skipped, 7080 passed, 7081 total` |
| lifecycle | r3 `lc1`-`lc5` | 21/21, 16/16, 9/9, 4/4 (G-S56 last), 3/3 (G-S59, G-S49, G-S73 ok) = 53/53 |
| shots | r3 `shots.log` + shots dir | rc 0; 592 files; button host-leak 163 kinds / 978 comparisons; capture clip 147 |
| freeze | r3 | `freeze OK (280/280 …)` |
| parity | r3 | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |

Working tree: the plugin is clean at `3609e3e9` and the superproject is at `776f7fad` with ` M draw-steel-elements`, both the same as at the start. No process of mine is left running.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r4-rev-a86fb519d4d8f1584/`)

- `revert-fix.patch`; scratch copies `revA/`, `revB/` (both reverted) and `head/`.
- `e2e-revA.log`, `e2e-revB.log`, `e2e-full.log`, each with `.rc` and `.meta`.
- `merge-tree.txt` (the superproject landing conflict).
- The range-diff output is in the r2 scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r2-rev-a86fb519d4d8f1584/rd.txt`.
- r3 logs read: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r3-impl-a1/{tsc,lint,jest1,lc1..lc5,e2e,shots,freeze,parity}.log`.
