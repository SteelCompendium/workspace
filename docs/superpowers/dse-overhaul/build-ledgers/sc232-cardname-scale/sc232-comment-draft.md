**Ask: choose a size for Steel card names. Reply A (match the site in each family, which is what this branch does), B (one shared 27px), or "leave" (drop the change).**

Today every Steel card name is 20px. This branch sets each family's name to the size the site uses:

- kits, traits and nested sub-features: 27px
- projects: 28.8px
- ability cards, including a kit's signature ability: 33.3px
- featureblocks: 37.8px
- statblocks: 41.4px

{{IMG:sc232-compare-wide.png}}

How to read the image: there is one row per card family, labelled on the left. The four columns, left to right, are **Today**, **This branch (A)**, **Option B (shared 27px)** and **Site**. Every column is at the same scale: 1 image pixel is 1 CSS pixel. Only the plugin's name size changes between the first three columns.

The ticket's "83% of the site" was wrong. The site's root font is 20px, not 16px, and its heading scale is 0.9, so its names are larger than the ticket assumed. Measured on the live site and compared in raw pixels (the same way the parity gate compares everything), today's plugin names are 74% of the site on kits and traits, 60% on ability cards, 53% on featureblocks and 48% on statblocks.

Narrow cards do not change. When a card head is narrower than 480px (a sidebar or a thin pane), names drop back to today's 20px, so nothing wraps worse than it does now. The second image shows 300px-wide cards, Today on the left and this branch on the right; the pixels are identical. Once SC-284 (narrow head stacking) lands, the narrow size could be revisited.

One in-between case to know about: on a statblock between about 480px and 590px wide, the statblock's own name is already at the new 41.4px while the sub-feature names inside it, whose heads are narrower, are still at 20px. The site shrinks its statblock name to 33.3px in that range; this branch does not. No word breaks mid-word there.

{{IMG:sc232-compare-narrow.png}}

Nothing else moves:

- Print and export are untouched, so the freeze check reads 260 of 260 and no rebaseline is needed.
- No other text on any card changes size; this was measured on every capture.

**Pairing with SC-235 (section-title size).** Both tickets measure the same way: raw pixels against the live site. SC-235 compares section titles at 16px in the plugin against 18px on the site. If you pick A here, choosing its site-size option there keeps the two consistent.

Filed from this work, both in Backlog:

- **SC-367:** the crest, eyebrow and right-rail titles are also 60–80% of the site's size.
- **SC-368:** the name colour differs from the site. The plugin uses one accent colour for every family. The site uses the page's normal text colour on kits and traits, and a dimmer steel tone on ability cards, statblocks and featureblocks.

---

Mechanics:

- Branch `sc232-cardname-scale`, dse `bd2087e` on `develop` `b029baa`.
- Gates: tsc and lint clean. jest 4101 passed / 1 skipped (the same as the base). Obsidian lifecycle 19/19. Shots 524, 0 fail. Freeze 260/260. Parity: 0 gaps, 0 undeclared, 26 declared.
- The 10 new declared rows are the name-colour gap, parked under SC-368.
- The gate can now see the name, through new per-family parity pairs.
- `.dse-head` becomes a size container (Steel screen only), with the same name and type as SC-284's, so the two branches can land in either order.
- If you choose B or "leave", this branch is reworked before landing; nothing has landed.
