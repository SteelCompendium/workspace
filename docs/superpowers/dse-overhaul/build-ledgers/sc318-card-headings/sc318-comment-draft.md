**Ask: which heading sizes do you want inside plugin cards — A (on the branch, recommended), C, or leave as is?** Reply with the letter. Optionally also reply "sanctioned" to freeze the new heading-ladder print capture (details at the bottom).

**What changes with A:** a `######` heading inside a card goes from 10.7px (smaller than the text around it) back to 16px, the hero card's CHARACTERISTICS title goes from 18.7px back to 21.1px, and a `###` heading after a paragraph gets its 40px gap back. These are exactly the sizes the plugin showed in a real vault before SC-202, and the sizes print/PDF export already uses today. A only changes the screen; print and export do not move.

{{IMG:sc318-ladder.png}}
*Every heading level in one card body, same scale in all three columns. Left: today (browser defaults). Middle: A. Right: C. Each heading is labelled with its measured size. The card name ("HEADING LADDER") is at the top of each column for comparison.*

The three options:

- **A — Obsidian's own heading scale** (recommended). h1 25.9 / h2 23.4 / h3 21.1 / h4 19.0 / h5 17.2 / h6 16px. Screen, print, and the vault note around the card all use the same heading sizes. One cost: a `###` heading (21.1px) is 1.1px bigger than today's 20px card name. If you pick the larger card names on SC-232, that goes away, except on narrow screens where SC-232 keeps names at 20px.
- **C — a compact card scale.** h1 20 / h2 19.2 / h3 18.4 / h4 17.6 / h5 16.8 / h6 16px. No heading is bigger than the card name. But screen and print would then differ (print keeps Obsidian's scale unless we also change print, which would need a rebaseline of 86 print captures).
- **Leave** — today's browser defaults (h6 10.7px, below body text).

The site's own heading sizes were measured and ruled out. The site renders these bodies as full pages, so its headings are page-sized: h6 is 28px and h3 is 48px, bigger than any card name.

{{IMG:sc318-before-after.png}}
*Real content, today (left) vs A (right): the perk's "Familiar Statblock" h6, the hero CHARACTERISTICS title, the ancestry "On Humans" h3 after a paragraph, and the initiative tracker's "Enemy groups" h3 and group-name h4.*

Two smaller notes:
- The screen matches print exactly at Obsidian's default text size. At other text sizes the heading sizes still match, but the gaps around headings on screen grow with the text while print keeps fixed gaps.
- The "Ability Header" row in the ladder (an h6 inside a quote block, used by 20 complication, title and treasure pages) grows from 10.7px to 16px too.

Not changed: the hero card's own name stays exactly as it is (card-name sizes are SC-232's question). Section titles (SC-235) and card names (SC-232) are untouched, and this does not change the parity check's declared count.

**Optional — "sanctioned":** the branch adds a new test capture (the heading ladder above). Its two print versions are new files, not yet in the frozen print baseline. "sanctioned" adds those 2 lines (260 -> 262) at landing so print regressions in headings get caught. Nothing existing moves. Without it, the capture still runs on screen, just unfrozen.

---
Mechanics:
- Branch `sc318-card-headings`: dse `2c55304` (10 commits on develop `5a20d5f`); workspace `af2f90a` (CHANGELOG bullet, six D3 token-map rows, pointer bumps).
- Gates: jest 4144 passed / 1 skipped, 0 failures; lifecycle 19/19; shots 536, 0 FAIL; freeze 260/260 (0 frozen bytes moved); parity 0 gaps / 0 undeclared / 16 declared.
- Independent review: two fix rounds, now 0 open findings. One of those rounds caught and fixed an accidental print change to the skills block's group title.
- Narrow (300px captures): 0 new line wraps, 0 mid-word breaks.
- New tokens `--dse-fs-h1..h6` replace SC-202's browser-default restatements.
- Filed along the way: SC-372 (the "Large text" preference has no effect on any plugin font size; this predates SC-318).
- If you pick C or leave, the branch is reworked before landing. If you pick A, it lands as is.
