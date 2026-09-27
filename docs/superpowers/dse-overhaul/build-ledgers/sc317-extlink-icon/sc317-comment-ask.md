**Ask: do these external-link arrows look right to you — the glyph, its colour and the gap after the word? Reply "good to go", or name what to change.**

Plugin links that leave the vault now end in a small box-with-arrow icon, drawn by the plugin itself. The example below is the SCC link "the Steel Compendium's own entry", which opens steelcompendium.io. The link "campaign notes on envoys" stays inside the vault, so it has no arrow.

**Dark (Steel dark), before, with no icon:**
{{IMG:sc317-r2-perk-links-dark-before.png}}

**Dark, after. The arrow follows "entry":**
{{IMG:sc317-r2-perk-links-dark-after.png}}

**Light (Steel light), before:**
{{IMG:sc317-r2-perk-links-light-before.png}}

**Light, after:**
{{IMG:sc317-r2-perk-links-light-after.png}}

What I chose, all open to your call:

- **Glyph:** Obsidian's own external-link arrow shape, taken from its app.css (unchanged from 1.13.7 to 1.14.2). Plugin links look the same as links in the note around the card.
- **Colour:** the arrow is painted in the link's own colour, so it is the same teal-cyan as the link text in both schemes and changes with it on hover. It is not a fixed colour.
- **Spacing:** a small gap after the last letter, with the arrow slightly smaller than the text.
- **Print:** no arrow. Obsidian also removes it when printing. Because of this, none of the frozen print screenshots changed, and there is no rebaseline to sanction.

{{IMG:sc317-r2-perk-links-print-after.png}}

The arrow cannot end up alone at the start of a line in normal text. The one exception is a single unbroken run wider than the whole line, such as a bare long URL in a narrow card. There the browser has to break the word, and the arrow may start the next line.

Also changed: the "View on steelcompendium.io" link in the card shown when a compendium is not installed now carries the arrow too. That link's colour is a separate, older issue, filed as SC-366.

---

Mechanics, for the record:

- dse branch `sc317-extlink-icon` @ `2897cc5` (base `develop` 619c4bd), superproject @ `ef62d70`.
- The icon is an inline `::after` holding a word joiner (U+2060), with the glyph drawn by mask-image in `currentColor`. It is scoped `:not([data-dse-print="on"])`, next to the SC-202 r4 GROUP 7 re-grounding, which stays as it is, so Obsidian's own icon still never leaks in.
- An absolutely positioned variant was tried and rejected. When the link wrapped next to another link, it drew the arrow on top of the other link's text.
- Battery: tsc and lint clean, jest 4044 passed / 1 skipped, lifecycle 19/19, shots 524 with 0 FAIL, freeze 260/260 unchanged, parity 0 GAPs / 0 undeclared / 16 declared.
- The inline host-leak sweep now also checks the arrow at rest, on hover and on focus.
- Independent review: approved after two fix rounds.
