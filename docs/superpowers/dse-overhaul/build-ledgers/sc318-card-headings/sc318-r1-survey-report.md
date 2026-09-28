# SC-318 r1 — heading-scale survey (read + measure only)

## Executive summary

1. **Key finding: print already renders Obsidian's heading scale.** The SC-202 GROUP 1 block (`styles-source.css:17110-17147`) is scoped to `:not([data-dse-print="on"])`. Every frozen print capture (the twin and realprint, both of which have Obsidian's sheet on) therefore shows the host `--h*-size` scale. Measured: h3 21.088px/660, h6 16px/600, 40px margin-top after a `<p>`. Only the **screen** shows the UA scale (h3 18.72, h6 10.72).
2. **Recommendation: Option A.** Mint `--dse-fs-h1..h6` with Obsidian's own ratios (1.618/1.462/1.318/1.188/1.076/1em), line-heights, weights and margins, and apply them **screen-only**. Result: screen == print == the pre-SC-202 vault. It exactly undoes all three consequences Scott saw: h6 goes back to 16px, CHARACTERISTICS back to 21.09px, and the `###` top margin back to 40px.
3. **Blast radius for A, screen-only: 0 frozen lines.** All 43 frozen ids that carry a heading stay byte-identical, because the rule never reaches print. Screen movement is 32 capture ids × dark/light = 64 PNGs, plus the 2 gallery PNGs. If only markdown prose moves (plugin tags pinned), that drops to 5 ids = 10 PNGs + 2 gallery.
4. **If any option is made print-inclusive, the frozen radius is 43 ids × 2 = 86 of 260 freeze lines.** For A that should be byte-neutral, because it restates the values print already computes, but it has to be proven with a freeze run. For B or C, all 86 lines move and a sanction is required.
5. **Option B (site parity) is rejected on the measurements.** The site shows these bodies as page prose, not card bodies. It re-levels the headings (md-dse h6 becomes site h3/h4/h5), and sizes them h3 48 / h4 40 / h5 36 / h6 28px (Petrona) against a 16px body. Even the blockquote h6 (28px) outranks SC-232's generic card name (27px). Compact mode is no better: its h3 is 29.75px.
6. **Option C (compact card scale)** is the fallback if Scott wants no heading to outrank the card name: h1 1.25em (= `--dse-fs-heading`) down to h6 1em.
7. **Collisions: none.** No h* tag carries `.dse-head*` or `.dse-section__title` (checked against all 133 capture ids). `parity/selector-map.json` has no h* pair, so parity stays at 16 DECLARED with 0 overlap with SC-232/SC-235. One coordination point: `.dse-hero__name` (h2) shares the title-font list with `.dse-head__primary--left` (`:7541`), so SC-232 may want to own it.
8. **Shipped content that renders h* inside a plugin body covers h3–h6 only, never h1/h2.** Counts: rule (h3×2, h4×68, h5×83, h6×20), class (h3×14, h6×11), ancestry (h3×12), blockquote-h6 ability headers (complication 9, title 8, perk 5, treasure 3), perk h6×1, title h5×1, complication h5×1, and kit h5×21 (stripped in hybrid mode).

---

## Q1 — Current plugin state

### The SC-202 GROUP 1 block
`draw-steel-elements/styles-source.css` (worktree @ `5a20d5f`):
- Block header at `:16850`. The GROUP 1 comment is at `:17068-17091`, and the `fontSizeContract` note at `:17092-17109`.
- `:17110` `:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(h1, h2, h3, h4, h5, h6)` sets `color: inherit; font-style: normal; font-variant: normal; font-family: inherit; letter-spacing: normal; line-height: inherit; font-weight: bold`.
- The per-level rules are `:17119` h1 (2em / 0.67em), `:17124` h2 (1.5em / 0.83em), `:17129` h3 (1.17em / 1em), `:17134` h4 (1em / 1.33em), `:17139` h5 (0.83em / 1.67em) and `:17144` h6 (0.67em / 2.33em). The second value is margin-block-start/end in em of the heading's own size.
- **Theme scoping:** none. It applies to every theme; Steel is the only one since SC-144.
- **Screen vs print:** screen-only, because of the `:not([data-dse-print="on"])` compound on the root/modal. Under print (twin and realprint), Obsidian's own `h1..h6`/`.markdown-rendered h*` rules govern (measured below).
- **Specificity:** (0,2,0). The `:where()` adds nothing and the block sits late in the sheet, so it wins ties by source order. Classed plugin rules with a higher specificity win on the properties they declare, which is why margins hold. None of the three classed tags declares a font-size (see the per-tag table).

Other rules that touch headings:
- `:7523-7553` puts tracker `:is(h3,h4,h5,h6)` (initiative/encounter/negotiation/montage/project/party/counter) and `.dse-hero__name` in the Title font slot.
- `:10703-10714` adds a Steel emboss text-shadow.
- `:10715-10727` (Steel screen-only) adds `font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em` to the tracker h3–h6.
- `:1078-1087` sets `.dse-init__grouphead h4 { margin: 0 }`.
- `:12964`/`:12988` hold the initiative taken-state h4 colour.

### fontSizeContract / token mint
- `test/unit/build/fontSizeContract.test.ts`:
  - `isOnScale()` is at `:146-148`. It accepts `var(--dse-fs-*)` or `inherit`.
  - `ALLOWLIST` starts at `:181`.
  - `UA_RESTATEMENTS` is at `:255-262`, with six entries keyed `<selector> :: <value>` for h1..h6. Its docstring (`:226-254`) names the token remedy as the follow-up.
  - The guard tests at `:281-320` are the "two lists never overlap" and "UA_RESTATEMENTS has no DEAD entries" tests.
  - The counter at `:347` is `offScale.length === ALLOWLIST.length + UA_RESTATEMENTS.length`.
- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts:42-72` pins the shared-rule declarations (including `line-height: inherit`, `font-weight: bold`, `letter-spacing: normal`) and the six UA size/margin literals. This file also has to change.
- **What a mint of `--dse-fs-h1..h6` (+6 tokens) requires:**
  1. The `:root` base in `styles-source.css:6273-6300`, next to the nine roles.
  2. `src/framework/tokens.ts:127-138` `DSE_TOKEN_NAMES`, with the `test/dom/kit/tokens.test.ts:84` count going from 88 to 94. The "no stray --dse-* in :root" guard fails if this step is skipped.
  3. `test/dom/framework/token-coverage.test.ts`: `FS_TOKENS` (`:165-170`), `BASE_MAP` (`:302-316`), `STEEL_INVARIANT.size` at `:343` (20→26) and `PRINT_INVARIANT.size` at `:362` (34→40).
  4. `test/dom/framework/theme-steel.test.ts:88-90` list, plus the `:269` count (20→26).
  5. **Workspace** `docs/superpowers/dse-overhaul/D3-token-map.md` gets +6 rows (the fs rows are `:682-693`). This lives in the worktree superproject, which is a different repo, so `just wt-finish` has to push both.
  6. `.repo-docs/font-sizes.md`: the roles table (`:23-24`) and the "UA literals" note (`:106-119`).
  7. `UA_RESTATEMENTS` is emptied. Its dead-entry test goes red otherwise.
- **Side finding (LOW, doc drift):** D3-token-map.md `:689` gives `--dse-fs-control` as `calc(1em * …)`, but the CSS (`:6293`) and `BASE_MAP` (`:312`) say `0.85em`. The coverage test checks names only, so nothing catches it.

### Existing `--dse-fs-*` tokens (`styles-source.css:6273-6300`)

| token | value | at 16px |
|---|---|---|
| `--dse-fs-small/large/control-scale` | 1 | knobs |
| `--dse-fs-heading` | `calc(1.25em * large-scale)` | 20 |
| `--dse-fs-subheading` | `calc(1.15em * large-scale)` | 18.4 |
| `--dse-fs-numeral` | `calc(1.75em * large-scale)` | 28 |
| `--dse-fs-body` | `1em` | 16 |
| `--dse-fs-control` | `calc(0.85em * control-scale)` | 13.6 |
| `--dse-fs-secondary` / `label` / `caption` / `micro` | `0.9` / `0.85` / `0.8` / `0.7em × small-scale` | 14.4 / 13.6 / 12.8 / 11.2 |

**Scaling:** every value is in em, so it follows the host note size (Obsidian's `--font-text-size` slider, default 16px).
- The element root multiplies by `--dse-text-scale` (`:7699` `[data-dse-element]:not([data-dse-print="on"]) { font-size: calc(1em * var(--dse-text-scale)) }`).
- SC-230 modals scale `.dse-modal__body/__footer` (`:7714`) and `.dse-modal__title-text` (`:7732`). Nested roots reset to `--dse-fs-body` (`:7749`).
- Headings are em-based today (UA ratios), so they already scale with all of these.
- Obsidian's own heading **margins** are `rem` (`--p-spacing: 1rem`, `--heading-spacing: 2.5rem`), so they do not follow the text-size slider. Any token restatement should use em of the body instead.
- No DSE modal renders an h* today (`r1-survey/probe-modal.log`: 0 headings outside `#mount` in all 6 interaction shots).

### The 8 real `h*` tags (call sites re-grepped; the r4 §6 line numbers have drifted)
Harness, default size, `steel-dark` with the sheet on, from `r1-survey/survey-bykind.txt`:

| tag | site | own fs / lh / margin today | computed fs / lh / w / mt / mb (dark) | print twin (= Obsidian) |
|---|---|---|---|---|
| h2 `.dse-hero__name` | `hero/view.ts:182` | none / none / `margin:0` (`:5880`); Steel 700, uppercase, 0.01em (`:10477`) | 24 / 36 / 700 / 0 / 0 | 23.392 / 28.07 / 680 |
| h3 `.dse-enc__roster-heading` | `encounter/view.ts:220` | none / none / `0 0 .25em` (`:3548`) | 18.72 / 28.08 / 700 / 0 / 4.68 | 21.088 / 27.41 / 660 |
| h3 `.dse-hero__region-title` | `hero/view.ts:786` | none / none / `0 0 .5em` (`:5950`); Steel neg-margin strip + `.45em` pad (`:10530`) | 18.72 / 28.08 / 700 / −16 / 11.23 | 21.088 / 27.41 / 660 |
| h3 `.dse-skills__group-title` | `skills/view.ts:206` | **`--dse-fs-subheading`** (`:3409`), `mt 0, mb .5em` (`:3418`) | not in any capture (only-show-selected mode) | — |
| h3 bare "Heroes" | `initiative/view.ts:227` | none | 18.72 / 28.08 / 700 / 18.72 / 18.72, uppercase | 21.088 / 27.41 / 660 / 16 / 16 |
| h3 bare "Enemy groups" | `initiative/view.ts:250` | none | same as "Heroes" | same |
| h4 bare group name | `initiative/view.ts:1350` | margin 0 (`:1078-1087`) | 16 / 24 / 700 / 0 / 0, uppercase | 19.008 / 26.61 / 640 |
| h4 `.dse-mt__guide-title` | `montage/GuideView.ts:134` | **`--dse-fs-label`**, small-caps, lowercase, .1em, 700 (`:4797`); `0 0 .15em` (`:4117`) | 13.6 / 20.4 / 700 / 0 / 2.04 | 19.008 / 26.61 / 640 (print loses the pin: the rule is screen-scoped) |

Line-height today is inherited: 1.5 in tracker/hero (24/16) and **1.7 in card bodies** (27.2/16). That is why a prose h3 gets a 31.8px line box.

---

## Q2 — Where headings actually render

**Shipped content** (data-unified md-dse bodies; frontmatter and ``` fences excluded; `r1-survey/md-headings-count.txt`). Two element groups render this markdown: the display family (ancestry, career, class, complication, condition, culture, kit, perk, title, treasure) and the generic card (rule). They render the whole body into `.dse-card__body` (`displayFamily.ts:183`).

| type | headings in body |
|---|---|
| rule (45 files) | h3×2, h4×68, h5×83, h6×20 |
| class (11) | h3×14 ("Basics"), h6×11 ("… Advancement Table") |
| ancestry (12) | h3×12 ("On …") |
| perk (6) | h6×1 ("Familiar Statblock"), blockquote-h6×5 (ability headers) |
| complication (10) | blockquote-h6×9, h5×1 |
| title (9) | blockquote-h6×8, h5×1 |
| treasure (3) | blockquote-h6×3 |
| kit (21) | h5×21 "Equipment" (stripped by `stripKitBodySections`, `layouts.ts:203`, in hybrid mode) |

No shipped plugin body uses h1 or h2. Chapter, monster, movement, religion, skill and project bodies also contain headings, but the plugin doesn't render them as card bodies: monsters and projects are structured elements, and the others have no display element.

**Harness captures with any h1–h6.** 44 of the 133 capture ids have one (`r1-survey/survey-compact.txt`); the parents are `.dse-card__body` for markdown. Visible counts are given as dark / print / realprint.
- **(a) Screen-only:** `montage-sheet-log` (fullPage; the guide h4s are hidden in dark), plus the 2 gallery PNGs. The gallery has h3 ×4, h6 ×2, h4 ×1, the hero h2/h3 ×8, the roster h3, and 32 bare h2s. Those 32 are harness gallery labels outside `[data-dse-element]`, so the rule never reaches them.
- **(b) FROZEN: 43 ids = 86 of the 260 freeze lines.** Every one has at least one heading visible in print, including the collapsed variants, because print expands them:
  - `ancestry`: h3 "On Humans" (markdown).
  - `class`: h3 "Basics" and h6 "Tactician Advancement Table" (markdown).
  - `perk`, `perk-narrow`: h6 "Familiar Statblock" (markdown).
  - `perk-links`: h2 "Envoy's Charge" (synthetic markdown).
  - `encounter`, `encounter-narrow`, `encounter-collapsed`, `chrome-collapsed-rollout`: h3 roster heading.
  - `hero`, `hero-narrow`, `hero-sparse`, `hero-collapsed`, `chrome-hover-hero`, `chrome-placement-trio`, `chrome-collapsed-trio`: h2 hero name + 7 × h3 region title.
  - 19 initiative ids: bare h3 "Heroes"/"Enemy groups" + bare h4 group name(s). The ids are `initiative`, `-captain-bonus`, `-cell-selected`, `-controls`, `-controls-narrow`, `-fight`, `-fight-500`, `-fight-narrow`, `-log-open`, `-mark-seal`, `-narrow`, `-no-images`, `-no-images-narrow`, `-portraits-off`, `-roster`, `-roster-500`, `-roster-narrow`, `-squads`, `-squads-500`.
  - 9 montage ids with h4 guide titles (visible 3 in print, 0 in dark except `montage-guide-open`): `montage`, `-done`, `-failed`, `-guide-open`, `-mid`, `-narrow`, `-old-shape`, `-strip-pinned`.
- Only 5 of those ids carry **markdown** headings: `ancestry`, `class`, `perk`, `perk-narrow`, `perk-links`. That is 10 freeze lines if only the prose scale went print-inclusive.
- Coverage gaps: no fixture renders a rule body with h4/h5, a blockquote-h6 ability header (complication/title/treasure), or `.dse-skills__group-title`.

---

## Q3 — Reference scales, measured (default settings, 16px body)

Sources and harness conditions:
- **Obsidian:** pinned 1.13.7 `visual-harness/dist/obsidian-app.css` and the installed 1.14.2 asar (`r1-survey/obsidian-installed-app.css`). The heading tokens are identical in both. The **measured** row is the harness print twin, which runs with Obsidian's sheet active.
- **Plugin (UA):** harness `steel-dark` with the sheet on, h1..h6 injected after a `<p>` in the perk `.dse-card__body` (`r1-survey/probe-synthetic.json`). The sheet-off numbers are identical.
- **Site:** live `steelcompendium.io/v2/Browse/…`, 1280px, default mode and Compact mode (`r1-survey/site-summary.txt`).
- **Glyph heights:** canvas `measureText` at 1000px, scaled. Cap-height ratios: Source Serif 4 0.672, Petrona 0.657, Cinzel 0.704, Berlingske Slab 0.704.

| level | Obsidian default (1.13.7 = 1.14.2) fs / lh / w / margin / ls | plugin today, screen (UA) fs / lh / w / mt=mb / cap | plugin print twin (measured = Obsidian) fs / lh / w / mt / mb / cap | site default (page prose) fs / lh / w / mt / mb / face / cap | site Compact fs / cap |
|---|---|---|---|---|---|
| h1 | 1.618em / 1.2 / 700 / 1rem (2.5rem after block) / −0.015em | 32 / 54.4 / 700 / 21.44 / cap 21.5 | 25.89 / 31.07 / 700 / 40 / 16 / 17.4 | 72 / 93.6 / 900 / 0 / 0 / Cinzel upper / 50.7 | 51 / 35.9 |
| h2 | 1.462em / 1.2 / 680 / same / −0.011em | 24 / 40.8 / 700 / 19.92 / 16.1 | 23.39 / 28.07 / 680 / 40 / 16 / 15.7 | 43.2 / 60.5 / 900 / 64.8 / 27.6 / Cinzel upper / 30.4 | 34 / 23.9 |
| h3 | 1.318em / 1.3 / 660 / same / −0.008em | 18.72 / 31.82 / 700 / 18.72 / 12.6 | 21.09 / 27.41 / 660 / 40 / 16 / 14.2 | 48 / 72 / 700 / 57.6 / 38.4 / Petrona / 31.5 | 29.75 / 19.6 |
| h4 | 1.188em / 1.4 / 640 / same / −0.005em | 16 / 27.2 / 700 / 21.28 / 10.75 | 19.01 / 26.61 / 640 / 40 / 16 / 12.8 | 40 / 68 / 700 / 40 / 40 / Petrona / 26.3 | 25.5 / 16.8 |
| h5 | 1.076em / 1.5 / 620 / same / −0.002em | 13.28 / 22.58 / 700 / 22.18 / 8.9 | 17.22 / 25.82 / 620 / 40 / 16 / 11.6 | 36 / 61.2 / 400 / 45 / 45 / Petrona / 23.7 | 21.25 / 14.0 |
| h6 | 1em / 1.5 / 600 / same / 0 | **10.72** / 18.22 / 700 / 24.98 / **7.2** | 16 / 24 / 600 / 40 / 16 / 10.75 | 28 / 47.6 / 700 / 0 / 35 (in blockquote) / Petrona / 18.4 | 18.7 / 12.3 |
| body | `--font-text-size` 16px, lh 1.5 | 16 / 27.2 (card body) / cap 10.75 | 16 / 24 | 16 / 27.2 / Berlingske Slab / cap 11.26 | 17 / 12.0 |

Notes:
- **Obsidian weights.** `:root` declares the h*-weight tokens twice (600-flat, then 700/680/660/640/620/600). The second declaration wins, as the measured 660 on h3 confirms.
- **Obsidian margins.** The bare `h1..h6 { margin-block: var(--p-spacing) }` gives 16px. `.markdown-rendered :is(p,pre,table,ul,ol) + :is(h1..h6) { margin-top: var(--heading-spacing) }` makes it 40px after a block. That adjacency rule is why ancestry's h3 gets mt 40 while class's h3 "Basics" (first child) gets 16.
- **Site.** Headings are page-level:
  - Faces: h1/h2 are Cinzel 900 uppercase, h3–h6 are Petrona (DESIGN.md:41-42). No small caps on any heading level (`font-variant-caps: normal`), so the SC-235 small-caps caveat doesn't apply. Faces differ (Petrona/Cinzel vs Source Serif 4), so the cap heights above are the fair comparison.
  - Levels: the site **re-levels** md-dse headings, as the Browse md shows. Familiar's h6 becomes a site h3 (48px), ancestry's h3 "On Humans" a site h2 (43.2px), the tactician h6 table caption a site h5 (36px), and malice's h6 a site h4 (40px).
  - Cards: the only card-like body with a heading on the site is the blockquote ability header, h6 28px Petrona 700 (title/arena-fighter, treasure/scorpion-tails). The site's card NAMES (`.sc-head` h2/h3) measure 27px and 33.3px, which matches SC-232's numbers.
- **Plugin UA.** h1/h2 outrank the 20px card name, and h5/h6 undercut body. The h6 cap height is 7.2px against a 10.75px body cap.

---

## Q4 — Hierarchy constraints (fs px at 16px body)

Neighbours:
- Card name `.dse-head__primary--left`: 20px today (measured 20/23, all 76 captures). SC-232 proposes 27 / 33.3 / 41.4 / 37.8 / 28.8, with a 20px narrow fallback.
- Section title `.dse-section__title`: 16px today (measured 16/27.2). SC-235 proposes A = 18 or B = 15.
- Body: 16px.

| scale | h1 | h2 | h3 | h4 | h5 | h6 | outranks card name 20 (today/narrow)? | outranks SC-232 generic 27? | undercuts body 16? | vs section title 16 / A18 / B15 |
|---|---|---|---|---|---|---|---|---|---|---|
| UA (today, screen) | 32 | 24 | 18.72 | 16 | 13.28 | 10.72 | h1, h2 | h1 (32) | **h5, h6** | h3 > all; h5/h6 below all |
| Obsidian (print today, Option A) | 25.89 | 23.39 | 21.09 | 19.01 | 17.22 | 16 | h1, h2, h3 (h3 by 1.09px) | none | none | h4/h5 > 16 and > B; h6 = 16, < A |
| Site default (Option B) | 72 | 43.2 | 48 | 40 | 36 | 28 | all | **all** (h6 28 > 27) | none | all ≫ |
| Site Compact ratios on a 16px body (3/2/1.75/1.5/1.25/1.1em) | 48 | 32 | 28 | 24 | 20 | 17.6 | h1–h4 (h5 ties) | h1–h3 | none | all > |
| Option C (compact card) | 20 | 19.2 | 18.4 | 17.6 | 16.8 | 16 | none (h1 ties 20) | none | none | h3 ≈ A; h6 = 16 |

Shipped bodies use h3–h6 only, so the live question under A is h3 (21.09) against the 20px name, today and at SC-232's narrow fallback. The measured print shows today at a 1.09px difference. The plugin's own tags need no heading-level rule of this kind: hero name 24 and region/roster titles 18.72 sit next to their own element chrome, not next to a card name.

---

## Q5 — Options

All ratios below are multiples of `--dse-fs-body` (1em at the element). Tokens would be `--dse-fs-h1..h6`. Whether they also multiply by `--dse-fs-large-scale` is an owner choice. Doing so makes them consistent with `--dse-fs-heading/subheading`; Obsidian itself has no such knob.

### Option A — Obsidian's own scale as tokens (restores the pre-SC-202 look)
- **fs:** 1.618 / 1.462 / 1.318 / 1.188 / 1.076 / 1em.
- **lh:** 1.2 / 1.2 / 1.3 / 1.4 / 1.5 / 1.5 (unitless).
- **weight:** 700 / 680 / 660 / 640 / 620 / 600.
- **letter-spacing:** −0.015 / −0.011 / −0.008 / −0.005 / −0.002 / 0em.
- **margin-block:** 1 body-em top and bottom, written per level as `calc(1em / <ratio>)` so it scales with the note (Obsidian uses a fixed 1rem). margin-top becomes 2.5 body-em when the heading follows `p, pre, table, ul, ol`.
- **Plugin tags:** share the scale. Roster, region title and initiative h3 go to 21.09, initiative h4 to 19.01, hero name to 23.39. These are exactly the pre-SC-202 vault values in r4 §5b, and the print values today. Keep the two existing pins: `.dse-skills__group-title` (subheading) and `.dse-mt__guide-title` (label).
- **Frozen movement if screen-only:** 0 lines. Screen movement is 32 ids × 2 + 2 gallery = 66 PNGs.
- **If also pinned into print:** it should be byte-neutral, but that is unproven. The 43 ids / 86 lines are at risk, so freeze-verify before claiming 0. The adjacency margin rule has to be restated too.
- **Collisions:** none with `.dse-head*`, `.dse-section__title` or parity.
- **Side benefit:** screen == print == vault-note headings outside the card.

### Option B — site parity
- **Default mode:** 4.5 / 2.7 / 3 / 2.5 / 2.25 / 1.75em. lh 1.3 / 1.4 / 1.5 / 1.7 / 1.7 / 1.7; weights 900 / 900 / 700 / 700 / 400 / 700; Cinzel uppercase for h1–h2, Petrona for h3–h6.
- **Compact mode:** 3 / 2 / 1.75 / 1.5 / 1.25 / 1.1em.
- **Rejected.** These are page-heading sizes for a page that IS the entity. The site re-levels headings, so level-for-level parity has no meaning. Every level outranks SC-232's card name, and the plugin has no Petrona or Cinzel for headings.
- **Frozen movement:** 0 if screen-only, 86 lines if print-inclusive. Parity would need a new site/plugin pair, and the site has no card-body heading node to pair with except the blockquote h6.

### Option C — compact card scale (h6 ≥ body, nothing above the card name)
- **fs:** h1 1.25em (= `--dse-fs-heading`, 20), h2 1.2em (19.2), h3 1.15em (= `--dse-fs-subheading`, 18.4), h4 1.1em (17.6), h5 1.05em (16.8), h6 1em (16).
- **lh / weight:** 1.3 on every level, weight 700.
- **margin-block:** start `calc(1.25em / ratio)`, end `calc(0.5em / ratio)`.
- **Plugin tags:** either pin to roles (region, roster and initiative h3 → subheading 18.4; initiative h4 → body 16; hero name → SC-232) or share the scale.
- **Frozen movement:** 0 if screen-only. Print-inclusive moves all 86 lines, because print currently shows Obsidian's scale.
- **Trade-off:** screen ≠ print unless print is also pinned and rebaselined, and it does not restore the vault look Scott listed.

### Recommendation
**Option A, screen-only, with the plugin's tags sharing the tokens.** Print already shows Obsidian's scale in every frozen capture and in a real vault (the SC-202 block is print-excluded), so A is the only option that brings screen, print and the surrounding vault note onto one heading scale while moving 0 frozen bytes. It also reverses all three regressions Scott called out:
- h6 10.72 → 16px.
- CHARACTERISTICS 18.72 → 21.09px.
- `###` after a paragraph gets its 40px top margin back.

h6 = body and h4/h5 sit just above it, so the shipped rule/class content keeps a readable ladder. The one hierarchy cost is shipped h3 (21.09) outranking today's 20px card name by 1.09px. That goes away under SC-232's 27px, but not at SC-232's 20px narrow fallback. If Scott rejects that, C is the no-outrank fallback.

**On the plugin's 8 tags:** share the markdown scale through the tokens, with explicit `font-size: var(--dse-fs-hN)` declarations on the three classed tags that have no size today (hero name, region title, roster heading). That way the value is plugin-owned rather than an accident of the `:where` cascade. Keep the bespoke skills (subheading) and montage (label) pins. Coordinate `.dse-hero__name` with SC-232, since it is the hero card's name and shares its font list at `:7541`.

## Side findings (for the owner to file)
- **LOW:** `D3-token-map.md:689` records `--dse-fs-control` as `calc(1em …)`, while the CSS and BASE_MAP use `0.85em`. The map drifted and no test catches it.
- **LOW:** no harness fixture covers a rule body with h4/h5, a blockquote-h6 ability header (complication/title/treasure: 20 shipped files), or `.dse-skills__group-title`. After an SC-318 change these paths stay unphotographed.
- **INFO:** the SC-202 r4 §6 call-site lines have drifted: initiative `:226/:249/:1247` → `:227/:250/:1350`, skills `:220` → `:206`.

## Gates
Read-only round, so no gate was required, and `npm run shots`, freeze and parity were not run. The worktree `draw-steel-elements` is still at `5a20d5f` with a clean `git status` (`npm ci` output and `visual-harness/dist/` are gitignored). The superproject worktree is clean. The main checkout shows only the pre-existing ` M draw-steel-elements`. `freeze-baseline.sha256` is untouched (sha256 `559a2887…`).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r1-survey/`)
- **Harness sweep:** `survey-headings.mjs` → `survey-headings.json` (133 ids × dark/print/realprint), summarized in `survey-summary.txt`, `survey-compact.txt` and `survey-bykind.txt`.
- **Synthetic h1..h6 in a card body:** `probe-synthetic.mjs` → `probe-synthetic.json` / `.log`.
- **Modal and gallery probes:** `probe-modal.mjs` / `.log` and `probe-gallery.mjs` / `.log`.
- **Live site:** `site-headings.mjs` → `site-headings.json` and `site-headings-compact.json`, summarized by `site-summarize.py` → `site-summary.txt`.
- **Shipped content:** `count-md-headings.py` → `md-headings-count.txt`.
- **Installed Obsidian sheet:** `extract-installed-appcss.mjs` → `obsidian-installed-app.css` (1.14.2).
- **Logs:** `npm-ci.log`, `build.log`, `survey.log`, `site.log`, `extract.log`.
