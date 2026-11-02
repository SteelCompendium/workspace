# SC-536 r5 — scoped re-review of the r4 delta (r3 reviewer, resumed)

## Executive summary
- **Verdict: LAND-READY.** Plugin `fb24f8a2` on dse develop `f81a277`; superproject worktree `5325f33b` on main `e0f5c76a`. I found no HIGH, MEDIUM or LOW findings, and 1 INFO.
- **Rebase.** It was a clean replay. The `src/` patch over `f81a277` is byte-identical to the r3-reviewed patch over `458abe3`. The range-diff shows only one changed context line, where the hunk now sits after G-S54.
- **Lifecycle merge.** The merge only adds lines: 0 lines removed from `f81a277`'s `obsidian-lifecycle.mjs`. G-S54 is intact, and G-S56 is the last scenario.
- **Folds.** INFO-3 (one `t.ev`) and INFO-5 (comment) are done as ruled. The base-failure text now reads "8 made" and lists 8 lookups.
- **Superproject.** Its net diff against `e0f5c76a` is `CHANGELOG.md` only, 9 added lines, the same bullet as in r3. The SKILL.md hunk is gone, and the pointer bump is not staged.
- **Proposal.** `sc536-dse-verify-row4-proposal.md` reads correctly against row 4 on `origin/main` (`e0f5c76a`). All three of its anchor strings appear exactly once in that row.
- **Gates I re-ran on fb24f8a2:**
  - tsc and lint: clean.
  - jest: 6228 passed / 1 skipped / 249 of 250 suites, as expected.
  - Lifecycle second half: 22/22 in **535 s wall** (devbox included; load average 11.8 at the start). G-S54 and G-S56 both pass.
  - G-S56 `--only`: 1/1. Together with the author's first half (22/22), lifecycle is 44/44.
- **INFO-1.** The second half fits under 600 s with about 65 s to spare. The proposal's rebalancing note covers this.

## 1. Plugin delta (`458abe3..432c50e2` → `f81a277..fb24f8a2`)
- **range-diff** (`sc536-r5-range-diff.txt`):
  - `36cd8edb = 55cb698c`, `8c1269fb = 1f305e06` and `432c50e2 = effbb9d8` are unchanged.
  - `514946db ! 1be1ebc7`: the only change is one context line. The G-S56 hunk now follows G-S54's `return out.join('; ');` instead of G-S53's return.
  - `fb24f8a2` is new (the r4 folds).
- **`src/`.** `diff <(git diff 458abe3 432c50e2 -- src) <(git diff f81a277 fb24f8a2 -- src)` produces no output, so the patches are identical. Between the two bases, only `src/framework/chrome/mountChrome.ts` changed (SC-533, chrome panel placement), and it does not touch `RefUnwrapView` or `view.ts`. `ReadingModeBlockHost.ts` is untouched.
- **`obsidian-lifecycle.mjs`.**
  - `git diff f81a277 fb24f8a2` on this file has 0 removed lines.
  - The scenario ids run in order G-S50 (:3342), G-S53 (:3581), G-S54 (:3807), G-S56 (:3927). `SCENARIOS` closes at :4103, so G-S56 is last.
- **INFO-3 fold.** `fb24f8a2` deletes the `calls`/`raws` helpers from `gs56Kit` (:963-964 in the old numbering). `stepThrough` now reads both in one eval: `({ lookups: window.__gs56.calls, raws: window.__gs56.raws.slice() })` (≈:3988).
  - The `K.calls` / `K.raws` names left at :923-924 and :956-957 are the in-page `window.__gs56` object, not the deleted helpers.
  - The author's base run confirms the fix: "8 made: … 8 × @Gs56Cyc.md" (`sc536-r4-lifecycle-gs56-base-f81a277.log`).
- **INFO-5 fold.** A comment at G-S56 (:3924-3926) says three things:
  - it runs last;
  - it detaches every other markdown and sidebar leaf first, and why;
  - a later scenario must set up its own leaves.

## 2. Superproject worktree
- `HEAD 5325f33b`, parent `e0f5c76a`, which equals `origin/main` and the merge base.
- `git diff --stat e0f5c76a 5325f33b` shows `CHANGELOG.md | 9 +` and nothing else; `.claude/skills/dse-verify/SKILL.md` is untouched.
- The bullet text matches r3 word for word: diffing the old `2f5eb7d1` against `5325f33b` shows no change to the SC-536 lines.
- `git status --porcelain` shows ` M draw-steel-elements` and nothing is staged, so the pointer bump is unstaged.
- **Proposal file**, checked against row 4 (line 30) of `origin/main:.claude/skills/dse-verify/SKILL.md`:
  - The count `43/43 ok, 0 failed`, the halves `(22 + 21)` and the end anchor `the shipped build passes both; G-S16 reserved for SC-471)` each appear exactly once.
  - So the proposal's replacements, and its insertion point before `; G-S16 reserved for SC-471)`, apply unambiguously.
  - The proposed G-S56 sentence matches the scenario's behaviour, the ruled wording and the INFO-5 comment.

## 3. Gates (re-run by me; logs in the ledger dir)
| Gate | Result | Log |
|---|---|---|
| tsc / lint | rc 0 / rc 0 | `sc536-r5-gate-tsc.log`, `sc536-r5-gate-lint.log` |
| jest | Tests: 1 skipped, **6228 passed**, 6229 total; Suites: 1 skipped, 249 passed, **249 of 250**; rc 0 | `sc536-r5-gate-jest.log` |
| lifecycle second half (G-S9d … G-S54, G-S56; port 9591) | **22/22 ok, 0 failed**, rc 0, **535 s wall** including devbox start (load average 11.75 → 3.56). G-S54 ok (LP 10/10, RV 10/10, inset/gap 10/0). G-S56 ok, all 6 phases. | `sc536-r5-lifecycle-b.log` |
| G-S56 `--only` (port 9592) | **1/1 ok**, rc 0 | `sc536-r5-lifecycle-gs56-only.log` |
| lifecycle first half | not re-run (outside the brief's scope); the author's 22/22 is in `sc536-r4-lifecycle-a.log` | — |

e2e, shots, freeze and parity were not re-run. The brief does not ask for them, and the `src/` patch is identical to the one that passed r3's e2e. The author's r4 numbers are in the ledger.

## 4. Findings
- **INFO-1: the second lifecycle half leaves about 65 s of headroom against the 600 s tool timeout** (535 s here, 542 s for the author).
  - Failure scenario: one more scenario added to that half, or heavier load, pushes it past the timeout.
  - Prescribed: no action in SC-536. The proposal's §1 already suggests moving G-S9d/e/f/c into the first half (198 s); the dispatcher can apply that when it updates row 4.

## 5. Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/`)
- Report: `sc536-r5-rereview-report.md`.
- Logs: `sc536-r5-gate-{tsc,lint,jest}.log`, `sc536-r5-lifecycle-b.log`, `sc536-r5-lifecycle-gs56-only.log`.
- Range-diff: `sc536-r5-range-diff.txt`.
- Scripts: `sc536-r5-gates.sh.txt`, `sc536-r5-lifecycle-only.sh.txt`, `sc536-r5-gate.sh.txt`.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r5-rev7k/`.
- Worktree after review: plugin `fb24f8a2`, clean; superproject ` M draw-steel-elements` only, as found.
