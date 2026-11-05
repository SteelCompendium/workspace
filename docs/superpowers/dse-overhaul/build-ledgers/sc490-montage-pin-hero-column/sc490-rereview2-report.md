# SC-490 rereview2 report: the rebase only (dse `e4f394fa` → `248e202b`, superproject `a01d8001` → `cbbc217c`)

## Executive summary

- **Verdict: LAND-READY.** 0 HIGH · 0 MEDIUM · 0 LOW · 1 INFO.
- **(1) dse range-diff:** `git range-diff 09ece2eb..e4f394fa d689b719..248e202b` shows all 8 commits as `=`. `origin/develop` is still `d689b719`.
- **(2) Superproject:** the one `!` (`a01d8001 ! cbbc217c`) is the `CHANGELOG.md` context plus the gitlink (`09ece2eb→e4f394fa` became `d689b719→248e202b`). Against `0d0f210e`, the commit adds only our 8-line bullet: no line removed, so every Unreleased bullet from main is kept. The pointer is `248e202b`.
- **(3) No interaction:** develop `09ece2eb..d689b719` is SC-552 (pinned edit-form writes) and SC-557 (G-S61 recorder). It touches nothing montage, nothing in `BoardView.ts` or `styles-source.css`, and not the shots board-scroll gate. G-S13's block is byte-identical before and after the rebase.
- **(4) Gates:**
  - tsc rc 0.
  - jest `Tests: 1 skipped, 6470 passed, 6471 total` · `Test Suites: 1 skipped, 256 passed, 256 of 257 total` (expected 6470 / 1 / 256 of 257).
  - The board-scroll gate run on its own at `248e202b`: `montage board scroll OK (… fine/dark … coarse/dark … fine/light … coarse/light: 2255px grid …)`, rc 0.
- **INFO-1:** superproject `origin/main` has since moved `0d0f210e` → `f0f5ffef`, one docs-only commit (SC-362/366/543 ledgers and handoff). It does not touch `CHANGELOG.md` or the dse gitlink (still `d689b719` there), so landing needs only a trivial rebase.

## Detail

**(1) dse range-diff**

| e4f394fa side | 248e202b side | Commit |
|---|---|---|
| `98fdf251` | `14ed756a` | feat |
| `643b7f3c` | `b6399abf` | gate |
| `0c3bc665` | `6126f7aa` | Shift+Tab |
| `a104148d` | `0f72f52a` | jest |
| `05360ca7` | `d96b5768` | changelog |
| `0910779f` | `629ee7b0` | G-S13 |
| `214f17e4` | `46882a01` | LOW-1 |
| `e4f394fa` | `248e202b` | INFO-4 |

All eight are `=`. `git diff e4f394fa 248e202b` is 0 lines for `visual-harness/shoot.mjs`, `src/elements/montage/`, `styles-source.css` and `test/dom/elements/montage.test.ts`.

**(2) Superproject**
- `git diff 0d0f210e cbbc217c --stat`: `CHANGELOG.md | 8 +` and `draw-steel-elements | 2 +-`.
- The CHANGELOG diff is additions only (the SC-490 bullet, placed after SC-552's, SC-545's and SC-547's).
- `git ls-tree HEAD draw-steel-elements` = `248e202ba43d211c37d81b802cd9ddb56a5b5d2d`.

**(3) Develop delta** (`git diff --stat 09ece2eb d689b719`, 10 files)
- Changed: `src/authoring/FormModal.ts`, `src/framework/host/{BlockHost,ReadingModeBlockHost,lineMap}.ts`, their tests, `.repo-docs/architecture.md`, and `visual-harness/obsidian-lifecycle.mjs` (new G-S64 plus G-S61 recorder hunks).
- The `ReadingModeBlockHost` change only picks the write target (a block "pin" taken at the first persist, `mapLine`). The rebuild and adoption path that SC-326's scroll restore and SC-490's overflow mark depend on is unchanged.
- No added lifecycle line mentions montage.
- I extracted the G-S13 scenario block from both heads; the md5 is identical (`e0304b7a…`).
- r3's lifecycle (51/51, part 2 incl. G-S13) is consistent with this.

**(4) Gates** (scratch `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-a7e5ad5d9f152a0e1/`)
- **tsc:** `S/rv1-rr2-tsc.log`, rc 0 (`tsc --noEmit && tsc --noEmit -p e2e`). loadavg was 4.4 at start.
- **jest:** `S/rv1-rr2-jest.log`, rc 0, `Tests: 1 skipped, 6470 passed, 6471 total`, `Test Suites: 1 skipped, 256 passed, 256 of 257 total`.
- **Board-scroll gate on its own:** `S/rr2-gate-only.log`. It ran in a detached scratch worktree at `248e202b` with its own harness build, now removed. Result: `montage board scroll OK`, all 4 contexts, gate rc 0.
- **r3's full shots log** (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-r3-impl/gate-shots.log`) also carries the four-context line ending `dark AND light theme)`.
- **Working tree:** the worktree superproject and dse submodule were clean before and after; dse HEAD is `248e202b`.
