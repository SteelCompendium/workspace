**Ask: does the teal-cyan link look right in the not-installed card? And should the card's blue left stripe stay blue?**

The "View on steelcompendium.io" link in the not-installed card now uses the plugin's teal-cyan link colour instead of Obsidian's purple-blue. Its external-link arrow changes with it. Each crop below is labelled BEFORE / AFTER, so you don't have to tell the colours apart.

Light scheme:

{{IMG:sc366-review-r1-compare-light.png}}

Dark scheme:

{{IMG:sc366-review-r1-compare-dark.png}}

**Second question, the left stripe.** The card's 3px left stripe is Obsidian's blue (`--color-blue`). SC-149 chose that on purpose as an "informational" accent. After this change the card pairs a blue stripe with a teal-cyan link. I left the stripe alone because it's outside this ticket. Say "stripe teal" if you want it to match, and I'll add it here.

**What changed and what didn't**
- Only the link changed. The message, the hint line, the stripe and the background are the same as before.
- Print is unchanged. The new rule uses the same gating as the plugin's other links: steel theme only, never in print.
- Light-scheme contrast goes up from 3.94 to 4.53, so the link now passes WCAG AA.
- Hovering doesn't change the colour. That matches every other plugin link.

**Mechanics**
- `styles-source.css`: `a.dse-ref-web-card__link` is added to the `.dse-card a` link-colour family, in both the normal rule and the `:hover` rule.
- A new jest test fails if the selector is removed. Without it nothing would catch a regression, because no harness shot shows this card. Adding a shot for it is filed as SC-469 (Backlog).
- Battery: dse branch `sc366-notinstalled-link` @ `ba20072` (base develop `188755b`). tsc and lint clean. jest 5260 passed / 1 skipped (+3 new tests). lifecycle 27/27. e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs. shots 572, 0 FAIL. freeze 276/276, no frozen shot moved. parity 0 GAPs / 0 undeclared / 24 DECLARED.
- The AFTER crops were taken at `365b08b`. The final commit `ba20072` only raises the selector's specificity, and its crops are byte-identical.
- An independent review approved it after checking the computed colours against the real Obsidian 1.13.7 and 1.14.4 stylesheets: 48 combinations covering both schemes, normal and hover, and the reading-view and live-preview wrappers.
