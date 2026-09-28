# SC-235 round 7: scoped re-review of the option-B delta

## Executive summary

- **Verdict: FIX-FIRST (comment/doc only; no code change needed).** Counts: CRITICAL 0, HIGH 0, MEDIUM 1, LOW 1, INFO 3.
- **Scope:** DSE `845a491..464838f` (one commit) on develop `5a20d5f`, and superproject `e6a6164..a5d230f`. I read every line of the delta, since it was rebuilt from memory. Nothing was half-reconstructed: the CSS, the tests, the parity map, the README table and paragraph, the compare.test guard and both CHANGELOGs agree with each other, and the green gates confirm it. One stale comment the rewrite missed is MEDIUM-1.
- **Computed styles, all 244 captures:** every non-spend section title is 15px / 25.5px / 1.8px (368 nodes). The spend chip is identical to base in both schemes (16px / 27.2px / 1.12px, box 333.03×34.56). Only `.dse-section__title` nodes change, and no other box changes size.
- **Scaling:** exactly ×0.9375 at host 12/14/16/18/20/24px and at text-scale 0.8/1.25/1.4. The modal still scales ×1.4000.
- **Rendered letters:** 8px on every family in both schemes, the same as the site (8px). Word width is 62px against the site's 55px. My head crop is byte-identical to round 2's 15px/0.12em probe.
- **Parity:** 0 GAPs / 0 undeclared / 14 DECLARED / exit 0. Three failure checks all bite:
  - deleting the 2 new declarations gives 4 GAPs;
  - putting option A's CSS back under B's map gives `DEAD DECLARATION(S)`, exit 1;
  - the same revert fails 2 jest tests.
- **Narrow:** 0 new wraps and 0 mid-word breaks at 300 and 240px (150 rows); no row gains a line.
- **Gates at `464838f`:** tsc and lint clean; jest 4122 (4121 passed / 1 skipped) against base 4119 at the same `5a20d5f` measured in round 4, so +3; lifecycle 19/19; shots 532 / 0 FAIL with 17 in-run checks OK; freeze 260/260.

## Checks (round-7 override list)

1. **Computed styles.** `census-all-base.json` (5a20d5f, from round 4) against `census-all-head.json` (464838f):
   - 368 `.dse-section__title` nodes change (16 → 15px, 27.2 → 25.5px, 1.12 → 1.8px, em-relative gap 5.12 → 4.8px).
   - The 2 spend chips are unchanged.
   - The head-strip padding (10×18) and the `::before` diamond are unchanged.
   - The `dse-feature::before` rails grow or shrink with content height, as expected.
   - `scale-probe.log`: head/today = 0.9375 at every text size and scale.
2. **Letter height.** Pixel scan, 50% coverage: head 8px and 62px wide for feature, statblock and kit, dark and light; site 8px and 55px wide, dark and light.
   - The r6 composite `sc235-final-B.png`: all 9 cells are exact 1:1 embeddings.
   - Its branch crops are byte-identical to r3's B probe crops, its today crops to r4's `5a20d5f` re-capture, and its captions match the scans.
   - `r6/head` styles-source.css and selector-map.json are byte-identical to `464838f`.
3. **Parity.** The two new entries, `section-tag:font-size` and `:line-height`, each cite SC-235 and Scott's 2026-09-28 ruling. The font-size reason (synthesized versus real small caps, 8px ink at 15px) is accurate. The line-height reason is that it follows from font-size (1.7 × 15 = 25.5). `:letter-spacing` is correctly left undeclared, since 1.8px equals 1.8px. The compare.test guard lists exactly 7 entries and the README says "7 today" and "7 entries / 14 rows". There are no dead declarations.
4. **Wording.** Both CHANGELOGs, the rule comment (`styles-source.css:8166-8197`), the SC-143 comment, the spend-pin comment and the test comments and titles are all written for B. None claims "matches the site's size". The exceptions are MEDIUM-1 and LOW-1.
5. **Narrow:** see the summary.
6. **Battery:** see the summary. The DSE and superproject worktrees were clean before and after; heads are still `464838f` and `a5d230f`.

## Findings

### MEDIUM-1: a touched comment still states option A's tracking

- **Where:** `styles-source.css:7344-7345`: "The section title's own small-caps tracking (0.1em as of SC-235, computed site parity — was 0.07em)". Round 5 edited this comment. Round 6 did not, and its commit message leaves it out of the list of rewritten comments.
- **Why it matters:** the rule now says `0.12em` (`styles-source.css:8204`). The owner's round-6 ruling requires every comment describing A to be rewritten.
- **Failure scenario:** a maintainer reads 0.1em here and "fixes" the rule back to 0.1em. The jest test would catch that, but the comment still misleads.
- **Fix:** replace the parenthesis with: "(0.12em as of SC-235 option B, which computes to 1.8px at 15px, the same computed 1.8px as the site's .1em at 18px; was 0.07em)". The rest of the comment ("`section-tag:letter-spacing` deferral is CLOSED … the values now agree") is still true.

### LOW-1: the parity README and the compare.test log narrate a state develop never had, in option A's terms

- **Where:**
  - `visual-harness/parity/README.md:536-549`, "HEALED and deleted (2026-09-27, SC-235)". It still says SC-235 moved the font-size to `calc(var(--dse-fs-body) * 1.125)` and letter-spacing to `0.1em`, and that the set went 8/16 → 5/10.
  - `:551-563`, "RE-DECLARED … 5/10 to 7/14".
  - `test/unit/parity/compare.test.ts:818` ("8 -> 5") and `:826` ("5 -> 7").
- **What actually lands:** develop is at 8/16 today and receives the branch as one landing. Net: `section-tag:letter-spacing` heals, `:font-size` and `:line-height` are re-cited from FOLLOWUPS #51 to SC-235, 8/16 → 7/14. The option-A 1.125 / 0.1em / "5/10" state existed only on this branch.
- **Failure scenario:** a future reader of the README thinks SC-235 once shipped 18px/0.1em, and derives the wrong history for the set.
- **Fix:** merge the two README paragraphs into one dated entry for the net change: letter-spacing healed (0.12em at 15px = 1.8px); font-size and line-height re-cited from FOLLOWUPS #51 to SC-235 option B, with the rendered-height reason; 8/16 → 7/14. Keep the face-blind sentence ("compares computed style values only…"). Make the compare.test comment a single "8 -> 7" entry the same way. This is doc-only; the guard itself is correct.

### INFO

1. **The CHANGELOG bullets explain B through the never-shipped A.** `draw-steel-elements/CHANGELOG.md:25-32` and superproject `CHANGELOG.md:18-27` say: "at the site's own 18px the plugin's letters rendered about 2px (roughly 25%) taller". Users never saw 18px. The sentence is accurate as rationale and matches the owner's plain-wording spec in substance. Optional trim: "…the site fakes its small caps, so 15px here renders the same letter height as the site's 18px."
2. **The rule comment points outside the repo.** `styles-source.css:8194-8196` cites "the SC-235 round-2 review's glyph probe (§5), the round-3/4 evidence, and the round-6 evidence composite". Those live in the workspace `.superpowers/` scratch, not in the DSE repo. The same pattern was already accepted in rounds 3 to 5, so this is not new.
3. **Numbers for the dispatcher at landing:**
   - The dse-verify expected parity becomes 14 DECLARED if SC-235 lands alone. If SC-232 lands first, it becomes 26 − 6 + 4 = 24.
   - Freeze stays 260/260 with no rebaseline.
   - Jest grows by 3 over develop.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r7-rereview/`)

- **Clone:** `head/` (`git clone --shared` at 464838f, harness built). The base build is reused from `../r4-rereview/base/` (5a20d5f).
- **Census:** `census-all.mjs`, `census-all-base.json`, `census-all-head.json`, `census-diff.py`, `census.log`
- **Scaling:** `scale-probe.mjs`, `scale-probe.log`
- **Letter height:**
  - `recapture.mjs`, `recapture.log`, `ink.py`
  - `re-head-{feature,statblock,kit}-{dark,light}.png`, `re-site-feature-{dark,light}.png`
- **Evidence check:** `evidence-check.py`, `evidence-check.log`
- **Wraps:** `wrap-ab.mjs`, `wrap-head.json`, `wrap.log` (the base is `../r4-rereview/wrap-today.json`)
- **Gates:** `tsc.log`, `lint.log`, `jest-head.log`, `lifecycle.log`, `shots.log`, `freeze.log`, `parity.log`
- **Can-fail:**
  - `parity-cf-nodecl.log`, `parity-report-cf-nodecl.md`, `cf-nodecl.diff`
  - `parity-cf-revertA.log`, `parity-report-cf-revertA.md`, `cf-revertA.diff`
  - `jest-cf-revertA.log`
