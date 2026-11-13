**Two picks for the plugin's card header: should the crest icon be solid, and should the "◆ TRAIT" label be tinted? I recommend I2 (fill the icons we already have) and E-B (keep the label grey).** No code has changed yet, and nothing here changes print.

## 1. The icon inside the crest

The ticket said the site draws a filled version of our icon. That is only partly true. For 4 of the 6 action kinds the site draws a **different picture**, not a filled one:

- Triggered: the site shows a boxed "!", the plugin a lightning bolt.
- Move: the site shows a set-square, the plugin footprints.
- No action: the site shows a star, the plugin a dashed ring.
- Main action: the site shows crossed swords, the plugin one sword.

The site's own code calls these glyphs placeholders, and three of them are MCDM glyphs that mean something else ("Self", "Versatile", "Area of Effect").

The icon is also not smaller relative to its crest: it fills the same share of the crest on both sides. Only the crest is smaller, and SC-367 handles that. Whatever you pick here follows SC-367's size.

Options:

- **I2: fill our own icons (recommended).** The person, sword, bolt, footprints and star become solid shapes. The dashed ring stays a ring, and the villain skull stays an outline (a filled skull loses its face). Every kind keeps its own shape. This applies to ability and trait crests only. If it applied to every crest it would break 12 other icons; for example the stamina crest's "winded" would look the same as "healthy".
- **I1: use the site's glyph font.** This matches the site exactly. But "No action" and "Trait" would become the **same star**, told apart only by colour: pale grey vs purple. In light mode those are nearly the same lightness (0.49 vs 0.48). It would also put MCDM's CC BY-SA font inside the MIT-licensed plugin, and if MCDM releases the official glyphs we would have to follow the site's swap.
- **I3: thicker outline.** The lines go from about 2 px to 3 px. Still an outline, just bolder.
- **I4: leave as is.**

I filed SC-565 for the site's shared star and placeholder glyphs.

Rows top to bottom: **Today (plugin)**, **Site**, **I1**, **I2**, **I3**. Columns are the action kinds. Under each tile: the icon's name, size and ink area.

{{IMG:sc563-r1-q1-crest-icon.png}}

## 2. The "◆ TRAIT" label above a trait's name

On the site, the label above a trait card's name (word and diamond) is purple: light purple in dark mode, dark purple in light mode. The site does this on trait and class-feature cards only. Ability and kit-signature labels stay grey, as every label does in the plugin today.

The purple is almost the same lightness as the grey it replaces (0.71 vs 0.68 in dark, 0.48 vs 0.46 in light). So the change is nearly all hue, and you may barely see it. It is never the only signal: the word "Trait" and the star crest stay either way.

Options:

- **E-B: keep the label grey (recommended).** Nothing changes. Labels look the same on every card, which is DESIGN.md's rule.
- **E-A: copy the site.** Word and diamond in the trait purple, on trait cards only.
- **E-C: diamond only.** The ◆ turns purple, and the word stays grey.

**This interacts with SC-368 (card name colour).** With SC-368 option D (keep today's name colour, my pick there), the name stays the most prominent text under every option here. With SC-368 option A, in light mode the label ends up darker than the name whether or not it is purple. That comes from SC-368's A, not from the tint.

Rows top to bottom: **Today**, **Site**, **E-A**, **E-C**, **E-A combined with SC-368 option A**, and **SC-368 option A alone**. Left column is dark mode, right column is light mode. Under each tile: the label's colour, lightness and contrast, then the name's colour and lightness.

{{IMG:sc563-r1-q2-trait-eyebrow.png}}

## How to answer

Reply with one pick per question, for example "I2, E-B". If you pick I4 and E-B, this ticket closes with no code change.

---

Mechanics:

- Measured at dse `develop` `6270e84a`: the plugin's visual harness at 900x1200, and the live site at 1440x900, both at 2 image px per CSS px.
- Print: the crest and the label are hidden in print and realprint. 0 of 280 frozen print lines move under any option. A screenshot run with every option applied at once passed the freeze check 280/280.
- Screen captures that change (not frozen): I1 or I2 changes 18 test cards, I3 19, E-A or E-C 4, in both schemes.
- Parity: no parity pair covers the crest icon or the label, so the declared count stays 24.
- Whatever you pick for question 1, I will add a line to DESIGN.md's Iconography section saying what the crest icons are.
- The CSS goes in a new block after `styles-source.css:8858`, clear of the lines SC-367 and SC-368 would change.
