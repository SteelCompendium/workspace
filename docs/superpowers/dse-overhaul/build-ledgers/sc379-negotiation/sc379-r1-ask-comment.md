**Pick a layout for the negotiation tracker: A, B or C. I recommend C. Two yes/no questions follow.**

These are static mockups on the real Steel materials. Nothing is built yet, and nothing gets built until you pick.

## What you're deciding

1. **Which layout: A, B or C?**
2. **If C:** is it OK that "Learn Motivation/Pitfall" stops being a tab and becomes a fold-out panel under the argument, closed by default? C also works with the two tabs kept.
3. **All three add a "negotiation over" band.** When Patience hits 0, or Interest hits 0 or 5, a gold-ruled band with a flag icon says "Final offer" and quotes the outcome, and Complete Argument switches off. Today's tracker shows nothing when the negotiation ends. Keep it? I recommend yes.

A reply like "C, yes, yes" is enough.

## Today (for comparison)

{{IMG:sc379-r1-before-default-dark.png}}

Patience is a horizontal 0–5 track and Interest is a vertical list, so the same kind of value is drawn two different ways. The motivations appear twice, once as checkboxes inside the tab and once in the list at the bottom. The chosen result row (12–16 here) is almost impossible to tell from the others.

## A — "Offer Ladder" (the safe one)

{{IMG:sc379-r1-A-default-dark.png}}

Same order as today, rebuilt in Steel. Patience is a row of five pips: filled steel-grey up to the current value, hollow dashed outlines above it. Interest is a framed ladder; the current rung has a teal outline, a filled teal number and a "NOW" tag. The tabs stay.

Weakness: it still draws the two values two different ways, it still has two motivation lists, and it is the longest card.

Sidebar width (300px):

{{IMG:sc379-r1-A-default-dark-narrow.png}}

## B — "Console" (the dense one)

{{IMG:sc379-r1-B-default-dark.png}}

Two panes. The left pane shows Interest and Patience as two identical gauges, plus a "Current offer" card. The right pane holds the tabs. Each result row gets a small box showing where that roll would leave both values (for example "→ I4 · P2"). That box is new information the tracker doesn't show today.

Weakness: at sidebar width the six outcomes fold away and only the current offer shows, so five outcomes are a click away. Interest also appears twice at full width.

Sidebar width (300px):

{{IMG:sc379-r1-B-default-dark-narrow.png}}

## C — "Standing Board" (recommended)

{{IMG:sc379-r1-C-default-dark.png}}

One board with rows 5 down to 0. The Interest outcomes fill the wide column; the current row has a teal outline, bold text and a "NOW" tag. Patience is a steel-grey bar in the right-hand column that rises from a round bulb at 0 up to the current value, so both values read against the same scale.

The motivations appear once. Each row carries its own "Appeal" and "Mark spent" buttons, so the second checkbox list is gone. A spent motivation gets a hollow diamond, a struck-through name and a pressed "Spent" button. Pitfalls are marked with an orange warning triangle; motivations with a diamond. The shape tells them apart, not the color.

Why C: it is the only one that fixes all three faults in today's tracker (two styles for one kind of value, two motivation lists, no sign the negotiation has ended). It is also the most work, about two build rounds against one for A.

Its one bet: Patience sitting beside the outcome rows could be misread as "this patience level goes with this outcome". The separate column header and the bar shape are meant to prevent that. Say so if it reads wrong to you.

Light theme:

{{IMG:sc379-r1-C-default-light.png}}

Sidebar width (300px):

{{IMG:sc379-r1-C-default-dark-narrow.png}}

Question 2 — "Learn Motivation/Pitfall" folded open under the argument:

{{IMG:sc379-r1-C-learn-dark.png}}

Question 3 — the "negotiation over" band (Patience 0, final offer at Interest 3). A and B show the same band:

{{IMG:sc379-r1-C-ended-dark.png}}

## Fixed whichever layout you pick

- The chosen result row gets a teal outline, a check mark and the word "CHOSEN".
- Complete Argument can no longer write Interest or Patience outside 0–5 into the note (today it can write −1 or 6).
- The result rows update as soon as you tick a motivation or pitfall.
- The tooltip that says appealing to a motivation makes the test "Easy" is corrected to the book's wording, "medium".
- Greyed-out modifiers say why they are unavailable.

## For the record

- No change to the YAML you write in the note, in any layout.
- The build will change the six frozen negotiation print shots. I'll bring that sanction ask with before/after images when the build is ready; it is not part of today's decision.
- Filed SC-380 (Backlog): move the montage tracker and the recoveries strip onto the shared pip-track part this ticket will build.
- Mockups: `draw-steel-elements/visual-harness/sc379/` on branch `sc379-negotiation` @ `be4b734`. Full design report: `.superpowers/sdd/sc379-negotiation/sc379-r1-design-report.md`.
