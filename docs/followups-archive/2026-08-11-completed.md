# Follow-ups archived 2026-08-11

## (was #49) Legacy theme has no markdown-table styling at all, including the new scroll frame
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 4 (batch-3 review L-5 fix) — dse `d94e025`
- **What:** Batch 3's C-6 table baseline and Batch 4's `.dse-md-table` scroll frame are both
  Steel-only + print-excluded, so under the Legacy theme (and in print/PDF export) a book
  pipe-table is still unstyled AND still overflows its card at narrow width — measured
  380px of table in a 300px leaf.
- **Why:** Legacy is still a shipping theme and the compendium's mini-statblocks are common.
  The overflow half of this is arguably a bug rather than a styling choice.
- **Context:** `styles-source.css` §7, `table:not([class])` + `.dse-md-table` rules. The
  wrapper ELEMENT is emitted in every theme (`src/framework/mdTableWrap.ts` runs from
  `ElementView.renderMarkdown`), so a Legacy fix is CSS-only — but any Legacy-scoped rule
  changes the frozen `*--legacy-*` bytes and needs a sanctioned rebaseline (see the
  `dse-verify` skill's freeze section). `perk-narrow--legacy-dark.png` is now a pinned
  fixture showing exactly this state.
- **Effort:** S (1–4 h)

> Closed by SC-144 (2026-08-11): the legacy theme was removed, so the unstyled-table
> surface no longer exists. Steel's own table styling (SC-121) is now the only rendering.
> Print/PDF export still shows the unstyled table — that half of the finding lives on in
> the SC-121 changelog entry, not here.

