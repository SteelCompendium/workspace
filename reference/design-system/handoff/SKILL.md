---
name: steel-compendium-design
description: Use this skill to generate well-branded interfaces and assets for the Steel Compendium (the Draw Steel TTRPG web compendium and ecosystem), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, the Draw Steel glyph icon font, logos, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and
create static HTML files for the user to view. If working on production code, you can copy assets
and read the rules here to become an expert in designing with this brand.

## What's here
- `README.md` — full context: sources, content fundamentals, visual foundations, iconography.
- `colors_and_type.css` — **all design tokens** (dark + light color vars, font stacks, type
  scale, radii, shadows) plus semantic element styles and the `.ds-glyph` / `hr.sc-rule` helpers.
  Link this first in any new HTML and theme via `data-md-color-scheme="slate"` (dark, the signature
  look) or `"default"` (light).
- `fonts/DrawSteelGlyphs-Regular.otf` — the game's icon font. `!`=≤11, `@`=12–16, `#`=17+ power
  tiers; boxed digits, skull, star, area glyphs.
- `assets/` — logo (steel/white/black, SVG+PNG) and favicon.
- `preview/` — 20 reference cards for every token & component.
- `ui_kits/compendium/` — interactive React recreation of the web app; lift `AbilityCard`, the
  category cards, browse-index chips, nav/tabs, and search modal.

## Defaults to honor
- Dark steel charcoal surfaces, ONE bright steel-teal accent, heavy UPPERCASE display type
  (Beaufort) + slab-serif body (Berlingske), 1px hairline borders, flat-at-rest cards that lift
  on hover, the ◆ diamond divider, and the glyph font for game iconography. No gradients, no
  decorative emoji, no invented SVG icons.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.
