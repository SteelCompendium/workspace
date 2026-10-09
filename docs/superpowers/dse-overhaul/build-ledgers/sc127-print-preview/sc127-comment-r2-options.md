**One decision from you: should the print preview show a frame around each white page, or not? My recommendation is no frame (option A below). If you say nothing, A is what ships.** Implementation of A is already under way; a frame is one extra paint-only rule on top of it, so your answer does not stall anything.

## What you're approving

1. **Frame or no frame.** A = each element becomes a white page with black text, edge to edge, sitting on the dark note. B = the same page with a 12 px white margin and a thin light-grey hairline around it, so it reads like a sheet on a desk. (A shadow variant of B was also rendered; on a dark note the shadow is invisible, so it only ever shows in a light vault. I would not pick it.)
2. **Native controls go light too.** Under A, the plugin's inputs, buttons, steppers, checkboxes and links inside the preview switch to Obsidian's light-theme look, matching what the PDF export shows. The alternative (option C, rendered last) keeps them dark: charcoal number fields with pale digits on the white page, and the initiative tracker's malice-log button becomes charcoal text on a charcoal button and disappears. I recommend against C; it is shown so the trade-off is visible.

## The pictures (dark theme, Print preview ON, statblock; tops of the cards)

Before — today's bug. Black title and dark-grey labels on the charcoal card; the "Signature Ability" box appears white only because the mouse was resting on it:

{{IMG:sc127-r2-before-statblock-dark-top.png}}

Option A (recommended) — white page, black text, no frame:

{{IMG:sc127-r2-A-statblock-dark-top.png}}

Option B — the same page with a white margin and a light-grey hairline frame:

{{IMG:sc127-r2-B-statblock-dark-top.png}}

Initiative tracker under A — the number fields, buttons and checkboxes take the light look:

{{IMG:sc127-r2-A-initiative-dark-top.png}}

Initiative tracker under C (not recommended) — same page, but the controls stay dark-themed; the malice-log button's label vanishes (charcoal on charcoal):

{{IMG:sc127-r2-C-initiative-dark-top.png}}

## Why A, in one paragraph

A fixes every measured failure: in the dark-theme preview the count of text below the 4.5:1 readable-contrast line drops from 162 nodes to 7, and those 7 are a separate, pre-existing issue (the "Leader" / "Signature Ability" / "Villain Action" chips print light grey on white on every print surface including the real export — filed as SC-348, kept out of this ticket because fixing it would move the real-print shots). The light-theme preview and the real PDF export do not change at all: zero of the 130 real-print harness shots move. B's frame shows up in only 62 of the 130 frozen preview shots, paints 13 px outside the element over the neighbouring note text, and needs its own gate exemption, for an ornament the printed page never has.

## What happens next (for the record)

- The fix draws the paper on screen only (a white background under real print media re-rasterised text by 1/255 in 91 files, so it is kept off paper) and points the Obsidian tokens the plugin reads at the light palette inside the preview, in a dark vault only. Text colour applies on both surfaces.
- The harness's dark-theme preview shot stays as it is and becomes the regression gate for this exact bug. The gate that compares preview to real print can now tighten: inside an element, text colour no longer differs between the two.
- Every one of the 130 `*--steel-print.png` freeze lines moves once; no `*--steel-realprint.png` line moves. A separate sanction ask with before/after pairs comes when the branch is reviewed and green.
