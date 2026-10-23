# SC-489 r2 scoped re-review (reviewer B): dse 66f474b on 9f08f06; superproject 21a9557 on 3c7f392

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO (both optional CHANGELOG cosmetics).
- **Range-diff:** r1 commits 3708b54 and 6cfc338 are `=` (identical). 66f474b is the only new commit and changes only the LOW-2 test plus the INFO-1 comment. origin/develop is still 9f08f06, so no real-Obsidian re-run was needed.
- **LOW-2:** the new test has the prescribed shape. My own run: the labels mutant `{ ...this.working }` turns it red (1 failed / 52 passed; `Expected "Default (x)"`, `Received "Default (y)"`). Unmutated: 53/53.
- **INFO-1:** comment-only change at `FormModal.ts:210-214`, with the prescribed wording.
- **LOW-1:** the CHANGELOG now says "Save no longer lowercases or trims values you did not edit (`Climb` stays `Climb`, `style: Chips` stays `Chips`)". It no longer claims the block is kept as written. The dropdown sentence is kept.
- **Superproject:** 8131699 and 21a9557 sit directly on origin/main 3c7f392 and touch only `CHANGELOG.md`. The submodule pointer is still 9f08f06 on both HEAD and origin/main, so there is no bump.
- **My gates at 66f474b:** formModal.test.ts 53/53 · tsc (incl. `-p e2e`) clean · lint clean.
- **A's r2a battery** (logs written after the 15:34:40 commit, all rc 0): jest 5859 / 1 / 241 of 242 · lifecycle 34/34 · e2e 108/108, 0 known-bug, 69/69 · shots rc 0 with all in-run lines · freeze 280/280 · parity 0/0/24.
- The reviewed tree is clean (`git status --porcelain` empty). My scratch worktree was removed; superproject ` M draw-steel-elements` is as found.

## 1. Range-diff
`git range-diff 9f08f06..6cfc338 9f08f06..66f474b`:
- `1: 3708b54 = 1: 3708b54`
- `2: 6cfc338 = 2: 6cfc338`
- `-: ------- > 3: 66f474b`

`git diff 6cfc338..66f474b --stat`: FormModal.ts +3/-2 (comment lines only), formModal.test.ts +17.

## 2. The fix delta
- **LOW-2 test** (`test/dom/authoring/formModal.test.ts:864-879`):
  - Schema: `style` with `transform: [trim, toLowerCase]` and enum `[alpha, beta]`; optional `mode` enum `[x, y]`.
  - Parse: `{ mode: d.mode ?? (d.style === 'alpha' ? 'x' : 'y') }`.
  - Source `style: Alpha`; asserts that the Mode lead option reads `Default (x)`.
  - This matches the ruling.
  - **Mutant re-run:** `b-mutate.py labels-working` in a scratch worktree at 66f474b: 1 failed / 52 passed, failing only this test. The file was restored afterwards and that worktree's status was clean.
- **INFO-1:** only comment lines change in the src diff.
- **LOW-1:** `CHANGELOG.md` lines 13-17 at 21a9557 match the ruling's wording.

## 3. A's r2a logs
Folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-impl-a-x7k2qp/`, files `r2a-*.log` with matching `r2a-*.rc`. Every rc is 0, and every log is timestamped after the commit (15:34:41 to 16:00:58).

| Gate | Result |
|---|---|
| jest | 5859 passed / 1 skipped / 241 of 242 suites; no SC-506 flake |
| lifecycle | `34/34 ok, 0 failed` |
| e2e | `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, pinned 1.14.4 |
| shots | rc 0; host-copy pin OK; button host-leak 113/678; modal 10/228; pressed toggle OK; pipette OK; text scale 1626; text scale once 107256/214; PIN DRIFT warning present; no ALLOWLISTED line, no FAIL |
| freeze | `freeze OK (280/280 …)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |

Mutant evidence: `jest-fm-r2mut.log` (1 failed / 52) and `jest-fm-r2a.log` (53/53).

## 4. Findings
### INFO-1: the bold CHANGELOG title is still broad
The title reads "the block edit form no longer rewrites what you wrote when you save". The body now limits that to case and spaces, so it reads correctly in context. Optional: "…no longer lowercases values you wrote when you save".

### INFO-2: one CHANGELOG line is not re-wrapped
`CHANGELOG.md:16` is 158 characters, while its neighbours wrap at about 110. This is cosmetic only.

## 5. My logs
In `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-review-b-90cwwu/`:
- `r2-mut.sh`, `r2-mutants-summary.txt`, `r2-mutant-tip-unmutated.log`, `r2-mutant-labels-working.log`, `r2-npmci.log`
- `r2-gate.sh`, `r2-gate-fm.log`/`.rc`, `r2-gate-tsc.log`/`.rc`, `r2-gate-lint.log`/`.rc`
