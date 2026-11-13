# SC-563 r1 survey: crest icon outline vs filled, and the trait eyebrow tint (dse `6270e84a`)

## Executive summary

1. **The crest icon (Q1).** The site draws a DrawSteelGlyphs **font glyph**: solid, 25px in a 60x68 crest, tinted with the action colour. The plugin draws an Obsidian **Lucide outline SVG**: 24px in a 48x54 crest, no fill, stroke 2 in the harness and 1.75 in real Obsidian, same action colours. The ticket is only half right. "Smaller" is entirely the crest: glyph-to-crest ratio is 0.42 on both sides, which is SC-367's job. And for **4 of 6 kinds the site uses a different picture**, not a filled version: Triggered is a boxed "!" where we draw a lightning bolt; Move is a set-square where we draw footprints; No action is a star where we draw a dashed ring; Main action is crossed swords where we draw one sword. The site's own source calls those codepoints placeholders, and MCDM's glyph chart names them "Self", "Versatile", "Area of Effect" and "Trait".
2. **Q1 options:** I1 bundle the site's font; **I2 fill our own outlines** (`fill: currentColor`, action crests only, villain skull left as an outline); I3 heavier stroke; I4 keep. **Recommendation: I2.** It is one CSS rule. 5 of the 7 icons go solid, and every kind keeps its own distinct shape. I1 turns No action and Trait into the **same star**, told apart only by pale grey vs purple, which Scott may not see. It also means shipping a CC BY-SA 4.0 font inside the MIT plugin. The fill **must** be scoped: applied to every crest, it ruins 12 of the 24 other crest icons, and the stamina crest's "winded" becomes identical to "healthy".
3. **The eyebrow (Q2).** The site tints the eyebrow on `.sc-trait` heads only (trait and class-feature cards, `steel-traits.css:117-118`). Word and ◆ are always the trait colour: light purple `#bb8fce` (L 0.71) in dark, dark purple `#7d3c98` (L 0.48) in light. Ability and kit-signature eyebrows stay neutral grey: `#959b9f` (L 0.69) in dark, `#555960` (L 0.46) in light. The plugin is neutral everywhere. It already has the identical `--dse-act-trait` token on every feature root.
4. **Q2 options:** E-A copy the site; E-B keep neutral; E-C tint the ◆ only. The tint moves lightness by only +0.03 (dark) or +0.02 (light), so it is close to invisible as a lightness change. It is never the only signal: the word "Trait"/"Feature" and the star crest stay. Under SC-368 **D** the name stays the most prominent text in both schemes. Under SC-368 **A** in light, the eyebrow is darker than the name (eyebrow 0.46 grey or 0.48 purple, name 0.51). Option A causes that inversion, not the tint. **Recommendation: E-B** (pairs with SC-368 D); E-A if Scott wants exact site parity.
5. **Frozen print lines: 0 of 280 for every option.** The crest, the featureblock icon and every feature-head eyebrow are `display:none` in print and realprint. A full `shoot.mjs` run with all options injected at once passed freeze 280/280. The unscoped control moves 46 print captures. **Parity:** no pair maps the crest glyph or the left eyebrow, so the DECLARED count stays 24 under every option. **Screen captures moved:** I1/I2 move 18 element×fixture combos, I3 moves 19, E-A/E-C move 4 (×2 schemes each). The union shots run moved 78 steel-dark/light PNGs (39 ids) and nothing else.

Evidence: `r1-survey/crops/` has `sc563-r1-q1-crest-icon.png`, `sc563-r1-q2-trait-eyebrow.png` and `sc563-r1-q1-fill-spill.png`. Data is in `r1-survey/data/`, probes in `r1-survey/probes/`, scripts in `r1-survey/scripts/`.

---

## 0. Method

- **Plugin.** The harness was built in this worktree at dse `6270e84a`. `origin/develop` was re-fetched and is still `6270e84a`. I made a private copy of `index.html`, `vars.css` and `dist/{harness.js,harness.css,obsidian-app.css}` under scratch, and measured on that copy. Viewport 900x1200, `theme=steel`, `sheet=1` on screen and on the print twin. Realprint uses `emulateMedia print` with no sheet, which is `snap()`'s query shape (`shoot.mjs:624-643`).
- **Site.** Live `steelcompendium.io/v2` at 1440x900. The scheme is forced through both the context `colorScheme` and `body[data-md-color-scheme]`, and read back per page (`slate` / `default`).
- **Tiles.** Element screenshots at **deviceScaleFactor 2 on both sides** (2 image px per CSS px). The composites paste them 1:1 and never resize them.
- **Glyph ink.** Each crest is shot twice, once normally and once with only the glyph hidden. The pixel difference gives the ink box (W x H, CSS px) and the ink area (CSS px²).
- **Colour.** Painted hex: a translucent ink is composited over the median background, measured from a second shot with all text made transparent. Lightness is OKLCH L (0–1). Contrast is WCAG 2.x against that median.
- **Probes** are injected with `addStyleTag` only (`r1-survey/probes/*.css`). Every rule carries `[data-dse-theme='steel']:not([data-dse-print="on"])`.
- **Per-kind glyph row.** Mark's real crest is re-iconed for each action kind: the Lucide node is inserted exactly as the harness shim's `setIcon` builds it, and `data-dse-act` / `--dse-act` are set as `renderFeature.ts:592-593` does. The real-fixture tiles (Mark, Determination, Devastating Rush, Coverage Strike, Rally the Line) match the per-kind row (`data/sc563-r1-plugin.json`).
- **Sweep.** All 83 element×fixture combos, in dark, light, print and realprint. Each combo is run today, under every option, under the union of all options, and (print modes only) under an unscoped control. For each run I inventory every crest, icon and left eyebrow. Print modes also get a full-page screenshot hash (`data/sc563-r1-sweep-*.json`).
- **Freeze proof.** Run 1 was a base `node visual-harness/shoot.mjs`: 592 shots, freeze 280/280. Run 2 was the same command with `probe-UNION-all-options.css` appended to the built `dist/harness.css` (a gitignored build artefact, restored afterwards); results in §3.

## 1. Q1 — the crest icon

### 1a. Site (live, dark; light identical in shape)

| Kind (page) | Glyph source | Codepoint → MCDM chart name | Glyph box / ink | Colour (dark / light) |
|---|---|---|---|---|
| Maneuver (Mark) | DrawSteelGlyphs, `font-size:1.25rem` = 25px (`steel-ability-cards.css:86-87`) | `f` → **"Self"** | crest 60x68; ink 21x25, area 354 | blue `#5dade2` L 0.72 / `#2874a6` L 0.54 |
| Main (Concussive Strike; kit sig Devastating Rush) | same | `l` → **"Versatile"** (crossed sword + arrow) | ink 25x25, area 265 | red `#e74c3c` L 0.63 / `#c0392b` L 0.54 |
| Triggered (Parry) | same | `)` → "Triggered Action" (boxed "!") | ink 25x25, area 565 | green `#4caf6a` L 0.68 / `#1e8449` L 0.54 |
| Move (Phase Leap) | same | `o` → **"Area of Effect"** (set-square) | ink 24x23, area 312 | orange `#e8a13a` L 0.76 / `#b9770e` L 0.62 |
| No action (Revitalizing Limerick) | same | `*` → **"Trait"** (star) | ink 25x24, area 306 | pale grey `#cdd1d4` L 0.86 / `#5a6368` L 0.49 |
| Trait (Determination; class feature Nature Watch) | `steel-traits.css:90-91`, `trait_cards.go:76` | `*` → "Trait" (star) | ink 25x24, area 305 | light purple `#bb8fce` L 0.71 / dark purple `#7d3c98` L 0.48 |
| Villain | **no site crest** (statblock villain actions use a bare `.sb__feat-glyph`, `steel-statblock.css:294-296`, codepoint `*`, `statblock_card.go:39`) | — | — | — |
| Kit head (Panther) | Material SVG with `fill: currentColor` (`steel-redesign.css:56`) | backpack | crest 38x43, ink 13x16.5 | metal `#d9dee1` |

- Codepoints are emitted by `steel-etl/internal/site/ability_cards.go:88-110`. The comment at `:83-85` says they are "PLACEHOLDERS until the official action glyphs land".
- The chart names come from `reference/DrawSteelGlyphs/Draw Steel Glyphs Chart.pdf`. The font also has `d` ("Villain Action / Malice", a skull), which the site does not use on crests.
- Font: `v2/docs/fonts/DrawSteelGlyphs-Regular.otf` (21,636 B), loaded at `tables.css:5-9`. Licence: "© 2025 MCDM Productions, CC BY-SA 4.0" (`reference/DrawSteelGlyphs/FontLicense.txt`).
- The site's crest convention is **solid everywhere**: even its Material SVG crests are filled (`steel-redesign.css:56`).

### 1b. Plugin (Steel, screen)

- **Mount.** `src/framework/kit/crest.ts:31-41` calls `setIcon(glyphEl, icon)` at `:39`, which inserts an Obsidian Lucide SVG. Real Obsidian adds `class="svg-icon"` (verified in the 1.13.7 asar), so app.css `svg.svg-icon { stroke-width: var(--icon-stroke) }` gives **1.75px**. The harness shim (`visual-harness/shim/obsidian.ts:20-30`, lucide 1.24) leaves the attribute `stroke-width="2"`. Both are `fill="none"`.
- **Box.**
  - `.dse-crest--lg` is 3em x 3.4em = 48x54.39 (`styles-source.css:15437-15460`).
  - The svg is 1.5em = 24px (`:8772-8775`).
  - The glyph colour is `var(--dse-act, var(--dse-metal-bright))` (`:8797-8799`).
  - The nudge is `translateY(-0.325em)` (`:15459`, `:15500-15505`).
  - Shown only by `:8766-8768`, which is screen-scoped; the base rule `:15425-15436` is `display:none`.
- **Icon per action kind** (`src/elements/feature/renderFeature.ts:303-327`, mounted at `:687`):

  | Kind | Icon | Ink box | Ink area |
  |---|---|---|---|
  | Main | sword | 20x20 | 118 |
  | Maneuver | user | 16x20 | 118 |
  | Triggered | zap | 20x22 | 153 |
  | Move | footprints | 20x22 | 190 |
  | None | circle-dashed | 22x22 | 113 |
  | Trait | star | 22x22 | 162 |
  | Villain | skull | 18x22 | 176 |

- **Size vs the site.** Plugin ink is 16–22px in a 48px crest; site ink is 21–25px in a 60px crest. **The ratio is the same, about 0.42.** The "it is smaller" in the ticket is the crest alone (80%), which is SC-367.
- **Other crests that share `.dse-crest` / `.dse-crest__glyph`** (sweep, dark, today). None of these carries `data-dse-act` on the head's parent, so every option below leaves them alone:
  - statblock role crests: `crestIconForRole`, `statblock/view.ts:93-116` — crown, eye-off, wind, target, hammer, brain, sparkles, footprints, heart-pulse, shield, skull, users
  - display-family crests: `display/layouts.ts:269-1330` — users, briefcase, shield, octagon-alert, zap, map, crown, package, gem, book-open
  - kit head: backpack
  - montage: hourglass / trophy, `montage/HeadView.ts:44,56`
  - negotiation: handshake, `negotiation/view.ts:120`
  - stamina crest: shield / shield-alert / skull, `kit/StaminaBarPanel.ts:281-301` (its svg is sized at `styles-source.css:12002-12013`)
- **Not `.dse-crest` at all:**
  - the villain-band skull `.dse-sb__band-crest` (`statblock/view.ts:516-517`). It **does print**: `display:flex` in print and realprint.
  - the featureblock option emoji `.dse-fb__feat-icon` (⭐️ ❇️ 🌀).
- **Hero sheet.** No hero fixture renders an action crest; hero ability lists go through `renderFeature`, so they would follow the same rules.
- **Action crests in the harness** (sweep): 75 nodes per scheme.
  - Standalone feature cards: 10 (sword 4, star 4, skull 1, user 1).
  - Kit signature: 2 (sword).
  - Statblock sub-features: 63 (sword 9, user 8, zap 7, star 16, skull 23 — all nested in `.dse-sb`).
  - I1/I2 change the 51 non-villain nodes; I3 changes all 75.
- **Non-hue channel today.** Seven distinct outline shapes, one per kind.

### 1c. Options

| | What | Recognisable at the crest's size? | Screen moves | Frozen | Parity |
|---|---|---|---|---|---|
| **I1** site glyph font | Hide the svg; `::before` draws the site codepoint at 1.25em (glyph/crest 0.4167 = site). Villain keeps the Lucide skull. | Yes, all are solid. **But No action and Trait become the same star** (dark: pale grey L 0.86 vs light purple L 0.71; **light: slate grey `#5a6368` L 0.49 vs dark purple `#7d3c98` L 0.48, i.e. hue only**), and Maneuver/Main/Move show glyphs MCDM names Self/Versatile/Area of Effect. | 18 combos x 2 schemes, 51 nodes each | **0** | 0 rows |
| **I2** fill outline (rec) | `fill: currentColor` on the action-crest svg; villain excluded | Yes, verified per kind (composite 1):<ul><li>user: solid head and torso, matching the site's person</li><li>star: solid, matching the site</li><li>zap: solid bolt</li><li>footprints: solid soles</li><li>sword: blade fills, hilt stays a line</li><li>circle-dashed: arcs don't close, so it stays a dashed ring</li><li>skull: excluded — filled, its eyes and nose vanish into a blob</li></ul>Ink area rises to 150–270 against the site's 170–362 (site rescaled x0.64). | 18 x 2 | **0** | 0 |
| **I3** heavier stroke | `stroke-width: 3px` (from 2 harness / 1.75 Obsidian) | Yes, but still an outline. More ink (173–262), not "solid". | 19 x 2 (incl. villain) | **0** | 0 |
| **I4** keep | — | today | 0 | 0 | 0 |

- Variant **I1b**, not recommended: use the font only where the codepoint means the kind — Triggered `)`, Trait `*`, Villain `d` — and keep Lucide elsewhere. Two icon families on one card type.
- **v2 site ticket worth filing whatever Scott picks.** The site's No action and Trait crests already share one star. In light that is a hue-only distinction at equal lightness (L 0.49 vs 0.48). Three of its codepoints are MCDM-chart glyphs for other things (Self, Versatile, Area of Effect), which `ability_cards.go:83-85` already flags as placeholders.
- **Closed vs open paths** (lucide node data):
  - **Closed:** zap, star, both footprint soles, and the user head circle.
  - **Open but fills sensibly:** the user torso arc closes along its base; the sword blade polyline closes into a blade.
  - **Lines that do not fill:** sword hilt, footprints bars, circle-dashed arcs (each fills a sliver).
  - **Blob:** skull. Its eye and nose shapes fill in the same colour as the head.
- **Unscoped fill** (composite 3, `sc563-r1-q1-fill-spill.png`). Of the 24 other crest icons, 12 lose meaning:
  - target becomes a solid disc
  - heart-pulse becomes a plain heart
  - octagon-alert and shield-alert lose their "!" (so stamina **winded = healthy**)
  - skull, brain, map, backpack and handshake become blobs
  - package becomes a hexagon
  - gem loses its facets
  - eye-off smears
  
  This is why I2 is scoped to `.dse-feature[data-dse-act]:not([data-dse-act='villain']) > .dse-head > .dse-crest`.
- **DESIGN.md.** The Iconography section says "no Lucide", and "glyph font first, Material thin-line second" for new UI utility icons. The plugin's Lucide crest icons already depart from that letter: `renderFeature.ts:296-299` justifies them as "Material thin-line second". Read literally, the rule favours I1. I2 fits the site's own crest convention (solid, `steel-redesign.css:56`) and draws no new icon. Whatever Scott picks, DESIGN.md Iconography needs a line saying what the plugin's crest icons are (rule 8).
- **Licence and size for I1.**
  - The OTF is CC BY-SA 4.0 (MCDM); the plugin is MIT. It would ship as a `data:` URI the way Source Serif 4 does (`styles-source.css:6843-6875`): about 29 KB base64 for the whole font, less for a 6-glyph subset.
  - Needs an attribution file next to `assets/fonts/OFL.txt`. A subset is arguably an adaptation, so it is ShareAlike.
  - Flag for Scott; not a legal opinion.

### 1d. Composition with SC-367 (crest size)

- **SC-367 "leave":** nothing changes in size; every option applies as measured.
- **SC-367 A-ink:** the crest grows to 3.75em x 4.25em (60x68). SC-367's probe left the svg at 1.5em = 24px, which was the owner's r2 observation. For the site ratio the svg must become 1.875em (30px).
  - **I2 / I3 are size-agnostic.** The fill and stroke follow whatever svg size SC-367 sets; SC-563 sets no size.
  - **I1** ties its glyph to the crest: 1.25em today, 1.5625em under A-ink. Under A-ink this lives in one SC-563 declaration that SC-367 would also touch.
- **Simplest composition:** whichever lands second scales the glyph with the crest.
  - I2/I3: SC-367 edits `:8772-8775` (svg size), and SC-563 only adds `fill`.
  - I1: SC-563's `font-size: 1.25em` becomes `calc(var(--dse-crest-glyph, 1.5em) / 1.2)` or simply 1.5625em.
- **W6** (SC-367 turns statblock sub-feature crests into bare 23px glyphs): I2's selector already matches those nested heads. The site's statblock glyph there is the same solid DrawSteelGlyphs, so a filled bare glyph is the site match.

## 2. Q2 — the trait eyebrow tint

### 2a. Measurements (Determination; Mark for the untinted case; painted over the median background)

| | Site dark (`slate`) | Site light (`default`) | Plugin dark | Plugin light |
|---|---|---|---|---|
| Trait eyebrow word | light purple `#bb8fce`, L 0.714 C 0.101 h 315, **6.27:1** on `#1b1f22` | dark purple `#7d3c98`, L 0.481 C 0.153 h 315, **6.70:1** on `#f8f9f9` | grey `#959b9e`, L 0.684 C 0.009 h 234, **5.42:1** on `#202629` | dark grey `#555960`, L 0.463 C 0.012 h 262, **6.79:1** on `#fafbfb` |
| Trait ◆ | same as the word | same | metal `#a9b0b5`, L 0.753, 6.98:1 | `#5f676c`, L 0.509, 5.56:1 |
| Ability / kit-signature eyebrow | grey `#959b9f`, L 0.686, 5.33–5.37:1 (◆ metal L 0.753) | `#555960`, L 0.463, 6.85–6.92:1 | same as the trait row | same |
| Name (for SC-368) | light steel grey `#cdd1d4`, L 0.858 | mid steel grey `#5f686d`, L 0.511 | near-white `#d3d9dd`, L 0.880 | near-black `#1a1d20`, L 0.229 |
| Probe E-A (copy) | — | — | `#bb8fce`, L 0.714, 5.79:1 | `#7d3c98`, L 0.481, 6.82:1 |

- **Site rule.**
  - `steel-traits.css:117` sets `.sc-trait > .sc-head .sc-head__left-eyebrow { color: var(--act) }`, and `:118` gives the ◆ `background: var(--act)`.
  - `--act` defaults to `--sc-act-trait` at `:31`. Every `.sc-trait` is emitted with `data-action="trait"` (`trait_cards.go:210`), so **the tint is always the trait purple**: on trait cards, on class "Feature" cards (Nature Watch: "◆ FEATURE" also purple) and on sub-traits nested in a trait card.
  - Token values: `--sc-act-trait` is `#bb8fce` in slate and `#7d3c98` in default (`steel-ability-cards.css:23,31`).
  - Only `.sc-trait` heads are tinted. Ability, kit-signature and every other card-head eyebrow use the neutral `steel-cardhead.css:82-91` (`--md-default-fg-color--light`, ◆ `--fx-metal`). `steel-ability-cards.css:91-94` `.sc-ability__eyebrow { color: var(--act) }` (action-tinted) survives only for the runtime JSON renderer `v2/docs/javascripts/steel-ability-cards.js:85` (and its trait twin `steel-traits.js:112`); no generated Browse page emits that class.
  - The trait head also carries a 54px purple segment on its bottom hairline (`steel-traits.css:112-116`). That is a third trait-colour mark; the plugin has none (out of scope; noted).
- **Plugin chain.**
  - Text: `.dse-head__eyebrow { color: var(--dse-fg-muted) }` (`styles-source.css:14798-14804`). `--dse-fg-muted` is `rgba(220,226,230,.62)` in dark (`:6952`) and `#555960` in light (`:14291`).
  - ◆: `background: var(--dse-metal)` (`:8723-8735`). `--dse-metal` is `#a9b0b5` (`:6983`) / `#5f676c` (`:14304`).
  - **Reusable per-kind accent already on every feature root:** `--dse-act: var(--dse-act-<kind>)` set inline (`renderFeature.ts:592-593`). `--dse-act-trait` is `#bb8fce` in Steel dark (`:7055`) and `#7d3c98` in Steel light (`:14418`), byte-identical to the site. It already paints the trait crest glyph (`:8797-8799`) and the 3px action spine (`:72-81`).
- **Non-hue channel.** The eyebrow says "Trait" / "Feature" / "Ability" in words. The crest shape (star) and the spine stay. A tint is never the only signal.

### 2b. Options

| | CSS | Captures moved | Frozen | Parity |
|---|---|---|---|---|
| **E-A** copy the site | word + ◆ = `var(--dse-act)` on trait-family heads (not statblock/featureblock sub-features, which the site draws without an eyebrow) | 4 combos x 2 (feature default, spend, collapsed, trait-provenance) | **0** | 0 rows (no eyebrow pair) |
| **E-B** keep neutral (rec) | none | 0 | 0 | 0 |
| **E-C** ◆ only | ◆ = `var(--dse-act)`; the word stays grey | 4 x 2 | **0** | 0 |

- **Lightness.** The tint barely moves it:
  - Dark: grey 0.684 → purple 0.714 (+0.03).
  - Light: grey 0.463 → purple 0.481 (+0.02).
  - Contrast moves 5.42 → 5.79 (dark) and 6.79 → 6.82 (light).
  - For a colourblind reader the change is mostly hue. That is acceptable only because the word carries the kind.
- **Is a v2 site ticket warranted under E-B?** Low value. The site tints one family's eyebrow but not the others, which is a predictable-lookup inconsistency. If filed, fold it into the v2 ticket SC-368 plans under its option D ("card-head inks unify"), not a separate one.
- **Edge case.** `feature/default` nests a trait inside an ability card. E-A tints that nested "Trait" eyebrow too; the site has no comparable page.

### 2c. Composition with SC-368 (name colour)

| SC-368 → | D (keep one dark name; owner's rec) | A (copy the site's two name inks; trait name → steel-lighter) |
|---|---|---|
| Dark | name L 0.880 > eyebrow 0.684 (E-B) / 0.714 (E-A): the name stays the brightest | name L 0.858 > eyebrow 0.684 / 0.714: the name stays the brightest |
| Light | name L 0.229 (16.2:1) is far darker than eyebrow 0.463 / 0.481: the name stays dominant | name L 0.511 (5.45:1) is **lighter** than eyebrow 0.463 (6.79:1) or 0.481 (6.82:1): **the eyebrow out-contrasts the name** under E-A *and* E-B |

- SC-368 A creates the light-scheme inversion; E-A only adds chroma (C 0.153) to an eyebrow that is already the darker text. E-A plus A is the most site-faithful pairing and the least hierarchical one.
- **SC-367 A-ink also grows the eyebrow** from 13.6px to 16.86px. That makes a tinted eyebrow more salient in either pairing.
- Composite 2 shows every pairing in both schemes.

## 3. Print / realprint and frozen lines

- **Hidden in print**, sweep over all 83 combos in print and realprint (`analyse.py` §print):
  - every `.dse-crest`: 146 nodes, `display:none`, 0x0 — the base `:15425-15436` stays `none` because the Steel reveal is screen-scoped
  - every `.dse-fb__feat-icon`: 5
  - every feature-head left eyebrow: 84 nodes, `display:none`, from the Legacy hide at `:54-56`, whose Steel reveal is screen-scoped
- **Does print:**
  - non-feature eyebrows (card / statblock / tracker kind nouns)
  - the villain-band skull `.dse-sb__band-crest`
  
  No option selects either.
- **Option sweep.** Each option, and the union of all five, changes **0** computed crest/icon/eyebrow properties and **0** full-page screenshot hashes in print or realprint, across all 83 combos. **Unscoped control** (`control-UNSCOPED-not-an-option.css`): changes 263 nodes in 64 combos and the hashes of **46** print + 46 realprint captures. So the measurement can fail.
- **Real shots run with the union injected:** see §3a.
- **Frozen lines moved: 0 for I1, I2, I3, E-A, E-C.**

### 3a. Shots run with every option injected

- **Run 1, base.** `node visual-harness/shoot.mjs`, private `DSE_CAMERA_TMP`: 592 shots, `check-freeze.sh` **280/280**.
- **Run 2, union.** The same command with `probes/probe-UNION-all-options.css` (I1+I2+I3+E-A+E-C) appended to the built `dist/harness.css`: 592 shots, `check-freeze.sh` **280/280 byte-identical**.
- **Hash diff, run 1 vs run 2** (`data/sc563-r1-shots-union-diff.json`): **78 shots moved, all steel-dark/steel-light (39 ids × 2), 0 print, 0 realprint.**
  - Moved ids: every `feature*` id (incl. rolled / rolled-expanded(-narrow) / rolled-modified / villain / list / spend / trait- and ability-provenance), `kit`, every `statblock*` id that shows a sub-feature (charbox, charline, columns-wide, corpora, disttarget, edit-btn, featstyle-flat, kwusage, narrow, sticky×5, stats, villain-banded, with-captain), and `chrome-hover-card`, `chrome-hover-statblock`, `chrome-placement-trio`.
  - No unrelated id moved (no ancestry/class/kit-head-only/montage/negotiation/stamina/tracker), so the two runs were deterministic where untouched.
- **Restored afterwards.** The worktree's `dist/harness.css` (byte-compared to the scratch copy) and `visual-harness/shots/` (byte-identical to run 1's hashes). Both are gitignored, and `git status` is clean.
- **Per-option split of the 39 ids.** I did not run shots per option. The split is inferred from the element×fixture sweep plus which fixture each derived id mounts:
  - I1/I2: all of them except `feature-villain`.
  - I3: all 39.
  - E-A/E-C: only ids that mount a feature fixture carrying a trait head — `feature` (`default` nests a trait in the ability), `feature-spend`, `feature-trait-provenance`, the `feature-rolled*` ids if they mount `default`, and any chrome stack mounting `feature` `collapsed`/`default`. That makes at most 10 ids × 2. An implementer's shots run gives the exact list.

## 4. Parity

- `selector-map.json` maps no crest, glyph or left eyebrow. The only head pairs are the five `name-*` rows (`:141-150`).
- Under every option: **0 rows retired, 0 added, 0 GAPs, DECLARED stays 24.** This holds by construction: no mapped selector matches a node any option restyles, and the five name pairs' `color` is untouched. `npm run parity` was not run this round.
- **Optional.** SC-368 already plans to add trait/class/sub-feature name pairs. That needs a trait URL in `urls.json` (there is none today) and a `parity:site` regeneration. A `trait-eyebrow` `ink` pair could ride along:
  - Site `.sc-trait > .sc-head .sc-head__left-eyebrow`, plugin `[data-dse-element='feature'] > .dse-feature[data-dse-act='trait'] > .dse-head > .dse-head__eyebrow--left`.
  - Under E-A it passes. Under E-B/E-C it GAPs and needs a `declaredDeferrals` entry citing SC-563, both schemes (2 rows).
- No crest-glyph pair is possible: `PROPS` has no `fill`/`stroke`, and the site glyph is text.

## 5. Exact CSS (insertion point: a new SC-563 block after `styles-source.css:8858`)

- **Where it goes.** After the closing brace of the light crest-face rule, before the "Per-option glyph show-override" comment at `:8860`.
- **Why there.**
  - SC-367's in-place edit list (r1 report §8) touches `:8715-8722`, `:8751-8756`, `:8766-8775` and `:8866-8875`, and its preferred new block goes **after `:8875`**.
  - SC-368 edits `:14811` and/or adds a family name rule.
  - `:8859` is a blank line between two unchanged hunks, so all three tickets merge cleanly in any order.
  - Lines below 15595 are unchanged between `69b5c0d4` and `6270e84a`, so both sibling reports' line numbers still hold.

```css
/* SC-563 Q1 (option I2): the action crest's glyph reads SOLID, like the site's
   DrawSteelGlyphs crest (steel-ability-cards.css:86-87; the site fills even its Material
   crest svgs, steel-redesign.css:56). Scoped to ACTION crests only (a feature root that
   carries data-dse-act): an unscoped fill erases inner detail on 12 of the other 24 crest
   icons (target, heart-pulse, shield-alert = winded, skull…, sc563-r1-q1-fill-spill.png).
   Villain's skull stays an outline for the same reason. Size-agnostic (follows the svg's
   1.5em, :8772-8775). SCREEN-ONLY: crests are display:none in print (:15425). */
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-feature[data-dse-act]:not([data-dse-act='villain']) > .dse-head > .dse-crest .dse-crest__glyph svg {
	fill: currentColor;
}

/* SC-563 Q2 (only if Scott picks E-A; E-C = the ::before rule alone): the site tints the
   trait-family eyebrow word + ◆ with the trait accent (steel-traits.css:117-118); --dse-act
   is already var(--dse-act-trait) on the feature root (renderFeature.ts:592-593). Not on
   statblock/featureblock sub-features (the site draws no eyebrow there). Screen-only: the
   feature-head eyebrow is display:none in print (:54-56). */
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-feature[data-dse-act='trait']:not(:is(.dse-sb, .dse-fb) .dse-feature) > .dse-head > .dse-head__eyebrow--left {
	color: var(--dse-act);
}
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-feature[data-dse-act='trait']:not(:is(.dse-sb, .dse-fb) .dse-feature) > .dse-head > .dse-head__eyebrow--left::before {
	background: var(--dse-act);
}
```

- **I1 instead of I2:**
  - an embedded `@font-face { font-family: "DrawSteelGlyphs"; src: url(data:font/otf;base64,…) }` next to `:6851`, plus attribution
  - the svg hidden on non-villain action crests
  - `.dse-crest__glyph::before { font-family: "DrawSteelGlyphs"; font-size: 1.25em; line-height: 1 }`
  - one `content:` rule per `data-dse-act` (main `l`, maneuver `f`, triggered `)`, move `o`, none `*`, trait `*`)
  
  See `r1-survey/probes/probe-I1-site-glyph-font.css`.
- **I3:** `stroke-width: 3px` on the same selector without the villain exclusion.
- **Tests an implementer would need:**
  - a jsdom source-text assertion, like `steelMaterial.test.ts`'s style, that the fill rule is screen-scoped and limited to `[data-dse-act]`, with the can-fail check
  - no lifecycle/e2e impact (CSS only)

## 6. Risks

- **Real Obsidian draws 1.75px strokes, not the harness's 2px**, and its Lucide build may differ slightly from lucide 1.24. I2 is the least sensitive to this: a filled shape hides stroke width. An `obsidian-shots` spot check of one ability card is worth doing at implementation.
- **I2 makes the sword half-solid** (blade solid, hilt lines). It reads as a sword at 20px, but it is the least "solid" of the five.
- **I1 placeholder churn.** If MCDM ships official action glyphs, the site swaps codepoints (`ability_cards.go:83-85`) and I1 would have to follow, or drift.
- **Under E-A, colourblind readers gain nothing.** The difference is ~0.02–0.03 L. The visible change for Scott is near zero, so evidence must name the colours, which composite 2 does.

## 7. Artifacts

- Report: this file.
- Composites (`r1-survey/crops/`):
  - `sc563-r1-q1-crest-icon.png` (1636 x 1468): per kind, Today / Site / I1 / I2 / I3, dark
  - `sc563-r1-q2-trait-eyebrow.png` (1960 x 1480): Determination, dark and light; Today / Site / E-A / E-C / E-A+SC-368 A / SC-368 A
  - `sc563-r1-q1-fill-spill.png` (1520 x 870): the unscoped-fill spill
- Data (`r1-survey/data/`): `sc563-r1-site.json`, `sc563-r1-plugin.json`, `sc563-r1-glyphs.json`, `sc563-r1-allicons.json`, `sc563-r1-sweep-0-30.json`, `sc563-r1-sweep-30-200.json`, `sc563-r1-summary.json`, `sc563-r1-shots-union-diff.json`.
- Probes (`r1-survey/probes/`): I1, I2, I3, E-A, E-C, SC-368 A, UNION, CONTROL.
- Scripts (`r1-survey/scripts/`): `sc563-probes.mjs`, `sc563-r1-measure.mjs` (`site|plugin|glyphs|allicons|sweep`), `sc563-r1-analyse.py`, `sc563-r1-compose.py`, `sc563-dump-probes.mjs`.
- Tiles (`r1-survey/tiles/`): every raw dsf-2 element shot the composites use.
