**Ask: choose a size for Steel section titles (the small-caps "◆ EFFECT" / "◆ TRIGGER" strip labels). Reply A (18px), B (15px, recommended) or "leave" (16px).**

Today every Steel section title is 16px with 0.07em letter spacing. The ticket said the site's is a size larger: 18px with 0.1em spacing. That is true of the CSS numbers, but not of what you see. On the site the letters are drawn smaller than today's plugin letters.

The reason: both sides use small capitals, but differently. The site's font (Petrona, from Google Fonts) has no small-capital letters, so the browser fakes them by shrinking ordinary capitals to 70%. The plugin's font (Source Serif 4) has real small-capital letters, which come out taller. So the same 18px setting produces shorter letters on the site than in the plugin.

Measured on the live site and on the plugin, at 1 image pixel = 1 CSS pixel:

| | Setting | Letter height | Width of "EFFECT" |
|---|---|---|---|
| Site | 18px, 1.8px spacing | 8px | 55px |
| Today | 16px, 0.07em spacing | 9px | 60px |
| **A** (this branch) | 18px, 0.1em spacing | 10px | 68px |
| **B** | 15px, 1.8px spacing | 8px | 62px |

- **A** copies the site's CSS numbers. Letters end up 2px (25%) taller than the site's.
- **B** matches the site's letter height. The words stay a little wider and bolder than the site's, because the plugin's letters are real, heavier small capitals.
- **Leave** keeps today's 16px. Letters stay 1px taller than the site's.

I recommend B, because it is the closest match to what the site looks like.

{{IMG:sc235-glyph-zoom.png}}

The first image is the word "EFFECT" enlarged 6 times, one row per option, so you can compare letter height directly. The labels give the measured sizes.

{{IMG:sc235-compare-wide.png}}

The second image shows real cards, one row per card family (ability, statblock, kit). The columns, left to right, are **Today**, **A (this branch)**, **B** and **Site**. Every column is at the same scale.

Narrow cards: with A, the longest title, "Special (2 Malice)", wraps onto two lines on a 300px-wide card. At 240px, "(2 Malice)" also wraps on statblocks. No word breaks in the middle. The third image shows Today and A at those widths. B adds no wraps at either width (measured).

{{IMG:sc235-compare-narrow.png}}

**Pairing with SC-232 (card-name size).** SC-232 is back in progress for the missing head slots you pointed out, and its size question will come back with that work. Both tickets measure the same way: CSS pixels against the live site. SC-232's earlier ask said that picking its option A and this ticket's site-size option keeps the two consistent. That still holds for the CSS numbers. The difference here is visual only. Card names are ordinary letters, so matching the pixel size there also matches what you see. Section titles are small capitals, and the site fakes its small capitals, so here the CSS pixels and the visible size come apart. Choosing A on SC-232 and B here is not a contradiction: both make the plugin look like the site.

Nothing else moves:

- Print and export are untouched. The freeze check reads 260 of 260, so no rebaseline is needed.
- The "Spend" chip keeps today's size.
- No other text on any card changes size. This was measured on every capture.

---

Mechanics:

- Branch `sc235-section-title-scale`, dse `845a491` on `develop` `5a20d5f`; superproject `d3787af`.
- The rule is `font-size: calc(var(--dse-fs-body) * 1.125); letter-spacing: 0.1em` in the Steel screen-only section-title rule. It scales exactly ×1.125 with Obsidian's text size and the modal text-scale setting.
- Gates: tsc and lint clean. jest 4122 tests, 0 failed (the base has 4119; this branch adds 3). Lifecycle 19/19. Shots 532, 0 fail. Freeze 260/260. Parity: 0 gaps, 0 undeclared, 10 declared.
- A deletes the three `section-tag` declared rows (16 → 10 declared). Reverting the CSS makes the gate fail with 6 gaps.
- B would re-declare those rows, citing this ticket and the fake-small-caps reason. "Leave" keeps them and corrects their citation. If you choose B or "leave", the branch is reworked before landing; nothing has landed.
