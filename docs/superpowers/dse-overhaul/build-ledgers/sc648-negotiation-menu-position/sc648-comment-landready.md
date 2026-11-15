The negotiation's ⋮ options menu now opens right under its button when you open it with Enter or Space, instead of in the top-left corner of the Obsidian window. Nothing to decide here; the fix is ready to land.

**What changed for you**

- Reading view, Live Preview, the pinned sidebar and a popout window: Tab to the ⋮ button, press Enter or Space, and the menu with "Reset negotiation" appears directly below the button, left edges lined up.
- Near the right edge or the bottom of a small window, Obsidian slides the menu so it stays on screen, the same way its own ⋮ menus do.
- A mouse click works exactly as before: the menu opens where you clicked.
- The menu's contents are unchanged. Reset still does what it did. SC-641 may still change that item.

**Found along the way: SC-659**

If you open the menu with Space, the first Escape is sometimes ignored (about 4 times in 10). A second Escape closes it. This also happens without this fix, so it is filed separately as SC-659 (Backlog, Low).

**Other elements**

No other element has this bug. The negotiation card is the only place the plugin opens an Obsidian menu, and nothing else positions a popup from where a click happened.

+++ Agent notes

- Fix: `src/elements/negotiation/view.ts`. On a keyboard click (`event.detail === 0`, the existing `isKeyboardClick` helper) it calls `showAtPosition({ x: rect.left, y: rect.bottom }, button.ownerDocument)`. The mouse path is still `showAtMouseEvent`. `width` is left out on purpose: without `overlap: true`, Obsidian moves the menu right by that width, off the button.
- Tests: the e2e `NEGO-R06` known-bug marker is now a plain test. New e2e: `NEGO-R07` (Space), `NEGO-R08` (mouse regression), `NEGO-L06` (Live Preview Enter). New coverage pair: `negotiation.menu` x `press:Space`. Two jest tests in `negotiation.test.ts`.
- Review: an independent reviewer re-ran the battery and reverted the fix to check the tests fail without it: NEGO-R06, R07 and L06 failed with the menu at x 2, y 2. It also probed placement in the sidebar, in a popout window, in a 720x640 window and on a scrolled page. One low finding (an e2e helper's check near the window bottom) and a comment fix were folded in. A scoped re-review covered the delta.
- Gates on dse `e1be1775` (on develop 3e88b3f5):
  - tsc and lint: clean.
  - jest: 13327 passed / 2 skipped.
  - lifecycle: 64/64.
  - e2e: `OBSIDIAN-E2E done: 596/611 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`.
  - styles.css: byte-identical to a clean 3e88b3f5 build, so shots 592, freeze 280/280 and parity 0/0/24 carry.
- Superproject branch `sc648-negotiation-menu-position` @ `116ee03b` on workspace main `7cea83eb`. It carries the CHANGELOG bullet under Unreleased and one pointer bump.

+++
