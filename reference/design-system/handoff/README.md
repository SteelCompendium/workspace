# Steel Compendium — Design System

A design system for **Steel Compendium**, an independent ecosystem of tools, rules, and data
for **MCDM's _Draw Steel_** tabletop RPG. The flagship product is **Xentis' Draw Steel
Compendium** — a fast, searchable web rulebook — backed by a family of open data repositories
and an ETL pipeline that parse the official books into JSON / YAML / Markdown.

> _The Draw Steel Compendium is an independent product published under the DRAW STEEL Creator
> License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025 MCDM Productions, LLC._

_Draw Steel_ itself is built on four pillars — **Tactical, Heroic, Cinematic, Fantasy** — and the
Compendium's visual language translates that into a **dark, forged "steel"** aesthetic: cool
charcoal surfaces, brushed-steel greys, a single bright **steel-teal** accent, heavy uppercase
display type, and the game's own **glyph icon font**.

---

## Sources

This system was reverse-engineered from the live site and its source repositories. Explore them
to build richer, more accurate designs:

| Source | URL | What's there |
|---|---|---|
| **Live site** | https://steelcompendium.io/v2/Browse/ | The product itself — dark steel theme, Browse / Read / Bestiary |
| **`SteelCompendium/v2`** | https://github.com/SteelCompendium/v2 | The website. **Primary design source** — a Material-for-MkDocs site. All tokens here come from `docs/stylesheets/{palette,custom_font,extra,tables}.css` and the runtime JS in `docs/javascripts/ability-cards.js`. |
| **`SteelCompendium/steel-etl`** | https://github.com/SteelCompendium/steel-etl | Data pipeline that parses the rulebooks into structured data. No UI — useful for understanding the content model (classes, kits, abilities, power rolls). |
| **`SteelCompendium/data-*`** | https://github.com/SteelCompendium | Parsed rules/bestiary in md/yaml/json — the content that the site renders. |

> The site is **Material for MkDocs** with heavy custom theming. There is no React app — the UI
> is server-rendered Markdown + a handful of vanilla-JS DOM enhancers. The UI kit in this system
> is a faithful **recreation** of that look, not a copy of the framework.

The uploaded rulebook pages (Conduit class spread + splash art) show the **print** side of the
brand — classic serif TTRPG layout, dramatic full-bleed fantasy art, drop caps, the ◆ diamond
motif. The web product is a calmer, darker, more utilitarian descendant of that book.

---

## ⛏ ACTIVE HANDOFF — Statblocks

**The deliverable ready to implement right now is the bestiary _statblock_ system** (High-Fantasy
Steel). It renders Draw Steel creature statblocks with **every part of the block exposed as an
independent user preference**, plus three **presets** (**Steel Card** is the default).

> **→ Hand off the `redesign/statblocks/` folder. Start at
> [`redesign/statblocks/README.md`](redesign/statblocks/README.md).**
> That file is a complete implementation spec: locked decisions (default preset, the full role-color
> map, where rules-links come from), the files to port and their destinations, the full DOM +
> `data-sb-*` preference contract, the three presets, and exactly how to wire the preferences into
> the Settings drawer following the existing `data-card-style` precedent in `settings-panel.js`.

**Locked decisions:** default preset **Steel Card**; role colors per the client map (Leader/Solo/
Minion/Malice grey, Brute blue, Controller red, Ambusher yellow, Artillery purple, Harrier pink,
Hexer green, Mount teal, Support orange, Defender tan); rules-links are **preserved from the source
markdown**, not a hardcoded term list. Content is frozen — design only.

**Prior redesign work has shipped.** The Browse landing (heraldic crests), ability & trait cards,
feature/treasure index pages, and the ◆ steel rule + filigree blockquotes are live on the site;
their handoff docs are now **reference/archive** material under `v2-handoff/`.

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | **All design tokens** — color vars (dark + light), font stacks, type scale, radii, shadows, semantic element styles, `.ds-glyph` + `.sc-rule` helpers |
| `SKILL.md` | Agent Skill manifest (for use in Claude Code) |
| `fonts/` | `DrawSteelGlyphs-Regular.otf` — the game's custom icon font |
| `assets/` | Logo (steel / white / black, SVG + PNG), favicon |
| `preview/` | 20 design-system cards (registered to the Design System tab) |
| `ui_kits/compendium/` | UI kit — interactive recreation of the Draw Steel Compendium web app |
| `redesign/` | Design exploration canvas — the approved "high-fantasy steel" direction (landing, kit index, content hierarchy, mobile) |
| `redesign/statblocks/` | **⛏ ACTIVE HANDOFF — the bestiary statblock system** (per-piece preferences + presets). Self-contained implementation spec + demo; see its own `README.md`. |
| `v2-handoff/` | Production conversion of the redesign — **now shipped**. Reference/archive: explains how `steel-etl` and `v2` relate and where each kind of change goes. Read `v2-handoff/README.md` to match an existing pattern (load order, class names, token vocabulary). |

> **How the product is built (two repos).** The site is the *output* of a pipeline, not a
> hand-built site. `steel-etl` parses one canonical annotated markdown file into the data repos
> **and** generates the v2 MkDocs page tree (including category index pages); `v2` owns the
> MkDocs config, theme overrides, CSS/JS, and hand-authored pages under `static_content/`. Content
> changes go in `steel-etl`; look-and-feel goes in `v2`; **never bend the shared data formats to
> style the website.** Full diagram + a "where does my change go?" table live in
> `v2-handoff/README.md`.

---

## CONTENT FUNDAMENTALS

**Voice.** Two registers coexist, and it's important to keep them separate:

1. **Rules voice** — the game text itself, lifted from the books. Second person, imperative,
   present tense, addressed to the player's hero: _"The power of the gods flows through you."_
   _"You start with an Intuition of 2."_ _"Choose a god or saint who your character reveres."_
   Confident, evocative, and rules-precise. Capitalized **Game Terms** (Power Roll, Piety,
   Victories, Main Action, Heroic Resource, Stamina) act as proper nouns.

2. **Site voice** — the Compendium's own UI/help copy. Friendly, plain, occasionally wry, and
   helpful. Uses "I" for the maintainer and "you" for the reader: _"Don't bother scraping the
   site! I have already parsed the data…"_ _"Look up specific rules, abilities, and character
   options."_ Short, scannable, task-oriented.

**Casing.** Display headings (H1/H2) are **ALL UPPERCASE** ("BROWSE RULES", "CONDUIT"). Subheads
(H3–H6) are Title Case ("Signature Ability", "Kit Bonuses"). Body is sentence case. Game Terms
keep their Capitalization mid-sentence.

**Tone words:** tactical, heroic, cinematic, decisive, forged, divine, dramatic. Flavor text is
italic and atmospheric (_"Your weapon unleashes psionic energy that reduces your target's
weight."_); rules text is crisp and numeric.

**Punctuation & numbers.** Em-dashes for asides. Dice/math written inline (`2d10`, `5 + M, R, I,
or P damage`, `+2/+2/+2`). Power-roll tiers are always `≤11` / `12–16` / `17+`.

**Emoji.** Used **functionally, not decoratively** — as semantic markers in the source Markdown
that JS swaps for styling. 🗡 ranged 🏹 maneuver 👤 etc. classify ability cards; 📏 (distance)
and 🎯 (target) label ability info-table cells. Outside this typed system, **avoid emoji.**

---

## VISUAL FOUNDATIONS

**Overall vibe.** Dark, forged, utilitarian-but-handsome. A reference tool that feels like a
well-made steel instrument — cool, precise, readable for long sessions. Dark mode ("slate") is
the signature; a light "default" mode and two alternate themes (Parchment, Obsidian) exist as
user preferences but Steel-dark is the brand.

**Color.** Cool **steel charcoal** surfaces (`#1a1e21` bg, `#22272b` raised) with brushed-steel
greys for brand marks (`#8e959a`, `#71797E`). A single bright **steel-teal accent** (`#4db8c7`
dark / `#2a7b88` light) carries every link, active tab, focus ring, and count badge — used
sparingly. Foreground text is warm-white at graded opacities (88 / 62 / 38 / 12%). A semantic
palette of **8 ability-type hues** and **3 power-roll tiers** is the only place saturated color
appears, and always as a thin 3px left border or a small glyph — never as a fill.

**Type.** Three brand faces (all commercial, loaded from the onlinewebfonts CDN on the live site;
Source Serif 4 is the graceful fallback): **Beaufort W01 Heavy** for big UPPERCASE display (H1
5rem, H2 3rem); **Test Newzald** for subheads (H3–H6); **Berlingske Slab Demibold** for body
(line-height 1.7 for long reading). **JetBrains Mono** for code, IDs, and numeric metadata.

**Backgrounds.** Flat solid charcoal. **No gradients, no photos, no textures, no patterns** in
the web UI. (The print book uses full-bleed painted splash art — bring that in only for
hero/cover treatments, never as web chrome.) Imagery, when present, is the warm cinematic fantasy
illustration of the rulebook — keep it boxed and deliberate.

**Borders & cards.** The workhorse. Cards and tables are **1px solid `--fg-lightest`** (a 12%
white hairline) with `0.4em` radius — flat, no fill change, no heavy shadow at rest. Ability
cards add a **3px colored left border** keyed to type. Inputs/code use `0.3em`; callouts `0.5em`.

**Shadows / elevation.** Minimal. At rest, cards are flat (border only). **On hover** they lift:
browse cards `translateY(-2px)` + `0 4px 12px rgba(0,0,0,.30)`; ability cards `translateY(-1px)` +
`0 2px 8px rgba(0,0,0,.10)`. No ambient drop shadows, no glows (except the logo's own baked glow).

**Hover / press.** Hover = teal: text turns `--accent`, borders turn teal, background fills with
the 10–12% `--accent-transparent` wash. Links underline on hover. Transitions are quick and
subtle — `0.15s` for color/border, `0.2s` for the card lift. **No bounces, no spring, no infinite
loops.** `content-visibility:auto` is used purely for performance on huge pages.

**The diamond motif.** ◆ is the brand's connective tissue — horizontal rules render as a fading
line interrupted by a rotated 14px square; section dividers in the book use ◆ flourishes. Reuse
`hr.sc-rule` for this. _(In the v2 redesign the production site upgrades the bare `<hr>` to a
**polished-steel** ◆ — center-out fade, two seed dots + a haloed diamond — and reframes
blockquotes as **filigree frames**; both live in `v2-handoff/v2/docs/stylesheets/steel-redesign.css`,
see `v2-handoff/TITLES-RULES-QUOTES.md`. A matching full-bleed **title** band is designed but
parked.)_

**Layout.** Generous max-width reading column, left nav tree + right table-of-contents on content
pages, sticky top tabs (Browse / Rulebook Chapters / Full Rulebook / Bestiary). Multi-column
`browse-index` link grids (`minmax(14em,1fr)`) and `grid cards` category grids. Dense but airy —
1.7 line-height keeps long rules legible.

**Transparency / blur.** Used only as the `--accent-transparent` and `--code-bg` washes
(6–12% white/teal over the dark bg). No glassmorphism, no backdrop blur.

---

## ICONOGRAPHY

The Compendium's icon language is **the game's own glyph font, plus functional emoji** — there is
no Lucide/Heroicons/Font-Awesome dependency in the web UI.

- **`DrawSteelGlyphs-Regular.otf`** (`fonts/`, bundled) is the hero icon set. It maps ASCII
  codepoints to game glyphs: `!` `@` `#` are the **power-roll tier badges** (≤11 / 12–16 / 17+),
  `0`–`9` are boxed numbers, `^` a star (passive), `d` a skull (villain), `b`/`c` area-effect
  marks, plus boxed letters. Render with the `.ds-glyph` class (`font-family: "DrawSteelGlyphs"`).
  `ability-cards.js` injects these badges at runtime when it sees a Power Roll list.
- **Emoji as semantic markers.** Source Markdown prefixes ability blockquotes with 🗡 🏹 👤 ❗ ❇
  ⭐ ☠ 🌀 to classify them, and uses 📏 (distance) / 🎯 (target) inside info tables. MkDocs renders
  these as **Twemoji SVGs**. Treat emoji as a typed taxonomy, not decoration.
- **Material Design Icons** ship with the MkDocs-Material theme and appear only as small theme
  chrome (the light/dark toggle `material/toggle-switch`, the `octicons-arrow-right-24` on browse
  cards, search magnifier). If you need a UI utility icon, match that **thin-line Material**
  style. _(In throwaway HTML you may CDN-link Material Symbols / Octicons to approximate — flag
  it as a substitution.)_
- **The logo** is an **open-tome glyph** with a soft baked glow, shipped in three colorways
  (steel `#71797E`, white, black) as SVG + PNG (`@1x…@512`). Use white on dark, steel/black on
  light. It doubles as the favicon.

**Never** hand-draw new SVG icons or invent emoji cards for this brand — reach for the glyph font
or the bundled logo first, Material thin-line second.

---

## Font substitution note

The three brand display/body faces (**Beaufort W01 Heavy**, **Test Newzald**, **Berlingske Slab
Demibold**) are **commercial fonts**. `colors_and_type.css` loads them from the same onlinewebfonts
CDN the live site uses, so designs match exactly when online. If you need guaranteed-offline or
licensed files, **Source Serif 4** (Google Fonts, already imported) is the graceful fallback in
every stack. **Flag this** if you ship production assets — and ask the user for licensed font
files if pixel-exact brand type is required offline.
