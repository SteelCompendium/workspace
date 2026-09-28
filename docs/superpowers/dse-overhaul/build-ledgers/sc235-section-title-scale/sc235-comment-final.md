**Done, waiting to land: Steel section titles are now 15px with 1.8px letter spacing, so their letters are the same height as the site's (8px).** Nothing to decide. This is option B, the one you approved.

{{IMG:sc235-final-B.png}}

How to read the image: there is one row per card family (ability, statblock, kit). The columns, left to right, are **Today (16px)**, **This branch (15px)** and **Site**. Every column is at the same scale: 1 image pixel is 1 CSS pixel. The caption under each cell gives the measured letter height.

What changes and what doesn't:

- Only the section titles change size. No other text on any card moves; this was measured on every capture.
- The "Spend" chip keeps today's size.
- Narrow cards gain no new line wraps at 300px or 240px.
- Print and export are untouched. The freeze check reads 260 of 260, so no rebaseline is needed.

---

Mechanics:

- Branch `sc235-section-title-scale`, dse `6dca388` on `develop` `5a20d5f`; superproject `4e3498b`.
- The rule is `font-size: calc(var(--dse-fs-body) * 0.9375); letter-spacing: 0.12em`. It is in the Steel screen-only section-title rule. It scales exactly with Obsidian's text size and the modal text-scale setting.
- Parity declares 14 rows (develop has 16). The section title's size and line height are declared again, citing this ticket. The site fakes its small caps, so matching the letter height means a smaller CSS size than the site's. Letter spacing now matches the site exactly (1.8px), so it is no longer declared.
- Gates: tsc and lint clean. jest 4122 tests, 0 failed (the base has 4119; this branch adds 3). Lifecycle 19/19. Shots 532, 0 fail. Freeze 260/260. Parity: 0 gaps, 0 undeclared, 14 declared.
- An independent re-review passed it.
