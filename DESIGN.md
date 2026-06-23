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

## Card header system (the "6-slot header") — specced, not yet shipped

Every entity card (ability, feature/trait, statblock, featureblock/fixture/terrain, their
previews, and nested sub-features) shares **one** header model so the same kind of field
always lands in the same place — the direct expression of the **Predictable lookup**
principle. It replaces the per-card headers that drifted (`Shadow Feature` vs
`Maneuver - Black Ash` for the same entity). Full spec + per-card fill maps:
[`docs/superpowers/specs/2026-06-23-unified-card-header-design.md`](docs/superpowers/specs/2026-06-23-unified-card-header-design.md).

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

Built as one shared renderer (`renderCardHead`) + one CSS contract (`.sc-head`), so
consistency is structural. The statblock head already embodies the model (`Level / Org+Role /
EV` = right `eyebrow / primary / deck`).

## Component systems (all shipped unless noted)

| Component | Implementation | Design spec (intent, archive) |
|---|---|---|
| Browse landing (heraldic crests) | `v2/static_content/docs/Browse/index.md` + `steel-redesign.css` | `…/v2-handoff/LANDING-INDEX-CARDS.md` |
| Category index cards | `steel-etl/internal/site/cards.go` + `steel-redesign.css` | same + `…/v2-handoff/steel-etl/PATCH.md` |
| Ability cards (raised steel plate, crest by action type, power-roll panel) | `steel-ability-cards.css/.js`, build-time `steel-etl/internal/site/ability_cards.go` | `…/v2-handoff/ABILITY-CARDS.md` |
| Trait cards (recessed "codex niche", colored spine, nesting) | `steel-traits.css/.js`, `internal/site/trait_cards.go` | `…/v2-handoff/TRAITS.md` |
| Feature/treasure/rule index pages (folder cards, previews, search/filter) | `steel-indexes.css`, `steel-feature-browser.js`, `internal/site/feature_index.go` | `…/v2-handoff/archive/FEATURE-INDEXES.md` |
| ◆ steel rule + filigree blockquotes | `steel-redesign.css` | `…/v2-handoff/TITLES-RULES-QUOTES.md` (§4 masthead **parked**) |
| Statblocks (JSON island → client render, per-piece prefs + presets) | `internal/site/statblock_page.go` → `steel-statblock.js` + `steel-statblock.css` | `…/redesign/statblocks/README.md` — **the** spec, plus the `data-sb-featstyle` addendum (`v2/.repo-docs/plans/2026-06-12-statblock-feature-style.md`) |
| Bestiary search & filter | `internal/site/bestiary_search.go` → `steel-bestiary-browser.js` + `steel-bestiary.css` | design spec in `steel-etl/docs/superpowers/specs/2026-06-10-bestiary-restructure-and-search-design.md` |
| Featureblocks (`.fb-wrap` Forged Band card — titled collection of Features under a loose-stat header; statblock-like in anatomy, not rigor; also renders Summoner **fixtures** (`monster.fixture.<element>.featureblock` + `…advancement-features`), **retainer** advancement / role-advancement as paired `monster.retainer.advancement-features/<id>` + `…role-advancement/<role>` cards (Plan 6 — Plan 4's `retainer_page.go` split retired), and beastheart **companion advancement-features** as a leveled-band card on `monster.companion.beastheart.advancement-features/<species>` pages) | build-time `internal/site/featureblock_page.go` + `v2/docs/stylesheets/steel-featureblock.css` | `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, `…/2026-06-13-companion-restructure-advancement-featureblocks-design.md` |
| Statblock preview cards (`.sb-prev` compact mini-statblock on index / group-landing pages — full header + toggleable defenses/secondary-stats/characteristics/feature-preview zones, whole-card link to the full page). Covers monster, summoner, and **beastheart companion** statblocks (companions via the `feature-group → sbIsland` adapter in `companion_statblock.go`, which also embeds the full `.sb-wrap` card on the companion's own page). | build-time `internal/site/statblock_preview.go` (+ `bestiary_cards.go`/`cards.go`/`advancement_pairs.go`/`companion_statblock.go` routing) → `steel-statblock.css` + `statblock-preview.js` | `docs/superpowers/plans/2026-06-15-statblock-preview-cards.md`, `…-companion-statblock-adapter.md` |
| Settings drawer (gear icon, live apply) | `settings-panel.js`/`settings-core.js` + `steel-settings.css` | `v2/.repo-docs/plans/2026-06-07-live-settings-panel.md` |
| Card copy-link button (`.sc-copylink` — hover-revealed permalink-copy injected into statblock / featureblock / ability card pages, which hide their `<h1>` and thus the native ¶ permalink; copies the page's `/scc/<code>/` URL from `<meta name="scc-permalink">`; faint-persistent on touch, hidden in print — a new UI utility icon in the thin-line Material style, per Iconography) | `v2/docs/javascripts/scc-card-copy.js` (+ DOM-free `scc-card-copy-core.js`) + `v2/docs/stylesheets/steel-copylink.css` | `v2/.repo-docs/plans/2026-06-16-scc-card-copy-button.md` |

(`…` = `reference/design-system/handoff`.) Open design debts: statblock malice band +
captain label (`FOLLOWUPS.md` #7), hidden theme/card-style controls (`FOLLOWUPS.md` #3).

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
   both slate + default themes. Respect the load order.
4. Saturated color = semantics only. No gradients/textures as chrome. No animation
   beyond hover-lift and 0.15–0.2s transitions.
5. Glyph font / typed emoji / Material thin-line — never new hand-drawn icons.
6. Reuse the shared grammars: `.sc-ability__pr/__tier/__section` power-roll panel,
   `.sc-card`/`.sc-folder`/`.sc-prev` index cards, `.sc-crest`, `hr` ◆ rule.
7. **Update this file** when the design language changes (new component system, new
   tokens, a changed rule) — current state + pointers only; effort history goes in
   the plan/spec docs and `reference/design-system/` stays a frozen archive.
