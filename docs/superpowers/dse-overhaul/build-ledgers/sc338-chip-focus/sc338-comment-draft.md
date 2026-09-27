**Two questions about the option chips.** (1) Does the new keyboard focus ring look right? (2) Is it OK that unselected chips lose Obsidian's grey drop shadow? If both are yes, set Ready for Agent and the fix lands as it is.

The option chips are the Success / Failure / Assist buttons in the montage "Log an action…" form and the chips in the Conditions modal. They now use the same keyboard focus ring as every other DSE control: a 2px outline drawn 2px outside the chip.

**1. Focus ring**

Before this fix, a selected (pressed) chip showed no sign of focus at all. An unselected chip got only Obsidian's grey halo, which is too faint to see (under 2.3:1 contrast). The new ring measures 7.3:1 in dark mode and 4.9:1 in light mode. It appears only for keyboard focus; clicking a chip with the mouse draws no ring.

{{IMG:sc338-chip-focus-grid.png}}

How to read it: the left column is before and the right column is after. Top to bottom, the rows are dark theme with a selected chip, dark with an unselected chip, light with a selected chip, and light with an unselected chip. The focused chip is the one in the middle of each crop. The focus ring is the second outline, drawn around the chip with a small gap.

On a selected chip, the ring is the same teal as the chip's own selected border. You can still tell focused from selected by shape: focus adds a second outline outside the border, with a gap between them.

**2. Drop shadow at rest**

To keep Obsidian's grey focus halo from stacking under the new ring, the chips now opt out of Obsidian's button shadow, the same way every other DSE button already does. That opt-out also applies when the chip isn't focused. Unselected chips lose Obsidian's faint drop shadow in dark mode. In light mode they lose the grey double-border look. Selected chips don't change.

{{IMG:sc338-grid-rest.png}}

The left side is before and the right side is after. The top row is dark and the bottom row is light. Each row shows Success (selected), then Failure and Assist (unselected), none of them focused.

If you'd rather keep the drop shadow, the opt-out can be limited to the focused state only. That is a one-line change.

---

**Mechanics (no action needed):**

- Fix: `.dse-optchip:focus-visible` joins the shared kit focus-ring rule. `.dse-optchip` joins the SC-203 host re-grounding `box-shadow: none` list.
- The real-Obsidian camera's modal focus-ring check (from SC-334) used to skip the montage form. It now runs on the focused chip and passes.
- Gates: {{GATES}}
- Freeze: 260/260, unchanged. No frozen print bytes moved, so no rebaseline is needed.
- Review: independent review approved with nits; all nits fixed; scoped re-review {{REREVIEW}}.
- Split out, not in this change:
  - SC-361: the color swatches in the Conditions modal have the same focus problem. The simple fix makes a focused swatch look selected, so the swatches need their own small design.
  - SC-356: the button host-leak sweep never opens a real modal.
  - SC-360: a flaky jest test seen during review.
  - Moving the chips onto `kit/iconButton` (the ticket's "consider") is not done. iconButton shows selected as a solid accent fill; the chips show it as an accent border (DESIGN.md rule 7). Switching would be a redesign.
