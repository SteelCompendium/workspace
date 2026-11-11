# SC-588 r4 — scoped re-review of the r3 delta

**Executive summary**
- Verdict: **LAND-READY.** Reviewed dse `a39eaabd` on `e5b6f9f2`, superproject `3ec78c55`. Findings: 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO.
- **Rebase is faithful.** `range-diff 79da77f8..d62803db e5b6f9f2..HEAD` shows `40f760f9 = a031e23e` and `d62803db = c818debc`. Only one new commit was added: `a39eaabd`, which changes `CHANGELOG.md` only. The src/test/e2e diff against each base is byte-identical apart from the `index` lines. There were no conflicts, so no conflict resolution to name.
- **Both changelogs apply the r2 rulings:**
  - the claim is now "in Reading view" and the entry ends "In Live Preview focus is still lost when the note saves a moment later (SC-602).";
  - the mouse sentence now reads "A mouse click never pulls focus into the tracker";
  - the dse entry is re-wrapped to 124-128 chars, like its neighbours.
  - Both read as plain, user-facing text.
- **My re-runs at a39eaabd:**
  - e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, with RECOV-R07 ok;
  - lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` **6/6**.
- **Implementer's own logs confirmed:**
  - tsc/lint exit 0;
  - jest `7301 passed / 2 skipped`, 263 of 264 suites;
  - lifecycle 21+16+9+4+6 = **56/56**;
  - e2e as above;
  - styles.css sha256 equal to a clean e5b6f9f2 build (`5e5ff488…2b27`).
- **Jest delta is +18, not +17, and every test is accounted for** (INFO-1). The arithmetic is 7283 + 18 = 7301.
- Branch left as found: dse porcelain clean, HEAD `a39eaabd`; superproject ` M draw-steel-elements` (the unstaged pointer), HEAD `3ec78c55`.

## 1. Rebase faithfulness
- `git range-diff 79da77f8..d62803db e5b6f9f2..HEAD` (`r4-range-diff.txt`):
  - `1: 40f760f9 = 1: a031e23e` (fix);
  - `2: d62803db = 2: c818debc` (tests/e2e/changelog);
  - `-: -------- > 3: a39eaabd` (the r3 wording).
- `git diff 79da77f8 d62803db -- src test e2e` against `git diff e5b6f9f2 a39eaabd -- src test e2e`, with `index` lines dropped: identical (`r4-old.diff`, `r4-new.diff`).
- `a39eaabd` touches `CHANGELOG.md` only (+7/-5).
- The r3 report says the rebase was clean, and the range-diff agrees: there was no conflict resolution.

## 2. Changelog rulings
- **dse `CHANGELOG.md:25-31`:**
  - The headline ends "…and the Malice quick-add, in Reading view** (SC-588)".
  - It contains "A mouse click never pulls focus into the tracker, and neither does a rebuild that starts while focus is somewhere else."
  - It closes with "In Live Preview focus is still lost when the note saves a moment later (SC-602)."
  - Line lengths are 128/127/126/127/127/124/98. The neighbouring entries are about 125. LOW-2 is folded.
- **Superproject `CHANGELOG.md` (`3ec78c55`):**
  - The headline is "…Malice quick-add, in Reading view (SC-588).", in the same bold "DSE plugin:" headline shape as SC-595 and SC-592.
  - The body carries the same two sentences, wrapped at about 130 chars.
- Both entries are plain, user-facing and accurate to the r2 probes:
  - In Reading view, focus survives the save (focus checked at +0.3, +1.5 and +3 s).
  - In Live Preview, focus is lost after about 0.4 s.
  - A mouse click blurs a quick-add field but never moves focus into the tracker.

## 3. Gates
| Gate | Source | Result |
|---|---|---|
| tsc / lint | r3 `tsc-a.log` / `lint-a.log` | `TSC_EXIT=0` / `LINT_EXIT=0` |
| jest (fresh) | r3 `jest-full.log` | `Tests: 2 skipped, 7301 passed, 7303 total`; `Test Suites: 1 skipped, 263 passed, 263 of 264 total`; `JEST_EXIT=0` |
| lifecycle p1-p4 | r3 `life-p1..p4.log` | 21/21, 16/16, 9/9, 4/4 (G-S56 last) |
| lifecycle p5 | r3 `life-p5.log`, **and my re-run** `r4-life-p5.log` | 6/6 both (`--only=G-S59,G-S49,G-S73,G-S77,G-S83,G-S87`), GATE_RC=0 |
| e2e | r3 `e2e-full.log`, **and my re-run** `r4-e2e-full.log` | `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` both. Pointer parked, no WARN. Known bugs SC-257, SC-355, SC-384, SC-580. RECOV-R07 ok (1254 ms) |
| styles.css | r3 `css-sha.log` | `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, the same for the clean e5b6f9f2 build and HEAD, so shots, freeze and parity carry |

## INFO
1. **Jest delta +18, explained.** The brief expected "+17 new SC-588 tests". The measured split:
   - `initiative-matrix.test.ts`: 140 → 149 (+9). Ten [F] tests were added and the `test.failing` M04 was removed. This was measured at the true base (a `git archive e5b6f9f2` tree) and at HEAD.
   - `controlFocus.test.ts`: new, +7.
   - `kit-index.test.ts`: 83 → 85 (+2). Its two per-kit-file guards ("zero color literals" and "never imports from src/elements/") now also run over the new `src/framework/kit/controlFocus.ts`, and both pass.
   - Total: 16 hand-written + 2 generated = **+18**, and 7283 + 18 = 7301 exactly.
   - A side note: a `git archive` base tree reads 7281 passed / 4 skipped. That is still 7285 total, the same as the 7283/2 fresh-worktree base. The difference is only in which tests skip in a tree with no `.git`; the total is unaffected.
2. dse `origin/develop` is now `ce4937ef` (SC-570, test code only). As instructed I did not rebase; the next round rebases. RECOV-R07 was green in my e2e run at a39eaabd.

## Branch state
- Start and end:
  - `git -C …/draw-steel-elements status --porcelain` is empty; HEAD `a39eaabd`.
  - The superproject shows ` M draw-steel-elements`; HEAD `3ec78c55`.
- I ran the gates in the worktree. Per protocol I removed its ignored `main.js` and `styles.css` before jest; the e2e and lifecycle runs then rebuilt them.
- Base counting used my own scratch `git archive` tree, not the worktree.

## Artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc588-r4-review/`)
- `r4-range-diff.txt`, `r4-old.diff`, `r4-new.diff`
- `r4-e2e-full.log`, `r4-life-p5.log`
- `r4-base-jest.log`, `r4-matrix-truebase.log`, `r4-count-base.log`, `r4-count-head.log`, `r4-enum2.log`, `r4-census-base.log`, `r4-census-head.log`
- `base-e5b6f9f2/` (scratch base tree; `node_modules` symlinked)
