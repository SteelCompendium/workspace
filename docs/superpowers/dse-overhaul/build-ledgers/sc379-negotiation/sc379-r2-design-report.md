# SC-379 r2 — two-axis variants of A (report)

**Executive summary**
- **A1, "A, tightened":**
  - **Shared mark on both axes.** Patience and Interest use the same round numeral seal: a horizontal rail of seals for Patience, a vertical rail for Interest. The only visible difference between them is the axis.
  - **One set of motivation controls.** There is now a single place to set appeals: Appeal / Spent / Mention buttons on the Motivations and Pitfalls cards. The tab shows a read-only "This argument" line instead of its own checkboxes.
- **A2, "framed standing board":** one frame drawn like a chart. Patience is a ruler along the top edge (x-axis, labelled "PATIENCE →"). Interest is the rungs down the side, with a vertical "INTEREST ↑" axis title. The ruler's ticks do not line up with any rung column.
- **A3, "argument clock":** the Interest ladder sits alone under the head. Patience becomes a strip of pips fused to the top of the argument tabs ("arguments before the final offer"), so each value sits beside the thing that changes it.
- **Recommendation: A1.** It makes the axis the only thing that differs between the two gauges: same mark, same current-value treatment, one horizontal and one vertical. That is the cleanest reading of "different axes". It also removes the duplicate motivation list, the clearest usability fault from round 1. It costs about the same as plain A.
- **A2 is the alternative** if Scott wants the axes labelled outright. Its risk is that a chart frame invites a "plot point" reading.
- **A3 splits the two values apart,** so the card loses its one-glance standing.

All 12 PNGs are in this directory, named `sc379-r2-<A1|A2|A3>-<default|ended>-<dark|light>[-narrow].png`.
- **States:** the default and ended states are the same as round 1. Default is Interest 3 / Patience 3 / Peace spent / Higher Authority appealed / 12–16 chosen. Ended is Patience 0 at Interest 3.
- **Mocks:** `draw-steel-elements/visual-harness/sc379/mock.html?cand=A1|A2|A3`. Sheet: `round2.css`, layered on round 1's `sc379.css`.
- **Camera:** `node visual-harness/sc379/shoot-sc379.mjs <outDir> --round=2`.

**Carried over from round 1 into every variant, unchanged:**
- **The approved ended band:** a gold flag, a 2px gold top rule (`--dse-vp`, warm gold #e0b050 in dark, dark bronze #66450a in light) and the words "Final offer".
- **Current value:** a teal ring plus a solid teal seal plus the word "now" (`--dse-accent`, bright teal #4db8c7 in dark, deep teal #2a7b88 in light).
- **Remaining vs. spent:** remaining patience is steel-grey (silver in dark, gunmetal in light); spent slots are dashed and hollow.
- **Motivation vs. pitfall:** solid diamond ◆ for an open motivation, hollow diamond ◇ plus strike-through plus "spent" for a spent one, an orange warning triangle for a pitfall.
- **Chosen tier row:** a teal ring plus a check plus the word "chosen".
- **Unchanged:** the kit tabs (Learn stays a tab), `--dse-fs-*` sizes only, radio semantics on every value control, and no YAML change.

## A1 — A, tightened

`sc379-r2-A1-default-dark.png` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What changed from A.**
1. **One seal vocabulary on both axes.**
   - Every value slot on both widgets is the same round numeral disc. The current value is a solid teal disc inside a teal ring, on both axes.
   - Patience seals are filled steel-grey while that patience remains and dashed-hollow once it is spent. A's rectangular pips are gone.
   - Interest seals are hollow steel rings.
   - **Patience** sits on a horizontal rail: a solid steel bar up to the current value, dashed beyond it.
   - **Interest** sits on a vertical steel rail running through every rung's seal.
   - So the two gauges read as siblings that differ only in direction.
2. **One motivation list.**
   - The in-tab "Appeals to Motivation" and "Mentions Pitfall" chips are removed.
   - Each Motivations card row carries **Appeal / ✓ Appealed** and **Mark spent / ✓ Spent**. Each Pitfalls row carries **Mention / ✓ Mentioned**.
   - The argument tab opens with a read-only **"THIS ARGUMENT ◆ appeals to Higher Authority"** line, with the hint "set on the Motivations and Pitfalls cards below". When nothing is set, the line reads "no Motivation or Pitfall" in italics.
   - The roll's inputs stay visible next to the roll, without a second set of controls.

**At a glance.** Two identical gauges, one horizontal (Patience 3 of 5, steel bar up to a teal seal) and one vertical (the teal seal on rung 3, ringed and tagged "now"). Each motivation's whole status is one row on one card.

**Kit parts:** as A (cardHead + crest, iconButton, tabs, powerRollPanel, `.dse-optchip`, Steel checkbox).
**New parts:**
- one shared `seal` mark, which replaces both A's pip and A's rung seal;
- the axis rail;
- the summary line.

**Size vs A:** about the same.
- The CSS is smaller, because one seal replaces two marks.
- Moving the appeal and mention toggles out of `ArgumentView` into `MotivationsPitfallsView` is a small restructure. The model is unchanged: the same `currentArgument.motivationsUsed` and `pitfallsUsed`.

**At 300px:**
- The Patience label and readout ("PATIENCE … 3 / 5") share the first line; the six seals sit on their own full-width line below.
- At this width the seals shrink to a 1.6em diameter with caption-size numerals. They are tight but do not touch.
- The current rung stacks its "now" tag under the outcome.
- The cards stack, and their chips wrap inside the card.

**Weakness:**
- With six seals at 300px the Patience rail is the densest part of the card.
- Appeals now happen *below* the tabs, while the roll they change is *inside* them. The summary line bridges that, but the Director's hand moves down, then up.

## A2 — one framed "standing" board, two axes

`sc379-r2-A2-default-dark.png` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What changed from A.** Patience and Interest share **one frame**, drawn like chart axes.

**X-axis (the frame's top edge)**
- The header band carries "⧗ PATIENCE →", a ruler, and a "3 / 5" readout.
- The ruler is a track running 0 → 5 left to right. A solid steel fill runs up to the current stop, with a dashed track beyond it.
- Every stop has a numeral under it. Remaining stops are steel-grey dots, spent stops are dashed dots, and 0 is a hollow ring.
- The current stop is a larger solid teal dot inside a teal ring, and its numeral is in heading colour.

**Y-axis (down the left edge)**
- A narrow dark column carries a vertical "INTEREST ↑" title that reads bottom-to-top.
- Next to it are the six rungs, with A1's seal vocabulary on a vertical rail.

**Avoiding a grid reading.** The ruler's ticks are spaced along the band independently of anything below, and the band's hairline separates the two axes. So nothing lines up into a grid cell: it reads as two independent gauges in one frame. The tabs and cards are A's, unchanged; A1's merged cards can be layered on.

**At a glance.** One instrument: Patience across the top, Interest down the side, a teal marker on each.

**Kit parts:** as A.
**New parts:**
- the ruler: a radiogroup of positioned stops over a track;
- the vertical axis title, using `writing-mode`. Note: the up-arrow is a Lucide arrow-down icon inside a container turned 180°;
- the framed board;
- the shared seal from A1.

**Size vs A:** A plus about 15%. The positioned-stop ruler is the most layout-sensitive part. It needs its own keyboard and spacing tests, and a decision about whether the stops become a container query.

**At 300px:**
- The ruler drops to its own full-width line under "PATIENCE → 3 / 5", with every numeral legible.
- The y-axis column narrows to 1.75em.
- The outcomes wrap to 2–3 lines and nothing clips.

**Weakness:**
- **The chart metaphor cuts both ways.** It makes the two axes impossible to miss, but a frame with an x-axis and a y-axis invites the reader to look for a plotted point. That is the reading Scott rejected in C. The independent spacing and the band hairline are the defence, and they may not fully land.
- It is the most "designed" of the three, so it carries the most CSS.

## A3 — Patience as an "argument clock" above the tabs

`sc379-r2-A3-default-dark.png` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What changed from A.** Only placement.

- **Interest** is A's ladder, alone, directly under the head (vertical).
- **Patience** moves down and is fused to the top of the argument tabs as one unit. A sunken strip shares its border with the tab row:
  - "⧗ PATIENCE" with the hint "arguments before the final offer";
  - A's pips: a round 0 floor, steel-grey pips while patience remains, dashed hollow once spent, and a teal ring on the current pip;
  - a "3 / 5 left" readout.
- The tier rows show nothing new.
- In the ended state, the gold band sits between the ladder and the clock.

**At a glance.** The top of the card says where the deal stands (Interest). The clock says how many arguments remain, right where the next argument is built.

**Kit parts:** as A.
**New parts:** the clock strip; A's pips, reused.
**Size vs A:** about the same. It is mostly reordering in `NegotiationView` plus the strip's CSS.

**At 300px:** the strip stacks into three lines: "⧗ PATIENCE … 3 / 5 left" on the first, the hint on the second, the pips full width on the third. The tabs follow.

**Weakness:**
- The two values are no longer together. To read the standing you look at the top of the card and at the middle, so the one-glance summary A had is gone.
- On a long card the clock can sit below the fold, under a tall ladder, in a sidebar.
- It is the variant least changed from A, so it does least for "make the axes stronger".

## Print

Same as round 1. Every variant replaces negotiation's DOM, so all 6 of negotiation's frozen print lines move: `negotiation`, `negotiation-checked` and `negotiation-pr-checked`, each in print and realprint. Nothing else's print moves: the rules are negotiation-scoped, and the shared kit grammars are consumed, not edited.

## Follow-ups

1. **Round 1's follow-ups 1–8 still stand, unchanged** (`sc379-r1-design-report.md`):
   - no 0–5 clamp on Complete Argument;
   - no end-of-negotiation detection in the shipped element;
   - the tier tables rely on a re-render after the note write;
   - the "Easy" vs "medium" tooltip/rules mismatch;
   - the harness viewport truncates tall captures;
   - the kit's checked-row state is weak;
   - the kit has no shared track-slot part;
   - the mock-only rgba literal.
2. **Mock-level: the A1/A2 vertical rail overshoots at 300px.** The rail is a single line from 1.4em below the top of the list to 1.4em above its bottom. When a rung wraps to three lines, the rail pokes out slightly above seal 5 and below seal 0 (`sc379-r2-A2-default-dark-narrow.png`). Implementation should draw the rail per row, from seal centre to seal centre. Cosmetic; not fixed in the mock.
3. **A1 changes where appeals are entered.** Today they are set inside the "Make an Argument" tab; in A1 they are set on the cards below it. User docs (`docs/` for the negotiation element) and any onboarding text that says "tick the motivation in the Make an Argument tab" will need updating with the implementation.
