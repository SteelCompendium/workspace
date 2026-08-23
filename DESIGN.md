# Steel Compendium — UI Design ("High-Fantasy Steel")

The living summary of the v2 site's design language: what it looks like, why, and
where each piece is implemented. The full design exploration (canvas boards, per-
component handoff specs, session transcripts with the original motivations) is
archived in [`reference/design-system/`](reference/design-system/README.md); the
**live repos are the source of truth** for code (`v2/docs/stylesheets/steel-*.css`,
`v2/docs/javascripts/steel-*.js`, `steel-etl/internal/site/`).

## Motivation & brand

Draw Steel's four pillars — **Tactical, Heroic, Cinematic, Fantasy** — translated into
a **dark, forged-steel** reference tool: "a well-made steel instrument — cool, precise,
readable for long sessions." The print rulebook is classic serif TTRPG layout with
full-bleed fantasy art and a ◆ diamond motif; the web product is its calmer, darker,
utilitarian descendant. The approved direction is called **High-Fantasy Steel**:
restrained steel chrome (hairlines, bevels, embossed headings, heraldic crests) over a
flat charcoal ground, with saturated color reserved exclusively for *semantic* meaning.

Two non-negotiables drive every component:

1. **Content is frozen.** Rules text, values, and wording are verbatim from the books —
   design work never alters them. (Statblock design chat, where the official layout is
   community-controversial: "We can't change any of the words/numbers. We can only
   change the design.")
2. **Predictable lookup.** A Director mid-combat must know *exactly where* on a
   statblock/card a value lives — every instance of a layout puts the same field in
   the same place. Design preferences change the layout wholesale, never per-page.

## Look & feel foundations

- **Color.** Cool steel-charcoal surfaces (`#1a1e21` bg, `#22272b` raised) with
  brushed-steel greys for brand marks; one bright **steel-teal accent** (`#4db8c7`
  dark / `#2a7b88` light) carries every link, active tab, focus ring, and badge.
  Foreground is warm-white at graded opacities (88/62/38/12%). Saturated color appears
  **only** as semantics — ability-type hues, power-roll tiers, statblock role colors —
  and always as a thin border, glyph, or gradient band, never a fill. Dark "slate" is
  the signature mode; light "default" is fully supported. (Alternate Parchment/Obsidian
  themes exist but are hidden until fully baked — `FOLLOWUPS.md` #3.)
- **Type.** Three commercial brand faces with **Source Serif 4** as the graceful
  fallback: **Beaufort W01 Heavy** for big UPPERCASE display (H1/H2 — "BROWSE RULES"),
  **Test Newzald** for subheads (H3–H6, Title Case), **Berlingske Slab Demibold** for
  body (line-height 1.7 for long reading). **JetBrains Mono** for code/IDs/numbers.
  Game Terms keep their Capitalization mid-sentence. **Fixed type scale:** Material's
  responsive root-font-size scaling (125% → 137.5% at ≥100em → 150% at ≥125em) is
  pinned to the 125% base at every width (`extra.css`), so type and rem-based layouts
  don't enlarge or reflow on wide monitors — the **Text size** slider is the one
  intentional way to scale reading.
  **Type SIZES are a named role scale, not free numbers.** In the plugin this is the
  nine `--dse-fs-*` tokens (heading / subheading / numeral / body / control / secondary /
  label / caption / micro), every one an **`em` ratio** so the root of the scale is the
  host theme's own text size — the plugin states no absolute size and therefore cannot
  fight a user's theme. Pick the role that says what the text *is*, never how big it
  should look; a hardcoded `font-size` is prohibited and gated
  (`draw-steel-elements/test/unit/build/fontSizeContract.test.ts`). Three settings
  sliders retune the bands (Small / Large / Control text size). Full rules:
  [`draw-steel-elements/.repo-docs/font-sizes.md`](draw-steel-elements/.repo-docs/font-sizes.md).
- **Backgrounds.** Flat solid charcoal. **No gradients, photos, textures, or patterns**
  as web chrome (full-bleed art is a print-book thing; box it deliberately if ever
  used). No glassmorphism, no backdrop blur — transparency only as 6–12% accent/code
  washes.
- **Borders & cards.** The workhorse: 1px hairline (12% white) borders, `0.4em` radius,
  flat at rest. Ability cards add a 3px colored left border keyed to type; the redesign
  layers steel chrome via the `--fx-*` ornament tokens (metal gradients, bevels,
  embossed headings, `.sc-crest` heraldic crests).
- **Elevation & motion.** Minimal. Cards are flat at rest and **lift on hover**
  (`translateY(-1/-2px)` + soft shadow); hover = teal (text/border/10% wash).
  Transitions 0.15s color / 0.2s lift. **No bounces, no springs, no infinite loops.**
- **The ◆ diamond motif.** The brand's connective tissue: `<hr>` renders as a
  polished-steel center-out fade with seed dots and a haloed rotated diamond;
  blockquotes are **filigree frames**. Both in `steel-redesign.css`. A matching
  full-bleed page-title masthead was designed but **parked** (needs a full-bleed
  shell — see `reference/design-system/handoff/v2-handoff/TITLES-RULES-QUOTES.md` §4).
- **Layout.** Generous reading column, left nav tree + right ToC, sticky top tabs
  (Browse / Read / Bestiary). Multi-column `minmax`-grid card indexes. Dense but airy.

## Voice

Two registers, kept separate: **rules voice** (the game text — second person,
imperative, rules-precise, capitalized Game Terms) and **site voice** (UI/help copy —
friendly, plain, occasionally wry; "I" = maintainer, "you" = reader). Display
headings ALL UPPERCASE, subheads Title Case, body sentence case. Power-roll tiers are
always `≤11` / `12–16` / `17+`. Tone words: tactical, heroic, cinematic, forged.

## Iconography

The icon language is **the game's own glyph font plus functional emoji** — no
Lucide/Heroicons/Font-Awesome.

- **DrawSteelGlyphs** (`reference/DrawSteelGlyphs/`, loaded by the site): ASCII →
  game glyphs — `!` `@` `#` are the power-roll tier badges (≤11 / 12–16 / 17+),
  `0`–`9` boxed numbers, `^` star (passive), `d` skull (villain), `b`/`c` area marks.
- **Emoji are a typed taxonomy, not decoration**: source markdown prefixes ability
  blockquotes with 🗡 🏹 👤 ❗ ❇ ⭐ ☠ 🌀 to classify them; 📏 distance / 🎯 target label
  info-table cells. JS/CSS swap them for styling. Outside this system, avoid emoji.
- Material Design Icons appear only as MkDocs theme chrome; match that thin-line style
  for any new UI utility icon. **Never hand-draw new SVG icons** — glyph font first,
  Material thin-line second.
- **Logo**: the open-tome glyph with baked glow (the only glow in the system), in
  steel/white/black colorways (`v2/docs/Media/steel_compendium/`).

## Token vocabulary & load order

No `steel-*` sheet invents brand colors; each composes tokens from the sheet above it,
so **`mkdocs.yml` `extra_css` order matters** (redesign → settings → ability-cards →
statblock → traits → indexes → bestiary):

| Tokens | Defined in | What |
|---|---|---|
| `--md-*` | Material for MkDocs | theme vars (provided by the site) |
| `--sc-steel*`, `--sc-ability-*`, `--sc-tier-*` | `v2/docs/stylesheets/palette.css` | brand palette: steel greys, 8 ability-type hues, 3 power-roll tiers |
| `--fx-*` | `steel-redesign.css` | steel ornament tokens (metal gradients, bevels, emboss, card bg) — everything downstream reuses them |
| `--sc-act-*` | `steel-ability-cards.css` | 6 action-type colors (Main red, Maneuver blue, Triggered green, Move orange, None, Trait purple) |
| `--sc-role-*` | `palette.css` | locked role-accent hex tokens (single source); consumed by `steel-statblock.css` and `steel-featureblock.css` |
| `--role` | `steel-statblock.css` | per-role statblock accent, set by `.sb-wrap[data-role]` (reads `--sc-role-*` from `palette.css`) |

Locked **statblock/featureblock role colors** are now `--sc-role-*` tokens in
`palette.css` (single source), consumed by both `steel-statblock.css` and
`steel-featureblock.css`: Ambusher yellow, Harrier pink, Artillery purple, Brute blue,
Controller red, Hexer green, Mount teal, Support orange, Defender tan,
Leader/Solo/Minion/Malice grey. (Word-form list: `reference/colors.md`.)

## Card header system (the "6-slot header")

Every entity card (ability, feature/trait, statblock, featureblock/fixture/terrain, their
previews, and nested sub-features) shares **one** header model so the same kind of field
always lands in the same place — the direct expression of the **Predictable lookup**
principle. It replaced the per-card headers that drifted (`Shadow Feature` vs
`Maneuver - Black Ash` for the same entity). Full spec + per-card fill maps:
[`docs/superpowers/specs/2026-06-23-unified-card-header-design.md`](docs/superpowers/specs/2026-06-23-unified-card-header-design.md)
(plan: [`docs/superpowers/plans/2026-06-23-unified-card-header.md`](docs/superpowers/plans/2026-06-23-unified-card-header.md)).

The header is a **3-lane × 2-column grid** of six positionally-named slots:

```
          LEFT (stack)              RIGHT (rail)
  top   left-eyebrow             right-eyebrow
  mid   left-primary (= name)    right-primary
  bot   left-deck                right-deck
```

- **Lanes are the consistency contract**: `eyebrow` = small context, `primary` = headline,
  `deck` = quiet detail — same emphasis on both sides. Slot names are **positional, never
  purpose-bound**, so a slot never misrepresents its contents.
- **Render style is a separate modifier** (`--line` / `--chip`). Default right column:
  eyebrow = chip, **primary = mini-title**, deck = chip → the header reads as **two mirrored
  title blocks**. Every slot is independently optional (empty = a gap, by design).
- **Fill guideline**: `left-eyebrow` = the kind-noun (the "…is a ___" phrase, specialized
  per family — Monster/Companion/…, Feature/Trait, Dynamic Terrain/Fixture/…); `left-deck` =
  provenance as `class · subclass`; `right-eyebrow` = Level; `right-primary` = the headline
  attribute (colored category, else cost); `right-deck` = a secondary attribute (cost/usage/EV).
- **Sub-features** (inside a statblock/featureblock) drop the implied lanes → name + cost +
  usage; the **Flat-list** Feature Style (`data-sb-featstyle`/`data-fb-featstyle` = `flat`)
  inlines those onto the name (`Cleave · Signature · Main Action`). **Mobile** wraps tight
  slots to a second line, never truncates.
- **Phone widths (≤30em) stack the columns**: the right rail's content-sized grid column
  otherwise starves the name track (letter-per-line wrap), so the right slots re-place as
  lanes 4–6 *under* the left stack, left-aligned — one column, six lanes. CSS-only
  (`steel-cardhead.css` narrow-screen block; regression test
  `v2/tests/e2e/cardhead-mobile.e2e.cjs`).

Built as one shared renderer (`renderCardHead`) + one CSS contract (`.sc-head`), so
consistency is structural. **The top-center control strip** is the shared home for
per-card page actions (copy-link ending `.1rem` left of the pin, pin at `+1.6rem`, encounter-add at
`+3.4rem`, MD/PNG exports at `+5.2rem` — all mounted in the card HEAD, one aligned row), hover-revealed on the card — never place
controls in the head grid's column 3 (they collide with the Level chip / role mini).
One sanctioned exception: the statblock **level scaler** lives *inside* the Level chip
itself (−/+ flank it, absolutely positioned + hover-revealed, so the untouched chip
renders identically). The statblock head already embodies the model (`Level / Org+Role /
EV` = right `eyebrow / primary / deck`).

**Plain (non-card) pages** get the strip's page-tier sibling instead: the **top-right
page action strip** (`.sc-pageact`, `sc-pageact.js` + `steel-pageact.css`) — the same
1.7rem boxed buttons (page permalink, pin), but **always visible** in the top-right of
the content pane. "Card page" means the strict `h1+hr+card` adjacency; a page that
merely *embeds* cards (Read chapters) is a plain page.

## Component systems (all shipped unless noted)

| Component | Implementation | Design spec (intent, archive) |
|---|---|---|
| Browse landing (heraldic crests) | `v2/static_content/docs/Browse/index.md` + `steel-redesign.css` | `…/v2-handoff/LANDING-INDEX-CARDS.md` |
| Category index cards | `steel-etl/internal/site/cards.go` + `steel-redesign.css` | same + `…/v2-handoff/steel-etl/PATCH.md` |
| Ability cards (raised steel plate, crest by action type, power-roll panel) | `steel-ability-cards.css/.js`, build-time `steel-etl/internal/site/ability_cards.go` | `…/v2-handoff/ABILITY-CARDS.md` |
| Trait cards (recessed "codex niche", colored spine, nesting) | `steel-traits.css/.js`, `internal/site/trait_cards.go` | `…/v2-handoff/TRAITS.md` |
| Feature/treasure/rule index pages (folder cards, previews, search/filter) | `steel-indexes.css`, `steel-feature-browser.js`, `internal/site/feature_index.go` | `…/v2-handoff/archive/FEATURE-INDEXES.md` |
| ◆ steel rule + filigree blockquotes | `steel-redesign.css` | `…/v2-handoff/TITLES-RULES-QUOTES.md` (§4 masthead **parked**) |
| Statblocks (build-time `.sb-wrap` HTML card — no JSON island since 2026-06-14, `steel-statblock.js` retired 2026-06-18; per-piece prefs + presets, CSS sticky mini-header) | `internal/site/statblock_page.go` + `statblock_card.go` → `steel-statblock.css` | `…/redesign/statblocks/README.md` — **the** spec, plus the `data-sb-featstyle` addendum (`v2/.repo-docs/plans/2026-06-12-statblock-feature-style.md`) |
| Bestiary search & filter | `internal/site/bestiary_search.go` → `steel-bestiary-browser.js` + `steel-bestiary.css` | design spec in `steel-etl/docs/superpowers/specs/2026-06-10-bestiary-restructure-and-search-design.md` |
| Class landing header (`.sc-classhead` 6-slot card — right rail carries book chip + primary-characteristics mini with its "primary characteristics" caption as the deck (one field: value over label), mirroring the statblock rail; in-card flavor paragraph; stamina/per-level/recoveries + potency strips as matched 3-column rows of centered value-over-label cells; skills footer; `.sc-classnav` H2 jump bar with the ten level headings collapsed into one "Level 1…10" group) | build-time `internal/site/class_page.go` (+ `internal/content/class.go` frontmatter emit) + `v2/docs/stylesheets/steel-class.css` | `docs/superpowers/plans/2026-07-01-p3-class-landing-header.md` |
| "My Table" pinboard (Material pushpin — outline, filled when pinned; hover-revealed in the card top-center control strip; on plain pages always-visible in the top-right page action strip; `/pins/` board, localStorage, 200-item cap) | `v2/docs/javascripts/sc-pins-core.js`/`sc-pins.js` + `steel-pins.css`; board page `static_content/docs/pins.md` | `docs/superpowers/plans/2026-07-01-p7-pinboard.md` |
| Page action strip (`.sc-pageact` — always-visible page permalink + pin, top-right of the content pane on plain pages; card pages keep the card strip) | `sc-pageact.js` (shared card-page discriminator + strip factory) + `steel-pageact.css`; buttons mounted by `scc-headerlinks.js` / `sc-pins.js` | — |
| Chapter opening (centered book-style title + small-caps "book · Chapter N" eyebrow on `type: chapter` pages; the title stays a markdown h1 via attr_list, so nav/TOC/¶ survive) | steel-etl `internal/site/chapter_page.go` (after `injectH1`) + `steel-indexes.css` | — |
| Encounter builder (EV budget tray on `/Bestiary/` + add-from-statblock chip; book bands Trivial→Extreme, minions-by-four, `?enc=` share links; whole header row = collapse toggle, ⋯ menu (clear / reset / session-close) hidden while collapsed; an empty tray still expands to the party inputs) | `sc-encounter-core.js`/`sc-encounter.js` + `steel-encounter.css`; "+" column + `window.SC_BESTIARY_ITEMS` seam in `steel-bestiary-browser.js` | `docs/superpowers/plans/2026-07-01-p8-encounter-builder.md` |
| Click-to-roll power rolls (2d10 popover on `.sc-ability__pr-head`; edge/bane ±2, double = tier shift, natural 19–20 crit; tier-row highlight) | `sc-dice-core.js`/`sc-dice.js` + `steel-dice.css` | `docs/superpowers/plans/2026-07-01-p9-power-roll-dice.md` |
| Card exports (hover MD/PNG chips in the top-center strip; source markdown rides a single-line `data-src` attr on a `sc-src` template — element content / multi-line attrs get markdown-mangled) | steel-etl `internal/site/export_src.go` (+ embed strip in `embed_cards.go`); `sc-export.js` + vendored `html-to-image` + `steel-export.css` | `docs/superpowers/plans/2026-07-01-p10-card-exports.md` |
| Statblock level scaler (−/+ steppers living in the head's Level chip, hover-revealed like the control strip; book "Adjusting Monster Levels" formulas applied as deltas from printed values — EV/Stamina/damage/free strike, characteristics (±5 clamp), "Power Roll +N" bonuses (dice popover follows), and entity-aware potency rewrites in tier rows and effect prose; amber chip + dashed outline + banner-with-Reset while scaled; never persists) | `sc-scale-core.js`/`sc-scale.js` + `steel-scale.css` | `docs/superpowers/plans/2026-07-01-p11-statblock-scaler.md` |
| Featureblocks (`.fb-wrap` Forged Band card — titled collection of Features under a loose-stat header; statblock-like in anatomy, not rigor; also renders Summoner **fixtures** (`monster.fixture.<element>.featureblock` + `…advancement-features`), **retainer** advancement / role-advancement as paired `monster.retainer.advancement-features/<id>` + `…role-advancement/<role>` cards (Plan 6 — Plan 4's `retainer_page.go` split retired), and beastheart **companion advancement-features** as a leveled-band card on `monster.companion.beastheart.advancement-features/<species>` pages) | build-time `internal/site/featureblock_page.go` + `v2/docs/stylesheets/steel-featureblock.css` | `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, `…/2026-06-13-companion-restructure-advancement-featureblocks-design.md` |
| Statblock preview cards (`.sb-prev` compact mini-statblock on index / group-landing pages — full header + toggleable defenses/secondary-stats/characteristics/feature-preview zones, whole-card link to the full page). Covers monster, summoner, and **beastheart companion** statblocks (companions via the `feature-group → sbIsland` adapter in `companion_statblock.go`, which also embeds the full `.sb-wrap` card on the companion's own page). | build-time `internal/site/statblock_preview.go` (+ `bestiary_cards.go`/`cards.go`/`advancement_pairs.go`/`companion_statblock.go` routing) → `steel-statblock.css` + `statblock-preview.js` | `docs/superpowers/plans/2026-06-15-statblock-preview-cards.md`, `…-companion-statblock-adapter.md` |
| Kit pages (unified `.sc-kit` forged plate — header + flavor + equipment box + all-8 fixed-slot bonus grid + a Signature Ability band; the signature-ability `.sc-ability` card is spliced beneath via the preserved `{data-scc}` marker and fused flush by CSS; reuses the preview card's `.sc-card__stats` grid) | build-time `internal/site/kit_page.go` + `v2/docs/stylesheets/steel-kit.css` | `docs/superpowers/specs/2026-06-23-kit-page-unified-card-design.md` |
| Settings drawer (gear icon, live apply) | `settings-panel.js`/`settings-core.js` + `steel-settings.css` | `v2/.repo-docs/plans/2026-06-07-live-settings-panel.md` |
| Card copy-link button (`.sc-copylink` — hover-revealed permalink-copy injected into statblock / featureblock / ability card pages, which hide their `<h1>` and thus the native ¶ permalink; copies the page's `/scc/<code>/` URL from `<meta name="scc-permalink">`; faint-persistent on touch, hidden in print — a new UI utility icon in the thin-line Material style, per Iconography) | `v2/docs/javascripts/scc-card-copy.js` (+ DOM-free `scc-card-copy-core.js`) + `v2/docs/stylesheets/steel-copylink.css` | `v2/.repo-docs/plans/2026-06-16-scc-card-copy-button.md` |
| **Element chrome panel** (plugin) — the standard hover-revealed menu panel + whole-element collapse every card-like DSE element carries. See "The element chrome panel" below for the form factor, geometry and rules. | `draw-steel-elements` `src/framework/chrome/` + the "Element chrome" block at the foot of `styles-source.css` | `draw-steel-elements/docs/superpowers/sc169-element-menu-panel-spec.md` |

(`…` = `reference/design-system/handoff`.) Open design debts: statblock malice band +
captain label (`FOLLOWUPS.md` #7), hidden theme/card-style controls (`FOLLOWUPS.md` #3).

### The element chrome panel

The plugin's counterpart to the site's hover-revealed card control strip, and the **only**
per-element affordance surface in High-Fantasy Steel: every future per-element action ("add to
encounter", "export", "send to sidebar") goes here rather than inventing a second place.
Shipped by SC-169, rolled out 2026-08-18 to all 31 card-like elements. Opting in is one
`chrome` slot on the element definition; an element that does not declare it emits zero extra
DOM, which is what keeps the print freeze quiet by construction.

**Form factor.** A short, icon-only plate in the form of an OS window's control cluster,
top-right, seated *outside* the card and overlapping the space above its top edge — so it
costs no element a reserved top margin on desktop. It is right-anchored and **grows
right-to-left**: the collapse toggle is always the rightmost control (the fixed anchor a
reader's eye returns to) and every added item extends the plate leftward.

**Geometry — option D, Scott's pick (SC-169, 2026-08-18).** One number, one rule, on every
element: the panel's right edge sits `--dse-chrome-inset: 10px` inside the card frame's
**visible (border-box) right edge**, and the panel's bottom edge lands **exactly on** the
frame's border-box top. It never paints into the border row, so a card's own 1px hairline —
including the amber *winded* / red *dying* stamina frames — renders complete and unbroken
beneath the whole plate. The card's border is the panel's floor, which is why the panel keeps
no bottom border and square bottom corners. Both facts are a **gate, not a promise**:
`assertChromePlacement` in `visual-harness/shoot.mjs` re-measures seven element families every
sweep and fails the run naming what moved (jsdom computes no layout, so this cannot live in
the unit suite).

**Material — style E3, "hairline crown", Scott's pick (same ruling).** A plain rounded plate:
`--dse-surface-raised`, a 1px `--dse-border`, radius on the top corners only, one bright
hairline along the top edge (a light catch on the plate's lip — the `inset 0 1px 0 rgba(255
255 255 / …)` gesture `--dse-bevel` already uses on every raised Steel surface), and an
**upward-cast** shadow so the plate reads as floating over the element above and resting on
the one below. Deliberately no chamfer and no `clip-path`/`filter` (the rejected E1): the
silhouette stays a plain box, so the panel cannot clip its own shadow or a focus ring. Light
mode retunes both halves — the hairline goes to full white and the plate's top border is
deepened a step, because on a near-white surface a light catch has to be carried by contrast,
not brightness; the cast shadow drops to 15% black, since 34% under a light card reads as
grime rather than lift.

**Hover, mobile, print.**
- Desktop: hidden until the cursor is over the element *or* the panel, `:focus-within` as the
  keyboard twin. No reserved space.
- Mobile (`Platform.isMobile`): always visible, and the element reserves `2.1em` of top space
  so an always-on panel never covers the element above it.
- Print: **absent, in both modes.** The base layer sets `display: none` on the chrome nodes and
  every revealing rule is scoped `[data-dse-theme='steel']:not([data-dse-print="on"])`. The
  collapse rules carry the same exclusion, so **a collapsed element prints in full** — the same
  answer print rule 3 already gives the kit collapsible. Proven in bytes: the rollout to 31
  elements moved zero frozen print shots.

**The collapsed one-liner.** Collapse is by attribute (`data-dse-collapsed="on"`), never by
unmounting, so expanding is instant and no state is lost. The folded form is one line in a
fixed grammar the framework owns — `LABEL: Name (detail)` — with an always-visible expand
button on the right (in flow, not in the hover panel: a collapsed element must never be a dead
end on touch). While collapsed the floating panel is suppressed outright, so the one chevron is
the entire interface. Elements supply only the three parts, never the punctuation:

- `label` — the type, always present ("Statblock", "Encounter", "Resource").
- `name` — the instance name when the element has one, and always the name a reader would say
  out loud: the **resolved** entity name for a compendium reference, never the SCC code, and
  the resolved resource name ("Ferocity") rather than the raw class key.
- `detail` — a few characters of the one fact worth folding on. A bare number when it is
  unambiguous ("Surges (3)"), a fraction for a track ("Stamina (15/20)"), and **worded** when a
  bare number would not be ("Skills (12 selected)", "Party (4 heroes)") — the discipline being
  that the folded line must never be readable two ways.

## The user-preference system

Layout preference is a first-class design feature (born from the statblock
controversy): users pick how dense/faithful the rendering is, **per part**.

- Every preference is a `data-*` attribute on `<html>` (e.g. `data-card-style`,
  `data-sb-featstyle`, `data-sb-kwusage`…); CSS reflows one shared DOM — no re-render,
  no per-page variance. Applied by `settings-panel.js`, persisted in the
  `mkdocs:fontPrefs` localStorage store.
- **Statblock presets** bundle the `data-sb-*` attributes: **Steel Card** (default),
  **Sourcebook** (faithful to the book), **Index Card**. Individual overrides
  re-derive a "Custom" preset state. Full contract:
  `reference/design-system/handoff/redesign/statblocks/README.md`.
- **Featureblock prefs** are two independent `data-fb-*` attributes with **no presets**
  (a dedicated "Featureblocks" drawer group):
  - `data-fb-featstyle` (`card` default / `flat`) — feature rendering style, mirroring `data-sb-featstyle` for statblocks.
  - `data-fb-stats` (`grid` default / `ledger`) — loose-stat header layout (side-by-side grid vs. stacked ledger).
- **Featureblock advancement bands** (`.fb__band--adv` / `.fb__adv-head`): features with
  `Level > 0` group into a role-tinted "Level N Advancement" sub-head band. Used by
  fixture advancement-features (Plan 5c) and **retainer** advancement / role-advancement cards
  (Plan 6, 2026-06-18 — now real `monster.retainer.advancement-features/<id>` and
  `…role-advancement/<role>` featureblock entities on their own paired pages; the creature
  statblock island keeps only the base features). Plan 4's site-side body split
  (`retainer_page.go`) was retired. Backward-compatible: existing featureblock/terrain
  features have `Level: 0` and emit no band. As of 2026-06-19 (ROADMAP #16) the **fixture
  advancement card is embedded on the base fixture's page** at build time (`embedFixtureAdvancement`
  injects the `{data-scc}` marker for the embed_cards post-pass), companion-style — its
  Level-5/9 members are now individually coded leaf features too.
- **Statblock-preview prefs** are four independent `data-sbprev-*` attributes
  (`stats`/`meta`/`chars`/`feats`, each `on`/`off`; default `stats=on`, rest `off`) in a
  "Index previews" drawer group — they show/hide the zones of the `.sb-prev` preview
  cards on index pages. **Deliberate exception to "no per-page variance":** the global
  pref is the default, but each preview grid also gets a per-page toggle-bar
  (`statblock-preview.js`) that overrides the zones for *that page* in-session (a
  scannability affordance for index pages, not the statblock body itself). The build
  also bakes the default onto each grid as `data-sbprev-*` (the no-JS baseline);
  the global default lives in ONE place per layer — `settings-core.js` `SBPREV_DEFAULTS`,
  `overrides/main.html`, and steel-etl `sbPreviewDefaults` (keep them in sync). The
  default-zone choice is pending a community poll ([`ROADMAP.md`](ROADMAP.md) #11).
- **Hide drop caps** (`data-no-dropcap` on `<html>`, a Reading-group checkbox) is a single
  global boolean (absent ≡ shown) that suppresses the engraved `::first-letter` drop cap on
  lead trait cards (`.sc-trait--lead`, `steel-traits.css`). Like `data-compact`, only the
  non-default ("hide") state is stored in `mkdocs:fontPrefs` (`noDropcap: true`) and seeded
  in the `overrides/main.html` early-apply.
- New preferences must follow this pattern (attribute + `applyX()` + drawer row +
  preset detection), and must work in both color schemes.

## Rules for new design work

1. **Content is frozen** — never reword rules text to fit a layout.
2. **The golden rule:** data repos + the annotated source stay renderer-agnostic.
   Site-only polish lives in `v2` CSS/JS/static_content or `steel-etl/internal/site`
   (which emits only the website). See `ARCHITECTURE.md` for where changes go.
3. Compose existing tokens (`--sc-*`, `--fx-*`); don't invent brand colors. Define
   both slate + default themes. Respect the load order. **The same applies to type
   size**: compose the plugin's `--dse-fs-*` role scale, never a fresh literal — see
   "Type" above.
4. Saturated color = semantics only. No gradients/textures as chrome. No animation
   beyond hover-lift and 0.15–0.2s transitions.
5. Glyph font / typed emoji / Material thin-line — never new hand-drawn icons.
6. Reuse the shared grammars: `.sc-ability__pr/__tier/__section` power-roll panel,
   `.sc-card`/`.sc-folder`/`.sc-prev` index cards, `.sc-crest`, `hr` ◆ rule.
7. **No decorative colored left-borders** (Scott's rule, 2026-08-10, SC-132): the wide
   colored left-border/accent-spine on cards and panels is banned for new work — Scott:
   *"it's become a cliche in the software community because claude agents always include
   it in their UI designs."* Carry state/category through the Steel grammars instead
   (materials, crests/glyph silhouettes, notches, banner grounds, borders-all-around).
   Existing components that ship one today may stay for now but **will be replaced** —
   don't copy the pattern into anything new.
8. **Update this file** when the design language changes (new component system, new
   tokens, a changed rule) — current state + pointers only; effort history goes in
   the plan/spec docs and `reference/design-system/` stays a frozen archive.
