**Ask: two small visual choices for DSE blocks at the top of a callout. Reply "defaults OK", or pick differently on either one.**

The bug is fixed. When a DSE block is the first thing in a callout, its menu buttons (Edit, Pin, Collapse) now work with the mouse in Live Preview and in Reading view. Before the fix, the callout clipped the menu, so it never showed, and a click opened the callout's source instead. Reading view was broken the same way, so the fix covers both.

The fix needs two visible changes. I've built my pick for each.

**1. Menu position in Live Preview callouts (default: B).**

Obsidian draws its own `</>` "edit source" button at the callout's top-right corner, on top of our menu. Left as is (A), the right edge of Collapse sits under `</>`, and a click there opens the callout's source.

A — unchanged. The menu's right end runs into `</>`:
{{IMG:crop-low1-a-unchanged.png}}

B — the menu moves about 14px left, only in Live Preview and only when the block is first in a callout. A clear gap is left before `</>`:
{{IMG:crop-low1-b-moved.png}}

A third option, drawing our menu over `</>`, isn't possible without changing how Obsidian layers the whole callout, so I dropped it.

**2. Wide content in the same callout (default: the title scrolls with it).**

To let the menu show above the block, the callout itself has to become the sideways scroller. Normally only the callout's body scrolls. This only matters when such a callout also holds something wider than the page, like a wide table. It still scrolls sideways, but the callout title "Wide callout" and the stamina bar scroll off to the left with it. Obsidian's `</>` stays in place.

At rest (nothing changes):
{{IMG:crop-med1-rest.png}}

Scrolled fully right (the title is off-screen to the left):
{{IMG:crop-med1-scrolled.png}}

The alternative that keeps the title still worked in Live Preview but not in Reading view, so I don't recommend it. Callouts with the DSE block second, or with no DSE block, behave exactly as before.

---

Mechanics:
- dse `32fcace` on develop `9be397e`, workspace `49367042`. One shared rule set in `styles-source.css` (Element chrome section), so all 20 menu-bearing element types are covered. Survey: 66 of 66 buttons clickable across their whole face, and `</>` fully clickable.
- Full battery green:

| Gate | Result |
|---|---|
| jest | 6155 passed / 1 skipped |
| lifecycle | 42/42, new G-S49: real mouse on the menu, on `</>`, and a sideways wheel on a wide table |
| e2e | 124/124, 87/87 pairs |
| shots | 592, 0 FAIL |
| freeze | 280/280, no rebaseline |
| parity | 0 / 0 / 24 |

- The independent re-review of this round is running now. Filed while reviewing: SC-534 (a pre-existing e2e flake under load).
