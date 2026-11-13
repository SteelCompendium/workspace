**Done and ready to land: ability and trait crests in the Steel theme now show the site's solid Draw Steel glyphs instead of thin outline icons (your pick I1). The "◆ TRAIT" label stays grey (your pick E-B).** Nothing is needed from you.

What changes on screen:

- Maneuver shows a person, main action crossed swords, triggered a boxed "!", move a set-square, and No action and Trait a solid star. These are the same glyphs, in the same colours, as the site.
- Abilities inside statblocks get the same glyphs.
- The villain action crest keeps its outline skull, as in the row you approved, because the site has no villain crest on ability cards. The font does include MCDM's own villain glyph, a solid skull. Say so if you want it used; otherwise it stays as is.
- Every other crest (stamina, kit, class, project) is unchanged. Print is unchanged.

Rows top to bottom: **Before**, **After**, **Site**, in dark mode and then light mode. Columns are the action kinds. Under each tile: the glyph and its colour with lightness.

{{IMG:sc563-r2-crest-before-after-site.png}}

The font is MCDM's Draw Steel Glyphs, licensed CC BY-SA 4.0. It ships unmodified inside the plugin's stylesheet. The plugin's README credits it, and the licence notice is kept in the released `styles.css`. Review caught that the build was stripping that notice; it is fixed, and the Source Serif 4 credit got the same fix.

---

Mechanics:

- dse `develop` branch: `04e57b67`, `10fcb6d3`, `1516f894` on `c0995beb`. Workspace: two docs commits (DESIGN.md Iconography, CHANGELOG) and one pointer bump `92be5319`.
- Gates: jest 11692 passed / 2 skipped · lifecycle 61/61 · e2e 328/331 ok, 0 failed, 3 known-bug, coverage 174/174 · shots 592, 0 FAIL · freeze 280/280 (no print change) · parity 0/0/24. 76 screen shots change (38 cards, dark and light).
- The font family is namespaced as "DSE DrawSteelGlyphs" so other plugins or themes can't override it. Stylesheet size grows by about 30 KB.
- Filed along the way: SC-565 (the site's No action and Trait crests share one star, told apart only by colour), SC-622 (the Obsidian camera tool leaves the demo vault dirty), and SC-623 (the bundled Source Serif 4 subset and the OFL font-name clause).
- SC-367 (crest size) and SC-368 (name colour) are still waiting on you. Whichever lands next rebases over this change; the glyph size scales with the crest.
