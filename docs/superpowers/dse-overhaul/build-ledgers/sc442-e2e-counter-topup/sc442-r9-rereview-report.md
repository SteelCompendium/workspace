# SC-442 r9 scoped re-review: r7 INFO fixes and rebase onto `758a8956`

## Executive summary
- **Verdict: LAND-READY** at dse `9be108c9ed6dc88b2c2db3046c572f6792fc6f68` (base develop `758a8956`).
- **Findings: 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 0 INFO. New product bugs: 0.**
- Range-diff: commits 2-8 are unchanged (`=`). Commit 1 differs only in the anchor for the census-file imports and the describe block (SC-443's code now sits around it). Commit 9 is the INFO fix commit and touches only one comment line in `counter-bugs.e2e.ts` and the `wrong-*` row and comment in `e2eCensus.test.ts`.
- The merge is purely additive. `git diff 758a8956 HEAD` removes 0 lines from `test/dom/e2eCensus.test.ts`, `e2e/README.md` and `e2e/specs/_census.e2e.ts`, so SC-443's census block and README rows are byte-identical to develop's. `src/` diff is empty.
- INFO-1 is a real assertion. With SC-672 undone in a scratch worktree, all 4 `wrong-*` rows go red at `root.hasAttribute('data-dse-error-stage')` (`Expected: true, Received: false`). It pins only the error card, which SC-672 ruled and fixed.
- Gates (light): tsc incl. `-p e2e` rc 0. Targeted jest over 7 suites: `Tests: 383 passed, 383 total`, `Test Suites: 7 passed, 7 total`.
- Implementer sums check out: known-bug 7 + 4 = 11; coverage 466 + 10 = 476; tests 779 + 26 = 805; ok 772 + 22 = 794.
- Working tree clean before and after; scratch worktree removed; nothing committed or pushed.

## Checks

1. **Range-diff PASS.** `git range-diff 957e4b11..6d5a2caa 758a8956..9be108c9` gives:
   - Commits 2-8: `=`.
   - Commit 1 (`b8c1f28a`): `!` in `test/dom/e2eCensus.test.ts` only. The two counter imports now follow SC-443's imports (`_refHarness`), and the counter describe follows `describe('authoring surface census (SC-443)')`. Nothing else in commit 1 moved, and its README hunk did not change.
   - Commit 9 (`9be108c9`) is new, with three changes:
     - The CTR-N01 comment at `counter-bugs.e2e.ts:104`.
     - The INFO-2 comment at `e2eCensus.test.ts:1126`.
     - The INFO-1 assertion at `e2eCensus.test.ts:1182-1186`.
   - Byte comparison of 6d5a2caa vs 9be108c9: `manifest/counter.ts`, `counter-typed.e2e.ts`, `counter-steppers.e2e.ts` and `counter-matrix.test.ts` are identical. `counter-bugs.e2e.ts` differs on line 104 only.
2. **`e2eCensus.test.ts` PASS.**
   - Merge: 0 removed / 141 added lines against `758a8956`, so both sides' imports are kept and SC-443's describe is byte-identical to develop's. The counter describe matches what r7 reviewed, plus the INFO lines.
   - INFO-1 probe: in scratch worktree `r9-wt`, `src/model/Counter.ts` was taken from `8c08bce2`, then `jest -t "SC-442 census"` was run. 12 rows went red:
     - the 4 `wrong-*` rows, at the new `hasAttribute` assertion;
     - the 8 empty-shape `RENDERS` rows, as already seen in r7.
   - The assertion covers both host modes (it sits inside the `canPersist` loop). It pins nothing SC-672 left open: SC-672 rules that every non-map shape is a plain error card.
   - INFO-2 comment ("an error-card fixture is named `wrong-*`; one that is misnamed lands in RENDERS and goes red there") and INFO-4 comment ("the wheel records no pair; the type and blur drives record the declared counter.input pairs") are accurate.
3. **`e2e/README.md` PASS.** The diff against `758a8956` is +7 rows (this branch's fixtures), with 0 lines removed, so every develop row survives, SC-443's included. Each of the 20 `Counter/*.md` fixture files has exactly one row.
4. **`src/` and ids PASS.** `git diff --stat 758a8956 9be108c9 -- src` is empty. No `[CTR-*]` or `[CENSUS-*]` title is duplicated. The only repeated brackets are U01 / W01 / W02, which also appear in the `counter-bugs.e2e.ts` header comment. CENSUS-30..34 (SC-443) and CENSUS-18 / 19 each appear once.
5. **Gates PASS.**
   - tsc (`tsc --noEmit && tsc --noEmit -p e2e`): rc 0, 12 s.
   - jest on `e2eCensus`, `counter-matrix`, `counter`, `counter-own-keys`, `counter-wrong-block` (dom) and `counter-serialize` / `counter-wrong-block` (unit): `Tests: 383 passed, 383 total`, rc 0.
   - Implementer numbers on 9be108c9 are consistent:
     - 11 known-bug = 7 baseline + CTR-V01, CTR-V02, CTR-Q01, CTR-N01.
     - 476 pairs = 466 + the 10 new counter pairs.
     - 805 tests = 779 + the branch's 26; 794 ok = 772 + 22.
   - jest 14438 / 1 vs base 14272 / 1 is +166, the same delta measured at r7.
   - Full jest, e2e, lifecycle, shots, freeze and parity were not re-run, because nothing above looked wrong.

## Findings
None.

## Artifacts
Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc442-rev-r7/`
- `r9-range-diff.txt`: the range-diff
- `r9-tsc.log`: tsc
- `r9-jest.log`: targeted jest
- `r9-mj-672undo.log`: the INFO-1 mutation probe
- `r9-wait.sh`: wait helper
