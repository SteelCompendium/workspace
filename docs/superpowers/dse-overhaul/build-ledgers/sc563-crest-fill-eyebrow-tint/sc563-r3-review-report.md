# SC-563 r3 independent review: I1 (DrawSteelGlyphs in the action crests)

## Executive summary

1. **Verdict: FIX-THEN-LAND.** The CSS, font, scope, alt text and tests are correct, and every gate I re-ran matches the implementer. One licence problem needs a one-line fix before landing (M1).
2. Counts: BLOCKER 0, HIGH 0, MEDIUM 1, LOW 4, INFO 6.
3. M1: the production build strips every plain CSS comment, and only `main.js`, `manifest.json` and `styles.css` ship. So the released plugin carries the CC BY-SA font with **no** licence notice. The repo README is the only credit. Fix: make the `@font-face` credit a `/*! ... */` legal comment. I checked that esbuild keeps it.
4. Gates (dse `07a6d0ef` on `63e00d7e`): jest **11657 passed / 1 skipped** with the cached `obsidian-app.css`, and **11656 / 2** with it moved aside. That is 11648 + 8 new tests, so the implementer's explanation is right. shots **592 ok, 0 FAIL**, host-leak 163/978, modal 39/234, capture clip 147. freeze **280/280**. parity **0 GAP / 0 undeclared / 24 DECLARED**. e2e **315/318 ok, 0 failed, 3 known-bug, 174/174 pairs**.
5. `calc(var(--dse-fs-body) * 1.25)` gives byte-identical crest PNGs to a literal `1.25em` for all 6 acts × 2 schemes, and at `--dse-text-scale` 0.6 and 1.4 (12px / 28px both ways). There is precedent at `styles-source.css:8946`.
6. Spec: the six codepoints equal `ability_cards.go:88-110`. Villain, a forged unmapped act and a missing act all keep their svg, so no crest goes blank. Statblock head, kit head, stamina, class, project and featureblock are unchanged. Print and realprint are frozen. The embedded OTF has the same sha256 as the site's (`f97eee16…`) and is not subset. The font loads, and its ink differs from a sans-serif fallback for every act.
7. 76 screen shots moved and 0 print shots moved. My list matches the implementer's `changed-shots.txt` exactly.
8. Base drift: workspace origin/main is now `a1d359f3` and dse origin/develop is `c0995beb` (SC-608 landed during this review). Read-only trial merges have 0 conflicts in both repos. A rebase and a fresh battery are needed before landing (I-1).

## Findings

### MEDIUM

**M1. The shipped plugin carries no attribution for the CC BY-SA font.**
`styles-source.css:6898-6912` holds the credit in a plain `/* */` comment. `esbuild.config.mjs:118` builds with `minify: prod`, and esbuild drops every comment except legal ones (`/*!`, `@license`, `@preserve`).
- Measured: the production `styles.css` built from this branch (449,543 B) has 0 matches for `MCDM`, `CC BY-SA` and `Source Serif 4, (c)`. The `@font-face{font-family:DrawSteelGlyphs;…}` is there with no notice.
- An Obsidian release ships `main.js`, `manifest.json` and `styles.css` only, so `assets/fonts/DrawSteelGlyphs-LICENSE.txt` never reaches users.
- The font's own name table says "Copyright (c) 2025 MCDM Productions, LLC. All rights reserved." It carries no licence notice or URI.
- Failure scenario: someone who installs 7.0.0 receives an MCDM font under CC BY-SA 4.0 with neither the licence notice nor its URI anywhere in what they downloaded. §3(a)(1) asks for both when you Share. The README credit only helps a reader who goes to the GitHub repo.
- **Fix:** turn the `@font-face` credit into a legal comment, e.g. `/*! Draw Steel Glyphs Font (c) 2025 MCDM Productions, CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ (unmodified) */`. Checked in scratch: esbuild `--bundle --minify --target=es2018,chrome106` dropped `/* plain */` and kept `/*! legal */`, moving it to the end of the file.
- Add a jest assertion that the built CSS (cssNesting.test.ts already builds it) contains the notice. Source Serif 4's OFL comment has the same pre-existing gap; fix both with the same change or file it separately.

### LOW

**L1. The docs say "the site has no villain crest", which is true only for ability cards.**
The site's statblocks draw villain glyphs. `steel-etl/internal/site/statblock_card.go:34-42` (`sbACT`) gives `villain` the glyph `*`, and `:230,370` draw a `sc-crest sb__band-crest` villain band crest with `*` in red. The plugin keeps the Lucide skull on villain sub-features and on the villain band crest (`.dse-sb__band-crest`). Scott's ruling (villain keeps its skull) stands; only the wording is wrong.
- Where: `DESIGN.md` new bullet ("the site has no villain crest"), and the CSS comment at `styles-source.css:8840` ("the site has no villain crest").
- **Fix:** reword to "the site has no villain ability-card crest; its statblock villain glyph is the `*` placeholder". Put it in the closing comment next to the `d` offer.

**L2. The changelogs leave out statblock abilities.** Both CHANGELOG bullets say "ability, trait or kit signature card". Statblock sub-feature crests also change: 25 of the 38 changed shot ids are statblock ids, and the probe shows main/maneuver/triggered/trait statblock abilities drawing `l f ) *`. The dse bullet also says each kind gets "their own glyph" and then, one sentence later, that two of them share a star.
- **Fix:** say "ability cards (including the abilities inside a statblock), trait and kit signature cards" in both changelogs, and drop "their own" in `draw-steel-elements/CHANGELOG.md:25-27`.

**L3. The family name is not namespaced.** `font-family: "DrawSteelGlyphs"` (`styles-source.css:6913`) is the bare name the site uses. A locally installed copy is harmless, because an `@font-face` family hides local fonts of the same name. The risk is another plugin, theme or snippet declaring its own `@font-face "DrawSteelGlyphs"`, for example a later MCDM release with different codepoints. Whichever sheet loads last then wins for both. I found no such user in any sibling repo, which is why this is LOW. Source Serif 4 uses its bare name too.
- **Fix (optional):** rename the family to `"DSE DrawSteelGlyphs"` in the `@font-face`, the glyph rule and the test regexes (3 places).

**L4. Two mutations the new tests do not catch** (runs are in my scratch `mut/`).
- M02: loosening the hide rule from `> .dse-head > .dse-crest .dse-crest__glyph svg` to a descendant `.dse-crest__glyph svg`. All 8 tests pass.
- M09: a later rule that shows the svg again. All 8 tests pass.
- The other 10 mutations failed 1 to 3 tests each: swapped codepoints, print leak on the face rule, `font-display: swap`, size 1.5, truncated base64, hide-all-acts, trait rule dropped, trait `^`, sans face, and identity (which passes, as it should).
- No assertion is vacuous. These are limits of rule-text testing (jsdom has no cascade), and the unfrozen Steel shots would show either change.
- **Fix (optional):** assert that the hide and face selectors contain `> .dse-head > .dse-crest`. Otherwise no action.

### INFO

- **I-1 Base moved.** SC-608 landed: dse `c0995beb` (no CSS: `initiative/view.ts`, `windowHandoff.ts`, tests, CHANGELOG) and workspace `a1d359f3`. `git merge-tree` trial merges: dse 0 conflict markers (CHANGELOG changed in both, merges cleanly); superproject 0. The superproject branch also has **no dse pointer bump commit yet**, because the implementer deliberately left it unbumped. The ledger rule wants exactly one pointer bump on current origin/main before land-ready. CURRENT for the new base is in that ledger (e2e 328/331 + 3 known-bug).
- **I-2 Nested heads (SC-367 W6).** Statblock abilities now show the site's own glyph shape inside the full 48px shield. The site's `.sb__feat-icon` uses the same `l f ) o *` codepoints but bare, at 1.15rem. So the glyph matches the site and only the shield remains, which is W6's open question.
  - If W6 keeps the `.dse-crest` DOM and restyles it to a bare glyph, the SC-563 selectors still match.
  - If W6 removes the crest for nested features (as `featBlockIcon` does), W6 must emit the glyph itself.
  - Featureblock options are unaffected (no crest, SDK emoji).
- **I-3 Optical centring.** The glyph ink centre sits at 0.4107 of crest height in the plugin and 0.4058 on the site, a 0.27 CSS px difference. Ink size relative to the crest matches within 1%. The SC-130 nudge (−0.325em) needs no font-specific value. The site's own font-glyph nudge, −6.5px / 68px = 0.0956, is the same proportion.
- **I-4 Size cost.** The production `styles.css` grows by 30,445 B (font-face 28,990 + 8 rules 1,455), +7.3%.
- **I-5 Accessibility.** The crest is `aria-hidden="true"` (`crest.ts`). With `aria-hidden` removed in the probe, the Playwright aria snapshot is unchanged ("text: Ability"). With the `/ ""` alt text also removed, it reads "text: ) Ability". So the alt text works on its own, and nothing new is announced.
- **I-6 Real Obsidian.** I did not re-run `obsidian-camera`: it dirties tracked `demo-vault/.obsidian/appearance.json`, which is implementer follow-up 3. The implementer's `r2-implement/obs-crest-zoom-{dark,light}.png` shows the font glyph drawn in real Obsidian. `font-display: block` from a `data:` URI rendered with no fallback flash in Chromium.
- Pre-existing, not this diff: the DESIGN.md Iconography line above the new bullet says "`^` star (passive), `d` skull (villain)". MCDM's chart (`reference/DrawSteelGlyphs/Draw Steel Glyphs Chart.pdf`, v002.101) has no `^`. Trait is `*` and `d` is "Villain Action 'Malice'". Correct it in the same docs commit if convenient.

## What I verified (probe detail)

- **Codepoints:** `steel-etl/internal/site/ability_cards.go:88-110`, `trait_cards.go:76` (`*`), `statblock_card.go:34-42`. Plugin rules are at `styles-source.css:8862-8879`. The `actionTypeOf` keys (`renderFeature.ts:271-292`) map one to one onto the site's `actionInfo` keys. Its pre-existing divergences (no default-to-main, "free" handling) are outside SC-563.
- **Per-act computed values** (dark and light):
  - The six acts: svg `display:none`, `::before` content `"<cp>" / ""`, 20px, font status `loaded`. The ink differs from a sans-serif fallback render in all 12 cases.
  - villain, `bogus` and no attribute: svg `display:block`, content `none`.
  - Print attribute: crest `display:none`, content `none`.
- **Other crests** (default fixtures, dark):
  - Unchanged: statblock head (role), kit head, stamina (both stamina-bar and hero), class, and the `.dse-sb__band-crest` villain band.
  - Switched to glyphs: statblock sub-features main, maneuver, triggered and trait (×2), and the kit signature (main).
  - Still the skull: the 3 villain sub-features.
- **Font:** the sha256 of the embedded base64 decode, `assets/fonts/…otf`, `reference/DrawSteelGlyphs/…otf` and `v2/docs/fonts/…otf` is the same `f97eee1680443ad6…` for all four, 21,636 B. The licence file is byte-identical to `reference/DrawSteelGlyphs/FontLicense.txt`.
- **Evidence composite** (`r2-implement/sc563-r2-crest-before-after-site.png`): uniform 2 image px per CSS px. The After row matches the Site row glyph for glyph in both schemes. The size difference is SC-367's (48 vs 60 crest), and the caption says so.

## Gates (my runs, dse HEAD 07a6d0ef)

| Gate | Result |
|---|---|
| jest (cached app css) | rc 0; 271 passed + 1 skipped suites; **11657 passed, 1 skipped** |
| jest (app css moved aside, restored by sha) | rc 0; **11656 passed, 2 skipped** |
| shots | rc 0; **592 ok, 0 FAIL**; host-leak 163/978; modal host-leak 39/234; capture clip OK (147) |
| freeze | `freeze OK (280/280 …)` |
| parity | rc 0; **0 gap(s), 0 undeclared, 24 declared** |
| e2e | rc 0; `OBSIDIAN-E2E done: 315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (pointer parked) |
| mutation (new test file) | 10 of 12 mutants caught; M02 and M09 pass (L4) |

Not run: tsc, lint and lifecycle (the implementer reports them clean and 61/61; the change touches no TS).

## Artifacts

- Probe output: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/r3-review/probe/probe-results.json`, plus per-act crest PNGs and sans-fallback controls in the same folder.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/r3-review/r3-probe-crest-strip.png`: 9 crests × 2 schemes. Columns are main, maneuver, triggered, move, none, trait, villain(forged), bogus and none-attr.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/r3-review/r3-statblock-dark-band.png`: a nested statblock ability crest.
- Scratch (logs, mutants, scripts): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r3-review-x4m9/`

## Round 5 re-review

1. **Verdict: LAND.** Every r3 finding is closed as the owner ruled, and the rebase changed nothing else. New findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 3 INFO.
2. M1 is closed. I ran a production build (`build-no-check`, via lifecycle) and the built `styles.css` (450,152 B) ends with two `/*!` notices. One is Draw Steel Glyphs: MCDM, CC BY-SA 4.0 and the licence URI. The other is Source Serif 4: Adobe, OFL 1.1, the URI and the Reserved Font Name. I loaded that production `styles.css` alone in Chromium: the font face `DSE DrawSteelGlyphs` reports `loaded`, the crest draws the crossed-sword glyph, and the result differs from a sans-serif render.
3. The rest are closed:
   - L1: "no villain crest on ability cards", in the CSS comment and in DESIGN.md.
   - L2: both changelogs mention statblock abilities; "their own glyph" is gone.
   - L3: `"DSE DrawSteelGlyphs"` is the family in the `@font-face`, the glyph rule and the test. No bare family remains in the source; the minified output is `font-family:DSE DrawSteelGlyphs`, which is valid CSS and renders.
   - L4: my M02 mutant now fails 2 tests. M02b (face rule loosened) and M02c (one content rule loosened) each fail 1. M09 was dropped by ruling.
   - I-6: DESIGN.md now says "`*` star (trait), `d` skull (villain action / malice)".
   - `crestIconFor`: the docstring changed and nothing else (`renderFeature.ts:295-305`, comment lines only).
4. Rebase: `git range-diff 63e00d7e..07a6d0ef c0995beb..10fcb6d3` shows both commits as `=`. The only SC-563 delta after that is `1516f894`, which touches 4 files: CHANGELOG, the `renderFeature.ts` docstring, `styles-source.css` (the 2 notices, the rename and comment wording) and the test file (+2 tests, +1 teeth mutation).
5. Superproject: `4fbba5ff` and `41aada3b` touch only DESIGN.md and CHANGELOG.md. The one pointer bump `92be5319` (`draw-steel-elements` → `1516f894`) sits on origin/main `a1d359f3`, which was still current at the end of my run, as was dse origin/develop `c0995beb`. No attribution trailers.
6. Gates on `1516f894`:
   - jest: **11692 passed / 2 skipped** without the cache, **11693 / 1** with it (rc 0 both).
   - shots: **592 ok, 0 FAIL**, host-leak 163/978, modal 39/234, capture clip 147.
   - freeze: **280/280**. parity: **0 / 0 / 24**.
   - lifecycle part 6 (`G-S92,G-S96,G-S97,G-S99`): **4/4 ok**.
7. Shots are byte-identical to my round-3 shots: all 594 PNG hashes are equal, the 76 changed shots included. So the family rename moved no pixel, which also shows the font loads under its new name.
8. G-S97: `demo-vault/Harness/` and `demo-vault/DS Compendium/` were absent before lifecycle and still absent after. I deleted nothing.

### INFO (no action required)

- R5-I1: the Source Serif 4 notice says "Latin subset" together with "Reserved Font Name 'Source'". Under the OFL, a modified version, which a subset arguably is, may not keep the reserved name. This was already the case before SC-563, and the implementer flagged it too. If the owner wants it tracked, it belongs in its own Backlog ticket.
- R5-I2: the new CHANGELOG and DESIGN.md lines run long (about 150 to 190 chars) where the neighbouring lines wrap near 120. Cosmetic only.
- R5-I3: DESIGN.md does not name the plugin's namespaced family `DSE DrawSteelGlyphs`. The CSS comment explains it, which is enough.

### Mutation runs (round 5, new test file, 10 tests)

| Mutant | Failing tests |
|---|---|
| M00 identity | 0 |
| M02 hide rule loosened to a descendant selector | 2 (contract, teeth) |
| M02b face rule loosened | 1 |
| M02c one content rule loosened | 1 |
| M12 glyph notice made a plain comment | 2 |
| M13 Source Serif notice made a plain comment | 2 |
| M14 glyph rule uses the bare family | 1 |

### Round 5 artifacts

- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r3-review-x4m9/r5/`: mutants plus `mut/summary.txt`, `prod/prod-crest.png` with its sans-serif control, `prodprobe.log`, and the backups.
- Gate logs `gate-r5-*.log` / `.rc` in the same scratch folder.
- The worktree is as I found it: superproject and dse `git status` are clean. The ignored build files `main.js`, `styles.css`, `main.css` and `obsidian-app.css` match their pre-run sha256.
