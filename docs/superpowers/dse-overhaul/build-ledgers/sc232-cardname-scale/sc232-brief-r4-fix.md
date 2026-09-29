# SC-232 round 4 — fix round (review findings + evidence redo)

Same worktree, branch and rules as your round-2 brief
(`.../sc232-cardname-scale/sc232-brief-r2-implement.md` — re-read its "Rules" section: kill
only by PID with `worktrees/sc232-cardname-scale/` in the command line; foreground gates;
commit after each coherent step; never push/tag; never touch the freeze baseline, dse `main`,
or the shared main checkout's working tree; workers never call Linear).

Read first:
- `.../sc232-cardname-scale/decisions.md` — the "Owner rulings, round 3" section and the
  round-2 evidence rejection are your spec. Quoted below verbatim where they bind.
- `.../sc232-cardname-scale/sc232-r3-review-report.md` — findings HIGH-1, MEDIUM-1, MEDIUM-2,
  LOW-1..4 with file:line and prescribed fixes. Its probe scripts are in
  `.../r3-evidence/scripts/` (`measure.mjs`, `analyze.py`) — reuse them for the base-vs-head
  mid-word/line-count check.

`git fetch origin` in the dse clone; expected `origin/develop` = `619c4bd` (rebase if it moved,
and say so). Base head: `690582f`.

## Fixes

1. **HIGH-1 — narrow.** Owner ruling (verbatim): "fix in THIS branch, standalone — do NOT
   stack on SC-284 (it is parked on Scott; SC-232 must land in either order). Rule: at the
   narrow threshold, the band names (statblock, featureblock) and any generic/sub-feature name
   that gains a mid-word break fall back to TODAY's size, so the narrow captures are no worse
   than base `619c4bd` (0 new mid-word breaks, line counts <= base)."
   Acceptance: run the reviewer's measure/analyze over every `*-narrow` capture (and any
   capture where a name wraps), base vs your head: **0 new mid-word breaks, 0 names with more
   lines than base.** Put the table in your report.
2. **LOW-2, upgraded (verbatim):** "do NOT add a new `container-type` to `.dse-sb` (collapses
   the card to 2px under a fit-content ancestor). Reuse an ancestor that ALREADY carries
   `container-type` in develop; if none reaches these heads, stop with NEEDS_CONTEXT."
   Remove the `container-type` you added at `styles-source.css:~7317`.
3. **MEDIUM-1 — fix as the reviewer prescribed:** trait `ds-feature` stays generic 27px
   (`:not([data-dse-act='trait'])` on the ability arm, or equivalent that matches the site);
   the kit's inline signature ability gets 33.3px like the site; add a `name-kit-signature`
   parity pair. Verify by measurement, including the by-SCC kit case.
4. **LOW-1:** retarget the 8 `ink` declarations and their comments from SC-367 to **SC-368**
   (`selector-map.json:46-93`, `compare.test.ts:~818-827`, `parity/README.md:~526`).
5. **LOW-3:** mirror the site's project name (28.8px) if the plugin renders a project card
   head; if it doesn't, say so in one line.
6. **LOW-4:** one bullet under `## Unreleased` in the WORKTREE superproject's
   `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/CHANGELOG.md` (never the
   one under `/home/scott/code/steelCompendium/workspace/`). Commit it in the worktree
   superproject (that commit is separate from the dse commits; do not bump the submodule
   pointer).

## Evidence redo (MEDIUM-2 + owner rejection, verbatim)

"(a) The 'Option B (shared 27px)' column renders at Today's size — the probe did not apply.
(b) The 'Site' column is a 1440-wide capture downscaled into the same tile width as the
900-wide plugin crops, so the site's name looks smaller than it is. Every column must be at
the SAME CSS-px-to-image-px scale (crop, never rescale one column differently)."

Replace `r2-evidence/` with `r4-evidence/`:
- `sc232-compare-wide.png` — rows: ability card, statblock, featureblock, kit (with its
  signature ability visible), trait. Columns: **Today** | **This branch** | **Option B
  (shared 27px)** | **Site**. Every tile at the same device-pixel scale (crop the head region;
  pad narrower tiles, never scale). Verify Option B by measuring the probe's computed size
  (27px) before shooting — state the measured value in the report. Text labels on every row
  and column; no color-coding.
- `sc232-compare-narrow.png` — unscrolled (not the sticky bar) statblock and featureblock at
  300px, plus the sub-feature case: **Today** | **This branch**, same scale.
- If a composite would exceed ~2000px tall, split it into two files rather than downscale.
- In the report, correct the round-2 "not introduced" wording about mid-word breaks.

## Gates at your final head (full battery, dse-verify order)

tsc clean; lint clean; jest **4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots**
(+ any tests you add — state them) after `rm -f main.js styles.css`; `obsidian-lifecycle`
**19/19** (own `DSE_LIFECYCLE_PORT`); shots **524, 0 FAIL**; freeze **260/260** (any FAILED
line is a scoping leak — fix it, never rebaseline); parity **0 GAPs / 0 undeclared / 24
DECLARED** + the new kit-signature pair (and project pair if added), all passing — state the
final counts.

## Report

`.../sc232-cardname-scale/sc232-r4-fix-report.md`, ≤10-line executive summary first
(head sha, per-finding status, the narrow table's bottom line, gate numbers), then detail,
then `Drive-by fixes:` / `Follow-ups:`. Final text: verdict, shas, gate numbers, every
artifact path. If blocked, end with `STATUS: NEEDS_CONTEXT` and the question. If the report
write is blocked, return it inline.
