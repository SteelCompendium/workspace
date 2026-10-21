**Ask: can SC-366 close now that the left stripe is gone from both compendium-reference cards?**

As you asked, the 3px blue stripe on the left edge has been removed. It was on two cards, which share the same CSS:
- the not-installed card ("Not installed locally. View on steelcompendium.io")
- the notice card that `ds-scc` shows for a code that isn't synced yet

Both cards now have a plain 1px border on all four sides, the same as their top, right and bottom edges had before. The teal-cyan link you approved is unchanged. Each crop below has a text label saying BEFORE or AFTER and what changed.

Not-installed card, light scheme:

{{IMG:sc366-stripe-before-notinstalled-light.png}}

{{IMG:sc366-stripe-after-notinstalled-light.png}}

Notice card, dark scheme:

{{IMG:sc366-stripe-before-notice-dark.png}}

{{IMG:sc366-stripe-after-notice-dark.png}}

**Still on develop: other left stripes.** DESIGN.md rule 7 says the ones already shipped "will be replaced", and I left them alone here:
- the red stripe on the error card shown when a block fails
- the role, tier and action stripes on statblock and ability elements

Say if you want a ticket to clear them.

**Mechanics**
- dse branch `sc366-stripe-remove` @ `8d890f9`, on develop `95981f1`. Workspace commits `284e5e4` and `76c24a2`, on origin/main `383ec3f`, extend the existing SC-366 CHANGELOG bullet. It now says print keeps its link colour and both cards lose the stripe.
- `styles-source.css`: `.dse-ref-notice` loses `border-left: 3px solid var(--color-blue)`. Its comment now cites DESIGN rule 7.
- New jest tests fail if a stripe comes back on these cards, whether as a left border, an inset shadow or a pseudo-element bar.
- Battery: tsc and lint clean. jest 5585 passed / 1 skipped. lifecycle 31/31. e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 pairs. shots 580, 0 FAIL. freeze 280/280, no frozen shot moved. parity 0 GAPs / 0 undeclared / 24 DECLARED.
- An independent review approved it. It checked computed borders on both cards across 96 combinations: both real Obsidian stylesheets (1.13.7 and 1.14.4), light and dark, screen and print, and three page layouts. All four sides are now a 1px border in every case, with no host rule adding a stripe back. A follow-up confirmation checked the change after the rebase.
