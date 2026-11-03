# SC-552 r5 scoped re-review (R1, agent ad6d3563992bb99bd) — r4 delta f110be1b + 3871e673 on ea78ebf8; superproject b166e60b

## Executive summary
- **Verdict: LAND-READY.** No HIGH and no MEDIUM; 1 LOW (documentation, does not block); 3 INFO.
- **MEDIUM-1 closed:**
  - My r3 holder-leak jest probe is green on HEAD (0 holders over 5 cycles).
  - In real Obsidian the registry `_children` stays flat over 5 Saves and over 4 Cancel + outside-edit cycles, in RV and LP. On 260763ab it grew +1 per cycle.
  - The new G-S64 holder checks FAIL on both closed-flag mutants: (a)-(i),(k) report 1..8 components left, and (t) fails.
- **LOW-3 closed:** R3-M9 is now red in jest. Every other r3 mutant is red too, except R3-M11, which is equivalent.
- **LOW-1 closed:** the CHANGELOG now claims only what was measured and says nothing about SC-556's case. **LOW-2:** the comment is present and correct about the consequence, but slightly imprecise about the condition (INFO-1).
- **Rebase seam:**
  - Range-diff: 8 of the 10 commits are `=`. The other two `!` touch only the context lines of `twin-reuse.test.ts`, where both branches append at the end.
  - The src delta of the rebased 26d5f5eb is line-for-line identical to the r3-reviewed 260763ab.
  - SC-547's `PassMemo` is used only on the LP reconcile scope path, which neither `pinPosition` nor `pinnedTarget` uses.
- **Gates on 3871e673:**
  - tsc and lint clean.
  - jest `Tests: 1 skipped, 6428 passed, 6429 total` / `Test Suites: 1 skipped, 255 passed, 255 of 256 total`.
  - lifecycle `--only=G-S57,G-S61,G-S64` `3/3 ok, 0 failed` (223 s).
  - e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
  - styles.css sha256 93be34af…, unchanged.
- `origin/develop` = ea78ebf8 (has not moved).
- Tree status:
  - Plugin worktree: clean before and after.
  - Superproject worktree: ` M draw-steel-elements` before and after. This is the known stale pointer: c64edebc pins 260763ab, while the branch is at 3871e673; the dispatcher bumps it.

## Findings
- **LOW-1 — the dse-verify proposal disagrees with itself on part timings.**
  - Where: `sc552-dse-verify-proposal.md`. The CURRENT block gives r4's 183/323/278/297/175 s. The "Row 4" bullet still gives r2b's 183/320/277/296/199 s.
  - Risk: the dispatcher pastes two different sets of numbers into SKILL.md.
  - Fix: make Row 4 use r4's numbers.
  - The same file says "every form phase also asserts … holders() === 0". Measured, only (a)-(i),(k) and (t) carry the check; (m) and (q) Save without it. Either say "(a)-(i), (k)" or add the check to (m) and (q).
- **INFO-1 — the LOW-2 comment is slightly broad about when the pin is refused.**
  - Where: `src/framework/host/lineMap.ts:7-12` and `ReadingModeBlockHost.ts:781`. The comment says "an outside edit of more than this many lines".
  - Actual condition: more than 400 edits in the changed region that contains the pinned line. Edits all above or all below the block map through the head/tail strip whatever their size.
  - The consequence it describes is correct: the form never saves and no data is at risk.
  - Optional wording: "an outside edit that changes more than this many lines both above and below the block".
- **INFO-2:** my r3 evidence file `sc552-r3-jest-holder-leak-probe.test-snippet.ts` had been truncated by `tail -40`. I replaced it with the full 27-line describe block, which is the one I ran here.
- **INFO-3:** the r4 report and the ledger say superproject b166e60b is CHANGELOG only; confirmed (`CHANGELOG.md | 6 +++---`). The pointer is still c64edebc's 260763ab.

## What was executed
- `git range-diff 0698550f..260763ab ea78ebf8..3871e673`: 1 `!` (3bf46a87, twin-reuse.test.ts context only), 2-3 `=`, 4 `!` (1eba9814, twin-reuse.test.ts hunk header only), 5-10 `=`, plus 2 new commits (f110be1b, 3871e673).
- f110be1b src delta:
  - `FormModal.ts`: a `closed` flag set at the top of `close()`, and `keepOpenOn` returns early on `kept || closed`. Correct; no other path changed.
  - Comments in `lineMap.ts` and `pinnedTarget`.
  - `shownIn` added to the "section is still there" test.
- Jest mutants (my r3 set plus two new; 4 SC-552 suites, 135 tests):

  | Mutant | jest |
  |---|---|
  | R5-M12 closed guard removed | 1 red ("a form that already closed (Save, Cancel) is never kept open…") |
  | R5-M12b closed never set | 1 red |
  | R3-M9 | 1 red (was surviving) |
  | R3-M1 … R3-M15, except M11 | all red (unchanged) |
  | R3-M11 | survives (equivalent) |

- G-S64 on the R5-M12 and R5-M12b bundles: FAIL "(a) 1 … (k) 8 component(s) left on the registry after Save" plus (t).
- Real Obsidian, HEAD bundle (main.js 6ce844ee… = the worktree build), registry `_children`:
  - `N-solo-rv-x5-save` [1,1,1,1,1,1]
  - `N-p3-rv-x5-save` [3,3,3,3,3,3]
  - `N-c3-lp-x5-save` [3,3,3,3,3,3]
  - `N-p3-rv-x4-cancelext` [6,6,6,6,6]
  - `N-c3-lp-x4-cancelext` [3,3,3,3,3]
- Forms kept open after their view is thrown away still behave as before:
  - `F-c2-rv-p0-f1-g150` is clean: the form stays open and saves into the lower block.
  - `D-p2-rv-f1-e1` is clean: no write, a Notice, and the form stays open.
- CHANGELOG (worktree superproject `CHANGELOG.md:11-18`): "another block was edited (by you elsewhere, or by a sync)". The deleted-block parenthesis is gone, and nothing claims an edit of the form's own block. Matches what was measured.
- Proposal: 19 phases, (a)-(i) and (k)-(t). Part placement is right: G-S64 in part 3 after G-S52. Base red list and r4 numbers match, apart from LOW-1.

## Evidence (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/)
- Gates: `sc552-r5-gate-tsc.log`, `sc552-r5-gate-lint.log`, `sc552-r5-gate-jest.log`, `sc552-r5-gate-lc-seam.log`, `sc552-r5-gate-e2e.log`
- `sc552-r5-range-diff.txt`
- MEDIUM-1: `sc552-r5-jest-holder-leak-probe.log`, `sc552-r3-jest-holder-leak-probe.test-snippet.ts` (fixed), `sc552-r5-probes.log`, `sc552-r5-probe-head-n.json`
- Mutants: `sc552-r5-mutants-jest.txt`, `sc552-r5-mutants.py`, `sc552-r5-lc-mutant-R5-M12-closed-guard-removed.log`, `sc552-r5-lc-mutant-R5-M12b-closed-never-set.log`
