# SC-232 r1 survey: how big should the Steel card-head name be?

## Executive summary

1. **The ticket's target is wrong.** The site's name is not 24px. At the parity viewport (1440, and also 900) the site's root is 20px, `--md-large-header-scale` is 0.90, and body `.md-typeset` is 16px. Measured names: **generic 27px/28.08, ability card 33.3/33.3, statblock 41.4/39.33, featureblock 37.8/37.04**. The plugin draws **20px/23px** everywhere, from one shared rule.
2. **The corrected percentages** use the project's own convention: compare raw computed px (parity README rule 4, "do not correct for the 20/16 ratio"). Both sides have a 16px body, so this is the same as comparing em-of-body. Plugin vs site: **generic 74%, ability 60%, featureblock 53%, statblock 48%**. The ticket's 83% does not hold. SC-235's section title is 16 vs 18 = 89% under the same convention, so the two tickets agree.
3. **Recommendation: Option A, per family like the site.** It adds one new Steel screen-only rule group placed after `styles-source.css:7224`:
   - generic `.dse-head__primary--left`: `calc(var(--dse-fs-heading) * 1.35)` / `line-height: 1.04` / `letter-spacing: 0`, which gives 27px
   - `[data-dse-element='feature'] > .dse-feature > .dse-head > …`: `* 1.665` / `1`, which gives 33.3px
   - `.dse-sb > .dse-head > …`: `* 2.07` / `.95`, which gives 41.4px
   - `.dse-fb > .dse-head > …`: `* 1.89` / `.98`, which gives 37.8px

   Every family lands at 100% of the site in computed px. Source Serif 4's caps are about 6% shorter than Cinzel's at the same px, so this does not overshoot. Fallback is Option B: one shared 27px.
4. **Print and freeze do not move under A, B or D.** Checked in the harness by injecting the rule and diffing the computed style of every name node: 0 of 130 print-twin captures and 0 of 130 realprint captures changed. The one print-moving path is Option C (edit the token or the unscoped rule), which would reach at least 146 of the 260 frozen lines. It is rejected.
5. **SC-284 overlap: no textual conflict.** The recommended rule sits about 6,000 lines away from SC-284's two hunks. Only Option C would edit `:13636-13643`, which lies between SC-284's hunks, and even then git context would not collide.
6. **SC-284 overlap: a real semantic interaction.** Bigger names make narrow heads worse. Without SC-284, `statblock-sticky-narrow` wraps "Human Bandit Chief" to 5 lines today and 8 under A. Land SC-284 first, or verify the two together.
7. **The parity gate still cannot see the name after the fix.** No pair maps it. Adding per-family name pairs is a separate follow-up (see §6).
8. **Side findings.** The ticket's "crest at parity" (48×54.39 vs 50×56) is wrong for the same reason as the name. The ability and trait card crests compute to **60×68** (3rem×3.4rem at a 20px root), so the plugin crest is 80%. The ticket's eyebrow figure of 94% is really **75.6%** (13.6 vs 18px). The right-rail minis follow the same pattern (statblock role: plugin 18 vs site 28px).

---

## 1. Site truth (live site, measured with Playwright, `data/site-names-1440.json` and `-900.json`)

Page environment: `html` font-size **20px** at 1440 and at 900. It is pinned at 125%, `v2/docs/stylesheets/extra.css:34-35`. `--md-large-header-scale` is **0.90** (`custom_font.css:126`). `.md-typeset` is **16px / 27.2px** (`extra.css:20-21`, 0.8rem). Dark and light schemes gave identical sizes (0 differences). The face is Cinzel 900, uppercase, letter-spacing `normal` (0) in every family.

| Family (site node) | Rule (v2 worktree) | Measured font-size / line-height | em of the 16px body | Crest on site (w×h) |
|---|---|---|---|---|
| Generic card-head name (kit head, trait/ancestry/class cards, **every nested statblock/featureblock sub-feature**, kit-index signature cards) | `steel-cardhead.css:99-101`, 1.5rem × 0.9 | **27px / 28.08px** | 1.6875 | trait 60×68, kit 38×43, sub-feature icon 23×23 |
| Standalone ability card `.sc-ability > .sc-head` | `steel-ability-cards.css:107-110`, 1.85rem × 0.9 | **33.3px / 33.3px** | 2.081 | 60×68 |
| Statblock band `.sb__head` | `steel-statblock.css:141-143`, 2.3rem × 0.9 | **41.4px / 39.33px** | 2.5875 | none |
| Featureblock band `.fb__head` | `steel-featureblock.css:85-87`, 2.1rem × 0.9 | **37.8px / 37.04px** | 2.3625 | none |
| Project head `.pj__head` | `steel-project.css:32-34`, 1.6rem × 0.9 | 28.8px (from CSS, not on a parity page) | 1.8 | — |
| Index preview `.sc-prev` | `steel-indexes.css:148`, 1.3rem × 0.9 | 23.4px / 24.34px | 1.4625 | 50×57 |
| Reference tile `.sc-card__name` | `steel-redesign.css:191`, 1.45rem × 0.9 | 26.1px (kit index), 30px (perk `--wide`) | — | — |

Other values on the same heads: eyebrow **18px** (.9rem), row-gap **2.4px** (.12rem). Right-primary: statblock role mini **28px**, ability/trait mini **18.4px**, sub-feature chip **18px**. The statblock responsive rule (`steel-statblock.css:630`) drops the name to 33.3px only below a 34em viewport.

Where the ticket's numbers come from:
- **24px** is 1.5rem × 16px. It ignores both the 125% root and the ×0.90 scale.
- **50×56** is the `.sc-crest.lg` class literal (`steel-redesign.css:59`). No ability or trait card computes to that size.

Face metrics (`data/glyph-metrics.json`, canvas at 100px):

| Face | Cap ascent (per em) | Advance ("COVERAGE STRIKE", per em) |
|---|---|---|
| Cinzel 900 (site) | 0.70–0.73 | 10.35 |
| Source Serif 4 700 (plugin) | 0.66–0.68 | 8.86, about 14% narrower |

At equal px, the plugin's name reads about 6% shorter in the caps and 14% narrower than the site's.

Container widths (`data/widths.txt`): the site card is 908px wide (868px at a 900 viewport). The plugin card in the 900px harness is 760px.

## 2. Plugin truth (F4 harness, 900×1200, Steel; `data/plugin-names-base.json`, all 130 capture ids × dark/print/realprint)

**Every visible name is 20px / 23px / 0.2px tracking, Source Serif 4 700.** That covers statblock head, featureblock head, standalone feature, nested sub-feature, reference-card head, and GM tracker heads (encounter, negotiation, montage, project, party, roll). Print and realprint are identical except `text-transform: none`, and the crest is hidden (0×0). Crest `.dse-crest--lg` is 48×54.39, eyebrow 13.6px, head row-gap 1.92px.

Rules that set the name (`draw-steel-elements/styles-source.css` at `619c4bd`):

| What | Where | Scope |
|---|---|---|
| **font-size / line-height** | `:13636-13643`, `.dse-head__primary--left { font-size: var(--dse-fs-heading); line-height: 1.15; font-weight: bold }` | **Unscoped**: screen AND print |
| Token | `:6279`, `--dse-fs-heading: calc(1.25em * var(--dse-fs-large-scale))` = 20px on the head's 16px | Theme- and print-invariant by contract (`:6264-6270`) |
| letter-spacing 0.01em | `:7210-7212`, `[data-dse-theme='steel']` | Reaches print |
| Weight 700 + uppercase | `:7219-7224`, `:not([data-dse-print="on"])` | Screen only |
| font-family | `:7523`, the consolidated Title slot | All |
| text-shadow | `:7199-7207` | — |

- **It is one shared rule. No per-family override exists.**
- The size is the `--dse-fs-heading` role token. Five other consumers read the same token: `:2824` compact `.dse-sb__item-v`, `:4616` montage stat value, `:7724` deck chip ×0.9, `:7827` card-head mini ×0.9, `:7927` fb option mini ×1.08. Changing the token therefore moves all of them.
- `.dse-card__title` appears **0 times** across all 390 capture/combos. It is emitted only on CardLayout's non-Steel `renderBase` path (`src/elements/shared/CardLayout.ts:472`). Steel reference cards (kit, ancestry, class, career, complication, condition, culture, perk, rule, title, treasure) render their name through cardHead's `.dse-head__primary--left`. It is not part of this ticket.

## 3. The mapping convention

**The project's convention is raw computed-px parity. It is not a 0.8 rem ratio.**

- **Parity README rule 4** (`visual-harness/parity/README.md:188-216`): "Since both inventories capture computed px, comparing px is coherent and correct — do not 'correct' for the 20/16 ratio … cite the target computed px in a comment." `compare.cjs` compares px with `LEN_TOL` 1.5.
- **Plan 21 constraint** (`docs/superpowers/dse-overhaul/plans/2026-07-23-plan-21-…md:93`) and the **gap inventory** (`…/2026-07-23-steel-ui-gap-inventory.md:144`): "match the px/em target, not the site's rem literal."
- **Chip precedent** (`styles-source.css:7709-7725`): site 18px was matched as 18px, not 14.4.
- **SC-235 / section-tag declaration** (`selector-map.json:13`): "Site .tag is .9rem = 18px at the site's 20px rem base; the plugin authors 16px". This is the same convention, so the pair is consistent.
- Why it works: the site's body is itself 0.8rem = 16px, the plugin's body is 16px, and so computed-px parity and em-of-body parity are the same thing. Applying a 0.8 factor on top would count the rem base twice.

**Dissenting precedents: the ratio-to-name comments.**
- `~7812-7819` derives the card-head mini as 0.9 × the plugin's name slot. `~7906-7914` derives the fb option mini as 1.08 × it.
- Both anchor on the plugin's own 20px name, so they pass the name's under-size on to the minis. That is why the statblock role is 18 vs 28px.
- `~7911` also cites the site's `.fb__feat-name 1.25rem = 25px`. That is **stale**: `.fb__feat-name` matches 0 nodes on the live site, and sub-feature names are `.sc-head__left-primary` at 27px.
- DESIGN.md (`:83-96`) states only that sizes are `--dse-fs-*` em roles. It sets no cross-surface ratio. The D3 token map (`:685`) pins `--dse-fs-heading` as theme- and print-invariant.
- Crest and row-gap were ported rem-literal (3rem → 3em, .12rem → .12em). That is the same error, and it explains the 80% crest.

**Corrected percentages (plugin 20px ÷ site computed px):**

| Family | Plugin ÷ site | Result |
|---|---|---|
| Generic, including nested sub-features and the kit head | 20 ÷ 27 | **74.1%** |
| Ability card | 20 ÷ 33.3 | **60.1%** |
| Featureblock | 20 ÷ 37.8 | **52.9%** |
| Statblock | 20 ÷ 41.4 | **48.3%** |
| Project | 20 ÷ 28.8 | 69.4% |

The ticket's 83% (20 ÷ 24) does not hold under any measured family.

## 4. Blast radius

- **Frozen captures that contain a name:** 146 of the 260 baseline lines, which is 73 capture ids × twin + realprint (`data/frozen-name-coverage.json`, ids listed there). They move **only** if the size change reaches print: Option C, or any edit to `:13636-13643` or `:6279`.
- **Screen-only options (A, B, D):**
  - 0 of 130 print-twin and 0 of 130 realprint name records differed from base (A checked on both, B and D on the twin). This is a computed-style probe via `addStyleTag`, not a byte run. The implementer must still run `check-freeze.sh`; the expected result is `freeze OK (260/260)`.
  - Every Steel dark/light capture with a head moves. Those captures are unfrozen.
- **Parity:** no movement. The `head` pair compares the `.sc-head` and `.dse-head` wrappers (both 16px), so the name is invisible to the gate.
- **Row-gap:** the plugin's is 1.92px (.12em) against the site's 2.4px. It is independent of the name size and unaffected.
- **Crest centering:** unaffected. The crest is em-sized on the head's 16px, not on the name. It stays centered (|Δ| ≤ 1.01px on statblock, 0 on feature). The card-head crest is 8.9px off-centre in base and under every option; that is pre-existing.
- **Right rail:** the right primary stays optically centered on the name (midY delta ≤ 0.01px under A, B and D), because `align-self: center` is on row 2. Proportions do change: under A the statblock name-to-role ratio is 41.4 : 18 = 2.3 against the site's 1.48.
- **Head height at 900 wide:**

  | Family | Base | A |
  |---|---|---|
  | Statblock | 74.7px | 90.3px |
  | Featureblock | 85.1px | 99.2px |
  | Nested | 43.1px | 48.2px |

- **Wraps:**
  - At full width under A: `chrome-hover-statblock` (stacked chrome, narrower) wraps the statblock name to 2 lines, and 2 more nested names wrap. B adds only the nested wraps.
  - Narrow: `statblock-sticky-narrow` "Human Bandit Chief" wraps to 5 lines today, 8 under A, 6 under B or D. These are mid-word breaks, the exact SC-284 symptom. `encounter-narrow` goes 4 → 5 lines and `montage-narrow` 3 → 4.
- **Crest/name ratio** (crest height ÷ name line box):

  | | Ability | Trait | Kit | Preview | Statblock / featureblock |
  |---|---|---|---|---|---|
  | Site | 2.04 | 2.42 | 1.53 | 2.34 | no crest |

  | Plugin | Ratio |
  |---|---|
  | Today | 2.36 |
  | A | ability 1.63, generic/nested 1.94, statblock 1.38 (the site's statblock head has no crest) |
  | B | 1.94 |
  | D | 2.18 |

## 5. Overlap with SC-284 (`sc284-cardhead-narrow`, 7 commits, read-only)

- SC-284 changes `styles-source.css` in two places. It adds `container-type` / `container-name` inside the base `.dse-head` block, inserted after `:13588`. It adds a new `@container dse-head (max-width: 480px)` block after `:13671`, before the powerRollPanel section.
- The name-size lines are `:13636-13643`, between those two hunks and about 45 lines from each. Only Option C touches them. **A, B and D add a new rule after `:7224`**, next to the existing Steel name typography, far from SC-284: no textual conflict.
- SC-284 also adds narrow shots `statblock-narrow` and `featureblock-narrow`, which are new capture ids. Their screen captures will move if SC-232 lands after SC-284. Their print twins contain names but stay unaffected under A, B or D.
- Semantics: SC-284 gives the name the full column below a 480px head width. A bigger name makes that fix more necessary; see the `statblock-sticky-narrow` wraps in §4. **Landing SC-284 first is recommended.**

## 6. Options

All values below are measured in the harness via injected CSS (`scripts/probe-{A,B,D}.css`, `data/plugin-names-opt{A,B,D}.json`, crops in `r1-survey/crops/`). The prefix `P` stands for `[data-dse-theme='steel']:not([data-dse-print="on"])`.

| Option | CSS | Plugin px: generic / ability / statblock / featureblock | % of site (computed px) | Crest/name | Freeze | Parity |
|---|---|---|---|---|---|---|
| **A: per family like the site (recommended)** | `P .dse-head__primary--left {font-size: calc(var(--dse-fs-heading) * 1.35); line-height: 1.04; letter-spacing: 0}`<br>`P[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-head__primary--left {… * 1.665; line-height: 1}`<br>`P .dse-sb > .dse-head > .dse-head__primary--left {… * 2.07; line-height: .95}`<br>`P .dse-fb > .dse-head > .dse-head__primary--left {… * 1.89; line-height: .98}` | 27 / 33.3 / 41.4 / 37.8 (line boxes 28.08 / 33.3 / 39.33 / 37.04) | 100 / 100 / 100 / 100 | 1.94 / 1.63 / 1.38 / – | 0 lines | 0 change |
| B: one shared size = the site's base rule | `P .dse-head__primary--left {font-size: calc(var(--dse-fs-heading) * 1.35); line-height: 1.04; letter-spacing: 0}` | 27 everywhere (28.08 box) | 100 / 81.1 / 65.2 / 71.4 | 1.94 | 0 lines | 0 change |
| C: change the token or the unscoped rule (**reject**) | `--dse-fs-heading: calc(1.6875em …)` at `:6279`, or edit `:13638` | 27 everywhere, plus 5 other token consumers scale by 1.35× | as B | 1.94 | ≥146 of 260 lines, a sanctioned rebaseline | 0 change |
| D: the ticket as written | `P .dse-head__primary--left {font-size: calc(var(--dse-fs-heading) * 1.2); line-height: 1.04}` | 24 everywhere (24.96 box) | 88.9 / 72.1 / 58.0 / 63.5 | 2.18 | 0 lines | 0 change |

Notes that apply to every option:
- **Font-size contract:** `calc(var(--dse-fs-heading) * k)` is on-scale under `test/unit/build/fontSizeContract.test.ts`, the same form as `:7724`. It keeps the Large-text knob and `--dse-text-scale` working.
- **Existing test:** `steelTypography.test.ts:501` looks up the weight-700 rule. A new size rule without `font-weight` does not disturb it.
- **Tracking:** `letter-spacing: 0` matches the site's `normal`. The 0.01em tracking at `:7210` remains in print.
- **Right rail:** the minis (`:7724`, `:7827`, `:7927`) read the token, not the name, so no option other than C moves them.

**Why A.**
- It is the only option that follows the project's own convention: computed-px parity, the same convention SC-235 is being asked under.
- It reproduces the site's deliberate per-family hierarchy (statblock > featureblock > ability > generic) instead of flattening it.
- The face difference makes raw-px parity read slightly *smaller* than the site, never larger.
- It moves no frozen bytes.

**Costs of A.**
- The statblock band gets about 15px taller.
- One stacked-chrome capture wraps the statblock name.
- Narrow heads depend on SC-284.
- It widens two proportion gaps it does not fix: statblock role mini 18 vs 28px, and crest 48×54 vs 60×68.

**Choose B instead** if Scott wants a smaller step with one rule and no per-family selectors. It fixes 100% of generic and nested names (the large majority of nodes: 198 nested + 17 card + 17 tracker heads in the sweep) and leaves the three band families at 65–81%.

**Follow-ups to file (owner):**
1. Per-family parity pairs for the name, so the gate can see it. For example `.sc-ability > .sc-head .sc-head__left-primary` ↔ `[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-head__primary--left`, plus `.sb__head …` and `.fb__head …` equivalents.
   - Caveat: a pair with no `owns` compares every rule, including ink (site `--sc-steel-lighter` vs plugin `--dse-heading`, not measured here) and letter-spacing (0.27px at 27px if the 0.01em survives, which exceeds the 0.25px tolerance).
2. Crest rem-literal port: 48×54.39 vs 60×68.
3. Eyebrow: 13.6 vs 18px.
4. Right-rail minis: statblock role 18 vs 28px.
5. The stale `.fb__feat-name` comment at `~7911`.

## Artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r1-survey/`:

- `scripts/`
  - `site-measure.cjs`: live site, 1440 or `W=900`
  - `plugin-measure.mjs`: harness, mirrors `shoot.mjs` `snap()`; `PROBE=`/`COMBOS=`/`ONLY=`/`OUT=`
  - `glyph-metrics.mjs`, `site-widths.mjs`, `dom-chain.mjs`, `crops.mjs`, `analyze.py`
  - `probe-{A,B,D}.css`
- `data/`
  - `site-names-{1440,900}.json`
  - `plugin-names-base.json` (390 capture/combos)
  - `plugin-names-opt{A,B,D}.json`, `plugin-names-optA-realprint.json`
  - `glyph-metrics.json`, `frozen-name-coverage.json`, `widths.txt`
- `crops/{feature,statblock,featureblock,kit}--{site,base,A,B,E}.png`: `E` is option D. Harness crops are 900-wide steel-dark; site crops are 1440 slate.

Worktree state: `git status --porcelain` was clean before and after in the superproject, `draw-steel-elements` and `v2`. `npm ci` populated the gitignored `node_modules`, and `harness:build` wrote the gitignored `visual-harness/dist`. No processes were left running.
