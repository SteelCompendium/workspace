# SC-126 round 8 report — final fold (r7 LOW-R7-1, LOW-R7-2, INFO-R7-1)

**Verdict: DONE.** dse commit `5a5ed49` requotes the compare.cjs cross-reference to
r6's renamed README heading and fixes the ink GAP message's channel clause to 3dp
(`toFixed(0)` → `toFixed(3)`), updating the two message-text literals it affects.
Superproject commit `4cdb43f` requotes the SKILL.md "Full reasoning" cross-reference
(same stale heading, split across a line wrap) and bumps the battery-numbers snapshot
header from 2026-09-17 to 2026-09-18. Swept both files (line-wrap-tolerant) for any
other quote of the old heading text ("is now fully compared") — none found beyond the
two already flagged. Gates (all foreground, unpiped): tsc/lint clean; jest **3889**
passed / 1 skipped / 202 of 203 suites — **unchanged**, no new tests, message-format-
only round; `npm run parity` **0 gap(s) / 0 undeclared warning(s) / 16 declared
deferral(s), exit 0**, unchanged composition. Declared `ink` row (light scheme) now
reads `(max channel 77.000 > 2 FIRES; alpha 0.000 ≤ 0.03)`. No CSS/fixture change;
nothing pushed; no submodule pointer bump committed.

---

## 1. LOW-R7-1 — orphaned cross-references to r6's renamed README heading

r6 renamed README.md's "Known limitation" heading from *"`background-color` is now
fully compared"* to *"`background-color` is fully compared"*, but left two
cross-references elsewhere quoting the old wording:

- `visual-harness/parity/compare.cjs:125-126` (the `bgFamily`-comment cross-reference,
  above the `bg-polarity` rule 1b block): requoted to
  `see README.md "Known limitation — \`background-color\` is fully compared"`.
- `.claude/skills/dse-verify/SKILL.md:757-759` (the "Full reasoning" cross-reference at
  the end of the SC-126 material-class paragraph): requoted to
  `"Known limitation — \`background-color\` is fully compared; the residual is
  \`background-image\`."` — this one's original text was split across a line wrap
  (`… is now fully\ncompared; …`), which is why a naive single-line grep for the old
  phrase missed it; a `tr '\n' ' '`-joined grep found it.

**Sweep performed** on both files (and README.md/compare.cjs together) with a
line-wrap-tolerant search (`tr '\n' ' ' | grep -o "is now fully[^.]*compared[^.]*\."`):
zero remaining hits anywhere in the touched files after the fix.

## 2. LOW-R7-2 — ink row's channel clause still rounded to whole pixels

`compare.cjs`'s ink GAP message computed a `FIRES`/silent verdict correctly (r6's fix)
but still printed the channel delta at `toFixed(0)`, so a delta just over the tolerance
threshold could round down to a boundary value in the printed string — e.g. the
reviewer's reproduction, `rgb(20,20,20)` vs `rgb(22.4,22.4,22.4)` (delta 2.4, fires),
printed `max channel 2 > 2 FIRES`, which reads as false (2 is not `> 2`). Same rounding-
precision class as LOW-1's original deposit-axis defect.

**Fix:** `dRgb.toFixed(0)` → `dRgb.toFixed(3)`, matching the alpha clause's precision
and the `bg-color` message's shape exactly. **Tests updated:** the two `ink`
per-axis-verdict tests added in the previous round now assert `190.000` and `0.000`
instead of the bare integers (3 assertion sites: `max channel 190\.000 > 2 FIRES`,
`max channel 0\.000 ≤ 2`, and its `not.toMatch` negative counterpart).

## 3. INFO-R7-1 — stale snapshot header date

`.claude/skills/dse-verify/SKILL.md:136`'s "Battery numbers at SC-126 step 2
land-ready" header was still dated 2026-09-17 while the paragraph's figures (rewritten
in the previous round) are today's measurements. Bumped to 2026-09-18, per the owner's
instruction to fix it while already editing this file this round.

## Gate numbers

| Gate | Before this round (r7 re-check state) | After (r8) |
|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, exit 0 |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3889 passed / 1 skipped / 202 of 203 suites | **3889** passed / 1 skipped / 202 of 203 suites — **unchanged**, no new tests |
| `npm run parity` | 0 gap / 0 undeclared / 16 declared / exit 0 | 0 gap / 0 undeclared / 16 declared / exit 0 (unchanged) |
| `npm run shots` / `check-freeze.sh` | 524 PNGs, 0 FAIL / `260/260` | **not re-run** — no CSS/fixture change this round |

**Frozen bytes moved: 0.** All gates run in the foreground, unpiped, output redirected
to per-run log files — none backgrounded or waited on.

**Quoted declared `ink` row** (regenerated `parity-report.md`, `pr-chars` light scheme,
now showing the 3dp channel delta):
```
- **DECLARED** `pr-chars` [light] (.sc-ability__pr-head .chars → .dse-pr__head): ink miss: site color=rgb(95, 104, 109), plugin color=rgb(26, 29, 32) (max channel 77.000 > 2 FIRES; alpha 0.000 ≤ 0.03)
```
Dark-scheme sibling: `(max channel 18.000 > 2 FIRES; alpha 0.050 > 0.03 FIRES)`.

## Commits

- **dse** (`draw-steel-elements`, branch `sc126-parity-bg`): `5a5ed49` — `fix(parity):
  SC-126 — requote README heading refs; ink row prints 3dp channel delta`. Files:
  `test/unit/parity/compare.test.ts`, `visual-harness/parity/compare.cjs`.
- **Superproject** (worktree `sc126-parity-bg`): `4cdb43f` — `docs(dse-verify): SC-126
  — requote README cross-reference; bump snapshot date`. File:
  `.claude/skills/dse-verify/SKILL.md` only. Submodule pointer bump left
  **uncommitted** (superproject `git status`: ` M draw-steel-elements`). **Not pushed.**

No attribution trailers in either commit message.

## Artifacts / log paths

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/sc126-r8-report.md`

This round's logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/`):
- `sc126-r8-tsc-20260918-001500.log` (clean, exit 0)
- `sc126-r8-lint-20260918-001500.log` (clean, exit 0)
- `sc126-r8-jest-20260918-001500.log` (3889 passed / 1 skipped / 202 of 203 suites, exit 0)
- `sc126-r8-parity-20260918-001500.log` (0 gap / 0 undeclared / 16 declared, exit 0)

Referenced from the r8 brief (the reviewer's own report, not produced by me):
`sc126-r7-recheck.md`.
