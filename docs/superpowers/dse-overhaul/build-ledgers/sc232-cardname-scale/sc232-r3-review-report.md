# SC-232 round 3 — independent adversarial review (dse `690582f`, base `619c4bd`)

## Executive summary

- **Verdict: FIX-FIRST.** Counts: CRITICAL 0 / HIGH 1 / MEDIUM 2 / LOW 4 / INFO 9.
- All gates reproduce: tsc and lint clean. Jest 4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots. Lifecycle 19/19. Shots 524 with 0 FAIL. Freeze `260/260`. Parity 0 GAPs / 0 undeclared / **24** DECLARED / exit 0. `origin/develop` is still `619c4bd`.
- Print is clean. Across 130 print-twin and 130 realprint captures, 0 name nodes change computed size and 0 nodes change geometry. On screen, no node outside the name changed font-size, line-height or letter-spacing.
- **HIGH-1:** SC-232 alone breaks the owner's narrow ruling ("not worse than a readable wrap"). The statblock band name goes from 5 lines to 7, with mid-word breaks rising from 2 to 4. The featureblock band name and "Bloodstones" gain new mid-word breaks. Merged with SC-284, every top-level name wraps on whole words. SC-284 therefore has to land first.
- **MEDIUM-1:** two families get the wrong size. A standalone trait `ds-feature` gets 33.3px (site: 27px). The kit's inline signature ability gets 27px (site: 33.3px, which the branch's own site baseline records).
- **MEDIUM-2:** the statblock row of the narrow composite shows the scrolled sticky bar, not the head name its "5 -> 7" label describes. The report also calls the mid-word breaks "not introduced", which is false for 2 names.
- **LOW:** the 8 `ink` rows cite SC-367 instead of SC-368. `.dse-sb` gets a query container with undocumented containment side effects. The project family is not mirrored (site 28.8px). There is no CHANGELOG entry.
- SC-284 trial merge: no text conflicts. The merged print bytes equal SC-284's `rebaseline.txt` exactly. SC-284 **fixes** the pre-existing 0-width grid column, so no separate ticket is needed.
- The parity site-baseline regeneration is legitimate. My fresh `parity:site` capture matches the committed inventory in every value except `capturedAt`, and the drift comes from real v2 font commits. No other local branch touches `visual-harness/parity/`.

## Method

Clones in my scratchpad, never the shared checkout:

- `r3/head` at `690582f`
- `r3/base` at `619c4bd`
- `r3/sc284` at `33b58c3`
- `r3/merge`: a trial merge of the two
- `r3/revert`: `690582f` with the SC-232 rule group removed

Every clone symlinks the worktree's `node_modules` and uses the pinned `obsidian-app.css`. `r3-evidence/scripts/measure.mjs` walked every text node and every `.dse-head` in all 131 capture ids across the 4 combos (522 capture/combo pairs), for base and head, and diffed them (`analyze.py`). Probe scripts are in `r3-evidence/scripts/` and logs in `r3-evidence/logs/`. The worktree was verified clean before and after: dse `git status --porcelain` is empty, and the superproject shows only its pre-existing ` M draw-steel-elements`.

## HIGH

### HIGH-1: SC-232 alone breaks the "readable wrap" narrow ruling; SC-284 must land first

**Where:** `styles-source.css:7267-7291` (the per-family sizes) and `:7317-7324` (the statblock-only narrow guard).

**Measured:** a per-character `Range` probe at a 300px width, Steel dark (`r3-evidence/logs/wrap2-*.log`):

| Name (capture) | base | SC-232 alone | SC-284 alone | SC-232 + SC-284 |
|---|---|---|---|---|
| Human Bandit Chief (statblock band) | 5 lines, 2 mid-word | **7 lines, 4 mid-word** (`Hu/ma/n/Ban/dit/Chi/ef`) | 2 lines, 0 | **3 lines, 0** |
| Bloodstone of Yendral (featureblock band, `featureblock-narrow`) | 2 lines, 0 | **4 lines, 2 mid-word** | 2 lines, 0 | 2 lines, 0 |
| Bloodstones (statblock sub-feature) | 1 line, 0 | **2 lines, 1 mid-word (new)** | 1 line, 0 | 2 lines, 1 |
| Ambush at the ford (encounter) | 4 lines, 1 | 5 lines, 1 | 1 line, 0 | 2 lines, 0 |
| Cross the Ashfall Wastes (montage) | 3 lines, 0 | 4 lines, 0 | 2 lines, 0 | 2 lines, 0 |

The live site at 300px (`site-wrap-300.log`) also breaks the 27px sub-feature names mid-word (`Bloodst/ones`, `Longsw/ord`). The merged tree's remaining sub-feature breaks therefore match the site's own narrow behaviour. The top-level head names do not match on SC-232 alone.

**Failure scenario:** SC-232 lands before SC-284. Every statblock in a sidebar leaf then shows a 7-line, broken-word name. The featureblock band, which has no guard at all, starts breaking mid-word where it never did before. See `r3-evidence/r3-statblock-300-unscrolled-4way.png` and `r3-featureblock-300-4way.png`.

**Fix:** make SC-284 a hard landing prerequisite:

1. Land SC-284.
2. Rebase SC-232 onto it.
3. Re-run the battery.
4. Regenerate the narrow evidence on the combined tree.

The ask to Scott should present the combined state. If SC-232 has to land first, it needs a narrow guard for the featureblock band and the generic family too, which goes beyond mirroring the site's single live rule.

## MEDIUM

### MEDIUM-1: family misassignment, so the per-family selectors do not reach "every family at the site's size"

**Where:** `styles-source.css:7276` (the ability selector) and the generic fallthrough at `:7267`.

**Measured:**

- **Trait feature element.** A standalone `ds-feature` with `feature_type: trait` renders its name at **33.3px/33.3**. I checked this with a scratch-only fixture added to `r3/head/visual-harness/entry.ts`. The site renders a standalone trait at **27px/28.08** (`sc-trait.sc-trait--crest`, live pages `Browse/feature/trait/human/determination/` and `Browse/feature/fury/level-1/mighty-leaps/`; `logs/site-trait.log`). The selector `[data-dse-element='feature'] > .dse-feature > .dse-head > …` ignores the trait marker `data-dse-act="trait"`, which `renderFeature.ts:133` already writes on `.dse-feature`.
- **Kit signature ability.** In inline mode (`kit` fixture, `div.dse-card__band > .dse-feature__nested > .dse-feature > .dse-head`) "Devastating Rush" renders at **27px**. The site renders it at **33.3px**: live `Browse/kit/panther/`, and the branch's own regenerated `site-inventory.json` entry `kit--dark` `.sc-ability > .sc-head .sc-head__left-primary` = 33.3px. The `name-generic` pair's own "why" text says this node is "a DIFFERENT family at a DIFFERENT size".
- **Mode inconsistency.** A by-SCC (hybrid) kit renders its signature ability through a nested fenced `ds-feature` block, which becomes its own `[data-dse-element='feature']` root (`display/layouts.ts:186-194, 343-351`). That root matches the ability rule, so it renders at 33.3px. The same signature ability therefore renders at 27px or 33.3px depending on whether the kit is inline or by-SCC.
- **Why the gate is blind:** `firstIn` (`parity/compare.cjs:205-208`) compares only the first page carrying the pair's site selector, and no pair maps the kit's embedded ability or a trait card.

**Fix:**

1. Exclude traits from the ability rule and add the kit band's nested ability:

```css
[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='feature'] > .dse-feature:not([data-dse-act='trait']) > .dse-head > .dse-head__primary--left,
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card__band > .dse-feature__nested > .dse-feature:not([data-dse-act='trait']) > .dse-head > .dse-head__primary--left { … * 1.665; line-height: 1 }
```

2. Add a `name-kit-signature` parity pair: site `.sc-kit .sc-embed .sc-ability > .sc-head .sc-head__left-primary`, plugin `[data-dse-element='kit'] .dse-card__band .dse-feature > .dse-head > .dse-head__primary--left`.
3. Ideally, also add a harness trait fixture plus a trait page in `urls.json`, so both cases can fail the gate.

### MEDIUM-2: the evidence does not show what its labels say, and the report overstates "not introduced"

**Where:** `r2-evidence/sc232-compare-narrow.png`, row 1, and `sc232-r2-implement-report.md` (executive summary bullet 3, and "Word breaks").

The row labelled "STATBLOCK-STICKY-NARROW: name lines 5 -> 7" crops the scroll capture, so both cells show the sticky bar's one-line "HUMAN BANDIT CHIEF". The two cells are also at different scroll offsets (320 vs 450). The head-band name that actually went from 5 to 7 lines is off-frame. The report says the mid-word breaks are "pre-existing … not introduced by this branch". That is false for "Bloodstones" (whole at base, `Bloodsto/nes` at head) and for the featureblock band (0 to 2 mid-word breaks). The wide composite also leaves out the nested and kit-signature cases, which is where MEDIUM-1 lives. The Option B column itself is honest: probe-B on base re-measures 27px on every family's name (`m-B-base`).

**Fix:** replace row 1 with an unscrolled capture (`r3-evidence/r3-statblock-300-unscrolled-4way.png` is ready), add the featureblock row, and correct the report sentence before anything goes to Scott.

## LOW

### LOW-1: the 8 `ink` declarations cite SC-367; the owner ruled SC-368

**Where:**

- `visual-harness/parity/selector-map.json:46-93` (8 `why` strings; each also claims "SC-367 already covers…")
- `test/unit/parity/compare.test.ts:818-827` (comment)
- `visual-harness/parity/README.md:526` (table row: "filed SC-367 … pending the owner's call")

**Confirmed:** there are exactly 8 new entries. All are `rule: "ink"` and each has a `scheme` (4 pairs × dark/light), so no size row is hidden among them.

**Fix:** retarget all three places to SC-368 and drop the "pending the owner's call" wording. `styles-source.css:8033`'s SC-367 citation concerns the mini size ratio, so it correctly stays SC-367.

### LOW-2: `container-type` on `.dse-sb` has no containment note, and SC-284 offers a single-container alternative

**Where:** `styles-source.css:7317-7320`.

**Measured:** with a shrink-to-fit ancestor (`width: fit-content` on the statblock root), `.dse-sb` collapses to **2px wide, 36758px tall** at head, against 760px at base (`scripts/shrink.mjs`). SC-284's own comment says that on the Chromium-106 floor `inline-size` also brings layout and style containment: a new stacking context, and a containing block for `position: fixed` descendants. The harness's newer Chromium cannot show that. Every sibling container in the sheet (stamina-host `~:11747`, SC-284) documents these costs; this one does not. No shipped plugin context triggers the collapse.

**Fix:** add the stamina-host-style constraint note, covering the chrome menu that mounts into `.dse-sb`. Alternatively, once SC-284 lands, drive the step-down from SC-284's `dse-head` container: the name is a descendant of `.dse-head`, so `@container dse-head (max-width: …)` can style it. That drops the second containment layer.

### LOW-3: the project family is not mirrored

**Where:** `styles-source.css:7263-7266` lists project as generic.

The survey's own §1 table gives the site `.pj__head` 1.6rem × 0.9 = **28.8px**. The plugin's project head is now 27px (94%). "Per-family site parity" either needs a project rule (`* 1.44`) or an explicit note that project is left generic on purpose.

### LOW-4: no CHANGELOG entry

The dse `CHANGELOG.md` 7.0.0 (unreleased) section carries a bullet per ticket; SC-284 adds one. SC-232 is user-visible and has none. Add it once Scott picks an option.

## INFO

1. **Gates, re-run by me.** Logs are in `r3-evidence/logs/`.
   - tsc and lint clean.
   - Jest 4038/1/208 of 209/3 (after `rm -f main.js styles.css`).
   - `obsidian-lifecycle` on port 9291: 19/19. The diff touches harness TS, so I ran it.
   - Shots 524, 0 FAIL.
   - `freeze OK (260/260 …)`.
   - Parity 0/0/24 DECLARED, exit 0. The brief's "16 DECLARED" is stale; 24 is the number the ledger accepted. `dse-verify` SKILL.md's "Current expected numbers" (16) needs updating at landing.
2. **The parity pairs can fail.** In `r3/revert` I removed the rule group; the rest of the tree was identical. Parity then reported **16 GAPs** (4 pairs × font-size/line-height × 2 schemes), exit 1. The `letter-spacing` change (0.2px to 0) is below the 0.25px tolerance, so no pair pins it.
3. **Side effects.** 0 non-name nodes moved; my raw 1368 diffs were all `<p>` children of the name. Crest centering is unchanged (crestDy identical everywhere). Right-primary centering improved (−1.33 to −0.01px). Row-gap is unchanged at 1.92px. Head heights grow as expected (statblock 116.69 to 132.27, featureblock 85.13 to 99.16, feature 54.39 to 59.2, encounter 51.56 to 53.98).
4. **Nested sub-feature heads.** Every nested head in statblocks, featureblocks and the Feature element is 27px/28.08. The families are 33.3, 41.4 and 37.8 as intended. Modals and the sidebar render no `.dse-head__primary--left`, so rule `~:7624` is unaffected.
5. **Threshold.** The step-down triggers at the `.dse-sb` content box of 544px (width 540 gives 33.3px, 550 gives 41.4px). That mirrors 34em correctly and uses the same literal as the `dse-sb-sticky` container.
6. **Harness change `690582f` is correct.**
   - The `?? n.scrollTo` fallback means no behaviour change for the other 4 scroll entries.
   - Print and realprint both use 320, so the print-twin delta (twin vs realprint) stays consistent.
   - The frozen bytes are unchanged.
   - The screen PNG shows the `--stuck` bar (I viewed it).
   - In the SC-284-merged tree, 450 still reaches `--stuck` (merged shots 0 FAIL).
7. **Site baseline regeneration (`611c638`).**
   - My fresh `npm run parity:site` (live steelcompendium.io/v2, in `r3/revert`) reproduces every value except `capturedAt`.
   - The drift (166 `font-family` and 30 `font-weight` changes) comes from real v2 commits: `d7d81ff2c0` (2026-09-10, Newzald to Petrona), `65a5e5be69` (bold subhead) and the Berlingske family rename. Computed `font-family` is the declared list, not an environment artifact.
   - The kit-index page now carries `.sc-ability` nodes, a live-site change; it is harmless because `firstIn` picks the ability page first.
   - I scanned every worktree's dse branches: none besides SC-232 touch `visual-harness/parity/`. SC-235, not yet branched, will conflict textually on `declaredDeferrals`, the `compare.test.ts` "documented N entries" test and the README counts, so land SC-232 and SC-235 in sequence.
8. **The 0-width grid column is pre-existing and SC-284 fixes it.** At base, 4 nested names in `statblock-sticky-narrow` have `width: 0` ("Whip and Magic Longsword" is 21 lines). SC-284 alone and the merge give 157.4px/134.6px with whole words. Per the ledger, do not file it separately.
9. **Pre-existing print caveat, not SC-232-specific.** The ancestor-form guard `[theme]:not([print]) .x` still matches inside a nested root that pins `printPreview: on` while its outer root does not (a by-SCC nested fence). All ~297 descendant-form Steel rules share this.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r3-review-report.md`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r3-evidence/r3-statblock-300-unscrolled-4way.png`: base / SC-232 / SC-284 / merge at 300px
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r3-evidence/r3-featureblock-300-4way.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r3-evidence/scripts/`: `measure.mjs`, `analyze.py`, `wrap.mjs`, `site-wrap.mjs`, `site-names.mjs`, `shrink.mjs`, `thresh.mjs`, `crop.mjs`, `manifest.mjs`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r3-evidence/logs/`: gate logs, `parity-revert.log`, `merge.log`, `freeze-merge.log`, wrap logs, site logs
