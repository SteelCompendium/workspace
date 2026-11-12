The colour swatches in the Conditions window now announce their colour name. A screen reader says "Green" for the green swatch instead of "Color #1e8449". Red, Amber, Blue and Purple work the same way. Nothing is needed from you; this is ready to land.

What changed:

- Each preset swatch's accessible name is now just its colour name. The group around the swatches is already labelled "Color", so a screen reader announces it as "Color, Green".
- The hover tooltip is unchanged and still shows the name and the hex code, for example "Green (#1e8449)".
- After you pick a swatch, keyboard focus stays on that swatch, as before.
- The custom colour picker keeps its labels ("Custom color" and "Custom condition color #…, selected"). A custom colour has no name to announce.

Out of scope, already tracked: SC-581 (there is no way to clear a colour) and SC-586 (a named colour opens the colour chooser at white).

Checks (dse `develop` @ 711844f3, branch head dcc53f0f):

- jest 10788 passed / 1 skipped, 0 failed. With the fix reverted, 8 tests fail.
- lifecycle 60/60.
- e2e 304/307 ok, 0 failed, 3 known bugs already filed (SC-257, SC-355, SC-384), coverage 174/174 pairs. COND-E02 and COND-E03 now expect the name "Green".
- shots 592, freeze 280/280 (nothing visible changed), parity 0 gaps.

Independent review: LAND. It found one LOW, fixed: the mixed-case test did not exercise the case-insensitive lookup, because jsdom lower-cases a colour input's value. The test now forces an upper-case value, and it fails if the lookup compares case. It also found one INFO, fixed: a test comment overstated what a screen reader hears. A scoped re-review of the fixes and the rebase onto the latest plugin code found nothing new: LAND.
