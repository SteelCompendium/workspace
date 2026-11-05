# SC-490 rereview1 report: scoped re-review of the rebase and the r2 delta

## Executive summary

- **Verdict: LAND-READY.** dse `e4f394fad26390aa7024ffe7c83c159caa79a975` on develop `09ece2eb`; `origin/develop` re-fetched and still `09ece2eb`. Superproject `a01d8001` on main `ca0cbd1b`; `origin/main` also still `ca0cbd1b`.
- Findings: **0 HIGH · 0 MEDIUM · 0 LOW · 2 INFO**.
- **Rebase:** range-diff shows the 6 r1 commits as 6 of 6 `=`. The superproject `CHANGELOG.md` keeps SC-545's, SC-547's and SC-490's bullets, and the dse pointer is `e4f394fa`.
- **Gates I re-ran:**
  - tsc and lint: rc 0, clean.
  - jest: `Tests: 1 skipped, 6425 passed, 6426 total`, `Test Suites: 1 skipped, 254 passed, 254 of 255 total`.
  - shots: 592, 0 FAIL, rc 0, host-leak `161 … = 966 comparisons`, and `montage board scroll OK` names fine/dark, coarse/dark, fine/light, coarse/light and "dark AND light theme".
  - freeze: `freeze OK (280/280 …)`.
  - parity: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`
- **Can-fail proofs, re-run by me:**
  - The LOW-1 jest guard fails when the dark stops are retuned, when the light stops are retuned, when the dark corner literal is moved, and when the light name literal is moved out of range. It passes the unmutated tree.
  - A translucent light name fill fails the board-scroll gate in both light contexts (40 `PINNED CELL NOT OPAQUE` lines), and neither dark context fails.
- I did not run lifecycle or e2e, and I agree they are not needed: the delta outside the rebase is CSS comments, one jest test and a harness gate, and the rebase content is `=`.
- The rulings were followed as written. Nothing ruled DROP was done.

## 1. Rebase

`git range-diff 0698550f..b3378747 09ece2eb..e4f394fa~2`:

| r1 commit | rebased commit | range-diff |
|---|---|---|
| `b8315d0b` | `98fdf251` | `=` |
| `26e4a45f` | `643b7f3c` | `=` |
| `8fe2ecdc` | `0c3bc665` | `=` |
| `3bd7b464` | `a104148d` | `=` |
| `0797a958` | `05360ca7` | `=` |
| `b3378747` | `0910779f` | `=` |

No content changed.

Superproject `ca0cbd1b..a01d8001` touches only `CHANGELOG.md` (+8: the SC-490 bullet, placed third under `## Unreleased` after SC-545's and SC-547's, both intact) and the `draw-steel-elements` gitlink, which is `e4f394fa`. r1's old superproject commit also carried a `HANDOFF.md` line; it is not in this commit, and the SC-490 handoff row is still on `main`'s `docs/handoffs/HANDOFF.md:94`, so nothing is lost.

## 2. The two new commits

### `214f17e4`: LOW-1 option A

- **CSS:** `styles-source.css` changes comments only; every changed line is inside a `/* … */`.
  - The pin block's comment states the coupling and the drift on tall cards, and says "No new token (DESIGN.md rule 3)".
  - A reverse pointer sits above each `--dse-card-bg` definition: dark at `:6999-7001`, light at `:14314-14315`.
  - The literals are unchanged: `#23292d`, `#f8f9f9`, `#21282b`, `#fcfdfd`.
- **Jest guard** (`test/dom/elements/montage.test.ts:2129-2163`):
  - It finds exactly two `linear-gradient(160deg, #…, #…)` definitions of `--dse-card-bg` (`toHaveLength(2)`), taking the dark one first and the light one second in file order.
  - It reads the four literals out of the SC-490 rules, last `#rrggbb` of each `background`, from the dark rule and from its `body.theme-light &` override.
  - It asserts each channel lies between its theme's two stops.
- **Can-fail runs** (scratch worktree at `e4f394fa`; `S/rr-guard.log`):

| Mutation | jest |
|---|---|
| none | rc 0, 1 passed |
| dark stops retuned to `#1e2428, #181c1f` | rc 1, failed on `cell: "name"` |
| light stops retuned to `#f6f7f7, #eef1f1` | rc 1, failed on `cell: "name"` |
| dark corner literal `#21282b` → `#2a3034` | rc 1, failed on `cell: "corner"` |
| light name literal `#f8f9f9` → `#e8e9e9` | rc 1, failed on `cell: "name"` |
| light name literal `#f8f9f9` → `#ffffff` | rc 0, passed (INFO-1) |

- **Ruling check:** this is LOW-1 option A as ruled. Cross-references sit at both definitions and at the literals; the guard is a stop-range check; no token was added; no option B or C work was done.

### `e4f394fa`: INFO-4

- `visual-harness/shoot.mjs:1078-1080`: the board-scroll gate now loops over `[fine, dark]`, `[coarse, dark]`, `[fine, light]` and `[coarse, light]`. The page is loaded with `bg`, and the failure label and result line name the theme. Every check is unchanged and applies in both themes: pinned position, sticky, opaque, edge rule, hit-test, reachable, Tab and Shift+Tab, fits and re-pin.
- **Can-fail run** (`S/rr-canfail-lighttranslucent.log`): the light name fill `#f8f9f9` was replaced with `rgba(0, 0, 0, 0.012)`.
  - `MONTAGE BOARD CLIPS INSTEAD OF SCROLLING — fine pointer, light theme …` and `… coarse pointer, light theme …`.
  - 40 lines of `PINNED CELL NOT OPAQUE — … name cell Kira background-color rgba(0, 0, 0, 0.01)` at rest, mid-scroll and full scroll.
  - No dark-theme failure; gate rc 1.
  - So the light contexts really render light (`body.theme-light` applies) and are not vacuous.
- **Ruling check:** this is INFO-4 as ruled.

DROP items were left alone:
- INFO-1: no corner-bleed change.
- INFO-2: no harness view loading.
- INFO-3: the re-pin is unchanged (`BoardView.ts` is untouched since `98fdf251`).
- INFO-5: no new shot (592 unchanged).
- r1 follow-ups 1, 2, 3 and 5: nothing done.

## 3. Gates (my runs; `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-a7e5ad5d9f152a0e1/`)

| Gate | Measured | Log |
|---|---|---|
| tsc | rc 0, no output | `S/rv1-rr-tsc.log` |
| lint | rc 0 (only the old `.eslintignore` warning) | `S/rv1-rr-lint.log` |
| jest | `Tests: 1 skipped, 6425 passed, 6426 total` · `Test Suites: 1 skipped, 254 passed, 254 of 255 total` (expected 6425 / 1 / 254 of 255) | `S/rv1-rr-jest.log` |
| shots | 592 PNGs, 0 FAIL, rc 0; `button host-leak OK (161 … = 966 comparisons …)`; `montage board scroll OK (… fine/dark: 1359px grid in a 690px frame … coarse/dark: 2255px … fine/light: 1359px … coarse/light: 2255px …, 85 Tab + 85 Shift+Tab stops (5 + 6 in pinned cells …) each …, fine AND coarse pointer, dark AND light theme)` | `S/rv1-rr-shots-r1793695363.log` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` | `S/rv1-rr-freeze.log` |
| parity | `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, rc 0 | `S/rv1-rr-parity.log` |

**Load:** `/proc/loadavg` was 20.45 when shots started. The cause was SC-557's deliberate `sh -c while :; do :; done # sc557-r1-load-busy` loops (10 processes, not mine; I left them alone). The run still passed every check, wall time about 1,108 s. Freeze and parity ran at loadavg 3.8–5.

**Working tree:** `git status --porcelain` was empty in the worktree superproject and its dse submodule before and after; dse HEAD is still `e4f394fa`. My probes ran in a detached scratch worktree, now removed.

## Findings

### INFO-1: the guard checks a range, not the exact literals

`montage.test.ts:2129-2163`. The guard accepts any literal inside the stops: `#f8f9f9` → `#ffffff` passes, since `#ffffff` is the light top stop. So it catches a token retune that leaves the literals outside the new range, but not a literal edited within the range. That is the guard as ruled ("stays inside its theme's `--dse-card-bg` gradient stops") and it is enough for the coupling it exists to protect. No action.

### INFO-2: approximate line pointers in the new comments

`styles-source.css:4707` says "~:7000 dark, ~:14310 light"; the definitions are at `:7002` and `:14316`. The `~` and the "search SC-490" pointer make this harmless. No action.

## Artifacts

All under `S`:
- **Gate logs:** `rv1-rr-tsc.log`, `rv1-rr-lint.log`, `rv1-rr-jest.log`, `rv1-rr-shots-r1793695363.log`, `rv1-rr-freeze.log`, `rv1-rr-parity.log` (each with a `.rc`, except shots, whose rc is the log's `END … rc=0` line).
- **Jest guard can-fail:** `rr-guard.sh`, `rr-guard.log`, `rr-guard-<mutation>.log`.
- **Light gate can-fail:** `rr-canfail.sh`, `rr-canfail-lighttranslucent.log`, `rr-gate-only-run.mjs`, `gate-only-gen.mjs`.
