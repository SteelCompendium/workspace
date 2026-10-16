**Please look at the six Initiative changes below and reply with two things: (1) whether the look is right, and (2) "sanctioned" for the 38 print captures that move.**

## What you're approving

1. **The look of all six changes** — the before and after images are right below.
2. **My reading of "top-left menu items".** The plugin has no top-left menu. I put both resets in the existing icon panel that appears at the element's top-**right** on hover. If you wanted a new menu at the top-left instead, say so.
3. **Sanction: 38 frozen print captures move** (the 19 `initiative*` captures, two files each). In print, "Round 3" now sits beside "Heroes", and "Malice: 7" moves to the left of its bar. Two of the 19 also print the example's new title. Print crops are at the bottom.

Approve both = I mark it ready to land. Anything else = another round.

## Before and after (real Obsidian, dark theme)

Before:

{{IMG:sc377-r0-whole-obsidian-steel-dark.png}}

After:

{{IMG:sc377-r1f2-obsidian-chrome-panel-open-named-mid-fight-steel-dark.png}}

## The six changes

**1. Resets moved into the icon panel.** "Reset turns" and "Reset encounter state" are the first two icons in the panel above the top-right corner (image above). Reset encounter still asks for confirmation. Reset turns does not; it shows a notice. The button row that used to sit above "Heroes" is gone.

**2. "Advance round" is on the Heroes line**, with the "Round 3" label next to it. I moved the label along with the button so the round number stays beside the control that changes it. The bar between heroes and enemies now holds only Malice.

**3. The "Amount" row was broken because you could not click into it.** Clicking any text box inside any element did nothing — the plugin cancelled the click before the box could take focus, so typing went nowhere. This also affected the counter's number box and the party award box. It is fixed for every element, in Reading view and Live Preview.

Also on that row: Enter now submits. An empty label, an empty amount, or a fraction like 1.5 is refused with a message under the row ("Label required", "Amount required", "Whole numbers only"). The three controls are now the same height.

**4. Malice is a normal stepper.** The minus and plus buttons are always visible, in the same style as surges and counters. The number is red and sits under a "Malice" caption.

**5. Turn markers are the same on both sides.** Heroes and enemy groups both use the seal you picked in SC-183. Not acted is an empty ring. Acted is the silver disc with the dark diamond. Hovering shows a faint version of the disc. The green filled check box is gone from the screen. The states differ by shape, not by colour.

Dark theme. Columns: hero portrait, enemy group, and the fallback used when portraits are turned off. Rows: not acted, hover, acted.

{{IMG:sc377-r1f2-turn-marks-hero-group-portraits-off-three-states-steel-dark.png}}

Light theme:

{{IMG:sc377-r1f2-turn-marks-hero-group-portraits-off-three-states-steel-light.png}}

**6. The encounter has a title.** Add `name: Ambush at the Ford` to the block, or click the title to type one. Enter or clicking away saves; Escape cancels. A tracker with no name shows a small grey "Untitled encounter" prompt on screen only — it does not print.

{{IMG:sc377-r1f-title-placeholder-untitled-steel-dark.png}}

## Print: what moves

Before first, then after. The only differences are the "Round 3" label and the "Malice: 7" position.

{{IMG:sc377-r1-print-before-initiative-fight.png}}

{{IMG:sc377-r1-print-after-initiative-fight.png}}

## Known small thing

When you save a title, the card moves up about 7px because the text box is taller than the saved heading. Clicks still land. Say so if you want it evened out.

## One thing for you to do by hand

The animated `initiative-tracker.gif` in the plugin docs still shows the old layout. It can only be re-recorded manually. The still screenshots are regenerated.

## Filed separately (not part of this ticket)

- SC-383 — a sidebar tracker can lose its block when its random anchor id looks like a number (about 3% of ids). Pre-existing bug, found here. It also causes one flaky test.
- SC-384 — in Live Preview, a modal opened from an element closes when a pending save lands. Pre-existing.
- SC-382 — `ds-encounter` does not pass the new name to the tracker.
- SC-381 — four print captures were left out of the freeze baseline when SC-232 landed.

## For the record

- Branch `sc377-initiative-tweaks`, plugin `e9174e1`, based on `develop` `9ded832`. Independent review, two fix rounds and two re-reviews; the reviewer's final verdict is pass with nothing open.
- Gates at the tip: tsc and lint clean · jest 4273 passed / 1 skipped · real-Obsidian lifecycle 25/25 · shots 556, 0 failures · parity 0 gaps / 0 undeclared / 24 declared.
- Freeze: exactly 38 mismatches, all `initiative*`. Hashes reproduced by the reviewer and stable across the fix rounds. Six new lines (three new captures) are added at landing; those need no sanction.
