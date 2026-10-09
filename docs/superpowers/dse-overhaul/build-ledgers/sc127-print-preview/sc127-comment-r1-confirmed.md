Confirmed in real Obsidian: with the dark theme and Print preview ON, a statblock's title and its labels are black on a charcoal card and cannot be read. The light theme with Print preview ON is fine. So this is a plugin bug, and the fix goes ahead as rescoped.

**Measured, not eyeballed** (real spawned Obsidian on a private display, computed styles sampled live; 4.5:1 is the minimum readable contrast):

- Dark theme, preview ON — card title: black `rgb(0,0,0)` on charcoal `rgb(28,28,28)` = **1.23:1**. The "Might" label: dark grey `rgb(51,51,51)` on the same charcoal = **1.35:1**. The signature-ability box is painted white, but its keywords and body text stay the theme's pale grey `rgb(218,218,218)` = **1.40:1**.
- Light theme, preview ON (the control) — title 21:1, labels 12.6:1, body 15.9:1. All readable.

Dark theme, Print preview ON (the bug — black title and labels on the charcoal card; the white signature-ability box with pale grey text):

{{IMG:sc127-r1-statblock-dark-preview-on.png}}

Light theme, Print preview ON (the control — what the preview is supposed to look like everywhere):

{{IMG:sc127-r1-statblock-light-preview-on.png}}

One detail from the harness turned out to be harness-only: the browser twin's page going white below the first screen does not happen in real Obsidian (the reading pane stays dark all the way down). The white signature-ability box is real.

Next: a design round works out how the preview draws its own light paper regardless of theme (and what happens to the plugin's native controls on it), rendered in both a dark and a light vault so you can pick from pictures. Status stays Awaiting until those renders are ready.
