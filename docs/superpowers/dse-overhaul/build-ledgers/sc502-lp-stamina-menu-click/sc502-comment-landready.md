In Live Preview, the menu buttons above a DSE block (Edit pencil, Pin, Collapse) now work with a real mouse click, on all 20 block types that have the menu. Ready to land; nothing needs your answer.

**What was wrong.** Obsidian 1.15.0 clips the box that holds a code block in Live Preview. Our menu sits just above the block's top edge, so it was cut off: never drawn, and clicks fell through to the line above (the cursor jumped there). Of 171 menu buttons measured across 20 block types and 4 layouts, only 6 worked before (all on `ds-feature`). After the fix, all 171 work.

**FYI — two things you will now see in Live Preview** (no answer needed; say so if either is wrong):

1. The menu appears above the block on hover, in the same spot as in Reading view. Before, it was invisible in Live Preview. Left: before (only Obsidian's `</>` button). Right: after (pencil, pin and collapse tab above the top-right corner).

{{IMG:sc502-panel-before-after.png}}

2. On a collapsed block, the Expand arrow sits about 30px further left in Live Preview, so Obsidian's `</>` button no longer covers it. Without this, you could collapse a block with the mouse but not expand it again. Left: before (the `</>` button sits where the arrow should be). Right: after (the down arrow, then `</>` to its right). Reading view is unchanged.

{{IMG:sc502-collapsed-before-after.png}}

Also: in Live Preview the menu now stays up while the pointer is over Obsidian's `</>` button, so moving up to Collapse no longer hides it.

**Not in this ticket:** a block that is the first thing inside a callout still has menu buttons the mouse cannot reach — filed as SC-520.

---

Mechanics: one shared CSS rule in `styles-source.css` ("Element chrome") lifts Obsidian's clip on Live Preview code-block widgets that hold a DSE menu and re-clips with `clip-path`, with `display: flow-root` so the block keeps its height in the editor, and leaves a 96px strip open above the block (room for the tallest menu at large Obsidian font sizes with touch-size buttons; derivation commented). Expand gets 36px clear on the right in Live Preview only (screen only, not print).

Tests: new lifecycle G-S44 (real mouse clicks in real Obsidian Live Preview: pencil opens only the edit form, Collapse, Expand, Obsidian's `</>` still opens the source, approach to Collapse across `</>`); e2e CHR-L01; jest `chromeLivePreviewClip.test.ts`. Each fails on the old code.

Branch `sc502-lp-stamina-menu-click`: dse `c558759` on develop `08c086c`, superproject `abe934f`. Gates on `c558759`: tsc + lint clean · jest 6105 passed / 1 skipped · lifecycle 39/39 (new G-S44) · e2e 124/124, 0 failed, coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0 / 0 / 24 declared.

Review: independent reviewer, two rounds. Round 1 found the block-height bug (feature blocks measured 48px short in the editor, causing scroll jumps), a flaky e2e test and a too-small strip; all fixed. Round 2: LAND, 70/70 size checks match the old code, Reading view byte-identical, SC-523 part 1 (counter pencil) confirmed fixed.

SC-523 part 1 (pencil can't be clicked in Live Preview) is fixed by this change; its part 2 (form closing during a pending write) is not.
