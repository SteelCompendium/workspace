# SC-621 r5: scoped re-review of the r4 delta (reviewer C)

**Executive summary**
- **Verdict: LAND.** CRITICAL 0, HIGH 0, MEDIUM 0, LOW 0, INFO 2.
- **Range-diff** `14521bf0..56ad4d1c` vs `b1e4f027..96955985`: commits 1-5 are `=`, so the rule code and every r2 test are byte-identical. There was no conflict resolution against SC-568 in our files. The only new commits are 37c99b38 (comment), cd8342f7 (G-S115 dead code) and 96955985 (settle helper).
- **Folds:** LOW-1..LOW-4 and the owner's "often not redrawn" note are folded as ruled. The superproject has ONE CHANGELOG commit `ad3ae246` on origin/main `e7e34279`, with no pointer commit.
- **G-S115:** still 9 cells, (a)-(i). On the r4 bundle (main.js `a866bb27`), part 7 `G-S108,G-S112,G-S115` is 3/3 in 201 s. On the b1e4f027 bundle (`81a67cb8`), G-S115 alone fails as it should: (a)-(f) wrote the other counter, (g)-(i) ok, 70 s. styles.css is `18730938` on both.
- **Jest:** on the r4 head, the twin and sweep files pass 35/35. The full suite on the worktree passes 11892, 2 skipped, 87 s at load 2.7; the SC-624 test did not fire.
- **The settle is not vacuous, and the fix is still detected:**
  - With the fix reverted, 25 tests fail (as r2/r3). With the fix reverted and settle made a no-op, 27 fail.
  - The 2 extra failures are the twin file's two "second timing" tests. Without the settle, their outside write lands before the rebase reads, so they turn into T1 cells. `settleVaultReads` is what makes T2 real.
  - With the fix in place, a no-op settle, a one-hop settle and a helper with its counter disabled all stay 35/35. The fix's tests do not depend on the wait.
- **No spy leak:** the sweep restores only its own `getFileCache` spy. Leaving it unrestored, or putting `restoreAllMocks` back, both stay 35/35 (the spy is on each cell's own `App`). The helper's `cachedRead` wrapper is restored by its own `afterEach`. Each test file has its own module registry, so nothing reaches other suites (full jest green).
- **Skill proposal:** numbers match r4's logs (parts 183/322/406/295/397/296/200 s; jest 11892/2; e2e 338/341; settle 21 s; sweep alone 18.3 s).
- **Tree state:** dse HEAD `96955985`, `git status --porcelain` empty (jest's built main.js and styles.css removed by literal path). Superproject `ad3ae246`, showing ` M draw-steel-elements` by design.

## Checks (brief §1-7)
1. **Range-diff** (`sc621-r5-range-diff.txt`): 1-5 `=`, 6-8 new.
   - 37c99b38 is +3/-2 comment lines at ReadingModeBlockHost.ts:1057-1060. The code line :1062 is unchanged.
   - cd8342f7 is the harness only: 3 insertions, 26 deletions.
   - 96955985 touches the two SC-621 test files only.
   - No SC-568 file was touched by the branch (`test/dom/_settleVaultReads.ts` and `reading-mode-host-pin.test.ts` are as on b1e4f027).
2. **Folds**, CHANGELOG `ad3ae246` (CHANGELOG.md:11-19):
   - LOW-2: "an identical counter next to yours was added or removed (the note then reads the same either way)".
   - Owner note: "is often not redrawn by Obsidian".
   - LOW-1: "Three cases are still written … and, in a note with identical counters, an outside change of more than about 400 lines in the same write".
   - LOW-3: "a note open in its own pane (SC-612)".
   - LOW-1 comment: "R3, a change of more than LINE_MAP_MAX_EDITS lines around the block in the same write, which `placedUniquely` cannot price, so the agreed map stands (SC-612's accepted cap)".
   - LOW-1 skill proposal: R3 is in the §3 residuals.
   - LOW-4 removals: `GS115_C6`, `GS115_NOTE.twin`, `del-first+end`, `del-first+top`, `del-low-keepmark+end`, the `if (plus)` block, and the `plus` parameter at :2510 / :9154. No reference to any of them is left; the remaining `'twin'` hits at :721-725 belong to G-S112.
3. **Lifecycle:** `sc621-r5-lc-part7.log` (3/3, 201 s) and `sc621-r5-lc-base-G-S115.log` (0/1 as it should: (a)-(f) wrote the other counter with no Notice, (g)-(i) passed).
4. **Jest:** `sc621-r5-jest-full.log` (11892 / 2 skipped). Mutants are in `sc621-r5-mutants.log`:

   | variant | twin + sweep result |
   |---|---|
   | orig | 35/35 |
   | S1 settle no-op | 35/35 |
   | S2 one `setTimeout(0)` hop | 35/35 |
   | H1 helper counter off | 35/35 |
   | M0 fix reverted | 25 failed |
   | M0 + S1 | 27 failed (the 2 extra are the T2 tests, `sc621-r5-M0-vs-M0S1-fails.txt`) |
   | L1 cache spy not restored | 35/35 |
   | L2 `restoreAllMocks` back | 35/35 |

5. **Superproject:** `git log origin/main..HEAD` = `ad3ae246` only. origin/main = `e7e34279` after fetch. No pointer commit.
6. **Skill proposal:** matches the `sc621-r4-gate-*.log` numbers. Its R3 numbers (474 T1 cells, distance >= 401, 9/132, +92) are r3's measurements.
7. See the summary: no leak, and the settle is load-bearing exactly where it should be (T2).

## INFO
- **INFO-1: the CHANGELOG gives the wrong reason for the third case.** CHANGELOG.md:16 says "Three cases are still written, as before, because the note's text cannot tell them apart". That is true for R1/R2. For R3, the reason is that a change that large is not priced. The code comment has the same lead clause (ReadingModeBlockHost.ts:1057, "no rule over the text can see them"), then states R3's real reason. Optional wording: "…the first two because the note's text cannot tell them apart, the third because a change that large is not compared". Owner's call. It is true enough for a user.
- **INFO-2: settle no-op still passes 35/35 with the fix in place, because the product awaits its own reads** (`replaceSource` waits for the rebase). The helper adds determinism for the T2 tests only. That is shown by M0+S1, and it is the right property for SC-568's purpose. No action.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/)
- `sc621-r5-rereview-report.md` (this file), `sc621-r5-range-diff.txt`, `sc621-r5-lc-part7.log`, `sc621-r5-lc-base-G-S115.log`, `sc621-r5-jest-full.log`, `sc621-r5-mutants.log`, `sc621-r5-mut5.py.txt`, `sc621-r5-M0-vs-M0S1-fails.txt`.
- Scratch exports and per-mutant logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-r5-revC/` (`r4-tree` 96955985, `r4-base` b1e4f027, `r4-mut`; `mut5-*.log`).
- Cleanup: removed the lifecycle temp dir my base run kept (`/tmp/dse-obsidian-lifecycle-os7R8x`), by literal path.
