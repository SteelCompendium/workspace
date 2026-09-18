# SC-126 round 6 report — fold the r5 re-review findings (3 MEDIUM doc-text, 1 LOW message)

**Verdict: DONE.** dse commit `ebaedce` folds LOW-R5-1 (ink message per-axis fix) and
MEDIUM-R5-1 (README dateless wording); superproject commit `e69a706` folds MEDIUM-R5-2
and MEDIUM-R5-3 (SKILL.md dateless wording + corrected battery numbers). Owner rulings
(ledger D7) followed verbatim: MEDIUM-R5-2 uses the dateless `(SC-126 steps 1 and 2)`
form, no sha, no landing status; MEDIUM-R5-3 cites this round's own final jest count and
names the branch series without an "unlanded" status. Sweep for other landing-status/
branch-relative wording in the touched files found none beyond the three already flagged.
Gates: tsc/lint clean; jest **3887 → 3889** passed / 1 skipped / 202 of 203 suites (+2, two
new `ink` message tests — no prior test locked that message's text down at all); `npm run
parity` **0 gap(s) / 0 undeclared warning(s) / 16 declared deferral(s), exit 0**, unchanged
composition. Declared `ink` row (light scheme) now reads
`(max channel 77 > 2 FIRES; alpha 0.000 ≤ 0.03)` — the false `alpha 0.00 > 0.03` is gone.
No CSS/fixture change; shots/freeze not re-run (not required). Nothing pushed; no
submodule pointer bump committed.

---

## 1. LOW-R5-1 — rule 7 (`ink`) GAP message, live defect

Applied the reviewer's prescribed 6-line shape to `compare.cjs`'s ink comparison block
(mirrors `bg-color`'s LOW-1 fix exactly): each axis now computes its own fired/silent
verdict and prints its own true comparator, with a `FIRES` marker only where it fired.

Before (live on every green run, `visual-harness/parity/parity-report.md:37`):
```
ink miss: site color=rgb(95, 104, 109), plugin color=rgb(26, 29, 32) (max channel 77 > 2, alpha 0.00 > 0.03 — either fires)
```
`alpha 0.00 > 0.03` was false — arithmetic the reviewer flagged as live, not hypothetical,
since the two `pr-chars` declared deferrals are the only `ink` rows that ever surface on
a passing gate.

After (regenerated `parity-report.md`, this round):
```
ink miss: site color=rgb(95, 104, 109), plugin color=rgb(26, 29, 32) (max channel 77 > 2 FIRES; alpha 0.000 ≤ 0.03)
```
and the dark-scheme sibling:
```
ink miss: site color=rgb(205, 209, 212), plugin color=rgba(220, 226, 230, 0.95) (max channel 18 > 2 FIRES; alpha 0.050 > 0.03 FIRES)
```

**Tests added** (`test/unit/parity/compare.test.ts`, no prior test asserted the ink
message text at all): a new describe block, `'parity compare — \`ink\` prints a per-axis
verdict, not a blanket false comparison'`, with two cases — RGB-axis-fires-alone (asserts
`FIRES` on the channel clause and `≤`, not a false `>`, on the silent alpha clause) and
alpha-axis-fires-alone (the live `pr-chars`-light shape: `≤` on the silent channel clause,
`FIRES` on alpha).

## 2. MEDIUM-R5-1 — README's landing-status claim (dse repo)

`visual-harness/parity/README.md`'s "Known limitation" heading, which the r4 drive-by fix
had left reading *"(SC-126 step 1 landed; step 2 this branch, unlanded)"* — true only
while the branch stays unmerged, and never revisited once it lands — is now dateless and
status-less, exactly as prescribed:
```
- **Known limitation — `background-color` is fully compared (SC-126 steps 1 and 2); the
  residual is `background-image`.**
```

## 3. MEDIUM-R5-2 — SKILL.md's LOW-2 replacement (superproject)

Per the owner's explicit choice of the second form (no sha, no landing status — this is
current-state reference prose in a file every worktree loads, not one of the file's dated
`**<date>, SC-N …**` log entries, and `58d9949` is a superproject commit that lands on
`main` where "this branch" would be read from a checkout with no such branch):
```
**`background-color` is fully compared (SC-126 steps 1 and 2).**
```
replacing the two-line *"step 1 landed 2026-08-25 `1cef8ec`; step 2 is this branch,
`sc126-parity-bg`, unlanded as of this writing"*.

## 4. MEDIUM-R5-3 — SKILL.md's stale battery-numbers paragraph (superproject)

The "Battery numbers at SC-126 step 2 land-ready" paragraph (SKILL.md ~line 136) still
cited jest 3879 / "+9 this round" after r4 had already moved the count to 3887 — self-
refuting, since the paragraph opens by warning the row above it (SC-205) is stale for the
same reason. Rewritten to cite **this round's own final measured count** (per the owner's
instruction to make it stay true after this commit too) rather than re-stating r4's now-
also-stale number:

- jest 3836 (the `e12c6bd` baseline) -> **3889** passed / 1 skipped / 202 of 203 suites
  (net **+53**: **+19** are this ticket's own tests across all three rounds — 9 rule
  round, 8 first review-fix round, 2 second review-fix round — the remaining +34 from the
  unrelated `origin/develop`/SC-196 rebase).
- Framed as "measured across the `sc126-parity-bg` branch series" (the rule round plus its
  two review-fix rounds), with no "unlanded"/"land-ready" status word attached to that
  sentence — the paragraph's own opening line (`Battery numbers at SC-126 step 2
  land-ready …`) is the file's existing dated-snapshot convention and was left as-is,
  per the reviewer's INFO-R5-1 (those dated `**<date> …**` headers are explicitly out of
  scope).
- Appended two sentences recording each review-fix round's substance (the `excludes`
  material-class gate and the `bg-color`/`ink` per-axis message reshapes), so the
  paragraph stays a complete, self-contained summary of the whole series rather than only
  the rule round.

## 5. Sweep for other landing-status/branch-relative wording

Searched every file this branch has touched (`README.md`, `compare.cjs` comments,
`CHANGELOG.md`, `selector-map.json`, and the superproject `SKILL.md`) for `landed`,
`unlanded`, and `this branch`. Findings:
- `README.md:377` ("the hole that was live until this landed") and `CHANGELOG.md`'s
  `[INTERNAL]` bullet ("neither moved a single pixel or a frozen shot on landing") — both
  already flagged safe by the reviewer's INFO-R5-1 (become and stay true at landing, no
  branch name, no date; the changelog bullet sits under `## 7.0.0 (unreleased)`).
- `compare.cjs:363` ("passes landed as an undiffable blob") — unrelated generic phrase
  about the whole-theme visual-diff gate, not about this ticket's landing status.
- `SKILL.md:386,681` ("no open mismatches on this branch", "plan 25's unlanded 113 -> 119")
  — older, unrelated dated-log entries about other tickets (SC-144-era freeze-denominator
  history), out of scope.
- **Nothing else found.** No further edits made beyond the four prescribed fixes.

## Gate numbers

| Gate | Before this round (r5 re-review state) | After (r6) |
|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, exit 0 |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3887 passed / 1 skipped / 202 of 203 suites | **3889** passed / 1 skipped / 202 of 203 suites (net **+2**) |
| `npm run parity` | 0 gap / 0 undeclared / 16 declared / exit 0 | 0 gap / 0 undeclared / 16 declared / exit 0 (unchanged) |
| `npm run shots` / `check-freeze.sh` | 524 PNGs, 0 FAIL / `260/260` | **not re-run** — no CSS/fixture change this round |

**Frozen bytes moved: 0** (no shots run this round; no `styles-source.css` diff at any
point).

All gates run in the foreground, unpiped, output redirected to per-run log files (no
gate was backgrounded or waited on).

## Commits

- **dse** (`draw-steel-elements`, branch `sc126-parity-bg`): `ebaedce` — `fix(parity):
  SC-126 re-review fixes — ink row prints per-axis verdicts; dateless doc wording`.
  Files: `test/unit/parity/compare.test.ts`, `visual-harness/parity/README.md`,
  `visual-harness/parity/compare.cjs`.
- **Superproject** (worktree `sc126-parity-bg`): `e69a706` — `docs(dse-verify): SC-126
  re-review — dateless wording, corrected battery numbers`. File:
  `.claude/skills/dse-verify/SKILL.md` only. Submodule pointer bump left **uncommitted**
  (superproject `git status`: ` M draw-steel-elements`). **Not pushed.**

No attribution trailers in either commit message.

## Artifacts / log paths

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/sc126-r6-report.md`

This round's logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/`):
- `sc126-r6-tsc-20260918-000500.log` (clean, exit 0)
- `sc126-r6-lint-20260918-000500.log` (clean, exit 0)
- `sc126-r6-jest-20260918-000500.log` (3889 passed / 1 skipped / 202 of 203 suites, exit 0)
- `sc126-r6-parity-20260918-000500.log` (0 gap / 0 undeclared / 16 declared, exit 0)

Referenced from the r6 brief (the reviewer's own report and logs, not produced by me):
`sc126-r5-rereview.md` and its cited `sc126-r5-*-20260917-r5.log` files.
