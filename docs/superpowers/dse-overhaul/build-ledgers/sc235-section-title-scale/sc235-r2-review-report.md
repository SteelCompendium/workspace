# SC-235 round 2: independent review report

## Executive summary

- **Verdict: FIX-FIRST.** The branch does what its spec says: computed values match, every gate is green, and print is byte-frozen. But the thing it claims, "matches the site's size", is **false for the rendered glyphs**. The ask, the CHANGELOGs and the comments must not ship that claim, per the owner's round-1 ruling.
- **Why the owner's eyeball is right:** the site's small caps are **browser-synthesized**. Petrona, as served by Google Fonts, has no `smcp` feature, so Chrome draws uppercase Petrona Bold at 70% of 18px, which is 12.6px. The plugin's are **real `smcp` glyphs** from its bundled Source Serif 4 Bold, which are 0.540em tall. The rendered ink height of "EFFECT" is **site 8px, today 9px, branch 10px**. So the plugin's title was already taller than the site's at 16px, and the branch widens the gap from +12.5% to +25%.
- **To match the site's glyph height with the current face and weight, the font-size would be about 15px** (8.08/0.540 = 14.96; I measured 8px of ink at 15px). That is smaller than today's 16px. The real difference is the font face plus real-versus-synthesized small caps, not the font-size.
- Gates at `43b76cc` (all my own runs): tsc clean; lint clean; jest 4115 (4114 passed / 1 skipped / 0 failed); lifecycle 19/19; shots **532** PNGs / 0 FAIL; freeze 260/260; parity 0 GAPs / 0 undeclared / 10 DECLARED / exit 0. Can-fail check: 6 GAPs with the CSS fully reverted, and 2 GAPs with only the tracking reverted.
- x1.125 holds at host 12/14/16/18/20/24px and at text-scale 0.8/1.25/1.4. The SC-230 modal still scales exactly x1.4. The only computed style that changed is `.dse-section__title`, across 370 nodes in 244 captures.
- **Findings: CRITICAL 0 · HIGH 1 · MEDIUM 2 · LOW 2 · INFO 5.**

## 5. Owner's glyph-size probe (priority)

The method: fresh Playwright captures at deviceScaleFactor 1, with the "EFFECT" text node clipped via a Range, so there is no diamond or padding in the crop. Each crop was scanned pixel by pixel, where ink means a pixel at more than 50% of the maximum luminance deviation from the median border background. The face actually rendered comes from CDP `CSS.getPlatformFontsForNode`. Font GSUB tables were read with fontTools, both from the bundled plugin woff2 files and from the Petrona woff2 that Google Fonts serves (latin, v38, variable `wght` 100–900). Both schemes were measured; the dark and light numbers are identical.

### 5a. Computed and rendered properties

| | Site `.sc-ability__section-head .tag` | Today `.dse-section__title` (825ea51) | Branch `.dse-section__title` (43b76cc) |
|---|---|---|---|
| font-family (computed) | `Petrona` | `"Source Serif 4", -apple-system, …` | same as today |
| **Face actually rendered** (CDP) | Petrona / `Petrona-Regular` PS name (variable font, web) | Source Serif 4 / `SourceSerif4-Bold` (bundled data-URI) | same as today |
| font-weight | 700 (via the wght axis) | 700 (`bold`, base rule styles-source.css:186) | 700 |
| font-variant-caps / text-transform | small-caps / lowercase | small-caps / lowercase | small-caps / lowercase |
| font-synthesis | `weight style small-caps` (default) | same | same |
| font-feature-settings | `"kern", "liga"` | normal | normal |
| font-size / letter-spacing | 18px / 1.8px | 16px / 1.12px | 18px / 1.8px |
| text-shadow | none | dark: emboss `0 1px 0 rgba(0,0,0,.55)`; light: none | same as today |
| **Face has `smcp`?** (GSUB) | **NO.** The Petrona latin subset carries only calt/ccmp/dnom/frac/liga/locl/numr/pnum/tnum | **YES.** SS4 Bold and SemiBold carry `smcp`+`c2sc` (78 entries); SS4 **Regular has no smcp** | YES |
| **Small caps are** | **SYNTHESIZED** (uppercase at 0.7 × 18 = 12.6px) | **REAL** `smcp` glyphs | **REAL** |
| Proof (word width under variants) | as-is 57.81; `font-synthesis:none` 56.00, which equals plain lowercase 56.00 (so the face has no smcp); uppercase at 12.6px with 1.26px tracking = 54.56, and +6×0.54px tracking gives 57.81 exactly | as-is = `synthesis:none` = `"smcp" 1` = 62.73 (real) | as-is = `synthesis:none` = `"smcp" 1` = 72.81 (real) |
| Small-cap glyph height, analytic | Petrona cap-height 0.641 × 12.6 = **8.08px** | smcp height 0.540 × 16 = **8.64px** | 0.540 × 18 = **9.72px** |
| **Rendered ink height (pixel scan)** | **8px** | **9px** | **10px** |
| Rendered ink width, "EFFECT" | 55px | 60px | 68px |
| Range (advance) width incl. tracking | 57.81px | 62.73px | 72.81px |
| E stem width (coverage px, mid-row) | **1.75px** | 2.61px | 2.93px |
| Ink mass (sum of coverage) | 152 | 220 | 280 |
| Tracking ÷ glyph height | 1.8/8.08 = **0.22** | 1.12/8.64 = 0.13 | 1.8/9.72 = 0.185 |

**Why each of the owner's observations holds:**

- **Same height as Today:** the site is 8px and today is 9px. The site is actually 1px (about 7%) shorter than today's 16px.
- **Smaller than the branch:** 8px against 10px, which is 20–25% shorter.
- **Lighter:** synthesis scales the whole Bold cap by 0.7, stems included. The site's stems come out at 1.75px against the plugin's 2.6–2.9px, and its ink mass is 54% of the branch's.
- **More tracked:** the same 1.8px of tracking sits between glyphs that are 20% smaller. Tracking is 0.22 of glyph height on the site against 0.185 on the branch.

### 5b. What would make the rendered glyphs match

Every row below is a live probe on the head harness in the dark scheme, applied as injected CSS in a scratch session with nothing committed.

| Variant (computed) | Ink H | Ink W | Stem | Mass | Parity (tol 1.5px) |
|---|---|---|---|---|---|
| Site | 8 | 55 | 1.75 | 152 | — |
| Today, SS4 700 at 16px | 9 | 60 | 2.61 | 220 | 6 GAPs (was declared) |
| Branch, SS4 700 at 18px | 10 | 68 | 2.93 | 280 | green |
| **SS4 700 at 15px, 1.8px tracking (0.12em)** | **8** | 62 | 2.45 | 188 | GAP font-size (15 vs 18) + line-height (25.5 vs 30.6): would need re-declaring, with a face-based why |
| SS4 600 at 18px (SemiBold still has smcp) | 10 | 67 | 2.43 | 247 | green |
| **SS4 400 at 18px / 1.8px** (the Regular subset has no smcp, so Chrome synthesizes like the site: 0.7 × 18 × 0.670 = 8.44) | 9 | **56** | 1.36 | **146** | green (parity does not compare weight) |
| Uppercase at 12.6px (hand-rolled synthesis on SS4 Bold) | 8 | 61 | 1.22 | 168 | GAP font-size (12.6 vs 18) |
| `"smcp" 0` at 18px | 13 (lowercase ascenders) | 60 | — | — | not viable: it disables small caps and renders lowercase |

**The glyph-height-matching size with the current face and weight is 14.96px, which rounds to 15px** (that is `calc(var(--dse-fs-body) * 0.935)`). That is *below* today's 16px. **The real gap is face plus synthesis, not size.** No size of SS4 Bold with real smcp matches all three of height, width and weight: at 15px the height matches but the word is 13% wider and the stems 40% heavier.

The closest all-round match is weight 400, which keeps 18px/1.8px and parity green, and gets width and mass within about 4%. Two problems with it:

- It is **fragile**: it only works because `assets/fonts/SourceSerif4-Regular.woff2` was subset without `smcp`. A re-subset would silently switch it to real small caps.
- Its strokes come out lighter than the site's (1.36 against 1.75px).

This is a pixel decision for Scott. The ask should show him the site, today, the branch and at least the 15px option side by side, at 1:1 and zoomed. See `r2-review/glyph-options-6x.png`.

## Findings

### HIGH-1: "matches the site" is asserted everywhere, but the rendered glyphs do not match

- **Where:**
  - `draw-steel-elements/CHANGELOG.md:25-30`: "now match the site's size … noticeably smaller and less tracked than the site's … Both now match exactly".
  - Superproject `CHANGELOG.md:11-17`: "now the same size as the site's … Both now match the site exactly".
  - `styles-source.css:8178,8180`: "matching the site exactly", "also an exact site match".
  - `visual-harness/parity/README.md:542`.
  - The r1 composite header "Site (18px)".
- **Failure scenario:** Scott reads "same size as the site", looks at the cards, and sees section titles that are visibly larger and heavier than the site's (+25% glyph height, +26% word width, about 1.7x stroke weight). This is exactly the case the owner's round-1 ruling forbids ("must not claim matches the site if the rendered glyphs do not").
- **Also inverted:** the premise "plugin noticeably smaller than the site" is wrong for the rendered result. Today's plugin glyphs are already about 7% *taller* than the site's.
- **Fix:** reword every claim to say computed parity. For example: "computed font-size/letter-spacing now equal the site's `.tag` (18px/1.8px); because the site's small caps are browser-synthesized from Petrona and the plugin's are real Source Serif 4 small caps, rendered letters are about 25% taller than the site's". Do this, or pick a different option from §5b before the ask. The parity README should add one sentence saying its `font-size` rule compares computed values and cannot see the face or synthesis.

### MEDIUM-1: the spend-variant chip inherits the new scale and moves away from the site's `.cost` chip

- **Where:** `styles-source.css:9332-9344`. The `.dse-section--spend .dse-section__title` rule sets no font-size or letter-spacing, so it inherits 18px/1.8px.
- **Measured:** chip width 333 to 386px (+53px); spend body width 343 to 290px (census, `feature-spend`).
- **Site analogue:** `.sc-ability__enh .cost` (v2 `steel-ability-cards.css:198-200`) is `.86rem` = 17.2px with `letter-spacing: .04em` = 0.69px.
- **The effect:** tracking went from 1.12px to 1.8px against the site's 0.69px, so it is now 2.6x the site's. No parity pair covers `.cost`, so no gate sees it. The r1 report treated "spend letter-spacing matches the base rule's new value" as correct.
- **Failure scenario:** every spend chip ("Spend 2 …") gets wider and more tracked than both today's version and the site's.
- **Fix:** either pin the spend rule to the site's `.cost` values (`font-size: calc(var(--dse-fs-body) * 1.075)` and `letter-spacing: 0.04em`, keeping in mind the §5 face caveat), or disclose it in the ask as a knock-on. Either way, make it an explicit owner decision rather than an inherited accident.

### MEDIUM-2: the evidence composite presents 18px against 18px as like-for-like

- **Where:** `r1-evidence/wide-spec.json` title and column labels, "This branch (18px) vs Site (18px)".
- **What checks out:** the pixels are honest. All 15 cells are exact 1:1 embeddings (verified by exact pixel search). The known-element check passes: each section-title box is 3.4px taller at head, and the crop heights differ by 7 for 2 sections and by 3 for 1. Column labels are text.
- **The problem:** the labels invite the reading "same number, therefore same size", which is false.
- **Fix:** add the measured ink height to each caption (site 8, today 9, branch 10) and attach the zoom (`r2-review/glyph-options-6x.png`).

### LOW-1: the role choice sits awkwardly with `.repo-docs/font-sizes.md`

- **Where:** `styles-source.css:8187`, `calc(var(--dse-fs-body) * 1.125)`.
- `.repo-docs/font-sizes.md:24` names `--dse-fs-subheading` (1.15em) for "a band, group or section title", and says "pick the role that describes what the text IS, never how big you want it to look".
- The chosen multiplier obeys the owner's unit rule, because `subheading` would bring the "Large text size" knob into play. So this is defensible and the contract test passes.
- **The cost:** a section title does not follow the Large-text knob, and the 1.125 is a look-driven multiplier.
- **Fix:** none required. Add one comment line citing the owner's unit rule as the reason `subheading` was not used, or have the owner rule on it.

### LOW-2: more new wraps at narrower widths than the 300px table shows

- **Where:** `r2-review/wrap-*.json`, 150 title and spend-body rows at 300 and 240px.
- **At 300px:** exactly 1 new wrap ("Special (2 Malice)"). This matches r1 and the accepted ruling. 0 mid-word breaks.
- **At 240px:** "(2 Malice)" also wraps (`(2 ` / `Malice)`) in 5 statblock captures (statblock, -stats-ledger, -stats-gridc, -columns-wide, -with-captain), 10 rows in total. Still 0 mid-word breaks, and no spend-body change.
- **Fix:** disclose it in the ask next to the 300px wrap, or have the owner accept it. No code change.

### INFO

1. **Parity cannot see what went wrong here.** Its typography rules compare computed values with `LEN_TOL = 1.5` (compare.cjs:85):
   - 16.5–19.5px all pass for a site value of 18px, and reverting to 16 fails by only 0.5px of margin.
   - The jest source-text test (`steelTypography.test.ts`, SC-235 block) is what pins the exact value.
   - A face or synthesis mismatch is invisible to every gate. If you want a ticket for that, the owner files it.
2. **Shots count:** 532, not the brief's 524. The branch does not touch the harness manifest, so this is develop's count after SC-284, and it matches r1.
3. **Jest base count:** not re-run. The diff adds exactly 2 `it()` blocks and no deletions, so head 4115 means base 4113, which matches r1.
4. **Superproject base:** the branch is based on `689d7cf`, while `origin/main` is `601b44a`, which differs only in `docs/handoffs/HANDOFF.md`. No conflict with `CHANGELOG.md` or the pointer. Rebase at landing as usual.
5. **Main checkout, not caused by this review:** `workspace/draw-steel-elements` (825ea51) is dirty:
   - modified: `demo-vault/Welcome.md`, `justfile`
   - untracked: `compendium-manifest.json`, `demo-vault/montage 1.md`
   - all mtimes are 11:05:41, before this review began, so it is another session's or Scott's work.
   - `just deploy*` will hard-abort on it. The dispatcher should know.

## Verified clean

- **Diff** (`825ea51..43b76cc`, 6 files): the CSS rule, 3 comments, the parity map (−3 entries), the `compare.test.ts` guard 8→5, the README, and 2 source-text tests. `::before` diamond 5.75×5.75 (rem) unchanged; head-strip padding 10×18px unchanged; gap 5.12→5.76px (em, expected).
- **Census:** all 244 captures (122 ids × dark/light), today vs head.
  - Font-size, line-height, letter-spacing, gap and padding changed **only** on `.dse-section__title` (370 nodes).
  - The only box that changed size without containing a title is the spend body (MEDIUM-1).
  - `.dse-feature::before` rail heights grow with content, which is expected.
- **Scaling:** today to head is exactly x1.125 and head title/body is exactly 1.125 at host 12/14/16/18/20/24px, at `--dse-text-scale` 0.8/1.25/1.4, and in a synthetic modal (15px reset). Modal 1.4 against 1 gives x1.4000 on both sides.
- **Print:** `check-freeze.sh` gives `freeze OK (260/260 …)`; shoot's print-twin delta OK (132 ids).
- **Parity can-fail:** run in scratch copies, not the worktree.
  - Full revert gives 6 GAPs (font-size/line-height/letter-spacing × 2 schemes), exit 1.
  - Reverting only the tracking to .07em gives 2 GAPs (letter-spacing 1.26 vs 1.8), exit 1.
- **Working tree:** `git status --porcelain` for the dse worktree and the superproject worktree was empty before and after; head is still `43b76cc`. Only ignored build outputs were regenerated.

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r2-review/`)

- **Glyph probe:**
  - `glyph-probe.mjs`, `glyph-probe.json`, `glyph-probe.log`
  - `glyph-scan.py`, `glyph-scan.log`
  - `glyph-{site,today,head}-{dark,light}.png`, `glyph-head-{dark,light}-{15,16}px.png`
  - `glyph-zoom-8x.png`, `glyph-options-6x.png`
- **Variants:**
  - `variant-probe{,2}.mjs`, `variant-probe{,2}.{json,log}`, `variant-scan.py`
  - `variant-*.png`
- **Font tables:**
  - `fontfeat.py`, `fontfeat2.py`, `fontfeat-plugin.log`, `fontfeat-glyphs.log`
  - `petrona.css`, `petrona-latin.woff2`
- **Gates:**
  - `tsc.log`, `lint.log`, `jest-head.log`, `lifecycle.log`, `shots.log`, `freeze.log`, `parity-head.log`
  - `parity-canfail-{revertall,revertls}.log`, `parity-report-canfail-*.md`, `canfail-*.css.diff`
- **Census, scaling, wrap:**
  - `census-all.mjs`, `census-all-{today,head}.json`, `census-diff.py`, `census-diff.log`
  - `scale-probe.mjs`, `scale-probe.log`
  - `wrap300.mjs`, `wrap-{today,head}.json`
- **Composite 1:1 check:** `composite-check.py`, `composite-check.log`
- **Scratch builds** (`git archive` of `825ea51` and `43b76cc`): `today/`, `head/`
