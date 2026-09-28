# SC-235 round 4: scoped re-review of the round-3 delta

## Executive summary

- **Verdict: LAND-READY-AS-PROPOSAL.** CRITICAL 0, HIGH 0, MEDIUM 0, LOW 1, INFO 3.
- **Scope reviewed:** DSE `2b2d3dc..35d3b46` (a single commit, `35d3b46`), range-diffed against round 1 (`825ea51..43b76cc` against `5a20d5f..2b2d3dc`: all 3 commits `=`, so their content is unchanged). Also the superproject `9a7e39b..f0e566a` and the `r3-evidence/` folder.
- **HIGH-1 (wording): fixed.** No remaining "matches the site's size" claim. Every claim now says the computed values match and gives the fake-small-caps reason. The styles-source.css comment and the parity README both give the rendered 8px vs 10px / ~25% numbers. The one residual is LOW-1: the CHANGELOG bullets don't quantify the gap and say "real capitals".
- **MED-1 (spend chip): fixed.** The chip at head is identical to base `5a20d5f`: 16px / 1.12px / 27.2px, padding 3.2/9.6px, box 333.03×34.56px, spend body 343px wide, in both schemes. A full census of all 244 captures shows 368 changed nodes, all `.dse-section__title`, with the 2 spend chips excluded. No other box changed size.
- **MED-2 (evidence): fixed.**
  - All 18 composite cells are exact 1:1 embeddings of their crops, and all 4 zoom rows are exact 6x nearest-neighbour copies.
  - Letter height by pixel scan, per family (feature / statblock / kit): Site 8, Today 9, A 10, B 8. Word width: Site 55, Today 60/61/60, A 68/69/69, B 62. These equal round 2's numbers and the captions.
  - I re-ran the round-3 capture on my own clones of the final base and head shas: all 24 crops came out byte-identical.
  - Labels are text, not colour.
- **LOW-1 fold:** the comment is present (styles-source.css:8175) and accurate.
- **Narrow check** (my own reconstruction, 150 rows):
  - A: 11 new wraps (1 at 300px, 10 at 240px), 0 mid-word breaks.
  - B: 0 new wraps, 0 mid-word breaks.
- **Gates at `35d3b46`:** tsc/lint clean; jest 4122 (4121 passed / 1 skipped) against base `5a20d5f` 4119 (4118 / 1), so +3 exactly; lifecycle 19/19; shots 532 / 0 FAIL with all in-run checks OK; freeze 260/260; parity 0 GAPs / 0 undeclared / 10 DECLARED / exit 0.

## Checks

1. **HIGH-1 wording.** I grepped every added line in both deltas for match, parity, same size and exact.
   - `styles-source.css:8166-8194` now says "COMPUTED VALUES ONLY", gives the site's synthesized small caps against the plugin's real `smcp`, "rendered ink is site 8px / this rule 10px tall — about 25% taller", and "Do not claim this rule visually 'matches the site'". Accurate.
   - The parity README adds a paragraph (line 543-548) saying the rule compares computed values only and that the glyphs are ~25% taller. Accurate.
   - The `compare.test.ts:818-825` comment is qualified ("COMPUTE equal … ~25% taller"). Accurate.
   - Both CHANGELOG bullets say "compute the site's font-size and letter-spacing … rendered letters still read taller … the site fakes its small caps". Correct in substance; see LOW-1 for the precision.
2. **MED-1 spend chip.** The census diff (base `5a20d5f` against head `35d3b46`, dark and light) matches the r3 report's own table. The pin (`styles-source.css:9366-9367`) uses `var(--dse-fs-body)` = 1em, which is what the chip inherited before. So it stays identical at every text size and modal scale.
3. **MED-2 evidence.**
   - Exact-embed search: wide composite 12/12 cells, narrow 6/6, zoom 4/4 at 6x.
   - Known-element sanity check: title boxes are Today 48.19px, A 51.59px (+3.4), B 46.5px (−1.7). Crop height deltas agree: feature (2 sections) 232 → 239 / 228; statblock 259 → 266 / 256; kit (1 section) 143 → 146 / 141.
   - My own re-capture, measured from the rendered page: Today feature and kit 16px / 1.12 / 27.2 / 9px ink / 60w; A feature and statblock 18 / 1.8 / 30.6 / 10 / 68-69w; B feature and kit 15 / 1.8 / 25.5 / 8 / 62w; site statblock 18 / 1.8 / 30.6 / 8 / 55w.
   - The B probe is `calc(var(--dse-fs-body) * 0.9375)` + `0.12em`, as the round-2 ruling defines it.
4. **LOW-1 comment.** styles-source.css:8175-8181 gives the reasons correctly: the Large-text knob coupling (the unit rule), and that font-sizes.md allows deriving a size from a role.
5. **Narrow.** B was injected on every title except spend titles, and spend titles were checked to still read 16px (146 titles at 15px, 2 at 16px). A adds "Special (2 Malice)" at 300px, plus "(2 Malice)" in 5 statblock captures at 240px, 2 each. This matches the r3 table and composite.
6. **Gates:** see the summary. On the jest base:
   - The brief names `afd6ae3` as the base; the branch actually sits on `5a20d5f`, which is what the owner's message names, so I measured there.
   - I used a `git clone --shared` with `.git` present and `DSE_TOKEN_MAP_PATH` set, so neither location-dependent skip fires. Skip count is 1, the same as head.
   - The diff adds 3 `it()` blocks and modifies 1.

## Findings

### LOW-1: the CHANGELOG bullets don't quantify the gap and misname the mechanism

- **Where:** `draw-steel-elements/CHANGELOG.md:29-31` and superproject `CHANGELOG.md:22-25`: "the plugin's are real, so real capitals read bigger at the same computed size".
- **The error:** the plugin draws real *small-cap* letters. It is the site's letters that are capitals, shrunk to 70%. The round-2 ruling asked for "letters render about 2px (25%) taller because the site fakes its small caps", but the bullets say only "read taller".
- **Failure scenario:** a reader takes "real capitals" to mean the plugin renders full capitals, which it doesn't, and gets no sense of how big the gap is.
- **Fix (wording only, both files):** "…the site fakes its small caps (its font has none, so the browser shrinks capitals to 70%), while the plugin's are real small-cap letters, so they render about 2px (roughly 25%) taller at the same computed size."

### INFO

1. **Unqualified "site parity" left in dev comments and a test name:**
   - styles-source.css:7345 and :8166 (8166's own comment block qualifies it a few lines later);
   - steelTypography.test.ts:588 and :646 (the test title "(site parity)");
   - compare.test.ts:819 (qualified on the next lines).

   In context these mean parity-gate (computed) parity. Optional fix: say "computed site parity".
2. **Stale sha in the evidence labels.** The wide composite column label reads "Today (16px, base afd6ae3)", and the r3 A/B crops were built from the pre-rebase head. Both are harmless: re-running the same capture on `5a20d5f` and `35d3b46` gives byte-identical crops (24/24). Optional fix: relabel with `5a20d5f`.
3. **Main checkout still dirty, not caused by this review.** `workspace/draw-steel-elements` has `demo-vault/Welcome.md` and `justfile` modified, and `compendium-manifest.json` and `demo-vault/montage 1.md` untracked (mtimes 11:05:41). `just deploy*` will abort on it.

The dse worktree and the superproject worktree were clean before and after; heads are still `35d3b46` and `f0e566a`.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r4-rereview/`)

- **Clones** (`git clone --shared`, detached): `base/` (5a20d5f), `head/` (35d3b46)
- **Gates:** `tsc.log`, `lint.log`, `jest-head.log`, `jest-base.log`, `lifecycle.log`, `shots.log`, `freeze.log`, `parity.log`
- **Census:** `census-all.mjs`, `census-all-{base,head}.json`, `census-diff.py`, `census.log`
- **Evidence check:** `evidence-check.py`, `evidence-check.log`
- **Re-capture:** `recapture.mjs`, `recapture.log`, `re-*.png`, `ink.py`
- **Byte-compare of the r3 capture:** `wide-capture-final.mjs`, `wide-recap/`, `wide-recap.log`
- **Wraps:** `wrap-ab.mjs`, `wrap-{today,A,B}.json`, `wrap.log`
