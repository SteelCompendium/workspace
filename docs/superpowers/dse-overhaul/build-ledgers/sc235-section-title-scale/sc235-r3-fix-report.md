# SC-235 round 3 — fix round report

## Executive summary

- **STATUS: DONE.** All five round-2 findings addressed: HIGH-1 (wording) FIXED, MED-1 (spend
  chip) FIXED by pinning, MED-2 (evidence) FIXED/rebuilt, LOW-1 FOLDED (comment line), LOW-2
  disclosed. The branch CSS for the section title itself is unchanged from round 1/2: still
  18px / 0.1em (option A, as built).
- **dse head sha:** `35d3b46` (branch `sc235-section-title-scale`, rebased onto `origin/develop`
  `5a20d5f` — base moved three times mid-round: `825ea51` → `afd6ae3` (SC-338) → `5a20d5f`
  (SC-317); rebased cleanly each time, no conflicts in the DSE repo).
- **Superproject sha:** `f0e566a` (rebased onto `origin/main` `9a7e39b`; one real conflict,
  in `CHANGELOG.md` — SC-317's bullet landed at the same list position as SC-235's — resolved
  by keeping both bullets, SC-235's in its round-3-reworded form; the submodule-pointer side
  of the same conflict resolved to the current DSE head each time).
- **Gates (final, on `5a20d5f`):** tsc clean; lint clean; jest **4122** total (**4121 passed**
  / 1 skipped / 0 failed) vs base **4119** total (+3 exactly: round 1's 2 tests + round 3's 1
  spend-chip test, 0 skip drift); `obsidian-lifecycle` **19/19 ok, 0 failed**; `shots`
  **532 PNGs, 0 FAIL**; freeze **260/260**, exit 0; parity **0 GAPs / 0 undeclared /
  10 DECLARED / exit 0**; can-fail proof (CSS reverted) **6 GAPs, exit 1**, restored
  byte-clean, re-verified green.
- **Per-finding:** HIGH-1 DONE · MED-1 DONE · MED-2 DONE · LOW-1 DONE (folded) · LOW-2 DONE
  (disclosed) · owner's B-narrow-wrap addition DONE (measured: **0 new wraps from B anywhere**,
  so no B column was needed in the narrow composite image, per the addition's own conditional).
- Evidence: 3 composite PNGs (`sc235-compare-wide.png`, `sc235-glyph-zoom.png`,
  `sc235-compare-narrow.png`), all viewed and confirmed to show what their captions claim.

## 1. Context / rebases

- DSE: started at `43b76cc` on `825ea51`. `git fetch` showed develop moved twice more during
  the round (dispatcher messages): `afd6ae3` (SC-338, `.dse-optchip` focus ring — unrelated to
  `.dse-section__title`) then `5a20d5f` (SC-317, external-link arrow — also unrelated). Both
  rebases were clean, no conflicts, in the DSE repo. Re-verified after each rebase that
  `.dse-section__title`'s rule and the spend-chip pin were byte-unchanged (grep + a fresh
  spend-chip computed-style probe — identical numbers every time, see §4).
- Superproject: rebased onto `origin/main` twice; the second rebase (onto `9a7e39b`, after
  SC-317 landed) hit one real conflict in `CHANGELOG.md` (SC-317's own bullet inserted at the
  same list position SC-235's bullet occupies) plus the mechanical submodule-gitlink conflict
  that always accompanies a superproject rebase after another ticket's pointer bump landed.
  Resolved by keeping both CHANGELOG bullets (SC-317's, then SC-235's round-3-reworded one)
  and pointing the gitlink at the current DSE head each time.
- **Footgun found and worked around (not a regression):** a `git archive`-based scratch build
  (used for the today/head A-B-comparison captures, same technique round 2's independent
  review used) has no `.git` directory, and some jest suite conditionally skips 2 additional
  tests when `.git` is absent — so a base-count measured from a `git archive` scratch copy
  read 3 skipped instead of 1, producing a false "5 tests changed" instead of the true "3
  tests changed". Caught by cross-checking against the OTHER base-measurement method (checking
  out old file versions into the real worktree, which still has `.git`) — that gave the
  consistent, correct 1-skipped count matching head. All final jest base counts in this report
  use the in-worktree method, never the archive.

## 2. Findings addressed

### HIGH-1 — "matches the site" wording (FIXED)

Every place round 1 claimed visual size parity now says COMPUTED parity only, and states the
real reason the rendered glyphs still differ (browser-synthesized vs. real small caps):

- `draw-steel-elements/CHANGELOG.md` (the SC-235 bullet)
- Superproject `CHANGELOG.md` (the SC-235 bullet)
- `styles-source.css` (~8166, the SC-235 rule comment) — also folds LOW-1 in the same edit
- `visual-harness/parity/README.md` (~535, the "HEALED and deleted" paragraph) — adds a
  sentence that the `section-tag:font-size` rule "compares computed style values only — it
  cannot see the font FACE or whether small caps are real glyphs or a browser synthesis"
- `test/unit/parity/compare.test.ts` (~818, the dated-log comment on the declared-set guard)

Grepped the whole diff and the whole working tree afterward for any remaining "match(es) the
site" claim tied to the section title — none found.

### MED-1 — spend-chip pin (FIXED)

`styles-source.css` ~9346 (`.dse-section--spend .dse-section__title`) now states its own
`font-size: var(--dse-fs-body); letter-spacing: 0.07em;` explicitly (today's x1 values, same
`--dse-fs-body`-derived form the base rule uses), with a one-line comment explaining why: it
would otherwise inherit the base rule's new 18px/0.1em by cascade, but it is a different site
element (`.sc-ability__enh .cost`, out of this ticket's scope).

**Verified: chip computed style and box width equal base `5a20d5f` exactly.**

| | font-size | letter-spacing | chip width | spend-body width |
|---|---|---|---|---|
| Base (`5a20d5f`, before any SC-235 CSS) | 16px | 1.12px | 333.03px | 343px |
| Head (`35d3b46`, spend pin applied) | 16px | 1.12px | 333.03px | 343px |

New jest source-text test (`steelTypography.test.ts`) pins the spend rule's own font-size/
letter-spacing declarations, and the existing base-rule letter-spacing test was narrowed to
exclude the spend selector explicitly (it used to accidentally also pass by matching the
spend block, which would have gone undetected-wrong once the spend block got its own,
deliberately different, letter-spacing).

### MED-2 — evidence rebuild (FIXED — see §5, §6, §7)

### LOW-1 — `--dse-fs-subheading` vs `--dse-fs-body * k` (FOLDED)

One comment line added to the `styles-source.css` SC-235 rule (same edit as HIGH-1's rework):
explains that `--dse-fs-subheading` was not used because it would tie the section title to the
Large-text-size knob, which the owner's unit rule forbids (a pure x1.125 of TODAY's behavior,
not a new knob dependency).

### LOW-2 — 240px wrap disclosure (DONE)

Disclosed in both the narrow table (§7) and a new third row in `sc235-compare-narrow.png`:
"(2 Malice)" also wraps at 240px, in the same 5 statblock captures round 2 found (`statblock`,
`-stats-ledger`, `-stats-gridc`, `-columns-wide`, `-with-captain`), 0 mid-word breaks.

### Owner's mid-round addition — B's narrow-width wraps (DONE)

Measured B (the probe: `calc(var(--dse-fs-body) * 0.9375)` / `0.12em`) at 300px and 240px
against every capture id the harness's manifest lists (same sweep round 2's `wrap300.mjs`
uses, adapted to inject the B override — scoped as `.dse-section:not(.dse-section--spend) >
.dse-section__title` so it cannot leak onto the pinned spend chip, verified by a sanity check
below). **Result: B adds 0 new wraps and 0 new mid-word breaks anywhere A didn't already
wrap, at either width.** Despite "EFFECT" being nominally 2px wider under B than under Today
(62px vs 60px), B's own narrower per-character advance and its shorter word overall (vs. A's
68px) mean it never crosses a wrap boundary A doesn't already cross. Per the addition's own
conditional ("No image is needed for B unless it adds a wrap"), no B column was added to
`sc235-compare-narrow.png` — the B column lives in the narrow table (§7) only, all "no new
wrap".

**Spend-chip sanity check (that the B override didn't leak onto the pinned chip):** the
`feature-spend` capture's title-row wrap data is byte-identical between Today and B at both
widths (same line counts, same line contents) — confirming the scoped override left the
pinned 16px/0.07em spend title untouched.

## 3. Per-finding done/not-done

| Finding | Status |
|---|---|
| HIGH-1 (wording) | DONE — reworded in 5 files |
| MED-1 (spend-chip pin) | DONE — pinned + verified byte-identical to base |
| MED-2 (evidence rebuild) | DONE — 3 composites rebuilt, all verified at capture time |
| LOW-1 (subheading comment) | DONE — folded into the SC-235 rule comment |
| LOW-2 (240px wrap disclosure) | DONE — narrow table + composite row |
| Owner addition (B narrow wraps) | DONE — measured, 0 new wraps, no image needed |

## 4. Per-cell computed-size verification (wide composite)

Every cell's computed `font-size`/`letter-spacing` was read via `getComputedStyle` at capture
time, immediately before the screenshot — not assumed from the CSS source.

| Family | Today | A (this branch) | B (probe) | Site |
|---|---|---|---|---|
| feature/ability | 16px / 1.12px | 18px / 1.8px | 15px / 1.8px | 18px / 1.8px |
| statblock | 16px / 1.12px | 18px / 1.8px | 15px / 1.8px | 18px / 1.8px |
| kit | 16px / 1.12px | 18px / 1.8px | 15px / 1.8px | 18px / 1.8px |

Every cell has exactly the size its column label claims, no exceptions.

## 5. Letter-height / word-width table (Site / Today / A / B)

Rendered ink height + word width of "Effect"/"EFFECT", measured by the same pixel-scan
method round 2's `glyph-probe.mjs` uses (50%-coverage bounding box against the median border
background), on the SAME feature card / same word for all four, plus cross-checked on the
statblock and kit cards (same font/weight/size pipeline, so ink height matches across
families as expected — width varies by ~1px from kerning-context only):

| | Computed font-size / letter-spacing | Ink height | Ink width (feature card) |
|---|---|---|---|
| Site | 18px / 1.8px | **8px** | 55px |
| Today | 16px / 1.12px | **9px** | 60px |
| A (this branch) | 18px / 1.8px | **10px** | 68px |
| B (probe) | 15px / 1.8px | **8px** | 62px |

Matches round 2's independently-measured numbers exactly (site 8, today 9, branch 10, probe
8/62). B matches the site's rendered glyph HEIGHT (8px = 8px) but is not size-identical in
every respect — B's word is 62px against the site's 55px (B's real `smcp` glyphs are wider
per unit height than the site's synthesized ones), a residual round 2's own analysis already
named ("no size of SS4 Bold with real smcp matches all three of height, width and weight").

## 6. Spend-chip before/after table

See §2 MED-1 above — reproduced here for the report's own required table:

| | font-size | letter-spacing | chip box width | spend-body width |
|---|---|---|---|---|
| Base `5a20d5f` (pre-SC-235) | 16px | 1.12px | 333.03px | 343px |
| Head `35d3b46` (SC-235, pinned) | 16px | 1.12px | 333.03px | 343px |

Byte-identical. The spend chip is untouched by SC-235 end to end.

## 7. Narrow table (A and B)

0 new mid-word breaks anywhere, both A and B, at both widths.

| Capture / width | Today | A (this branch) | B (probe) |
|---|---|---|---|
| feature "Special (2 Malice)" @300px | 1 line | **2 lines** (new wrap, breaks after "(2") | 1 line (no new wrap) |
| statblock "Effect"/"(2 Malice)" @300px | 1 line each | 1 line each (no new wrap) | 1 line each (no new wrap) |
| statblock family "(2 Malice)" @240px (5 captures: `statblock`, `-stats-ledger`, `-stats-gridc`, `-columns-wide`, `-with-captain`; 10 rows) | 1 line | **2 lines** (new wrap, "(2" / "MALICE)") | 1 line (no new wrap) |

B never adds a wrap A doesn't already have, at either width, across every capture id in the
harness manifest (full sweep, not just the families named above).

## 8. Evidence composites

All three viewed and confirmed to show what their captions claim.

- **`sc235-compare-wide.png`** — 3 rows (feature/ability, statblock, kit — featureblock row
  dropped per the owner ruling) x 4 columns (Today / A / B / Site), Steel dark, 900px
  main-pane width, 1 image px = 1 CSS px. Every caption states the verified computed
  font-size/letter-spacing AND the measured ink height/word width (§4, §5).
- **`sc235-glyph-zoom.png`** — the word "EFFECT" from the same feature card, 4 rows (Site,
  Today, A, B — the reviewer's weight-400 probe row dropped), 6x nearest-neighbour
  enlargement, plain-language captions with the measured numbers.
- **`sc235-compare-narrow.png`** — 3 rows: feature @300px ("Special (2 Malice)"), statblock
  @300px ("Effect"/"(2 Malice)"), and the new statblock @240px row (LOW-2) — Today vs A only
  (B needs no image row per §2's addition finding), rebuilt on the current head.

## 9. Gate numbers (final, measured on `5a20d5f` → `35d3b46`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base `5a20d5f`, in-worktree checkout method) | 4119 total (4118 passed / 1 skipped / 0 failed) |
| `npx jest` (head `35d3b46`) | **4122 total (4121 passed / 1 skipped / 0 failed)** — exactly base + 3 (2 from round 1, 1 from round 3's spend-chip pin test) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 |
| `npm run shots` | **532 PNGs, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared / 10 DECLARED / exit 0** |
| Can-fail proof (CSS reverted) | **6 GAPs, exit 1** — restored byte-clean, re-verified green immediately after |

## Commits

DSE (`draw-steel-elements`), branch `sc235-section-title-scale`, now at `35d3b46`:
1. `c4237f5` — round 1's CSS + parity map/test/README (rebased sha; unchanged content)
2. `b73fac0` — round 1's font-size/letter-spacing test (rebased sha; unchanged content)
3. `2b2d3dc` — round 1's DSE CHANGELOG bullet (rebased sha; unchanged content)
4. `35d3b46` — `fix(feature): SC-235 round-3 fixes — wording, spend-chip pin, subheading note`

Superproject worktree, branch `sc235-section-title-scale`, now at `f0e566a`:
1. `592b0f4` — round 1's CHANGELOG bullet + DSE pointer bump (rebased/conflict-resolved)
2. `f0e566a` — `docs: SC-235 round-3 fixes — CHANGELOG reword + DSE pointer bump`

## Evidence artifacts (all absolute paths)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/sc235-r3-fix-report.md`
- Composites: `r3-evidence/sc235-compare-wide.png`, `r3-evidence/sc235-glyph-zoom.png`, `r3-evidence/sc235-compare-narrow.png`
- Composite specs: `r3-evidence/wide-spec.json`, `r3-evidence/narrow-spec.json`
- Per-cell crops + word crops: `r3-evidence/crops/*.png` (context + word crops for today/A/B/site x 3 families, plus narrow crops)
- Wide-capture computed-style/ink-scan data: `r3-evidence/crops/wide-capture.json`
- Spend-chip probe data: `r3-evidence/spend-today.json`, `r3-evidence/spend-head.json`, `r3-evidence/spend-head-final.json`
- Wrap sweeps: `r3-evidence/wrap-today.json`, `r3-evidence/wrap-A.json`, `r3-evidence/wrap-B.json`, `r3-evidence/wrap-diff.log`
- Scripts (new + copied from r2-review, unedited copies noted): `r3-evidence/scripts/{wide-capture,spend-probe,wrap-diff}.mjs` (new), `r3-evidence/scripts/{wrap300,wrap300-B}.mjs` (wrap300 is an unedited copy of r2-review's; wrap300-B is a derived copy with the B-override injection added), `r3-evidence/scripts/{crop,compose}.mjs` (copied from r1-evidence), `r3-evidence/scripts/glyph-zoom.py` (new, modeled on r2-review's `options-zoom.py`)
- Reused r2-review glyph crops (unedited, cited not copied further): `r2-review/glyph-{site,today,head}-dark.png`, `r2-review/variant-fs15-ls012.png`
- Scratch git-archive builds (for the A/B/Today comparison, symlinked node_modules): `r3-evidence/today/` (base `5a20d5f`), `r3-evidence/head/` (head `35d3b46`)
- Gate logs (final): `r3-evidence/{tsc-final,lint-final,jest-final-base,jest-final-head,lifecycle-final,shots-final,freeze-final,parity-final,parity-final-2,parity-canfail-final}.log`
- Gate logs (intermediate, kept for the record across the 3 rebases): `r3-evidence/{tsc,lint,jest-head,jest-head-2,jest-base,jest-base-2,jest-base-3,jest-base-retest,jest-base-worktree,jest-targeted,jest-targeted-2,lifecycle,shots,freeze,parity-head}.log`
